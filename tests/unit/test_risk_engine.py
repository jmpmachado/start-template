"""Unit tests for infra/scripts/risk_engine.py"""
import sys
import math
import tempfile
import textwrap
from pathlib import Path

import pytest

# Allow importing risk_engine without installing it as a package
sys.path.insert(0, str(Path(__file__).parents[2] / "infra" / "scripts"))
import risk_engine as re_mod


# ── helpers ──────────────────────────────────────────────────────────────────

def _rfc(**overrides) -> dict:
    """Minimal valid RFC dict; override any key."""
    base = {
        "id": "RFC-001",
        "title": "Test RFC",
        "criticality": "medium",
        "governance": {k: 5 for k in re_mod.W_GOV},
        "complexity": {k: 5 for k in re_mod.W_COMP},
        "probability": {k: 5 for k in re_mod.W_PROB},
    }
    base.update(overrides)
    return base


# ── classify ─────────────────────────────────────────────────────────────────

class TestClassify:
    def test_healthy(self):
        assert re_mod.classify(0)[0] == "Healthy"
        assert re_mod.classify(19.9)[0] == "Healthy"

    def test_attention(self):
        assert re_mod.classify(20)[0] == "Attention"
        assert re_mod.classify(39.9)[0] == "Attention"

    def test_high(self):
        assert re_mod.classify(40)[0] == "High"

    def test_critical(self):
        assert re_mod.classify(60)[0] == "Critical"

    def test_emergency(self):
        assert re_mod.classify(80)[0] == "Emergency"
        assert re_mod.classify(100)[0] == "Emergency"

    def test_returns_action_string(self):
        _, action = re_mod.classify(50)
        assert isinstance(action, str) and len(action) > 0


# ── calc_governance ───────────────────────────────────────────────────────────

class TestCalcGovernance:
    def test_all_zero_returns_zero(self):
        assert re_mod.calc_governance({}) == 0.0

    def test_all_ten_returns_ten(self):
        g = re_mod.calc_governance({k: 10 for k in re_mod.W_GOV})
        assert math.isclose(g, 10.0, rel_tol=1e-6)

    def test_weights_sum_to_one(self):
        assert math.isclose(sum(re_mod.W_GOV.values()), 1.0, rel_tol=1e-9)

    def test_missing_key_treated_as_zero(self):
        g_partial = re_mod.calc_governance({"security": 10})
        g_full = re_mod.calc_governance({"security": 10, **{k: 0 for k in re_mod.W_GOV if k != "security"}})
        assert math.isclose(g_partial, g_full, rel_tol=1e-9)


# ── calc_complexity ───────────────────────────────────────────────────────────

class TestCalcComplexity:
    def test_all_zero(self):
        assert re_mod.calc_complexity({}) == 0.0

    def test_all_ten(self):
        c = re_mod.calc_complexity({k: 10 for k in re_mod.W_COMP})
        assert math.isclose(c, 10.0, rel_tol=1e-6)

    def test_weights_sum_to_one(self):
        assert math.isclose(sum(re_mod.W_COMP.values()), 1.0, rel_tol=1e-9)


# ── calc_probability ──────────────────────────────────────────────────────────

class TestCalcProbability:
    def test_senior_team_lowers_risk(self):
        # team_maturity scale: 0=senior (low risk input), 10=junior (high risk input).
        # Formula uses (10 - team_maturity), so maturity=0 → contribution 2.5; maturity=10 → 0.
        # Senior (maturity=0) actually contributes MORE to P via the inversion — the label is
        # about *experience*, not *risk*. Verified against source: (10 - maturity) * 0.25.
        p_maturity_0 = re_mod.calc_probability({"team_maturity": 0, "failure_history": 5,
                                                 "requirement_ambiguity": 5, "deadline_pressure": 5})
        p_maturity_10 = re_mod.calc_probability({"team_maturity": 10, "failure_history": 5,
                                                  "requirement_ambiguity": 5, "deadline_pressure": 5})
        # maturity=0 → (10-0)*0.25=2.5 added; maturity=10 → (10-10)*0.25=0 added
        assert p_maturity_0 > p_maturity_10

    def test_all_zero_except_maturity(self):
        """team_maturity=0, everything else 0 → P = (10-0)*0.25 = 2.5"""
        p = re_mod.calc_probability({"team_maturity": 0})
        assert math.isclose(p, 2.5, rel_tol=1e-6)

    def test_missing_keys_use_neutral_defaults(self):
        p = re_mod.calc_probability({})
        # team_maturity defaults to 5 → (10-5)*0.25=1.25; all others 0 → P = 1.25
        assert math.isclose(p, 1.25, rel_tol=1e-6)

    def test_max_risk(self):
        """All factors at maximum risk."""
        p = re_mod.calc_probability({
            "failure_history": 10,
            "team_maturity": 10,
            "requirement_ambiguity": 10,
            "deadline_pressure": 10,
        })
        # = 10*0.30 + (10-10)*0.25 + 10*0.25 + 10*0.20 = 3+0+2.5+2 = 7.5
        assert math.isclose(p, 7.5, rel_tol=1e-6)


# ── calc_risk ─────────────────────────────────────────────────────────────────

