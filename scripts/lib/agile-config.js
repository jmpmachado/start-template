// agile-config.js — AGILE_CONFIG.md fill logic for init-agile.js
// Three responsibilities: interview (collect answers), transform (patch md content), write.
// All UI primitives (ask/choose/section/note) are injected via `ui` to keep this testable.
//
// @typedef {{ agent: string, hours: number }} AgentRow
// @typedef {{ agentRows: AgentRow[], sessionLen: string, cadenceIdx: number, maxUnreviewed: string, moduleCount: number, modulesInSprint: string, maxModules: string, releaseIdx: number, debtIdx: number }} S1
// @typedef {{ totalHours: number, avgHoursPerUS: number, rawMax: number, buffered: number, maxPoints: number, sprintLen: string, maxUSs: string, maxPts: string, maxLines: string, maxKB: string, maxActiveUS: string }} S2

import { readFileSync, writeFileSync } from 'node:fs';

// ─── interview ────────────────────────────────────────────────────────────────

export async function interviewSection1(ui, selectedAgents) {
  // §1.1 — agent hours
  ui.section('§1.1 — Agent Window');
  const agentRows = [];
  for (const agent of selectedAgents) {
    const hours = await ui.ask(`${agent} hours/week`, '40');
    agentRows.push({ agent, hours: parseInt(hours, 10) || 40 });
  }
  const sessionLen = await ui.ask('Default session length (hours)', '5');

  // §1.2 — review cadence
  ui.section('§1.2 — Review Cadence');
  const cadenceOptions = [
    'End of every agent session (same day)',
    'Next available window (next day or 5h block)',
    'Weekly reset window',
    'Other',
  ];
  const cadenceIdx = await ui.choose('When does the human do batch review?', cadenceOptions, 1);
  if (cadenceIdx === 3) await ui.ask('Describe your review cadence');
  const maxUnreviewed = await ui.ask('Max unreviewed sessions before mandatory stop', '2');

  // §1.3 — modules
  ui.section('§1.3 — Module Count');
  const moduleCount = parseInt(await ui.ask('Number of active modules', '1'), 10) || 1;
  const modulesInSprint = await ui.ask('Modules under active development this sprint', '1');
  const maxModules = await ui.ask('Max modules touched per sprint', '1');

  // §1.4 — release cadence
  ui.section('§1.4 — Release Cadence');
  const releaseOptions = [
    'Continuous by module maturity (Debian model)',
    'Fixed release train (weekly/biweekly)',
    'On-demand (manual trigger only)',
    'Other',
  ];
  const releaseIdx = await ui.choose('Release cadence philosophy:', releaseOptions, 0);

  // §1.5 — debt tolerance
  ui.section('§1.5 — Structural Debt Tolerance');
  const debtOptions = [
    'Hard stop — fix before continuing (recommended Tier 2+)',
    'Log and schedule next sprint (Tier 0–1)',
    'Human decides per case',
  ];
  const debtIdx = await ui.choose('How to handle mid-sprint crack detection:', debtOptions, 0);

  return { agentRows, sessionLen, cadenceIdx, maxUnreviewed, moduleCount, modulesInSprint, maxModules, releaseIdx, debtIdx };
}

export async function interviewSection2(ui, agentRows) {
  ui.section('§2 — Sprint Capacity Calculation');
  const totalHours = agentRows.reduce((s, r) => s + r.hours, 0);
  ui.note(`Total agent hours/week: ${totalHours}h`);

  const avgHoursPerUS = parseFloat(await ui.ask('Average hours per US (start with 4h)', '4'));
  const rawMax = Math.floor(totalHours / avgHoursPerUS);
  const buffered = Math.floor(rawMax * 0.8);
  const maxPoints = buffered * 3;

  console.log(`\n  Calculated capacity:`);
  console.log(`    Raw max USs:     ${rawMax}`);
  console.log(`    Buffered (×0.8): ${buffered}`);
  console.log(`    Max points:      ${maxPoints}`);

  const sprintLen  = await ui.ask('Sprint length', '1 week');
  const maxUSs     = await ui.ask('Max USs per sprint', String(Math.min(buffered, 8)));
  const maxPts     = await ui.ask('Max story points per sprint', String(maxPoints));
  const maxLines   = await ui.ask('Max lines in BACKLOG.md', '150');
  const maxKB      = await ui.ask('Max size of BACKLOG.md (KB)', '30');
  const maxActiveUS= await ui.ask('Max USs in active backlog', '15');

  return { totalHours, avgHoursPerUS, rawMax, buffered, maxPoints, sprintLen, maxUSs, maxPts, maxLines, maxKB, maxActiveUS };
}

