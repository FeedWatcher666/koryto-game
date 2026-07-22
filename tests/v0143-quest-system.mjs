import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js',
  'src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js',
  'src/state.js','src/save-system.js','src/v0143.js','src/quest-system.js','src/v0143-test3.js'
]) vm.runInContext(readText(file), context, { filename:file });

assert.ok(context.KorytoQuestSystem, 'quest domain API must be exposed');
assert.ok(context.KorytoTest1433, 'TEST.3 release API must be exposed');
assert.equal(context.KorytoQuestSystem.VERSION, '0.14.3 TEST.3');
assert.equal(context.KorytoQuestSystem.BUILD_VERSION, '0.14.3-test.3');
assert.equal(context.KorytoQuestSystem.SAVE_VERSION, '0.14.3-test.2');
assert.equal(context.KorytoTest1433.VERSION, '0.14.3 TEST.3');
assert.equal(context.KorytoTest1433.SAVE_VERSION, '0.14.3-test.2', 'TEST.3 must not bump save schema');
assert.equal(context.KorytoSaveSystem.SAVE_SCHEMA, 1);
assert.equal(context.KorytoTest1433.summaryLayoutInstalled, true, 'day summary layout must install during release initialization');
assert.equal(context.KorytoTest1433.questSaveGuardInstalled, true, 'quest save guard must install during release initialization');

const summaryStyle = context.document.head.children.find(node => node.id === context.KorytoTest1433.SUMMARY_STYLE_ID);
assert.ok(summaryStyle, 'day summary layout style must be attached to the document head');
assert.match(summaryStyle.textContent, /max-height:calc\(100dvh - 32px\)/, 'day summary must fit inside the dynamic viewport');
assert.match(summaryStyle.textContent, /overflow-y:auto/, 'day summary must own its vertical scroll');
assert.match(summaryStyle.textContent, /position:sticky/, 'continue button must remain attached to the visible dialog edge');
assert.match(summaryStyle.textContent, /bottom:0/, 'sticky continue button must stay at the bottom');
assert.match(summaryStyle.textContent, /safe-area-inset-bottom/, 'mobile safe area must remain clickable');

const expectedQuestIds = [
  'register','diesel','roof','meadow','paper','oldfiles',
  'water','budget','debate','waste','ballots'
];
const definitions = context.KorytoQuestSystem.cloneDefinitions();
assert.deepEqual(Object.keys(definitions).sort(), [...expectedQuestIds].sort());
assert.equal(context.KorytoQuestSystem.validateDefinitions().length, 0);
assert.equal(context.KorytoQuestSystem.validateState(context.getStateForTest()).length, 0);

for (const [id, definition] of Object.entries(definitions)) {
  assert.equal(typeof definition.title, 'string', `${id} title must remain text`);
  assert.equal(typeof definition.desc, 'string', `${id} description must remain text`);
  assert.equal(typeof definition.failure, 'string', `${id} failure consequence must remain text`);
  assert.ok(Number.isInteger(definition.deadline) && definition.deadline >= 1 && definition.deadline <= 14, `${id} deadline must stay in campaign range`);
  assert.ok(context.locations[definition.location], `${id} must point to an existing location`);
}

const current = context.deep(context.getStateForTest());
current.quests.register.status = 'active';
current.quests.diesel.status = 'active';
current.quests.register.deadlineBonus = 3;
const active = context.KorytoQuestSystem.active(current);
assert.ok(active.length >= 2);
assert.equal(active[0].id, 'diesel', 'active quests must be sorted by effective deadline');
assert.equal(context.KorytoQuestSystem.deadline('register', current), definitions.register.deadline + 3);

const badStatus = context.deep(context.getStateForTest());
badStatus.quests.register.status = 'forgotten';
assert.match(context.KorytoQuestSystem.validateState(badStatus).join(' '), /register: neplatný stav/);

const badStage = context.deep(context.getStateForTest());
badStage.quests.diesel.stage = -1;
assert.match(context.KorytoQuestSystem.validateState(badStage).join(' '), /diesel: neplatná fáze/);

const missingQuest = context.deep(context.getStateForTest());
delete missingQuest.quests.roof;
assert.match(context.KorytoQuestSystem.validateState(missingQuest).join(' '), /roof: chybí stav questu/);

