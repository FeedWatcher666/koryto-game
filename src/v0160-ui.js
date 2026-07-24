"use strict";
(() => {
  const VERSION = "0.16.1 TEST.1";
  const BUILD_VERSION = "0.16.1-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;

  const POSITIONS = Object.freeze({
    pub: [27, 31],
    townhall: [44, 40],
    school: [71, 28],
    paper: [82, 55],
    pitch: [45, 78],
    jzd: [23, 76],
    meadow: [58, 49],
    hq: [69, 79]
  });

  const MOBILE_POSITIONS = Object.freeze({
    pub: [22, 29],
    townhall: [45, 38],
    school: [74, 28],
    paper: [79, 55],
    pitch: [45, 78],
    jzd: [21, 75],
    meadow: [56, 49],
    hq: [70, 79]
  });

  const LABELS = Object.freeze({
    pub: "Hospoda U TÅ™Ã­ lip",
    townhall: "Radnice",
    school: "Å kola",
    paper: "Redakce",
    pitch: "Stadion",
    jzd: "JZD a sÃ­dliÅ¡tÄ›",
    meadow: "NÃ¡mÄ›stÃ­ a louka",
    hq: "KulturnÃ­ dÅ¯m a Å¡tÃ¡b"
  });

  const SHORT_LABELS = Object.freeze({
    pub: "Hospoda",
    townhall: "Radnice",
    school: "Å kola",
    paper: "Redakce",
    pitch: "Stadion",
    jzd: "JZD",
    meadow: "NÃ¡mÄ›stÃ­",
    hq: "KulturnÃ­ dÅ¯m"
  });

  const LOCATION_ICONS = Object.freeze({
    pub: "ğŸº",
    townhall: "ğŸ›ï¸",
    school: "ğŸ«",
    paper: "ğŸ“°",
    pitch: "âš½",
    jzd: "ğŸšœ",
    meadow: "ğŸŒ³",
    hq: "ğŸ¢"
  });

  const DESKTOP_NAV = Object.freeze([
    ["map", "ğŸ—ºï¸", "Mapa"],
    ["quests", "ğŸ“œ", "Kauzy"],
    ["staff", "ğŸ‘¥", "Å tÃ¡b"],
    ["influence", "â™›", "Vliv"],
    ["debate", "ğŸ™ï¸", "Debata"],
    ["elections", "ğŸ—³ï¸", "Volby"],
    ["coalition", "ğŸ¤", "Koalice"],
    ["archive", "ğŸ—„ï¸", "Archiv"]
  ]);

  const MOBILE_NAV = Object.freeze([
    ["map", "ğŸ—ºï¸", "Mapa"],
    ["quests", "ğŸ“", "Kauzy"],
    ["staff", "ğŸ‘¥", "Å tÃ¡b"],
    ["influence", "â™›", "Vliv"],
    ["more", "â˜°", "DalÅ¡Ã­"]
  ]);

  const MORE_NAV = Object.freeze([
    ["debate", "ğŸ™ï¸", "Debata"],
    ["elections", "ğŸ—³ï¸", "Volby"],
    ["coalition", "ğŸ¤", "Koalice"],
    ["archive", "ğŸ—„ï¸", "Archiv"]
  ]);

  let installed = false;
  let queued = false;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = value => Math.max(0, Math.min(100, finite(value)));
  const stateOf = () => globalThis.KorytoApp?.getState?.() || globalThis.state || null;
  const locationsOf = () => globalThis.KorytoCoreData?.locations || {};
  const questDefsOf = () => globalThis.KorytoQuestData?.definitions || {};
  const companionsOf = () => globalThis.KorytoCompanionData?.companions || {};
  const companionStoriesOf = () => globalThis.KorytoCompanionData?.companionStoryDefs || {};
  const rivalDefsOf = () => globalThis.KorytoFactionData?.rivalOperationDefs || {};

  function money(value) {
    return `${Math.round(Math.max(0, finite(value)) * 10000).toLocaleString("cs-CZ")} KÄ`;
  }

  function deadline(id, target) {
    try {
      return globalThis.KorytoQuestRuntime?.deadline?.(id, target) ?? questDefsOf()[id]?.deadline ?? 13;
    } catch (_) {
      return questDefsOf()[id]?.deadline ?? 13;
    }
  }

  function activeQuests(target) {
    return Object.entries(target?.quests || {})
      .filter(([, quest]) => quest?.status === "active")
      .map(([id, quest]) => {
        const def = questDefsOf()[id] || {};
        return {
          id,
          title: def.title || id,
          desc: def.desc || "ObecnÃ­ problÃ©m ÄekÃ¡ na dalÅ¡Ã­ rozhodnutÃ­.",
          location: def.location || "townhall",
          stage: finite(quest.stage),
          left: deadline(id, target) - finite(target.day, 1)
        };
      })
      .sort((a, b) => a.left - b.left || a.title.localeCompare(b.title, "cs"));
  }

  function isMapActive(target) {
    return Boolean(
      document.getElementById("gameScreen")?.classList.contains("active") &&
      target?.phase === "map" &&
      !target.ended
    );
  }

  function resource(icon, label, value, width, kind = "") {
    return `<article class="k16-resource ${kind}"><span class="k16-resource-icon" aria-hidden="true">${icon}</span><span class="k16-resource-label">${esc(label)}</span><b>${esc(value)}</b><i><u style="width:${clamp(width)}%"></u></i></article>`;
  }

  function title(label, variant = "") {
    return `<h2 class="k16-panel-title ${variant}">${esc(label)}</h2>`;
  }

  function leftPanel(target, quests) {
    const primary = quests[0];
    const progress = primary ? Math.max(1, Math.min(5, primary.stage + 1)) : 0;
    return `<aside class="k16-left">
      <section class="k16-panel k16-case-panel">
        ${title(primary ? "AKTIVNÃ KAUZA" : "PÅ˜EHLED KAMPANÄš", "danger")}
        <div class="k16-case-primary">
          <div class="k16-case-hero" aria-hidden="true">ğŸ“‹</div>
          <div class="k16-case-copy">
            <h2>${esc(primary?.title || "Obec ÄekÃ¡ na dalÅ¡Ã­ tah")}</h2>
            <p>${esc(primary?.desc || "Vyberte na mapÄ› mÃ­sto, kde chcete pokraÄovat v kampani.")}</p>
            ${primary ? `<div class="k16-case-meta"><span>â—· TERMÃN</span><b>${primary.left <= 0 ? "DNES" : `${primary.left} dnÅ¯`}</b></div>` : ""}
          </div>
          ${primary ? `<div class="k16-progress"><span>POSTUP KAUZOU</span><b>${progress} / 5</b><i><u style="width:${progress * 20}%"></u></i></div>
            <button class="k16-action" type="button" data-k16-location="${esc(primary.location)}">ğŸ“ PÅ˜EJÃT NA MÃSTO</button>` : ""}
        </div>
        <div class="k16-desktop-only">
          ${title("DALÅ Ã KAUZY")}
          <div class="k16-list">
            ${quests.slice(primary ? 1 : 0, 5).map(item => `<button type="button" data-k16-location="${esc(item.location)}"><span class="mark">${item.left <= 2 ? "!" : "â€¢"}</span><span><b>${esc(item.title)}</b><small>${item.left <= 0 ? "po termÃ­nu" : `${item.left} dnÅ¯`}</small></span><strong>â€º</strong></button>`).join("") || '<p class="k16-empty">Å½Ã¡dnÃ¡ dalÅ¡Ã­ aktivnÃ­ kauza.</p>'}
          </div>
          <button class="k16-action secondary" type="button" data-k16-nav="quests">ZOBRAZIT VÅ ECHNY KAUZY</button>
        </div>
      </section>
    </aside>`;
  }

  function mapPanel(target, quests) {
    const locations = locationsOf();
    const counts = quests.reduce((all, quest) => {
      all[quest.location] = (all[quest.location] || 0) + 1;
      return all;
    }, {});
    const order = ["pub", "townhall", "school", "paper", "pitch", "jzd", "meadow", "hq"];

    return `<main class="k16-center">
      <section class="k16-map-card" aria-label="Mapa DolnÃ­ch Vejprnic">
        <div class="k16-map-banner"><span aria-hidden="true">ğŸ›¡ï¸</span>DOLNÃ VEJPRNICE</div>
        ${order.map(id => {
          const [x, y] = POSITIONS[id];
          const [mx, my] = MOBILE_POSITIONS[id];
          const count = counts[id] || 0;
          const long = SHORT_LABELS[id].length > 10 ? "long" : "";
          return `<button type="button" class="k16-hotspot ${count ? "hot" : ""} ${long}" data-k16-location="${id}" style="--x:${x}%;--y:${y}%;--mx:${mx}%;--my:${my}%" aria-label="${esc(LABELS[id])}" title="${esc(locations[id]?.name || LABELS[id])}"><span aria-hidden="true">${LOCATION_ICONS[id]}</span><b>${esc(SHORT_LABELS[id])}</b>${count ? `<em>${count}</em>` : ""}</button>`;
        }).join("")}
        <div class="k16-map-vignette" aria-hidden="true"></div>
      </section>
      <section class="k16-map-actions" aria-label="Akce na mapÄ›">
        <button type="button" data-k16-nav="archive">ğŸ“± <span>ZPRAVY</span></button>
        <button type="button" class="primary" data-k16-end>ğŸ‹ <span>UKONÄŒIT DEN</span></button>
        <button type="button" data-k16-nav="archive">ğŸ“» <span>PÅ˜EHLED DNE</span></button>
        <button type="button" data-k16-nav="influence">â™› <span>MAPA VLIVU</span></button>
      </section>
    </main>`;
  }

  function factionRow(label, value, kind = "") {
    const width = clamp((finite(value) + 100) / 2);
    return `<div class="k16-faction ${kind}"><span>${esc(label)}</span><i><u style="width:${width}%"></u></i><b>${Math.round(finite(value))}</b></div>`;
  }

  function keyPeople(target) {
    const companions = companionsOf();
    const stories = companionStoriesOf();
    const party = Object.entries(target.party || {}).slice(0, 4);
    const used = new Set(party.map(([id]) => id));
    const preview = Object.keys(companions)
      .filter(id => !used.has(id))
      .slice(0, Math.max(0, 4 - party.length))
      .map(id => [id, null]);
    const entries = [...party, ...preview].slice(0, 4);

    return entries.map(([id, member]) => {
      const companion = companions[id] || {};
      const story = stories[id] || {};
      const known = Boolean(member);
      const location = LABELS[story.location] || "v obci";
      const icon = companion.icon || member?.icon || "ğŸ‘„";
      const subtitle = known
        ? (member?.role || companion.role || Äšlen Å¡tÃ¡bu")
        : `PotjÃ¡te: ${location}`;
      const value = known ? `${Math.round(finite(member?.loyalty, 50))}%` : "?";
      return `<article class="${known ? "known" : "locked"}"><span class="avatar" aria-hidden="true">${esc(icon)}</span><span class="k16-person-copy"><b>${esc(member?.name || companion.name || id)}</b><small>${esc(subtitle)}</small></span><strong>${value}</strong></article>`;
    }).join("");
  }

  function rightPanel(target) {
    const operation = target.rivalOperation || {};
    const definition = rivalDefsOf()[operation.id] || {};
    const momentum = clamp(target.opponent?.momentum || 0);

    return `<aside class="k16-right">
      <section class="k16-panel k16-rival-panel">
        ${title("TLIK RIVALA", "danger")}
        <div class="k16-rival">
          <div class="k16-rival-head"><span class="k16-rival-face" aria-hidden="true">ğŸ•´ï¸</span><span><b>VladimÃ­r VÄ›ÄnÃ½</b><small>starosta a rival</small></span><strong>${Math.round(momentum)} %</strong></div>
          <i class="k16-track"><u style="width:${momentum}%"></u></i>
        </div>
        ${title("AKTUÃLNÃ STRATEGIE")}
        <div class="k16-strategy"><span aria-hidden="true">${esc(definition.icon || "ğŸ¤")}</span><div><b>${esc(operation.revealed ? (definition.name || operation.id || "SoupeÅŸÅ¯v tah") : "LidovÃ½ kontakt")}</b><p>${esc(operation.id ? (operation.revealed ? (definition.stages?.[Math.max(0, finite(operation.stage, 1) - 1)] || "SoupeÅ™ pÅ™ipravuje dalÅ¡Ã­ krok.") : "SoupeÅ™ koordinuje nekolik tahÅ­ a hledÃ¡ slabinu.") : "VÄ›ÄnÃ½ sbÃ­rÃ¡ vzorec vaÅich rozhodnutÃ­ a posiluje vlastnÃ­ sÃ­Å¤¸ˆ¥ôğ½Àøğ½‘¥Øøğ½‘¥Øø(€€€€€€€€ñ‘¥Ø±…ÍÌô‰¬ÄØµ‘•Í­Ñ½Àµ½¹±äˆø(€€€€€€€€€€‘íÑ¥Ñ±” ‰5AY1%YTˆ¥ô(€€€€€€€€€€ñ‘¥Ø±…ÍÌô‰¬ÄØµ™…Ñ¥½¹Ìˆø(€€€€€€€€€€€€‘í™…Ñ¥½¹I½Ü ‰=‹5…»¤ˆ°Ñ…É•Ğ¹™…Ñ¥½¹Ìü¹¥Ñ¥é•¹Ì¥ô(€€€€€€€€€€€€‘í™…Ñ¥½¹I½Ü ‰7¥‘¥„ˆ°Ñ…É•Ğ¹™…Ñ¥½¹Ìü¹ÁÉ•ÍÌ°€‰ÁÉ•ÍÌˆ¥ô(€€€€€€€€€€€€‘í™…Ñ¥½¹I½Ü ‰)iˆ°Ñ…É•Ğ¹™…Ñ¥½¹Ìü¹©é°€‰©éˆ¥ô(€€€€€€€€€€€€‘í™…Ñ¥½¹I½Ü ‰MÑ…Ë‡
¤ÍÑÉÕ­ÑÕÉäˆ°Ñ…É•Ğ¹™…Ñ¥½¹Ìü¹½±‘Õ…É°€‰½±‘Õ…Éˆ¥ô(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€ğ½‘¥Øø(€€€€€€€€‘íÑ¥Ñ±” ‰-34›5=[41%$ˆ¥ô(€€€€€€€€ñ‘¥Ø±…ÍÌô‰¬ÄØµÍÑ…™˜ˆø‘í­•åA•½Á±”¡Ñ…É•Ğ¥ôğ½‘¥Øø(€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÌô‰¬ÄØµ…Ñ¥½¸Í•½¹‘…Éä¬ÄØµ‘•Í­Ñ½Àµ½¹±äˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µ¬ÄØµ¹…Øô‰¥¹™±Õ•¹”ˆùi=	Ii%P5ATY1%YTğ½‰ÕÑÑ½¸ø(€€€€€€ğ½Í•Ñ¥½¸ø(€€€€ğ½…Í¥‘”ù€ì(€ô((€™Õ¹Ñ¥½¸‘•Í­Ñ½Á9…Ø ¤ì(€€€É•ÑÕÉ¸€ñ¹…Ø±…ÍÌô‰¬ÄØµ‰½ÑÑ½´¬ÄØµ‰½ÑÑ½´µ‘•Í­Ñ½Àˆ…É¥„µ±…‰•°ô‰!±…Ù»´¹…Ù¥…”ˆø‘íM-Q=A}9X¹µ…À ¡m¥°¥½¸°±…‰•±t¤€ôø€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÌôˆ‘í¥€ôôô€‰µ…Àˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ôˆ‘…Ñ„µ¬ÄØµ¹…Øôˆ‘í¥‘ôˆ€‘í¥€ôôô€‰µ…Àˆ€ü€…É¥„µÕÉÉ•¹Ğô‰Á…”ˆœ€è€ˆ‰ôøñÍÁ…¸…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆø‘í¥½¹ôğ½ÍÁ…¸øñˆø‘í±…‰•±ôğ½ˆøğ½‰ÕÑÑ½¸ù€¤¹©½¥¸ ˆˆ¥ôğ½¹…Øù€ì(€ô((€™Õ¹Ñ¥½¸µ½‰¥±•9…Ø ¤ì(€€€É•ÑÕÉ¸€ñ¹…Ø±…ÍÌô‰¬ÄØµ‰½ÑÑ½´¬ÄØµ‰½ÑÑ½´µµ½‰¥±”ˆ…É¥„µ±…‰•°ô‰5½‰¥±»´¹…Ù¥…”ˆø‘í5=	%1}9X¹µ…À ¡m¥°¥½¸°±…‰•±t¤€ôø€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÌôˆ‘í¥€ôôô€‰µ…Àˆ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ôˆ€‘í¥€ôôô€‰µ½É”ˆ€ü€‰‘…Ñ„µ¬ÄØµµ½É”ˆ€è‘…Ñ„µ¬ÄØµ¹…Øôˆ‘í¥‘ô‰ô€‘í¥€ôôô€‰µ…Àˆ€ü€…É¥„µÕÉÉ•¹Ğô‰Á…”ˆœ€è€ˆ‰ôøñÍÁ…¸…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆø‘í¥½¹ôğ½ÍÁ…¸øñˆø‘í±…‰•±ôğ½ˆøğ½‰ÕÑÑ½¸ù€¤¹©½¥¸ ˆˆ¥ôğ½¹…Øù€ì(€ô((€™Õ¹Ñ¥½¸µ½‰¥±•É…İ•È ¤ì(€€€É•ÑÕÉ¸€ñÍ•Ñ¥½¸±…ÍÌô‰¬ÄØµµ½É”µ‘É…İ•Èˆ‘…Ñ„µ¬ÄØµ‘É…İ•È¡¥‘‘•¸…É¥„µ±…‰•°ô‰…³‡´¡•É»´Í•­”ˆøñ¡•…‘•Èøñˆù3‡4M-ğ½ˆøñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µ¬ÄØµ±½Í”…É¥„µ±…‰•°ô‰i…ÛgµĞ¹…Ãµ‘­Ôˆû\ğ½‰ÕÑÑ½¸øğ½¡•…‘•Èøñ‘¥Øø‘í5=I}9X¹µ…À ¡m¥°¥½¸°±…‰•±t¤€ôø€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ‘…Ñ„µ¬ÄØµ¹…Øôˆ‘í¥‘ôˆøñÍÁ…¸…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆø‘í¥½¹ôğ½ÍÁ…¸øñˆø‘í±…‰•±ôğ½ˆøğ½‰ÕÑÑ½¸ù€¤¹©½¥¸ ˆˆ¥ôğ½‘¥Øøğ½Í•Ñ¥½¸ù€ì(€ô((€™Õ¹Ñ¥½¸•¹ÍÕÉ•I½½Ğ ¤ì(€€€±•ĞÉ½½Ğ€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰ØÀÄØÁI½½Ğˆ¤ì(€€€¥˜€ …É½½Ğ¤ì(€€€€€É½½Ğ€ô‘½Õµ•¹Ğ¹É•…Ñ•±•µ•¹Ğ ‰‘¥Øˆ¤ì(€€€€€É½½Ğ¹¥€ô€‰ØÀÄØÁI½½Ğˆì(€€€€€É½½Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°•Ù•¹Ğ€ôø•Ù•¹Ğ¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤¤ì(€€€€€‘½Õµ•¹Ğ¹‰½‘ä¹…ÁÁ•¹‘¡¥±¡É½½Ğ¤ì(€€€ô(€€€É•ÑÕÉ¸É½½Ğì(€ô((€™Õ¹Ñ¥½¸É•¹‘•È¡Ñ…É•Ğ¤ì(€€€½¹ÍĞÉ½½Ğ€ô•¹ÍÕÉ•I½½Ğ ¤ì(€€€½¹ÍĞÅÕ•ÍÑÌ€ô…Ñ¥Ù•EÕ•ÍÑÌ¡Ñ…É•Ğ¤ì(€€€½¹ÍĞÑÉÕÍĞ€ô±…µÀ¡Ñ…É•Ğ¹ÍÑ…ÑÌü¹ÑÉÕÍĞ¤ì(€€€½¹ÍĞ¥¹™±Õ•¹”€ô±…µÀ¡Ñ…É•Ğ¹ÍÑ…ÑÌü¹¥¹™±Õ•¹”¤ì(€€€½¹ÍĞ™Õ¹‘Ì€ô5…Ñ ¹µ…à À°™¥¹¥Ñ”¡Ñ…É•Ğ¹ÍÑ…ÑÌü¹™Õ¹‘Ì¤¤ì(€€€½¹ÍĞİ••­‘…åÌ€ôl‰A½¹“m³´ˆ°€‹iÑ•Ëôˆ°€‰MÓe•‘„ˆ°€‹1ÑÙÉÑ•¬ˆ°€‰C…Ñ•¬ˆ°€‰M½‰½Ñ„ˆ°€‰9•“m±”‰tì(€€€½¹ÍĞ‘…ä€ô5…Ñ ¹µ…à Ä°™¥¹¥Ñ”¡Ñ…É•Ğ¹‘…ä°€Ä¤¤ì((€€€É½½Ğ¹¥¹¹•É!Q50€ô€ñ‘¥Ø±…ÍÌô‰¬ÄØµÍ¡•±°ˆø(€€€€€€ñ¡•…‘•È±…ÍÌô‰¬ÄØµÑ½Á‰…Èˆø(€€€€€€€€ñÍ•Ñ¥½¸±…ÍÌô‰¬ÄØµ‘…äˆøñÍÁ…¸±…ÍÌô‰¬ÄØµİ•…Ñ¡•Èˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆûŠb¾â<ğ½ÍÁ…¸øñ‘¥Øøñˆù•¸€‘í‘…åôğ½ˆøñÍÁ…¸ø‘íİ••­‘…åÍl¡‘…ä€´€Ä¤€”€İuôğ½ÍÁ…¸øñÍµ…±°ù-ÛmÑ•¸°É½¬€ÈƒÜ€‘í5…Ñ ¹µ…à À°™¥¹¥Ñ”¡Ñ…É•Ğ¹…Ñ¥½¹Ì¤¥ô…­”ğ½Íµ…±°øğ½‘¥Øøñ‘¥Ø±…ÍÌô‰¬ÄØµÁ±…”ˆûŠ^½±»´Y•©ÁÉ¹¥”ğ½‘¥Øøğ½Í•Ñ¥½¸ø(€€€€€€€€ñÍ•Ñ¥½¸±…ÍÌô‰¬ÄØµ±½¼ˆøñÍÑÉ½¹œù-=IeQ<ğ½ÍÑÉ½¹œøñÍÁ…¸ùA=1%Q%/IAMQIQ%ğ½ÍÁ…¸øğ½Í•Ñ¥½¸ø(€€€€€€€€ñÍ•Ñ¥½¸±…ÍÌô‰¬ÄØµÉ•Í½ÕÉ•Ìˆø‘íÉ•Í½ÕÉ” ‹Â~’tˆ°€‰i[mIˆ°€‘í5…Ñ ¹É½Õ¹¡ÑÉÕÍĞ¥õ€°ÑÉÕÍĞ¥ô‘íÉ•Í½ÕÉ” ‹Šflˆ°€‰Y1%Xˆ°€‘í5…Ñ ¹É½Õ¹¡¥¹™±Õ•¹”¥õ€°¥¹™±Õ•¹”°€‰¥¹™±Õ•¹”ˆ¥ô‘íÉ•Í½ÕÉ” ‹Â~ªdˆ°€‰A;5iˆ°µ½¹•ä¡™Õ¹‘Ì¤°5…Ñ ¹µ¥¸ ÄÀÀ°™Õ¹‘Ì€¨€Ô¤°€‰µ½¹•äˆ¥ôğ½Í•Ñ¥½¸ø(€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ±…ÍÌô‰¬ÄØµÍ•ÑÑ¥¹Ìˆ‘…Ñ„µ¬ÄØµÍ•ÑÑ¥¹Ì…É¥„µ±…‰•°ô‰9…ÍÑ…Ù•»´ˆûŠjdğ½‰ÕÑÑ½¸ø(€€€€€€ğ½¡•…‘•Èø(€€€€€€ñ‘¥Ø±…ÍÌô‰¬ÄØµ±…å½ÕĞˆø‘í±•™ÑA…¹•°¡Ñ…É•Ğ°ÅÕ•ÍÑÌ¥ô‘íµ…ÁA…¹•°¡Ñ…É•Ğ°ÅÕ•ÍÑÌ¥ô‘íÉ¥¡ÑA…¹•°¡Ñ…É•Ğ¥ôğ½‘¥Øø(€€€€€€‘í‘•Í­Ñ½Á9…Ø ¥ô(€€€€€€‘íµ½‰¥±•9…Ø ¥ô(€€€€€€‘íµ½‰¥±•É…İ•È ¥ô(€€€€ğ½‘¥Øù€ì(€€€‰¥¹¡É½½Ğ¤ì(€ô((€™Õ¹Ñ¥½¸¹…Ù¥…Ñ”¡¹…µ”¤ì(€€€¥˜€¡¹…µ”€ôôô€‰µ…Àˆ¤ì(€€€€€±½‰…±Q¡¥Ì¹Í¡½İ5…Àü¸ ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡¹…µ”€ôôô€‰½…±¥Ñ¥½¸ˆ¤ì(€€€€€½¹ÍĞÑ…É•Ğ€ôÍÑ…Ñ•=˜ ¤ì(€€€€€¥˜€¡Ñ…É•Ğü¹½…±¥Ñ¥½¸ü¹…Ñ¥Ù”€˜˜ÑåÁ•½˜±½‰…±Q¡¥Ì¹Í¡½İ½…±¥Ñ¥½¹MÉ••¸€ôôô€‰™Õ¹Ñ¥½¸ˆ¤±½‰…±Q¡¥Ì¹Í¡½İ½…±¥Ñ¥½¹MÉ••¸ ¤ì(€€€€€•±Í”±½‰…±Q¡¥Ì¹-½ÉåÑ½Y¥ÍÕ…°ÄĞàü¹½Á•¹•Í¬ü¸ ‰•±•Ñ¥½¹Ìˆ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€±½‰…±Q¡¥Ì¹-½ÉåÑ½Y¥ÍÕ…°ÄĞàü¹½Á•¹•Í¬ü¸¡¹…µ”¤ì(€ô((€™Õ¹Ñ¥½¸‰¥¹¡É½½Ğ¤ì(€€€É½½Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ‰m‘…Ñ„µ¬ÄØµ±½…Ñ¥½¹tˆ¤¹™½É… ¡‰ÕÑÑ½¸€ôø‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°€ ¤€ôø±½‰…±Q¡¥Ì¹Í¡½İ1½…Ñ¥½¸ü¸¡‰ÕÑÑ½¸¹‘…Ñ…Í•Ğ¹¬ÄÙ1½…Ñ¥½¸¤¤¤ì(€€€É½½Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ‰m‘…Ñ„µ¬ÄØµ¹…Ùtˆ¤¹™½É… ¡‰ÕÑÑ½¸€ôø‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°€ ¤€ôøì(€€€€€½¹ÍĞ‘É…İ•È€ôÉ½½Ğ¹ÅÕ•ÉåM•±•Ñ½È ‰m‘…Ñ„µ¬ÄØµ‘É…İ•Étˆ¤ì(€€€€€¥˜€¡‘É…İ•È¤‘É…İ•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€€€¹…Ù¥…Ñ”¡‰ÕÑÑ½¸¹‘…Ñ…Í•Ğ¹¬ÄÙ9…Ø¤ì(€€€ô¤¤ì(€€€É½½Ğ¹ÅÕ•ÉåM•±•Ñ½È ‰m‘…Ñ„µ¬ÄØµ•¹‘tˆ¤ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°€ ¤€ôø‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰•¹‘…å	Ñ¸ˆ¤ü¹±¥¬ ¤¤ì(€€€É½½Ğ¹ÅÕ•ÉåM•±•Ñ½È ‰m‘…Ñ„µ¬ÄØµÍ•ÑÑ¥¹Ítˆ¤ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°€ ¤€ôø‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰Á¥á•±Q½±”ˆ¤ü¹±¥¬ ¤¤ì(€€€É½½Ğ¹ÅÕ•ÉåM•±•Ñ½È¡m‘…Ñ„µ¬ÄØµµ½É•tˆ¤ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°€ ¤€ôøì(€€€€€½¹ÍĞ‘É…İ•È€ôÉ½½Ğ¹ÅÕ•ÉåM•±•Ñ½È¡m‘…Ñ„µ¬ÄØµ‘É…İ•Étˆ¤ì(€€€€€¥˜€ …‘É…İ•È¤É•ÑÕÉ¸ì(€€€€€‘É…İ•È¹¡¥‘‘•¸€ô€…‘É…İ•È¹¡¥‘‘•¸ì(€€€ô¤ì(€€€É½½Ğ¹ÅÕ•ÉåM•±•Ñ½È¡m‘…Ñ„µ¬ÄØµ±½Í•tˆ¤ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°€ ¤€ôøì(€€€€€½¹ÍĞ‘É…İ•È€ôÉ½½Ğ¹ÅÕ•ÉåM•±•Ñ½È ‰m‘…Ñ„µ¬ÄØµ‘É…İ•Étˆ¤ì(€€€€€¥˜€¡‘É…İ•È¤‘É…İ•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€ô¤ì(€ô((€™Õ¹Ñ¥½¸…¹½¹¥…±1…‰•±Ì ¤ì(€€€½¹ÍĞÁ…•Q¥Ñ±”€ô-½ÉåÑ¼€‘íYIM%=9ôƒŠL±•…¸U$1…å½ÕĞA½±¥Í¡€ì(€€€‘½Õµ•¹Ğ¹Ñ¥Ñ±”€ôÁ…•Q¥Ñ±”ì(€€€‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È µ•Ñ…m¹…µ”ô‰‘•ÍÉ¥ÁÑ¥½¸‰tœ¤ü¹Í•ÑÑÑÉ¥‰ÕÑ” ‰½¹Ñ•¹Ğˆ°-½ÉåÑ¼€‘íYIM%=9ôèÉ•ÍÁ½¹é¥Ù»´­½µÁ½¹•¹Ñ½ÛôÉ•‰Õ¥±¡±…Ù»´µ…ÁäÁÉ¼‘•Í­Ñ½À°Ñ…‰±•Ğ„µ½‰¥°¹€¤ì(€ô((€™Õ¹Ñ¥½¸É•™É•Í  ¤ì(€€€¥˜€¡ÑåÁ•½˜‘½Õµ•¹Ğ€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸™…±Í”ì(€€€½¹ÍĞÑ…É•Ğ€ôÍÑ…Ñ•=˜ ¤ì(€€€½¹ÍĞ…Ñ¥Ù”€ô¥Í5…ÁÑ¥Ù”¡Ñ…É•Ğ¤ì(€€€‘½Õµ•¹Ğ¹‘½Õµ•¹Ñ±•µ•¹Ğ¹±…ÍÍ1¥ÍĞ¹Ñ½±” ‰¬ÄØµ…Ñ¥Ù”ˆ°…Ñ¥Ù”¤ì(€€€½¹ÍĞÉ½½Ğ€ô•¹ÍÕÉ•I½½Ğ ¤ì(€€€É½½Ğ¹¡¥‘‘•¸€ô€……Ñ¥Ù”ì(€€€¥˜€¡…Ñ¥Ù”¤É•¹‘•È¡Ñ…É•Ğ¤ì(€€€…¹½¹¥…±1…‰•±Ì ¤ì(€€€É•ÑÕÉ¸…Ñ¥Ù”ì(€ô((€™Õ¹Ñ¥½¸ÅÕ•Õ•I•™É•Í  ¤ì(€€€¥˜€¡ÅÕ•Õ•¤É•ÑÕÉ¸ì(€€€ÅÕ•Õ•€ôÑÉÕ”ì(€€€Í•ÑQ¥µ•½ÕĞ  ¤€ôøì(€€€€€ÅÕ•Õ•€ô™…±Í”ì(€€€€€É•™É•Í  ¤ì(€€€ô°€À¤ì(€ô((€™Õ¹Ñ¥½¸İÉ…À¡¹…µ”¤ì(€€€½¹ÍĞ½É¥¥¹…°€ô±½‰…±Q¡¥Ím¹…µ•tì(€€€¥˜€¡ÑåÁ•½˜½É¥¥¹…°€„ôô€‰™Õ¹Ñ¥½¸ˆñğ½É¥¥¹…°¹}}ØÀÄØÁ]É…ÁÁ•¤É•ÑÕÉ¸ì(€€€½¹ÍĞİÉ…ÁÁ•€ô™Õ¹Ñ¥½¸€ ¸¸¹…ÉÌ¤ì(€€€€€½¹ÍĞÉ•ÍÕ±Ğ€ô½É¥¥¹…°¹…ÁÁ±ä¡Ñ¡¥Ì°…ÉÌ¤ì(€€€€€ÅÕ•Õ•I•™É•Í  ¤ì(€€€€€É•ÑÕÉ¸É•ÍÕ±Ğì(€€€ôì(€€€İÉ…ÁÁ•¹}}ØÀÄØÁ]É…ÁÁ•€ôÑÉÕ”ì(€€€±½‰…±Q¡¥Í¹…µ•t€ôİÉ…ÁÁ•ì(€ô((€™Õ¹Ñ¥½¸Ù¥ÍÕ…±Õ‘¥Ğ¡Ñ…É•Ğ€ôÍÑ…Ñ•=˜ ¤¤ì(€€€É•ÑÕÉ¸ì(€€€€€Ù•ÉÍ¥½¸èYIM%=8°(€€€€€‰Õ¥±‘Y•ÉÍ¥½¸è	U%1}YIM%=8°(€€€€€Í…Ù•Y•ÉÍ¥½¸èMY}YIM%=8°(€€€€€Í…Ù•M¡•µ„èMY}M!5°(€€€€€…Ñ¥Ù”è¥Í5…ÁÑ¥Ù”¡Ñ…É•Ğ¤°(€€€€€É½½Ğè	½½±•…¸¡‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ‰ØÀÄØÁI½½Ğˆ¤¤°(€€€€€¡½ÑÍÁ½ÑÌè‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ˆØÀÄØÁI½½Ğ€¹¬ÄØµ¡½ÑÍÁ½Ğˆ¤¹±•¹Ñ °(€€€€€±•…åÁÁ!¥‘‘•¸è‘½Õµ•¹Ğ¹‘½Õµ•¹Ñ±•µ•¹Ğ¹±…ÍÍ1¥ÍĞ¹½¹Ñ…¥¹Ì ‰¬ÄØµ…Ñ¥Ù”ˆ¤°(€€€€€­•åA•½Á±”è‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ˆØÀÄØÁI½½Ğ€¹¬ÄØµÍÑ…™˜…ÉÑ¥±”ˆ¤¹±•¹Ñ °(€€€€€‘•Í­Ñ½Á9…Ù%Ñ•µÌè‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ˆØÀÄØÁI½½Ğ€¹¬ÄØµ‰½ÑÑ½´µ‘•Í­Ñ½À‰ÕÑÑ½¸ˆ¤¹±•¹Ñ °(€€€€€µ½‰¥±•9…Ù%Ñ•µÌè‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ˆØÀÄØÁI½½Ğ€¹¬ÄØµ‰½ÑÑ½´µµ½‰¥±”‰ÕÑÑ½¸ˆ¤¹±•¹Ñ °(€€€€€µ½‰¥±•É…İ•É%Ñ•µÌè‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½É±° ˆØÀÄØÁI½½Ğ€¹¬ÄØµµ½É”µ‘É…İ•Èm‘…Ñ„µ¬ÄØµ¹…Ùtˆ¤¹±•¹Ñ °(€€€€€ÅÕ•ÍÑ½Õ¹Ğè…Ñ¥Ù•EÕ•ÍÑÌ¡Ñ…É•Ğ¤¹±•¹Ñ °(€€€€€±…å½ÕÑA½±¥Í èÑÉÕ”°(€€€€€É•ÍÁ½¹Í¥Ù”èÑÉÕ”(€€€ôì(€ô((€™Õ¹Ñ¥½¸¥¹ÍÑ…±° ¤ì(€€€¥˜€¡¥¹ÍÑ…±±•ñğÑåÁ•½˜‘½Õµ•¹Ğ€ôôô€‰Õ¹‘•™¥¹•ˆ¤É•ÑÕÉ¸¥¹ÍÑ…±±•ì(€€€¥¹ÍÑ…±±•€ôÑÉÕ”ì(€€€l‰É•¹‘•É±°ˆ°€‰Í¡½İ5…Àˆ°€‰Í¡½İ1½…Ñ¥½¸ˆ°€‰Í¡½İÙ•¹Ğˆ°€‰¹•İ…µ”ˆ°€‰±½…ˆ°€‰™¥¹¥Í¡•‰…Ñ”ˆ°€‰Í¡½İ½…±¥Ñ¥½¹MÉ••¸‰t¹™½É… ¡İÉ…À¤ì(€€€‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°ÅÕ•Õ•I•™É•Í ¤ì(€€€‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¡…¹”ˆ°ÅÕ•Õ•I•™É•Í ¤ì(€€€ÅÕ•Õ•I•™É•Í  ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô((€½¹ÍĞ…Á¤€ôì(€€€YIM%=8°(€€€	U%1}YIM%=8°(€€€MY}YIM%=8°(€€€MY}M!5°(€€€A=M%Q%=9L°(€€€5=	%1}A=M%Q%=9L°(€€€1	1L°(€€€M!=IQ}1	1L°(€€€1=Q%=9}%=9L°(€€€…Ñ¥Ù•EÕ•ÍÑÌ°(€€€É•™É•Í °(€€€ÅÕ•Õ•I•™É•Í °(€€€Ù¥ÍÕ…±Õ‘¥Ğ°(€€€¥¹ÍÑ…±°(€ôì((€±½‰…±Q¡¥Ì¹-½ÉåÑ½U$ÄØÀ€ô…Á¤ì(€±½‰…±Q¡¥Ì¹-½ÉåÑ½Q•ÍĞÄØÀ€ô…Á¤ì(€¥¹ÍÑ…±° ¤ì)ô¤ ¤