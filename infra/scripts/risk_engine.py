#!/usr/bin/env python3
"""
risk_engine.py — Risk Score Calculator for Design Docs
Usage: python risk_engine.py [--alert-threshold 50] [--output report.md]

Reads all YAML files from rfcs/ and computes a risk score (0–100) for each RFC
using the formula: R = Impact×0.60 + Probability×0.40
"""

import yaml
import glob
import re
import argparse
import sys
from pathlib import Path
from datetime import datetime

# ─── Layer weights ────────────────────────────────────────────────────
W_GOV = {
    "completeness": 0.20,
    "security": 0.25,
    "testability": 0.15,
    "rollback": 0.20,
    "observability": 0.10,
    "ownership": 0.10,
}

W_COMP = {
    "technical": 0.35,
    "critical_deps": 0.30,
    "change_scope": 0.20,
    "tech_novelty": 0.15,
}

W_PROB = {
    "failure_history": 0.30,
    "team_maturity": 0.25,  # INVERTED: 10 = full junior, 0 = senior expert
    "requirement_ambiguity": 0.25,
    "deadline_pressure": 0.20,
}

CRIT_MULT = {
    "critical": 1.5,
    "high": 1.2,
    "medium": 1.0,
    "low": 0.7,
}

RISK_BANDS = [
    (0,  20,  "Healthy",   "Standard monitoring"),
    (20, 40,  "Attention", "Technical review before next sprint"),
    (40, 60,  "High",      "Block merge until reviewed"),
    (60, 80,  "Critical",  "RFC must be rewritten immediately"),
    (80, 101, "Emergency", "Full stop — do not enter code review"),
]


def classify(score: float) -> tuple[str, str]:
    """Return (label, recommended_action) for a risk score in [0, 100]."""
    for lo, hi, label, action in RISK_BANDS:
        if lo <= score < hi:
            return label, action
    return "Emergency", "Full stop"


def calc_governance(gov: dict) -> float:
    """G captures governance gaps; low G amplifies risk — score 0 means undocumented and is most dangerous."""
    return sum(gov.get(k, 0) * w for k, w in W_GOV.items())


def calc_complexity(comp: dict) -> float:
    """Return weighted complexity score [0–10] from technical, deps, scope, and novelty dimensions."""
    return sum(comp.get(k, 0) * w for k, w in W_COMP.items())


def calc_probability(prob: dict) -> float:
    """Return weighted failure-probability score [0–10]; team_maturity is inverted (0=expert, 10=junior)."""
    # team_maturity is INVERTED: 0 = senior expert (low risk), 10 = full junior (high risk).
    # Default 5 (mid-range) when absent — avoids silently penalising RFCs with missing fields.
    return (
        prob.get("failure_history", 0) * 0.30
        + (10 - prob.get("team_maturity", 5)) * 0.25
        + prob.get("requirement_ambiguity", 0) * 0.25
        + prob.get("deadline_pressure", 0) * 0.20
    )


def calc_risk(rfc: dict) -> dict:
    """Compute the composite risk record for one RFC; returns id, scores, level, and alert flag."""
    G = calc_governance(rfc.get("governance", {}))
    C = calc_complexity(rfc.get("complexity", {}))
    P = calc_probability(rfc.get("probability", {}))
    crit = CRIT_MULT.get(rfc.get("criticality", "medium"), 1.0)

    # Impact = (10-G)/10 * (C/10) * criticality_mult * 100
    impact = ((10 - G) / 10) * (C / 10) * crit * 100
    prob_norm = P / 10

    # Final Score = Impact * 60% + Probability * 40%
    risk = round(impact * 0.60 + prob_norm * 100 * 0.40, 1)
    risk = max(0.0, min(risk, 100.0))

    level, action = classify(risk)
    return {
        "id": rfc.get("id", "UNKNOWN"),
        "title": rfc.get("title", "—"),
        "criticality": rfc.get("criticality", "medium"),
        "G": round(G, 2),
        "C": round(C, 2),
        "P": round(P, 2),
        "risk": risk,
        "level": level,
        "action": action,
        "alert": risk >= 50,
    }


