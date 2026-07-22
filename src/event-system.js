"use strict";
(() => {
  const VERSION = "0.14.3 TEST.6";
  const definitions = () => (typeof events !== "undefined" && events && typeof events === "object" ? events : {});
  const resolve = id => (typeof eventById === "function" ? eventById(id) : definitions()[id]) || null;
  function validate() {
    const issues = [];
    for (const [id, event] of Object.entries(definitions())) {
      if (!event || typeof event !== "object") { issues.push(`${id}: událost není objekt`); continue; }
      if (!String(event.title || "").trim()) issues.push(`${id}: chybí název`);
      if (!String(event.location || "").trim()) issues.push(`${id}: chybí lokace`);
      else if (typeof locations !== "undefined" && !locations[event.location]) issues.push(`${id}: neznámá lokace ${event.location}`);
      const questId = event.questId || (typeof questDefs !== "undefined" && questDefs[id] ? id : null);
      if (questId && typeof questDefs !== "undefined" && !questDefs[questId]) issues.push(`${id}: neznámý quest ${questId}`);
      if (event.choices !== undefined && !Array.isArray(event.choices)) issues.push(`${id}: volby nejsou pole`);
      for (const [index, choice] of (event.choices || []).entries()) {
        if (!choice || typeof choice !== "object") issues.push(`${id}[${index}]: volba není objekt`);
        else if (!String(choice.label || "").trim()) issues.push(`${id}[${index}]: chybí text volby`);
      }
    }
    return [...new Set(issues)];
  }
  function catalog() {
    return Object.entries(definitions()).map(([id,event]) => ({
      id,
      title:event.title || id,
      location:event.location || null,
      questId:event.questId || (typeof questDefs !== "undefined" && questDefs[id] ? id : null),
      queued:Boolean(event.queued),
      surprise:Boolean(event.surprise),
      repeatable:Boolean(event.repeatable),
      choices:Array.isArray(event.choices) ? event.choices.length : 0
    }));
  }
  function available(location, target = state) {
    const previous = typeof state !== "undefined" ? state : null;
    if (target && previous !== target) { try { state = target; } catch (_) {} }
    try {
      return catalog().filter(item => {
        if (location && item.location !== location) return false;
        const event = resolve(item.id);
        if (!event) return false;
        if (typeof event.available === "function" && !event.available()) return false;
        return true;
      });
    } finally {
      if (previous && previous !== target) { try { state = previous; } catch (_) {} }
    }
  }
  function summary() {
    const items = catalog();
    return {
      total:items.length,
      queued:items.filter(x => x.queued).length,
      surprises:items.filter(x => x.surprise).length,
      repeatable:items.filter(x => x.repeatable).length,
      questLinked:items.filter(x => x.questId).length,
      byLocation:Object.fromEntries(Object.keys(typeof locations !== "undefined" ? locations : {}).map(id => [id,items.filter(x => x.location === id).length]))
    };
  }
  globalThis.KorytoEventSystem = {VERSION,definitions,resolve,validate,catalog,available,summary};
})();
