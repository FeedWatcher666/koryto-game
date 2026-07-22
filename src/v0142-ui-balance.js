"use strict";
(() => {
  const VERSION = "0.14.2 TEST.9";
  const STRATEGY_DAY_KEY = "v0142StrategyUsedDay";
  const STRATEGY_LABEL_KEY = "v0142StrategyUsedLabel";
  const STRATEGY_IDS = ["briefingBtn","mediaBtn","pollBtn","promiseBtn","endorsementBtn"];
  const SYSTEM_IDS = ["saveBtn","loadBtn","exportBtn","restartBtn"];
  const ACTION_LABELS = {
    briefingOverlay:"Krizový štáb",
    mediaOverlay:"Mediální krize",
    pollOverlay:"Volební průzkum",
    promiseOverlay:"Velký volební slib",
    endorsementOverlay:"Trh veřejné podpory"
  };
  const RESOLUTION_SELECTOR = "[data-choice],[data-promise],[data-resolve],[data-endorsement]";

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const bound = (value, min, max, fallback = min) => Math.max(min, Math.min(max, finite(value, fallback)));

  function normalizeUiState(target = state) {
    if (!target || typeof target !== "object") return target;
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    target.ui = target.ui && typeof target.ui === "object" ? target.ui : {};
    target.ui.v0142CompactMenus = true;
    if (target.flags[STRATEGY_DAY_KEY] !== undefined) {
      target.flags[STRATEGY_DAY_KEY] = bound(target.flags[STRATEGY_DAY_KEY],1,13,target.day || 1);
    }
    if (target.flags[STRATEGY_LABEL_KEY] !== undefined) {
      target.flags[STRATEGY_LABEL_KEY] = String(target.flags[STRATEGY_LABEL_KEY] || "Strategická akce").slice(0,80);
    }
    return target;
  }

  function urgentPromise(target = state) {
    const promise = target?.flags?.v0142Promise;
    return Boolean(promise && promise.status === "active" && finite(target.day,1) >= finite(promise.due,13) - 1);
  }

  function usedToday(target = state) {
    normalizeUiState(target);
    return finite(target.flags[STRATEGY_DAY_KEY],-1) === finite(target.day,0);
  }

  function canUseStrategicAction(target = state, buttonId = "") {
    if (!target || finite(target.actions,0) < 1) return false;
    if (!usedToday(target)) return true;
    return buttonId === "promiseBtn" && urgentPromise(target);
  }

  function markStrategicAction(label, target = state) {
    normalizeUiState(target);
    target.flags[STRATEGY_DAY_KEY] = bound(target.day,1,13,1);
    target.flags[STRATEGY_LABEL_KEY] = String(label || "Strategická akce").slice(0,80);
    return target.flags[STRATEGY_DAY_KEY];
  }

  function snapshotRewards(target = state) {
    const stats = {};
    for (const [key,value] of Object.entries(target?.stats || {})) stats[key] = finite(value,0);
    const voters = {};
    for (const [id,value] of Object.entries(target?.voters || {})) voters[id] = finite(value?.support,0);
    return {stats,voters};
  }

  function applyRewardCaps(target, before) {
    if (!target || !before) return [];
    const caps = {support:6,trust:5,funds:8,influence:6,integrity:6,leverage:5};
    const changes = [];
    for (const [key,cap] of Object.entries(caps)) {
      if (!target.stats || before.stats[key] === undefined) continue;
      const current = finite(target.stats[key],before.stats[key]);
      const gain = current - before.stats[key];
      if (gain > cap) {
        target.stats[key] = before.stats[key] + cap;
        changes.push(`${key}:${gain}->${cap}`);
      }
    }
    for (const [id,start] of Object.entries(before.voters || {})) {
      const voter = target.voters?.[id];
      if (!voter) continue;
      const gain = finite(voter.support,start) - start;
      if (gain > 7) {
        voter.support = Math.min(100,start + 7);
        changes.push(`voter:${id}:${gain}->7`);
      }
    }
    return changes;
  }

  function gameActive() {
    return typeof state !== "undefined" &&
      document.getElementById?.("gameScreen")?.classList.contains("active") &&
      !state.ended;
  }

  function createOverlay(id, title, lead, gridId) {
    if (document.getElementById?.(id)) return document.getElementById(id);
    const overlay = document.createElement?.("div");
    if (!overlay) return null;
    overlay.id = id;
    overlay.className = "overlay hidden v0142-compact-overlay";
    const dialog = document.createElement("div");
    dialog.className = "dialog";
    dialog.setAttribute?.("role","dialog");
    dialog.setAttribute?.("aria-modal","true");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = VERSION;
    const heading = document.createElement("h2");
    heading.textContent = title;
    const summary = document.createElement("p");
    summary.id = `${gridId}Summary`;
    summary.textContent = lead;
    const grid = document.createElement("div");
    grid.id = gridId;
    grid.className = "v0142-compact-grid";
    const close = document.createElement("button");
    close.className = "btn small v0142-compact-close";
    close.textContent = "Zavřít";
    close.addEventListener?.("click",()=>overlay.classList.add("hidden"));
    dialog.appendChild?.(eyebrow);
    dialog.appendChild?.(heading);
    dialog.appendChild?.(summary);
    dialog.appendChild?.(grid);
    dialog.appendChild?.(close);
    overlay.appendChild?.(dialog);
    overlay.addEventListener?.("click",event=>{if(event.target===overlay)overlay.classList.add("hidden");});
    document.body?.appendChild?.(overlay);
    return overlay;
  }

  function createMenuButton(id, label, overlayId) {
    let button = document.getElementById?.(id);
    if (button) return button;
    const actions = document.querySelector?.(".topbar .actions");
    if (!actions) return null;
    button = document.createElement("button");
    button.id = id;
    button.className = "btn small hidden";
    button.textContent = label;
    button.addEventListener?.("click",()=>{
      refreshCompactUi();
      document.getElementById?.(overlayId)?.classList.remove("hidden");
    });
    actions.appendChild?.(button);
    return button;
  }

  function moveButton(id, gridId, kind) {
    const button = document.getElementById?.(id);
    const grid = document.getElementById?.(gridId);
    if (!button || !grid || button.dataset?.compactMenu === kind) return;
    button.dataset.compactMenu = kind;
    button.classList.add("v0142-compact-action");
    grid.appendChild?.(button);
  }

  function installMenus() {
    createOverlay("strategyMenuOverlay","Volební štáb","Jeden hlavní strategický zásah za den. Hořící volební slib lze splnit i po vyčerpání tahu.","strategyMenuGrid");
    createOverlay("systemMenuOverlay","Hra a kronika","Ukládání, načítání a technické volby jsou schované mimo hlavní politické bojiště.","systemMenuGrid");
    createMenuButton("strategyMenuBtn","Štáb","strategyMenuOverlay");
    createMenuButton("systemMenuBtn","Menu","systemMenuOverlay");
    for (const id of STRATEGY_IDS) moveButton(id,"strategyMenuGrid","strategy");
    for (const id of SYSTEM_IDS) moveButton(id,"systemMenuGrid","system");

    const strategyGrid = document.getElementById?.("strategyMenuGrid");
    if (strategyGrid && strategyGrid.dataset?.closeBound !== "1") {
      strategyGrid.dataset.closeBound = "1";
      strategyGrid.addEventListener?.("click",event=>{
        if (event.target?.closest?.("button")) document.getElementById?.("strategyMenuOverlay")?.classList.add("hidden");
      });
    }
    const systemGrid = document.getElementById?.("systemMenuGrid");
    if (systemGrid && systemGrid.dataset?.closeBound !== "1") {
      systemGrid.dataset.closeBound = "1";
      systemGrid.addEventListener?.("click",event=>{
        if (event.target?.closest?.("button")) document.getElementById?.("systemMenuOverlay")?.classList.add("hidden");
      });
    }
  }

  function releaseBalanceLock(button) {
    if (button?.dataset?.balanceLocked !== "1") return;
    button.disabled = false;
    delete button.dataset.balanceLocked;
  }

  function syncStrategyLocks() {
    if (typeof state === "undefined") return;
    const used = usedToday();
    for (const id of STRATEGY_IDS) {
      const button = document.getElementById?.(id);
      if (!button) continue;
      const exempt = id === "promiseBtn" && urgentPromise();
      if (used && !exempt) {
        button.disabled = true;
        button.dataset.balanceLocked = "1";
        button.title = `Dnešní strategický tah už proběhl: ${state.flags[STRATEGY_LABEL_KEY] || "strategická akce"}.`;
      } else {
        releaseBalanceLock(button);
      }
    }
  }

  function visibleAndAvailable(id) {
    const button = document.getElementById?.(id);
    return Boolean(button && !button.classList.contains("hidden") && !button.disabled);
  }

  function refreshCompactUi() {
    if (typeof state === "undefined") return;
    installMenus();
    normalizeUiState();
    syncStrategyLocks();
    const active = gameActive();
    const strategyButton = document.getElementById?.("strategyMenuBtn");
    const systemButton = document.getElementById?.("systemMenuBtn");
    strategyButton?.classList.toggle("hidden",!active);
    systemButton?.classList.toggle("hidden",!active);
    if (!active) return;

    const available = STRATEGY_IDS.filter(visibleAndAvailable).length;
    const used = usedToday();
    if (strategyButton) {
      strategyButton.textContent = used && !urgentPromise() ? "Štáb · hotovo" : `Štáb · ${available}`;
      strategyButton.classList.toggle("urgent",urgentPromise());
    }
    const summary = document.getElementById?.("strategyMenuGridSummary");
    if (summary) {
      summary.textContent = used
        ? `Dnešní tah: ${state.flags[STRATEGY_LABEL_KEY] || "strategická akce"}. Další běžná strategie bude dostupná zítra${urgentPromise()?", hořící slib však můžete vyřešit hned":""}.`
        : `Dostupné možnosti: ${available}. Vyberte jednu hlavní strategickou akci pro den ${state.day}.`;
    }
  }

  function detectStrategicResolution(event) {
    const trigger = event.target?.closest?.(RESOLUTION_SELECTOR);
    if (!trigger || typeof state === "undefined") return;
    const overlay = trigger.closest?.(".overlay");
    const label = ACTION_LABELS[overlay?.id];
    if (!label) return;
    const beforeActions = finite(state.actions,0);
    const beforeRewards = snapshotRewards();
    setTimeout(()=>{
      if (typeof state === "undefined" || finite(state.actions,0) >= beforeActions) return;
      const capped = applyRewardCaps(state,beforeRewards);
      markStrategicAction(label);
      if (capped.length && typeof log === "function") log(`Vyvážení štábu omezilo souběh bonusů: ${capped.join(", ")}.`);
      if (typeof renderAll === "function") renderAll();
      if (typeof autoSave === "function") autoSave();
      refreshCompactUi();
    },0);
  }

  function addStyles() {
    const style = document.createElement?.("style");
    if (!style) return;
    style.textContent = `
      .v0142-compact-overlay .dialog{max-width:760px;text-align:left}
      .v0142-compact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:14px 0}
      .v0142-compact-grid>.btn{width:100%;min-height:58px;text-align:left;white-space:normal}
      .v0142-compact-grid>.btn.hidden{display:none!important}
      .v0142-compact-close{margin-top:6px}
      #strategyMenuBtn.urgent{outline:3px solid #d97706;animation:v0142menuPulse 1s infinite alternate}
      @keyframes v0142menuPulse{from{transform:translateY(0)}to{transform:translateY(-2px)}}
    `;
    document.head?.appendChild?.(style);
  }

  function updateVersion() {
    document.title = `Koryto ${VERSION} – vyvážený volební štáb`;
    const brand = document.querySelector?.(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const description = document.querySelector?.('meta[name="description"]');
    if (description) description.content = `Koryto ${VERSION}: kompaktní menu volebního štábu, jeden strategický tah denně a vyvážené odměny.`;
  }

  globalThis.KorytoTest9 = {
    VERSION, STRATEGY_IDS:[...STRATEGY_IDS], SYSTEM_IDS:[...SYSTEM_IDS],
    normalizeUiState, urgentPromise, usedToday, canUseStrategicAction,
    markStrategicAction, snapshotRewards, applyRewardCaps, refreshCompactUi
  };

  addStyles();
  installMenus();
  updateVersion();
  refreshCompactUi();
  document.addEventListener?.("click",detectStrategicResolution,true);
  document.addEventListener?.("keydown",event=>{
    if(event.key!=="Escape")return;
    document.getElementById?.("strategyMenuOverlay")?.classList.add("hidden");
    document.getElementById?.("systemMenuOverlay")?.classList.add("hidden");
  });
  if (typeof setInterval === "function") setInterval(()=>{updateVersion();refreshCompactUi();},400);
})();
