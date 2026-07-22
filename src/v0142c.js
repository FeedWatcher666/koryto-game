"use strict";
(() => {
  const VERSION = "0.14.2 TEST.5";
  const PROMISE_KEY = "v0142Promise";

  const gameActive = () =>
    typeof state !== "undefined" &&
    document.getElementById("gameScreen")?.classList.contains("active") &&
    !state.ended;

  const mapReady = () => gameActive() && state.phase === "map";

  const promiseDefs = {
    school: {
      icon:"🏫",
      title:"Opravit školní střechu do voleb",
      pitch:"Rodiny dostanou jasný slib, rozpočet dostane panickou ataku.",
      immediate:()=>{effect({support:5,trust:3});shift("parents",8);},
      cost:{funds:6},
      fulfilled:()=>{effect({support:3,trust:6,integrity:6});shift("parents",4);state.worldChanges=state.worldChanges||{};state.worldChanges.school="repaired";},
      broken:()=>{effect({support:-5,trust:-10,integrity:-8,heat:5});shift("parents",-9);}
    },
    fees: {
      icon:"🧾",
      title:"Nezvýšit obecní poplatky ani o korunu",
      pitch:"Slogan je levný. Výpadek příjmů už méně.",
      immediate:()=>{effect({support:6,integrity:-2});shift("entrepreneurs",7);shift("seniors",4);},
      cost:{funds:4,influence:2},
      fulfilled:()=>{effect({support:4,trust:5,integrity:3,funds:-1});shift("entrepreneurs",3);shift("seniors",3);},
      broken:()=>{effect({support:-6,trust:-8,integrity:-7,heat:4});shift("entrepreneurs",-7);shift("seniors",-5);}
    },
    meadow: {
      icon:"🌳",
      title:"Zachránit Poslední louku před betonem",
      pitch:"Občanský slib, který Holub označí za útok na budoucnost.",
      immediate:()=>{effect({trust:4,business:-5,citizens:5});shift("undecided",5);shift("parents",4);},
      cost:{funds:3,influence:4},
      fulfilled:()=>{effect({support:4,trust:6,integrity:7,business:-5,citizens:5});shift("undecided",4);state.worldChanges=state.worldChanges||{};state.worldChanges.meadow="protected";},
      broken:()=>{effect({support:-5,trust:-9,integrity:-9,business:4,heat:5});shift("undecided",-7);}
    }
  };

  function ensureVoters(){
    state.voters=state.voters||{};
    for(const [id,def] of Object.entries(voterDefs||{})) state.voters[id]=state.voters[id]||{support:def.base,turnout:def.turnout};
  }

  function shift(id,amount){
    ensureVoters();
    const def=voterDefs[id];
    if(!def||!state.voters[id])return;
    state.voters[id].support=clamp((state.voters[id].support??def.base)+amount,0,100);
  }

  function promise(){
    state.flags=state.flags||{};
    return state.flags[PROMISE_KEY]||null;
  }

  function setPromise(value){
    state.flags=state.flags||{};
    state.flags[PROMISE_KEY]=value;
  }

  function addUi(){
    const actions=document.querySelector(".topbar .actions");
    if(actions&&!document.getElementById("promiseBtn")){
      const button=document.createElement("button");
      button.id="promiseBtn";
      button.className="btn small hidden";
      button.textContent="Velký volební slib";
      button.addEventListener("click",openPromise);
      actions.insertBefore(button,actions.firstChild);
    }

    if(!document.getElementById("promiseOverlay")){
      const overlay=document.createElement("div");
      overlay.id="promiseOverlay";
      overlay.className="overlay hidden";
      overlay.innerHTML='<div class="dialog" role="dialog" aria-modal="true"></div>';
      overlay.addEventListener("click",event=>{if(event.target===overlay)close();});
      document.body.appendChild(overlay);
    }

    const style=document.createElement("style");
    style.textContent=`
      #promiseOverlay .dialog{max-width:820px;text-align:left}
      #promiseBtn.urgent{animation:v0142pulse 1s infinite alternate}
      .promise-card{border:2px solid currentColor;padding:12px;margin:10px 0}
      .promise-cost{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;font-size:.9rem;opacity:.85}
      @keyframes v0142pulse{from{transform:translateY(0)}to{transform:translateY(-2px)}}
    `;
    document.head.appendChild(style);
  }

  function updateButton(){
    if(typeof state==="undefined")return;
    const button=document.getElementById("promiseBtn");
    if(!button)return;
    const p=promise();
    const canOffer=gameActive()&&!p&&state.day>=3&&state.day<=9;
    const canResolve=gameActive()&&p&&p.status==="active"&&state.day>=p.due-1;
    const visible=canOffer||canResolve;
    button.classList.toggle("hidden",!visible);
    button.classList.toggle("urgent",Boolean(canResolve&&state.day>=p.due));
    button.disabled=!visible||!mapReady()||state.actions<1;
    if(canOffer)button.textContent="Velký volební slib";
    if(canResolve)button.textContent=state.day>=p.due?"Slib hoří!":"Splnit volební slib";
    checkDeadline();
  }

  function openPromise(){
    if(!mapReady())return alert("Sliby se nejlépe rozdávají na mapě a za denního světla.");
    if(state.actions<1)return alert("Na velký slib už dnes nezbývá akce.");
    const p=promise();
    if(!p)return openOffer();
    if(p.status==="active")return openResolution(p);
  }

  function openOffer(){
    const dialog=document.querySelector("#promiseOverlay .dialog");
    dialog.innerHTML=`
      <p class="eyebrow">PROGRAMOVÁ OFENZIVA</p>
      <h2>Vyberte jeden velký volební slib</h2>
      <p>Okamžitě zvedne podporu. Za tři dny však přijde účet a voliči si překvapivě vzpomenou.</p>
      <div class="v0142-options">
        ${Object.entries(promiseDefs).map(([id,d])=>`<button class="btn v0142-option" data-promise="${id}"><strong>${d.icon} ${d.title}</strong><small>${d.pitch}</small></button>`).join("")}
      </div>
      <button class="btn small v0142-close" data-close>Ještě nic neslibovat</button>`;
    dialog.querySelectorAll("[data-promise]").forEach(button=>button.addEventListener("click",()=>makePromise(button.dataset.promise)));
    dialog.querySelector("[data-close]").addEventListener("click",close);
    document.getElementById("promiseOverlay").classList.remove("hidden");
  }

  function makePromise(id){
    const def=promiseDefs[id];
    if(!def||state.actions<1||promise())return;
    state.actions-=1;
    const due=Math.min(12,state.day+3);
    setPromise({id,title:def.title,created:state.day,due,status:"active",postponed:false});
    def.immediate();
    addNews(`${def.icon} Kandidát veřejně slíbil: ${def.title}. Termín je den ${due}.`,"normal");
    log(`Velký volební slib: ${def.title}. Termín den ${due}.`);
    finish();
  }

  function costText(cost){
    return Object.entries(cost).map(([key,value])=>`${key==="funds"?"peníze":"vliv"} ${value}`).join(" · ");
  }

  function canPay(cost){
    return Object.entries(cost).every(([key,value])=>Number(state.stats?.[key]||0)>=value);
  }

  function openResolution(p){
    const def=promiseDefs[p.id];
    const dialog=document.querySelector("#promiseOverlay .dialog");
    const late=state.day>=p.due;
    dialog.innerHTML=`
      <p class="eyebrow">${late?"SLIB HOŘÍ":"TERMÍN SE BLÍŽÍ"}</p>
      <h2>${def.icon} ${p.title}</h2>
      <p>Termín: den ${p.due}. Dnes je den ${state.day}. Tiskové oddělení už připravuje obě verze výsledku.</p>
      <div class="promise-card"><strong>Splnit slib</strong><div class="promise-cost">Cena: ${costText(def.cost)} · 1 akce</div></div>
      <div class="v0142-options">
        <button class="btn v0142-option" data-resolve="fulfill" ${canPay(def.cost)?"":"disabled"}><strong>✅ Zaplatit a splnit</strong><small>Výrazně zvedne důvěru a integritu.</small></button>
        <button class="btn v0142-option" data-resolve="postpone" ${p.postponed?"disabled":""}><strong>🗓️ Posunout termín o den</strong><small>−3 vliv, −2 důvěra. Odklad lze použít jen jednou.</small></button>
        <button class="btn v0142-option" data-resolve="break"><strong>✂️ Slib veřejně zrušit</strong><small>Menší škoda než tiché porušení, ale pořád škoda.</small></button>
      </div>
      <button class="btn small v0142-close" data-close>Nechat problém na stole</button>`;
    dialog.querySelectorAll("[data-resolve]").forEach(button=>button.addEventListener("click",()=>resolvePromise(button.dataset.resolve)));
    dialog.querySelector("[data-close]").addEventListener("click",close);
    document.getElementById("promiseOverlay").classList.remove("hidden");
  }

  function resolvePromise(choice){
    const p=promise();
    if(!p||p.status!=="active"||!mapReady()||state.actions<1)return close();
    const def=promiseDefs[p.id];

    if(choice==="fulfill"){
      if(!canPay(def.cost))return alert("Na splnění slibu chybí zdroje.");
      state.actions-=1;
      for(const [key,value] of Object.entries(def.cost))state.stats[key]-=value;
      p.status="fulfilled";
      def.fulfilled();
      addNews(`${def.icon} Volební slib byl skutečně splněn. Štáb chvíli nevěděl, jak takovou situaci komunikovat.`,"normal");
      log(`Splněný slib: ${p.title}.`);
    }else if(choice==="postpone"){
      if(p.postponed)return;
      state.actions-=1;
      p.due=Math.min(13,p.due+1);
      p.postponed=true;
      effect({influence:-3,trust:-2});
      addNews(`Termín slibu „${p.title}“ byl posunut na den ${p.due}. Oficiálně kvůli odpovědnému plánování.`,"bad");
      log(`Odklad slibu: ${p.title} do dne ${p.due}.`);
    }else{
      state.actions-=1;
      p.status="broken";
      effect({support:-3,trust:-6,integrity:-5,heat:3});
      addNews(`Kandidát zrušil slib „${p.title}“. Alespoň to udělal dřív, než jej zrušila realita.`,"bad");
      log(`Veřejně zrušený slib: ${p.title}.`);
    }
    finish();
  }

  function checkDeadline(){
    const p=promise();
    if(!p||p.status!=="active"||state.day<=p.due)return;
    p.status="broken";
    const def=promiseDefs[p.id];
    def.broken();
    addNews(`${def.icon} Termín slibu „${p.title}“ vypršel. Věčný už tiskne letáky s vaším citátem.`,"bad");
    log(`Nesplněný slib: ${p.title}.`);
    if(typeof renderAll==="function")renderAll();
    if(typeof autoSave==="function")autoSave();
  }

  function close(){document.getElementById("promiseOverlay")?.classList.add("hidden");}

  function finish(){
    close();
    if(typeof renderAll==="function")renderAll();
    if(typeof autoSave==="function")autoSave();
    updateButton();
  }

  function updateVersion(){
    document.title=`Koryto ${VERSION} – Živý politický svět`;
    const brand=document.querySelector(".brand h1 span");
    if(brand)brand.textContent=`Dolní Vejprnice ${VERSION}`;
    const description=document.querySelector('meta[name="description"]');
    if(description)description.content=`Koryto ${VERSION}: volební sliby s termíny, průzkumy, mediální krize a živé frakce.`;
  }

  addUi();
  updateVersion();
  updateButton();
  setInterval(updateButton,500);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
})();
