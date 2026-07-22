"use strict";
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const deep=o=>JSON.parse(JSON.stringify(o));
function hashSeed(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(){state.rngState=(Math.imul(state.rngState>>>0,1664525)+1013904223)>>>0;return state.rngState/4294967296}
const pick=a=>a[Math.floor(rng()*a.length)];
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const rand=(a,b)=>a+Math.floor(rng()*(b-a+1));
const AUTOTEST=location.search.includes("autotest=1");
const {classes,locations,voterDefs,baseState}=globalThis.KorytoCoreData;
const {companions,companionStoryDefs,relationshipDefs,conflictDefs,supportProfiles,companionAmbitionDefs}=globalThis.KorytoCompanionData;
const {factionPlanDefs,conspiracyPieces,coalitionPartnerDefs,factionActionDefs,rivalOperationDefs,echoEventDefs}=globalThis.KorytoFactionData;
const {classMasteryDefs,debateCardDefs,rivalMoveDefs,rivalCounterDefs}=globalThis.KorytoDebateData;
let state=deep(baseState),selectedClass="bard",pendingResolution=null,memorySave=null;
function recordWorldAction(owner,text,type="normal",location=""){
 state.worldActions=state.worldActions||[];state.worldActions.unshift({day:state.day,owner,text,type,location});state.worldActions=state.worldActions.slice(0,18);
}
function factionDailyActions(){
 const scored=Object.keys(factionActionDefs).map(id=>({id,score:(state.factionPlans[id]?.progress||0)+rng()*35})).sort((a,b)=>b.score-a.score).slice(0,2);
 for(const {id} of scored){const pool=factionActionDefs[id],a=pick(pool);a.apply();recordWorldAction(factionPlanDefs[id]?.owner||id,`${a.title}: ${a.text}`,a.type,a.location)}
}
function initCompanionAmbitions(){state.companionAmbitions={};for(const id of Object.keys(companionAmbitionDefs))state.companionAmbitions[id]={progress:18,tension:0,resolved:false,path:null,queued:false,withheldUntil:0,lastActionDay:0}}
function companionInOpenConflict(id){return Object.entries(conflictDefs).some(([cid,d])=>{const c=state.conflictStates?.[cid];return (d.a===id||d.b===id)&&c?.queued&&!c?.resolved})}
function companionAvailability(id){
 const a=state.companionAmbitions?.[id];if(!state.party[id])return {ok:false,reason:"není ve štábu"};if(a?.withheldUntil>=state.day)return {ok:false,reason:`stáhl podporu do dne ${a.withheldUntil}`};if(companionInOpenConflict(id)&&Object.values(relationshipDefs).some(d=>(d.a===id||d.b===id)&&relationshipScore(d.a,d.b)<-32))return {ok:false,reason:"odmítá společný zásah během konfliktu"};return {ok:true,reason:"připraven"}
}
function updateCompanionAmbitions(eventId,choice,level){
 const tags=choice.tags||[];for(const [id,d] of Object.entries(companionAmbitionDefs)){if(!state.party[id])continue;const a=state.companionAmbitions[id]||(state.companionAmbitions[id]={progress:18,tension:0,resolved:false,path:null,queued:false,withheldUntil:0,lastActionDay:0});if(a.resolved)continue;let pos=d.positive.some(t=>tags.includes(t)),neg=d.negative.some(t=>tags.includes(t));if(eventId===companionStoryDefs[id]?.location)pos=true;if(pos)a.progress=clamp(a.progress+(level==="complication"?2:7),0,100);if(neg)a.tension=clamp(a.tension+(level==="complication"?10:6),0,100);if(level==="complication"&&neg)a.tension=clamp(a.tension+4);if((a.progress>=52||a.tension>=38)&&!a.queued&&!state.flags["resolved_"+d.event]){a.queued=true;schedule(d.event,3);recordWorldAction(companions[id].name,`Osobní agenda vstoupila do kampaně: ${d.name}.`,a.tension>a.progress?"bad":"normal",d.location)}}
}
function companionAutonomyTurn(){
 const candidates=Object.keys(state.party).filter(id=>{const a=state.companionAmbitions?.[id];return a&&!a.resolved&&a.lastActionDay!==state.day&&(a.progress>=34||a.tension>=28)});if(!candidates.length)return;const id=pick(candidates),a=state.companionAmbitions[id],d=companionAmbitionDefs[id];a.lastActionDay=state.day;
 if(a.tension>a.progress){state.party[id].loyalty=clamp(state.party[id].loyalty-3);a.tension=clamp(a.tension+3);recordWorldAction(companions[id].name,`Jednal bez souhlasu štábu kvůli agendě „${d.name}“.`,"bad",d.location);if(a.tension>=55)a.withheldUntil=Math.max(a.withheldUntil||0,state.day+1)}
 else{state.party[id].loyalty=clamp(state.party[id].loyalty+1);a.progress=clamp(a.progress+3);const benefits={marie:{trust:2,citizens:2},daniela:{press:2,heat:-2},brazda:{jzd:2,influence:1},bohumil:{officials:2,heat:-1},holub:{business:2,funds:1}};effect(benefits[id]||{});recordWorldAction(companions[id].name,`Posunul vlastní agendu „${d.name}“ a přitom pomohl kampani.`,"good",d.location)}
}
function registerEcho(source,context={}){const d=echoEventDefs[source];if(!d||state.echoHistory?.some(x=>x.source===source))return;state.echoes=state.echoes||[];state.echoes.push({source,event:d.event,due:Math.min(13,state.day+d.delay),context});state.echoHistory=state.echoHistory||[];state.echoHistory.push({source,registered:state.day});}
function triggerEchoes(){for(const e of (state.echoes||[]).filter(x=>!x.triggered&&state.day>=x.due)){e.triggered=true;state.flags["echo_context_"+e.source]=e.context;schedule(e.event,2);recordWorldAction("Minulost",`Rozhodnutí z kauzy ${e.source} se vrací jako nový problém.`,"bad",eventById(e.event)?.location||"")}}
function operationIdForAdaptation(a){return a==="public"?"narrative":a==="legal"?"paperFlood":a==="power"?"defection":a==="corrupt"?"dossier":"cynicism"}
function startRivalOperation(){const id=operationIdForAdaptation(state.rivalAI?.adaptation||"ethical");state.rivalOperation={id,progress:0,stage:0,revealed:state.rivalAI?.revealed||false,completed:false,history:[]};recordWorldAction("Vladimír Věčný",`Spustil ${rivalOperationDefs[id].name}.`,"bad",rivalOperationDefs[id].location)}
function rivalOperationTurn(){
 state.rivalOperation=state.rivalOperation||{};if(!state.rivalOperation.id&&state.day>=5&&state.rivalAI?.adaptation)startRivalOperation();const o=state.rivalOperation;if(!o.id||o.completed)return;const def=rivalOperationDefs[o.id];o.revealed=o.revealed||state.rivalAI?.revealed||state.party.daniela?.loyalty>=68;o.progress=clamp((o.progress||0)+10+state.opponent.momentum/22+(state.rivalAI?.adaptation===def.adapt?4:0),0,100);const next=o.progress>=82?3:o.progress>=52?2:o.progress>=24?1:0;if(next>o.stage){o.stage=next;o.history.push({day:state.day,stage:next});schedule(`rivalOperationStage${next}`,2);recordWorldAction("Vladimír Věčný",`${def.name}: ${def.stages[next-1]}.`,"bad",def.location)}if(o.progress>=100)o.completed=true;
}
function rivalOperationEvent(stage){
 const o=state.rivalOperation,def=rivalOperationDefs[o?.id]||rivalOperationDefs.cynicism;const names={1:"První tah operace",2:"Operace nabírá rychlost",3:"Finální úder před volbami"};const texts={narrative:["Věčný rozjíždí sérii vystoupení, v nichž každou vaši akci popisuje jako improvizaci bez zkušeností.","Jeho lidé opakují tutéž větu tak dlouho, až se z ní stane místní fakt."],paperFlood:["Na štáb přicházejí žádosti, stížnosti a procesní námitky. Každá je drobná, dohromady však žerou čas.","Věčný sází na to, že poslední dny strávíte vysvětlováním příloh."],defection:["Nejméně loajální člen štábu dostal nabídku na povolební funkci.","Nabídka je samozřejmě neformální, ale má kancelář, plat a parkovací místo."],dossier:["Do redakce dorazila složka propojující vaše dary, zakázky a několik velmi kreativních faktur.","Část je pravdivá. Část je dobře vysázená."],cynicism:["Věčný tvrdí, že jste slušný člověk, což v jeho podání zní jako diagnóza.","Kampaň staví na otázce, zda morálka umí opravit střechu a vyvézt popelnice."]};
 return {id:`rivalOperationStage${stage}`,location:def.location,title:`${def.icon} ${names[stage]}: ${o.revealed?def.name:"Neznámá soupeřova operace"}`,emoji:def.icon,kicker:"VÍCEKROKOVÁ PROTIOPERACE",queued:true,text:()=>texts[o.id]||texts.cynicism,choices:[
  {label:"Odhalit operaci veřejně",detail:"Získáte kontrolu nad příběhem, pokud máte fakta a nervy.",check:{attr:"resilience",dc:11+stage},tags:["transparent","public","ethical"],success:makeOutcome("Operace dostane jméno, vlastní titulek a příliš mnoho svědků, aby mohla pokračovat skrytě.",{trust:5,support:4,heat:-4,oldguard:-4},["transparent","public"],()=>{o.progress=clamp(o.progress-20);o.revealed=true}),fail:makeOutcome("Věčný označí vaše obvinění za výmluvu člověka, který nezvládá tlak.",{support:-5,trust:-3,heat:5},["public"])},
  {label:"Rozebrat operaci procesně",detail:"Méně fotogenické, ale může zastavit konkrétní mechanismus.",check:{attr:"intellect",dc:12+stage},tags:["legal","transparent"],success:makeOutcome("Jedna příloha, jeden svědek a jeden termín operaci zpomalí víc než tisková konference.",{officials:5,influence:4,heat:-3},["legal"],()=>o.progress=clamp(o.progress-24)),fail:makeOutcome("Procesní obrana spotřebuje přesně ten čas, který měla zachránit.",{funds:-2,heat:5,support:-3},["legal"])},
  {label:"Otočit operaci proti jejím autorům",detail:"Použijete stejnou síť, jen s jiným příjemcem škody.",check:{attr:"cunning",dc:13+stage},tags:["power","corrupt"],success:makeOutcome("Část operace zasáhne Věčného. Část zůstane ve vašem šuplíku pro příště.",{leverage:5,influence:5,oldguard:-6,integrity:-5},["power","corrupt"],()=>o.progress=clamp(o.progress-18)),fail:makeOutcome("Síť pozná svého majitele a odmítne změnit účetní období.",{heat:10,trust:-6,integrity:-6},["corrupt"])}
 ]}
}
function livingWorldDailyTurn(){factionDailyActions();companionAutonomyTurn();triggerEchoes();rivalOperationTurn()}

function resolveAmbition(id,path,withholdDays=0){const a=state.companionAmbitions[id]||(state.companionAmbitions[id]={});a.resolved=true;a.path=path;a.queued=true;if(withholdDays)a.withheldUntil=state.day+withholdDays;const p=state.party[id];if(p)p.loyalty=clamp(p.loyalty+(withholdDays?-8:6));recordWorldAction(companions[id]?.name||id,`Osobní agenda uzavřena cestou „${path}“.`,withholdDays?"bad":"good",companionAmbitionDefs[id]?.location||"")}

function initLivingWorld(){
 state.factionPlans={};for(const [id,d] of Object.entries(factionPlanDefs))state.factionPlans[id]={progress:id==="oldguard"?18:id==="business"?12:8,stage:0,revealed:id==="oldguard",blocked:0,completed:false};
 state.conspiracy={name:"Operace SILO",clues:0,pieces:{diesel:false,roof:false,meadow:false,archive:false},revealed:false,joined:false,joinedDeals:0,exposed:false,resolved:false,stage:0};
 state.companionStories={};for(const id of Object.keys(companionStoryDefs))state.companionStories[id]={stage:0,done:false,perk:null};
 state.worldChanges={school:"leaking",meadow:"open",jzd:"restless",townhall:"closed",paper:"quiet"};state.planHistory=[];
 state.relationships={};for(const [id,d] of Object.entries(relationshipDefs))state.relationships[id]=d.base;
 state.conflictStates={};for(const id of Object.keys(conflictDefs))state.conflictStates[id]={queued:false,resolved:false,path:null,aftermath:false};
 state.selectedSupport=null;state.companionSupportUsed={};state.coalition={active:false,round:0,maxRounds:3,partners:{},joined:[],seats:0,log:[],contracts:[],selected:null,resources:{credibility:0,patronage:0,pressure:0}};state.preCoalitionEnding=null;
 state.classMastery=null;state.classAbilityUsed=false;state.debate={active:false};state.rivalAI={adaptation:null,reads:{},counters:0,lastCounterDay:0,revealed:false};state.worldActions=[];state.factionActionCooldowns={};initCompanionAmbitions();state.echoes=[];state.echoHistory=[];state.rivalOperation={};state.ui={pixelMap:true};
}
function planStage(progress){return progress>=100?4:progress>=75?3:progress>=50?2:progress>=25?1:0}
function planStepText(id){const p=state.factionPlans[id],d=factionPlanDefs[id];if(!p||!d)return"";return p.completed?"Plán dokončen":d.steps[Math.min(p.stage,d.steps.length-1)]}
function changePlan(id,delta,reason=""){
 const p=state.factionPlans[id];if(!p)return;const before=p.progress;p.progress=clamp(p.progress+delta,0,100);const oldStage=p.stage;p.stage=planStage(p.progress);
 if(reason&&Math.abs(p.progress-before)>=3)state.planHistory.unshift({day:state.day,id,text:reason,delta:Math.round(p.progress-before)});
 if(p.stage>oldStage)onPlanStage(id,p.stage);if(p.progress>=100)p.completed=true;
}
function onPlanStage(id,stage){
 const eventsByPlan={oldguard:["planOldguardBus","planOldguardCommission","planOldguardPact","planOldguardCouncil"],jzd:["planJzdList","planJzdCleanup","planJzdConvoy","planJzdDemand"],business:["planBusinessSurvey","planBusinessContract","planBusinessNetwork","planBusinessSignature"],press:["planPressQuestions","planPressOwners","planPressLedger","planPressSpecial"]};
 const ev=eventsByPlan[id]?.[stage-1];if(ev&&!state.flags["resolved_"+ev]){schedule(ev,2);addNews(`${factionPlanDefs[id].owner} posunul plán „${factionPlanDefs[id].name}“: ${factionPlanDefs[id].steps[stage-1]}.`,id==="press"?"normal":"bad")}
}
function factionPlanTurn(){
 const fp=state.factionPlans;
 changePlan("oldguard",1.7+Math.max(0,state.factions.oldguard)/45+state.opponent.momentum/85-(state.factions.citizens>20?1.5:0),"Věčný využil další den kampaně.");
 changePlan("jzd",1.1+Math.max(0,state.factions.jzd)/55+(state.party.brazda?.loyalty>65?.8:0)-(state.flags.policeAlly?1.5:0),"JZD sčítá lidi, techniku a laskavosti.");
 changePlan("business",1.1+Math.max(0,state.factions.business)/58+activeCommitments("Holub").length*.8-(state.conspiracy.exposed?4:0),"Holub připravuje obchodní část budoucnosti obce.");
 changePlan("press",.9+state.stats.heat/62+state.conspiracy.clues*.7+(state.party.daniela?.loyalty>65?.6:0),"Redakce skládá rozpory do jednoho příběhu.");
}
function revealPlan(id){if(state.factionPlans[id])state.factionPlans[id].revealed=true}
function addConspiracyClue(piece,reason=""){
 const c=state.conspiracy;if(!c||c.pieces[piece])return;c.pieces[piece]=true;c.clues++;if(c.clues>=2)c.revealed=true;
 addNews(`Nová stopa Operace SILO: ${conspiracyPieces[piece]}`,"normal");log(`Stopa SILO – ${piece}: ${reason||conspiracyPieces[piece]}`);
 if(c.clues===2&&!state.flags.siloPatternQueued)schedule("siloPattern",3),state.flags.siloPatternQueued=true;
 if(c.clues===3&&!state.flags.siloLedgerQueued)schedule("siloLedger",3),state.flags.siloLedgerQueued=true;
 if(c.clues>=4&&!state.flags.siloFinalQueued)schedule(c.joined?"siloOffer":"siloConfrontation",4),state.flags.siloFinalQueued=true;
}
function trackLivingWorld(eventId,choice,level){
 const tags=choice.tags||[],success=level!=="complication";
 if(tags.includes("ethical")||tags.includes("transparent")){changePlan("oldguard",-3,"Veřejná kontrola zpomalila staré struktury.");changePlan("press",2,"Transparentní krok přinesl ověřitelnou stopu.")}
 if(tags.includes("corrupt")||tags.includes("contract")){changePlan("business",5,"Soukromá dohoda urychlila Projekt SILO.");if(tags.includes("jzdDeal"))changePlan("jzd",5,"Dohoda upevnila mobilizaci JZD.")}
 if(tags.includes("pressAttack")||tags.includes("lie"))changePlan("press",4,"Rozpor přitáhl pozornost redakce.");
 if(tags.includes("police"))changePlan("jzd",-4,"Vyšetřování narušilo plán JZD.");
 if(eventId==="diesel"){if(tags.includes("corrupt")){state.conspiracy.joined=true;state.conspiracy.joinedDeals++;state.conspiracy.revealed=true}else if(success)addConspiracyClue("diesel","Stopa vznikla při řešení družstevní nafty.")}
 if(eventId==="roof"){state.worldChanges.school=success?"repaired":"damaged";if(tags.includes("contract")){state.conspiracy.joined=true;state.conspiracy.joinedDeals++}else if(success&&(tags.includes("transparent")||tags.includes("legal")))addConspiracyClue("roof")}
 if(eventId==="meadow"){state.worldChanges.meadow=tags.includes("contract")?"surveyed":"protected";if(tags.includes("contract")||tags.includes("corrupt")){state.conspiracy.joined=true;state.conspiracy.joinedDeals++}else if(success)addConspiracyClue("meadow")}
 if(state.conspiracy.joinedDeals>=2&&!state.flags.siloFinalQueued&&state.day>=6){schedule("siloOffer",5);state.flags.siloFinalQueued=true;state.conspiracy.revealed=true;addNews("Holub posílá pozvánku do zadního salonku. Projekt SILO má pro vás prázdnou židli.","bad")}
 if(eventId==="oldfiles"){state.worldChanges.townhall=tags.includes("destroyEvidence")?"smoke":"open";if(!tags.includes("destroyEvidence")&&success)addConspiracyClue("archive")}
 if(eventId==="newsletter")state.worldChanges.paper=tags.includes("pressAttack")?"hostile":"active";
}
function locationDesc(id){
 const d=locations[id].desc,w=state.worldChanges||{},fp=state.factionPlans||{};
 if(id==="school"&&w.school==="repaired")return"Střecha drží. Politické využití dětí nikoli.";
 if(id==="school"&&w.school==="damaged")return"Plachta vlaje jako volební program před rozpočtem.";
 if(id==="meadow"&&w.meadow==="surveyed")return"Geodetické kolíky rostou rychleji než tráva.";
 if(id==="meadow"&&w.meadow==="protected")return"Louka zatím patří lidem. Holub ji stále oslovuje jako budoucí aktivum.";
 if(id==="jzd"&&fp.jzd?.stage>=2)return"Nádrž je čerstvě umytá a zaměstnanci mají jednotný názor.";
 if(id==="townhall"&&fp.oldguard?.stage>=2)return"Dveře jsou otevřené. Přístup k volební komisi nikoli.";
 if(id==="paper"&&fp.press?.stage>=2)return"Redakce spojuje šipkami osoby, firmy a vaše výroky.";
 return d;
}
function planLocationMarker(id){
 const active=Object.entries(factionPlanDefs).filter(([pid,d])=>d.location===id&&state.factionPlans[pid]?.stage>0).map(([pid])=>factionPlanDefs[pid].icon);
 const pulse=(state.worldActions||[]).find(x=>x.day===state.day&&x.location===id)?"•":"";
 const rival=state.rivalOperation?.id&&rivalOperationDefs[state.rivalOperation.id]?.location===id&&!state.rivalOperation.completed?rivalOperationDefs[state.rivalOperation.id].icon:"";
 return [...active,rival,pulse].filter(Boolean).join("");
}

function relationshipKey(a,b){return Object.keys(relationshipDefs).find(k=>{const d=relationshipDefs[k];return (d.a===a&&d.b===b)||(d.a===b&&d.b===a)})}
function relationshipScore(a,b){const k=relationshipKey(a,b);return k?(state.relationships?.[k]??relationshipDefs[k].base):0}
function adjustRelationship(a,b,delta,reason=""){
 const k=relationshipKey(a,b);if(!k)return;state.relationships[k]=clamp((state.relationships[k]??relationshipDefs[k].base)+delta,-100,100);if(reason)addNews(`${companions[a]?.name||a} × ${companions[b]?.name||b}: ${reason}`,(delta<0?"bad":"normal"));
}
function resolveCompanionConflict(id,path){
 const c=state.conflictStates[id]||(state.conflictStates[id]={});c.resolved=true;c.path=path;c.aftermath=false;const d=conflictDefs[id];schedule(d.after,2);addNews(`Konflikt ve štábu byl dočasně uzavřen. V politice je slovo dočasně důležitější než uzavřen.`,"normal");
}
function triggerCompanionConflicts(){
 let specific=false;for(const [id,d] of Object.entries(conflictDefs)){const c=state.conflictStates[id]||(state.conflictStates[id]={queued:false,resolved:false,path:null,aftermath:false});if(c.queued||c.resolved)specific=true;if(state.day>=d.day&&state.party[d.a]&&state.party[d.b]&&!c.queued&&!c.resolved&&!state.flags["resolved_"+d.event]){c.queued=true;specific=true;schedule(d.event,2);addNews(`${state.party[d.a].name} a ${state.party[d.b].name} přestali předstírat, že jsou jeden tým.`,"bad")}}
 if(state.day>=9&&!specific&&!state.flags.generalConflictQueued&&!state.flags["resolved_conflictGeneral"]){const ids=Object.keys(state.party);if(ids.length>=2){let pair=null,score=999;for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const v=relationshipScore(ids[i],ids[j]);if(v<score){score=v;pair=[ids[i],ids[j]]}}state.flags.generalConflictPair=pair||ids.slice(0,2);state.flags.generalConflictQueued=true;schedule("conflictGeneral",2);addNews("Dvě osobnosti štábu zjistily, že sdílené logo není totéž co společný názor.","bad")}}
}
function supportEligible(id){const av=companionAvailability(id);return !!(av.ok&&state.party[id]&&state.companionStories?.[id]?.perk&&!state.companionSupportUsed?.[id])}
function selectedSupportBonus(choice){const id=state.selectedSupport;if(!id||!supportEligible(id))return 0;const p=supportProfiles[id];return p?.match(choice.tags||[])?3:1}
function supportBarHtml(){
 const ids=Object.keys(state.party).filter(supportEligible);if(!ids.length)return"";
 return `<div class="support-strip"><strong>Aktivní zásah družiny</strong><div class="support-actions">${ids.map(id=>`<button type="button" class="support-btn ${state.selectedSupport===id?"selected":""}" data-support="${id}">${companions[id].icon} ${companions[id].name}: ${supportProfiles[id].label}${state.selectedSupport===id?" · vybráno":""}</button>`).join("")}</div><small>Každý odemčený zásah lze použít jednou za kampaň. Konflikt, únava nebo nesplněná osobní agenda mohou podporu dočasně zablokovat.</small></div>`;
}
function bindSupportButtons(){document.querySelectorAll("[data-support]").forEach(b=>b.onclick=()=>{state.selectedSupport=state.selectedSupport===b.dataset.support?null:b.dataset.support;showEvent(state.currentEvent)})}
function consumeSelectedSupport(choice){const id=state.selectedSupport;if(!id||!supportEligible(id))return;const bonus=selectedSupportBonus(choice);state.companionSupportUsed[id]=true;state.partyFatigue[id]=clamp((state.partyFatigue[id]||0)+1,0,4);log(`${companions[id].name} použil aktivní zásah ${supportProfiles[id].label} (${bonus>1?"přesný":"improvizovaný"}).`);state.selectedSupport=null}
function coalitionResources(){
 const credibility=clamp(Math.round(state.stats.trust*.34+state.stats.integrity*.26+Math.max(0,state.factions.press)*.12+Math.max(0,state.factions.officials)*.12+state.promiseSummary.fulfilled*4-state.promiseSummary.broken*7-state.stats.heat*.09),0,100);
 const patronage=clamp(Math.round(state.stats.influence*.32+Math.max(0,state.factions.business)*.14+Math.max(0,state.factions.jzd)*.13+Math.max(0,state.stats.funds)*.55-state.debt*.35),0,100);
 const pressure=clamp(Math.round(state.stats.leverage*.75+Math.max(0,state.factions.oldguard)*.1+state.stats.influence*.12-state.stats.heat*.03),0,100);
 return {credibility,patronage,pressure};
}
function classCoalitionBonus(kind){const id=state.hero.classId;if(kind==="program"&&(id==="mage"||id==="technocrat"))return 3;if(kind==="program"&&id==="paladin")return 2;if(kind==="office"&&(id==="necro"||id==="rogue"))return 2;if(kind==="pressure"&&id==="rogue")return 3;if(kind==="pressure"&&id==="necro")return 2;if(kind==="spectacle"&&id==="bard")return 3;return 0}

