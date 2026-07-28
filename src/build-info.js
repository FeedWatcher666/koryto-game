"use strict";
(() => {
  const info = Object.freeze({
    displayVersion: "0.17.2 TEST.1",
    buildVersion: "0.17.2-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1,
    title: "Koryto 0.17.2 TEST.1 – Turn Clarity",
    description: "Koryto 0.17.2 TEST.1: čitelnější stav tahu, bezpečné ukončení dne a jasné dopady rozhodnutí v politickém RPG."
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

  globalThis.KorytoBuildInfo = Object.freeze({...info, applyLabels, installLegacyReconciliation});
  installLegacyReconciliation();
  applyLabels();
})();
