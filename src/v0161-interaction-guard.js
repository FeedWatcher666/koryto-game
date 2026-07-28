"use strict";
(() => {
  let installed = false;

  function buildInfo() {
    return globalThis.KorytoBuildInfo || {
      displayVersion: "0.17.1 TEST.1",
      buildVersion: "0.17.1-test.1",
      saveVersion: "0.14.3-test.2",
      saveSchema: 1,
      applyLabels: () => false
    };
  }

  function canonicalLabels() {
    return buildInfo().applyLabels?.() || false;
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    const root = document.getElementById("v0160Root");
    if (!root) return false;
    root.addEventListener("click", event => event.stopPropagation());
    root.dataset.v0161InteractionGuard = "ready";
    canonicalLabels();
    installed = true;
    return true;
  }

  document.addEventListener("DOMContentLoaded", install, {once: true});
  setTimeout(install, 0);

  globalThis.KorytoInteractionGuard161 = {install, buildInfo, canonicalLabels};
})();
