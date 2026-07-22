import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js',
  'src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js','src/v0142-rc1.js'
]) vm.runInContext(readText(file), context, { filename:file });

const api = context.KorytoRC1;
assert.ok(api, 'RC1 API must be exposed');
assert.equal(api.VERSION, '0.14.2 RC1');
assert.equal(api.SAVE_VERSION, '0.14.2-rc1');

const state = context.getStateForTest();
state.version = '0.13';
state.day = '99';
state.actions = '-3';
state.phase = 'broken';
state.currentLocation = 'ghost';
state.currentEvent = 'missing';
state.flags = {};
state.ui = null;
api.normalizeReleaseState(state);
assert.equal(state.version, '0.14.2-rc1');
assert.equal(state.day, 14);
assert.equal(state.actions, 0);
assert.equal(state.phase, 'map');
assert.equal(state.currentLocation, null);
assert.equal(state.currentEvent, null);
assert.equal(state.flags.v0142ReleaseCandidate, '0.14.2 RC1');
assert.equal(api.validateReleaseState(state).length, 0);
assert.equal(api.runReleaseCheck(state).ok, true);
assert.equal(context.KorytoStability.roundTripCheck(state).ok, true);

state.phase = 'location';
state.currentLocation = 'townhall';
api.normalizeReleaseState(state);
assert.equal(state.phase, 'location');
state.currentLocation = 'ghost';
api.normalizeReleaseState(state);
assert.equal(state.phase, 'map');
state.phase = 'event';
state.currentEvent = 'intro';
api.normalizeReleaseState(state);
assert.equal(state.phase, 'event');
state.currentEvent = 'missing';
api.normalizeReleaseState(state);
assert.equal(state.phase, 'map');

const results = [];
for (const [index,strategy] of ['ideal','corrupt','legal','populist','mixed'].entries()) {
  for (let i=0;i<20;i++) results.push(vm.runInContext(`simulateStrategy(${JSON.stringify(strategy)}, ${12000 + index*100 + i})`, context));
}
assert.equal(results.length, 100);
assert.equal(results.every(result => result.ended), true, 'all RC1 campaigns must reach an ending');
assert.equal(results.every(result => Number.isFinite(result.vote) && result.vote >= 0 && result.vote <= 100), true);
assert.equal(results.every(result => Number.isFinite(result.seats) && result.seats >= 0 && result.seats <= 15), true);
assert.equal(results.every(result => Number.isFinite(result.heat) && Number.isFinite(result.debt)), true);
assert.ok(new Set(results.map(result => result.route)).size > 20, 'campaign routes should remain varied');
const average = (strategy,key) => {
  const rows = results.filter(result => result.strategy === strategy);
  return rows.reduce((sum,result) => sum + result[key],0) / rows.length;
};
assert.notEqual(average('ideal','heat'), average('corrupt','heat'), 'clean and corrupt strategies must produce different risk profiles');

const index = readText('index.html');
assert.match(index, /0\.14\.2 RC1/);
assert.match(index, /0\.14\.2 TEST\.10/);
assert.match(index, /src\/v0142-rc1\.js/);
assert.ok(index.indexOf('src/v0142-rc1.js') > index.indexOf('src/v0142-clarity.js'));
assert.equal(readText('VERSION').trim(), '0.14.2-rc1');

console.log('v0.14.2 RC1 release checks ok');
