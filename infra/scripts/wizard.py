#!/usr/bin/env python3
"""
wizard.py — Standalone adoption wizard for design-first-template (B2 pure).

Run inside the cloned template directory to fill all [PLACEHOLDER] values.
No cookiecutter dependency — reads cookiecutter.json as optional config seed,
then prompts for any missing values and applies substitutions project-wide.

Usage:
  python3 infra/scripts/wizard.py
"""

import io
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import NoReturn

import yaml

# Force UTF-8 stdout on Windows (cp1252 default breaks any non-ASCII output)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[2]
AGILE_CONFIG = ROOT / ".agent" / "context" / "AGILE_CONFIG.md"
DECISION_LOG = ROOT / ".agent" / "context" / "DECISION_LOG.md"

PLACEHOLDER_RE = re.compile(
    r'\[(?:PROJECT_NAME|STACK|LANGUAGE|ORG|REPO|repo|org'
    r'|SPRINT_LENGTH|CAPACITY_PTS|VELOCITY_PTS|DORA_TIER)\]'
)

_PROFILES_YAML = Path(__file__).with_name("profiles.yaml")
_WIZARD_INTERNAL_FILES: frozenset[Path] = frozenset({_PROFILES_YAML.resolve()})


_SLIM_PROFILES_CACHE: dict | None = None


def _load_profiles() -> dict:
    """Load profile definitions from profiles.yaml (lazy, cached). Exits with code 1 on error."""
    global _SLIM_PROFILES_CACHE
    if _SLIM_PROFILES_CACHE is not None:
        return _SLIM_PROFILES_CACHE
    try:
        with open(_PROFILES_YAML, encoding="utf-8") as f:
            _SLIM_PROFILES_CACHE = yaml.safe_load(f)
            return _SLIM_PROFILES_CACHE
    except FileNotFoundError:
        print(
            f"  x  profiles.yaml not found: {_PROFILES_YAML}\n"
            "     Re-clone the template or restore the file.",
            file=sys.stderr,
        )
        sys.exit(1)
    except yaml.YAMLError as e:
        print(
            f"  x  profiles.yaml is malformed: {e}\n"
            "     Fix the YAML syntax and re-run.",
            file=sys.stderr,
        )
        sys.exit(1)


def _slim_profiles() -> dict:
    """Return the full profiles dict (alias for _load_profiles; used by module-level lazy attribute)."""
    return _load_profiles()


def __getattr__(name: str):
    # Lazy module attribute: SLIM_PROFILES loads profiles.yaml on first access, not at import.
    if name == "SLIM_PROFILES":
        return _load_profiles()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


_SCAN_EXTENSIONS = {".md", ".yaml", ".yml", ".toml", ".json", ".ts", ".js", ".py"}
_SCAN_SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "dist", "build"}

# Files that document the template's own development history.
# A child project's AI agent has no use for these and will hallucinate cross-references
# to template-internal sprints, agents, and decisions if they remain in context.
TEMPLATE_ONLY_FILES: list[str] = [
    "BACKLOG_HISTORY.md",
    "HANDOFF_SPRINT18_AGENT_PORTABILITY.md",
    "HANDOFF_CODEX_MIN_01.md",
    "HANDOFF_GEMINI_MIN_02.md",
    "CODEX_MIN_01_SELF_CONTAINED.md",
    "IMPLEMENTATION_SUMMARY.md",
    "DOSSIER.md",
    "AI_AUGMENTED_AGILE_RESEARCH.md",
    "CLAUDE_TOKEN_OPTIMIZATION.md",
    "LLM_CODING_GUIDELINES.md",
    "TEMPLATE_UPGRADE_PROTOCOL.md",
    "AGENT_CONTRACT_GUIDE.md",
    "AGENT_CONTRACT_REVIEW.md",
    "AGENT_PROMPT_ADEQUACY.md",
]


