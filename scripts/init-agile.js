#!/usr/bin/env node
// init-agile.js — DEPRECATED. Use infra/scripts/wizard.py instead (see DL-017).
// This file is retained for reference. It will not be invoked by npm run init-agile.
// Run the canonical wizard: python infra/scripts/wizard.py
//
// init-agile.js — interactive wizard for AGILE_CONFIG.md + PROJECT_PLAYBOOK.md gates
// Run: node scripts/init-agile.js  OR  npm run init-agile
// Requires Node.js 22+. No external dependencies.

import { createInterface } from 'node:readline/promises';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import {
  interviewSection1, interviewSection2, interviewSection3, interviewSection5,
  buildConfig, writeConfig, readConfigFile,
} from './lib/agile-config.js';

const ROOT = resolve(import.meta.dirname, '..');
const AGILE_CONFIG = join(ROOT, '.agent', 'context', 'AGILE_CONFIG.md');
const DECISION_LOG = join(ROOT, '.agent', 'context', 'DECISION_LOG.md');

const rl = createInterface({ input: process.stdin, output: process.stdout });

// ─── helpers ──────────────────────────────────────────────────────────────────

const hr = () => console.log('\n' + '─'.repeat(72));
const section = (title) => { hr(); console.log(`  ${title}`); hr(); };
const note = (msg) => console.log(`  ℹ  ${msg}`);
const warn = (msg) => console.log(`  ⚠  ${msg}`);
const stop = (msg) => { console.log(`\n  🔴 STOP: ${msg}\n`); process.exit(1); }

async function ask(prompt, defaultVal = '') {
  const hint = defaultVal ? ` [${defaultVal}]` : '';
  const raw = await rl.question(`  → ${prompt}${hint}: `);
  return raw.trim() || defaultVal;
}

async function choose(prompt, options, defaultIdx = 0) {
  console.log(`\n  ${prompt}`);
  options.forEach((o, i) => console.log(`    ${i + 1}) ${o}`));
  const raw = await rl.question(`  → Choice [${defaultIdx + 1}]: `);
  const idx = parseInt(raw, 10) - 1;
  return (idx >= 0 && idx < options.length) ? idx : defaultIdx;
}

async function confirm(prompt, defaultYes = true) {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const raw = await rl.question(`  → ${prompt} (${hint}): `);
  if (!raw.trim()) return defaultYes;
  return raw.trim().toLowerCase().startsWith('y');
}

function checkConfigExists() {
  if (!existsSync(AGILE_CONFIG)) stop(`AGILE_CONFIG.md not found at ${AGILE_CONFIG}`);
}

function appendDecisionLog(entry) {
  if (!existsSync(DECISION_LOG)) return;
  const content = readFileSync(DECISION_LOG, 'utf8');
  const insertAfter = '# Decision Log';
  const idx = content.indexOf('\n', content.indexOf(insertAfter));
  if (idx === -1) return;
  const updated = content.slice(0, idx + 1) + '\n' + entry + '\n' + content.slice(idx + 1);
  writeFileSync(DECISION_LOG, updated, 'utf8');
}

// ─── gate tracker ─────────────────────────────────────────────────────────────

const gates = {
  phase0: { label: 'Phase 0 — Prerequisites', items: [], decision: null },
  phase1: { label: 'Phase 1 — Bootstrap', items: [], decision: null },
  phase2: { label: 'Phase 2 — Agile Config', items: [], decision: null },
  phase3: { label: 'Phase 3 — Architecture', items: [], decision: null },
  phase4: { label: 'Phase 4 — Agent Contracts', items: [], decision: null },
  phase5: { label: 'Phase 5 — Sprint 0', items: [], decision: null },
};

