"use strict";
(() => {
  const VERSION = "0.14.4 TEST.7";
  const object=(v,fallback={})=>v&&typeof v==="object"&&!Array.isArray(v)?v:fallback;
  const array=v=>Array.isArray(v)?v:[];
  function normalize(target,{hashSeed,relationshipDefs,conflictDefs,companionAmbitionDefs}={}){
    if(!target||typeof target!=="object")return target;
    target.hero=object(target.hero,{name:"",classId:"bard",origin:"idealist",attrs:{}});target.hero.attrs=object(target.hero.attrs,{});
    target.stats=object(target.stats,{});target.factions=object(target.factions,{});target.flags=object(target.flags,{});target.party=object(target.party,{});target.voters=object(target.voters,{});
    target.seed=target.seed||`VEP-${(hashSeed?.(target.hero?.name||"migrace")||0).toString(36).slice(-6).toUpperCase()}`;target.rngState=target.rngState||(hashSeed?.(target.seed)||2463534242);
    target.approachHeat=object(target.approachHeat,{});target.lastApproaches=array(target.lastApproaches);target.partyFatigue=object(target.partyFatigue,{});
    target.audit=object(target.audit,{rolls:0,outcomes:{critical:0,success:0,costly:0,complication:0},locations:{},approaches:{},autosaves:0});target.audit.outcomes=object(target.audit.outcomes,{critical:0,success:0,costly:0,complication:0});target.audit.locations=object(target.audit.locations,{});target.audit.approaches=object(target.audit.approaches,{});
    target.relationships=object(target.relationships,{});for(const [id,d] of Object.entries(relationshipDefs||{}))if(target.relationships[id]===undefined)target.relationships[id]=d.base;
    target.conflictStates=object(target.conflictStates,{});for(const id of Object.keys(conflictDefs||{}))target.conflictStates[id]=object(target.conflictStates[id],{queued:false,resolved:false,path:null,aftermath:false});
    target.companionSupportUsed=object(target.companionSupportUsed,{});target.selectedSupport=null;target.coalition=object(target.coalition,{active:false,round:0,maxRounds:3,partners:{},joined:[],seats:0,log:[],contracts:[],resources:{}});
    target.classMastery=target.classMastery||null;target.classAbilityUsed=!!target.classAbilityUsed;target.debate=object(target.debate,{active:false});target.rivalAI=object(target.rivalAI,{adaptation:null,reads:{},counters:0,lastCounterDay:0,revealed:false});target.rivalAI.reads=object(target.rivalAI.reads,{});
    target.worldActions=array(target.worldActions);target.factionActionCooldowns=object(target.factionActionCooldowns,{});target.companionAmbitions=object(target.companionAmbitions,{});for(const id of Object.keys(companionAmbitionDefs||{}))target.companionAmbitions[id]=object(target.companionAmbitions[id],{progress:18,tension:0,resolved:false,path:null,queued:false,withheldUntil:0,lastActionDay:0});
    target.echoes=array(target.echoes);target.echoHistory=array(target.echoHistory);target.rivalOperation=object(target.rivalOperation,{});target.ui=object(target.ui,{pixelMap:true});target.pendingEvents=array(target.pendingEvents);target.items=array(target.items);target.news=array(target.news);target.log=array(target.log);target.commitments=array(target.commitments);target.version="0.14";
    globalThis.KorytoQuestRuntime?.normalize?.(target);return target;
  }
  function validate(target){const issues=[];if(!target||typeof target!=="object")return ["Stav není objekt."];if(!Number.isInteger(Number(target.day))||Number(target.day)<1||Number(target.day)>14)issues.push("Neplatný den kampaně");if(!target.hero?.classId)issues.push("Chybí třída postavy");for(const key of ["stats","factions","quests","party","flags","audit"])if(!target[key]||typeof target[key]!=="object")issues.push(`Chybí ${key}`);return issues;}
  function phaseAllowsSave(target){return target?.phase==="map"&&!target?.ended;}
  function releaseSnapshot(target){return {day:target.day,phase:target.phase,activeQuests:globalThis.KorytoQuestRuntime?.active?.(target).length||0,pendingEvents:array(target.pendingEvents).length,party:Object.keys(object(target.party,{})).length,ended:!!target.ended};}
  globalThis.KorytoGameEngine={VERSION,normalize,validate,phaseAllowsSave,releaseSnapshot};
})();
