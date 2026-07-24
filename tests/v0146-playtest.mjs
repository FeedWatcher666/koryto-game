import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/event-system.js','src/faction-system.js','src/companion-system.js',
  'src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js',
  'src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js',
  'src/state.js','src/save-system.js','src/v0143.js','src/quest-system.js','src/v0143-test3.js',
  'src/ux-system.js','src/v0143-test10.js','src/balance-system.js','src/v0144-test10.js',
  'src/v0145-campaign.js','src/v0146-playtest.js'
]) vm.runInContext(readText(file), context, { filename:file });

const api = context.KorytoPlaytestLab;
assert.ok(api);
assert.equal(api.VERSION, '0.14.6 TEST.10');
assert.equal(api.BUILD_VERSION, '0.14.6-test.10');
assert.equal(api.SAVE_VERSION, '0.14.3-test.2');
assert.equal(api.SAVE_SCHEMA, 1);
assert.equal(Object.keys(api.profiles).length, 8);
assert.equal(api.classIds.length, 6);

const broken = context.deep(context.baseState);
Object.assign(broken, {
  day: '5',
  actions: '-7',
  party: { marie:null },
  pendingEvents: null,
  commitments: 'broken',
  factionPlans: [],
  quests: { phantom:{status:'active',stage:999}, meadow:{status:'locked',stage:'0',deadlineBonus:'0'} }
});
const normalized = context.KorytoState.normalizeCollections(broken);
assert.equal(Array.isArray(normalized.commitments), true);
assert.equal(Array.isArray(normalized.pendingEvents), true);
assert.equal(typeof normalized.factionPlans, 'object');
assert.equal(normalized.actions, 0);
assert.equal('phantom' in normalized.quests, false);
assert.equal(context.KorytoState.validate(normalized).length, 0);
assert.equal(context.KorytoSaveSystem.roundTrip(normalized).ok, true);

normalized.day = 5;
assert.equal(api.ensureMeadowUnlocked(normalized), true);
assert.equal(normalized.quests.meadow.status, 'active');
const pressChoice = context.events.planPressSpecial.choices[1];
assert.equal(pressChoice.check.dc, 14);
assert.ok(pressChoice.tags.includes('power'));
assert.ok(pressChoice.success.effects.funds > 0);

const sample = api.simulateProfile('novice', 146001, { classId:'technocrat' });
assert.equal(sample.profile, 'novice');
assert.equal(sample.classId, 'technocrat');
assert.equal(sample.ended, true);
assert.equal(sample.telemetry.invalidNumbers.length, 0);

const lab = api.runLab({ runs:240, seed:146100 });
assert.equal(lab.results.length, 240);
assert.equal(lab.report.completed, 240);
assert.equal(Object.keys(lab.report.byProfile).length, 8);
assert.equal(Object.keys(lab.report.byClass).length, 6);
assert.ok(lab.report.routeDiversity > 20);
assert.ok(lab.report.eventCoverage.rate > 80);
assert.equal(lab.report.chaos.cases.length, 5);
assert.equal(lab.report.chaos.ok, true);
assert.equal(lab.report.content.totalEvents > 50, true);
assert.equal(lab.report.issues.some(issue => issue.severity === 'P1'), false);
assert.equal(lab.report.releaseReady, true);
assert.equal(lab.results.every(row => Object.values(row).filter(value => typeof value === 'number').every(Number.isFinite)), true);
assert.match(api.markdown(lab.report), /AI playtest report/);

const fullReport = readText('docs/v0.14/v0146-playtest-report.md');
assert.match(fullReport, /Runs: 2400/);
assert.match(fullReport, /Event coverage: 95\/101 \(94\.1 %\)/);
assert.match(fullReport, /No P1\/P2 findings/);

const index = readText('index.html');
assert.match(index, /0\.15\.2 TEST\.1/);
assert.match(index, /styles\/v0146\.css/);
assert.match(index, /src\/v0146-playtest\.js/);
assert.match(index, /src\/v0149-pixel-assets\.js/);
assert.match(index, /src\/v0152-reference-match\.js/);
assert.ok(index.indexOf('src/v0146-playtest.js') > index.indexOf('src/v0145-campaign.js'));
assert.equal(readText('VERSION').trim(), '0.15.2-test.1');
assert.ok(readText('src/app.js').split('\n').length < 1000);
for (const source of ['src/v0146-playtest.js','styles/v0146.css','src/v0151-graphics.js','src/v0152-reference-match.js']) {
  assert.doesNotMatch(readText(source), /MutationObserver/);
  assert.doesNotMatch(readText(source), /setInterval\s*\(/);
}
console.log(`v0.14.6 AI playtest lab ok inside v0.15.2: ${lab.report.routeDiversity} routes, ${lab.report.eventCoverage.rate}% events`);
