"use strict";
(() => {
  const VERSION = "0.14.4 TEST.5";
const companions={
 marie:{name:"Marie Čistá",icon:"👩‍🏫",role:"ředitelka školy",loyalty:62,tolerance:"Má ráda poctivost. Nesnáší, když se děti stanou položkou kampaně.",mission:"Mobilizace rodičů",missionDesc:"Získá rodiče a dobrovolníky. Při průšvihu veřejně kritizuje kampaň."},
 daniela:{name:"Daniela Špičková",icon:"📰",role:"novinářka",loyalty:54,tolerance:"Odpustí chybu, ne systematickou lež.",mission:"Prověřit stopu",missionDesc:"Hledá důkaz a snižuje tlak. Může však zveřejnit i něco, co se vám nehodí."},
 brazda:{name:"Oldřich Brázda",icon:"🚜",role:"předseda JZD",loyalty:48,tolerance:"Respektuje sílu a protislužbu. Pohrdá nevděkem.",mission:"Svolat venkov",missionDesc:"Přiveze lidi, vliv a někdy i peníze. Každá pomoc má poznámku pod čarou."},
 bohumil:{name:"Bohumil Tichý",icon:"🗄️",role:"obecní úředník",loyalty:58,tolerance:"Chce přežít a mít kopii všeho.",mission:"Procesní záchrana",missionDesc:"Posune termín nebo najde dokument. Současně si pořídí kopii."},
 holub:{name:"Richard Holub",icon:"💼",role:"regionální dobrodinec",loyalty:45,tolerance:"Věrnost měří v zakázkách.",mission:"Sehnat financování",missionDesc:"Doplní kasu a profesionály. Později si přijde pro protislužbu."}
};
const companionStoryDefs={
 marie:{title:"Děti nejsou billboard",location:"school",day:4},daniela:{title:"Článek, který poškodí každého",location:"paper",day:5},
 brazda:{title:"Syn, nádrž a rodinná čest",location:"jzd",day:5},bohumil:{title:"Úředník chce beztrestnost",location:"townhall",day:6},
 holub:{title:"Podíl na budoucnosti obce",location:"meadow",day:6}
};
const relationshipDefs={
 marie_holub:{a:"marie",b:"holub",label:"Škola vs. zakázka",base:-18},
 daniela_brazda:{a:"daniela",b:"brazda",label:"Pravda vs. rodinná čest",base:-12},
 daniela_bohumil:{a:"daniela",b:"bohumil",label:"Zveřejnit vs. přežít",base:8},
 brazda_holub:{a:"brazda",b:"holub",label:"Půda vs. developerská marže",base:4}
};
const conflictDefs={
 marieHolub:{day:6,event:"conflictMarieHolub",after:"aftermathMarieHolub",a:"marie",b:"holub"},
 danielaBrazda:{day:7,event:"conflictDanielaBrazda",after:"aftermathDanielaBrazda",a:"daniela",b:"brazda"},
 danielaBohumil:{day:8,event:"conflictDanielaBohumil",after:"aftermathDanielaBohumil",a:"daniela",b:"bohumil"}
};
const supportProfiles={
 marie:{label:"Rodičovská mobilizace",match:t=>t.includes("children")||t.includes("ethical")||t.includes("public")},
 daniela:{label:"Ověření kompromatu",match:t=>t.includes("transparent")||t.includes("press")||t.includes("legal")},
 brazda:{label:"Traktorová logistika",match:t=>t.includes("jzdDeal")||t.includes("power")||t.includes("public")},
 bohumil:{label:"Procesní štít",match:t=>t.includes("legal")||t.includes("destroyEvidence")||state.currentLocation==="townhall"},
 holub:{label:"Profesionální servis",match:t=>t.includes("contract")||t.includes("corrupt")||state.currentLocation==="meadow"}
};
const companionAmbitionDefs={
 marie:{name:"Škola není kulisa",icon:"🏫",goal:"Prosadit veřejný závazek pro školu a držet děti mimo lacinou kampaň.",location:"school",positive:["children","ethical","transparent"],negative:["contract","lie","corrupt"],event:"agendaMarie"},
 daniela:{name:"Pravda bez tiskového dozoru",icon:"📰",goal:"Získat právo zveřejnit ověřená zjištění i tehdy, když poškodí vlastní štáb.",location:"paper",positive:["transparent","legal","press"],negative:["lie","corrupt","pressAttack"],event:"agendaDaniela"},
 brazda:{name:"Rodina a družstvo především",icon:"🚜",goal:"Zachovat vliv JZD a zajistit Brázdově rodině místo u povolebního stolu.",location:"jzd",positive:["jzdDeal","power"],negative:["police","antiBusiness","transparent"],event:"agendaBrazda"},
 bohumil:{name:"Úřad musí přežít každého",icon:"🗄️",goal:"Získat procesní ochranu pro úředníky a jistotu, že archiv nebude čistit vítězný dav.",location:"townhall",positive:["legal","gray"],negative:["pressAttack","public","destroyEvidence"],event:"agendaBohumil"},
 holub:{name:"Investiční rada budoucnosti",icon:"💼",goal:"Otevřít si přístup k zakázkám a vytvořit stálý kanál mezi radnicí a soukromým kapitálem.",location:"meadow",positive:["contract","business","corrupt"],negative:["ethical","police","antiBusiness"],event:"agendaHolub"}
};

  globalThis.KorytoCompanionData = { VERSION, companions, companionStoryDefs, relationshipDefs, conflictDefs, supportProfiles, companionAmbitionDefs };
})();
