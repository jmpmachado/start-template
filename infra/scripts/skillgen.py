#!/usr/bin/env python3
"""skillgen.py — cross-harness skill/instruction generator.

Problem it solves: the template maintains the SAME agent guidance in several
harness files in parallel (CLAUDE.md, GEMINI.md, AGENTS.md, .codex/instructions.md,
.github/copilot-instructions.md). Editing one and forgetting the others is a real,
recurring drift class (a find-replace once propagated a product name across six of
these files). skillgen keeps one source fragment and renders it into a marked,
idempotent block in each target — re-running replaces the block in place, never
duplicating.

Concept (cross-harness fan-out: one source -> N harness targets) is a generic
template-engine idea, implemented here from that one-line spec — no third-party
generator code was consulted. Inspired by the graphify/ECC skillgen concept (MIT),
but this is original code.

Usage:
    python infra/scripts/skillgen.py --list
    python infra/scripts/skillgen.py --check         # CI: fail if any target is stale
    python infra/scripts/skillgen.py --write         # apply: write blocks into targets

Source fragments live in .agent/skill-src/<name>.md. Each target file gets a block:
    <!-- SKILLGEN:START <name> -->
    ...rendered content...
    <!-- SKILLGEN:END <name> -->
A target opts in by containing the START/END marker pair for that <name>.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / ".agent" / "skill-src"

# The five harness targets the template actually maintains. Adding a sixth means
# adding one line here — not a speculative adapter framework (Directive 2).
TARGETS: dict[str, Path] = {
    "claude": ROOT / "CLAUDE.md",
    "gemini": ROOT / "GEMINI.md",
    "agents": ROOT / "AGENTS.md",
    "codex": ROOT / ".codex" / "instructions.md",
    "copilot": ROOT / ".github" / "copilot-instructions.md",
}


def _markers(name: str) -> tuple[str, str]:
    return (f"<!-- SKILLGEN:START {name} -->", f"<!-- SKILLGEN:END {name} -->")


def list_sources() -> list[str]:
    """Return skill-source names (without .md) found in .agent/skill-src/."""
    if not SRC_DIR.is_dir():
        return []
    return sorted(p.stem for p in SRC_DIR.glob("*.md"))


def render_block(name: str, body: str) -> str:
    """Wrap a source body in idempotent START/END markers."""
    start, end = _markers(name)
    return f"{start}\n{body.strip()}\n{end}"


def apply_to_target(content: str, name: str, body: str) -> str | None:
    """Replace the marked block for `name` in `content`.

    Returns new content if the target opts in (has the marker pair) and the block
    changed; returns None if the target does not opt in (no markers present).
    """
    start, end = _markers(name)
    if start not in content or end not in content:
        return None  # target did not opt in to this skill
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    new_block = render_block(name, body)
    new_content = pattern.sub(lambda _: new_block, content, count=1)
    return new_content if new_content != content else content


def process(write: bool) -> tuple[list[str], list[str]]:
    """Render every source into every opted-in target.

    Returns (changed, stale): changed = targets written (write mode);
    stale = targets that differ from source (check mode).
    """
    changed: list[str] = []
    stale: list[str] = []
    for name in list_sources():
        body = (SRC_DIR / f"{name}.md").read_text(encoding="utf-8")
        for tkey, tpath in TARGETS.items():
            if not tpath.is_file():
                continue
            content = tpath.read_text(encoding="utf-8")
            updated = apply_to_target(content, name, body)
            if updated is None or updated == content:
                continue
            label = f"{tkey}:{name}"
            if write:
                tpath.write_text(updated, encoding="utf-8")
                changed.append(label)
            else:
                stale.append(label)
    return changed, stale


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Cross-harness skill generator.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--list", action="store_true", help="list source fragments")
    group.add_argument("--check", action="store_true", help="fail if any target is stale")
    group.add_argument("--write", action="store_true", help="write blocks into targets")
    args = parser.parse_args(argv)

    if args.list:
        names = list_sources()
        print("\n".join(names) if names else "(no skill sources in .agent/skill-src/)")
        return 0

    if args.check:
        _, stale = process(write=False)
        if stale:
            print("skillgen: STALE targets (run --write):\n  " + "\n  ".join(stale), file=sys.stderr)
            return 1
        print("skillgen: all harness targets up to date.")
        return 0

    # --write
    changed, _ = process(write=True)
    print("skillgen: wrote " + (", ".join(changed) if changed else "nothing (all up to date)"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
