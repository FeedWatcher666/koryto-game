import {
  ATTRIBUTES,
  CLASSES,
  COMPANIONS,
  FIRST_CHECKS,
  ORIGINS,
  REGISTRATION_CHECKS,
  VERSION
} from "./data.js";
import {JZD_ITEMS, JZD_RIVAL_CHOICES, choicesForJzd} from "./quest-jzd.js";
import {activePartyIds, checkModifiers, deriveAttributes, formatRollExpression, resolveRollMode} from "./rules.js";

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
    firstCheck: ["Najděte cestu do obce", "Vyberte způsob a proveďte první hod.", "U každé volby je napsáno, kolik kostek hodíte a která se započítá.", "Bez spotřeby akce"],
    firstResult: ["Přijměte výsledek", "Podívejte se, která kostka se započítala.", "Přehod propiskou zvýší mediální tlak.", "Bez spotřeby akce"],
    companion: ["Sestavte první družinu", "Vyberte prvního místního spojence.", "Společník má bonus, názor i vlastní hranice.", "Bez spotřeby akce"],
    registration: ["Zaregistrujte kandidaturu", "Obejděte potvrzení, které úřad nevydává.", "Volba může vytvořit politický dluh.", "1 akce"],
    registrationResult: ["Přežijte první politický účet", "Přijměte důsledky registrace.", "Věčný už o vás ví.", "1 akce"],
    chapterOpen: ["Krysy v JZD", "Zahajte první skutečnou výpravu.", "Věčný vám nabízí pomoc, o kterou jste nežádali.", "Kapitola 1"],
    jzdBriefing: ["Zjistěte, co mizí z JZD", "Vyslechněte Radka a stanovte cíl výpravy.", "Areál je hlídaný a Věčný dostává hlášení.", "Bez spotřeby akce"],
    jzdPrep: ["Připravte výpravu", "Vyberte přesně dva společníky a jeden předmět.", "Každý člen družiny mění dostupné hody a následky.", "Bez spotřeby akce"],
    jzdApproach: ["Dostaňte se do areálu", "Vyberte cestu dovnitř.", "Neúspěch zvýší tlak Věčného, ale quest pokračuje.", "1 akce"],
    jzdApproachResult: ["Udržte tempo výpravy", "Přijměte důsledek vstupu a pokračujte k důkazům.", "Věčný může znát vaši trasu.", "1 akce"],
    jzdSearch: ["Získejte použitelný důkaz", "Vyberte jednu hlavní stopu.", "Důkazy zlevní finální zkoušku, hluk posílí soupeře.", "1 akce"],
    jzdSearchResult: ["Uneste váhu důkazu", "Přijměte výsledek pátrání.", "Někdo z areálu už volá Věčnému.", "1 akce"],
    jzdRival: ["Reagujte na Věčného", "Zvolte, co uděláte s jeho telefonickou nabídkou.", "Toto rozhodnutí mění finální cestu bez hodu kostkou.", "Bez spotřeby akce"],
    jzdFinal: ["Použijte důkazy", "Zveřejněte je, přiveďte svědky, nebo je vyměňte za páku.", "Tady vzniká trvalý následek kampaně.", "1 akce"],
    jzdFinalResult: ["Přijměte výsledek kapitoly", "Potvrďte politickou cenu finálního rozhodnutí.", "Následek se vrátí v dalších kapitolách.", "1 akce"],
    jzdComplete: ["Kapitola dokončena", "Prohlédněte si, co jste získali a komu nyní něco dlužíte.", "Věčný reaguje na váš způsob vítězství.", "Uloženo"]
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

function questMeter(label, value, maximum = 8) {
  const width = Math.max(0, Math.min(100, value / maximum * 100));
  return `<div class="quest-meter"><span><small>${label}</small><b>${value}</b></span><i><em style="width:${width}%"></em></i></div>`;
}

