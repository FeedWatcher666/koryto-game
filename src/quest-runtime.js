"use strict";
(() => {
  const VERSION = "0.14.4 TEST.2";
  const STATUS = new Set(["locked","active","done","failed"]);
  const definitions = () => globalThis.KorytoQuestData?.definitions || {};
  const asInt = (value, fallback = 0) => Number.isInteger(Number(value)) ? Number(value) : fallback;
  function initialState() {
    const active = new Set(["register","diesel","roof"]);
    return Object.fromEntries(Object.keys(definitions()).map(id => [id,{status:active.has(id)?"active":"locked",stage:0}]));
  }
  function normalize(target) {
    if (!target || typeof target !== "object") return {};
    target.quests = target.quests && typeof target.quests === "object" && !Array.isArray(target.quests) ? target.quests : {};
    const baseline = initialState();
    for (const [id, base] of Object.entries(baseline)) {
      const current = target.quests[id] && typeof target.quests[id] === "object" ? target.quests[id] : {};
      const status = STATUS.has(current.status) ? current.status : base.status;
      const next = {...current,status,stage:Math.max(0,asInt(current.stage,base.stage))};
      if (current.deadlineBonus !== undefined) next.deadlineBonus = Math.max(0,asInt(current.deadlineBonus,0));
      target.quests[id] = next;
    }
    for (const id of Object.keys(target.quests)) if (!definitions()[id]) delete target.quests[id];
    return target.quests;
  }
  function deadline(id,target){ const def=definitions()[id]; if(!def)return 99; return Math.max(1,asInt(def.deadline,14)+Math.max(0,asInt(target?.quests?.[id]?.deadlineBonus,0))); }
  function active(target){ return Object.entries(target?.quests||{}).filter(([id,q])=>definitions()[id]&&q?.status==="active").map(([id,q])=>({id,state:q,definition:definitions()[id],deadline:deadline(id,target),daysLeft:deadline(id,target)-asInt(target.day,1)})).sort((a,b)=>a.deadline-b.deadline||a.id.localeCompare(b.id,"cs")); }
  function due(target,within=1){ return active(target).filter(item=>item.daysLeft<=within); }
  function transition(id,status,target){ if(!target||!definitions()[id]||!STATUS.has(status))return false; normalize(target); target.quests[id].status=status; return true; }
  function unlock(id,target){ return target?.quests?.[id]?.status==="locked" ? transition(id,"active",target) : false; }
  function complete(id,target){ return transition(id,"done",target); }
  function fail(id,target){ return transition(id,"failed",target); }
  function validate(target){ const issues=[]; if(!target?.quests||typeof target.quests!=="object")return ["Chybí questový stav."]; for(const [id,def] of Object.entries(definitions())){const q=target.quests[id];if(!q)issues.push(`${id}: chybí`);else{if(!STATUS.has(q.status))issues.push(`${id}: neplatný stav`);if(!Number.isInteger(q.stage)||q.stage<0)issues.push(`${id}: neplatná fáze`);if(q.deadlineBonus!==undefined&&(!Number.isInteger(q.deadlineBonus)||q.deadlineBonus<0))issues.push(`${id}: neplatný bonus`);if(!def.location)issues.push(`${id}: chybí lokace`);}} return issues; }
  globalThis.KorytoQuestRuntime={VERSION,STATUS,initialState,normalize,deadline,active,due,transition,unlock,complete,fail,validate};
})();
