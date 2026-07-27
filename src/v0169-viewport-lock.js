"use strict";
(() => {
  const VERSION = "0.16.9 VIEWPORT LOCK";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;

  let installed = false;
  let queued = false;

  const activeScreen = () => document.querySelector(".screen.active");

  function syncViewport() {
    if (typeof document === "undefined") return false;
    const html = document.documentElement;
    const screen = activeScreen();
    const screenId = screen?.id || (document.documentElement.classList.contains("k16-active") ? "v0160Root" : "none");
    const pregame = screenId === "startScreen" || screenId === "creationScreen";

    html.classList.add("k169-viewport-lock");
    html.classList.toggle("k169-pregame", pregame);
    html.dataset.k169ActiveScreen = screenId;

    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    document.querySelectorAll(".screen").forEach(item => {
      item.setAttribute("aria-hidden", String(!item.classList.contains("active")));
    });

    const desk = document.getElementById("v0148Shell");
    if (desk) desk.dataset.k169Viewport = desk.hidden ? "closed" : "internal-scroll";

    const cleanRoot = document.getElementById("v0160Root");
    if (cleanRoot) cleanRoot.dataset.k169Viewport = "locked";

    return true;
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      syncViewport();
    }, 0);
  }

  function wrapGlobal(name) {
    const original = globalThis[name];
    if (typeof original !== "function" || original.__k169ViewportWrapped) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      queueSync();
      return result;
    };
    wrapped.__k169ViewportWrapped = true;
    globalThis[name] = wrapped;
  }

  function wrapDesk() {
    const visual = globalThis.KorytoVisual148;
    if (!visual || typeof visual.openDesk !== "function" || visual.openDesk.__k169ViewportWrapped) return;
    const original = visual.openDesk;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      queueSync();
      return result;
    };
    wrapped.__k169ViewportWrapped = true;
    visual.openDesk = wrapped;
  }

  function visualAudit() {
    const desk = document.getElementById("v0148Shell");
    const screen = activeScreen();
    return {
      version: VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      activeScreen: screen?.id || null,
      viewportLocked: document.documentElement.classList.contains("k169-viewport-lock"),
      bodyOverflow: getComputedStyle(document.body).overflow,
      screenOverflow: screen ? getComputedStyle(screen).overflowY : null,
      deskInternalScroll: desk && !desk.hidden ? getComputedStyle(document.getElementById("v0148Content")).overflowY : null,
      pregameNavigationHidden: document.documentElement.classList.contains("k169-pregame")
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    ["renderAll", "showMap", "showLocation", "showEvent", "startDebate", "showCoalitionScreen", "showEnding", "newGame", "load"].forEach(wrapGlobal);
    wrapDesk();
    document.addEventListener("click", queueSync, true);
    document.addEventListener("change", queueSync);
    globalThis.addEventListener("resize", queueSync, {passive: true});
    globalThis.addEventListener("orientationchange", queueSync, {passive: true});
    queueSync();
    globalThis.KorytoViewportLock169 = {
      VERSION,
      SAVE_VERSION,
      SAVE_SCHEMA,
      syncViewport,
      queueSync,
      visualAudit,
      install
    };
    return true;
  }

  install();
})();