function partyPanel(state) {
  const ids = activePartyIds(state);
  const equipped = state.quest?.itemId ? JZD_ITEMS[state.quest.itemId] : null;
  return `<aside class="support-stack">
    <section class="panel">
      <p class="eyebrow">DRUŽINA</p>
      ${ids.length ? ids.map(id => {
        const companion = COMPANIONS[id];
        return `<div class="companion-summary"><b>${companion.icon}</b><div><strong>${companion.name}</strong><span>${companion.role}</span><small>Vztah ${state.relationships[id] >= 0 ? "+" : ""}${state.relationships[id]}</small></div></div>`;
      }).join("") : `<p class="muted">Zatím jdete sami. To je levné a nerozumné.</p>`}
    </section>
    <section class="panel">
      <p class="eyebrow">VYBAVENÍ</p>
      ${equipped ? `<div class="item-card"><b>${equipped.icon}</b><div><strong>${equipped.name}</strong><span>${equipped.perk}</span></div></div>` : state.inventory.includes("chainedPen") ? `<div class="item-card"><b>🖊️</b><div><strong>Propiska na řetízku</strong><span>${state.flags.chainedPenSpent ? "Inkoust je mrtvý. Řetízek zůstává." : "Jednou zopakuje neúspěšný hod za +2 tlak."}</span></div></div>` : `<p class="muted">V kapsách nic. Ani omluva.</p>`}
    </section>
    ${state.quest?.status !== "locked" ? `<section class="panel quest-status-panel">
      <p class="eyebrow">KRYsy V JZD</p>
      ${questMeter("Důkazy", state.quest.evidence)}
      ${questMeter("Důvěra pracovníků", state.quest.workerTrust)}
      ${questMeter("Tlak Věčného", state.quest.rivalPressure)}
    </section>` : ""}
  </aside>`;
}

function rollLesson() {
  return `<section class="roll-lesson" aria-label="Jak fungují kostky">
    <article class="mode-normal"><b>1× d20</b><strong>Běžný hod</strong><span>Hodíte jednu kostku. Počítá se její výsledek.</span></article>
    <article class="mode-advantage"><b>2× d20</b><strong>Výhoda</strong><span>Hodíte dvě kostky. Počítá se <em>vyšší</em> číslo.</span></article>
    <article class="mode-disadvantage"><b>2× d20</b><strong>Nevýhoda</strong><span>Hodíte dvě kostky. Počítá se <em>nižší</em> číslo.</span></article>
  </section>`;
}

function modeDetails(rollMode) {
  if (rollMode.mode === "advantage") return {title: "VÝHODA", dice: "HODÍTE 2 KOSTKY", rule: "POČÍTÁ SE VYŠŠÍ ČÍSLO", explanation: "Po dopadu zůstane vyšší kostka barevná. Nižší se vyřadí."};
  if (rollMode.mode === "disadvantage") return {title: "NEVÝHODA", dice: "HODÍTE 2 KOSTKY", rule: "POČÍTÁ SE NIŽŠÍ ČÍSLO", explanation: "Po dopadu zůstane nižší kostka barevná. Vyšší se vyřadí."};
  if (rollMode.cancelled) return {title: "BĚŽNÝ HOD", dice: "HODÍTE 1 KOSTKU", rule: "VÝHODA A NEVÝHODA SE ZRUŠILY", explanation: "Protikladné vlivy se vyrovnaly. Počítá se jediný hod."};
  return {title: "BĚŽNÝ HOD", dice: "HODÍTE 1 KOSTKU", rule: "POČÍTÁ SE TATO KOSTKA", explanation: "Žádná výhoda ani nevýhoda tento hod nemění."};
}

