#!/usr/bin/env python3
"""
error_budget_calculator.py
Simulates the impact of error budget burn rate on the delivery schedule.
Usage: python error_budget_calculator.py
"""

from dataclasses import dataclass, field
from typing import List
from datetime import date, timedelta
import math

# ── Policy thresholds (remaining budget %) ───────────────────────────
POLICY_THRESHOLDS = {
    "normal":        (50, 100),   # remaining > 50%
    "extra_review":  (25, 50),    # 25–50%: reinforced review
    "partial_freeze":(10, 25),    # 10–25%: partial freeze
    "full_freeze":   (0,  10),    # < 10%: full freeze (P0 only)
}

VELOCITY_IMPACT = {
    "normal":         1.00,   # 100% feature delivery velocity
    "extra_review":   0.75,   # 25% review overhead
    "partial_freeze": 0.30,   # bugfix + reliability only
    "full_freeze":    0.05,   # P0 and security only
}

POLICY_LABEL = {
    "normal":         "Normal",
    "extra_review":   "Extra Review",
    "partial_freeze": "Partial Freeze",
    "full_freeze":    "Full Freeze",
}


@dataclass
class Service:
    name: str
    slo_target: float          # e.g., 99.5 (%)
    availability_real: float   # measured availability over the last N days
    window_days: int = 30


@dataclass
class Milestone:
    name: str
    planned_date: date
    depends_on: List[str] = field(default_factory=list)


@dataclass
class BudgetResult:
    service: str
    budget_total_minutes: float
    budget_consumed_minutes: float
    budget_consumed_pct: float
    budget_remaining_pct: float
    burn_rate_daily: float
    days_until_exhaustion: float
    policy: str
    velocity_factor: float
    freeze_days_projected: float


def calc_budget(svc: Service) -> BudgetResult:
    """Compute error budget consumption, burn rate, days until exhaustion, and policy for one service."""
    total_minutes = svc.window_days * 24 * 60 * (1 - svc.slo_target / 100)
    consumed_minutes = svc.window_days * 24 * 60 * (
        max(0, svc.slo_target - svc.availability_real) / 100
    )
    consumed_pct = min(100.0, (consumed_minutes / total_minutes * 100)
                       if total_minutes > 0 else 100.0)
    remaining_pct = max(0.0, 100.0 - consumed_pct)

    burn_rate_daily = consumed_pct / svc.window_days
    days_until_exh = (remaining_pct / burn_rate_daily
                      if burn_rate_daily > 0 else math.inf)

    policy = "normal"
    for pol, (lo, hi) in POLICY_THRESHOLDS.items():
        if lo <= remaining_pct < hi:
            policy = pol
            break

    velocity = VELOCITY_IMPACT[policy]
    freeze_days = (max(0.0, svc.window_days - days_until_exh)
                   if days_until_exh < svc.window_days else 0.0)

    return BudgetResult(
        service=svc.name,
        budget_total_minutes=round(total_minutes, 1),
        budget_consumed_minutes=round(consumed_minutes, 1),
        budget_consumed_pct=round(consumed_pct, 1),
        budget_remaining_pct=round(remaining_pct, 1),
        burn_rate_daily=round(burn_rate_daily, 2),
        days_until_exhaustion=round(days_until_exh, 1),
        policy=policy,
        velocity_factor=velocity,
        freeze_days_projected=round(freeze_days, 1),
    )


def project_milestone_delay(
    milestone: Milestone,
    results: List[BudgetResult],
    maturity_score: float,  # 0–10
) -> dict:
    """
    Projects milestone delay based on:
    - Freeze days of dependent services
    - Maturity factor (low maturity = more rework time)
    """
    relevant = [r for r in results if r.service in milestone.depends_on] or results
    worst = min(relevant, key=lambda r: r.budget_remaining_pct)

    base_delay = worst.freeze_days_projected
    # Maturity penalty: score < 7 increases delay due to rework
    maturity_penalty = max(0.0, (7.0 - maturity_score) * 2.5)

    total_delay = math.ceil(base_delay + maturity_penalty)
    new_date = milestone.planned_date + timedelta(days=total_delay)

    return {
        "milestone":     milestone.name,
        "planned":       milestone.planned_date.isoformat(),
        "delay_days":    total_delay,
        "new_date":      new_date.isoformat(),
        "worst_service": worst.service,
        "policy_active": worst.policy,
        "velocity":      f"{worst.velocity_factor * 100:.0f}%",
        "maturity_pen":  round(maturity_penalty, 1),
    }


def print_report(results: List[BudgetResult], delays: List[dict],
                 maturity: float) -> None:
    """Print the full error budget + milestone impact report to stdout."""
    print("\n" + "═" * 65)
    print("  ERROR BUDGET REPORT + MILESTONE IMPACT SIMULATION")
    print(f"  Maturity Score: {maturity}/10  |  Date: {date.today()}")
    print("═" * 65)

    print("\n── SERVICES ──────────────────────────────────────────────────")
    for r in results:
        print(f"\n  {r.service}")
        print(f"    Total budget:      {r.budget_total_minutes} min")
        print(f"    Consumed:          {r.budget_consumed_pct}%  "
              f"({r.budget_consumed_minutes} min)")
        print(f"    Remaining:         {r.budget_remaining_pct}%")
        print(f"    Burn rate:         {r.burn_rate_daily}%/day")
        print(f"    Days to exhaust:   "
              f"{'∞' if r.days_until_exhaustion == math.inf else r.days_until_exhaustion}")
        print(f"    Policy:            {POLICY_LABEL[r.policy]}")
        print(f"    Velocity:          {r.velocity_factor * 100:.0f}% feature delivery")
        print(f"    Projected freeze:  {r.freeze_days_projected} days")

    print("\n── MILESTONES ────────────────────────────────────────────────")
    for d in delays:
        status = "OK" if d["delay_days"] == 0 else ("WARN" if d["delay_days"] <= 7 else "LATE")
        print(f"\n  [{status}] {d['milestone']}")
        print(f"     Planned:          {d['planned']}")
        print(f"     Delay:            +{d['delay_days']} days "
              f"(maturity penalty: {d['maturity_pen']}d)")
        print(f"     New date:         {d['new_date']}")
        print(f"     Critical service: {d['worst_service']} "
              f"→ {d['policy_active']} ({d['velocity']} velocity)")
    print("\n" + "═" * 65)


# ── Example scenario — replace with project-specific services/milestones
if __name__ == "__main__":
    services = [
        Service("[Service A]", slo_target=99.5, availability_real=99.1),
        Service("[Service B]", slo_target=99.0, availability_real=98.7),
        Service("[Service C]", slo_target=98.0, availability_real=97.2),
    ]

    milestones = [
        Milestone("[Milestone 1]", date(2026, 6, 5),  depends_on=["[Service B]"]),
        Milestone("[Milestone 2]", date(2026, 6, 20), depends_on=["[Service A]", "[Service B]"]),
        Milestone("[Milestone 3]", date(2026, 7, 15), depends_on=["[Service A]", "[Service B]", "[Service C]"]),
    ]

    MATURITY_SCORE = 7.0  # current team maturity score from scorecard

    results = [calc_budget(s) for s in services]
    delays = [project_milestone_delay(m, results, MATURITY_SCORE) for m in milestones]

    print_report(results, delays, MATURITY_SCORE)
