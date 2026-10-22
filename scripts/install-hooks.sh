#!/usr/bin/env sh
# install-hooks.sh — install git hooks for this repository.
# Run once after cloning: sh scripts/install-hooks.sh
# No external dependencies required.
set -e

HOOK_DIR="$(git rev-parse --git-dir)/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cp "$SCRIPT_DIR/pre-commit.sh" "$HOOK_DIR/pre-commit"
chmod +x "$HOOK_DIR/pre-commit"

echo "  ok  pre-commit hook installed at $HOOK_DIR/pre-commit"
