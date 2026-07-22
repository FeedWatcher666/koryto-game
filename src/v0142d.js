"use strict";
(() => {
  const VERSION = "0.14.2 TEST.6";
  const CHECKPOINTS = [5, 9, 12];
  const FLAG_PREFIX = "v0142Endorsement";

  const active = () =>
    typeof state !== "undefined" &&
    document.getElementById("gameScreen")?.classList.contains("active") &&
    state.phase === "map" && !state.ended;

  function checkpoint() {
    if (typeof state === "undefined") return null;
    return CHECKPOINTS.find(day => state.day >= day && !state.flags?.[`${FLAG_PREFIX}${day}`]) || null;
  }

  function ensureVoters() {
    state.voters = state.voters || {};
    for (const [id, def] of Object.entries(voterDefs || {})) {
      state.voters[id] = state.voters[id] || {support:def.base,turnout:def.turnout};
    }
  }

  function shiftVoter(id, amount) {
    ensureVoters();
    const def = voterDefs[id];
    if (!def || !state.voters[id]) return;
    state.voters[id].support = clamp((state.voters[id].support ?? def.base) + amount, 0, 100);
  }

  function addCommitmentSafe(data) {
    if (typeof addCommitment === "function") {
      addCommitment(data);
      return;
    }
    state.commitments = state.commitments || [];
    state.commitmentSeq = (state.commitmentSeq || 0) + 1;
    state.commitments.push({
      id:`endorsement_${state.commitmentSeq}`,
      title:data.title,
      creditor:data.creditor,
      due:data.due,
      kind:data.kind || "private",
      notes:data.notes || "",
      status:"active"
    });
  }

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #endorsementOverlay .dialog{max-width:820px;text-align:left}
      .endorsement-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:16px 0}
      .endorsement-card{text-align:left;min-height:160px;display:flex;flex-direction:column;justify-content:space-between}
      .endorsement-card strong,.endorsement-card small{display:block}
      .endorsement-card strong{font-size:1.05rem;margin-bottom:8px}
      .endorsement-card small{line-height:1.45;opacity:.82}
      .endorsement-badge{display:inline-block;margin-top:10px;font-size:.75rem;opacity:.75}
    `;
    document.head.appendChild(style);
  }

  function createUi() {
    const actions = document.querySelector(".topbar .actions");
    if (actions && !document.getElementById("endorsementBtn")) {
      const button = document.createElement("button");
      button.id = "endorsementBtn";
      button.className = "btn small hidden";
      button.textContent = "Shánět podporu";
      button.addEventListener("click", openMarket);
      actions.insertBefore(button, actions.firstChild);
    }

    if (!document.getElementById("endorsementOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "endorsementOverlay";
      overlay.className = "overlay hidden";
      overlay.innerHTML = '<div class="dialog" role="dialog" aria-modal="true"></div>';
      overlay.addEventListener("click", event => {
        if (event.target === overlay) close();
      });
      document.body.appendChild(overlay);
    }
  }

  function updateButton() {
    const button = document.getElementById("endorsementBtn");
    if (!button || typeof state === "undefined") return;
    const cp = document.getElementById("gameScreen")?.classList.contains("active") ? checkpoint() : null;
    const visible = Boolean(cp) && !state.ended;
    button.classList.toggle("hidden", !visible);
    button.disabled = !visible || !active() || state.actions < 1;
    button.textContent = cp ? `Podpora · den ${cp}` : "Shánět podporu";
    button.title = "Získejte veřejnou podporu, peníze nebo dosah. Každý patron si něco zapamatuje.";
  }

  function openMarket() {
    const cp = checkpoint();
    if (!cp) return alert("Další kolo veřejné podpory zatím nezačalo.");
    if (!active()) return alert("Podporu lze vyjednávat pouze na mapě.");
    if (state.actions < 1) return alert("Na další schůzku už dnes nezbývá akce.");

    const overlay = document.getElementById("endorsementOverlay");
    const dialog = overlay.querySelector(".dialog");
    dialog.innerHTML = `
      <p class="eyebrow">TRH VEŘEJNÉ PODPORY · ${VERSION}</p>
      <h2>Kdo se postaví za kandidáta?</h2>
      <p>Podpora zdarma neexistuje. Někdy stojí peníze, jindy důvěru a nejčastěji budoucí rozhodnutí.</p>
      <div class="endorsement-grid">
        <button class="btn endorsement-card" data-endorsement="workers">
          <span><strong>🚜 Sdružení zaměstnanců a spolků</strong><small>+6 podpora, +7 lidé kolem JZD, +5 občané, −3 podnikatelé. Vznikne veřejný slib chránit pracovní místa.</small></span>
          <span class="endorsement-badge">VEŘEJNÝ ZÁVAZEK</span>
        </button>
        <button class="btn endorsement-card" data-endorsement="business">
          <span><strong>💼 Podnikatelský klub Dolní Vejprnice</strong><small>+10 peníze, +6 vliv, +6 byznys, ale −5 integrita a +4 mediální tlak. Klub očekává rychlejší povolení projektu.</small></span>
          <span class="endorsement-badge">SOUKROMÝ ZÁVAZEK</span>
        </button>
        <button class="btn endorsement-card" data-endorsement="influencer" ${state.stats.funds < 2 ? "disabled" : ""}>
          <span><strong>📱 Lokální influencer s celostátní ambicí</strong><small>Stojí 2 peníze. +8 podpora, +6 nerozhodnutí, +6 naštvaní nevoliči, ale −2 důvěra a +3 tlak.</small></span>
          <span class="endorsement-badge">DOSAH BEZ PAMĚTI</span>
        </button>
      </div>
      <button class="btn small" id="endorsementClose">Odejít bez podpory</button>`;

    dialog.querySelectorAll("[data-endorsement]").forEach(button => {
      button.addEventListener("click", () => resolve(button.dataset.endorsement, cp));
    });
    dialog.querySelector("#endorsementClose").addEventListener("click", close);
    overlay.classList.remove("hidden");
  }

  function resolve(choice, cp) {
    if (!active() || state.actions < 1 || checkpoint() !== cp) return close();
    if (choice === "influencer" && state.stats.funds < 2) return alert("Influencer chce platbu předem.");

    state.flags = state.flags || {};
    state.flags[`${FLAG_PREFIX}${cp}`] = choice;
    state.actions -= 1;

    if (choice === "workers") {
      effect({support:6,citizens:5,business:-3});
      shiftVoter("jzdWorkers",7);
      shiftVoter("club",3);
      addCommitmentSafe({
        title:"Udržet pracovní místa v JZD a obecních službách",
        creditor:"Sdružení zaměstnanců a spolků",
        due:Math.min(13,state.day+3),
        kind:"public",
        notes:"Veřejná podpora kampaně"
      });
      addNews("Zaměstnanci a spolky veřejně podpořili kandidáta. Na pódiu se zároveň objevila věta o ochraně každého pracovního místa.","normal");
      log("Podpora: zaměstnanci a spolky podpořili kampaň výměnou za veřejný závazek.");
    } else if (choice === "business") {
      effect({funds:10,influence:6,business:6,integrity:-5,heat:4});
      shiftVoter("entrepreneurs",6);
      addCommitmentSafe({
        title:"Urychlit povolení investičního projektu podnikatelského klubu",
        creditor:"Podnikatelský klub Dolní Vejprnice",
        due:Math.min(13,state.day+3),
        notes:"Finanční a organizační podpora kampaně"
      });
      addNews("Podnikatelský klub poslal peníze, lidi a tiskovou větu o odpovědném rozvoji. Příloha obsahuje mapu budoucího projektu.","bad");
      log("Podpora: podnikatelský klub vstoupil do kampaně s penězi a očekáváním rychlého povolení.");
    } else {
      effect({funds:-2,support:8,trust:-2,heat:3});
      shiftVoter("undecided",6);
      shiftVoter("disengaged",6);
      addNews("Lokální influencer označil kandidáta za jediného člověka, který rozumí algoritmu i kanalizaci. Video překonalo počet obyvatel obce.","normal");
      log("Podpora: placený influencer rozšířil dosah kampaně mezi nerozhodnuté a nevoliče.");
    }

    close();
    if (typeof renderAll === "function") renderAll();
    if (typeof autoSave === "function") autoSave();
    updateButton();
  }

  function close() {
    document.getElementById("endorsementOverlay")?.classList.add("hidden");
  }

  function updateVersion() {
    document.title = `Koryto ${VERSION} – Živý politický svět`;
    const brand = document.querySelector(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = `Koryto ${VERSION}: patroni kampaně, velké sliby, průzkumy, mediální krize a živé frakce.`;
  }

  addStyles();
  createUi();
  updateVersion();
  updateButton();
  setInterval(updateButton,500);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });
})();
