"use strict";
(() => {
  const BUILD = "0.20.0-test.1";
  const DISPLAY = "0.20.0 TEST.1";
  const LEGACY_QUERY = new URLSearchParams(globalThis.location?.search || "").has("legacy");
  if (LEGACY_QUERY || typeof document === "undefined") return;

  const ATTRIBUTES = [
    ["charisma", "Charisma", "Přesvědčit lidi, že váš nápad byl vždycky jejich."],
    ["intellect", "Inteligence", "Najít paragraf, tabulku nebo chybu v cizím paragrafu."],
    ["authority", "Autorita", "Přimět místnost ztichnout dřív, než dorazí fakta."],
    ["media", "Mediální talent", "Proměnit událost v příběh, titulek nebo přijatelnou nehodu."],
    ["morality", "Morálka", "Odolat výhodnému řešení, které by později potřebovalo skartovačku."],
    ["luck", "Štěstí", "Potkat správného člověka dřív než jeho příbuzného."],
  ];

  const CLASS_PROFILES = {
    bard: {media: 4, morality: 2, luck: 3, recommended: true, hook: "Veřejné scény a improvizace."},
    rogue: {media: 2, morality: 1, luck: 4, recommended: true, hook: "Zákulisí, kompromat a zadní vchody."},
    paladin: {media: 2, morality: 5, luck: 2, recommended: true, hook: "Čestné řešení, přísahy a důvěra."},
    mage: {media: 1, morality: 3, luck: 2, hook: "Právo, dotace a formuláře vyšší úrovně."},
    technocrat: {media: 2, morality: 3, luck: 1, hook: "Data, modely a smrtící prezentace."},
    necro: {media: 3, morality: 1, luck: 3, hook: "Aparát, staré kontakty a politická nekromancie."},
  };

  const ORIGIN_MODS = {
    idealist: {morality: 2, luck: 0, media: 0},
    ambitious: {morality: -1, luck: 1, media: 1},
    revenge: {morality: -1, luck: 2, authority: 1},
  };

  let observer = null;
  let objectiveTimer = null;
  let tutorial = {active: false, step: 0, roll: null, companion: null};

  const app = () => globalThis.KorytoApp;
  const state = () => app()?.getState?.();
  const clamp = (value, min = 1, max = 5) => Math.max(min, Math.min(max, value));

  function selectedClassId() {
    const selected = document.querySelector("[data-class].selected, .k168-class-card.selected[data-class]");
    return selected?.dataset?.class || state()?.hero?.classId || "bard";
  }

  function deriveAttributes(classId = selectedClassId(), origin = document.getElementById("origin")?.value || "idealist") {
    const legacy = globalThis.KorytoCoreData?.classes?.[classId]?.attrs || {};
    const profile = CLASS_PROFILES[classId] || CLASS_PROFILES.bard;
    const originMod = ORIGIN_MODS[origin] || ORIGIN_MODS.idealist;
    return {
      charisma: clamp(Number(legacy.charisma) || 2),
      intellect: clamp(Number(legacy.intellect) || 2),
      authority: clamp((Number(legacy.authority) || 2) + (originMod.authority || 0)),
      media: clamp((profile.media || 2) + (originMod.media || 0)),
      morality: clamp((profile.morality || 2) + (originMod.morality || 0)),
      luck: clamp((profile.luck || 2) + (originMod.luck || 0)),
    };
  }

  function ensureCreationPreview() {
    const creation = document.querySelector("#creationScreen .creation");
    if (!creation) return;
    let panel = document.getElementById("v0200AttributePreview");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "v0200AttributePreview";
      panel.className = "panel v0200-attribute-preview";
      panel.innerHTML = `
        <div class="v0200-preview-head">
          <div><p class="eyebrow">D&D LIST POSTAVY</p><h3>Šest skutečných atributů</h3></div>
          <span class="v0200-rule-chip">d20 + atribut proti obtížnosti</span>
        </div>
        <p class="v0200-preview-copy">Třída vás omezuje, původ vás deformuje. Objektivně špatná postava je povolená a obec si toho všimne.</p>
        <div id="v0200AttributeGrid" class="v0200-attribute-grid"></div>
        <div id="v0200ClassIdentity" class="v0200-class-identity"></div>`;
      creation.append(panel);
    }
    updateCreationPreview();
  }

  function updateCreationPreview() {
    const grid = document.getElementById("v0200AttributeGrid");
    if (!grid) return;
    const classId = selectedClassId();
    const origin = document.getElementById("origin")?.value || "idealist";
    const values = deriveAttributes(classId, origin);
    grid.innerHTML = ATTRIBUTES.map(([id, label, description]) => `
      <article class="v0200-attribute">
        <div><strong>${label}</strong><span>${description}</span></div>
        <b>${values[id]}</b>
      </article>`).join("");
    const klass = globalThis.KorytoCoreData?.classes?.[classId];
    const identity = document.getElementById("v0200ClassIdentity");
    if (identity && klass) identity.innerHTML = `<strong>${klass.icon} ${klass.name}</strong><span>${CLASS_PROFILES[classId]?.hook || klass.desc}</span>`;

    document.querySelectorAll("[data-class]").forEach(card => {
      const id = card.dataset.class;
      if (!id || card.querySelector(".v0200-class-note")) return;
      const note = document.createElement("span");
      note.className = "v0200-class-note";
      note.textContent = CLASS_PROFILES[id]?.recommended ? "Doporučeno pro první průchod" : "Pokročilá třída";
      card.append(note);
    });
  }

  function tagPanels() {
    const mapping = {
      soulBars: "advanced", relationshipPanel: "advanced", voterBars: "advanced", factionBars: "advanced",
      warRoom: "advanced", commitments: "advanced", factionPlans: "advanced", worldPulse: "advanced",
      ambitionPanel: "advanced", rivalOperationPanel: "advanced", conspiracyPanel: "advanced",
      news: "advanced", journal: "essential", inventory: "essential", partyList: "essential", metrics: "essential",
    };
    for (const [id, level] of Object.entries(mapping)) {
      const target = document.getElementById(id);
      const card = target?.closest?.(".card, .k-ui-panel, .k165-ledger, .k16-panel");
      if (card) card.dataset.v0200Panel = level;
    }
  }

  function ensureFocusControls() {
    document.documentElement.classList.add("v0200-dnd-reset", "v0200-focus-mode");
    document.documentElement.dataset.v0200Build = BUILD;
    const actions = document.querySelector(".topbar .actions");
    if (actions && !document.getElementById("v0200DetailsToggle")) {
      const button = document.createElement("button");
      button.id = "v0200DetailsToggle";
      button.className = "btn small";
      button.type = "button";
      button.textContent = "Otevřít kroniku a systémy";
      button.onclick = () => {
        const open = document.documentElement.classList.toggle("v0200-details-open");
        button.textContent = open ? "Zavřít kroniku a systémy" : "Otevřít kroniku a systémy";
      };
      actions.prepend(button);
    }
  }

  function ensureObjectiveBar() {
    const center = document.querySelector("#gameScreen .game > section");
    if (!center || document.getElementById("v0200Objective")) return;
    const bar = document.createElement("section");
    bar.id = "v0200Objective";
    bar.className = "v0200-objective";
    bar.innerHTML = `
      <div class="v0200-objective-main"><span>AKTUÁLNÍ CÍL</span><strong id="v0200ObjectiveTitle">Rozhlédněte se.</strong></div>
      <div class="v0200-objective-meta"><span><b>Co udělat:</b> <i id="v0200ObjectiveAction"></i></span><span><b>Riziko:</b> <i id="v0200ObjectiveRisk"></i></span><span><b>Čas:</b> <i id="v0200ObjectiveTime"></i></span></div>`;
    center.prepend(bar);
  }

  function objectiveFor(current) {
    if (!current) return {title: "Vytvořte kandidáta", action: "Vyberte třídu, původ a potvrďte postavu.", risk: "Třídu později nezměníte.", time: "Mimo herní čas"};
    if (tutorial.active) return {title: "Najděte cestu do Dolních Vejprnic", action: "Dokončete krátký tutorial a první hod d20.", risk: "Neúspěch pokračuje komplikací, nikoli slepou uličkou.", time: "Bez spotřeby akce"};
    if (!current.flags?.introDone) return {title: "Oznamte kandidaturu", action: "Vyberte, jak se představíte lidem v hospodě.", risk: "První dojem ovlivní vztahy, důvěru a politické dluhy.", time: "Prolog · bez spotřeby akce"};
    const active = Object.entries(current.quests || {})
      .filter(([id, quest]) => quest?.status === "active" && globalThis.KorytoQuestData?.definitions?.[id])
      .sort((a, b) => app().questDeadline(a[0]) - app().questDeadline(b[0]));
    if (active.length) {
      const [id] = active[0];
      const def = globalThis.KorytoQuestData.definitions[id];
      const days = Math.max(0, app().questDeadline(id) - Number(current.day || 1));
      return {title: def.title, action: `${def.desc} Vydejte se do lokace ${globalThis.KorytoCoreData?.locations?.[def.location]?.name || def.location}.`, risk: def.failure, time: `${days === 0 ? "Dnes" : `${days} dny`} · návštěva stojí 1 akci`};
    }
    return {title: "Zvolte další výpravu", action: "Otevřete mapu a vyberte lokaci s aktivní událostí.", risk: "Nevyřešené problémy posilují Věčného.", time: `${current.actions ?? 0} akce dnes`};
  }

  function syncObjective() {
    const current = state();
    const objective = objectiveFor(current);
    const title = document.getElementById("v0200ObjectiveTitle");
    const action = document.getElementById("v0200ObjectiveAction");
    const risk = document.getElementById("v0200ObjectiveRisk");
    const time = document.getElementById("v0200ObjectiveTime");
    if (title) title.textContent = objective.title;
    if (action) action.textContent = objective.action;
    if (risk) risk.textContent = objective.risk;
    if (time) time.textContent = objective.time;
    patchInventory();
  }

  function patchInventory() {
    const current = state();
    const inventory = document.getElementById("inventory");
    if (!current?.items?.includes("chainedPen") || !inventory || inventory.querySelector("[data-v0200-item='chainedPen']")) return;
    const item = document.createElement("div");
    item.className = "party-item v0200-item";
    item.dataset.v0200Item = "chainedPen";
    item.innerHTML = `<strong>🖊️ Propiska na řetízku</strong>${current.flags?.chainedPenSpent ? "Řetízek přežil. Inkoust už ne." : "Jednou přehodí neúspěch za +2 mediální tlak."}`;
    inventory.prepend(item);
  }

  function ensureTutorialShell() {
    if (document.getElementById("v0200Tutorial")) return;
    const shell = document.createElement("div");
    shell.id = "v0200Tutorial";
    shell.className = "v0200-tutorial";
    shell.hidden = true;
    shell.innerHTML = `<div class="v0200-tutorial-card"><div class="v0200-tutorial-progress" id="v0200TutorialProgress"></div><div id="v0200TutorialBody"></div></div>`;
    document.body.append(shell);
  }

  function tutorialButton(label, action, primary = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `btn ${primary ? "primary" : ""}`.trim();
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
  }

  function renderTutorial() {
    const shell = document.getElementById("v0200Tutorial");
    const body = document.getElementById("v0200TutorialBody");
    const progress = document.getElementById("v0200TutorialProgress");
    if (!shell || !body || !progress) return;
    shell.hidden = !tutorial.active;
    if (!tutorial.active) return;
    progress.innerHTML = [0, 1, 2, 3].map(step => `<i class="${tutorial.step >= step ? "done" : ""}"></i>`).join("");
    body.innerHTML = "";

    if (tutorial.step === 0) {
      body.innerHTML = `<p class="eyebrow">PROLOG · TUTORIAL</p><h2>Autobus vás vysadil správně. Jen v jiné obci.</h2><p>Řidič tvrdí, že Dolní Vejprnice jsou „tam za tou cedulí“. Cedule ukazuje ke hřbitovu, sběrnému dvoru a dočasnému úřadu zavřenému od roku 2007.</p><div class="v0200-rule"><strong>Co se teď naučíte</strong><span>Volba přístupu → d20 + atribut → úspěch, úspěch za cenu nebo komplikace.</span></div><p>Řidič vám na rozloučenou podá obecní propisku připevněnou k autobusu řetízkem. Řetízek je delší než místní transparentnost.</p>`;
      const actions = document.createElement("div"); actions.className = "v0200-tutorial-actions";
      actions.append(tutorialButton("Vzít propisku a rozhlédnout se", () => {
        const current = state();
        current.items = current.items || [];
        if (!current.items.includes("chainedPen")) current.items.push("chainedPen");
        tutorial.step = 1; renderTutorial();
      }, true));
      body.append(actions);
      return;
    }

    if (tutorial.step === 1) {
      const attrs = state()?.hero?.rpgAttrs || deriveAttributes(state()?.hero?.classId, state()?.hero?.origin);
      const choices = [
        {label: "Zeptat se muže, který tu čeká od roku 1998", attr: "charisma", dc: 10, detail: "Možná čeká na autobus. Možná na kanalizaci."},
        {label: "Rozluštit obecní vývěsku", attr: "intellect", dc: 11, detail: "Pět šipek, tři razítka a jeden dokument vzhůru nohama."},
        {label: "Jít směrem, odkud přichází nejvíc lidí s deskami", attr: "luck", dc: 12, detail: "Metoda bez dat, zato s místní tradicí."},
      ];
      body.innerHTML = `<p class="eyebrow">PRVNÍ ZKOUŠKA</p><h2>Najděte obec, než začne kampaň bez vás</h2><p>Obtížnost vidíte. Známý bonus také. Skryté vlivy mohou vycházet z původu, družiny, předmětu nebo něčího příbuzenství.</p><div class="v0200-tutorial-choices"></div>`;
      const list = body.querySelector(".v0200-tutorial-choices");
      choices.forEach(choice => {
        const button = tutorialButton(`${choice.label} · d20 + ${attrs[choice.attr]} proti ${choice.dc}`, () => rollTutorial(choice));
        button.innerHTML = `<strong>${choice.label}</strong><span>${choice.detail}</span><small>${ATTRIBUTES.find(([id]) => id === choice.attr)?.[1]} ${attrs[choice.attr]} · obtížnost ${choice.dc}</small>`;
        list.append(button);
      });
      return;
    }

    if (tutorial.step === 2) {
      const result = tutorial.roll;
      body.innerHTML = `<p class="eyebrow">VÝSLEDEK HODU</p><div class="v0200-die">${result.roll}</div><h2>${result.title}</h2><p>${result.text}</p><div class="v0200-formula">${result.roll} + ${result.mod} = ${result.total} proti ${result.dc}</div><div class="v0200-rule"><strong>${result.levelLabel}</strong><span>${result.rule}</span></div>`;
      const actions = document.createElement("div"); actions.className = "v0200-tutorial-actions";
      const current = state();
      if (result.level === "complication" && current?.items?.includes("chainedPen") && !current.flags?.chainedPenSpent) {
        actions.append(tutorialButton("Přehodit propiskou za +2 mediální tlak", () => {
          current.flags = current.flags || {};
          current.flags.chainedPenSpent = true;
          current.stats.heat = Math.min(100, (Number(current.stats.heat) || 0) + 2);
          rollTutorial(result.choice, true);
        }, true));
      }
      actions.append(tutorialButton("Přijmout následek a pokračovat", () => { tutorial.step = 3; renderTutorial(); }, result.level !== "complication"));
      body.append(actions);
      return;
    }

    body.innerHTML = `<p class="eyebrow">DRUŽINA</p><h2>Na úřad se nechodí sám. To by vypadalo podezřele.</h2><p>U rozcestníku se hádají dvě osoby. Jedna zná lidi. Druhá zná přílohy, které lidé podepsali.</p><div class="v0200-companions"></div>`;
    const list = body.querySelector(".v0200-companions");
    [
      ["marie", "Marie Čistá", "Ředitelka školy. Pomáhá u čestných, veřejných a dětských kauz. Odejde, když z dětí uděláte kulisu."],
      ["bohumil", "Bohumil Tichý", "Obecní úředník. Pomáhá s právem, termíny a dokumenty. Každou pomoc si kopíruje."],
    ].forEach(([id, name, copy]) => {
      const button = tutorialButton(name, () => finishTutorial(id));
      button.innerHTML = `<strong>${globalThis.KorytoCompanionData?.companions?.[id]?.icon || "👤"} ${name}</strong><span>${copy}</span>`;
      list.append(button);
    });
  }

  function tutorialLevel(roll, total, dc) {
    if (roll === 20) return "critical";
    if (roll === 1) return "complication";
    if (total >= dc + 2) return "success";
    if (total >= dc - 1) return "costly";
    return "complication";
  }

  function rollTutorial(choice, rerolled = false) {
    const current = state();
    const attrs = current.hero.rpgAttrs || deriveAttributes(current.hero.classId, current.hero.origin);
    const mod = Number(attrs[choice.attr]) || 0;
    const roll = 1 + Math.floor(Math.random() * 20);
    const total = roll + mod;
    const level = tutorialLevel(roll, total, choice.dc);
    const outcomes = {
      critical: {title: "Obec se našla sama", text: "Kronikář vás pozná jako budoucího kandidáta, ukáže správnou cestu a přidá historku, kterou lze později zneužít.", levelLabel: "Kritický úspěch", rule: "Získáváte víc, než jste žádali. Kritická dvacítka může otevřít perk, předmět nebo unikátní cestu."},
      success: {title: "Cesta nalezena", text: "Dostanete jasný směr a poprvé spatříte věž radnice. Je nakřivo, ale politicky stabilní.", levelLabel: "Čistý úspěch", rule: "Dostanete zamýšlený výsledek bez dodatečné ceny."},
      costly: {title: "Cesta nalezena za cenu", text: "Správný směr vám poradí místní kronikář. Současně vás zapíše jako člověka zvenku, který nepozná obec ani podle dotační tabule.", levelLabel: "Úspěch za cenu", rule: "Cíl je splněn, ale vzniká závazek, ztráta zdroje nebo budoucí komplikace."},
      complication: {title: "Špatná cesta, dobrý problém", text: "Dojdete ke sběrnému dvoru. Správce vás pošle zpět, ale cestou zaslechnete, že na úřadě chybí formulář k vaší vlastní kandidatuře.", levelLabel: "Komplikace", rule: "Příběh pokračuje. Neúspěch nevytváří slepou uličku, ale novou situaci."},
    };
    tutorial.roll = {choice, roll, mod, total, dc: choice.dc, level, rerolled, ...outcomes[level]};
    current.audit = current.audit || {rolls: 0, outcomes: {critical: 0, success: 0, costly: 0, complication: 0}};
    current.audit.rolls = (Number(current.audit.rolls) || 0) + 1;
    current.audit.outcomes = current.audit.outcomes || {};
    current.audit.outcomes[level] = (Number(current.audit.outcomes[level]) || 0) + 1;
    current.flags = current.flags || {};
    current.flags.v0200TutorialRoll = {roll, mod, total, dc: choice.dc, level, rerolled};
    if (level === "critical") current.stats.trust = Math.min(100, (Number(current.stats.trust) || 0) + 3);
    if (level === "costly") current.stats.heat = Math.min(100, (Number(current.stats.heat) || 0) + 2);
    if (level === "complication") current.stats.heat = Math.min(100, (Number(current.stats.heat) || 0) + 3);
    tutorial.step = 2;
    renderTutorial();
  }

  function finishTutorial(companionId) {
    const current = state();
    const def = globalThis.KorytoCompanionData?.companions?.[companionId];
    current.party = current.party || {};
    if (def && !current.party[companionId]) current.party[companionId] = {...def, loyalty: def.loyalty};
    current.flags = current.flags || {};
    current.flags.v0200TutorialDone = true;
    current.flags.v0200FirstCompanion = companionId;
    tutorial.active = false;
    tutorial.companion = companionId;
    document.getElementById("v0200Tutorial").hidden = true;
    app().setState(current);
    app().showEvent("intro");
    syncObjective();
  }

  function startTutorial() {
    const current = state();
    if (!current || current.flags?.v0200TutorialDone) return;
    current.actions = 3;
    current.hero.rpgAttrs = deriveAttributes(current.hero.classId, current.hero.origin);
    current.flags = current.flags || {};
    current.flags.v0200Rules = BUILD;
    app().setState(current);
    tutorial = {active: true, step: 0, roll: null, companion: null};
    renderTutorial();
    syncObjective();
  }

  function wrapNewGame() {
    const button = document.getElementById("confirmBtn");
    if (!button || button.dataset.v0200Wrapped === "1" || typeof button.onclick !== "function") return;
    const legacy = button.onclick;
    button.onclick = function v0200NewGame(event) {
      const result = legacy.call(this, event);
      queueMicrotask(startTutorial);
      return result;
    };
    button.dataset.v0200Wrapped = "1";
  }

  function sync() {
    ensureCreationPreview();
    ensureFocusControls();
    ensureObjectiveBar();
    ensureTutorialShell();
    tagPanels();
    wrapNewGame();
    updateCreationPreview();
    syncObjective();
  }

  function install() {
    const ready = () => {
      sync();
      observer = new MutationObserver(() => queueMicrotask(sync));
      observer.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ["class"]});
      document.addEventListener("click", () => setTimeout(sync, 0), true);
      document.addEventListener("change", () => setTimeout(sync, 0), true);
      objectiveTimer = setInterval(syncObjective, 700);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, {once: true});
    else ready();
  }

  globalThis.KorytoDndReset = Object.freeze({
    VERSION: DISPLAY,
    BUILD_VERSION: BUILD,
    ATTRIBUTES: ATTRIBUTES.map(([id, label]) => ({id, label})),
    deriveAttributes,
    objectiveFor,
    startTutorial,
    sync,
    get tutorial() { return {...tutorial}; },
  });

  install();
})();