async function runGate(phaseKey, mandatoryItems, optionalItems = []) {
  const gate = gates[phaseKey];
  section(`Go/No-Go Gate — ${gate.label}`);
  note('All 🔴 mandatory items must be confirmed. 🟡 items must be confirmed or deferred.');
  console.log();

  const results = [];

  for (const item of mandatoryItems) {
    const ok = await confirm(`🔴 ${item}`, false);
    results.push({ item, priority: 'mandatory', ok });
    if (!ok) warn('Item not confirmed — gate will be HOLD or NO-GO');
  }

  for (const item of optionalItems) {
    const ok = await confirm(`🟡 ${item}`, true);
    let deferred = false;
    if (!ok) {
      deferred = await confirm('   Defer with reason? (otherwise NO-GO)', true);
      if (!deferred) results.push({ item, priority: 'optional', ok: false });
      else {
        const reason = await ask('   Defer reason');
        results.push({ item, priority: 'optional', ok: true, deferred: true, reason });
      }
    } else {
      results.push({ item, priority: 'optional', ok: true });
    }
  }

  const mandatoryFailed = results.filter(r => r.priority === 'mandatory' && !r.ok);
  const optionalFailed = results.filter(r => r.priority === 'optional' && !r.ok);

  console.log();
  if (mandatoryFailed.length > 0) {
    warn(`${mandatoryFailed.length} mandatory item(s) not confirmed.`);
    const dec = await choose('Gate decision:', ['HOLD — resolve and recheck', 'NO-GO — escalate'], 0);
    gate.decision = dec === 0 ? 'HOLD' : 'NO-GO';
  } else if (optionalFailed.length > 0) {
    warn(`${optionalFailed.length} optional item(s) failed without deferral.`);
    const dec = await choose('Gate decision:', ['GO with caveats', 'HOLD'], 0);
    gate.decision = dec === 0 ? 'GO' : 'HOLD';
  } else {
    console.log('  ✅ All items confirmed.');
    gate.decision = 'GO';
  }

  gate.items = results;
  console.log(`\n  Gate decision: ${gate.decision}`);
  return gate.decision === 'GO';
}

// ─── phase 0 ──────────────────────────────────────────────────────────────────

async function phase0() {
  section('PHASE 0 — Prerequisites');
  note('Verify environment and make three structural decisions.');

  // Node version check
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 22) stop(`Node.js ${process.versions.node} detected. Minimum is 22 LTS. Upgrade and rerun.`);
  if (major === 22) note('Node 22 LTS (Maintenance, EOL 2027-04-30). Consider upgrading to 24 LTS.');
  console.log(`  ✅ Node.js ${process.versions.node}`);

  // Decision 1 — repo shape
  const shapeIdx = await choose(
    'Decision 1 — Repository shape:',
    ['Standalone repo (single module, single deploy)', 'Monorepo (multiple modules, shared CI)', 'Subrepo inside existing monorepo'],
    0
  );
  const shapes = ['standalone', 'monorepo', 'subrepo'];
  const repoShape = shapes[shapeIdx];

  // Decision 2 — agents
  console.log('\n  Decision 2 — Which AI agents will operate on this project?');
  const agentNames = ['Claude Code', 'Gemini CLI', 'GitHub Copilot', 'OpenAI Codex'];
  const selectedAgents = [];
  for (const agent of agentNames) {
    if (await confirm(`  Use ${agent}?`, agent === 'Claude Code')) selectedAgents.push(agent);
  }
  const otherAgent = await ask('  Other agent (leave blank to skip)');
  if (otherAgent) selectedAgents.push(otherAgent);
  if (selectedAgents.length === 0) stop('At least one agent must be configured.');

  // Decision 3 — stack
  const stackOptions = [
    'Node.js / TypeScript', 'Python', 'Rust', 'Go',
    'Java (Maven)', 'Java (Gradle)', 'Kotlin', '.NET / C#',
    '.NET Framework', 'C / C++', 'Rust + Python (maturin)',
    'R', 'Julia', 'Lua', 'Zig', 'Fortran', 'Other / unlisted'
  ];
  const stackIdx = await choose('Decision 3 — Primary application stack:', stackOptions, 0);
  const primaryStack = stackOptions[stackIdx];

  // Decision 4 — project type (US-V2-02)
  const projectTypeOptions = [
    'Node/TS API or service',
    'Python service or script',
    'Go or Rust binary',
    'CLI tool or library',
    'Data product or notebook',
  ];
  const projectTypeIdx = await choose('Decision 4 — Project type (for slim profile selection):', projectTypeOptions, 0);
  const projectType = projectTypeOptions[projectTypeIdx];
  const projectTypeKey = ['node-api', 'python-service', 'go-rust-binary', 'cli-library', 'data-product'][projectTypeIdx];

  // Decision 5 — team size
  const teamSizeRaw = await ask('Team size (number of engineers, including yourself)', '1');
  const teamSize = Math.max(1, parseInt(teamSizeRaw, 10) || 1);
  const isLean = teamSize <= 2;
  if (isLean) note(`Lean mode enabled (team size ${teamSize} ≤ 2) — reduced sprint defaults will be applied in Phase 2.`);

  const goGo = await runGate('phase0', [
    'Git 2.40+ installed and verified',
    'GitHub CLI 2.40+ installed and verified',
    'Node.js 22 LTS or 24 LTS confirmed',
    'Stack runtime installed at correct version',
    'Decision 1 (repo shape) resolved',
    'Decision 2 (agent config) resolved',
    'Decision 3 (primary stack) resolved',
    'Decision 4 (project type) resolved',
  ], [
    'ENV-006/007/008/009 warnings acknowledged and mitigated or deferred',
  ]);

  return { repoShape, selectedAgents, primaryStack, projectType, projectTypeKey, teamSize, isLean, goGo };
}

