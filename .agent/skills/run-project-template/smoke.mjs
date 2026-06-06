#!/usr/bin/env node
/**
 * Smoke driver for project-template.
 * Runs every CLI surface in sequence and reports pass/fail.
 * Usage: node .claude/skills/run-project-template/smoke.mjs [--risk-only|--tests-only]
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const flag = process.argv[2] ?? '';
const results = [];

function run(label, cmd, opts = {}) {
  const start = Date.now();
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf-8', stdio: 'pipe', ...opts });
    const ms = Date.now() - start;
    results.push({ label, status: 'PASS', ms, out: out.trim().slice(-200) });
  } catch (e) {
    const ms = Date.now() - start;
    results.push({ label, status: 'FAIL', ms, out: String(e.stderr ?? e.message).trim().slice(-300) });
  }
}

if (!flag || flag === '--lint') {
  run('lint',      'npm run lint');
  run('typecheck', 'npm run typecheck');
}

if (!flag || flag === '--tests-only') {
  run('tests', 'npm test');
}

if (!flag || flag === '--risk-only') {
  // Windows: `python` alias may be missing — try `py` first, then `python3`, then `python`
  const pyBin = ['py', 'python3', 'python'].find((b) => {
    try { execSync(`${b} --version`, { stdio: 'pipe' }); return true; } catch { return false; }
  }) ?? 'python';
  run('risk-engine', `${pyBin} infra/scripts/risk_engine.py --rfcs-path rfcs/ --alert-threshold 60 --output risk_report.md`);
}

run('rotatelog', 'node scripts/rotatelog.js');

// Report
const pad = (s, n) => s.padEnd(n);
console.log('\n' + '─'.repeat(55));
console.log(`${'Step'.padEnd(16)} ${'Status'.padEnd(8)} ${'ms'.padStart(6)}`);
console.log('─'.repeat(55));
for (const r of results) {
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${pad(r.label, 14)} ${pad(r.status, 8)} ${String(r.ms).padStart(5)}ms`);
  if (r.status === 'FAIL') console.log(`   └─ ${r.out.split('\n').pop()}`);
}
console.log('─'.repeat(55));

const failed = results.filter((r) => r.status === 'FAIL');
const total = results.length;
console.log(`\n${total - failed.length}/${total} passed`);
process.exit(failed.length > 0 ? 1 : 0);
