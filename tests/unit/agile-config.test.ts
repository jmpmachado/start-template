import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildConfig, writeConfig, readConfigFile } from '../../scripts/lib/agile-config.js';

// ── fixtures ──────────────────────────────────────────────────────────────────

const TEMPLATE_SNIPPET = `
**Default session length used for sizing:** \`[CONFIGURE]\` hours
- [ ] End of every agent session (same day)
- [ ] Next available window (next day or 5h block)
- [ ] Weekly reset window
- [ ] Other: \`[CONFIGURE]\`
**Maximum unreviewed sessions before mandatory stop:** \`[CONFIGURE]\`
**Active modules:** \`[CONFIGURE]\`
**Modules under active development this sprint:** \`[CONFIGURE]\`
**Rule from \`AGILE_GUIDE.md\`:** A sprint touches at most \`[CONFIGURE]\` modules simultaneously.
- [ ] Continuous by module maturity (Debian model — default)
- [ ] Fixed release train (weekly/biweekly)
- [ ] On-demand (manual trigger only)
- [ ] Other: \`[CONFIGURE]\`
**Default for this project:** \`[CONFIGURE]\`
| Sprint length | 1 week | \`[CONFIGURE]\` | |
| Max USs per sprint | 5 | \`[CONFIGURE]\` | |
| Max story points per sprint | 20 | \`[CONFIGURE]\` | |
| Max lines in \`BACKLOG.md\` | 150 | \`[CONFIGURE]\` | |
| Max size of \`BACKLOG.md\` | 30KB | \`[CONFIGURE]\` | |
| Max USs in active backlog | 15 | \`[CONFIGURE]\` | |
| Max modules touched per sprint | 1 | \`[CONFIGURE]\` | |
| Max unreviewed sessions | 2 | \`[CONFIGURE]\` | |
Agent hours/week:     [CONFIGURE]
Avg hours/US:         [CONFIGURE]  (start with 4h; adjust after sprint 1)
Raw max USs:          [CONFIGURE]
Buffered max USs:     [CONFIGURE]  (raw × 0.8)
Max points:           [CONFIGURE]
| [MODULE_NAME] | \`[path]\` | \`[0-3]\` | \`[CONFIGURE]\` | \`[CONFIGURE]\` | |
| [MODULE_NAME] | \`[CONFIGURE]\` | \`[CONFIGURE]\` | \`< 10%\` | \`[CONFIGURE]\` |
**Sprint ID:** \`[SPRINT_ID]\`
**Sprint dates:** \`[START_DATE]\` → \`[END_DATE]\`
**Module(s) in scope:** \`[MODULE_NAME]\`
**Sprint goal:** \`[ONE_SENTENCE_GOAL]\`
| USs | \`[MAX_US]\` | 0 | ✅ |
| Points | \`[MAX_PTS]\` | 0 | ✅ |
| Modules | \`[MAX_MOD]\` | 0 | ✅ |
| [AGENT_1_NAME] | [CONFIGURE] | e.g. Claude Sonnet
| [AGENT_2_NAME] | [CONFIGURE] | e.g. Gemini
`.trimStart();

function makeS1(overrides = {}) {
  return {
    agentRows: [{ agent: 'Claude Code', hours: 40 }],
    sessionLen: '5',
    cadenceIdx: 1,
    maxUnreviewed: '2',
    moduleCount: 1,
    modulesInSprint: '1',
    maxModules: '1',
    releaseIdx: 0,
    debtIdx: 0,
    ...overrides,
  };
}

function makeS2(overrides = {}) {
  return {
    totalHours: 40,
    avgHoursPerUS: 4,
    rawMax: 10,
    buffered: 8,
    maxPoints: 24,
    sprintLen: '1 week',
    maxUSs: '8',
    maxPts: '24',
    maxLines: '150',
    maxKB: '30',
    maxActiveUS: '15',
    ...overrides,
  };
}

const MODULES = [{ name: 'core', path: 'src/', notes: 'main module' }];
const S5 = { today: '2026-05-25', sprintEnd: '2026-06-01' };

