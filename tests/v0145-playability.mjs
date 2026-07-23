import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
vm.runInContext(readText('src/v0145-campaign.js'), context, { filename:'src/v0145-campaign.js' });
const api = context.KorytoCampaignExperience;
assert.ok(api);
assert.equal(api.VERSION, '0.14.5 TEST.10');
assert.equal(api.BUILD_VERSION, '0.14.5-test.10');
assert.equal(api.SAVE_VERSION, '0.14.3-test.2');
assert.equal(api.SAVE_SCHEMA, 1);
assert.equal(api.coachSteps.length, 4);
assert.equal(api.contentIds.length, 8);
for (const id of api.contentIds) assert.ok(context.events[id], `missing event ${id}`);

const fixture = {
  day: 4,
  quests: {register:{status:'active',deadlineBonus:0},roof:{status:'active',deadlineBonus:0},meadow:{status:'active',deadlineBonus:0}},
  factionPlans: {oldguard:{progress:61},business:{progress:38}},
  party: {marie:{name:'Marie',icon:'👩‍🏫',loyalty:35},bohumil:{name:'Bohumil',icon:'🗄️',loyalty:64}},
  companionAmbitions:{marie:{tension:48},bohumil:{tension:4}},
  flags:{},ui:{},stats:{heat:20,integrity:60},debt:0,promiseSummary:{}
};
const snapshot = api.prioritySnapshot(fixture, {questDefs:context.questDefs,questDeadline:id=>context.questDefs[id].deadline,factionPlanDefs:context.KorytoFactionData.factionPlanDefs,companions:context.companions});
assert.equal(snapshot.recommended.location, 'townhall');
assert.equal(snapshot.urgent[0].id, 'register');
assert.equal(snapshot.faction.id, 'oldguard');
assert.equal(snapshot.companion.id, 'marie');
assert.equal(api.companionTone(20).className, 'critical');
assert.equal(api.companionTone(80).className, 'good');
assert.match(api.counterForIntent('emptyPromise').counter, /Tabulka/);
api.ensureState(fixture);
assert.equal(fixture.flags.v0145PlayabilityComplete, '0.14.5 TEST.10');
assert.equal(fixture.ui.v0145.briefedDay, 0);
const deltas = api.deltaRows({stats:{support:10,trust:50},debt:0},{stats:{support:14,trust:46},debt:2});
assert.deepEqual(Array.from(deltas, row => [row.key,row.value]), [['support',4],['trust',-4],['debt',2]]);
const election = api.electionAnalysis({electionBreakdown:[{name:'Rodiče',icon:'🎒',votes:100,ballots:150,share:66.7},{name:'Senioři',icon:'🧓',votes:55,ballots:160,share:34.4}],promiseSummary:{broken:2},debt:4,stats:{heat:52,integrity:31}});
assert.equal(election.strongest.name, 'Rodiče');
assert.equal(election.weakest.name, 'Senioři');
assert.equal(election.costs.length, 4);
const simulations = context.runSimulationForTest(1000, 35000);
assert.equal(simulations.length, 1000);
assert.equal(simulations.every(result => result.ended), true);
for (const result of simulations) for (const value of Object.values(result)) if (typeof value === 'number') assert.equal(Number.isFinite(value), true);
const index = readText('index.html');
assert.match(index, /0\.14\.7 TEST\.10/);
assert.match(index, /src\/v0145-campaign\.js/);
assert.match(index, /src\/v0146-playtest\.js/);
assert.ok(index.indexOf('src/v0145-campaign.js') > index.indexOf('src/v0144-test10.js'));
const css = readText('styles/v0145.css');
for (const token of ['v0145-priority-bar','v0145-briefing-dialog','v0145-quest-group','v0145-election-analysis']) assert.match(css, new RegExp(token));
assert.equal(readText('VERSION').trim(),'0.14.7-test.10');
console.log('v0.14.5 playability remains covered inside v0.14.6');
