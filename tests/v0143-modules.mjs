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
assert.deepEqual(context.KorytoState.validate(loaded), []);

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
context.setStoredSaveForTest('koryto_v014', '{broken');
assert.equal(context.KorytoSaveSystem.loadGame(), false, 'corrupt JSON must fail gracefully');

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

for (const name of ['save','load','autoSave']) assert.equal(typeof context[name], 'function', `${name} global must remain available`);
assert.equal(context.KorytoTest143.runReleaseCheck().ok, true);

console.log('v0.14.3 modular state/save checks ok');