function choiceButton(choice, state) {
  const modifiers = checkModifiers(state, choice);
  const dirtyBlocked = choice.dirty && state.hero.classId === "paladin";
  const rollMode = resolveRollMode(state, choice);
  const details = modeDetails(rollMode);
  const modeSources = rollMode.mode === "advantage"
    ? rollMode.advantageSources
    : rollMode.mode === "disadvantage"
      ? rollMode.disadvantageSources
      : rollMode.cancelled
        ? [...rollMode.advantageSources, ...rollMode.disadvantageSources]
        : [];
  return `<button class="action-card ${choice.dirty ? "dirty" : ""} roll-${rollMode.mode}" data-check="${choice.id}" ${dirtyBlocked ? "disabled" : ""}>
    <strong>${choice.label}</strong><span>${choice.detail}</span>
    <div class="plain-roll-rule mode-${rollMode.mode}">
      <small>${details.title}</small><b>${details.dice}</b><strong>${details.rule}</strong><span>${details.explanation}</span>
    </div>
    ${modeSources.length ? `<small class="roll-source-preview"><b>Důvod:</b> ${esc(modeSources.join(" · "))}</small>` : `<small class="roll-source-preview"><b>Důvod:</b> žádný zvláštní vliv</small>`}
    ${choice.pressurePenalty ? `<small class="roll-source-preview"><b>Tlak Věčného:</b> +${choice.pressurePenalty} k obtížnosti za nasbíraný tlak ${choice.rivalPressure}</small>` : ""}
    <small class="technical-roll">Technicky: ${rollMode.notation} + ${modifiers.visibleModifier} proti obtížnosti ${choice.dc}${dirtyBlocked ? " · Třída tuto volbu odmítá" : ""}</small>
  </button>`;
}

function humanRollSummary(result) {
  const rolls = result.rolls || [result.roll];
  if (rolls.length === 1) return `Padlo ${result.roll}. Tento jediný výsledek se započítává.`;
  const discarded = rolls.find((_, index) => index !== result.keptIndex);
  if (result.rollMode === "advantage") return `Výhoda: padlo ${rolls.join(" a ")} → započítává se vyšší ${result.roll}. Nižší ${discarded} se vyřazuje.`;
  return `Nevýhoda: padlo ${rolls.join(" a ")} → započítává se nižší ${result.roll}. Vyšší ${discarded} se vyřazuje.`;
}

function resultCard(state, context) {
  const result = state.flags.lastResult;
  if (!result) return "";
  const canReroll = context === "first" && result.level === "complication" && state.flags.chainedPenAvailable && !state.flags.chainedPenSpent;
  const modifiers = (result.modifierBreakdown || []).map(item => `<span>${esc(item.label)} <b>+${item.value}</b></span>`).join("");
  const rolls = result.rolls || [result.roll];
  const rollDisplay = rolls.length > 1
    ? `<div class="result-roll-pair">${rolls.map((roll, index) => `<span class="${index === result.keptIndex ? "kept" : "discarded"}"><b>${roll}</b><small>${index === result.keptIndex ? "POČÍTÁ SE" : "NEPOČÍTÁ SE"}</small></span>`).join("")}</div>`
    : `<div class="d20">${result.roll}</div>`;
  const actionLabels = {
    first: "Přijmout důsledek",
    registration: "Přijmout důsledek",
    "jzd-approach": "Pokračovat k důkazům",
    "jzd-search": "Zvednout telefon Věčnému",
    "jzd-final": "Uzavřít kapitolu"
  };
  return `<section class="result-card tone-${result.outcome.tone}">
    ${rollDisplay}
    <div class="human-roll-summary"><small>CO SE STALO S KOSTKAMI</small><strong>${esc(humanRollSummary(result))}</strong></div>
    <p class="eyebrow">${result.rollModeLabel || "Běžný hod"} · ${result.outcome.label}</p>
    <h1>${result.outcome.title}</h1>
    <p class="result-impact">${esc(result.impactLine || result.outcome.description)}</p>
    <p>${result.outcome.description}</p>
    ${state.quest?.status === "active" ? `<div class="quest-result-strip"><span>Důkazy <b>${state.quest.evidence}</b></span><span>Důvěra <b>${state.quest.workerTrust}</b></span><span>Tlak Věčného <b>${state.quest.rivalPressure}</b></span></div>` : ""}
    ${modifiers ? `<div class="result-modifiers">${modifiers}</div>` : ""}
    <details class="technical-result"><summary>Zobrazit technický výpočet</summary><div class="formula">${esc(formatRollExpression(result))}</div></details>
    ${result.reaction ? `<blockquote class="result-reaction"><b>${result.reactionIcon || "💬"}</b><div><strong>${esc(result.reactionSpeaker || "Družina")}</strong><span>${esc(result.reaction)}</span></div></blockquote>` : ""}
    <div class="result-actions">
      ${canReroll ? `<button class="secondary-action" data-action="reroll-first">Přehodit propiskou za +2 tlak</button>` : ""}
      <button class="primary-action" data-action="accept-${context}">${actionLabels[context] || "Pokračovat"}</button>
    </div>
  </section>`;
}

