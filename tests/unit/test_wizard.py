"""Idempotency and unit tests for infra/scripts/wizard.py"""
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parents[2] / "infra" / "scripts"))
import wizard


# ── ask ───────────────────────────────────────────────────────────────────────

class TestAsk:
    def test_returns_input(self):
        with patch("builtins.input", return_value="hello"):
            assert wizard.ask("q") == "hello"

    def test_returns_default_on_empty(self):
        with patch("builtins.input", return_value=""):
            assert wizard.ask("q", "def") == "def"

    def test_strips_whitespace(self):
        with patch("builtins.input", return_value="  hi  "):
            assert wizard.ask("q") == "hi"

    def test_eof_exits_cleanly(self):
        with patch("builtins.input", side_effect=EOFError):
            with pytest.raises(SystemExit) as exc:
                wizard.ask("q")
            assert exc.value.code == 0

    def test_keyboard_interrupt_exits_cleanly(self):
        with patch("builtins.input", side_effect=KeyboardInterrupt):
            with pytest.raises(SystemExit) as exc:
                wizard.ask("q")
            assert exc.value.code == 0


# ── choose ────────────────────────────────────────────────────────────────────

class TestChoose:
    def test_valid_choice(self):
        with patch("builtins.input", return_value="2"):
            assert wizard.choose("pick", ["a", "b", "c"]) == 1

    def test_out_of_range_returns_default(self):
        with patch("builtins.input", return_value="99"):
            assert wizard.choose("pick", ["a", "b"], default_idx=0) == 0

    def test_non_numeric_returns_default(self):
        with patch("builtins.input", return_value="x"):
            assert wizard.choose("pick", ["a", "b"], default_idx=1) == 1

    def test_empty_returns_default(self):
        with patch("builtins.input", return_value=""):
            assert wizard.choose("pick", ["a", "b"], default_idx=0) == 0

    def test_keyboard_interrupt_exits_cleanly(self):
        with patch("builtins.input", side_effect=KeyboardInterrupt):
            with pytest.raises(SystemExit) as exc:
                wizard.choose("pick", ["a", "b"])
            assert exc.value.code == 0


# ── confirm ───────────────────────────────────────────────────────────────────

class TestConfirm:
    def test_yes_input(self):
        with patch("builtins.input", return_value="y"):
            assert wizard.confirm("ok?") is True

    def test_no_input(self):
        with patch("builtins.input", return_value="n"):
            assert wizard.confirm("ok?") is False

    def test_empty_returns_default_yes(self):
        with patch("builtins.input", return_value=""):
            assert wizard.confirm("ok?", default_yes=True) is True

    def test_empty_returns_default_no(self):
        with patch("builtins.input", return_value=""):
            assert wizard.confirm("ok?", default_yes=False) is False

    def test_yes_uppercase(self):
        with patch("builtins.input", return_value="Y"):
            assert wizard.confirm("ok?") is True

    def test_keyboard_interrupt_returns_default(self):
        with patch("builtins.input", side_effect=KeyboardInterrupt):
            assert wizard.confirm("ok?", default_yes=True) is True
            assert wizard.confirm("ok?", default_yes=False) is False


# ── scan_placeholders ─────────────────────────────────────────────────────────

