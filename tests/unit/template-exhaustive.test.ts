import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(__dirname, '../../');
const rfcsDir = path.join(rootDir, 'rfcs');

const TEMPLATE_FILES = new Set(['TEMPLATE.yaml', 'TEMPLATE.md', '.env.example']);

// ---------------------------------------------------------------------------
// 1. Placeholder validation
// ---------------------------------------------------------------------------
describe('Placeholder Validation', () => {


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

  it('all RFC files have sequential IDs starting from 001 with no gaps and matching filenames', () => {
    const files = getRfcFiles();
    if (files.length === 0) return;

    // Parse each RFC and map its number
    const parsedRfcs = files.map((file) => {
      // Filename convention check
      const match = /^RFC-(\d{3})(?:-([\w-]+))?\.yaml$/.exec(file);
      expect(match, `RFC file name "${file}" does not follow the convention RFC-NNN[-slug].yaml`).not.toBeNull();
      
      const numStr = match![1]!;
      const num = parseInt(numStr, 10);
      
      const content = fs.readFileSync(path.join(rfcsDir, file), 'utf-8');
      const parsed = parseSimpleYaml(content);
      const internalId = parsed['id'];
      
      expect(internalId, `RFC "${file}" is missing its internal "id"`).toBeDefined();
      expect(internalId, `RFC "${file}" has internal ID "${internalId}" but filename specifies "RFC-${numStr}"`).toBe(`RFC-${numStr}`);

      return { file, num };
    });

    // Sort by RFC number
    parsedRfcs.sort((a, b) => a.num - b.num);

    // Verify sequential starting from 1
    parsedRfcs.forEach((rfc, index) => {
      const expectedNum = index + 1;
      expect(rfc.num, `RFC sequence gap or non-sequential starting: file "${rfc.file}" is at position ${expectedNum} but has number ${rfc.num}`).toBe(expectedNum);
    });
  });
});
