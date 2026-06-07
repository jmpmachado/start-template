#!/usr/bin/env node
// check-drift.js — local drift detection for template health
// Usage: node scripts/check-drift.js  OR  npm run check-drift
// Output format mirrors [CRACK DETECTED: ...] for agent compatibility.
// Never modifies any file. Exit 0 = clean. Exit 1 = findings.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');

// ─── EOL table (update quarterly — Node.js releases April/October) ────────────
// Source: https://nodejs.org/en/about/previous-releases
// update quarterly — Node.js releases April/October. Source: https://nodejs.org/en/about/previous-releases
const NODE_EOL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
const NODE_MAINTENANCE = []; // Node 24 is Active LTS (EOL 2028-04-30) — no Maintenance LTS versions currently tracked

// ─── files excluded from [CONFIGURE] scan (intentional placeholders) ─────────
const CONFIGURE_EXCLUDE = [
  'node_modules', '.git', 'dist', 'coverage',
  'USER_GUIDE.md',                                    // documents the placeholder syntax
  'PROJECT_PLAYBOOK.md',                              // adoption guide — placeholders are instructional
  'CONTRIBUTING.md',
  'rfcs/TEMPLATE.yaml',
  'scripts/check-drift.js',                           // this file
  'utils',                                            // integrated third-party utilities
  '.agent/context/AGILE_GUIDE.md',                    // template doc — [CONFIGURE] is instructional
  'tests/unit/agile-config.test.ts',                  // test fixture — [CONFIGURE] strings are the expected values under test, not unfilled placeholders
  '.claude/commands/map-lint.md',                     // describes [CONFIGURE] as a pattern to detect, not an unfilled field
  'BRANCHES.md',                                      // references [CONFIGURE] as a token in hypothesis/test descriptions, not an unfilled placeholder
  '.agent/context/BACKLOG.md',                        // AC text references [CONFIGURE] as a token concept, not an unfilled field
  '.agent/context/DECISION_LOG.md',                   // historical decision entries reference [CONFIGURE] as a concept
  'MIGRATION_GUIDE.md',                               // troubleshooting table uses [CONFIGURE] as a documented token name
];

// ─── helpers ──────────────────────────────────────────────────────────────────

const findings = [];

function crack(severity, location, description) {
  findings.push({ severity, location, description });
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function walk(dir, exts, exclude, cb) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = full.slice(ROOT.length + 1).replace(/\\/g, '/');
    if (exclude.some(x => rel.startsWith(x) || e.name === x)) continue;
    if (e.isDirectory()) { walk(full, exts, exclude, cb); continue; }
    if (exts.length && !exts.includes(extname(e.name))) continue;
    cb(full, rel);
  }
}

/** Emits high/low findings when engines.node declares an EOL or Maintenance LTS version. */
function checkNodeVersion() {
  const pkg = readJson(join(ROOT, 'package.json'));
  if (!pkg?.engines?.node) {
    crack('medium', 'package.json', 'engines.node field is missing — version constraint unenforceable');
    return;
  }
  const raw = pkg.engines.node;
  // extract leading major version numbers only: >=22.0.0 → 22, ^22 → 22, 22.x → 22
  // match digits that appear at a word boundary or after comparison operators, not after a dot
  const majors = [...raw.matchAll(/(?:^|[>=^~\s])(\d+)(?:\.|x|$|\s)/g)].map(m => String(parseInt(m[1], 10)));
  for (const major of majors) {
    if (NODE_EOL.includes(major)) {
      crack('high', 'package.json', `engines.node references Node.js ${major} which has reached EOL — no security patches available`);
    } else if (NODE_MAINTENANCE.includes(major)) {
      crack('low', 'package.json', `engines.node references Node.js ${major} (Maintenance LTS) — plan upgrade to Active LTS within 12 months`);
    }
  }
}

/** Emits medium/high findings for unfilled [CONFIGURE] tokens in non-template files.
 * AGILE_CONFIG.md with ≥ 10 unfilled placeholders → high (wizard was never run).
 * All other files, or AGILE_CONFIG.md with 1–9 → medium. */
