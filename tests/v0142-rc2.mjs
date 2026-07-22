import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js',
  'src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js','src/v0142-rc2.js'
]) vm.runInContext(readText(file), context, { filename:file });

const api = context.KorytoRC2;
assert.ok(api, 'RC2 API must be exposed');
assert.equal(api.VERSION, '0.14.2 RC2');
assert.equal(api.SAVE_VERSION, '0.14.2-rc2');

const state = context.getStateForTest();
state.version = '0.14.2-rc1';
state.day = '99';
state.actions = '-3';
state.phase = 'broken';
state.currentLocation = 'ghost';
state.currentEvent = 'missing';
state.flags = {};
state.ui = null;
api.normalizeReleaseState(state);
assert.equal(state.version, '0.14.2-rc2');
assert.equal(state.day, 14);
assert.equal(state.actions, 0);
assert.equal(state.phase, 'map');
assert.equal(state.currentLocation, null);
assert.equal(state.currentEvent, null);
assert.equal(state.flags.v0142ReleaseCandidate, '0.14.2 RC2');
assert.equal(api.validateReleaseState(state).length, 0);
assert.equal(api.runReleaseCheck(state).ok, true);
assert.equal(context.KorytoStability.roundTripCheck(state).ok, true);

state.day = 3;
state.actions = 2;
state.phase = 'map';
state.ended = false;
context.document.getElementById('saveBtn').onclick();
const manual = JSON.parse(context.localStorage.getItem('koryto_v014'));
assert.equal(manual.version, '0.14.2-rc2', 'manual save must persist RC2 version');
assert.equal(manual.flags.v0142ReleaseCandidate, '0.14.2 RC2');

vm.runInContext('autoSave()', context);
const automatic = JSON.parse(context.localStorage.getItem('koryto_v014_auto'));
assert.equal(automatic.version, '0.14.2-rc2', 'autosave must persist RC2 version');
assert.equal(automatic.flags.v0142ReleaseCandidate, '0.14.2 RC2');

const results = [];
for (const [index,strategy] of ['ideal','corrupt','legal','populist','mixed'].entries()) {
  for (let i=0;i<20;i++) results.push(vm.runInContext(`simulateStrategy(${JSON.stringify(strategy)}, ${12000 + index*100 + i})`, context));
}
assert.equal(results.length, 100);
assert.equal(results.every(result => result.ended), true, 'all RC2 campaigns must reach an ending');
assert.equal(results.every(result => Number.isFinite(result.vote) && result.vote >= 0 && result.vote <= 100), true);
assert.equal(results.every(result => Number.isFinite(result.seats) && result.seats >= 0 && result.seats <= 15), true);
assert.equal(results.every(result => Number.isFinite(result.heat) && Number.isFinite(result.debt)), true);
assert.ok(new Set(results.map(result => result.route)).size > 20, 'campaign routes should remain varied');

const index = readText('index.html');
assert.match(index, /0\.14\.2 RC2/);
assert.match(index, /0\.14\.2 TEST\.10/);
assert.match(index, /src\/v0142-rc2\.js/);
assert.ok(index.indexOf('src/v0142-rc2.js') > index.indexOf('src/v0142-clarity.js'));
assert.equal(readText('VERSION').trim(), '0.14.2-rc2');

console.log('v0.14.2 RC2 release checks ok');