// ─── phase 1 ──────────────────────────────────────────────────────────────────

function scanPlaceholders() {
  const PLACEHOLDER_PATTERN = /\[PROJECT_NAME\]|\[STACK\]|\[LANGUAGE\]|\[ORG\]|\[repo\]|\[org\]/g;
  const SCAN_EXTS = ['.md', '.yaml', '.yml', '.json', '.ts', '.js'];
  const SCAN_EXCLUDE = ['node_modules', '.git', 'dist', 'coverage', '.agent/skills'];
  const hits = [];

  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      const rel = full.slice(ROOT.length + 1).replace(/\\/g, '/');
      if (SCAN_EXCLUDE.some(x => rel.startsWith(x) || e.name === x)) continue;
      if (e.isDirectory()) { walk(full); continue; }
      if (!SCAN_EXTS.includes(extname(e.name))) continue;
      const content = readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, i) => { if (PLACEHOLDER_PATTERN.test(l)) hits.push(`  ${rel}:${i + 1}`); PLACEHOLDER_PATTERN.lastIndex = 0; });
    }
  }
  walk(ROOT);
  return hits;
}

async function phase1() {
  section('PHASE 1 — Bootstrap');
  note('Placeholder replacement, .env, CI wiring.');

  // Scan for remaining template placeholders and surface them for human review
  note('Scanning for unfilled template placeholders…');
  const remaining = scanPlaceholders();
  if (remaining.length > 0) {
    console.log(`\n  ⚠  Found ${remaining.length} unfilled placeholder(s):\n`);
    remaining.slice(0, 20).forEach(l => console.log(l));
    if (remaining.length > 20) console.log(`  … and ${remaining.length - 20} more. Run: git grep '\\[PROJECT_NAME\\]' to see all.`);
    console.log('');
    warn('Replace all placeholders before confirming gate item #2.');
  } else {
    console.log('  ✅ No unfilled placeholders detected.\n');
  }

  const goGo = await runGate('phase1', [
    'npm test passes 17/17 locally',
    'All [PLACEHOLDER] values replaced in tracked files',
    '.env is NOT committed and not staged',
    'ci.yml green on remote',
    'docs-integrity.yml green on remote',
    'security.yml green on remote',
    'Stack-specific CI workflow added and registered in CI_CD.md',
  ], [
    'Bootstrap commit message follows convention (chore: bootstrap from template v1.0)',
    'pr-lint.yml warnings reviewed and resolved or deferred',
  ]);

  return { goGo };
}

// ─── phase 2 ──────────────────────────────────────────────────────────────────