export async function interviewSection3(ui, moduleCount) {
  ui.section('§3 — Module Registry');
  const modules = [];
  for (let i = 0; i < moduleCount; i++) {
    console.log(`\n  Module ${i + 1} of ${moduleCount}:`);
    const name  = await ui.ask('  Module name (short identifier)');
    const path  = await ui.ask('  Path from repo root (e.g. src/ or modules/auth/)');
    const notes = await ui.ask('  Notes (stack, constraints — leave blank if none)');
    modules.push({ name, path, notes });
  }
  return modules;
}

export async function interviewSection5(ui) {
  ui.section('§5 — Sprint 0 Initialization');
  const today = new Date().toISOString().split('T')[0];
  const defaultEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })();
  const sprintEnd = await ui.ask('Sprint 00 end date (YYYY-MM-DD)', defaultEnd);
  return { today, sprintEnd };
}

// ─── transform ────────────────────────────────────────────────────────────────

export function buildConfig(content, s1, s2, modules, s5) {
  let c = content;

  // §1.1 — agent rows
  const agentTableRows = s1.agentRows.map(r => `| ${r.agent} | ${r.hours}h | |`).join('\n');
  c = c.replace(
    /\| \[AGENT_1_NAME\] \| \[CONFIGURE\] \| e\.g\. Claude Sonnet.*\n\| \[AGENT_2_NAME\] \| \[CONFIGURE\] \| e\.g\. Gemini.*\n/,
    agentTableRows + '\n'
  );
  c = c.replace(
    '**Default session length used for sizing:** `[CONFIGURE]` hours',
    `**Default session length used for sizing:** \`${s1.sessionLen}\` hours`
  );

  // §1.2 — cadence checkboxes
  const cadenceChecks = [
    '- [ ] End of every agent session (same day)',
    '- [ ] Next available window (next day or 5h block)',
    '- [ ] Weekly reset window',
    '- [ ] Other: `[CONFIGURE]`',
  ];
  let updatedCadence = cadenceChecks.join('\n');
  if (s1.cadenceIdx < 3) {
    updatedCadence = updatedCadence.replace(cadenceChecks[s1.cadenceIdx], cadenceChecks[s1.cadenceIdx].replace('[ ]', '[x]'));
  }
  c = c.replace(cadenceChecks.join('\n'), updatedCadence);
  c = c.replace(
    '**Maximum unreviewed sessions before mandatory stop:** `[CONFIGURE]`',
    `**Maximum unreviewed sessions before mandatory stop:** \`${s1.maxUnreviewed}\``
  );

  // §1.3 — module counts
  c = c
    .replace('**Active modules:** `[CONFIGURE]`', `**Active modules:** \`${s1.moduleCount}\``)
    .replace('**Modules under active development this sprint:** `[CONFIGURE]`', `**Modules under active development this sprint:** \`${s1.modulesInSprint}\``)
    .replace(
      '**Rule from `AGILE_GUIDE.md`:** A sprint touches at most `[CONFIGURE]` modules simultaneously.',
      `**Rule from \`AGILE_GUIDE.md\`:** A sprint touches at most \`${s1.maxModules}\` modules simultaneously.`
    );

  // §1.4 — release checkboxes
  const releaseChecks = [
    '- [ ] Continuous by module maturity (Debian model — default)',
    '- [ ] Fixed release train (weekly/biweekly)',
    '- [ ] On-demand (manual trigger only)',
    '- [ ] Other: `[CONFIGURE]`',
  ];
  let updatedRelease = releaseChecks.join('\n');
  if (s1.releaseIdx < 3) {
    updatedRelease = updatedRelease.replace(releaseChecks[s1.releaseIdx], releaseChecks[s1.releaseIdx].replace('[ ]', '[x]'));
  }
  c = c.replace(releaseChecks.join('\n'), updatedRelease);

  // §1.5 — debt tolerance
  const debtLabels = [
    'Hard stop — fix before continuing (recommended Tier 2+)',
    'Log and schedule in next sprint (acceptable for Tier 0–1 modules)',
    'Human decides per case',
  ];
  c = c.replace('**Default for this project:** `[CONFIGURE]`', `**Default for this project:** ${debtLabels[s1.debtIdx]}`);

  // §2 — capacity table
  const tableFields = [
    ['| Sprint length | 1 week | `[CONFIGURE]` | |',                     `| Sprint length | 1 week | \`${s2.sprintLen}\` | conservative default |`],
    ['| Max USs per sprint | 5 | `[CONFIGURE]` | |',                     `| Max USs per sprint | 5 | \`${s2.maxUSs}\` | buffered formula result |`],
    ['| Max story points per sprint | 20 | `[CONFIGURE]` | |',           `| Max story points per sprint | 20 | \`${s2.maxPts}\` | buffered formula result |`],
    ['| Max lines in `BACKLOG.md` | 150 | `[CONFIGURE]` | |',            `| Max lines in \`BACKLOG.md\` | 150 | \`${s2.maxLines}\` | agent context ceiling |`],
    ['| Max size of `BACKLOG.md` | 30KB | `[CONFIGURE]` | |',            `| Max size of \`BACKLOG.md\` | 30KB | \`${s2.maxKB}KB\` | agent context ceiling |`],
    ['| Max USs in active backlog | 15 | `[CONFIGURE]` | |',             `| Max USs in active backlog | 15 | \`${s2.maxActiveUS}\` | planning debt signal |`],
    ['| Max modules touched per sprint | 1 | `[CONFIGURE]` | |',         `| Max modules touched per sprint | 1 | \`${s1.maxModules}\` | cognitive overhead |`],
    ['| Max unreviewed sessions | 2 | `[CONFIGURE]` | |',                `| Max unreviewed sessions | 2 | \`${s1.maxUnreviewed}\` | batch review cadence |`],
  ];
  for (const [old, next] of tableFields) c = c.replace(old, next);

  // §2 — formula block
  c = c
    .replace('Agent hours/week:     [CONFIGURE]',                                        `Agent hours/week:     ${s2.totalHours}`)
    .replace('Avg hours/US:         [CONFIGURE]  (start with 4h; adjust after sprint 1)',`Avg hours/US:         ${s2.avgHoursPerUS}h (adjust after sprint 1)`)
    .replace('Raw max USs:          [CONFIGURE]',                                        `Raw max USs:          ${s2.rawMax}`)
    .replace('Buffered max USs:     [CONFIGURE]  (raw × 0.8)',                           `Buffered max USs:     ${s2.buffered} (raw × 0.8)`)
    .replace('Max points:           [CONFIGURE]',                                        `Max points:           ${s2.maxPoints}`);

  // §3 — module registry rows
  const moduleRows = modules.map(m => `| ${m.name} | \`${m.path}\` | 0 | On explicit decision | Feature branch always | ${m.notes} |`);
  c = c.replace(
    '| [MODULE_NAME] | `[path]` | `[0-3]` | `[CONFIGURE]` | `[CONFIGURE]` | |',
    moduleRows.join('\n')
  );

  // §4 — DORA targets
  const doraRows = modules.map(m => `| ${m.name} | On explicit decision only | Not yet measurable | < 10% | Not yet measurable |`);
  c = c.replace(
    '| [MODULE_NAME] | `[CONFIGURE]` | `[CONFIGURE]` | `< 10%` | `[CONFIGURE]` |',
    doraRows.join('\n')
  );

  // §5 — active sprint
  const sprintModules = modules.map(m => m.name).join(', ');
  c = c
    .replace('**Sprint ID:** `[SPRINT_ID]`',               '**Sprint ID:** `Sprint 00`')
    .replace('**Sprint dates:** `[START_DATE]` → `[END_DATE]`', `**Sprint dates:** \`${s5.today}\` → \`${s5.sprintEnd}\``)
    .replace('**Module(s) in scope:** `[MODULE_NAME]`',    `**Module(s) in scope:** \`${sprintModules}\``)
    .replace('**Sprint goal:** `[ONE_SENTENCE_GOAL]`',     '**Sprint goal:** Validate template adoption — all Phase gates passed, first US in backlog, DORA baseline recorded.');

  // §5 — capacity check table
  c = c
    .replace('| USs | `[MAX_US]` | 0 | ✅ |',    `| USs | \`${s2.maxUSs}\` | 0 | ✅ |`)
    .replace('| Points | `[MAX_PTS]` | 0 | ✅ |', `| Points | \`${s2.maxPts}\` | 0 | ✅ |`)
    .replace('| Modules | `[MAX_MOD]` | 0 | ✅ |',`| Modules | \`${s1.maxModules}\` | 0 | ✅ |`);

  return c;
}

// ─── write ────────────────────────────────────────────────────────────────────

export function writeConfig(filePath, content) {
  writeFileSync(filePath, content, 'utf8');
}

export function readConfigFile(filePath) {
  return readFileSync(filePath, 'utf8');
}
