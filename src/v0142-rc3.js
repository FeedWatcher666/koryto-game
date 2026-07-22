"use strict";
(() => {
  const VERSION = "0.14.2 RC3";
  const SAVE_VERSION = "0.14.2-rc3";
  const RELEASE_FLAG = "v0142ReleaseCandidate";
  const VALID_PHASES = new Set(["map", "location", "event", "debate", "finale", "coalition"]);
  const STRATEGY_IDS = ["briefingBtn", "mediaBtn", "pollBtn", "promiseBtn", "endorsementBtn"];
  let lastReport = null;
  let autoSaveGuardInstalled = false;

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function initializedStateDefaults() {
    const previous = state;
    state = deep(baseState);
    initQuests();
    initVoters();
    initSurprises();
    initLivingWorld();
    const defaults = deep(state);
    state = previous;
    return defaults;
  }

  function mergeStateDefaults(saved, defaults = null) {
    const merge = (target, source) => {
      if (!source || typeof source !== "object" || Array.isArray(source)) return source === undefined ? target : deep(source);
      for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === "object" && !Array.isArray(value) && target[key] && typeof target[key] === "object" && !Array.isArray(target[key])) {
          target[key] = merge(target[key], value);
        } else {
          target[key] = deep(value);
        }
      }
      return target;
    };
    return merge(defaults ? deep(defaults) : initializedStateDefaults(), saved && typeof saved === "object" ? saved : {});
  }

  function readStoredSave() {
    let raw = typeof memorySave !== "undefined" ? memorySave : null;
    try {
      raw = localStorage.getItem("koryto_v014") || localStorage.getItem("koryto_v014_auto") ||
        localStorage.getItem("koryto_v013") || localStorage.getItem("koryto_v013_auto") ||
        localStorage.getItem("koryto_v012") || localStorage.getItem("koryto_v012_auto") ||
        localStorage.getItem("koryto_v011") || localStorage.getItem("koryto_v011_auto") ||
        localStorage.getItem("koryto_v010") || localStorage.getItem("koryto_v091") ||
        localStorage.getItem("koryto_v09") || raw;
    } catch (_) {}
    return raw;
  }

  function safeLoad() {
    const raw = readStoredSave();
    if (!raw) return alert("Žádná uložená hra nebyla nalezena.");
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (_) { return alert("Uložená hra je poškozená a nelze ji načíst."); }
    state = mergeStateDefaults(parsed);
    normalizeState();
    normalizeReleaseState();
    state.partyAssignment = null;
    state.partyUsedDay = 0;
    ["startScreen","creationScreen","endingScreen","coalitionScreen","debateScreen"].forEach(id => document.getElementById(id)?.classList.remove("active"));
    document.getElementById("gameScreen")?.classList.add("active");
    document.querySelectorAll("#saveBtn,#loadBtn,#restartBtn,#exportBtn,#mapBtn").forEach(button => button.classList.remove("hidden"));
    closeStaleOverlays();
    rewriteLegacyLabels(document.body);
    if (!state.ended && typeof showMap === "function") showMap();
    else if (typeof renderAll === "function") renderAll();
    return state;
  }

  function validEvent(id) {
    if (!id) return false;
    if (typeof eventById === "function") {
      try { return Boolean(eventById(id)); } catch (_) { return false; }
    }
    return Boolean((typeof events === "object" && events?.[id]) || (typeof questDefs === "object" && questDefs?.[id]));
  }

  function normalizeReleaseState(target = state) {
    if (!target || typeof target !== "object") return target;
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    target.ui = target.ui && typeof target.ui === "object" ? target.ui : {};
    target.version = SAVE_VERSION;
    target.flags[RELEASE_FLAG] = VERSION;
    target.day = Math.max(1, Math.min(14, Math.floor(finite(target.day, 1))));
    target.actions = Math.max(0, Math.min(99, Math.floor(finite(target.actions, 0))));

    if (!VALID_PHASES.has(target.phase)) target.phase = "map";
    if (target.phase === "location" && !(typeof locations === "object" && locations?.[target.currentLocation])) target.phase = "map";
    if (target.phase === "event" && !validEvent(target.currentEvent)) target.phase = "map";
    if (target.phase === "map") {
      target.currentLocation = null;
      target.currentEvent = null;
    }

    if (globalThis.KorytoStability?.normalizeStateExtensions) globalThis.KorytoStability.normalizeStateExtensions(target);
    if (globalThis.KorytoCounterCampaign?.normalizeCampaignState) globalThis.KorytoCounterCampaign.normalizeCampaignState(target);
    if (globalThis.KorytoTest9?.normalizeUiState) globalThis.KorytoTest9.normalizeUiState(target);
    if (globalThis.KorytoTest10?.normalizeClarityState) globalThis.KorytoTest10.normalizeClarityState(target);
    target.version = SAVE_VERSION;
    target.flags[RELEASE_FLAG] = VERSION;
    return target;
  }

  function validateReleaseState(target = state) {
    const issues = [];
    if (!target || typeof target !== "object") return ["Chybí herní stav."];
    if (target.version !== SAVE_VERSION) issues.push("nesprávná verze uložené hry");
    if (!VALID_PHASES.has(target.phase)) issues.push("neplatná herní fáze");
    if (!Number.isInteger(target.day) || target.day < 1 || target.day > 14) issues.push("neplatný den");
    if (!Number.isInteger(target.actions) || target.actions < 0 || target.actions > 99) issues.push("neplatný počet akcí");
    if (target.phase === "location" && !(typeof locations === "object" && locations?.[target.currentLocation])) issues.push("neplatná lokace");
    if (target.phase === "event" && !validEvent(target.currentEvent)) issues.push("neplatná událost");
    if (target.phase === "map" && (target.currentLocation || target.currentEvent)) issues.push("mapa má osiřelý ukazatel");
    if (globalThis.KorytoStability?.validateState) issues.push(...globalThis.KorytoStability.validateState(target));
    return [...new Set(issues)];
  }

  function gameActive() {
    return typeof state !== "undefined" && document.getElementById?.("gameScreen")?.classList.contains("active") && !state.ended;
  }

  function urgentPromise(target = state) {
    const promise = target?.flags?.v0142Promise;
    return Boolean(promise && promise.status === "active" && finite(target.day, 1) >= finite(promise.due, 13) - 1);
  }

  function nativeStrategyEnabled(id, target = state) {
    if (!gameActive() || target.phase !== "map" || finite(target.actions, 0) < 1) return false;
    const flags = target.flags || {};
    if (id === "briefingBtn") return flags.v0142BriefingDay !== target.day;
    if (id === "mediaBtn") return finite(target.stats?.heat, 0) >= 15 && flags.v0142MediaDay !== target.day;
    if (id === "pollBtn") return [4, 8, 12].some(day => target.day >= day && !flags[`v0142PollDay${day}`]) && finite(target.stats?.funds, 0) >= 2;
    if (id === "promiseBtn") {
      const promise = flags.v0142Promise;
      const canOffer = !promise && target.day >= 3 && target.day <= 9;
      const canResolve = promise?.status === "active" && target.day >= finite(promise.due, 13) - 1;
      return Boolean(canOffer || canResolve);
    }
    if (id === "endorsementBtn") return [5, 9, 12].some(day => target.day >= day && !flags[`v0142Endorsement${day}`]);
    return false;
  }

  function repairStrategyButtons(target = state) {
    if (!target || typeof document === "undefined") return;
    const usedToday = finite(target.flags?.v0142StrategyUsedDay, -1) === finite(target.day, 0);
    for (const id of STRATEGY_IDS) {
      const button = document.getElementById?.(id);
      if (!button) continue;
      const urgent = id === "promiseBtn" && urgentPromise(target);
      button.disabled = usedToday && !urgent ? true : !nativeStrategyEnabled(id, target);
      if (usedToday && !urgent) button.title = `Dnešní strategický tah už proběhl: ${target.flags?.v0142StrategyUsedLabel || "strategická akce"}.`;
    }
  }

  function closeStaleOverlays() {
    if (typeof document === "undefined") return;
    for (const id of [
      "briefingOverlay", "mediaOverlay", "pollOverlay", "promiseOverlay", "endorsementOverlay",
      "strategyMenuOverlay", "systemMenuOverlay", "v0142DaySummaryOverlay", "diceOverlay"
    ]) document.getElementById?.(id)?.classList.add("hidden");
  }

  function rewriteLegacyLabels(root = document?.body) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const nodes = [root, ...root.querySelectorAll("*")];
    for (const node of nodes) {
      if (node.children?.length || typeof node.textContent !== "string") continue;
      const next = node.textContent
        .replace(/0\.14\.2 (?:TEST\.\d+|RC\d+)/g, VERSION)
        .replace(/0\.14\.2-(?:test\.\d+|rc\d+)/gi, SAVE_VERSION);
      if (next !== node.textContent) node.textContent = next;
    }
  }

  function canonicalVersion() {
    if (typeof document === "undefined") return;
    const title = `Koryto ${VERSION} – kandidát na vydání`;
    if (document.title !== title) document.title = title;
    const brand = document.querySelector?.(".brand h1 span");
    const brandText = `Dolní Vejprnice ${VERSION}`;
    if (brand && brand.textContent !== brandText) brand.textContent = brandText;
    const description = document.querySelector?.('meta[name="description"]');
    const descriptionText = `Koryto ${VERSION}: kandidát na vydání s opraveným ukládáním, migrací uložených her a stabilním rozhraním.`;
    if (description && description.content !== descriptionText) description.content = descriptionText;
    const footer = document.querySelector?.(".footer-note");
    if (footer) {
      const clean = String(footer.textContent || "").replace(/ · 0\.14\.2 (?:TEST\.\d+|RC\d+)$/u, "");
      const next = `${clean} · ${VERSION}`;
      if (footer.textContent !== next) footer.textContent = next;
    }
  }

  function wrapControl(id, before, after) {
    const button = document.getElementById?.(id);
    if (!button || button.dataset?.rc3Wrapped === "1" || typeof button.onclick !== "function") return;
    const original = button.onclick;
    button.onclick = function rc3Control(event) {
      before?.();
      const result = original.call(this, event);
      after?.();
      return result;
    };
    if (button.dataset) button.dataset.rc3Wrapped = "1";
  }

  function persistReleaseSave(key = "koryto_v014") {
    normalizeReleaseState();
    const raw = JSON.stringify(state);
    try { localStorage.setItem(key, raw); }
    catch (_) { if (typeof memorySave !== "undefined") memorySave = raw; }
    return raw;
  }

  function installAutoSaveGuard() {
    if (autoSaveGuardInstalled || typeof autoSave !== "function") return;
    const originalAutoSave = autoSave;
    autoSave = function rc3AutoSave() {
      const result = originalAutoSave();
      if (state?.phase === "map" && !state?.ended) persistReleaseSave("koryto_v014_auto");
      return result;
    };
    autoSaveGuardInstalled = true;
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
    anchor.download = "koryto_0.14.2_rc3_kronika.txt";
    anchor.click?.();
    URL.revokeObjectURL?.(anchor.href);
    return text;
  }

  function installControlGuards() {
    installAutoSaveGuard();
    wrapControl("confirmBtn", null, () => normalizeReleaseState());
    wrapControl("saveBtn", null, () => {
      if (state?.phase === "map" && !state?.ended) persistReleaseSave("koryto_v014");
    });
    try { load = safeLoad; } catch (_) {}
    globalThis.load = safeLoad;
    const loadButton = document.getElementById?.("loadBtn");
    if (loadButton && loadButton.dataset?.rc3SafeLoad !== "1") {
      loadButton.onclick = safeLoad;
      loadButton.dataset.rc3SafeLoad = "1";
    }
    const exportButton = document.getElementById?.("exportBtn");
    if (exportButton && exportButton.dataset?.rc3Export !== "1") {
      exportButton.onclick = exportChronicle;
      exportButton.dataset.rc3Export = "1";
    }
  }

  function runReleaseCheck(target = state) {
    normalizeReleaseState(target);
    const issues = validateReleaseState(target);
    lastReport = {
      version: VERSION,
      saveVersion: SAVE_VERSION,
      ok: issues.length === 0,
      issues,
      day: target?.day,
      phase: target?.phase,
      timestamp: new Date().toISOString()
    };
    return lastReport;
  }

  function tick() {
    if (typeof state === "undefined") return;
    const report = runReleaseCheck();
    installControlGuards();
    repairStrategyButtons();
    canonicalVersion();
    if (!report.ok && !state.flags.v0142Rc3Warning) {
      state.flags.v0142Rc3Warning = true;
      console.warn("Koryto RC3 release check", report);
    }
  }

  const api = {
    VERSION, SAVE_VERSION, VALID_PHASES:[...VALID_PHASES],
    normalizeReleaseState, validateReleaseState, runReleaseCheck,
    repairStrategyButtons, nativeStrategyEnabled, closeStaleOverlays,
    rewriteLegacyLabels, canonicalVersion, installControlGuards,
    initializedStateDefaults, mergeStateDefaults, readStoredSave, safeLoad,
    installAutoSaveGuard, persistReleaseSave, exportChronicle,
    get report() { return lastReport; }
  };
  globalThis.KorytoRC3 = api;
  globalThis.KorytoReleaseCandidate = api;

  canonicalVersion();
  rewriteLegacyLabels(document.body);
  tick();
  if (typeof setInterval === "function") setInterval(tick, 750);
})();