// Slim profile definitions (US-V2-03)
const SLIM_PROFILES = {
  'node-api': {
    label: 'Node/TS API or service',
    optional: [],
    note: 'Full governance stack applies — all files required.',
  },
  'python-service': {
    label: 'Python service or script',
    optional: ['NOTEBOOK_GUIDE.md'],
    note: 'Node.js tooling optional after wizard run (Sprint 23). NOTEBOOK_GUIDE optional unless using Jupyter.',
  },
  'go-rust-binary': {
    label: 'Go or Rust binary',
    optional: ['NOTEBOOK_GUIDE.md', 'DATA_PRIVACY.md', 'DATA_PRIVACY_LGPD.md'],
    note: 'Privacy layer optional unless binary handles user PII. Node.js tooling optional.',
  },
  'cli-library': {
    label: 'CLI tool or library',
    optional: [
      'NOTEBOOK_GUIDE.md',
      'DATA_PRIVACY.md', 'DATA_PRIVACY_LGPD.md', 'PRIVACY_CONTACTS.md', 'PRIVACY_NOTICE_TEMPLATE.md',
      'LOAD_TESTING_FRAMEWORK.md', 'CAPACITY_PLANNING.md', 'EXPERIMENTATION.md',
      'FEATURE_FLAGS.md', 'PRODUCTION_READINESS_REVIEW.md',
    ],
    note: 'Privacy and operational files optional — CLI/library rarely handles user data or requires DORA tracking.',
  },
  'data-product': {
    label: 'Data product or notebook',
    optional: ['FEATURE_FLAGS.md', 'PRODUCTION_READINESS_REVIEW.md'],
    note: 'Privacy layer REQUIRED (data products handle PII by definition). Feature flags and PRR optional.',
  },
};

function writeSlimProfile(projectType, projectTypeKey) {
  if (!existsSync(AGILE_CONFIG)) return;
  const profile = SLIM_PROFILES[projectTypeKey] || SLIM_PROFILES['node-api'];
  const optionalList = profile.optional.length === 0
    ? '  - (none — full governance stack applies)'
    : profile.optional.map(f => `  - \`.agent/context/${f}\` — [OPTIONAL — not required for this profile]`).join('\n');

  const section0 = `\n---\n\n## §0 — Project Type & Slim Profile\n\n` +
    `**Project type:** \`${projectType}\`  \n` +
    `**Profile key:** \`${projectTypeKey}\`  \n` +
    `**Note:** ${profile.note}\n\n` +
    `**Optional files for this profile** (governance value preserved; skip if irrelevant):\n\n` +
    `${optionalList}\n`;

  const content = readFileSync(AGILE_CONFIG, 'utf8');
  // Insert §0 at the very top, after the first heading line
  const firstNewline = content.indexOf('\n');
  const updated = content.slice(0, firstNewline + 1) + section0 + content.slice(firstNewline + 1);
  writeFileSync(AGILE_CONFIG, updated, 'utf8');
}

async function phase2(selectedAgents, projectType, projectTypeKey, isLean = false) {
  section('PHASE 2 — Agile Configuration');
  note('Filling AGILE_CONFIG.md via interview. Conservative defaults pre-loaded.');
  checkConfigExists();

  const ui = { ask, choose, section, note };

  const s1      = await interviewSection1(ui, selectedAgents);
  const s2      = await interviewSection2(ui, s1.agentRows);
  const modules = await interviewSection3(ui, s1.moduleCount);
  note('§4 — DORA Targets: Tier 0 defaults applied (not yet measurable).');
  const s5      = await interviewSection5(ui);

  const filled  = buildConfig(readConfigFile(AGILE_CONFIG), s1, s2, modules, s5);
  writeConfig(AGILE_CONFIG, filled);
  writeSlimProfile(projectType, projectTypeKey);
  console.log('\n  ✅ AGILE_CONFIG.md written.');

  if (isLean) {
    note('Lean defaults applied (team size ≤ 2):');
    console.log('    Sprint capacity : 3 USs / 8 pts (reduced from 5 / 20)');
    console.log('    Review cadence  : per PR (not batched weekly)');
    console.log('    DORA tracking   : deferred until first module reaches Tier 2');
    console.log('    Retrospective   : every 2 sprints (optional for solo)');
    console.log('    Code-lint gate  : every 2 sprints (except Tier 2+ modules)');
    console.log('    See .agent/context/LEAN_PROFILE.md for full details.');
    console.log();
    note('Override any of these in AGILE_CONFIG.md §0 before starting Sprint 1.');
    console.log();
  }

  // Print slim profile summary for human to confirm
  const profile = SLIM_PROFILES[projectTypeKey] || SLIM_PROFILES['node-api'];
  if (profile.optional.length > 0) {
    note(`Slim profile applied — ${profile.optional.length} file(s) marked optional:`);
    profile.optional.forEach(f => console.log(`    [OPTIONAL] .agent/context/${f}`));
    console.log();
  }

  const goGo = await runGate('phase2', [
    'AGILE_CONFIG.md §1 fully filled — no [CONFIGURE] remaining',
    'Sprint capacity calculated and recorded in §2 with justification',
    'All modules registered in §3 at correct maturity tier (Tier 0)',
    'DORA targets set at appropriate starting level (not aspirational)',
    'Sprint 0 initialized in §5 with governance goal',
    'BACKLOG.md size within configured limits',
    'Pre-commit gate command recorded in §2 justification column',
  ], [
    'Q9 (RFC before Sprint 0?) answered — Phase 3 sequencing confirmed',
  ]);

  return { goGo, moduleNames: modules.map(m => m.name) };
}

