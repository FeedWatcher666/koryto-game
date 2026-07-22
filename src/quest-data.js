"use strict";
(() => {
  const VERSION = "0.14.3 TEST.4";
  const BUILD_VERSION = "0.14.3-test.10";
  const definitions = {
 register:{title:"Kandidátní listina",deadline:4,desc:"Získat podporu a podat kandidátku.",location:"townhall",failure:"Nouzové podání: −5 peněz, −7 důvěry, +8 mediálního tlaku."},
 diesel:{title:"Nafta z JZD",deadline:5,desc:"Zjistit, proč družstevní nádrž hubne rychleji než rozpočet.",location:"jzd",failure:"Věčný převezme kauzu a audit se vrátí jako komplikace."},
 roof:{title:"Střecha školy",deadline:7,desc:"Do školy zatéká a děti se učí hydrologii prakticky.",location:"school",failure:"Zavře se třída, klesne podpora a přijde nouzová oprava."},
 meadow:{title:"Poslední louka",deadline:9,desc:"Developer chce veřejný pozemek pro logistický park s komunitním přesahem.",location:"meadow",failure:"Na louku vjede bagr a protest se stane samostatným problémem."},
 paper:{title:"Obecní zpravodaj",deadline:10,desc:"Rozhodnout, zda bude informovat, nebo správně informovat.",location:"paper",failure:"Věčný ovládne celé číslo a média ztratí důvěru."},
 oldfiles:{title:"Skříň označená ÚKLID",deadline:11,desc:"Bohumil tvrdí, že archiv obsahuje historii i budoucí trestní řízení.",location:"townhall",failure:"Archiv zmizí a staré struktury zesílí."},
 water:{title:"Voda barvy volebního programu",deadline:11,desc:"Rozbor našel bakterie. Obec zatím našla tiskového mluvčího.",location:"school",failure:"Hygiena zavře školní kuchyň a Věčný rozdává balenou vodu s vlastní fotografií."},
 budget:{title:"Rozpočet ve tři ráno",deadline:12,desc:"Věčný chce před volbami schválit balík výdajů, který nikdo nestihl přečíst.",location:"townhall",failure:"Balík projde bez vás a obec zdědí chytrou lavičku za cenu garsonky."},
 debate:{title:"Velká hospodská debata",deadline:12,desc:"Vladimír Věčný chce veřejně dokázat, že jste dítě bez razítka.",location:"pub",failure:"Věčný vyhraje bez soupeře: −8 podpory a posílení starých struktur."},
 waste:{title:"Popelnicové povstání",deadline:13,desc:"Svozová firma hrozí, že před volbami nechá obec dozrát na slunci.",location:"pitch",failure:"Náves zaplní pytle, mouchy a Věčného slogan, že za něj se odpad odvážel."},
 ballots:{title:"Hlasovací lístky bez kandidáta",deadline:13,desc:"Tiskárna vynechala vaše jméno a dvakrát vytiskla Věčného.",location:"townhall",failure:"Chyba se opraví pozdě a část voličů dostane návod k volbě místo lístku."}
};
  const clone = value => JSON.parse(JSON.stringify(value));
  function install() {
    if (typeof questDefs !== "undefined" && questDefs && typeof questDefs === "object") {
      for (const key of Object.keys(questDefs)) delete questDefs[key];
      Object.assign(questDefs, clone(definitions));
      return questDefs;
    }
    return clone(definitions);
  }
  function signature(value = definitions) {
    const text = JSON.stringify(value);
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }
  function validate() {
    const issues = [];
    for (const [id, def] of Object.entries(definitions)) {
      if (!def || typeof def !== "object") { issues.push(`${id}: definice není objekt`); continue; }
      if (!def.title || !def.desc || !def.failure) issues.push(`${id}: chybí text`);
      if (!Number.isInteger(def.deadline) || def.deadline < 1 || def.deadline > 14) issues.push(`${id}: termín mimo kampaň`);
      if (typeof locations !== "undefined" && !locations[def.location]) issues.push(`${id}: neznámá lokace`);
    }
    return issues;
  }
  install();
  globalThis.KorytoQuestData = { VERSION, BUILD_VERSION, definitions, cloneDefinitions:() => clone(definitions), install, signature, validate };
})();
