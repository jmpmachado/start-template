#!/usr/bin/env node
// Rotates token_log.jsonl when it exceeds MAX_LINES.
// Log path: TOKEN_LOG env var, or defaults to .agent/memory/token_log.jsonl in the repo root.

import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const MAX_LINES = 200;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultLogPath = resolve(ROOT, '.agent', 'memory', 'token_log.jsonl');
const logPath = resolve(process.env.TOKEN_LOG ?? defaultLogPath);

if (!existsSync(logPath)) process.exit(0);

const lines = readFileSync(logPath, 'utf-8').trimEnd().split('\n').filter(Boolean);

if (lines.length < MAX_LINES) {
  console.log(`token_log: ${lines.length} lines — no rotation needed.`);
  process.exit(0);
}

const ts = new Date().toISOString().slice(0, 7); // YYYY-MM
const archivePath = logPath.replace('.jsonl', `.${ts}.jsonl`);
renameSync(logPath, archivePath);
writeFileSync(logPath, '');
console.log(`Rotated ${lines.length} lines → ${archivePath}`);
