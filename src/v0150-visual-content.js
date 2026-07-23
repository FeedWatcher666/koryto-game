"use strict";
(C => {
  if (!C) return;
  const { VERSION, WEEKDAYS, WEATHER, mapPositions, mapLabels, esc, finite, clamp, stateOf, companionDefsOf, factionDefsOf, money, activeQuests, phaseOf, statBar, navigate } = C;
  function panelHeader(title, variant = "") {
    return `<header class="v0150-panel-title ${variant}"><span>${title}</span></header>`;
  }

  function renderLeftPanel(target) {
    const panel = document.getElementById("v0150LeftPanel");
    if (!panel || !target) return;
    const quests = activeQuests(target);
    const primary = quests[0];
    const progress = primary ? Math.min(5, Math.max(1, primary.stage + 1)) : 0;
    panel.innerHTML = `${panelHeader(primary ? "AKTIVNÍ KAUZA" : "PŘEHLED KAMPANĚ", "danger")}
      <section class="v0150-panel-body v0150-primary-case">
        <div class="v0150-case-art" data-case-location="${esc(primary?.location || "townhall")}"><span>${primary ? "🔎" : "📋"}</span></div>
        <h2>${esc(primary?.title || "Obec čeká na další tah")}</h2>
        <p>${esc(primary?.desc || "Na mapě vyberte místo, kde chcete pokračovat v kampani.")}</p>
        ${primary ? `<div class="v0150-deadline"><span>⌛ Termín</span><b>${primary.left <= 0 ? "DNES" : `${primary.left} dnů`}</b></div>
          <div class="v0150-evidence"><span>POSTUP KAUZOU</span><i><u style="width:${progress * 20}%"></u></i><b>${progress} / 5</b></div>
          <button class="v0150-case-action" type="button" data-v0150-primary-location="${esc(primary.location)}">PŘEJÍT NA MÍSTO</button>` : ""}
      </section>
      ${panelHeader("DALŠÍ KAUZY")}
      <section class="v0150-compact-list">
        ${quests.slice(primary ? 1 : 0, 5).map(item => `<button type="button" data-v0150-location="${esc(item.location)}"><span>${item.left <= 2 ? "!" : "•"}</span><div><b>${esc(item.title)}</b><small>${item.left <= 0 ? "po termínu" : `${item.left} dnů`}</small></div></button>`).join("") || "<p>Žádná další aktivní kauza.</p>"}
      </section>
      <button class="v0150-panel-action" type="button" data-v0150-open="quests">ZOBRAZIT VŠECHNY KAUZY</button>`;
    panel.querySelectorAll("[data-v0150-location]").forEach(button => button.addEventListener("click", () => document.querySelector(`[data-loc="${button.dataset.v0150Location}"]`)?.click()));
    panel.querySelector("[data-v0150-primary-location]")?.addEventListener("click", event => document.querySelector(`[data-loc="${event.currentTarget.dataset.v0150PrimaryLocation}"]`)?.click());
    panel.querySelector("[data-v0150-open]")?.addEventListener("click", () => navigate("quests"));
  }

  function renderRightPanel(target) {
    const panel = document.getElementById("v0150RightPanel");
    if (!panel || !target) return;
    const op = target.rivalOperation || {};
    const opDef = factionDefsOf()[op.id] || {};
    const momentum = clamp(target.opponent?.momentum || 0);
    const party = Object.entries(target.party || {}).slice(0, 4);
    const factionRows = [
      ["Občané", target.factions?.citizens, "good"],
      ["Média", target.factions?.press, "info"],
      ["JZD", target.factions?.jzd, "gold"],
      ["Staré struktury", target.factions?.oldguard, "danger"]
    ];
    panel.innerHTML = `${panelHeader("TLAK RIVALŮ", "danger")}
      <section class="v0150-rivals">
        <article><span class="v0150-rival-face">🕴</span><div><b>Vladimír Věčný</b><small>politická setrvačnost</small></div><strong>${Math.round(momentum)}%</strong></article>
        <div class="v0150-rival-track"><i style="width:${momentum}%"></i></div>
      </section>
      ${panelHeader("AKTUÁLNÍ STRATEGIE")}
      <section class="v0150-strategy-card"><span>${opDef.icon || "🎭"}</span><div><b>${esc(op.revealed ? (opDef.name || op.id) : "Lidem naslouchat")}</b><p>${esc(op.id ? (op.revealed ? (opDef.stages?.[Math.max(0, (op.stage || 1) - 1)] || "Soupeř připravuje další krok.") : "Soupeř koordinuje několik tahů a hledá vaši slabinu.") : "Věčný sbírá vzorec vašich rozhodnutí a posiluje vlastní síť.")}</p><small>Postup ${Math.round(clamp(op.progress || momentum / 2))}%</small></div></section>
      ${panelHeader("MAPA VLIVU")}
      <section class="v0150-influence-mini">${factionRows.map(([label, value, kind]) => `<div><span>${label}</span><i><u class="${kind}" style="width:${clamp((finite(value) + 100) / 2)}%"></u></i><b>${Math.round(finite(value))}</b></div>`).join("")}</section>
      ${panelHeader("KLÍČOVÍ LIDÉ")}
      <section class="v0150-people-list">${party.map(([id, member]) => {
        const def = companionDefsOf()[id] || {};
        return `<article data-v0150-companion="${esc(id)}"><span>${def.icon || member.icon || "👤"}</span><div><b>${esc(member.name || def.name || id)}</b><small>${esc(member.role || def.role || "Člen štábu")}</small></div><strong>${Math.round(finite(member.loyalty, 50))}</strong></article>`;
      }).join("") || "<p>Štáb zatím čeká na první posily.</p>"}</section>
      <button class="v0150-panel-action" type="button" data-v0150-open="influence">ZOBRAZIT MAPU VLIVU</button>`;
    panel.querySelector("[data-v0150-open]")?.addEventListener("click", () => navigate("influence"));
  }

  function ensureMapChrome() {
    const mapView = document.getElementById("mapView");
    const map = document.getElementById("map");
    if (!mapView || !map) return;
    mapView.classList.add("v0150-map-view");
    map.classList.add("v0150-map");
    let title = document.getElementById("v0150MapTitle");
    if (!title) {
      mapView.insertAdjacentHTML("afterbegin", `<header id="v0150MapTitle" class="v0150-title-banner"><small>OBECNÍ KAMPAŇ</small><h1>DOLNÍ VEJPRNICE</h1></header>`);
    }
    map.querySelectorAll("[data-loc]").forEach(button => {
      const id = button.dataset.loc;
      const pos = mapPositions[id];
      if (pos) {
        button.style.setProperty("--v0150-x", `${pos[0]}%`);
        button.style.setProperty("--v0150-y", `${pos[1]}%`);
      }
      button.dataset.v0150Label = mapLabels[id] || id.toUpperCase();
      const strong = button.querySelector("strong");
      const originalLabel = strong?.textContent?.trim() || mapLabels[id] || id;
      button.title = originalLabel;
      button.setAttribute("aria-label", originalLabel);
      if (strong) strong.textContent = mapLabels[id] || originalLabel;
    });
    let actions = document.getElementById("v0150MapActions");
    if (!actions) {
      map.insertAdjacentHTML("afterend", `<div id="v0150MapActions" class="v0150-map-actions">
        <button type="button" data-v0150-map-action="archive"><span>📰</span><b>ZPRÁVY</b><em id="v0150NewsBadge"></em></button>
        <button type="button" class="primary" data-v0150-map-action="end"><span>🏁</span><b>JÍT NA TAH</b></button>
        <button type="button" data-v0150-map-action="day"><span>📅</span><b>PŘEHLED DNE</b></button>
        <button type="button" data-v0150-map-action="influence"><span>♟</span><b>MAPA VLIVU</b></button>
      </div>`);
      document.querySelectorAll("[data-v0150-map-action]").forEach(button => button.addEventListener("click", () => {
        const action = button.dataset.v0150MapAction;
        if (action === "end") document.getElementById("endDayBtn")?.click();
        else if (action === "day") navigate("archive");
        else navigate(action);
      }));
    }
  }

  function ensureScreenTitles() {
    const titles = [
      ["debateScreen", "TELEVIZNÍ STUDIO", "DEBATA"],
      ["coalitionScreen", "PO VOLBÁCH ZAČÍNÁ SKUTEČNÁ POLITIKA", "KOALIČNÍ VYJEDNÁVÁNÍ"],
      ["endingScreen", "VÝSLEDKY KOMUNÁLNÍCH VOLEB", "VOLEBNÍ NOC"]
    ];
    titles.forEach(([id, kicker, title]) => {
      const screen = document.getElementById(id);
      if (!screen || screen.querySelector(":scope > .v0150-screen-title")) return;
      screen.insertAdjacentHTML("afterbegin", `<header class="v0150-title-banner v0150-screen-title"><small>${kicker}</small><h1>${title}</h1></header>`);
      screen.classList.add("v0150-skinned-screen");
    });
  }

  function decorateScenes(target) {
    [document.getElementById("locationView"), document.getElementById("eventView")].forEach(view => {
      if (!view) return;
      view.classList.add("v0150-scene");
      view.dataset.v0150Location = target?.currentLocation || "townhall";
      const top = view.querySelector(".scene-top");
      if (top && !top.querySelector(".v0150-scene-ribbon")) top.insertAdjacentHTML("afterbegin", `<span class="v0150-scene-ribbon">UDÁLOST</span>`);
    });
    document.querySelectorAll(".choice").forEach((choice, index) => {
      choice.classList.add("v0150-choice");
      choice.dataset.v0150Variant = ["success", "gold", "danger", "info"][index % 4];
    });
  }

  function renderTopbar(target) {
    if (!target) return;
    const day = Math.max(1, finite(target.day, 1));
    const weather = WEATHER[(day - 1) % WEATHER.length];
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    const width = (id, value) => { const el = document.getElementById(id); if (el) el.style.width = `${clamp(value)}%`; };
    set("v0150WeatherIcon", weather.icon);
    set("v0150Day", `Den ${day}`);
    set("v0150Weekday", WEEKDAYS[(day - 1) % WEEKDAYS.length]);
    set("v0150Date", `Květen, rok 2 · ${Math.max(0, finite(target.actions))} akce`);
    set("v0150Temp", `${weather.temp + (day % 3) - 1}°C`);
    set("v0150WeatherLabel", weather.label);
    const trust = clamp(target.stats?.trust);
    const influence = clamp(target.stats?.influence);
    const funds = Math.max(0, finite(target.stats?.funds));
    set("v0150Trust", `${Math.round(trust)} / 100`);
    set("v0150Influence", `${Math.round(influence)} / 100`);
    set("v0150Money", money(funds));
    width("v0150TrustBar", trust);
    width("v0150InfluenceBar", influence);
    width("v0150MoneyBar", Math.min(100, funds * 5));
    const newsBadge = document.getElementById("v0150NewsBadge");
    if (newsBadge) {
      const unread = Math.min(9, (target.news || []).length);
      newsBadge.textContent = unread || "";
      newsBadge.hidden = !unread;
    }
  }

  function updateMode(target) {
    const phase = phaseOf(target);
    document.documentElement.dataset.v0150Mode = phase;
    const gameActive = document.getElementById("gameScreen")?.classList.contains("active") || ["debate", "coalition", "ending"].includes(phase);
    document.documentElement.classList.toggle("v0150-game-active", Boolean(gameActive));
    document.querySelectorAll("[data-v0150-nav]").forEach(button => {
      const active = (button.dataset.v0150Nav === "map" && ["map", "location", "event"].includes(phase)) || button.dataset.v0150Nav === phase;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    const questBadge = document.querySelector('[data-v0150-nav="quests"] em');
    if (questBadge) {
      const count = activeQuests(target).filter(item => item.left <= 2).length;
      questBadge.textContent = count || "";
      questBadge.hidden = !count;
    }
  }

  function openVisualQa() {
    ensureVisualQa();
    const qa = document.getElementById("v0150VisualQa");
    if (!qa) return;
    qa.hidden = false;
    qa.querySelector("button")?.focus();
  }
  function closeVisualQa() {
    const qa = document.getElementById("v0150VisualQa");
    if (qa) qa.hidden = true;
  }
  function ensureVisualQa() {
    if (document.getElementById("v0150VisualQa")) return;
    document.body.insertAdjacentHTML("beforeend", `<section id="v0150VisualQa" class="v0150-visualqa" hidden aria-label="Vizuální QA galerie">
      <header><div><small>v0.15.0 TEST.1</small><h1>Vizuální identita Koryta</h1><p>Komponentová kontrola dřeva, pergamenu, stavů a breakpointů.</p></div><button type="button" data-v0150-close-qa>✕ Zavřít</button></header>
      <div class="v0150-qa-grid">
        <article class="v0150-qa-card"><h2>Materiály</h2><div class="v0150-swatches"><i class="wood"></i><i class="brass"></i><i class="paper"></i><i class="danger"></i><i class="info"></i><i class="success"></i></div></article>
        <article class="v0150-qa-card"><h2>Akce</h2><div class="v0150-qa-actions"><button class="primary">POTVRDIT POSTUP</button><button class="danger">ODMÍTNOUT</button><button class="info">VYJEDNÁVAT</button><button class="gold">DŮLEŽITÁ VOLBA</button></div></article>
        <article class="v0150-qa-card"><h2>Staty</h2>${statBar("v0150QaTrust", "DŮVĚRA", 68, "trust", "68 / 100")}${statBar("v0150QaInfluence", "VLIV", 42, "influence", "42 / 100")}</article>
        <article class="v0150-qa-card"><h2>Pergamen</h2><div class="v0150-parchment"><b>KAUZA: POSLEDNÍ LOUKA</b><p>Každé rozhodnutí otevírá nové cesty a někdo si ho zapamatuje.</p></div></article>
      </div>
    </section>`);
    document.querySelector("[data-v0150-close-qa]")?.addEventListener("click", closeVisualQa);
  }

  function applyCanonicalLabels() {
    try {
      const title = document.querySelector("title");
      const canonicalTitle = `Koryto ${VERSION} – komunální politické RPG`;
      if (title && !document.__v0150TitleLocked) {
        Object.defineProperty(document, "title", {
          configurable: true,
          enumerable: true,
          get: () => title.textContent,
          set: value => {
            const next = String(value || "");
            if (!/^Koryto 0\.14\./.test(next)) title.textContent = next;
          }
        });
        document.__v0150TitleLocked = true;
      }
      if (title) document.title = canonicalTitle;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", `Koryto ${VERSION}: hratelná komunální politická strategie v produkční dřevěno-pergamenové vizuální identitě.`);
      const brand = document.querySelector(".brand h1 span");
      if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    } catch (_) {}
  }

  Object.assign(C, { panelHeader, renderLeftPanel, renderRightPanel, ensureMapChrome, ensureScreenTitles, decorateScenes, renderTopbar, updateMode, openVisualQa, closeVisualQa, ensureVisualQa, applyCanonicalLabels });
})(globalThis.KorytoVisual150Core);
