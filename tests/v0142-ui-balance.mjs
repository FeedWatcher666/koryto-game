import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/v0142.js',
  'src/v0142c.js',
  'src/v0142d.js',
  'src/v0142-stability.js',
  'src/v0142-countercampaign.js',
  'src/v0142-ui-balance.js'
]) {
  vm.runInContext(readText(file), context, { filename: file });
}

const api = context.KorytoTest9;
assert.ok(api, 'TEST.9 compact UI API must be exposed');
assert.equal(api.VERSION, '0.14.2 TEST.9');
assert.equal(context.KorytoStability.VERSION, '0.14.2 TEST.10');
assert.deepEqual(Array.from(api.STRATEGY_IDS), ['briefingBtn','mediaBtn','pollBtn','promiseBtn','endorsementBtn']);
assert.deepEqual(Array.from(api.SYSTEM_IDS), ['saveBtn','loadBtn','exportBtn','restartBtn']);

const state = context.getStateForTest();
state.day = 6;
state.actions = 2;
state.flags = {};
state.ui = {};
state.stats = { support:20, trust:40, funds:4, heat:3, influence:8, integrity:50, leverage:0 };
state.voters = { parents:{support:40,turnout:.7}, undecided:{support:35,turnout:.5} };

api.normalizeUiState(state);
assert.equal(state.ui.v0142CompactMenus, true);
assert.equal(api.canUseStrategicAction(state, 'briefingBtn'), true);
api.markStrategicAction('Krizový štáb', state);
assert.equal(api.usedToday(state), true);
assert.equal(api.canUseStrategicAction(state, 'briefingBtn'), false);
assert.equal(state.flags.v0142StrategyUsedLabel, 'Krizový štáb');

state.flags.v0142Promise = { id:'school', title:'Střecha', created:4, due:7, status:'active', postponed:false };
assert.equal(api.urgentPromise(state), true);
assert.equal(api.canUseStrategicAction(state, 'promiseBtn'), true, 'urgent promise remains resolvable');

const before = api.snapshotRewards(state);
state.stats.support += 15;
state.stats.trust += 9;
state.stats.funds += 20;
state.stats.influence += 9;
state.stats.integrity += 10;
state.stats.leverage += 11;
state.voters.parents.support += 20;
const changes = api.applyRewardCaps(state, before);
assert.ok(changes.length >= 7);
assert.equal(state.stats.support, 26);
assert.equal(state.stats.trust, 45);
assert.equal(state.stats.funds, 12);
assert.equal(state.stats.influence, 14);
assert.equal(state.stats.integrity, 56);
assert.equal(state.stats.leverage, 5);
assert.equal(state.voters.parents.support, 47);

context.KorytoStability.normalizeStateExtensions(state);
assert.equal(state.flags.v0142StableVersion, '0.14.2 TEST.10');
assert.equal(context.KorytoStability.roundTripCheck(state).ok, true);

const index = readText('index.html');
assert.match(index, /0\.14\.2 TEST\.10/);
assert.match(index, /src\/v0142-ui-balance\.js/);
assert.ok(index.indexOf('src/v0142-ui-balance.js') > index.indexOf('src/v0142-countercampaign.js'));

console.log('v0.14.2 compact UI and balance ok');
