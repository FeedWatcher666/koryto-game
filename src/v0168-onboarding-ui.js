"use strict";
(() => {
  const VERSION = "0.16.8 TEST.1";
  const BUILD_VERSION = "0.16.8-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;

  let installed = false;

  const ATTR_LABELS = Object.freeze({
    charisma: "Charisma",
    intellect: "Rozum",
    cunning: "Vychytralost",
    authority: "Autorita",
    resilience: "Odolnost"
  });

  const ABILITY_LABELS = Object.freeze({
    reframe: "Přerámování",
    shadow: "Zadní vchod",
    oath: "Veřejný slib",
    form: "Formulář",
    model: "Datový model",
    revive: "Oživení struktur"
  });

  const ORIGINS = Object.freeze({
    idealist: {
      icon: "🌱",
      label: "Chci něco napravit",
      short: "Idealista",
      effect: "+5 důvěra · +10 integrita · −2 peníze",
      tone: "Začínáte s veřejným kreditem, ale bez ochoty kupovat si klid."
    },
    ambitious: {
      icon: "🏛️",
      label: "Někdo tu funkci dělat musí",
      short: "Ambiciózní",
      effect: "+6 vliv · +3 podpora · −4 integrita",
      tone: "Víte, kam míříte. Obec zatím neví, co za to bude chtít."
    },
    revenge: {
      icon: "🪚",
      label: "Starosta mi zamítl pergolu",
      short: "Osobní msta",
      effect: "+4 kompromat · +1 autorita · −5 integrita",
      tone: "Do kampaně vstupujete s konkrétním protivníkem a velmi konkrétním stavebním řízením."
    }
  });

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);

  const classes = () => globalThis.KorytoCoreData?.classes || {};
  const selectedClassId = () => document.querySelector("#classGrid [data-class].selected")?.dataset.class || "bard";
  const selectedOriginId = () => document.getElementById("origin")?.value || "idealist";
  const candidateName = () => document.getElementById("heroName")?.value?.trim() || "Bohuslav Korytář";

  function attributeBars(attrs = {}) {
    return `<div class="k168-attributes">${Object.entries(ATTR_LABELS).map(([id, label]) => {
      const value = Math.max(0, Math.min(5, Number(attrs[id]) || 0));
      return `<span title="${esc(label)} ${value}/5"><small>${esc(label)}</small><i><u style="width:${value * 20}%"></u></i><b>${value}</b></span>`;
    }).join("")}</div>`;
  }

  function ensureIntro() {
    const screen = document.getElementById("startScreen");
    const hero = screen?.querySelector(".hero");
    if (!screen || !hero) return false;
    screen.classList.add("k168-start-screen");
    hero.classList.add("k168-start-shell");

    if (!hero.querySelector(".k168-intro-copy")) {
      const copy = document.createElement("section");
      copy.className = "k168-intro-copy";
      while (hero.firstChild) copy.appendChild(hero.firstChild);
      hero.appendChild(copy);
      copy.querySelector(".crest")?.classList.add("k168-crest");
      copy.querySelector("h2")?.classList.add("k168-intro-title");
      copy.querySelector("blockquote")?.classList.add("k168-intro-quote");
      copy.querySelector("#startBtn")?.classList.add("k168-start-button");
      copy.querySelector(".v0145-start-flow")?.classList.add("k168-start-flow");
    }

    if (!hero.querySelector(".k168-campaign-brief")) {
      hero.insertAdjacentHTML("beforeend", `<aside class="k168-campaign-brief" aria-label="Briefing kampaně">
        <header><span>SPIS K-13</span><b>DOLNÍ VEJPRNICE</b><small>Komunální kampaň · třináct dní</small></header>
        <section class="k168-brief-metrics">
          <article><span>13</span><small>dní do voleb</small></article>
          <article><span>2</span><small>akce denně</small></article>
          <article><span>15</span><small>mandátů v radě</small></article>
        </section>
        <div class="k168-brief-track" aria-label="Průběh kampaně">
          <span><b>1</b><em>Kandidát</em><small>jméno, motivace, povolání</small></span>
          <span><b>2</b><em>Kampaň</em><small>kauzy, štáb, rival a veřejnost</small></span>
          <span><b>3</b><em>Volby</em><small>debata, mandáty a koalice</small></span>
        </div>
        <footer><strong>Hlavní protivník</strong><span>Vladimír Věčný</span><small>Starosta, síť kontaktů a náskok osmnáct bodů politické setrvačnosti.</small></footer>
      </aside>`);
    }
    return true;
  }

  function ensureOriginCards(panel) {
    const select = document.getElementById("origin");
    if (!select || !panel) return;
    select.closest(".field")?.classList.add("k168-origin-field");
    if (panel.querySelector(".k168-origin-grid")) return;
    select.insertAdjacentHTML("afterend", `<div class="k168-origin-grid" role="group" aria-label="Výchozí motivace kandidáta">
      ${Object.entries(ORIGINS).map(([id, origin]) => `<button type="button" data-k168-origin="${id}"><span>${origin.icon}</span><b>${esc(origin.short)}</b><small>${esc(origin.label)}</small><em>${esc(origin.effect)}</em></button>`).join("")}
    </div>`);
  }

  function decorateClassCards() {
    const defs = classes();
    document.querySelectorAll("#classGrid [data-class]").forEach(card => {
      const id = card.dataset.class;
      const def = defs[id];
      if (!def) return;
      card.classList.add("k168-class-card");
      card.setAttribute("aria-pressed", String(card.classList.contains("selected")));
      if (!card.querySelector(".k168-class-meta")) {
        card.insertAdjacentHTML("beforeend", `<div class="k168-class-meta">
          <span class="k168-ability">⚙ ${esc(ABILITY_LABELS[def.ability] || def.ability || "Třídní schopnost")}</span>
          ${attributeBars(def.attrs)}
        </div>`);
      }
    });
  }

  function previewMarkup() {
    const classId = selectedClassId();
    const originId = selectedOriginId();
    const def = classes()[classId] || {};
    const origin = ORIGINS[originId] || ORIGINS.idealist;
    return `<header><p>KANDIDÁTNÍ LIST</p><h2>${esc(candidateName())}</h2><small>Dolní Vejprnice · kandidát na starostu</small></header>
      <div class="k168-candidate-portrait" aria-hidden="true"><span>${esc(def.icon || "🎤")}</span><i></i></div>
      <section class="k168-preview-role"><b>${esc(def.name || "Politické povolání")}</b><p>${esc(def.desc || "Vyberte politické povolání.")}</p></section>
      <section class="k168-preview-origin"><span>${origin.icon}</span><div><b>${esc(origin.short)}</b><small>${esc(origin.effect)}</small></div></section>
      ${attributeBars(def.attrs || {})}
      <blockquote>${esc(origin.tone)}</blockquote>
      <footer><span>Save kompatibilita</span><b>${SAVE_VERSION} · schema ${SAVE_SCHEMA}</b></footer>`;
  }

  function syncCreation() {
    const screen = document.getElementById("creationScreen");
    const shell = screen?.querySelector(".creation");
    if (!screen || !shell) return false;
    screen.classList.add("k168-creation-screen");
    shell.classList.add("k168-creation-shell");

    const panels = shell.querySelectorAll(":scope > .panel");
    const identity = panels[0];
    const profession = panels[1];
    identity?.classList.add("k168-identity-panel");
    profession?.classList.add("k168-profession-panel");
    document.getElementById("classGrid")?.classList.add("k168-class-grid");
    document.getElementById("confirmBtn")?.classList.add("k168-confirm-button");

    if (!shell.querySelector(".k168-creation-head")) {
      shell.insertAdjacentHTML("afterbegin", `<header class="k168-creation-head">
        <div><p>KROK 1 ZE 3 · KANDIDÁT</p><h1>Kdo chce převzít obec i její přílohy?</h1><small>Jméno, motivace a politické povolání nastaví výchozí zdroje i způsob, jakým budete řešit konflikty.</small></div>
        <ol><li class="active">Kandidát</li><li>Kampaň</li><li>Volby</li></ol>
      </header>`);
    }

    ensureOriginCards(identity);
    decorateClassCards();

    let preview = shell.querySelector(".k168-candidate-preview");
    if (!preview) {
      preview = document.createElement("aside");
      preview.className = "k168-candidate-preview";
      preview.setAttribute("aria-live", "polite");
      shell.appendChild(preview);
    }
    preview.innerHTML = previewMarkup();

    const originId = selectedOriginId();
    shell.querySelectorAll("[data-k168-origin]").forEach(button => {
      const active = button.dataset.k168Origin === originId;
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    shell.querySelectorAll("#classGrid [data-class]").forEach(button => button.setAttribute("aria-pressed", String(button.classList.contains("selected"))));
    return true;
  }

  function syncAll() {
    ensureIntro();
    syncCreation();
  }

  function visualAudit() {
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      startShell: Boolean(document.querySelector("#startScreen .k168-start-shell")),
      campaignBrief: Boolean(document.querySelector(".k168-campaign-brief")),
      creationShell: Boolean(document.querySelector("#creationScreen .k168-creation-shell")),
      originCards: document.querySelectorAll("[data-k168-origin]").length,
      classCards: document.querySelectorAll("#classGrid .k168-class-card").length,
      preview: Boolean(document.querySelector(".k168-candidate-preview"))
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    syncAll();

    document.addEventListener("click", event => {
      const originButton = event.target?.closest?.("[data-k168-origin]");
      if (originButton) {
        const select = document.getElementById("origin");
        if (select) {
          select.value = originButton.dataset.k168Origin;
          select.dispatchEvent(new Event("change", {bubbles: true}));
        }
      }
      if (event.target?.closest?.("#startBtn,#classGrid [data-class],[data-k168-origin],#confirmBtn")) {
        setTimeout(syncAll, 0);
      }
    }, true);

    document.addEventListener("input", event => {
      if (event.target?.id === "heroName") syncCreation();
    });
    document.addEventListener("change", event => {
      if (event.target?.id === "origin") syncCreation();
    });

    globalThis.KorytoUI168 = {VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, ensureIntro, syncCreation, syncAll, visualAudit, install};
    return true;
  }

  install();
})();