function questCheckScene(state, phase, eyebrow, title, copy) {
  const choices = choicesForJzd(state, phase);
  return `<section class="scene-card quest-scene">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${title}</h1>
    <p>${copy}</p>
    <div class="quest-stakes">${questMeter("Důkazy", state.quest.evidence)}${questMeter("Důvěra", state.quest.workerTrust)}${questMeter("Tlak Věčného", state.quest.rivalPressure)}</div>
    <div class="action-list">${choices.map(choice => choiceButton(choice, state)).join("")}</div>
  </section>`;
}

function preparationView(state) {
  const selected = state.quest.party;
  const ready = selected.length === 2 && state.quest.itemId;
  return `<section class="scene-card quest-scene preparation-scene">
    <p class="eyebrow">KAPITOLA 1 · PŘÍPRAVA VÝPRAVY</p>
    <h1>Do JZD jdete ve třech. Jedna chyba se tak může rozdělit spravedlivěji.</h1>
    <p>Vyberte přesně dva společníky. Každý přináší schopnost, ale také hranici, za kterou vám přestane pomáhat.</p>
    <div class="selection-counter">Družina: <b>${selected.length}/2</b></div>
    <div class="quest-companion-grid">${Object.entries(COMPANIONS).map(([id, companion]) => `<button class="quest-companion-card ${selected.includes(id) ? "selected" : ""}" data-quest-companion="${id}">
      <b>${companion.icon}</b><strong>${companion.name}</strong><span>${companion.role}</span><p>${companion.description}</p><small>${companion.demand}</small>
    </button>`).join("")}</div>
    <h2>Vezměte jeden předmět</h2>
    <div class="quest-item-grid">${Object.entries(JZD_ITEMS).map(([id, item]) => `<button class="quest-item-card ${state.quest.itemId === id ? "selected" : ""}" data-quest-item="${id}">
      <b>${item.icon}</b><strong>${item.name}</strong><span>${item.description}</span><small>${item.perk}</small>
    </button>`).join("")}</div>
    <button class="primary-action" data-action="confirm-jzd-prep" ${ready ? "" : "disabled"}>${ready ? "Vyrazit do JZD" : "Vyberte 2 společníky a 1 předmět"}</button>
  </section>`;
}

function rivalView(state) {
  return `<section class="scene-card quest-scene rival-scene">
    <p class="eyebrow">PROTIAKCE VLADIMÍRA VĚČNÉHO</p>
    <h1>Telefon zazvoní přesně ve chvíli, kdy najdete něco, co nemělo existovat</h1>
    <blockquote>„Gratuluji k zájmu o obecní majetek,“ říká Věčný. „Mohl jste se prostě zeptat. Ušetřili bychom si oba tolik demokracie.“</blockquote>
    <p>Věčný nabízí schůzku, ochranu i vysvětlení. Neříká, před kým vás chce chránit. Toto rozhodnutí nemá hod kostkou; je to vaše vědomá politická volba.</p>
    <div class="rival-choice-grid">${JZD_RIVAL_CHOICES.map(choice => `<button class="rival-choice-card" data-rival-choice="${choice.id}">
      <strong>${choice.title}</strong><span>${choice.description}</span><small>${choice.effect}</small>
    </button>`).join("")}</div>
  </section>`;
}

