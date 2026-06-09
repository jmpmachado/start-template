import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard test for check-drift.js identity-pollution scan (checkIdentityPollution).
 *
 * Identity tokens (Visualizador / cristalografia / US-VIS-NN) are adopter data that
 * must never reappear in a clean template after a scrub. This test proves the scan
 * actually FAILS when such a token is injected into a non-allowlisted file — i.e. it
 * is not vacuously green. See doc-falsify sprint + DL-024.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'check-drift.js');

/** Runs check-drift.js and returns combined stdout/stderr (never throws on exit 1). */
function runDrift(): string {
  try {
    return execFileSync('node', [SCRIPT], { cwd: ROOT, encoding: 'utf8' });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string };
    return (err.stdout ?? '') + (err.stderr ?? '');
  }
}

describe('check-drift identity-pollution scan', () => {
  it('reports NO identity-token findings in the current (clean) tree', () => {
    const out = runDrift();
    // The scan may emit other (CONFIGURE/backlog) findings — we only assert that
    // no line flags an identity token.
    const identityLines = out
      .split('\n')
      .filter((l) => /adopter identity token/.test(l));
    expect(identityLines).toEqual([]);
  });

  it('FAILS when an identity token is injected into a non-allowlisted file', () => {
    // CHANGELOG.md is a real template file NOT on the identity allowlist.
    const target = join(ROOT, 'CHANGELOG.md');
    const original = readFileSync(target, 'utf8');
    try {
      writeFileSync(target, original + '\n<!-- Visualizador -->\n', 'utf8');
      const out = runDrift();
      expect(out).toMatch(/CHANGELOG\.md.*adopter identity token/);
    } finally {
      writeFileSync(target, original, 'utf8'); // always restore
    }
  });

  it('does NOT flag allowlisted documentary files (DECISION_LOG)', () => {
    const out = runDrift();
    expect(out).not.toMatch(/DECISION_LOG\.md.*adopter identity token/);
  });
});

describe('check-drift backlog open-items scan', () => {
  it('does NOT count the EXAMPLE template sprint row as an open US', () => {
    // BACKLOG.md ships a commented <!-- EXAMPLE START..END --> sprint whose row ends
    // in "| Open |" with a [CONFIGURE: US-ID] cell. That scaffolding must not be
    // counted as a real open Must-Have US (it produced a phantom "(unknown)" finding).
    const out = runDrift();
    expect(out).not.toMatch(/\(unknown\)/);
  });
});