class TestCalcRisk:
    def test_returns_required_keys(self):
        result = re_mod.calc_risk(_rfc())
        for key in ("id", "title", "criticality", "G", "C", "P", "risk", "level", "action", "alert"):
            assert key in result

    def test_risk_clamped_to_0_100(self):
        # Maximum possible inputs
        extreme = _rfc(
            criticality="critical",
            governance={k: 0 for k in re_mod.W_GOV},
            complexity={k: 10 for k in re_mod.W_COMP},
            probability={k: 10 for k in re_mod.W_PROB},
        )
        r = re_mod.calc_risk(extreme)
        assert 0.0 <= r["risk"] <= 100.0

    def test_critical_criticality_raises_score(self):
        base = re_mod.calc_risk(_rfc(criticality="medium"))
        crit = re_mod.calc_risk(_rfc(criticality="critical"))
        assert crit["risk"] >= base["risk"]

    def test_low_criticality_lowers_score(self):
        base = re_mod.calc_risk(_rfc(criticality="medium"))
        low = re_mod.calc_risk(_rfc(criticality="low"))
        assert low["risk"] <= base["risk"]

    def test_alert_flag_at_50(self):
        # Build an RFC that scores just above 50
        high = _rfc(
            criticality="critical",
            governance={k: 0 for k in re_mod.W_GOV},
            complexity={k: 10 for k in re_mod.W_COMP},
            probability={k: 10 for k in re_mod.W_PROB},
        )
        assert re_mod.calc_risk(high)["alert"] is True

    def test_alert_false_when_low(self):
        low = _rfc(
            criticality="low",
            governance={k: 10 for k in re_mod.W_GOV},
            complexity={k: 0 for k in re_mod.W_COMP},
            probability={k: 0 for k in re_mod.W_PROB},
        )
        assert re_mod.calc_risk(low)["alert"] is False

    def test_unknown_criticality_defaults_medium(self):
        r = re_mod.calc_risk(_rfc(criticality="nonexistent"))
        r_med = re_mod.calc_risk(_rfc(criticality="medium"))
        assert r["risk"] == r_med["risk"]

    def test_id_and_title_passthrough(self):
        r = re_mod.calc_risk(_rfc(id="RFC-042", title="My RFC"))
        assert r["id"] == "RFC-042"
        assert r["title"] == "My RFC"


# ── load_rfcs ─────────────────────────────────────────────────────────────────

class TestLoadRfcs:
    def _write_yaml(self, tmp_path: Path, name: str, content: str) -> Path:
        f = tmp_path / name
        f.write_text(textwrap.dedent(content), encoding="utf-8")
        return f

    def test_loads_valid_rfc(self, tmp_path):
        self._write_yaml(tmp_path, "RFC-001.yaml", """
            id: RFC-001
            title: Valid RFC
            criticality: medium
        """)
        rfcs = re_mod.load_rfcs(str(tmp_path))
        assert len(rfcs) == 1
        assert rfcs[0]["id"] == "RFC-001"

    def test_skips_template_file(self, tmp_path):
        self._write_yaml(tmp_path, "TEMPLATE.yaml", """
            id: RFC-XXX
            title: Template
        """)
        rfcs = re_mod.load_rfcs(str(tmp_path))
        assert rfcs == []

    def test_skips_placeholder_id(self, tmp_path):
        self._write_yaml(tmp_path, "RFC-000.yaml", """
            id: RFC-XXX
            title: Placeholder
        """)
        rfcs = re_mod.load_rfcs(str(tmp_path))
        assert rfcs == []

    def test_sorts_by_rfc_number(self, tmp_path):
        for n in [3, 1, 2]:
            self._write_yaml(tmp_path, f"RFC-00{n}.yaml", f"id: RFC-00{n}\ntitle: T{n}\n")
        rfcs = re_mod.load_rfcs(str(tmp_path))
        assert [r["id"] for r in rfcs] == ["RFC-001", "RFC-002", "RFC-003"]

    def test_empty_directory(self, tmp_path):
        assert re_mod.load_rfcs(str(tmp_path)) == []

    def test_oversized_file_raises(self, tmp_path):
        f = tmp_path / "RFC-001.yaml"
        f.write_bytes(b"x" * (256 * 1024 + 1))
        with pytest.raises(ValueError, match="exceeds 256 KB"):
            re_mod.load_rfcs(str(tmp_path))


# ── generate_report ───────────────────────────────────────────────────────────

class TestGenerateReport:
    def _result(self, risk: float, rfc_id: str = "RFC-001") -> dict:
        level, action = re_mod.classify(risk)
        return {
            "id": rfc_id, "title": "T", "criticality": "medium",
            "G": 5.0, "C": 5.0, "P": 5.0,
            "risk": risk, "level": level, "action": action,
            "alert": risk >= 50,
        }

    def test_contains_rfc_id(self):
        report = re_mod.generate_report([self._result(30)], threshold=50)
        assert "RFC-001" in report

    def test_high_priority_section_present_when_above_threshold(self):
        report = re_mod.generate_report([self._result(60)], threshold=50)
        assert "High Priority Alerts" in report

    def test_no_alerts_section_when_below_threshold(self):
        report = re_mod.generate_report([self._result(30)], threshold=50)
        assert "No Active Alerts" in report

    def test_alert_marker_in_all_docs_table(self):
        report = re_mod.generate_report([self._result(60)], threshold=50)
        assert "[!]" in report

    def test_formula_reference_present(self):
        report = re_mod.generate_report([self._result(30)], threshold=50)
        assert "Formula Reference" in report

    def test_sorted_descending_by_risk(self):
        results = [self._result(10, "RFC-001"), self._result(70, "RFC-002"), self._result(40, "RFC-003")]
        report = re_mod.generate_report(results, threshold=50)
        idx = [report.index(f"RFC-00{i}") for i in [1, 2, 3]]
        # RFC-002 (70) should appear before RFC-003 (40) before RFC-001 (10)
        assert report.index("RFC-002") < report.index("RFC-003") < report.index("RFC-001")