function checkConfigurePlaceholders() {
  const pattern = /\[CONFIGURE\]/;
  walk(ROOT, ['.md', '.yaml', '.yml', '.json', '.ts', '.js'], CONFIGURE_EXCLUDE, (full, rel) => {
    // skip .agent/context/AGILE_CONFIG.md only if it is the actual template copy (not yet filled)
    if (rel === '.agent/context/AGILE_CONFIG.md') return;
    const content = readFileSync(full, 'utf8');
    const lines = content.split('\n');
    const hits = lines.map((l, i) => ({ n: i + 1, l })).filter(({ l }) => pattern.test(l));
    if (hits.length === 0) return;
    const isAgileConfig = rel === 'AGILE_CONFIG.md' || rel.endsWith('/AGILE_CONFIG.md');
    const severity = (isAgileConfig && hits.length >= 10) ? 'high' : 'medium';
    const hint = (severity === 'high')
      ? ' — wizard was never run; see MIGRATION_GUIDE.md §A step 3'
      : '';
    crack(severity, rel, `contains ${hits.length} unfilled [CONFIGURE] placeholder(s)${hint} — lines: ${hits.map(h => h.n).join(', ')}`);
  });
}

/** Emits high findings if documentation.test.ts is missing or contains skip/only modifiers. */
function checkTestIntegrity() {
  const testPath = join(ROOT, 'tests', 'unit', 'documentation.test.ts');
  if (!existsSync(testPath)) {
    crack('high', 'tests/unit/documentation.test.ts', 'file is missing — AGENTS.md guard is unenforceable');
    return;
  }
  const content = readFileSync(testPath, 'utf8');
  const weakeners = ['it.skip', 'test.skip', 'describe.skip', 'it.todo', 'test.todo', 'it.only', 'test.only'];
  for (const w of weakeners) {
    if (content.includes(w)) {
      crack('high', 'tests/unit/documentation.test.ts', `contains "${w}" — guard test has been weakened or bypassed`);
    }
  }
}

/** Emits a high finding if npm audit reports any high/critical severity vulnerabilities. */
function checkNpmAudit() {
  try {
    execSync('npm audit --audit-level=high --json', { cwd: ROOT, stdio: 'pipe' });
  } catch (e) {
    let count = '?';
    try {
      const report = JSON.parse(e.stdout?.toString() ?? '{}');
      const vulns = report?.metadata?.vulnerabilities ?? {};
      count = (vulns.high ?? 0) + (vulns.critical ?? 0);
    } catch { /* ignore parse failure */ }
    crack('high', 'package-lock.json', `npm audit found ${count} high/critical severity vulnerabilities — run "npm audit" for details`);
  }
}

/** Emits a finding if AGILE_CONFIG.md still contains unfilled [CONFIGURE] placeholders.
 *  ≥ 10 placeholders → high (wizard was never run); < 10 → medium (partial fill). */
function checkAgileConfigFilled() {
  const configPath = join(ROOT, '.agent', 'context', 'AGILE_CONFIG.md');
  if (!existsSync(configPath)) {
    crack('high', '.agent/context/AGILE_CONFIG.md', 'file not found — adoption wizard has not been run; see MIGRATION_GUIDE.md §A step 3');
    return;
  }
  const content = readFileSync(configPath, 'utf8');
  const count = (content.match(/\[CONFIGURE\]/g) ?? []).length;
  if (count >= 10) {
    crack('high', '.agent/context/AGILE_CONFIG.md', `template not configured — ${count} unfilled [CONFIGURE] placeholders; configure manually in .agent/context/AGILE_CONFIG.md (see MIGRATION_GUIDE.md)`);
  } else if (count > 0) {
    crack('medium', '.agent/context/AGILE_CONFIG.md', `contains ${count} unfilled [CONFIGURE] placeholder(s) — fill manually`);
  }
}

/** Emits high/low findings for open Must-Have/Should-Have/Could-Have rows in BACKLOG.md.
 *  MoSCoW precedence: Must/Should open → high; Could open → low; Won't Have always excluded. */
