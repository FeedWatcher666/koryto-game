"use strict";
(() => {
  const INFO = globalThis.KorytoBuildInfo || {
    displayVersion: "0.17.0 TEST.1",
    buildVersion: "0.17.0-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1
  };
  const VERSION = INFO.displayVersion;
  const BUILD_VERSION = INFO.buildVersion;
  const SAVE_VERSION = INFO.saveVersion;
  const SAVE_SCHEMA = INFO.saveSchema;
  let queued = false;

  const markerRules = Object.freeze([
    [".k16-topbar,.k165-topbar", "campaign-chrome"],
    [".k16-map-card", "village-map"],
    [".k16-left,.k16-case-panel", "case-board"],
    [".k16-right,.k16-rival-panel", "rival-board"],
    [".k16-bottom,.k165-bottom", "primary-navigation"],
    [".k165-location-hero", "location-hero"],
    [".k165-event-story", "event-story"],
    [".k165-choice", "decision-card"],
    [".k165-result-card", "result-card"],
    [".k166-debate-shell,.debate-shell", "debate-stage"],
    [".k167-ending-shell,.ending", "election-night"]
  ]);
  const navIcons = Object.freeze({
    map: "⌂",
    quests: "▤",
    staff: "♟",
    influence: "♛",
    debate: "◉",
    elections: "✉",
    coalition: "◆",
    archive: "▣",
    more: "•••"
  });

  function replaceLeadingText(element, symbol) {
    const node = [...(element?.childNodes || [])]
      .find(item => item.nodeType === 3 && item.nodeValue?.trim());
    if (!node) return false;
    node.nodeValue = node.nodeValue.replace(/^\s*\S+\s*/u, `${symbol} `);
    return true;
  }

  function normalizeIcons() {
    const weather = document.querySelectorAll(".k16-weather,.k165-day > span");
    weather.forEach(element => { element.textContent = "☀"; });

    document.querySelectorAll(".k16-resource-icon,.k165-resource > span").forEach((element, index) => {
      element.textContent = ["♥", "♛", "●"][index % 3];
    });
    document.querySelectorAll(".k16-case-hero").forEach(element => { element.textContent = "▤"; });
    document.querySelectorAll(".k16-strategy > span").forEach(element => { element.textContent = "◆"; });
    document.querySelectorAll(".k16-settings,.k165-settings").forEach(element => { element.textContent = "⚙"; });

    const actionIcons = ["▤", "⚑", "▣", "♛"];
    document.querySelectorAll(".k16-map-actions button").forEach((element, index) => {
      replaceLeadingText(element, actionIcons[index] || "◆");
    });
    document.querySelectorAll(".k16-action").forEach(element => {
      if (/PŘEJÍT NA MÍSTO/u.test(element.textContent || "")) replaceLeadingText(element, "→");
    });

    document.querySelectorAll(".k16-bottom button,.k165-bottom button").forEach(element => {
      const name = element.dataset.k16Nav || element.dataset.k165Nav || (element.hasAttribute("data-k16-more") || element.hasAttribute("data-k165-more") ? "more" : "");
      const icon = element.querySelector("span");
      if (icon && navIcons[name]) icon.textContent = navIcons[name];
    });
  }

  function decorate() {
    if (typeof document === "undefined") return false;
    const html = document.documentElement;
    html.classList.add("k170-foundation");
    html.dataset.korytoVisual = BUILD_VERSION;

    for (const [selector, surface] of markerRules) {
      document.querySelectorAll(selector).forEach(element => {
        if (!element.dataset.k170Surface) element.dataset.k170Surface = surface;
      });
    }

    document.querySelectorAll(".k16-resource,.k165-resource").forEach((element, index) => {
      if (!element.dataset.k170Resource) {
        element.dataset.k170Resource = ["trust", "influence", "money"][index % 3];
      }
    });
    document.querySelectorAll(".k16-hotspot").forEach(element => {
      element.dataset.k170Hotspot = element.dataset.k16Location || "location";
    });
    document.querySelectorAll(".k16-bottom button,.k165-bottom button").forEach(element => {
      if (!element.dataset.k170Nav) {
        element.dataset.k170Nav = element.dataset.k16Nav || element.dataset.k165Nav || "more";
      }
    });

    normalizeIcons();
    INFO.applyLabels?.();
    return true;
  }

  function queueDecorate() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      decorate();
    }, 0);
  }

  function visualAudit() {
    const html = document.documentElement;
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      active: html.classList.contains("k170-foundation"),
      visualMarker: html.dataset.korytoVisual || null,
      markedSurfaces: document.querySelectorAll("[data-k170-surface]").length,
      markedResources: document.querySelectorAll("[data-k170-resource]").length,
      markedHotspots: document.querySelectorAll("[data-k170-hotspot]").length,
      markedNavigation: document.querySelectorAll("[data-k170-nav]").length,
      remoteAssets: [...document.querySelectorAll("link[href],script[src],img[src]")]
        .filter(element => /^https?:/i.test(element.getAttribute("href") || element.getAttribute("src") || ""))
        .length
    };
  }

  function install() {
    if (typeof document === "undefined") return false;
    document.addEventListener("click", queueDecorate);
    document.addEventListener("change", queueDecorate);
    globalThis.addEventListener?.("load", decorate, {once: true});
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", decorate, {once: true});
    } else {
      decorate();
    }
    return true;
  }

  globalThis.KorytoUI170 = Object.freeze({
    VERSION,
    BUILD_VERSION,
    SAVE_VERSION,
    SAVE_SCHEMA,
    decorate,
    normalizeIcons,
    visualAudit,
    install
  });
  install();
})();
