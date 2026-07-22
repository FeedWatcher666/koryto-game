"use strict";
(() => {
  const VERSION = "0.14.3 TEST.7";
  const plans = {
 oldguard:{name:"Operace Návrat",icon:"🕰️",owner:"Vladimír Věčný",location:"townhall",steps:["Obvolat věrné seniory","Uzamknout volební komisi","Spojit malé kandidátky","Převzít povolební radu"]},
 jzd:{name:"Traktorová mobilizace",icon:"🚜",owner:"Oldřich Brázda",location:"jzd",steps:["Sepsat zaměstnance","Vyčistit stopy po naftě","Přivézt voliče traktorem","Požadovat zemědělský výbor"]},
 business:{name:"Projekt SILO",icon:"🏗️",owner:"Richard Holub",location:"meadow",steps:["Zaměřit louku","Připravit školní dodatek","Propojit JZD s logistikou","Podepsat smlouvu po volbách"]},
 press:{name:"Spis Vejprnice",icon:"📰",owner:"Daniela Špičková",location:"paper",steps:["Sbírat rozpory","Ověřit vlastnické vazby","Najít účetní stopu","Vydat předvolební speciál"]}
};
  const conspiracy = {diesel:"Nafta z JZD financovala dopravu a černou kampaň.",roof:"Školní zakázka obsahuje dodatek stejné poradenské firmy.",meadow:"Louku má převzít společnost napojená na Holubův logistický fond.",archive:"Archiv dokládá, že Věčný připravoval propojení projektů několik let."};
  const coalitionPartners = {
 civic:{name:"Občanská jednota",icon:"🕊️",motto:"Smlouvy na web a děti mimo billboard.",resource:"credibility",demand:"Veřejný audit a školský výbor",tags:["ethical","transparent"]},
 rural:{name:"Venkovská dohoda",icon:"🚜",motto:"Obec se nerozvíjí bez lidí, kteří vlastní traktory.",resource:"patronage",demand:"Zemědělský výbor a ochrana JZD",tags:["jzdDeal","power"]},
 progress:{name:"Rozvoj pro Vejprnice",icon:"🏗️",motto:"Budoucnost musí někdo postavit a někdo vyfakturovat.",resource:"patronage",demand:"Investiční výbor a pokračování Projektu SILO",tags:["contract","business"]},
 oldguard:{name:"Věčného seznam",icon:"🕰️",motto:"Stabilita je změna, která se nekonala.",resource:"pressure",demand:"Místostarosta pro Věčného a klid na staré smlouvy",tags:["power","oldguard"]}
};
  const clone = value => JSON.parse(JSON.stringify(value));
  function replace(target, source) { for (const key of Object.keys(target||{})) delete target[key]; Object.assign(target, clone(source)); }
  function install() {
    if (typeof factionPlanDefs !== "undefined") replace(factionPlanDefs,plans);
    if (typeof conspiracyPieces !== "undefined") replace(conspiracyPieces,conspiracy);
    if (typeof coalitionPartnerDefs !== "undefined") replace(coalitionPartnerDefs,coalitionPartners);
  }
  function validate() {
    const issues=[];
    for(const [id,def] of Object.entries(plans)){if(!def.name||!def.owner||!def.location)issues.push(`${id}: neúplný plán`);if(!Array.isArray(def.steps)||def.steps.length!==4)issues.push(`${id}: plán nemá čtyři kroky`);}
    for(const [id,def] of Object.entries(coalitionPartners)){if(!def.name||!def.resource||!Array.isArray(def.tags))issues.push(`${id}: neúplný koaliční partner`);}
    return issues;
  }
  function status(target=state){return Object.entries(plans).map(([id,def])=>{const current=target?.factionPlans?.[id]||{};return {id,...def,progress:Number(current.progress)||0,stage:Number(current.stage)||0};}).sort((a,b)=>b.progress-a.progress);}
  function leadingThreat(target=state){return status(target)[0]||null;}
  install();
  globalThis.KorytoFactionSystem={VERSION,plans,conspiracy,coalitionPartners,install,validate,status,leadingThreat,clone:()=>({plans:clone(plans),conspiracy:clone(conspiracy),coalitionPartners:clone(coalitionPartners)})};
})();
