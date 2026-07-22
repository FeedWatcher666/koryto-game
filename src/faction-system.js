"use strict";
(() => {
  const VERSION = "0.14.4 TEST.4";
  const data=()=>globalThis.KorytoFactionData||{};
  const clone=value=>JSON.parse(JSON.stringify(value));
  function validate(locations=globalThis.KorytoCoreData?.locations||{}){const issues=[];for(const [id,def] of Object.entries(data().factionPlanDefs||{})){if(!def.name||!def.owner||!def.location)issues.push(`${id}: neúplný plán`);if(!locations[def.location])issues.push(`${id}: neznámá lokace ${def.location}`);if(!Array.isArray(def.steps)||def.steps.length!==4)issues.push(`${id}: plán nemá čtyři kroky`);}for(const [id,def] of Object.entries(data().coalitionPartnerDefs||{})){if(!def.name||!def.resource||!Array.isArray(def.tags))issues.push(`${id}: neúplný koaliční partner`);}return issues;}
  function status(target){return Object.entries(data().factionPlanDefs||{}).map(([id,def])=>{const current=target?.factionPlans?.[id]||{};return {id,...def,progress:Number(current.progress)||0,stage:Number(current.stage)||0,revealed:!!current.revealed,completed:!!current.completed};}).sort((a,b)=>b.progress-a.progress);}
  function leadingThreat(target){return status(target)[0]||null;}
  function snapshot(){return {plans:clone(data().factionPlanDefs||{}),conspiracy:clone(data().conspiracyPieces||{}),coalitionPartners:clone(data().coalitionPartnerDefs||{}),actions:Object.keys(data().factionActionDefs||{}).length,operations:Object.keys(data().rivalOperationDefs||{}).length};}
  globalThis.KorytoFactionSystem={VERSION,validate,status,leadingThreat,snapshot,get plans(){return data().factionPlanDefs||{};},get conspiracy(){return data().conspiracyPieces||{};},get coalitionPartners(){return data().coalitionPartnerDefs||{};}};
})();