class TestScanPlaceholders:
    def test_detects_project_name(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("# start-project config\n", encoding="utf-8")
        hits = wizard.scan_placeholders(root=tmp_path)
        assert any(h.startswith("test.md:") for h in hits)

    def test_detects_stack_placeholder(self, tmp_path):
        f = tmp_path / "config.yaml"
        f.write_text("stack: node-ts\n", encoding="utf-8")
        hits = wizard.scan_placeholders(root=tmp_path)
        assert any(h.startswith("config.yaml:") for h in hits)

    def test_no_false_positives_on_clean_file(self, tmp_path):
        f = tmp_path / "clean.md"
        f.write_text("# Clean file\nNo placeholders here.\n", encoding="utf-8")
        hits = wizard.scan_placeholders(root=tmp_path)
        assert not any("clean.md" in h for h in hits)

    def test_skips_node_modules(self, tmp_path):
        nm = tmp_path / "node_modules"
        nm.mkdir()
        f = nm / "pkg.md"
        f.write_text("start-project\n", encoding="utf-8")
        hits = wizard.scan_placeholders(root=tmp_path)
        assert not any("node_modules" in h for h in hits)

    def test_skips_non_scanned_extensions(self, tmp_path):
        f = tmp_path / "binary.exe"
        f.write_text("start-project\n", encoding="utf-8")
        hits = wizard.scan_placeholders(root=tmp_path)
        assert not any("binary.exe" in h for h in hits)

    def test_idempotent_multiple_calls(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("start-project\n", encoding="utf-8")
        hits1 = wizard.scan_placeholders(root=tmp_path)
        hits2 = wizard.scan_placeholders(root=tmp_path)
        assert hits1 == hits2

    def test_detects_all_placeholder_types(self, tmp_path):
        content = "start-project node-ts typescript start-org start-project start-org"
        (tmp_path / "all.md").write_text(content, encoding="utf-8")
        hits = wizard.scan_placeholders(root=tmp_path)
        assert len([h for h in hits if "all.md" in h]) >= 1

    def test_skips_non_utf8_file(self, tmp_path):
        f = tmp_path / "latin.md"
        f.write_bytes(b"start-project caf\xe9")
        hits = wizard.scan_placeholders(root=tmp_path)
        assert not any("latin.md" in h for h in hits)

    def test_hit_format_starts_with_relative_path(self, tmp_path):
        (tmp_path / "doc.md").write_text("start-project\n", encoding="utf-8")
        hits = wizard.scan_placeholders(root=tmp_path)
        assert len(hits) == 1
        assert hits[0].startswith("doc.md:")

    def test_skips_wizard_internal_files(self, tmp_path, monkeypatch):
        internal = tmp_path / "profiles.yaml"
        internal.write_text("start-project\n", encoding="utf-8")
        monkeypatch.setattr(wizard, "_WIZARD_INTERNAL_FILES", frozenset({internal.resolve()}))
        hits = wizard.scan_placeholders(root=tmp_path)
        assert not any("profiles.yaml" in h for h in hits)

    def test_wizard_internal_files_exclusion_is_idempotent(self, tmp_path, monkeypatch):
        internal = tmp_path / "profiles.yaml"
        internal.write_text("start-project\n", encoding="utf-8")
        monkeypatch.setattr(wizard, "_WIZARD_INTERNAL_FILES", frozenset({internal.resolve()}))
        hits1 = wizard.scan_placeholders(root=tmp_path)
        hits2 = wizard.scan_placeholders(root=tmp_path)
        assert hits1 == hits2 == []


# ── stop ──────────────────────────────────────────────────────────────────────

class TestStop:
    def test_exits_with_code_1(self, capsys):
        with pytest.raises(SystemExit) as exc:
            wizard.stop("fatal error")
        assert exc.value.code == 1

    def test_prints_message(self, capsys):
        with pytest.raises(SystemExit):
            wizard.stop("something broke")
        out = capsys.readouterr().out
        assert "something broke" in out


# ── placeholder regex ─────────────────────────────────────────────────────────

class TestPlaceholderRegex:
    @pytest.mark.parametrize("text,expected", [
        ("start-project", True),
        ("node-ts", True),
        ("typescript", True),
        ("start-org", True),
        ("start-project", True),
        ("start-org", True),
        ("14", True),
        ("20", True),
        ("15", True),
        ("Tier 2 (High)", True),
        ("[REPO]", True),
        ("no placeholder", False),
        ("[OTHER]", False),
    ])
    def test_regex_matches(self, text, expected):
        assert bool(wizard.PLACEHOLDER_RE.search(text)) == expected


# ── SLIM_PROFILES ─────────────────────────────────────────────────────────────

class TestSlimProfiles:
    def test_all_profiles_have_required_keys(self):
        for key, profile in wizard.SLIM_PROFILES.items():
            assert "label" in profile, f"{key} missing 'label'"
            assert "optional" in profile, f"{key} missing 'optional'"
            assert "note" in profile, f"{key} missing 'note'"

    def test_optional_is_list(self):
        for key, profile in wizard.SLIM_PROFILES.items():
            assert isinstance(profile["optional"], list), f"{key}.optional not a list"

    def test_three_profiles_defined(self):
        assert len(wizard.SLIM_PROFILES) == 3

    def test_public_has_no_optional_files(self):
        assert wizard.SLIM_PROFILES["public"]["optional"] == []

    def test_founder_has_more_optional_than_team_and_public(self):
        counts = {k: len(v["optional"]) for k, v in wizard.SLIM_PROFILES.items()}
        assert counts["founder"] > counts["team"]
        assert counts["founder"] > counts["public"]


@pytest.fixture
def make_context(tmp_path):
    def _make(files: list[str]) -> Path:
        ctx = tmp_path / ".agent" / "context"
        ctx.mkdir(parents=True)
        for f in files:
            (ctx / f).write_text(f"# {f}", encoding="utf-8")
        return ctx
    return _make


# ── apply_profile ─────────────────────────────────────────────────────────────

class TestApplyProfile:
    def test_removes_optional_files_for_profile(self, tmp_path, make_context):
        optional = wizard.SLIM_PROFILES["founder"]["optional"]
        make_context(optional[:3])
        removed = wizard.apply_profile("founder", root=tmp_path)
        assert len(removed) == 3
        for f in optional[:3]:
            assert not (tmp_path / ".agent" / "context" / f).exists()

    def test_skips_missing_files_silently(self, tmp_path, make_context):
        make_context([])
        removed = wizard.apply_profile("founder", root=tmp_path)
        assert removed == []

    def test_public_removes_nothing(self, tmp_path, make_context):
        make_context(["AUDIT_REPORT.md"])
        removed = wizard.apply_profile("public", root=tmp_path)
        assert removed == []
        assert (tmp_path / ".agent" / "context" / "AUDIT_REPORT.md").exists()

    def test_unknown_profile_returns_empty(self, tmp_path):
        removed = wizard.apply_profile("nonexistent", root=tmp_path)
        assert removed == []

    def test_null_optional_does_not_raise(self, tmp_path, make_context, monkeypatch):
        monkeypatch.setitem(wizard.SLIM_PROFILES, "nulltest", {"label": "x", "optional": None, "note": ""})
        make_context([])
        removed = wizard.apply_profile("nulltest", root=tmp_path)
        assert removed == []

    def test_returns_only_actually_removed_files(self, tmp_path, make_context):
        optional = wizard.SLIM_PROFILES["founder"]["optional"]
        make_context([optional[0]])
        removed = wizard.apply_profile("founder", root=tmp_path)
        assert removed == [optional[0]]

    def test_all_optional_files_end_with_md(self):
        for key, profile in wizard.SLIM_PROFILES.items():
            for f in profile["optional"]:
                assert f.endswith(".md"), f"{key}: {f} does not end with .md"

    def test_profiles_size_ordered_by_scope(self):
        counts = {k: len(v["optional"]) for k, v in wizard.SLIM_PROFILES.items()}
        assert counts["founder"] >= counts["team"]
        assert counts["team"] >= counts["public"]
        assert counts["public"] == 0


# ── apply_template_only ───────────────────────────────────────────────────────

class TestApplyTemplateOnly:
    def test_removes_present_template_files(self, tmp_path, make_context):
        make_context(["BACKLOG_HISTORY.md", "DOSSIER.md"])
        removed = wizard.apply_template_only(root=tmp_path)
        assert "BACKLOG_HISTORY.md" in removed
        assert "DOSSIER.md" in removed
        assert not (tmp_path / ".agent" / "context" / "BACKLOG_HISTORY.md").exists()

    def test_skips_missing_files_silently(self, tmp_path, make_context):
        make_context([])
        removed = wizard.apply_template_only(root=tmp_path)
        assert removed == []

    def test_template_only_files_is_nonempty_list(self):
        assert isinstance(wizard.TEMPLATE_ONLY_FILES, list)
        assert len(wizard.TEMPLATE_ONLY_FILES) > 0

    def test_all_entries_end_with_md(self):
        for f in wizard.TEMPLATE_ONLY_FILES:
            assert f.endswith(".md"), f"{f} does not end with .md"

    def test_returns_only_actually_removed(self, tmp_path, make_context):
        make_context(["BACKLOG_HISTORY.md"])
        removed = wizard.apply_template_only(root=tmp_path)
        assert removed == ["BACKLOG_HISTORY.md"]

    def test_no_overlap_with_slim_profiles_optional(self):
        all_optional = set(f for v in wizard.SLIM_PROFILES.values() for f in v["optional"])
        overlap = set(wizard.TEMPLATE_ONLY_FILES) & all_optional
        assert overlap == set(), f"TEMPLATE_ONLY_FILES overlap with SLIM_PROFILES optional: {overlap}"


# ── apply_substitutions ───────────────────────────────────────────────────────

class TestApplySubstitutions:
    def test_replaces_placeholder_in_md(self, tmp_path):
        f = tmp_path / "README.md"
        f.write_text("# start-project\nStack: node-ts\n", encoding="utf-8")
        n = wizard.apply_substitutions({"PROJECT_NAME": "my-api", "STACK": "node-ts"}, root=tmp_path)
        assert n == 1
        assert f.read_text(encoding="utf-8") == "# my-api\nStack: node-ts\n"

    def test_skips_node_modules(self, tmp_path):
        nm = tmp_path / "node_modules"
        nm.mkdir()
        f = nm / "pkg.md"
        f.write_text("start-project\n", encoding="utf-8")
        n = wizard.apply_substitutions({"PROJECT_NAME": "x"}, root=tmp_path)
        assert n == 0
        assert "start-project" in f.read_text(encoding="utf-8")

    def test_skips_unknown_extensions(self, tmp_path):
        f = tmp_path / "binary.exe"
        f.write_text("start-project\n", encoding="utf-8")
        n = wizard.apply_substitutions({"PROJECT_NAME": "x"}, root=tmp_path)
        assert n == 0

    def test_idempotent(self, tmp_path):
        f = tmp_path / "doc.md"
        f.write_text("# my-api\n", encoding="utf-8")
        n1 = wizard.apply_substitutions({"PROJECT_NAME": "my-api"}, root=tmp_path)
        n2 = wizard.apply_substitutions({"PROJECT_NAME": "my-api"}, root=tmp_path)
        assert n1 == 0
        assert n2 == 0

    def test_returns_count_of_modified_files(self, tmp_path):
        (tmp_path / "a.md").write_text("start-project\n", encoding="utf-8")
        (tmp_path / "b.yaml").write_text("start-project\n", encoding="utf-8")
        (tmp_path / "c.md").write_text("no placeholders\n", encoding="utf-8")
        n = wizard.apply_substitutions({"PROJECT_NAME": "proj"}, root=tmp_path)
        assert n == 2

    def test_skips_non_utf8_file(self, tmp_path, capsys):
        f = tmp_path / "latin.md"
        f.write_bytes(b"start-project caf\xe9")
        n = wizard.apply_substitutions({"PROJECT_NAME": "x"}, root=tmp_path)
        assert n == 0
        assert f.read_bytes() == b"start-project caf\xe9"
        out = capsys.readouterr().out
        assert "Skipping" in out

    def test_skips_wizard_internal_files(self, tmp_path, monkeypatch):
        internal = tmp_path / "profiles.yaml"
        internal.write_text("start-project\n", encoding="utf-8")
        monkeypatch.setattr(wizard, "_WIZARD_INTERNAL_FILES", frozenset({internal.resolve()}))
        n = wizard.apply_substitutions({"PROJECT_NAME": "my[api]"}, root=tmp_path)
        assert n == 0
        assert internal.read_text(encoding="utf-8") == "start-project\n"


# ── read_cookiecutter_context ─────────────────────────────────────────────────

class TestReadCookiecutterContext:
    def test_returns_empty_dict_when_no_file(self, tmp_path, monkeypatch):
        monkeypatch.setattr(wizard, "ROOT", tmp_path)
        ctx = wizard.read_cookiecutter_context()
        assert ctx == {}

    def test_reads_project_name(self, tmp_path, monkeypatch):
        monkeypatch.setattr(wizard, "ROOT", tmp_path)
        (tmp_path / "cookiecutter.json").write_text(
            '{"project_name": "my-api", "stack": "node-ts"}', encoding="utf-8"
        )
        ctx = wizard.read_cookiecutter_context()
        assert ctx["PROJECT_NAME"] == "my-api"
        assert ctx["STACK"] == "node-ts"

    def test_stack_list_returns_empty(self, tmp_path, monkeypatch):
        monkeypatch.setattr(wizard, "ROOT", tmp_path)
        (tmp_path / "cookiecutter.json").write_text(
            '{"project_name": "x", "stack": ["node-ts", "python"]}', encoding="utf-8"
        )
        ctx = wizard.read_cookiecutter_context()
        assert ctx["STACK"] == ""

    def test_malformed_json_returns_empty_and_warns(self, tmp_path, monkeypatch, capsys):
        monkeypatch.setattr(wizard, "ROOT", tmp_path)
        (tmp_path / "cookiecutter.json").write_text("{bad json}", encoding="utf-8")
        ctx = wizard.read_cookiecutter_context()
        assert ctx == {}
        out = capsys.readouterr().out
        assert "malformed" in out


# ── append_decision_log ───────────────────────────────────────────────────────

class TestAppendDecisionLog:
    def _make_log(self, tmp_path: Path, content: str) -> Path:
        log = tmp_path / "DECISION_LOG.md"
        log.write_text(content, encoding="utf-8")
        return log

    def test_single_append_format(self, tmp_path, monkeypatch):
        log = self._make_log(tmp_path, "# Decision Log\nold entry\n")
        monkeypatch.setattr(wizard, "DECISION_LOG", log)
        wizard.append_decision_log("## new entry\n\ndetails here")
        result = log.read_text(encoding="utf-8")
        assert result.startswith("# Decision Log\n")
        assert "## new entry" in result
        assert "old entry" in result

    def test_double_append_no_extra_blank_lines(self, tmp_path, monkeypatch):
        log = self._make_log(tmp_path, "# Decision Log\nold entry\n")
        monkeypatch.setattr(wizard, "DECISION_LOG", log)
        wizard.append_decision_log("## entry-1")
        wizard.append_decision_log("## entry-2")
        result = log.read_text(encoding="utf-8")
        assert "\n\n\n" not in result

    def test_no_marker_leaves_file_unchanged(self, tmp_path, monkeypatch):
        log = self._make_log(tmp_path, "no marker here")
        monkeypatch.setattr(wizard, "DECISION_LOG", log)
        wizard.append_decision_log("## entry")
        assert log.read_text(encoding="utf-8") == "no marker here"

    def test_absent_file_is_noop(self, tmp_path, monkeypatch):
        monkeypatch.setattr(wizard, "DECISION_LOG", tmp_path / "nonexistent.md")
        wizard.append_decision_log("## entry")  # must not raise


# ── _load_profiles ───────────────────────────────────────────────────────────

class TestLoadProfiles:
    def test_happy_path_returns_dict(self, tmp_path, monkeypatch):
        p = tmp_path / "profiles.yaml"
        p.write_text("founder:\n  label: test\n  optional: []\n  note: n\n", encoding="utf-8")
        monkeypatch.setattr(wizard, "_PROFILES_YAML", p)
        result = wizard._load_profiles()
        assert "founder" in result

    def test_missing_file_exits_1(self, tmp_path, monkeypatch, capsys):
        monkeypatch.setattr(wizard, "_SLIM_PROFILES_CACHE", None)
        monkeypatch.setattr(wizard, "_PROFILES_YAML", tmp_path / "nonexistent.yaml")
        with pytest.raises(SystemExit) as exc:
            wizard._load_profiles()
        assert exc.value.code == 1

    def test_missing_file_prints_path(self, tmp_path, monkeypatch, capsys):
        missing = tmp_path / "nonexistent.yaml"
        monkeypatch.setattr(wizard, "_SLIM_PROFILES_CACHE", None)
        monkeypatch.setattr(wizard, "_PROFILES_YAML", missing)
        with pytest.raises(SystemExit):
            wizard._load_profiles()
        err = capsys.readouterr().err
        assert str(missing) in err
        assert "Re-clone" in err

    def test_malformed_yaml_exits_1(self, tmp_path, monkeypatch, capsys):
        p = tmp_path / "profiles.yaml"
        p.write_text("founder: [\nbad yaml", encoding="utf-8")
        monkeypatch.setattr(wizard, "_SLIM_PROFILES_CACHE", None)
        monkeypatch.setattr(wizard, "_PROFILES_YAML", p)
        with pytest.raises(SystemExit) as exc:
            wizard._load_profiles()
        assert exc.value.code == 1

    def test_malformed_yaml_prints_hint(self, tmp_path, monkeypatch, capsys):
        p = tmp_path / "profiles.yaml"
        p.write_text("founder: [\nbad yaml", encoding="utf-8")
        monkeypatch.setattr(wizard, "_SLIM_PROFILES_CACHE", None)
        monkeypatch.setattr(wizard, "_PROFILES_YAML", p)
        with pytest.raises(SystemExit):
            wizard._load_profiles()
        err = capsys.readouterr().err
        assert "malformed" in err
        assert "Fix the YAML" in err


# ── run_ci_gate ───────────────────────────────────────────────────────────────

class TestRunCiGate:
    def test_reports_failure_on_nonzero_exit(self, monkeypatch, capsys):
        import subprocess
        fake = type("R", (), {"returncode": 1, "stdout": "FAILED test_foo", "stderr": ""})()
        monkeypatch.setattr(subprocess, "run", lambda *a, **kw: fake)
        wizard.run_ci_gate("python")
        out = capsys.readouterr().out
        assert "failed" in out

    def test_runs_pytest_on_success(self, monkeypatch, capsys):
        import subprocess
        calls = []
        fake = type("R", (), {"returncode": 0, "stdout": "75 passed in 0.3s", "stderr": ""})()
        def fake_run(cmd, **kw):
            calls.append(cmd)
            return fake
        monkeypatch.setattr(subprocess, "run", fake_run)
        wizard.run_ci_gate("python")
        assert len(calls) == 1
        assert calls[0][0] == sys.executable
        assert "-m" in calls[0] and "pytest" in calls[0]
        out = capsys.readouterr().out
        assert "75 passed" in out

    def test_uses_sys_executable(self, monkeypatch, capsys):
        import subprocess
        fake = type("R", (), {"returncode": 0, "stdout": "1 passed", "stderr": ""})()
        captured = []
        monkeypatch.setattr(subprocess, "run", lambda cmd, **kw: captured.append(cmd) or fake)
        wizard.run_ci_gate("python")
        assert captured[0][0] == sys.executable


# ── run_ci_gate — stack awareness ─────────────────────────────────────────────

class TestRunCiGateStackAwareness:
    def test_skips_pytest_for_node_ts_stack(self, monkeypatch, capsys):
        import subprocess
        calls = []
        monkeypatch.setattr(subprocess, "run", lambda cmd, **kw: calls.append(cmd))
        result = wizard.run_ci_gate("node-ts")
        assert result is True
        assert calls == [], "pytest must not be invoked for node-ts stack"
        assert "skipped" in capsys.readouterr().out

    def test_skips_pytest_for_go_stack(self, monkeypatch, capsys):
        import subprocess
        calls = []
        monkeypatch.setattr(subprocess, "run", lambda cmd, **kw: calls.append(cmd))
        result = wizard.run_ci_gate("go")
        assert result is True
        assert calls == []

    def test_skips_pytest_for_none_stack(self, monkeypatch, capsys):
        import subprocess
        calls = []
        monkeypatch.setattr(subprocess, "run", lambda cmd, **kw: calls.append(cmd))
        result = wizard.run_ci_gate("none")
        assert result is True
        assert calls == []

    def test_multi_stack_runs_pytest_when_py_files_present(self, monkeypatch, tmp_path, capsys):
        import subprocess
        (tmp_path / "test_foo.py").write_text("# placeholder")
        monkeypatch.setattr(wizard, "ROOT", tmp_path)
        (tmp_path / "tests" / "unit").mkdir(parents=True)
        (tmp_path / "tests" / "unit" / "test_foo.py").write_text("# placeholder")
        fake = type("R", (), {"returncode": 0, "stdout": "1 passed", "stderr": ""})()
        calls = []
        monkeypatch.setattr(subprocess, "run", lambda cmd, **kw: calls.append(cmd) or fake)
        result = wizard.run_ci_gate("multi")
        assert result is True
        assert len(calls) == 1, "pytest must run when Python test files are present"

    def test_multi_stack_skips_pytest_when_no_py_files(self, monkeypatch, tmp_path, capsys):
        import subprocess
        monkeypatch.setattr(wizard, "ROOT", tmp_path)
        (tmp_path / "tests" / "unit").mkdir(parents=True)
        calls = []
        monkeypatch.setattr(subprocess, "run", lambda cmd, **kw: calls.append(cmd))
        result = wizard.run_ci_gate("multi")
        assert result is True
        assert calls == [], "pytest must not run when no Python test files are present"
