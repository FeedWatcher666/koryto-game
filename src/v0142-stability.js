"use strict";
(() => {
  const VERSION = "0.14.2 TEST.9";
  const STATE_MARKER = "v0142StableVersion";
  const VALID_PROMISES = new Set(["school", "fees", "meadow"]);
  const VALID_PROMISE_STATUS = new Set(["active", "fulfilled", "broken"]);
  const VALID_ENDORSEMENTS = new Set(["workers", "business", "influencer"]);
  const CHECKPOINTS = [5, 9, 12];
  let lastReport = null;

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const safeClamp = (value, min, max, fallback = min) => Math.max(min, Math.min(max, finite(value, fallback)));

  function normalizeVoters(target) {
    target.voters = target.voters && typeof target.voters === "object" ? target.voters : {};
    if (typeof voterDefs !== "object" || !voterDefs) return;
    for (const [id, def] of Object.entries(voterDefs)) {
      const current = target.voters[id] && typeof target.voters[id] === "object" ? target.voters[id] : {};
      target.voters[id] = {
        ...current,
        support: safeClamp(current.support, 0, 100, def.base),
        turnout: safeClamp(current.turnout, 0, 1, def.turnout)
      };
    }
  }

  function normalizeStats(target) {
    target.stats = target.stats && typeof target.stats === "object" ? target.stats : {};
    const defaults = {support:14, trust:50, funds:12, heat:0, influence:10, integrity:55, leverage:0};
    for (const [key, fallback] of Object.entries(defaults)) {
      const min = key === "funds" ? -999 : 0;
      const max = key === "funds" ? 9999 : key === "leverage" ? 999 : 100;
      target.stats[key] = safeClamp(target.stats[key], min, max, fallback);
    }
  }

  function normalizePromise(target) {
    const promise = target.flags.v0142Promise;
    if (!promise) return;
    if (typeof promise !== "object" || !VALID_PROMISES.has(promise.id)) {
      delete target.flags.v0142Promise;
      return;
    }
    promise.title = String(promise.title || promise.id);
    promise.created = safeClamp(promise.created, 1, 13, target.day || 1);
    promise.due = safeClamp(promise.due, promise.created, 13, Math.min(13, promise.created + 3));
    promise.status = VALID_PROMISE_STATUS.has(promise.status) ? promise.status : "active";
    promise.postponed = Boolean(promise.postponed);
  }

  function normalizeFeatureFlags(target) {
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    target.flags[STATE_MARKER] = VERSION;

    for (const day of [4, 8, 12]) {
      const key = `v0142PollDay${day}`;
      if (target.flags[key] !== undefined) target.flags[key] = Boolean(target.flags[key]);
    }

    for (const day of CHECKPOINTS) {
      const key = `v0142Endorsement${day}`;
      if (target.flags[key] !== undefined && !VALID_ENDORSEMENTS.has(target.flags[key])) delete target.flags[key];
    }

    for (const key of ["v0142BriefingDay", "v0142MediaDay", "v0142StrategyUsedDay"]) {
      if (target.flags[key] !== undefined) target.flags[key] = safeClamp(target.flags[key], 1, 13, target.day || 1);
    }
    if (target.flags.v0142StrategyUsedLabel !== undefined) {
      target.flags.v0142StrategyUsedLabel = String(target.flags.v0142StrategyUsedLabel || "Strategická akce").slice(0,80);
    }

    normalizePromise(target);
  }

  function normalizeCommitments(target) {
    target.commitments = Array.isArray(target.commitments) ? target.commitments : [];
    target.commitmentSeq = Math.max(0, Math.floor(finite(target.commitmentSeq, target.commitments.length)));
    target.commitments = target.commitments
      .filter(item => item && typeof item === "object")
      .map((item, index) => ({
        ...item,
        id: String(item.id || `stable_${index + 1}`),
        title: String(item.title || "Neupřesněný politický závazek"),
        creditor: String(item.creditor || "Neznámý věřitel"),
        due: safeClamp(item.due, 1, 13, Math.min(13, (target.day || 1) + 2)),
        kind: item.kind === "public" ? "public" : "private",
        notes: String(item.notes || ""),
        status: ["active", "fulfilled", "broken"].includes(item.status) ? item.status : "active"
      }));
  }

  function normalizeStateExtensions(target = state) {
    if (!target || typeof target !== "object") return target;
    target.day = safeClamp(target.day, 1, 14, 1);
    target.actions = safeClamp(target.actions, 0, 99, 0);
    target.party = target.party && typeof target.party === "object" ? target.party : {};
    target.worldChanges = target.worldChanges && typeof target.worldChanges === "object" ? target.worldChanges : {};
    target.ui = target.ui && typeof target.ui === "object" ? target.ui : {};
    target.ui.v0142CompactMenus = true;
    normalizeStats(target);
    normalizeFeatureFlags(target);
    normalizeVoters(target);
    normalizeCommitments(target);
    if (globalThis.KorytoCounterCampaign?.normalizeCampaignState) globalThis.KorytoCounterCampaign.normalizeCampaignState(target);
    if (globalThis.KorytoTest9?.normalizeUiState) globalThis.KorytoTest9.normalizeUiState(target);
    return target;
  }

  function validateState(target = state) {
    const issues = [];
    if (!target || typeof target !== "object") return ["Chybí herní stav."];
    if (!target.flags || typeof target.flags !== "object") issues.push("flags nejsou objekt");
    if (!Array.isArray(target.commitments)) issues.push("commitments nejsou pole");
    if (!target.voters || typeof target.voters !== "object") issues.push("chybí voliči");
    if (!target.stats || Object.values(target.stats).some(value => !Number.isFinite(Number(value)))) issues.push("neplatné statistiky");
    const promise = target.flags?.v0142Promise;
    if (promise && (!VALID_PROMISES.has(promise.id) || !VALID_PROMISE_STATUS.has(promise.status))) issues.push("neplatný velký slib");
    for (const day of CHECKPOINTS) {
      const value = target.flags?.[`v0142Endorsement${day}`];
      if (value !== undefined && !VALID_ENDORSEMENTS.has(value)) issues.push(`neplatná podpora dne ${day}`);
    }
    const counter = target.flags?.v0142CounterCampaign;
    if (counter && typeof counter !== "object") issues.push("neplatná protikampaň");
    if (target.ui?.v0142CompactMenus !== true) issues.push("kompaktní menu není aktivní");
    return issues;
  }

  function roundTripCheck(target = state) {
    try {
      const raw = JSON.stringify(target);
      const restored = JSON.parse(raw);
      normalizeStateExtensions(restored);
      const issues = validateState(restored);
      return {ok: issues.length === 0, bytes: raw.length, issues};
    } catch (error) {
      return {ok:false, bytes:0, issues:[String(error?.message || error)]};
    }
  }

  function duplicateIdCheck() {
    const seen = new Set();
    const duplicates = [];
    document.querySelectorAll?.("[id]").forEach(element => {
      if (!element.id) return;
      if (seen.has(element.id)) duplicates.push(element.id);
      seen.add(element.id);
    });
    return duplicates;
  }

  function runChecks() {
    normalizeStateExtensions();
    const issues = validateState();
    const roundTrip = roundTripCheck();
    const duplicates = duplicateIdCheck();
    if (!roundTrip.ok) issues.push(...roundTrip.issues.map(issue => `roundtrip: ${issue}`));
    if (duplicates.length) issues.push(`duplicitní ID: ${duplicates.join(", ")}`);
    lastReport = {
      version: VERSION,
      ok: issues.length === 0,
      issues,
      saveBytes: roundTrip.bytes,
      day: state?.day,
      phase: state?.phase,
      timestamp: new Date().toISOString()
    };
    return lastReport;
  }

  function updateVersionLabels() {
    document.title = `Koryto ${VERSION} – vyvážený volební štáb`;
    const brand = document.querySelector?.(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const description = document.querySelector?.('meta[name="description"]');
    if (description) description.content = `Koryto ${VERSION}: kompaktní menu volebního štábu, jeden strategický tah denně a vyvážené odměny.`;
    const footer = document.querySelector?.(".footer-note");
    if (footer && !footer.dataset.stabilityLabel) {
      footer.dataset.stabilityLabel = "1";
      footer.textContent += ` · ${VERSION}`;
    } else if (footer && /0\.14\.2 TEST\.[4-8]/.test(footer.textContent || "")) {
      footer.textContent = footer.textContent.replace(/0\.14\.2 TEST\.[4-8]/g,VERSION);
    }
  }

  function rewriteLegacyVersionText(root = document.body) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const nodes = [root, ...root.querySelectorAll("*")];
    for (const node of nodes) {
      if (node.children?.length || typeof node.textContent !== "string") continue;
      if (/0\.14\.2 TEST\.[4-8]/.test(node.textContent)) node.textContent = node.textContent.replace(/0\.14\.2 TEST\.[4-8]/g, VERSION);
    }
  }

  function wrapButton(id, after) {
    const button = document.getElementById?.(id);
    if (!button || button.dataset?.stabilityWrapped === "1") return;
    const original = button.onclick;
    if (typeof original !== "function") return;
    button.onclick = function wrappedClick(event) {
      normalizeStateExtensions();
      const result = original.call(this, event);
      normalizeStateExtensions();
      after?.();
      runChecks();
      return result;
    };
    if (button.dataset) button.dataset.stabilityWrapped = "1";
  }

  function installButtonGuards() {
    wrapButton("saveBtn");
    wrapButton("loadBtn", () => typeof renderAll === "function" && renderAll());
    wrapButton("confirmBtn");
  }

  function healthTick() {
    if (typeof state === "undefined") return;
    normalizeStateExtensions();
    installButtonGuards();
    updateVersionLabels();
    rewriteLegacyVersionText();
    const report = runChecks();
    if (!report.ok && !state.flags.v0142StabilityWarning) {
      state.flags.v0142StabilityWarning = true;
      console.warn("Koryto stability report", report);
    }
  }

  globalThis.KorytoStability = {
    VERSION,
    normalizeStateExtensions,
    validateState,
    roundTripCheck,
    runChecks,
    get report() { return lastReport; }
  };

  updateVersionLabels();
  installButtonGuards();
  healthTick();
  if (typeof setInterval === "function") setInterval(healthTick,500);

  if (typeof MutationObserver === "function" && document.body) {
    const observer = new MutationObserver(() => rewriteLegacyVersionText());
    observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  }
})();
