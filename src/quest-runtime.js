"use strict";
(() => {
  const VERSION = "0.14.3 TEST.5";
  const STATUS = new Set(["locked","active","done","failed"]);
  const defs = () => globalThis.KorytoQuestData?.definitions || (typeof questDefs !== "undefined" ? questDefs : {});
  const asInt = (value, fallback = 0) => Number.isInteger(Number(value)) ? Number(value) : fallback;
  function initialState() {
    const active = new Set(["register","diesel","roof"]);
    return Object.fromEntries(Object.keys(defs()).map(id => [id,{status:active.has(id)?"active":"locked",stage:0}]));
  }
  function normalize(target = state) {
    target.quests = target.quests && typeof target.quests === "object" && !Array.isArray(target.quests) ? target.quests : {};
    const baseline = initialState();
    for (const [id, base] of Object.entries(baseline)) {
      const current = target.quests[id] && typeof target.quests[id] === "object" ? target.quests[id] : {};
      const status = STATUS.has(current.status) ? current.status : base.status;
      target.quests[id] = {...current,status,stage:Math.max(0,asInt(current.stage,base.stage))};
      if (current.deadlineBonus !== undefined) target.quests[id].deadlineBonus = Math.max(0,asInt(current.deadlineBonus,0));
    }
    for (const id of Object.keys(target.quests)) if (!defs()[id]) delete target.quests[id];
    return target.quests;
  }
  function deadline(id,target=state){ const def=defs()[id]; if(!def)return null; return Math.max(1,asInt(def.deadline,14)+Math.max(0,asInt(target?.quests?.[id]?.deadlineBonus,0))); }
  function active(target=state){ return Object.entries(target?.quests||{}).filter(([id,q])=>defs()[id]&&q?.status==="active").map(([id,q])=>({id,state:q,definition:defs()[id],deadline:deadline(id,target),daysLeft:deadline(id,target)-asInt(target.day,1)})).sort((a,b)=>a.deadline-b.deadline||a.id.localeCompare(b.id,"cs")); }
  function due(target=state,within=1){ return active(target).filter(item=>item.daysLeft<=within); }
  function transition(id,status,target=state){ if(!defs()[id]||!STATUS.has(status))return false; normalize(target); target.quests[id].status=status; return true; }
  function unlock(id,target=state){ if(target?.quests?.[id]?.status==="locked")return transition(id,"active",target); return false; }
  function complete(id,target=state){ return transition(id,"done",target); }
  function fail(id,target=state){ return transition(id,"failed",target); }
  function validate(target=state){ const issues=[]; if(!target?.quests||typeof target.quests!=="object")return ["Chybí questový stav."]; for(const [id,def] of Object.entries(defs())){const q=target.quests[id];if(!q)issues.push(`${id}: chybí`);else{if(!STATUS.has(q.status))issues.push(`${id}: neplatný stav`);if(!Number.isInteger(q.stage)||q.stage<0)issues.push(`${id}: neplatná fáze`);if(q.deadlineBonus!==undefined&&(!Number.isInteger(q.deadlineBonus)||q.deadlineBonus<0))issues.push(`${id}: neplatný bonus`);if(!def.location)issues.push(`${id}: chybí lokace`);}} return issues; }
  globalThis.KorytoQuestRuntime={VERSION,initialState,normalize,deadline,active,due,transition,unlock,complete,fail,validate};
})();
