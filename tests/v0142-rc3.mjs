import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js',
  'src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js','src/v0142-rc3.js'
]) vm.runInContext(readText(file), context, { filename:file });

const api = context.KorytoRC3;
assert.ok(api, 'RC3 API must be exposed');
assert.equal(api.VERSION, '0.14.2 RC3');
assert.equal(api.SAVE_VERSION, '0.14.2-rc3');

context.clearStoredSavesForTest();
const legacySave = {
  version: '0.13', day: 3, actions: 2, phase: 'map',
  hero: { name: 'Legacy Kandidát', classId: 'bard', attrs: { charisma: 9 } },
  stats: { influence: 12, trust: 67 },
  flags: { legacyMarker: true }, completed: []
};
context.setStoredSaveForTest('koryto_v013', legacySave);
let loaded;
assert.doesNotThrow(() => { loaded = context.loadGameForTest(); }, 'real RC3 load path must render a minimal legacy save safely');
assert.equal(loaded.version, '0.14.2-rc3');
assert.equal(loaded.hero.name, 'Legacy Kandidát');
assert.equal(loaded.hero.attrs.charisma, 9);
assert.equal(loaded.stats.influence, 12);
assert.equal(loaded.stats.trust, 67);
assert.equal(loaded.flags.legacyMarker, true);
assert.equal(loaded.flags.v0142ReleaseCandidate, '0.14.2 RC3');
assert.equal(loaded.phase, 'map');
assert.equal(context.getElementForTest('gameScreen').classList.contains('active'), true);
for (const key of ['quests','party','factions','voters','factionPlans','companionAmbitions']) {
  assert.ok(loaded[key] && typeof loaded[key] === 'object' && !Array.isArray(loaded[key]), `${key} must be restored`);
}
for (const key of ['pendingEvents','items','news','commitments']) assert.ok(Array.isArray(loaded[key]), `${key} must be restored as an array`);
assert.equal(api.validateReleaseState(loaded).length, 0);
assert.equal(context.KorytoStability.roundTripCheck(loaded).ok, true);

// Codex P1 regression: the RC wrapper must preserve the original map-only save rule.
context.clearStoredSavesForTest();
const eventState = context.getStateForTest();
eventState.phase = 'event';
eventState.currentEvent = 'intro';
eventState.currentLocation = 'townhall';
api.installControlGuards();
const saveButton = context.getElementForTest('saveBtn');
assert.equal(typeof saveButton.onclick, 'function');
assert.doesNotThrow(() => saveButton.onclick());
assert.equal(context.getStoredSaveForTest('koryto_v014'), null, 'saving during an event must remain blocked');

eventState.phase = 'map';
eventState.currentEvent = null;
eventState.currentLocation = null;
assert.doesNotThrow(() => saveButton.onclick());
const mapSave = JSON.parse(context.getStoredSaveForTest('koryto_v014'));
assert.equal(mapSave.phase, 'map');
assert.equal(mapSave.version, '0.14.2-rc3');

context.clearStoredSavesForTest();
context.setStoredSaveForTest('koryto_v014', '{broken');
assert.doesNotThrow(() => context.loadGameForTest(), 'corrupt save should fail gracefully');

const simulations = context.runSimulationForTest(20, 15000);
assert.equal(simulations.length, 20);
assert.equal(simulations.every(result => result.ended), true);

const index = readText('index.html');
assert.match(index, /0\.14\.3 TEST\.2/);
assert.match(index, /src\/state\.js/);
assert.match(index, /src\/save-system\.js/);
assert.match(index, /src\/v0143\.js/);
assert.doesNotMatch(index, /src\/v0142-rc3\.js/);
assert.equal(readText('VERSION').trim(), '0.14.3-test.2');

console.log('v0.14.2 RC3 legacy load regressions remain covered');
