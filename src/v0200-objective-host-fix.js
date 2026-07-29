"use strict";
(() => {
  const BUILD = "0.20.0-test.1";
  if (new URLSearchParams(globalThis.location?.search || "").has("legacy")) return;

  let observer = null;
  let queued = false;

  function activeHost() {
    const root165 = document.querySelector("#v0165Root:not([hidden]) .k165-shell");
    if (root165) return {host: root165, anchor: root165.querySelector(".k165-topbar"), name: "v0165"};

    const root160 = document.querySelector("#v0160Root:not([hidden])");
    if (root160) {
      const host = root160.querySelector(".k16-shell") || root160;
      return {host, anchor: host.querySelector(".k16-topbar"), name: "v0160"};
    }
    return null;
  }

  function placeObjective(objective, target) {
    const correctlyPlaced = objective.parentElement === target.host &&
      (!target.anchor || objective.previousElementSibling === target.anchor);
    if (correctlyPlaced) return;
    if (target.anchor) target.anchor.insertAdjacentElement("afterend", objective);
    else target.host.prepend(objective);
  }

  function placeDetailsToggle(objective) {
    const toggle = document.getElementById("v0200DetailsToggle");
    if (!toggle) return false;
    if (toggle.parentElement !== objective) objective.append(toggle);
    toggle.hidden = false;
    toggle.dataset.v0200ActiveControl = "details";
    return true;
  }

  function sync() {
    const objective = document.getElementById("v0200Objective");
    const target = activeHost();
    if (!objective || !target) return false;

    placeObjective(objective, target);
    placeDetailsToggle(objective);
    objective.hidden = false;
    objective.dataset.v0200Host = target.name;
    return true;
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sync();
    });
  }

  function install() {
    if (observer || !document.body) return;
    observer = new MutationObserver(queueSync);
    observer.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ["class", "hidden"]});
    document.addEventListener("click", queueSync, true);
    document.addEventListener("change", queueSync, true);
    globalThis.addEventListener?.("resize", queueSync, {passive: true});
    setInterval(sync, 350);
    sync();
  }

  globalThis.KorytoObjectiveHostFix = Object.freeze({BUILD_VERSION: BUILD, sync, activeHost});
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, {once: true});
  else install();
})();
