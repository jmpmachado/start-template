#!/usr/bin/env python3
"""
init-agile.py — Python fallback wizard for AGILE_CONFIG.md (Phase 0–2).
Feature parity with scripts/init-agile.js Phase 0–2 (interview + slim profile).
Requires Python 3.10+. No external dependencies (stdlib only).

Usage:
    python3 infra/scripts/init-agile.py
    py infra/scripts/init-agile.py        # Windows without WSL
"""

from __future__ import annotations

import sys
import os
import datetime
import platform
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parents[2]
AGILE_CONFIG = ROOT / ".agent" / "context" / "AGILE_CONFIG.md"
DECISION_LOG = ROOT / ".agent" / "context" / "DECISION_LOG.md"

# ── ui primitives ──────────────────────────────────────────────────────────────

def hr() -> None:
    print("\n" + "─" * 72)

def section(title: str) -> None:
    hr(); print(f"  {title}"); hr()

def note(msg: str) -> None:
    print(f"  ℹ  {msg}")

def warn(msg: str) -> None:
    print(f"  ⚠  {msg}")

def stop(msg: str) -> None:
    print(f"\n  🔴 STOP: {msg}\n")
    sys.exit(1)

def ask(prompt: str, default: str = "") -> str:
    hint = f" [{default}]" if default else ""
    try:
        raw = input(f"  → {prompt}{hint}: ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        sys.exit(0)
    return raw or default

def choose(prompt: str, options: list[str], default_idx: int = 0) -> int:
    print(f"\n  {prompt}")
    for i, o in enumerate(options):
        print(f"    {i + 1}) {o}")
    raw = ask(f"Choice", str(default_idx + 1))
    try:
        idx = int(raw) - 1
        return idx if 0 <= idx < len(options) else default_idx
    except ValueError:
        return default_idx

def confirm(prompt: str, default_yes: bool = True) -> bool:
    hint = "Y/n" if default_yes else "y/N"
    raw = ask(f"{prompt} ({hint})").lower()
    if not raw:
        return default_yes
    return raw.startswith("y")

# ── slim profiles ──────────────────────────────────────────────────────────────

SLIM_PROFILES: dict[str, dict] = {
    "node-api": {
        "label": "Node/TS API or service",
        "optional": [],
        "note": "Full governance stack applies — all files required.",
    },
    "python-service": {
        "label": "Python service or script",
        "optional": ["NOTEBOOK_GUIDE.md"],
        "note": "Node.js tooling optional after wizard run. NOTEBOOK_GUIDE optional unless using Jupyter.",
    },
    "go-rust-binary": {
        "label": "Go or Rust binary",
        "optional": ["NOTEBOOK_GUIDE.md", "DATA_PRIVACY.md", "DATA_PRIVACY_LGPD.md"],
        "note": "Privacy layer optional unless binary handles user PII. Node.js tooling optional.",
    },
    "cli-library": {
        "label": "CLI tool or library",
        "optional": [
            "NOTEBOOK_GUIDE.md",
            "DATA_PRIVACY.md", "DATA_PRIVACY_LGPD.md", "PRIVACY_CONTACTS.md", "PRIVACY_NOTICE_TEMPLATE.md",
            "LOAD_TESTING_FRAMEWORK.md", "CAPACITY_PLANNING.md", "EXPERIMENTATION.md",
            "FEATURE_FLAGS.md", "PRODUCTION_READINESS_REVIEW.md",
        ],
        "note": "Privacy and operational files optional — CLI/library rarely handles user data.",
    },
    "data-product": {
        "label": "Data product or notebook",
        "optional": ["FEATURE_FLAGS.md", "PRODUCTION_READINESS_REVIEW.md"],
        "note": "Privacy layer REQUIRED. Feature flags and PRR optional.",
    },
}

# ── phase 0 ────────────────────────────────────────────────────────────────────

def phase0() -> dict:
    section("PHASE 0 — Prerequisites")
    note("Verify environment and make four structural decisions.")

    # Python version check
    major, minor = sys.version_info[:2]
    if major < 3 or (major == 3 and minor < 10):
        stop(f"Python {sys.version} detected. Minimum is 3.10. Upgrade and rerun.")
    print(f"  ✅ Python {sys.version.split()[0]}")

    # Decision 1 — repo shape
    shape_idx = choose(
        "Decision 1 — Repository shape:",
        ["Standalone repo (single module, single deploy)", "Monorepo (multiple modules, shared CI)", "Subrepo inside existing monorepo"],
        0,
    )
    repo_shape = ["standalone", "monorepo", "subrepo"][shape_idx]

    # Decision 2 — agents
    print("\n  Decision 2 — Which AI agents will operate on this project?")
    agent_names = ["Claude Code", "Gemini CLI", "GitHub Copilot", "OpenAI Codex"]
    selected_agents: list[str] = []
    for agent in agent_names:
        if confirm(f"  Use {agent}?", agent == "Claude Code"):
            selected_agents.append(agent)
    other = ask("  Other agent (leave blank to skip)")
    if other:
        selected_agents.append(other)
    if not selected_agents:
        stop("At least one agent must be configured.")

    # Decision 3 — stack
    stack_options = [
        "Node.js / TypeScript", "Python", "Rust", "Go",
        "Java (Maven)", "Java (Gradle)", "Kotlin", ".NET / C#",
        ".NET Framework", "C / C++", "Rust + Python (maturin)",
        "R", "Julia", "Lua", "Zig", "Fortran", "Other / unlisted",
    ]
    stack_idx = choose("Decision 3 — Primary application stack:", stack_options, 0)
    primary_stack = stack_options[stack_idx]

    # Decision 4 — project type
    project_type_options = [
        "Node/TS API or service",
        "Python service or script",
        "Go or Rust binary",
        "CLI tool or library",
        "Data product or notebook",
    ]
    project_type_keys = ["node-api", "python-service", "go-rust-binary", "cli-library", "data-product"]
    project_type_idx = choose("Decision 4 — Project type (for slim profile selection):", project_type_options, 0)
    project_type = project_type_options[project_type_idx]
    project_type_key = project_type_keys[project_type_idx]

    print("\n  Phase 0 summary:")
    print(f"    Repo shape:    {repo_shape}")
    print(f"    Agents:        {', '.join(selected_agents)}")
    print(f"    Stack:         {primary_stack}")
    print(f"    Project type:  {project_type}")

    go_go = confirm("\n  All prerequisites verified — proceed to Phase 1?", True)
    return {
        "repo_shape": repo_shape,
        "selected_agents": selected_agents,
        "primary_stack": primary_stack,
        "project_type": project_type,
        "project_type_key": project_type_key,
        "go_go": go_go,
    }

# ── phase 2 interview (minimum viable — sections 1, 2, 5) ─────────────────────

def interview_section1(selected_agents: list[str]) -> dict:
    section("§1.1 — Agent Window")
    agent_rows = []
    for agent in selected_agents:
        hours = int(ask(f"{agent} hours/week", "40") or "40")
        agent_rows.append({"agent": agent, "hours": hours})
    session_len = ask("Default session length (hours)", "5")

    section("§1.2 — Review Cadence")
    cadence_options = [
        "End of every agent session (same day)",
        "Next available window (next day or 5h block)",
        "Weekly reset window",
        "Other",
    ]
    cadence_idx = choose("When does the human do batch review?", cadence_options, 1)
    max_unreviewed = ask("Max unreviewed sessions before mandatory stop", "2")

    section("§1.3 — Module Count")
    module_count = int(ask("Number of active modules", "1") or "1")
    modules_in_sprint = ask("Modules under active development this sprint", "1")
    max_modules = ask("Max modules touched per sprint", "1")

    return {
        "agent_rows": agent_rows,
        "session_len": session_len,
        "cadence_idx": cadence_idx,
        "max_unreviewed": max_unreviewed,
        "module_count": module_count,
        "modules_in_sprint": modules_in_sprint,
        "max_modules": max_modules,
    }

def interview_section2(agent_rows: list[dict]) -> dict:
    section("§2 — Sprint Capacity Calculation")
    total_hours = sum(r["hours"] for r in agent_rows)
    note(f"Total agent hours/week: {total_hours}h")

    avg_hours = float(ask("Average hours per US (start with 4h)", "4") or "4")
    raw_max = int(total_hours / avg_hours)
    buffered = int(raw_max * 0.8)
    max_points = buffered * 3

    print(f"\n  Calculated capacity:")
    print(f"    Raw max USs:     {raw_max}")
    print(f"    Buffered (×0.8): {buffered}")
    print(f"    Max points:      {max_points}")

    sprint_len   = ask("Sprint length", "1 week")
    max_uss      = ask("Max USs per sprint", str(min(buffered, 8)))
    max_pts      = ask("Max story points per sprint", str(max_points))
    max_lines    = ask("Max lines in BACKLOG.md", "150")
    max_kb       = ask("Max size of BACKLOG.md (KB)", "30")
    max_active_us = ask("Max USs in active backlog", "15")

    return {
        "total_hours": total_hours,
        "sprint_len": sprint_len,
        "max_uss": max_uss,
        "max_pts": max_pts,
        "max_lines": max_lines,
        "max_kb": max_kb,
        "max_active_us": max_active_us,
    }

def write_slim_profile(project_type: str, project_type_key: str) -> None:
    if not AGILE_CONFIG.exists():
        return
    profile = SLIM_PROFILES.get(project_type_key, SLIM_PROFILES["node-api"])
    if profile["optional"]:
        optional_list = "\n".join(
            f"  - `.agent/context/{f}` — [OPTIONAL — not required for this profile]"
            for f in profile["optional"]
        )
    else:
        optional_list = "  - (none — full governance stack applies)"

    section0 = (
        "\n---\n\n## §0 — Project Type & Slim Profile\n\n"
        f"**Project type:** `{project_type}`  \n"
        f"**Profile key:** `{project_type_key}`  \n"
        f"**Note:** {profile['note']}\n\n"
        f"**Optional files for this profile** (governance value preserved; skip if irrelevant):\n\n"
        f"{optional_list}\n"
    )

    content = AGILE_CONFIG.read_text(encoding="utf-8")
    first_newline = content.index("\n")
    updated = content[: first_newline + 1] + section0 + content[first_newline + 1 :]
    AGILE_CONFIG.write_text(updated, encoding="utf-8")

def write_agile_config_minimal(s1: dict, s2: dict, project_type: str, project_type_key: str) -> None:
    """Write §0 slim profile to AGILE_CONFIG.md. Full §1–§5 fill requires the Node wizard."""
    write_slim_profile(project_type, project_type_key)
    note("§0 (slim profile) written to AGILE_CONFIG.md.")
    note("For full §1–§5 fill, run: node scripts/init-agile.js")
    note(f"Agent rows collected: {', '.join(r['agent'] + ' ' + str(r['hours']) + 'h' for r in s1['agent_rows'])}")
    note(f"Sprint capacity: max {s2['max_uss']} USs / {s2['max_pts']} pts per sprint.")

def phase2(selected_agents: list[str], project_type: str, project_type_key: str) -> bool:
    section("PHASE 2 — Agile Configuration (minimum viable)")
    note("This Python wizard covers §0–§2. Full §3–§5 requires: node scripts/init-agile.js")

    if not AGILE_CONFIG.exists():
        warn(f"AGILE_CONFIG.md not found at {AGILE_CONFIG}")
        warn("Copy .agent/context/AGILE_CONFIG.md from the template before running.")
        return False

    s1 = interview_section1(selected_agents)
    s2 = interview_section2(s1["agent_rows"])
    write_agile_config_minimal(s1, s2, project_type, project_type_key)

    profile = SLIM_PROFILES.get(project_type_key, SLIM_PROFILES["node-api"])
    if profile["optional"]:
        note(f"Slim profile applied — {len(profile['optional'])} file(s) marked optional:")
        for f in profile["optional"]:
            print(f"    [OPTIONAL] .agent/context/{f}")
        print()

    go_go = confirm("Phase 2 complete — proceed?", True)
    return go_go

# ── decision log ───────────────────────────────────────────────────────────────

def append_decision_log(p0: dict) -> None:
    if not DECISION_LOG.exists():
        return
    date = datetime.date.today().isoformat()
    entry = (
        f"\n---\n\n### ADR — Template Adoption (Python wizard)\n"
        f"**Date:** {date}  \n"
        f"**Status:** Accepted  \n"
        f"**Repo shape:** {p0['repo_shape']}  \n"
        f"**Agents:** {', '.join(p0['selected_agents'])}  \n"
        f"**Stack:** {p0['primary_stack']}  \n"
        f"**Project type:** {p0['project_type']} (`{p0['project_type_key']}`)  \n"
        f"**Next action:** Run `node scripts/init-agile.js` to complete §3–§5.\n"
    )
    content = DECISION_LOG.read_text(encoding="utf-8")
    idx = content.find("\n", content.find("# Decision Log"))
    if idx == -1:
        DECISION_LOG.write_text(content + entry, encoding="utf-8")
    else:
        DECISION_LOG.write_text(content[: idx + 1] + entry + content[idx + 1 :], encoding="utf-8")

# ── main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    print("\n  ╔══════════════════════════════════════════════════════════════════╗")
    print("  ║   Engineering Template — Project Adoption Wizard (Python)       ║")
    print("  ║   init-agile.py v1.0  |  Phase 0–2 only                        ║")
    print("  ╚══════════════════════════════════════════════════════════════════╝\n")
    note("This wizard covers Phase 0 (prerequisites) and Phase 2 (Agile Config §0–§2).")
    note("For the full wizard (§3–§5, architecture, agent contracts), run:")
    note("  node scripts/init-agile.js  OR  npm run init-agile\n")

    p0 = phase0()
    if not p0["go_go"]:
        warn("Phase 0 did not pass. Resolve prerequisites and rerun.")
        sys.exit(0)

    run_phase2 = confirm("\n  Run Phase 2 (Agile Config interview) now?", True)
    if run_phase2:
        ok = phase2(p0["selected_agents"], p0["project_type"], p0["project_type_key"])
        if not ok:
            warn("Phase 2 incomplete. Rerun or continue with node scripts/init-agile.js.")

    try:
        append_decision_log(p0)
        note("Adoption summary appended to DECISION_LOG.md.")
    except Exception:
        note("Could not write to DECISION_LOG.md — add the summary manually.")

    print("\n  ✅ Python wizard complete.")
    print("  Next: node scripts/init-agile.js — complete Phase 1, 3, 4, 5.\n")

if __name__ == "__main__":
    main()
