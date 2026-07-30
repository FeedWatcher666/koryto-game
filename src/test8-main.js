import {ATTRIBUTES, CLASSES, ORIGINS, VERSION} from "./data.js";
import {playD20Roll} from "./dice.js";
import {deriveAttributes, resolveCheck} from "./rules.js";
import {
  TEST8_LOCATIONS,
  TEST8_STAFF,
  TEST8_STRATEGIES,
  applyCampaignAction,
  applyFinalCampaignResult,
  availableCampaignActions,
  availableFinalTactics,
  campaignActionById,
  choiceForCampaignAction,
  chooseCampaignStaff,
  chooseFinalStrategy,
  chooseFinalTactic,
  clearTest8Save,
  createTest8State,
  currentRivalPlan,
  exportPlaytest,
  finalCampaignChoice,
  loadTest8State,
  saveTest8State,
  startTest8Campaign
} from "./test8-campaign.js";

const app = document.getElementById("app");
let state = loadTest8State() || createTest8State();
let creationNameDraft = state.hero.name || "";
let rolling = false;
let transitionLocked = false;

const forcedRolls = (() => {
  const params = new URLSearchParams(location.search);
  const raw = params.get("rolls") || params.get("roll") || "";
  return raw.split(",").map(value => Number(value.trim())).filter(value => Number.isInteger(value) && value >= 1 && value <= 20);
})();
let forcedRollIndex = 0;

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);

function randomSource() {
  if (!forcedRolls.length) return Math.random;
  return () => {
    const value = forcedRolls[Math.min(forcedRollIndex, forcedRolls.length - 1)];
    forcedRollIndex += 1;
    return (value - 0.01) / 20;
  };
}

function creationView() {
  return `<main class="t8-creation">
    <section class="t8-hero-copy">
      <p class="t8-kicker">KORYTO · CLEAN TEST.8 REDESIGN</p>
      <h1>Každý den něco zachráníte. A něco ztratíte.</h1>
      <p>Máte tři dny, šest akcí a soupeře, který fyzicky mění mapu podle toho, co necháte bez ochrany.</p>
      <div class="t8-promise"><strong>Pravidlo kampaně:</strong><span>ze tří důležitých příležitostí stihnete dvě. Třetí Věčný trvale poškodí.</span></div>
    </section>
    <form id="creationForm" class="t8-creation-form">
      <label for="heroName">Jméno kandidáta</label>
      <input id="heroName" name="heroName" maxlength="32" autocomplete="off" placeholder="např. Bohuslav Pravdomluvný">
      <fieldset><legend>Původ</legend><div class="t8-choice-grid">${Object.entries(ORIGINS).map(([id, item]) => `
        <button type="button" class="t8-choice ${state.hero.originId === id ? "is-selected" : ""}" data-origin="${id}" aria-pressed="${state.hero.originId === id}">
          <strong>${item.name}</strong><span>${item.description}</span>
        </button>`).join("")}</div></fieldset>
      <fieldset><legend>Třída</legend><div class="t8-choice-grid">${Object.entries(CLASSES).map(([id, item]) => `
        <button type="button" class="t8-choice ${state.hero.classId === id ? "is-selected" : ""}" data-class="${id}" aria-pressed="${state.hero.classId === id}">
          <b>${item.icon}</b><strong>${item.name}</strong><span>${item.description}</span><small>${item.perk}</small>
        </button>`).join("")}</div></fieldset>
      <section class="t8-attributes" aria-label="Atributy postavy">${ATTRIBUTES.map(([id, label]) => `<div><span>${label}</span><strong>${state.hero.attributes[id]}</strong></div>`).join("")}</section>
      <button class="t8-primary" type="submit">Vstoupit do kampaně</button>
    </form>
  </main>`;
}

