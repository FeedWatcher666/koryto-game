"use strict";
(() => {
  const VERSION="0.14.4 TEST.9";
  const finite=v=>Number.isFinite(Number(v));
  function auditState(target){const issues=[];for(const key of ["support","trust","heat","influence","integrity","funds","leverage"]){if(!finite(target?.stats?.[key]))issues.push(`${key}: NaN`);}if(Number(target?.actions)<0)issues.push("záporné akce");issues.push(...(globalThis.KorytoQuestRuntime?.validate?.(target)||[]));return {ok:issues.length===0,issues};}
  function summarize(results=[]){const valid=results.filter(Boolean),issues=[];if(valid.some(r=>!r.ended))issues.push("Některá simulace neskončila");for(const r of valid)for(const v of Object.values(r))if(typeof v==="number"&&!Number.isFinite(v))issues.push("Simulace obsahuje NaN");const votes=valid.map(r=>Number(r.vote)).filter(Number.isFinite),seats=valid.map(r=>Number(r.playerSeats)).filter(Number.isFinite);const average=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10:0;return {ok:issues.length===0,issues,runs:valid.length,averageVote:average(votes),averageSeats:average(seats),completed:valid.filter(r=>r.ended).length};}
  function guardrails(){return {campaignDays:[1,14],stats:{support:[0,100],trust:[0,100],heat:[0,150],integrity:[0,100]},councilSeats:[1,14],majority:8};}
  globalThis.KorytoBalanceSystem={VERSION,auditState,summarize,guardrails};
})();
