"use strict";
(() => {
  let installed = false;
  let playtestLoading = false;

  function buildInfo() {
    return globalThis.KorytoBuildInfo || {
      displayVersion: "0.16.9 TEST.2",
      buildVersion: "0.16.9-test.2",
      saveVersion: "0.14.3-test.2",
      saveSchema: 1,
      applyLabels: () => false
    };
  }

  function canonicalLabels() {
    return buildInfo().applyLabels?.() || false;
  }

  function playtestRequested() {
    if (typeof location === "undefined") return false;
    return new URLSearchParams(location.search).get("playtest") === "1";
  }

  function loadPlaytestLayer() {
    if (playtestLoading || typeof document === "undefined" || !playtestRequested()) return false;
    playtestLoading = true;
    if (!document.querySelector('link[data-k162-style]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "styles/v0162-playtest.css";
      link.dataset.k162Style = "1";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-k162-runtime]')) {
      const script = document.createElement("script");
      script.src = "src/v0162-playtest.js";
      script.dataset.k162Runtime = "1";
      document.body.appendChild(script);
    }
    return true;
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    const root = document.getElementById("v0160Root");
    if (!root) return false;
    root.addEventListener("click", event => event.stopPropagation());
    root.dataset.v0161InteractionGuard = "ready";
    canonicalLabels();
    loadPlaytestLayer();
    installed = true;
    return true;
  }

  document.addEventListener("DOMContentLoaded", install, {once: true});
  setTimeout(install, 0);

  globalThis.KorytoInteractionGuard161 = {
    install,
    buildInfo,
    canonicalLabels,
    playtestRequested,
    loadPlaytestLayer
  };
})();
