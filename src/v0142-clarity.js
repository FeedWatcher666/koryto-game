"use strict";
(() => {
  const VERSION = "0.14.2 TEST.10";
  const FLAG_PREFIX = "v0142Clarity";
  const STAT_LABELS = {
    support:"Podpora", trust:"Důvěra", funds:"Peníze", heat:"Mediální tlak",
    influence:"Vliv", integrity:"Integrita", leverage:"Kompromat"
  };
  const FACTION_LABELS = {
    citizens:"Občané", jzd:"JZD", business:"Podnikatelé", press:"Média",
    oldguard:"Staré struktury", officials:"Úředníci"
  };
  let runtime = {seed:null, day:null, snapshot:null, endingSeed:null};

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const bound = (value, min, max, fallback = min) => Math.max(min, Math.min(max, finite(value, fallback)));
  const escapeHtml = value => String(value ?? "").replace(/[&<>\"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"})[char]);

  function normalizeClarityState(target = state) {
    if (!target || typeof target !== "object") return target;
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    target.flags[`${FLAG_PREFIX}OnboardingDone`] = Boolean(target.flags[`${FLAG_PREFIX}OnboardingDone`]);
    if (target.flags[`${FLAG_PREFIX}LastSummaryDay`] !== undefined) {
      target.flags[`${FLAG_PREFIX}LastSummaryDay`] = bound(target.flags[`${FLAG_PREFIX}LastSummaryDay`],0,13,0);
    }
    target.flags[`${FLAG_PREFIX}Summaries`] = Array.isArray(target.flags[`${FLAG_PREFIX}Summaries`])
      ? target.flags[`${FLAG_PREFIX}Summaries`].filter(item => item && typeof item === "object").slice(0,6)
      : [];
    return target;
  }

  function snapshotState(target = state) {
    const stats = {};
    for (const [key,value] of Object.entries(target?.stats || {})) stats[key] = finite(value,0);
    const factions = {};
    for (const [key,value] of Object.entries(target?.factions || {})) factions[key] = finite(value,0);
    const voters = {};
    for (const [key,value] of Object.entries(target?.voters || {})) voters[key] = finite(value?.support,0);
    const newsKeys = (target?.news || []).map(item => `${item.day}|${item.type}|${item.text}`);
    return {
      seed:String(target?.seed || ""),
      day:bound(target?.day,1,14,1),
      stats,
      factions,
      voters,
      newsKeys,
      news:(target?.news || []).map(item => ({day:item.day,type:item.type,text:String(item.text || "")})),
      logLength:Array.isArray(target?.log) ? target.log.length : 0
    };
  }

  function changeRows(before, after) {
    const rows = [];
    const collect = (group, labels, weight = 1) => {
      for (const [key, end] of Object.entries(after[group] || {})) {
        const start = finite(before[group]?.[key],end);
        const delta = Math.round((end-start)*10)/10;
        if (!delta) continue;
        rows.push({group,key,label:labels[key] || key,delta,score:Math.abs(delta)*weight});
      }
    };
    collect("stats",STAT_LABELS,1.3);
    collect("factions",FACTION_LABELS,0.8);
    if (typeof voterDefs === "object") {
      const labels = Object.fromEntries(Object.entries(voterDefs).map(([id,def]) => [id,`${def.icon || ""} ${def.name}`.trim()]));
      collect("voters",labels,1);
    }
    rows.sort((a,b) => b.score-a.score || b.delta-a.delta);
    return rows;
  }

  function summarizeDay(before, after) {
    const rows = changeRows(before,after);
    const positive = rows.filter(item => item.delta > 0).slice(0,3);
    const negative = rows.filter(item => item.delta < 0).slice(0,3);
    const previousNews = new Set(before.newsKeys || []);
    const news = (after.news || []).filter(item => !previousNews.has(`${item.day}|${item.type}|${item.text}`)).slice(0,4);
    return {
      day:before.day,
      positive,
      negative,
      news,
      score:positive.reduce((sum,item)=>sum+item.delta,0)+negative.reduce((sum,item)=>sum+item.delta,0)
    };
  }

  function activeQuestPriorities(target) {
    if (typeof questDefs !== "object") return [];
    return Object.entries(target?.quests || {})
      .filter(([,quest]) => quest?.status === "active")
      .map(([id]) => {
        const def = questDefs[id];
        const deadline = typeof questDeadline === "function" ? questDeadline(id) : finite(def?.deadline,13);
        const left = deadline - finite(target.day,1);
        return {kind:"quest",title:def?.title || id,location:def?.location || null,left,weight:left<=0?100:left===1?90:left===2?75:45-left};
      });
  }

  function buildPriorities(target = state) {
    const items = activeQuestPriorities(target);
    const promise = target?.flags?.v0142Promise;
    if (promise?.status === "active") {
      const left = finite(promise.due,13)-finite(target.day,1);
      const promiseLocation = promise.id === "school" ? "school" : promise.id === "meadow" ? "meadow" : "townhall";
      items.push({kind:"promise",title:promise.title || "Velký volební slib",location:promiseLocation,left,weight:left<=0?110:left===1?95:55-left});
    }
    for (const commitment of target?.commitments || []) {
      if (commitment?.status !== "active") continue;
      const left = finite(commitment.due,13)-finite(target.day,1);
      items.push({kind:"commitment",title:commitment.title || "Politický závazek",location:null,left,weight:left<=0?105:left===1?88:40-left});
    }
    const counter = target?.flags?.v0142CounterCampaign?.active;
    if (counter && ["warning","execution"].includes(counter.status)) {
      const left = finite(counter.due,13)-finite(target.day,1);
      const title = globalThis.KorytoCounterCampaign?.defs?.[counter.id]?.title || "Věčného protikampaň";
      items.push({kind:"counter",title,location:counter.target || null,left,weight:counter.status === "execution" ? 108 : 92});
    }
    items.sort((a,b) => b.weight-a.weight || a.left-b.left || a.title.localeCompare(b.title,"cs"));
    return items;
  }

  function priorityLabel(item) {
    if (!item) return "Žádná akutní hrozba. To je samo o sobě podezřelé.";
    const timing = item.left < 0 ? "po termínu" : item.left === 0 ? "dnes" : item.left === 1 ? "zítra" : `za ${item.left} dny`;
    return `${item.title} · ${timing}`;
  }

  function endingDrivers(target = state) {
    const positives = [];
    const negatives = [];
    const add = (list,score,title,text) => list.push({score,title,text});
    const stats = target?.stats || {};
    const promises = target?.promiseSummary || {};
    const counterHistory = target?.flags?.v0142CounterCampaign?.history || [];
    const blocked = counterHistory.filter(item => item.status === "blocked").length;
    const hit = counterHistory.filter(item => item.status === "hit").length;

    if (finite(stats.trust,0) >= 62) add(positives,finite(stats.trust),"Vysoká důvěra",`Do voleb jste šel s důvěrou ${Math.round(finite(stats.trust))}.`);
    if (finite(stats.integrity,0) >= 62) add(positives,finite(stats.integrity),"Čitelná integrita",`Voliči viděli konzistentní styl kampaně (${Math.round(finite(stats.integrity))}).`);
    if (finite(stats.support,0) >= 50) add(positives,finite(stats.support),"Silná závěrečná podpora",`Před volbami jste držel podporu ${Math.round(finite(stats.support))}.`);
    if (finite(promises.fulfilled,0) > finite(promises.broken,0)) add(positives,40+finite(promises.fulfilled),"Splněné sliby",`${finite(promises.fulfilled)} splněných proti ${finite(promises.broken)} porušeným.`);
    if (blocked) add(positives,35+blocked*4,"Zastavené protioperace",`${blocked} Věčného operace jste zachytil dřív, než dopadla.`);

    if (finite(stats.heat,0) >= 48) add(negatives,finite(stats.heat),"Mediální přetížení",`Kampaň končila s tlakem ${Math.round(finite(stats.heat))}.`);
    if (finite(promises.broken,0) > 0) add(negatives,45+finite(promises.broken)*5,"Porušené závazky",`${finite(promises.broken)} slibů nebo politických dluhů zůstalo nesplněných.`);
    if (finite(target?.opponent?.momentum,0) >= 50) add(negatives,finite(target.opponent.momentum),"Věčný dostal prostor",`Soupeřovo momentum dosáhlo ${Math.round(finite(target.opponent.momentum))}.`);
    if (finite(target?.debt,0) >= 6) add(negatives,40+finite(target.debt),"Kampaň na dluh",`Politický a finanční dluh skončil na hodnotě ${Math.round(finite(target.debt))}.`);
    if (hit) add(negatives,38+hit*6,"Dopadlé protioperace",`${hit} Věčného operace zasáhly kampaň naplno.`);

    const breakdown = Array.isArray(target?.electionBreakdown) ? target.electionBreakdown : [];
    if (breakdown.length) {
      const sorted = [...breakdown].sort((a,b) => finite(b.share)-finite(a.share));
      const best = sorted[0], worst = sorted[sorted.length-1];
      if (best) add(positives,finite(best.share),`Nejsilnější blok: ${best.name}`,`${best.share} % hlasů v této skupině.`);
      if (worst && finite(worst.share) < 35) add(negatives,100-finite(worst.share),`Slabina: ${worst.name}`,`Pouze ${worst.share} % hlasů v této skupině.`);
    }

    positives.sort((a,b)=>b.score-a.score);
    negatives.sort((a,b)=>b.score-a.score);
    return {positive:positives.slice(0,3),negative:negatives.slice(0,3)};
  }

  function ensureUi() {
    if (!document.body || document.getElementById?.("v0142DaySummaryOverlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "v0142DaySummaryOverlay";
    overlay.className = "overlay hidden";
    overlay.innerHTML = '<div class="dialog v0142-summary-dialog" role="dialog" aria-modal="true"></div>';
    overlay.addEventListener?.("click",event => { if (event.target === overlay) overlay.classList.add("hidden"); });
    document.body.appendChild?.(overlay);
  }

  function formatChange(item) {
    const sign = item.delta > 0 ? "+" : "";
    return `<li><strong>${escapeHtml(item.label)}</strong> ${sign}${item.delta}</li>`;
  }

  function showDaySummary(summary) {
    ensureUi();
    const overlay = document.getElementById?.("v0142DaySummaryOverlay");
    const dialog = overlay?.querySelector?.(".dialog");
    if (!overlay || !dialog) return;
    const next = buildPriorities(state)[0];
    dialog.innerHTML = `
      <p class="eyebrow">DEN ${summary.day} UZAVŘEN</p>
      <h2>Co se změnilo a proč</h2>
      <div class="v0142-summary-grid">
        <section><h3>Posílilo</h3><ul>${summary.positive.length?summary.positive.map(formatChange).join(""):"<li>Nic zásadního.</li>"}</ul></section>
        <section><h3>Oslabilo</h3><ul>${summary.negative.length?summary.negative.map(formatChange).join(""):"<li>Žádný výrazný propad.</li>"}</ul></section>
      </div>
      <h3>Události dne</h3>
      <ul>${summary.news.length?summary.news.map(item=>`<li>${escapeHtml(item.text)}</li>`).join(""):"<li>Vesnice tentokrát nevytvořila nový skandál.</li>"}</ul>
      <div class="v0142-next-step"><strong>Nejbližší priorita:</strong> ${escapeHtml(priorityLabel(next))}</div>
      <button class="btn primary" data-summary-close>Pokračovat do dne ${state.day}</button>`;
    dialog.querySelector?.("[data-summary-close]")?.addEventListener?.("click",()=>overlay.classList.add("hidden"));
    overlay.classList.remove("hidden");
  }

  function renderOnboarding() {
    const mapView = document.getElementById?.("mapView");
    if (!mapView) return;
    mapView.querySelector?.("#v0142Onboarding")?.remove?.();
    if (state.day !== 1 || state.phase !== "map" || state.flags[`${FLAG_PREFIX}OnboardingDone`]) return;
    const panel = document.createElement("div");
    panel.id = "v0142Onboarding";
    panel.className = "panel v0142-onboarding";
    panel.innerHTML = `<p class="eyebrow">PRVNÍ DEN</p><h3>Tři věci, které rozhodují kampaň</h3><ol><li><strong>Vyřešte Kandidátní listinu</strong> na obecním úřadě.</li><li><strong>Každá návštěva stojí akci.</strong> Nevyužité akce posilují Věčného.</li><li><strong>Sledujte oranžové priority.</strong> Termíny a protioperace se nepozastaví.</li></ol><button class="btn small" data-onboarding-done>Rozumím, jdu do politiky</button>`;
    panel.querySelector?.("[data-onboarding-done]")?.addEventListener?.("click",()=>{
      state.flags[`${FLAG_PREFIX}OnboardingDone`] = true;
      panel.remove?.();
      if (typeof autoSave === "function") autoSave();
    });
    mapView.prepend?.(panel);
  }

  function renderPriorityBar() {
    const mapView = document.getElementById?.("mapView");
    if (!mapView) return;
    mapView.querySelector?.("#v0142PriorityBar")?.remove?.();
    if (state.phase !== "map") return;
    const priorities = buildPriorities(state);
    const item = priorities[0];
    const bar = document.createElement("div");
    bar.id = "v0142PriorityBar";
    bar.className = `v0142-priority-bar ${item?.left<=1 || item?.kind === "counter" ? "urgent" : ""}`;
    const location = item?.location && locations?.[item.location] ? locations[item.location] : null;
    bar.innerHTML = `<div><small>CO TEĎ</small><strong>${escapeHtml(priorityLabel(item))}</strong>${location?`<span>${escapeHtml(location.icon)} ${escapeHtml(location.name)}</span>`:""}</div>${location?`<button class="btn small" data-priority-location="${escapeHtml(item.location)}">Přejít na místo</button>`:""}`;
    bar.querySelector?.("[data-priority-location]")?.addEventListener?.("click",event=>{
      const id = event.currentTarget?.dataset?.priorityLocation;
      if (id && typeof showLocation === "function" && state.phase === "map") showLocation(id);
    });
    const onboarding = mapView.querySelector?.("#v0142Onboarding");
    if (onboarding?.after) onboarding.after(bar); else mapView.prepend?.(bar);
    document.querySelectorAll?.(".location.v0142-priority-location").forEach(node=>node.classList.remove("v0142-priority-location"));
    if (item?.location) document.querySelector?.(`.location[data-loc="${item.location}"]`)?.classList.add("v0142-priority-location");
  }

  function renderEndingExplanation() {
    const ending = document.getElementById?.("endingScreen");
    if (!ending?.classList.contains("active")) return;
    const story = document.getElementById?.("endingStory");
    if (!story || story.querySelector?.("#v0142ElectionWhy")) return;
    const drivers = endingDrivers(state);
    const panel = document.createElement("section");
    panel.id = "v0142ElectionWhy";
    panel.className = "v0142-election-why";
    const rows = (items,positive) => items.length ? items.map(item=>`<li class="${positive?"good":"bad"}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></li>`).join("") : `<li><span>Výsledek neurčil jeden dominantní faktor.</span></li>`;
    panel.innerHTML = `<h3>Proč to dopadlo právě takhle</h3><div class="v0142-driver-grid"><div><h4>Co pomohlo</h4><ul>${rows(drivers.positive,true)}</ul></div><div><h4>Co uškodilo</h4><ul>${rows(drivers.negative,false)}</ul></div></div>`;
    story.prepend?.(panel);
  }

  function activeGame() {
    return typeof state !== "undefined" && document.getElementById?.("gameScreen")?.classList.contains("active") && !state.ended;
  }

  function resetRuntime() {
    runtime = {seed:String(state?.seed || ""),day:finite(state?.day,1),snapshot:snapshotState(state),endingSeed:null};
  }

  function trackDayChange() {
    if (!activeGame()) return;
    normalizeClarityState();
    const seed = String(state.seed || "");
    const day = finite(state.day,1);
    if (runtime.seed !== seed || runtime.day === null) {
      resetRuntime();
      return;
    }
    if (day !== runtime.day) {
      const before = runtime.snapshot;
      const after = snapshotState(state);
      if (day === runtime.day + 1 && runtime.day <= 13 && state.flags[`${FLAG_PREFIX}LastSummaryDay`] !== runtime.day) {
        const summary = summarizeDay(before,after);
        state.flags[`${FLAG_PREFIX}LastSummaryDay`] = runtime.day;
        state.flags[`${FLAG_PREFIX}Summaries`].unshift(summary);
        state.flags[`${FLAG_PREFIX}Summaries`] = state.flags[`${FLAG_PREFIX}Summaries`].slice(0,6);
        showDaySummary(summary);
      }
      runtime.day = day;
      runtime.snapshot = after;
    } else {
      runtime.snapshot = snapshotState(state);
    }
  }

  function updateVersion() {
    document.title = `Koryto ${VERSION} – čitelná volební kampaň`;
    const brand = document.querySelector?.(".brand h1 span");
    if (brand) brand.textContent = `Dolní Vejprnice ${VERSION}`;
    const description = document.querySelector?.('meta[name="description"]');
    if (description) description.content = `Koryto ${VERSION}: průvodce prvním dnem, denní souhrny, jasné priority a vysvětlení volebního výsledku.`;
  }

  function addStyles() {
    const style = document.createElement?.("style");
    if (!style) return;
    style.textContent = `
      .v0142-onboarding{border:3px solid #2563eb;margin-bottom:12px}.v0142-onboarding ol{line-height:1.55;padding-left:1.35rem}
      .v0142-priority-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;border:2px solid var(--line);background:var(--paper);padding:12px 14px;margin-bottom:12px;box-shadow:3px 3px 0 var(--ink)}
      .v0142-priority-bar>div{display:grid;gap:2px}.v0142-priority-bar small{font-weight:900;letter-spacing:.08em}.v0142-priority-bar span{font-size:.85rem;color:var(--muted)}
      .v0142-priority-bar.urgent{border-color:#d97706;background:#fff7ed}.location.v0142-priority-location{outline:4px solid #d97706;outline-offset:2px}
      .v0142-summary-dialog{max-width:760px;text-align:left}.v0142-summary-grid,.v0142-driver-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}.v0142-summary-grid section{border:2px solid var(--line);padding:10px}.v0142-summary-dialog li{margin:.35rem 0}.v0142-next-step{border:2px solid #d97706;background:#fff7ed;padding:10px;margin:12px 0}
      .v0142-election-why{border:3px solid #d97706;background:#fffaf0;padding:14px;margin-bottom:16px}.v0142-driver-grid ul{padding:0;list-style:none}.v0142-driver-grid li{display:grid;gap:3px;border-left:5px solid var(--line);padding:8px;margin:7px 0}.v0142-driver-grid li.good{border-color:#15803d}.v0142-driver-grid li.bad{border-color:#b91c1c}.v0142-driver-grid span{font-size:.9rem;color:var(--muted)}
    `;
    document.head?.appendChild?.(style);
  }

  function tick() {
    if (typeof state === "undefined") return;
    normalizeClarityState();
    updateVersion();
    if (activeGame()) {
      trackDayChange();
      if (state.phase === "map") {
        renderOnboarding();
        renderPriorityBar();
      }
    } else {
      renderEndingExplanation();
    }
  }

  globalThis.KorytoTest10 = {
    VERSION, normalizeClarityState, snapshotState, summarizeDay,
    buildPriorities, endingDrivers, priorityLabel
  };

  ensureUi();
  addStyles();
  updateVersion();
  tick();
  if (typeof setInterval === "function") setInterval(tick,500);
})();
