"use strict";
(() => {
  const VERSION = "0.15.2 TEST.1";
  const BUILD_VERSION = "0.15.2-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const ASSETS = Object.freeze({
    map: "assets/v0152/map.webp",
    staff: "assets/v0152/staff.webp",
    event: "assets/v0152/event.webp",
    debate: "assets/v0152/debate.webp",
    coalition: "assets/v0152/coalition.webp",
    portraitCandidate: "assets/v0151/portrait-candidate.webp",
    portraitStrategist: "assets/v0151/portrait-brazda.webp",
    portraitSpokeswoman: "assets/v0151/portrait-daniela.webp",
    portraitFinance: "assets/v0151/portrait-bohumil.webp",
    portraitDonor: "assets/v0151/portrait-holub.webp",
    rival: "assets/v0151/portrait-holub.webp"
  });
  const hotspotPositions = { pub:[18,18], townhall:[43,31], school:[72,20], paper:[78,51], pitch:[11,79], jzd:[34,83], meadow:[37,48], hq:[76,84] };
  const visualLabels = { pub:"Hospoda U Tří lip", townhall:"Radnice", school:"Škola", paper:"Redakce", pitch:"Stadion", jzd:"Sídliště / JZD", meadow:"Náměstí / louka", hq:"Kulturní dům / štáb" };
  let installed = false;
  let queued = false;
  const stateOf = () => globalThis.KorytoApp?.getState?.() || (typeof state !== "undefined" ? state : null);
  const activeQuests = target => globalThis.KorytoVisual150?.activeQuests?.(target) || [];
  const phaseOf = target => globalThis.KorytoVisual151?.phaseOf?.(target) || target?.phase || "map";

  function canonicalLabels() {
    const title = `Koryto ${VERSION} – reference match pass`;
    const description = `Koryto ${VERSION}: hratelná česká komunální politická strategie ve vizuálním směru schválené předlohy.`;
    const titleNode = document.querySelector?.("title");
    if (titleNode) titleNode.textContent = title;
    try { document.title = title; } catch (_) {}
    const meta = document.querySelector?.('meta[name="description"]');
    meta?.setAttribute?.("content", description);
    const brand = document.querySelector?.(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const footer = document.querySelector?.(".footer-note");
    if (footer) {
      const clean = String(footer.textContent || "").replace(/\s*·\s*0\.(?:14|15)(?:\.\d+)?\s+(?:TEST\.\d+|RC\d+)$/u, "");
      footer.textContent = `${clean} · ${VERSION}`;
    }
    const build = document.querySelector?.(".v0150-build");
    if (build) build.textContent = `Build ${BUILD_VERSION} · save ${SAVE_VERSION} · schema ${SAVE_SCHEMA}`;
    document.documentElement.dataset.korytoBuild = BUILD_VERSION;
  }

  function installAssetVariables() {
    const root = document.documentElement;
    if (!root?.style) return;
    const variables = { map:"--v152-map", staff:"--v152-staff", event:"--v152-event", debate:"--v152-debate", coalition:"--v152-coalition", portraitCandidate:"--v152-candidate", rival:"--v152-rival" };
    Object.entries(variables).forEach(([key, variable]) => root.style.setProperty(variable, `url("${ASSETS[key]}")`));
    root.dataset.v0152Assets = "ready";
  }

  function applyTopbar() {
    document.getElementById("v0150Logo")?.setAttribute("aria-label", "Koryto – zpět na mapu");
    for (const [id, label] of Object.entries({v0150Trust:"DŮVĚRA",v0150Influence:"VLIV",v0150Money:"PENÍZE"})) {
      const stat = document.getElementById(id)?.closest?.(".v0150-stat");
      if (stat) stat.dataset.v0152Label = label;
    }
  }

  function applyMap(target) {
    const mapView = document.getElementById("mapView");
    const map = document.getElementById("map");
    if (!mapView || !map) return;
    mapView.classList.add("v0152-map-view");
    map.classList.add("v0152-map-reference");
    const questCounts = activeQuests(target).reduce((counts, quest) => { counts[quest.location] = (counts[quest.location] || 0) + 1; return counts; }, {});
    map.querySelectorAll?.("[data-loc]").forEach(button => {
      const id = button.dataset.loc;
      const pos = hotspotPositions[id];
      if (pos) {
        button.style.setProperty("--v0152-x", `${pos[0]}%`);
        button.style.setProperty("--v0152-y", `${pos[1]}%`);
      }
      button.classList.add("v0152-map-hotspot");
      button.dataset.v0152Count = questCounts[id] || "";
      button.setAttribute("aria-label", visualLabels[id] || id);
      button.title = visualLabels[id] || id;
    });
    document.getElementById("v0150MapTitle")?.setAttribute("aria-hidden", "true");
  }

  function applyMapPanels() {
    document.getElementById("v0150RightPanel")?.classList.add("v0152-map-right");
    document.getElementById("v0150LeftPanel")?.classList.add("v0152-map-left");
  }

  function applyEvent() {
    const view = document.getElementById("eventView");
    if (!view || view.classList.contains("hidden")) return;
    view.classList.add("v0152-event-reference");
    view.querySelector?.(".v0151-event-dialogue")?.setAttribute("aria-live", "polite");
    view.querySelectorAll?.(".v0151-event-choice").forEach((choice, index) => {
      choice.dataset.v0152Index = String(index + 1);
      const effects = choice.querySelector?.(".effects");
      if (effects) effects.dataset.v0152Title = "DOPAD ROZHODNUTÍ";
    });
  }

  function applyStaff() {
    const screen = document.querySelector?.(".v0151-staff-screen");
    if (!screen) return;
    screen.classList.add("v0152-staff-reference");
    screen.querySelectorAll?.(".v0151-staff-card").forEach((card, index) => card.style.setProperty("--v0152-card-order", String(index + 1)));
  }

  function applyDebate() {
    const screen = document.getElementById("debateScreen");
    if (!screen || !screen.classList.contains("active")) return;
    screen.classList.add("v0152-debate-reference");
    screen.querySelector?.(".v0151-debate-stage")?.setAttribute("aria-label", "Debatní pódium – kandidát proti rivalovi");
    screen.querySelectorAll?.(".v0151-debate-card").forEach((card, index) => card.dataset.v0152Order = String(index + 1));
  }

  function applyCoalition() {
    const screen = document.getElementById("coalitionScreen");
    if (!screen || !screen.classList.contains("active")) return;
    screen.classList.add("v0152-coalition-reference");
    document.getElementById("v0151CoalitionScene")?.setAttribute("aria-label", "Koaliční vyjednávání u jednacího stolu");
  }

  function refresh() {
    if (typeof document === "undefined") return false;
    const target = stateOf();
    document.documentElement.classList.add("v0152-reference-match");
    document.documentElement.dataset.v0152Mode = phaseOf(target);
    installAssetVariables();
    canonicalLabels();
    applyTopbar();
    applyMap(target);
    applyMapPanels();
    applyEvent();
    applyStaff();
    applyDebate();
    applyCoalition();
    return true;
  }

  function queueRefresh() {
    if (queued) return;
    queued = true;
    setTimeout(() => { queued = false; refresh(); }, 0);
  }

  function wrap(name) {
    const original = globalThis[name];
    if (typeof original !== "function" || original.__v0152) return;
    const wrapped = function (...args) { const result = original.apply(this, args); queueRefresh(); return result; };
    wrapped.__v0152 = true;
    globalThis[name] = wrapped;
  }

  function visualAudit(target = stateOf()) {
    return { version:VERSION, buildVersion:BUILD_VERSION, saveVersion:SAVE_VERSION, saveSchema:SAVE_SCHEMA, mode:phaseOf(target), mapArtwork:Boolean(document.querySelector?.("#map.v0152-map-reference")), mapHotspots:document.querySelectorAll?.("#map .v0152-map-hotspot")?.length || 0, staffReference:Boolean(document.querySelector?.(".v0152-staff-reference")), eventReference:Boolean(document.querySelector?.(".v0152-event-reference")), debateReference:Boolean(document.querySelector?.(".v0152-debate-reference")), coalitionReference:Boolean(document.querySelector?.(".v0152-coalition-reference")), assets:Object.keys(ASSETS).length, ready:Boolean(target) };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    ["renderAll","renderMap","showMap","showLocation","showEvent","renderDebate","renderCoalition","showCoalitionScreen","startDebate","finishDebate","newGame","load"].forEach(wrap);
    document.addEventListener?.("click", queueRefresh);
    document.addEventListener?.("change", queueRefresh);
    queueRefresh();
    return true;
  }

  const api = { VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, ASSETS, hotspotPositions, visualLabels, refresh, queueRefresh, canonicalLabels, installAssetVariables, visualAudit, install };
  globalThis.KorytoReferenceMatch152 = api;
  globalThis.KorytoVisual152 = api;
  globalThis.KorytoTest152 = api;
  install();
})();
