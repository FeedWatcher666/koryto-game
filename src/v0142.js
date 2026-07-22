"use strict";
(() => {
  const VERSION = "0.14.2 TEST.4";
  const BRIEFING_FLAG = "v0142BriefingDay";
  const MEDIA_FLAG = "v0142MediaDay";
  const POLL_PREFIX = "v0142PollDay";
  const POLL_DAYS = [4, 8, 12];

  const gameScreenActive = () =>
    typeof state !== "undefined" &&
    document.getElementById("gameScreen")?.classList.contains("active") &&
    !state.ended;

  const mapReady = () => gameScreenActive() && state.phase === "map";
  const usedToday = flag => state?.flags?.[flag] === state.day;
  const pollCheckpoint = () => POLL_DAYS.find(day => state?.day >= day && !state?.flags?.[`${POLL_PREFIX}${day}`]);

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #briefingBtn.used,#mediaBtn.used,#pollBtn.used{opacity:.58}
      #briefingOverlay .dialog,#mediaOverlay .dialog,#pollOverlay .dialog{max-width:820px;text-align:left}
      .v0142-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}
      .v0142-stat{border:2px solid var(--line,#2b2b2b);padding:10px;background:rgba(255,255,255,.04)}
      .v0142-stat small{display:block;opacity:.75;margin-bottom:4px}
      .v0142-stat strong{font-size:1.05rem}
      .v0142-options{display:grid;gap:10px;margin-top:14px}
      .v0142-option{text-align:left;width:100%}
      .v0142-option strong,.v0142-option small{display:block}
      .v0142-option small{margin-top:5px;opacity:.8;line-height:1.35}
      .v0142-close{margin-top:14px}
      .v0142-poll-row{display:grid;grid-template-columns:minmax(150px,1fr) 2fr 56px;gap:10px;align-items:center;margin:8px 0}
      .v0142-poll-bar{height:12px;border:1px solid currentColor;background:rgba(255,255,255,.08)}
      .v0142-poll-bar i{display:block;height:100%;background:currentColor}
      .v0142-estimate{font-size:2rem;margin:8px 0}
    `;
    document.head.appendChild(style);
  }

  function addTopbarButton(id, label, handler) {
    const actions = document.querySelector(".topbar .actions");
    if (!actions || document.getElementById(id)) return;
    const button = document.createElement("button");
    button.id = id;
    button.className = "btn small hidden";
    button.textContent = label;
    button.addEventListener("click", handler);
    actions.insertBefore(button, actions.firstChild);
  }

  function addOverlay(id) {
    if (document.getElementById(id)) return;
    const overlay = document.createElement("div");
    overlay.id = id;
    overlay.className = "overlay hidden";
    overlay.innerHTML = '<div class="dialog" role="dialog" aria-modal="true"></div>';
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeOverlay(id);
    });
    document.body.appendChild(overlay);
  }

  function closeOverlay(id) {
    document.getElementById(id)?.classList.add("hidden");
  }

  function optionButton(id, title, detail, disabled = false) {
    return `<button class="btn v0142-option" data-choice="${id}" ${disabled ? "disabled" : ""}>
      <strong>${title}</strong><small>${detail}</small>
    </button>`;
  }

  function updateButtons() {
    if (typeof state === "undefined") return;

    const briefing = document.getElementById("briefingBtn");
    if (briefing) {
      const visible = gameScreenActive();
      const used = visible && usedToday(BRIEFING_FLAG);
      briefing.classList.toggle("hidden", !visible);
      briefing.classList.toggle("used", used);
      briefing.disabled = !mapReady() || state.actions < 1 || used;
      briefing.textContent = used ? "Štáb dnes proběhl" : "Krizový štáb";
    }

    const media = document.getElementById("mediaBtn");
    if (media) {
      const visible = gameScreenActive() && state.stats?.heat >= 15;
      const used = visible && usedToday(MEDIA_FLAG);
      media.classList.toggle("hidden", !visible);
      media.classList.toggle("used", used);
      media.disabled = !mapReady() || state.actions < 1 || used;
      media.textContent = used ? "Média dnes řešena" : "Mediální krize";
    }

    const poll = document.getElementById("pollBtn");
    if (poll) {
      const checkpoint = gameScreenActive() ? pollCheckpoint() : null;
      const visible = Boolean(checkpoint);
      poll.classList.toggle("hidden", !visible);
      poll.disabled = !visible || !mapReady() || state.actions < 1 || state.stats?.funds < 2;
      poll.textContent = checkpoint ? `Průzkum · den ${checkpoint}` : "Volební průzkum";
      poll.title = state.stats?.funds < 2 ? "Průzkum stojí 2 peníze." : "Zjistí podporu po blocích a umožní změnit cílení kampaně.";
    }
  }

  function openBriefing() {
    if (!mapReady()) return alert("Krizový štáb lze svolat pouze na mapě během kampaně.");
    if (usedToday(BRIEFING_FLAG)) return alert("Dnešní porada už proběhla.");
    if (state.actions < 1) return alert("Na poradu už dnes nezbývá akce.");

    const overlay = document.getElementById("briefingOverlay");
    const dialog = overlay.querySelector(".dialog");
    const rival = typeof rivalReadLabel === "function" ? rivalReadLabel() : "Soupeřův plán není čitelný.";
    const urgent = typeof dueQuestCount === "function" ? dueQuestCount() : 0;

    dialog.innerHTML = `
      <p class="eyebrow">${VERSION}</p>
      <h2>Krizový štáb · den ${state.day}</h2>
      <p>Jednou denně můžete spotřebovat jednu akci na zásah, který změní průběh kampaně. PowerPoint není povinný, následky ano.</p>
      <div class="v0142-summary">
        <div class="v0142-stat"><small>Zbývající akce</small><strong>${state.actions}</strong></div>
        <div class="v0142-stat"><small>Hořící questy</small><strong>${urgent}</strong></div>
        <div class="v0142-stat"><small>Peníze</small><strong>${state.stats.funds}</strong></div>
        <div class="v0142-stat"><small>Čtení soupeře</small><strong>${rival}</strong></div>
      </div>
      <div class="v0142-options">
        ${optionButton("data", "📊 Datový briefing", "−1 akce, −2 peníze, +2 důvěra, +2 vliv. Odhalí aktuální adaptaci Věčného.", state.stats.funds < 2)}
        ${optionButton("volunteers", "📣 Mobilizovat dobrovolníky", "−1 akce, −1 peníze, +5 podpora, +4 občané, +1 mediální tlak.", state.stats.funds < 1)}
        ${optionButton("dossier", "🗂️ Vypustit kompromat", "−1 akce, +4 páky, +3 podpora, −5 staré struktury, ale +8 tlak a −7 integrita.")}
      </div>
      <button class="btn small v0142-close" data-close="briefingOverlay">Zrušit poradu</button>`;

    bindChoices(dialog, resolveBriefing);
    overlay.classList.remove("hidden");
  }

  function resolveBriefing(choice) {
    if (!mapReady() || usedToday(BRIEFING_FLAG) || state.actions < 1) return closeOverlay("briefingOverlay");
    if (choice === "data" && state.stats.funds < 2) return alert("Na datový briefing chybí peníze.");
    if (choice === "volunteers" && state.stats.funds < 1) return alert("Na mobilizaci chybí peníze.");

    state.flags = state.flags || {};
    state.flags[BRIEFING_FLAG] = state.day;
    state.actions -= 1;

    if (choice === "data") {
      effect({funds:-2,trust:2,influence:2});
      state.rivalAI = state.rivalAI || {};
      state.rivalAI.revealed = true;
      addNews("Krizový štáb rozkreslil Věčného taktiku. Poprvé je vidět, na co přesně reaguje.","normal");
      log("Krizový štáb: datový briefing odhalil soupeřovu adaptaci.");
    } else if (choice === "volunteers") {
      effect({funds:-1,support:5,citizens:4,heat:1});
      addNews("Dobrovolníci dostali mapu, seznam dveří a optimismus, který zatím neprošel účetnictvím.","normal");
      log("Krizový štáb: dobrovolnická mobilizace rozšířila podporu v obci.");
    } else {
      effect({leverage:4,support:3,oldguard:-5,heat:8,integrity:-7});
      addNews("Do obce unikla složka na Věčného. Nikdo neví odkud, všichni vědí komu pomáhá.","bad");
      log("Krizový štáb: kompromat zvýšil páky i mediální tlak.");
    }

    finishAction("briefingOverlay");
  }

  function openMedia() {
    if (!mapReady()) return alert("Mediální krizi lze řešit pouze na mapě.");
    if (state.stats.heat < 15) return alert("Média jsou zatím podezřele klidná.");
    if (usedToday(MEDIA_FLAG)) return alert("Dnešní mediální reakce už proběhla.");
    if (state.actions < 1) return alert("Na tiskovku už dnes nezbývá akce.");

    const overlay = document.getElementById("mediaOverlay");
    const dialog = overlay.querySelector(".dialog");
    const weakest = weakestCompanion();
    const sacrificeDetail = weakest
      ? `−1 akce, −9 tlak, +2 podpora, −8 integrita a ${weakest.name} ztratí 12 loajality.`
      : "−1 akce, −6 tlak, +1 podpora a −8 integrita. Bez spojence není koho hodit přes palubu.";

    dialog.innerHTML = `
      <p class="eyebrow">TISKOVÉ ODDĚLENÍ V PLAMENECH</p>
      <h2>Mediální krize · tlak ${state.stats.heat}</h2>
      <p>Telefon zvoní, redakce čekají a každý poradce doporučuje jinou verzi pravdy.</p>
      <div class="v0142-options">
        ${optionButton("transparent", "🎙️ Otevřená tiskovka", "−1 akce, −8 tlak, +4 důvěra, +3 integrita, ale −1 podpora.")}
        ${optionButton("meme", "📱 Přetavit kauzu v meme", "−1 akce, −4 tlak, +5 podpora, −2 důvěra a −2 integrita.")}
        ${optionButton("sacrifice", "🚌 Hodit spojence pod autobus", sacrificeDetail)}
      </div>
      <button class="btn small v0142-close" data-close="mediaOverlay">Nechat telefony zvonit</button>`;

    bindChoices(dialog, resolveMedia);
    overlay.classList.remove("hidden");
  }

  function weakestCompanion() {
    const entries = Object.entries(state.party || {});
    if (!entries.length) return null;
    const [id, companion] = entries.sort((a,b) => (a[1].loyalty || 0) - (b[1].loyalty || 0))[0];
    return {id,name:companion.name || id,companion};
  }

  function resolveMedia(choice) {
    if (!mapReady() || usedToday(MEDIA_FLAG) || state.actions < 1) return closeOverlay("mediaOverlay");
    state.flags = state.flags || {};
    state.flags[MEDIA_FLAG] = state.day;
    state.actions -= 1;

    if (choice === "transparent") {
      effect({heat:-8,trust:4,integrity:3,support:-1,press:3});
      addNews("Kandidát odpovídal bez teleprompteru. Některé odpovědi dokonce souvisely s otázkami.","normal");
      log("Mediální krize: otevřená tiskovka snížila tlak a posílila důvěru.");
    } else if (choice === "meme") {
      effect({heat:-4,support:5,trust:-2,integrity:-2});
      addNews("Kauza dostala chytlavou grafiku. Veřejnost se směje, jen není jasné komu.","normal");
      log("Mediální krize: kampaň změnila kauzu v meme.");
    } else {
      const weakest = weakestCompanion();
      if (weakest) {
        weakest.companion.loyalty = clamp((weakest.companion.loyalty || 0) - 12,0,100);
        effect({heat:-9,support:2,integrity:-8});
        addNews(`${weakest.name} byl označen za člověka, který jednal bez vědomí kandidáta. Překvapilo to hlavně jeho.`,"bad");
        log(`Mediální krize: ${weakest.name} byl obětován pro záchranu kampaně.`);
      } else {
        effect({heat:-6,support:1,integrity:-8});
        addNews("Kandidát obvinil neexistujícího poradce. Média nyní hledají člověka, kterého si právě vymyslel.","bad");
        log("Mediální krize: kampaň obětovala neexistujícího poradce.");
      }
    }

    finishAction("mediaOverlay");
  }

  function ensureVoters() {
    state.voters = state.voters || {};
    for (const [id, def] of Object.entries(voterDefs || {})) {
      state.voters[id] = state.voters[id] || {support:def.base,turnout:def.turnout};
    }
  }

  function estimatePoll() {
    ensureVoters();
    let weighted = 0;
    let ballots = 0;
    const rows = [];
    for (const [id, def] of Object.entries(voterDefs || {})) {
      const voter = state.voters[id];
      const turnout = Math.max(.18, Math.min(.95, voter.turnout || def.turnout));
      const base = clamp((voter.support || def.base) + (state.stats.support - 50) * .08 + (state.stats.trust - 50) * .04 - state.stats.heat * .025, 4, 88);
      const population = def.population * turnout;
      weighted += population * base;
      ballots += population;
      rows.push({id,name:def.name,icon:def.icon,value:Math.round(base)});
    }
    return {estimate:Math.round(weighted / Math.max(1, ballots)),rows};
  }

  function openPoll() {
    const checkpoint = pollCheckpoint();
    if (!checkpoint) return alert("Další průzkum zatím není připraven.");
    if (!mapReady()) return alert("Průzkum lze objednat pouze na mapě.");
    if (state.actions < 1) return alert("Na průzkum už dnes nezbývá akce.");
    if (state.stats.funds < 2) return alert("Průzkum stojí 2 peníze.");

    const result = estimatePoll();
    const overlay = document.getElementById("pollOverlay");
    const dialog = overlay.querySelector(".dialog");
    const rows = result.rows.map(row => `
      <div class="v0142-poll-row">
        <span>${row.icon} ${row.name}</span>
        <span class="v0142-poll-bar"><i style="width:${row.value}%"></i></span>
        <strong>${row.value}%</strong>
      </div>`).join("");

    dialog.innerHTML = `
      <p class="eyebrow">PRŮZKUM BEZ HOSPODSKÉHO VZORKU</p>
      <h2>Model podpory · kontrolní den ${checkpoint}</h2>
      <div class="v0142-estimate">Odhad: <strong>${result.estimate} %</strong></div>
      <p>Číslo je model, ne výsledek. Přesto už ho všichni ve štábu používají jako důkaz své pravdy.</p>
      ${rows}
      <div class="v0142-options">
        ${optionButton("families", "🎒 Přesměrovat kampaň na rodiny", "+7 rodiče, +4 nerozhodnutí, +2 důvěra, ale −3 podnikatelé.")}
        ${optionButton("rural", "🚜 Vsadit na venkov a pořádek", "+7 lidé kolem JZD, +5 senioři, +2 vliv, ale −3 tisk.")}
        ${optionButton("protest", "🔥 Rozjet protestní vlnu", "+8 naštvaní nevoliči, +5 nerozhodnutí, +4 podpora, ale +5 tlak a −4 důvěra.")}
      </div>
      <button class="btn small v0142-close" data-close="pollOverlay">Neobjednávat změnu cílení</button>`;

    bindChoices(dialog, choice => resolvePoll(choice, checkpoint));
    overlay.classList.remove("hidden");
  }

  function shiftVoter(id, amount) {
    ensureVoters();
    const def = voterDefs[id];
    if (!def || !state.voters[id]) return;
    state.voters[id].support = clamp((state.voters[id].support ?? def.base) + amount, 0, 100);
  }

  function resolvePoll(choice, checkpoint) {
    if (!mapReady() || state.actions < 1 || state.stats.funds < 2 || !pollCheckpoint()) return closeOverlay("pollOverlay");
    state.flags = state.flags || {};
    state.flags[`${POLL_PREFIX}${checkpoint}`] = true;
    state.actions -= 1;
    effect({funds:-2});

    if (choice === "families") {
      shiftVoter("parents",7);
      shiftVoter("undecided",4);
      shiftVoter("entrepreneurs",-3);
      effect({trust:2});
      addNews("Kampaň přesunula rozpočet k rodinám, škole a lidem, kteří znají všechny termíny prázdnin.","normal");
      log("Průzkum: kampaň změnila cílení na rodiny a nerozhodnuté.");
    } else if (choice === "rural") {
      shiftVoter("jzdWorkers",7);
      shiftVoter("seniors",5);
      effect({influence:2,press:-3});
      addNews("Kandidát zahájil venkovskou ofenzivu. Každý traktor nyní vypadá jako mobilní billboard.","normal");
      log("Průzkum: kampaň vsadila na venkov, seniory a pořádek.");
    } else {
      shiftVoter("disengaged",8);
      shiftVoter("undecided",5);
      effect({support:4,heat:5,trust:-4});
      addNews("Protestní video probudilo i občany, kteří dosud volby považovali za cizí koníček.","bad");
      log("Průzkum: kampaň rozjela protestní mobilizaci nevoličů.");
    }

    finishAction("pollOverlay");
  }

  function bindChoices(dialog, handler) {
    dialog.querySelectorAll("[data-choice]").forEach(button =>
      button.addEventListener("click", () => handler(button.dataset.choice))
    );
    dialog.querySelector("[data-close]")?.addEventListener("click", () => closeOverlay(dialog.closest(".overlay").id));
  }

  function finishAction(overlayId) {
    closeOverlay(overlayId);
    if (typeof renderAll === "function") renderAll();
    if (typeof autoSave === "function") autoSave();
    updateButtons();
  }

  function updateVersionLabels() {
    document.title = `Koryto ${VERSION} – Živý politický svět`;
    const brand = document.querySelector(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = `Koryto ${VERSION}: krizový štáb, mediální reakce, volební průzkumy a operace soupeře.`;
  }

  addStyles();
  addTopbarButton("briefingBtn","Krizový štáb",openBriefing);
  addTopbarButton("mediaBtn","Mediální krize",openMedia);
  addTopbarButton("pollBtn","Volební průzkum",openPoll);
  addOverlay("briefingOverlay");
  addOverlay("mediaOverlay");
  addOverlay("pollOverlay");
  updateVersionLabels();
  updateButtons();
  setInterval(updateButtons,500);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeOverlay("briefingOverlay");
      closeOverlay("mediaOverlay");
      closeOverlay("pollOverlay");
    }
  });
})();
