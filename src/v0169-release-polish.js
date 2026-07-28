"use strict";
(() => {
  const INFO = globalThis.KorytoBuildInfo || Object.freeze({
    displayVersion: "0.17.1 TEST.1",
    buildVersion: "0.17.1-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1,
    applyLabels: () => false
  });
  const VERSION = INFO.displayVersion;
  const BUILD_VERSION = INFO.buildVersion;
  const SAVE_VERSION = INFO.saveVersion;
  const SAVE_SCHEMA = INFO.saveSchema;
  const STORAGE_KEY = "koryto_ui_0169";

  let installed = false;
  let panelOpen = false;
  const defaults = {
    largeText: false,
    highContrast: false,
    reducedMotion: Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
  };

  function readPrefs() {
    try { return {...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")}; }
    catch (_) { return {...defaults}; }
  }

  let prefs = readPrefs();
  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;
  const editable = target => Boolean(target?.closest?.("input,textarea,select,[contenteditable='true']"));

  function savePrefs() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (_) {}
  }

  function announce(message) {
    const live = document.getElementById("k169Live");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => { live.textContent = message; }, 0);
  }

  function activeSurface() {
    const clean = document.getElementById("v0160Root");
    if (clean && !clean.hidden && document.documentElement.classList.contains("k16-active")) return clean;
    return document.querySelector(".screen.active") || document.querySelector("main") || document.body;
  }

  function focusActiveSurface() {
    const target = activeSurface();
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({preventScroll: true});
  }

  function actionAllowed(id, target) {
    if (id === "saveBtn") return Boolean(target && target.phase === "map" && !target.ended);
    return true;
  }

  function triggerOriginal(id, label) {
    const target = stateOf();
    if (!actionAllowed(id, target)) {
      announce("Uložit lze pouze na mapě mimo ukončenou kampaň.");
      return false;
    }
    const button = document.getElementById(id);
    if (!button) {
      announce(`Akce ${label} není v této obrazovce dostupná.`);
      return false;
    }
    button.click();
    announce(`${label}: příkaz byl předán původnímu hernímu ovládání.`);
    setTimeout(syncStatus, 0);
    return true;
  }

  function applyPrefs() {
    const root = document.documentElement;
    root.classList.toggle("k169-large-text", Boolean(prefs.largeText));
    root.classList.toggle("k169-high-contrast", Boolean(prefs.highContrast));
    root.classList.toggle("k169-reduced-motion", Boolean(prefs.reducedMotion));
    document.querySelectorAll("[data-k169-pref]").forEach(button => {
      const key = button.dataset.k169Pref;
      button.setAttribute("aria-pressed", String(Boolean(prefs[key])));
      button.classList.toggle("active", Boolean(prefs[key]));
    });
  }

  function phaseLabel(target) {
    const phase = target?.phase || "start";
    return ({map: "Mapa", location: "Lokace", event: "Událost", debate: "Debata", finale: "Finále"})[phase] || phase;
  }

  function syncStatus() {
    INFO.applyLabels?.();
    const target = stateOf();
    const status = document.getElementById("k169Status");
    if (status) {
      status.innerHTML = target
        ? `<span><b>Den ${Math.max(1, Number(target.day) || 1)}</b><small>${phaseLabel(target)}</small></span><span><b>${Math.max(0, Number(target.actions) || 0)} akce</b><small>${target.ended ? "kampaň uzavřena" : "hra probíhá"}</small></span>`
        : `<span><b>Úvod</b><small>nová kampaň</small></span><span><b>${VERSION}</b><small>offline build</small></span>`;
    }
    const save = document.querySelector('[data-k169-action="save"]');
    if (save) save.disabled = !actionAllowed("saveBtn", target);
    const phase = document.getElementById("k169Phase");
    if (phase) phase.textContent = `${VERSION} · save ${SAVE_VERSION} / schema ${SAVE_SCHEMA}`;
  }

  function panelMarkup() {
    return `<a id="k169Skip" class="k169-skip" href="#">Přeskočit na aktivní obsah</a>
      <div id="k169Live" class="k169-sr" aria-live="polite"></div>
      <section id="k169Utility" class="k169-utility" aria-label="Rychlé ovládání a přístupnost">
        <button type="button" class="k169-launcher" data-k169-open aria-expanded="false" aria-controls="k169Panel">☰ <span>Ovládání</span></button>
        <aside id="k169Panel" class="k169-panel" hidden>
          <header><div><p>RELEASE INTEGRITY</p><h2>Rychlé ovládání</h2><small id="k169Phase"></small></div><button type="button" data-k169-close aria-label="Zavřít panel">×</button></header>
          <div id="k169Status" class="k169-status"></div>
          <section><h3>Hra</h3><div class="k169-grid">
            <button type="button" data-k169-action="save"><b>Uložit</b><small>Alt + S</small></button>
            <button type="button" data-k169-action="load"><b>Načíst</b><small>Alt + L</small></button>
            <button type="button" data-k169-action="map"><b>Mapa</b><small>Alt + M</small></button>
            <button type="button" data-k169-action="export"><b>Kronika</b><small>Alt + K</small></button>
          </div></section>
          <section><h3>Čitelnost</h3><div class="k169-grid">
            <button type="button" data-k169-pref="largeText" aria-pressed="false"><b>Větší text</b><small>bez změny pravidel</small></button>
            <button type="button" data-k169-pref="highContrast" aria-pressed="false"><b>Vyšší kontrast</b><small>ostřejší panely</small></button>
            <button type="button" data-k169-pref="reducedMotion" aria-pressed="false"><b>Méně pohybu</b><small>omezení animací</small></button>
            <button type="button" data-k169-focus><b>Aktivní obsah</b><small>přesun fokusu</small></button>
          </div></section>
          <footer><span>Esc zavře panel</span><button type="button" data-k169-action="restart">Nová hra</button></footer>
        </aside>
      </section>`;
  }

  function ensureUtility() {
    if (document.getElementById("k169Utility")) return;
    document.body.insertAdjacentHTML("afterbegin", panelMarkup());
    document.getElementById("k169Skip")?.addEventListener("click", event => {
      event.preventDefault();
      focusActiveSurface();
      announce("Fokus přesunut na aktivní obsah.");
    });
  }

  function setPanel(open) {
    panelOpen = Boolean(open);
    const panel = document.getElementById("k169Panel");
    const launcher = document.querySelector("[data-k169-open]");
    if (!panel || !launcher) return;
    panel.hidden = !panelOpen;
    launcher.setAttribute("aria-expanded", String(panelOpen));
    document.documentElement.classList.toggle("k169-panel-open", panelOpen);
    if (panelOpen) {
      syncStatus();
      panel.querySelector("button")?.focus();
    } else launcher.focus();
  }

  function togglePref(key) {
    if (!(key in prefs)) return;
    prefs[key] = !prefs[key];
    savePrefs();
    applyPrefs();
    announce(`${key === "largeText" ? "Větší text" : key === "highContrast" ? "Vyšší kontrast" : "Omezení pohybu"}: ${prefs[key] ? "zapnuto" : "vypnuto"}.`);
  }

  function handleAction(action) {
    const map = {
      save: ["saveBtn", "Uložit"], load: ["loadBtn", "Načíst"], map: ["mapBtn", "Mapa"],
      export: ["exportBtn", "Kronika"], restart: ["restartBtn", "Nová hra"]
    };
    const command = map[action];
    if (command) triggerOriginal(command[0], command[1]);
  }

  function onClick(event) {
    if (event.target?.closest?.("[data-k169-open]")) return setPanel(!panelOpen);
    if (event.target?.closest?.("[data-k169-close]")) return setPanel(false);
    const pref = event.target?.closest?.("[data-k169-pref]");
    if (pref) return togglePref(pref.dataset.k169Pref);
    if (event.target?.closest?.("[data-k169-focus]")) return focusActiveSurface();
    const action = event.target?.closest?.("[data-k169-action]");
    if (action) return handleAction(action.dataset.k169Action);
    if (panelOpen && !event.target?.closest?.("#k169Panel,[data-k169-open]")) setPanel(false);
    setTimeout(syncStatus, 0);
  }

  function onKeydown(event) {
    if (event.key === "Escape" && panelOpen) {
      event.preventDefault();
      return setPanel(false);
    }
    if (editable(event.target) || !event.altKey || event.ctrlKey || event.metaKey) return;
    const action = ({s: "save", l: "load", m: "map", k: "export", u: "panel"})[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    if (action === "panel") setPanel(!panelOpen);
    else handleAction(action);
  }

  function visualAudit() {
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      title: document.title,
      dataBuild: document.documentElement.dataset.korytoBuild || null,
      utility: Boolean(document.getElementById("k169Utility")),
      panelOpen,
      largeText: document.documentElement.classList.contains("k169-large-text"),
      highContrast: document.documentElement.classList.contains("k169-high-contrast"),
      reducedMotion: document.documentElement.classList.contains("k169-reduced-motion"),
      activeSurface: activeSurface()?.id || activeSurface()?.className || "body"
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    INFO.applyLabels?.();
    ensureUtility();
    applyPrefs();
    syncStatus();
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeydown, true);
    globalThis.addEventListener("hashchange", syncStatus);
    document.documentElement.classList.add("k169-ready");
    globalThis.KorytoUI169 = {VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, applyPrefs, syncStatus, focusActiveSurface, visualAudit, install};
    return true;
  }

  install();
})();
