import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadGameContext, readText } from './helpers.mjs';

const context = loadGameContext();
for (const file of [
  'src/quest-data.js','src/quest-runtime.js','src/event-system.js','src/faction-system.js','src/companion-system.js',
  'src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js','src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js',
  'src/state.js','src/save-system.js','src/v0143.js','src/quest-system.js','src/v0143-test3.js','src/ux-system.js','src/v0143-test10.js'
]) vm.runInContext(readText(file), context, {filename:file});

assert.equal(context.KorytoQuestData.VERSION,'0.14.3 TEST.4');
assert.equal(context.KorytoQuestRuntime.VERSION,'0.14.3 TEST.5');
assert.equal(context.KorytoEventSystem.VERSION,'0.14.3 TEST.6');
assert.equal(context.KorytoFactionSystem.VERSION,'0.14.3 TEST.7');
assert.equal(context.KorytoCompanionSystem.VERSION,'0.14.3 TEST.8');
assert.equal(context.KorytoUXSystem.VERSION,'0.14.3 TEST.9');
assert.equal(context.KorytoTest14310.VERSION,'0.14.3 TEST.10');
assert.equal(context.KorytoTest14310.SAVE_VERSION,'0.14.3-test.2');

assert.equal(context.KorytoQuestData.validate().length,0);
assert.equal(context.KorytoQuestRuntime.validate(context.getStateForTest()).length,0);
assert.equal(context.KorytoEventSystem.validate().length,0);
assert.equal(context.KorytoFactionSystem.validate().length,0);
assert.equal(context.KorytoCompanionSystem.validate().length,0);
assert.ok(context.KorytoEventSystem.summary().total > 50);
assert.equal(Object.keys(context.KorytoQuestData.definitions).length,11);
assert.equal(Object.keys(context.KorytoFactionSystem.plans).length,4);
assert.equal(Object.keys(context.KorytoCompanionSystem.definitions).length,5);

const state=context.getStateForTest();
state.quests.register.stage='2';
state.quests.register.deadlineBonus='1';
context.KorytoQuestRuntime.normalize(state);
assert.equal(state.quests.register.stage,2);
assert.equal(state.quests.register.deadlineBonus,1);
assert.equal(context.KorytoQuestRuntime.deadline('register',state),5);

const report=context.KorytoTest14310.runReleaseCheck(state);
assert.equal(report.ok,true,report.issues.join('; '));
assert.equal(report.runtimeMode,'event-driven-contracts');
assert.equal(state.flags.v0143Test10Complete,'0.14.3 TEST.10');
assert.equal(context.KorytoReleaseCandidate.VERSION,'0.14.3 TEST.10');

const index=readText('index.html');
for(const script of ['quest-data.js','quest-runtime.js','event-system.js','faction-system.js','companion-system.js','ux-system.js','v0143-test10.js']) assert.match(index,new RegExp(script.replace('.','\.')));
assert.match(index,/0\.14\.3 TEST\.10/);
assert.equal(readText('VERSION').trim(),'0.14.3-test.10');

const source=readText('src/v0143-test10.js');
assert.doesNotMatch(source,/setInterval\s*\(/);
assert.doesNotMatch(source,/MutationObserver/);
const ux=readText('src/ux-system.js');
assert.match(ux,/100dvh/);
assert.match(ux,/safe-area-inset-bottom/);
assert.match(ux,/position:sticky/);

const simulations=context.runSimulationForTest(200,31000);
assert.equal(simulations.length,200);
assert.equal(simulations.every(result=>result.ended),true);
for(const result of simulations) for(const value of Object.values(result)) if(typeof value==='number') assert.equal(Number.isFinite(value),true);
console.log('v0.14.3 TEST.10 complete modular release checks ok');