function completeView(state) {
  const selectedNames = state.quest.party.map(id => COMPANIONS[id]?.name).filter(Boolean).join(" a ");
  return `<section class="scene-card quest-scene quest-complete">
    <p class="eyebrow">KAPITOLA 1 DOKONČENA</p>
    <h1>${esc(state.quest.endingTitle || "Krysy v JZD přežily další kontrolu")}</h1>
    <p class="quest-ending-copy">${esc(state.quest.endingText || "Něco jste změnili. Obec zatím zjišťuje co.")}</p>
    <div class="chapter-recap">
      <div><small>Důkazy</small><strong>${state.quest.evidence}</strong></div>
      <div><small>Důvěra pracovníků</small><strong>${state.quest.workerTrust}</strong></div>
      <div><small>Tlak Věčného</small><strong>${state.quest.rivalPressure}</strong></div>
      <div><small>Politická páka</small><strong>${state.resources.leverage}</strong></div>
      <div><small>Družina</small><strong>${esc(selectedNames)}</strong></div>
      <div><small>Politické dluhy</small><strong>${state.resources.debt}</strong></div>
    </div>
    <section class="consequence-list"><p class="eyebrow">CO SE VRÁTÍ POZDĚJI</p><ul>${state.quest.consequences.map(item => `<li>${esc(item)}</li>`).join("")}</ul></section>
    <button class="primary-action" data-action="save">Uložit dokončenou kapitolu</button>
  </section>`;
}