function checkBacklogOpenItems() {
  const backlogPath = join(ROOT, '.agent', 'context', 'BACKLOG.md');
  if (!existsSync(backlogPath)) return; // no backlog = no project yet, skip

  const lines = readFileSync(backlogPath, 'utf8').split('\n');

  // Track which MoSCoW section we are in
  let section = '';
  const openBySection = { 'Must Have': [], 'Should Have': [], 'Could Have': [] };

  for (const line of lines) {
    const sectionMatch = line.match(/###\s+(Must Have|Should Have|Could Have|Won't Have)/);
    if (sectionMatch) { section = sectionMatch[1]; continue; }
    if (section === "Won't Have") continue; // intentionally open — skip

    // Match table rows ending with | Open | (with optional whitespace)
    if (/\|\s*Open\s*\|/.test(line) && openBySection[section]) {
      const idMatch = line.match(/\|\s*(US-[\w-]+)/);
      const id = idMatch ? idMatch[1].trim() : '(unknown)';
      openBySection[section].push(id);
    }
  }

  const mustShouldOpen = [...openBySection['Must Have'], ...openBySection['Should Have']];
  const couldOpen = openBySection['Could Have'];

  if (mustShouldOpen.length > 0) {
    crack('high', '.agent/context/BACKLOG.md',
      `${mustShouldOpen.length} Must Have / Should Have US(s) still Open — resolve before template upgrade: ${mustShouldOpen.join(', ')}`);
  }
  if (couldOpen.length > 0) {
    crack('low', '.agent/context/BACKLOG.md',
      `${couldOpen.length} Could Have US(s) still Open (non-blocking for upgrade, review before publish): ${couldOpen.join(', ')}`);
  }
}

/** Emits a medium finding if the active sprint end date has passed but AGILE_CONFIG.md §5 still has unclosed USs. */
function checkActiveSprintStaleness() {
  const configPath = join(ROOT, '.agent', 'context', 'AGILE_CONFIG.md');
  if (!existsSync(configPath)) return;

  const content = readFileSync(configPath, 'utf8');

  // Extract sprint end date from: **Sprint dates:** `YYYY-MM-DD` → `YYYY-MM-DD`
  const dateMatch = content.match(/\*\*Sprint dates:\*\*\s*`[\d-]+`\s*→\s*`(\d{4}-\d{2}-\d{2})`/);
  if (!dateMatch) return; // template not yet filled — check 5 already covers this

  const endDate = new Date(dateMatch[1]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (endDate >= today) return; // sprint still active or ends today

  // Sprint is past due — check for unclosed USs in §5 Active USs table
  const activeSection = content.match(/### Active USs[\s\S]*?(?=###|$)/);
  if (!activeSection) return;

  const pendingRows = activeSection[0]
    .split('\n')
    .filter(l => /\|\s*(In Progress|Pending|Blocked)\s*\|/i.test(l));

  if (pendingRows.length > 0) {
    const days = Math.floor((today - endDate) / 86400000);
    crack('medium', '.agent/context/AGILE_CONFIG.md',
      `sprint ended ${days} day(s) ago but §5 still has ${pendingRows.length} US(s) in non-terminal status — close sprint or update §5 before upgrade`);
  }
}

/** Emits high/medium findings when BACKLOG.md exceeds the line/KB limits configured in AGILE_CONFIG.md §2 (defaults: 150 lines, 30 KB). */
function checkBacklogSize() {
  const backlogPath = join(ROOT, '.agent', 'context', 'BACKLOG.md');
  if (!existsSync(backlogPath)) return;

  const configPath = join(ROOT, '.agent', 'context', 'AGILE_CONFIG.md');
  let maxLines = 150;
  let maxKB = 30;

  if (existsSync(configPath)) {
    const cfg = readFileSync(configPath, 'utf8');
    // Extract from table row: | Max lines in `BACKLOG.md` | 150 | `NNN` | ... |
    const linesMatch = cfg.match(/Max lines in `BACKLOG\.md`[^|]*\|[^|]*\|\s*`(\d+)`/);
    if (linesMatch) maxLines = parseInt(linesMatch[1], 10);
    // Extract from table row: | Max size of `BACKLOG.md` | 30KB | `NNN` | ... |
    const kbMatch = cfg.match(/Max size of `BACKLOG\.md`[^|]*\|[^|]*\|\s*`(\d+)KB?`/i);
    if (kbMatch) maxKB = parseInt(kbMatch[1], 10);
  }

  const content = readFileSync(backlogPath, 'utf8');
  const lines = content.split('\n').length;
  const kb = Buffer.byteLength(content, 'utf8') / 1024;

  if (lines > maxLines) {
    crack('high', '.agent/context/BACKLOG.md',
      `${lines} lines exceeds configured limit of ${maxLines} — agent context ceiling breached; compact backlog before next session`);
  } else if (lines > maxLines * 0.9) {
    crack('medium', '.agent/context/BACKLOG.md',
      `${lines} lines is within 10% of the configured limit (${maxLines}) — compact soon to avoid context ceiling`);
  }

  if (kb > maxKB) {
    crack('high', '.agent/context/BACKLOG.md',
      `${kb.toFixed(1)}KB exceeds configured size limit of ${maxKB}KB — compact backlog before next session`);
  }
}

/** Emits a medium finding for any RFC in draft/review status that has not been modified in more than 60 days. */
function checkStaleRFCs() {
  const rfcsDir = join(ROOT, 'rfcs');
  if (!existsSync(rfcsDir)) return;

  const STALE_DAYS = 60;
  const today = new Date();
  let entries;
  try { entries = readdirSync(rfcsDir).filter(f => f.endsWith('.yaml') && f !== 'TEMPLATE.yaml'); }
  catch { return; }

  for (const file of entries) {
    const full = join(rfcsDir, file);
    const content = readFileSync(full, 'utf8');

    // Only flag RFCs stuck in draft or review
    const statusMatch = content.match(/^status:\s*['"]?(draft|review)['"]?/mi);
    if (!statusMatch) continue;

    // Try git log first for last commit date on this file
    let lastModified;
    try {
      const gitDate = execSync(`git log -1 --format=%aI -- "${file}"`, { cwd: rfcsDir, stdio: 'pipe' })
        .toString().trim();
      lastModified = gitDate ? new Date(gitDate) : null;
    } catch { lastModified = null; }

    if (!lastModified) {
      try { lastModified = new Date(statSync(full).mtime); }
      catch { continue; }
    }

    const ageDays = Math.floor((today - lastModified) / 86400000);
    if (ageDays > STALE_DAYS) {
      crack('medium', `rfcs/${file}`,
        `status is "${statusMatch[1]}" and has not been updated in ${ageDays} days — accept, reject, or supersede before upgrade`);
    }
  }
}

// ─── ENG-134: checkMemoryJson — backported from engine-cpp (CLAUDE.md Rule 11) ──

function checkMemoryJson() {
  const memPath = join(ROOT, '.agent', 'memory.json');
  if (!existsSync(memPath)) {
    crack('high', '.agent/memory.json', 'file is missing — memory log is required by CLAUDE.md Rule 11');
    return;
  }
  let memory;
  try {
    memory = JSON.parse(readFileSync(memPath, 'utf8'));
  } catch {
    crack('high', '.agent/memory.json', 'file is not valid JSON');
    return;
  }
  if (!Array.isArray(memory)) {
    crack('high', '.agent/memory.json', 'memory file root must be a JSON array');
    return;
  }
  const ISO8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
  const SEVERITIES = ['high', 'med', 'low'];
  const REQUIRED = ['id', 'parent_id', 'timestamp', 'severity', 'scope', 'summary', 'source_commit'];
  for (let i = 0; i < memory.length; i++) {
    const entry = memory[i];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      crack('high', '.agent/memory.json', `entry at index ${i} is not a JSON object`);
      continue;
    }
    let missing = false;
    for (const req of REQUIRED) {
      if (!(req in entry)) {
        crack('high', '.agent/memory.json', `entry at index ${i} is missing required field "${req}"`);
        missing = true;
      }
    }
    if (missing) continue;
    if (i === 0 && entry.parent_id !== null)
      crack('high', '.agent/memory.json', 'first entry parent_id must be null');
    if (i > 0 && (entry.parent_id === null || typeof entry.parent_id !== 'string'))
      crack('high', '.agent/memory.json', `entry at index ${i} has non-string parent_id`);
    if (typeof entry.timestamp !== 'string' || !ISO8601_RE.test(entry.timestamp))
      crack('high', '.agent/memory.json', `entry at index ${i} has invalid ISO8601 timestamp`);
    if (!SEVERITIES.includes(entry.severity))
      crack('high', '.agent/memory.json', `entry at index ${i} has invalid severity: "${entry.severity}"`);
    if (!Array.isArray(entry.scope))
      crack('high', '.agent/memory.json', `entry at index ${i} scope is not an array`);
    if (typeof entry.summary !== 'string' || entry.summary.trim() === '')
      crack('high', '.agent/memory.json', `entry at index ${i} has empty summary`);
    if (typeof entry.source_commit !== 'string' || entry.source_commit.trim() === '')
      crack('high', '.agent/memory.json', `entry at index ${i} has empty source_commit`);
  }
}

// ─── run all checks ───────────────────────────────────────────────────────────

console.log('\n  check-drift — template health scan');
console.log('  ' + '─'.repeat(60));

checkNodeVersion();
checkConfigurePlaceholders();
checkTestIntegrity();
checkNpmAudit();
checkAgileConfigFilled();
checkBacklogOpenItems();
checkActiveSprintStaleness();
checkBacklogSize();
checkStaleRFCs();
checkMemoryJson();

// ─── report ───────────────────────────────────────────────────────────────────

if (findings.length === 0) {
  console.log('\n  ✅ No drift findings. Template is healthy.\n');
  process.exit(0);
}

const order = { high: 0, medium: 1, low: 2 };
findings.sort((a, b) => order[a.severity] - order[b.severity]);

console.log('');
for (const f of findings) {
  const icon = f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🔵';
  console.log(`  ${icon} [CRACK DETECTED: ${f.location} — ${f.description} — severity: ${f.severity}]`);
}

const highs = findings.filter(f => f.severity === 'high').length;
console.log(`\n  ${findings.length} finding(s) — ${highs} high severity.\n`);
process.exit(highs > 0 ? 1 : 0);
