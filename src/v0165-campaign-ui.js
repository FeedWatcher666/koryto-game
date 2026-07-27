"use strict";
(() => {
  const VERSION = "0.16.5 TEST.1";
  const BUILD_VERSION = "0.16.5-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;

  const LOCATION_ASSETS = Object.freeze({
    pub:"assets/v0165/locations/pub.webp", townhall:"assets/v0165/locations/townhall.webp",
    school:"assets/v0165/locations/school.webp", paper:"assets/v0165/locations/paper.webp",
    jzd:"assets/v0165/locations/jzd.webp", meadow:"assets/v0165/locations/meadow.webp",
    pitch:"assets/v0165/locations/pitch.webp", hq:"assets/v0165/locations/hq.webp"
  });
  const QUEST_ASSETS = Object.freeze({
    register:"assets/v0165/quests/register.webp", diesel:"assets/v0165/quests/diesel.webp",
    roof:"assets/v0165/quests/roof.webp", meadow:"assets/v0165/quests/meadow.webp",
    paper:"assets/v0165/quests/newsletter.webp", newsletter:"assets/v0165/quests/newsletter.webp",
    genericPub:"assets/v0165/quests/genericPub.webp"
  });
  const TACTIC_ASSETS = Object.freeze({
    public:"assets/v0165/tactics/public.webp", service:"assets/v0165/tactics/service.webp",
    parents:"assets/v0165/tactics/parents.webp", investigate:"assets/v0165/tactics/investigate.webp",
    process:"assets/v0165/tactics/process.webp", business:"assets/v0165/tactics/business.webp"
  });
  const NAV = Object.freeze([
    ["map","🗺️","Mapa"],["quests","📜","Kauzy"],["staff","👥","Štáb"],["influence","♟️","Vliv"],
    ["debate","🎙️","Debata"],["elections","🗳️","Volby"],["coalition","🤝","Koalice"],["archive","🗄️","Archiv"]
  ]);

  let installed = false;
  let activeView = null;
  let activeId = null;
  let previousShowLocation = null;
  let previousShowEvent = null;
  let previousShowMap = null;
  const legacyNavigationState = new Map();
  const LEGACY_NAVIGATION_SELECTOR = "#v0148Nav,.v0148-nav,#v0160Root .k16-bottom";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = value => Math.max(0, Math.min(100, finite(value)));
  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;
  const locationsOf = () => globalThis.KorytoCoreData?.locations || {};
  const questDefs = () => globalThis.KorytoQuestData?.definitions || {};
  const eventOf = id => globalThis.KorytoApp?.eventById?.(id) || globalThis.KorytoApp?.events?.[id] || null;

  function money(value) {
    return `${Math.round(Math.max(0, finite(value)) * 10000).toLocaleString("cs-CZ")} Kč`;
  }

  function deadline(id, target) {
    return globalThis.KorytoQuestRuntime?.deadline?.(id, target) ?? questDefs()[id]?.deadline ?? 13;
  }

  function ensureRoot() {
    let root = document.getElementById("v0165Root");
    if (!root) {
      root = document.createElement("div");
      root.id = "v0165Root";
      root.hidden = true;
      document.body.appendChild(root);
    }
    return root;
  }

  function campaignActive(target = stateOf()) {
    return Boolean(target && !target.ended && document.getElementById("gameScreen")?.classList.contains("active"));
  }

  function topbar(target) {
    const day = Math.max(1, finite(target?.day, 1));
    const weekdays = ["Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota","Neděle"];
    const trust = clamp(target?.stats?.trust);
    const influence = clamp(target?.stats?.influence);
    const funds = Math.max(0, finite(target?.stats?.funds));
    const resource = (icon,label,value,width,kind="") => `<article class="k165-resource ${kind}"><span>${icon}</span><small>${label}</small><b>${esc(value)}</b><i><u style="width:${clamp(width)}%"></u></i></article>`;
    return `<header class="k165-topbar">
      <section class="k165-day"><span>☀️</span><div><b>Den ${day}</b><strong>${weekdays[(day-1)%7]}</strong><small>Květen, rok 2 · ${Math.max(0,finite(target?.actions))} akce</small></div><em>◆ Dolní Vejprnice</em></section>
      <section class="k165-logo"><strong>KORYTO</strong><span>POLITICKÁ RPG STRATEGIE</span></section>
      <section class="k165-resources">${resource("🤝","DŮVĚRA",Math.round(trust),trust)}${resource("♛","VLIV",Math.round(influence),influence,"purple")}${resource("🪙","PENÍZE",money(funds),Math.min(100,funds*5),"gold")}</section>
      <button type="button" class="k165-settings" data-k165-settings aria-label="Přepnout vizuální režim">🎨</button>
    </header>`;
  }

  function bottomNav(active = "quests") {
    const mobile = [["map","🗺️","Mapa"],["quests","📜","Kauzy"],["staff","👥","Štáb"],["influence","♟️","Vliv"]];
    const more = NAV.slice(4);
    return `<nav class="k165-bottom k165-bottom-desktop">${NAV.map(([id,icon,label]) => `<button type="button" class="${id===active?"active":""}" data-k165-nav="${id}"><span>${icon}</span><b>${label}</b></button>`).join("")}</nav>
      <nav class="k165-bottom k165-bottom-mobile">${mobile.map(([id,icon,label]) => `<button type="button" class="${id===active?"active":""}" data-k165-nav="${id}"><span>${icon}</span><b>${label}</b></button>`).join("")}<button type="button" data-k165-more><span>•••</span><b>Další</b></button></nav>
      <section class="k165-more-drawer" data-k165-drawer hidden><header><b>DALŠÍ SEKCE</b><button type="button" data-k165-close>×</button></header><div>${more.map(([id,icon,label])=>`<button type="button" data-k165-nav="${id}"><span>${icon}</span><b>${label}</b></button>`).join("")}</div></section>`;
  }

  function suppressLegacyNavigation(active) {
    document.querySelectorAll(LEGACY_NAVIGATION_SELECTOR).forEach(nav => {
      if (active) {
        if (!legacyNavigationState.has(nav)) {
          legacyNavigationState.set(nav, {
            hidden: Boolean(nav.hidden),
            inert: Boolean(nav.inert),
            ariaHidden: nav.getAttribute("aria-hidden")
          });
        }
        nav.hidden = true;
        nav.inert = true;
        nav.setAttribute("aria-hidden", "true");
        nav.setAttribute("data-k165-disabled-nav", "true");
        return;
      }
      const previous = legacyNavigationState.get(nav);
      if (!previous) return;
      nav.hidden = previous.hidden;
      nav.inert = previous.inert;
      if (previous.ariaHidden === null) nav.removeAttribute("aria-hidden");
      else nav.setAttribute("aria-hidden", previous.ariaHidden);
      nav.removeAttribute("data-k165-disabled-nav");
      legacyNavigationState.delete(nav);
    });
  }

  function activate(html, view, id = null) {
    activeView = view;
    activeId = id;
    const root = ensureRoot();
    root.innerHTML = html;
    root.hidden = false;
    document.documentElement.classList.add("k165-active");
    document.documentElement.classList.remove("k16-active","k163-map-view","k163-staff-view");
    suppressLegacyNavigation(true);
    const old = document.getElementById("v0160Root");
    if (old) old.hidden = true;
    bindCommon(root);
    document.title = `Koryto ${VERSION} – ${view === "location" ? "lokalita" : view === "event" ? "událost" : view === "result" ? "výsledek" : "kauzy"}`;
    return root;
  }

  function deactivate() {
    activeView = null;
    activeId = null;
    document.documentElement.classList.remove("k165-active");
    suppressLegacyNavigation(false);
    const root = ensureRoot();
    root.hidden = true;
  }

  function questStatus(target, id) {
    const status = target?.quests?.[id]?.status || "locked";
    if (status === "done") return {label:"SPLNĚNO",kind:"done"};
    if (status === "failed") return {label:"SELHÁNO",kind:"failed"};
    if (status === "active") return {label:"AKTIVNÍ",kind:"active"};
    return {label:"ZAMČENO",kind:"locked"};
  }

  function questAsset(id, def) {
    return QUEST_ASSETS[id] || LOCATION_ASSETS[def?.location] || LOCATION_ASSETS.townhall;
  }

  function questRows(target) {
    return Object.entries(questDefs()).map(([id, def]) => {
      const state = target?.quests?.[id] || {status:"locked",stage:0};
      const due = deadline(id,target);
      return {id,def,state,due,left:due-finite(target?.day,1),status:questStatus(target,id)};
    }).sort((a,b) => {
      const order={active:0,locked:1,done:2,failed:3};
      return order[a.status.kind]-order[b.status.kind] || a.due-b.due || a.def.title.localeCompare(b.def.title,"cs");
    });
  }

  function renderQuestList(filter = "all") {
    const target = stateOf();
    if (!campaignActive(target)) return false;
    const rows = questRows(target).filter(row => filter === "all" || row.status.kind === filter);
    const counts = questRows(target).reduce((acc,row)=>(acc[row.status.kind]=(acc[row.status.kind]||0)+1,acc),{});
    const html = `<div class="k165-shell">${topbar(target)}
      <main class="k165-page k165-quests-page">
        <header class="k165-page-title"><span>📜</span><div><p>PŘEHLED KAMPANĚ</p><h1>KAUZY DOLNÍCH VEJPRNIC</h1><small>Termíny běží. Paměť obce také.</small></div></header>
        <section class="k165-filterbar">
          ${[["all","Vše",Object.keys(questDefs()).length],["active","Aktivní",counts.active||0],["locked","Zamčené",counts.locked||0],["done","Splněné",counts.done||0],["failed","Selhané",counts.failed||0]].map(([id,label,count])=>`<button type="button" class="${filter===id?"active":""}" data-k165-filter="${id}">${label}<b>${count}</b></button>`).join("")}
        </section>
        <section class="k165-card-grid">
          ${rows.map(row => `<button type="button" class="k165-quest-card ${row.status.kind}" data-k165-quest="${row.id}">
            <div class="k165-card-art" style="background-image:url('${questAsset(row.id,row.def)}')"><span>${row.status.label}</span>${row.status.kind==="active"?`<em>${row.left<=0?"DNES":`${row.left} dnů`}</em>`:""}</div>
            <div class="k165-card-copy"><h2>${esc(row.def.title)}</h2><p>${esc(row.def.desc)}</p><div class="k165-card-meta"><span>📍 ${esc(locationsOf()[row.def.location]?.name || row.def.location)}</span><b>${row.status.kind==="active"?`${Math.min(5,finite(row.state.stage)+1)} / 5`:row.status.label}</b></div></div>
          </button>`).join("") || '<div class="k165-empty">V této kategorii zatím nic není.</div>'}
        </section>
      </main>${bottomNav("quests")}</div>`;
    const root = activate(html,"quests");
    root.querySelectorAll("[data-k165-filter]").forEach(button => button.addEventListener("click",()=>renderQuestList(button.dataset.k165Filter)));
    root.querySelectorAll("[data-k165-quest]").forEach(button => button.addEventListener("click",()=>renderQuestDetail(button.dataset.k165Quest)));
    return true;
  }

  function renderQuestDetail(id) {
    const target = stateOf();
    const def = questDefs()[id];
    if (!target || !def) return renderQuestList();
    const row = questRows(target).find(item => item.id === id);
    const history = (target.log || []).filter(line => String(line).toLowerCase().includes(String(def.title).toLowerCase().split(" ")[0])).slice(-4).reverse();
    const progress = row.status.kind === "done" ? 100 : row.status.kind === "failed" ? 100 : Math.min(100,(finite(row.state.stage)+1)*20);
    const html = `<div class="k165-shell">${topbar(target)}
      <main class="k165-page k165-detail-page">
        <button class="k165-back" type="button" data-k165-back-quests>← ZPĚT NA PŘEHLED</button>
        <section class="k165-detail-hero">
          <div class="k165-detail-art" style="background-image:url('${questAsset(id,def)}')"><span class="${row.status.kind}">${row.status.label}</span></div>
          <div class="k165-detail-copy"><p>KAUZA</p><h1>${esc(def.title)}</h1><strong>${esc(def.desc)}</strong>
            <div class="k165-deadline"><span>⏳ Termín</span><b>${row.status.kind==="active"?(row.left<=0?"DNES":`za ${row.left} dnů`):row.status.label}</b></div>
            <div class="k165-progressline"><span>Postup</span><b>${Math.min(5,finite(row.state.stage)+1)} / 5</b><i><u style="width:${progress}%"></u></i></div>
          </div>
        </section>
        <section class="k165-detail-columns">
          <article class="k165-parchment"><h2>Co hrozí</h2><p>${esc(def.failure)}</p><h2>Kde pokračovat</h2><p>${esc(locationsOf()[def.location]?.name || def.location)}</p><button type="button" class="k165-primary" data-k165-go-location="${def.location}" ${row.status.kind!=="active"?"disabled":""}>📍 PŘEJÍT DO LOKALITY</button></article>
          <article class="k165-ledger"><h2>Historie kauzy</h2>${history.length?history.map(line=>`<p>${esc(line)}</p>`).join(""):'<p>Zatím bez zaznamenaného rozhodnutí. V obci se tomu říká klid před zápisem.</p>'}</article>
        </section>
      </main>${bottomNav("quests")}</div>`;
    const root = activate(html,"quest",id);
    root.querySelector("[data-k165-back-quests]")?.addEventListener("click",()=>renderQuestList());
    root.querySelector("[data-k165-go-location]")?.addEventListener("click",event=>globalThis.showLocation?.(event.currentTarget.dataset.k165GoLocation));
  }

  function parseLocationActivities(locationId = stateOf()?.currentLocation) {
    return [...document.querySelectorAll("#locationView .activity")].map((button,index) => {
      const title = button.querySelector("strong")?.textContent?.trim() || `Aktivita ${index+1}`;
      const eventId = Object.entries(globalThis.KorytoApp?.events || {}).find(([,event]) => event?.location === locationId && event?.title === title)?.[0] || null;
      return {
        index, title, eventId,
        detail:button.querySelector("small")?.textContent?.trim() || "",
        icon:button.querySelector("span")?.textContent?.trim() || "◆",
        urgent:button.classList.contains("urgent"),
        button
      };
    });
  }

  function activityAsset(activity, locationId) {
    const title = activity.title.toLowerCase();
    if (title.includes("kandid")) return QUEST_ASSETS.register;
    if (title.includes("nafta")) return QUEST_ASSETS.diesel;
    if (title.includes("střech") || title.includes("škola")) return QUEST_ASSETS.roof;
    if (title.includes("louka")) return QUEST_ASSETS.meadow;
    if (title.includes("zpravodaj") || title.includes("hlas")) return QUEST_ASSETS.newsletter;
    return LOCATION_ASSETS[locationId] || LOCATION_ASSETS.townhall;
  }

  function renderLocation(id) {
    const target = stateOf();
    const location = locationsOf()[id];
    if (!target || !location) return false;
    const activities = parseLocationActivities(id);
    const html = `<div class="k165-shell">${topbar(target)}
      <main class="k165-page k165-location-page">
        <button class="k165-back" type="button" data-k165-map>← ZPĚT NA MAPU</button>
        <section class="k165-location-hero" style="background-image:linear-gradient(90deg,#160b07dd 0 38%,transparent 72%),url('${LOCATION_ASSETS[id] || LOCATION_ASSETS.townhall}')">
          <div><p>LOKALITA</p><h1>${esc(location.name)}</h1><strong>${esc(location.desc)}</strong><span>${activities.length} dostupné ${activities.length===1?"aktivita":"aktivity"}</span></div>
        </section>
        <section class="k165-activity-grid">
          ${activities.map(activity => `<button type="button" class="k165-activity ${activity.urgent?"urgent":""}" data-k165-activity="${activity.index}">
            <div class="k165-card-art" style="background-image:url('${activityAsset(activity,id)}')"><span>${activity.urgent?"TERMÍN HOŘÍ":"DOSTUPNÉ"}</span></div>
            <div class="k165-card-copy"><h2>${esc(activity.icon)} ${esc(activity.title)}</h2><p>${esc(activity.detail)}</p><b>OTEVŘÍT →</b></div>
          </button>`).join("") || '<div class="k165-empty">Teď tu není nic důležitého. To je na obecní instituci neobvyklé.</div>'}
        </section>
      </main>${bottomNav("map")}</div>`;
    const root = activate(html,"location",id);
    root.querySelector("[data-k165-map]")?.addEventListener("click",()=>globalThis.showMap?.());
    root.querySelectorAll("[data-k165-activity]").forEach(button => button.addEventListener("click",()=>{
      const activity=activities[finite(button.dataset.k165Activity)];
      if(activity?.eventId) globalThis.showEvent?.(activity.eventId);
      else activity?.button?.click();
    }));
    return true;
  }

  function tacticAsset(choice) {
    const tags = choice?.tags || [];
    if (tags.includes("transparent") || tags.includes("ethical") || tags.includes("public")) return TACTIC_ASSETS.public;
    if (tags.includes("legal") || tags.includes("bureaucracy")) return TACTIC_ASSETS.process;
    if (tags.includes("press") || tags.includes("investigate") || tags.includes("evidence")) return TACTIC_ASSETS.investigate;
    if (tags.includes("parents") || tags.includes("school")) return TACTIC_ASSETS.parents;
    if (tags.includes("contract") || tags.includes("business") || tags.includes("corrupt")) return TACTIC_ASSETS.business;
    return TACTIC_ASSETS.service;
  }

  function parseChoice(button,index,choice) {
    return {
      index,
      button,
      disabled:button.disabled,
      label:button.querySelector("strong")?.textContent?.trim() || choice?.label || `Volba ${index+1}`,
      detail:button.querySelector("small")?.textContent?.trim() || choice?.detail || "",
      check:button.querySelector(".check")?.textContent?.trim() || "",
      mods:button.querySelector(".modline")?.textContent?.trim() || "",
      risk:button.querySelector(".risk")?.textContent?.trim() || "",
      choice
    };
  }

  function renderEvent(id) {
    const target = stateOf();
    const event = eventOf(id);
    if (!target || !event || id === "debate") return false;
    const legacyButtons = [...document.querySelectorAll("#choiceBox .choice")];
    const choices = legacyButtons.map((button,index)=>parseChoice(button,index,event.choices?.[index]));
    const paragraphs = typeof event.text === "function" ? event.text() : [];
    const loc = locationsOf()[event.location] || {};
    const support = target.selectedSupport && target.party?.[target.selectedSupport] ? target.party[target.selectedSupport].name : "Nikdo";
    const html = `<div class="k165-shell">${topbar(target)}
      <main class="k165-page k165-event-page">
        <button class="k165-back" type="button" data-k165-event-back>← ZPĚT DO LOKALITY</button>
        <section class="k165-event-story">
          <div class="k165-event-image" style="background-image:url('${LOCATION_ASSETS[event.location] || LOCATION_ASSETS.townhall}')"><span>${esc(event.kicker || "UDÁLOST")}</span></div>
          <div class="k165-event-text"><p>${esc(loc.name || "Dolní Vejprnice")}</p><h1>${esc(event.title || id)}</h1>${paragraphs.map(text=>`<p>${esc(text)}</p>`).join("")}<div class="k165-support"><span>Aktivní podpora štábu</span><b>${esc(support)}</b></div></div>
        </section>
        <section class="k165-choice-grid">
          ${choices.map(item => `<button type="button" class="k165-choice" data-k165-choice="${item.index}" ${item.disabled?"disabled":""}>
            <div class="k165-choice-art" style="background-image:url('${tacticAsset(item.choice)}')"><span>${item.disabled?"NEDOSTUPNÉ":"TAKTIKA"}</span></div>
            <div><h2>${esc(item.label)}</h2><p>${esc(item.detail)}</p>${item.check?`<strong>${esc(item.check)}</strong>`:""}${item.mods?`<small>${esc(item.mods)}</small>`:""}${item.risk?`<em>${esc(item.risk)}</em>`:""}</div>
          </button>`).join("")}
        </section>
      </main>${bottomNav("map")}</div>`;
    const root = activate(html,"event",id);
    root.querySelector("[data-k165-event-back]")?.addEventListener("click",()=>globalThis.showLocation?.(event.location));
    root.querySelectorAll("[data-k165-choice]").forEach(button => button.addEventListener("click",()=>{
      const choice = choices[finite(button.dataset.k165Choice)];
      if (!choice || choice.disabled) return;
      choice.button.click();
    }));
    return true;
  }

  function renderResult() {
    const target = stateOf();
    const event = eventOf(activeId || target?.currentEvent);
    const legacy = document.getElementById("resultBox");
    if (!target || !event || !legacy || legacy.classList.contains("hidden")) return false;
    const heading = legacy.querySelector("h3")?.textContent?.trim() || "Výsledek";
    const paragraphs = [...legacy.querySelectorAll("p")].map(p=>p.textContent.trim()).filter(Boolean);
    const kind = heading.toLowerCase().includes("komplik") ? "bad" : heading.toLowerCase().includes("cenu") ? "warn" : "good";
    const html = `<div class="k165-shell">${topbar(target)}
      <main class="k165-page k165-result-page">
        <section class="k165-result-card ${kind}">
          <div class="k165-result-image" style="background-image:url('${LOCATION_ASSETS[event.location] || LOCATION_ASSETS.townhall}')"><span>${kind==="good"?"✓":kind==="warn"?"!":"×"}</span></div>
          <div class="k165-result-copy"><p>VÝSLEDEK ROZHODNUTÍ</p><h1>${esc(heading)}</h1>${paragraphs.map((text,index)=>`<p class="${index===paragraphs.length-1?"effects":""}">${esc(text)}</p>`).join("")}<button type="button" class="k165-primary" data-k165-continue>POKRAČOVAT NA MAPU</button></div>
        </section>
      </main>${bottomNav("map")}</div>`;
    const root = activate(html,"result",event.id || activeId);
    root.querySelector("[data-k165-continue]")?.addEventListener("click",()=>{
      const legacy=document.getElementById("continueAfter");
      deactivate();
      legacy?.click();
      setTimeout(()=>globalThis.KorytoUI163?.showMap?.(),0);
    });
    return true;
  }

  function navigate(name) {
    if (name === "quests") return renderQuestList();
    if (name === "map") return globalThis.showMap?.();
    deactivate();
    if (globalThis.KorytoUI163?.navigate) return globalThis.KorytoUI163.navigate(name);
    globalThis.KorytoVisual148?.openDesk?.(name);
  }

  function bindCommon(root) {
    root.querySelectorAll("[data-k165-nav]").forEach(button=>button.addEventListener("click",()=>{ const drawer=root.querySelector("[data-k165-drawer]"); if(drawer)drawer.hidden=true; navigate(button.dataset.k165Nav); }));
    root.querySelector("[data-k165-settings]")?.addEventListener("click",()=>document.getElementById("pixelToggle")?.click());
    root.querySelector("[data-k165-more]")?.addEventListener("click",()=>{ const drawer=root.querySelector("[data-k165-drawer]"); if(drawer)drawer.hidden=!drawer.hidden; });
    root.querySelector("[data-k165-close]")?.addEventListener("click",()=>{ const drawer=root.querySelector("[data-k165-drawer]"); if(drawer)drawer.hidden=true; });
  }

  function captureNavigation(event) {
    const button = event.target.closest?.('[data-k16-nav="quests"],[data-k163-nav="quests"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    renderQuestList();
  }

  function visualAudit(target = stateOf()) {
    return {
      version:VERSION, buildVersion:BUILD_VERSION, saveVersion:SAVE_VERSION, saveSchema:SAVE_SCHEMA,
      activeView, activeId, campaignActive:campaignActive(target),
      questCards:document.querySelectorAll("#v0165Root .k165-quest-card").length,
      activityCards:document.querySelectorAll("#v0165Root .k165-activity").length,
      choiceCards:document.querySelectorAll("#v0165Root .k165-choice").length,
      locationAssets:Object.keys(LOCATION_ASSETS).length,
      questAssets:Object.keys(QUEST_ASSETS).length,
      tacticAssets:Object.keys(TACTIC_ASSETS).length,
      disabledLegacyNavigations:document.querySelectorAll("[data-k165-disabled-nav='true']").length
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    previousShowLocation = globalThis.showLocation;
    previousShowEvent = globalThis.showEvent;
    previousShowMap = globalThis.showMap;

    globalThis.showLocation = function(id, ...args) {
      const result = previousShowLocation?.call(this,id,...args);
      setTimeout(()=>renderLocation(id),0);
      return result;
    };
    globalThis.showEvent = function(id, ...args) {
      if (id === "debate") { deactivate(); return previousShowEvent?.call(this,id,...args); }
      const result = previousShowEvent?.call(this,id,...args);
      setTimeout(()=>renderEvent(id),0);
      return result;
    };
    globalThis.showMap = function(...args) {
      deactivate();
      return previousShowMap?.apply(this,args);
    };

    globalThis.addEventListener("click",captureNavigation,true);
    globalThis.addEventListener("click",event=>{
      if(event.target?.id === "confirmBtn") setTimeout(()=>{ const target=stateOf(); if(target?.phase === "event" && target.currentEvent) renderEvent(target.currentEvent); },30);
      if(event.target?.id === "diceClose") setTimeout(()=>renderResult(),80);
    },true);

    globalThis.KorytoUI165 = {VERSION,BUILD_VERSION,SAVE_VERSION,SAVE_SCHEMA,LOCATION_ASSETS,QUEST_ASSETS,TACTIC_ASSETS,suppressLegacyNavigation,renderQuestList,renderQuestDetail,renderLocation,renderEvent,renderResult,navigate,visualAudit,install};
    return true;
  }

  install();
})();
