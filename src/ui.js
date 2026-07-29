import {
  ATTRIBUTES,
  CLASSES,
  COMPANIONS,
  FIRST_CHECKS,
  ORIGINS,
  REGISTRATION_CHECKS,
  VERSION
} from "./data.js";
import {deriveAttributes, formatRollExpression, resolveRollMode} from "./rules.js";

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);

function statPill(label, value) {
  return `<article class="hud-stat"><span>${label}</span><strong>${value}</strong></article>`;
}

function attributeGrid(attributes) {
  return `<div class="attribute-grid">${ATTRIBUTES.map(([id, label, description]) => `
    <article class="attribute-card">
      <div><strong>${label}</strong><small>${description}</small></div>
      <b>${attributes[id]}</b>
    </article>`).join("")}</div>`;
}

export function creationView(state) {
  const attributes = deriveAttributes(state.hero.classId, state.hero.originId);
  return `<main class="creation-screen">
    <section class="creation-copy">
      <p class="eyebrow">KORYTO · ČISTÝ REWRITE</p>
      <h1>Vytvořte politického dobrodruha</h1>
      <p>Dolní Vejprnice nepotřebují dalšího hrdinu. Proto jste přijeli právě vy.</p>
      <div class="version-badge">${VERSION}</div>
    </section>

    <form id="creationForm" class="creation-panel">
      <label class="field-label">Jméno kandidáta
        <input id="heroName" name="heroName" maxlength="32" placeholder="např. Bohuslav Pravdomluvný" autocomplete="off">
      </label>

      <fieldset>
        <legend>Původ</legend>
        <div class="choice-grid origins">${Object.entries(ORIGINS).map(([id, origin]) => `
          <button type="button" class="choice-card ${state.hero.originId === id ? "selected" : ""}" data-origin="${id}">
            <strong>${origin.name}</strong><span>${origin.description}</span>
          </button>`).join("")}</div>
      </fieldset>

      <fieldset>
        <legend>Třída</legend>
        <div class="choice-grid classes">${Object.entries(CLASSES).map(([id, item]) => `
          <button type="button" class="choice-card class-card ${state.hero.classId === id ? "selected" : ""}" data-class="${id}">
            <b>${item.icon}</b><strong>${item.name}</strong><span>${item.description}</span>
            <small><em>Schopnost:</em> ${item.perk}</small>
            <small><em>Slabina:</em> ${item.weakness}</small>
          </button>`).join("")}</div>
      </fieldset>

      <section class="sheet-preview">
        <header><div><p class="eyebrow">LIST POSTAVY</p><h2>Šest skutečných atributů</h2></div><span>d20 + atribut proti obtížnosti</span></header>
        ${attributeGrid(attributes)}
      </section>

      <button class="primary-action" type="submit">Přijet do Dolních Vejprnic</button>
    </form>
  </main>`;
}

function objectiveFor(state) {
  const objectives = {
    arrival: ["Najděte Dolní Vejprnice", "Rozhlédněte se po špatné zastávce.", "Ztracenost postavy je záměrná. Ztracenost hráče ne.", "Bez spotřeby akce"],
    firstCheck: ["Najděte cestu do obce", "Vyberte atribut a proveďte první hod d20.", "Výhoda hází dvakrát a ponechá vyšší výsledek. Nevýhoda nižší.", "Bez spotřeby akce"],
    firstResult: ["Přijměte výsledek", "Rozhodněte, zda utratíte propisku na přehod.", "Přehod zvýší mediální tlak.", "Bez spotřeby akce"],
    companion: ["Sestavte první družinu", "Vyberte Marii nebo Bohumila.", "Společník může měnit bonus i počet hozených kostek.", "Bez spotřeby akce"],
    registration: ["Zaregistrujte kandidaturu", "Zvolte způsob, jak obejít neexistující potvrzení.", "Volba může vytvořit politický dluh, výhodu nebo nevýhodu.", "1 akce"],
    registrationResult: ["Přežijte první politický účet", "Přijměte důsledky registrace.", "Věčný už o vás ví.", "1 akce"],
    chapterOpen: ["Krysy v JZD", "Zjistěte, kdo rozprodává obecní majetek.", "Všichni vědí kdo. Každý uvádí jiné jméno.", "Kapitola 1"]
  };
  return objectives[state.scene] || objectives.arrival;
}

function hud(state) {
  const [title, action, risk, time] = objectiveFor(state);
  return `<header class="game-hud">
    <div class="brand"><span>K</span><div><small>SATIRICKÉ POLITICKÉ RPG</small><strong>KORYTO</strong></div></div>
    <div class="hud-stats">
      ${statPill("DEN", `${state.day}`)}
      ${statPill("AKCE", state.actions)}
      ${statPill("REPUTACE", state.resources.reputation)}
      ${statPill("PENÍZE", `${state.resources.money} žet.`)}
      ${statPill("TLAK", state.resources.heat)}
    </div>
    <div class="hud-actions"><button data-action="save">Uložit</button><button data-action="restart">Nová hra</button></div>
    <section class="objective-card">
      <div><small>AKTUÁLNÍ CÍL</small><strong>${title}</strong></div>
      <dl><div><dt>Co udělat</dt><dd>${action}</dd></div><div><dt>Riziko</dt><dd>${risk}</dd></div><div><dt>Čas</dt><dd>${time}</dd></div></dl>
    </section>
  </header>`;
}