// ── buildConfig ───────────────────────────────────────────────────────────────

describe('buildConfig', () => {
  it('replaces session length placeholder', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1({ sessionLen: '6' }), makeS2(), MODULES, S5);
    expect(result).toContain('`6` hours');
    expect(result).not.toContain('`[CONFIGURE]` hours');
  });

  it('checks the correct cadence option', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1({ cadenceIdx: 1 }), makeS2(), MODULES, S5);
    expect(result).toContain('[x] Next available window');
    expect(result).toContain('[ ] End of every agent session');
  });

  it('checks the correct release cadence option', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1({ releaseIdx: 0 }), makeS2(), MODULES, S5);
    expect(result).toContain('[x] Continuous by module maturity');
  });

  it('replaces max unreviewed sessions', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1({ maxUnreviewed: '3' }), makeS2(), MODULES, S5);
    expect(result).toContain('`3`');
  });

  it('fills capacity table fields', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1(), makeS2({ maxUSs: '5', maxPts: '15' }), MODULES, S5);
    expect(result).toContain('`5`');
    expect(result).toContain('`15`');
  });

  it('fills formula block', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1(), makeS2({ totalHours: 40, rawMax: 10, buffered: 8, maxPoints: 24, avgHoursPerUS: 4 }), MODULES, S5);
    expect(result).toContain('Agent hours/week:     40');
    expect(result).toContain('Raw max USs:          10');
    expect(result).toContain('Buffered max USs:     8');
  });

  it('injects module registry row', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1(), makeS2(), MODULES, S5);
    expect(result).toContain('| core |');
    expect(result).not.toContain('[MODULE_NAME]');
  });

  it('fills sprint dates', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1(), makeS2(), MODULES, S5);
    expect(result).toContain('2026-05-25');
    expect(result).toContain('2026-06-01');
  });

  it('sets Sprint ID to Sprint 00', () => {
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1(), makeS2(), MODULES, S5);
    expect(result).toContain('`Sprint 00`');
  });

  it('is idempotent — applying same inputs twice yields same output', () => {
    const s1 = makeS1();
    const s2 = makeS2();
    const first  = buildConfig(TEMPLATE_SNIPPET, s1, s2, MODULES, S5);
    const second = buildConfig(TEMPLATE_SNIPPET, s1, s2, MODULES, S5);
    expect(first).toBe(second);
  });

  it('handles multiple modules', () => {
    const mods = [
      { name: 'api', path: 'src/api/', notes: '' },
      { name: 'worker', path: 'src/worker/', notes: 'async' },
    ];
    const result = buildConfig(TEMPLATE_SNIPPET, makeS1({ moduleCount: 2 }), makeS2(), mods, S5);
    expect(result).toContain('| api |');
    expect(result).toContain('| worker |');
  });
});

// ── writeConfig / readConfigFile ──────────────────────────────────────────────

describe('writeConfig + readConfigFile', () => {
  let tmpDir: string;
  let filePath: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `agile-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    filePath = join(tmpDir, 'AGILE_CONFIG.md');
  });

  it('writes and reads back identical content', () => {
    const content = '# Test\nHello world\n';
    writeConfig(filePath, content);
    expect(readConfigFile(filePath)).toBe(content);
  });

  it('write is idempotent — second write overwrites cleanly', () => {
    const content = '# Config\nvalue: 42\n';
    writeConfig(filePath, content);
    writeConfig(filePath, content);
    expect(readConfigFile(filePath)).toBe(content);
  });

  it('second write with new content replaces old content entirely', () => {
    writeConfig(filePath, 'old content\n');
    writeConfig(filePath, 'new content\n');
    expect(readConfigFile(filePath)).toBe('new content\n');
    expect(readConfigFile(filePath)).not.toContain('old');
  });

  it('preserves UTF-8 characters', () => {
    const content = '# Config\nAgent: Claude 🤖\nÇ ã ê\n';
    writeConfig(filePath, content);
    expect(readConfigFile(filePath)).toBe(content);
  });
});
