"use strict";
(() => {
  const VERSION = "0.14.4 TEST.5";
  const data=()=>globalThis.KorytoCompanionData||{};
  const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
  const clone=value=>JSON.parse(JSON.stringify(value));
  function validate(){const issues=[];for(const [id,def] of Object.entries(data().companions||{})){if(!def.name||!def.role||!def.mission)issues.push(`${id}: neúplný společník`);if(!Number.isFinite(def.loyalty))issues.push(`${id}: neplatná loajalita`);if(!data().companionStoryDefs?.[id])issues.push(`${id}: chybí osobní příběh`);}for(const [id,rel] of Object.entries(data().relationshipDefs||{})){if(!data().companions?.[rel.a]||!data().companions?.[rel.b])issues.push(`${id}: neznámá dvojice`);}for(const [id,c] of Object.entries(data().conflictDefs||{})){if(!data().companions?.[c.a]||!data().companions?.[c.b])issues.push(`${id}: konflikt má neznámou postavu`);}return issues;}
  function roster(target){return Object.entries(target?.party||{}).map(([id,item])=>({id,name:item.name||data().companions?.[id]?.name||id,role:item.role||data().companions?.[id]?.role||"",loyalty:clamp(Number(item.loyalty)||0),fatigue:Number(target?.partyFatigue?.[id])||0,ambition:target?.companionAmbitions?.[id]||null})).sort((a,b)=>a.loyalty-b.loyalty);}
  function morale(target){const list=roster(target);if(!list.length)return {count:0,average:0,weakest:null,critical:[]};const average=Math.round(list.reduce((s,x)=>s+x.loyalty,0)/list.length);return {count:list.length,average,weakest:list[0],critical:list.filter(x=>x.loyalty<25)};}
  function snapshot(){return {companions:clone(data().companions||{}),stories:clone(data().companionStoryDefs||{}),relationships:clone(data().relationshipDefs||{}),conflicts:clone(data().conflictDefs||{}),ambitions:clone(data().companionAmbitionDefs||{})};}
  globalThis.KorytoCompanionSystem={VERSION,validate,roster,morale,snapshot,get definitions(){return data().companions||{};},get stories(){return data().companionStoryDefs||{};},get relationships(){return data().relationshipDefs||{};},get conflicts(){return data().conflictDefs||{};}};
})();
