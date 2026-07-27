"use strict";
(() => {
  const VERSION = "0.16.9 MAP STABILITY";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;

  let installed = false;
  let queued = false;

  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;

  function mapIsActive(target = stateOf()) {
    return Boolean(
      target &&
      !target.ended &&
      target.phase === "map" &&
      document.getElementById("gameScreen")?.classList.contains("active")
    );
  }

  function openUtility() {
    const launcher = document.querySelector("[data-k169-open]");
    if (launcher) launcher.click();
  }

  function forceCanonicalMap() {
    if (typeof document === "undefined") return false;
    const target = stateOf();
    const active = mapIsActive(target);
    const html = document.documentElement;
    html.classList.toggle("k169-map-stable", active);
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
    return {
      version: VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      active: mapIsActive(target),
      canonicalArt: document.documentElement.classList.contains("k169-map-stable"),
      stableRoot: document.getElementById("v0160Root")?.dataset.k169MapStable || null,
      hotspotCount: hotspots.length,
      nativeTooltips: hotspots.filter(button => button.hasAttribute("title")).length,
      legacyPixelToggleHidden: Boolean(document.getElementById("pixelToggle")?.hidden)
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
    globalThis.KorytoMapStability169 = {
      VERSION,
      SAVE_VERSION,
      SAVE_SCHEMA,
      mapIsActive,
      forceCanonicalMap,
      queueStabilize,
      visualAudit,
      install
    };
    return true;
  }

  install();
})();
