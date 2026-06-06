#!/usr/bin/env node
// detect-stack.js — reads CONFIGURE.md and prints PROJECT_STACK value to stdout.
// Used by ci-matrix.yml to decide which per-language workflow to trigger.
// Exit 0 always; unknown/absent stack defaults to "node".
//
// Usage (CI):
//   stack=$(node scripts/detect-stack.js)
//   echo "stack=$stack" >> $GITHUB_OUTPUT
//
// Usage (local):
//   node scripts/detect-stack.js

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIGURE = resolve(ROOT, 'CONFIGURE.md');

const VALID_STACKS = new Set(['node', 'python', 'go', 'rust', 'none']);
const DEFAULT_STACK = 'node';

/**
 * Reads CONFIGURE.md and returns the PROJECT_STACK value.
 * @param {string} [configurePath] - Path to CONFIGURE.md (defaults to repo root).
 * @returns {string} One of: 'node' | 'python' | 'go' | 'rust' | 'none'. Defaults to 'node'.
 */
export function detectStack(configurePath = CONFIGURE) {
  if (!existsSync(configurePath)) return DEFAULT_STACK;

  const content = readFileSync(configurePath, 'utf8');
  const match = content.match(/^PROJECT_STACK\s*=\s*(\S+)/m);
  if (!match) return DEFAULT_STACK;

  const value = match[1].trim().toLowerCase();
  return VALID_STACKS.has(value) ? value : DEFAULT_STACK;
}

// Run as CLI
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.stdout.write(detectStack() + '\n');
}
