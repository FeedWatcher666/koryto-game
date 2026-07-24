"use strict";
(() => {
  let installed = false;

  function install() {
    if (installed || typeof document === "undefined") return installed;
    const root = document.getElementById("v0160Root");
    if (!root) return false;
    root.addEventListener("click", event => event.stopPropagation());
    root.dataset.v0161InteractionGuard = "ready";
    installed = true;
    return true;
  }

  document.addEventListener("DOMContentLoaded", install, { once: true });
  setTimeout(install, 0);

  globalThis.KorytoInteractionGuard161 = { install };
})();