function classMasteryEvent(){
 const list=classMasteryDefs[state.hero.classId]||[];
 return {id:"classMastery",location:"hq",title:"První skutečná specializace",emoji:classes[state.hero.classId].icon,kicker:"LEVEL UP",queued:true,
  text:()=>["Kampaň už není improvizace. Je to improvizace se systémem, rozpočtem a lidmi, kteří od vás čekají konkrétní typ zázraku.","Vyberte jednu specializaci. Volba změní aktivní schopnost třídy a některé taktické situace."],
  choices:list.map((p,i)=>({label:p.name,detail:p.desc,check:{attr:i?"cunning":"intellect",dc:10},tags:["classMastery"],
   success:makeOutcome(`Specializace ${p.name} byla zapsána do politického životopisu.`,{influence:3,trust:1},["classMastery"],()=>{state.classMastery=p.id;state.flags.classMasteryChosen=true}),
   fail:makeOutcome(`Specializace ${p.name} byla přijata, ale první interní prezentace skončila otázkou, zda existuje kratší verze.`,{influence:1,heat:2},["classMastery"],()=>{state.classMastery=p.id;state.flags.classMasteryChosen=true})
  }))};
}
function primaryRivalRead(){const rows=Object.entries(state.approachHeat||{}).sort((a,b)=>b[1]-a[1]);return rows[0]?.[1]>=2?rows[0][0]:null}
function updateRivalAI(){
 state.rivalAI=state.rivalAI||{adaptation:null,reads:{},counters:0,lastCounterDay:0,revealed:false};const read=primaryRivalRead();if(read){state.rivalAI.reads[read]=(state.rivalAI.reads[read]||0)+1;if((state.rivalAI.reads[read]||0)>=2)state.rivalAI.adaptation=read}
 state.rivalAI.revealed=state.hero.classId==="technocrat"||state.classMastery==="apparatusMemory"||state.factions.press>=25;
 if(state.day>=5&&state.rivalAI.adaptation&&state.rivalAI.lastCounterDay<state.day-2&&state.rivalAI.counters<3){const ev=rivalCounterDefs[state.rivalAI.adaptation]||"counterCynicism";if(!state.pendingEvents.includes(ev)&&!state.flags["resolved_"+ev]){schedule(ev,2);state.rivalAI.lastCounterDay=state.day;state.rivalAI.counters++;addNews(`Věčný reaguje na váš opakovaný styl. Připravil protiakci: ${eventById(ev).title}.`,"bad")}}
}
function rivalReadLabel(){const a=state.rivalAI?.adaptation;if(!a)return"Soupeř zatím hledá vzorec.";const labels={public:"veřejné show",legal:"právní a datové tahy",power:"mocenské útoky",corrupt:"zákulisní dohody",ethical:"morální apel"};return state.rivalAI.revealed?`Věčný se adaptoval na: ${labels[a]||a}.`:`Věčný se na něco připravuje. Přesný vzorec zatím neznáte.`}
function debateBaseState(){return globalThis.KorytoDebateSystem.baseState(state,clamp)}
function chooseRivalIntent(){return globalThis.KorytoDebateSystem.chooseIntent(state,pick)}
function debateIntentText(){return globalThis.KorytoDebateSystem.intentText(state)}
function debateCardModifier(id){return globalThis.KorytoDebateSystem.cardModifier(id,state,attributeMod,clamp)}
function debateCardOdds(id){return globalThis.KorytoDebateSystem.cardOdds(id,state,attributeMod,clamp,rollLevel)}
function classAbilityInfo(){return globalThis.KorytoDebateSystem.abilityInfo(state)}
function useClassAbility(){const d=state.debate;if(!d.active||d.classUsed)return;d.classUsed=true;const id=state.hero.classId;if(id==="bard"){d.mood=clamp(d.mood+(state.classMastery==="chorus"?20:14),-50,50);d.momentum=clamp(d.momentum+2,0,6);if(state.classMastery==="heckler")d.cancelOpponent=true;chooseRivalIntent();d.log.unshift("🎤 Přerámovali jste téma. Publikum si pamatuje pointu, nikoli otázku.")}if(id==="rogue"){d.opponentRep=clamp(d.opponentRep-(state.classMastery==="doubleFile"?12:8),0,100);d.momentum=clamp(d.momentum+(state.classMastery==="quietDeal"?3:2),0,6);state.stats.heat=clamp(state.stats.heat+3);d.log.unshift("🕶️ Zadní vchod otevřel složku, kterou nikdo oficiálně nepřinesl.")}if(id==="paladin"){d.playerRep=clamp(d.playerRep+12,0,100);d.composure=clamp(d.composure+10,0,100);state.stats.trust=clamp(state.stats.trust+3);if(state.classMastery==="publicOath")addCommitment({id:"debate_oath",title:"Veřejně splnit hlavní slib z debaty",creditor:"Veřejnost",kind:"public",due:13,condition:"debateOath"});d.log.unshift("🛡️ Přísaha zvedla sál. Tisk si už připravuje kontrolní článek.")}if(id==="mage"){d.cancelOpponent=true;d.opponentWeakened=state.classMastery==="auditCircle"?3:2;d.momentum=clamp(d.momentum+1,0,6);d.log.unshift("🧙 Formulář 37B přesunul soupeřův tah do přílohy, kterou nikdo nenajde.")}if(id==="technocrat"){d.nextBonus=state.classMastery==="impactModel"?3:2;d.revealedIntent=true;d.momentum=clamp(d.momentum+1,0,6);d.log.unshift("📊 Model dopadů tvrdí, že pravděpodobnost pravdy je nenulová.")}if(id==="necro"){d.opponentRep=clamp(d.opponentRep-(state.classMastery==="reserveCadre"?13:9),0,100);d.momentum=clamp(d.momentum+2,0,6);state.factions.oldguard=clamp(state.factions.oldguard+5,-100,100);state.stats.heat=clamp(state.stats.heat+5);d.log.unshift("🧟 Aparát povstal. Někteří funkcionáři netušili, že už byli politicky mrtví.")}renderDebate()}
function debateAssist(id){const d=state.debate;if(!d.active||d.companionUsed[id]||!state.party[id])return;d.companionUsed[id]=true;const p=state.party[id];p.loyalty=clamp(p.loyalty+1);if(id==="marie"){d.playerRep=clamp(d.playerRep+7,0,100);d.mood=clamp(d.mood+10,-50,50);d.log.unshift("👩‍🏫 Marie přivedla rodiče a jednu fotografii kýblu ve třídě.")}if(id==="daniela"){d.opponentRep=clamp(d.opponentRep-10,0,100);d.revealedIntent=true;d.log.unshift("📰 Daniela ověřila dokument v přímém přenosu. Věčný poprvé žádá reklamní pauzu.")}if(id==="brazda"){d.playerRep=clamp(d.playerRep+9,0,100);d.momentum=clamp(d.momentum+1,0,6);addCommitment({id:`debate_brazda_${state.day}`,title:"Odměnit JZD za publikum v debatě",creditor:"Brázda",due:13});d.log.unshift("🚜 Brázda naplnil zadní řady. Potlesk přijel organizovaně.")}if(id==="bohumil"){d.cancelOpponent=true;d.composure=clamp(d.composure+8,0,100);d.log.unshift("🗄️ Bohumil našel procedurální důvod, proč soupeřova otázka neexistuje.")}if(id==="holub"){d.playerRep=clamp(d.playerRep+12,0,100);state.stats.integrity=clamp(state.stats.integrity-3);state.stats.funds=clamp(state.stats.funds-2,-99,999);d.log.unshift("💼 Holub dodal světla, publikum a spontánní transparenty ve firemním fontu.")}renderDebate()}
function startDebate(){
 if(state.quests.debate?.status!=="active")return;state.selectedSupport=null;state.phase="debate";state.currentEvent="debate";state.debate=debateBaseState();chooseRivalIntent();["startScreen","creationScreen","gameScreen","coalitionScreen","endingScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("debateScreen").classList.add("active");renderDebate()
}
function renderDebate(){const d=state.debate;if(!d.active)return;document.getElementById("debateHeroName").textContent=`${state.hero.name} · ${classes[state.hero.classId].name}`;document.getElementById("debatePlayerPortrait").textContent=classes[state.hero.classId].icon;document.getElementById("debatePlayerLabel").textContent=state.hero.name;document.getElementById("debatePlayerBar").style.width=d.playerRep+"%";document.getElementById("debateOpponentBar").style.width=d.opponentRep+"%";document.getElementById("debatePlayerRep").textContent=`Reputace ${Math.round(d.playerRep)}/100`;document.getElementById("debateOpponentRep").textContent=`Reputace ${Math.round(d.opponentRep)}/100`;document.getElementById("debateRound").textContent=`Kolo ${d.round}/${d.maxRounds} · vyberte taktiku`;document.getElementById("debateIntent").innerHTML=`<strong>${debateIntentText()}</strong><br><small>${rivalReadLabel()}</small>`;document.getElementById("debateMoodBar").style.width=clamp(d.mood+50)+"%";document.getElementById("debateMoodText").textContent=d.mood>20?"Publikum chce show a jednoduchý vítězný výrok.":d.mood<-20?"Sál je unavený, podezřívavý a připravený trestat přehánění.":"Publikum ještě poslouchá obě strany, což je předvolebně nebezpečný stav.";document.getElementById("debateStats").innerHTML=[["Momentum",d.momentum],["Důvěra",Math.round(d.composure)],["Tlak",Math.round(state.stats.heat)]].map(x=>`<div class="debate-stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");const ability=classAbilityInfo();document.getElementById("classAbilityBox").innerHTML=`<strong>${classes[state.hero.classId].icon} ${ability.name}</strong><p>${ability.desc}</p>${state.classMastery?`<span class="mastery-chip">Specializace: ${classMasteryDefs[state.hero.classId].find(x=>x.id===state.classMastery)?.name||state.classMastery}</span>`:"<span class='mastery-chip'>Bez specializace</span>"}<button id="useClassAbility" class="btn ${d.classUsed?"":"primary"}" ${d.classUsed?"disabled":""}>${d.classUsed?"Schopnost použita":"Použít schopnost"}</button>`;document.getElementById("useClassAbility").onclick=useClassAbility;document.getElementById("debateAssists").innerHTML=Object.entries(state.party).map(([id,p])=>`<button class="btn small assist-btn" data-assist="${id}" ${d.companionUsed[id]?"disabled":""}><span>${p.icon}</span><span>${p.name}<br><small>${d.companionUsed[id]?"zásah použit":p.mission}</small></span></button>`).join("")||"<p>Do debaty jste přišel sám. To je levné a fotogenicky prázdné.</p>";document.querySelectorAll("[data-assist]").forEach(b=>b.onclick=()=>debateAssist(b.dataset.assist));document.getElementById("debateCards").innerHTML=Object.entries(debateCardDefs).map(([id,c])=>{const o=debateCardOdds(id),need=c.leverage||0,used=d.usedCards?.[id]||0,blocked=d.momentum<c.cost||state.stats.leverage<need;return `<button class="debate-card" data-card="${id}" ${blocked?"disabled":""}><span class="card-cost">⚡ ${c.cost}</span><strong>${c.icon} ${c.name}</strong><small>${c.desc}</small><small>d20 + ${debateCardModifier(id)} proti ${c.dc} · úspěch ${o.clean*5}% · cena ${o.costly*5}%</small>${need?`<small>Kompromat: ${need}</small>`:""}${used?`<small>Opakování: ${used}× · soupeř čte vzorec</small>`:""}</button>`}).join("");document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>playDebateCard(b.dataset.card));document.getElementById("debateLog").innerHTML=d.log.length?d.log.slice(0,10).map((x,i)=>`<div class="debate-entry ${x.includes("Věčný")?"bad":i===0?"good":""}">${x}</div>`).join(""):"<div class='debate-entry'>Kamery běží. Pravda čeká venku, protože nemá akreditaci.</div>";document.getElementById("debateRetreat").onclick=()=>finishDebate("retreat")}
function playDebateCard(id){const d=state.debate,c=debateCardDefs[id];if(!d.active||d.momentum<c.cost||state.stats.leverage<(c.leverage||0))return;d.momentum-=c.cost;if(c.leverage)state.stats.leverage=clamp(state.stats.leverage-c.leverage);const mod=debateCardModifier(id),roll=rand(1,20),total=roll+mod,level=rollLevel(roll,total,c.dc);let mult=level==="critical"?1.45:level==="success"?1:level==="costly"?.7:.25;if(state.debate.opponentWeakened){mult+=state.debate.opponentWeakened*.08;state.debate.opponentWeakened=0}const previous=d.lastCard;d.usedCards=d.usedCards||{};let damage=Math.round(c.damage*mult);if(state.classMastery==="doubleFile"&&id==="expose")damage+=5;if(state.rivalAI?.adaptation&&c.tags.includes(state.rivalAI.adaptation))damage=Math.max(1,damage-3);d.opponentRep=clamp(d.opponentRep-damage,0,100);d.playerRep=clamp(d.playerRep+Math.round((c.heal||0)*(level==="complication"?.2:level==="costly"?.65:1)),0,100);d.mood=clamp(d.mood+(c.mood||0)*(level==="complication"?-0.5:1),-50,50);d.composure=clamp(d.composure+(c.trust||0)*(level==="complication"?-1:1),0,100);if(level==="critical")d.momentum=clamp(d.momentum+2,0,6);else if(level==="success")d.momentum=clamp(d.momentum+1,0,6);if(level==="complication"){d.playerRep=clamp(d.playerRep-5,0,100);state.stats.heat=clamp(state.stats.heat+3)}if(id==="promise"&&level!=="complication")addCommitment({id:`debate_promise_${d.round}`,title:"Splnit slib pronesený v televizní debatě",creditor:"Veřejnost",kind:"public",due:13,condition:"debateOath"});if(previous&&previous!==id&&level!=="complication"){d.chain++;if(d.chain%2===0){d.momentum=clamp(d.momentum+1,0,6);d.log.unshift("🔗 Střídání taktik vytvořilo kombo: +1 Momentum.")}}else if(previous===id)d.chain=0;d.usedCards[id]=(d.usedCards[id]||0)+1;d.log.unshift(`${c.icon} ${c.name}: hod ${roll}+${mod} proti ${c.dc}. ${level==="critical"?"Kritický zásah":level==="success"?"Čistý zásah":level==="costly"?"Zásah za cenu":"Taktická komplikace"}; Věčný −${damage}.`);d.lastCard=id;d.nextBonus=0;resolveRivalMove();state.audit.rolls++;state.audit.outcomes[level]=(state.audit.outcomes[level]||0)+1;if(d.playerRep<=0||d.opponentRep<=0||d.round>=d.maxRounds)return finishDebate();d.round++;chooseRivalIntent();renderDebate()}
function resolveRivalMove(){const d=state.debate,m=rivalMoveDefs[d.intent];if(d.cancelOpponent){d.log.unshift(`🛑 ${m.name} byl zrušen dřív, než se stihl stát stanoviskem.`);d.cancelOpponent=false;return}let damage=m.damage+2+(d.round>=4?2:0);if(m.counter?.includes(d.lastCard))damage+=7;if(d.firstHitShield){damage=Math.ceil(damage/2);d.firstHitShield=false;d.log.unshift("🛡️ Nezlomný mandát absorboval polovinu prvního protiútoku.")}d.playerRep=clamp(d.playerRep-damage,0,100);d.opponentRep=clamp(d.opponentRep+(m.heal||0),0,100);d.mood=clamp(d.mood+(m.mood||0),-50,50);d.composure=clamp(d.composure+(m.trust||0),0,100);if(m.party){const ids=Object.keys(state.party);if(ids.length){const id=ids.sort((a,b)=>state.party[a].loyalty-state.party[b].loyalty)[0];state.party[id].loyalty=clamp(state.party[id].loyalty-4);d.log.unshift(`🪓 Věčný zasáhl ${state.party[id].name}: loajalita −4.`)}}if(m.adapt&&state.rivalAI?.adaptation)d.momentum=Math.max(0,d.momentum-1);d.log.unshift(`${m.icon} Věčný: ${m.name}. Vaše reputace −${damage}.`)}
function finishDebate(forced=null){const d=state.debate;if(!d.active)return;d.active=false;let diff=d.playerRep-d.opponentRep,grade=forced==="retreat"?"retreat":diff>=18?"dominant":diff>0?"win":diff>-10?"draw":"loss";state.flags.debateGrade=grade;state.flags.debateScore=Math.round(diff);if(grade==="dominant"){effect({support:13,trust:8,press:8,oldguard:-12,integrity:4});state.opponent.momentum=clamp(state.opponent.momentum-14);for(const id of Object.keys(voterDefs))adjustVoter(id,4,.01);addNews("Věčný prohrál debatu tak přesvědčivě, že jeho tým označil záznam za deepfake.","normal")}else if(grade==="win"){effect({support:8,trust:5,press:4,oldguard:-7});state.opponent.momentum=clamp(state.opponent.momentum-8);for(const id of Object.keys(voterDefs))adjustVoter(id,2);addNews("Debatu jste vyhrál. Místní rozhlas připouští, že mohlo jít o technickou závadu.","normal")}else if(grade==="draw"){effect({support:2,heat:3});state.opponent.momentum=clamp(state.opponent.momentum+2);addNews("Debata skončila remízou. Obě strany oznámily historické vítězství.")}else{effect({support:-8,trust:-5,oldguard:9,heat:4});state.opponent.momentum=clamp(state.opponent.momentum+10);addNews(forced==="retreat"?"Z debaty jste odešel. Věčný zbytek večera debatoval se svou vlastní zkušeností.":"Věčný vyhrál debatu a okamžitě slíbil, že výsledek nebude zneužívat déle než do voleb.","bad")}completeQuest("debate",`Debata: ${grade}, skóre ${Math.round(d.playerRep)}:${Math.round(d.opponentRep)}.`);state.rivalAI.adaptation=primaryRivalRead()||state.rivalAI.adaptation;if(grade==="dominant"||grade==="win")schedule(rivalCounterDefs[state.rivalAI.adaptation]||"counterCynicism",2);log(`Velká debata: ${grade}, reputace ${Math.round(d.playerRep)}:${Math.round(d.opponentRep)}.`);document.getElementById("debateScreen").classList.remove("active");document.getElementById("gameScreen").classList.add("active");consumeAction();if(!state.ended)showMap()}
function simulateDebate(strategy="mixed"){state.debate=debateBaseState();chooseRivalIntent();const cid=state.hero.classId;if(cid==="bard"){state.debate.mood+=14;state.debate.momentum=clamp(state.debate.momentum+2,0,6)}if(cid==="rogue"){state.debate.opponentRep=clamp(state.debate.opponentRep-8);state.debate.momentum=clamp(state.debate.momentum+2,0,6)}if(cid==="paladin"){state.debate.playerRep=clamp(state.debate.playerRep+12);state.debate.composure=clamp(state.debate.composure+10)}if(cid==="mage")state.debate.cancelOpponent=true;if(cid==="technocrat"){state.debate.nextBonus=state.classMastery==="impactModel"?3:2;state.debate.revealedIntent=true}if(cid==="necro"){state.debate.opponentRep=clamp(state.debate.opponentRep-(state.classMastery==="reserveCadre"?13:9));state.debate.momentum=clamp(state.debate.momentum+2,0,6)}let guard=0;while(state.debate.active&&guard++<8){const score=(id)=>{const t=debateCardDefs[id].tags;if(strategy==="ideal")return (t.includes("ethical")?8:0)+(t.includes("transparent")?6:0);if(strategy==="corrupt")return id==="expose"?10:t.includes("power")?6:0;if(strategy==="legal")return id==="facts"?10:0;if(strategy==="populist")return t.includes("public")?8:0;return rng()*6};const options=Object.keys(debateCardDefs).filter(id=>state.debate.momentum>=debateCardDefs[id].cost&&state.stats.leverage>=(debateCardDefs[id].leverage||0)).sort((a,b)=>score(b)-score(a));if(!options.length){state.debate.momentum++;continue}const id=options[0],c=debateCardDefs[id],mod=debateCardModifier(id),roll=rand(1,20),level=rollLevel(roll,roll+mod,c.dc),mult=level==="critical"?1.45:level==="success"?1:level==="costly"?.7:.25;const previous=state.debate.lastCard;state.debate.usedCards=state.debate.usedCards||{};state.debate.momentum-=c.cost;state.debate.opponentRep=clamp(state.debate.opponentRep-Math.round(c.damage*mult),0,100);state.debate.playerRep=clamp(state.debate.playerRep+Math.round((c.heal||0)*mult),0,100);if(previous&&previous!==id&&level!=="complication")state.debate.momentum=clamp(state.debate.momentum+((state.debate.chain||0)%2===1?1:0),0,6);state.debate.chain=previous&&previous!==id?(state.debate.chain||0)+1:0;state.debate.usedCards[id]=(state.debate.usedCards[id]||0)+1;state.debate.lastCard=id;resolveRivalMove();if(state.debate.playerRep<=0||state.debate.opponentRep<=0||state.debate.round>=state.debate.maxRounds)break;state.debate.round++;chooseRivalIntent()}const diff=state.debate.playerRep-state.debate.opponentRep;state.flags.debateGrade=diff>=18?"dominant":diff>0?"win":diff>-10?"draw":"loss";state.debate.active=false;completeQuest("debate",`Simulovaná debata ${state.flags.debateGrade}.`);return state.flags.debateGrade}
function triggerCompanionStories(){for(const [id,d] of Object.entries(companionStoryDefs)){const ev=id+"Personal",cs=state.companionStories[id];if(state.party[id]&&cs&&!cs.done&&state.day>=d.day&&!state.flags["personalQueued_"+id]&&!state.flags["resolved_"+ev]){schedule(ev,3);state.flags["personalQueued_"+id]=true;addNews(`${state.party[id].name} chce řešit osobní problém: ${d.title}. Ignorování sníží loajalitu.`,"bad")}}}
function companionQuestAvailable(id){const cs=state.companionStories[id],d=companionStoryDefs[id];return !!(state.party[id]&&cs&&!cs.done&&state.day>=d.day)}
function unlockCompanionPerk(id,perk){if(state.companionStories[id]){state.companionStories[id].done=true;state.companionStories[id].perk=perk}addNews(`${state.party[id]?.name||id} získává aktivní roli: ${perk}.`)}
function shiftLoyalty(id,delta){if(state.party[id])state.party[id].loyalty=clamp(state.party[id].loyalty+delta)}

function initVoters(){state.voters={};for(const [id,v] of Object.entries(voterDefs))state.voters[id]={support:v.base,turnout:v.turnout}}
function questDeadline(id){return globalThis.KorytoQuestRuntime.deadline(id,state)}
function adjustVoter(id,delta,turnout=0){if(!state.voters[id])return;const cur=state.voters[id].support;if(delta>0&&cur>=70)delta*=.35;else if(delta>0&&cur>=55)delta*=.65;state.voters[id].support=clamp(cur+delta);state.voters[id].turnout=Math.max(.15,Math.min(.95,state.voters[id].turnout+turnout))}
function applyVoterReaction(tags=[],eventId="",level="success"){
 const pos=level==="critical"?1.3:level==="success"?1:level==="costly"?.55:-.65;
 const neg=level==="critical"?.35:level==="success"?.55:level==="costly"?1:1.5;
 const d=(id,n,t=0)=>adjustVoter(id,Math.round(n*(n>=0?pos:neg)*.68),t*(n>=0?pos:neg)*.75);
 if(tags.includes("ethical")){d("parents",3);d("undecided",3);d("disengaged",2,.015)}
 if(tags.includes("transparent")){d("officials",4);d("parents",2);d("undecided",4)}
 if(tags.includes("public")){d("seniors",2);d("club",2);d("disengaged",3,.025)}
 if(tags.includes("children")){d("parents",7)}
 if(tags.includes("jzdDeal")){d("jzdWorkers",7);if(level==="costly"||level==="complication")d("undecided",-2)}
 if(tags.includes("police")){d("jzdWorkers",-5);d("officials",3)}
 if(tags.includes("contract")){d("entrepreneurs",6);if(level==="costly"||level==="complication")d("parents",-3)}
 if(tags.includes("corrupt")){
  if(level==="critical"||level==="success"){d("entrepreneurs",4);d("undecided",-1)}
  else if(level==="costly"){d("parents",-3);d("undecided",-4);d("officials",-3);d("entrepreneurs",2)}
  else{d("parents",-7);d("undecided",-8);d("officials",-6);d("entrepreneurs",-2)}
 }
 if(tags.includes("legal")){d("officials",6);d("undecided",2)}
 if(tags.includes("lie")){
  if(level==="critical"||level==="success"){d("seniors",3);d("disengaged",3,.02);d("undecided",-1)}
  else{d("seniors",-2);d("undecided",-5);d("parents",-3)}
 }
 if(tags.includes("antiBusiness")){d("entrepreneurs",-8);d("undecided",2)}
 if(eventId==="football")d("club",8);
 if(["roof","water","roofEmergency","roofCollapse"].includes(eventId))d("parents",5);
 if(["diesel","auditLeak","leakedTape"].includes(eventId))d("jzdWorkers",4);
 if(["waste","wasteStrike"].includes(eventId)){d("seniors",4);d("disengaged",4,.02)}
 if(eventId==="debate"){for(const id of Object.keys(voterDefs))d(id,2)}
}
function actionCost(choice,e=null){
 if(e?.id==="settleAccounts"&&choice.key==="repay")return activeCommitments("Tiskárna Klička").reduce((s,c)=>s+(c.amount||1),0);
 if(choice.cost!==undefined)return Math.max(0,choice.cost);
 const vals=[choice.success?.effects?.funds,choice.fail?.effects?.funds].filter(v=>typeof v==="number");
 if(vals.some(v=>v<0)||vals.some(v=>v>0))return 0;
 const tags=choice.tags||[];
 if(e?.repeatable)return tags.includes("lie")?3:2;
 if(tags.includes("corrupt")||tags.includes("contract")||tags.includes("jzdDeal"))return 0;
 if(tags.includes("public")||tags.includes("ethical"))return 1;
 if(tags.includes("transparent")||tags.includes("legal")||tags.includes("power")||tags.includes("lie"))return 1;
 return 0;
}
function addCommitment(data){
 if(state.commitments.some(c=>c.id===data.id&&c.status==="active"))return;
 state.commitments.push({id:data.id||`commitment_${++state.commitmentSeq}`,title:data.title,creditor:data.creditor||"Veřejnost",kind:data.kind||"private",due:data.due||13,status:"active",amount:data.amount||0,condition:data.condition||null,source:data.source||state.currentEvent,notes:data.notes||""});
 addNews(`Nový ${data.kind==="public"?"veřejný slib":"politický závazek"}: ${data.title}.`,data.kind==="public"?"normal":"bad");
}
function activeCommitments(creditor=null){return state.commitments.filter(c=>c.status==="active"&&(!creditor||c.creditor===creditor))}
function settleCommitments(creditor,status="fulfilled"){
 const list=activeCommitments(creditor);list.forEach(c=>c.status=status);return list.length;
}
function addManifestoPromises(){
 addCommitment({id:"promise_roof",title:"Škola nebude potřebovat deštníky",creditor:"Veřejnost",kind:"public",due:13,condition:"roof"});
 addCommitment({id:"promise_meadow",title:"O osudu louky rozhodnou lidé, ne bagr",creditor:"Veřejnost",kind:"public",due:13,condition:"meadow"});
 addCommitment({id:"promise_open",title:"Smlouvy a rozpočet budou dohledatelné",creditor:"Veřejnost",kind:"public",due:13,condition:"transparent"});
}
function createCommitmentFromChoice(eventId,choice,level){
 if(level==="complication"&&rng()<.45)return;
 const tags=choice.tags||[],label=choice.label||"";
 if(eventId==="intro"&&tags.includes("transparent"))addCommitment({id:"promise_radnice",title:"Otevřít radnici a zveřejnit smlouvy",creditor:"Veřejnost",kind:"public",due:13,condition:"transparent"});
 if(eventId==="hqVolunteers"&&label.includes("pět konkrétních"))addManifestoPromises();
 if((eventId==="intro"||eventId==="register")&&tags.includes("jzdDeal"))addCommitment({id:"brazda_entry",title:"Dát Brázdovi vliv na volební a zemědělský výbor",creditor:"Brázda",due:7,notes:"Podpora při vstupu do kampaně"});
 if(eventId==="diesel"&&tags.includes("corrupt"))addCommitment({id:"brazda_diesel",title:"Nechat Radovana a družstevní naftu na pokoji",creditor:"Brázda",due:9,notes:"Cena za lidi, pódium a peníze"});
 if(eventId==="roof"&&tags.includes("contract"))addCommitment({id:"holub_roof",title:"Přiklepnout Holubovi dodatek ke školní zakázce",creditor:"Holub",due:10,notes:"Rychlá oprava školy"});
 if(eventId==="meadow"&&(tags.includes("contract")||tags.includes("corrupt")))addCommitment({id:"holub_meadow",title:"Prosadit změnu územního plánu pro Holuba",creditor:"Holub",due:11,notes:"Developer financuje kampaň"});
 if(eventId==="oldfiles"&&tags.includes("destroyEvidence"))addCommitment({id:"bohumil_archive",title:"Ochraňovat Bohumila a jeho místo na úřadě",creditor:"Bohumil",due:12,notes:"Tepelná skartace archivu"});
 if(eventId==="genericJzd"&&tags.includes("corrupt"))addCommitment({id:`jzd_donation_${state.day}`,title:"Vrátit JZD laskavost za dar bez účtenky",creditor:"Brázda",due:Math.min(13,state.day+3),notes:"Kampaňové financování"});
}
function chargeChoice(choice){
 const cost=actionCost(choice,eventById(state.currentEvent));if(cost<=0)return true;
 if(choice.requireFunds&&state.stats.funds<cost){alert(`Na tuto možnost potřebujete ${cost}, ale kampaň má jen ${state.stats.funds}. Zvolte refinancování nebo sbírku.`);return false;}
 if(state.stats.funds>=cost){effect({funds:-cost});return}
 const shortage=cost-Math.max(0,state.stats.funds);state.stats.funds=0;state.debt+=shortage;
 addCommitment({id:`credit_${++state.commitmentSeq}`,title:`Překlenovací dluh kampaně ve výši ${shortage}`,creditor:"Tiskárna Klička",due:13,amount:shortage,notes:"Akce byla provedena na fakturu po volbách"});
 addNews(`Kampaň neměla na akci peníze. Tiskárna Klička ji provedla na politický dluh ${shortage}.`,"bad");return true;
}
function rollLevel(roll,total,dc){
 if(roll===20)return"critical";
 if(roll===1)return"complication";
 if(total>=dc+2)return"success";
 if(total>=dc-1)return"costly";
 return"complication";
}
function costlyPenalty(tags=[],eventId=""){
 const e={heat:3};
 if(tags.includes("ethical")||tags.includes("transparent"))e.funds=-2;
 else if(tags.includes("corrupt")||tags.includes("lie")){e.trust=-3;e.integrity=-2}
 else e.support=-2;
 if(["roof","water","waste"].includes(eventId))e.heat+=2;
 return e;
}
function dispatchCompanion(id){
 if(state.phase!=="map")return alert("Družinu lze vysílat jen z mapy.");
 if(state.partyUsedDay===state.day||state.partyAssignment)return alert("Dnes už jednu politickou výpravu řídíte. Více delegování by připomínalo státní správu.");
 const p=state.party[id];if(!p)return;state.partyFatigue=state.partyFatigue||{};const fatigue=state.partyFatigue[id]||0;if(fatigue>=4)return alert(`${p.name} je politicky vyčerpaný. Jeden den bez mise je levnější než veřejná zrada.`);state.partyAssignment={id,day:state.day};state.partyUsedDay=state.day;state.partyFatigue[id]=fatigue+2;
 addNews(`${p.name} vyráží na misi: ${p.mission}. Výsledek přijde na konci dne.`);log(`${p.name} vyslán na misi ${p.mission}.`);renderAll();
}
function resolvePartyAssignment(){
 const a=state.partyAssignment;if(!a)return;const p=state.party[a.id];state.partyAssignment=null;if(!p)return;
 const perk=state.companionStories?.[a.id]?.perk,roll=rand(1,20),fatigue=state.partyFatigue?.[a.id]||0,mod=Math.floor(p.loyalty/22)+(state.stats.influence>=55?1:0)+(perk?2:0)-Math.floor(fatigue/2),level=rollLevel(roll,roll+mod,perk?11:12);let text="",ef={};
 if(a.id==="marie"){ef=level==="critical"?{support:8,trust:7,citizens:7}:level==="success"?{support:5,trust:4,citizens:5}:level==="costly"?{support:3,trust:2,funds:-2}:{trust:-4,support:-2};text=`Marie ${level==="complication"?"se pohádala s rodiči kvůli využívání dětí v kampani":"mobilizovala rodiče a dobrovolníky"}.`;adjustVoter("parents",level==="complication"?-6:level==="costly"?3:7,.02)}
 if(a.id==="daniela"){ef=level==="critical"?{leverage:7,press:8,heat:-8}:level==="success"?{leverage:4,press:5,heat:-4}:level==="costly"?{leverage:3,press:2,heat:2}:{press:-5,heat:8,trust:-3};text=`Daniela ${level==="complication"?"našla stopu, která vede i k vám":"prověřila dokumenty a oddělila kauzu od hospodské legendy"}.`;adjustVoter("undecided",level==="complication"?-4:4)}
 if(a.id==="brazda"){ef=level==="critical"?{support:7,influence:8,jzd:8,funds:5}:level==="success"?{support:4,influence:5,jzd:6,funds:3}:level==="costly"?{support:3,jzd:4,integrity:-3}:{jzd:-6,heat:6,opponent:0};text=`Brázda ${level==="complication"?"svolal lidi, ale nechal je vyfotit s Věčným":"přivezl venkov i volební logistiku"}.`;if(level!=="complication")addCommitment({id:`brazda_mission_${state.day}`,title:"Odměnit Brázdu za mobilizaci JZD",creditor:"Brázda",due:Math.min(13,state.day+3),notes:"Aktivní mise družiny"});adjustVoter("jzdWorkers",level==="complication"?-5:6,.015)}
 if(a.id==="bohumil"){const urgent=Object.entries(state.quests).filter(([id,q])=>q.status==="active"&&questDefs[id]).sort((x,y)=>questDeadline(x[0])-questDeadline(y[0]))[0];if(urgent&&level!=="complication")state.quests[urgent[0]].deadlineBonus=(state.quests[urgent[0]].deadlineBonus||0)+1;ef=level==="critical"?{officials:8,heat:-6,leverage:3}:level==="success"?{officials:5,heat:-3}:level==="costly"?{officials:3,leverage:2}:{officials:-5,heat:7};text=`Bohumil ${level==="complication"?"našel dokument, ale omylem jej rozeslal i opozici":"našel procesní prostor a posunul nejbližší termín"}.`;adjustVoter("officials",level==="complication"?-5:6)}
 if(a.id==="holub"){ef=level==="critical"?{funds:10,business:9,influence:5}:level==="success"?{funds:7,business:6}:level==="costly"?{funds:5,business:4,heat:4}:{funds:2,heat:10,trust:-4};text=`Holub ${level==="complication"?"sehnal peníze i fotografa, který zdokumentoval jejich původ":"zajistil financování a profesionální servis"}.`;if(level!=="complication")addCommitment({id:`holub_mission_${state.day}`,title:"Vrátit Holubovi laskavost za financování",creditor:"Holub",due:Math.min(13,state.day+3),notes:"Aktivní mise družiny"});adjustVoter("entrepreneurs",level==="complication"?-3:6)}
 if(perk&&level!=="complication"){if(a.id==="daniela")addConspiracyClue(pick(["diesel","roof","meadow","archive"]),"Daniela využila osobní schopnost při misi.");if(a.id==="bohumil")changePlan("oldguard",-5,"Bohumil procesně zdržel staré struktury.");if(a.id==="brazda")changePlan("jzd",-4,"Brázda přesměroval vlastní síť.");if(a.id==="holub"&&state.conspiracy.exposed)changePlan("business",-5,"Holub zachraňuje vlastní projekt ústupky.");}
 effect(ef);p.loyalty=clamp(p.loyalty+(level==="critical"?5:level==="success"?2:level==="costly"?-1:-7));addNews(`${text} Hod ${roll}+${mod}: ${level==="critical"?"mimořádný úspěch":level==="success"?"úspěch":level==="costly"?"úspěch za cenu":"komplikace"}.`,level==="complication"?"bad":"normal");log(text);
}
function promiseConditionMet(c){
 if(c.condition==="roof")return state.quests.roof?.status==="done";
 if(c.condition==="meadow")return state.quests.meadow?.status==="done"&&state.factions.citizens>=0;
 if(c.condition==="transparent")return state.stats.integrity>=62&&(hasItem("auditReport")||state.factions.officials>=5||state.factions.press>=5);
 if(c.condition==="debateOath")return state.flags.debateGrade==="dominant"||state.flags.debateGrade==="win"||state.stats.trust>=65;
 return false;
}
function evaluateCommitments(){
 let fulfilled=0,broken=0;
 state.commitments.forEach(c=>{if(c.status!=="active")return;if(c.kind==="public"&&promiseConditionMet(c)){c.status="fulfilled";fulfilled++;adjustVoter("undecided",5);adjustVoter("parents",3)}else{c.status="broken";broken++;if(c.kind==="public"){effect({trust:-4,integrity:-3});adjustVoter("undecided",-6);adjustVoter("disengaged",-3)}else{effect({influence:-3,heat:4});if(c.creditor==="Brázda")adjustVoter("jzdWorkers",-7);if(c.creditor==="Holub")adjustVoter("entrepreneurs",-8);if(c.creditor==="Bohumil")adjustVoter("officials",-7);if(c.creditor==="Tiskárna Klička")state.debt+=c.amount||1}}});
 fulfilled+=state.commitments.filter(c=>c.status==="fulfilled").length-fulfilled;broken+=state.commitments.filter(c=>c.status==="broken").length-broken;state.promiseSummary={fulfilled,broken,active:0};
}
const questDefs=globalThis.KorytoQuestData.definitions;
function initQuests(){state.quests=globalThis.KorytoQuestRuntime.initialState()}
function addNews(text,type="normal"){state.news.unshift({day:state.day,text,type});state.news=state.news.slice(0,10)}
function log(text){state.log.push(`Den ${state.day}: ${text}`)}
function effect(e={}){
 for(const [k,v] of Object.entries(e)){
  if(k in state.stats){
   let delta=v,current=state.stats[k];
   if(delta>0&&["support","trust","integrity","influence"].includes(k)){
    if(current>=85)delta=Math.max(1,Math.round(delta*.25));
    else if(current>=70)delta=Math.max(1,Math.round(delta*.55));
   }
   state.stats[k]=clamp(current+delta,k==="funds"?-20:0,k==="heat"?150:100);
  }else if(k in state.factions) state.factions[k]=clamp(state.factions[k]+v,-100,100);
 }
}
function addParty(id,delta=0){
 if(!state.party[id]) state.party[id]={...companions[id],loyalty:companions[id].loyalty};
 state.party[id].loyalty=clamp(state.party[id].loyalty+delta);
}
function partyReact(tags=[]){
 Object.entries(state.party).forEach(([id,p])=>{
  let d=0;
  if(id==="marie"){if(tags.includes("ethical"))d+=6;if(tags.includes("corrupt"))d-=14;if(tags.includes("children"))d+=5}
  if(id==="daniela"){if(tags.includes("transparent"))d+=7;if(tags.includes("lie"))d-=12;if(tags.includes("pressAttack"))d-=18}
  if(id==="brazda"){if(tags.includes("power"))d+=5;if(tags.includes("police"))d-=16;if(tags.includes("jzdDeal"))d+=8}
  if(id==="bohumil"){if(tags.includes("legal"))d+=5;if(tags.includes("destroyEvidence"))d-=14}
  if(id==="holub"){if(tags.includes("contract"))d+=10;if(tags.includes("antiBusiness"))d-=13}
  p.loyalty=clamp(p.loyalty+d);
  if(p.loyalty<=12){
   addNews(`${p.name} opouští vaši družinu. Oficiálně z osobních důvodů, neoficiálně kvůli vám.`,"bad");
   log(`${p.name} odešel z družiny.`);
   delete state.party[id];
   if(id==="daniela"||id==="bohumil")state.opponent.scandals+=1;
  }else if(p.loyalty<=25 && rng()<.25){
   addNews(`${p.name} poskytl anonymní rozhovor, v němž vás označil za člověka s dynamickým charakterem.`,"bad");
   effect({heat:6,trust:-3});
  }
 });
}
function hasItem(id){return state.items.includes(id)}
function addItem(id){if(!hasItem(id))state.items.push(id)}
function completeQuest(id,note){globalThis.KorytoQuestRuntime.complete(id,state);if(note)log(note)}
function failQuest(id,note){globalThis.KorytoQuestRuntime.fail(id,state);if(note)log(note)}
function unlockQuest(id){return globalThis.KorytoQuestRuntime.unlock(id,state)}
function primaryApproach(tags=[]){
 const order=["corrupt","transparent","ethical","lie","power","legal","public","contract","jzdDeal"];
 return order.find(x=>tags.includes(x))||"neutral";
}
function approachPenalty(choice){
 const a=primaryApproach(choice.tags||[]),heat=state.approachHeat?.[a]||0;
 if(a==="neutral")return 0;
 const repeated=(state.lastApproaches||[]).slice(-2).filter(x=>x===a).length;
 return (heat>=6?2:heat>=3?1:0)+(repeated>=2?1:0);
}
function registerApproach(tags=[]){
 const a=primaryApproach(tags);state.approachHeat=state.approachHeat||{};state.lastApproaches=state.lastApproaches||[];
 if(a!=="neutral"){state.approachHeat[a]=(state.approachHeat[a]||0)+1;state.lastApproaches.push(a);state.lastApproaches=state.lastApproaches.slice(-5);state.audit.approaches[a]=(state.audit.approaches[a]||0)+1}
}
function decayApproaches(){for(const k of Object.keys(state.approachHeat||{}))state.approachHeat[k]=Math.max(0,state.approachHeat[k]-1)}
function currentProjection(){return globalThis.KorytoElectionSystem.projection(state,voterDefs)}
function nextThreat(){
 const pending=state.pendingEvents.map(id=>({id,meta:state.pendingMeta[id],e:eventById(id)})).filter(x=>x.e).sort((a,b)=>(a.meta?.expiresDay||99)-(b.meta?.expiresDay||99))[0];
 if(pending)return `${pending.e.title} · do dne ${pending.meta?.expiresDay||state.day+1}`;
 const [id,p]=Object.entries(state.factionPlans||{}).sort((a,b)=>(b[1].progress||0)-(a[1].progress||0))[0]||[];return id?`${factionPlanDefs[id].name} · ${Math.round(p.progress)} %`:"Věčný zatím pouze dýchá politicky";
}
function nextDeadline(){
 const active=Object.entries(state.quests).filter(([id,q])=>q.status==="active"&&questDefs[id]).sort((a,b)=>questDeadline(a[0])-questDeadline(b[0]));
 if(!active.length)return "Žádný známý termín";const [id]=active[0],left=questDeadline(id)-state.day;return `${questDefs[id].title} · ${left<=0?"dnes":left+" dny"}`;
}
function attributeMod(attr){
 let m=state.hero.attrs[attr]||0;
 if(hasItem("megaphone")&&attr==="charisma")m+=1;
 return m;
}
function schedule(id,ttl=null){
 if(!state.pendingEvents.includes(id)&&!state.flags["resolved_"+id]){
  state.pendingEvents.push(id);
  if(ttl!==null)state.pendingMeta[id]={scheduledDay:state.day,expiresDay:state.day+ttl};
 }
}
function makeOutcome(text,effects,tags=[],extra=()=>{}){return {text,effects,tags,extra}}
function checkBreakdown(choice){
 const rows=[],tags=choice.tags||[],c=classes[state.hero.classId],add=(label,val)=>{if(val)rows.push({label,val})};
 add(metricName(choice.check.attr),attributeMod(choice.check.attr));
 if(c.ability==="form"&&(tags.includes("legal")||tags.includes("contract")||state.currentEvent==="auditLeak"||state.currentEvent==="documentWar"))add("Dotační mág",2);
 if(c.ability==="model"&&(choice.check.attr==="intellect"||tags.includes("legal")||tags.includes("transparent")))add("Technokrat",1);
 if(c.ability==="revive"&&(tags.includes("power")||state.factions.oldguard>20))add("Nekromant",2);
 if(c.ability==="oath"&&tags.includes("ethical"))add("Paladinova přísaha",2);
 if(c.ability==="shadow"&&tags.includes("corrupt"))add("Rogue ve stínu",2);
 if(c.ability==="reframe"&&tags.includes("public"))add("Bardův refrén",1);
 if(state.hero.origin==="idealist"&&(tags.includes("ethical")||tags.includes("transparent")))add("Motivace: idealista",1);
 if(state.hero.origin==="ambitious"&&(tags.includes("power")||tags.includes("public")))add("Motivace: ambice",1);
 if(state.hero.origin==="revenge"&&(["debate","oldfiles","anonymousLeaflet"].includes(state.currentEvent)||tags.includes("antiBusiness")))add("Motivace: pergola",1);
 const partyBonus=(id,match)=>{const p=state.party[id];if(!p||!match)return 0;return p.loyalty>=65?2:p.loyalty>=40?1:p.loyalty<22?-1:0};
 add("Marie",partyBonus("marie",tags.includes("children")||tags.includes("ethical")));add("Daniela",partyBonus("daniela",tags.includes("transparent")||tags.includes("pressAttack")||state.currentLocation==="paper"));add("Brázda",partyBonus("brazda",tags.includes("jzdDeal")||state.currentLocation==="jzd"));add("Bohumil",partyBonus("bohumil",tags.includes("legal")||tags.includes("destroyEvidence")||state.currentLocation==="townhall"));add("Holub",partyBonus("holub",tags.includes("contract")||tags.includes("corrupt")||state.currentLocation==="meadow"));
 if(choice.companion&&state.party[choice.companion]?.loyalty>=45)add("Přímá pomoc družiny",1);
 const activeSupport=selectedSupportBonus(choice);if(activeSupport)add(`${companions[state.selectedSupport]?.name||"Družina"}: aktivní zásah`,activeSupport);
 const activeRelations=Object.entries(relationshipDefs).filter(([,d])=>state.party[d.a]&&state.party[d.b]).map(([id])=>state.relationships?.[id]??0);if(activeRelations.length){const avg=activeRelations.reduce((a,b)=>a+b,0)/activeRelations.length,min=Math.min(...activeRelations);if(min<-40)add("Rozhádaný štáb",-2);else if(avg<-15)add("Napětí ve štábu",-1);else if(avg>30)add("Soudržný štáb",1)}
 const item=(id,match,val,label)=>{if(hasItem(id)&&match)add(label,val)};
 item("dieselCopy",tags.includes("police")||state.currentEvent==="auditLeak"||state.currentEvent==="leakedTape",2,"Kopie z JZD");item("blackmail",tags.includes("jzdDeal")||tags.includes("power"),2,"Složka na Brázdu");item("schoolKeys",tags.includes("children"),2,"Klíče školy");item("envelope",tags.includes("contract")||tags.includes("corrupt"),1,"Obálka stability");item("zoningDeal",state.currentLocation==="meadow"||tags.includes("contract"),2,"Dodatek k louce");item("auditReport",tags.includes("legal")||tags.includes("transparent"),2,"Auditní zpráva");item("dossier",tags.includes("power")||tags.includes("lie"),2,"Složka na Věčného");item("ashes",tags.includes("destroyEvidence")||tags.includes("corrupt"),2,"Popel jistoty");item("scarf",state.currentLocation==="pitch"||state.phase==="finale",1,"Klubová šála");item("program",tags.includes("ethical")||state.phase==="finale",1,"Program");item("labReport",tags.includes("transparent")||tags.includes("legal"),1,"Rozbor vody");item("budgetDraft",state.currentLocation==="townhall"||tags.includes("power"),1,"Původní rozpočet");item("wasteContract",tags.includes("contract")||tags.includes("legal"),1,"Smlouva o svozu");item("ballotProof",state.phase==="finale",1,"Vadný lístek");
 const penalty=approachPenalty(choice);if(penalty)add("Únava stejné taktiky",-penalty);
 return rows;
}
function checkMod(choice){return clamp(checkBreakdown(choice).reduce((s,x)=>s+x.val,0),-2,5)}
function eventQuestId(id,e=events[id]){return e?.questId||id}
function canRepeat(id){return (state.genericUses[id]||0)<1 && (state.cooldowns[id]||0)<=state.day}
const eventDomain=globalThis.KorytoEventData.create(makeOutcome);
const {definitions:events,surpriseIds,eventById,dueQuestCount,initSurprises,triggerSurprisesForDay,unlockByDay}=eventDomain;
function activityForEvent(id,urgent=false){
 const e=eventById(id),uses=state.genericUses[id]||0,meta=state.pendingMeta[id];
 const fatigue=e.repeatable&&uses?` · už využito`:"";
 const expiry=meta?` · vyřešit do konce dne ${meta.expiresDay}`:"";
 return {id,icon:e.emoji,title:e.title,detail:e.kicker+fatigue+expiry,urgent};
}
function getActivities(loc){
 const list=[];
 state.pendingEvents.forEach(id=>{const e=eventById(id);if(e&&e.location===loc)list.push(activityForEvent(id,true))});
 for(const [id,e] of Object.entries(events)){
  if(e.location!==loc||!e.available||!e.available())continue;
  const qid=eventQuestId(id,e),q=state.quests[qid];
  const debtUrgent=id.startsWith("obligation")||id==="settleAccounts";
  const urgent=debtUrgent||id.endsWith("Personal")||id.startsWith("silo")||(q&&questDefs[qid]&&questDeadline(qid)-state.day<=2);
  list.push(activityForEvent(id,urgent));
 }
 if(loc==="pitch"&&events.football.available())list.push(activityForEvent("football"));
 if(loc==="hq"&&events.hqVolunteers.available())list.push(activityForEvent("hqVolunteers"));
 if(loc==="pub"&&canRepeat("genericPub"))list.push(activityForEvent("genericPub"));
 if(loc==="hq"&&canRepeat("genericHQ"))list.push(activityForEvent("genericHQ"));
 if(loc==="jzd"&&canRepeat("genericJzd"))list.push(activityForEvent("genericJzd"));
 if(loc==="paper"&&canRepeat("genericPaper"))list.push(activityForEvent("genericPaper"));
 return [...new Map(list.map(a=>[a.id,a])).values()].sort((a,b)=>(b.urgent?1:0)-(a.urgent?1:0)).slice(0,8);
}
function resolveChoice(choice){
 if(chargeChoice(choice)===false)return;
 const mod=checkMod(choice),roll=rand(1,20),total=roll+mod;
 let level=rollLevel(roll,total,choice.check.dc);
 if((level==="costly"||level==="complication")&&state.hero.classId==="bard"&&choice.tags?.includes("public")&&state.abilityUsedDay!==state.day){
  const reroll=rand(1,20),rerollTotal=reroll+mod;state.abilityUsedDay=state.day;
  pendingResolution={choice,roll:reroll,mod,total:rerollTotal,level:rollLevel(reroll,rerollTotal,choice.check.dc),rerolled:true};
 }else pendingResolution={choice,roll,mod,total,level};
 showDice();
}
function applyResolved(){
 const {choice,level}=pendingResolution,e=eventById(state.currentEvent);
 const out=(level==="critical"||level==="success"||level==="costly")?choice.success:choice.fail;
 let ef={...out.effects};
 if(e.repeatable){
  const uses=state.genericUses[e.id]||0,mult=[1,.62,.35][uses]||.2;
  Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.max(1,Math.round(ef[k]*mult))});
  if(uses>0)ef.heat=(ef.heat||0)+uses;
  state.genericUses[e.id]=uses+1;state.cooldowns[e.id]=state.day+2;
 }
 if(level==="critical"){Object.keys(ef).forEach(k=>ef[k]=Math.round(ef[k]*1.35));ef.support=(ef.support||0)+2}
 if(level==="costly"){Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.max(1,Math.round(ef[k]*.68))});const pen=costlyPenalty(choice.tags||[],e.id);for(const [k,v] of Object.entries(pen))ef[k]=(ef[k]||0)+v}
 if(level==="complication"&&pendingResolution.roll===1){Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.floor(ef[k]*.3);else ef[k]=Math.round(ef[k]*1.25)});ef.heat=(ef.heat||0)+5}
 if(state.hero.classId==="rogue"&&choice.tags?.includes("corrupt")&&ef.funds>0)ef.funds+=3;
 effect(ef);registerApproach(choice.tags||[]);state.audit.rolls++;state.audit.outcomes[level]=(state.audit.outcomes[level]||0)+1;state.audit.locations[state.currentLocation]=(state.audit.locations[state.currentLocation]||0)+1;applyVoterReaction(out.tags||choice.tags||[],e.id,level);partyReact(out.tags||choice.tags||[]);out.extra?.();if(e.id.endsWith("Personal")){const cid=e.id.replace("Personal","");if(state.companionStories[cid])state.companionStories[cid].done=true}createCommitmentFromChoice(e.id,choice,level);trackLivingWorld(e.id,choice,level);updateCompanionAmbitions(e.id,choice,level);if(echoEventDefs[e.id])registerEcho(e.id,{tags:choice.tags||[],level});consumeSelectedSupport(choice);postEventHooks(e.id,choice,level);
 e.after?.();
 if(!e.repeatable && !e.queued)state.flags["done_"+e.id]=true;
 if(e.queued||state.pendingEvents.includes(e.id)){state.pendingEvents=state.pendingEvents.filter(x=>x!==e.id);delete state.pendingMeta[e.id];state.flags["resolved_"+e.id]=true;}
 log(`${e.title}: ${choice.label}. ${out.text}`);
 showResult(out.text,ef,level,choice.tags||[]);
 pendingResolution=null;
}

function postEventHooks(eventId,choice,level){
 if(eventId==="siloConfrontation"&&!state.flags.siloVerdictQueued){state.flags.siloVerdictQueued=true;schedule("siloVerdict",3);addNews("Veřejné rozkrytí Operace SILO otevřelo druhou fázi: rozhodnutí, co se sítí udělat.","bad")}
 if(eventId==="siloOffer"&&!state.flags.siloBoardQueued){state.flags.siloBoardQueued=true;schedule("siloBoardVote",3);addNews("Místo u stolu nestačí. Síť svolala hlasování o skutečném vedení.","bad")}
}
function showResult(text,ef,level,tags=[]){
 const result=document.getElementById("resultBox"); if(!result)return;
 const changes=Object.entries(ef).filter(([,v])=>v).map(([k,v])=>`${metricName(k)} ${v>0?"+":""}${v}`).join(" · ");
 const title=level==="critical"?"Kritický úspěch":level==="success"?"Úspěch":level==="costly"?"Úspěch za cenu":"Komplikace";
 result.classList.remove("hidden");result.innerHTML=`<h3>${title}</h3><p>${text}</p>${level==="costly"?"<p><strong>Dosáhl jste cíle, ale vznikl vedlejší účet.</strong></p>":""}<p class="official">${officialLine(tags,level)}</p><p><strong>${changes||"Bez okamžitě viditelné změny."}</strong></p><button id="continueAfter" class="btn primary">Vrátit se na mapu</button>`;
 document.getElementById("choiceBox").classList.add("hidden");
 document.getElementById("continueAfter").onclick=()=>{consumeAction();if(state.finale===0)showMap()};
 renderAll();
}
function officialLine(tags=[],level="success"){
 let pool;
 if(tags.includes("transparent")||tags.includes("ethical"))pool=["Oficiální stanovisko: zveřejnili jsme všechno. Občané nyní žádají stručnější verzi všeho.","V hospodě: možná je slušný, ale jestli takhle bude vysvětlovat každý účet, zavřou dřív než kuchyň.","Vejprnický hlas: Kandidát odpověděl na otázku. Redakce tuto neobvyklou situaci dále sleduje."];
 else if(tags.includes("corrupt")||tags.includes("contract"))pool=["Oficiální stanovisko: nešlo o protislužbu, ale o souběh vzájemně výhodných veřejných zájmů.","V hospodě: obálka prý nebyla úplatek. Byla moc tenká na úplatek.","Vejprnický hlas: Zakázka má vítěze. Soutěž se k výsledku vyjádří později."];
 else if(tags.includes("lie")||tags.includes("pressAttack"))pool=["Tiskový mluvčí: výrok nebyl nepravdivý, pouze předběhl budoucí interpretaci reality.","V hospodě: lže dobře. To se může hodit, až bude jednat s okresem.","Vejprnický hlas: Kandidát popřel, že něco popřel. Video zůstává dostupné."];
 else pool=["Oficiální stanovisko: situace byla vyřešena v souladu s možnostmi, které byly politicky k dispozici.","V hospodě: druhý stůl tvrdí, že to bylo kvůli funkci. První stůl ještě čeká na rundu.","Vejprnický hlas: Kandidát učinil krok. Směr budou redaktoři nadále ověřovat."];
 if(level==="complication")pool.push("Místní rozhlas: prosíme majitele zapnutého mikrofonu, aby si jej okamžitě vyzvedl.");
 return pick(pool);
}
function consumeAction(){
 state.actions--;
 if(state.actions<=0){endDay()}else{state.phase="map";state.currentEvent=null;state.currentLocation=null}
 if(state.day>=14&&!state.ended)startFinale();
}
function skipDay(){
 if(state.phase!=="map"||state.ended)return;
 const unused=state.actions;
 if(unused>0){state.opponent.momentum=clamp(state.opponent.momentum+unused*2,0,100);log(`Kampaň ukončila den o ${unused} akce dřív. Věčný získal prostor.`);addNews(`Kandidát ukončil den dřív. Věčný mezitím stihl ${unused===2?"obejít dvě ulice":"obejít jednu ulici"}.`)}
 state.actions=0;endDay();if(state.finale===0)showMap();
}
function endDay(){
 worldTurn();
 state.day++;state.actions=2;state.partyUsedDay=0;unlockByDay();state.phase="map";state.currentEvent=null;state.currentLocation=null;
 if(state.day>=14)startFinale();else autoSave();
}
function expirePendingEvents(){
 const expired=state.pendingEvents.filter(id=>state.pendingMeta[id]&&state.day>=state.pendingMeta[id].expiresDay);
 expired.forEach(id=>{
  const e=eventById(id);if(e?.ignored)e.ignored();else if(id.endsWith("Personal")){const cid=id.replace("Personal","");if(state.party[cid])state.party[cid].loyalty=clamp(state.party[cid].loyalty-14);if(state.companionStories[cid])state.companionStories[cid].done=true;effect({trust:-2});addNews(`${state.party[cid]?.name||cid} svůj osobní problém vyřešil bez vás. Vztah to nepřežil beze změny.`,"bad")}else if(id.startsWith("plan")){effect({support:-2,heat:3});const pid=id.includes("Oldguard")?"oldguard":id.includes("Jzd")?"jzd":id.includes("Business")?"business":"press";changePlan(pid,6,"Ignorovaný tah frakce uspěl bez odporu.")}else effect({support:-2,heat:3});
  state.pendingEvents=state.pendingEvents.filter(x=>x!==id);delete state.pendingMeta[id];state.flags["resolved_"+id]=true;
  log(`${e?.title||id} bylo ignorováno a vyřešilo se bez vás.`);
 });
}
function worldTurn(){
 resolvePartyAssignment();
 expirePendingEvents();
 const unresolved=Object.entries(state.quests).filter(([id,q])=>q.status==="active"&&questDefs[id]);
 unresolved.forEach(([id,q])=>{
  const def=questDefs[id];
  if(state.day>=questDeadline(id)){
   if(id==="register"){
    completeQuest("register","Kandidátka byla zachráněna nouzově.");
    effect({funds:-5,trust:-7,heat:8,integrity:-5});addNews("Kandidátka podána po administrativním dramatu. Bohumil odmítá vysvětlit detaily.","bad");
   }else{
    failQuest(id,`${def.title} nebyl vyřešen včas.`);
    const consequences={
     diesel:()=>{effect({jzd:-8,trust:-4,heat:7});schedule("auditLeak");addNews("Nafta mizí dál. Věčný slibuje audit a fotografuje se u nádrže.","bad")},
     roof:()=>{effect({trust:-9,support:-6,citizens:-8});schedule("roofEmergency");addNews("Škola zavřela jednu třídu. Věčný přivezl plachtu a fotografa.","bad")},
     meadow:()=>{effect({business:10,citizens:-10,trust:-5});schedule("meadowProtest");addNews("Bagr vjel na poslední louku. Developer tvrdí, že jde o geodetickou diskusi.","bad")},
     paper:()=>{effect({press:-10,trust:-4});addNews("Obecní zpravodaj vydal osm stran fotografií starosty Věčného. Jedna byla omylem kritická.","bad")},
     oldfiles:()=>{effect({oldguard:8,leverage:-3});addNews("Archiv byl přestěhován na bezpečné místo. Nikdo neví kam, což potvrzuje bezpečnost.","bad")},
     water:()=>{effect({trust:-10,support:-7,heat:9});schedule("regionalInspector",1);addNews("Hygiena zavřela školní kuchyň. Věčný rozdává vodu s vlastní fotografií.","bad")},
     budget:()=>{effect({oldguard:10,trust:-5,funds:-4});addNews("Noční rozpočet prošel. Obec koupí chytrou lavičku, která neumí sedět levně.","bad")},
     debate:()=>{effect({support:-8,oldguard:10});addNews("Věčný vyhrál debatu bez soupeře a děkuje vám za konstruktivní nepřítomnost.","bad")},
     waste:()=>{effect({support:-9,citizens:-8,trust:-5});addNews("Náves zaplnil odpad. Věčný slíbil, že po volbách vyhodí viníka i pytle.","bad")},
     ballots:()=>{effect({support:-10,officials:-7,heat:10});addNews("Část hlasovacích lístků neobsahuje vaše jméno. Tiskárna se omlouvá všem kandidátům kromě vás.","bad")}
    };consequences[id]?.();
   }
  }
 });
 state.opponent.momentum=clamp(state.opponent.momentum+4+Math.max(0,state.factions.oldguard/20)-Math.max(0,state.factions.citizens/35),0,100);
 const moves=[];
 if(state.opponent.momentum>55&&rng()<.45)moves.push("anonymousLeaflet");
 if(state.stats.heat>35&&rng()<.38)moves.push("policeInterview");
 if(state.stats.integrity<35&&rng()<.3)moves.push("leakedTape");
 if(state.day>=5&&rng()<.22)moves.push("fireBrigade");
 moves.filter(id=>!state.pendingEvents.includes(id)&&!state.flags["seen_"+id]).slice(0,1).forEach(id=>{schedule(id);state.flags["seen_"+id]=true});
 if(rng()<.35){
  const drift=pick([
   ()=>{state.factions.oldguard=clamp(state.factions.oldguard+5,-100,100);addNews("Věčný navštívil seniory a slíbil, že zachová všechno, co už dávno nefunguje.")},
   ()=>{state.stats.support=clamp(state.stats.support+(state.stats.trust>60?3:-1));addNews("Nový průzkum v hospodě má vzorek 18 lidí a chybu měření dvě piva.")},
   ()=>{state.stats.funds+=2;addNews("Na transparentní účet dorazil dar 2 000 korun od člověka s netransparentním jménem.")},
   ()=>{state.factions.citizens=clamp(state.factions.citizens+3,-100,100);addNews("Dobrovolníci opravili lavičku bez dotace. Úřad ověřuje, zda je to dovoleno.")}
  ]);drift();
 }
 factionPlanTurn();updateRivalAI();livingWorldDailyTurn();
  Object.entries(state.party).forEach(([id,p])=>{p.loyalty=clamp(p.loyalty-1);state.partyFatigue[id]=Math.max(0,(state.partyFatigue[id]||0)-(state.partyAssignment?.id===id?0:1))});decayApproaches();
 addNews(`Končí den ${state.day}. Věčný mezitím získal ${Math.round(state.opponent.momentum)} bodů politické setrvačnosti.`)
}
function chooseFinalCrisis(){
 const p=state.pendingEvents;
 if(p.includes("policeInterview")||state.stats.heat>85)return "police";
 if(Object.values(state.party).some(x=>x.loyalty<28)||Object.keys(state.party).length===0)return "betrayal";
 if(state.stats.trust>75&&state.stats.integrity>60)return "smear";
 if(state.stats.leverage>12||p.some(x=>["leakedTape","auditLeak","documentWar"].includes(x)))return "dossier";
 return "scandal";
}
function startFinale(){
 if(state.finale===0){
  state.finale=1;state.actions=99;state.phase="finale";state.currentLocation=null;state.finalCrisis=chooseFinalCrisis();
  const unresolved=state.pendingEvents.length;
  if(unresolved){
   state.pendingEvents.forEach(id=>{const e=eventById(id);if(e?.ignored)e.ignored();else effect({heat:3,support:-1})});
   log(`${unresolved} nevyřešených komplikací dorazilo až do volebního dne a každá si přinesla vlastní účet.`)
  }
  state.pendingEvents=[];state.pendingMeta={};if(!AUTOTEST)showFinaleEvent(1);
 }
}
function finalCrisisEvent(){
 const type=state.finalCrisis||"scandal";
 if(type==="police")return {title:"Ranní razie před volební místností",emoji:"🚓",text:["Policie dorazí v 6:42. Tvrdí, že načasování nesouvisí s volbami. Kamera dorazila v 6:39.","Poslední test, zda vaši kampaň řídí program, právník, nebo nejpomalejší člen družiny."],choices:[
  {label:"Otevřít dveře i dokumenty",detail:"Ztratíte kontrolu nad příběhem, ale možná ne nad důvěrou.",check:{attr:"resilience",dc:14},tags:["ethical","transparent","police"],success:makeOutcome("Prohlídka nic zásadního nenajde. Otevřenost zkazí Věčnému titulek.",{trust:8,heat:-14,integrity:8,support:3},["ethical","transparent"]),fail:makeOutcome("Policie najde dokument, který jste považoval za účet za toner.",{support:-8,heat:16,integrity:3},["police"])},
  {label:"Zablokovat vše procesní námitkou",detail:"Právně čisté do zavírací doby podatelny.",check:{attr:"intellect",dc:15},tags:["legal","power"],success:makeOutcome("Razie se odloží. Voliči si musí vybrat dřív než soud.",{support:4,heat:-5,influence:6,integrity:-3},["legal"]),fail:makeOutcome("Námitka neprojde a vypadá jako panika s paragrafem.",{support:-7,heat:13,trust:-6},["legal"])},
  {label:"Poslat policii za nejslabším spojencem",detail:"Politická odpovědnost dostane konkrétní adresu.",check:{attr:"authority",dc:13},tags:["corrupt","power"],success:makeOutcome("Kamera odjede za jiným autem. Družina pochopí, že loajalita je jednosměrná.",{support:3,heat:-9,integrity:-14,trust:-5},["corrupt","power"],()=>{const id=Object.keys(state.party)[0];if(id)delete state.party[id]}),fail:makeOutcome("Spojenec ukáže na vás dřív, než policie položí otázku.",{support:-10,heat:18,integrity:-12},["corrupt"])}
 ]};
 if(type==="betrayal")return {title:"Družina zakládá vlastní kandidátku",emoji:"🗡️",text:["V noci unikla společná fotografie vašich poradců bez vás. Ráno oznamují platformu Skutečná změna bez osobních ambicí.","Každý chce zachránit obec. Především před ostatními členy družiny."],choices:[
  {label:"Přiznat chyby a nabídnout pravomoci",detail:"Méně kontroly, více šance, že někdo zůstane.",check:{attr:"charisma",dc:14},tags:["ethical","transparent"],success:makeOutcome("Část družiny se vrátí. Poprvé však chce i rozhodovat.",{trust:8,support:5,integrity:7,influence:-3},["ethical"]),fail:makeOutcome("Omluva přichází pozdě a zní jako další taktika.",{support:-7,trust:-6},["ethical"])},
  {label:"Rozdat funkce ještě před výsledkem",detail:"Místostarosta, výbor a koordinátor koordinátorů.",check:{attr:"authority",dc:12},tags:["power","corrupt"],success:makeOutcome("Vzpoura končí pod tíhou vizitek. Koalice existuje dřív než mandáty.",{support:5,influence:9,integrity:-10,funds:-3},["power","corrupt"]),fail:makeOutcome("Slíbíte dvěma lidem stejnou funkci. Nová kandidátka dostane i program.",{support:-9,influence:-6,integrity:-8},["corrupt"])},
  {label:"Označit je za zrádce změny",detail:"Když odejdou lidé, zůstane alespoň značka.",check:{attr:"charisma",dc:13},tags:["lie","public"],success:makeOutcome("Jádro voličů se semkne. Družina se už nevrátí.",{support:6,trust:-5,integrity:-7},["lie","public"],()=>{state.party={}}),fail:makeOutcome("Všichni zrádci byli ještě včera na vašem plakátu.",{support:-10,trust:-8,integrity:-6},["lie"])}
 ]};
 if(type==="smear")return {title:"Fotografie s obálkou, kterou jste nikdy nedržel",emoji:"📸",text:["Sítě zaplaví fotografie, na níž přebíráte obálku od Holuba. Je falešná, ale výraz je politicky přesvědčivý.","Věčný nic nešíří. Jen žádá, aby se pravda vyšetřila po volbách."],choices:[
  {label:"Zveřejnit originály a časovou osu",detail:"Nudná fakta proti dokonalému obrázku.",check:{attr:"intellect",dc:13},tags:["transparent","legal"],success:makeOutcome("Daniela rozebere podvrh dřív, než se stane folklorem.",{support:6,trust:9,press:8,integrity:5},["transparent"]),fail:makeOutcome("Vysvětlení má dvanáct snímků. Fotografie jen jednu.",{support:-5,trust:1,integrity:3},["transparent"])},
  {label:"Uděláme z toho vtip",detail:"Když nejde odstranit obrázek, lze mu změnit význam.",check:{attr:"charisma",dc:12},tags:["public"],success:makeOutcome("Obálka se změní v meme a útok ztratí vážnost.",{support:8,heat:-4,trust:2},["public"]),fail:makeOutcome("Vtip potvrdí, že situaci neberete vážně.",{support:-7,trust:-5},["public"])},
  {label:"Vrátit Věčnému skutečnou fotografii",detail:"Podvrh přebijete důkazem, který kontext nepotřebuje.",check:{attr:"cunning",dc:14},tags:["power","lie"],success:makeOutcome("Poslední hodiny patří Věčného obálce, která falešná není.",{support:7,oldguard:-10,integrity:-7,leverage:-5},["power","lie"]),fail:makeOutcome("Veřejnost dostane dvě obálky a nevěří nikomu.",{support:-7,trust:-8,integrity:-6},["lie"])}
 ]};
 if(type==="dossier")return {title:"Noc dlouhých složek",emoji:"🗂️",text:["Věčný nabízí příměří: vaše složka na něj zmizí a jeho složka na vás se nikdy neobjeví.","Daniela čeká na dokumenty. Brázda na telefon. Oba tvrdí, že jde o poslední šanci zachránit obec."],choices:[
  {label:"Zveřejnit obě složky",detail:"Pravda poškodí všechny včetně vás.",check:{attr:"resilience",dc:14},tags:["ethical","transparent"],success:makeOutcome("Obec dostane celý obraz. Věčný padá a vy zůstáváte poškrábaný.",{support:4,trust:8,oldguard:-12,heat:4,integrity:7,leverage:-8},["ethical","transparent"]),fail:makeOutcome("Dokumentů je tolik, že si každý vybere vlastní pravdu.",{support:-5,trust:-3,heat:9,leverage:-5},["transparent"])},
  {label:"Vyměnit mlčení za povolební většinu",detail:"Volby rozhodnou občané. Vedení obce už vy dva.",check:{attr:"authority",dc:13},tags:["corrupt","power"],success:makeOutcome("Věčný stáhne útok a připraví židle pro novou koalici.",{support:5,influence:12,integrity:-15,oldguard:6,leverage:-6},["corrupt","power"]),fail:makeOutcome("Věčný přijme vaše mlčení a zveřejní svou složku stejně.",{support:-9,heat:14,integrity:-12,leverage:-6},["corrupt"])},
  {label:"Podstrčit složky třetí straně",detail:"Ať se pravda zveřejní sama a bez zpáteční adresy.",check:{attr:"cunning",dc:15},tags:["lie","power"],success:makeOutcome("Dokumenty explodují bez vašeho otisku. Alespoň bez viditelného.",{support:7,oldguard:-10,integrity:-8,heat:3,leverage:-7},["lie","power"]),fail:makeOutcome("Metadata obsahují jméno vaší tiskárny i domácí Wi‑Fi.",{support:-8,heat:16,integrity:-9,leverage:-6},["lie"])}
 ]};
 return {title:"Poslední skandál",emoji:"💣",text:["Dvě hodiny před uzavřením voleb se objeví dokument. Může jít o kauzu, polopravdu nebo pravdu, kterou jste chtěl vysvětlit až po vítězství.","Média čekají na jednu větu."],choices:[
  {label:"Položit všechny karty na stůl",detail:"Přiznat chyby a zveřejnit dokumenty.",check:{attr:"resilience",dc:14},tags:["ethical","transparent"],success:makeOutcome("Skandál vás zasáhne, ale nepoloží.",{support:4,trust:9,heat:-12,integrity:8,press:7},["ethical","transparent"]),fail:makeOutcome("Přiznáte víc, než dokument dokazoval.",{support:-7,trust:2,integrity:5,heat:3},["ethical"])},
  {label:"Zahladit kauzu protikauzou",detail:"Vyhraje větší složka.",check:{attr:"cunning",dc:14},tags:["power","lie"],success:makeOutcome("Věčný vysvětluje vlastní dokument a váš mizí pod ním.",{support:7,oldguard:-9,leverage:-5,integrity:-9,heat:4},["power","lie"]),fail:makeOutcome("Obě kauzy se spojí do jednoho bahna.",{support:-8,heat:15,integrity:-8,press:-6},["lie"])},
  {label:"Označit vše za útok na vesnici",detail:"Terčem není vy, ale každý správný Vejprničan.",check:{attr:"authority",dc:13},tags:["lie","public"],success:makeOutcome("Vaši podporovatelé se semknou.",{support:6,trust:-5,integrity:-7,heat:2},["lie","public"]),fail:makeOutcome("Dokument mluví konkrétně o vás, nikoli o vesnici.",{support:-9,trust:-8,integrity:-7,heat:7},["lie"])}
 ]};
}
function showFinaleEvent(stage){
 const morning={title:"Volební ráno",emoji:"🗳️",text:["Volební místnost se otevřela. Věčný vozí voliče služebním mikrobusem, který oficiálně patří kulturnímu domu.","Máte poslední možnost rozhodnout, koho mobilizujete a jakou cenu za to zaplatíte."],choices:[
  {label:"Rozeslat dobrovolníky po celé obci",detail:"Slušné a závislé na tom, zda jste si je neznechutil.",check:{attr:"charisma",dc:13},tags:["ethical","public"],success:makeOutcome("Dobrovolníci přivádějí lidi, kteří běžně volby vynechávají.",{support:8,citizens:8,trust:4,integrity:4},["ethical"]),fail:makeOutcome("Jeden dobrovolník omylem mobilizuje Věčného tetu.",{support:2,citizens:2},["ethical"])},
  {label:"Použít JZD, klub a všechny závazky",detail:"Volič dostane odvoz a konkrétní doporučení.",check:{attr:"authority",dc:12},tags:["power","corrupt"],success:makeOutcome("Autobus, traktor i klubovna pracují pro vás.",{support:11,jzd:6,oldguard:-4,integrity:-10,heat:5},["power","corrupt"]),fail:makeOutcome("Brázda pošle autobus jinam a klub si splete číslo kandidátky.",{support:-3,integrity:-7,heat:4},["corrupt"])},
  {label:"Spustit poslední digitální útok",detail:"Každý volič uvidí jinou verzi stejného přesvědčení.",check:{attr:"intellect",dc:14},tags:["lie"],success:makeOutcome("Mladí dostanou meme, rodiče školu a podnikatelé parkování.",{support:9,funds:-5,integrity:-6,heat:3},["lie"]),fail:makeOutcome("Reklama se zobrazí i Věčnému, který ji sdílí jako důkaz manipulace.",{support:-5,funds:-5,heat:8,integrity:-5},["lie"])}
 ]};
 const f=stage===1?morning:finalCrisisEvent();state.currentEvent="__final"+stage;renderEventRaw(f,stage);
}
function councilResult(vote){return globalThis.KorytoElectionSystem.councilResult(vote)}
function coalitionCapacity(){return globalThis.KorytoElectionSystem.coalitionCapacity(state)}

function allocateCoalitionPartners(playerSeats){
 const remaining=15-playerSeats,weights={
  civic:2.4+Math.max(0,state.factions.citizens)/35+Math.max(0,state.factions.press)/45+state.stats.integrity/90,
  rural:2.2+Math.max(0,state.factions.jzd)/30+Math.max(0,state.voters.jzdWorkers?.support-35)/25,
  progress:1.8+Math.max(0,state.factions.business)/28+Math.max(0,state.stats.funds)/50,
  oldguard:2.5+state.opponent.momentum/35+Math.max(0,state.factions.oldguard)/30
 };
 const total=Object.values(weights).reduce((a,b)=>a+b,0),raw={},base={};let used=0;
 for(const [id,w] of Object.entries(weights)){raw[id]=remaining*w/total;base[id]=Math.floor(raw[id]);used+=base[id]}
 Object.entries(raw).sort((a,b)=>(b[1]-base[b[0]])-(a[1]-base[a[0]])).slice(0,remaining-used).forEach(([id])=>base[id]++);
 return base;
}
function initCoalition(council,ending,roll,silent=false){
 const seats=allocateCoalitionPartners(council.seats),resources=coalitionResources();state.preCoalitionEnding={ending,roll};state.coalition={active:true,round:1,maxRounds:3,partners:{},joined:[],seats:council.seats,playerSeats:council.seats,needed:council.majority,log:[`Volby daly vašemu klubu ${council.seats} mandátů. K většině je potřeba ${council.majority}.`],contracts:[],selected:null,resources};
 for(const [id,d] of Object.entries(coalitionPartnerDefs)){let attitude=0;if(id==="civic")attitude=Math.round((state.stats.trust+state.stats.integrity)/18+state.factions.citizens/12+state.factions.press/16-state.stats.heat/25);if(id==="rural")attitude=Math.round(state.factions.jzd/9+state.stats.influence/18+(state.party.brazda?4:0)-state.stats.integrity/45);if(id==="progress")attitude=Math.round(state.factions.business/9+state.stats.funds/16+(state.party.holub?4:0)-state.stats.heat/30);if(id==="oldguard")attitude=Math.round(state.factions.oldguard/10+state.opponent.momentum/18+state.stats.leverage/22-state.stats.trust/28);state.coalition.partners[id]={seats:seats[id]||0,attitude:clamp(attitude,-10,15),joined:false,locked:false,attempts:0}}
 state.ended=false;state.phase="coalition";if(!silent)showCoalitionScreen();
}
function coalitionOfferDefs(id){const p=state.coalition.partners[id],d=coalitionPartnerDefs[id];return [
 {id:"program",label:"Programová dohoda",detail:`Přijmout část požadavku: ${d.demand}.`,resource:"credibility",cost:10,attr:"intellect",baseDc:12,tags:["legal","transparent"],contract:`Programový závazek pro ${d.name}`},
 {id:"office",label:"Funkce a rozpočet",detail:"Nabídnout výbor, rozpočtovou kapitolu a kancelář s oknem.",resource:"patronage",cost:12,attr:"authority",baseDc:13,tags:["power","contract"],contract:`Funkce a rozpočet pro ${d.name}`},
 {id:"pressure",label:"Připomenout, co na ně máte",detail:"Koalice založená na společném strachu z příloh.",resource:"pressure",cost:10,attr:"cunning",baseDc:14,tags:["power","corrupt"],contract:`Mlčení a vzájemná ochrana s ${d.name}`}
 ].map(o=>({...o,dc:clamp(o.baseDc-Math.floor(p.attitude/4),9,18)}))}
function showCoalitionScreen(){
 ["startScreen","creationScreen","gameScreen","endingScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("coalitionScreen").classList.add("active");document.querySelectorAll("#mapBtn,#saveBtn,#loadBtn").forEach(b=>b.classList.add("hidden"));renderCoalition();
}
function renderCoalition(){const c=state.coalition;if(!c?.active)return;document.getElementById("coalitionSeatScore").textContent=`${c.seats} / ${c.needed}`;document.getElementById("coalitionRoundLabel").textContent=`kolo ${c.round} z ${c.maxRounds}`;const r=c.resources;document.getElementById("coalitionResources").innerHTML=[["Důvěryhodnost",r.credibility,"program"],["Trafiky a vliv",r.patronage,"funkce"],["Tlak a složky",r.pressure,"nátlak"]].map(x=>`<div class="resource"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("");
 document.getElementById("coalitionPartners").innerHTML=Object.entries(coalitionPartnerDefs).map(([id,d])=>{const p=c.partners[id];return `<div class="partner-card ${p.joined?"joined":""} ${p.locked?"locked":""}"><span class="seats">${p.seats}</span><h3>${d.icon} ${d.name}</h3><p>${d.motto}</p><div class="tags"><span class="tag">postoj ${p.attitude>0?"+":""}${p.attitude}</span><span class="tag">${d.demand}</span></div><button class="btn small" data-partner="${id}" ${p.joined||p.locked||p.seats===0?"disabled":""}>${p.joined?"V koalici":p.locked?"Jednání ukončeno":"Jednat"}</button></div>`}).join("");document.querySelectorAll("[data-partner]").forEach(b=>b.onclick=()=>openCoalitionOffers(b.dataset.partner));
 document.getElementById("coalitionLog").innerHTML=c.log.slice().reverse().map((x,i)=>`<div class="coalition-entry ${x.includes("PŘIPOJIL")?"coalition-contract":""}">${x}</div>`).join("");const pass=document.getElementById("coalitionPass");if(pass)pass.onclick=()=>{c.log.push("Jedno kolo skončilo bez dohody. Všichni účastníci jej označili za konstruktivní.");c.round++;if(c.round>c.maxRounds)finishCoalition(false);else renderCoalition()};
}
function openCoalitionOffers(id){state.coalition.selected=id;const d=coalitionPartnerDefs[id],p=state.coalition.partners[id],offers=coalitionOfferDefs(id),box=document.getElementById("coalitionOfferPanel");box.classList.remove("hidden");box.innerHTML=`<h3>${d.icon} Jednání: ${d.name} · ${p.seats} mandátů</h3><p>${d.motto}</p><div class="offer-grid">${offers.map((o,i)=>{const have=state.coalition.resources[o.resource],blocked=have<o.cost;return `<button class="offer" data-offer="${i}" ${blocked?"disabled":""}><strong>${o.label}</strong><small>${o.detail}</small><span class="check">${metricName(o.attr)} · DC ${o.dc} · spotřeba ${o.cost} ${o.resource}${blocked?" · NEDOSTATEK":""}</span></button>`}).join("")}</div><button id="cancelCoalition" class="btn small">Zpět bez nabídky</button>`;box.querySelectorAll("[data-offer]").forEach(b=>b.onclick=()=>resolveCoalitionOffer(id,offers[+b.dataset.offer]));document.getElementById("cancelCoalition").onclick=()=>{box.classList.add("hidden");state.coalition.selected=null};}
function resolveCoalitionOffer(id,offer){const c=state.coalition,p=c.partners[id],resource=c.resources[offer.resource];p.attempts++;const attr=attributeMod(offer.attr),classBonus=classCoalitionBonus(offer.id),support=Math.floor(resource/25),roll=rand(1,20),total=roll+attr+classBonus+support,level=rollLevel(roll,total,offer.dc);c.resources[offer.resource]=Math.max(0,resource-offer.cost);const success=level==="critical"||level==="success"||level==="costly";if(success){p.joined=true;c.joined.push(id);c.seats+=p.seats;c.contracts.push({partner:id,title:offer.contract,kind:offer.id});c.log.push(`${coalitionPartnerDefs[id].name} se PŘIPOJIL: ${offer.contract}. Hod ${roll}+${attr+classBonus+support} proti ${offer.dc}.`);if(offer.id==="program")addCommitment({title:offer.contract,creditor:coalitionPartnerDefs[id].name,due:13,kind:"public",notes:"Koaliční smlouva"});else addCommitment({title:offer.contract,creditor:coalitionPartnerDefs[id].name,due:13,notes:"Koaliční smlouva"});if(level==="costly"){state.stats.influence=clamp(state.stats.influence-4);state.stats.heat=clamp(state.stats.heat+4)}}else{p.attitude-=3;p.locked=p.attempts>=2||roll===1;c.log.push(`${coalitionPartnerDefs[id].name} nabídku ODMÍTL. Hod ${roll}+${attr+classBonus+support} proti ${offer.dc}.`);if(offer.id==="pressure")state.stats.heat=clamp(state.stats.heat+7)}c.round++;document.getElementById("coalitionOfferPanel").classList.add("hidden");if(c.seats>=c.needed)return finishCoalition(true);if(c.round>c.maxRounds)return finishCoalition(false);renderCoalition();}
function finishCoalition(success){const c=state.coalition;c.active=false;state.flags.coalitionFormed=success;state.flags.coalitionPartners=[...c.joined];state.flags.coalitionContracts=[...c.contracts];state.flags.coalitionTotalSeats=c.seats;state.ended=true;document.getElementById("coalitionScreen").classList.remove("active");const vote=state.flags.vote,seats=state.flags.seats;if(success){const clean=c.contracts.filter(x=>x.kind==="program").length,dirty=c.contracts.filter(x=>x.kind!=="program").length;const ending={emoji:dirty>clean?"🪑":"🤝",title:dirty>clean?"Starosta na splátky":"Koalice s čitelným účtem",lead:`Získal jste ${vote} procent a ${seats} mandátů. Po ${c.round-1} kolech jste sestavil většinu ${c.seats} hlasů.`,story:dirty>clean?"Radu jste sestavil pomocí funkcí, ochrany a slibů, které začnou zvonit hned ráno. Vláda stojí. Cena je rozepsaná v přílohách.":"Podporu jste proměnil v programovou dohodu. Partneři mají vlastní názory a poprvé také písemné termíny. Koalice bude nepohodlná, což je možná její nejlepší vlastnost."};showEnding(ending,state.preCoalitionEnding?.roll||0)}else{const ending={emoji:"🚪",title:"Vítěz voleb bez klíčů od radnice",lead:`Získal jste ${vote} procent a ${seats} mandátů, ale po ${c.maxRounds} kolech jste většinu nesložil.`,story:"Volby daly vašemu klubu sílu. Vyjednávání ukázalo, že síla bez vztahů, funkcí nebo důvěry zůstává číslem na výsledkové tabuli. Věčný skládá zbytek rady a všem nabízí přesně to, co jste odmítl nebo už neměl."};showEnding(ending,state.preCoalitionEnding?.roll||0)}}
function finalizeElection(){
 evaluateCommitments();
 const result=globalThis.KorytoElectionSystem.calculate(state,voterDefs,rand(1,20));
 const {roll,breakdown,vote,council,capacity,coalitionFormed}=result;
 state.electionBreakdown=breakdown;state.flags.vote=vote;state.flags.seats=council.seats;state.flags.majority=council.majority;state.flags.coalitionFormed=coalitionFormed;state.flags.coalitionCapacity=Math.round(capacity);state.ended=true;
 let ending;
 if(council.seats>=council.majority&&state.flags.siloBoss)ending={emoji:"🏭",title:"Předseda představenstva Dolních Vejprnic",lead:`Získal jste ${vote} procent a ${council.seats} mandátů. Volby jen potvrdily dohodu uzavřenou dříve.`,story:"Projekt SILO má nové politické vedení. Věčný ztratil obec, Holub získal partnera a Brázda výbor. Formálně jste starosta. Prakticky předsedáte představenstvu systému, který jste měl původně odhalit."};
 else if(council.seats>=council.majority&&state.conspiracy.exposed)ending={emoji:"🔦",title:"Starosta, který otevřel SILO",lead:`Získal jste ${vote} procent a ${council.seats} mandátů po zveřejnění celé sítě.`,story:"Nafta, škola, louka i archiv se spojily do jednoho příběhu. Síť jste rozkryl, ale její lidé, smlouvy a právníci nezmizeli. První den ve funkci začíná otázkou, zda lze obec opravit bez lidí, kteří ji dosud řídili."};
 else if(council.seats>=council.majority&&state.stats.heat>90)ending={emoji:"🚓",title:"Přímá většina pod modrými majáky",lead:`Získal jste ${vote} procent a ${council.seats} z ${council.totalSeats} mandátů. Koalici nepotřebujete. Právníka ano.`,story:"Volby jste vyhrál naprosto a radu obce můžete sestavit sám. Vysoký mediální a policejní tlak však znamená, že vaše většina může brzy hlasovat také o tom, kdo vás zastoupí během výslechu. Věčný vám podporu nenabízí — nemáte ji zapotřebí."};
 else if(council.seats>=council.majority&&state.stats.integrity>=65&&state.promiseSummary.broken<=1)ending={emoji:"🕊️",title:"Starosta s vlastní většinou",lead:`Získal jste ${vote} procent a ${council.seats} z ${council.totalSeats} mandátů. Vládnete bez koalice.`,story:"Dolní Vejprnice vám daly přímou většinu. Nejtěžší quest teprve začíná: splnit sliby i poté, co už ke každému rozhodnutí nepotřebujete cizí hlas."};
 else if(council.seats>=council.majority&&state.stats.integrity<35)ending={emoji:"👑",title:"Majitel Dolních Vejprnic",lead:`Získal jste ${vote} procent a ${council.seats} mandátů. Koaliční partner by pouze zabíral židli.`,story:"JZD, podnikatelé, klub i část úřadu jsou na jedné lince. Formálně jste starosta s vlastní většinou. Prakticky jste operační systém obce s několika známými bezpečnostními chybami."};
 else if(council.seats>=council.majority)ending={emoji:"🏛️",title:"Většina bez výmluv",lead:`Získal jste ${vote} procent a ${council.seats} z ${council.totalSeats} mandátů.`,story:"Radu sestavíte bez koalice. Od této chvíle už nelze každý problém vysvětlit nepohodlným partnerem, protože nepohodlným partnerem jste především vy sám."};
 else if(council.seats>=5)ending={emoji:"🚪",title:"Největší klub za zavřenými dveřmi",lead:`Získal jste ${vote} procent a ${council.seats} mandátů, ale většinu ${council.majority} jste nesložil.`,story:"Výsledek byl silný, vztahy slabší. Věčný spojil zbytek zastupitelstva proti vám. Volby jste neprohrál u urny, ale u stolů, ke kterým jste se během kampaně odmítl nebo zapomněl posadit."};
 else if(vote>=25&&state.stats.leverage>=10)ending={emoji:"🗂️",title:"Poražený, kterého nelze obejít",lead:`Získal jste ${vote} procent a ${council.seats} mandátů, ale složky mají vyšší koaliční potenciál než křesla.`,story:"Věčný sestavuje radu. Do rána však zjistí, že bez vašich dokumentů a mlčení nebude mít klid. Koryto jste nezískal. Získal jste kohoutek."};
 else if(state.stats.integrity>=70)ending={emoji:"🌱",title:"Čestný člověk mimo radu",lead:`Získal jste ${vote} procent a ${council.seats} mandátů.`,story:"Prohrál jste, ale vytvořil jste síť občanů, novinářů a úředníků, kteří už vědí, že obec lze řídit jinak. Věčný vítězí. Tentokrát však nemá klid."};
 else ending={emoji:"📺",title:"Budoucí politický komentátor",lead:`Získal jste ${vote} procent a ${council.seats} mandátů.`,story:"V kampani jste získal nepřátele, závazky a několik výborných historek. Většinu nikoli. Okresní televize vám nabízí pravidelný prostor hodnotit chyby lidí, kteří ji sestavili."};
 if(council.seats<council.majority&&council.seats>=4){initCoalition(council,ending,roll,AUTOTEST);if(!AUTOTEST)return}
 if(!AUTOTEST)showEnding(ending,roll);
}
function renderEventRaw(f,finalStage){
 hideViews();const box=document.getElementById("eventView");box.classList.remove("hidden");
 box.innerHTML=`<div class="scene-top"><div><p class="eyebrow">FINÁLE</p><h2>${f.title}</h2><p>Volební den</p></div><div class="big">${f.emoji}</div></div><div class="scene-body">${f.text.map(p=>`<p>${p}</p>`).join("")}<div id="choiceBox" class="choices">${f.choices.map((c,i)=>choiceHtml(c,i)).join("")}</div><div id="resultBox" class="result hidden"></div></div>`;
 f.choices.forEach((c,i)=>document.getElementById(`choice${i}`).onclick=()=>{state.flags.finalChoice=f.choices[i];resolveFinalChoice(f.choices[i],finalStage)});
}
function resolveFinalChoice(choice,stage){
 if(chargeChoice(choice)===false)return;const mod=checkMod(choice),roll=rand(1,20),total=roll+mod,level=rollLevel(roll,total,choice.check.dc);
 pendingResolution={choice,roll,mod,total,level,finalStage:stage};showDice(true);
}
function applyFinalResolved(){
 const {choice,level,finalStage}=pendingResolution,out=(level==="critical"||level==="success"||level==="costly")?choice.success:choice.fail;
 let ef={...out.effects};if(level==="critical")Object.keys(ef).forEach(k=>ef[k]=Math.round(ef[k]*1.3));if(level==="costly"){const pen=costlyPenalty(choice.tags||[],"finale");for(const [k,v] of Object.entries(pen))ef[k]=(ef[k]||0)+v}if(level==="complication"&&pendingResolution.roll===1)ef.heat=(ef.heat||0)+8;
 effect(ef);registerApproach(choice.tags||[]);state.audit.rolls++;state.audit.outcomes[level]=(state.audit.outcomes[level]||0)+1;applyVoterReaction(out.tags||[],"finale",level);partyReact(out.tags||[]);out.extra?.();log(`Finále: ${choice.label}. ${out.text}`);
 const result=document.getElementById("resultBox");result.classList.remove("hidden");document.getElementById("choiceBox").classList.add("hidden");
 result.innerHTML=`<h3>${level==="critical"?"Kritický tah":level==="success"?"Tah vyšel":level==="costly"?"Tah vyšel za cenu":"Tah vytvořil komplikaci"}</h3><p>${out.text}</p><button id="nextFinal" class="btn primary">${finalStage===1?"Pokračovat ke skandálu":"Sečíst hlasy"}</button>`;
 document.getElementById("nextFinal").onclick=()=>{finalStage===1?showFinaleEvent(2):finalizeElection()};pendingResolution=null;renderAll();
}
function metricName(k){return({support:"Podpora",trust:"Důvěra",funds:"Peníze",heat:"Mediální tlak",influence:"Vliv",integrity:"Integrita",leverage:"Kompromat",debt:"Dluh",citizens:"Občané",jzd:"JZD",business:"Podnikatelé",press:"Média",oldguard:"Staré struktury",officials:"Úředníci"})[k]||k}
function choiceOdds(c){
 const counts={critical:0,success:0,costly:0,complication:0},mod=checkMod(c);
 for(let roll=1;roll<=20;roll++)counts[rollLevel(roll,roll+mod,c.check.dc)]++;
 return {clean:counts.critical+counts.success,costly:counts.costly,complication:counts.complication};
}
function choiceHtml(c,i){
 const cost=actionCost(c,eventById(state.currentEvent)),debt=cost>Math.max(0,state.stats.funds),blocked=c.requireFunds&&debt,odds=choiceOdds(c),mods=checkBreakdown(c),pen=approachPenalty(c);
 const modText=mods.length?mods.map(x=>`${x.label} ${x.val>0?"+":""}${x.val}`).join(" · "):"bez bonusu";const risk=odds.complication>=35?"high":odds.complication<=20?"low":"";
 return `<button id="choice${i}" class="choice" ${blocked?"disabled":""}><strong>${c.label}</strong><small>${c.detail}</small><span class="check">d20 + ${checkMod(c)} (${metricName(c.check.attr)}) proti ${c.check.dc}</span><span class="modline">${modText}</span><span class="risk ${risk}">čistý úspěch ${odds.clean*5} % · cena ${odds.costly*5} % · komplikace ${odds.complication*5} %${pen?` · taktika unavená −${pen}`:""}</span>${cost?`<span class="check">náklady ${cost}${blocked?" · NEMÁTE":debt?" · na politický dluh":""}</span>`:""}</button>`;
}
function showLocation(id){
 state.currentLocation=id;state.phase="location";hideViews();const l=locations[id],acts=getActivities(id),box=document.getElementById("locationView");box.classList.remove("hidden");
 box.innerHTML=`<div class="scene-top"><div><p class="eyebrow">LOKACE</p><h2>${l.name}</h2><p>${locationDesc(id)}</p></div><div class="big">${l.icon}</div></div><div class="scene-body"><h3>Co zde uděláte?</h3><div class="activity-list">${acts.map((a,i)=>`<button class="activity ${a.urgent?"urgent":""}" id="act${i}"><span>${a.icon}</span><div><strong>${a.title}</strong><small>${a.detail}${a.urgent?" · TERMÍN HOŘÍ":""}</small></div></button>`).join("")||"<p>Teď tu není nic důležitého. To je na obecní instituci neobvyklé.</p>"}</div></div>`;
 acts.forEach((a,i)=>document.getElementById(`act${i}`).onclick=()=>showEvent(a.id));
 renderAll();
}
function showEvent(id){
 if(id==="debate")return startDebate();
 state.currentEvent=id;state.phase="event";if(events[id]?.queued)state.flags["seen_"+id]=true;
 const e=eventById(id);hideViews();const box=document.getElementById("eventView");box.classList.remove("hidden");
 box.innerHTML=`<div class="scene-top"><div><p class="eyebrow">${e.kicker}</p><h2>${e.title}</h2><p>${locations[e.location]?.name||"Dolní Vejprnice"}</p></div><div class="big">${e.emoji}</div></div><div class="scene-body">${e.text().map(p=>`<p>${p}</p>`).join("")}${supportBarHtml()}<div id="choiceBox" class="choices">${e.choices.map((c,i)=>choiceHtml(c,i)).join("")}</div><div id="resultBox" class="result hidden"></div></div>`;
 bindSupportButtons();e.choices.forEach((c,i)=>document.getElementById(`choice${i}`).onclick=()=>resolveChoice(c));
 renderAll();
}
function hideViews(){["mapView","locationView","eventView"].forEach(id=>document.getElementById(id).classList.add("hidden"))}
function showMap(){
 if(state.ended)return;state.selectedSupport=null;state.phase="map";state.currentEvent=null;state.currentLocation=null;hideViews();document.getElementById("mapView").classList.remove("hidden");renderAll()
}
function renderMap(){
 const map=document.getElementById("map");map.innerHTML=Object.entries(locations).map(([id,l])=>{
  const acts=getActivities(id),urgent=acts.some(a=>a.urgent),count=acts.filter(a=>!["genericPub","genericHQ","genericJzd","genericPaper"].includes(a.id)).length;
  return `<button class="location ${urgent?"hot":""}" data-loc="${id}"><span class="ico">${l.icon}</span><strong>${l.name} ${planLocationMarker(id)}</strong><small>${locationDesc(id)}</small>${count?`<span class="badge">${count}</span>`:""}</button>`
 }).join("");
 map.querySelectorAll("[data-loc]").forEach(b=>b.onclick=()=>showLocation(b.dataset.loc))
}
function renderMetrics(){
 const s=state.stats;document.getElementById("metrics").innerHTML=[["Podpora",s.support],["Důvěra",s.trust],["Peníze",s.funds],["Dluh",state.debt],["Mediální tlak",s.heat],["Vliv",s.influence],["Integrita",s.integrity],["Kompromat",s.leverage]].map(([a,b])=>`<div class="metric"><span>${a}</span><strong>${Math.round(b)}</strong></div>`).join("");
 const morality=clamp(s.integrity),corruption=clamp((100-s.integrity)*.65+s.heat*.2+state.debt*.8);document.getElementById("soulBars").innerHTML=barHtml("Státník",morality)+barHtml("Korytizace",corruption);
}
function barHtml(label,val){return `<div class="bar-row"><div class="bar-label"><span>${label}</span><strong>${Math.round(val)}</strong></div><div class="bar"><i style="width:${clamp(val)}%"></i></div></div>`}
function renderFactions(){
 const f=state.factions;document.getElementById("factionBars").innerHTML=Object.entries({citizens:"Občané",jzd:"JZD",business:"Podnikatelé",press:"Média",oldguard:"Staré struktury",officials:"Úředníci"}).map(([id,n])=>barHtml(n,(f[id]+100)/2)).join("")
}
function renderVoters(){
 const el=document.getElementById("voterBars");if(!el)return;el.innerHTML=Object.entries(voterDefs).map(([id,v])=>{const s=state.voters[id]||{support:v.base,turnout:v.turnout};return `<div class="bar-row"><div class="bar-label"><span>${v.icon} ${v.name}</span><b>${Math.round(s.support)} % · účast ${Math.round(s.turnout*100)} %</b></div><div class="bar"><i style="width:${clamp(s.support)}%"></i></div></div>`}).join("");
}


function renderWarRoom(){
 const el=document.getElementById("warRoom");if(!el)return;const p=currentProjection(),cap=Math.round(coalitionCapacity()),major=p.seats>=p.majority;el.innerHTML=`<div class="journal-item projection"><strong>🗳️ Projekce ${p.low}–${p.high} %</strong><span>${p.seatLow}–${p.seatHigh} mandátů z 15 · střed ${p.seats}${major?" · vlastní většina":" · koaliční kapacita "+cap}</span></div><div class="war-grid"><div class="war-item"><span>NEJBLIŽŠÍ TERMÍN</span><strong>${nextDeadline()}</strong></div><div class="war-item"><span>NEJBLIŽŠÍ HROZBA</span><strong>${nextThreat()}</strong></div><div class="war-item"><span>KÓD KAMPANĚ</span><strong>${state.seed||"bez razítka"}</strong></div><div class="war-item"><span>TAKTICKÁ ÚNAVA</span><strong>${Object.entries(state.approachHeat||{}).filter(([,v])=>v>=3).map(([k,v])=>`${k} ${v}`).join(", ")||"žádná"}</strong></div><div class="war-item"><span>KOALIČNÍ KAPITÁL</span><strong>Důvěra ${coalitionResources().credibility} · Trafiky ${coalitionResources().patronage} · Tlak ${coalitionResources().pressure}</strong></div><div class="war-item"><span>TŘÍDNÍ SPECIALIZACE</span><strong>${state.classMastery?(classMasteryDefs[state.hero.classId].find(x=>x.id===state.classMastery)?.name||state.classMastery):"čeká na výběr"}</strong></div><div class="war-item counter-read"><span>SOUPEŘOVA ADAPTACE</span><strong>${rivalReadLabel()}</strong></div></div>`;
}
function renderFactionPlans(){
 const box=document.getElementById("factionPlans");if(!box)return;box.innerHTML=Object.entries(factionPlanDefs).map(([id,d])=>{const p=state.factionPlans[id];if(!p)return"";const visible=p.revealed||p.stage>0||id==="oldguard";const pending=state.pendingEvents.map(eid=>({eid,e:eventById(eid),m:state.pendingMeta[eid]})).find(x=>x.e?.id?.toLowerCase().includes(id==="oldguard"?"oldguard":id));const timer=pending?.m?` · reakce do dne ${pending.m.expiresDay}`:"";return `<div class="journal-item ${p.progress>=75?"urgent":""}"><strong>${d.icon} ${visible?d.name:"Neznámý plán"}</strong><span>${visible?`${d.owner} · ${Math.round(p.progress)} % · ${planStepText(id)}${timer}`:"Někdo v obci koordinuje kroky bez veřejného programu."}</span></div>`}).join("");
}

function renderWorldPulse(){const el=document.getElementById("worldPulse");if(!el)return;const rows=(state.worldActions||[]).slice(0,8);el.innerHTML=rows.length?rows.map(x=>`<div class="world-action ${x.type||""}"><strong>Den ${x.day} · ${x.owner}</strong><span>${x.text}</span>${x.location?`<small>${locations[x.location]?.icon||""} ${locations[x.location]?.name||x.location}</small>`:""}</div>`).join(""):"<p style='color:var(--muted)'>Svět zatím čeká na první tah. To je podezřelé.</p>"}
function renderAmbitions(){const el=document.getElementById("ambitionPanel");if(!el)return;const rows=Object.entries(state.party).map(([id,p])=>{const d=companionAmbitionDefs[id],a=state.companionAmbitions?.[id];if(!d||!a)return"";const tension=a.tension>a.progress;return `<div class="ambition-row ${tension?"tense":""}"><div class="ambition-head"><strong>${d.icon} ${p.name}</strong><span>${a.resolved?"uzavřeno":tension?"napětí roste":"agenda postupuje"}</span></div><small>${d.name}</small><div class="ambition-meter"><i style="width:${clamp(tension?a.tension:a.progress)}%"></i></div><div class="tags"><span class="tag">cíl ${Math.round(a.progress||0)}</span><span class="tag">napětí ${Math.round(a.tension||0)}</span>${a.withheldUntil>=state.day?`<span class="tag">podpora stažena</span>`:""}</div></div>`}).filter(Boolean);el.innerHTML=rows.length?rows.join(""):"<p style='color:var(--muted)'>Bez štábu nejsou osobní ambice. Jen vaše.</p>"}
function renderRivalOperation(){const el=document.getElementById("rivalOperationPanel");if(!el)return;const o=state.rivalOperation;if(!o?.id){el.innerHTML=`<div class="operation-card"><strong>🎭 Věčný zatím sbírá vzorec</strong><p>${rivalReadLabel()}</p></div>`;return}const d=rivalOperationDefs[o.id];el.innerHTML=`<div class="operation-card"><strong>${d.icon} ${o.revealed?d.name:"Neznámá operace"}</strong><p>${o.revealed?d.stages[Math.max(0,(o.stage||1)-1)]:"Soupeř koordinuje několik tahů. Přesný cíl zatím neznáte."}</p><div class="operation-track"><i style="width:${clamp(o.progress||0)}%"></i></div><span class="world-chip">fáze ${o.stage||0}/3</span><span class="world-chip">postup ${Math.round(o.progress||0)} %</span><span class="world-chip">${o.completed?"dokončena":"probíhá"}</span></div>`}

function renderConspiracy(){
 const box=document.getElementById("conspiracyPanel");if(!box)return;const c=state.conspiracy;if(!c){box.innerHTML="";return}const hints={diesel:"JZD / nafta",roof:"škola / dodatek",meadow:"louka / vlastník",archive:"radnice / archiv"};const clues=Object.entries(c.pieces||{}).map(([id,ok])=>`<span class="tag ${ok?"":"clue-missing"}">${ok?"✓":"?"} ${ok?id:hints[id]}</span>`).join("");
 box.innerHTML=`<div class="journal-item ${c.clues>=3&&!c.resolved?"urgent":""}"><strong>${c.exposed?"✅ Rozkryta":c.joined?"🤝 Jste uvnitř":c.revealed?"🕸️ Síť odhalena":"❔ Pouhé podezření"}</strong><span>${c.clues}/4 stop · ${c.resolved?"kauza uzavřena":c.clues>=4?"čeká závěrečné rozhodnutí":c.clues>=2?"jednotlivé kauzy se propojují":"zatím chybí souvislosti"}</span><div class="tags">${clues}</div></div>`;
}
function renderCommitments(){
 const el=document.getElementById("commitments");if(!el)return;const rows=state.commitments.filter(c=>c.status==="active");
 el.innerHTML=rows.length?rows.sort((a,b)=>a.due-b.due).map(c=>`<div class="journal-item ${c.due-state.day<=1?"urgent":""}"><strong>${c.kind==="public"?"📣":"🤝"} ${c.title}</strong>${c.creditor} · termín den ${c.due}${c.amount?` · hodnota ${c.amount}`:""}<div class="tags"><span class="tag">${c.kind==="public"?"veřejný slib":"soukromý dluh"}</span><span class="tag">${c.notes||"politická paměť"}</span></div></div>`).join(""):"<p style='color:var(--muted)'>Nikomu nic nedlužíte. Buď jste na začátku, nebo velmi zkušený.</p>";
}


function renderRelationships(){const el=document.getElementById("relationshipPanel");if(!el)return;const rows=Object.entries(relationshipDefs).filter(([,d])=>state.party[d.a]&&state.party[d.b]);el.innerHTML=rows.length?rows.map(([id,d])=>{const v=state.relationships?.[id]??d.base;return `<div class="relationship ${v<-20?"tense":v>25?"good":""}"><strong>${companions[d.a].icon} ${companions[d.a].name} × ${companions[d.b].name} ${companions[d.b].icon}</strong><span>${d.label} · vztah ${Math.round(v)}</span></div>`}).join(""):"<p style='color:var(--muted)'>Zatím se ve štábu nemá kdo hádat. To se obvykle rychle napraví.</p>"}
function renderParty(){
 const el=document.getElementById("partyList"),ps=Object.entries(state.party),assigned=state.partyAssignment?.id;
 el.innerHTML=ps.length?ps.map(([id,p])=>{const cs=state.companionStories?.[id],pd=companionStoryDefs[id],fat=state.partyFatigue?.[id]||0,perk=cs?.perk,mod=Math.floor(p.loyalty/22)+(state.stats.influence>=55?1:0)+(perk?2:0)-Math.floor(fat/2),dc=perk?11:12,clean=[...Array(20)].filter((_,i)=>["critical","success"].includes(rollLevel(i+1,i+1+mod,dc))).length*5;const personal=cs?.done?(cs.perk?`<span class="tag">perk: ${cs.perk}</span>`:`<span class="tag">osobní quest uzavřen</span>`):state.day>=pd?.day?`<span class="tag">osobní quest čeká</span>`:`<span class="tag">osobní quest den ${pd?.day||"?"}</span>`;const av=companionAvailability(id),amb=state.companionAmbitions?.[id];return `<div class="party-item ${p.loyalty<28?"low":p.loyalty>65?"good":""}"><strong>${p.icon} ${p.name}</strong>${p.role} · loajalita ${Math.round(p.loyalty)} · únava <span class="${fat>=3?"fatigue":""}">${fat}/4</span><div class="tags"><span class="tag">${p.mission}</span><span class="tag">čistý úspěch ${clean} %</span>${personal}${amb?`<span class="tag">agenda ${Math.round(amb.progress||0)} / napětí ${Math.round(amb.tension||0)}</span>`:""}</div><small style="color:var(--muted)">${p.missionDesc}</small>${!av.ok?`<div class="availability-note">⚠ ${av.reason}</div>`:""}<button data-dispatch="${id}" class="btn small" style="margin-top:7px;width:100%" ${state.partyUsedDay===state.day||state.partyAssignment||fat>=4||!av.ok?"disabled":""}>${assigned===id?"Na misi":fat>=4?"Potřebuje odpočinek":"Vyslat dnes"}</button></div>`}).join(""):"<p style='color:var(--muted)'>Zatím za vámi stojí jen vaše vlastní přesvědčení. To bývá dočasné.</p>";
 el.querySelectorAll("[data-dispatch]").forEach(b=>b.onclick=()=>dispatchCompanion(b.dataset.dispatch));
}
function renderJournal(){
 const active=Object.entries(state.quests).filter(([,q])=>q.status==="active").sort((a,b)=>questDeadline(a[0])-questDeadline(b[0]));
 document.getElementById("journal").innerHTML=active.length?active.map(([id,q])=>{const d=questDefs[id],left=questDeadline(id)-state.day,pressure=left<=1?"KRITICKÉ":left<=3?"NALÉHAVÉ":"AKTIVNÍ";return `<div class="journal-item ${left<=2?"urgent":""}"><strong>${d.title}</strong><span>${d.desc}</span><div class="tags"><span class="tag">${pressure}</span><span class="tag">${left>=0?left+" dnů do termínu":"po termínu"}</span><span class="tag">${locations[d.location].name}</span></div><div class="micro"><b>Pokud selže:</b> ${d.failure}</div></div>`}).join(""):"<p style='color:var(--muted)'>Všechny známé problémy jsou vyřešeny, zameteny nebo přejmenovány.</p>";
}
function renderNews(){
 document.getElementById("news").innerHTML=state.news.length?state.news.slice(0,8).map(n=>`<div class="news-item"><strong>Den ${n.day}</strong> ${n.text}</div>`).join(""):"<p style='color:var(--muted)'>Zatím se nic nestalo. Místní rozhlas to brzy napraví.</p>"
}
function renderInventory(){
 const items={megaphone:["📣 Megafon zdravého rozumu","+1 charisma"],dieselCopy:["📼 Kopie záznamu z JZD","+2 při policejních a naftových komplikacích"],blackmail:["🗂️ Složka na Brázdu","+2 k mocenským a JZD hodům"],schoolKeys:["🔑 Klíče od školy","+2 při rozhodnutích o dětech a škole"],envelope:["✉️ Obálka stability","+1 ke korupčním a smluvním hodům"],zoningDeal:["📐 Dodatek k louce","+2 na louce a u developerských smluv"],auditReport:["📑 Auditní zpráva","+2 k transparentním a právním hodům"],dossier:["🧾 Složka na Věčného","+2 k útokům a manipulaci"],ashes:["🔥 Popel právní jistoty","+2 k ničení stop a korupci"],scarf:["🧣 Klubová šála","+1 na hřišti a ve volebním finále"],program:["📜 Pět kontrolovatelných slibů","+1 k čestným tahům a ve finále"],labReport:["🧪 Rozbor vody","+1 k transparentním a právním hodům"],budgetDraft:["📕 Původní rozpočet","+1 na úřadě a při mocenských hodech"],wasteContract:["🗑️ Smlouva o svozu","+1 ke smluvním a právním hodům"],ballotProof:["🗳️ Vadný hlasovací lístek","+1 ve volebním finále"]};
 document.getElementById("inventory").innerHTML=state.items.length?state.items.map(i=>{const x=items[i]||[i,""];return `<div class="party-item"><strong>${x[0]}</strong>${x[1]}</div>`}).join(""):"<p style='color:var(--muted)'>Prázdné kapsy a několik ústních příslibů.</p>"
}
function renderHeader(){
 document.getElementById("app").classList.toggle("pixel-off",state.ui?.pixelMap===false);const pt=document.getElementById("pixelToggle");if(pt)pt.textContent=`Pixelová mapa: ${state.ui?.pixelMap===false?"vypnuta":"zapnuta"}`;
 document.getElementById("heroLabel").textContent=state.hero.name;document.getElementById("classLabel").textContent=classes[state.hero.classId].name;
 document.getElementById("avatar").textContent=classes[state.hero.classId].icon;document.getElementById("timeLabel").textContent=`Den ${state.day} · ${state.actions} akce · ${state.seed||"bez kódu"}`;
 document.getElementById("clock").textContent=`Kampaň ${Math.min(state.day,13)}/13 · zbývají ${state.actions} akce · ${dueQuestCount()} hoří`;
}
function renderAll(){if(!document.getElementById("gameScreen").classList.contains("active"))return;renderHeader();renderMetrics();renderWarRoom();renderFactions();renderVoters();renderParty();renderRelationships();renderCommitments();renderFactionPlans();renderWorldPulse();renderAmbitions();renderRivalOperation();renderConspiracy();renderJournal();renderNews();renderInventory();renderMap()}
function showDice(finalMode=false){
 const o=document.getElementById("diceOverlay"),d=document.getElementById("d20"),r=pendingResolution;o.classList.remove("hidden");document.getElementById("diceClose").classList.add("hidden");
 document.getElementById("diceTitle").textContent=`Hod na ${metricName(r.choice.check.attr)}`;document.getElementById("diceOutcome").textContent="Kostka rozhoduje, zda realita přijme váš tiskový výklad.";
 let n=0,interval=setInterval(()=>{d.textContent=1+Math.floor(Math.random()*20);if(++n>12){clearInterval(interval);d.textContent=r.roll;document.getElementById("diceFormula").textContent=`${r.roll} + ${r.mod} = ${r.total} proti obtížnosti ${r.choice.check.dc}${r.rerolled?" · bard změnil téma a přehodil":""} · ${checkBreakdown(r.choice).map(x=>`${x.label} ${x.val>0?"+":""}${x.val}`).join(", ")}`;document.getElementById("diceOutcome").textContent=r.level==="critical"?"Mimořádný úspěch. Dokonce i fakta chvíli spolupracují.":r.level==="success"?"Úspěch. Tiskové oddělení může použít slovo zvládnuto.":r.level==="costly"?"Úspěch za cenu. Cíl splněn, účet dorazí později.":"Komplikace. Příběh pokračuje novým problémem.";const b=document.getElementById("diceClose");b.classList.remove("hidden");b.onclick=()=>{o.classList.add("hidden");finalMode?applyFinalResolved():applyResolved()}}},55)
}
function showEnding(e,roll){
 ["startScreen","creationScreen","gameScreen","coalitionScreen","debateScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("endingScreen").classList.add("active");
 document.getElementById("endingEmoji").textContent=e.emoji;document.getElementById("endingTitle").textContent=e.title;document.getElementById("endingLead").textContent=e.lead;
 const groups=state.electionBreakdown.map(x=>`<div class="final-stat"><span>${x.icon} ${x.name}</span><strong>${x.share} % (${x.votes}/${x.ballots})</strong></div>`).join("");
 const planSummary=Object.entries(factionPlanDefs).map(([id,d])=>`<div class="final-stat"><span>${d.icon} ${d.name}</span><strong>${Math.round(state.factionPlans[id]?.progress||0)} %</strong></div>`).join("");const siloSummary=`<div class="final-stat"><span>🏭 Operace SILO</span><strong>${state.conspiracy.exposed?"zveřejněna":state.conspiracy.joined?"převzata":state.conspiracy.resolved?"dohodnuta":state.conspiracy.clues+"/4 stop"}</strong></div>`;const coalitionSummary=(state.flags.coalitionContracts||[]).length?`<h3>Koaliční účet</h3>${state.flags.coalitionContracts.map(x=>`<div class="final-stat"><span>${coalitionPartnerDefs[x.partner]?.icon||"🤝"} ${coalitionPartnerDefs[x.partner]?.name||x.partner}</span><strong>${x.kind==="program"?"program":"funkce / ochrana"}</strong></div>`).join("")}`:"";
 document.getElementById("endingStory").innerHTML=`<h3>Jak jste vytvořil vlastní politickou legendu</h3><p style="line-height:1.7">${e.story}</p><p><strong>Volební hod kostkou:</strong> ${roll}</p><h3>Kdo vás skutečně volil</h3>${groups}<h3>Co mezitím dělaly frakce</h3>${planSummary}${siloSummary}${coalitionSummary}<h3>Kronika</h3><p>${state.log.slice(-8).join("<br><br>")}</p>`;
 const s=state.stats;document.getElementById("finalStats").innerHTML=[["Výsledek",state.flags.vote+" %"],["Mandáty",state.flags.seats+" / 15"],["Koaliční většina",state.flags.coalitionFormed&&state.flags.coalitionTotalSeats?state.flags.coalitionTotalSeats+" / 15":"—"],["Většina",state.flags.seats>=state.flags.majority?"Ano, bez koalice":state.flags.coalitionFormed?"Ano, koaliční":"Ne"],["Splněné závazky",state.promiseSummary.fulfilled],["Porušené závazky",state.promiseSummary.broken],["Dluh",state.debt],["Podpora před volbami",s.support],["Důvěra",s.trust],["Integrita",s.integrity],["Mediální tlak",s.heat],["Vliv",s.influence],["Tah Věčného",Math.round(state.opponent.momentum)],["Kód kampaně",state.seed],["Hody",state.audit.rolls]].map(([a,b])=>`<div class="final-stat"><span>${a}</span><strong>${b}</strong></div>`).join("");
}
function newGame(){
 state=deep(baseState);state.hero.name=document.getElementById("heroName").value.trim()||"Bohuslav Korytář";state.seed=`VEP-${hashSeed(state.hero.name+Date.now()).toString(36).slice(-6).toUpperCase()}`;state.rngState=hashSeed(state.seed);state.hero.classId=selectedClass;state.hero.origin=document.getElementById("origin").value;state.hero.attrs={...classes[selectedClass].attrs};
 if(state.hero.origin==="idealist"){effect({trust:5,integrity:10,funds:-2})}
 if(state.hero.origin==="ambitious"){effect({influence:6,support:3,integrity:-4})}
 if(state.hero.origin==="revenge"){effect({leverage:4,authority:1,integrity:-5});state.hero.attrs.authority++}
 initQuests();initVoters();initSurprises();initLivingWorld();normalizeState();state.news=[{day:1,text:"Starosta Věčný hospitalizován po obecní zabijačce. Místní rozhlas přeje brzký návrat, ale neupřesňuje do funkce.",type:"normal"}];
 ["startScreen","creationScreen","endingScreen","coalitionScreen","debateScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("gameScreen").classList.add("active");
 document.querySelectorAll("#saveBtn,#loadBtn,#restartBtn,#exportBtn,#mapBtn").forEach(b=>b.classList.remove("hidden"));
 showEvent("intro");
}
function normalizeState(){return globalThis.KorytoGameEngine.normalize(state,{hashSeed,relationshipDefs,conflictDefs,companionAmbitionDefs})}
function autoSave(){if(state.phase!=="map"||state.ended)return;normalizeState();state.audit.autosaves++;const raw=JSON.stringify(state);try{localStorage.setItem("koryto_v014_auto",raw)}catch(e){memorySave=raw}}
function save(){if(state.phase!=="map")return alert("Ukládat lze jen na mapě. Rozhodnutí uprostřed věty se v politice ukládají jinak.");normalizeState();const raw=JSON.stringify(state);try{localStorage.setItem("koryto_v014",raw)}catch(e){memorySave=raw}addNews("Hra uložena. Na rozdíl od obecních smluv ji lze znovu najít.");renderAll()}
function load(){let raw=memorySave;try{raw=localStorage.getItem("koryto_v014")||localStorage.getItem("koryto_v014_auto")||localStorage.getItem("koryto_v013")||localStorage.getItem("koryto_v013_auto")||localStorage.getItem("koryto_v012")||localStorage.getItem("koryto_v012_auto")||localStorage.getItem("koryto_v011")||localStorage.getItem("koryto_v011_auto")||localStorage.getItem("koryto_v010")||localStorage.getItem("koryto_v091")||localStorage.getItem("koryto_v09")||raw}catch(e){}if(!raw)return alert("Žádná uložená hra nebyla nalezena.");state=JSON.parse(raw);normalizeState();state.commitments=state.commitments||[];state.voters=state.voters&&Object.keys(state.voters).length?state.voters:(()=>{const x={};for(const [id,v] of Object.entries(voterDefs))x[id]={support:v.base,turnout:v.turnout};return x})();state.debt=state.debt||0;if(!state.factionPlans||!Object.keys(state.factionPlans).length){const saved=deep(state);initLivingWorld();state.factionPlans=state.factionPlans||saved.factionPlans;state.conspiracy=state.conspiracy||saved.conspiracy;state.companionStories=state.companionStories||saved.companionStories;state.worldChanges=state.worldChanges||saved.worldChanges}state.partyAssignment=null;state.partyUsedDay=0;["startScreen","creationScreen","endingScreen","coalitionScreen","debateScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("gameScreen").classList.add("active");document.querySelectorAll("#saveBtn,#loadBtn,#restartBtn,#exportBtn,#mapBtn").forEach(b=>b.classList.remove("hidden"));showMap()}
function restart(){if(confirm("Opravdu zahodit rozehranou kariéru? Politické důsledky se běžně mažou hůř."))location.reload()}
function exportLog(){const text=`KORYTO v0.14 – KRONIKA\nKód kampaně: ${state.seed}\n${state.hero.name}, ${classes[state.hero.classId].name}\n\n${state.log.join("\n\n")}\n\nStav: ${JSON.stringify(state.stats,null,2)}\n\nAudit: ${JSON.stringify(state.audit,null,2)}`;const b=new Blob([text],{type:"text/plain;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="koryto_kronika.txt";a.click();URL.revokeObjectURL(a.href)}
function setup(){
 document.getElementById("startBtn").onclick=()=>{document.getElementById("startScreen").classList.remove("active");document.getElementById("creationScreen").classList.add("active")};
 document.getElementById("classGrid").innerHTML=Object.entries(classes).map(([id,c])=>`<button class="class-card ${id===selectedClass?"selected":""}" data-class="${id}"><span>${c.icon}</span><strong>${c.name}</strong><small>${c.desc}</small></button>`).join("");
 document.querySelectorAll("[data-class]").forEach(b=>b.onclick=()=>{selectedClass=b.dataset.class;document.querySelectorAll("[data-class]").forEach(x=>x.classList.toggle("selected",x.dataset.class===selectedClass))});
 document.getElementById("confirmBtn").onclick=newGame;document.getElementById("mapBtn").onclick=showMap;document.getElementById("endDayBtn").onclick=skipDay;document.getElementById("pixelToggle").onclick=()=>{state.ui=state.ui||{};state.ui.pixelMap=!state.ui.pixelMap;document.getElementById("app").classList.toggle("pixel-off",!state.ui.pixelMap);document.getElementById("pixelToggle").textContent=`Pixelová mapa: ${state.ui.pixelMap?"zapnuta":"vypnuta"}`;};document.getElementById("saveBtn").onclick=save;document.getElementById("loadBtn").onclick=load;document.getElementById("restartBtn").onclick=restart;document.getElementById("exportBtn").onclick=exportLog;document.getElementById("againBtn").onclick=()=>location.reload();
}
function simulateStrategy(strategy="mixed",runSeed=0){
 state=deep(baseState);state.seed=`SIM-${strategy}-${String(runSeed)}`;state.rngState=hashSeed(state.seed);state.hero={name:"Test",classId:strategy==="corrupt"?"rogue":strategy==="ideal"?"paladin":strategy==="legal"?"mage":"bard",origin:strategy==="ideal"?"idealist":"ambitious",attrs:{}};state.hero.attrs={...classes[state.hero.classId].attrs};initQuests();initVoters();initSurprises();initLivingWorld();normalizeState();state.flags.introDone=true;completeQuest("register");let guard=0,route=[];
 const scoreChoice=(c)=>{const t=c.tags||[];if(strategy==="ideal")return (t.includes("ethical")?5:0)+(t.includes("transparent")?4:0)-(t.includes("corrupt")?8:0)-(t.includes("lie")?3:0);if(strategy==="corrupt")return (t.includes("corrupt")?6:0)+(t.includes("power")?3:0)+(t.includes("contract")?3:0)-(t.includes("ethical")?2:0);if(strategy==="legal")return (t.includes("legal")?6:0)+(t.includes("transparent")?3:0);if(strategy==="populist")return (t.includes("public")?6:0)+(t.includes("lie")?2:0);return rng()*4};
 while(!state.ended&&guard++<90){
  unlockByDay();
  if(state.day>=14){finalizeElection();break}
  const locs=Object.keys(locations).map(id=>({id,acts:getActivities(id)})).filter(x=>x.acts.length);
  if(!locs.length){endDay();continue}
  const urgent=locs.flatMap(l=>l.acts.filter(a=>a.urgent).map(a=>({...a,loc:l.id})));
  const a=urgent.length?urgent.sort(()=>rng()-.5)[0]:(()=>{const l=pick(locs);return {...pick(l.acts),loc:l.id}})();
  state.currentLocation=a.loc;state.currentEvent=a.id;route.push(a.id);
  if(a.id==="debate"){simulateDebate(strategy);state.flags["done_debate"]=true;consumeAction();continue}
  const e=eventById(a.id),c=[...e.choices].sort((x,y)=>scoreChoice(y)-scoreChoice(x))[0];
  if(chargeChoice(c)===false){consumeAction();continue}
  const mod=checkMod(c);let roll=rand(1,20),level=rollLevel(roll,roll+mod,c.check.dc);
  if((level==="costly"||level==="complication")&&state.hero.classId==="bard"&&c.tags?.includes("public")&&state.abilityUsedDay!==state.day){roll=rand(1,20);level=rollLevel(roll,roll+mod,c.check.dc);state.abilityUsedDay=state.day}
  const out=(level==="critical"||level==="success"||level==="costly")?c.success:c.fail;let ef={...out.effects};
  if(e.repeatable){const uses=state.genericUses[e.id]||0,mult=[1,.62,.35][uses]||.2;Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.max(1,Math.round(ef[k]*mult))});if(uses>0)ef.heat=(ef.heat||0)+uses;state.genericUses[e.id]=uses+1;state.cooldowns[e.id]=state.day+2}
  if(level==="critical"){Object.keys(ef).forEach(k=>ef[k]=Math.round(ef[k]*1.35));ef.support=(ef.support||0)+2}
  if(level==="costly"){Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.max(1,Math.round(ef[k]*.68))});const pen=costlyPenalty(c.tags||[],e.id);for(const[k,v]of Object.entries(pen))ef[k]=(ef[k]||0)+v}
  if(level==="complication"&&roll===1){Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.floor(ef[k]*.3);else ef[k]=Math.round(ef[k]*1.25)});ef.heat=(ef.heat||0)+5}
  if(state.hero.classId==="rogue"&&c.tags?.includes("corrupt")&&ef.funds>0)ef.funds+=3;
  effect(ef);registerApproach(c.tags||[]);state.audit.rolls++;state.audit.outcomes[level]=(state.audit.outcomes[level]||0)+1;state.audit.locations[state.currentLocation]=(state.audit.locations[state.currentLocation]||0)+1;applyVoterReaction(out.tags||c.tags||[],e.id,level);partyReact(out.tags||c.tags||[]);out.extra?.();if(e.id.endsWith("Personal")){const cid=e.id.replace("Personal","");if(state.companionStories[cid])state.companionStories[cid].done=true}createCommitmentFromChoice(e.id,c,level);trackLivingWorld(e.id,c,level);updateCompanionAmbitions(e.id,c,level);if(echoEventDefs[e.id])registerEcho(e.id,{tags:c.tags||[],level});e.after?.();
  if(!e.repeatable&&!e.queued)state.flags["done_"+e.id]=true;
  if(e.queued||state.pendingEvents.includes(e.id)){state.pendingEvents=state.pendingEvents.filter(x=>x!==e.id);delete state.pendingMeta[e.id];state.flags["resolved_"+e.id]=true}
  consumeAction();
 }
 if(state.coalition?.active){for(const id of ["civic","rural","progress","oldguard"]){if(state.coalition.seats>=state.coalition.needed||state.coalition.round>state.coalition.maxRounds)break;const p=state.coalition.partners[id];if(!p||p.seats===0||p.locked||p.joined)continue;const offers=coalitionOfferDefs(id),pref=strategy==="ideal"||strategy==="legal"?offers[0]:strategy==="corrupt"?offers[2]:offers[1];const resource=state.coalition.resources[pref.resource];if(resource<pref.cost)continue;state.coalition.resources[pref.resource]=Math.max(0,resource-pref.cost);const attr=attributeMod(pref.attr),bonus=classCoalitionBonus(pref.id)+Math.floor(resource/25),roll=rand(1,20),ok=roll+attr+bonus>=pref.dc;if(ok){p.joined=true;state.coalition.joined.push(id);state.coalition.seats+=p.seats}else p.locked=true;state.coalition.round++}state.flags.coalitionFormed=state.coalition.seats>=state.coalition.needed;state.ended=true}
 return {strategy,ended:state.ended,vote:state.flags.vote||0,seats:state.flags.seats||0,coalition:!!state.flags.coalitionFormed,debate:state.flags.debateGrade||"none",mastery:state.classMastery||"none",rivalCounters:state.rivalAI?.counters||0,worldActions:(state.worldActions||[]).length,ambitionsResolved:Object.values(state.companionAmbitions||{}).filter(x=>x.resolved).length,echoesTriggered:(state.echoes||[]).filter(x=>x.triggered).length,rivalOperationStage:state.rivalOperation?.stage||0,coalitionPartners:(state.coalition?.joined||[]).length,conflicts:Object.values(state.conflictStates||{}).filter(x=>x.resolved).length,heat:state.stats.heat,debt:state.debt,broken:state.promiseSummary.broken||0,clues:state.conspiracy?.clues||0,siloResolved:!!state.conspiracy?.resolved,personal:Object.values(state.companionStories||{}).filter(x=>x.done).length,planMax:Math.max(...Object.values(state.factionPlans||{}).map(x=>x.progress||0),0),outcomes:{...state.audit.outcomes},route:route.join("|")};
}
globalThis.KorytoApp={
 VERSION:"0.14.4 TEST.7",
 getState:()=>state,setState:next=>(state=next),get baseState(){return baseState},get events(){return events},
 eventById,showEvent,showMap,showLocation,newGame,normalizeState,save,load,autoSave,endDay,worldTurn,
 finalizeElection,startDebate,simulateStrategy,runAutotest:null,questDeadline,currentProjection,councilResult,coalitionCapacity
};
function runAutotest(){
 const strategies=["ideal","corrupt","legal","populist","mixed"],rows=[];for(const s of strategies)for(let i=0;i<120;i++)rows.push(simulateStrategy(s,i));
 const lines=["AUTOTEST KORYTO v0.14",`completed=${rows.filter(r=>r.ended).length}/${rows.length}`,`unique_routes=${new Set(rows.map(r=>r.route)).size}`];
 for(const s of strategies){const x=rows.filter(r=>r.strategy===s),avg=k=>(x.reduce((a,b)=>a+b[k],0)/x.length).toFixed(1);lines.push(`${s}: avg_vote=${avg("vote")} min=${Math.min(...x.map(r=>r.vote))} max=${Math.max(...x.map(r=>r.vote))} avg_heat=${avg("heat")} avg_debt=${avg("debt")} avg_broken=${avg("broken")} avg_clues=${avg("clues")} silo_resolved=${x.filter(r=>r.siloResolved).length}/${x.length} avg_personal=${avg("personal")} avg_plan_max=${avg("planMax")} coalition_rate=${x.filter(r=>r.coalition).length}/${x.length} avg_coalition_partners=${avg("coalitionPartners")} avg_conflicts=${avg("conflicts")} debate_wins=${x.filter(r=>r.debate==="win"||r.debate==="dominant").length}/${x.length} mastery=${x.filter(r=>r.mastery!=="none").length}/${x.length} avg_rival_counters=${avg("rivalCounters")} avg_world_actions=${avg("worldActions")} avg_ambitions_resolved=${avg("ambitionsResolved")} avg_echoes=${avg("echoesTriggered")} avg_rival_op_stage=${avg("rivalOperationStage")}`)}
 document.body.innerHTML=`<pre class="autotest">${lines.join("\n")}</pre>`;
}
globalThis.KorytoApp.runAutotest=runAutotest;
if(AUTOTEST)runAutotest();else setup();