def load_rfcs(path: str = "rfcs/") -> list[dict]:
    """Load and validate all non-template RFC YAML files from path; skip TEMPLATE files and >256 KB files."""
    rfcs = []
    def _rfc_num(f: str) -> int:
        m = re.search(r'RFC-(\d+)', Path(f).name, re.IGNORECASE)
        return int(m.group(1)) if m else 0

    files = sorted(glob.glob(f"{path}/*.yaml"), key=_rfc_num)
    for f in files:
        fname = Path(f).name
        # Skip template files — they have placeholder scores and pollute reports
        if fname.upper().startswith("TEMPLATE"):
            continue
        if Path(f).stat().st_size > 256 * 1024:
            raise ValueError(f"{fname} exceeds 256 KB size limit — skipping to prevent DoS.")
        with open(f, "r", encoding="utf-8") as fp:
            try:
                data = yaml.safe_load(fp)
                # Skip entries with placeholder id (RFC-XXX pattern)
                if data and not str(data.get("id", "")).upper().startswith("RFC-X"):
                    rfcs.append(data)
            except yaml.YAMLError as exc:
                print(f"Error loading {f}: {exc}")
    return rfcs


def generate_report(results: list[dict], threshold: float) -> str:
    """Render a Markdown risk report; highlights RFCs at or above threshold score."""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    high_priority = [r for r in results if r["risk"] >= threshold]

    lines = [
        "# Risk Report — Active Design Docs",
        f"> Generated: {ts} | Alert threshold: {threshold}",
        "",
        "## High Priority Alerts" if high_priority else "## No Active Alerts",
        "",
    ]

    if high_priority:
        lines += [
            "| RFC | Title | Risk | Level | Recommended Action |",
            "|---|---|---|---|---|",
        ]
        for r in sorted(high_priority, key=lambda x: x["risk"], reverse=True):
            lines.append(
                f"| {r['id']} | {r['title']} | {r['risk']} | {r['level']} | {r['action']} |"
            )
        lines.append("")

    lines += [
        "## All Active Design Docs",
        "",
        "| RFC | Title | Crit. | G | C | P | Score | Level |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for r in sorted(results, key=lambda x: x["risk"], reverse=True):
        flag = " [!]" if r["alert"] else ""
        lines.append(
            f"| {r['id']} | {r['title']}{flag} | {r['criticality']} "
            f"| {r['G']} | {r['C']} | {r['P']} | {r['risk']} | {r['level']} |"
        )

    lines += [
        "",
        "### Formula Reference:",
        "```",
        "G = Σ(governance_score_i × weight_i)",
        "C = Σ(complexity_score_i × weight_i)",
        "P = failure_history×0.30 + (10−team_maturity)×0.25 + ambiguity×0.25 + deadline×0.20",
        "I = ((10−G)/10) × (C/10) × criticality_mult × 100",
        "R = I×0.60 + (P/10)×100×0.40",
        "```",
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Risk Engine — Design Docs")
    parser.add_argument("--rfcs-path", default="rfcs/", help="Directory containing RFC YAML files")
    parser.add_argument("--alert-threshold", type=float, default=50.0)
    parser.add_argument("--output", default="risk_report.md")
    args = parser.parse_args()

    cwd = Path.cwd().resolve()

    rfcs_resolved = Path(args.rfcs_path).resolve()
    if not str(rfcs_resolved).startswith(str(cwd)):
        print(f"Error: --rfcs-path '{args.rfcs_path}' escapes the working directory.", file=sys.stderr)
        sys.exit(2)

    output_resolved = Path(args.output).resolve()
    if not str(output_resolved).startswith(str(cwd)):
        print(f"Error: --output '{args.output}' escapes the working directory.", file=sys.stderr)
        sys.exit(2)

    try:
        rfcs = load_rfcs(args.rfcs_path)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(2)
    if not rfcs:
        print(f"No RFCs found in {args.rfcs_path}.")
        return

    results = [calc_risk(r) for r in rfcs]

    alerts = [r for r in results if r["risk"] >= args.alert_threshold]
    if alerts:
        print(f"\n{'═'*60}")
        print(f" {len(alerts)} RFC(s) ABOVE THRESHOLD ({args.alert_threshold})")
        print(f"{'═'*60}")
        for r in sorted(alerts, key=lambda x: x["risk"], reverse=True):
            print(f" [{r['level']}] {r['id']} — {r['title']} [Score: {r['risk']}]")
            print(f" → Action: {r['action']}")
        print(f"{'═'*60}\n")

    report = generate_report(results, args.alert_threshold)
    Path(args.output).write_text(report, encoding="utf-8")
    print(f"Report saved to: {args.output}")


if __name__ == "__main__":
    main()
