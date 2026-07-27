"use strict";
(() => {
  const VERSION = "0.16.6 TEST.1";
  const BUILD_VERSION = "0.16.6-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;

  let installed = false;
  let bypassEndDay = false;
  let previousShowEvent = null;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = value => Math.max(0, Math.min(100, finite(value)));
  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;
  const questDefs = () => globalThis.KorytoQuestData?.definitions || {};

  function money(value) {
    return `${Math.round(Math.max(0, finite(value)) * 10000).toLocaleString("cs-CZ")} Kč`;
  }

  function deadline(id, target) {
    return globalThis.KorytoQuestRuntime?.deadline?.(id, target) ?? questDefs()[id]?.deadline ?? 13;
  }

  function ensureRoot() {
    let root = document.getElementById("v0166Root");
    if (!root) {
      root = document.createElement("div");
      root.id = "v0166Root";
      root.hidden = true;
      document.body.appendChild(root);
    }
    return root;
  }

  function activeQuestRows(target) {
    return Object.entries(target?.quests || {})
      .filter(([, quest]) => quest?.status === "active")
      .map(([id, quest]) => {
        const def = questDefs()[id] || {};
        const due = deadline(id, target);
        return {
          id,
          title: def.title || id,
          stage: Math.max(0, finite(quest.stage)),
          due,
          left: due - Math.max(1, finite(target?.day, 1))
        };
      })
      .sort((a, b) => a.left - b.left || a.title.localeCompare(b.title, "cs"));
  }

  function currentDayLog(target) {
    const day = Math.max(1, finite(target?.day, 1));
    const world = (target?.worldActions || [])
      .filter(item => finite(item?.day) === day)
      .slice(0, 5)
      .map(item => `${item.owner || "Obec"}: ${item.text || "Bez zápisu."}`);
    const log = (target?.log || [])
      .slice(-8)
      .reverse()
      .filter(Boolean)
      .slice(0, Math.max(0, 5 - world.length));
    return [...world, ...log].slice(0, 5);
  }

  function assignedCompanion(target) {
    const assignment = target?.partyAssignment;
    if (!assignment) return "Nikdo není vyslán na samostatnou misi.";
    const id = assignment.companionId || assignment.id || assignment.companion;
    const member = target?.party?.[id];
    const name = member?.name || id || "Člen štábu";
    const location = assignment.location || assignment.target || "obec";
    return `${name} plní samostatnou misi: ${location}.`;
  }

  function closeDaySummary() {
    const root = ensureRoot();
    root.hidden = true;
    root.innerHTML = "";
    document.documentElement.classList.remove("k166-day-open");
  }

  function renderDaySummary(sourceButton) {
    const target = stateOf();
    if (!target || target.ended || target.phase !== "map") return false;

    const day = Math.max(1, finite(target.day, 1));
    const quests = activeQuestRows(target);
    const urgent = quests.filter(item => item.left <= 1).length;
    const log = currentDayLog(target);
    const stats = target.stats || {};
    const root = ensureRoot();

    root.innerHTML = `<section class="k166-day-overlay" role="dialog" aria-modal="true" aria-labelledby="k166DayTitle">
      <div class="k166-day-card">
        <header class="k166-day-header">
          <div><p>DENNÍ UZÁVĚRKA</p><h1 id="k166DayTitle">Den ${day}: co po vás zůstane v zápisu</h1><small>Zkontrolujte termíny, rozdělané kauzy a tahy štábu. Potom obec přepne na další den.</small></div>
          <button type="button" data-k166-cancel-day aria-label="Zavřít přehled dne">×</button>
        </header>
        <section class="k166-day-metrics">
          <article><span>🤝</span><small>Důvěra</small><b>${Math.round(clamp(stats.trust))}</b></article>
          <article><span>♛</span><small>Vliv</small><b>${Math.round(clamp(stats.influence))}</b></article>
          <article><span>🪙</span><small>Peníze</small><b>${esc(money(stats.funds))}</b></article>
          <article class="${finite(stats.heat) >= 60 ? "danger" : ""}"><span>🔥</span><small>Tlak</small><b>${Math.round(clamp(stats.heat))}</b></article>
        </section>
        <div class="k166-day-grid">
          <section class="k166-day-panel">
            <header><h2>Aktivní kauzy</h2><b>${quests.length}</b></header>
            <div class="k166-day-list">
              ${quests.slice(0, 5).map(item => `<article class="${item.left <= 1 ? "urgent" : ""}"><span>${item.left <= 0 ? "!" : "◆"}</span><div><b>${esc(item.title)}</b><small>Postup ${Math.min(5, item.stage + 1)} / 5</small></div><strong>${item.left <= 0 ? "DNES" : `${item.left} d`}</strong></article>`).join("") || "<p>Žádná aktivní kauza. V Dolních Vejprnicích to obvykle znamená, že se teprve tiskne anonym.</p>"}
            </div>
            <footer>${urgent ? `<strong>${urgent} termín${urgent === 1 ? "" : "y"} hoří.</strong>` : "Nejbližší termíny zatím drží."}</footer>
          </section>
          <section class="k166-day-panel">
            <header><h2>Dnešní stopa</h2><b>${Math.max(0, finite(target.actions))} akce</b></header>
            <div class="k166-day-log">${log.map(line => `<p>${esc(line)}</p>`).join("") || "<p>Dnešní kronika je prázdná. Starosta tomu říká stabilita.</p>"}</div>
            <footer>${esc(assignedCompanion(target))}</footer>
          </section>
        </div>
        <footer class="k166-day-actions">
          <button type="button" data-k166-cancel-day>JEŠTĚ NE</button>
          <button type="button" class="primary" data-k166-confirm-day>UZAVŘÍT DEN ${day}</button>
        </footer>
      </div>
    </section>`;

    root.hidden = false;
    document.documentElement.classList.add("k166-day-open");
    root.querySelectorAll("[data-k166-cancel-day]").forEach(button => button.addEventListener("click", closeDaySummary));
    root.querySelector("[data-k166-confirm-day]")?.addEventListener("click", () => {
      bypassEndDay = true;
      closeDaySummary();
      sourceButton?.click();
      setTimeout(() => { bypassEndDay = false; }, 0);
    });
    root.querySelector("[data-k166-confirm-day]")?.focus();
    return true;
  }

  function interceptEndDay(event) {
    const button = event.target?.closest?.("#endDayBtn,[data-k16-end]");
    if (!button || bypassEndDay) return;
    const target = stateOf();
    if (!target || target.phase !== "map" || target.ended) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    renderDaySummary(button);
  }

  function ensureDebateHeader(screen, target) {
    let header = screen.querySelector(".k166-debate-header");
    if (!header) {
      header = document.createElement("header");
      header.className = "k166-debate-header";
      screen.prepend(header);
    }
    const round = target?.debate?.round || 1;
    const max = target?.debate?.maxRounds || 5;
    header.innerHTML = `<div><p>VEŘEJNÁ DEBATA · DOLNÍ VEJPRNICE</p><h1>Souboj o poslední nerozhodnuté</h1></div><section><span>Den ${Math.max(1, finite(target?.day, 1))}</span><b>Kolo ${round} / ${max}</b><em>${Math.round(clamp(target?.debate?.momentum || 0))} momentum</em></section>`;
  }

  function syncDebate() {
    const screen = document.getElementById("debateScreen");
    const target = stateOf();
    const active = Boolean(screen?.classList.contains("active") && target?.debate?.active);
    document.documentElement.classList.toggle("k166-debate-active", active);
    if (!active || !screen) return false;

    ensureDebateHeader(screen, target);
    screen.querySelector("#debateIntent")?.setAttribute("aria-live", "polite");
    screen.querySelector("#debateLog")?.setAttribute("aria-live", "polite");
    screen.querySelectorAll("#debateCards button").forEach((button, index) => {
      button.classList.add("k166-debate-card");
      button.dataset.k166Card = String(index + 1);
      if (!button.getAttribute("aria-label")) {
        const label = button.querySelector("strong,h3,b")?.textContent?.trim() || button.textContent.trim();
        button.setAttribute("aria-label", `Debatní karta ${index + 1}: ${label}`);
      }
    });
    screen.querySelectorAll("#debateAssists button,#classAbilityBox button").forEach(button => button.classList.add("k166-support-action"));
    return true;
  }

  function wrapShowEvent() {
    if (typeof globalThis.showEvent !== "function" || globalThis.showEvent.__v0166Wrapped) return;
    previousShowEvent = globalThis.showEvent;
    const wrapped = function(id, ...args) {
      const result = previousShowEvent.call(this, id, ...args);
      if (id === "debate") setTimeout(syncDebate, 0);
      return result;
    };
    wrapped.__v0166Wrapped = true;
    globalThis.showEvent = wrapped;
  }

  function visualAudit() {
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      dayOverlay: Boolean(document.querySelector("#v0166Root .k166-day-overlay")),
      debateActive: document.documentElement.classList.contains("k166-debate-active"),
      debateCards: document.querySelectorAll("#debateCards .k166-debate-card").length
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    wrapShowEvent();
    document.addEventListener("click", interceptEndDay, true);
    document.addEventListener("click", event => {
      if (event.target?.closest?.("#debateScreen")) {
        setTimeout(syncDebate, 0);
        setTimeout(syncDebate, 120);
      }
      if (event.target?.id === "confirmBtn") setTimeout(syncDebate, 60);
    });
    globalThis.addEventListener("hashchange", syncDebate);
    setTimeout(syncDebate, 0);
    globalThis.KorytoUI166 = {VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, renderDaySummary, closeDaySummary, syncDebate, visualAudit, install};
    return true;
  }

  install();
})();