// ─── phase 3 ──────────────────────────────────────────────────────────────────

async function phase3() {
  section('PHASE 3 — Architecture Baseline');
  note('Score pillars, complete threat model, create first RFC if needed.');
  note('This phase requires human judgment — the script guides the checklist only.');

  console.log(`
  Scoring guide (open .agent/context/ARCHITECTURE_SCORING_PLAYBOOK.md):
    P1 — Structural Integrity     (typical new project: 2.0–4.0)
    P2 — Operational Readiness    (typical new project: 1.0–3.0)
    P3 — Security Posture         (typical new project: 1.0–3.0)
    P4 — Governance & Docs        (typical new project: 3.0–5.0)
    P5 — Test Coverage & Quality  (typical new project: 1.0–4.0)
  `);

  const p1 = parseFloat(await ask('P1 — Structural Integrity score (0.0–10.0)'));
  const p2 = parseFloat(await ask('P2 — Operational Readiness score'));
  const p3 = parseFloat(await ask('P3 — Security Posture score'));
  const p4 = parseFloat(await ask('P4 — Governance & Docs score'));
  const p5 = parseFloat(await ask('P5 — Test Coverage & Quality score'));
  const composite = ((p1 + p2 + p3 + p4 + p5) / 5).toFixed(1);

  if (parseFloat(composite) > 6.0) {
    warn(`Composite score ${composite} > 6.0 on day one is suspicious.`);
    warn('Re-score with the rubric. Inflated scores signal overconfidence, not capability.');
    const recheck = await confirm('Confirm you have reviewed the rubric and this score is honest', false);
    if (!recheck) stop('Re-score before proceeding. Record honest baseline — it is the only one you get.');
  }

  console.log(`\n  Composite score: ${composite} / 10`);
  note(`Record these scores in .agent/context/MATURITY_REPORT.md Executive Summary.`);

  const rfcNeeded = await confirm('\n  Does an architectural decision require an RFC before Sprint 0?', false);
  if (rfcNeeded) {
    note('Create rfcs/RFC-001.yaml from rfcs/TEMPLATE.yaml.');
    note('Run: python infra/scripts/risk_engine.py --rfcs-path rfcs/ --alert-threshold 50 --output risk_report.md');
    warn('RFC must score < 60 and status = accepted before Phase 4 gate.');
  }

  const goGo = await runGate('phase3', [
    'Pillar scores recorded in MATURITY_REPORT.md Executive Summary',
    'THREAT_MODEL.md minimum viable threat model completed',
    'ARCHITECTURE.md §1 (system context) filled with real content',
    ...(rfcNeeded ? ['RFC score < 60 and status = accepted', 'RFC decision recorded in DECISION_LOG.md'] : []),
  ], [
    'CLASS_MAP.md has at least one entry per active module',
    'API_CONTRACT.md / DATA_MODEL.md / STATE_MACHINE.md filled or marked "not applicable"',
    'Composite score and next scoring checkpoint recorded in MATURITY_REPORT.md',
  ]);

  return { goGo, composite };
}

