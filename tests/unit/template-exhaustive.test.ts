import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(__dirname, '../../');
const contextDir = path.join(rootDir, '.agent/context');
const rfcsDir = path.join(rootDir, 'rfcs');

const TEMPLATE_FILES = new Set(['TEMPLATE.yaml', 'TEMPLATE.md', '.env.example']);

// ---------------------------------------------------------------------------
// 1. Placeholder validation
// ---------------------------------------------------------------------------
describe('Placeholder Validation', () => {

  // Placeholder patterns that signal an unfilled template slot
  const PLACEHOLDER_RE = /\[PROJECT_NAME\]|\[STACK\]|\[LANGUAGE\]|\[YYYY-MM-DD\]|\[ORG\]|\[ENV_VAR_NAME\]|\[SECRET_NAME\]/;

  it('context files should not contain unfilled placeholders (except known template files)', () => {
    const mdFiles = fs.readdirSync(contextDir).filter((f) => f.endsWith('.md') && !TEMPLATE_FILES.has(f));
    const snapshot: Record<string, number> = {};
    mdFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(contextDir, file), 'utf-8');
      const stripped = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
      const count = stripped.split('\n').filter(
        (l) => PLACEHOLDER_RE.test(l) && !l.trimStart().startsWith('>'),
      ).length;
      if (count > 0) snapshot[file] = count;
    });

    // Intentional template placeholders — snapshot per file so regressions are locatable.
    // Run `npx vitest run --update-snapshots` only after a deliberate template change.
    expect(snapshot).toMatchSnapshot();
  });

  it('rfcs (non-template) should not contain placeholder ids', () => {
    if (!fs.existsSync(rfcsDir)) return;
    const rfcFiles = fs.readdirSync(rfcsDir)
      .filter((f) => f.endsWith('.yaml') && !TEMPLATE_FILES.has(f));
    const violations: string[] = [];
    rfcFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(rfcsDir, file), 'utf-8');
      if (/^id:\s*RFC-XXX/m.test(content)) violations.push(file);
    });
    expect(violations, `RFCs with unfilled id placeholder: ${violations.join(', ')}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. RFC YAML schema validation
// ---------------------------------------------------------------------------
describe('RFC Schema Validation', () => {
  const REQUIRED_TOP_KEYS = ['id', 'title', 'criticality', 'governance', 'complexity', 'probability'];
  const CRITICALITY_VALUES = new Set(['critical', 'high', 'medium', 'low']);
  const GOVERNANCE_KEYS = ['completeness', 'security', 'testability', 'rollback', 'observability', 'ownership'];
  const COMPLEXITY_KEYS = ['technical', 'critical_deps', 'change_scope', 'tech_novelty'];
  const PROBABILITY_KEYS = ['failure_history', 'team_maturity', 'requirement_ambiguity', 'deadline_pressure'];

  function getRfcFiles() {
    if (!fs.existsSync(rfcsDir)) return [];
    return fs.readdirSync(rfcsDir).filter((f) => f.endsWith('.yaml') && !TEMPLATE_FILES.has(f));
  }

  function parseSimpleYaml(content: string): Record<string, unknown> {
    // Minimal YAML parser — handles flat key: value and nested blocks.
    // Falls back to raw line scan for numeric fields. Not a full YAML parser.
    const result: Record<string, unknown> = {};
    let currentBlock: string | null = null;
    for (const raw of content.split('\n')) {
      const line = raw.replace(/#.*$/, '').trimEnd(); // strip inline comments
      if (!line.trim()) continue;
      const blockMatch = /^(\w+):/.exec(line);
      const fieldMatch = /^\s{2,}(\w+):\s*(-?\d+(?:\.\d+)?)/.exec(line);
      const topScalarMatch = /^(\w+):\s*"?([^"#\n]+)"?\s*$/.exec(line);
      if (fieldMatch && currentBlock) {
        const block = (result[currentBlock] as Record<string, number> | undefined) ?? {};
        block[fieldMatch[1]!] = parseFloat(fieldMatch[2]!);
        result[currentBlock] = block;
      } else if (blockMatch && !line.includes(' ')) {
        currentBlock = blockMatch[1] ?? null;
        if (currentBlock && !(currentBlock in result)) result[currentBlock] = {};
      } else if (topScalarMatch) {
        currentBlock = null;
        result[topScalarMatch[1]!] = topScalarMatch[2]!.trim();
      }
    }
    return result;
  }

  it('all RFC files have required top-level keys', () => {
    const missing: string[] = [];
    for (const file of getRfcFiles()) {
      const content = fs.readFileSync(path.join(rfcsDir, file), 'utf-8');
      const parsed = parseSimpleYaml(content);
      const absent = REQUIRED_TOP_KEYS.filter((k) => !(k in parsed));
      if (absent.length > 0) missing.push(`${file}: missing [${absent.join(', ')}]`);
    }
    expect(missing, `RFCs with missing keys:\n${missing.join('\n')}`).toEqual([]);
  });

  it('all RFC files have valid criticality value', () => {
    const invalid: string[] = [];
    for (const file of getRfcFiles()) {
      const content = fs.readFileSync(path.join(rfcsDir, file), 'utf-8');
      const parsed = parseSimpleYaml(content);
      const val = String(parsed['criticality'] ?? '').toLowerCase().trim();
      if (!CRITICALITY_VALUES.has(val)) invalid.push(`${file}: "${val}"`);
    }
    expect(invalid, `RFCs with invalid criticality:\n${invalid.join('\n')}`).toEqual([]);
  });

  it('all RFC governance/complexity/probability scores are in 0–10 range', () => {
    const outOfRange: string[] = [];
    for (const file of getRfcFiles()) {
      const content = fs.readFileSync(path.join(rfcsDir, file), 'utf-8');
      const parsed = parseSimpleYaml(content);
      const checks: Array<[string, string[]]> = [
        ['governance', GOVERNANCE_KEYS],
        ['complexity', COMPLEXITY_KEYS],
        ['probability', PROBABILITY_KEYS],
      ];
      for (const [block, keys] of checks) {
        const section = parsed[block] as Record<string, number> | undefined;
        if (!section) continue;
        for (const key of keys) {
          if (!(key in section)) continue;
          const val = section[key];
          if (typeof val !== 'number' || val < 0 || val > 10) {
            outOfRange.push(`${file}: ${block}.${key} = ${val}`);
          }
        }
      }
    }
    expect(outOfRange, `RFC scores out of 0–10 range:\n${outOfRange.join('\n')}`).toEqual([]);
  });

  it('all RFC governance/complexity/probability sections have all required keys', () => {
    const missing: string[] = [];
    for (const file of getRfcFiles()) {
      const content = fs.readFileSync(path.join(rfcsDir, file), 'utf-8');
      const parsed = parseSimpleYaml(content);
      const checks: Array<[string, string[]]> = [
        ['governance', GOVERNANCE_KEYS],
        ['complexity', COMPLEXITY_KEYS],
        ['probability', PROBABILITY_KEYS],
      ];
      for (const [block, keys] of checks) {
        const section = parsed[block] as Record<string, number> | undefined;
        if (!section) { missing.push(`${file}: missing block [${block}]`); continue; }
        const absent = keys.filter((k) => !(k in section));
        if (absent.length > 0) missing.push(`${file}: ${block} missing [${absent.join(', ')}]`);
      }
    }
    expect(missing, `RFC sections with missing keys:\n${missing.join('\n')}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Context file intro blockquote
// ---------------------------------------------------------------------------
describe('Context File Structure', () => {
  it('every context file should have a blockquote (>) description near the top', () => {
    const mdFiles = fs.readdirSync(contextDir).filter((f) => f.endsWith('.md'));
    const missing: string[] = [];
    mdFiles.forEach((file) => {
      const lines = fs.readFileSync(path.join(contextDir, file), 'utf-8').split('\n');
      // Check first 15 non-empty lines for a blockquote
      const preview = lines.filter((l) => l.trim()).slice(0, 15);
      if (!preview.some((l) => l.trimStart().startsWith('>'))) {
        missing.push(file);
      }
    });
    expect(missing, `Context files missing blockquote description:\n${missing.join('\n')}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. CLAUDE.md / GEMINI.md operating rules coherence
// ---------------------------------------------------------------------------
describe('Agent Instruction Coherence', () => {
  const OPERATING_RULES = [
    'AGENTS.md Guard',
    'Target Stack Consistency',
    'Doc Avoidance Exception',
    'Pre-commit gate',
    'Dependency Guard',
    'Destructive operations',
    'Silent CLASS_MAP edits are prohibited',
  ];

  function checkRules(filePath: string) {
    if (!fs.existsSync(filePath)) return null; // file optional
    const content = fs.readFileSync(filePath, 'utf-8');
    return OPERATING_RULES.filter((rule) => !content.includes(rule));
  }

  it('CLAUDE.md contains all required operating rules', () => {
    const absent = checkRules(path.join(rootDir, 'CLAUDE.md'));
    if (absent === null) return; // file doesn't exist — skip
    expect(absent, `CLAUDE.md missing rules: ${absent.join(', ')}`).toEqual([]);
  });

  it('GEMINI.md contains all required operating rules (if present)', () => {
    const geminiPath = path.join(rootDir, 'GEMINI.md');
    if (!fs.existsSync(geminiPath)) return; // optional file
    const absent = checkRules(geminiPath);
    expect(absent, `GEMINI.md missing rules: ${absent?.join(', ')}`).toEqual([]);
  });
});
