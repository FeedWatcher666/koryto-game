import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js',
  'src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js',
  'src/state.js','src/save-system.js','src/v0143.js'
]) vm.runInContext(readText(file), context, { filename:file });

assert.ok(context.KorytoState, 'state module must be exposed');
assert.ok(context.KorytoSaveSystem, 'save module must be exposed');
assert.ok(context.KorytoTest143, 'v0.14.3 release module must be exposed');
assert.equal(context.KorytoState.VERSION, '0.14.3 TEST.1');
assert.equal(context.KorytoSaveSystem.SAVE_VERSION, '0.14.3-test.1');
assert.equal(context.KorytoTest143.VERSION, '0.14.3 TEST.1');

const requiredObjects = ['quests','party','factions','voters','factionPlans','companionAmbitions','flags','stats','audit'];
const requiredArrays = ['pendingEvents','items','news','commitments','worldActions','echoes'];
const saveFixture = (name, day = 2) => ({
  version:'0.14', day, actions:2, phase:'map',
  hero:{name, classId:'bard', origin:'idealist', attrs:{charisma:4}},
  stats:{support:20, trust:55, funds:12, heat:0, influence:10, integrity:55, leverage:0},
  flags:{source:name}
});

context.clearStoredSavesForTest();
const legacy = {
  version:'0.13', day:3, actions:2, phase:'map',
  hero:{name:'Modulární kandidát', classId:'bard', attrs:{charisma:9}},
  stats:{influence:12, trust:67},
  flags:{legacyMarker:true, nested:{kept:'ano'}}
};
context.setStoredSaveForTest('koryto_v013', legacy);
let loaded;
assert.doesNotThrow(() => { loaded = context.KorytoSaveSystem.loadGame(); });
assert.equal(loaded.hero.name, 'Modulární kandidát');
assert.equal(loaded.hero.attrs.charisma, 9);
assert.equal(loaded.stats.influence, 12);
assert.equal(loaded.stats.trust, 67);
assert.equal(loaded.flags.legacyMarker, true);
assert.equal(loaded.flags.nested.kept, 'ano');
assert.equal(loaded.version, '0.14.3-test.1');
assert.equal(loaded.flags.v0143ReleaseCandidate, '0.14.3 TEST.1');
for (const key of requiredObjects) assert.ok(loaded[key] && typeof loaded[key] === 'object' && !Array.isArray(loaded[key]), `${key} must be an object`);
for (const key of requiredArrays) assert.ok(Array.isArray(loaded[key]), `${key} must be an array`);
assert.equal(context.KorytoState.validate(loaded).length, 0);

const roundTrip = context.KorytoSaveSystem.roundTrip(loaded);
assert.equal(roundTrip.ok, true);
assert.equal(roundTrip.restored.hero.attrs.charisma, 9);
assert.equal(roundTrip.restored.flags.nested.kept, 'ano');
assert.equal(roundTrip.restored.version, '0.14.3-test.1');

for (const phase of ['event','location','debate','coalition']) {
  context.clearStoredSavesForTest();
  const current = context.getStateForTest();
  current.phase = phase;
  current.ended = false;
  assert.equal(context.KorytoSaveSystem.manualSave(), false, `manual save must be blocked in ${phase}`);
  assert.equal(context.getStoredSaveForTest('koryto_v014'), null, `no manual save should exist in ${phase}`);
  assert.equal(context.KorytoSaveSystem.autoSaveGame(), false, `autosave must be blocked in ${phase}`);
  assert.equal(context.getStoredSaveForTest('koryto_v014_auto'), null, `no autosave should exist in ${phase}`);
}

context.clearStoredSavesForTest();
const mapState = context.getStateForTest();
mapState.phase = 'map';
mapState.ended = false;
mapState.currentEvent = null;
mapState.currentLocation = null;
const autosavesBefore = Number(mapState.audit.autosaves) || 0;
assert.equal(context.KorytoSaveSystem.manualSave(), true);
assert.equal(JSON.parse(context.getStoredSaveForTest('koryto_v014')).version, '0.14.3-test.1');
assert.equal(context.KorytoSaveSystem.autoSaveGame(), true);
const autoStored = JSON.parse(context.getStoredSaveForTest('koryto_v014_auto'));
assert.equal(autoStored.version, '0.14.3-test.1');
assert.equal(autoStored.audit.autosaves, autosavesBefore + 1);