// ─── phase 4 ──────────────────────────────────────────────────────────────────

async function phase4(selectedAgents) {
  section('PHASE 4 — Agent Contracts');
  note('Configure agent entry point files and write Session Zero handoff.');

  console.log('\n  Entry point files to customize:');
  const fileMap = {
    'Claude Code': 'CLAUDE.md',
    'Gemini CLI': 'GEMINI.md',
    'GitHub Copilot': '.github/copilot-instructions.md',
    'OpenAI Codex': '.codex/instructions.md (verify current Codex convention)',
  };
  for (const agent of selectedAgents) {
    const file = fileMap[agent] || `[${agent} config file]`;
    console.log(`    ${agent} → ${file}`);
  }

  note('\nFor each file: replace start-project, node-ts, typescript, [PRE_COMMIT_GATE].');
  note('Rules 1–7 in CLAUDE.md are non-negotiable — do not remove or weaken them.');

  const goGo = await runGate('phase4', [
    'All agent entry point files customized — no [PLACEHOLDER] remaining',
    'AGENT_HANDOFF.md Session Zero entry written',
    'npm test passes 17/17',
    'AGENTS.md guard rule confirmed (human understands and accepts)',
    'Destructive operations rule confirmed (agent never executes without explicit human confirmation)',
    'Token log rule confirmed (agent appends to token_log.jsonl at session end)',
  ], [
    selectedAgents.length > 1 ? 'Multi-agent coherence rules documented in DECISION_LOG.md' : null,
    'Agent contract review checklist (AGENT_CONTRACT_REVIEW.md §1) fully checked',
  ].filter(Boolean));

  return { goGo };
}

// ─── phase 5 ──────────────────────────────────────────────────────────────────

async function phase5() {
  section('PHASE 5 — Sprint 0');
  note('Governance sprint. Add the fixed S00-01–S00-08 USs to BACKLOG.md.');
  note('Sprint 0 goal: validate adoption is solid. No feature code.');

  console.log(`
  Fixed Sprint 00 USs to add to BACKLOG.md:
    S00-01  Verify all Phase 0–4 gates recorded in DECISION_LOG.md          XS  1pt
    S00-02  Confirm npm test 17/17 on clean clone from remote                XS  1pt
    S00-03  Confirm all CI workflows green on master                          XS  1pt
    S00-04  Confirm AGILE_CONFIG.md has no [CONFIGURE] placeholders          XS  1pt
    S00-05  Record DORA measurement baseline                                  S   2pt
    S00-06  Write first project-specific US for Sprint 01                     S   2pt
    S00-07  Confirm AGENT_HANDOFF.md Session Zero complete                    XS  1pt
    S00-08  Run scoring playbook and confirm scores match MATURITY_REPORT.md  S   2pt

  Total: 8 USs, 11 points.
  `);

  const goGo = await runGate('phase5', [
    'All S00-01 through S00-08 marked Done with acceptance criteria met',
    'All Phase 0–4 gate decisions recorded in DECISION_LOG.md',
    'No feature code in Sprint 0 commits',
    'AGENT_HANDOFF.md Sprint 00 close entry written',
    'No unresolved high-severity [CRACK DETECTED] items',
    'DORA baseline recorded in AGILE_CONFIG.md §4 (even if "not yet measurable")',
    'At least one Sprint 1 US written with appetite defined',
    'Sprint 0 retrospective outcome recorded in DECISION_LOG.md',
  ], [
    'Token log entry appended for Sprint 0 session(s)',
    'Medium-severity [US-DEBT] items scheduled in Sprint 1 or explicitly deferred with reason',
  ]);

  return { goGo };
}

// ─── summary ──────────────────────────────────────────────────────────────────

