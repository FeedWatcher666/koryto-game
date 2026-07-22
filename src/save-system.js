"use strict";
(() => {
  const VERSION = "0.14.3 TEST.1";
  const SAVE_VERSION = "0.14.3-test.1";
  const MANUAL_KEY = "koryto_v014";
  const AUTO_KEY = "koryto_v014_auto";
  const LEGACY_KEYS = [
    MANUAL_KEY, AUTO_KEY,
    "koryto_v013", "koryto_v013_auto",
    "koryto_v012", "koryto_v012_auto",
    "koryto_v011", "koryto_v011_auto",
    "koryto_v010", "koryto_v091", "koryto_v09"
  ];

  const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

  function readRaw() {
    let raw = typeof memorySave !== "undefined" ? memorySave : null;
    try {
      for (const key of LEGACY_KEYS) {
        const stored = localStorage.getItem(key);
        if (stored) return {key, raw:stored};
      }
    } catch (_) {}
    return raw ? {key:"memory", raw} : null;
  }

  function parse(raw) {
    if (typeof raw !== "string" || !raw.trim()) return {ok:false, error:"empty"};
    try {
      const value = JSON.parse(raw);
      return isObject(value) ? {ok:true, value} : {ok:false, error:"shape"};
    } catch (error) {
      return {ok:false, error:String(error?.message || error)};
    }
  }

  function applyExtensionNormalizers(target) {
    if (globalThis.KorytoStability?.normalizeStateExtensions) globalThis.KorytoStability.normalizeStateExtensions(target);
    if (globalThis.KorytoCounterCampaign?.normalizeCampaignState) globalThis.KorytoCounterCampaign.normalizeCampaignState(target);
    if (globalThis.KorytoTest9?.normalizeUiState) globalThis.KorytoTest9.normalizeUiState(target);
    if (globalThis.KorytoTest10?.normalizeClarityState) globalThis.KorytoTest10.normalizeClarityState(target);
    return target;
  }

  function normalize(next = state) {
    if (!globalThis.KorytoState) throw new Error("KorytoState není načten.");
    state = globalThis.KorytoState.normalizeCollections(next);
    if (typeof normalizeState === "function") normalizeState();
    state = globalThis.KorytoState.normalizeCollections(state, {defaults:globalThis.KorytoState.base});
    applyExtensionNormalizers(state);
    state.flags = state.flags && typeof state.flags === "object" ? state.flags : {};
    state.flags.v0143SaveSystem = VERSION;
    state.version = SAVE_VERSION;
    if (globalThis.KorytoTest143?.normalizeReleaseState) state = globalThis.KorytoTest143.normalizeReleaseState(state);
    return state;
  }

  function serialize(target = state) {
    const prepared = target === state ? normalize(state) : globalThis.KorytoState.normalizeCollections(target);
    prepared.flags = prepared.flags && typeof prepared.flags === "object" ? prepared.flags : {};
    prepared.flags.v0143SaveSystem = VERSION;
    prepared.version = SAVE_VERSION;
    if (globalThis.KorytoTest143?.normalizeReleaseState) globalThis.KorytoTest143.normalizeReleaseState(prepared);
    return JSON.stringify(prepared);
  }

  function canWrite(target = state) {
    return Boolean(target && target.phase === "map" && !target.ended);
  }

  function store(key, raw) {
    try {
      localStorage.setItem(key, raw);
      return true;
    } catch (_) {
      if (typeof memorySave !== "undefined") memorySave = raw;
      return true;
    }
  }

  function write(key = MANUAL_KEY, target = state) {
    if (!canWrite(target)) return {ok:false, reason:"phase"};
    const raw = serialize(target);
    store(key, raw);
    return {ok:true, key, raw, state};
  }

  function manualSave() {
    if (!canWrite(state)) {
      if (typeof alert === "function") alert("Ukládat lze jen na mapě. Rozhodnutí uprostřed věty se v politice ukládají jinak.");
      return false;
    }
    const result = write(MANUAL_KEY, state);
    if (!result.ok) return false;
    if (typeof addNews === "function") addNews("Hra uložena. Na rozdíl od obecních smluv ji lze znovu najít.");
    if (typeof renderAll === "function") renderAll();
    return true;
  }

  function autoSaveGame() {
    if (!canWrite(state)) return false;
    normalize(state);
    state.audit = state.audit && typeof state.audit === "object" ? state.audit : {};
    state.audit.autosaves = Math.max(0, Number(state.audit.autosaves) || 0) + 1;
    return write(AUTO_KEY, state).ok;
  }

  function activateLoadedGame() {
    for (const id of ["startScreen","creationScreen","endingScreen","coalitionScreen","debateScreen"]) {
      document.getElementById?.(id)?.classList.remove("active");
    }
    document.getElementById?.("gameScreen")?.classList.add("active");
    document.querySelectorAll?.("#saveBtn,#loadBtn,#restartBtn,#exportBtn,#mapBtn").forEach(button => button.classList.remove("hidden"));
    globalThis.KorytoRC3?.closeStaleOverlays?.();
    globalThis.KorytoTest10?.closeSummary?.();
  }

  function loadGame() {
    const stored = readRaw();
    if (!stored) {
      if (typeof alert === "function") alert("Žádná uložená hra nebyla nalezena.");
      return false;
    }
    const parsed = parse(stored.raw);
    if (!parsed.ok) {
      if (typeof alert === "function") alert("Uložená hra je poškozená a nelze ji načíst.");
      return false;
    }

    normalize(parsed.value);
    if (!state.ended && state.phase !== "map") state.phase = "map";
    if (state.phase === "map") {
      state.currentLocation = null;
      state.currentEvent = null;
    }
    state.partyAssignment = null;
    state.partyUsedDay = 0;
    activateLoadedGame();
    if (!state.ended && typeof showMap === "function") showMap();
    else if (typeof renderAll === "function") renderAll();
    return state;
  }

  function roundTrip(target = state) {
    try {
      const raw = serialize(target);
      const parsed = parse(raw);
      if (!parsed.ok) return {ok:false, error:parsed.error};
      let restored = globalThis.KorytoState.normalizeCollections(parsed.value);
      applyExtensionNormalizers(restored);
      restored.flags = restored.flags && typeof restored.flags === "object" ? restored.flags : {};
      restored.flags.v0143SaveSystem = VERSION;
      restored.version = SAVE_VERSION;
      if (globalThis.KorytoTest143?.normalizeReleaseState) restored = globalThis.KorytoTest143.normalizeReleaseState(restored);
      const issues = globalThis.KorytoState.validate(restored);
      return {ok:issues.length === 0, raw, restored, issues};
    } catch (error) {
      return {ok:false, error:String(error?.message || error), issues:[String(error?.message || error)]};
    }
  }

  function normalizeNewGame() {
    normalize(state);
    return state;
  }

  function installControls() {
    const saveButton = document.getElementById?.("saveBtn");
    if (saveButton) {
      saveButton.onclick = manualSave;
      saveButton.dataset.v0143Save = "1";
    }
    const loadButton = document.getElementById?.("loadBtn");
    if (loadButton) {
      loadButton.onclick = loadGame;
      loadButton.dataset.v0143Load = "1";
    }
    const confirmButton = document.getElementById?.("confirmBtn");
    if (confirmButton && confirmButton.dataset.v0143NewGame !== "1" && typeof confirmButton.onclick === "function") {
      const original = confirmButton.onclick;
      confirmButton.onclick = function v0143NewGame(event) {
        const result = original.call(this, event);
        normalizeNewGame();
        return result;
      };
      confirmButton.dataset.v0143NewGame = "1";
    }
    try { save = manualSave; } catch (_) {}
    try { load = loadGame; } catch (_) {}
    try { autoSave = autoSaveGame; } catch (_) {}
    globalThis.save = manualSave;
    globalThis.load = loadGame;
    globalThis.autoSave = autoSaveGame;
  }

  const api = {
    VERSION, SAVE_VERSION, MANUAL_KEY, AUTO_KEY, LEGACY_KEYS:[...LEGACY_KEYS],
    readRaw, parse, normalize, serialize, canWrite, write, manualSave, autoSaveGame, loadGame,
    roundTrip, installControls, normalizeNewGame, activateLoadedGame
  };
  globalThis.KorytoSaveSystem = api;
  installControls();
})();