function heroPanel(state) {
  const heroClass = CLASSES[state.hero.classId];
  const origin = ORIGINS[state.hero.originId];
  return `<aside class="hero-panel panel">
    <p class="eyebrow">VAŠE POSTAVA</p>
    <div class="portrait">${heroClass.icon}</div>
    <h2>${esc(state.hero.name)}</h2>
    <strong>${heroClass.name}</strong>
    <span>${origin.name}</span>
    <div class="mini-attrs">${ATTRIBUTES.map(([id, label]) => `<div><small>${label}</small><b>${state.hero.attributes[id]}</b></div>`).join("")}</div>
  </aside>`;
}

function partyPanel(state) {
  const companion = state.party.active ? COMPANIONS[state.party.active] : null;
  return `<aside class="support-stack">
    <section class="panel">
      <p class="eyebrow">DRUŽINA</p>
      ${companion ? `<div class="companion-summary"><b>${companion.icon}</b><div><strong>${companion.name}</strong><span>${companion.role}</span><small>${companion.demand}</small></div></div>` : `<p class="muted">Zatím jdete sami. To je levné a nerozumné.</p>`}
    </section>
    <section class="panel">
      <p class="eyebrow">INVENTÁŘ</p>
      ${state.inventory.includes("chainedPen") ? `<div class="item-card"><b>🖊️</b><div><strong>Propiska na řetízku</strong><span>${state.flags.chainedPenSpent ? "Inkoust je mrtvý. Řetízek zůstává." : "Jednou zopakuje neúspěšný hod za +2 tlak."}</span></div></div>` : `<p class="muted">V kapsách nic. Ani omluva.</p>`}
    </section>
  </aside>`;
}

function choiceButton(choice, state) {
  const base = state.hero.attributes[choice.attribute] || 0;
  const classBonus = choice.classBonus?.[state.hero.classId] || 0;
  const companion = COMPANIONS[state.party.active];
  const companionBonus = (choice.companionBonus?.[state.party.active] || 0) + (companion?.bonus?.[choice.attribute] || 0);
  const visible = base + classBonus + companionBonus;
  const dirtyBlocked = choice.dirty && state.hero.classId === "paladin";
  const rollMode = resolveRollMode(state, choice);
  const modeCopy = rollMode.mode === "advantage"
    ? "VÝHODA · 2d20, vyšší"
    : rollMode.mode === "disadvantage"
      ? "NEVÝHODA · 2d20, nižší"
      : rollMode.cancelled
        ? "VÝHODA + NEVÝHODA SE RUŠÍ"
        : "BĚŽNÝ HOD · 1d20";
  const modeSources = rollMode.mode === "advantage" ? rollMode.advantageSources : rollMode.mode === "disadvantage" ? rollMode.disadvantageSources : [];
  return `<button class="action-card ${choice.dirty ? "dirty" : ""} roll-${rollMode.mode}" data-check="${choice.id}" ${dirtyBlocked ? "disabled" : ""}>
    <strong>${choice.label}</strong><span>${choice.detail}</span>
    <em class="roll-mode-pill mode-${rollMode.mode}">${modeCopy}</em>
    ${modeSources.length ? `<small class="roll-source-preview">${esc(modeSources[0])}</small>` : ""}
    <small>${rollMode.notation} + ${visible} proti ${choice.dc}${dirtyBlocked ? " · Třída tuto volbu odmítá" : ""}</small>
  </button>`;
}

function resultCard(state, context) {
  const result = state.flags.lastResult;
  if (!result) return "";
  const canReroll = context === "first" && result.level === "complication" && state.flags.chainedPenAvailable && !state.flags.chainedPenSpent;
  const modifiers = (result.modifierBreakdown || []).map(item => `<span>${esc(item.label)} <b>+${item.value}</b></span>`).join("");
  const rolls = result.rolls || [result.roll];
  const rollDisplay = rolls.length > 1
    ? `<div class="result-roll-pair">${rolls.map((roll, index) => `<span class="${index === result.keptIndex ? "kept" : "discarded"}"><b>${roll}</b><small>${index === result.keptIndex ? "ponecháno" : "vyřazeno"}</small></span>`).join("")}</div>`
    : `<div class="d20">${result.roll}</div>`;
  return `<section class="result-card tone-${result.outcome.tone}">
    ${rollDisplay}
    <p class="eyebrow">${result.rollModeLabel || "Běžný hod"} · ${result.outcome.label}</p>
    <h1>${result.outcome.title}</h1>
    <p class="result-impact">${esc(result.impactLine || result.outcome.description)}</p>
    <p>${result.outcome.description}</p>
    ${modifiers ? `<div class="result-modifiers">${modifiers}</div>` : ""}
    <div class="formula">${esc(formatRollExpression(result))}</div>
    ${result.reaction ? `<blockquote class="result-reaction"><b>${result.reactionIcon || "💬"}</b><div><strong>${esc(result.reactionSpeaker || "Družina")}</strong><span>${esc(result.reaction)}</span></div></blockquote>` : ""}
    <div class="result-actions">
      ${canReroll ? `<button class="secondary-action" data-action="reroll-first">Přehodit propiskou za +2 tlak</button>` : ""}
      <button class="primary-action" data-action="accept-${context}">Přijmout důsledek</button>
    </div>
  </section>`;
}

