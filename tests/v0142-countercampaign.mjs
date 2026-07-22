import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/v0142.js',
  'src/v0142c.js',
  'src/v0142d.js',
  'src/v0142-stability.js',
  'src/v0142-countercampaign.js'
]) {
  vm.runInContext(readText(file), context, { filename: file });
}

const api = context.KorytoCounterCampaign;
assert.ok(api, 'counter-campaign API must be exposed');
assert.equal(api.VERSION, '0.14.2 TEST.8');
assert.equal(context.KorytoStability.VERSION, '0.14.2 TEST.8');

const state = context.getStateForTest();
state.day = 4;
state.actions = 2;
state.stats = { support:30, trust:40, funds:10, heat:5, influence:10, integrity:45, leverage:0 };
state.factions = { citizens:5, jzd:0, business:8, press:0, oldguard:12, officials:0 };
state.flags = { v0142Endorsement5:'business' };
state.voters = {};
state.opponent = { momentum:18, scandals:0 };

api.normalizeCampaignState(state);
assert.equal(api.selectStrategy(state), 'patrons', 'business patronage should trigger a patron counter-campaign');

const warning = api.startCampaign(state, 'competence', true);
assert.equal(warning.status, 'warning');
assert.equal(warning.target, 'townhall');
assert.equal(warning.due, 5);

state.day = 5;
api.advanceCampaign(state, true);
assert.equal(state.flags.v0142CounterCampaign.active.status, 'execution');

const blocked = api.resolveActive('open', state, true);
assert.equal(blocked.status, 'blocked');
assert.equal(blocked.response, 'open');
assert.equal(state.actions, 1);
assert.equal(state.stats.funds, 8);
assert.equal(state.flags.v0142CounterCampaign.active, null);
assert.equal(state.flags.v0142CounterCampaign.history[0].id, 'competence');

state.day = 7;
state.actions = 2;
state.stats.heat = 5;
state.flags.v0142CounterCampaign.active = null;
state.flags.v0142CounterCampaign.lastStartDay = 4;
const leak = api.startCampaign(state, 'leak', true);
assert.equal(leak.target, 'paper');
const heatBefore = state.stats.heat;
state.day = 9;
api.advanceCampaign(state, true);
assert.equal(state.flags.v0142CounterCampaign.active, null);
assert.equal(state.flags.v0142CounterCampaign.history[0].status, 'hit');
assert.equal(state.flags.v0142CounterCampaign.history[0].id, 'leak');
assert.ok(state.stats.heat > heatBefore);

state.flags.v0142CounterCampaign = { active:{ id:'invalid' }, history:'broken', lastStartDay:'99' };
const normalized = api.normalizeCampaignState(state);
assert.equal(normalized.active, null);
assert.equal(normalized.history.length, 0);
assert.equal(normalized.lastStartDay, 13);

const roundTrip = context.KorytoStability.roundTripCheck(state);
assert.equal(roundTrip.ok, true, roundTrip.issues.join(', '));

const index = readText('index.html');
assert.match(index, /0\.14\.2 TEST\.8/);
assert.match(index, /src\/v0142-countercampaign\.js/);
assert.ok(index.indexOf('src/v0142-countercampaign.js') > index.indexOf('src/v0142-stability.js'));

console.log('v0.14.2 counter-campaign ok');
