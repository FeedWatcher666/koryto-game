"use strict";
(() => {
  const VERSION = "0.14.4 TEST.4";
const factionPlanDefs={
 oldguard:{name:"Operace Návrat",icon:"🕰️",owner:"Vladimír Věčný",location:"townhall",steps:["Obvolat věrné seniory","Uzamknout volební komisi","Spojit malé kandidátky","Převzít povolební radu"]},
 jzd:{name:"Traktorová mobilizace",icon:"🚜",owner:"Oldřich Brázda",location:"jzd",steps:["Sepsat zaměstnance","Vyčistit stopy po naftě","Přivézt voliče traktorem","Požadovat zemědělský výbor"]},
 business:{name:"Projekt SILO",icon:"🏗️",owner:"Richard Holub",location:"meadow",steps:["Zaměřit louku","Připravit školní dodatek","Propojit JZD s logistikou","Podepsat smlouvu po volbách"]},
 press:{name:"Spis Vejprnice",icon:"📰",owner:"Daniela Špičková",location:"paper",steps:["Sbírat rozpory","Ověřit vlastnické vazby","Najít účetní stopu","Vydat předvolební speciál"]}
};
const conspiracyPieces={diesel:"Nafta z JZD financovala dopravu a černou kampaň.",roof:"Školní zakázka obsahuje dodatek stejné poradenské firmy.",meadow:"Louku má převzít společnost napojená na Holubův logistický fond.",archive:"Archiv dokládá, že Věčný připravoval propojení projektů několik let."};
const coalitionPartnerDefs={
 civic:{name:"Občanská jednota",icon:"🕊️",motto:"Smlouvy na web a děti mimo billboard.",resource:"credibility",demand:"Veřejný audit a školský výbor",tags:["ethical","transparent"]},
 rural:{name:"Venkovská dohoda",icon:"🚜",motto:"Obec se nerozvíjí bez lidí, kteří vlastní traktory.",resource:"patronage",demand:"Zemědělský výbor a ochrana JZD",tags:["jzdDeal","power"]},
 progress:{name:"Rozvoj pro Vejprnice",icon:"🏗️",motto:"Budoucnost musí někdo postavit a někdo vyfakturovat.",resource:"patronage",demand:"Investiční výbor a pokračování Projektu SILO",tags:["contract","business"]},
 oldguard:{name:"Věčného seznam",icon:"🕰️",motto:"Stabilita je změna, která se nekonala.",resource:"pressure",demand:"Místostarosta pro Věčného a klid na staré smlouvy",tags:["power","oldguard"]}
};
const factionActionDefs={
 oldguard:[
  {title:"Věčný obchází seniory",text:"Každému připomíná jednu opravenou lavičku a tři katastrofy, které nenastaly.",type:"bad",location:"townhall",apply:()=>{state.opponent.momentum=clamp(state.opponent.momentum+3);adjustVoter("seniors",-2,.01)}},
  {title:"Staré struktury ladí volební komisi",text:"Bohumil našel nový formulář. Věčný už našel člověka, který jej bude vykládat.",type:"bad",location:"townhall",apply:()=>{state.factions.oldguard=clamp(state.factions.oldguard+2,-100,100);state.stats.influence=clamp(state.stats.influence-1)}}
 ],
 jzd:[
  {title:"JZD svolává pracovní poradu",text:"Porada je dobrovolná. Docházka bude součástí hodnocení sklizně.",type:"bad",location:"jzd",apply:()=>{state.factions.jzd=clamp(state.factions.jzd+2,-100,100);adjustVoter("jzdWorkers",state.party.brazda?1:-2,.01)}},
  {title:"Traktorová logistika testuje trasu",text:"Kolona objela náves třikrát. Oficiálně šlo o kontrolu pneumatik.",type:"normal",location:"jzd",apply:()=>{state.opponent.momentum=clamp(state.opponent.momentum+(state.party.brazda?0:2));state.stats.heat=clamp(state.stats.heat+1)}}
 ],
 business:[
  {title:"Holubův fond měří budoucnost",text:"Na louce se objevily kolíky, geodet a člověk, který tvrdí, že není geodet.",type:"bad",location:"meadow",apply:()=>{state.factions.business=clamp(state.factions.business+2,-100,100);if(!state.party.holub)adjustVoter("entrepreneurs",-1)}},
  {title:"Sponzorský oběd bez sponzora",text:"Podnikatelé se sešli, aby nezávisle dospěli ke stejnému názoru na územní plán.",type:"normal",location:"meadow",apply:()=>{state.stats.funds+=state.party.holub?1:0;state.opponent.momentum=clamp(state.opponent.momentum+(state.party.holub?0:1))}}
 ],
 press:[
  {title:"Redakce posílá další otázky",text:"Otázky mají čísla, přílohy a nepříjemnou vlastnost navazovat na předchozí odpovědi.",type:"normal",location:"paper",apply:()=>{state.factions.press=clamp(state.factions.press+2,-100,100);state.stats.heat=clamp(state.stats.heat+(state.stats.integrity<45?2:-1))}},
  {title:"Vejprnický hlas ověřuje vlastnické vazby",text:"Tři firmy mají stejnou schránku. Schránka odmítla komentář.",type:"normal",location:"paper",apply:()=>{if(state.conspiracy?.clues<4&&rng()<.22)addConspiracyClue(pick(Object.keys(conspiracyPieces)),"Denní práce redakce odkryla další vazbu.")}}
 ]
};
const rivalOperationDefs={
 narrative:{name:"Operace Jediný dospělý",icon:"🎭",adapt:"public",location:"pub",stages:["Zesměšnit vaše show jako chaos","Převzít téma stability","Vyvolat veřejnou pochybnost o kompetenci"]},
 paperFlood:{name:"Operace Příloha navíc",icon:"📚",adapt:"legal",location:"townhall",stages:["Zahltit štáb žádostmi","Napadnout procesní kroky","Zablokovat poslední dny kampaně"]},
 defection:{name:"Operace Volné křeslo",icon:"🪑",adapt:"power",location:"hq",stages:["Oslovit nejméně loajálního spojence","Nabídnout mu funkci","Předvést přeběhlíka před kamerami"]},
 dossier:{name:"Operace Vaše vlastní složka",icon:"🗂️",adapt:"corrupt",location:"paper",stages:["Sbírat účetní stopy","Spojit dary se zakázkami","Pustit časovanou složku do médií"]},
 cynicism:{name:"Operace Hodný, ale nepoužitelný",icon:"🙄",adapt:"ethical",location:"pub",stages:["Rámovat slušnost jako slabost","Ukázat jeden nehotový projekt","Přesvědčit voliče, že morálka neopraví silnici"]}
};
const echoEventDefs={
 roof:{event:"echoSchoolParents",delay:3},diesel:{event:"echoDieselWitness",delay:4},meadow:{event:"echoMeadowFence",delay:3},newsletter:{event:"echoPressCorrection",delay:3},oldfiles:{event:"echoArchiveCopy",delay:4}
};

  globalThis.KorytoFactionData = { VERSION, factionPlanDefs, conspiracyPieces, coalitionPartnerDefs, factionActionDefs, rivalOperationDefs, echoEventDefs };
})();
