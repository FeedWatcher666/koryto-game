"use strict";
(() => {
  const INFO = globalThis.KorytoBuildInfo || {
    displayVersion: "0.17.3 TEST.1",
    buildVersion: "0.17.3-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1
  };
  let queued = false;
  let lastSurface = null;

  const visible = element => {
    if (!(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return !element.hidden &&
      !element.inert &&
      element.getAttribute("aria-hidden") !== "true" &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0 &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < innerWidth &&
      rect.top < innerHeight;
  };

  const fullyVisible = element => {
    if (!visible(element)) return false;
    const rect = element.getBoundingClientRect();
    const nav = activeNavigation();
    const navTop = visible(nav) ? nav.getBoundingClientRect().top : innerHeight;
    return rect.top >= -1 && rect.bottom <= navTop + 1 && rect.left >= -1 && rect.right <= innerWidth + 1;
  };

  const activeNavigation = () => {
    if (document.documentElement.classList.contains("k165-active")) {
      return document.querySelector("#v0165Root .k165-bottom");
    }
    if (document.documentElement.classList.contains("k16-active")) {
      return document.querySelector("#v0160Root .k16-bottom");
    }
    return null;
  };

  const surfaceKey = () => {
    const activeScreen = document.querySelector(".screen.active")?.id || "none";
    const phase = globalThis.KorytoApp?.getState?.()?.phase || "none";
    const campaignView = globalThis.KorytoUI165?.visualAudit?.()?.activeView || "none";
    return `${activeScreen}:${phase}:${campaignView}`;
  };

  function installRoot() {
    if (typeof document === "undefined") return false;
    const html = document.documentElement;
    html.classList.add("k173-playability-reset");
    html.dataset.k173Playability = INFO.buildVersion;
    INFO.applyLabels?.();
    return true;
  }

  function removeNativeMapTooltips() {
    document.querySelectorAll(".k16-hotspot[title]").forEach(hotspot => {
      const label = hotspot.getAttribute("title")?.trim();
      if (label && !hotspot.getAttribute("aria-label")) hotspot.setAttribute("aria-label", label);
      hotspot.removeAttribute("title");
    });
  }

  function decorateMap() {
    const actions = document.querySelector("#v0160Root .k16-map-actions");
    const caseAction = document.querySelector("#v0160Root .k16-case-primary [data-k16-location]");
    const endDay = actions?.querySelector("[data-k16-end]");
    if (!actions || !caseAction) return false;

    endDay?.classList.remove("primary");
    endDay?.classList.add("k173-end-day");

    let primary = actions.querySelector("[data-k173-primary]");
    if (!primary) {
      primary = document.createElement("button");
      primary.type = "button";
      primary.className = "primary k173-primary-action";
      primary.dataset.k173Primary = "objective";
      actions.prepend(primary);
    }
    const title = document.querySelector("#v0160Root .k16-case-primary h2")?.textContent?.trim() || "aktivní kauza";
    primary.innerHTML = `<span aria-hidden="true">▶</span><span>POKRAČOVAT: ${escapeHtml(title)}</span>`;
    primary.setAttribute("aria-label", `Pokračovat v hlavní kauze: ${title}`);
    primary.onclick = () => caseAction.click();
    return true;
  }

  function compactEventStory() {
    const copy = document.querySelector("#v0165Root .k165-event-text");
    if (!copy || copy.dataset.k173Compacted === "1") return false;
    const support = copy.querySelector(".k165-support");
    const paragraphs = [...copy.children].filter(node => node.tagName === "P");
    const narrative = paragraphs.slice(1);
    if (narrative.length > 1) {
      const details = document.createElement("details");
      details.dataset.k173Context = "event";
      const summary = document.createElement("summary");
      summary.textContent = "Celý kontext události";
      const body = document.createElement("div");
      narrative.slice(1).forEach(paragraph => body.appendChild(paragraph));
      details.append(summary, body);
      copy.insertBefore(details, support || null);
    }
    copy.dataset.k173Compacted = "1";
    return true;
  }

  function markSurface() {
    const surface = globalThis.KorytoUI165?.visualAudit?.()?.activeView;
    const campaignShell = document.querySelector("#v0165Root .k165-shell");
    const mapShell = document.querySelector("#v0160Root .k16-shell");
    if (campaignShell && surface && surface !== "none") campaignShell.dataset.k173Surface = surface;
    if (mapShell && document.documentElement.classList.contains("k16-active")) mapShell.dataset.k173Surface = "map";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function sync() {
    installRoot();
    const nextSurface = surfaceKey();
    if (lastSurface && nextSurface !== lastSurface && innerWidth <= 820) {
      requestAnimationFrame(() => globalThis.scrollTo({top: 0, left: 0, behavior: "auto"}));
    }
    lastSurface = nextSurface;
    globalThis.KorytoUI172?.decorate?.();
    removeNativeMapTooltips();
    decorateMap();
    compactEventStory();
    markSurface();
    return true;
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      sync();
    }, 0);
  }

  function overlapWithNavigation(element) {
    const nav = activeNavigation();
    if (!visible(element) || !visible(nav)) return 0;
    const a = element.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return Math.round(width * height);
  }

  function audit() {
    const root = document.documentElement;
    const activeScreen = document.querySelector(".screen.active");
    const choices = [...document.querySelectorAll("#v0165Root [data-k165-choice]:not([disabled])")];
    const classCards = [...document.querySelectorAll("#classGrid [data-class]")];
    const hotspots = [...document.querySelectorAll("#v0160Root .k16-hotspot")];
    const primary = [
      document.getElementById("confirmBtn"),
      choices[0],
      document.querySelector("#v0165Root [data-k165-continue]"),
      document.querySelector("#v0160Root [data-k173-primary]"),
      document.querySelector("#v0160Root [data-k16-end]")
    ].filter(visible);

    return {
      buildVersion: INFO.buildVersion,
      saveVersion: INFO.saveVersion,
      saveSchema: INFO.saveSchema,
      active: root.classList.contains("k173-playability-reset"),
      viewport: {width: innerWidth, height: innerHeight},
      surface: surfaceKey(),
      desktopFrame: innerWidth <= 820 || (
        getComputedStyle(document.body).overflowY === "hidden" &&
        document.documentElement.scrollHeight <= innerHeight + 1
      ),
      bodyOverflowY: getComputedStyle(document.body).overflowY,
      activeScreenOverflowY: activeScreen ? getComputedStyle(activeScreen).overflowY : null,
      primaryActions: primary.length,
      coveredPrimaryActions: primary.filter(element => overlapWithNavigation(element) > 0).length,
      visibleChoices: choices.filter(visible).length,
      fullyVisibleChoices: choices.filter(fullyVisible).length,
      visibleClassCards: classCards.filter(visible).length,
      fullyVisibleClassCards: classCards.filter(fullyVisible).length,
      confirmVisible: fullyVisible(document.getElementById("confirmBtn")),
      visibleHotspots: hotspots.filter(visible).length,
      primaryObjective: fullyVisible(document.querySelector("#v0160Root [data-k173-primary]")),
      compactEventContext: Boolean(document.querySelector("#v0165Root [data-k173-context]"))
    };
  }

  function install() {
    if (typeof document === "undefined") return false;
    globalThis.addEventListener?.("load", sync, {once: true});
    globalThis.addEventListener?.("resize", queueSync, {passive: true});
    document.addEventListener("click", queueSync, true);
    document.addEventListener("change", queueSync, true);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync, {once: true});
    else sync();
    return true;
  }

  globalThis.KorytoUI173 = Object.freeze({
    VERSION: INFO.displayVersion,
    BUILD_VERSION: INFO.buildVersion,
    SAVE_VERSION: INFO.saveVersion,
    SAVE_SCHEMA: INFO.saveSchema,
    sync,
    audit,
    install
  });
  install();
})();
