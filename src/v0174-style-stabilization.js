"use strict";
(() => {
  const INFO = globalThis.KorytoBuildInfo || {
    displayVersion: "0.17.4 TEST.1",
    buildVersion: "0.17.4-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1
  };

  let queued = false;
  let observer = null;
  let lastSurface = "boot";
  let utilityWasOpen = false;

  const selectors = Object.freeze({
    panels: [
      ".k16-panel",
      ".k165-parchment",
      ".k165-ledger",
      ".k165-detail-copy",
      ".k165-event-text",
      ".k165-result-copy",
      ".k163-side-panel",
      ".k163-title",
      ".k163-candidate",
      ".k163-tab-board",
      ".k168-identity-panel",
      ".k168-profession-panel",
      ".k168-candidate-preview",
      ".k169-panel"
    ].join(","),
    paperPanels: [
      ".k165-parchment",
      ".k165-event-text",
      ".k165-result-copy"
    ].join(","),
    buttons: [
      ".k16-action",
      ".k16-map-actions button",
      ".k165-back",
      ".k165-primary",
      ".k165-choice",
      ".k165-activity",
      ".k165-quest-card",
      ".k163-actions button",
      ".k163-side-panel > button",
      ".k168-origin-grid button",
      ".k168-class-card",
      "#confirmBtn",
      ".k169-panel button",
      ".k169-launcher"
    ].join(","),
    primaryButtons: [
      ".k173-primary-action",
      ".k165-primary",
      "#confirmBtn",
      ".k16-action.primary",
      ".k16-map-actions button.primary"
    ].join(",")
  });

  function installRoot() {
    if (typeof document === "undefined") return false;
    const html = document.documentElement;
    html.classList.add("k174-style-stabilization");
    html.dataset.k174Style = INFO.buildVersion;
    return true;
  }

  function activeSurface() {
    const html = document.documentElement;
    if (document.getElementById("creationScreen")?.classList.contains("active")) return "candidate";
    if (document.getElementById("debateScreen")?.classList.contains("active")) return "debate";
    if (document.getElementById("coalitionScreen")?.classList.contains("active")) return "coalition";
    if (document.getElementById("endingScreen")?.classList.contains("active")) return "ending";
    if (html.classList.contains("k163-staff-view")) return "staff";
    if (html.classList.contains("k165-active")) {
      const marked = document.querySelector("#v0165Root .k165-shell")?.dataset.k173Surface;
      const audited = globalThis.KorytoUI165?.visualAudit?.()?.activeView;
      return marked || audited || "campaign";
    }
    if (html.classList.contains("k16-active")) return "map";
    if (document.getElementById("startScreen")?.classList.contains("active")) return "start";
    return "unknown";
  }

  function decorateComponents(root = document) {
    root.querySelectorAll?.(selectors.panels).forEach(element => element.classList.add("k-ui-panel"));
    root.querySelectorAll?.(selectors.paperPanels).forEach(element => element.classList.add("k-ui-panel--paper"));
    root.querySelectorAll?.(selectors.buttons).forEach(element => element.classList.add("k-ui-button"));
    root.querySelectorAll?.(selectors.primaryButtons).forEach(element => element.classList.add("k-ui-button--primary"));
  }

  function sync() {
    installRoot();
    const surface = activeSurface();
    document.documentElement.dataset.k174Surface = surface;
    if (surface !== lastSurface) {
      document.documentElement.dataset.k174PreviousSurface = lastSurface;
      lastSurface = surface;
    }
    decorateComponents();
    const utilityPanel = document.querySelector(".k169-panel");
    const utilityOpen = Boolean(utilityPanel && !utilityPanel.hidden);
    if (utilityOpen && !utilityWasOpen) utilityPanel.scrollTop = 0;
    utilityWasOpen = utilityOpen;
    document.documentElement.classList.toggle("k169-panel-open", utilityOpen);
    return surface;
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      sync();
    });
  }

  function box(selector) {
    const element = document.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      selector,
      top: Math.round(rect.top * 10) / 10,
      left: Math.round(rect.left * 10) / 10,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      display: style.display,
      visibility: style.visibility
    };
  }

  function geometry() {
    const surface = activeSurface();
    const campaignSurface = ["quests", "quest", "detail", "location", "event", "result", "campaign"].includes(surface);
    const navSelector = campaignSurface
      ? "#v0165Root .k165-bottom"
      : "#v0160Root .k16-bottom";
    const topSelector = campaignSurface
      ? "#v0165Root .k165-topbar"
      : "#v0160Root .k16-topbar";
    return {
      surface,
      viewport: {width: innerWidth, height: innerHeight},
      topbar: box(topSelector),
      navigation: box(navSelector),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      buildVersion: INFO.buildVersion
    };
  }

  function audit() {
    const state = geometry();
    const root = document.documentElement;
    const primary = [...document.querySelectorAll(
      "[data-k173-primary], [data-k165-continue], #confirmBtn, [data-k165-go-location], .k163-actions button:not(:disabled)"
    )].find(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    });
    const primaryRect = primary?.getBoundingClientRect?.();
    return {
      ...state,
      active: root.classList.contains("k174-style-stabilization"),
      styledPanels: document.querySelectorAll(".k-ui-panel").length,
      styledButtons: document.querySelectorAll(".k-ui-button").length,
      primaryVisible: Boolean(primaryRect && primaryRect.width > 0 && primaryRect.height > 0 && primaryRect.bottom > 0 && primaryRect.top < innerHeight),
      utilityOpen: root.classList.contains("k169-panel-open")
    };
  }

  function installObserver() {
    if (observer || typeof MutationObserver !== "function" || !document.body) return;
    observer = new MutationObserver(queueSync);
    observer.observe(document.body, {childList: true, subtree: true});
  }

  function install() {
    if (typeof document === "undefined") return false;
    installRoot();
    const ready = () => {
      installObserver();
      sync();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, {once: true});
    else ready();
    document.addEventListener("click", queueSync, true);
    document.addEventListener("change", queueSync, true);
    globalThis.addEventListener?.("resize", queueSync, {passive: true});
    return true;
  }

  globalThis.KorytoUI174 = Object.freeze({
    VERSION: INFO.displayVersion,
    BUILD_VERSION: INFO.buildVersion,
    SAVE_VERSION: INFO.saveVersion,
    SAVE_SCHEMA: INFO.saveSchema,
    sync,
    audit,
    geometry,
    install
  });

  install();
})();
