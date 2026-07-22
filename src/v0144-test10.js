"use strict";
(() => {
  const VERSION="0.14.4 TEST.10";
  const BUILD_VERSION="0.14.4-test.10";
  const SAVE_VERSION="0.14.3-test.2";
  const SAVE_SCHEMA=1;
  const RELEASE_FLAG="v0144Test10Complete";
  let lastReport=null;
  const hashSeed=text=>{let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  function mark(target=globalThis.KorytoApp?.getState?.()){if(!target||typeof target!=="object")return target;target.flags=target.flags&&typeof target.flags==="object"?target.flags:{};target.flags[RELEASE_FLAG]=VERSION;return target;}
  function normalizeReleaseState(target=globalThis.KorytoApp?.getState?.()){
    if(!target)return target;
    globalThis.KorytoGameEngine?.normalize?.(target,{hashSeed,relationshipDefs:globalThis.KorytoCompanionData?.relationshipDefs,conflictDefs:globalThis.KorytoCompanionData?.conflictDefs,companionAmbitionDefs:globalThis.KorytoCompanionData?.companionAmbitionDefs});
    globalThis.KorytoQuestRuntime?.normalize?.(target);mark(target);return target;
  }
  function installSaveBridge(){const base=globalThis.KorytoTest143;if(!base||base.__v0144Bridge)return false;const original=base.normalizeReleaseState;if(typeof original!=="function")return false;base.normalizeReleaseState=function v0144Normalize(target=globalThis.KorytoApp?.getState?.()){const normalized=original.call(base,target);return normalizeReleaseState(normalized);};base.__v0144Bridge=true;return true;}
  function canonicalLabels(){if(typeof document==="undefined")return;document.title=`Koryto ${VERSION} – modulární politické RPG`;const brand=document.querySelector?.(".brand h1 span");if(brand)brand.textContent=`Dolní Vejprnice ${VERSION}`;const meta=document.querySelector?.('meta[name="description"]');if(meta)meta.content=`Koryto ${VERSION}: skutečně oddělené questy, události, frakce, společníci, debaty, volby a mobilní UX.`;const footer=document.querySelector?.(".footer-note");if(footer){const clean=String(footer.textContent||"").replace(/(?: · 0\.14\.[34] TEST\.\d+)+$/u,"");footer.textContent=`${clean} · ${VERSION}`;}}
  function checks(target){const legacyReport=globalThis.KorytoTest14310?.runReleaseCheck?.(target)||null;const rows={
    legacy:{ok:true,issues:[],report:legacyReport},
    core:{ok:!!globalThis.KorytoCoreData,issues:globalThis.KorytoCoreData?[]:["Chybí core data."]},
    questData:{ok:(globalThis.KorytoQuestData?.validate?.()||["Chybí quest data."]).length===0,issues:globalThis.KorytoQuestData?.validate?.()||["Chybí quest data."]},
    quests:{ok:(globalThis.KorytoQuestRuntime?.validate?.(target)||["Chybí quest runtime."]).length===0,issues:globalThis.KorytoQuestRuntime?.validate?.(target)||["Chybí quest runtime."]},
    events:{ok:(globalThis.KorytoEventSystem?.validate?.()||["Chybí event systém."]).length===0,issues:globalThis.KorytoEventSystem?.validate?.()||["Chybí event systém."]},
    factions:{ok:(globalThis.KorytoFactionSystem?.validate?.()||["Chybí frakční systém."]).length===0,issues:globalThis.KorytoFactionSystem?.validate?.()||["Chybí frakční systém."]},
    companions:{ok:(globalThis.KorytoCompanionSystem?.validate?.()||["Chybí companion systém."]).length===0,issues:globalThis.KorytoCompanionSystem?.validate?.()||["Chybí companion systém."]},
    debate:{ok:(globalThis.KorytoDebateSystem?.validate?.()||["Chybí debatní systém."]).length===0,issues:globalThis.KorytoDebateSystem?.validate?.()||["Chybí debatní systém."]},
    election:{ok:(globalThis.KorytoElectionSystem?.validate?.()||["Chybí volební systém."]).length===0,issues:globalThis.KorytoElectionSystem?.validate?.()||["Chybí volební systém."]},
    engine:{ok:(globalThis.KorytoGameEngine?.validate?.(target)||["Chybí herní engine."]).length===0,issues:globalThis.KorytoGameEngine?.validate?.(target)||["Chybí herní engine."]},
    ux:globalThis.KorytoUXSystem?.audit?.()||{ok:false,issues:["Chybí UX systém."]},
    balance:globalThis.KorytoBalanceSystem?.auditState?.(target)||{ok:false,issues:["Chybí balance systém."]}
  };return rows;}
  function runReleaseCheck(target=globalThis.KorytoApp?.getState?.()){normalizeReleaseState(target);const all=checks(target),issues=[...new Set(Object.values(all).flatMap(x=>x.issues||[]))];lastReport={version:VERSION,buildVersion:BUILD_VERSION,saveVersion:SAVE_VERSION,saveSchema:SAVE_SCHEMA,runtimeMode:"modular-orchestrator",ok:Object.values(all).every(x=>x.ok)&&issues.length===0,issues,checks:all,app:globalThis.KorytoGameEngine?.releaseSnapshot?.(target),events:globalThis.KorytoEventSystem?.summary?.(),factionThreat:globalThis.KorytoFactionSystem?.leadingThreat?.(target),party:globalThis.KorytoCompanionSystem?.morale?.(target),guardrails:globalThis.KorytoBalanceSystem?.guardrails?.(),timestamp:new Date().toISOString()};return lastReport;}
  function runSimulationAudit(count=1000){const strategies=["ideal","corrupt","legal","populist","mixed"],results=[];for(let i=0;i<count;i++)results.push(globalThis.KorytoApp.simulateStrategy(strategies[i%strategies.length],44000+i));return globalThis.KorytoBalanceSystem.summarize(results);}
  function exportChronicle(){const target=globalThis.KorytoApp?.getState?.(),report=runReleaseCheck(target),heroClass=globalThis.KorytoCoreData?.classes?.[target?.hero?.classId]?.name||target?.hero?.classId;const text=`KORYTO ${VERSION} – KRONIKA\nKód kampaně: ${target?.seed||"bez kódu"}\n${target?.hero?.name||"Kandidát"}, ${heroClass||"politická třída"}\n\nRelease audit: ${JSON.stringify(report,null,2)}\n\n${(target?.log||[]).join("\n\n")}`;if(typeof Blob!=="function"||typeof URL?.createObjectURL!=="function")return text;const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),anchor=document.createElement?.("a");if(!anchor)return text;anchor.href=URL.createObjectURL(blob);anchor.download="koryto_0.14.4_test.10_kronika.txt";anchor.click?.();URL.revokeObjectURL?.(anchor.href);return text;}
  function installControls(){const button=document.getElementById?.("exportBtn");if(button){button.onclick=exportChronicle;button.dataset.v0144Export="10";}globalThis.KorytoUXSystem?.decorateDialogs?.();}
  function refresh(){installSaveBridge();canonicalLabels();installControls();return runReleaseCheck();}
  const api={VERSION,BUILD_VERSION,SAVE_VERSION,SAVE_SCHEMA,RELEASE_FLAG,mark,normalizeReleaseState,installSaveBridge,canonicalLabels,runReleaseCheck,runSimulationAudit,exportChronicle,installControls,refresh,get report(){return lastReport;}};
  globalThis.KorytoTest14410=api;globalThis.KorytoReleaseCandidate=api;refresh();
})();
