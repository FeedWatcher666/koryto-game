import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of ['src/v0142.js', 'src/v0142c.js', 'src/v0142d.js', 'src/v0142-stability.js']) {
  vm.runInContext(readText(file), context, { filename: file });
}

assert.ok(context.KorytoStability, 'stability API must be exposed');
assert.equal(context.KorytoStability.VERSION, '0.14.2 TEST.10');

const state = context.getStateForTest();
state.day = '8';
state.actions = '2';
state.flags = {
  v0142Promise: { id: 'school', created: 4, due: 99, status: 'unknown', postponed: 1 },
  v0142PollDay4: 1,
  v0142Endorsement5: 'invalid',
  v0142BriefingDay: '8',
  v0142StrategyUsedDay: '8',
  v0142StrategyUsedLabel: 123
};
state.commitments = [{ title: 'Testovací závazek', due: 99 }];
state.voters = { parents: { support: 180, turnout: -2 } };
state.stats.heat = '17';
state.ui = null;

context.KorytoStability.normalizeStateExtensions(state);

assert.equal(state.day, 8);
assert.equal(state.actions, 2);
assert.equal(state.flags.v0142StableVersion, '0.14.2 TEST.10');
assert.equal(state.flags.v0142Promise.status, 'active');
assert.equal(state.flags.v0142Promise.due, 13);
assert.equal(state.flags.v0142Promise.postponed, true);
assert.equal(state.flags.v0142Endorsement5, undefined);
assert.equal(state.flags.v0142PollDay4, true);
assert.equal(state.flags.v0142StrategyUsedDay, 8);
assert.equal(state.flags.v0142StrategyUsedLabel, '123');
assert.equal(state.voters.parents.support, 100);
assert.equal(state.voters.parents.turnout, 0);
assert.equal(state.commitments[0].due, 13);
assert.equal(state.commitments[0].status, 'active');
assert.equal(state.stats.heat, 17);
assert.equal(state.ui.v0142CompactMenus, true);

const roundTrip = context.KorytoStability.roundTripCheck(state);
assert.equal(roundTrip.ok, true, roundTrip.issues.join(', '));
assert.ok(roundTrip.bytes > 100);
assert.equal(context.KorytoStability.validateState(state).length, 0);

const index = readText('index.html');
assert.match(index, /0\.14\.2 TEST\.10/);
assert.match(index, /src\/v0142-stability\.js/);
assert.ok(index.indexOf('src/v0142-stability.js') > index.indexOf('src/v0142d.js'));

console.log('v0.14.2 stability ok');