function resource(label, value, note) {
  return `<div class="t8-resource"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}

function campaignHeader() {
  const doctrine = state.campaign.finalStrategy ? TEST8_STRATEGIES[state.campaign.finalStrategy] : null;
  return `<header class="t8-hud">
    <div class="t8-brand"><span>K</span><div><small>SATIRICKÉ POLITICKÉ RPG</small><strong>KORYTO</strong></div></div>
    <div class="t8-goal"><small>HLAVNÍ CÍL</small><strong>${doctrine ? `${doctrine.name}: ${doctrine.failure}` : "Zastavte prodej JZD a přežijte veřejné jednání"}</strong></div>
    <div class="t8-resources">
      ${resource("DEN", `${state.campaign.day}/3`, "čas do jednání")}
      ${resource("AKCE", state.campaign.actionsLeft, "každá volba stojí 1")}
      ${resource("PODPORA", state.resources.support, doctrine?.primary === "Podpora" ? "hlavní zdroj doktríny" : "lidé za vámi")}
      ${resource("DŮKAZY", state.resources.evidence, doctrine?.primary === "Důkazy" ? "hlavní zdroj doktríny" : "co unesete na stůl")}
      ${resource("TLAK", state.resources.pressure, "10 znamená prohru")}
    </div>
    <div class="t8-system-actions"><button data-system="save">Uložit</button><button data-system="restart">Nová kampaň</button></div>
  </header>`;
}

function caseCard(item) {
  const active = item.status === "active";
  const progress = Math.min(100, item.progress / 4 * 100);
  const statusLabels = {locked: "ODEMKNE SE 2. DEN", resolved: "VYŘEŠENO", carried: "PŘENESENO DÁL", failed: "PROHRÁNO", unresolved: "NEUZAVŘENO"};
  const status = active ? `TERMÍN: DEN ${item.deadline}` : statusLabels[item.status] || item.status.toUpperCase();
  return `<article class="t8-case ${active ? "is-active" : "is-locked"}">
    <div><small>${status}</small><strong>${item.title}</strong></div>
    <p>${item.threat}</p>
    <div class="t8-meter" aria-label="Pokrok kauzy ${item.progress} ze 4"><i style="width:${progress}%"></i></div>
    <footer><span>Pokrok <b>${item.progress}/4</b></span><span>Zanedbání <b>${item.neglect}</b></span></footer>
  </article>`;
}

function actionCard(action) {
  const choice = choiceForCampaignAction(state, action);
  const risk = action.automatic ? "Bez hodu · jistá cena jedné akce" : `d20 · ${choice.attribute} · obtížnost ${choice.dc}`;
  const kind = action.isResponse ? "REAKCE NA VĚČNÉHO" : action.requiresStrategy ? "AKCE DOKTRÍNY" : action.requiresStaff ? "AKCE ŠTÁBU" : "1 AKCE";
  return `<button class="t8-action-card ${action.automatic || action.isResponse ? "is-special" : ""}" data-campaign-action="${action.id}">
    <span class="t8-action-top"><b>${kind}</b><em>${risk}</em></span>
    <strong>${action.title}</strong>
    <span>${action.detail}</span>
    <dl><div><dt>Záměr</dt><dd>${action.intent}</dd></div><div><dt>Riziko</dt><dd>${action.risk}</dd></div></dl>
  </button>`;
}

function locationCard(locationId, actions, rival) {
  const location = TEST8_LOCATIONS[locationId];
  const blocked = rival.blockedLocation === locationId;
  return `<section class="t8-location t8-location-${locationId} ${blocked ? "is-blocked" : ""}">
    <header><span>${location.icon}</span><div><h2>${location.name}</h2><p>${location.description}</p></div></header>
    ${blocked ? `<div class="t8-blocked"><strong>UZAVŘENO VĚČNÝM</strong><span>${esc(rival.title)}</span></div>` : ""}
    <div class="t8-location-actions">${actions.length ? actions.map(actionCard).join("") : `<p class="t8-muted">${blocked ? "Nejdřív musíte použít reakční akci v jiné lokaci." : "Dnes už tady není další smysluplný tah."}</p>`}</div>
  </section>`;
}

function resultBanner() {
  const result = state.campaign.lastResult;
  if (!result) return "";
  const tone = result.kind === "rival" ? "is-rival" : result.kind === "response" ? "is-costly" : result.level ? `is-${result.level}` : "is-decision";
  const label = result.kind === "rival" ? "VĚČNÝ ZMĚNIL MAPU" : result.kind === "response" ? "REAKCE NA VĚČNÉHO" : result.kind === "decision" ? "VAŠE STRATEGICKÉ ROZHODNUTÍ" : "DŮSLEDEK POSLEDNÍ AKCE";
  return `<section class="t8-result ${tone}" aria-live="polite">
    <small>${label}</small><strong>${esc(result.title)}</strong><p>${esc(result.text)}</p>${Number.isInteger(result.roll) ? `<span>Hod d20: <b>${result.roll}</b></span>` : ""}
  </section>`;
}

function sacrificeList() {
  if (!state.campaign.sacrificeLog.length) return `<p class="t8-muted">První ztrátu určí konec dne.</p>`;
  return state.campaign.sacrificeLog.map(item => `<article class="t8-sacrifice"><small>DEN ${item.day} · NEUDĚLALI JSTE</small><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></article>`).join("");
}

function mapView() {
  const actions = availableCampaignActions(state);
  const byLocation = id => actions.filter(action => action.locationId === id);
  const rival = currentRivalPlan(state);
  const doctrine = state.campaign.finalStrategy ? TEST8_STRATEGIES[state.campaign.finalStrategy] : null;
  return `<main class="t8-campaign">
    ${campaignHeader()}
    <section class="t8-situation">
      <div><small>CO SE ROZHODUJE</small><h1>Den ${state.campaign.day}: ze tří důležitých věcí zachráníte dvě</h1><p>Po druhé akci se jedna neprovedená příprava změní v trvalou ztrátu. Věčný podle ní upraví další mapu.</p></div>
      <aside class="t8-rival"><span>V</span><div><small>VĚČNÉHO AKTUÁLNÍ ZÁSAH</small><strong>${esc(rival.title)}</strong><p>${esc(rival.trigger)}</p></div></aside>
    </section>
    ${resultBanner()}
    <section class="t8-main-grid">
      <div class="t8-village-map" aria-label="Mapa Dolních Vejprnic se třemi lokacemi">
        <div class="t8-road" aria-hidden="true"></div>
        ${Object.keys(TEST8_LOCATIONS).map(id => locationCard(id, byLocation(id), rival)).join("")}
      </div>
      <aside class="t8-sidebar">
        ${doctrine ? `<section class="t8-doctrine"><p class="t8-kicker">ZVOLENÁ DOKTRÍNA</p><strong>${doctrine.name}</strong><p>${doctrine.description}</p><small>Podmínka prohry: ${doctrine.failure}</small></section>` : ""}
        <section><p class="t8-kicker">AKTIVNÍ KAUZY</p>${Object.values(state.campaign.cases).map(caseCard).join("")}</section>
        <section><p class="t8-kicker">CO JSTE OBĚTOVALI</p>${sacrificeList()}</section>
        <section class="t8-rule"><strong>Jednoduché pravidlo tahu</strong><ol><li>Vyberte dvě akce.</li><li>Třetí příležitost ztratíte.</li><li>Věčný podle ní zablokuje další mapu.</li></ol></section>
      </aside>
    </section>
  </main>`;
}

function dayDecisionIntro() {
  const last = state.campaign.rivalLog.at(-1);
  return `<section class="t8-day-report">
    <small>UZÁVĚRKA DNE ${last?.day || state.campaign.day}</small>
    <h1>${esc(last?.title || "Věčný provedl protiakci")}</h1>
    <p>${esc(last?.text || "Soupeř změnil situaci.")}</p>
  </section>`;
}

function staffView() {
  return `<main class="t8-decision-screen">${campaignHeader()}${dayDecisionIntro()}
    <section class="t8-decision-copy"><p class="t8-kicker">PŘED DRUHÝM DNEM · ŠTÁB</p><h2>Koho vezmete do štábu?</h2><p>Člen štábu odemkne jednu vlastní akci a dává výhodu ve své domácí lokaci. Hned potom zvolíte doktrínu pro oba zbývající dny.</p></section>
    <div class="t8-staff-grid">${Object.entries(TEST8_STAFF).map(([id, item]) => `<button data-staff="${id}"><span>${id === "marie" ? "M" : id === "bohumil" ? "B" : "R"}</span><strong>${item.name}</strong><p>${item.role}</p><small>Domácí lokace: ${TEST8_LOCATIONS[item.locationId].name}</small></button>`).join("")}</div>
  </main>`;
}

function strategyView() {
  return `<main class="t8-decision-screen">${campaignHeader()}${dayDecisionIntro()}
    <section class="t8-decision-copy"><p class="t8-kicker">PŘED DRUHÝM DNEM · ZÁVAZNÁ DOKTRÍNA</p><h2>Jak budete hrát zbytek kampaně?</h2><p>Doktrína okamžitě změní akce druhého i třetího dne, hlavní zdroj, podmínku prohry a nabídku finálních taktik.</p></section>
    <div class="t8-strategy-grid">${Object.entries(TEST8_STRATEGIES).map(([id, item]) => `<button data-strategy="${id}"><strong>${item.name}</strong><p>${item.description}</p><small>Hlavní zdroj: ${item.primary}</small><small>Prohra: ${item.failure}</small></button>`).join("")}</div>
  </main>`;
}

function finalTacticView() {
  const doctrine = TEST8_STRATEGIES[state.campaign.finalStrategy];
  const tactics = availableFinalTactics(state);
  return `<main class="t8-decision-screen">${campaignHeader()}${dayDecisionIntro()}
    <section class="t8-decision-copy"><p class="t8-kicker">FINÁLE · ${doctrine.name.toUpperCase()}</p><h2>Jak přesně doktrínu provedete?</h2><p>Tohle není kosmetická volba. Taktiky používají jiný atribut a jinou základní obtížnost.</p></section>
    <div class="t8-strategy-grid">${tactics.map(item => `<button data-final-tactic="${item.id}"><strong>${item.name}</strong><p>${item.detail}</p><small>Atribut: ${ATTRIBUTES.find(([key]) => key === item.attribute)?.[1]}</small><small>Základní obtížnost: ${item.baseDc}</small></button>`).join("")}</div>
  </main>`;
}

function finalView() {
  const choice = finalCampaignChoice(state);
  return `<main class="t8-decision-screen">${campaignHeader()}${dayDecisionIntro()}
    <section class="t8-final-card">
      <p class="t8-kicker">VEŘEJNÉ JEDNÁNÍ · FINÁLE</p><h1>${choice.label}</h1><p>${choice.detail}</p>
      <div class="t8-gate ${choice.gate.ok ? "is-open" : "is-closed"}"><strong>${choice.gate.ok ? "DOKTRÍNA JE PŘIPRAVENA" : "DOKTRÍNA UŽ SELHALA"}</strong><span>${choice.gate.reason}</span><small>${choice.gate.label}: ${choice.gate.actual}</small></div>
      <div class="t8-final-summary">
        <span>Podpora <b>${state.resources.support}</b></span><span>Důkazy <b>${state.resources.evidence}</b></span><span>Tlak <b>${state.resources.pressure}</b></span><span>Obtížnost <b>${choice.dc}</b></span>
      </div>
      <p>Hod rozhodne zvládnutí okamžiku. Neumí ale nahradit chybějící lidi, důkazy ani jednotnou směnu.</p>
      <button class="t8-primary" data-final-roll>Spustit ${choice.label.toLowerCase()}</button>
    </section>
  </main>`;
}

function endingView() {
  const outcome = state.campaign.outcome;
  const cases = state.campaign.cases;
  return `<main class="t8-ending ${outcome?.won ? "is-win" : "is-loss"}">
    <p class="t8-kicker">KAMPAŇ DOKONČENA · ${outcome?.won ? "VÝHRA" : "PROHRA"}</p>
    <h1>${esc(outcome?.title || "Dolní Vejprnice rozhodly")}</h1>
    <p class="t8-ending-copy">${esc(outcome?.text || "Výsledek se ztratil v zápisu.")}</p>
    <blockquote>${esc(outcome?.reason || "Politika si důvod doplní později.")}</blockquote>
    <section class="t8-ending-grid">
      ${resource("PODPORA", state.resources.support, "konec kampaně")}
      ${resource("DŮKAZY", state.resources.evidence, "konec kampaně")}
      ${resource("TLAK", state.resources.pressure, "konec kampaně")}
      ${resource("JZD", `${cases.jzd.progress}/4`, cases.jzd.status)}
      ${resource("SILNICE", `${cases.road.progress}/4`, cases.road.status)}
      ${resource("OBĚTI", state.campaign.sacrificeLog.length, "jedna za každý den")}
    </section>
    <section class="t8-ending-sacrifices"><p class="t8-kicker">CO JSTE NENECHALI ZACHRÁNIT</p>${sacrificeList()}</section>
    <div class="t8-ending-actions"><button class="t8-primary" data-system="export">Kopírovat playtest</button><button data-system="restart">Zahrát jinou doktrínu</button></div>
    <textarea id="playtestFallback" class="t8-export-fallback" aria-label="Export playtestu" readonly hidden></textarea>
  </main>`;
}

function render(focusSelector = null) {
  if (state.screen === "creation") app.innerHTML = creationView();
  else if (state.screen === "ending") app.innerHTML = endingView();
  else if (state.campaign.phase === "staff") app.innerHTML = staffView();
  else if (state.campaign.phase === "strategy") app.innerHTML = strategyView();
  else if (state.campaign.phase === "final-tactic") app.innerHTML = finalTacticView();
  else if (state.campaign.phase === "final") app.innerHTML = finalView();
  else app.innerHTML = mapView();
  const nameInput = app.querySelector("#heroName");
  if (nameInput) nameInput.value = creationNameDraft;
  if (focusSelector) app.querySelector(focusSelector)?.focus({preventScroll: true});
}

function commit(next, {persist = true, focusSelector = null} = {}) {
  state = next;
  if (persist) saveTest8State(state);
  render(focusSelector);
}

async function performCampaignAction(actionId) {
  if (rolling) return;
  const action = campaignActionById(state, actionId);
  if (!action) return;
  if (action.automatic) {
    commit(applyCampaignAction(state, actionId));
    return;
  }
  rolling = true;
  try {
    const choice = choiceForCampaignAction(state, action);
    const result = resolveCheck(state, choice, randomSource());
    try { await playD20Roll({root: document.body, state, choice, result}); }
    catch (error) { console.error("D20 animation failed; resolving check without animation.", error); }
    commit(applyCampaignAction(state, actionId, result));
  } finally {
    rolling = false;
  }
}

async function performFinalRoll() {
  if (rolling) return;
  const choice = finalCampaignChoice(state);
  if (!choice) return;
  rolling = true;
  try {
    const result = resolveCheck(state, choice, randomSource());
    try { await playD20Roll({root: document.body, state, choice, result}); }
    catch (error) { console.error("D20 animation failed; resolving final check without animation.", error); }
    commit(applyFinalCampaignResult(state, result));
  } finally {
    rolling = false;
  }
}

async function copyPlaytest(button) {
  const text = exportPlaytest(state, document.querySelector('meta[name="koryto-build-sha"]')?.content || "unknown");
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Playtest zkopírován";
  } catch {
    const area = document.getElementById("playtestFallback");
    area.hidden = false;
    area.value = text;
    area.select();
    button.textContent = "Export je označen níže";
  }
}

app.addEventListener("input", event => {
  if (event.target.id === "heroName") creationNameDraft = event.target.value;
});

app.addEventListener("click", async event => {
  if (rolling && !event.target.closest("[data-dice-skip]")) return;
  if (transitionLocked) return;
  transitionLocked = true;
  queueMicrotask(() => { transitionLocked = false; });

  const origin = event.target.closest("[data-origin]");
  if (origin) {
    const next = structuredClone(state);
    next.hero.originId = origin.dataset.origin;
    next.hero.attributes = deriveAttributes(next.hero.classId, next.hero.originId);
    commit(next, {persist: false, focusSelector: `[data-origin="${origin.dataset.origin}"]`});
    return;
  }
  const classButton = event.target.closest("[data-class]");
  if (classButton) {
    const next = structuredClone(state);
    next.hero.classId = classButton.dataset.class;
    next.hero.attributes = deriveAttributes(next.hero.classId, next.hero.originId);
    commit(next, {persist: false, focusSelector: `[data-class="${classButton.dataset.class}"]`});
    return;
  }
  const action = event.target.closest("[data-campaign-action]");
  if (action) { await performCampaignAction(action.dataset.campaignAction); return; }
  const staff = event.target.closest("[data-staff]");
  if (staff) { commit(chooseCampaignStaff(state, staff.dataset.staff)); return; }
  const strategy = event.target.closest("[data-strategy]");
  if (strategy) { commit(chooseFinalStrategy(state, strategy.dataset.strategy)); return; }
  const tactic = event.target.closest("[data-final-tactic]");
  if (tactic) { commit(chooseFinalTactic(state, tactic.dataset.finalTactic)); return; }
  if (event.target.closest("[data-final-roll]")) { await performFinalRoll(); return; }
  const system = event.target.closest("[data-system]");
  if (!system) return;
  if (system.dataset.system === "save") {
    system.textContent = saveTest8State(state) ? "Uloženo" : "Uložení selhalo";
  } else if (system.dataset.system === "restart") {
    if (!clearTest8Save()) { system.textContent = "Smazání selhalo"; return; }
    state = createTest8State(state.playtests);
    creationNameDraft = "";
    forcedRollIndex = 0;
    render();
  } else if (system.dataset.system === "export") {
    await copyPlaytest(system);
  }
});

app.addEventListener("submit", event => {
  if (event.target.id !== "creationForm") return;
  event.preventDefault();
  commit(startTest8Campaign(state, {
    name: document.getElementById("heroName")?.value || "",
    classId: state.hero.classId,
    originId: state.hero.originId
  }));
});

render();
globalThis.KorytoTest8 = Object.freeze({
  getState: () => structuredClone(state),
  exportPlaytest: () => exportPlaytest(state, document.querySelector('meta[name="koryto-build-sha"]')?.content || "unknown"),
  get isRolling() { return rolling; },
  version: VERSION
});
