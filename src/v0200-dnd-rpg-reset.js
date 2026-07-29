"use strict";
(() => {
  const BUILD = "0.20.0-test.1";
  if (new URLSearchParams(location.search).has("legacy")) return;

  const ATTRS = [
    ["charisma", "Charisma", "Přesvědčit lidi, že váš nápad byl vždycky jejich."],
    ["intellect", "Inteligence", "Najít paragraf nebo chybu v cizím paragrafu."],
    ["authority", "Autorita", "Přimět místnost ztichnout dřív než fakta."],
    ["media", "Mediální talent", "Proměnit nehodu v přijatelný titulek."],
    ["morality", "Morálka", "Odolat řešení, které potřebuje skartovačku."],
    ["luck", "Štěstí", "Potkat správného člověka místo jeho příbuzného."],
  ];
  const PROFILE = {
    bard: [4,2,3,"Veřejné scény a improvizace."], rogue:[2,1,4,"Zákulisí, kompromat a zadní vchody."],
    paladin:[2,5,2,"Čestné řešení, přísahy a důvěra."], mage:[1,3,2,"Právo, dotace a formuláře."],
    technocrat:[2,3,1,"Data, modely a smrtící prezentace."], necro:[3,1,3,"Aparát, kontakty a politická nekromancie."],
  };
  const ORIGIN = {idealist:{morality:2},ambitious:{morality:-1,media:1,luck:1},revenge:{morality:-1,luck:2,authority:1}};
  const app = () => globalThis.KorytoApp;
  const game = () => app()?.getState?.();
  const clamp = n => Math.max(1, Math.min(5, n));
  let tutorial = {active:false,step:0,result:null};
  let observer;

  function classId(){return document.querySelector("[data-class].selected")?.dataset.class || game()?.hero?.classId || "bard";}
  function attributes(id=classId(), origin=document.getElementById("origin")?.value||"idealist"){
    const old=globalThis.KorytoCoreData?.classes?.[id]?.attrs||{}, p=PROFILE[id]||PROFILE.bard, o=ORIGIN[origin]||{};
    return {charisma:clamp(+old.charisma||2),intellect:clamp(+old.intellect||2),authority:clamp((+old.authority||2)+(o.authority||0)),media:clamp(p[0]+(o.media||0)),morality:clamp(p[1]+(o.morality||0)),luck:clamp(p[2]+(o.luck||0))};
  }
  function setText(id,text){const el=document.getElementById(id);if(el&&el.textContent!==text)el.textContent=text;}

  function creation(){
    const root=document.querySelector("#creationScreen .creation");if(!root)return;
    let panel=document.getElementById("v0200AttributePreview");
    if(!panel){panel=document.createElement("section");panel.id="v0200AttributePreview";panel.className="panel v0200-attribute-preview";panel.innerHTML='<div class="v0200-preview-head"><div><p class="eyebrow">D&D LIST POSTAVY</p><h3>Šest skutečných atributů</h3></div><span class="v0200-rule-chip">d20 + atribut proti obtížnosti</span></div><p class="v0200-preview-copy">Třída vás omezuje, původ vás deformuje. Špatná postava je povolená a obec si toho všimne.</p><div id="v0200AttributeGrid" class="v0200-attribute-grid"></div><div id="v0200ClassIdentity" class="v0200-class-identity"></div>';root.append(panel);}
    const vals=attributes(), sig=classId()+":"+(document.getElementById("origin")?.value||"idealist");
    const grid=document.getElementById("v0200AttributeGrid");
    if(grid.dataset.signature!==sig){grid.dataset.signature=sig;grid.innerHTML=ATTRS.map(([id,n,d])=>`<article class="v0200-attribute"><div><strong>${n}</strong><span>${d}</span></div><b>${vals[id]}</b></article>`).join("");}
    const c=globalThis.KorytoCoreData?.classes?.[classId()];
    const ident=document.getElementById("v0200ClassIdentity");if(c){const html=`<strong>${c.icon} ${c.name}</strong><span>${PROFILE[classId()]?.[3]||c.desc}</span>`;if(ident.innerHTML!==html)ident.innerHTML=html;}
    document.querySelectorAll("[data-class]").forEach(card=>{if(card.querySelector(".v0200-class-note"))return;const note=document.createElement("span");note.className="v0200-class-note";note.textContent=["bard","rogue","paladin"].includes(card.dataset.class)?"Doporučeno pro první průchod":"Pokročilá třída";card.append(note);});
  }

  function panels(){
    const advanced=["soulBars","relationshipPanel","voterBars","factionBars","warRoom","commitments","factionPlans","worldPulse","ambitionPanel","rivalOperationPanel","conspiracyPanel","news"];
    advanced.forEach(id=>{const card=document.getElementById(id)?.closest(".card,.k-ui-panel,.k165-ledger,.k16-panel");if(card)card.dataset.v0200Panel="advanced";});
    document.documentElement.classList.add("v0200-dnd-reset","v0200-focus-mode");
    const actions=document.querySelector(".topbar .actions");
    if(actions&&!document.getElementById("v0200DetailsToggle")){const b=document.createElement("button");b.id="v0200DetailsToggle";b.className="btn small";b.textContent="Otevřít kroniku a systémy";b.onclick=()=>{const open=document.documentElement.classList.toggle("v0200-details-open");b.textContent=open?"Zavřít kroniku a systémy":"Otevřít kroniku a systémy";};actions.prepend(b);}
  }

  function objective(){
    const center=document.querySelector("#gameScreen .game > section");if(!center)return;
    if(!document.getElementById("v0200Objective")){const bar=document.createElement("section");bar.id="v0200Objective";bar.className="v0200-objective";bar.innerHTML='<div class="v0200-objective-main"><span>AKTUÁLNÍ CÍL</span><strong id="v0200ObjectiveTitle"></strong></div><div class="v0200-objective-meta"><span><b>Co udělat:</b><i id="v0200ObjectiveAction"></i></span><span><b>Riziko:</b><i id="v0200ObjectiveRisk"></i></span><span><b>Čas:</b><i id="v0200ObjectiveTime"></i></span></div>';center.prepend(bar);}
    const s=game();if(!s)return;
    if(s.flags?.v0200Rules && !s.ended && s.flags.v0200ActionDayAdjusted!==s.day && s.phase==="map"){if(s.actions===2)s.actions=3;s.flags.v0200ActionDayAdjusted=s.day;}
    let x;
    if(tutorial.active)x=["Najděte cestu do Dolních Vejprnic","Dokončete tutorial a první hod d20.","Neúspěch vytvoří komplikaci, ne slepou uličku.","Bez spotřeby akce"];
    else if(!s.flags?.introDone)x=["Oznamte kandidaturu","Vyberte, jak se představíte lidem v hospodě.","První dojem mění vztahy a dluhy.","Prolog · bez akce"];
    else {const active=Object.entries(s.quests||{}).filter(([id,q])=>q.status==="active"&&globalThis.KorytoQuestData?.definitions?.[id]).sort((a,b)=>app().questDeadline(a[0])-app().questDeadline(b[0]));if(active.length){const [id]=active[0],d=globalThis.KorytoQuestData.definitions[id],left=Math.max(0,app().questDeadline(id)-s.day);x=[d.title,`${d.desc} Jděte do ${globalThis.KorytoCoreData.locations[d.location].name}.`,d.failure,`${left?left+" dny":"Dnes"} · 1 akce`];}else x=["Zvolte další výpravu","Otevřete mapu a vyberte aktivní lokaci.","Nevyřešené problémy posilují Věčného.",`${s.actions} akce dnes`];}
    ["v0200ObjectiveTitle","v0200ObjectiveAction","v0200ObjectiveRisk","v0200ObjectiveTime"].forEach((id,i)=>setText(id,x[i]));
    const inv=document.getElementById("inventory");if(s.items?.includes("chainedPen")&&inv&&!inv.querySelector("[data-v0200-item]")){const item=document.createElement("div");item.className="party-item v0200-item";item.dataset.v0200Item="chainedPen";item.innerHTML=`<strong>🖊️ Propiska na řetízku</strong>${s.flags?.chainedPenSpent?"Inkoust už nefunguje.":"Jednou přehodí neúspěch za +2 mediální tlak."}`;inv.prepend(item);}
  }

  function shell(){if(document.getElementById("v0200Tutorial"))return;const el=document.createElement("div");el.id="v0200Tutorial";el.className="v0200-tutorial";el.hidden=true;el.innerHTML='<div class="v0200-tutorial-card"><div id="v0200TutorialProgress" class="v0200-tutorial-progress"></div><div id="v0200TutorialBody"></div></div>';document.body.append(el);}
  function button(label,fn,primary=false){const b=document.createElement("button");b.className="btn"+(primary?" primary":"");b.textContent=label;b.onclick=fn;return b;}
  function level(roll,total,dc){return roll===20?"critical":roll===1?"complication":total>=dc+2?"success":total>=dc-1?"costly":"complication";}
  function roll(choice){const s=game(),mod=s.hero.rpgAttrs[choice.attr],r=1+Math.floor(Math.random()*20),total=r+mod,l=level(r,total,choice.dc);const data={critical:["Obec se našla sama","Kronikář vás pozná a přidá použitelnou historku.","Kritický úspěch"],success:["Cesta nalezena","Uvidíte věž radnice. Je nakřivo, ale stabilní.","Čistý úspěch"],costly:["Cesta za cenu","Kronikář vás zapíše jako člověka, který nepozná obec podle dotační tabule.","Úspěch za cenu"],complication:["Špatná cesta, dobrý problém","Dojdete ke sběrnému dvoru, ale zjistíte, že k vaší kandidatuře chybí formulář.","Komplikace"]}[l];tutorial.result={choice,roll:r,mod,total,dc:choice.dc,level:l,title:data[0],text:data[1],label:data[2]};s.audit.rolls++;s.audit.outcomes[l]=(s.audit.outcomes[l]||0)+1;s.flags.v0200TutorialRoll={roll:r,mod,total,dc:choice.dc,level:l};if(l==="costly")s.stats.heat+=2;if(l==="complication")s.stats.heat+=3;tutorial.step=2;renderTutorial();}
  function renderTutorial(){
    const modal=document.getElementById("v0200Tutorial"),body=document.getElementById("v0200TutorialBody"),progress=document.getElementById("v0200TutorialProgress");modal.hidden=!tutorial.active;if(!tutorial.active)return;progress.innerHTML=[0,1,2,3].map(i=>`<i class="${tutorial.step>=i?"done":""}"></i>`).join("");body.innerHTML="";
    if(tutorial.step===0){body.innerHTML='<p class="eyebrow">PROLOG · TUTORIAL</p><h2>Autobus vás vysadil správně. Jen v jiné obci.</h2><p>Cedule ukazuje ke hřbitovu, sběrnému dvoru a úřadu zavřenému od roku 2007.</p><div class="v0200-rule"><strong>Pravidlo</strong><span>Volba → d20 + atribut → úspěch, cena nebo komplikace.</span></div><p>Řidič vám podá obecní propisku na řetízku. Řetízek je delší než místní transparentnost.</p>';const a=document.createElement("div");a.className="v0200-tutorial-actions";a.append(button("Vzít propisku a rozhlédnout se",()=>{const s=game();if(!s.items.includes("chainedPen"))s.items.push("chainedPen");tutorial.step=1;renderTutorial();},true));body.append(a);return;}
    if(tutorial.step===1){const a=game().hero.rpgAttrs,choices=[{label:"Zeptat se muže čekajícího od roku 1998",attr:"charisma",dc:10,detail:"Možná čeká na autobus. Možná na kanalizaci."},{label:"Rozluštit obecní vývěsku",attr:"intellect",dc:11,detail:"Pět šipek, tři razítka a jedna příloha."},{label:"Následovat lidi s deskami",attr:"luck",dc:12,detail:"Metoda bez dat, zato s tradicí."}];body.innerHTML='<p class="eyebrow">PRVNÍ ZKOUŠKA</p><h2>Najděte obec, než začne kampaň bez vás</h2><p>Obtížnost i známý bonus jsou viditelné.</p><div class="v0200-tutorial-choices"></div>';const list=body.querySelector("div");choices.forEach(c=>{const b=button(c.label,()=>roll(c));b.innerHTML=`<strong>${c.label}</strong><span>${c.detail}</span><small>d20 + ${a[c.attr]} proti ${c.dc}</small>`;list.append(b);});return;}
    if(tutorial.step===2){const r=tutorial.result;body.innerHTML=`<p class="eyebrow">VÝSLEDEK</p><div class="v0200-die">${r.roll}</div><h2>${r.title}</h2><p>${r.text}</p><div class="v0200-formula">${r.roll} + ${r.mod} = ${r.total} proti ${r.dc}</div><div class="v0200-rule"><strong>${r.label}</strong><span>Příběh vždy pokračuje, ale účet se mění.</span></div>`;const a=document.createElement("div");a.className="v0200-tutorial-actions";const s=game();if(r.level==="complication"&&!s.flags.chainedPenSpent)a.append(button("Přehodit propiskou za +2 mediální tlak",()=>{s.flags.chainedPenSpent=true;s.stats.heat+=2;roll(r.choice);},true));a.append(button("Přijmout následek a pokračovat",()=>{tutorial.step=3;renderTutorial();},r.level!=="complication"));body.append(a);return;}
    body.innerHTML='<p class="eyebrow">DRUŽINA</p><h2>Na úřad se nechodí sám</h2><p>Vyberte prvního společníka. Může vám pomoci, odporovat nebo vás později zradit.</p><div class="v0200-companions"></div>';const list=body.querySelector("div");[["marie","Marie Čistá","Čestné, veřejné a školní kauzy."],["bohumil","Bohumil Tichý","Právo, termíny a dokumenty s kopiemi."]].forEach(([id,n,d])=>{const b=button(n,()=>finish(id));b.innerHTML=`<strong>${globalThis.KorytoCompanionData.companions[id].icon} ${n}</strong><span>${d}</span>`;list.append(b);});
  }
  function finish(id){const s=game(),d=globalThis.KorytoCompanionData.companions[id];s.party[id]={...d,loyalty:d.loyalty};s.flags.v0200TutorialDone=true;s.flags.v0200FirstCompanion=id;tutorial.active=false;document.getElementById("v0200Tutorial").hidden=true;app().setState(s);app().showEvent("intro");objective();}
  function start(){const s=game();if(!s||s.flags?.v0200TutorialDone)return;s.actions=3;s.hero.rpgAttrs=attributes(s.hero.classId,s.hero.origin);s.hero.attrs={...s.hero.attrs,charisma:s.hero.rpgAttrs.charisma,intellect:s.hero.rpgAttrs.intellect,authority:s.hero.rpgAttrs.authority,cunning:Math.round((s.hero.rpgAttrs.media+s.hero.rpgAttrs.luck)/2),resilience:Math.round((s.hero.rpgAttrs.morality+s.hero.rpgAttrs.authority)/2)};s.flags.v0200Rules=BUILD;s.flags.v0200ActionDayAdjusted=s.day;app().setState(s);tutorial={active:true,step:0,result:null};renderTutorial();objective();}
  function wrap(){const b=document.getElementById("confirmBtn");if(!b||b.dataset.v0200Wrapped||typeof b.onclick!=="function")return;const old=b.onclick;b.onclick=function(e){const result=old.call(this,e);queueMicrotask(start);return result;};b.dataset.v0200Wrapped="1";}
  function sync(){creation();panels();objective();shell();wrap();}
  function install(){sync();observer=new MutationObserver(()=>requestAnimationFrame(sync));observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});document.addEventListener("click",()=>setTimeout(sync,0),true);document.addEventListener("change",()=>setTimeout(sync,0),true);setInterval(objective,700);}

  globalThis.KorytoDndReset=Object.freeze({VERSION:"0.20.0 TEST.1",BUILD_VERSION:BUILD,ATTRIBUTES:ATTRS.map(([id,label])=>({id,label})),deriveAttributes:attributes,startTutorial:start,sync,get tutorial(){return{...tutorial}}});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