function sceneView(state) {
  if (state.scene === "arrival") return `<section class="scene-card location-arrival">
    <p class="eyebrow">PROLOG · ŠPATNÁ ZASTÁVKA</p><h1>Autobus vás vysadil správně. Jen v jiné obci.</h1>
    <p>Cedule ukazuje ke hřbitovu, sběrnému dvoru a úřadu zavřenému od roku 2007. Řidič vám podá obecní propisku na řetízku. Řetízek je delší než místní transparentnost.</p>
    <div class="rule-card"><strong>První pravidlo</strong><span>Volba → hod kostkou → přičtení atributu → výsledek. Hra vždy předem řekne, kolik kostek hodíte a která se započítá.</span></div>
    <button class="primary-action" data-action="take-pen">Vzít propisku a rozhlédnout se</button>
  </section>`;

  if (state.scene === "firstCheck") return `<section class="scene-card"><p class="eyebrow">PRVNÍ ZKOUŠKA</p><h1>Najděte obec, než začne kampaň bez vás</h1><p>Nejdřív se podívejte na jednoduché pravidlo. Technický zápis je jen detail.</p>${rollLesson()}<div class="action-list">${FIRST_CHECKS.map(choice => choiceButton(choice, state)).join("")}</div></section>`;
  if (state.scene === "firstResult") return resultCard(state, "first");

  if (state.scene === "companion") return `<section class="scene-card"><p class="eyebrow">DRUŽINA</p><h1>Na úřad se nechodí sám</h1><p>Vyberte prvního spojence. Před výpravou do JZD sestavíte dvoučlennou aktivní družinu.</p><div class="companion-grid">${Object.entries(COMPANIONS).map(([id, companion]) => `<button class="companion-card" data-companion="${id}"><b>${companion.icon}</b><strong>${companion.name}</strong><span>${companion.role}</span><p>${companion.description}</p><small>${companion.demand}</small></button>`).join("")}</div></section>`;

  if (state.scene === "registration") return `<section class="scene-card location-office"><p class="eyebrow">OBECNÍ ÚŘAD</p><h1>Vaše kandidatura neexistuje, protože chybí potvrzení, které úřad nevydává</h1><p>Za přepážkou sedí referentka, která má před sebou prázdný formulář a za sebou fotografii Vladimíra Věčného z doby, kdy měl ještě jen jednu funkci.</p><div class="compact-roll-reminder"><b>Rychlá připomínka:</b> výhoda = dvě kostky a vyšší výsledek; nevýhoda = dvě kostky a nižší výsledek.</div><div class="action-list">${REGISTRATION_CHECKS.map(choice => choiceButton(choice, state)).join("")}</div></section>`;
  if (state.scene === "registrationResult") return resultCard(state, "registration");

  if (state.scene === "chapterOpen") return `<section class="scene-card chapter-card"><p class="eyebrow">KAPITOLA 1 ODEMČENA</p><h1>Krysy v JZD</h1><p>Někdo rozprodává obecní majetek. Všichni vědí kdo, ale každý uvádí jiné jméno. Vladimír Věčný vám osobně gratuluje k registraci a nabízí pomoc, o kterou jste nežádali.</p><div class="chapter-recap"><div><small>Kandidatura</small><strong>${state.flags.candidacyRegistered ? "Zaregistrována" : "Administrativně sporná"}</strong></div><div><small>Politické dluhy</small><strong>${state.resources.debt}</strong></div><div><small>První spojenec</small><strong>${COMPANIONS[state.party.active]?.name || "Nikdo"}</strong></div><div><small>Reputace</small><strong>${state.resources.reputation}</strong></div></div><button class="primary-action" data-action="start-jzd">Zahájit výpravu do JZD</button></section>`;

  if (state.scene === "jzdBriefing") return `<section class="scene-card quest-scene"><p class="eyebrow">KRYsy V JZD · BRIEFING</p><h1>Radek přinese seznam strojů, které obec prodala třikrát a pořád stojí ve stejné hale</h1><p>Každý pátek v noci z areálu odjíždí kamion. V účetnictví jsou stroje už roky pryč, na dvoře jsou pořád a nájem platí firma vlastněná člověkem, který má stejné příjmení jako starostův švagr. Radek chce důkaz, ne další hospodskou jistotu.</p><div class="quest-brief"><div><small>Cíl</small><strong>Získat důkaz o rozprodeji majetku</strong></div><div><small>Soupeř</small><strong>Vladimír Věčný reaguje na hluk a chyby</strong></div><div><small>Konec</small><strong>Důkazy zveřejnit, použít veřejně, nebo vyměnit</strong></div></div><button class="primary-action" data-action="jzd-briefing-next">Připravit družinu</button></section>`;
  if (state.scene === "jzdPrep") return preparationView(state);
  if (state.scene === "jzdApproach") return questCheckScene(state, "approach", "KRYsy V JZD · VSTUP", "Areál má tři vchody a čtyři verze vlastnické struktury", "Způsob vstupu určí, kdo vás uvidí, jaký důkaz najdete jako první a kolik času dostane Věčný na reakci.");
  if (state.scene === "jzdApproachResult") return resultCard(state, "jzd-approach");
  if (state.scene === "jzdSearch") return questCheckScene(state, "search", "KRYsy V JZD · DŮKAZY", "Uvnitř musíte vybrat jednu stopu, než se areál probudí", "Nemůžete prohledat všechno. Účetní kniha, pracovníci a noční kamion vedou k odlišným důkazům a spojencům.");
  if (state.scene === "jzdSearchResult") return resultCard(state, "jzd-search");
  if (state.scene === "jzdRival") return rivalView(state);
  if (state.scene === "jzdFinal") return questCheckScene(state, "final", "KRYsy V JZD · FINÁLE", "Důkaz nemá politickou hodnotu, dokud ho někdo nepoužije", "Nasbírané důkazy snižují obtížnost. Vaše reakce zvýhodnila jednu cestu, ale každé dva body tlaku Věčného vracejí bod obtížnosti.");
  if (state.scene === "jzdFinalResult") return resultCard(state, "jzd-final");
  if (state.scene === "jzdComplete") return completeView(state);

  return `<section class="scene-card"><h1>Scéna nebyla nalezena</h1><button data-action="restart">Začít znovu</button></section>`;
}

export function gameView(state) {
  return `<div class="game-screen" data-scene="${esc(state.scene)}">${hud(state)}<main class="game-layout"><section class="world-stage" tabindex="-1" aria-label="Aktuální herní scéna">${sceneView(state)}</section>${heroPanel(state)}${partyPanel(state)}</main><footer>Čistý runtime v0.20 · první vícefázový quest · jediný renderer · save schema 2</footer></div>`;
}

export function render(app, state) {
  app.innerHTML = state.screen === "creation" ? creationView(state) : gameView(state);
}
