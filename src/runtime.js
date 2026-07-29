"use strict";
(() => {
  const VERSION = "0.20.0-clean-test.1";
  const STORAGE = "koryto.clean.v0200";
  const ATTRS = [
    ["charisma","Charisma","Přesvědčit lidi, že váš nápad byl vždycky jejich."],
    ["intellect","Inteligence","Najít paragraf nebo chybu v cizím paragrafu."],
    ["authority","Autorita","Přimět místnost ztichnout dřív než fakta."],
    ["media","Mediální talent","Proměnit nehodu v přijatelný titulek."],
    ["morality","Morálka","Odolat řešení, které potřebuje skartovačku."],
    ["luck","Štěstí","Potkat správného člověka místo jeho příbuzného."]
  ];
  const ORIGINS = {
    idealist:{name:"Místní idealista",description:"Věříte, že obec lze napravit. Obec zatím věří, že vás lze unavit.",modifiers:{morality:2,charisma:1,luck:-1}},
    ambitious:{name:"Okresní kariérista",description:"Přijeli jste pomoci. Především své budoucí vizitce.",modifiers:{media:2,authority:1,morality:-1}},
    revenge:{name:"Navrátilec s účtem",description:"Pamatujete si všechno. Zejména to, co ostatní považovali za promlčené.",modifiers:{luck:2,intellect:1,morality:-1}}
  };
  const CLASSES = {
    bard:{name:"Mediální bard",icon:"🎙️",description:"Z neúspěchu udělá příběh. Bohužel často s vlastním jménem v titulku.",base:{charisma:4,intellect:2,authority:3,media:5,morality:2,luck:3},perk:"Jednou za scénu může změnit komplikaci na úspěch za cenu.",weakness:"Každá ostuda zvyšuje mediální tlak o 2."},
    paladin:{name:"Aktivistický paladin",icon:"🛡️",description:"Přísahá na transparentnost. Obec přísahá, že nic neslyšela.",base:{charisma:3,intellect:3,authority:4,media:2,morality:5,luck:2},perk:"Čestné řešení má +2 bez politického dluhu.",weakness:"Nemůže zvolit otevřený podvod."},
    rogue:{name:"Zákulisní rogue",icon:"🗝️",description:"Nezná správný vchod. Zná ale vchod, který se nezapisuje do knihy návštěv.",base:{charisma:3,intellect:4,authority:2,media:2,morality:1,luck:5},perk:"Před hodem odhalí jeden skrytý modifikátor.",weakness:"Kritická jednička přidává vydíratelnost."}
  };
  const COMPANIONS = {
    marie:{name:"Marie Čistá",icon:"📚",role:"Bývalá úřednice",description:"Zná předpisy, zásuvky a rozdíl mezi kopií a kopií určenou ke ztrátě.",bonus:{intellect:2,morality:1},demand:"Nesnáší otevřené lhaní občanům."},
    bohumil:{name:"Bohumil Tichý",icon:"🍺",role:"Hospodský diplomat",description:"Ví, kdo s kým nemluví a kdo s kým nemluví jen před manželkou.",bonus:{charisma:2,luck:1},demand:"Nechce, aby hospoda přišla o obecní zakázky."}
  };
  const FIRST = [
    {id:"ask-local",label:"Zeptat se muže čekajícího od roku 1998",detail:"Možná čeká na autobus. Možná na kanalizaci.",attribute:"charisma",dc:10},
    {id:"read-board",label:"Rozluštit obecní vývěsku",detail:"Pět šipek, tři razítka a jedna příloha bez přílohy.",attribute:"intellect",dc:11},
    {id:"follow-folders",label:"Následovat lidi s deskami",detail:"Metoda bez dat, zato s tradicí.",attribute:"luck",dc:12}
  ];
  const REGISTRATION = [
    {id:"public-speech",label:"Vyhlásit kandidaturu rovnou ve vestibulu",detail:"Veřejnost jako beranidlo. Kamera místního hasiče jako svědek.",attribute:"charisma",dc:13,classBonus:{bard:2},companionBonus:{bohumil:1}},
    {id:"find-paragraph",label:"Najít paragraf, který úřad přehlédl",detail:"Správný formulář existuje. Jen je veden pod názvem kotelna.",attribute:"intellect",dc:13,classBonus:{paladin:1,rogue:1},companionBonus:{marie:2}},
    {id:"back-door",label:"Použít služební vchod a cizí razítko",detail:"Rychlé, účinné a později velmi dobře dohledatelné.",attribute:"luck",dc:12,classBonus:{rogue:2},companionBonus:{bohumil:1},dirty:true}
  ];
  const OUTCOMES = {
    critical:{title:"Kritický triumf",label:"Kritická dvacítka",description:"Dosáhli jste víc, než bylo rozumné požadovat. Obec to bude dlouho vysvětlovat.",tone:"gold"},
    success:{title:"Čistý úspěch",label:"Úspěch",description:"Plán funguje a účet zatím nikdo nepřinesl.",tone:"green"},
    costly:{title:"Úspěch za cenu",label:"Cena",description:"Dostali jste, co jste chtěli. Někdo si ale zapsal vaše jméno.",tone:"amber"},
    complication:{title:"Komplikace",label:"Neúspěch, který pokračuje",description:"Příběh nekončí. Jen se stává dražší, osobnější a směšnější.",tone:"red"}
  };

  const app = document.getElementById("app");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const derive = (classId,originId) => {
    const result = {...(CLASSES[classId] || CLASSES.bard).base};
    for (const [key,value] of Object.entries((ORIGINS[originId] || ORIGINS.idealist).modifiers)) result[key] = clamp((result[key] || 1) + value,1,6);
    return result;
  };
  const initial = () => ({version:VERSION,saveSchema:1,screen:"creation",scene:"arrival",day:1,actions:3,hero:{name:"",classId:"bard",originId:"idealist",attributes:derive("bard","idealist")},party:{active:null,members:[]},inventory:[],resources:{reputation:0,money:3,heat:0,debt:0},flags:{chainedPenAvailable:false,chainedPenSpent:false,candidacyRegistered:false,registrationDebt:false,chapterOneUnlocked:false,lastResult:null},history:[]});
  const load = () => { try { const value=JSON.parse(localStorage.getItem(STORAGE)); return value?.version===VERSION && value?.saveSchema===1 ? value : null; } catch { return null; } };
  let state = load() || initial();
  let firstChoice = null;
  const save = () => localStorage.setItem(STORAGE,JSON.stringify(state));
  const commit = (next,persist=false) => { state=next; if(persist) save(); render(); };
  const patch = (fn,persist=false) => { const next=structuredClone(state); fn(next); commit(next,persist); };
  const random = () => { const forced=Number(new URLSearchParams(location.search).get("roll")); return Number.isInteger(forced)&&forced>=1&&forced<=20 ? () => (forced-.01)/20 : Math.random; };
  const level = (roll,total,dc) => roll===20?"critical":roll===1?"complication":total>=dc+3?"success":total>=dc-1?"costly":"complication";
  const resolve = choice => {
    const companion=COMPANIONS[state.party.active];
    const visible=(state.hero.attributes[choice.attribute]||0)+(choice.classBonus?.[state.hero.classId]||0)+(choice.companionBonus?.[state.party.active]||0)+(companion?.bonus?.[choice.attribute]||0);
    const hidden=choice.dirty&&state.hero.classId!=="rogue"?-1:0;
    const roll=1+Math.floor(random()()*20), total=roll+visible+hidden, resultLevel=level(roll,total,choice.dc);
    return {choiceId:choice.id,attribute:choice.attribute,roll,dc:choice.dc,visibleModifier:visible,hiddenModifier:hidden,total,level:resultLevel,outcome:OUTCOMES[resultLevel]};
  };
  const consequences = (result,context) => {
    const next=structuredClone(state); next.history.push({context,...result}); next.flags.lastResult=result;
    if(result.level==="critical"){next.resources.reputation+=8;next.resources.money+=1;}
    else if(result.level==="success") next.resources.reputation+=4;
    else if(result.level==="costly"){next.resources.reputation+=2;next.resources.heat+=2;}
    else {next.resources.heat+=4;next.resources.debt+=1;}
    if(context==="registration"){next.flags.candidacyRegistered=true;if(result.level==="complication")next.flags.registrationDebt=true;next.actions=Math.max(0,next.actions-1);}
    return next;
  };

  const attributeGrid = attrs => `<div class="attribute-grid">${ATTRS.map(([id,label,desc])=>`<article class="attribute-card"><div><strong>${label}</strong><small>${desc}</small></div><b>${attrs[id]}</b></article>`).join("")}</div>`;
  const creation = () => `<main class="creation-screen"><section class="creation-copy"><p class="eyebrow">KORYTO · ČISTÝ REWRITE</p><h1>Vytvořte politického dobrodruha</h1><p>Dolní Vejprnice nepotřebují dalšího hrdinu. Proto jste přijeli právě vy.</p><div class="version-badge">${VERSION}</div></section><form id="creationForm" class="creation-panel"><label class="field-label">Jméno kandidáta<input id="heroName" maxlength="32" placeholder="např. Bohuslav Pravdomluvný" autocomplete="off"></label><fieldset><legend>Původ</legend><div class="choice-grid origins">${Object.entries(ORIGINS).map(([id,o])=>`<button type="button" class="choice-card ${state.hero.originId===id?"selected":""}" data-origin="${id}"><strong>${o.name}</strong><span>${o.description}</span></button>`).join("")}</div></fieldset><fieldset><legend>Třída</legend><div class="choice-grid classes">${Object.entries(CLASSES).map(([id,c])=>`<button type="button" class="choice-card class-card ${state.hero.classId===id?"selected":""}" data-class="${id}"><b>${c.icon}</b><strong>${c.name}</strong><span>${c.description}</span><small><em>Schopnost:</em> ${c.perk}</small><small><em>Slabina:</em> ${c.weakness}</small></button>`).join("")}</div></fieldset><section class="sheet-preview"><header><div><p class="eyebrow">LIST POSTAVY</p><h2>Šest skutečných atributů</h2></div><span>d20 + atribut proti obtížnosti</span></header>${attributeGrid(state.hero.attributes)}</section><button class="primary-action" type="submit">Přijet do Dolních Vejprnic</button></form></main>`;
  const objectives = {
    arrival:["Najděte Dolní Vejprnice","Rozhlédněte se po špatné zastávce.","Ztracenost postavy je záměrná. Ztracenost hráče ne.","Bez spotřeby akce"],
    firstCheck:["Najděte cestu do obce","Vyberte atribut a proveďte první hod d20.","Neúspěch vytvoří komplikaci, nikoli konec.","Bez spotřeby akce"],
    firstResult:["Přijměte výsledek","Rozhodněte, zda utratíte propisku na přehod.","Přehod zvýší mediální tlak.","Bez spotřeby akce"],
    companion:["Sestavte první družinu","Vyberte Marii nebo Bohumila.","Společník pomáhá, ale má vlastní hranice.","Bez spotřeby akce"],
    registration:["Zaregistrujte kandidaturu","Zvolte způsob, jak obejít neexistující potvrzení.","Volba může vytvořit politický dluh.","1 akce"],
    registrationResult:["Přežijte první politický účet","Přijměte důsledky registrace.","Věčný už o vás ví.","1 akce"],
    chapterOpen:["Krysy v JZD","Zjistěte, kdo rozprodává obecní majetek.","Všichni vědí kdo. Každý uvádí jiné jméno.","Kapitola 1"]
  };
  const hud = () => { const [title,action,risk,time]=objectives[state.scene]||objectives.arrival; const pill=(l,v)=>`<article class="hud-stat"><span>${l}</span><strong>${v}</strong></article>`; return `<header class="game-hud"><div class="brand"><span>K</span><div><small>SATIRICKÉ POLITICKÉ RPG</small><strong>KORYTO</strong></div></div><div class="hud-stats">${pill("DEN",state.day)}${pill("AKCE",state.actions)}${pill("REPUTACE",state.resources.reputation)}${pill("PENÍZE",`${state.resources.money} žet.`)}${pill("TLAK",state.resources.heat)}</div><div class="hud-actions"><button data-action="save">Uložit</button><button data-action="restart">Nová hra</button></div><section class="objective-card"><div><small>AKTUÁLNÍ CÍL</small><strong>${title}</strong></div><dl><div><dt>Co udělat</dt><dd>${action}</dd></div><div><dt>Riziko</dt><dd>${risk}</dd></div><div><dt>Čas</dt><dd>${time}</dd></div></dl></section></header>`; };
  const hero = () => { const c=CLASSES[state.hero.classId],o=ORIGINS[state.hero.originId]; return `<aside class="hero-panel panel"><p class="eyebrow">VAŠE POSTAVA</p><div class="portrait">${c.icon}</div><h2>${esc(state.hero.name)}</h2><strong>${c.name}</strong><span>${o.name}</span><div class="mini-attrs">${ATTRS.map(([id,label])=>`<div><small>${label}</small><b>${state.hero.attributes[id]}</b></div>`).join("")}</div></aside>`; };
  const support = () => { const c=COMPANIONS[state.party.active]; return `<aside class="support-stack"><section class="panel"><p class="eyebrow">DRUŽINA</p>${c?`<div class="companion-summary"><b>${c.icon}</b><div><strong>${c.name}</strong><span>${c.role}</span><small>${c.demand}</small></div></div>`:`<p class="muted">Zatím jdete sami. To je levné a nerozumné.</p>`}</section><section class="panel"><p class="eyebrow">INVENTÁŘ</p>${state.inventory.includes("chainedPen")?`<div class="item-card"><b>🖊️</b><div><strong>Propiska na řetízku</strong><span>${state.flags.chainedPenSpent?"Inkoust je mrtvý. Řetízek zůstává.":"Jednou zopakuje neúspěšný hod za +2 tlak."}</span></div></div>`:`<p class="muted">V kapsách nic. Ani omluva.</p>`}</section></aside>`; };
  const choiceButton = choice => { const companion=COMPANIONS[state.party.active]; const modifier=(state.hero.attributes[choice.attribute]||0)+(choice.classBonus?.[state.hero.classId]||0)+(choice.companionBonus?.[state.party.active]||0)+(companion?.bonus?.[choice.attribute]||0); const blocked=choice.dirty&&state.hero.classId==="paladin"; return `<button class="action-card ${choice.dirty?"dirty":""}" data-check="${choice.id}" ${blocked?"disabled":""}><strong>${choice.label}</strong><span>${choice.detail}</span><small>d20 + ${modifier} proti ${choice.dc}${blocked?" · Třída tuto volbu odmítá":""}</small></button>`; };
  const resultCard = context => { const r=state.flags.lastResult,can=context==="first"&&r.level==="complication"&&state.flags.chainedPenAvailable&&!state.flags.chainedPenSpent; return `<section class="result-card tone-${r.outcome.tone}"><div class="d20">${r.roll}</div><p class="eyebrow">${r.outcome.label}</p><h1>${r.outcome.title}</h1><p>${r.outcome.description}</p><div class="formula">${r.roll} + ${r.visibleModifier}${r.hiddenModifier?` ${r.hiddenModifier}`:""} = ${r.total} proti ${r.dc}</div><div class="result-actions">${can?`<button class="secondary-action" data-action="reroll-first">Přehodit propiskou za +2 tlak</button>`:""}<button class="primary-action" data-action="accept-${context}">Přijmout důsledek</button></div></section>`; };
  const scene = () => {
    if(state.scene==="arrival")return `<section class="scene-card location-arrival"><p class="eyebrow">PROLOG · ŠPATNÁ ZASTÁVKA</p><h1>Autobus vás vysadil správně. Jen v jiné obci.</h1><p>Cedule ukazuje ke hřbitovu, sběrnému dvoru a úřadu zavřenému od roku 2007. Řidič vám podá obecní propisku na řetízku. Řetízek je delší než místní transparentnost.</p><div class="rule-card"><strong>První pravidlo</strong><span>Volba → d20 + atribut → úspěch, cena nebo komplikace.</span></div><button class="primary-action" data-action="take-pen">Vzít propisku a rozhlédnout se</button></section>`;
    if(state.scene==="firstCheck")return `<section class="scene-card"><p class="eyebrow">PRVNÍ ZKOUŠKA</p><h1>Najděte obec, než začne kampaň bez vás</h1><p>Obtížnost i známé bonusy jsou viditelné. Skryté vlivy hra nikdy nepoužije bez stopy.</p><div class="action-list">${FIRST.map(choiceButton).join("")}</div></section>`;
    if(state.scene==="firstResult")return resultCard("first");
    if(state.scene==="companion")return `<section class="scene-card"><p class="eyebrow">DRUŽINA</p><h1>Na úřad se nechodí sám</h1><p>Vyberte prvního společníka. Není to bonusová karta, ale člověk s vlastními hranicemi.</p><div class="companion-grid">${Object.entries(COMPANIONS).map(([id,c])=>`<button class="companion-card" data-companion="${id}"><b>${c.icon}</b><strong>${c.name}</strong><span>${c.role}</span><p>${c.description}</p><small>${c.demand}</small></button>`).join("")}</div></section>`;
    if(state.scene==="registration")return `<section class="scene-card location-office"><p class="eyebrow">OBECNÍ ÚŘAD</p><h1>Vaše kandidatura neexistuje, protože chybí potvrzení, které úřad nevydává</h1><p>Za přepážkou sedí referentka s prázdným formulářem a fotografií Vladimíra Věčného z doby, kdy měl ještě jen jednu funkci.</p><div class="action-list">${REGISTRATION.map(choiceButton).join("")}</div></section>`;
    if(state.scene==="registrationResult")return resultCard("registration");
    return `<section class="scene-card chapter-card"><p class="eyebrow">KAPITOLA 1 ODEMČENA</p><h1>Krysy v JZD</h1><p>Někdo rozprodává obecní majetek. Všichni vědí kdo, ale každý uvádí jiné jméno. Vladimír Věčný vám osobně gratuluje k registraci a nabízí pomoc, o kterou jste nežádali.</p><div class="chapter-recap"><div><small>Kandidatura</small><strong>${state.flags.candidacyRegistered?"Zaregistrována":"Administrativně sporná"}</strong></div><div><small>Politické dluhy</small><strong>${state.resources.debt}</strong></div><div><small>Družina</small><strong>${COMPANIONS[state.party.active]?.name||"Nikdo"}</strong></div><div><small>Reputace</small><strong>${state.resources.reputation}</strong></div></div><button class="primary-action" data-action="save">Uložit čistý rewrite</button></section>`;
  };
  const render = () => { app.innerHTML=state.screen==="creation"?creation():`<div class="game-screen">${hud()}<main class="game-layout">${hero()}<section class="world-stage">${scene()}</section>${support()}</main><footer>Čistý runtime v0.20 · jediný renderer · nový save schema 1</footer></div>`; };

  app.addEventListener("click", event => {
    const origin=event.target.closest("[data-origin]"); if(origin){patch(next=>{next.hero.originId=origin.dataset.origin;next.hero.attributes=derive(next.hero.classId,next.hero.originId);});return;}
    const classButton=event.target.closest("[data-class]"); if(classButton){patch(next=>{next.hero.classId=classButton.dataset.class;next.hero.attributes=derive(next.hero.classId,next.hero.originId);});return;}
    const check=event.target.closest("[data-check]"); if(check){const collection=state.scene==="firstCheck"?FIRST:REGISTRATION,choice=collection.find(x=>x.id===check.dataset.check);if(!choice)return;if(state.scene==="firstCheck")firstChoice=choice;const context=state.scene==="firstCheck"?"first":"registration",next=consequences(resolve(choice),context);next.scene=context==="first"?"firstResult":"registrationResult";commit(next);return;}
    const companion=event.target.closest("[data-companion]"); if(companion){patch(next=>{next.party.active=companion.dataset.companion;next.party.members=[companion.dataset.companion];next.scene="registration";});return;}
    const button=event.target.closest("[data-action]"); if(!button)return; const action=button.dataset.action;
    if(action==="take-pen")patch(next=>{next.flags.chainedPenAvailable=true;if(!next.inventory.includes("chainedPen"))next.inventory.push("chainedPen");next.scene="firstCheck";});
    else if(action==="reroll-first"&&firstChoice&&!state.flags.chainedPenSpent){const base=structuredClone(state);base.flags.chainedPenSpent=true;base.resources.heat+=2;state=base;const next=consequences(resolve(firstChoice),"first-reroll");next.scene="firstResult";commit(next);}
    else if(action==="accept-first")patch(next=>{next.scene="companion";});
    else if(action==="accept-registration")patch(next=>{next.flags.chapterOneUnlocked=true;next.scene="chapterOpen";},true);
    else if(action==="save"){save();button.textContent="Uloženo";}
    else if(action==="restart"){localStorage.removeItem(STORAGE);state=initial();firstChoice=null;render();}
  });
  app.addEventListener("submit", event => { if(event.target.id!=="creationForm")return;event.preventDefault();patch(next=>{next.screen="game";next.scene="arrival";next.hero.name=document.getElementById("heroName")?.value.trim()||"Bezejmenný kandidát";}); });
  render();
  globalThis.KorytoClean=Object.freeze({version:VERSION,getState:()=>structuredClone(state)});
})();
