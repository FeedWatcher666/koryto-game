"use strict";
(() => {
  const VERSION = "0.14.8 TEST.10";
  const BUILD_VERSION = "0.14.8-test.10";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = value => Math.max(0, Math.min(100, finite(value)));
  const stateOf = () => globalThis.KorytoApp?.getState?.() || (typeof state !== "undefined" ? state : null);
  const questDefsOf = () => globalThis.KorytoQuestData?.definitions || (typeof questDefs !== "undefined" ? questDefs : {});
  const companionDefsOf = () => globalThis.KorytoCompanionData?.companions || (typeof companions !== "undefined" ? companions : {});

  const locationMeta = {
    pub:{label:"Hospoda",icon:"🍺",x:10,y:28}, townhall:{label:"Radnice",icon:"🏛️",x:39,y:23}, school:{label:"Škola",icon:"🏫",x:67,y:26},
    paper:{label:"Redakce",icon:"📰",x:83,y:37}, jzd:{label:"JZD",icon:"🚜",x:12,y:63}, meadow:{label:"Louka",icon:"🌳",x:43,y:60},
    hq:{label:"Štáb",icon:"📣",x:72,y:64}, pitch:{label:"Hřiště",icon:"⚽",x:65,y:42}
  };
  const nav = [
    ["map","🗺️","Mapa"],["quests","📋","Questy"],["staff","👥","Štáb"],["influence","♟️","Vliv"],
    ["debate","🎙️","Debata"],["elections","🗳️","Volby"],["archive","📜","Archiv"],["settings","⚙️","Nastavení"]
  ];

  function activeQuests(target = stateOf()) {
    if (!target) return [];
    const defs = questDefsOf();
    return Object.entries(target.quests || {}).filter(([,q]) => q?.status === "active").map(([id,q]) => {
      const def = defs[id] || {title:id,desc:"Politická kauza",location:"townhall",deadline:13};
      const due = finite(def.deadline,13) + finite(q.deadlineBonus);
      return {id,...def,stage:finite(q.stage),due,left:due-finite(target.day,1)};
    }).sort((a,b) => a.left-b.left);
  }

  function shell() {
    if (document.getElementById("v0148Shell")) return;
    document.body.insertAdjacentHTML("beforeend", `<div id="v0148Shell" class="v0148-shell" hidden>
      <button class="v0148-close" data-v0148="close" aria-label="Zavřít">✕</button><div id="v0148Content"></div></div>
      <nav id="v0148Nav" class="v0148-nav" aria-label="Herní navigace">${nav.map(([id,icon,label])=>`<button data-v0148="${id}"><span>${icon}</span><b>${label}</b><em></em></button>`).join("")}</nav>
      <div id="v0148Toast" class="v0148-toast" role="status"></div>`);
    document.querySelectorAll("[data-v0148]").forEach(btn => btn.addEventListener("click", () => dispatch(btn.dataset.v0148)));
  }

  function hud() {
    if (document.getElementById("v0148Hud")) return;
    document.querySelector(".topbar")?.insertAdjacentHTML("afterend", `<header id="v0148Hud" class="v0148-hud">
      <section><span id="v0148Weather">☀️</span><div><b id="v0148Day">Den 1</b><small>Dolní Vejprnice</small></div></section>
      <button data-v0148="map" class="v0148-logo"><b>KORYTO</b><small>POLITICKÉ RPG</small></button>
      <section class="v0148-resources"><div><small>🤝 DŮVĚRA</small><i><u id="v0148TrustBar"></u></i><b id="v0148Trust">0</b></div><div><small>🎯 VLIV</small><i><u id="v0148InfluenceBar"></u></i><b id="v0148Influence">0</b></div><div><small>💰 PENÍZE</small><i><u id="v0148MoneyBar"></u></i><b id="v0148Money">0 Kč</b></div></section>
    </header>`);
    document.querySelector("#v0148Hud [data-v0148]")?.addEventListener("click", () => dispatch("map"));
  }

  function renderHud() {
    const target = stateOf(); if (!target) return;
    const set=(id,val)=>{const n=document.getElementById(id);if(n)n.textContent=val};
    const bar=(id,val)=>{const n=document.getElementById(id);if(n)n.style.width=`${clamp(val)}%`};
    const trust=clamp(target.stats?.trust), influence=clamp(target.stats?.influence), funds=Math.max(0,finite(target.stats?.funds));
    set("v0148Day",`Den ${finite(target.day,1)} · ${["Po","Út","St","Čt","Pá","So","Ne"][(finite(target.day,1)-1)%7]}`);
    set("v0148Weather",["☀️","🌤️","🌦️","☁️"][finite(target.day,1)%4]); set("v0148Trust",Math.round(trust)); set("v0148Influence",Math.round(influence)); set("v0148Money",`${Math.round(funds*10000).toLocaleString("cs-CZ")} Kč`);
    bar("v0148TrustBar",trust); bar("v0148InfluenceBar",influence); bar("v0148MoneyBar",funds*5);
    const urgent=activeQuests(target).filter(q=>q.left<=2).length; const badge=document.querySelector('[data-v0148="quests"] em'); if(badge){badge.textContent=urgent||"";badge.hidden=!urgent;}
  }

  function decorateMap() {
    const map=document.getElementById("map"); if(!map) return;
    map.classList.add("v0148-map");
    map.querySelectorAll("[data-loc]").forEach(btn=>{const m=locationMeta[btn.dataset.loc];if(!m)return;btn.style.setProperty("--x",`${m.x}%`);btn.style.setProperty("--y",`${m.y}%`);btn.dataset.pixelIcon=m.icon;});
    let caseCard=map.querySelector(".v0148-case"); if(!caseCard){caseCard=document.createElement("button");caseCard.className="v0148-case";caseCard.onclick=()=>openDesk("quests");map.appendChild(caseCard);}
    const q=activeQuests()[0]; caseCard.innerHTML=q?`<small>AKTIVNÍ KAUZA</small><b>${esc(q.title)}</b><span>${q.left<=0?"Rozhodnout dnes":`${q.left} dnů do termínu`}</span>`:`<small>KAMPAŇ</small><b>Žádná urgentní kauza</b><span>Využijte čas pro práci v terénu</span>`;
    if(!map.nextElementSibling?.classList?.contains("v0148-map-actions")) map.insertAdjacentHTML("afterend",`<div class="v0148-map-actions"><button data-map-action="news">📰 Zprávy</button><button class="primary" data-map-action="end">🏁 Jít na tah</button><button data-map-action="day">📅 Přehled dne</button><button data-map-action="power">♟️ Mapa vlivu</button></div>`);
    document.querySelectorAll("[data-map-action]").forEach(btn=>btn.onclick=()=>{const a=btn.dataset.mapAction;if(a==="end")document.getElementById("endDayBtn")?.click();else openDesk(a==="power"?"influence":"archive");});
  }

  function cardMeter(label,value,kind="") { return `<div class="v0148-meter ${kind}"><small>${label}</small><i><u style="width:${clamp(value)}%"></u></i><b>${Math.round(finite(value))}</b></div>`; }
  function deskHeader(kicker,title,sub,art="map"){return `<header class="v0148-desk-head art-${art}"><small>${kicker}</small><h2>${title}</h2><p>${sub}</p></header>`;}

  function questsDesk(target) {
    const rows=activeQuests(target), q=rows[0];
    return `${deskHeader("KAUZY A QUESTY",esc(q?.title||"Kampaň bez urgentní kauzy"),"Termíny, důkazy a dlouhodobé následky.",q?.location==="meadow"?"meadow":"map")}
      <div class="v0148-desk-grid"><section class="v0148-feature"><h3>${esc(q?.title||"Volný politický prostor")}</h3><p>${esc(q?.desc||"Využijte den k budování podpory.")}</p>${q?`<div class="v0148-deadline">⏳ ${q.left<=0?"DNES":`${q.left} dnů`} · fáze ${q.stage+1}</div><p><b>Riziko:</b> ${esc(q.failure||"Kauza se obrátí proti kampani.")}</p>`:""}</section><section class="v0148-list">${rows.map(item=>`<button data-location="${esc(item.location)}"><b>${esc(item.title)}</b><span>${item.left<=2?"🔴":"🟡"} ${item.left} dnů</span><small>${esc(item.desc)}</small></button>`).join("")||"<p>Žádné aktivní questy.</p>"}</section></div>`;
  }

  function staffDesk(target){
    const defs=companionDefsOf();
    return `${deskHeader("ŠTÁB KANDIDÁTA","Lidé, loajalita a konflikty","Každý člen má vlastní hranici a ambici.","staff")}<div class="v0148-staff-grid">${Object.entries(target.party||{}).map(([id,p])=>{const d=defs[id]||{};const tension=target.companionAmbitions?.[id]?.tension||0;return `<article><div class="portrait">${d.icon||"👤"}</div><h3>${esc(p.name||d.name||id)}</h3><small>${esc(d.role||"Člen štábu")}</small>${cardMeter("Loajalita",p.loyalty||50,"good")}${cardMeter("Stres",tension,"bad")}<footer><button>Promluvit</button><button>Nasadit</button></footer></article>`;}).join("")}</div>`;
  }

  function influenceDesk(target){
    const power=target.campaignMemory?.power||{}; const rows=[["Média","📰","press"],["Úřad","🏛️","officials"],["Podnikatelé","💼","business"],["Spolky","🏘️","citizens"],["Senioři","👵","seniors"],["Rodiče","👨‍👩‍👧","parents"]];
    return `${deskHeader("MAPA VLIVU","Kdo drží Dolní Vejprnice","Mocenské bloky a operace Vladimíra Věčného.","influence")}<div class="v0148-power-grid">${rows.map(([l,i,k])=>`<article><span>${i}</span><h3>${l}</h3>${cardMeter("Podpora",power[k]||target.stats?.[k]||50,"good")}</article>`).join("")}</div><section class="v0148-rival"><h3>🕴️ Vladimír Věčný</h3><p>${esc(target.campaignMemory?.doctrine?.label||target.rivalOperation?.id||"Buduje zákulisní tlak")}</p>${cardMeter("Postup operace",target.rivalOperation?.progress||0,"bad")}</section>`;
  }

  function archiveDesk(target){
    const decisions=target.campaignMemory?.decisions||[]; const news=target.news||[];
    const rows=[...decisions.map(d=>({day:d.day,title:d.choice||d.event,src:d.location||"Rozhodnutí"})),...news.map(n=>({day:n.day,title:n.text,src:"Média"}))].sort((a,b)=>finite(b.day)-finite(a.day)).slice(0,40);
    return `${deskHeader("ARCHIV A PAMĚŤ","Kampaň si pamatuje","Sliby, kauzy, lidé a důsledky.","archive")}<div class="v0148-filters"><span>Kauzy</span><span>Sliby</span><span>Lidé</span><span>Média</span><span>Důsledky</span></div><section class="v0148-timeline">${rows.map(r=>`<article><em>DEN ${finite(r.day,1)}</em><div><b>${esc(r.title)}</b><small>${esc(r.src)}</small></div></article>`).join("")||"<p>První zápis vznikne po rozhodnutí.</p>"}</section>`;
  }

  function debateDesk(target){return `${deskHeader("TELEVIZNÍ DEBATA","Fakta, emoce a staré kauzy","Před debatou si připravte důkazy a podporu štábu.","debate")}<div class="v0148-versus"><article><div>🎤</div><h3>${esc(target.hero?.name||"Kandidát")}</h3>${cardMeter("Důvěra",target.stats?.trust||50,"good")}</article><b>VS</b><article><div>🕴️</div><h3>Vladimír Věčný</h3>${cardMeter("Tlak",target.opponent?.momentum||50,"bad")}</article></div><div class="v0148-argument-cards"><button>📊 Fakta</button><button>❤️ Emoce</button><button>⚔️ Útok</button><button>🛡️ Obrana</button><button>📁 Důkaz</button></div><button class="v0148-main-action" data-start-debate>Vstoupit do debaty</button>`;}
  function electionsDesk(target){const support=clamp(target.stats?.support||50);return `${deskHeader("VOLBY A KOALICE","Mandáty, dluhy a stabilita","Vítězství v hlasech ještě nemusí znamenat vládu.","coalition")}<div class="v0148-vote"><div style="width:${support}%">Kandidát ${Math.round(support)} %</div><div style="width:${100-support}%">Věčný ${Math.round(100-support)} %</div></div><div class="v0148-coalition-cards"><article><h3>Mandáty</h3><b>${finite(target.flags?.seats,0)} / ${finite(target.flags?.majority,8)}</b></article><article><h3>Politický dluh</h3><b>${finite(target.debt,0)}</b></article><article><h3>Stabilita</h3>${cardMeter("Odhad",target.coalition?.resources?.credibility||support,"good")}</article></div>`;}
  function settingsDesk(){const option=(key,label)=>`<label><input type="checkbox" data-setting="${key}"><span>${label}</span></label>`;return `${deskHeader("NASTAVENÍ","Čitelnost a atmosféra","Rozhraní se přizpůsobí desktopu, tabletu i mobilu.")}<div class="v0148-settings">${option("reducedMotion","Omezit animace")}${option("highContrast","Vysoký kontrast")}${option("largeText","Větší text")}${option("sound","Zvuky rozhraní")}</div>`;}

  function openDesk(name){
    const target=stateOf(); if(!target)return;
    shell(); const box=document.getElementById("v0148Shell"), content=document.getElementById("v0148Content");
    const renderers={quests:questsDesk,staff:staffDesk,influence:influenceDesk,archive:archiveDesk,debate:debateDesk,elections:electionsDesk,settings:settingsDesk};
    content.innerHTML=(renderers[name]||archiveDesk)(target); box.hidden=false; box.dataset.screen=name;
    content.querySelectorAll("[data-location]").forEach(btn=>btn.onclick=()=>{closeDesk();document.querySelector(`[data-loc="${btn.dataset.location}"]`)?.click();});
    content.querySelector("[data-start-debate]")?.addEventListener("click",()=>{closeDesk();globalThis.startDebate?.();});
    content.querySelectorAll("[data-setting]").forEach(input=>{const key=input.dataset.setting;input.checked=document.documentElement.classList.contains(`v0148-${key}`);input.onchange=()=>document.documentElement.classList.toggle(`v0148-${key}`,input.checked);});
  }
  function closeDesk(){const box=document.getElementById("v0148Shell");if(box)box.hidden=true;}
  function dispatch(action){if(action==="close")return closeDesk();if(action==="map"){closeDesk();globalThis.showMap?.();return;}openDesk(action);}

  function repaint(){renderHud();decorateMap();}
  function wrap(name){const original=globalThis[name];if(typeof original!=="function"||original.__v0148)return;const wrapped=function(...args){const result=original.apply(this,args);setTimeout(repaint,0);return result};wrapped.__v0148=true;globalThis[name]=wrapped;}
  function install(){if(typeof document==="undefined")return false;shell();hud();["renderAll","renderMap","showMap","showLocation","showEvent","renderDebate","renderCoalition","newGame","load"].forEach(wrap);setTimeout(repaint,0);return true;}

  const api={VERSION,BUILD_VERSION,SAVE_VERSION,SAVE_SCHEMA,activeQuests,openDesk,repaint,install,visualAudit:(target=stateOf())=>({version:VERSION,buildVersion:BUILD_VERSION,saveVersion:SAVE_VERSION,saveSchema:SAVE_SCHEMA,screens:8,activeQuests:activeQuests(target).length,companions:Object.keys(target?.party||{}).length,ready:Boolean(target)})};
  globalThis.KorytoVisual148=api; globalThis.KorytoTest148=api; install();
})();
