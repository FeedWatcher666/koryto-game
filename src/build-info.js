"use strict";
(() => {
  const info = Object.freeze({
    displayVersion: "0.20.0 TEST.1",
    buildVersion: "0.20.0-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1,
    title: "Koryto 0.20.0 TEST.1 – D&D RPG Reset",
    description: "Koryto 0.20.0 TEST.1: původní satirické politické D&D RPG s jasným tutorialem, šesti atributy a soustředěným rozhraním."
  });

  function applyLabels() {
    if (typeof document === "undefined") return false;
    document.title = info.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", info.description);
    const brand = document.querySelector(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${info.displayVersion}`;
    const footer = document.querySelector(".footer-note");
    if (footer) {
      const base = String(footer.textContent || "")
        .replace(/(?:\s*·\s*0\.\d+\.\d+\s+(?:TEST\.\d+|RC\d+))+$/u, "")
        .trim();
      footer.textContent = `${base} · ${info.displayVersion}`;
    }
    if (document.documentElement?.dataset) document.documentElement.dataset.korytoBuild = info.buildVersion;
    return true;
  }

  function installDndResetLayer() {
    if (typeof document === "undefined") return false;
    const query = new URLSearchParams(globalThis.location?.search || "");
    if (query.has("legacy")) return false;
    if (!document.querySelector('link[data-v0200-dnd-reset]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "styles/v0200-dnd-rpg-reset.css";
      link.dataset.v0200DndReset = "1";
      document.head.append(link);
    }
    if (!document.querySelector('script[data-v0200-dnd-reset]')) {
      const script = document.createElement("script");
      script.src = "src/v0200-dnd-rpg-reset.js";
      script.dataset.v0200DndReset = "1";
      document.body.append(script);
    }
    return true;
  }

  function installLegacyReconciliation() {
    if (typeof globalThis.setInterval === "function" && !globalThis.setInterval.__korytoBuildInfoWrapped) {
      const nativeSetInterval = globalThis.setInterval.bind(globalThis);
      const wrappedSetInterval = function(callback, delay, ...args) {
        if (typeof callback !== "function") return nativeSetInterval(callback, delay, ...args);
        const source = Function.prototype.toString.call(callback);
        const writesLegacyVersion = /updateVersion|canonicalLabels/.test(source);
        if (!writesLegacyVersion) return nativeSetInterval(callback, delay, ...args);
        return nativeSetInterval(function(...callbackArgs) {
          const result = callback(...callbackArgs);
          queueMicrotask(applyLabels);
          return result;
        }, delay, ...args);
      };
      wrappedSetInterval.__korytoBuildInfoWrapped = true;
      globalThis.setInterval = wrappedSetInterval;
    }

    if (typeof document !== "undefined" && !document.documentElement?.dataset?.korytoBuildReconcile) {
      const reconcile = () => setTimeout(applyLabels, 140);
      document.addEventListener("click", reconcile, true);
      document.addEventListener("change", reconcile, true);
      globalThis.addEventListener?.("load", applyLabels, {once: true});
      if (document.documentElement?.dataset) document.documentElement.dataset.korytoBuildReconcile = "1";
    }
  }

  globalThis.KorytoBuildInfo = Object.freeze({...info, applyLabels, installLegacyReconciliation, installDndResetLayer});
  installLegacyReconciliation();
  applyLabels();
  if (document.readyState === "complete") installDndResetLayer();
  else globalThis.addEventListener?.("load", installDndResetLayer, {once: true});
})();
