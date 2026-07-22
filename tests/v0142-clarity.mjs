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
  'src/v0142-ui-balance.js',
  'src/v0142-clarity.js'
]) {
  vm.runInContext(readText(file), context, { filename: file });
}

const api = context.KorytoTest10;
assert.ok(api, 'TEST.10 clarity API must be exposed');
assert.equal(api.VERSION, '0.14.2 TEST.10');
assert.equal(context.KorytoStability.VERSION, '0.14.2 TEST.10');

const state = context.getStateForTest();
state.day = 5;
state.actions = 2;
state.stats = { support:40, trust:55, funds:10, heat:10, influence:10, integrity:60, leverage:0 };
state.factions = { citizens:5, jzd:0, business:0, press:0, oldguard:12, officials:0 };
state.voters = Object.fromEntries(Object.entries(context.voterDefs).map(([id,def]) => [id,{support:def.base,turnout:def.turnout}]));
state.quests = { register:{status:'done'}, diesel:{status:'active'}, roof:{status:'active'} };
state.flags = {
  v0142Promise:{id:'school',title:'Opravit střechu',created:3,due:6,status:'active',postponed:false},
  v0142CounterCampaign:{active:{id:'leak',status:'execution',started:4,due:5,target:'paper',voter:'undecided'},history:[]}
};
state.commitments = [];
state.news = [];
state.log = [];
state.promiseSummary = {fulfilled:1,broken:0};
state.electionBreakdown = [];
state.opponent = {momentum:30,scandals:0};
state.debt = 0;

api.normalizeClarityState(state);
assert.equal(state.flags.v0142ClarityOnboardingDone, false);
assert.equal(Array.isArray(state.flags.v0142ClaritySummaries), true);

const priorities = api.buildPriorities(state);
assert.equal(priorities[0].kind, 'counter');
assert.equal(priorities[0].location, 'paper');
assert.match(api.priorityLabel(priorities[0]), /Operace Protiúnik/);

const before = api.snapshotState(state);
state.stats.support += 4;
state.stats.heat += 7;
state.factions.oldguard += 3;
state.voters.parents.support += 5;
state.news.unshift({day:5,type:'bad',text:'Testovací událost'});
const after = api.snapshotState(state);
const summary = api.summarizeDay(before,after);
assert.equal(summary.day, 5);
assert.equal(summary.news[0].text, 'Testovací událost');
assert.equal(summary.positive.some(item => item.key === 'support'), true);
assert.equal(summary.positive.some(item => item.key === 'parents'), true);

state.stats.trust = 70;
state.stats.integrity = 72;
state.stats.support = 58;
state.stats.heat = 55;
state.promiseSummary = {fulfilled:3,broken:1};
state.flags.v0142CounterCampaign.history = [{id:'competence',status:'blocked'},{id:'leak',status:'hit'}];
state.electionBreakdown = [{name:'Rodiče',share:62},{name:'Senioři',share:28}];
const drivers = api.endingDrivers(state);
assert.ok(drivers.positive.length > 0);
assert.ok(drivers.negative.length > 0);
assert.equal(drivers.positive.some(item => /Rodiče/.test(item.title)), true);
assert.equal(drivers.negative.some(item => /Senioři/.test(item.title)), true);

context.KorytoStability.normalizeStateExtensions(state);
assert.equal(state.flags.v0142StableVersion, '0.14.2 TEST.10');
assert.equal(context.KorytoStability.roundTripCheck(state).ok, true);

const simulations = context.runSimulationForTest(8, 9100);
assert.equal(simulations.length, 8);
assert.equal(simulations.every(result => result.ended), true, 'all full campaign simulations must reach an ending');

const index = readText('index.html');
assert.match(index, /0\.14\.2 TEST\.10/);
assert.match(index, /src\/v0142-clarity\.js/);
assert.ok(index.indexOf('src/v0142-clarity.js') > index.indexOf('src/v0142-ui-balance.js'));

console.log('v0.14.2 clarity and full-run checks ok');
