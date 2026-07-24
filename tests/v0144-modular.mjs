import assert from 'node:assert/strict';
import {loadGameContext,readText} from './helpers.mjs';
const context=loadGameContext();
for (const file of [
  'src/event-system.js','src/faction-system.js','src/companion-system.js',
  'src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js',
  'src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js',
  'src/state.js','src/save-system.js','src/v0143.js','src/quest-system.js','src/v0143-test3.js',
  'src/ux-system.js','src/v0143-test10.js','src/balance-system.js','src/v0144-test10.js','src/v0145-campaign.js','src/v0146-playtest.js'
]) context.eval ? context.eval(readText(file)) : (await import('node:vm')).runInContext(readText(file), context, {filename:file});
assert.equal(context.KorytoCampaignExperience.VERSION,'0.14.5 TEST.10');
assert.equal(context.KorytoPlaytestLab.VERSION,'0.14.6 TEST.10');
assert.equal(context.KorytoPlaytestLab.BUILD_VERSION,'0.14.6-test.10');
assert.equal(context.KorytoPlaytestLab.SAVE_VERSION,'0.14.3-test.2');
const app=readText('src/app.js');
assert.ok(app.split('\n').length<1000,'app.js must stay below 1000 lines after AI playtest work');
for(const pattern of [/const events=\{/,/const questDefs=\{/,/const companions=\{/,/const factionPlanDefs=\{/,/const debateCardDefs=\{/)assert.doesNotMatch(app,pattern);
for(const name of ['KorytoCoreData','KorytoEventData','KorytoQuestData','KorytoCompanionData','KorytoFactionData','KorytoDebateData','KorytoQuestRuntime','KorytoEventSystem','KorytoFactionSystem','KorytoCompanionSystem','KorytoDebateSystem','KorytoElectionSystem','KorytoGameEngine','KorytoBalanceSystem','KorytoApp','KorytoCampaignExperience','KorytoPlaytestLab'])assert.ok(context[name],`${name} missing`);
assert.equal(Object.keys(context.KorytoQuestData.definitions).length,11);
assert.equal(context.KorytoEventSystem.validate().length,0);
assert.equal(context.KorytoFactionSystem.validate().length,0);
assert.equal(context.KorytoCompanionSystem.validate().length,0);
assert.equal(context.KorytoDebateSystem.validate().length,0);
assert.equal(context.KorytoElectionSystem.validate().length,0);
const state=JSON.parse(JSON.stringify(context.KorytoApp.baseState));state.hero={name:'Modulární kandidát',classId:'bard',origin:'idealist',attrs:{charisma:4}};state.quests={register:{status:'active',stage:'0',deadlineBonus:'2'}};
context.KorytoReleaseCandidate.normalizeReleaseState(state);
assert.equal(typeof state.quests.register.stage,'number');assert.equal(state.quests.register.deadlineBonus,2);assert.equal(context.KorytoQuestRuntime.deadline('register',state),6);
const debateState={...state,stats:{...state.stats,support:50,trust:50,heat:20},opponent:{momentum:20},factions:{...state.factions,oldguard:10},party:{},rivalAI:{},classMastery:null,debate:{nextBonus:0,mood:0,usedCards:{},lastCard:null}};
const base=context.KorytoDebateSystem.baseState(debateState,(n,a,b)=>Math.max(a,Math.min(b,n)));assert.equal(base.active,true);debateState.debate=base;const odds=context.KorytoDebateSystem.cardOdds('facts',debateState,()=>2,(n,a,b)=>Math.max(a,Math.min(b,n)),context.rollLevel);assert.equal(odds.clean+odds.costly+odds.complication,20);
const election=context.KorytoElectionSystem.calculate({...state,voters:Object.fromEntries(Object.entries(context.voterDefs).map(([id,v])=>[id,{support:v.base,turnout:v.turnout}])),conspiracy:{joined:false,resolved:false,exposed:false},factionPlans:{oldguard:{progress:0},press:{progress:0}},flags:{},promiseSummary:{broken:0},debt:0},context.voterDefs,10);assert.ok(election.vote>=4&&election.vote<=72);assert.ok(election.council.seats>=1&&election.council.seats<=14);
context.clearStoredSavesForTest();
context.setStoredSaveForTest('koryto_v013',{version:'0.13',day:3,actions:2,phase:'map',hero:{name:'Legacy 0.13',classId:'bard',origin:'idealist',attrs:{charisma:4}},stats:{support:20,trust:55,funds:12,heat:0,influence:10,integrity:55,leverage:0},flags:{legacy:true},quests:{register:{status:'active',stage:'0',deadlineBonus:'1'}}});
const loaded=context.KorytoSaveSystem.loadGame();
assert.equal(loaded.hero.name,'Legacy 0.13');assert.equal(loaded.version,'0.14.3-test.2');assert.equal(loaded.saveSchema,1);assert.equal(loaded.quests.register.stage,0);assert.equal(loaded.quests.register.deadlineBonus,1);assert.equal(context.KorytoState.validate(loaded).length,0);
const report=context.KorytoReleaseCandidate.runReleaseCheck(state);assert.equal(report.ok,true,report.issues.join('\n'));assert.equal(report.runtimeMode,'modular-orchestrator');
const index=readText('index.html');const order=['core-data.js','companion-data.js','faction-data.js','debate-data.js','quest-data.js','event-data.js','quest-runtime.js','debate-system.js','election-system.js','game-engine.js','app.js','v0144-test10.js','v0145-campaign.js','v0146-playtest.js','v0148-visual-system.js','v0149-pixel-assets.js','v0150-visual-foundation.js','v0151-graphics.js','v0152-reference-match.js'].map(x=>index.indexOf(x));assert.ok(order.every((v,i)=>v>=0&&(i===0||v>order[i-1])),'module order invalid');assert.equal(readText('VERSION').trim(),'0.15.2-test.1');
for(const file of ['src/core-data.js','src/event-data.js','src/game-engine.js','src/debate-system.js','src/election-system.js','src/v0144-test10.js','src/v0146-playtest.js','src/v0151-graphics.js','src/v0152-reference-match.js']){const text=readText(file);assert.doesNotMatch(text,/setInterval\s*\(/);assert.doesNotMatch(text,/MutationObserver/);}
console.log('v0.14.4 modular architecture remains intact in v0.15.2');
