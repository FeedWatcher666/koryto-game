"use strict";
(() => {
  const INFO = globalThis.KorytoBuildInfo || {
    displayVersion: "0.17.3 TEST.1",
    buildVersion: "0.17.3-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1
  };
  let queued = false;
  let lastSurface = null;

  const visible = element => {
    if (!(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0 &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < innerWidth &&
      rect.top < innerHeight;
  };

  const bottomNavigation = () =>
    document.querySelector("#v0160Root .k16-bottom, #v0165Root .k165-bottom");

  const surfaceKey = () => {
    const activeScreen = document.querySelector(".screen.active")?.id || "none";
    const phase = globalThis.KorytoApp?.getState?.()?.phase || "none";
    const campaignView = globalThis.KorytoUI165?.visualAudit?.()?.activeView || "none";
    return `${activeScreen}:${phase}:${campaignView}`;
  };

  function installRoot() {
    if (typeof document === "undefined") return false;
    const html = document.documentElement;
    html.classList.add("k173-playability-reset");
    html.dataset.k173Playability = INFO.buildVersion;
    INFO.applyLabels?.();
    return true;
  }

  function resetNestedScroll() {
    document.querySelectorAll(
      ".k168-class-grid,.k168-identity-panel,.k168-profession-panel,.k168-candidate-preview," +
      ".k16-left,.k16-right,.k165-event-text"
    ).forEach(element => {
      if (element.scrollTop && getComputedStyle(element).overflowY === "visible") {
        element.scrollTop = 0;
      }
    });
  }

  function removeNativeMapTooltips() {
    document.querySelectorAll(".k16-hotspot[title]").forEach(hotspot => {
      const label = hotspot.getAttribute("title")?.trim();
      if (label && !hotspot.getAttribute("aria-label")) {
        hotspot.setAttribute("aria-label", label);
      }
      hotspot.removeAttribute("title");
    });
  }

  function sync() {
    installRoot();
    const nextSurface = surfaceKey();
    if (lastSurface && nextSurface !== lastSurface) {
      requestAnimationFrame(() => globalThis.scrollTo({top: 0, left: 0, behavior: "auto"}));
    }
    lastSurface = nextSurface;
    resetNestedScroll();
    // The map renderer replaces action buttons as campaign state changes.
    // Re-apply the previous turn-clarity decoration after that replacement so
    // the exact early-end penalty does not disappear from the live UI.
    globalThis.KorytoUI172?.decorate?.();
    removeNativeMapTooltips();
    return true;
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      sync();
    }, 0);
  }

  function overlapWithNavigation(element) {
    const nav = bottomNavigation();
    if (!visible(element) || !visible(nav)) return 0;
    const a = element.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return Math.round(width * height);
  }

  function audit() {
    const activeScreen = document.querySelector(".screen.active");
    const root = document.documentElement;
    const primary = [
      document.getElementById("confirmBtn"),
      document.querySelector("#v0165Root [data-k165-choice]:not([disabled])"),
      document.querySelector("#v0165Root [data-k165-continue]"),
      document.querySelector("#v0160Root [data-k16-end]")
    ].filter(visible);
    const nestedScrollers = [
      ".k168-class-grid",
      ".k168-profession-panel",
      ".k16-left",
      ".k16-right",
      ".k165-event-text"
    ].filter(selector => {
      const element = document.querySelector(selector);
      if (!visible(element)) return false;
      const style = getComputedStyle(element);
      return /(auto|scroll)/.test(style.overflowY) &&
        element.scrollHeight > element.clientHeight + 1;
    });

    return {
      buildVersion: INFO.buildVersion,
      saveVersion: INFO.saveVersion,
      saveSchema: INFO.saveSchema,
      active: root.classList.contains("k173-playability-reset"),
      viewport: {width: innerWidth, height: innerHeight},
      surface: surfaceKey(),
      documentScrollable: document.documentElement.scrollHeight > innerHeight + 1,
      bodyOverflowY: getComputedStyle(document.body).overflowY,
      activeScreenOverflowY: activeScreen ? getComputedStyle(activeScreen).overflowY : null,
      nestedScrollers,
      primaryActions: primary.length,
      coveredPrimaryActions: primary.filter(element => overlapWithNavigation(element) > 0).length
    };
  }

  function install() {
    if (typeof document === "undefined") return false;
    globalThis.addEventListener?.("load", sync, {once: true});
    globalThis.addEventListener?.("resize", queueSync, {passive: true});
    document.addEventListener("click", queueSync, true);
    document.addEventListener("change", queueSync, true);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", sync, {once: true});
    } else {
      sync();
    }
    return true;
  }

  globalThis.KorytoUI173 = Object.freeze({
    VERSION: INFO.displayVersion,
    BUILD_VERSION: INFO.buildVersion,
    SAVE_VERSION: INFO.saveVersion,
    SAVE_SCHEMA: INFO.saveSchema,
    sync,
    audit,
    install
  });
  install();
})();
