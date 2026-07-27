"use strict";
(() => {
  let installed = false;
  let loading = false;

  function loadPlaytestLayer() {
    if (loading || typeof document === "undefined") return;
    loading = true;
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
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    const root = document.getElementById("v0160Root");
    if (!root) return false;
    root.addEventListener("click", event => event.stopPropagation());
    root.dataset.v0161InteractionGuard = "ready";
    loadPlaytestLayer();
    installed = true;
    return true;
  }

  document.addEventListener("DOMContentLoaded", install, { once: true });
  setTimeout(install, 0);

  globalThis.KorytoInteractionGuard161 = { install, loadPlaytestLayer };
})();