def stop(msg: str) -> NoReturn:
    """Print error message and exit with code 1."""
    print(f"  x  {msg}")
    sys.exit(1)


def hr(title: str = "") -> None:
    """Print a horizontal rule with an optional section title."""
    print("\n" + "-" * 72)
    if title:
        print(f"  {title}")
        print("-" * 72)


def ask(prompt: str, default: str = "") -> str:
    hint = f" [{default}]" if default else ""
    try:
        raw = input(f"  -> {prompt}{hint}: ").strip()
    except (EOFError, KeyboardInterrupt):
        sys.exit(0)
    return raw or default


def choose(prompt: str, options: list, default_idx: int = 0) -> int:
    print(f"\n  {prompt}")
    for i, o in enumerate(options):
        marker = "*" if i == default_idx else " "
        print(f"    {marker} {i + 1}) {o}")
    try:
        raw = input(f"  -> Choice [{default_idx + 1}]: ").strip()
    except (EOFError, KeyboardInterrupt):
        sys.exit(0)
    try:
        idx = int(raw) - 1
        return idx if 0 <= idx < len(options) else default_idx
    except ValueError:
        return default_idx


def confirm(prompt: str, default_yes: bool = True) -> bool:
    hint = "[Y/n]" if default_yes else "[y/N]"
    try:
        raw = input(f"  -> {prompt} {hint}: ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        return default_yes
    if not raw:
        return default_yes
    return raw.startswith("y")


def scan_placeholders(root: Path = ROOT) -> list[str]:
    """Return list of 'relative/path:line: content' strings for lines matching PLACEHOLDER_RE."""
    hits: list[str] = []
    for path in root.rglob("*"):
        if any(skip in path.parts for skip in _SCAN_SKIP_DIRS):
            continue
        if path.suffix not in _SCAN_EXTENSIONS:
            continue
        if not path.is_file():
            continue
        if path.resolve() in _WIZARD_INTERNAL_FILES:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="strict")
        except (OSError, UnicodeDecodeError):
            continue
        for i, line in enumerate(text.splitlines(), 1):
            if PLACEHOLDER_RE.search(line):
                hits.append(f"{path.relative_to(root)}:{i}: {line.strip()}")
    return hits


def apply_substitutions(values: dict, root: Path = ROOT) -> int:
    """Replace [KEY] placeholders in all scanned files under root.

    Returns the number of files modified.
    """
    modified = 0
    for path in root.rglob("*"):
        if any(skip in path.parts for skip in _SCAN_SKIP_DIRS):
            continue
        if path.suffix not in _SCAN_EXTENSIONS:
            continue
        if not path.is_file():
            continue
        if path.resolve() in _WIZARD_INTERNAL_FILES:
            continue
        try:
            original = path.read_text(encoding="utf-8", errors="strict")
        except (OSError, UnicodeDecodeError):
            print(f"  !  Skipping {path.relative_to(root)} — not valid UTF-8 (no changes made).")
            continue
        text = original
        for key, val in values.items():
            text = text.replace(f"[{key}]", val)
        if text != original:
            path.write_text(text, encoding="utf-8")
            modified += 1
    return modified


def apply_profile(profile_key: str, root: Path = ROOT) -> list[str]:
    """Remove optional context files for the chosen profile.

    Returns list of files actually removed. Missing files are silently skipped.
    """
    profile = _slim_profiles().get(profile_key)
    if not profile:
        return []
    context_dir = root / ".agent" / "context"
    removed: list[str] = []
    for filename in (profile.get("optional") or []):
        target = context_dir / filename
        if target.exists():
            target.unlink()
            removed.append(filename)
    return removed


def apply_template_only(root: Path = ROOT) -> list[str]:
    """Remove template-process files that are never relevant to a child project.

    Returns list of files actually removed. Missing files are silently skipped.
    """
    context_dir = root / ".agent" / "context"
    removed: list[str] = []
    for filename in TEMPLATE_ONLY_FILES:
        target = context_dir / filename
        if target.exists():
            target.unlink()
            removed.append(filename)
    return removed


