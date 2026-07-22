"use strict";
(() => {
  const VERSION = "0.14.3 TEST.10";
  const BUILD_VERSION = "0.14.3-test.10";
  const SAVE_VERSION = "0.14.3-test.2";
  const RELEASE_FLAG = "v0143Test10Complete";
  let lastReport = null;
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  function mark(target = state) {
    if (!target || typeof target !== "object") return target;
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    target.flags[RELEASE_FLAG] = VERSION;
    return target;
  }
  function balanceAudit(target = state) {
    const stats = target?.stats || {};
    const issues = [];
    for (const key of ["support","trust","heat","influence","integrity"]) {
      const value = finite(stats[key],0);
      if (value < 0 || value > (key === "heat" ? 150 : 100)) issues.push(`${key}: mimo rozsah`);
    }
    const questSummary = globalThis.KorytoQuestRuntime?.active?.(target) || [];
    const impossible = questSummary.filter(item => item.deadline < 1 || item.deadline > 14);
    if (impossible.length) issues.push("Questový termín mimo kampaň");
    const roster = globalThis.KorytoCompanionSystem?.morale?.(target) || {count:0,average:0,critical:[]};
    return {
      ok:issues.length === 0,
      issues,
      stats:{support:finite(stats.support),trust:finite(stats.trust),heat:finite(stats.heat),integrity:finite(stats.integrity),funds:finite(stats.funds)},
      activeQuests:questSummary.length,
      urgentQuests:questSummary.filter(item => item.daysLeft <= 1).length,
      party:roster,
      rivalMomentum:finite(target?.opponent?.momentum)
    };
  }
  function canonicalLabels() {
    if (typeof document === "undefined") return;
    document.title = `Koryto ${VERSION} – kompletní modulární test`;
    const brand = document.querySelector?.(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const meta = document.querySelector?.('meta[name="description"]');
    if (meta) meta.content = `Koryto ${VERSION}: modulární questy, události, frakce, společníci, mobilní UX a stabilizační audit.`;
    const footer = document.querySelector?.(".footer-note");
    if (footer) {
      const clean = String(footer.textContent || "").replace(/(?: · 0\.14\.3 TEST\.\d+)+$/u, "");
      footer.textContent = `${clean} · ${VERSION}`;
    }
    for (const node of [document.body,...(document.body?.querySelectorAll?.("*") || [])]) {
      if (node?.children?.length || typeof node?.textContent !== "string") continue;
      node.textContent = node.textContent.replace(/0\.14\.3 TEST\.\d+/g,VERSION);
    }
  }
  function exportChronicle() {
    mark();
    const report = runReleaseCheck();
    const heroClass = typeof classes === "object" ? classes?.[state.hero?.classId]?.name : state.hero?.classId;
    const text = `KORYTO ${VERSION} – KRONIKA\nKód kampaně: ${state.seed || "bez kódu"}\n${state.hero?.name || "Kandidát"}, ${heroClass || "politická třída"}\n\nRelease audit: ${JSON.stringify(report,null,2)}\n\n${(state.log || []).join("\n\n")}`;
    if (typeof Blob !== "function" || typeof URL?.createObjectURL !== "function") return text;
    const blob = new Blob([text],{type:"text/plain;charset=utf-8"});
    const anchor = document.createElement?.("a"); if(!anchor)return text;
    anchor.href=URL.createObjectURL(blob);anchor.download="koryto_0.14.3_test.10_kronika.txt";anchor.click?.();URL.revokeObjectURL?.(anchor.href);return text;
  }
  function installQuestNormalizationBridge() {
    const base = globalThis.KorytoTest143;
    if (!base || base.__test10QuestBridge) return;
    const original = base.normalizeReleaseState;
    if (typeof original !== "function") return;
    base.normalizeReleaseState = function test10NormalizeReleaseState(target = state) {
      const normalized = original.call(base,target);
      globalThis.KorytoQuestRuntime?.normalize?.(normalized);
      return normalized;
    };
    base.__test10QuestBridge = true;
  }
  function installControls() {
    installQuestNormalizationBridge();
    globalThis.KorytoTest1433?.installControls?.();
    const button=document.getElementById?.("exportBtn");if(button){button.onclick=exportChronicle;button.dataset.v0143Export="10";}
  }
  function runReleaseCheck(target = state) {
    globalThis.KorytoTest143?.normalizeReleaseState?.(target);
    globalThis.KorytoQuestRuntime?.normalize?.(target);
    mark(target);
    const checks = {
      base:globalThis.KorytoTest143?.runReleaseCheck?.(target) || {ok:false,issues:["Chybí TEST.2 základ."]},
      questData:{ok:(globalThis.KorytoQuestData?.validate?.() || ["Chybí quest data."]).length===0,issues:globalThis.KorytoQuestData?.validate?.() || ["Chybí quest data."]},
      quests:{ok:(globalThis.KorytoQuestRuntime?.validate?.(target) || ["Chybí quest runtime."]).length===0,issues:globalThis.KorytoQuestRuntime?.validate?.(target) || ["Chybí quest runtime."]},
      events:{ok:(globalThis.KorytoEventSystem?.validate?.() || ["Chybí event systém."]).length===0,issues:globalThis.KorytoEventSystem?.validate?.() || ["Chybí event systém."]},
      factions:{ok:(globalThis.KorytoFactionSystem?.validate?.() || ["Chybí frakce."]).length===0,issues:globalThis.KorytoFactionSystem?.validate?.() || ["Chybí frakce."]},
      companions:{ok:(globalThis.KorytoCompanionSystem?.validate?.() || ["Chybí společníci."]).length===0,issues:globalThis.KorytoCompanionSystem?.validate?.() || ["Chybí společníci."]},
      ux:globalThis.KorytoUXSystem?.audit?.() || {ok:false,issues:["Chybí UX systém."]},
      balance:balanceAudit(target)
    };
    const issues=[...new Set(Object.values(checks).flatMap(check=>check.issues||[]))];
    lastReport={version:VERSION,buildVersion:BUILD_VERSION,saveVersion:SAVE_VERSION,runtimeMode:"event-driven-contracts",ok:Object.values(checks).every(check=>check.ok)&&issues.length===0,issues,checks,eventSummary:globalThis.KorytoEventSystem?.summary?.(),factionThreat:globalThis.KorytoFactionSystem?.leadingThreat?.(target),timestamp:new Date().toISOString()};
    return lastReport;
  }
  function refresh(){mark();installQuestNormalizationBridge();installControls();canonicalLabels();globalThis.KorytoUXSystem?.installStyles?.();return runReleaseCheck();}
  const api={VERSION,BUILD_VERSION,SAVE_VERSION,RELEASE_FLAG,mark,balanceAudit,canonicalLabels,exportChronicle,installQuestNormalizationBridge,installControls,runReleaseCheck,refresh,get report(){return lastReport;}};
  globalThis.KorytoTest14310=api;globalThis.KorytoReleaseCandidate=api;
  refresh();
})();