function printSummary(_data) {
  section('ADOPTION SUMMARY');

  console.log('\n  Phase gate results:\n');
  for (const gate of Object.values(gates)) {
    const icon = gate.decision === 'GO' ? '✅' : gate.decision === 'HOLD' ? '⏸' : gate.decision === 'NO-GO' ? '🛑' : '—';
    console.log(`    ${icon}  ${gate.label}: ${gate.decision || 'not reached'}`);
  }

  const anyNoGo = Object.values(gates).some(g => g.decision === 'NO-GO');
  const anyHold = Object.values(gates).some(g => g.decision === 'HOLD');

  console.log();
  if (anyNoGo) {
    warn('One or more gates are NO-GO. Escalate before proceeding to Sprint 1.');
  } else if (anyHold) {
    warn('One or more gates are HOLD. Resolve blockers and rerun the gate manually.');
  } else {
    console.log('  ✅ All gates passed. Sprint 1 can open.\n');
    console.log('  Next steps:');
    console.log('    1. Review AGILE_CONFIG.md — confirm all values look correct');
    console.log('    2. Open BACKLOG.md — add Sprint 00 USs (S00-01 through S00-08)');
    console.log('    3. Start first agent session — agent reads AGENT_HANDOFF.md first');
  }

  // Append summary to DECISION_LOG.md
  const date = new Date().toISOString().split('T')[0];
  const gateLines = Object.values(gates)
    .map(g => `  - ${g.label}: ${g.decision || 'not reached'}`)
    .join('\n');

  const entry = `
---

### ADR — Template Adoption Gate Summary
**Date:** ${date}
**Status:** ${anyNoGo ? 'NO-GO' : anyHold ? 'HOLD' : 'Accepted'}
**Participants:** [HUMAN_NAME], init-agile.js wizard

**Gate decisions:**
${gateLines}

**Next action:** ${anyNoGo ? 'Escalate' : anyHold ? 'Resolve HOLD items and recheck' : 'Open Sprint 0 — add S00-01 through S00-08 to BACKLOG.md'}
`;

  try {
    appendDecisionLog(entry);
    note('Gate summary appended to DECISION_LOG.md.');
  } catch {
    note('Could not write to DECISION_LOG.md — add the summary manually.');
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n  ╔══════════════════════════════════════════════════════════════════╗');
  console.log('  ║   Engineering Template — Project Adoption Wizard                ║');
  console.log('  ║   init-agile.js v1.0  |  Doctrine: Hope is not a strategy.     ║');
  console.log('  ╚══════════════════════════════════════════════════════════════════╝\n');
  note('This wizard fills AGILE_CONFIG.md and guides the PROJECT_PLAYBOOK.md gates.');
  note('Have PROJECT_PLAYBOOK.md open in a second window for reference.');
  note('All Go/No-Go gates require honest answers — the agent will trust these records.\n');

  const p0 = await phase0();
  if (!p0.goGo) {
    warn('Phase 0 gate did not pass GO. Resolve and rerun the wizard.');
    printSummary({});
    rl.close();
    process.exit(0);
  }

  const p1 = await phase1();
  if (!p1.goGo) {
    warn('Phase 1 gate did not pass GO. Resolve Bootstrap blockers and rerun.');
    printSummary({});
    rl.close();
    process.exit(0);
  }

  const p2 = await phase2(p0.selectedAgents, p0.projectType, p0.projectTypeKey, p0.isLean);
  if (!p2.goGo) {
    warn('Phase 2 gate did not pass GO. AGILE_CONFIG.md was written — review it before proceeding.');
    printSummary({});
    rl.close();
    process.exit(0);
  }

  const p3 = await phase3();
  if (!p3.goGo) {
    warn('Phase 3 gate did not pass GO. Complete architecture baseline before agent contracts.');
    printSummary({});
    rl.close();
    process.exit(0);
  }

  const p4 = await phase4(p0.selectedAgents);
  if (!p4.goGo) {
    warn('Phase 4 gate did not pass GO. Configure agent entry point files before Sprint 0.');
    printSummary({});
    rl.close();
    process.exit(0);
  }

  const runSprint0 = await confirm('\n  Run Phase 5 (Sprint 0) gate now?', false);
  if (runSprint0) {
    await phase5();
  } else {
    note('Phase 5 skipped — run the wizard again after Sprint 0 completes to record the gate.');
    gates.phase5.decision = null;
  }

  printSummary({ p0, p2, p3 });
  rl.close();
}

main().catch(err => {
  console.error('\n  Fatal error:', err.message);
  process.exit(1);
});
