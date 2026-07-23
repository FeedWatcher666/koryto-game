"use strict";
(C => {
  if (!C) return;
  let refreshQueued = false;
  let installed = false;
  const { VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, stateOf, activeQuests, phaseOf, ensureTopbar, ensureSystemMenu, ensureBottomNav, ensureGamePanels, ensureMapChrome, ensureScreenTitles, applyCanonicalLabels, restoreSettings, renderTopbar, renderLeftPanel, renderRightPanel, decorateScenes, updateMode, closeSystemMenu, closeVisualQa, openVisualQa, navigate } = C;
  function refresh() {
    const target = stateOf();
    if (typeof document === "undefined") return false;
    ensureTopbar();
    ensureSystemMenu();
    ensureBottomNav();
    ensureGamePanels();
    ensureMapChrome();
    ensureScreenTitles();
    applyCanonicalLabels();
    restoreSettings();
    renderTopbar(target);
    renderLeftPanel(target);
    renderRightPanel(target);
    decorateScenes(target);
    updateMode(target);
    document.documentElement.dataset.korytoVisual = BUILD_VERSION;
    return true;
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    setTimeout(() => {
      refreshQueued = false;
      refresh();
    }, 0);
  }

  function wrap(name) {
    const original = globalThis[name];
    if (typeof original !== "function" || original.__v0150) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      queueRefresh();
      return result;
    };
    wrapped.__v0150 = true;
    globalThis[name] = wrapped;
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    document.documentElement.classList.add("v0150-identity");
    ["renderAll", "renderMap", "showMap", "showLocation", "showEvent", "renderDebate", "renderCoalition", "newGame", "load", "startDebate", "finishDebate"].forEach(wrap);
    document.addEventListener("click", queueRefresh);
    document.addEventListener("change", queueRefresh);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeSystemMenu();
        closeVisualQa();
      }
    });
    queueRefresh();
    if (location.search.includes("visualqa=1")) setTimeout(openVisualQa, 0);
    return true;
  }

  function visualAudit(target = stateOf()) {
    const map = document.getElementById("map");
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      shell: Boolean(document.getElementById("v0150Topbar")),
      bottomNav: Boolean(document.getElementById("v0150BottomNav")),
      sidePanels: Boolean(document.getElementById("v0150LeftPanel") && document.getElementById("v0150RightPanel")),
      mapLocations: map?.querySelectorAll?.("[data-loc]")?.length || 0,
      activeQuests: activeQuests(target).length,
      phase: phaseOf(target),
      ready: Boolean(target)
    };
  }

  C.queueRefresh = queueRefresh;
  const api = { VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, activeQuests, refresh, queueRefresh, navigate, openVisualQa, visualAudit, install };
  globalThis.KorytoVisual150 = api;
  globalThis.KorytoTest150 = api;
  install();
})(globalThis.KorytoVisual150Core);
