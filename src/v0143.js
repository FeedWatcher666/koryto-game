"use strict";
(() => {
  const VERSION = "0.14.3 TEST.1";
  const SAVE_VERSION = "0.14.3-test.1";
  const RELEASE_FLAG = "v0143ReleaseCandidate";
  let lastReport = null;

  function normalizeReleaseState(target = state) {
    if (!target || typeof target !== "object") return target;
    let normalized = target;
    if (globalThis.KorytoState) normalized = globalThis.KorytoState.normalizeCollections(target);
    if (target === state && normalized !== state) state = normalized;
    if (globalThis.KorytoStability?.normalizeStateExtensions) globalThis.KorytoStability.normalizeStateExtensions(normalized);
    if (globalThis.KorytoCounterCampaign?.normalizeCampaignState) globalThis.KorytoCounterCampaign.normalizeCampaignState(normalized);
    if (globalThis.KorytoTest9?.normalizeUiState) globalThis.KorytoTest9.normalizeUiState(normalized);
    if (globalThis.KorytoTest10?.normalizeClarityState) globalThis.KorytoTest10.normalizeClarityState(normalized);
    normalized.flags = normalized.flags && typeof normalized.flags === "object" ? normalized.flags : {};
    normalized.flags[RELEASE_FLAG] = VERSION;
    normalized.version = SAVE_VERSION;
    return normalized;
  }

  function validateReleaseState(target = state) {
    const issues = globalThis.KorytoState?.validate ? [...globalThis.KorytoState.validate(target)] : [];
    if (target?.version !== SAVE_VERSION) issues.push("nesprávná verze uložené hry");
    if (target?.flags?.[RELEASE_FLAG] !== VERSION) issues.push("chybí release příznak");
    if (globalThis.KorytoStability?.validateState) issues.push(...globalThis.KorytoStability.validateState(target));
    return [...new Set(issues)];
  }

  function rewriteLegacyLabels(root = document?.body) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const nodes = [root, ...root.querySelectorAll("*")];
    for (const node of nodes) {
      if (node.children?.length || typeof node.textContent !== "string") continue;
      const next = node.textContent
        .replace(/0\.14\.2 (?:TEST\.\d+|RC\d+)/g, VERSION)
        .replace(/0\.14\.2-(?:test\.\d+|rc\d+)/gi, SAVE_VERSION)
        .replace(/0\.14\.3 TEST\.\d+/g, VERSION)
        .replace(/0\.14\.3-test\.\d+/gi, SAVE_VERSION);
      if (next !== node.textContent) node.textContent = next;
    }
  }

  function canonicalVersion() {
    if (typeof document === "undefined") return;
    const title = `Koryto ${VERSION} – modulární testovací verze`;
    if (document.title !== title) document.title = title;
    const brand = document.querySelector?.(".brand h1 span");
    const brandText = `Dolní Vejprnice ${VERSION}`;
    if (brand && brand.textContent !== brandText) brand.textContent = brandText;
    const description = document.querySelector?.('meta[name="description"]');
    const descriptionText = `Koryto ${VERSION}: modulární stav a ukládání při zachování kompletní kampaně a offline hraní.`;
    if (description && description.content !== descriptionText) description.content = descriptionText;
    const footer = document.querySelector?.(".footer-note");
    if (footer) {
      const clean = String(footer.textContent || "")
        .replace(/(?: · 0\.14\.[23] (?:TEST\.\d+|RC\d+))+$/u, "")
        .replace(/(?: · 0\.14\.[23]-(?:test\.\d+|rc\d+))+$/iu, "");
      const next = `${clean} · ${VERSION}`;
      if (footer.textContent !== next) footer.textContent = next;
    }
    rewriteLegacyLabels(document.body);
  }

  function exportChronicle() {
    normalizeReleaseState();
    const heroClass = typeof classes === "object" ? classes?.[state.hero?.classId]?.name : state.hero?.classId;
    const text = `KORYTO ${VERSION} – KRONIKA\nKód kampaně: ${state.seed || "bez kódu"}\n${state.hero?.name || "Kandidát"}, ${heroClass || "politická třída"}\n\n${(state.log || []).join("\n\n")}\n\nStav: ${JSON.stringify(state.stats || {}, null, 2)}\n\nAudit: ${JSON.stringify(state.audit || {}, null, 2)}`;
    if (typeof Blob !== "function" || typeof URL?.createObjectURL !== "function") return text;
    const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
    const anchor = document.createElement?.("a");
    if (!anchor) return text;
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "koryto_0.14.3_test.1_kronika.txt";
    anchor.click?.();
    URL.revokeObjectURL?.(anchor.href);
    return text;
  }

  function installControls() {
    globalThis.KorytoSaveSystem?.installControls?.();
    const exportButton = document.getElementById?.("exportBtn");
    if (exportButton) {
      exportButton.onclick = exportChronicle;
      exportButton.dataset.v0143Export = "1";
    }
  }

  function runReleaseCheck(target = state) {
    normalizeReleaseState(target);
    const issues = validateReleaseState(target);
    lastReport = {
      version:VERSION,
      saveVersion:SAVE_VERSION,
      ok:issues.length === 0,
      issues,
      day:target?.day,
      phase:target?.phase,
      timestamp:new Date().toISOString()
    };
    return lastReport;
  }

  function refresh() {
    if (typeof state !== "undefined" && state && state.version !== SAVE_VERSION) normalizeReleaseState();
    installControls();
    canonicalVersion();
  }

  const api = {
    VERSION, SAVE_VERSION, RELEASE_FLAG,
    normalizeReleaseState, validateReleaseState, runReleaseCheck,
    canonicalVersion, rewriteLegacyLabels, installControls, exportChronicle,
    get report() { return lastReport; }
  };
  globalThis.KorytoTest143 = api;
  globalThis.KorytoReleaseCandidate = api;

  normalizeReleaseState();
  installControls();
  canonicalVersion();
  runReleaseCheck();
  if (typeof setInterval === "function") setInterval(refresh, 1200);
  if (typeof MutationObserver === "function") {
    const observer = new MutationObserver(() => canonicalVersion());
    if (document.head) observer.observe(document.head, {subtree:true, childList:true, characterData:true, attributes:true});
    if (document.body) observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  }
})();
