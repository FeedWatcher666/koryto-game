"use strict";
(() => {
  const VERSION = "0.15.1 TEST.1";
  const BUILD_VERSION = "0.15.1-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const ASSET_ROOT = "assets/v0151/";
  const portraits = {
    marie: "portrait-daniela.webp",
    daniela: "portrait-daniela.webp",
    brazda: "portrait-brazda.webp",
    bohumil: "portrait-bohumil.webp",
    holub: "portrait-holub.webp",
    candidate: "portrait-candidate.webp",
    rival: "portrait-holub.webp"
  };
  const roles = { marie: "PRAVÁ RUKA", daniela: "MLUVČÍ", brazda: "STRATÉG", bohumil: "FINANČÁK", holub: "DONÁTOR" };
  const nav = [["map","🗺️","Mapa"],["quests","📜","Kauzy"],["staff","👥","Štáb"],["influence","♛","Vliv"],["debate","🎙️","Debata"],["elections","🗳️","Volby"],["coalition","🤝","Koalice"],["archive","🗄️","Archiv"]];
  let installed = false;
  let queued = false;
  let selectedStaff = "";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = value => Math.max(0, Math.min(100, finite(value)));
  const stateOf = () => globalThis.KorytoApp?.getState?.() || (typeof state !== "undefined" ? state : null);
  const companionData = () => globalThis.KorytoCompanionData || {};
  const activeQuests = target => globalThis.KorytoVisual150?.activeQuests?.(target) || [];
  const money = value => `${Math.round(Math.max(0, finite(value)) * 10000).toLocaleString("cs-CZ")} Kč`;
  const portrait = (id, alt = "") => `<img src="${ASSET_ROOT}${portraits[id] || portraits.candidate}" alt="${esc(alt)}" loading="eager">`;
  const meter = (label, value, kind = "good") => `<div class="v0151-meter ${kind}"><span>${esc(label)}</span><i><u style="width:${clamp(value)}%"></u></i><b>${Math.round(clamp(value))}%</b></div>`;

  function phaseOf(target = stateOf()) {
    if (document.getElementById("debateScreen")?.classList.contains("active")) return "debate";
    if (document.getElementById("coalitionScreen")?.classList.contains("active")) return "coalition";
    if (document.getElementById("endingScreen")?.classList.contains("active")) return "ending";
    if (!document.getElementById("eventView")?.classList.contains("hidden")) return "event";
    if (!document.getElementById("locationView")?.classList.contains("hidden")) return "location";
    return target?.phase || "map";
  }

  function toast(message) {
    let box = document.getElementById("v0151Toast");
    if (!box) {
      document.body.insertAdjacentHTML("beforeend", '<div id="v0151Toast" class="v0151-toast" role="status"></div>');
      box = document.getElementById("v0151Toast");
    }
    box.textContent = message;
    box.classList.add("show");
    setTimeout(() => box.classList.remove("show"), 2200);
  }

  function canonicalLabels() {
    const title = `Koryto ${VERSION} – hratelný grafický pass`;
    const node = document.querySelector("title");
    if (node) node.textContent = title;
    try { document.title = title; } catch (_) {}
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute("content", `Koryto ${VERSION}: hratelná komunální strategie s mapou, štábem, událostmi, debatou a koaličním vyjednáváním.`);
    const brand = document.querySelector(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const build = document.querySelector(".v0150-build");
    if (build) build.textContent = `Build ${BUILD_VERSION} · save ${SAVE_VERSION} · schema ${SAVE_SCHEMA}`;
  }

  function navigate(action) {
    if (action === "map") {
      const shell = document.getElementById("v0148Shell");
      if (shell) shell.hidden = true;
      globalThis.showMap?.();
      queueRefresh();
      return;
    }
    if (action === "coalition") {
      const target = stateOf();
      if (target?.coalition?.active && typeof globalThis.showCoalitionScreen === "function") globalThis.showCoalitionScreen();
      else globalThis.KorytoVisual148?.openDesk?.("elections");
      queueRefresh();
      return;
    }
    globalThis.KorytoVisual148?.openDesk?.(action);
    queueRefresh();
  }

  function installBottomNav() {
    const box = document.getElementById("v0150BottomNav");
    if (!box || box.dataset.v0151Ready) return;
    box.dataset.v0151Ready = "1";
    box.innerHTML = nav.map(([id, icon, label]) => `<button type="button" data-v0151-nav="${id}"><span>${icon}</span><b>${label}</b><em></em></button>`).join("");
    box.querySelectorAll("[data-v0151-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.v0151Nav)));
  }

  function updateBottomNav(target) {
    const phase = phaseOf(target);
    document.querySelectorAll("[data-v0151-nav]").forEach(button => {
      const id = button.dataset.v0151Nav;
      const active = id === phase || (id === "map" && ["map","location","event"].includes(phase));
      button.classList.toggle("active", active);
      active ? button.setAttribute("aria-current", "page") : button.removeAttribute("aria-current");
    });
    const badge = document.querySelector('[data-v0151-nav="quests"] em');
    const urgent = activeQuests(target).filter(item => item.left <= 2).length;
    if (badge) { badge.textContent = urgent || ""; badge.hidden = !urgent; }
  }

  function decorateMap(target) {
    const left = document.getElementById("v0150LeftPanel");
    const right = document.getElementById("v0150RightPanel");
    left?.classList.add("v0151-map-panel");
    right?.classList.add("v0151-map-panel");
    if (left && !left.querySelector(".v0151-panel-caption")) left.insertAdjacentHTML("afterbegin", '<div class="v0151-panel-caption">AKTIVNÍ KAUZY</div>');
    if (right && !right.querySelector(".v0151-panel-caption")) right.insertAdjacentHTML("afterbegin", '<div class="v0151-panel-caption">SOUPEŘ · FRAKCE · ŠTÁB</div>');
    const map = document.getElementById("map");
    map?.classList.add("v0151-map-stage");
    map?.querySelectorAll("[data-loc]").forEach(button => button.classList.add("v0151-map-node"));
    const caseCount = activeQuests(target).length;
    if (map) map.dataset.v0151Cases = String(caseCount);
  }

  function memoryStrip(target) {
    const party = Object.entries(target?.party || {}).slice(0, 5);
    return `<section class="v0151-memory-strip"><h3>KDO SI VAŠE ROZHODNUTÍ ZAPAMATUJE</h3><div>${party.map(([id, member]) => `<article><span>${portrait(id, member.name)}</span><b>${esc(member.name || id)}</b><small>${finite(member.loyalty, 50) >= 65 ? "spojenec" : finite(member.loyalty, 50) >= 45 ? "známý" : "nejistý"}</small></article>`).join("") || "<p>Obec si pamatuje i bez štábu.</p>"}</div></section>`;
  }

  function decorateEvent(target) {
    const view = document.getElementById("eventView");
    if (!view || view.classList.contains("hidden")) return;
    view.classList.add("v0151-event-view");
    if (!view.querySelector(".v0151-event-art")) view.insertAdjacentHTML("afterbegin", '<div class="v0151-event-art" aria-hidden="true"></div>');
    const top = view.querySelector(".scene-top");
    top?.classList.add("v0151-event-scene");
    const text = top?.querySelector("p") || top?.querySelector(".scene-copy") || top?.querySelector("div");
    text?.classList.add("v0151-event-dialogue");
    view.querySelectorAll(".choice").forEach((choice, index) => {
      choice.classList.add("v0151-event-choice");
      choice.dataset.v0151Tone = ["success","gold","danger","info"][index % 4];
    });
    if (!view.querySelector(".v0151-memory-strip")) view.insertAdjacentHTML("beforeend", memoryStrip(target));
  }

  function renderStaffDesk(target) {
    const content = document.getElementById("v0148Content");
    if (!content || !target) return;
    const defs = companionData().companions || {};
    const ambitions = companionData().companionAmbitionDefs || {};
    const party = Object.entries(target.party || {});
    const morale = party.length ? Math.round(party.reduce((sum, [, item]) => sum + finite(item.loyalty, 50), 0) / party.length) : 0;
    if (!selectedStaff || !target.party?.[selectedStaff]) selectedStaff = party[0]?.[0] || "";
    const cards = party.map(([id, item]) => {
      const def = defs[id] || {};
      const stress = clamp(target.partyFatigue?.[id] ?? target.companionAmbitions?.[id]?.tension ?? 0);
      return `<button type="button" class="v0151-staff-card ${selectedStaff === id ? "selected" : ""}" data-v0151-staff="${esc(id)}"><header>${esc(item.name || def.name || id)}</header><div class="v0151-staff-portrait">${portrait(id, item.name || def.name || id)}</div><h3>${esc(roles[id] || def.role || "ČLEN ŠTÁBU")}</h3>${meter("LOAJALITA", item.loyalty || def.loyalty || 50)}${meter("STRES", stress, "bad")}<section><b>BONUSY</b><p>${esc(def.mission || "Podpora kampaně")}</p></section></button>`;
    }).join("");
    const candidate = `<article class="v0151-staff-card candidate"><header>${esc(target.hero?.name || "Kandidát")}</header><div class="v0151-staff-portrait">${portrait("candidate", target.hero?.name || "Kandidát")}</div><h3>KANDIDÁT</h3>${meter("DŮVĚRA", target.stats?.trust || 50)}${meter("STRES", target.stats?.heat || 0, "bad")}<section><b>VŮDCOVSKÉ BONUSY</b><p>Morálka týmu · úspěch v debatách</p></section></article>`;
    const selected = selectedStaff ? (target.party?.[selectedStaff] || {}) : {};
    const selectedDef = defs[selectedStaff] || {};
    content.innerHTML = `<section class="v0151-staff-screen"><aside class="v0151-staff-left"><h2>LIDÉ A ROLE</h2><button type="button" data-v0151-staff-tab="people">👥 Přehled týmu</button><button type="button" data-v0151-staff-tab="roles">📋 Obsazení pozic</button><button type="button">🛡️ Loajalita a rizika</button><button type="button">💬 Konflikty</button><h3>TÝMOVÁ MORÁLKA</h3>${meter("MORÁLKA", morale)}<p>Tým drží pohromadě podle skutečné průměrné loajality.</p></aside><main class="v0151-staff-main"><header class="v0151-desk-title"><small>VOLEBNÍ TÝM</small><h1>ŠTÁB</h1></header><div class="v0151-staff-cards">${cards.slice(0, 2)}${candidate}${cards.slice(2)}</div><section class="v0151-active-roles"><h2>AKTIVNÍ ROLE (${party.length} / 5)</h2><div>${party.map(([id, item]) => `<button type="button" data-v0151-staff="${esc(id)}"><span>${portrait(id, item.name)}</span><b>${esc(roles[id] || "ČLEN")}</b><small>${esc(item.name)}</small></button>`).join("")}</div></section></main><aside class="v0151-staff-right"><h2>VYBRANÝ ČLEN</h2><h3>${esc(selected.name || selectedDef.name || "Nikdo")}</h3><p>${esc(selectedDef.missionDesc || "Vyberte člena štábu.")}</p><h2>NEOBSAZENÉ ROLE</h2><button>＋ TERÉN</button><button>＋ DEBATA</button><button>＋ MÉDIA</button><h2>NAPĚTÍ V TÝMU</h2>${meter("Osobní konflikty", target.campaignMemory?.companionTension || 20, "bad")}</aside><footer class="v0151-staff-actions"><button data-v0151-back>← ZPĚT</button><button data-v0151-move>↔ PŘESUNOUT</button><button class="success" data-v0151-deploy>📣 NASADIT</button><button class="info" data-v0151-talk>💬 PROMLUVIT</button><button class="danger" data-v0151-conflict>🤝 VYŘEŠIT SPOR</button></footer></section>`;
    content.querySelectorAll("[data-v0151-staff]").forEach(button => button.addEventListener("click", () => { selectedStaff = button.dataset.v0151Staff; renderStaffDesk(stateOf()); }));
    content.querySelector("[data-v0151-back]")?.addEventListener("click", () => { const shell = document.getElementById("v0148Shell"); if (shell) shell.hidden = true; });
    content.querySelector("[data-v0151-move]")?.addEventListener("click", () => toast("Role se mění výběrem člena; herní data zůstávají zdrojem pravdy."));
    content.querySelector("[data-v0151-deploy]")?.addEventListener("click", () => {
      const location = ambitions[selectedStaff]?.location || companionData().companionStoryDefs?.[selectedStaff]?.location;
      const shell = document.getElementById("v0148Shell"); if (shell) shell.hidden = true;
      if (location) document.querySelector(`[data-loc="${location}"]`)?.click(); else toast("Tento člen zatím nemá dostupnou terénní misi.");
    });
    content.querySelector("[data-v0151-talk]")?.addEventListener("click", () => {
      const event = ambitions[selectedStaff]?.event;
      if (event && typeof globalThis.showEvent === "function") globalThis.showEvent(event); else toast(selectedDef.tolerance || "Rozhovor zatím nemá samostatnou událost.");
    });
    content.querySelector("[data-v0151-conflict]")?.addEventListener("click", () => {
      const conflict = Object.values(companionData().conflictDefs || {}).find(item => item.a === selectedStaff || item.b === selectedStaff);
      if (conflict?.event && typeof globalThis.showEvent === "function") globalThis.showEvent(conflict.event); else toast("Ve štábu teď není otevřený spor.");
    });
  }

  function wrapDesk() {
    const api = globalThis.KorytoVisual148;
    if (!api || api.openDesk?.__v0151) return;
    const original = api.openDesk.bind(api);
    const wrapped = name => {
      const result = original(name);
      setTimeout(() => {
        const shell = document.getElementById("v0148Shell");
        shell?.classList.add("v0151-desk-shell");
        if (name === "staff") renderStaffDesk(stateOf());
        else document.getElementById("v0148Content")?.classList.add("v0151-generic-desk");
      }, 0);
      return result;
    };
    wrapped.__v0151 = true;
    api.openDesk = wrapped;
  }

  function decorateDebate(target) {
    const screen = document.getElementById("debateScreen");
    if (!screen || !screen.classList.contains("active")) return;
    screen.classList.add("v0151-debate-screen");
    screen.querySelector(".debate-stage")?.classList.add("v0151-debate-stage");
    screen.querySelectorAll("#debateCards [data-card]").forEach(button => {
      button.classList.add("v0151-debate-card");
      const id = button.dataset.card;
      button.dataset.v0151Kind = ({facts:"facts",promise:"emotion",expose:"evidence",citizens:"defense",joke:"emotion",feint:"attack"})[id] || "facts";
    });
  }

  function decorateCoalition(target) {
    const screen = document.getElementById("coalitionScreen");
    if (!screen || !screen.classList.contains("active")) return;
    screen.classList.add("v0151-coalition-screen");
    const shell = screen.querySelector(".coalition-shell");
    if (!shell || shell.querySelector("#v0151CoalitionScene")) return;
    shell.insertAdjacentHTML("afterbegin", '<section id="v0151CoalitionScene" class="v0151-coalition-scene" aria-label="Koaliční jednací stůl"></section>');
    const c = target?.coalition;
    shell.insertAdjacentHTML("beforeend", `<aside id="v0151CoalitionChance" class="v0151-coalition-chance"><h2>ŠANCE NA DOHODU</h2><strong>${Math.round(clamp(45 + finite(c?.resources?.credibility) * .3))} %</strong><p>${finite(c?.seats)} / ${finite(c?.needed, 8)} mandátů</p><button class="success" data-v0151-offer>🤝 PŘEDLOŽIT NABÍDKU</button><button class="danger" data-v0151-leave>🚪 ODEJÍT OD STOLU</button></aside>`);
    shell.querySelector("[data-v0151-offer]")?.addEventListener("click", () => document.querySelector("[data-partner]")?.click());
    shell.querySelector("[data-v0151-leave]")?.addEventListener("click", () => document.getElementById("coalitionPass")?.click());
  }

  function refresh() {
    if (typeof document === "undefined") return false;
    const target = stateOf();
    document.documentElement.classList.add("v0151-graphics");
    document.documentElement.dataset.v0151Mode = phaseOf(target);
    canonicalLabels();
    installBottomNav();
    updateBottomNav(target);
    decorateMap(target);
    decorateEvent(target);
    decorateDebate(target);
    decorateCoalition(target);
    return true;
  }

  function queueRefresh() {
    if (queued) return;
    queued = true;
    setTimeout(() => { queued = false; refresh(); }, 0);
  }

  function wrap(name) {
    const original = globalThis[name];
    if (typeof original !== "function" || original.__v0151) return;
    const wrapped = function (...args) { const result = original.apply(this, args); queueRefresh(); return result; };
    wrapped.__v0151 = true;
    globalThis[name] = wrapped;
  }

  function visualAudit(target = stateOf()) {
    return { version: VERSION, buildVersion: BUILD_VERSION, saveVersion: SAVE_VERSION, saveSchema: SAVE_SCHEMA, mode: phaseOf(target), navItems: document.querySelectorAll("[data-v0151-nav]").length, mapLocations: document.querySelectorAll("#map [data-loc]").length, staffMembers: Object.keys(target?.party || {}).length, eventDecorated: Boolean(document.querySelector("#eventView.v0151-event-view")), debateDecorated: Boolean(document.querySelector("#debateScreen.v0151-debate-screen")), coalitionDecorated: Boolean(document.querySelector("#coalitionScreen.v0151-coalition-screen")), ready: Boolean(target) };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    wrapDesk();
    ["renderAll","renderMap","showMap","showLocation","showEvent","renderDebate","renderCoalition","showCoalitionScreen","startDebate","finishDebate","newGame","load"].forEach(wrap);
    document.addEventListener("click", queueRefresh);
    document.addEventListener("change", queueRefresh);
    queueRefresh();
    return true;
  }

  const api = { VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, portraits, roles, phaseOf, renderStaffDesk, decorateEvent, decorateDebate, decorateCoalition, refresh, queueRefresh, navigate, visualAudit, install };
  globalThis.KorytoVisual151 = api;
  globalThis.KorytoTest151 = api;
  install();
})();
