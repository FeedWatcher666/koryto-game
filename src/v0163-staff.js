"use strict";
(() => {
  const VERSION = "0.16.5 TEST.1";
  const BUILD_VERSION = "0.16.5-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const IDS = ["marie", "daniela", "brazda", "bohumil", "holub"];
  const PORTRAITS = Object.freeze({
    candidate: "assets/v0163/candidate.webp",
    marie: "assets/v0163/marie.webp",
    daniela: "assets/v0163/daniela.webp",
    brazda: "assets/v0163/brazda.webp",
    bohumil: "assets/v0163/bohumil.webp",
    holub: "assets/v0163/holub.webp"
  });
  const ROLE_LABELS = Object.freeze({
    marie: "ORGANIZACE / RODIČE",
    daniela: "MÉDIA / OVĚŘOVÁNÍ",
    brazda: "TERÉN / JZD",
    bohumil: "PROCES / ÚŘAD",
    holub: "FINANCE / ZAKÁZKY"
  });
  const ROLE_ICONS = Object.freeze({ marie: "👥", daniela: "📷", brazda: "🥾", bohumil: "🗄️", holub: "💰" });
  const LOCATION_LABELS = Object.freeze({ school: "Škola", paper: "Redakce", jzd: "JZD a sídliště", townhall: "Radnice", meadow: "Náměstí a louka" });
  const RECRUIT_HINTS = Object.freeze({
    marie: "Pomoz škole a rodičům. Marie vstoupí do kampaně, pokud uvidí, že děti nejsou jen kulisa.",
    daniela: "Otevři kauzu zpravodaje nebo archivu. Daniela chce ověřitelné informace, ne tiskový dozor.",
    brazda: "Vyjednávej v JZD. Brázda respektuje sílu, venkovskou logistiku a dobře zapamatovanou protislužbu.",
    bohumil: "Řeš kandidátku a procesní problémy na radnici. Bohumil potřebuje důkaz, že úřad přežije každého vítěze.",
    holub: "Vstup do sporu o školu nebo louku. Holub přichází s penězi, profesionály a cenou napsanou drobným písmem."
  });
  const QUEST_MATCHES = Object.freeze({
    marie: ["roof", "water", "register"],
    daniela: ["paper", "oldfiles", "debate"],
    brazda: ["diesel", "ballots", "register"],
    bohumil: ["register", "budget", "oldfiles"],
    holub: ["meadow", "roof", "budget"]
  });
  const ROLE_BONUSES = Object.freeze({
    marie: ["Silnější rodičovská mobilizace", "Bonus u etických a školních voleb"],
    daniela: ["Ověřování stop a kompromatu", "Bonus u médií, transparentnosti a práva"],
    brazda: ["Terénní logistika a lidé", "Bonus v JZD, při veřejných a mocenských akcích"],
    bohumil: ["Procesní štít a posun termínů", "Bonus na radnici, v archivu a u právních voleb"],
    holub: ["Financování a profesionální servis", "Bonus u zakázek, podnikatelů a louky"]
  });
  const NAV = Object.freeze([
    ["map", "🗺️", "Mapa"], ["quests", "📜", "Kauzy"], ["staff", "👥", "Štáb"], ["influence", "♟️", "Vliv"],
    ["debate", "🎙️", "Debata"], ["elections", "🗳️", "Volby"], ["coalition", "🤝", "Koalice"], ["archive", "🗄️", "Archiv"]
  ]);
  const MOBILE_NAV = Object.freeze([
    ["map", "🗺️", "Mapa"], ["quests", "📜", "Kauzy"], ["staff", "👥", "Štáb"], ["influence", "♟️", "Vliv"], ["more", "•••", "Další"]
  ]);
  const MORE = Object.freeze([
    ["debate", "🎙️", "Debata"], ["elections", "🗳️", "Volby"], ["coalition", "🤝", "Koalice"], ["archive", "🗄️", "Archiv"]
  ]);

  let installed = false;
  let view = "map";
  let selected = "candidate";
  let staffTab = "people";
  let queued = false;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char]);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = value => Math.max(0, Math.min(100, finite(value)));
  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;
  const dataOf = () => globalThis.KorytoCompanionData || {};
  const classesOf = () => globalThis.KorytoCoreData?.classes || {};
  const questDefs = () => globalThis.KorytoQuestData?.definitions || {};
  const rootOf = () => document.getElementById("v0160Root");
  const TEST_BUILD = true;
  const playtestMode = () => TEST_BUILD || new URLSearchParams(globalThis.location?.search || "").get("playtest") === "1";

  function money(value) {
    return `${Math.round(Math.max(0, finite(value)) * 10000).toLocaleString("cs-CZ")} Kč`;
  }

  function campaignActive(target = stateOf()) {
    return Boolean(target && !target.ended && document.getElementById("gameScreen")?.classList.contains("active"));
  }

  function meter(label, value, kind = "good", empty = false) {
    const safe = clamp(value);
    return `<div class="k163-meter ${kind} ${empty ? "empty" : ""}"><span>${esc(label)}</span><i><u style="width:${empty ? 0 : safe}%"></u></i><b>${empty ? "—" : Math.round(safe)}</b></div>`;
  }

  function toast(message, kind = "normal") {
    let box = document.getElementById("k163Toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "k163Toast";
      box.className = "k163-toast";
      box.setAttribute("role", "status");
      document.body.appendChild(box);
    }
    box.className = `k163-toast ${kind} show`;
    box.textContent = message;
    setTimeout(() => box.classList.remove("show"), 2500);
  }

  function topbar(target) {
    const day = Math.max(1, finite(target.day, 1));
    const weekdays = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
    const trust = clamp(target.stats?.trust);
    const influence = clamp(target.stats?.influence);
    const funds = Math.max(0, finite(target.stats?.funds));
    const resource = (icon, label, value, width, kind = "") => `<article class="k16-resource ${kind}"><span aria-hidden="true">${icon}</span><span>${label}</span><b>${esc(value)}</b><i><u style="width:${clamp(width)}%"></u></i></article>`;
    return `<header class="k16-topbar k163-topbar">
      <section class="k16-day"><span class="k16-weather" aria-hidden="true">☀️</span><div><b>Den ${day}</b><span>${weekdays[(day - 1) % 7]}</span><small>Květen, rok 2 · ${Math.max(0, finite(target.actions))} akce</small></div><div class="k16-place">◆ Dolní Vejprnice</div></section>
      <section class="k16-logo"><strong>KORYTO</strong><span>POLITICKÁ RPG STRATEGIE</span></section>
      <section class="k16-resources">${resource("🤝", "DŮVĚRA", `${Math.round(trust)}`, trust)}${resource("♛", "VLIV", `${Math.round(influence)}`, influence, "influence")}${resource("🪙", "PENÍZE", money(funds), Math.min(100, funds * 5), "money")}</section>
      <button type="button" class="k16-settings" data-k163-settings aria-label="Přepnout vizuální režim">🎨</button>
    </header>`;
  }

  function portrait(id, alt) {
    return `<img src="${PORTRAITS[id] || PORTRAITS.candidate}" alt="${esc(alt)}" loading="eager">`;
  }

  function recruited(target, id) {
    return Boolean(target.party?.[id]);
  }

  function companionState(target, id) {
    const data = dataOf();
    const base = data.companions?.[id] || {};
    const member = target.party?.[id];
    const ambitionDef = data.companionAmbitionDefs?.[id] || {};
    const ambition = target.companionAmbitions?.[id] || {};
    const loyalty = clamp(member?.loyalty ?? base.loyalty ?? 0);
    const fatigueRaw = finite(target.partyFatigue?.[id], 0);
    const fatigue = clamp(fatigueRaw * 20);
    const tension = clamp(ambition.tension || 0);
    const isRecruited = Boolean(member);
    const contacted = id === "marie" && !isRecruited && Boolean(target.flags?.marieContacted);
    const withheldUntil = finite(ambition.withheldUntil, 0);
    const available = isRecruited && withheldUntil < finite(target.day, 1) && !target.partyAssignment && fatigueRaw < 4;
    return { id, base, member, ambitionDef, ambition, loyalty, fatigue, fatigueRaw, tension, isRecruited, contacted, available, withheldUntil };
  }

  function questRowsFor(target, id) {
    return (QUEST_MATCHES[id] || []).map(questId => {
      const def = questDefs()[questId];
      const state = target.quests?.[questId];
      if (!def) return null;
      const status = state?.status || "locked";
      return { id: questId, title: def.title, status };
    }).filter(Boolean);
  }

  function riskFor(target, id) {
    const item = companionState(target, id);
    if (!item.isRecruited && item.contacted) return { level: "warn", label: "Kontakt navázán", text: "Marie je kampani nakloněná, ale členkou štábu se stane až podle konkrétního řešení střechy školy." };
    if (!item.isRecruited) return { level: "locked", label: "Nenabrán", text: "Pomoc zatím není dostupná. Nábor proběhne přes konkrétní kauzu nebo osobní setkání." };
    if (item.withheldUntil >= finite(target.day, 1)) return { level: "danger", label: "Odmítá podporu", text: `Kvůli otevřenému konfliktu odmítá pomáhat do dne ${item.withheldUntil}.` };
    if (item.fatigueRaw >= 4) return { level: "danger", label: "Vyčerpaný", text: "Další mise by mohla skončit veřejným selháním nebo odchodem ze štábu." };
    if (item.loyalty < 26) return { level: "danger", label: "Riziko odchodu", text: "Loajalita je kritická. Rozhodnutí proti osobní agendě může postavu vyhnat ze štábu." };
    if (item.tension >= 55) return { level: "warn", label: "Vysoké napětí", text: "Pomoc je stále dostupná, ale může urychlit osobní konflikt." };
    if (item.loyalty >= 70 && item.fatigueRaw <= 1) return { level: "good", label: "Nízké riziko", text: "Postava je loajální a odpočatá. Vhodný čas pro podporu nebo samostatnou misi." };
    return { level: "normal", label: "Běžné riziko", text: "Pomoc funguje, ale každá mise přidává únavu a může vytvořit politický závazek." };
  }

  function companionCard(target, id) {
    const item = companionState(target, id);
    const isSelected = selected === id;
    const recruitmentState = item.isRecruited ? "recruited" : item.contacted ? "contacted" : "locked";
    const selectionState = !isSelected ? "" : item.isRecruited ? "selected" : item.contacted ? "selected-contacted" : "selected-locked";
    const location = LOCATION_LABELS[item.ambitionDef.location] || item.ambitionDef.location || "obec";
    const lockLabel = item.contacted ? `◇ KONTAKT NAVÁZÁN · ${esc(location)}` : `🔒 ZAMČENO · ${esc(location)}`;
    return `<button type="button" class="k163-companion ${recruitmentState} ${selectionState}" data-k163-member="${id}" data-k163-recruitment="${recruitmentState}" aria-label="${esc(item.base.name || id)} — ${item.isRecruited ? "člen štábu" : item.contacted ? "kontakt navázán, dosud nenabrán" : "zamčená postava"}">
      <header><b>${esc(item.base.name || id)}</b><small>${esc(ROLE_LABELS[id] || item.base.role || "ČLEN ŠTÁBU")}</small></header>
      <div class="k163-portrait">${portrait(id, item.base.name || id)}${!item.isRecruited ? `<span class="k163-lock ${item.contacted ? "contacted" : ""}">${lockLabel}</span>` : ""}</div>
      <section class="k163-card-stats">${meter("LOAJALITA", item.loyalty)}${meter("ÚNAVA", item.fatigue, "bad")}${meter("NAPĚTÍ", item.tension, "warn")}</section>
      <section class="k163-agenda"><b>${esc(item.ambitionDef.icon || "◆")} ${esc(item.ambitionDef.name || "Osobní agenda")}</b><p>${esc(item.ambitionDef.goal || item.base.tolerance || "Tato postava sleduje vlastní zájmy.")}</p></section>
      <footer><span>${esc(item.base.mission || "Bez mise")}</span><strong>${item.available ? "PŘIPRAVEN" : item.isRecruited ? item.fatigueRaw >= 4 ? "VYČERPÁN" : "OMEZEN" : item.contacted ? "KONTAKT NAVÁZÁN" : `NAJÍT: ${esc(location)}`}</strong></footer>
    </button>`;
  }

  function candidateCard(target) {
    const heroClass = classesOf()[target.hero?.classId] || {};
    const heat = clamp(target.stats?.heat || 0);
    const integrity = clamp(target.stats?.integrity || 0);
    return `<section class="k163-candidate ${selected === "candidate" ? "selected" : ""}" data-k163-member="candidate">
      <div class="k163-candidate-portrait">${portrait("candidate", target.hero?.name || "Kandidát")}</div>
      <div class="k163-candidate-copy"><small>KANDIDÁT</small><h2>${esc(target.hero?.name || "Kandidát")}</h2><p>${esc(heroClass.name || "Nezávislý kandidát")} · ${Math.max(0, finite(target.actions))} akce dnes</p>${meter("INTEGRITA", integrity)}${meter("MEDIÁLNÍ TLAK", Math.min(100, heat), "bad")}</div>
      <div class="k163-leadership"><h3>VEDENÍ KAMPANĚ</h3><p>Rozhodnutí mění důvěru, vztahy, závazky i osobní agendy členů štábu.</p><div><span>Aktivní podpora</span><b>${esc(target.selectedSupport ? (dataOf().companions?.[target.selectedSupport]?.name || target.selectedSupport) : "Nikdo")}</b></div><div><span>Dnešní mise</span><b>${esc(target.partyAssignment ? (dataOf().companions?.[target.partyAssignment.id]?.name || target.partyAssignment.id) : "Nevyslána")}</b></div></div>
    </section>`;
  }

  function morale(target) {
    const list = Object.values(target.party || {});
    if (!list.length) return null;
    return Math.round(list.reduce((sum, item) => sum + clamp(item.loyalty), 0) / list.length);
  }

  function moralePanel(target) {
    const value = morale(target);
    if (value === null) return `<section class="k163-side-panel k163-morale"><h2>TÝMOVÁ MORÁLKA</h2>${meter("MORÁLKA", 0, "good", true)}<p><strong>Štáb zatím nebyl sestaven.</strong><br>Napětí a týmové bonusy vzniknou po náboru prvních členů.</p></section>`;
    return `<section class="k163-side-panel k163-morale"><h2>TÝMOVÁ MORÁLKA</h2>${meter("MORÁLKA", value)}<p>${value >= 65 ? "Tým drží pohromadě." : value >= 40 ? "Tým funguje, ale sleduje účty." : "Štáb je blízko otevřenému rozkolu."}</p></section>`;
  }

  function relationshipRows(target, onlySelected = false) {
    const defs = dataOf().relationshipDefs || {};
    const rows = Object.entries(defs).filter(([, def]) => !onlySelected || def.a === selected || def.b === selected).map(([id, def]) => {
      const both = recruited(target, def.a) && recruited(target, def.b);
      const score = finite(target.relationships?.[id], def.base || 0);
      const tension = clamp(50 - score);
      return `<article class="${both ? "active" : "inactive"}"><span>${esc(def.label)}</span><i><u style="width:${both ? tension : 0}%"></u></i><b>${both ? `${Math.round(tension)}%` : "po náboru"}</b></article>`;
    });
    if (!rows.length) return '<p class="k163-empty-state">Vyber člena štábu. Zobrazí se jeho vztahy a možné konflikty.</p>';
    return rows.join("");
  }

  function activeRoles(target) {
    const cards = IDS.filter(id => recruited(target, id)).map(id => {
      const base = dataOf().companions?.[id] || {};
      return `<button type="button" data-k163-member="${id}"><span>${portrait(id, base.name || id)}</span><b>${esc(ROLE_ICONS[id] || "◆")} ${esc(ROLE_LABELS[id] || base.role || id)}</b><small>${esc(base.name || id)}</small></button>`;
    });
    if (!cards.length) cards.push('<p class="k163-empty-state">Štáb je zatím prázdný. Postavy získáš řešením kauz v jejich lokalitách.</p>');
    return cards.join("");
  }

  function selectedPanel(target) {
    if (selected === "candidate") {
      const teamCount = Object.keys(target.party || {}).length;
      const urgent = Object.entries(target.quests || {}).filter(([id, q]) => q.status === "active" && questDefs()[id]).length;
      return `<div class="k163-selected-head">${portrait("candidate", target.hero?.name || "Kandidát")}<div><small>AKTUÁLNĚ VYBRÁN</small><h3>${esc(target.hero?.name || "Kandidát")}</h3><p>Kandidát</p></div></div><h4>STAV KAMPANĚ</h4><dl><dt>Členové štábu</dt><dd>${teamCount}/5</dd><dt>Aktivní kauzy</dt><dd>${urgent}</dd><dt>Politický dluh</dt><dd>${Math.max(0, finite(target.debt))}</dd><dt>Aktivní podpora</dt><dd>${esc(target.selectedSupport ? dataOf().companions?.[target.selectedSupport]?.name || target.selectedSupport : "Nikdo")}</dd></dl><p class="k163-panel-note">Vyber postavu. Uvidíš její agendu, vztahy, vhodné kauzy a cenu pomoci.</p>`;
    }
    const item = companionState(target, selected);
    const location = LOCATION_LABELS[item.ambitionDef.location] || item.ambitionDef.location || "obec";
    const support = dataOf().supportProfiles?.[selected];
    const risk = riskFor(target, selected);
    const quests = questRowsFor(target, selected);
    return `<div class="k163-selected-head">${portrait(selected, item.base.name || selected)}<div><small>AKTUÁLNĚ VYBRÁN</small><h3>${esc(item.base.name || selected)}</h3><p>${esc(item.base.role || "Člen štábu")}</p></div></div>
      <h4>OSOBNÍ AGENDA</h4><p>${esc(item.ambitionDef.goal || item.base.tolerance || "")}</p>
      <h4>STAV A POMOC</h4><dl><dt>Role</dt><dd>${esc(ROLE_LABELS[selected] || item.base.role || "")}</dd><dt>Podpora</dt><dd>${esc(support?.label || "Specializovaná pomoc")}</dd><dt>Mise</dt><dd>${esc(item.base.mission || "")}</dd><dt>Nábor</dt><dd>${item.isRecruited ? "Člen štábu" : item.contacted ? `Kontakt navázán · rozhodne kauza Střecha školy` : `Najít: ${esc(location)}`}</dd></dl>
      <h4>VHODNÉ KAUZY</h4><div class="k163-quest-chips">${quests.map(q => `<span class="${q.status}">${esc(q.title)}<small>${esc(q.status)}</small></span>`).join("") || "<em>Bez přiřazené kauzy</em>"}</div>
      <h4>CENA PODPORY</h4><div class="k163-risk ${risk.level}"><b>${esc(risk.label)}</b><p>${esc(risk.text)}</p></div>
      ${item.isRecruited ? "" : `<p class="k163-recruit-hint">${esc(item.contacted ? "Marie váš projev zaznamenala. Teď musíte dokázat, že škola a děti nejsou jen předvolební kulisa." : RECRUIT_HINTS[selected] || "Najdi postavu v její lokalitě.")}</p><button type="button" class="k163-find" data-k163-find="${esc(item.ambitionDef.location || "")}">${item.contacted ? "POKRAČOVAT KE ŠKOLE" : "PŘEJÍT DO LOKALITY"}</button>`}`;
  }

  function peopleView(target) {
    return `${candidateCard(target)}<div class="k163-companion-grid">${IDS.map(id => companionCard(target, id)).join("")}</div><section class="k163-role-strip"><h2>AKTIVNÍ ROLE (${Object.keys(target.party || {}).length}/5)</h2><div>${activeRoles(target)}</div></section>`;
  }

  function rolesView(target) {
    return `<section class="k163-tab-board"><header><h2>ROLE VE ŠTÁBU</h2><p>Každá role vychází ze skutečné specializace postavy. Neobsazená role znamená, že příslušný bonus v kampani chybí.</p></header><div class="k163-role-grid">${IDS.map(id => {
      const item = companionState(target, id);
      const location = LOCATION_LABELS[item.ambitionDef.location] || item.ambitionDef.location || "obec";
      return `<article class="${item.isRecruited ? "filled" : "vacant"}"><div class="k163-role-avatar">${portrait(id, item.base.name || id)}</div><section><small>${esc(ROLE_ICONS[id])} ROLE</small><h3>${esc(ROLE_LABELS[id])}</h3><b>${esc(item.base.name || id)}</b><p>${(ROLE_BONUSES[id] || []).map(value => `✦ ${esc(value)}`).join("<br>")}</p><button type="button" data-k163-member="${id}">${item.isRecruited ? "ZOBRAZIT ČLENA" : `NAJÍT: ${esc(location)}`}</button></section></article>`;
    }).join("")}</div></section>`;
  }

  function loyaltyView(target) {
    const rows = IDS.map(id => companionState(target, id)).sort((a, b) => Number(b.isRecruited) - Number(a.isRecruited) || b.loyalty - a.loyalty);
    return `<section class="k163-tab-board"><header><h2>LOAJALITA A RIZIKA</h2><p>Loajalita ovlivňuje bonusy, konflikty i možnost odchodu. Únava roste misemi, napětí osobními agendami.</p></header><div class="k163-loyalty-list">${rows.map(item => {
      const risk = riskFor(target, item.id);
      return `<button type="button" data-k163-member="${item.id}" class="${selected === item.id ? "selected" : ""} ${item.isRecruited ? "" : item.contacted ? "contacted" : "locked"}"><span class="k163-loyalty-avatar">${portrait(item.id, item.base.name || item.id)}</span><span class="k163-loyalty-name"><b>${esc(item.base.name || item.id)}</b><small>${esc(item.isRecruited ? ROLE_LABELS[item.id] : item.contacted ? "NAKLONĚNA" : "NENABRÁN")}</small></span><span>${meter("LOAJALITA", item.loyalty)}</span><span>${meter("ÚNAVA", item.fatigue, "bad")}</span><span>${meter("NAPĚTÍ", item.tension, "warn")}</span><em class="${risk.level}">${esc(risk.label)}</em></button>`;
    }).join("")}</div></section>`;
  }

  function findConflictForPair(a, b, target) {
    return Object.entries(dataOf().conflictDefs || {}).find(([id, def]) => ((def.a === a && def.b === b) || (def.a === b && def.b === a)) && target.conflictStates?.[id]?.queued && !target.conflictStates?.[id]?.resolved);
  }

  function conflictsView(target) {
    const defs = dataOf().relationshipDefs || {};
    return `<section class="k163-tab-board"><header><h2>KONFLIKTY A VZTAHY</h2><p>Rozdílné zájmy nejsou kosmetika. Aktivní konflikt může zablokovat podporu, snížit loajalitu nebo rozdělit štáb.</p></header><div class="k163-conflict-grid">${Object.entries(defs).map(([id, def]) => {
      const both = recruited(target, def.a) && recruited(target, def.b);
      const score = finite(target.relationships?.[id], def.base || 0);
      const tension = clamp(50 - score);
      const conflict = findConflictForPair(def.a, def.b, target);
      const a = dataOf().companions?.[def.a] || {};
      const b = dataOf().companions?.[def.b] || {};
      return `<article class="${both ? "active" : "locked"}"><div class="k163-conflict-portraits"><span>${portrait(def.a, a.name || def.a)}</span><strong>↔</strong><span>${portrait(def.b, b.name || def.b)}</span></div><h3>${esc(def.label)}</h3><div class="k163-conflict-meter"><i><u style="width:${both ? tension : 0}%"></u></i><b>${both ? `${Math.round(tension)}%` : "Čeká na nábor"}</b></div><p>${conflict ? "Konflikt je otevřený a vyžaduje zásah kandidáta." : both ? "Vztah je aktivní. Další rozhodnutí mohou napětí zvýšit nebo snížit." : `Nejdřív musí být ve štábu ${esc(a.name || def.a)} i ${esc(b.name || def.b)}.`}</p>${conflict ? `<button type="button" data-k163-conflict-event="${esc(conflict[1].event)}">ŘEŠIT KONFLIKT</button>` : ""}</article>`;
    }).join("")}</div></section>`;
  }

  function centerView(target) {
    if (staffTab === "roles") return rolesView(target);
    if (staffTab === "loyalty") return loyaltyView(target);
    if (staffTab === "conflicts") return conflictsView(target);
    return peopleView(target);
  }

  function tabButton(id, icon, label) {
    return `<button type="button" class="${staffTab === id ? "active" : ""}" data-k163-tab="${id}">${icon} ${label}</button>`;
  }

  function actionButtons(target) {
    const item = selected === "candidate" ? null : companionState(target, selected);
    const activeConflict = item?.isRecruited ? Object.entries(dataOf().conflictDefs || {}).find(([id, def]) => (def.a === selected || def.b === selected) && target.conflictStates?.[id]?.queued && !target.conflictStates?.[id]?.resolved) : null;
    const supportDisabled = !item?.isRecruited || item.withheldUntil >= finite(target.day, 1);
    const deployDisabled = !item?.isRecruited || item.fatigueRaw >= 4 || Boolean(target.partyAssignment) || target.partyUsedDay === target.day;
    const talkLabel = item && !item.isRecruited ? "📍 NAJÍT V OBCI" : "💬 PROMLUVIT";
    const talkDetail = item && !item.isRecruited ? `Přejít: ${LOCATION_LABELS[item.ambitionDef.location] || "lokalita"}` : "Otevřít osobní agendu";
    return `<section class="k163-actions"><button type="button" class="blue" data-k163-support ${supportDisabled ? "disabled" : ""}>🛡️ VYBRAT PODPORU<small>Bonus pro příští vhodný hod</small></button><button type="button" class="green" data-k163-deploy ${deployDisabled ? "disabled" : ""}>📣 VYSLAT NA MISI<small>Výsledek přijde na konci dne</small></button><button type="button" class="gold" data-k163-talk ${selected === "candidate" ? "disabled" : ""}>${talkLabel}<small>${esc(talkDetail)}</small></button><button type="button" class="red" data-k163-conflict ${activeConflict ? "" : "disabled"}>✊ ŘEŠIT KONFLIKT<small>${activeConflict ? "Konflikt je právě otevřený" : "Žádný aktivní konflikt"}</small></button></section>`;
  }

  function desktopNav(active) {
    return `<nav class="k16-bottom k16-bottom-desktop" aria-label="Hlavní navigace">${NAV.map(([id, icon, label]) => `<button type="button" class="${id === active ? "active" : ""}" data-k163-nav="${id}" ${id === active ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join("")}</nav>`;
  }

  function mobileNav(active) {
    return `<nav class="k16-bottom k16-bottom-mobile" aria-label="Mobilní navigace">${MOBILE_NAV.map(([id, icon, label]) => `<button type="button" class="${id === active ? "active" : ""}" ${id === "more" ? "data-k163-more" : `data-k163-nav="${id}"`} ${id === active ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join("")}</nav><section class="k16-more-drawer k163-more" data-k163-drawer hidden><header><b>DALŠÍ SEKCE</b><button type="button" data-k163-close>×</button></header><div>${MORE.map(([id, icon, label]) => `<button type="button" data-k163-nav="${id}"><span>${icon}</span><b>${label}</b></button>`).join("")}</div></section>`;
  }

  function renderStaff() {
    const target = stateOf();
    if (!campaignActive(target)) return false;
    view = "staff";
    document.documentElement.classList.add("k16-active", "k163-active", "k163-staff-view");
    document.documentElement.classList.remove("k163-map-view");
    const root = rootOf();
    if (!root) return false;
    root.hidden = false;
    root.innerHTML = `<div class="k16-shell k163-shell">${topbar(target)}
      <main class="k163-staff-layout">
        <aside class="k163-side left"><section class="k163-side-panel"><h2>ŠTÁB</h2>${tabButton("people", "👥", "LIDÉ")}${tabButton("roles", "🛡️", "ROLE")}${tabButton("loyalty", "♥", "LOAJALITA")}${tabButton("conflicts", "⚔", "KONFLIKTY")}</section>${moralePanel(target)}${playtestMode() ? (IDS.every(id => target.party?.[id]) ? '<button class="k163-test-button done" type="button" disabled>TEST: VŠECH 5 ODEMČENO</button>' : '<button class="k163-test-button" type="button" data-k163-recruit-all onclick="globalThis.KorytoUI163.recruitAll(event); return false;">TEST: ODEMKNI VŠECH 5 POSTAV</button>') : ""}</aside>
        <section class="k163-center"><header class="k163-title"><h1>ŠTÁB</h1><p>Lidé, role, agendy a napětí v týmu</p></header>${centerView(target)}</section>
        <aside class="k163-side right"><section class="k163-side-panel k163-selected">${selectedPanel(target)}</section><section class="k163-side-panel"><h2>VZTAHY VE ŠTÁBU</h2><div class="k163-relationships">${relationshipRows(target, selected !== "candidate")}</div></section></aside>
      </main>
      ${actionButtons(target)}${desktopNav("staff")}${mobileNav("staff")}</div>`;
    bindStaff(root);
    document.title = `Koryto ${VERSION} – hratelná mapa a štáb`;
    return true;
  }

  function recruitAll(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const target = stateOf();
    const data = dataOf();
    if (!target) {
      toast("Nejdřív spusť novou hru.", "bad");
      return false;
    }
    target.party = target.party || {};
    target.partyFatigue = target.partyFatigue || {};
    target.companionAmbitions = target.companionAmbitions || {};
    target.relationships = target.relationships || {};
    target.flags = target.flags || {};
    IDS.forEach(id => {
      const base = data.companions?.[id];
      if (base && !target.party[id]) target.party[id] = { ...base, loyalty: finite(base.loyalty, 50) };
      target.partyFatigue[id] = finite(target.partyFatigue[id], 0);
      const ambition = data.companionAmbitionDefs?.[id];
      if (ambition && !target.companionAmbitions[id]) target.companionAmbitions[id] = { progress: 18, tension: 0, resolved: false, path: null, queued: false, withheldUntil: 0, lastActionDay: 0 };
    });
    Object.entries(data.relationshipDefs || {}).forEach(([id, def]) => { if (!Number.isFinite(target.relationships[id])) target.relationships[id] = finite(def.base, 0); });
    target.flags.v0163TestRosterUnlocked = true;
    globalThis.KorytoApp?.setState?.(target);
    selected = "marie";
    staffTab = "people";
    toast("Všech pět postav bylo odemčeno pro testování.", "good");
    renderStaff();
    return false;
  }

  function deploySelected() {
    const target = stateOf();
    if (!target || selected === "candidate" || !target.party?.[selected]) return toast("Nejdřív vyber přijatého člena štábu.", "bad");
    if (target.phase !== "map") return toast("Mise lze vysílat pouze z mapové fáze.", "bad");
    if (target.partyUsedDay === target.day || target.partyAssignment) return toast("Dnešní samostatná mise už byla přidělena.", "bad");
    const fatigue = finite(target.partyFatigue?.[selected]);
    if (fatigue >= 4) return toast(`${target.party[selected].name} je politicky vyčerpaný.`, "bad");
    target.partyFatigue = target.partyFatigue || {};
    target.partyAssignment = { id: selected, day: target.day };
    target.partyUsedDay = target.day;
    target.partyFatigue[selected] = fatigue + 2;
    target.news = target.news || [];
    target.log = target.log || [];
    const mission = target.party[selected].mission || dataOf().companions?.[selected]?.mission || "politická mise";
    target.news.unshift({ day: target.day, text: `${target.party[selected].name} vyráží na misi: ${mission}. Výsledek přijde na konci dne.`, type: "normal" });
    target.log.push(`Den ${target.day}: ${target.party[selected].name} vyslán na misi ${mission}.`);
    globalThis.renderAll?.();
    toast("Mise přidělena. Výsledek se vyhodnotí při ukončení dne.", "good");
    queueRender();
  }

  function selectSupport() {
    const target = stateOf();
    if (!target || selected === "candidate" || !target.party?.[selected]) return toast("Vyber přijatého člena štábu.", "bad");
    const ambition = target.companionAmbitions?.[selected];
    if (finite(ambition?.withheldUntil, 0) >= finite(target.day, 1)) return toast("Tento člen kvůli konfliktu momentálně odmítá podporu.", "bad");
    target.selectedSupport = selected;
    toast(`${target.party[selected].name} je připraven zasáhnout do příští vhodné volby.`, "good");
    renderStaff();
  }

  function talkSelected() {
    const target = stateOf();
    if (!target || selected === "candidate") return toast("Vyber člena štábu.", "bad");
    const ambition = dataOf().companionAmbitionDefs?.[selected];
    const story = dataOf().companionStoryDefs?.[selected];
    const location = ambition?.location || story?.location;
    if (!location) return toast("Tato postava zatím nemá osobní lokaci.", "bad");
    toast(recruited(target, selected) ? "Přesouvám k osobní agendě postavy." : "Přesouvám do lokality, kde lze postavu získat.");
    showLegacy(() => globalThis.showLocation?.(location));
  }

  function conflictSelected() {
    const target = stateOf();
    if (!target || selected === "candidate") return toast("Vyber člena štábu.", "bad");
    const entry = Object.entries(dataOf().conflictDefs || {}).find(([id, def]) => (def.a === selected || def.b === selected) && target.conflictStates?.[id]?.queued && !target.conflictStates?.[id]?.resolved);
    if (!entry) return toast("U této postavy teď není otevřený konflikt.");
    showLegacy(() => globalThis.showEvent?.(entry[1].event));
  }

  function bindStaff(root) {
    root.querySelectorAll("[data-k163-member]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); selected = button.dataset.k163Member; renderStaff(); }));
    root.querySelectorAll("[data-k163-tab]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); staffTab = button.dataset.k163Tab; renderStaff(); }));
    root.querySelector("[data-k163-support]")?.addEventListener("click", event => { event.stopPropagation(); selectSupport(); });
    root.querySelector("[data-k163-deploy]")?.addEventListener("click", event => { event.stopPropagation(); deploySelected(); });
    root.querySelector("[data-k163-talk]")?.addEventListener("click", event => { event.stopPropagation(); talkSelected(); });
    root.querySelector("[data-k163-conflict]")?.addEventListener("click", event => { event.stopPropagation(); conflictSelected(); });
    root.querySelector("[data-k163-recruit-all]")?.addEventListener("click", event => { event.stopPropagation(); recruitAll(); });
    root.querySelector("[data-k163-find]")?.addEventListener("click", event => { event.stopPropagation(); showLegacy(() => globalThis.showLocation?.(event.currentTarget.dataset.k163Find)); });
    root.querySelectorAll("[data-k163-conflict-event]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); showLegacy(() => globalThis.showEvent?.(button.dataset.k163ConflictEvent)); }));
    root.querySelector("[data-k163-settings]")?.addEventListener("click", event => { event.stopPropagation(); document.getElementById("pixelToggle")?.click(); });
    root.querySelector("[data-k163-more]")?.addEventListener("click", event => { event.stopPropagation(); const drawer = root.querySelector("[data-k163-drawer]"); if (drawer) drawer.hidden = !drawer.hidden; });
    root.querySelector("[data-k163-close]")?.addEventListener("click", event => { event.stopPropagation(); const drawer = root.querySelector("[data-k163-drawer]"); if (drawer) drawer.hidden = true; });
    root.querySelectorAll("[data-k163-nav]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); navigate(button.dataset.k163Nav); }));
  }

  function showMap() {
    view = "map";
    selected = "candidate";
    document.documentElement.classList.remove("k163-staff-view");
    document.documentElement.classList.add("k163-active", "k163-map-view");
    globalThis.showMap?.();
    setTimeout(() => {
      globalThis.KorytoUI160?.refresh?.();
      decorateMap();
    }, 0);
  }

  function showLegacy(action) {
    view = "legacy";
    document.documentElement.classList.remove("k16-active", "k163-active", "k163-map-view", "k163-staff-view");
    const root = rootOf();
    if (root) root.hidden = true;
    action?.();
    setTimeout(() => {
      document.documentElement.classList.remove("k16-active", "k163-active", "k163-map-view", "k163-staff-view");
      if (root) root.hidden = true;
    }, 0);
  }

  function navigate(name) {
    if (name === "map") return showMap();
    if (name === "staff") return renderStaff();
    if (name === "coalition") return showLegacy(() => {
      const target = stateOf();
      if (target?.coalition?.active && typeof globalThis.showCoalitionScreen === "function") globalThis.showCoalitionScreen();
      else globalThis.KorytoVisual148?.openDesk?.("elections");
    });
    showLegacy(() => globalThis.KorytoVisual148?.openDesk?.(name));
  }

  function decorateMap() {
    if (view !== "map") return;
    document.documentElement.classList.add("k163-active", "k163-map-view");
    document.documentElement.classList.remove("k163-staff-view");
    const root = rootOf();
    if (root) root.dataset.k163MapArt = "approved";
    document.title = `Koryto ${VERSION} – hratelná mapa a štáb`;
  }

  function captureNavigation(event) {
    const button = event.target.closest?.("[data-k16-nav]");
    if (!button) return;
    const name = button.dataset.k16Nav;
    if (!name) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(name);
  }

  function queueRender() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      if (view === "staff" && campaignActive()) renderStaff();
      else if (view === "map" && campaignActive()) decorateMap();
    }, 0);
  }

  function wrap(name, mode) {
    const original = globalThis[name];
    if (typeof original !== "function" || original.__k163Wrapped) return;
    const wrapped = function (...args) {
      if (mode) view = mode;
      const result = original.apply(this, args);
      setTimeout(() => {
        if (mode === "legacy") showLegacy();
        else queueRender();
      }, 0);
      return result;
    };
    wrapped.__k163Wrapped = true;
    globalThis[name] = wrapped;
  }

  function visualAudit(target = stateOf()) {
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      view,
      staffTab,
      campaignActive: campaignActive(target),
      approvedMap: Boolean(document.querySelector("[data-k163-map-art='approved']")),
      staffCards: document.querySelectorAll(".k163-companion").length,
      tabs: document.querySelectorAll("[data-k163-tab]").length,
      recruited: Object.keys(target?.party || {}).length,
      selectedSupport: target?.selectedSupport || null,
      partyAssignment: target?.partyAssignment?.id || null,
      playtestMode: playtestMode()
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    document.addEventListener("click", event => {
      const button = event.target.closest?.("[data-k163-recruit-all]");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      recruitAll(event);
    }, true);
    document.addEventListener("click", captureNavigation, true);
    document.addEventListener("click", queueRender);
    document.addEventListener("change", queueRender);
    ["renderAll", "newGame", "load"].forEach(name => wrap(name, null));
    ["showLocation", "showEvent", "startDebate", "showCoalitionScreen"].forEach(name => wrap(name, "legacy"));
    setTimeout(() => { if (campaignActive()) decorateMap(); }, 0);
    globalThis.KorytoUI163 = { VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, PORTRAITS, renderStaff, showMap, navigate, deploySelected, selectSupport, recruitAll, visualAudit, install };
    return true;
  }

  install();
})();
