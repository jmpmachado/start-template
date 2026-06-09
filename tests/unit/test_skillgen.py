"""Tests for infra/scripts/skillgen.py — cross-harness skill generator.

Covers the idempotent block contract: render, opt-in detection, stale detection,
and that re-writing is a no-op (idempotence). All tests use tmp_path; none touch
the real harness files.
"""

import importlib.util
from pathlib import Path

import pytest

_SPEC = importlib.util.spec_from_file_location(
    "skillgen",
    Path(__file__).resolve().parents[2] / "infra" / "scripts" / "skillgen.py",
)
skillgen = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(skillgen)


class TestRenderBlock:
    def test_wraps_body_in_markers(self):
        out = skillgen.render_block("foo", "hello")
        assert out.startswith("<!-- SKILLGEN:START foo -->")
        assert out.endswith("<!-- SKILLGEN:END foo -->")
        assert "hello" in out

    def test_strips_surrounding_whitespace_in_body(self):
        out = skillgen.render_block("foo", "\n\n  body  \n\n")
        assert "\nbody\n" in out


class TestApplyToTarget:
    def test_returns_none_when_target_not_opted_in(self):
        # No markers -> target did not opt in.
        assert skillgen.apply_to_target("# Doc\nno markers here\n", "foo", "body") is None

    def test_fills_empty_marked_block(self):
        content = "# Doc\n<!-- SKILLGEN:START foo -->\n<!-- SKILLGEN:END foo -->\n"
        out = skillgen.apply_to_target(content, "foo", "new body")
        assert "new body" in out
        assert out.count("<!-- SKILLGEN:START foo -->") == 1
        assert out.count("<!-- SKILLGEN:END foo -->") == 1

    def test_replaces_existing_block_in_place(self):
        content = (
            "before\n<!-- SKILLGEN:START foo -->\nOLD\n<!-- SKILLGEN:END foo -->\nafter\n"
        )
        out = skillgen.apply_to_target(content, "foo", "NEW")
        assert "NEW" in out
        assert "OLD" not in out
        assert out.startswith("before\n")
        assert out.rstrip().endswith("after")

    def test_idempotent_second_apply_is_noop(self):
        content = "<!-- SKILLGEN:START foo -->\n<!-- SKILLGEN:END foo -->\n"
        once = skillgen.apply_to_target(content, "foo", "body")
        twice = skillgen.apply_to_target(once, "foo", "body")
        assert once == twice

    def test_only_targets_its_own_name(self):
        content = (
            "<!-- SKILLGEN:START other -->\nKEEP\n<!-- SKILLGEN:END other -->\n"
        )
        # "foo" has no markers here -> no change (returns None)
        assert skillgen.apply_to_target(content, "foo", "body") is None


class TestProcess:
    def test_check_detects_stale_and_write_fixes_it(self, tmp_path, monkeypatch):
        src_dir = tmp_path / "skill-src"
        src_dir.mkdir()
        (src_dir / "gate.md").write_text("run the gate", encoding="utf-8")
        target = tmp_path / "CLAUDE.md"
        target.write_text(
            "# CLAUDE\n<!-- SKILLGEN:START gate -->\n<!-- SKILLGEN:END gate -->\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(skillgen, "SRC_DIR", src_dir)
        monkeypatch.setattr(skillgen, "TARGETS", {"claude": target})

        _, stale = skillgen.process(write=False)
        assert stale == ["claude:gate"]

        changed, _ = skillgen.process(write=True)
        assert changed == ["claude:gate"]
        assert "run the gate" in target.read_text(encoding="utf-8")

        # After write, nothing is stale.
        _, stale_after = skillgen.process(write=False)
        assert stale_after == []
