"use strict";
(() => {
  const VERSION = "0.16.1 TEST.1";
  const BUILD_VERSION = "0.16.1-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;

  const POSITIONS = Object.freeze({
    pub: [27, 31],
    townhall: [44, 40],
    school: [71, 28],
    paper: [82, 55],
    pitch: [45, 78],
    jzd: [23, 76],
    meadow: [58, 49],
    hq: [69, 79]
  });

  const MOBILE_POSITIONS = Object.freeze({
    pub: [22, 29],
    townhall: [45, 38],
    school: [74, 28],
    paper: [79, 55],
    pitch: [45, 78],
    jzd: [21, 75],
    meadow: [56, 49],
    hq: [70, 79]
  });

  const LABELS = Object.freeze({
    pub: "Hospoda U Tří lip",
    townhall: "Radnice",
    school: "Škola",
    paper: "Redakce",
    pitch: "Stadion",
    jzd: "JZD a sídliště",
    meadow: "Náměstí a louka",
    hq: "Kulturní dům a štáb"
  });

  const SHORT_LABELS = Object.freeze({
    pub: "Hospoda",
    townhall: "Radnice",
    school: "Škola",
    paper: "Redakce",
    pitch: "Stadion",
    jzd: "JZD",
    meadow: "Náměstí",
    hq: "Kulturní dům"
  });

  const LOCATION_ICONS = Object.freeze({
    pub: "🍺",
    townhall: "🏛️",
    school: "🏫",
    paper: "📰",
    pitch: "⚽",
    jzd: "🚜",
    meadow: "🌳",
    hq: "🏢"
  });

  const DESKTOP_NAV = Object.freeze([
    ["map", "🗺️", "Mapa"],
    ["quests", "📜", "Kauzy"],
    ["staff", "👥", "Štáb"],
    ["influence", "♛", "Vliv"],
    ["debate", "🎙️", "Debata"],
    ["elections", "🗳️", "Volby"],
    ["coalition", "🤝", "Koalice"],
    ["archive", "🗄️", "Archiv"]
  ]);

  const MOBILE_NAV = Object.freeze([
    ["map", "🗺️", "Mapa"],
    ["quests", "📁", "Kauzy"],
    ["staff", "👥", "Štáb"],
    ["influence", "♛", "Vliv"],
    ["more", "☰", "Další"]
  ]);

  const MORE_NAV = Object.freeze([
    ["debate", "🎙️", "Debata"],
    ["elections", "🗳️", "Volby"],
    ["coalition", "🤝", "Koalice"],
    ["archive", "🗄️", "Archiv"]
  ]);

  let installed = false;
  let queued = false;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = value => Math.max(0, Math.min(100, finite(value)));
  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;
  const locationsOf = () => globalThis.KorytoCoreData?.locations || {};
  const questDefsOf = () => globalThis.KorytoQuestData?.definitions || {};
  const companionsOf = () => globalThis.KorytoCompanionData?.companions || {};
  const companionStoriesOf = () => globalThis.KorytoCompanionData?.companionStoryDefs || {};
  const rivalDefsOf = () => globalThis.KorytoFactionData?.rivalOperationDefs || {};

  function money(value) {
    return `${Math.round(Math.max(0, finite(value)) * 10000).toLocaleString("cs-CZ")} Kč`;
  }

  function deadline(id, target) {
    try {
      return globalThis.KorytoQuestRuntime?.deadline?.(id, target) ?? questDefsOf()[id]?.deadline ?? 13;
    } catch (_) {
      return questDefsOf()[id]?.deadline ?? 13;
    }
  }

  function activeQuests(target) {
    return Object.entries(target?.quests || {})
      .filter(([, quest]) => quest?.status === "active")
      .map(([id, quest]) => {
        const def = questDefsOf()[id] || {};
        return {
          id,
          title: def.title || id,
          desc: def.desc || "Obecní problém čeká na další rozhodnutí.",
          location: def.location || "townhall",
          stage: finite(quest.stage),
          left: deadline(id, target) - finite(target.day, 1)
        };
      })
      .sort((a, b) => a.left - b.left || a.title.localeCompare(b.title, "cs"));
  }

  function isMapActive(target) {
    return Boolean(
      document.getElementById("gameScreen")?.classList.contains("active") &&
      target?.phase === "map" &&
      !target.ended
    );
  }

  function resource(icon, label, value, width, kind = "") {
    return `<article class="k16-resource ${kind}"><span class="k16-resource-icon" aria-hidden="true">${icon}</span><span class="k16-resource-label">${esc(label)}</span><b>${esc(value)}</b><i><u style="width:${clamp(width)}%"></u></i></article>`;
  }

  function title(label, variant = "") {
    return `<h2 class="k16-panel-title ${variant}">${esc(label)}</h2>`;
  }

  function leftPanel(target, quests) {
    const primary = quests[0];
    const progress = primary ? Math.max(1, Math.min(5, primary.stage + 1)) : 0;
    return `<aside class="k16-left">
      <section class="k16-panel k16-case-panel">
        ${title(primary ? "AKTIVNÍ KAUZA" : "PŘEHLED KAMPANĚ", "danger")}
        <div class="k16-case-primary">
          <div class="k16-case-hero" aria-hidden="true">📋</div>
          <div class="k16-case-copy">
            <h2>${esc(primary?.title || "Obec čeká na další tah")}</h2>
            <p>${esc(primary?.desc || "Vyberte na mapě místo, kde chcete pokračovat v kampani.")}</p>
            ${primary ? `<div class="k16-case-meta"><span>◷ TERMÍN</span><b>${primary.left <= 0 ? "DNES" : `${primary.left} dnů`}</b></div>` : ""}
          </div>
          ${primary ? `<div class="k16-progress"><span>POSTUP KAUZOU</span><b>${progress} / 5</b><i><u style="width:${progress * 20}%"></u></i></div>
            <button class="k16-action" type="button" data-k16-location="${esc(primary.location)}">📍 PŘEJÍT NA MÍSTO</button>` : ""}
        </div>
        <div class="k16-desktop-only">
          ${title("DALŠÍ KAUZY")}
          <div class="k16-list">
            ${quests.slice(primary ? 1 : 0, 5).map(item => `<button type="button" data-k16-location="${esc(item.location)}"><span class="mark">${item.left <= 2 ? "!" : "•"}</span><span><b>${esc(item.title)}</b><small>${item.left <= 0 ? "po termínu" : `${item.left} dnů`}</small></span><strong>›</strong></button>`).join("") || '<p class="k16-empty">Žádná další aktivní kauza.</p>'}
          </div>
          <button class="k16-action secondary" type="button" data-k16-nav="quests">ZOBRAZIT VŠECHNY KAUZY</button>
        </div>
      </section>
    </aside>`;
  }

  function mapPanel(target, quests) {
    const locations = locationsOf();
    const counts = quests.reduce((all, quest) => {
      all[quest.location] = (all[quest.location] || 0) + 1;
      return all;
    }, {});
    const order = ["pub", "townhall", "school", "paper", "pitch", "jzd", "meadow", "hq"];

    return `<main class="k16-center">
      <section class="k16-map-card" aria-label="Mapa Dolních Vejprnic">
        <div class="k16-map-banner"><span aria-hidden="true">🛡️</span>DOLNÍ VEJPRNICE</div>
        ${order.map(id => {
          const [x, y] = POSITIONS[id];
          const [mx, my] = MOBILE_POSITIONS[id];
          const count = counts[id] || 0;
          const long = SHORT_LABELS[id].length > 10 ? "long" : "";
          return `<button type="button" class="k16-hotspot ${count ? "hot" : ""} ${long}" data-k16-location="${id}" style="--x:${x}%;--y:${y}%;--mx:${mx}%;--my:${my}%" aria-label="${esc(LABELS[id])}" title="${esc(locations[id]?.name || LABELS[id])}"><span aria-hidden="true">${LOCATION_ICONS[id]}</span><b>${esc(SHORT_LABELS[id])}</b>${count ? `<em>${count}</em>` : ""}</button>`;
        }).join("")}
        <div class="k16-map-vignette" aria-hidden="true"></div>
      </section>
      <section class="k16-map-actions" aria-label="Akce na mapě">
        <button type="button" data-k16-nav="archive">📰 <span>ZPRÁVY</span></button>
        <button type="button" class="primary" data-k16-end>🏁 <span>UKONČIT DEN</span></button>
        <button type="button" data-k16-nav="archive">📅 <span>PŘEHLED DNE</span></button>
        <button type="button" data-k16-nav="influence">♛ <span>MAPA VLIVU</span></button>
      </section>
    </main>`;
  }

  function factionRow(label, value, kind = "") {
    const width = clamp((finite(value) + 100) / 2);
    return `<div class="k16-faction ${kind}"><span>${esc(label)}</span><i><u style="width:${width}%"></u></i><b>${Math.round(finite(value))}</b></div>`;
  }

  function keyPeople(target) {
    const companions = companionsOf();
    const stories = companionStoriesOf();
    const party = Object.entries(target.party || {}).slice(0, 4);
    const used = new Set(party.map(([id]) => id));
    const preview = Object.keys(companions)
      .filter(id => !used.has(id))
      .slice(0, Math.max(0, 4 - party.length))
      .map(id => [id, null]);
    const entries = [...party, ...preview].slice(0, 4);

    return entries.map(([id, member]) => {
      const companion = companions[id] || {};
      const story = stories[id] || {};
      const known = Boolean(member);
      const location = LABELS[story.location] || "v obci";
      const icon = companion.icon || member?.icon || "👤";
      const subtitle = known
        ? (member?.role || companion.role || "Člen štábu")
        : `Potkáte: ${location}`;
      const value = known ? `${Math.round(finite(member?.loyalty, 50))}%` : "?";
      return `<article class="${known ? "known" : "locked"}"><span class="avatar" aria-hidden="true">${esc(icon)}</span><span class="k16-person-copy"><b>${esc(member?.name || companion.name || id)}</b><small>${esc(subtitle)}</small></span><strong>${value}</strong></article>`;
    }).join("");
  }

  function rightPanel(target) {
    const operation = target.rivalOperation || {};
    const definition = rivalDefsOf()[operation.id] || {};
    const momentum = clamp(target.opponent?.momentum || 0);

    return `<aside class="k16-right">
      <section class="k16-panel k16-rival-panel">
        ${title("TLAK RIVALA", "danger")}
        <div class="k16-rival">
          <div class="k16-rival-head"><span class="k16-rival-face" aria-hidden="true">🕴️</span><span><b>Vladimír Věčný</b><small>starosta a rival</small></span><strong>${Math.round(momentum)} %</strong></div>
          <i class="k16-track"><u style="width:${momentum}%"></u></i>
        </div>
        ${title("AKTUÁLNÍ STRATEGIE")}
        <div class="k16-strategy"><span aria-hidden="true">${esc(definition.icon || "🤝")}</span><div><b>${esc(operation.revealed ? (definition.name || operation.id || "Soupeřův tah") : "Lidový kontakt")}</b><p>${esc(operation.id ? (operation.revealed ? (definition.stages?.[Math.max(0, finite(operation.stage, 1) - 1)] || "Soupeř připravuje další krok.") : "Soupeř koordinuje několik tahů a hledá slabinu.") : "Věčný sbírá vzorec vašich rozhodnutí a posiluje vlastní síť.")}</p></div></div>
        <div class="k16-desktop-only">
          ${title("MAPA VLIVU")}
          <div class="k16-factions">
            ${factionRow("Občané", target.factions?.citizens)}
            ${factionRow("Média", target.factions?.press, "press")}
            ${factionRow("JZD", target.factions?.jzd, "jzd")}
            ${factionRow("Staré struktury", target.factions?.oldguard, "oldguard")}
          </div>
        </div>
        ${title("KLÍČOVÍ LIDÉ")}
        <div class="k16-staff">${keyPeople(target)}</div>
        <button class="k16-action secondary k16-desktop-only" type="button" data-k16-nav="influence">ZOBRAZIT MAPU VLIVU</button>
      </section>
    </aside>`;
  }

  function desktopNav() {
    return `<nav class="k16-bottom k16-bottom-desktop" aria-label="Hlavní navigace">${DESKTOP_NAV.map(([id, icon, label]) => `<button type="button" class="${id === "map" ? "active" : ""}" data-k16-nav="${id}" ${id === "map" ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join("")}</nav>`;
  }

  function mobileNav() {
    return `<nav class="k16-bottom k16-bottom-mobile" aria-label="Mobilní navigace">${MOBILE_NAV.map(([id, icon, label]) => `<button type="button" class="${id === "map" ? "active" : ""}" ${id === "more" ? "data-k16-more" : `data-k16-nav="${id}"`} ${id === "map" ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join("")}</nav>`;
  }

  function mobileDrawer() {
    return `<section class="k16-more-drawer" data-k16-drawer hidden aria-label="Další herní sekce"><header><b>DALŠÍ SEKCE</b><button type="button" data-k16-close aria-label="Zavřít nabídku">×</button></header><div>${MORE_NAV.map(([id, icon, label]) => `<button type="button" data-k16-nav="${id}"><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join("")}</div></section>`;
  }

  function ensureRoot() {
    let root = document.getElementById("v0160Root");
    if (!root) {
      root = document.createElement("div");
      root.id = "v0160Root";
      document.body.appendChild(root);
    }
    return root;
  }

  function render(target) {
    const root = ensureRoot();
    const quests = activeQuests(target);
    const trust = clamp(target.stats?.trust);
    const influence = clamp(target.stats?.influence);
    const funds = Math.max(0, finite(target.stats?.funds));
    const weekdays = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
    const day = Math.max(1, finite(target.day, 1));

    root.innerHTML = `<div class="k16-shell">
      <header class="k16-topbar">
        <section class="k16-day"><span class="k16-weather" aria-hidden="true">☀️</span><div><b>Den ${day}</b><span>${weekdays[(day - 1) % 7]}</span><small>Květen, rok 2 · ${Math.max(0, finite(target.actions))} akce</small></div><div class="k16-place">◆ Dolní Vejprnice</div></section>
        <section class="k16-logo"><strong>KORYTO</strong><span>POLITICKÁ RPG STRATEGIE</span></section>
        <section class="k16-resources">${resource("🤝", "DŮVĚRA", `${Math.round(trust)}`, trust)}${resource("♛", "VLIV", `${Math.round(influence)}`, influence, "influence")}${resource("🪙", "PENÍZE", money(funds), Math.min(100, funds * 5), "money")}</section>
        <button type="button" class="k16-settings" data-k16-settings aria-label="Nastavení">⚙</button>
      </header>
      <div class="k16-layout">${leftPanel(target, quests)}${mapPanel(target, quests)}${rightPanel(target)}</div>
      ${desktopNav()}
      ${mobileNav()}
      ${mobileDrawer()}
    </div>`;
    bind(root);
  }

  function navigate(name) {
    if (name === "map") {
      globalThis.showMap?.();
      return;
    }
    if (name === "coalition") {
      const target = stateOf();
      if (target?.coalition?.active && typeof globalThis.showCoalitionScreen === "function") globalThis.showCoalitionScreen();
      else globalThis.KorytoVisual148?.openDesk?.("elections");
      return;
    }
    globalThis.KorytoVisual148?.openDesk?.(name);
  }

  function bind(root) {
    root.querySelectorAll("[data-k16-location]").forEach(button => button.addEventListener("click", () => globalThis.showLocation?.(button.dataset.k16Location)));
    root.querySelectorAll("[data-k16-nav]").forEach(button => button.addEventListener("click", () => {
      const drawer = root.querySelector("[data-k16-drawer]");
      if (drawer) drawer.hidden = true;
      navigate(button.dataset.k16Nav);
    }));
    root.querySelector("[data-k16-end]")?.addEventListener("click", () => document.getElementById("endDayBtn")?.click());
    root.querySelector("[data-k16-settings]")?.addEventListener("click", () => document.getElementById("pixelToggle")?.click());
    root.querySelector("[data-k16-more]")?.addEventListener("click", () => {
      const drawer = root.querySelector("[data-k16-drawer]");
      if (!drawer) return;
      drawer.hidden = !drawer.hidden;
    });
    root.querySelector("[data-k16-close]")?.addEventListener("click", () => {
      const drawer = root.querySelector("[data-k16-drawer]");
      if (drawer) drawer.hidden = true;
    });
  }

  function canonicalLabels() {
    const pageTitle = `Koryto ${VERSION} – Clean UI Layout Polish`;
    document.title = pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", `Koryto ${VERSION}: responzivní komponentový rebuild hlavní mapy pro desktop, tablet a mobil.`);
  }

  function refresh() {
    if (typeof document === "undefined") return false;
    const target = stateOf();
    const active = isMapActive(target);
    document.documentElement.classList.toggle("k16-active", active);
    const root = ensureRoot();
    root.hidden = !active;
    if (active) render(target);
    canonicalLabels();
    return active;
  }

  function queueRefresh() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      refresh();
    }, 0);
  }

  function wrap(name) {
    const original = globalThis[name];
    if (typeof original !== "function" || original.__v0160Wrapped) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      queueRefresh();
      return result;
    };
    wrapped.__v0160Wrapped = true;
    globalThis[name] = wrapped;
  }

  function visualAudit(target = stateOf()) {
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      active: isMapActive(target),
      root: Boolean(document.getElementById("v0160Root")),
      hotspots: document.querySelectorAll("#v0160Root .k16-hotspot").length,
      legacyAppHidden: document.documentElement.classList.contains("k16-active"),
      keyPeople: document.querySelectorAll("#v0160Root .k16-staff article").length,
      desktopNavItems: document.querySelectorAll("#v0160Root .k16-bottom-desktop button").length,
      mobileNavItems: document.querySelectorAll("#v0160Root .k16-bottom-mobile button").length,
      mobileDrawerItems: document.querySelectorAll("#v0160Root .k16-more-drawer [data-k16-nav]").length,
      questCount: activeQuests(target).length,
      layoutPolish: true,
      responsive: true
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    ["renderAll", "showMap", "showLocation", "showEvent", "newGame", "load", "finishDebate", "showCoalitionScreen"].forEach(wrap);
    document.addEventListener("click", queueRefresh);
    document.addEventListener("change", queueRefresh);
    queueRefresh();
    return true;
  }

  const api = {
    VERSION,
    BUILD_VERSION,
    SAVE_VERSION,
    SAVE_SCHEMA,
    POSITIONS,
    MOBILE_POSITIONS,
    LABELS,
    SHORT_LABELS,
    LOCATION_ICONS,
    activeQuests,
    refresh,
    queueRefresh,
    visualAudit,
    install
  };

  globalThis.KorytoUI160 = api;
  globalThis.KorytoTest160 = api;
  install();
})();
