"use strict";
(() => {
  const VERSION = "0.14.3 TEST.3";
  const BUILD_VERSION = "0.14.3-test.3";
  const SAVE_VERSION = "0.14.3-test.2";
  const ALLOWED_STATUS = new Set(["locked", "active", "done", "failed"]);

  const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const definitions = () => (typeof questDefs !== "undefined" && isObject(questDefs) ? questDefs : {});

  function cloneDefinitions() {
    return clone(definitions());
  }

  function definition(id) {
    return definitions()[id] || null;
  }

  function deadline(id, target = state) {
    const def = definition(id);
    if (!def) return null;
    const bonus = Number(target?.quests?.[id]?.deadlineBonus);
    return Math.max(1, Math.floor(Number(def.deadline) + (Number.isFinite(bonus) ? bonus : 0)));
  }

  function validateDefinitions() {
    const issues = [];
    const defs = definitions();
    if (!Object.keys(defs).length) return ["Chybí definice questů."];

    for (const [id, def] of Object.entries(defs)) {
      if (!isObject(def)) {
        issues.push(`${id}: definice není objekt`);
        continue;
      }
      if (!String(def.title || "").trim()) issues.push(`${id}: chybí název`);
      if (!String(def.desc || "").trim()) issues.push(`${id}: chybí popis`);
      if (!String(def.failure || "").trim()) issues.push(`${id}: chybí následek selhání`);
      if (!Number.isInteger(Number(def.deadline)) || Number(def.deadline) < 1 || Number(def.deadline) > 14) {
        issues.push(`${id}: neplatný termín`);
      }
      if (!String(def.location || "").trim()) {
        issues.push(`${id}: chybí lokace`);
      } else if (typeof locations !== "undefined" && !locations[def.location]) {
        issues.push(`${id}: neznámá lokace ${def.location}`);
      }
    }
    return [...new Set(issues)];
  }

  function validateState(target = state) {
    const issues = [];
    const defs = definitions();
    if (!isObject(target?.quests)) return ["Stav questů není objekt."];

    for (const id of Object.keys(defs)) {
      const quest = target.quests[id];
      if (!isObject(quest)) {
        issues.push(`${id}: chybí stav questu`);
        continue;
      }
      if (!ALLOWED_STATUS.has(quest.status)) issues.push(`${id}: neplatný stav ${String(quest.status)}`);
      if (!Number.isFinite(Number(quest.stage)) || Number(quest.stage) < 0) issues.push(`${id}: neplatná fáze`);
      if (quest.deadlineBonus !== undefined && (!Number.isFinite(Number(quest.deadlineBonus)) || Number(quest.deadlineBonus) < 0)) {
        issues.push(`${id}: neplatné prodloužení termínu`);
      }
    }

    for (const id of Object.keys(target.quests)) {
      if (!defs[id]) issues.push(`${id}: stav nemá definici`);
    }
    return [...new Set(issues)];
  }

  function active(target = state) {
    if (!isObject(target?.quests)) return [];
    return Object.entries(target.quests)
      .filter(([id, quest]) => definitions()[id] && quest?.status === "active")
      .map(([id, quest]) => ({id, definition:definitions()[id], state:quest, deadline:deadline(id, target)}))
      .sort((a, b) => (a.deadline ?? 99) - (b.deadline ?? 99) || a.id.localeCompare(b.id));
  }

  function summary(target = state) {
    const counts = {locked:0, active:0, done:0, failed:0, unknown:0};
    if (!isObject(target?.quests)) return counts;
    for (const quest of Object.values(target.quests)) {
      const status = quest?.status;
      if (Object.hasOwn(counts, status)) counts[status] += 1;
      else counts.unknown += 1;
    }
    return counts;
  }

  function runIntegrityCheck(target = state) {
    const definitionIssues = validateDefinitions();
    const stateIssues = validateState(target);
    const issues = [...new Set([...definitionIssues, ...stateIssues])];
    return {
      version:VERSION,
      buildVersion:BUILD_VERSION,
      saveVersion:SAVE_VERSION,
      ok:issues.length === 0,
      issues,
      definitions:Object.keys(definitions()).length,
      active:active(target).length,
      summary:summary(target)
    };
  }

  globalThis.KorytoQuestSystem = {
    VERSION, BUILD_VERSION, SAVE_VERSION,
    definitions, cloneDefinitions, definition, deadline,
    validateDefinitions, validateState, active, summary, runIntegrityCheck
  };
})();