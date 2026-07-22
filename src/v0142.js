"use strict";
(() => {
  const VERSION = "0.14.2 TEST.3";
  const BRIEFING_FLAG = "v0142BriefingDay";
  const MEDIA_FLAG = "v0142MediaDay";

  const gameScreenActive = () =>
    typeof state !== "undefined" &&
    document.getElementById("gameScreen")?.classList.contains("active") &&
    !state.ended;

  const mapReady = () => gameScreenActive() && state.phase === "map";
  const usedToday = flag => state?.flags?.[flag] === state.day;

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #briefingBtn.used,#mediaBtn.used{opacity:.58}
      #briefingOverlay .dialog,#mediaOverlay .dialog{max-width:760px;text-align:left}
      .v0142-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}
      .v0142-stat{border:2px solid var(--line,#2b2b2b);padding:10px;background:rgba(255,255,255,.04)}
      .v0142-stat small{display:block;opacity:.75;margin-bottom:4px}
      .v0142-stat strong{font-size:1.05rem}
      .v0142-options{display:grid;gap:10px;margin-top:14px}
      .v0142-option{text-align:left;width:100%}
      .v0142-option strong,.v0142-option small{display:block}
      .v0142-option small{margin-top:5px;opacity:.8;line-height:1.35}
      .v0142-close{margin-top:14px}
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
      briefing.title = used ? "Další porada bude dostupná zítra." : "Jedna taktická porada za den; spotřebuje jednu akci.";
    }

    const media = document.getElementById("mediaBtn");
    if (media) {
      const visible = gameScreenActive() && state.stats?.heat >= 15;
      const used = visible && usedToday(MEDIA_FLAG);
      media.classList.toggle("hidden", !visible);
      media.classList.toggle("used", used);
      media.disabled = !mapReady() || state.actions < 1 || used;
      media.textContent = used ? "Média dnes řešena" : "Mediální krize";
      media.title = used ? "Další reakce bude dostupná zítra." : "Reagujte na mediální tlak dřív, než tiskovka začne bez vás.";
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

    dialog.querySelectorAll("[data-choice]").forEach(button =>
      button.addEventListener("click", () => resolveBriefing(button.dataset.choice))
    );
    dialog.querySelector("[data-close]").addEventListener("click", () => closeOverlay("briefingOverlay"));
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

    dialog.querySelectorAll("[data-choice]").forEach(button =>
      button.addEventListener("click", () => resolveMedia(button.dataset.choice))
    );
    dialog.querySelector("[data-close]").addEventListener("click", () => closeOverlay("mediaOverlay"));
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
    if (description) description.content = `Koryto ${VERSION}: krizový štáb, mediální reakce, živé frakce a operace soupeře.`;
  }

  addStyles();
  addTopbarButton("briefingBtn","Krizový štáb",openBriefing);
  addTopbarButton("mediaBtn","Mediální krize",openMedia);
  addOverlay("briefingOverlay");
  addOverlay("mediaOverlay");
  updateVersionLabels();
  updateButtons();
  setInterval(updateButtons,500);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeOverlay("briefingOverlay");
      closeOverlay("mediaOverlay");
    }
  });
})();
