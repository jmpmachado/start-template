#!/usr/bin/env python3
"""
install_check.py — Dependency validator for design-first-template (B2 pure).

Usage:
  python3 infra/scripts/install_check.py
  python3 infra/scripts/install_check.py --tooling-node
"""

import argparse
import platform
import shutil
import subprocess
import sys

OS = platform.system()


def check_cmd(cmd):
    path = shutil.which(cmd)
    if not path:
        return False, ""
    try:
        r = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=5)
        return True, (r.stdout or r.stderr).strip().splitlines()[0]
    except Exception:
        return True, "(version unknown)"


def check_python_pkg(pkg):
    try:
        __import__(pkg.replace("-", "_"))
        return True
    except ImportError:
        return False


def hint(dep: str) -> str:
    pip = "pip" if OS == "Windows" else "pip3"
    hints = {
        "python": {"Windows": "winget install Python.Python.3.12", "Linux": "sudo apt install python3", "Darwin": "brew install python@3.12"},
        "node": {"Windows": "winget install OpenJS.NodeJS.LTS", "Linux": "nvm install 22", "Darwin": "brew install node@22"},
    }
    if dep in hints:
        return hints[dep].get(OS, f"install {dep}")
    return f"{pip} install {dep}"


def report(label, ok, detail, required):
    icon = "✓" if ok else ("✗" if required else "○")
    tag = "" if ok else (" [REQUIRED]" if required else " [optional]")
    print(f"  {icon}  {label}: {detail}{tag}")
    if not ok:
        key = label.lower().split()[0].rstrip(".")
        key = "node" if key.startswith("node") else key
        print(f"       → {hint(key)}")
    return ok


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tooling-node", action="store_true")
    args = parser.parse_args()

    print(f"\n  design-first-template — Dependency Check (B2 pure)  [{OS}]")
    print("  " + "─" * 52)

    failures = []

    major, minor = sys.version_info[:2]
    ok = major == 3 and minor >= 10
    ver = f"Python {major}.{minor}.{sys.version_info.micro}"
    if not report("Python >= 3.10", ok, ver, required=True):
        failures.append("python")

    ok = check_python_pkg("yaml")
    if not report("PyYAML", ok, "installed" if ok else "missing", required=True):
        failures.append("pyyaml")

    ok, ver = check_cmd("cookiecutter")
    report("cookiecutter (optional)", ok, ver if ok else "not found", required=False)

    if args.tooling_node:
        ok, ver = check_cmd("node")
        if not report("Node.js >= 22", ok, ver if ok else "not found", required=True):
            failures.append("node")

    print()
    if failures:
        print(f"  ✗  {len(failures)} required dependency missing.")
        sys.exit(1)
    print("  ✅  All required dependencies present.")
    sys.exit(0)


if __name__ == "__main__":
    main()
