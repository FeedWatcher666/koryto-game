"use strict";
(() => {
  const VERSION = "0.14.3 TEST.2";
  const SAVE_VERSION = "0.14.3-test.2";
  const STATE_FLAG = "v0143StateModule";
  const OBJECT_KEYS = [
    "hero","stats","factions","party","flags","quests","cooldowns","genericUses","voters",
    "visited","opponent","pendingMeta","factionPlans","conspiracy","companionStories","worldChanges",
    "relationships","conflictStates","companionSupportUsed","coalition","debate","rivalAI",
    "factionActionCooldowns","companionAmbitions","rivalOperation","ui","approachHeat","partyFatigue","audit"
  ];
  const ARRAY_KEYS = [
    "items","commitments","news","log","pendingEvents","surprisePlan","electionBreakdown","planHistory",
    "worldActions","echoes","echoHistory","lastApproaches"
  ];
  const OBJECT_ENTRY_MAPS = [
    "party","quests","voters","pendingMeta","factionPlans","companionStories","conflictStates","companionAmbitions"
  ];
  const OBJECT_ARRAY_KEYS = [
    "commitments","news","electionBreakdown","planHistory","worldActions","echoes","echoHistory"
  ];
  const NUMBER_MAP_KEYS = [
    "factions","cooldowns","genericUses","relationships","factionActionCooldowns","approachHeat","partyFatigue"
  ];
  const STAT_DEFAULTS = {support:14, trust:50, funds:12, heat:0, influence:10, integrity:55, leverage:0};
  let cachedDefaults = null;

  const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

  function merge(target, source) {
    if (source === undefined) return target;
    if (Array.isArray(source)) return clone(source);
    if (!isObject(source)) return source;
    const output = isObject(target) ? target : {};
    for (const [key, value] of Object.entries(source)) {
      output[key] = isObject(value) ? merge(isObject(output[key]) ? output[key] : {}, value) : clone(value);
    }
    return output;
  }

  function buildInitializedDefaults() {
    const previous = state;
    try {
      state = clone(baseState);
      if (typeof initQuests === "function") initQuests();
      if (typeof initVoters === "function") initVoters();
      if (typeof initSurprises === "function") initSurprises();
      if (typeof initLivingWorld === "function") initLivingWorld();
      return clone(state);
    } finally {
      state = previous;
    }
  }

  function initializedDefaults({refresh = false} = {}) {
    if (!cachedDefaults || refresh) cachedDefaults = buildInitializedDefaults();
    return clone(cachedDefaults);
  }

  function normalizeHero(target, defaults) {
    target.hero = isObject(target.hero) ? target.hero : clone(defaults.hero);
    target.hero.name = String(target.hero.name || defaults.hero.name || "");
    target.hero.classId = String(target.hero.classId || defaults.hero.classId || "bard");
    target.hero.origin = String(target.hero.origin || defaults.hero.origin || "idealist");
    target.hero.attrs = isObject(target.hero.attrs) ? target.hero.attrs : {};
  }

  function normalizeStats(target, defaults) {
    target.stats = isObject(target.stats) ? target.stats : {};
    for (const [key, fallback] of Object.entries(STAT_DEFAULTS)) {
      const defaultValue = finite(defaults.stats?.[key], fallback);
      target.stats[key] = finite(target.stats[key], defaultValue);
    }
  }

  function normalizeAudit(target, defaults) {
    target.audit = isObject(target.audit) ? target.audit : clone(defaults.audit || {});
    target.audit.rolls = Math.max(0, Math.floor(finite(target.audit.rolls, 0)));
    target.audit.autosaves = Math.max(0, Math.floor(finite(target.audit.autosaves, 0)));
    target.audit.outcomes = isObject(target.audit.outcomes) ? target.audit.outcomes : {};
    for (const key of ["critical","success","costly","complication"]) {
      target.audit.outcomes[key] = Math.max(0, Math.floor(finite(target.audit.outcomes[key], 0)));
    }
    target.audit.locations = isObject(target.audit.locations) ? target.audit.locations : {};
    target.audit.approaches = isObject(target.audit.approaches) ? target.audit.approaches : {};
  }

  function normalizeCollections(input, options = {}) {
    const defaults = options.defaults ? clone(options.defaults) : initializedDefaults();
    const saved = isObject(input) ? input : {};
    const target = merge(clone(defaults), saved);

    for (const key of OBJECT_KEYS) {
      if (!isObject(target[key])) target[key] = clone(defaults[key] || {});
    }
    for (const key of ARRAY_KEYS) {
      if (!Array.isArray(target[key])) target[key] = clone(defaults[key] || []);
      target[key] = target[key].filter(value => value !== null && value !== undefined);
    }
    for (const key of OBJECT_ENTRY_MAPS) {
      for (const [entryKey, value] of Object.entries(target[key] || {})) {
        if (isObject(value)) continue;
        if (isObject(defaults[key]?.[entryKey])) target[key][entryKey] = clone(defaults[key][entryKey]);
        else delete target[key][entryKey];
      }
    }
    for (const key of OBJECT_ARRAY_KEYS) target[key] = (target[key] || []).filter(isObject);
    for (const key of NUMBER_MAP_KEYS) {
      for (const [entryKey, value] of Object.entries(target[key] || {})) {
        target[key][entryKey] = finite(value, finite(defaults[key]?.[entryKey], 0));
      }
    }
    globalThis.KorytoQuestRuntime?.normalize?.(target);

    normalizeHero(target, defaults);
    normalizeStats(target, defaults);
    normalizeAudit(target, defaults);

    target.day = Math.max(1, Math.min(14, Math.floor(finite(target.day, defaults.day || 1))));
    target.actions = Math.max(0, Math.min(99, Math.floor(finite(target.actions, defaults.actions || 0))));
    target.debt = finite(target.debt, 0);
    target.commitmentSeq = Math.max(0, Math.floor(finite(target.commitmentSeq, target.commitments.length)));
    target.surpriseTriggered = Math.max(0, Math.floor(finite(target.surpriseTriggered, 0)));
    target.finale = Math.max(0, Math.floor(finite(target.finale, 0)));
    target.abilityUsedDay = Math.max(0, Math.floor(finite(target.abilityUsedDay, 0)));
    target.partyUsedDay = Math.max(0, Math.floor(finite(target.partyUsedDay, 0)));
    target.rngState = (finite(target.rngState, defaults.rngState || 2463534242) >>> 0);
    target.seed = String(target.seed || "");
    target.phase = ["map","location","event","debate","finale","coalition"].includes(target.phase) ? target.phase : "map";
    target.ended = Boolean(target.ended);
    target.classAbilityUsed = Boolean(target.classAbilityUsed);
    target.ui.pixelMap = target.ui.pixelMap !== false;
    target.promiseSummary = isObject(target.promiseSummary) ? target.promiseSummary : clone(defaults.promiseSummary || {fulfilled:0,broken:0,active:0});
    for (const key of ["fulfilled","broken","active"]) target.promiseSummary[key] = Math.max(0, Math.floor(finite(target.promiseSummary[key], 0)));

    if (target.phase === "map") {
      target.currentLocation = null;
      target.currentEvent = null;
    }
    target.flags[STATE_FLAG] = VERSION;
    target.version = SAVE_VERSION;
    return target;
  }

  function replace(next, options) {
    state = normalizeCollections(next, options);
    return state;
  }

  function reset() {
    state = normalizeCollections(initializedDefaults({refresh:true}));
    return state;
  }

  function validate(target = state) {
    const issues = [];
    if (!isObject(target)) return ["Chybí herní stav."];
    for (const key of OBJECT_KEYS) if (!isObject(target[key])) issues.push(`${key} není objekt`);
    for (const key of ARRAY_KEYS) if (!Array.isArray(target[key])) issues.push(`${key} není pole`);

    for (const key of OBJECT_ENTRY_MAPS) {
      if (!isObject(target[key])) continue;
      for (const [entryKey, value] of Object.entries(target[key])) {
        if (!isObject(value)) issues.push(`${key}.${entryKey} není objekt`);
      }
    }
    for (const key of ARRAY_KEYS) {
      if (!Array.isArray(target[key])) continue;
      target[key].forEach((value, index) => {
        if (value === null || value === undefined) issues.push(`${key}[${index}] je prázdná položka`);
      });
    }
    for (const key of OBJECT_ARRAY_KEYS) {
      if (!Array.isArray(target[key])) continue;
      target[key].forEach((value, index) => {
        if (!isObject(value)) issues.push(`${key}[${index}] není objekt`);
      });
    }
    for (const key of NUMBER_MAP_KEYS) {
      if (!isObject(target[key])) continue;
      for (const [entryKey, value] of Object.entries(target[key])) {
        if (!Number.isFinite(Number(value))) issues.push(`${key}.${entryKey} není číslo`);
      }
    }

    if (!Number.isInteger(target.day) || target.day < 1 || target.day > 14) issues.push("neplatný den");
    if (!Number.isInteger(target.actions) || target.actions < 0) issues.push("neplatné akce");
    if (Object.values(target.stats || {}).some(value => !Number.isFinite(Number(value)))) issues.push("NaN ve statistikách");
    return [...new Set(issues)];
  }

  globalThis.KorytoState = {
    VERSION, SAVE_VERSION, STATE_FLAG, OBJECT_KEYS:[...OBJECT_KEYS], ARRAY_KEYS:[...ARRAY_KEYS],
    OBJECT_ENTRY_MAPS:[...OBJECT_ENTRY_MAPS], OBJECT_ARRAY_KEYS:[...OBJECT_ARRAY_KEYS], NUMBER_MAP_KEYS:[...NUMBER_MAP_KEYS],
    clone, merge, initializedDefaults, normalizeCollections, replace, reset, validate,
    get current() { return state; },
    get base() { return initializedDefaults(); }
  };
})();