function sceneView(state) {
  if (state.scene === "arrival") return `<section class="scene-card location-arrival">
    <p class="eyebrow">PROLOG · ŠPATNÁ ZASTÁVKA</p>
    <h1>Autobus vás vysadil správně. Jen v jiné obci.</h1>
    <p>Cedule ukazuje ke hřbitovu, sběrnému dvoru a úřadu zavřenému od roku 2007. Řidič vám podá obecní propisku na řetízku. Řetízek je delší než místní transparentnost.</p>
    <div class="rule-card"><strong>První pravidlo</strong><span>Volba → d20 + atribut → úspěch, cena nebo komplikace. Výhoda a nevýhoda mění počet kostek.</span></div>
    <button class="primary-action" data-action="take-pen">Vzít propisku a rozhlédnout se</button>
  </section>`;

  if (state.scene === "firstCheck") return `<section class="scene-card">
    <p class="eyebrow">PRVNÍ ZKOUŠKA</p>
    <h1>Najděte obec, než začne kampaň bez vás</h1>
    <p>Obtížnost, známé bonusy i výhoda nebo nevýhoda jsou viditelné před kliknutím. Skryté vlivy mohou existovat jen tehdy, když po sobě zanechaly stopu.</p>
    <div class="action-list">${FIRST_CHECKS.map(choice => choiceButton(choice, state)).join("")}</div>
  </section>`;

  if (state.scene === "firstResult") return resultCard(state, "first");

  if (state.scene === "companion") return `<section class="scene-card">
    <p class="eyebrow">DRUŽINA</p>
    <h1>Na úřad se nechodí sám</h1>
    <p>Vyberte prvního společníka. Není to bonusová karta. Může přidat číslo, dát výhodu, odporovat nebo vás později zradit.</p>
    <div class="companion-grid">${Object.entries(COMPANIONS).map(([id, companion]) => `<button class="companion-card" data-companion="${id}"><b>${companion.icon}</b><strong>${companion.name}</strong><span>${companion.role}</span><p>${companion.description}</p><small>${companion.demand}</small></button>`).join("")}</div>
  </section>`;

  if (state.scene === "registration") return `<section class="scene-card location-office">
    <p class="eyebrow">OBECNÍ ÚŘAD</p>
    <h1>Vaše kandidatura neexistuje, protože chybí potvrzení, které úřad nevydává</h1>
    <p>Za přepážkou sedí referentka, která má před sebou prázdný formulář a za sebou fotografii Vladimíra Věčného z doby, kdy měl ještě jen jednu funkci.</p>
    <div class="action-list">${REGISTRATION_CHECKS.map(choice => choiceButton(choice, state)).join("")}</div>
  </section>`;

  if (state.scene === "registrationResult") return resultCard(state, "registration");

  return `<section class="scene-card chapter-card">
    <p class="eyebrow">KAPITOLA 1 ODEMČENA</p>
    <h1>Krysy v JZD</h1>
    <p>Někdo rozprodává obecní majetek. Všichni vědí kdo, ale každý uvádí jiné jméno. Vladimír Věčný vám osobně gratuluje k registraci a nabízí pomoc, o kterou jste nežádali.</p>
    <div class="chapter-recap">
      <div><small>Kandidatura</small><strong>${state.flags.candidacyRegistered ? "Zaregistrována" : "Administrativně sporná"}</strong></div>
      <div><small>Politické dluhy</small><strong>${state.resources.debt}</strong></div>
      <div><small>Družina</small><strong>${COMPANIONS[state.party.active]?.name || "Nikdo"}</strong></div>
      <div><small>Reputace</small><strong>${state.resources.reputation}</strong></div>
    </div>
    <button class="primary-action" data-action="save">Uložit čistý rewrite</button>
  </section>`;
}

export function gameView(state) {
  return `<div class="game-screen">
    ${hud(state)}
    <main class="game-layout">
      ${heroPanel(state)}
      <section class="world-stage">${sceneView(state)}</section>
      ${partyPanel(state)}
    </main>
    <footer>Čistý runtime v0.20 · skutečná výhoda/nevýhoda · jediný renderer · nový save schema 1</footer>
  </div>`;
}

export function render(app, state) {
  app.innerHTML = state.screen === "creation" ? creationView(state) : gameView(state);
}
