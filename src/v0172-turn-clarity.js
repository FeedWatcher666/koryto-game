"use strict";
(() => {
  const INFO = globalThis.KorytoBuildInfo || {
    displayVersion: "0.17.2 TEST.1",
    buildVersion: "0.17.2-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1
  };
  let queued = false;

  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;
  const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  function actionState(actions) {
    if (actions <= 0) return {key: "spent", label: "TAH VYČERPÁN"};
    if (actions === 1) return {key: "last", label: "POSLEDNÍ AKCE"};
    return {key: "ready", label: `${actions} AKCE K DISPOZICI`};
  }

  function decorateTurn() {
    const target = stateOf();
    if (!target) return;
    const actions = Math.max(0, finite(target.actions));
    const status = actionState(actions);

    document.querySelectorAll(".k16-day,.k165-day").forEach(day => {
      day.dataset.k172Turn = status.key;
      const small = day.querySelector("small");
      if (!small) return;
      small.textContent = `Květen, rok 2 · ${status.label}`;
      small.setAttribute("aria-label", `V tomto tahu zbývají ${actions} akce`);
    });

    document.querySelectorAll("[data-k16-end]").forEach(button => {
      button.dataset.k172Actions = String(actions);
      const label = button.querySelector("span");
      if (label) label.textContent = "UKONČIT DEN";
      button.setAttribute("aria-label", actions
        ? `Ukončit den předčasně. Soupeř získá ${actions * 2} body tlaku.`
        : "Ukončit den.");
      let penalty = button.querySelector(".k172-penalty");
      if (!penalty) {
        penalty = document.createElement("small");
        penalty.className = "k172-penalty";
        button.append(penalty);
      }
      penalty.textContent = actions
        ? `Předčasně: soupeř +${actions * 2} tlak`
        : "Bez nevyužitých akcí";
    });
  }

  function decorateDaySummary() {
    const target = stateOf();
    const card = document.querySelector("#v0166Root .k166-day-card");
    if (!target || !card) return;
    const actions = Math.max(0, finite(target.actions));
    const penalty = actions * 2;
    let warning = card.querySelector(".k172-day-warning");
    if (!warning) {
      warning = document.createElement("section");
      warning.className = "k172-day-warning";
      card.querySelector(".k166-day-actions")?.before(warning);
    }
    warning.dataset.k172Penalty = String(penalty);
    warning.innerHTML = actions
      ? `<b>${actions === 1 ? "1 NEVYUŽITÁ AKCE" : `${actions} NEVYUŽITÉ AKCE`}</b><span>Vladimír Věčný získá +${penalty} body tlaku.</span>`
      : "<b>TAH JE VYČERPÁN</b><span>Soupeř za nevyužité akce nic nezíská.</span>";

    const confirm = card.querySelector("[data-k166-confirm-day]");
    if (confirm) {
      confirm.dataset.k172Penalty = String(penalty);
      confirm.textContent = actions
        ? `UZAVŘÍT DEN · SOUPEŘ +${penalty} TLAK`
        : `UZAVŘÍT DEN ${Math.max(1, finite(target.day))}`;
    }
  }

  function decorateChoices() {
    document.querySelectorAll(".k165-choice").forEach(choice => {
      const locked = choice.disabled;
      choice.dataset.k172Availability = locked ? "locked" : "available";
      const copy = choice.querySelector("div:last-child");
      if (!copy) return;
      let state = copy.querySelector(".k172-choice-state");
      if (!state) {
        state = document.createElement("span");
        state.className = "k172-choice-state";
        copy.append(state);
      }
      state.textContent = locked ? "ZAMČENO · NESPLNĚNÁ PODMÍNKA" : "DOSTUPNÉ · SPOTŘEBUJE 1 AKCI";
      if (locked) choice.setAttribute("aria-disabled", "true");
    });
  }

  function impactTone(text) {
    if (/-\s*\d/.test(text)) return "negative";
    if (/\+\s*\d/.test(text)) return "positive";
    return "neutral";
  }

  function decorateResult() {
    const effects = document.querySelector(".k165-result-copy .effects");
    if (effects && !effects.dataset.k172Decorated) {
      const original = effects.textContent.trim();
      const parts = original.split(/\s*·\s*/).filter(Boolean);
      effects.dataset.k172Decorated = "true";
      effects.dataset.k172Original = original;
      effects.classList.add("k172-impact-list");
      effects.setAttribute("aria-label", `Dopady rozhodnutí: ${original}`);
      effects.textContent = "";
      parts.forEach(part => {
        const chip = document.createElement("span");
        chip.dataset.k172Impact = impactTone(part);
        chip.textContent = part;
        effects.append(chip);
      });
    }

    const button = document.querySelector(".k165-result-copy [data-k165-continue]");
    if (button) {
      button.textContent = "POKRAČOVAT · SPOTŘEBOVAT 1 AKCI";
      button.setAttribute("aria-label", "Pokračovat na mapu a spotřebovat jednu akci");
    }
  }

  function decorate() {
    if (typeof document === "undefined") return false;
    document.documentElement.classList.add("k172-turn-clarity");
    document.documentElement.dataset.korytoPolish = INFO.buildVersion;
    decorateTurn();
    decorateDaySummary();
    decorateChoices();
    decorateResult();
    INFO.applyLabels?.();
    return true;
  }

  function queueDecorate() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      decorate();
    }, 0);
  }

  function audit() {
    const target = stateOf();
    const effects = document.querySelector(".k172-impact-list");
    return {
      buildVersion: INFO.buildVersion,
      saveVersion: INFO.saveVersion,
      saveSchema: INFO.saveSchema,
      active: document.documentElement.classList.contains("k172-turn-clarity"),
      actions: Math.max(0, finite(target?.actions)),
      turnIndicators: document.querySelectorAll("[data-k172-turn]").length,
      endDayWarnings: document.querySelectorAll("[data-k16-end] .k172-penalty").length,
      daySummaryWarnings: document.querySelectorAll(".k172-day-warning").length,
      availableChoices: document.querySelectorAll('[data-k172-availability="available"]').length,
      lockedChoices: document.querySelectorAll('[data-k172-availability="locked"]').length,
      impactChips: effects?.querySelectorAll("[data-k172-impact]").length || 0
    };
  }

  function install() {
    if (typeof document === "undefined") return false;
    globalThis.addEventListener?.("click", queueDecorate, true);
    document.addEventListener("change", queueDecorate);
    globalThis.addEventListener?.("load", decorate, {once: true});
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", decorate, {once: true});
    } else {
      decorate();
    }
    return true;
  }

  globalThis.KorytoUI172 = Object.freeze({
    VERSION: INFO.displayVersion,
    BUILD_VERSION: INFO.buildVersion,
    SAVE_VERSION: INFO.saveVersion,
    SAVE_SCHEMA: INFO.saveSchema,
    decorate,
    audit,
    install
  });
  install();
})();
