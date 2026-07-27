"use strict";
(() => {
  const VERSION = "0.16.7 TEST.1";
  const BUILD_VERSION = "0.16.7-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;

  let installed = false;

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
  const partnerDefs = () => globalThis.KorytoFactionData?.coalitionPartnerDefs || {};

  function electionSnapshot(target = stateOf()) {
    const flags = target?.flags || {};
    const coalition = target?.coalition || {};
    const seats = Math.max(0, finite(flags.seats, coalition.playerSeats || 0));
    const majority = Math.max(1, finite(flags.majority, coalition.needed || 8));
    const coalitionSeats = Math.max(seats, finite(flags.coalitionTotalSeats, coalition.seats || seats));
    const total = Math.max(majority * 2 - 1, 15);
    return {
      vote: Math.max(0, finite(flags.vote)),
      seats,
      majority,
      coalitionSeats,
      total,
      round: Math.max(1, finite(coalition.round, 1)),
      maxRounds: Math.max(1, finite(coalition.maxRounds, 3)),
      formed: Boolean(flags.coalitionFormed || (coalition.active && coalitionSeats >= majority)),
      joined: Array.isArray(coalition.joined) ? coalition.joined : (Array.isArray(flags.coalitionPartners) ? flags.coalitionPartners : []),
      contracts: Array.isArray(coalition.contracts) ? coalition.contracts : (Array.isArray(flags.coalitionContracts) ? flags.coalitionContracts : [])
    };
  }

  function seatStrip(snapshot) {
    const allySeats = Math.max(0, snapshot.coalitionSeats - snapshot.seats);
    return `<div class="k167-seat-strip" role="img" aria-label="${snapshot.seats} vlastních mandátů, ${allySeats} koaličních mandátů, většina ${snapshot.majority}">
      ${Array.from({length: snapshot.total}, (_, index) => {
        const seat = index + 1;
        const kind = seat <= snapshot.seats ? "player" : seat <= snapshot.coalitionSeats ? "ally" : "other";
        return `<i class="${kind}" title="Mandát ${seat}"></i>`;
      }).join("")}
      <span style="--majority:${Math.min(snapshot.total, snapshot.majority)}"></span>
    </div>`;
  }

  function coalitionHeader(target, snapshot) {
    const needed = Math.max(0, snapshot.majority - snapshot.coalitionSeats);
    return `<header class="k167-election-header" id="k167CoalitionHeader">
      <div><p>VOLEBNÍ NOC · KOALIČNÍ SALONEK</p><h1>Většina se teď počítá po židlích</h1><small>${needed ? `K většině chybí ${needed} mandát${needed === 1 ? "" : "y"}.` : "Většina je na dosah. Teď zbývá přežít její cenu."}</small></div>
      <section class="k167-election-metrics">
        <article><span>🗳️</span><small>Výsledek</small><b>${Math.round(snapshot.vote)} %</b></article>
        <article><span>🏛️</span><small>Vlastní klub</small><b>${snapshot.seats} / ${snapshot.total}</b></article>
        <article><span>🤝</span><small>Aktuální blok</small><b>${snapshot.coalitionSeats} / ${snapshot.majority}</b></article>
        <article><span>⏳</span><small>Kolo</small><b>${snapshot.round} / ${snapshot.maxRounds}</b></article>
      </section>
      ${seatStrip(snapshot)}
    </header>`;
  }

  function syncCoalition() {
    const screen = document.getElementById("coalitionScreen");
    const target = stateOf();
    const active = Boolean(screen?.classList.contains("active") && target?.coalition?.active);
    document.documentElement.classList.toggle("k167-coalition-active", active);
    if (!active || !screen) return false;

    const shell = screen.querySelector(".coalition-shell");
    if (!shell) return false;
    shell.classList.add("k167-coalition-shell");

    const snapshot = electionSnapshot(target);
    let header = screen.querySelector("#k167CoalitionHeader");
    if (!header) {
      shell.insertAdjacentHTML("afterbegin", coalitionHeader(target, snapshot));
      header = screen.querySelector("#k167CoalitionHeader");
    } else {
      header.outerHTML = coalitionHeader(target, snapshot);
    }

    screen.querySelector(".coalition-header")?.classList.add("k167-negotiation-header");
    screen.querySelector("#coalitionResources")?.setAttribute("aria-label", "Vyjednávací kapitál");
    screen.querySelector("#coalitionPartners")?.setAttribute("aria-live", "polite");
    screen.querySelector("#coalitionLog")?.setAttribute("aria-live", "polite");

    screen.querySelectorAll("#coalitionResources .resource").forEach((card, index) => {
      card.classList.add("k167-resource-card");
      card.dataset.k167Resource = ["credibility", "patronage", "pressure"][index] || String(index + 1);
    });

    const ids = Object.keys(partnerDefs());
    screen.querySelectorAll("#coalitionPartners .partner-card").forEach((card, index) => {
      card.classList.add("k167-partner-card");
      card.dataset.k167Partner = ids[index] || String(index + 1);
      card.classList.toggle("available", !card.classList.contains("joined") && !card.classList.contains("locked"));
      const button = card.querySelector("button");
      if (button) button.setAttribute("aria-label", `${button.textContent.trim()}: ${card.querySelector("h3")?.textContent?.trim() || "koaliční klub"}`);
    });

    const offerPanel = screen.querySelector("#coalitionOfferPanel");
    if (offerPanel) {
      offerPanel.classList.add("k167-offer-panel");
      offerPanel.querySelectorAll(".offer").forEach((button, index) => {
        button.classList.add("k167-offer");
        button.dataset.k167Offer = String(index + 1);
      });
    }

    screen.querySelectorAll("#coalitionLog .coalition-entry").forEach(entry => entry.classList.add("k167-log-entry"));
    const pass = screen.querySelector("#coalitionPass");
    if (pass) {
      pass.classList.add("k167-pass");
      pass.textContent = `UZAVŘÍT KOLO ${snapshot.round} BEZ DOHODY`;
    }
    return true;
  }

  function endingHeader(target, snapshot) {
    const stats = target?.stats || {};
    const cleanContracts = snapshot.contracts.filter(item => item?.kind === "program").length;
    const dirtyContracts = Math.max(0, snapshot.contracts.length - cleanContracts);
    const status = snapshot.seats >= snapshot.majority
      ? "VLASTNÍ VĚTŠINA"
      : snapshot.formed
        ? "KOALICE SESTAVENA"
        : snapshot.coalitionSeats >= snapshot.majority
          ? "VĚTŠINA DOHODNUTA"
          : "BEZ VĚTŠINY";
    return `<header class="k167-ending-header" id="k167EndingHeader">
      <div><p>VOLEBNÍ NOC · KONEČNÝ ZÁPIS</p><h1>${esc(status)}</h1><small>${snapshot.seats} vlastních mandátů · ${snapshot.coalitionSeats} hlasů v bloku · hranice většiny ${snapshot.majority}</small></div>
      <section class="k167-ending-metrics">
        <article><span>🗳️</span><small>Hlasy</small><b>${Math.round(snapshot.vote)} %</b></article>
        <article><span>🤝</span><small>Důvěra</small><b>${Math.round(clamp(stats.trust))}</b></article>
        <article><span>⚖️</span><small>Integrita</small><b>${Math.round(clamp(stats.integrity))}</b></article>
        <article class="${finite(stats.heat) >= 60 ? "danger" : ""}"><span>🔥</span><small>Tlak</small><b>${Math.round(clamp(stats.heat))}</b></article>
      </section>
      ${seatStrip(snapshot)}
      <div class="k167-contract-summary"><span>Programové dohody <b>${cleanContracts}</b></span><span>Funkce a nátlak <b>${dirtyContracts}</b></span><span>Partneři <b>${snapshot.joined.length}</b></span></div>
    </header>`;
  }

  function syncEnding() {
    const screen = document.getElementById("endingScreen");
    const target = stateOf();
    const active = Boolean(screen?.classList.contains("active") && target?.ended);
    document.documentElement.classList.toggle("k167-ending-active", active);
    if (!active || !screen) return false;

    const wrapper = screen.querySelector(".ending");
    if (!wrapper) return false;
    wrapper.classList.add("k167-ending-shell");
    const snapshot = electionSnapshot(target);
    let header = screen.querySelector("#k167EndingHeader");
    if (!header) wrapper.insertAdjacentHTML("afterbegin", endingHeader(target, snapshot));
    else header.outerHTML = endingHeader(target, snapshot);

    screen.querySelector("#endingEmoji")?.classList.add("k167-ending-emoji");
    screen.querySelector("#endingTitle")?.classList.add("k167-ending-title");
    screen.querySelector("#endingLead")?.classList.add("k167-ending-lead");
    screen.querySelector("#endingStory")?.classList.add("k167-ending-story");
    screen.querySelector("#finalStats")?.classList.add("k167-final-stats");
    const again = screen.querySelector("#againBtn");
    if (again) {
      again.classList.add("k167-again");
      again.textContent = "NOVÁ KAMPAŇ";
    }
    return true;
  }

  function syncAll() {
    syncCoalition();
    syncEnding();
  }

  function wrap(name) {
    const original = globalThis[name];
    if (typeof original !== "function" || original.__v0167Wrapped) return;
    const wrapped = function(...args) {
      const result = original.apply(this, args);
      setTimeout(syncAll, 0);
      setTimeout(syncAll, 80);
      return result;
    };
    wrapped.__v0167Wrapped = true;
    globalThis[name] = wrapped;
  }

  function visualAudit() {
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      coalitionActive: document.documentElement.classList.contains("k167-coalition-active"),
      endingActive: document.documentElement.classList.contains("k167-ending-active"),
      partnerCards: document.querySelectorAll("#coalitionPartners .k167-partner-card").length,
      offerCards: document.querySelectorAll("#coalitionOfferPanel .k167-offer").length,
      seats: document.querySelectorAll(".k167-seat-strip i").length
    };
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    installed = true;
    ["showCoalitionScreen", "renderCoalition", "openCoalitionOffers", "resolveCoalitionOffer", "finishCoalition", "finalizeElection", "showEnding"].forEach(wrap);
    document.addEventListener("click", event => {
      if (event.target?.closest?.("#coalitionScreen,#endingScreen,#nextFinal,#diceClose")) {
        setTimeout(syncAll, 0);
        setTimeout(syncAll, 100);
      }
    }, true);
    setTimeout(syncAll, 0);
    globalThis.KorytoUI167 = {VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, electionSnapshot, syncCoalition, syncEnding, visualAudit, install};
    return true;
  }

  install();
})();
