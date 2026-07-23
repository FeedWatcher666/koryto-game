"use strict";
(() => {
  const C = globalThis.KorytoVisual150Core = globalThis.KorytoVisual150Core || {};
  const VERSION = "0.15.0 TEST.1";
  const BUILD_VERSION = "0.15.0-test.1";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const WEEKDAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
  const WEATHER = [
    { icon: "☀", label: "Slunečno", temp: 22 },
    { icon: "🌤", label: "Polojasno", temp: 20 },
    { icon: "🌦", label: "Přeháňky", temp: 17 },
    { icon: "☁", label: "Zataženo", temp: 16 }
  ];
  const nav = [
    ["map", "🗺", "Mapa"],
    ["quests", "📜", "Questy"],
    ["staff", "👥", "Štáb"],
    ["influence", "♟", "Vliv"],
    ["debate", "🎙", "Debata"],
    ["elections", "🗳", "Volby"],
    ["archive", "📚", "Archiv"]
  ];
  const mapPositions = {
    pub: [15, 34],
    townhall: [50, 31],
    school: [70, 34],
    paper: [87, 42],
    jzd: [15, 71],
    meadow: [45, 70],
    hq: [79, 74],
    pitch: [67, 53]
  };
  const mapLabels = {
    pub: "HOSPODA",
    townhall: "RADNICE",
    school: "ŠKOLA",
    paper: "REDAKCE",
    jzd: "JZD",
    meadow: "LOUKA",
    hq: "ŠTÁB",
    pitch: "HŘIŠTĚ"
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  })[char]);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = value => Math.max(0, Math.min(100, finite(value)));
  const stateOf = () => globalThis.KorytoApp?.getState?.() || (typeof state !== "undefined" ? state : null);
  const questDefsOf = () => globalThis.KorytoQuestData?.definitions || (typeof questDefs !== "undefined" ? questDefs : {});
  const companionDefsOf = () => globalThis.KorytoCompanionData?.companions || (typeof companions !== "undefined" ? companions : {});
  const factionDefsOf = () => globalThis.KorytoFactionData?.rivalOperationDefs || {};
  const money = value => `${Math.round(Math.max(0, finite(value)) * 10000).toLocaleString("cs-CZ")} Kč`;

  function activeQuests(target = stateOf()) {
    if (!target) return [];
    const defs = questDefsOf();
    return Object.entries(target.quests || {})
      .filter(([, item]) => item?.status === "active")
      .map(([id, item]) => {
        const def = defs[id] || { title: id, desc: "Politická kauza", location: "townhall", deadline: 13 };
        const due = finite(def.deadline, 13) + finite(item.deadlineBonus);
        return { id, ...def, stage: finite(item.stage), due, left: due - finite(target.day, 1) };
      })
      .sort((a, b) => a.left - b.left || a.title.localeCompare(b.title, "cs"));
  }

  function phaseOf(target = stateOf()) {
    if (document.getElementById("debateScreen")?.classList.contains("active")) return "debate";
    if (document.getElementById("coalitionScreen")?.classList.contains("active")) return "coalition";
    if (document.getElementById("endingScreen")?.classList.contains("active")) return "ending";
    if (document.getElementById("creationScreen")?.classList.contains("active")) return "creation";
    if (document.getElementById("startScreen")?.classList.contains("active")) return "start";
    return target?.phase || "map";
  }

  function statBar(id, label, value, variant, display = Math.round(clamp(value))) {
    return `<div class="v0150-stat v0150-stat-${variant}">
      <span class="v0150-stat-label">${label}</span>
      <i class="v0150-stat-track"><u id="${id}Bar" style="width:${clamp(value)}%"></u></i>
      <b id="${id}">${display}</b>
    </div>`;
  }

  Object.assign(C, { VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, WEEKDAYS, WEATHER, nav, mapPositions, mapLabels, esc, finite, clamp, stateOf, questDefsOf, companionDefsOf, factionDefsOf, money, activeQuests, phaseOf, statBar });
})();