context.clearStoredSavesForTest();
context.setStoredSaveForTest('koryto_v014', saveFixture('Ruční priorita', 4));
context.setStoredSaveForTest('koryto_v014_auto', saveFixture('Autosave druhý', 5));
loaded = context.KorytoSaveSystem.loadGame();
assert.equal(loaded.hero.name, 'Ruční priorita', 'valid manual save must win over autosave');
assert.equal(loaded.day, 4);

context.clearStoredSavesForTest();
context.setStoredSaveForTest('koryto_v014', '{broken');
context.setStoredSaveForTest('koryto_v014_auto', saveFixture('Záchranný autosave', 6));
loaded = context.KorytoSaveSystem.loadGame();
assert.equal(loaded.hero.name, 'Záchranný autosave', 'corrupt manual save must fall back to autosave');
assert.equal(loaded.day, 6);

context.clearStoredSavesForTest();
context.setStoredSaveForTest('koryto_v014', {});
context.setStoredSaveForTest('koryto_v014_auto', saveFixture('Autosave po prázdném JSON', 6));
const emptyObjectFallback = context.KorytoSaveSystem.readLoadable();
assert.equal(emptyObjectFallback.invalid[0].key, 'koryto_v014');
assert.equal(emptyObjectFallback.invalid[0].error, 'signature');
loaded = context.KorytoSaveSystem.loadGame();
assert.equal(loaded.hero.name, 'Autosave po prázdném JSON', 'empty JSON object must not hide a valid autosave');
assert.equal(loaded.day, 6);

context.clearStoredSavesForTest();
context.setStoredSaveForTest('koryto_v014', {version:'0.14', day:8, hero:{}, stats:{}});
context.setStoredSaveForTest('koryto_v014_auto', saveFixture('Autosave po falešném savu', 8));
loaded = context.KorytoSaveSystem.loadGame();
assert.equal(loaded.hero.name, 'Autosave po falešném savu', 'JSON without core save fields must be skipped');
assert.equal(loaded.day, 8);

context.clearStoredSavesForTest();
context.setStoredSaveForTest('koryto_v014', '{broken');
context.setStoredSaveForTest('koryto_v014_auto', '[broken');
context.setStoredSaveForTest('koryto_v013', saveFixture('Záchranný legacy save', 7));
loaded = context.KorytoSaveSystem.loadGame();
assert.equal(loaded.hero.name, 'Záchranný legacy save', 'corrupt current slots must fall back to a valid legacy save');
assert.equal(loaded.day, 7);

context.clearStoredSavesForTest();
context.setStoredSaveForTest('koryto_v014', '{broken');
context.setStoredSaveForTest('koryto_v014_auto', {});
assert.equal(context.KorytoSaveSystem.loadGame(), false, 'all syntactically or structurally corrupt saves must fail gracefully');

const simulations = context.runSimulationForTest(100, 24000);
assert.equal(simulations.length, 100);
assert.equal(simulations.every(result => result.ended), true);
for (const result of simulations) {
  for (const value of Object.values(result)) {
    if (typeof value === 'number') assert.equal(Number.isFinite(value), true, 'simulation result must not contain NaN');
  }
}
const finalState = context.getStateForTest();
assert.ok(finalState.actions >= 0, 'actions must not be negative');
for (const key of requiredObjects) assert.ok(finalState[key] && typeof finalState[key] === 'object', `${key} must survive simulations`);

const index = readText('index.html');
const appPos = index.indexOf('src/app.js');
const statePos = index.indexOf('src/state.js');
const savePos = index.indexOf('src/save-system.js');
const releasePos = index.indexOf('src/v0143.js');
assert.ok(appPos >= 0 && statePos > appPos && savePos > statePos && releasePos > savePos, 'offline module order must be app, state, save, release');
assert.doesNotMatch(index, /src\/v0142-rc3\.js/);
assert.match(index, /0\.14\.3 TEST\.1/);
assert.equal(readText('VERSION').trim(), '0.14.3-test.1');

const workflow = readText('.github/workflows/v0142-stability.yml');
const pullRequestTrigger = workflow.split('pull_request:')[1]?.split('workflow_dispatch:')[0] || '';
assert.match(pullRequestTrigger, /-\s+main\b/, 'release PRs to main must run TEST.1 checks');

for (const name of ['save','load','autoSave']) assert.equal(typeof context[name], 'function', `${name} global must remain available`);
assert.equal(context.KorytoTest143.runReleaseCheck().ok, true);

console.log('v0.14.3 modular state/save checks ok');
