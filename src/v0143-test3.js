"use strict";
(() => {
  const VERSION = "0.14.3 TEST.3";
  const BUILD_VERSION = "0.14.3-test.3";
  const SAVE_VERSION = "0.14.3-test.2";
  const RELEASE_FLAG = "v0143Test3QuestContract";
  const SUMMARY_STYLE_ID = "v0143DaySummaryLayout";
  let lastReport = null;
  let summaryLayoutInstalled = false;
  let questSaveGuardInstalled = false;

  function markBuild(target = state) {
    if (!target || typeof target !== "object") return target;
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    target.flags[RELEASE_FLAG] = VERSION;
    return target;
  }

  function installDaySummaryLayout() {
    if (summaryLayoutInstalled || typeof document === "undefined" || !document.head) return summaryLayoutInstalled;
    const style = document.createElement?.("style");
    if (!style) return false;
    style.id = SUMMARY_STYLE_ID;
    style.textContent = `
      #v0142DaySummaryOverlay{
        overflow:hidden;
        padding:clamp(8px,2vw,20px);
      }
      #v0142DaySummaryOverlay .v0142-summary-dialog{
        width:min(760px,100%);
        max-height:calc(100vh - 32px);
        max-height:calc(100dvh - 32px);
        overflow-y:auto;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
        scrollbar-gutter:stable;
        touch-action:pan-y;
        padding-bottom:0;
      }
      #v0142DaySummaryOverlay .v0142-summary-dialog [data-summary-close]{
        position:sticky;
        bottom:0;
        z-index:3;
        display:block;
        width:100%;
        margin:16px 0 0;
        padding:12px 14px calc(12px + env(safe-area-inset-bottom));
        box-shadow:0 -14px 22px rgba(233,223,199,.96);
      }
      @media(max-width:760px){
        #v0142DaySummaryOverlay{padding:8px}
        #v0142DaySummaryOverlay .v0142-summary-dialog{
          max-height:calc(100vh - 16px);
          max-height:calc(100dvh - 16px);
          border-radius:10px;
          padding:16px 14px 0;
        }
      }
    `;
    document.head.appendChild?.(style);
    summaryLayoutInstalled = true;
    return true;
  }

  function installQuestSaveGuard() {
    if (questSaveGuardInstalled) return true;
    const base = globalThis.KorytoTest143;
    const quests = globalThis.KorytoQuestSystem;
    if (!base || typeof base.normalizeReleaseState !== "function" || !quests) return false;
    const original = base.normalizeReleaseState;
    if (original.v0143QuestSaveGuard === "3") {
      questSaveGuardInstalled = true;
      return true;
    }
    const guardedNormalizeReleaseState = function guardedNormalizeReleaseState(target = state) {
      const normalized = original(target);
      quests.normalizeState?.(normalized);
      const issues = quests.validateState?.(normalized) || [];
      if (issues.length) throw new Error(`Neplatný questový stav: ${issues.join("; ")}`);
      return normalized;
    };
    guardedNormalizeReleaseState.v0143QuestSaveGuard = "3";
    base.normalizeReleaseState = guardedNormalizeReleaseState;
    questSaveGuardInstalled = true;
    return true;
  }

  function rewriteBuildLabels(root = document?.body) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const nodes = [root, ...root.querySelectorAll("*")];
    for (const node of nodes) {
      if (node.children?.length || typeof node.textContent !== "string") continue;
      const next = node.textContent.replace(/0\.14\.3 TEST\.\d+/g, VERSION);
      if (next !== node.textContent) node.textContent = next;
    }
  }

  function canonicalVersion() {
    if (typeof document === "undefined") return;
    const title = `Koryto ${VERSION} – questový modulární test`;
    if (document.title !== title) document.title = title;
    const brand = document.querySelector?.(".brand h1 span");
    const brandText = `Dolní Vejprnice ${VERSION}`;
    if (brand && brand.textContent !== brandText) brand.textContent = brandText;
    const description = document.querySelector?.('meta[name="description"]');
    const descriptionText = `Koryto ${VERSION}: ověřený questový doménový kontrakt, bezpečné savy a kompletní offline kampaň.`;
    if (description && description.content !== descriptionText) description.content = descriptionText;
    const footer = document.querySelector?.(".footer-note");
    if (footer) {
      const clean = String(footer.textContent || "").replace(/(?: · 0\.14\.3 TEST\.\d+)+$/u, "");
      const next = `${clean} · ${VERSION}`;
      if (footer.textContent !== next) footer.textContent = next;
    }
    rewriteBuildLabels(document.body);
  }

  function exportChronicle() {
    globalThis.KorytoTest143?.normalizeReleaseState?.();
    markBuild();
    const heroClass = typeof classes === "object" ? classes?.[state.hero?.classId]?.name : state.hero?.classId;
    const questSummary = globalThis.KorytoQuestSystem?.summary?.(state) || {};
    const text = `KORYTO ${VERSION} – KRONIKA\nKód kampaně: ${state.seed || "bez kódu"}\n${state.hero?.name || "Kandidát"}, ${heroClass || "politická třída"}\nQuesty: ${JSON.stringify(questSummary)}\n\n${(state.log || []).join("\n\n")}\n\nStav: ${JSON.stringify(state.stats || {}, null, 2)}\n\nAudit: ${JSON.stringify(state.audit || {}, null, 2)}`;
    if (typeof Blob !== "function" || typeof URL?.createObjectURL !== "function") return text;
    const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
    const anchor = document.createElement?.("a");
    if (!anchor) return text;
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "koryto_0.14.3_test.3_kronika.txt";
    anchor.click?.();
    URL.revokeObjectURL?.(anchor.href);
    return text;
  }

  function installControls() {
    globalThis.KorytoTest143?.installControls?.();
    const exportButton = document.getElementById?.("exportBtn");
    if (exportButton) {
      exportButton.onclick = exportChronicle;
      exportButton.dataset.v0143Export = "3";
    }
  }

  function runReleaseCheck(target = state) {
    installQuestSaveGuard();
    globalThis.KorytoTest143?.normalizeReleaseState?.(target);
    markBuild(target);
    const base = globalThis.KorytoTest143?.runReleaseCheck?.(target) || {ok:false, issues:["Chybí TEST.2 release vrstva."]};
    const quests = globalThis.KorytoQuestSystem?.runIntegrityCheck?.(target) || {ok:false, issues:["Chybí questový modul."]};
    const issues = [...new Set([...(base.issues || []), ...(quests.issues || [])])];
    if (!summaryLayoutInstalled) issues.push("Chybí scrollovatelný layout denního souhrnu.");
    if (!questSaveGuardInstalled) issues.push("Chybí questová ochrana migrace uložené hry.");
    lastReport = {
      version:VERSION,
      buildVersion:BUILD_VERSION,
      saveVersion:SAVE_VERSION,
      runtimeMode:"event-driven",
      questContract:"external-domain-api",
      questSaveGuard:questSaveGuardInstalled ? "normalize-and-validate" : "missing",
      daySummaryLayout:summaryLayoutInstalled ? "scrollable-sticky-action" : "missing",
      ok:Boolean(base.ok && quests.ok && issues.length === 0),
      issues,
      base,
      quests,
      day:target?.day,
      phase:target?.phase,
      timestamp:new Date().toISOString()
    };
    return lastReport;
  }

  function refresh() {
    globalThis.KorytoTest143?.refresh?.();
    markBuild();
    installDaySummaryLayout();
    installQuestSaveGuard();
    installControls();
    canonicalVersion();
    return runReleaseCheck();
  }

  const api = {
    VERSION, BUILD_VERSION, SAVE_VERSION, RELEASE_FLAG, SUMMARY_STYLE_ID,
    markBuild, installDaySummaryLayout, installQuestSaveGuard, canonicalVersion, rewriteBuildLabels,
    exportChronicle, installControls, runReleaseCheck, refresh,
    get summaryLayoutInstalled() { return summaryLayoutInstalled; },
    get questSaveGuardInstalled() { return questSaveGuardInstalled; },
    get report() { return lastReport; }
  };

  globalThis.KorytoTest1433 = api;
  globalThis.KorytoReleaseCandidate = api;

  markBuild();
  installDaySummaryLayout();
  installQuestSaveGuard();
  installControls();
  canonicalVersion();
  runReleaseCheck();
})();