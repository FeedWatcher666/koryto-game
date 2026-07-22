"use strict";
(() => {
  const VERSION = "0.14.3 TEST.2";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_FORMAT = "koryto";
  const SAVE_SCHEMA = 1;
  const MANUAL_KEY = "koryto_v014";
  const AUTO_KEY = "koryto_v014_auto";
  const LEGACY_KEYS = [
    MANUAL_KEY, AUTO_KEY,
    "koryto_v013", "koryto_v013_auto",
    "koryto_v012", "koryto_v012_auto",
    "koryto_v011", "koryto_v011_auto",
    "koryto_v010", "koryto_v091", "koryto_v09"
  ];
  const CORE_STAT_KEYS = ["support", "trust", "funds", "heat", "influence", "integrity", "leverage"];
  const KNOWN_PHASES = ["map", "location", "event", "debate", "finale", "coalition"];
  const KNOWN_VERSION = /^v?0\.(?:0?9|1[0-4])(?:[.\s-].*)?$/i;

  const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

  function readCandidates() {
    const candidates = [];
    const memory = typeof memorySave !== "undefined" ? memorySave : null;
    try {
      for (const key of LEGACY_KEYS) {
        const stored = localStorage.getItem(key);
        if (stored) candidates.push({key, raw:stored});
      }
    } catch (_) {}
    if (memory && !candidates.some(candidate => candidate.raw === memory)) candidates.push({key:"memory", raw:memory});
    return candidates;
  }

  function readRaw() {
    return readCandidates()[0] || null;
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

  function hasSaveSignature(value) {
    if (!isObject(value)) return false;
    if (value.saveFormat !== undefined && value.saveFormat !== SAVE_FORMAT) return false;
    if (value.saveSchema !== undefined) {
      const schema = Number(value.saveSchema);
      if (!Number.isInteger(schema) || schema < 1 || schema > SAVE_SCHEMA) return false;
    }

    const hero = value.hero;
    const stats = value.stats;
    const heroSignal = isObject(hero) && (
      String(hero.name || "").trim().length > 0 ||
      String(hero.classId || "").trim().length > 0
    );
    const statSignal = isObject(stats) && CORE_STAT_KEYS.some(key => {
      const stat = stats[key];
      return stat !== null && stat !== "" && Number.isFinite(Number(stat));
    });
    const versionSignal = typeof value.version === "string" && KNOWN_VERSION.test(value.version.trim());
    const daySignal = value.day !== null && value.day !== "" && Number.isFinite(Number(value.day));
    const phaseSignal = typeof value.phase === "string" && KNOWN_PHASES.includes(value.phase);
    return heroSignal && statSignal && (versionSignal || daySignal || phaseSignal);
  }

  function applySaveMetadata(target) {
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    target.flags.v0143SaveSystem = VERSION;
    target.version = SAVE_VERSION;
    target.saveFormat = SAVE_FORMAT;
    target.saveSchema = SAVE_SCHEMA;
    return target;
  }

  function applyExtensionNormalizers(target) {
    if (globalThis.KorytoStability?.normalizeStateExtensions) globalThis.KorytoStability.normalizeStateExtensions(target);
    if (globalThis.KorytoCounterCampaign?.normalizeCampaignState) globalThis.KorytoCounterCampaign.normalizeCampaignState(target);
    if (globalThis.KorytoTest9?.normalizeUiState) globalThis.KorytoTest9.normalizeUiState(target);
    if (globalThis.KorytoTest10?.normalizeClarityState) globalThis.KorytoTest10.normalizeClarityState(target);
    return target;
  }

  function migrateCandidate(value) {
    if (!hasSaveSignature(value)) return {ok:false, error:"signature", issues:["chybí rozpoznatelná struktura uložené hry"]};
    if (!globalThis.KorytoState) return {ok:false, error:"state-module", issues:["KorytoState není načten"]};
    const previous = state;
    try {
      state = globalThis.KorytoState.normalizeCollections(value);
      if (typeof normalizeState === "function") normalizeState();
      state = globalThis.KorytoState.normalizeCollections(state, {defaults:globalThis.KorytoState.base});
      applyExtensionNormalizers(state);
      applySaveMetadata(state);
      if (globalThis.KorytoTest143?.normalizeReleaseState) state = globalThis.KorytoTest143.normalizeReleaseState(state);
      applySaveMetadata(state);
      const issues = globalThis.KorytoState.validate(state);
      const prepared = globalThis.KorytoState.clone(state);
      return {
        ok:issues.length === 0,
        value:prepared,
        issues,
        error:issues.length ? "validation" : null
      };
    } catch (error) {
      const message = String(error?.message || error);
      return {ok:false, error:message, issues:[message]};
    } finally {
      state = previous;
    }
  }

  function readLoadable() {
    const candidates = readCandidates();
    const invalid = [];
    for (const stored of candidates) {
      const parsed = parse(stored.raw);
      if (!parsed.ok) {
        invalid.push({key:stored.key, error:parsed.error});
        continue;
      }
      const migrated = migrateCandidate(parsed.value);
      if (migrated.ok) return {stored, parsed:{ok:true, value:migrated.value}, migrated, invalid};
      invalid.push({key:stored.key, error:migrated.error, issues:migrated.issues});
    }
    return {stored:null, parsed:null, migrated:null, invalid};
  }

  function normalize(next = state) {
    if (!globalThis.KorytoState) throw new Error("KorytoState není načten.");
    state = globalThis.KorytoState.normalizeCollections(next);
    if (typeof normalizeState === "function") normalizeState();
    state = globalThis.KorytoState.normalizeCollections(state, {defaults:globalThis.KorytoState.base});
    applyExtensionNormalizers(state);
    applySaveMetadata(state);
    if (globalThis.KorytoTest143?.normalizeReleaseState) state = globalThis.KorytoTest143.normalizeReleaseState(state);
    applySaveMetadata(state);
    return state;
  }

  function serialize(target = state) {
    const prepared = target === state ? normalize(state) : globalThis.KorytoState.normalizeCollections(target);
    applyExtensionNormalizers(prepared);
    applySaveMetadata(prepared);
    if (globalThis.KorytoTest143?.normalizeReleaseState) globalThis.KorytoTest143.normalizeReleaseState(prepared);
    applySaveMetadata(prepared);
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
      if (typeof memorySave !== "undefined") {
        memorySave = raw;
        return true;
      }
      return false;
    }
  }

  function write(key = MANUAL_KEY, target = state) {
    if (!canWrite(target)) return {ok:false, reason:"phase"};
    const raw = serialize(target);
    if (!store(key, raw)) return {ok:false, reason:"storage"};
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
    const loadable = readLoadable();
    if (!loadable.stored) {
      const message = loadable.invalid.length
        ? "Všechny nalezené uložené hry jsou poškozené a nelze je načíst."
        : "Žádná uložená hra nebyla nalezena.";
      if (typeof alert === "function") alert(message);
      return false;
    }

    normalize(loadable.parsed.value);
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
      const migrated = migrateCandidate(parsed.value);
      if (!migrated.ok) return {ok:false, raw, error:migrated.error, issues:migrated.issues || []};
      return {ok:true, raw, restored:migrated.value, issues:[]};
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
      saveButton.dataset.v0143Save = "2";
    }
    const loadButton = document.getElementById?.("loadBtn");
    if (loadButton) {
      loadButton.onclick = loadGame;
      loadButton.dataset.v0143Load = "2";
    }
    const confirmButton = document.getElementById?.("confirmBtn");
    if (confirmButton && confirmButton.dataset.v0143NewGame !== "2" && typeof confirmButton.onclick === "function") {
      const original = confirmButton.onclick;
      confirmButton.onclick = function v0143NewGame(event) {
        const result = original.call(this, event);
        normalizeNewGame();
        return result;
      };
      confirmButton.dataset.v0143NewGame = "2";
    }
    try { save = manualSave; } catch (_) {}
    try { load = loadGame; } catch (_) {}
    try { autoSave = autoSaveGame; } catch (_) {}
    globalThis.save = manualSave;
    globalThis.load = loadGame;
    globalThis.autoSave = autoSaveGame;
  }

  const api = {
    VERSION, SAVE_VERSION, SAVE_FORMAT, SAVE_SCHEMA,
    MANUAL_KEY, AUTO_KEY, LEGACY_KEYS:[...LEGACY_KEYS], CORE_STAT_KEYS:[...CORE_STAT_KEYS],
    readCandidates, readRaw, readLoadable, parse, hasSaveSignature, migrateCandidate,
    applySaveMetadata, normalize, serialize, canWrite, write, manualSave, autoSaveGame, loadGame,
    roundTrip, installControls, normalizeNewGame, activateLoadedGame
  };
  globalThis.KorytoSaveSystem = api;
  installControls();
})();
