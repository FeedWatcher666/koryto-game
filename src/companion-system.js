"use strict";
(() => {
  const VERSION = "0.14.3 TEST.8";
  const definitions = {
 marie:{name:"Marie Čistá",icon:"👩‍🏫",role:"ředitelka školy",loyalty:62,tolerance:"Má ráda poctivost. Nesnáší, když se děti stanou položkou kampaně.",mission:"Mobilizace rodičů",missionDesc:"Získá rodiče a dobrovolníky. Při průšvihu veřejně kritizuje kampaň."},
 daniela:{name:"Daniela Špičková",icon:"📰",role:"novinářka",loyalty:54,tolerance:"Odpustí chybu, ne systematickou lež.",mission:"Prověřit stopu",missionDesc:"Hledá důkaz a snižuje tlak. Může však zveřejnit i něco, co se vám nehodí."},
 brazda:{name:"Oldřich Brázda",icon:"🚜",role:"předseda JZD",loyalty:48,tolerance:"Respektuje sílu a protislužbu. Pohrdá nevděkem.",mission:"Svolat venkov",missionDesc:"Přiveze lidi, vliv a někdy i peníze. Každá pomoc má poznámku pod čarou."},
 bohumil:{name:"Bohumil Tichý",icon:"🗄️",role:"obecní úředník",loyalty:58,tolerance:"Chce přežít a mít kopii všeho.",mission:"Procesní záchrana",missionDesc:"Posune termín nebo najde dokument. Současně si pořídí kopii."},
 holub:{name:"Richard Holub",icon:"💼",role:"regionální dobrodinec",loyalty:45,tolerance:"Věrnost měří v zakázkách.",mission:"Sehnat financování",missionDesc:"Doplní kasu a profesionály. Později si přijde pro protislužbu."}
};
  const stories = {
 marie:{title:"Děti nejsou billboard",location:"school",day:4},daniela:{title:"Článek, který poškodí každého",location:"paper",day:5},
 brazda:{title:"Syn, nádrž a rodinná čest",location:"jzd",day:5},bohumil:{title:"Úředník chce beztrestnost",location:"townhall",day:6},
 holub:{title:"Podíl na budoucnosti obce",location:"meadow",day:6}
};
  const relationships = {
 marie_holub:{a:"marie",b:"holub",label:"Škola vs. zakázka",base:-18},
 daniela_brazda:{a:"daniela",b:"brazda",label:"Pravda vs. rodinná čest",base:-12},
 daniela_bohumil:{a:"daniela",b:"bohumil",label:"Zveřejnit vs. přežít",base:8},
 brazda_holub:{a:"brazda",b:"holub",label:"Půda vs. developerská marže",base:4}
};
  const conflicts = {
 marieHolub:{day:6,event:"conflictMarieHolub",after:"aftermathMarieHolub",a:"marie",b:"holub"},
 danielaBrazda:{day:7,event:"conflictDanielaBrazda",after:"aftermathDanielaBrazda",a:"daniela",b:"brazda"},
 danielaBohumil:{day:8,event:"conflictDanielaBohumil",after:"aftermathDanielaBohumil",a:"daniela",b:"bohumil"}
};
  const clone = value => JSON.parse(JSON.stringify(value));
  function replace(target, source) { for (const key of Object.keys(target||{})) delete target[key]; Object.assign(target,clone(source)); }
  function install() { if(typeof companions!=="undefined")replace(companions,definitions);if(typeof companionStoryDefs!=="undefined")replace(companionStoryDefs,stories);if(typeof relationshipDefs!=="undefined")replace(relationshipDefs,relationships);if(typeof conflictDefs!=="undefined")replace(conflictDefs,conflicts); }
  function validate() { const issues=[];for(const [id,def] of Object.entries(definitions)){if(!def.name||!def.role||!def.mission)issues.push(`${id}: neúplný společník`);if(!Number.isFinite(def.loyalty))issues.push(`${id}: neplatná loajalita`);if(!stories[id])issues.push(`${id}: chybí osobní příběh`);}for(const [id,rel] of Object.entries(relationships)){if(!definitions[rel.a]||!definitions[rel.b])issues.push(`${id}: neznámá dvojice`);}return issues; }
  function roster(target=state){return Object.entries(target?.party||{}).map(([id,item])=>({id,name:item.name||definitions[id]?.name||id,role:item.role||definitions[id]?.role||"",loyalty:Math.max(0,Math.min(100,Number(item.loyalty)||0)),fatigue:Number(target?.partyFatigue?.[id])||0})).sort((a,b)=>a.loyalty-b.loyalty);}
  function morale(target=state){const list=roster(target);if(!list.length)return {count:0,average:0,weakest:null,critical:[]};const average=Math.round(list.reduce((s,x)=>s+x.loyalty,0)/list.length);return {count:list.length,average,weakest:list[0],critical:list.filter(x=>x.loyalty<25)};}
  install();
  globalThis.KorytoCompanionSystem={VERSION,definitions,stories,relationships,conflicts,install,validate,roster,morale,clone:()=>({definitions:clone(definitions),stories:clone(stories),relationships:clone(relationships),conflicts:clone(conflicts)})};
})();
