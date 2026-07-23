"use strict";
(() => {
  const VERSION = "0.14.9 TEST.10";
  const BUILD_VERSION = "0.14.9-test.10";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const ASSET_VERSION = "v0149-production-pass-2";
  const ATLAS_COLUMNS = 8;
  const ATLAS_ROWS = 8;
  const REQUIRED_CHUNKS = Object.freeze({ atlas: 3, village: 2 });

  let refreshQueued = false;
  let installed = false;
  let assetReady = false;
  let assetError = "";
  let assetUrls = { atlas: "", village: "" };

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

  function chunkStore() {
    const store = globalThis.KorytoAssetChunks149;
    return store && typeof store === "object" ? store : {};
  }

  function assembleAsset(name) {
    const required = REQUIRED_CHUNKS[name] || 1;
    const parts = chunkStore()[name];
    if (!Array.isArray(parts) || parts.length !== required) {
      throw new Error(`${name}: očekáváno ${required} chunků, nalezeno ${Array.isArray(parts) ? parts.length : 0}`);
    }
    if (parts.some(part => typeof part !== "string" || !part.length || !/^[A-Za-z0-9+/=]+$/.test(part))) {
      throw new Error(`${name}: neplatný base64 chunk`);
    }
    const payload = parts.join("");
    if (!payload.startsWith("iVBORw0KGgo")) throw new Error(`${name}: datový proud není PNG`);
    return `data:image/png;base64,${payload}`;
  }

  function setAssetStatus(status, message = "") {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!root) return;
    root.dataset.korytoAssets = status;
    if (message) root.dataset.korytoAssetError = message;
    else delete root.dataset.korytoAssetError;
    root.classList?.toggle?.("v0149-production-art", status === "ready");
  }

  function preload() {
    if (assetReady) return true;
    if (typeof document === "undefined") return false;
    try {
      const atlas = assembleAsset("atlas");
      const village = assembleAsset("village");
      const root = document.documentElement;
      root?.style?.setProperty?.("--v0149-atlas", `url("${atlas}")`);
      root?.style?.setProperty?.("--v0149-village", `url("${village}")`);
      assetUrls = { atlas, village };
      assetReady = true;
      assetError = "";
      setAssetStatus("ready");
      return true;
    } catch (error) {
      assetReady = false;
      assetError = error instanceof Error ? error.message : String(error);
      setAssetStatus("error", assetError);
      console.error?.("Koryto v0.14.9 asset preload failed:", assetError);
      return false;
    }
  }

  function cellPercent(value, count) {
    const numeric = Math.max(0, Math.min(count - 1, Number(value) || 0));
    return `${(numeric * 100) / (count - 1)}%`;
  }

  function setSprite(element, cell, kind = "portrait") {
    if (!element || !cell) return false;
    element.classList?.add?.("v0149-sprite", `v0149-${kind}`);
    element.style?.setProperty?.("--sprite-x", String(cell[0]));
    element.style?.setProperty?.("--sprite-y", String(cell[1]));
    element.style?.setProperty?.("--sprite-left", cellPercent(cell[0], ATLAS_COLUMNS));
    element.style?.setProperty?.("--sprite-top", cellPercent(cell[1], ATLAS_ROWS));
    if (element.dataset) element.dataset.v0149Sprite = `${cell[0]}:${cell[1]}`;
    return true;
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

  function decorateBrand() {
    const brand = document.querySelector?.(".topbar .brand");
    if (brand && !brand.querySelector?.(".v0149-mini-logo")) {
      brand.insertAdjacentHTML?.("afterbegin", `<span class="v0149-mini-logo" aria-hidden="true"></span>`);
    }
    const start = document.getElementById?.("startScreen");
    if (start) start.classList?.add?.("v0149-start-art");
    const crest = start?.querySelector?.(".crest");
    if (crest) {
      crest.textContent = "";
      crest.classList?.add?.("v0149-title-logo");
      crest.setAttribute?.("aria-label", "Znak hry Koryto");
      crest.setAttribute?.("role", "img");
    }
  }

  function decorateCreation() {
    document.querySelectorAll?.(".class-card[data-class]")?.forEach(card => {
      const id = card.dataset?.class;
      if (!classCells[id]) return;
      card.classList?.add?.("v0149-class-card");
      let portrait = card.querySelector?.(".v0149-class-portrait");
      if (!portrait) {
        portrait = document.createElement?.("span");
        if (!portrait) return;
        portrait.className = "v0149-class-portrait";
        portrait.setAttribute?.("aria-hidden", "true");
        card.prepend?.(portrait);
      }
      setSprite(portrait, classCells[id], "portrait");
      const oldIcon = Array.from(card.children || []).find(node => node.tagName === "SPAN" && !node.classList?.contains?.("v0149-class-portrait"));
      if (oldIcon) oldIcon.classList?.add?.("v0149-legacy-icon");
    });
  }

  function decorateHero() {
    const target = stateOf();
    const id = heroClass(target);
    const avatar = document.getElementById?.("avatar");
    if (avatar) {
      avatar.textContent = "";
      if (avatar.dataset) avatar.dataset.v0149Class = id;
      setSprite(avatar, classCells[id], "portrait");
    }
    const hud = document.getElementById?.("v0148Hud");
    if (hud) {
      let portrait = hud.querySelector?.(".v0149-hud-portrait");
      if (!portrait) {
        portrait = document.createElement?.("span");
        if (!portrait) return;
        portrait.className = "v0149-hud-portrait";
        portrait.setAttribute?.("aria-hidden", "true");
        hud.querySelector?.("section")?.prepend?.(portrait);
      }
      setSprite(portrait, classCells[id], "portrait");
    }
  }

  function decorateMap() {
    const map = document.getElementById?.("map");
    if (!map) return;
    map.classList?.add?.("v0149-village-map");
    map.querySelectorAll?.("[data-loc]")?.forEach(button => {
      const id = button.dataset?.loc;
      if (!locationCells[id]) return;
      button.classList?.add?.("v0149-location-node");
      if (button.dataset) button.dataset.v0149Location = id;
      let icon = button.querySelector?.(".v0149-location-art");
      if (!icon) {
        icon = document.createElement?.("span");
        if (!icon) return;
        icon.className = "v0149-location-art";
        icon.setAttribute?.("aria-hidden", "true");
        button.prepend?.(icon);
      }
      setSprite(icon, locationCells[id], "location-icon");
    });
    const target = stateOf();
    if (map.dataset) map.dataset.v0149Daypart = String(Math.max(0, Math.min(3, Math.floor(((Number(target?.day) || 1) - 1) / 4))));
  }

  function decorateNavigation() {
    document.querySelectorAll?.("#v0148Nav [data-v0148]")?.forEach(button => {
      const id = button.dataset?.v0148;
      const span = button.querySelector?.("span");
      if (!span || !navCells[id]) return;
      span.textContent = "";
      span.setAttribute?.("aria-hidden", "true");
      setSprite(span, navCells[id], "nav-icon");
    });
  }

  function decorateParty() {
    document.querySelectorAll?.("#partyList .party-item")?.forEach(item => {
      const id = companionFromName(item.textContent);
      if (!id || !companionCells[id]) return;
      if (item.dataset) item.dataset.v0149Companion = id;
      let portrait = item.querySelector?.(".v0149-party-portrait");
      if (!portrait) {
        portrait = document.createElement?.("span");
        if (!portrait) return;
        portrait.className = "v0149-party-portrait";
        portrait.setAttribute?.("aria-hidden", "true");
        item.prepend?.(portrait);
      }
      setSprite(portrait, companionCells[id], "portrait");
    });
  }

  function decorateStaffDesk() {
    document.querySelectorAll?.(".v0148-staff-grid article")?.forEach(article => {
      const id = companionFromName(article.textContent);
      if (!id || !companionCells[id]) return;
      if (article.dataset) article.dataset.v0149Companion = id;
      const portrait = article.querySelector?.(".portrait");
      if (portrait) {
        portrait.textContent = "";
        setSprite(portrait, companionCells[id], "portrait");
      }
    });
  }

  function decoratePowerDesk() {
    const articles = document.querySelectorAll?.(".v0148-power-grid article") || [];
    const keys = ["media", "office", "business", "countryside", "parents", "associations"];
    articles.forEach((article,index) => {
      const key = keys[index];
      if (!key || !powerCells[key]) return;
      if (article.dataset) article.dataset.v0149Power = key;
      const icon = article.querySelector?.(":scope > span");
      if (icon) {
        icon.textContent = "";
        icon.setAttribute?.("aria-hidden", "true");
        setSprite(icon, powerCells[key], "power-icon");
      }
    });
    const rival = document.querySelector?.(".v0148-rival h3");
    if (rival && !rival.querySelector?.(".v0149-rival-portrait")) {
      const portrait = document.createElement?.("span");
      if (!portrait) return;
      portrait.className = "v0149-rival-portrait";
      portrait.setAttribute?.("aria-hidden", "true");
      setSprite(portrait, [0,3], "portrait");
      rival.prepend?.(portrait);
    }
  }

  function decorateDebate() {
    const target = stateOf();
    const player = document.getElementById?.("debatePlayerPortrait");
    if (player) {
      player.textContent = "";
      setSprite(player, classCells[heroClass(target)], "portrait");
    }
    const rival = document.querySelector?.("#debateScreen .debater:not(.player) .portrait");
    if (rival) {
      rival.textContent = "";
      setSprite(rival, [0,3], "portrait");
    }
    document.getElementById?.("debateScreen")?.classList?.add?.("v0149-debate-stage");
  }

  function decorateScenes() {
    const target = stateOf();
    const loc = target?.currentLocation || "map";
    [document.getElementById?.("locationView"), document.getElementById?.("eventView")].forEach(view => {
      if (!view) return;
      if (view.dataset) view.dataset.v0149Location = loc;
      view.classList?.add?.("v0149-scene-card");
      let banner = view.querySelector?.(":scope > .v0149-scene-banner");
      if (!banner && !view.classList?.contains?.("hidden")) {
        banner = document.createElement?.("div");
        if (!banner) return;
        banner.className = "v0149-scene-banner";
        const meta = globalThis.KorytoCoreData?.locations?.[loc];
        banner.innerHTML = `<span class="v0149-banner-icon" aria-hidden="true"></span><div><small>LOKACE</small><strong>${esc(meta?.name || "Dolní Vejprnice")}</strong></div>`;
        view.prepend?.(banner);
      }
      const icon = banner?.querySelector?.(".v0149-banner-icon");
      if (icon && locationCells[loc]) setSprite(icon, locationCells[loc], "location-icon");
    });
  }

  function decorateDeskHeaders() {
    document.querySelectorAll?.(".v0148-desk-head")?.forEach(header => {
      let key = "quest";
      if (header.classList?.contains?.("art-staff")) key = "staff";
      else if (header.classList?.contains?.("art-influence")) key = "influence";
      else if (header.classList?.contains?.("art-debate")) key = "debate";
      else if (header.classList?.contains?.("art-coalition")) key = "coalition";
      else if (header.classList?.contains?.("art-archive")) key = "archive";
      if (header.dataset) header.dataset.v0149Scene = key;
      const cell = sceneCells[key];
      if (cell) {
        header.style?.setProperty?.("--scene-x", String(cell[0]));
        header.style?.setProperty?.("--scene-y", String(cell[1]));
      }
    });
  }

  function decorateEnding() {
    const ending = document.getElementById?.("endingScreen");
    if (!ending) return;
    ending.classList?.add?.("v0149-ending-scene");
    const emoji = document.getElementById?.("endingEmoji");
    if (emoji) {
      emoji.textContent = "";
      setSprite(emoji, classCells[heroClass()], "portrait");
    }
  }

  function refresh() {
    if (typeof document === "undefined" || (!assetReady && !preload())) return false;
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
    if (document.documentElement?.dataset) document.documentElement.dataset.korytoArt = ASSET_VERSION;
    return true;
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    setTimeout(() => {
      refreshQueued = false;
      refresh();
    }, 0);
  }

  function renderVisualQa() {
    if (typeof location === "undefined" || !String(location.search || "").includes("visualqa=1")) return;
    if (document.getElementById?.("v0149VisualQa")) return;
    const panel = document.createElement?.("aside");
    if (!panel) return;
    panel.id = "v0149VisualQa";
    panel.className = "v0149-visual-qa";
    panel.innerHTML = `<button type="button" data-v0149-close aria-label="Zavřít vizuální audit">×</button><h2>Koryto ${VERSION}</h2><p>Offline produkční atlas a panorama obce.</p><div class="v0149-qa-village" aria-label="Panorama Dolních Vejprnic"></div><div class="v0149-qa-grid">${Object.entries({...classCells,...companionCells}).map(([id,cell]) => `<figure><span data-v0149-qa="${id}" data-x="${cell[0]}" data-y="${cell[1]}"></span><figcaption>${esc(id)}</figcaption></figure>`).join("")}</div>`;
    document.body?.append?.(panel);
    panel.querySelector?.("[data-v0149-close]")?.addEventListener?.("click", () => panel.remove?.());
    panel.querySelectorAll?.("[data-v0149-qa]")?.forEach(node => setSprite(node, [Number(node.dataset?.x), Number(node.dataset?.y)], "portrait"));
  }

  function install() {
    if (typeof document === "undefined") return false;
    if (installed) return assetReady;
    installed = true;
    preload();
    document.addEventListener?.("click", queueRefresh);
    document.addEventListener?.("change", queueRefresh);
    document.addEventListener?.("transitionend", queueRefresh);
    ["renderAll", "renderMap", "showMap", "showLocation", "showEvent", "renderDebate", "renderCoalition", "newGame", "load"].forEach(name => {
      const original = globalThis[name];
      if (typeof original !== "function" || original.__v0149) return;
      const wrapped = function(...args) {
        const result = original.apply(this,args);
        queueRefresh();
        return result;
      };
      wrapped.__v0149 = true;
      globalThis[name] = wrapped;
    });
    queueRefresh();
    renderVisualQa();
    return assetReady;
  }

  function visualAudit(target = stateOf()) {
    const chunks = chunkStore();
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      assetVersion: ASSET_VERSION,
      assets: {
        atlas: { ready: Boolean(assetUrls.atlas), parts: Array.isArray(chunks.atlas) ? chunks.atlas.length : 0, source: "embedded-png" },
        village: { ready: Boolean(assetUrls.village), parts: Array.isArray(chunks.village) ? chunks.village.length : 0, source: "embedded-png" },
        scenes: { ready: Boolean(assetUrls.village), source: "village-crops" },
        logo: { ready: true, source: "css-pixel-shield" }
      },
      classSprites: Object.keys(classCells).length,
      companionSprites: Object.keys(companionCells).length,
      locationSprites: Object.keys(locationCells).length,
      navigationSprites: Object.keys(navCells).length,
      sceneTiles: Object.keys(sceneCells).length,
      ready: assetReady,
      stateReady: Boolean(target),
      error: assetError || null
    };
  }

  const api = {
    VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, ASSET_VERSION,
    ATLAS_COLUMNS, ATLAS_ROWS, REQUIRED_CHUNKS,
    classCells, companionCells, locationCells, navCells, powerCells, sceneCells,
    assembleAsset, preload, setSprite, refresh, queueRefresh, visualAudit, install,
    get atlas() { return assetUrls.atlas; },
    get village() { return assetUrls.village; },
    get scenes() { return assetUrls.village; },
    get logo() { return "css:pixel-shield"; }
  };
  globalThis.KorytoPixelAssets149 = api;
  globalThis.KorytoTest149 = api;
  install();
})();