def read_cookiecutter_context() -> dict:
    """Read cookiecutter.json as optional config seed. Returns defaults if absent."""
    cc = ROOT / "cookiecutter.json"
    if not cc.exists():
        return {}
    try:
        with open(cc, encoding="utf-8") as f:
            raw = json.load(f)
    except json.JSONDecodeError:
        print("  !  cookiecutter.json is malformed — ignoring seed (will prompt for all values).")
        return {}
    stack = raw.get("stack", "")
    return {
        "PROJECT_NAME": raw.get("project_name", ""),
        "STACK": stack if isinstance(stack, str) else "",
        "PROFILE": raw.get("profile", "") if isinstance(raw.get("profile"), str) else "",
    }


_PYTHON_STACKS = {"python"}
_MULTI_STACK = "multi"


def run_ci_gate(stack: str = "python") -> bool:
    """Run the CI gate appropriate for the project stack.

    Python projects run pytest. Non-Python stacks skip pytest (their native
    toolchain is the gate). Multi-stack runs pytest only when Python test files
    are present in tests/unit/.
    """
    hr("Phase 4 -- CI gate")
    tests_dir = ROOT / "tests" / "unit"

    if stack in _PYTHON_STACKS:
        run_pytest = True
    elif stack == _MULTI_STACK:
        run_pytest = any(tests_dir.glob("*.py"))
    else:
        print(f"  ok  CI gate skipped for '{stack}' stack — use the native toolchain to run tests.")
        return True

    if not run_pytest:
        print(f"  ok  CI gate skipped for '{stack}' stack (no Python test files found).")
        return True

    cmd = [sys.executable, "-m", "pytest", str(tests_dir), "-q"]
    print(f"\n  -> Running tests ({tests_dir.relative_to(ROOT)})...")
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  x  pytest failed (exit {result.returncode})")
        for line in (result.stdout + result.stderr).splitlines()[-15:]:
            print(f"     {line}")
        print("\n  !  CI gate incomplete. Fix the errors above and re-run: python3 -m pytest tests/unit/")
        return False
    last = [ln for ln in result.stdout.splitlines() if ln.strip()]
    print(f"  ok  {last[-1] if last else 'tests passed'}")
    return True


def append_decision_log(entry: str) -> None:
    """Insert entry immediately after the '# Decision Log' marker. No-op if file absent or marker missing."""
    if not DECISION_LOG.exists():
        return
    text = DECISION_LOG.read_text(encoding="utf-8")
    marker = "# Decision Log"
    idx = text.find(marker)
    if idx == -1:
        return
    insert_at = text.find("\n", idx) + 1
    if insert_at == 0:
        return
    rest = text[insert_at:].lstrip("\n")
    DECISION_LOG.write_text(
        text[:insert_at] + "\n" + entry.rstrip("\n") + "\n\n" + rest,
        encoding="utf-8",
    )
    print("  ok  DECISION_LOG.md updated.")


def _ask_required(prompt: str, default: str) -> str:
    """Prompt up to 2 times; abort with stop() if the user provides an empty value both times."""
    for _ in range(2):
        val = ask(prompt, default)
        if val:
            return val
        print("  x  Field cannot be empty. Try again.")
    stop(f"{prompt} is required — wizard aborted.")