const unknownQuest = context.deep(context.getStateForTest());
unknownQuest.quests.secretTender = {status:'active', stage:0};
assert.match(context.KorytoQuestSystem.validateState(unknownQuest).join(' '), /secretTender: stav nemá definici/);

context.clearStoredSavesForTest();
const numericStringSave = context.deep(context.getStateForTest());
numericStringSave.hero.name = 'Quest s číselným textem';
numericStringSave.phase = 'map';
numericStringSave.ended = false;
numericStringSave.quests.register.stage = '0';
numericStringSave.quests.register.deadlineBonus = '2';
context.setStoredSaveForTest('koryto_v014', numericStringSave);
let loaded = context.KorytoSaveSystem.loadGame();
assert.equal(loaded.hero.name, 'Quest s číselným textem');
assert.equal(loaded.quests.register.stage, 0, 'numeric string quest stage must be normalized to an integer');
assert.equal(typeof loaded.quests.register.stage, 'number');
assert.equal(loaded.quests.register.deadlineBonus, 2, 'numeric string deadline bonus must be normalized to an integer');
assert.equal(context.KorytoQuestSystem.deadline('register', loaded), definitions.register.deadline + 2);

context.clearStoredSavesForTest();
const invalidManual = context.deep(context.getStateForTest());
invalidManual.hero.name = 'Rozbitý ruční quest';
invalidManual.quests.roof.stage = 'není číslo';
const validAutosave = context.deep(context.getStateForTest());
validAutosave.hero.name = 'Záchranný quest autosave';
context.setStoredSaveForTest('koryto_v014', invalidManual);
context.setStoredSaveForTest('koryto_v014_auto', validAutosave);
loaded = context.KorytoSaveSystem.loadGame();
assert.equal(loaded.hero.name, 'Záchranný quest autosave', 'invalid quest progress must not hide a valid autosave');
assert.equal(context.KorytoQuestSystem.validateState(loaded).length, 0);

const summary = context.KorytoQuestSystem.summary(context.getStateForTest());
assert.equal(Object.values(summary).reduce((sum, value) => sum + value, 0), expectedQuestIds.length);

const release = context.KorytoTest1433.runReleaseCheck();
assert.equal(release.ok, true);
assert.equal(release.questContract, 'external-domain-api');
assert.equal(release.questSaveGuard, 'normalize-and-validate');
assert.equal(release.daySummaryLayout, 'scrollable-sticky-action');
assert.equal(release.quests.definitions, expectedQuestIds.length);
assert.equal(release.saveVersion, '0.14.3-test.2');
assert.equal(context.getStateForTest().version, '0.14.3-test.2');
assert.equal(context.getStateForTest().flags.v0143Test3QuestContract, '0.14.3 TEST.3');

const index = readText('index.html');
const baseReleasePos = index.indexOf('src/v0143.js');
const questPos = index.indexOf('src/quest-system.js');
const test3Pos = index.indexOf('src/v0143-test3.js');
assert.ok(baseReleasePos >= 0 && questPos > baseReleasePos && test3Pos > questPos, 'TEST.3 scripts must load after the stable TEST.2 integration');
assert.match(index, /0\.14\.3 TEST\.3/);
assert.equal(readText('VERSION').trim(), '0.14.3-test.3');

const questSource = readText('src/quest-system.js');
const releaseSource = readText('src/v0143-test3.js');
assert.doesNotMatch(questSource, /setInterval\s*\(/);
assert.doesNotMatch(questSource, /MutationObserver/);
assert.doesNotMatch(releaseSource, /setInterval\s*\(/);
assert.doesNotMatch(releaseSource, /MutationObserver/);
assert.match(releaseSource, /overflow-y:auto/);
assert.match(releaseSource, /position:sticky/);
assert.match(releaseSource, /installQuestSaveGuard/);

const workflow = readText('.github/workflows/v0142-stability.yml');
assert.match(workflow, /Koryto v0\.14\.3 TEST\.3/);
assert.match(workflow, /test\/v0\.14\.3-test3/);
assert.match(workflow, /koryto-v0\.14\.3-test\.3/);

console.log('v0.14.3 TEST.3 quest domain, save guard and day summary layout checks ok');