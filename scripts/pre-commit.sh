#!/usr/bin/env sh
# pre-commit.sh — Rule 4 enforcement (GEMINI.md / CLAUDE.md).
# Installed by scripts/install-hooks.sh into .git/hooks/pre-commit.
# Runs: lint → typecheck → test. Abort commit on any failure.
set -e

echo "  >>  pre-commit: lint"
npm run lint --silent

echo "  >>  pre-commit: typecheck"
npm run typecheck --silent

echo "  >>  pre-commit: test"
npm test --silent

echo "  ok  pre-commit gate passed"
