"use strict";
(() => {
  const info = Object.freeze({
    displayVersion: "0.16.9 TEST.2",
    buildVersion: "0.16.9-test.2",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1,
    title: "Koryto 0.16.9 TEST.2 – Release Integrity",
    description: "Koryto 0.16.9 TEST.2: stabilizovaný offline release candidate s jednotnou verzí, mapou a pevným herním viewportem."
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
        .replace(/\s*·\s*0\.\d+\.\d+\s+(?:TEST\.\d+|RC\d+)$/u, "")
        .trim();
      footer.textContent = `${base} · ${info.displayVersion}`;
    }
    if (document.documentElement?.dataset) document.documentElement.dataset.korytoBuild = info.buildVersion;
    return true;
  }

  globalThis.KorytoBuildInfo = Object.freeze({...info, applyLabels});
  applyLabels();
})();
