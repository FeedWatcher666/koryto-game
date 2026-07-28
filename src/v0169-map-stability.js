"use strict";
(() => {
  const INFO = globalThis.KorytoBuildInfo || {displayVersion:"0.17.1 TEST.1",buildVersion:"0.17.1-test.1",saveVersion:"0.14.3-test.2",saveSchema:1};
  const VERSION = `${INFO.displayVersion} MAP STABILITY`;
  const SAVE_VERSION = INFO.saveVersion;
  const SAVE_SCHEMA = INFO.saveSchema;

  let installed = false;
  let queued = false;
  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;

  function mapIsActive(target = stateOf()) {
    return Boolean(target && !target.ended && target.phase === "map" && document.getElementById("gameScreen")?.classList.contains("active"));
  }

  function openUtility() {
    document.querySelector("[data-k169-open]")?.click();
  }

  function setNavigationDisabled(nav, disabled) {
    nav.hidden = Boolean(disabled);
    nav.inert = Boolean(disabled);
    nav.setAttribute("aria-hidden", String(Boolean(disabled)));
    if (disabled) nav.setAttribute("data-k169-disabled-nav", "true");
    else nav.removeAttribute("data-k169-disabled-nav");
  }

  function syncLegacyNavigation(active) {
    const k165Active = document.documentElement.classList.contains("k165-active");
    const legacy = [...document.querySelectorAll("#v0148Nav,.v0148-nav")];
    const campaign = [...document.querySelectorAll(".k165-bottom")];
    legacy.forEach(nav => setNavigationDisabled(nav, active || k165Active));
    campaign.forEach(nav => setNavigationDisabled(nav, active));
    return legacy.length + campaign.length;
  }

  function forceCanonicalMap() {
    if (typeof document === "undefined") return false;
    const target = stateOf();
    const active = mapIsActive(target);
    const html = document.documentElement;
    html.classList.toggle("k169-map-stable", active);
    syncLegacyNavigation(active);
    if (!active) return false;

    target.ui = target.ui || {};
    target.ui.pixelMap = true;
    document.getElementById("app")?.classList.remove("pixel-off");
    html.classList.add("k16-active", "k163-active", "k163-map-view");
    html.classList.remove("k163-staff-view");

    const root = document.getElementById("v0160Root");
    if (root) {
      root.hidden = false;
      root.dataset.k169MapStable = "canonical";
    }

    const legacyToggle = document.getElementById("pixelToggle");
    if (legacyToggle) {
      legacyToggle.hidden = true;
      legacyToggle.inert = true;
      legacyToggle.setAttribute("aria-hidden", "true");
      legacyToggle.tabIndex = -1;
    }

    document.querySelectorAll("#v0160Root .k16-hotspot").forEach(button => {
      button.removeAttribute("title");
      button.dataset.k169StableHitbox = "true";
    });
    return true;
  }

  function queueStabilize() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      forceCanonicalMap();
    }, 0);
  }

  function wrap(name) {
    const original = globalThis[name];
    if (typeof original !== "function" || original.__k169MapStabilityWrapped) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      queueStabilize();
      return result;
    };
    wrapped.__k169MapStabilityWrapped = true;
    globalThis[name] = wrapped;
  }

  function captureControls(event) {
    const settings = event.target?.closest?.("[data-k16-settings],[data-k163-settings],#pixelToggle");
    if (settings) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openUtility();
      return;
    }
    queueStabilize();
  }

  function visualAudit(target = stateOf()) {
    const hotspots = [...document.querySelectorAll("#v0160Root .k16-hotspot")];
    const visibleNavigation = [...document.querySelectorAll("nav,.k16-bottom")].filter(nav => {
      const style = getComputedStyle(nav);
      return !nav.hidden && !nav.inert && style.display !== "none" && style.visibility !== "hidden";
    });
    return {
      version: VERSION,
      buildVersion: INFO.buildVersion,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      active: mapIsActive(target),
      canonicalArt: document.documentElement.classList.contains("k169-map-stable"),
      stableRoot: document.getElementById("v0160Root")?.dataset.k169MapStable || null,
      hotspotCount: hotspots.length,
      nativeTooltips: hotspots.filter(button => button.hasAttribute("title")).length,
      legacyPixelToggleHidden: Boolean(document.getElementById("pixelToggle")?.hidden),
      visibleNavigationCount: visibleNavigation.length,
      disabledLegacyNavigationCount: document.querySelectorAll("[data-k169-disabled-nav='true']").length
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    ["showMap", "renderAll", "newGame", "load"].forEach(wrap);
    document.addEventListener("click", captureControls, true);
    document.addEventListener("change", queueStabilize);
    globalThis.addEventListener("resize", queueStabilize, {passive: true});
    queueStabilize();
    globalThis.KorytoMapStability169 = {VERSION, SAVE_VERSION, SAVE_SCHEMA, mapIsActive, forceCanonicalMap, syncLegacyNavigation, queueStabilize, visualAudit, install};
    return true;
  }

  install();
})();
