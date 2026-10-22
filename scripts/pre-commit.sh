#!/usr/bin/env sh
# pre-commit.sh — quality gate before each commit.
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
