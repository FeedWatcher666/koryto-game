"use strict";
(() => {
  const VERSION = "0.14.9 TEST.10";
  const BUILD_VERSION = "0.14.9-test.10";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const ASSET_VERSION = "v0149-production-pass-1";
  const atlas = "embedded-css:v0149-atlas.png";
  const village = "embedded-css:v0149-village.png";
  const scenes = "embedded-css:v0149-scenes.png";
  const logo = "embedded-css:v0149-logo.png";
  let refreshQueued = false;

  const classCells = {
    bard:[0,1], rogue:[1,1], paladin:[2,1], mage:[3,1], technocrat:[4,1], necro:[5,1]
  };
  const companionCells = {
    marie:[0,2], daniela:[1,2], brazda:[2,2], bohumil:[3,2], holub:[4,2]
  };
  const locationCells = {
    pub:[0,0], townhall:[1,0], school:[2,0], paper:[3,0], jzd:[4,0], meadow:[5,0], hq:[6,0], pitch:[7,0]
  };
  const navCells = {
    map:[0,5], quests:[1,5], staff:[2,5], influence:[3,5], debate:[4,5], elections:[5,5], archive:[6,5], settings:[7,5]
  };
  const powerCells = {
    media:[0,4], office:[1,4], business:[2,4], countryside:[3,4], parents:[4,4], associations:[5,4]
  };
  const sceneCells = {
    staff:[0,0], influence:[1,0], debate:[2,0], coalition:[0,1], archive:[1,1], quest:[2,1], map:[2,1], meadow:[2,1]
  };

  const stateOf = () => globalThis.KorytoApp?.getState?.() || (typeof state !== "undefined" ? state : null);
  const companionDefs = () => globalThis.KorytoCompanionData?.companions || (typeof companions !== "undefined" ? companions : {});
  const classDefs = () => globalThis.KorytoCoreData?.classes || (typeof classes !== "undefined" ? classes : {});
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]);

  function setSprite(element, cell, kind = "portrait") {
    if (!element || !cell) return;
    element.classList.add("v0149-sprite", `v0149-${kind}`);
    element.style.setProperty("--sprite-x", String(cell[0]));
    element.style.setProperty("--sprite-y", String(cell[1]));
    element.dataset.v0149Sprite = `${cell[0]}:${cell[1]}`;
  }

  function heroClass(target = stateOf()) {
    return target?.hero?.classId && classCells[target.hero.classId] ? target.hero.classId : "bard";
  }

  function classFromName(text = "") {
    const defs = classDefs();
    return Object.entries(defs).find(([,def]) => text.includes(def.name))?.[0] || null;
  }

  function companionFromName(text = "") {
    const defs = companionDefs();
    return Object.entries(defs).find(([,def]) => text.includes(def.name))?.[0] || null;
  }

  function preload() { return true; }

  function decorateBrand() {
    const brand = document.querySelector(".topbar .brand");
    if (brand && !brand.querySelector(".v0149-mini-logo")) {
      brand.insertAdjacentHTML("afterbegin", `<span class="v0149-mini-logo" aria-hidden="true"></span>`);
    }
    const start = document.getElementById("startScreen");
    if (start) start.classList.add("v0149-start-art");
    const crest = start?.querySelector(".crest");
    if (crest) { crest.textContent = ""; crest.classList.add("v0149-title-logo"); }
  }

  function decorateCreation() {
    document.querySelectorAll(".class-card[data-class]").forEach(card => {
      const id = card.dataset.class;
      if (!classCells[id]) return;
      card.classList.add("v0149-class-card");
      let portrait = card.querySelector(".v0149-class-portrait");
      if (!portrait) {
        portrait = document.createElement("span");
        portrait.className = "v0149-class-portrait";
        card.prepend(portrait);
      }
      setSprite(portrait,classCells[id],"portrait");
      const oldIcon = Array.from(card.children).find(node => node.tagName === "SPAN" && !node.classList.contains("v0149-class-portrait"));
      if (oldIcon) oldIcon.classList.add("v0149-legacy-icon");
    });
  }

  function decorateHero() {
    const target = stateOf();
    const id = heroClass(target);
    const avatar = document.getElementById("avatar");
    if (avatar) {
      avatar.textContent = "";
      avatar.dataset.v0149Class = id;
      setSprite(avatar,classCells[id],"portrait");
    }
    const hud = document.getElementById("v0148Hud");
    if (hud) {
      let portrait = hud.querySelector(".v0149-hud-portrait");
      if (!portrait) {
        portrait = document.createElement("span");
        portrait.className = "v0149-hud-portrait";
        hud.querySelector("section")?.prepend(portrait);
      }
      setSprite(portrait,classCells[id],"portrait");
    }
  }

  function decorateMap() {
    const map = document.getElementById("map");
    if (!map) return;
    map.classList.add("v0149-village-map");
    map.querySelectorAll("[data-loc]").forEach(button => {
      const id = button.dataset.loc;
      if (!locationCells[id]) return;
      button.classList.add("v0149-location-node");
      button.style.setProperty("--sprite-x",String(locationCells[id][0]));
      button.style.setProperty("--sprite-y",String(locationCells[id][1]));
      button.dataset.v0149Location = id;
    });
    const target = stateOf();
    map.dataset.v0149Daypart = String(Math.max(0,Math.min(3,Math.floor(((Number(target?.day)||1)-1)/4))));
  }

  function decorateNavigation() {
    document.querySelectorAll("#v0148Nav [data-v0148]").forEach(button => {
      const id = button.dataset.v0148;
      const span = button.querySelector("span");
      if (!span || !navCells[id]) return;
      span.textContent = "";
      setSprite(span,navCells[id],"nav-icon");
    });
  }

  function decorateParty() {
    document.querySelectorAll("#partyList .party-item").forEach(item => {
      const id = companionFromName(item.textContent);
      if (!id || !companionCells[id]) return;
      item.dataset.v0149Companion = id;
      let portrait = item.querySelector(".v0149-party-portrait");
      if (!portrait) {
        portrait = document.createElement("span");
        portrait.className = "v0149-party-portrait";
        item.prepend(portrait);
      }
      setSprite(portrait,companionCells[id],"portrait");
    });
  }

  function decorateStaffDesk() {
    document.querySelectorAll(".v0148-staff-grid article").forEach(article => {
      const id = companionFromName(article.textContent);
      if (!id || !companionCells[id]) return;
      article.dataset.v0149Companion = id;
      const portrait = article.querySelector(".portrait");
      if (portrait) {
        portrait.textContent = "";
        setSprite(portrait,companionCells[id],"portrait");
      }
    });
  }

  function decoratePowerDesk() {
    const articles = document.querySelectorAll(".v0148-power-grid article");
    const keys = ["media","office","business","countryside","parents","associations"];
    articles.forEach((article,index) => {
      const key = keys[index];
      if (!key || !powerCells[key]) return;
      article.dataset.v0149Power = key;
      const icon = article.querySelector(":scope > span");
      if (icon) { icon.textContent = ""; setSprite(icon,powerCells[key],"power-icon"); }
    });
    const rival = document.querySelector(".v0148-rival h3");
    if (rival && !rival.querySelector(".v0149-rival-portrait")) {
      const portrait = document.createElement("span");
      portrait.className = "v0149-rival-portrait";
      setSprite(portrait,[0,3],"portrait");
      rival.prepend(portrait);
    }
  }

  function decorateDebate() {
    const target = stateOf();
    const player = document.getElementById("debatePlayerPortrait");
    if (player) { player.textContent = ""; setSprite(player,classCells[heroClass(target)],"portrait"); }
    const rival = document.querySelector("#debateScreen .debater:not(.player) .portrait");
    if (rival) { rival.textContent = ""; setSprite(rival,[0,3],"portrait"); }
    document.getElementById("debateScreen")?.classList.add("v0149-debate-stage");
  }

  function decorateScenes() {
    const target = stateOf();
    const loc = target?.currentLocation || "map";
    [document.getElementById("locationView"),document.getElementById("eventView")].forEach(view => {
      if (!view) return;
      view.dataset.v0149Location = loc;
      view.classList.add("v0149-scene-card");
      let banner = view.querySelector(":scope > .v0149-scene-banner");
      if (!banner && !view.classList.contains("hidden")) {
        banner = document.createElement("div");
        banner.className = "v0149-scene-banner";
        const meta = globalThis.KorytoCoreData?.locations?.[loc];
        banner.innerHTML = `<span class="v0149-banner-icon"></span><div><small>LOKACE</small><strong>${esc(meta?.name || "Dolní Vejprnice")}</strong></div>`;
        view.prepend(banner);
      }
      const icon = banner?.querySelector(".v0149-banner-icon");
      if (icon && locationCells[loc]) setSprite(icon,locationCells[loc],"location-icon");
    });
  }

  function decorateDeskHeaders() {
    document.querySelectorAll(".v0148-desk-head").forEach(header => {
      let key = "quest";
      if (header.classList.contains("art-staff")) key = "staff";
      else if (header.classList.contains("art-influence")) key = "influence";
      else if (header.classList.contains("art-debate")) key = "debate";
      else if (header.classList.contains("art-coalition")) key = "coalition";
      else if (header.classList.contains("art-archive")) key = "archive";
      header.dataset.v0149Scene = key;
      const cell = sceneCells[key];
      if (cell) {
        header.style.setProperty("--scene-x",String(cell[0]));
        header.style.setProperty("--scene-y",String(cell[1]));
      }
    });
  }

  function decorateEnding() {
    const ending = document.getElementById("endingScreen");
    if (!ending) return;
    ending.classList.add("v0149-ending-scene");
    const emoji = document.getElementById("endingEmoji");
    if (emoji) {
      emoji.textContent = "";
      setSprite(emoji,classCells[heroClass()],"portrait");
    }
  }

  function refresh() {
    if (typeof document === "undefined") return false;
    decorateBrand();
    decorateCreation();
    decorateHero();
    decorateMap();
    decorateNavigation();
    decorateParty();
    decorateStaffDesk();
    decoratePowerDesk();
    decorateDebate();
    decorateScenes();
    decorateDeskHeaders();
    decorateEnding();
    document.documentElement.dataset.korytoArt = ASSET_VERSION;
    return true;
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    setTimeout(() => { refreshQueued = false; refresh(); },0);
  }

  function install() {
    if (typeof document === "undefined") return false;
    preload();
    document.documentElement.classList.add("v0149-production-art");
    document.addEventListener("click",queueRefresh);
    document.addEventListener("change",queueRefresh);
    document.addEventListener("transitionend",queueRefresh);
    ["renderAll","renderMap","showMap","showLocation","showEvent","renderDebate","renderCoalition","newGame","load"].forEach(name => {
      const original = globalThis[name];
      if (typeof original !== "function" || original.__v0149) return;
      const wrapped = function(...args) { const result = original.apply(this,args); queueRefresh(); return result; };
      wrapped.__v0149 = true;
      globalThis[name] = wrapped;
    });
    queueRefresh();
    return true;
  }

  function visualAudit(target = stateOf()) {
    return {
      version:VERSION,
      buildVersion:BUILD_VERSION,
      saveVersion:SAVE_VERSION,
      saveSchema:SAVE_SCHEMA,
      assetVersion:ASSET_VERSION,
      assets:[atlas,village,scenes,logo],
      classSprites:Object.keys(classCells).length,
      companionSprites:Object.keys(companionCells).length,
      locationSprites:Object.keys(locationCells).length,
      navigationSprites:Object.keys(navCells).length,
      sceneTiles:Object.keys(sceneCells).length,
      ready:Boolean(target)
    };
  }

  const api = {VERSION,BUILD_VERSION,SAVE_VERSION,SAVE_SCHEMA,ASSET_VERSION,atlas,village,scenes,logo,classCells,companionCells,locationCells,navCells,powerCells,sceneCells,setSprite,refresh,queueRefresh,visualAudit,install};
  globalThis.KorytoPixelAssets149 = api;
  globalThis.KorytoTest149 = api;
  install();
})();
