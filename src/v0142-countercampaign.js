"use strict";
(() => {
  const VERSION = "0.14.2 TEST.8";
  const STATE_KEY = "v0142CounterCampaign";
  const VALID_STATUS = new Set(["warning", "execution", "blocked", "hit"]);
  const VALID_IDS = new Set(["competence", "leak", "seniors", "patrons", "poaching"]);

  const defs = {
    competence: {
      icon:"🎭",
      title:"Operace Amatér u kormidla",
      strategy:"transparentní a odborná kampaň",
      target:"townhall",
      warning:"Věčný sbírá každý nedokončený projekt a chystá příběh, že slušnost není totéž co schopnost řídit obec.",
      execution:"Starosta svolává kulatý stůl o kompetenci. Pozvaní odborníci pracují pro něj od roku 2007.",
      impact:"−5 podpora, −6 důvěra, +5 staré struktury a −6 nerozhodnutí.",
      effects:{support:-5,trust:-6,oldguard:5,heat:3},
      voter:"undecided",
      voterHit:-6,
      openLabel:"Předložit veřejný plán a rozpočet",
      dirtyLabel:"Najít Věčného vlastní nedokončenou zakázku"
    },
    leak: {
      icon:"🗂️",
      title:"Operace Protiúnik",
      strategy:"kompromaty a špinavé dohody",
      target:"paper",
      warning:"Věčný propojuje dary, schůzky a vaše vlastní složky. Materiál zatím koluje jen mezi lidmi, kteří tvrdí, že jej nečetli.",
      execution:"Redakce dostala balík dokumentů s označením DŮVĚRNÉ a telefonát, že jde výhradně o veřejný zájem.",
      impact:"−4 podpora, −5 důvěra, +10 mediální tlak a −5 nerozhodnutí.",
      effects:{support:-4,trust:-5,heat:10,press:5},
      voter:"undecided",
      voterHit:-5,
      openLabel:"Zveřejnit vlastní audit dřív než složku",
      dirtyLabel:"Podstrčit do balíku kompromitující přílohu na Věčného"
    },
    seniors: {
      icon:"🚌",
      title:"Operace Autobus stability",
      strategy:"protestní mobilizace a křik",
      target:"pub",
      warning:"Věčný objednal autobusy, chlebíčky a vzpomínkový večer na dobu, kdy byla politika pomalejší a kandidáti méně online.",
      execution:"Seniorské kluby dostávají přesný čas odjezdu, volební doporučení a informaci, že obec je v ohrožení.",
      impact:"−3 podpora, −9 senioři, +7 staré struktury a +4 soupeřovo momentum.",
      effects:{support:-3,oldguard:7,heat:2},
      voter:"seniors",
      voterHit:-9,
      openLabel:"Přijít na setkání a odpovídat bez ochranky",
      dirtyLabel:"Zpochybnit financování autobusů anonymním letákem"
    },
    patrons: {
      icon:"💼",
      title:"Operace Kdo vás platí",
      strategy:"patroni, sponzoři a veřejná podpora",
      target:"meadow",
      warning:"Věčný kreslí síť mezi vašimi podporovateli, budoucími zakázkami a lidmi, kteří se náhodou objevují na všech fotografiích.",
      execution:"Na louce stojí tisková stěna s logy vašich patronů. Věčný se ptá, kolik metrů čtverečních stojí jeden hlas.",
      impact:"−6 důvěra, −5 integrita, +8 tlak a −5 podnikatelé.",
      effects:{trust:-6,integrity:-5,heat:8,citizens:-3},
      voter:"entrepreneurs",
      voterHit:-5,
      openLabel:"Zveřejnit dary a závazky včetně nepříjemných příloh",
      dirtyLabel:"Přesměrovat pozornost na Věčného staré sponzory"
    },
    poaching: {
      icon:"🎯",
      title:"Operace Přetáhnout nejsilnější blok",
      strategy:"příliš silná podpora kandidáta",
      target:"hq",
      warning:"Věčný přestal přesvědčovat všechny. Zaměřil se na skupinu, která vás momentálně drží nejvýš.",
      execution:"Soupeřův tým kopíruje vaše téma, slogan i občerstvení a nabízí cílové skupině konkrétní výhodu.",
      impact:"−3 celková podpora a −10 v nejsilnějším voličském bloku.",
      effects:{support:-3,heat:3,influence:-2},
      voter:null,
      voterHit:-10,
      openLabel:"Osobně obnovit vztah s cílovou skupinou",
      dirtyLabel:"Rozbít Věčného nabídku ještě před podpisem"
    }
  };

  const voterLocations = {
    parents:"school", jzdWorkers:"jzd", seniors:"pub", entrepreneurs:"meadow",
    club:"pitch", officials:"townhall", undecided:"hq", disengaged:"pub"
  };

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const bound = (value, min, max, fallback = min) => Math.max(min, Math.min(max, finite(value, fallback)));

  function defaultCampaignState() {
    return {version:VERSION, active:null, history:[], lastStartDay:0, lastResult:null};
  }

  function campaignState(target = state) {
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    const current = target.flags[STATE_KEY];
    if (!current || typeof current !== "object") target.flags[STATE_KEY] = defaultCampaignState();
    return target.flags[STATE_KEY];
  }

  function normalizeActive(active, target) {
    if (!active || typeof active !== "object" || !VALID_IDS.has(active.id)) return null;
    const def = defs[active.id];
    const started = bound(active.started, 1, 13, target.day || 1);
    const due = bound(active.due, started, 13, Math.min(13, started + 1));
    const status = VALID_STATUS.has(active.status) ? active.status : "warning";
    let voter = active.voter && typeof active.voter === "string" ? active.voter : def.voter;
    if (voter && typeof voterDefs === "object" && !voterDefs[voter]) voter = def.voter;
    const location = active.target && locations?.[active.target] ? active.target : (voterLocations[voter] || def.target);
    return {...active,id:active.id,status,started,due,target:location,voter:voter || null};
  }

  function normalizeCampaignState(target = state) {
    const box = campaignState(target);
    box.version = VERSION;
    box.lastStartDay = bound(box.lastStartDay, 0, 13, 0);
    box.history = Array.isArray(box.history) ? box.history.filter(item => item && VALID_IDS.has(item.id)).slice(0,8) : [];
    box.active = normalizeActive(box.active, target);
    if (box.lastResult && (!box.lastResult.id || !VALID_IDS.has(box.lastResult.id))) box.lastResult = null;
    return box;
  }

  function ensureVoters(target) {
    target.voters = target.voters && typeof target.voters === "object" ? target.voters : {};
    if (typeof voterDefs !== "object") return;
    for (const [id, def] of Object.entries(voterDefs)) {
      const current = target.voters[id] && typeof target.voters[id] === "object" ? target.voters[id] : {};
      target.voters[id] = {
        ...current,
        support:bound(current.support,0,100,def.base),
        turnout:bound(current.turnout,0,1,def.turnout)
      };
    }
  }

  function shiftVoter(target, id, amount) {
    ensureVoters(target);
    const def = typeof voterDefs === "object" ? voterDefs[id] : null;
    if (!def || !target.voters[id]) return;
    target.voters[id].support = bound((target.voters[id].support ?? def.base) + amount, 0, 100, def.base);
  }

  function strongestVoter(target) {
    ensureVoters(target);
    const entries = Object.entries(voterDefs || {}).map(([id, def]) => ({
      id,
      score:(target.voters[id]?.support ?? def.base) - def.base,
      support:target.voters[id]?.support ?? def.base
    }));
    entries.sort((a,b) => b.score - a.score || b.support - a.support || a.id.localeCompare(b.id));
    return entries[0]?.id || "undecided";
  }

  function endorsementCount(target) {
    const flags = target.flags || {};
    return [5,9,12].filter(day => ["workers","business","influencer"].includes(flags[`v0142Endorsement${day}`])).length;
  }

  function strategyScores(target = state) {
    ensureVoters(target);
    const stats = target.stats || {};
    const adaptation = target.rivalAI?.adaptation || "";
    const integrity = finite(stats.integrity,55);
    const trust = finite(stats.trust,50);
    const support = finite(stats.support,14);
    const heat = finite(stats.heat,0);
    const leverage = finite(stats.leverage,0);
    const disengaged = finite(target.voters.disengaged?.support, voterDefs?.disengaged?.base || 27);
    const disengagedBase = voterDefs?.disengaged?.base || 27;
    const endorsements = endorsementCount(target);
    const scores = {
      competence:Math.max(0,trust-55)*.28 + Math.max(0,integrity-58)*.32 + (["legal","ethical"].includes(adaptation)?7:0),
      leak:Math.max(0,52-integrity)*.38 + heat*.16 + leverage*.13 + (["corrupt","power"].includes(adaptation)?7:0),
      seniors:Math.max(0,disengaged-disengagedBase)*.7 + Math.max(0,support-trust)*.18 + (adaptation==="public"?6:0),
      patrons:endorsements*5 + Math.max(0,finite(target.factions?.business,0))*0.12 + (target.flags?.v0142Endorsement5==="business"||target.flags?.v0142Endorsement9==="business"||target.flags?.v0142Endorsement12==="business"?7:0),
      poaching:Math.max(0,support-48)*.45 + Math.max(0,strongestVoterScore(target))*0.35
    };
    const box = campaignState(target);
    for (const item of box.history || []) if (scores[item.id] !== undefined) scores[item.id] -= 8;
    return scores;
  }

  function strongestVoterScore(target) {
    const id = strongestVoter(target);
    const def = voterDefs?.[id];
    return def ? finite(target.voters?.[id]?.support,def.base)-def.base : 0;
  }

  function selectStrategy(target = state) {
    const scores = strategyScores(target);
    return Object.entries(scores).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "competence";
  }

  function notify(target, text, type = "bad") {
    if (target !== state) return;
    if (typeof addNews === "function") addNews(text,type);
    if (typeof log === "function") log(text);
  }

  function startCampaign(target = state, forcedId = null, silent = false) {
    const box = normalizeCampaignState(target);
    if (box.active || box.history.length >= 3) return box.active;
    const id = VALID_IDS.has(forcedId) ? forcedId : selectStrategy(target);
    const def = defs[id];
    const voter = id === "poaching" ? strongestVoter(target) : def.voter;
    const location = id === "poaching" ? (voterLocations[voter] || def.target) : def.target;
    box.active = {
      id,
      status:"warning",
      started:bound(target.day,1,13,1),
      due:Math.min(13,bound(target.day,1,13,1)+1),
      target:location,
      voter:voter || null,
      response:null
    };
    box.lastStartDay = box.active.started;
    if (!silent) notify(target,`${def.icon} Věčný spustil „${def.title}“. První stopa vede na místo: ${locations?.[location]?.name || location}.`);
    return box.active;
  }

  function applyEffects(target, effects) {
    target.stats = target.stats && typeof target.stats === "object" ? target.stats : {};
    target.factions = target.factions && typeof target.factions === "object" ? target.factions : {};
    for (const [key, amount] of Object.entries(effects || {})) {
      if (Object.prototype.hasOwnProperty.call(target.stats,key)) {
        const min = key === "funds" ? -999 : 0;
        const max = key === "leverage" ? 999 : 100;
        target.stats[key] = bound(finite(target.stats[key],0)+amount,min,max,0);
      } else if (Object.prototype.hasOwnProperty.call(target.factions,key)) {
        target.factions[key] = bound(finite(target.factions[key],0)+amount,-100,100,0);
      }
    }
  }

  function archiveActive(target, status, response = null) {
    const box = normalizeCampaignState(target);
    const active = box.active;
    if (!active) return null;
    const record = {...active,status,response,completed:bound(target.day,1,14,1)};
    box.history.unshift(record);
    box.history = box.history.slice(0,8);
    box.lastResult = record;
    box.active = null;
    return record;
  }

  function resolveActive(choice, target = state, silent = false) {
    const box = normalizeCampaignState(target);
    const active = box.active;
    if (!active || !["warning","execution"].includes(active.status)) return false;
    target.actions = bound(target.actions,0,99,0);
    if (target.actions < 1) return false;
    if (choice === "open" && finite(target.stats?.funds,0) < 2) return false;
    target.actions -= 1;
    const def = defs[active.id];
    if (choice === "open") {
      applyEffects(target,{funds:-2,trust:3,heat:-2});
      if (active.voter) shiftVoter(target,active.voter,2);
    } else {
      applyEffects(target,{integrity:-5,heat:4,leverage:3,oldguard:-4});
      if (active.voter) shiftVoter(target,active.voter,1);
      choice = "dirty";
    }
    const record = archiveActive(target,"blocked",choice);
    if (!silent) notify(target,`${def.icon} Operace „${def.title}“ byla zastavena ${choice==="open"?"otevřenou obranou":"protiútokem ze stejného bahna"}.`,`normal`);
    if (target === state) {
      if (typeof renderAll === "function") renderAll();
      if (typeof autoSave === "function") autoSave();
    }
    return record;
  }

  function applyImpact(target = state, silent = false) {
    const box = normalizeCampaignState(target);
    const active = box.active;
    if (!active) return false;
    const def = defs[active.id];
    applyEffects(target,def.effects);
    if (active.voter) shiftVoter(target,active.voter,def.voterHit);
    if (active.id === "seniors") {
      target.opponent = target.opponent && typeof target.opponent === "object" ? target.opponent : {momentum:0};
      target.opponent.momentum = bound(finite(target.opponent.momentum,0)+4,0,100,0);
    }
    const record = archiveActive(target,"hit",null);
    if (!silent) notify(target,`${def.icon} Věčného „${def.title}“ dopadla naplno. ${def.impact}`);
    if (target === state) {
      if (typeof renderAll === "function") renderAll();
      if (typeof autoSave === "function") autoSave();
    }
    return record;
  }

  function advanceCampaign(target = state, silent = false) {
    const box = normalizeCampaignState(target);
    const day = bound(target.day,1,14,1);
    if (box.active?.status === "warning" && day >= box.active.due) {
      box.active.status = "execution";
      if (!box.active.executionNotified) {
        box.active.executionNotified = true;
        if (!silent) notify(target,`${defs[box.active.id].icon} Druhá fáze operace: ${defs[box.active.id].execution}`);
      }
    }
    if (box.active?.status === "execution" && day > box.active.due) applyImpact(target,silent);
    if (!box.active && box.history.length < 3 && day >= 4 && day <= 11 && day - box.lastStartDay >= 3) startCampaign(target,null,silent);
    return box;
  }

  function activeGame() {
    return typeof state !== "undefined" && document.getElementById?.("gameScreen")?.classList.contains("active") && !state.ended;
  }

  function locationLabel(id) {
    return locations?.[id]?.name || id || "neznámé místo";
  }

  function removeExisting(root, selector) {
    root?.querySelector?.(selector)?.remove?.();
  }

  function renderPanel() {
    if (!activeGame()) return;
    const panel = document.getElementById?.("rivalOperationPanel");
    if (!panel) return;
    removeExisting(panel,".v0142-counter-card");
    const box = normalizeCampaignState();
    const active = box.active;
    const recent = box.lastResult;
    if (!active && (!recent || state.day - recent.completed > 1)) return;
    const card = document.createElement("div");
    card.className = "journal-item v0142-counter-card";
    if (active) {
      const def = defs[active.id];
      const phase = active.status === "warning" ? "VAROVÁNÍ" : "DRUHÁ FÁZE";
      card.innerHTML = `<strong>${def.icon} ${def.title}</strong><small>${phase} · cíl: ${locationLabel(active.target)} · dopad po dni ${active.due}</small><p>${active.status==="warning"?def.warning:def.execution}</p><small><b>Hrozba:</b> ${def.impact}</small>`;
    } else {
      const def = defs[recent.id];
      card.innerHTML = `<strong>${def.icon} ${def.title}</strong><small>${recent.status==="blocked"?"ZASTAVENA":"DOPADLA"} · den ${recent.completed}</small><p>${recent.status==="blocked"?"Štáb operaci zachytil včas.":def.impact}</p>`;
    }
    panel.appendChild(card);
  }

  function renderLocationAction() {
    const view = document.getElementById?.("locationView");
    if (!view) return;
    removeExisting(view,".v0142-counter-response");
    if (!activeGame()) return;
    const active = normalizeCampaignState().active;
    if (!active || !["warning","execution"].includes(active.status) || state.currentLocation !== active.target) return;
    const def = defs[active.id];
    const box = document.createElement("div");
    box.className = "panel v0142-counter-response";
    box.innerHTML = `<p class="eyebrow">VĚČNÉHO PROTIKAMPAŇ</p><h3>${def.icon} Zastavit: ${def.title}</h3><p>${active.status==="warning"?def.warning:def.execution}</p><div class="v0142-counter-options"><button class="btn" data-counter="open" ${finite(state.stats?.funds,0)<2?"disabled":""}><strong>📂 ${def.openLabel}</strong><small>−1 akce, −2 peníze, +3 důvěra, −2 tlak.</small></button><button class="btn" data-counter="dirty"><strong>🕶️ ${def.dirtyLabel}</strong><small>−1 akce, −5 integrita, +4 tlak, +3 páky.</small></button></div>`;
    box.querySelectorAll?.("[data-counter]").forEach(button => button.addEventListener("click",()=>resolveActive(button.dataset.counter)));
    view.prepend?.(box);
  }

  function addStyles() {
    const style = document.createElement?.("style");
    if (!style) return;
    style.textContent = `.v0142-counter-card{border-color:#d97706!important}.v0142-counter-card p{margin:.45rem 0;line-height:1.4}.v0142-counter-response{border:3px solid #d97706;margin-bottom:14px}.v0142-counter-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.v0142-counter-options .btn{text-align:left}.v0142-counter-options strong,.v0142-counter-options small{display:block}.v0142-counter-options small{margin-top:6px;opacity:.78}`;
    document.head?.appendChild?.(style);
  }

  function updateVersion() {
    document.title = `Koryto ${VERSION} – Věčného protikampaň`;
    const brand = document.querySelector?.(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const description = document.querySelector?.('meta[name="description"]');
    if (description) description.content = `Koryto ${VERSION}: Věčný čte strategii hráče a spouští dvoufázové protikampaně s místem zásahu.`;
  }

  function tick() {
    if (typeof state === "undefined") return;
    normalizeCampaignState();
    if (activeGame()) advanceCampaign();
    updateVersion();
    renderPanel();
    renderLocationAction();
  }

  globalThis.KorytoCounterCampaign = {
    VERSION, defs, normalizeCampaignState, strategyScores, selectStrategy,
    startCampaign, advanceCampaign, resolveActive, applyImpact, strongestVoter
  };

  addStyles();
  updateVersion();
  tick();
  if (typeof setInterval === "function") setInterval(tick,500);
})();