def main() -> None:
    print("\n  design-first-template -- Adoption Wizard (B2 pure / standalone)")
    print("  " + "-" * 60)
    print("  Fills all [PLACEHOLDER] values across the project.\n")

    seed = read_cookiecutter_context()

    hr("Phase 1 -- Project Identity")

    project_name = _ask_required("Project name", seed.get("PROJECT_NAME") or "my-project")
    stack_options = ["node-ts", "python", "go", "rust", "java", "multi"]
    seed_stack = seed.get("STACK", "")
    stack_default = stack_options.index(seed_stack) if seed_stack in stack_options else 0
    stack_idx = choose("Primary stack", stack_options, stack_default)
    stack = stack_options[stack_idx]
    org = _ask_required("Organisation / GitHub org", "my-org")

    profile_keys = list(_slim_profiles().keys())
    _sp = _slim_profiles()
    profile_labels = [_sp[k]["label"] for k in profile_keys]
    seed_profile = seed.get("PROFILE", "")
    profile_default = profile_keys.index(seed_profile) if seed_profile in profile_keys else 0
    profile_idx = choose("Project profile", profile_labels, default_idx=profile_default)
    profile_key = profile_keys[profile_idx]
    profile = _sp[profile_key]
    print(f"\n  note: {profile['note']}")

    hr("Phase 2 -- Agile Calibration")
    sprint_length = ask("Sprint length in days", "14")
    capacity_pts = ask("Team capacity per sprint (story points)", "20")
    velocity_pts = ask("Initial velocity estimate (story points)", "15")
    dora_options = ["Tier 1 (Elite)", "Tier 2 (High)", "Tier 3 (Medium)", "Tier 4 (Low)"]
    dora_idx = choose("DORA target tier", dora_options, 1)
    dora_tier = dora_options[dora_idx]

    values = {
        "PROJECT_NAME": project_name,
        "STACK": stack,
        "LANGUAGE": stack,
        "ORG": org,
        "org": org.lower(),
        "repo": project_name.lower().replace(" ", "-"),
        "SPRINT_LENGTH": sprint_length,
        "CAPACITY_PTS": capacity_pts,
        "VELOCITY_PTS": velocity_pts,
        "DORA_TIER": dora_tier,
    }

    hr("Phase 3 -- Applying profile + substitutions")

    template_removed = apply_template_only()
    if template_removed:
        print(f"  ok  {len(template_removed)} template-process file(s) removed (never needed by child projects):")
        for f in template_removed:
            print(f"       - {f}")

    to_remove = [f for f in _slim_profiles()[profile_key]["optional"]
                 if (ROOT / ".agent" / "context" / f).exists()]
    if to_remove:
        print(f"\n  The following files will be removed for profile '{profile_key}':")
        for f in to_remove:
            print(f"       - {f}")
        if not confirm("Proceed with removal?", default_yes=False):
            print("  ok  Profile file removal skipped.")
            to_remove = []

    removed = apply_profile(profile_key) if to_remove else []
    if removed:
        print(f"  ok  {len(removed)} optional context file(s) removed for profile '{profile_key}'.")
    else:
        print(f"  ok  No optional files to remove for profile '{profile_key}'.")

    modified = apply_substitutions(values)
    print(f"  ok  {modified} file(s) updated with substitutions.")

    ts = datetime.now().strftime("%Y-%m-%d")
    entry = (
        f"## {ts} -- Template adoption\n\n"
        f"- **Project:** {project_name}\n"
        f"- **Stack:** {stack}\n"
        f"- **Org:** {org}\n"
        f"- **Profile:** {profile_key} ({len(removed)} optional files removed)\n"
        f"- **Wizard mode:** B2 pure (standalone)\n"
        f"- **Rationale:** Template adopted via design-first-template wizard.\n"
    )
    append_decision_log(entry)

    hits = scan_placeholders()
    if hits:
        hr()
        print(f"\n  ! {len(hits)} unfilled placeholder(s) remaining:")
        for h in hits[:10]:
            print(f"    {h}")
        if len(hits) > 10:
            print(f"    ... and {len(hits) - 10} more")
    else:
        print("\n  ok  No unfilled placeholders detected.")

    if not run_ci_gate(stack):
        sys.exit(1)

    hr()
    print("\n  done  Wizard complete.\n")


if __name__ == "__main__":
    main()
