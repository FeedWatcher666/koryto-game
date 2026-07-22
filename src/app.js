"use strict";
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const deep=o=>JSON.parse(JSON.stringify(o));
function hashSeed(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(){state.rngState=(Math.imul(state.rngState>>>0,1664525)+1013904223)>>>0;return state.rngState/4294967296}
const pick=a=>a[Math.floor(rng()*a.length)];
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const rand=(a,b)=>a+Math.floor(rng()*(b-a+1));
const AUTOTEST=location.search.includes("autotest=1");
const classes={
 bard:{name:"Populistický bard",icon:"🎤",desc:"Umí změnit problém v heslo. Jednou denně přehodí neúspěšný veřejný hod.",attrs:{charisma:4,intellect:1,cunning:2,authority:2,resilience:2},ability:"reframe"},
 rogue:{name:"Kmotrovský rogue",icon:"🕶️",desc:"Vidí zadní vchody a otevřené obálky. +2 vychytralost, špinavé dohody vydělají víc.",attrs:{charisma:2,intellect:2,cunning:4,authority:2,resilience:2},ability:"shadow"},
 paladin:{name:"Lidový paladin",icon:"🛡️",desc:"Věří na pravidla, i když je ostatní považují za doporučení. +2 autorita při veřejně prospěšných krocích.",attrs:{charisma:2,intellect:2,cunning:1,authority:4,resilience:3},ability:"oath"},
 mage:{name:"Dotační mág",icon:"🧙",desc:"Z kravína vytvoří centrum odolnosti. +2 k právním, smluvním a auditním hodům.",attrs:{charisma:1,intellect:4,cunning:3,authority:1,resilience:2},ability:"form"},
 technocrat:{name:"Technokratický čaroděj",icon:"📊",desc:"Zneškodňuje místnost tabulkou. +1 k odborným hodům a v deníku vidí následky prošvihnutých termínů.",attrs:{charisma:1,intellect:4,cunning:1,authority:2,resilience:3},ability:"model"},
 necro:{name:"Stranický nekromant",icon:"🧟",desc:"Oživí kariéru i člověka, kterého voliči už pohřbili. +2 k mocenským hodům proti starým strukturám.",attrs:{charisma:2,intellect:2,cunning:3,authority:4,resilience:1},ability:"revive"}
};
const locations={
 pub:{name:"Hospoda U Zvadlého klásku",icon:"🍺",desc:"Volební průzkum bez metodiky, zato s utopencem."},
 jzd:{name:"JZD Budoucnost",icon:"🚜",desc:"Nafta mizí, ale vliv zůstává."},
 townhall:{name:"Obecní úřad",icon:"🏛️",desc:"Dungeon razítek, příloh a lidí bez jmenovky."},
 school:{name:"Základní škola",icon:"🏫",desc:"Do třídy prší podle rozvrhu."},
 meadow:{name:"Poslední louka",icon:"🌳",desc:"Veřejný prostor, dokud developer nezmění slovník."},
 paper:{name:"Vejprnický hlas",icon:"📰",desc:"Nezávislé médium placené obcí."},
 pitch:{name:"Fotbalové hřiště",icon:"⚽",desc:"Sport, politika a párek v jednom rozpočtu."},
 hq:{name:"Kampaňová garáž",icon:"📣",desc:"Dobrovolníci, tiskárna a jedna zásuvka."}
};
const companions={
 marie:{name:"Marie Čistá",icon:"👩‍🏫",role:"ředitelka školy",loyalty:62,tolerance:"Má ráda poctivost. Nesnáší, když se děti stanou položkou kampaně.",mission:"Mobilizace rodičů",missionDesc:"Získá rodiče a dobrovolníky. Při průšvihu veřejně kritizuje kampaň."},
 daniela:{name:"Daniela Špičková",icon:"📰",role:"novinářka",loyalty:54,tolerance:"Odpustí chybu, ne systematickou lež.",mission:"Prověřit stopu",missionDesc:"Hledá důkaz a snižuje tlak. Může však zveřejnit i něco, co se vám nehodí."},
 brazda:{name:"Oldřich Brázda",icon:"🚜",role:"předseda JZD",loyalty:48,tolerance:"Respektuje sílu a protislužbu. Pohrdá nevděkem.",mission:"Svolat venkov",missionDesc:"Přiveze lidi, vliv a někdy i peníze. Každá pomoc má poznámku pod čarou."},
 bohumil:{name:"Bohumil Tichý",icon:"🗄️",role:"obecní úředník",loyalty:58,tolerance:"Chce přežít a mít kopii všeho.",mission:"Procesní záchrana",missionDesc:"Posune termín nebo najde dokument. Současně si pořídí kopii."},
 holub:{name:"Richard Holub",icon:"💼",role:"regionální dobrodinec",loyalty:45,tolerance:"Věrnost měří v zakázkách.",mission:"Sehnat financování",missionDesc:"Doplní kasu a profesionály. Později si přijde pro protislužbu."}
};
const voterDefs={
 parents:{name:"Rodiče školáků",icon:"🎒",population:170,turnout:.72,base:42},
 jzdWorkers:{name:"Lidé kolem JZD",icon:"🚜",population:150,turnout:.78,base:32},
 seniors:{name:"Senioři",icon:"🧓",population:220,turnout:.84,base:29},
 entrepreneurs:{name:"Podnikatelé",icon:"💼",population:65,turnout:.76,base:35},
 club:{name:"Fotbal a spolky",icon:"⚽",population:110,turnout:.68,base:36},
 officials:{name:"Úředníci a rodiny",icon:"📎",population:80,turnout:.8,base:37},
 undecided:{name:"Nerozhodnutí",icon:"🤷",population:190,turnout:.54,base:39},
 disengaged:{name:"Naštvaní nevoliči",icon:"🛋️",population:220,turnout:.3,base:27}
};
const baseState={
 version:"0.14",hero:{name:"",classId:"bard",origin:"idealist",attrs:{}},
 day:1,actions:2,phase:"map",currentLocation:null,currentEvent:null,
 stats:{support:14,trust:50,funds:12,heat:0,influence:10,integrity:55,leverage:0},
 factions:{citizens:5,jzd:0,business:0,press:0,oldguard:12,officials:0},
 party:{},items:[],flags:{},quests:{},cooldowns:{},genericUses:{},commitments:[],commitmentSeq:0,voters:{},partyAssignment:null,partyUsedDay:0,debt:0,
 news:[],log:[],visited:{},opponent:{momentum:18,scandals:0},finale:0,abilityUsedDay:0,
 pendingEvents:[],pendingMeta:{},surprisePlan:[],surpriseTriggered:0,ended:false,finalCrisis:null,electionBreakdown:[],promiseSummary:{fulfilled:0,broken:0,active:0},
 factionPlans:{},conspiracy:{},companionStories:{},worldChanges:{},planHistory:[],relationships:{},conflictStates:{},selectedSupport:null,companionSupportUsed:{},coalition:{},preCoalitionEnding:null,classMastery:null,classAbilityUsed:false,debate:{},rivalAI:{},worldActions:[],factionActionCooldowns:{},companionAmbitions:{},echoes:[],echoHistory:[],rivalOperation:{},ui:{pixelMap:true},
 seed:"",rngState:2463534242,approachHeat:{},lastApproaches:[],partyFatigue:{},audit:{rolls:0,outcomes:{critical:0,success:0,costly:0,complication:0},locations:{},approaches:{},autosaves:0}
};
let state=deep(baseState),selectedClass="bard",pendingResolution=null,memorySave=null;



const factionPlanDefs={
 oldguard:{name:"Operace Návrat",icon:"🕰️",owner:"Vladimír Věčný",location:"townhall",steps:["Obvolat věrné seniory","Uzamknout volební komisi","Spojit malé kandidátky","Převzít povolební radu"]},
 jzd:{name:"Traktorová mobilizace",icon:"🚜",owner:"Oldřich Brázda",location:"jzd",steps:["Sepsat zaměstnance","Vyčistit stopy po naftě","Přivézt voliče traktorem","Požadovat zemědělský výbor"]},
 business:{name:"Projekt SILO",icon:"🏗️",owner:"Richard Holub",location:"meadow",steps:["Zaměřit louku","Připravit školní dodatek","Propojit JZD s logistikou","Podepsat smlouvu po volbách"]},
 press:{name:"Spis Vejprnice",icon:"📰",owner:"Daniela Špičková",location:"paper",steps:["Sbírat rozpory","Ověřit vlastnické vazby","Najít účetní stopu","Vydat předvolební speciál"]}
};
const conspiracyPieces={diesel:"Nafta z JZD financovala dopravu a černou kampaň.",roof:"Školní zakázka obsahuje dodatek stejné poradenské firmy.",meadow:"Louku má převzít společnost napojená na Holubův logistický fond.",archive:"Archiv dokládá, že Věčný připravoval propojení projektů několik let."};
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
const coalitionPartnerDefs={
 civic:{name:"Občanská jednota",icon:"🕊️",motto:"Smlouvy na web a děti mimo billboard.",resource:"credibility",demand:"Veřejný audit a školský výbor",tags:["ethical","transparent"]},
 rural:{name:"Venkovská dohoda",icon:"🚜",motto:"Obec se nerozvíjí bez lidí, kteří vlastní traktory.",resource:"patronage",demand:"Zemědělský výbor a ochrana JZD",tags:["jzdDeal","power"]},
 progress:{name:"Rozvoj pro Vejprnice",icon:"🏗️",motto:"Budoucnost musí někdo postavit a někdo vyfakturovat.",resource:"patronage",demand:"Investiční výbor a pokračování Projektu SILO",tags:["contract","business"]},
 oldguard:{name:"Věčného seznam",icon:"🕰️",motto:"Stabilita je změna, která se nekonala.",resource:"pressure",demand:"Místostarosta pro Věčného a klid na staré smlouvy",tags:["power","oldguard"]}
};
const classMasteryDefs={
 bard:[{id:"chorus",name:"Refrén, který přežije fakta",desc:"Přerámování přidá více nálady sálu a jednou obnoví Momentum."},{id:"heckler",name:"Mistr přerušení",desc:"Po použití schopnosti Věčný ztratí připravený tah."}],
 rogue:[{id:"doubleFile",name:"Dvojitá složka",desc:"Odhalení kompromatu způsobí více škody a bere méně Důvěry."},{id:"quietDeal",name:"Tichá dohoda",desc:"Koaliční a mocenské hody získají +1; v debatě ukradnete Momentum."}],
 paladin:[{id:"publicOath",name:"Veřejná přísaha",desc:"Schopnost výrazně obnoví Důvěru, ale vytvoří kontrolovatelný slib."},{id:"unbroken",name:"Nezlomný mandát",desc:"První protiútok v debatě způsobí poloviční škodu."}],
 mage:[{id:"appendix",name:"Příloha číslo 37",desc:"Faktické a právní karty dostanou +2 k hodu."},{id:"auditCircle",name:"Auditní kruh",desc:"Schopnost zruší příští soupeřův tah a sníží jeho obranu."}],
 technocrat:[{id:"impactModel",name:"Model dopadů",desc:"U karet uvidíte přesnou šanci a schopnost přidá +3 k příštímu hodu."},{id:"dashboard",name:"Dashboard reality",desc:"Na začátku debaty získáte více Momenta a odolnosti."}],
 necro:[{id:"reserveCadre",name:"Kádr v záloze",desc:"Schopnost přivolá starou strukturu, poškodí soupeře a zvýší tlak médií."},{id:"apparatusMemory",name:"Paměť aparátu",desc:"Vždy přesně vidíte soupeřův tah a jeho adaptaci."}]
};
const debateCardDefs={
 facts:{name:"Tabulka bez emocí",icon:"📊",attr:"intellect",dc:12,cost:1,damage:13,desc:"Rozebrat výsledky a rozpočet. Silné proti prázdnému slibu.",tags:["transparent","legal"],mood:-3,trust:3},
 promise:{name:"Lidový slib",icon:"🤞",attr:"charisma",dc:11,cost:0,damage:8,heal:7,desc:"Nabídnout jednoduché řešení. Rychlé, zapamatovatelné a budoucí.",tags:["public","lie"],mood:7,trust:-1},
 expose:{name:"Odhal kompromat",icon:"🗂️",attr:"cunning",dc:14,cost:2,damage:19,desc:"Vytáhnout dokument. Vysoká škoda, vysoký účet.",tags:["power","pressAttack"],mood:2,trust:-3,leverage:3},
 citizens:{name:"Pustit ke slovu občany",icon:"🗣️",attr:"resilience",dc:12,cost:1,damage:11,heal:4,desc:"Nechat místní, aby popsali vlastní zkušenost.",tags:["ethical","public"],mood:10,trust:5},
 joke:{name:"Změnit téma vtipem",icon:"🥨",attr:"charisma",dc:12,cost:0,damage:7,desc:"Když není odpověď, může být alespoň punchline.",tags:["public"],mood:12,trust:0},
 feint:{name:"Koaliční klička",icon:"🤝",attr:"cunning",dc:13,cost:2,damage:10,desc:"Naznačit, že Věčný po volbách stejně zůstane sám.",tags:["power","contract"],mood:0,trust:-2}
};
const rivalMoveDefs={
 emptyPromise:{name:"Věčný slib",icon:"🎁",hint:"Soupeř chystá jednoduchý slib bez rozpočtové přílohy.",damage:9,mood:7},
 emotional:{name:"Emoční vydírání",icon:"😭",hint:"Soupeř se chystá tvrdit, že útok na něj je útokem na obec.",damage:8,trust:-5},
 reverseFacts:{name:"Obrácení fakta",icon:"🔄",hint:"Soupeř čeká na vaše čísla a připravuje vlastní realitu.",damage:7,counter:["facts","expose"]},
 patronage:{name:"Přehlídka zásluh",icon:"🎀",hint:"Na pódium míří hasiči, fotbalisté a každá lavička z posledních dvaceti let.",damage:6,heal:9,mood:4},
 attackParty:{name:"Rozložit štáb",icon:"🪓",hint:"Věčný útočí na nejslabší článek vaší družiny.",damage:7,party:true},
 silence:{name:"Důstojné mlčení",icon:"🤐",hint:"Soupeř nechá vás mluvit a doufá, že se porazíte sami.",damage:5,adapt:true}
};
const rivalCounterDefs={
 public:"counterFreeConcert",legal:"counterPaperFlood",power:"counterDefection",corrupt:"counterLeak",ethical:"counterCynicism"
};

const companionAmbitionDefs={
 marie:{name:"Škola není kulisa",icon:"🏫",goal:"Prosadit veřejný závazek pro školu a držet děti mimo lacinou kampaň.",location:"school",positive:["children","ethical","transparent"],negative:["contract","lie","corrupt"],event:"agendaMarie"},
 daniela:{name:"Pravda bez tiskového dozoru",icon:"📰",goal:"Získat právo zveřejnit ověřená zjištění i tehdy, když poškodí vlastní štáb.",location:"paper",positive:["transparent","legal","press"],negative:["lie","corrupt","pressAttack"],event:"agendaDaniela"},
 brazda:{name:"Rodina a družstvo především",icon:"🚜",goal:"Zachovat vliv JZD a zajistit Brázdově rodině místo u povolebního stolu.",location:"jzd",positive:["jzdDeal","power"],negative:["police","antiBusiness","transparent"],event:"agendaBrazda"},
 bohumil:{name:"Úřad musí přežít každého",icon:"🗄️",goal:"Získat procesní ochranu pro úředníky a jistotu, že archiv nebude čistit vítězný dav.",location:"townhall",positive:["legal","gray"],negative:["pressAttack","public","destroyEvidence"],event:"agendaBohumil"},
 holub:{name:"Investiční rada budoucnosti",icon:"💼",goal:"Otevřít si přístup k zakázkám a vytvořit stálý kanál mezi radnicí a soukromým kapitálem.",location:"meadow",positive:["contract","business","corrupt"],negative:["ethical","police","antiBusiness"],event:"agendaHolub"}
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
function recordWorldAction(owner,text,type="normal",location=""){
 state.worldActions=state.worldActions||[];state.worldActions.unshift({day:state.day,owner,text,type,location});state.worldActions=state.worldActions.slice(0,18);
}
function factionDailyActions(){
 const scored=Object.keys(factionActionDefs).map(id=>({id,score:(state.factionPlans[id]?.progress||0)+rng()*35})).sort((a,b)=>b.score-a.score).slice(0,2);
 for(const {id} of scored){const pool=factionActionDefs[id],a=pick(pool);a.apply();recordWorldAction(factionPlanDefs[id]?.owner||id,`${a.title}: ${a.text}`,a.type,a.location)}
}
function initCompanionAmbitions(){state.companionAmbitions={};for(const id of Object.keys(companionAmbitionDefs))state.companionAmbitions[id]={progress:18,tension:0,resolved:false,path:null,queued:false,withheldUntil:0,lastActionDay:0}}
function companionInOpenConflict(id){return Object.entries(conflictDefs).some(([cid,d])=>{const c=state.conflictStates?.[cid];return (d.a===id||d.b===id)&&c?.queued&&!c?.resolved})}
function companionAvailability(id){
 const a=state.companionAmbitions?.[id];if(!state.party[id])return {ok:false,reason:"není ve štábu"};if(a?.withheldUntil>=state.day)return {ok:false,reason:`stáhl podporu do dne ${a.withheldUntil}`};if(companionInOpenConflict(id)&&Object.values(relationshipDefs).some(d=>(d.a===id||d.b===id)&&relationshipScore(d.a,d.b)<-32))return {ok:false,reason:"odmítá společný zásah během konfliktu"};return {ok:true,reason:"připraven"}
}
function updateCompanionAmbitions(eventId,choice,level){
 const tags=choice.tags||[];for(const [id,d] of Object.entries(companionAmbitionDefs)){if(!state.party[id])continue;const a=state.companionAmbitions[id]||(state.companionAmbitions[id]={progress:18,tension:0,resolved:false,path:null,queued:false,withheldUntil:0,lastActionDay:0});if(a.resolved)continue;let pos=d.positive.some(t=>tags.includes(t)),neg=d.negative.some(t=>tags.includes(t));if(eventId===companionStoryDefs[id]?.location)pos=true;if(pos)a.progress=clamp(a.progress+(level==="complication"?2:7),0,100);if(neg)a.tension=clamp(a.tension+(level==="complication"?10:6),0,100);if(level==="complication"&&neg)a.tension=clamp(a.tension+4);if((a.progress>=52||a.tension>=38)&&!a.queued&&!state.flags["resolved_"+d.event]){a.queued=true;schedule(d.event,3);recordWorldAction(companions[id].name,`Osobní agenda vstoupila do kampaně: ${d.name}.`,a.tension>a.progress?"bad":"normal",d.location)}}
}
function companionAutonomyTurn(){
 const candidates=Object.keys(state.party).filter(id=>{const a=state.companionAmbitions?.[id];return a&&!a.resolved&&a.lastActionDay!==state.day&&(a.progress>=34||a.tension>=28)});if(!candidates.length)return;const id=pick(candidates),a=state.companionAmbitions[id],d=companionAmbitionDefs[id];a.lastActionDay=state.day;
 if(a.tension>a.progress){state.party[id].loyalty=clamp(state.party[id].loyalty-3);a.tension=clamp(a.tension+3);recordWorldAction(companions[id].name,`Jednal bez souhlasu štábu kvůli agendě „${d.name}“.`,"bad",d.location);if(a.tension>=55)a.withheldUntil=Math.max(a.withheldUntil||0,state.day+1)}
 else{state.party[id].loyalty=clamp(state.party[id].loyalty+1);a.progress=clamp(a.progress+3);const benefits={marie:{trust:2,citizens:2},daniela:{press:2,heat:-2},brazda:{jzd:2,influence:1},bohumil:{officials:2,heat:-1},holub:{business:2,funds:1}};effect(benefits[id]||{});recordWorldAction(companions[id].name,`Posunul vlastní agendu „${d.name}“ a přitom pomohl kampani.`,"good",d.location)}
}
function registerEcho(source,context={}){const d=echoEventDefs[source];if(!d||state.echoHistory?.some(x=>x.source===source))return;state.echoes=state.echoes||[];state.echoes.push({source,event:d.event,due:Math.min(13,state.day+d.delay),context});state.echoHistory=state.echoHistory||[];state.echoHistory.push({source,registered:state.day});}
function triggerEchoes(){for(const e of (state.echoes||[]).filter(x=>!x.triggered&&state.day>=x.due)){e.triggered=true;state.flags["echo_context_"+e.source]=e.context;schedule(e.event,2);recordWorldAction("Minulost",`Rozhodnutí z kauzy ${e.source} se vrací jako nový problém.`,"bad",eventById(e.event)?.location||"")}}
function operationIdForAdaptation(a){return a==="public"?"narrative":a==="legal"?"paperFlood":a==="power"?"defection":a==="corrupt"?"dossier":"cynicism"}
function startRivalOperation(){const id=operationIdForAdaptation(state.rivalAI?.adaptation||"ethical");state.rivalOperation={id,progress:0,stage:0,revealed:state.rivalAI?.revealed||false,completed:false,history:[]};recordWorldAction("Vladimír Věčný",`Spustil ${rivalOperationDefs[id].name}.`,"bad",rivalOperationDefs[id].location)}
function rivalOperationTurn(){
 state.rivalOperation=state.rivalOperation||{};if(!state.rivalOperation.id&&state.day>=5&&state.rivalAI?.adaptation)startRivalOperation();const o=state.rivalOperation;if(!o.id||o.completed)return;const def=rivalOperationDefs[o.id];o.revealed=o.revealed||state.rivalAI?.revealed||state.party.daniela?.loyalty>=68;o.progress=clamp((o.progress||0)+10+state.opponent.momentum/22+(state.rivalAI?.adaptation===def.adapt?4:0),0,100);const next=o.progress>=82?3:o.progress>=52?2:o.progress>=24?1:0;if(next>o.stage){o.stage=next;o.history.push({day:state.day,stage:next});schedule(`rivalOperationStage${next}`,2);recordWorldAction("Vladimír Věčný",`${def.name}: ${def.stages[next-1]}.`,"bad",def.location)}if(o.progress>=100)o.completed=true;
}
function rivalOperationEvent(stage){
 const o=state.rivalOperation,def=rivalOperationDefs[o?.id]||rivalOperationDefs.cynicism;const names={1:"První tah operace",2:"Operace nabírá rychlost",3:"Finální úder před volbami"};const texts={narrative:["Věčný rozjíždí sérii vystoupení, v nichž každou vaši akci popisuje jako improvizaci bez zkušeností.","Jeho lidé opakují tutéž větu tak dlouho, až se z ní stane místní fakt."],paperFlood:["Na štáb přicházejí žádosti, stížnosti a procesní námitky. Každá je drobná, dohromady však žerou čas.","Věčný sází na to, že poslední dny strávíte vysvětlováním příloh."],defection:["Nejméně loajální člen štábu dostal nabídku na povolební funkci.","Nabídka je samozřejmě neformální, ale má kancelář, plat a parkovací místo."],dossier:["Do redakce dorazila složka propojující vaše dary, zakázky a několik velmi kreativních faktur.","Část je pravdivá. Část je dobře vysázená."],cynicism:["Věčný tvrdí, že jste slušný člověk, což v jeho podání zní jako diagnóza.","Kampaň staví na otázce, zda morálka umí opravit střechu a vyvézt popelnice."]};
 return {id:`rivalOperationStage${stage}`,location:def.location,title:`${def.icon} ${names[stage]}: ${o.revealed?def.name:"Neznámá soupeřova operace"}`,emoji:def.icon,kicker:"VÍCEKROKOVÁ PROTIOPERACE",queued:true,text:()=>texts[o.id]||texts.cynicism,choices:[
  {label:"Odhalit operaci veřejně",detail:"Získáte kontrolu nad příběhem, pokud máte fakta a nervy.",check:{attr:"resilience",dc:11+stage},tags:["transparent","public","ethical"],success:makeOutcome("Operace dostane jméno, vlastní titulek a příliš mnoho svědků, aby mohla pokračovat skrytě.",{trust:5,support:4,heat:-4,oldguard:-4},["transparent","public"],()=>{o.progress=clamp(o.progress-20);o.revealed=true}),fail:makeOutcome("Věčný označí vaše obvinění za výmluvu člověka, který nezvládá tlak.",{support:-5,trust:-3,heat:5},["public"])},
  {label:"Rozebrat operaci procesně",detail:"Méně fotogenické, ale může zastavit konkrétní mechanismus.",check:{attr:"intellect",dc:12+stage},tags:["legal","transparent"],success:makeOutcome("Jedna příloha, jeden svědek a jeden termín operaci zpomalí víc než tisková konference.",{officials:5,influence:4,heat:-3},["legal"],()=>o.progress=clamp(o.progress-24)),fail:makeOutcome("Procesní obrana spotřebuje přesně ten čas, který měla zachránit.",{funds:-2,heat:5,support:-3},["legal"])},
  {label:"Otočit operaci proti jejím autorům",detail:"Použijete stejnou síť, jen s jiným příjemcem škody.",check:{attr:"cunning",dc:13+stage},tags:["power","corrupt"],success:makeOutcome("Část operace zasáhne Věčného. Část zůstane ve vašem šuplíku pro příště.",{leverage:5,influence:5,oldguard:-6,integrity:-5},["power","corrupt"],()=>o.progress=clamp(o.progress-18)),fail:makeOutcome("Síť pozná svého majitele a odmítne změnit účetní období.",{heat:10,trust:-6,integrity:-6},["corrupt"])}
 ]}
}
function livingWorldDailyTurn(){factionDailyActions();companionAutonomyTurn();triggerEchoes();rivalOperationTurn()}

function resolveAmbition(id,path,withholdDays=0){const a=state.companionAmbitions[id]||(state.companionAmbitions[id]={});a.resolved=true;a.path=path;a.queued=true;if(withholdDays)a.withheldUntil=state.day+withholdDays;const p=state.party[id];if(p)p.loyalty=clamp(p.loyalty+(withholdDays?-8:6));recordWorldAction(companions[id]?.name||id,`Osobní agenda uzavřena cestou „${path}“.`,withholdDays?"bad":"good",companionAmbitionDefs[id]?.location||"")}

function initLivingWorld(){
 state.factionPlans={};for(const [id,d] of Object.entries(factionPlanDefs))state.factionPlans[id]={progress:id==="oldguard"?18:id==="business"?12:8,stage:0,revealed:id==="oldguard",blocked:0,completed:false};
 state.conspiracy={name:"Operace SILO",clues:0,pieces:{diesel:false,roof:false,meadow:false,archive:false},revealed:false,joined:false,joinedDeals:0,exposed:false,resolved:false,stage:0};
 state.companionStories={};for(const id of Object.keys(companionStoryDefs))state.companionStories[id]={stage:0,done:false,perk:null};
 state.worldChanges={school:"leaking",meadow:"open",jzd:"restless",townhall:"closed",paper:"quiet"};state.planHistory=[];
 state.relationships={};for(const [id,d] of Object.entries(relationshipDefs))state.relationships[id]=d.base;
 state.conflictStates={};for(const id of Object.keys(conflictDefs))state.conflictStates[id]={queued:false,resolved:false,path:null,aftermath:false};
 state.selectedSupport=null;state.companionSupportUsed={};state.coalition={active:false,round:0,maxRounds:3,partners:{},joined:[],seats:0,log:[],contracts:[],selected:null,resources:{credibility:0,patronage:0,pressure:0}};state.preCoalitionEnding=null;
 state.classMastery=null;state.classAbilityUsed=false;state.debate={active:false};state.rivalAI={adaptation:null,reads:{},counters:0,lastCounterDay:0,revealed:false};state.worldActions=[];state.factionActionCooldowns={};initCompanionAmbitions();state.echoes=[];state.echoHistory=[];state.rivalOperation={};state.ui={pixelMap:true};
}
function planStage(progress){return progress>=100?4:progress>=75?3:progress>=50?2:progress>=25?1:0}
function planStepText(id){const p=state.factionPlans[id],d=factionPlanDefs[id];if(!p||!d)return"";return p.completed?"Plán dokončen":d.steps[Math.min(p.stage,d.steps.length-1)]}
function changePlan(id,delta,reason=""){
 const p=state.factionPlans[id];if(!p)return;const before=p.progress;p.progress=clamp(p.progress+delta,0,100);const oldStage=p.stage;p.stage=planStage(p.progress);
 if(reason&&Math.abs(p.progress-before)>=3)state.planHistory.unshift({day:state.day,id,text:reason,delta:Math.round(p.progress-before)});
 if(p.stage>oldStage)onPlanStage(id,p.stage);if(p.progress>=100)p.completed=true;
}
function onPlanStage(id,stage){
 const eventsByPlan={oldguard:["planOldguardBus","planOldguardCommission","planOldguardPact","planOldguardCouncil"],jzd:["planJzdList","planJzdCleanup","planJzdConvoy","planJzdDemand"],business:["planBusinessSurvey","planBusinessContract","planBusinessNetwork","planBusinessSignature"],press:["planPressQuestions","planPressOwners","planPressLedger","planPressSpecial"]};
 const ev=eventsByPlan[id]?.[stage-1];if(ev&&!state.flags["resolved_"+ev]){schedule(ev,2);addNews(`${factionPlanDefs[id].owner} posunul plán „${factionPlanDefs[id].name}“: ${factionPlanDefs[id].steps[stage-1]}.`,id==="press"?"normal":"bad")}
}
function factionPlanTurn(){
 const fp=state.factionPlans;
 changePlan("oldguard",1.7+Math.max(0,state.factions.oldguard)/45+state.opponent.momentum/85-(state.factions.citizens>20?1.5:0),"Věčný využil další den kampaně.");
 changePlan("jzd",1.1+Math.max(0,state.factions.jzd)/55+(state.party.brazda?.loyalty>65?.8:0)-(state.flags.policeAlly?1.5:0),"JZD sčítá lidi, techniku a laskavosti.");
 changePlan("business",1.1+Math.max(0,state.factions.business)/58+activeCommitments("Holub").length*.8-(state.conspiracy.exposed?4:0),"Holub připravuje obchodní část budoucnosti obce.");
 changePlan("press",.9+state.stats.heat/62+state.conspiracy.clues*.7+(state.party.daniela?.loyalty>65?.6:0),"Redakce skládá rozpory do jednoho příběhu.");
}
function revealPlan(id){if(state.factionPlans[id])state.factionPlans[id].revealed=true}
function addConspiracyClue(piece,reason=""){
 const c=state.conspiracy;if(!c||c.pieces[piece])return;c.pieces[piece]=true;c.clues++;if(c.clues>=2)c.revealed=true;
 addNews(`Nová stopa Operace SILO: ${conspiracyPieces[piece]}`,"normal");log(`Stopa SILO – ${piece}: ${reason||conspiracyPieces[piece]}`);
 if(c.clues===2&&!state.flags.siloPatternQueued)schedule("siloPattern",3),state.flags.siloPatternQueued=true;
 if(c.clues===3&&!state.flags.siloLedgerQueued)schedule("siloLedger",3),state.flags.siloLedgerQueued=true;
 if(c.clues>=4&&!state.flags.siloFinalQueued)schedule(c.joined?"siloOffer":"siloConfrontation",4),state.flags.siloFinalQueued=true;
}
function trackLivingWorld(eventId,choice,level){
 const tags=choice.tags||[],success=level!=="complication";
 if(tags.includes("ethical")||tags.includes("transparent")){changePlan("oldguard",-3,"Veřejná kontrola zpomalila staré struktury.");changePlan("press",2,"Transparentní krok přinesl ověřitelnou stopu.")}
 if(tags.includes("corrupt")||tags.includes("contract")){changePlan("business",5,"Soukromá dohoda urychlila Projekt SILO.");if(tags.includes("jzdDeal"))changePlan("jzd",5,"Dohoda upevnila mobilizaci JZD.")}
 if(tags.includes("pressAttack")||tags.includes("lie"))changePlan("press",4,"Rozpor přitáhl pozornost redakce.");
 if(tags.includes("police"))changePlan("jzd",-4,"Vyšetřování narušilo plán JZD.");
 if(eventId==="diesel"){if(tags.includes("corrupt")){state.conspiracy.joined=true;state.conspiracy.joinedDeals++;state.conspiracy.revealed=true}else if(success)addConspiracyClue("diesel","Stopa vznikla při řešení družstevní nafty.")}
 if(eventId==="roof"){state.worldChanges.school=success?"repaired":"damaged";if(tags.includes("contract")){state.conspiracy.joined=true;state.conspiracy.joinedDeals++}else if(success&&(tags.includes("transparent")||tags.includes("legal")))addConspiracyClue("roof")}
 if(eventId==="meadow"){state.worldChanges.meadow=tags.includes("contract")?"surveyed":"protected";if(tags.includes("contract")||tags.includes("corrupt")){state.conspiracy.joined=true;state.conspiracy.joinedDeals++}else if(success)addConspiracyClue("meadow")}
 if(state.conspiracy.joinedDeals>=2&&!state.flags.siloFinalQueued&&state.day>=6){schedule("siloOffer",5);state.flags.siloFinalQueued=true;state.conspiracy.revealed=true;addNews("Holub posílá pozvánku do zadního salonku. Projekt SILO má pro vás prázdnou židli.","bad")}
 if(eventId==="oldfiles"){state.worldChanges.townhall=tags.includes("destroyEvidence")?"smoke":"open";if(!tags.includes("destroyEvidence")&&success)addConspiracyClue("archive")}
 if(eventId==="newsletter")state.worldChanges.paper=tags.includes("pressAttack")?"hostile":"active";
}
function locationDesc(id){
 const d=locations[id].desc,w=state.worldChanges||{},fp=state.factionPlans||{};
 if(id==="school"&&w.school==="repaired")return"Střecha drží. Politické využití dětí nikoli.";
 if(id==="school"&&w.school==="damaged")return"Plachta vlaje jako volební program před rozpočtem.";
 if(id==="meadow"&&w.meadow==="surveyed")return"Geodetické kolíky rostou rychleji než tráva.";
 if(id==="meadow"&&w.meadow==="protected")return"Louka zatím patří lidem. Holub ji stále oslovuje jako budoucí aktivum.";
 if(id==="jzd"&&fp.jzd?.stage>=2)return"Nádrž je čerstvě umytá a zaměstnanci mají jednotný názor.";
 if(id==="townhall"&&fp.oldguard?.stage>=2)return"Dveře jsou otevřené. Přístup k volební komisi nikoli.";
 if(id==="paper"&&fp.press?.stage>=2)return"Redakce spojuje šipkami osoby, firmy a vaše výroky.";
 return d;
}
function planLocationMarker(id){
 const active=Object.entries(factionPlanDefs).filter(([pid,d])=>d.location===id&&state.factionPlans[pid]?.stage>0).map(([pid])=>factionPlanDefs[pid].icon);
 const pulse=(state.worldActions||[]).find(x=>x.day===state.day&&x.location===id)?"•":"";
 const rival=state.rivalOperation?.id&&rivalOperationDefs[state.rivalOperation.id]?.location===id&&!state.rivalOperation.completed?rivalOperationDefs[state.rivalOperation.id].icon:"";
 return [...active,rival,pulse].filter(Boolean).join("");
}

function relationshipKey(a,b){return Object.keys(relationshipDefs).find(k=>{const d=relationshipDefs[k];return (d.a===a&&d.b===b)||(d.a===b&&d.b===a)})}
function relationshipScore(a,b){const k=relationshipKey(a,b);return k?(state.relationships?.[k]??relationshipDefs[k].base):0}
function adjustRelationship(a,b,delta,reason=""){
 const k=relationshipKey(a,b);if(!k)return;state.relationships[k]=clamp((state.relationships[k]??relationshipDefs[k].base)+delta,-100,100);if(reason)addNews(`${companions[a]?.name||a} × ${companions[b]?.name||b}: ${reason}`,(delta<0?"bad":"normal"));
}
function resolveCompanionConflict(id,path){
 const c=state.conflictStates[id]||(state.conflictStates[id]={});c.resolved=true;c.path=path;c.aftermath=false;const d=conflictDefs[id];schedule(d.after,2);addNews(`Konflikt ve štábu byl dočasně uzavřen. V politice je slovo dočasně důležitější než uzavřen.`,"normal");
}
function triggerCompanionConflicts(){
 let specific=false;for(const [id,d] of Object.entries(conflictDefs)){const c=state.conflictStates[id]||(state.conflictStates[id]={queued:false,resolved:false,path:null,aftermath:false});if(c.queued||c.resolved)specific=true;if(state.day>=d.day&&state.party[d.a]&&state.party[d.b]&&!c.queued&&!c.resolved&&!state.flags["resolved_"+d.event]){c.queued=true;specific=true;schedule(d.event,2);addNews(`${state.party[d.a].name} a ${state.party[d.b].name} přestali předstírat, že jsou jeden tým.`,"bad")}}
 if(state.day>=9&&!specific&&!state.flags.generalConflictQueued&&!state.flags["resolved_conflictGeneral"]){const ids=Object.keys(state.party);if(ids.length>=2){let pair=null,score=999;for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const v=relationshipScore(ids[i],ids[j]);if(v<score){score=v;pair=[ids[i],ids[j]]}}state.flags.generalConflictPair=pair||ids.slice(0,2);state.flags.generalConflictQueued=true;schedule("conflictGeneral",2);addNews("Dvě osobnosti štábu zjistily, že sdílené logo není totéž co společný názor.","bad")}}
}
function supportEligible(id){const av=companionAvailability(id);return !!(av.ok&&state.party[id]&&state.companionStories?.[id]?.perk&&!state.companionSupportUsed?.[id])}
function selectedSupportBonus(choice){const id=state.selectedSupport;if(!id||!supportEligible(id))return 0;const p=supportProfiles[id];return p?.match(choice.tags||[])?3:1}
function supportBarHtml(){
 const ids=Object.keys(state.party).filter(supportEligible);if(!ids.length)return"";
 return `<div class="support-strip"><strong>Aktivní zásah družiny</strong><div class="support-actions">${ids.map(id=>`<button type="button" class="support-btn ${state.selectedSupport===id?"selected":""}" data-support="${id}">${companions[id].icon} ${companions[id].name}: ${supportProfiles[id].label}${state.selectedSupport===id?" · vybráno":""}</button>`).join("")}</div><small>Každý odemčený zásah lze použít jednou za kampaň. Konflikt, únava nebo nesplněná osobní agenda mohou podporu dočasně zablokovat.</small></div>`;
}
function bindSupportButtons(){document.querySelectorAll("[data-support]").forEach(b=>b.onclick=()=>{state.selectedSupport=state.selectedSupport===b.dataset.support?null:b.dataset.support;showEvent(state.currentEvent)})}
function consumeSelectedSupport(choice){const id=state.selectedSupport;if(!id||!supportEligible(id))return;const bonus=selectedSupportBonus(choice);state.companionSupportUsed[id]=true;state.partyFatigue[id]=clamp((state.partyFatigue[id]||0)+1,0,4);log(`${companions[id].name} použil aktivní zásah ${supportProfiles[id].label} (${bonus>1?"přesný":"improvizovaný"}).`);state.selectedSupport=null}
function coalitionResources(){
 const credibility=clamp(Math.round(state.stats.trust*.34+state.stats.integrity*.26+Math.max(0,state.factions.press)*.12+Math.max(0,state.factions.officials)*.12+state.promiseSummary.fulfilled*4-state.promiseSummary.broken*7-state.stats.heat*.09),0,100);
 const patronage=clamp(Math.round(state.stats.influence*.32+Math.max(0,state.factions.business)*.14+Math.max(0,state.factions.jzd)*.13+Math.max(0,state.stats.funds)*.55-state.debt*.35),0,100);
 const pressure=clamp(Math.round(state.stats.leverage*.75+Math.max(0,state.factions.oldguard)*.1+state.stats.influence*.12-state.stats.heat*.03),0,100);
 return {credibility,patronage,pressure};
}
function classCoalitionBonus(kind){const id=state.hero.classId;if(kind==="program"&&(id==="mage"||id==="technocrat"))return 3;if(kind==="program"&&id==="paladin")return 2;if(kind==="office"&&(id==="necro"||id==="rogue"))return 2;if(kind==="pressure"&&id==="rogue")return 3;if(kind==="pressure"&&id==="necro")return 2;if(kind==="spectacle"&&id==="bard")return 3;return 0}

function classMasteryEvent(){
 const list=classMasteryDefs[state.hero.classId]||[];
 return {id:"classMastery",location:"hq",title:"První skutečná specializace",emoji:classes[state.hero.classId].icon,kicker:"LEVEL UP",queued:true,
  text:()=>["Kampaň už není improvizace. Je to improvizace se systémem, rozpočtem a lidmi, kteří od vás čekají konkrétní typ zázraku.","Vyberte jednu specializaci. Volba změní aktivní schopnost třídy a některé taktické situace."],
  choices:list.map((p,i)=>({label:p.name,detail:p.desc,check:{attr:i?"cunning":"intellect",dc:10},tags:["classMastery"],
   success:makeOutcome(`Specializace ${p.name} byla zapsána do politického životopisu.`,{influence:3,trust:1},["classMastery"],()=>{state.classMastery=p.id;state.flags.classMasteryChosen=true}),
   fail:makeOutcome(`Specializace ${p.name} byla přijata, ale první interní prezentace skončila otázkou, zda existuje kratší verze.`,{influence:1,heat:2},["classMastery"],()=>{state.classMastery=p.id;state.flags.classMasteryChosen=true})
  }))};
}
function primaryRivalRead(){const rows=Object.entries(state.approachHeat||{}).sort((a,b)=>b[1]-a[1]);return rows[0]?.[1]>=2?rows[0][0]:null}
function updateRivalAI(){
 state.rivalAI=state.rivalAI||{adaptation:null,reads:{},counters:0,lastCounterDay:0,revealed:false};const read=primaryRivalRead();if(read){state.rivalAI.reads[read]=(state.rivalAI.reads[read]||0)+1;if((state.rivalAI.reads[read]||0)>=2)state.rivalAI.adaptation=read}
 state.rivalAI.revealed=state.hero.classId==="technocrat"||state.classMastery==="apparatusMemory"||state.factions.press>=25;
 if(state.day>=5&&state.rivalAI.adaptation&&state.rivalAI.lastCounterDay<state.day-2&&state.rivalAI.counters<3){const ev=rivalCounterDefs[state.rivalAI.adaptation]||"counterCynicism";if(!state.pendingEvents.includes(ev)&&!state.flags["resolved_"+ev]){schedule(ev,2);state.rivalAI.lastCounterDay=state.day;state.rivalAI.counters++;addNews(`Věčný reaguje na váš opakovaný styl. Připravil protiakci: ${eventById(ev).title}.`,"bad")}}
}
function rivalReadLabel(){const a=state.rivalAI?.adaptation;if(!a)return"Soupeř zatím hledá vzorec.";const labels={public:"veřejné show",legal:"právní a datové tahy",power:"mocenské útoky",corrupt:"zákulisní dohody",ethical:"morální apel"};return state.rivalAI.revealed?`Věčný se adaptoval na: ${labels[a]||a}.`:`Věčný se na něco připravuje. Přesný vzorec zatím neznáte.`}
function debateBaseState(){const dashboard=state.classMastery==="dashboard";return {active:true,round:1,maxRounds:5,playerRep:clamp(48+state.stats.support*.28+state.stats.trust*.18-state.stats.heat*.08,35,85),opponentRep:clamp(52+state.opponent.momentum*.28+Math.max(0,state.factions.oldguard)*.08,38,88),momentum:dashboard?4:2,mood:0,composure:clamp(state.stats.trust,20,100),intent:null,log:[],classUsed:false,companionUsed:{},nextBonus:0,cancelOpponent:false,opponentWeakened:0,lastCard:null,usedCards:{},chain:0,firstHitShield:state.classMastery==="unbroken",revealedIntent:false,result:null}}
function chooseRivalIntent(){
 const d=state.debate,last=d.lastCard,adapt=state.rivalAI?.adaptation;let pool=["emptyPromise","emotional","patronage","attackParty","silence"];if(last==="facts"||last==="expose")pool.push("reverseFacts","reverseFacts");if(adapt==="legal")pool.push("reverseFacts","silence");if(adapt==="public")pool.push("emotional","patronage");if(adapt==="power"||adapt==="corrupt")pool.push("attackParty","emotional");d.intent=pick(pool);return d.intent
}
function debateIntentText(){const m=rivalMoveDefs[state.debate.intent];if(!m)return"Věčný listuje poznámkami a hledá větu, kterou už řekl v roce 2006.";const exact=state.debate.revealedIntent||state.hero.classId==="technocrat"||state.classMastery==="apparatusMemory"||state.party.daniela?.loyalty>=65;return exact?`${m.icon} ${m.name}: ${m.hint}`:`🎭 Věčný připravuje protiútok. ${m.hint.replace(/Soupeř|Věčný/g,"Někdo")}`}
function debateCardModifier(id){const c=debateCardDefs[id];let mod=attributeMod(c.attr);if(state.classMastery==="appendix"&&(id==="facts"||id==="expose"))mod+=2;if(state.classMastery==="doubleFile"&&id==="expose")mod+=2;if(state.debate.nextBonus){mod+=state.debate.nextBonus}if(state.debate.mood>20&&c.tags.includes("public"))mod+=1;if(state.debate.mood<-20&&c.tags.includes("public"))mod-=1;if(state.rivalAI?.adaptation&&c.tags.includes(state.rivalAI.adaptation))mod-=2;const used=state.debate.usedCards?.[id]||0;if(used)mod-=Math.min(3,used);if(state.debate.lastCard===id)mod-=1;return clamp(mod,-3,8)}
function debateCardOdds(id){const c=debateCardDefs[id],m=debateCardModifier(id),counts={clean:0,costly:0,complication:0};for(let r=1;r<=20;r++){const l=rollLevel(r,r+m,c.dc);if(l==="critical"||l==="success")counts.clean++;else if(l==="costly")counts.costly++;else counts.complication++}return counts}
function classAbilityInfo(){const id=state.hero.classId,perk=state.classMastery;const defs={bard:["Přerámovat téma","Zvedne náladu sálu, Momentum a změní soupeřův tah."],rogue:["Zadní vchod","Poškodí soupeře, ukradne Momentum a zvýší mediální tlak."],paladin:["Veřejná přísaha","Obnoví reputaci a Důvěru; může vytvořit veřejný slib."],mage:["Formulář 37B","Zruší příští tah soupeře a oslabí jeho obranu."],technocrat:["Model dopadů","Přidá +3 k příštímu hodu a přesně odhalí záměr soupeře."],necro:["Návrat kádru","Přivolá aparát, poškodí soupeře a zvýší vliv i tlak."]};const x=defs[id];return {name:x[0],desc:x[1],perk}}
function useClassAbility(){const d=state.debate;if(!d.active||d.classUsed)return;d.classUsed=true;const id=state.hero.classId;if(id==="bard"){d.mood=clamp(d.mood+(state.classMastery==="chorus"?20:14),-50,50);d.momentum=clamp(d.momentum+2,0,6);if(state.classMastery==="heckler")d.cancelOpponent=true;chooseRivalIntent();d.log.unshift("🎤 Přerámovali jste téma. Publikum si pamatuje pointu, nikoli otázku.")}if(id==="rogue"){d.opponentRep=clamp(d.opponentRep-(state.classMastery==="doubleFile"?12:8),0,100);d.momentum=clamp(d.momentum+(state.classMastery==="quietDeal"?3:2),0,6);state.stats.heat=clamp(state.stats.heat+3);d.log.unshift("🕶️ Zadní vchod otevřel složku, kterou nikdo oficiálně nepřinesl.")}if(id==="paladin"){d.playerRep=clamp(d.playerRep+12,0,100);d.composure=clamp(d.composure+10,0,100);state.stats.trust=clamp(state.stats.trust+3);if(state.classMastery==="publicOath")addCommitment({id:"debate_oath",title:"Veřejně splnit hlavní slib z debaty",creditor:"Veřejnost",kind:"public",due:13,condition:"debateOath"});d.log.unshift("🛡️ Přísaha zvedla sál. Tisk si už připravuje kontrolní článek.")}if(id==="mage"){d.cancelOpponent=true;d.opponentWeakened=state.classMastery==="auditCircle"?3:2;d.momentum=clamp(d.momentum+1,0,6);d.log.unshift("🧙 Formulář 37B přesunul soupeřův tah do přílohy, kterou nikdo nenajde.")}if(id==="technocrat"){d.nextBonus=state.classMastery==="impactModel"?3:2;d.revealedIntent=true;d.momentum=clamp(d.momentum+1,0,6);d.log.unshift("📊 Model dopadů tvrdí, že pravděpodobnost pravdy je nenulová.")}if(id==="necro"){d.opponentRep=clamp(d.opponentRep-(state.classMastery==="reserveCadre"?13:9),0,100);d.momentum=clamp(d.momentum+2,0,6);state.factions.oldguard=clamp(state.factions.oldguard+5,-100,100);state.stats.heat=clamp(state.stats.heat+5);d.log.unshift("🧟 Aparát povstal. Někteří funkcionáři netušili, že už byli politicky mrtví.")}renderDebate()}
function debateAssist(id){const d=state.debate;if(!d.active||d.companionUsed[id]||!state.party[id])return;d.companionUsed[id]=true;const p=state.party[id];p.loyalty=clamp(p.loyalty+1);if(id==="marie"){d.playerRep=clamp(d.playerRep+7,0,100);d.mood=clamp(d.mood+10,-50,50);d.log.unshift("👩‍🏫 Marie přivedla rodiče a jednu fotografii kýblu ve třídě.")}if(id==="daniela"){d.opponentRep=clamp(d.opponentRep-10,0,100);d.revealedIntent=true;d.log.unshift("📰 Daniela ověřila dokument v přímém přenosu. Věčný poprvé žádá reklamní pauzu.")}if(id==="brazda"){d.playerRep=clamp(d.playerRep+9,0,100);d.momentum=clamp(d.momentum+1,0,6);addCommitment({id:`debate_brazda_${state.day}`,title:"Odměnit JZD za publikum v debatě",creditor:"Brázda",due:13});d.log.unshift("🚜 Brázda naplnil zadní řady. Potlesk přijel organizovaně.")}if(id==="bohumil"){d.cancelOpponent=true;d.composure=clamp(d.composure+8,0,100);d.log.unshift("🗄️ Bohumil našel procedurální důvod, proč soupeřova otázka neexistuje.")}if(id==="holub"){d.playerRep=clamp(d.playerRep+12,0,100);state.stats.integrity=clamp(state.stats.integrity-3);state.stats.funds=clamp(state.stats.funds-2,-99,999);d.log.unshift("💼 Holub dodal světla, publikum a spontánní transparenty ve firemním fontu.")}renderDebate()}
function startDebate(){
 if(state.quests.debate?.status!=="active")return;state.selectedSupport=null;state.phase="debate";state.currentEvent="debate";state.debate=debateBaseState();chooseRivalIntent();["startScreen","creationScreen","gameScreen","coalitionScreen","endingScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("debateScreen").classList.add("active");renderDebate()
}
function renderDebate(){const d=state.debate;if(!d.active)return;document.getElementById("debateHeroName").textContent=`${state.hero.name} · ${classes[state.hero.classId].name}`;document.getElementById("debatePlayerPortrait").textContent=classes[state.hero.classId].icon;document.getElementById("debatePlayerLabel").textContent=state.hero.name;document.getElementById("debatePlayerBar").style.width=d.playerRep+"%";document.getElementById("debateOpponentBar").style.width=d.opponentRep+"%";document.getElementById("debatePlayerRep").textContent=`Reputace ${Math.round(d.playerRep)}/100`;document.getElementById("debateOpponentRep").textContent=`Reputace ${Math.round(d.opponentRep)}/100`;document.getElementById("debateRound").textContent=`Kolo ${d.round}/${d.maxRounds} · vyberte taktiku`;document.getElementById("debateIntent").innerHTML=`<strong>${debateIntentText()}</strong><br><small>${rivalReadLabel()}</small>`;document.getElementById("debateMoodBar").style.width=clamp(d.mood+50)+"%";document.getElementById("debateMoodText").textContent=d.mood>20?"Publikum chce show a jednoduchý vítězný výrok.":d.mood<-20?"Sál je unavený, podezřívavý a připravený trestat přehánění.":"Publikum ještě poslouchá obě strany, což je předvolebně nebezpečný stav.";document.getElementById("debateStats").innerHTML=[["Momentum",d.momentum],["Důvěra",Math.round(d.composure)],["Tlak",Math.round(state.stats.heat)]].map(x=>`<div class="debate-stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");const ability=classAbilityInfo();document.getElementById("classAbilityBox").innerHTML=`<strong>${classes[state.hero.classId].icon} ${ability.name}</strong><p>${ability.desc}</p>${state.classMastery?`<span class="mastery-chip">Specializace: ${classMasteryDefs[state.hero.classId].find(x=>x.id===state.classMastery)?.name||state.classMastery}</span>`:"<span class='mastery-chip'>Bez specializace</span>"}<button id="useClassAbility" class="btn ${d.classUsed?"":"primary"}" ${d.classUsed?"disabled":""}>${d.classUsed?"Schopnost použita":"Použít schopnost"}</button>`;document.getElementById("useClassAbility").onclick=useClassAbility;document.getElementById("debateAssists").innerHTML=Object.entries(state.party).map(([id,p])=>`<button class="btn small assist-btn" data-assist="${id}" ${d.companionUsed[id]?"disabled":""}><span>${p.icon}</span><span>${p.name}<br><small>${d.companionUsed[id]?"zásah použit":p.mission}</small></span></button>`).join("")||"<p>Do debaty jste přišel sám. To je levné a fotogenicky prázdné.</p>";document.querySelectorAll("[data-assist]").forEach(b=>b.onclick=()=>debateAssist(b.dataset.assist));document.getElementById("debateCards").innerHTML=Object.entries(debateCardDefs).map(([id,c])=>{const o=debateCardOdds(id),need=c.leverage||0,used=d.usedCards?.[id]||0,blocked=d.momentum<c.cost||state.stats.leverage<need;return `<button class="debate-card" data-card="${id}" ${blocked?"disabled":""}><span class="card-cost">⚡ ${c.cost}</span><strong>${c.icon} ${c.name}</strong><small>${c.desc}</small><small>d20 + ${debateCardModifier(id)} proti ${c.dc} · úspěch ${o.clean*5}% · cena ${o.costly*5}%</small>${need?`<small>Kompromat: ${need}</small>`:""}${used?`<small>Opakování: ${used}× · soupeř čte vzorec</small>`:""}</button>`}).join("");document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>playDebateCard(b.dataset.card));document.getElementById("debateLog").innerHTML=d.log.length?d.log.slice(0,10).map((x,i)=>`<div class="debate-entry ${x.includes("Věčný")?"bad":i===0?"good":""}">${x}</div>`).join(""):"<div class='debate-entry'>Kamery běží. Pravda čeká venku, protože nemá akreditaci.</div>";document.getElementById("debateRetreat").onclick=()=>finishDebate("retreat")}
function playDebateCard(id){const d=state.debate,c=debateCardDefs[id];if(!d.active||d.momentum<c.cost||state.stats.leverage<(c.leverage||0))return;d.momentum-=c.cost;if(c.leverage)state.stats.leverage=clamp(state.stats.leverage-c.leverage);const mod=debateCardModifier(id),roll=rand(1,20),total=roll+mod,level=rollLevel(roll,total,c.dc);let mult=level==="critical"?1.45:level==="success"?1:level==="costly"?.7:.25;if(state.debate.opponentWeakened){mult+=state.debate.opponentWeakened*.08;state.debate.opponentWeakened=0}const previous=d.lastCard;d.usedCards=d.usedCards||{};let damage=Math.round(c.damage*mult);if(state.classMastery==="doubleFile"&&id==="expose")damage+=5;if(state.rivalAI?.adaptation&&c.tags.includes(state.rivalAI.adaptation))damage=Math.max(1,damage-3);d.opponentRep=clamp(d.opponentRep-damage,0,100);d.playerRep=clamp(d.playerRep+Math.round((c.heal||0)*(level==="complication"?.2:level==="costly"?.65:1)),0,100);d.mood=clamp(d.mood+(c.mood||0)*(level==="complication"?-0.5:1),-50,50);d.composure=clamp(d.composure+(c.trust||0)*(level==="complication"?-1:1),0,100);if(level==="critical")d.momentum=clamp(d.momentum+2,0,6);else if(level==="success")d.momentum=clamp(d.momentum+1,0,6);if(level==="complication"){d.playerRep=clamp(d.playerRep-5,0,100);state.stats.heat=clamp(state.stats.heat+3)}if(id==="promise"&&level!=="complication")addCommitment({id:`debate_promise_${d.round}`,title:"Splnit slib pronesený v televizní debatě",creditor:"Veřejnost",kind:"public",due:13,condition:"debateOath"});if(previous&&previous!==id&&level!=="complication"){d.chain++;if(d.chain%2===0){d.momentum=clamp(d.momentum+1,0,6);d.log.unshift("🔗 Střídání taktik vytvořilo kombo: +1 Momentum.")}}else if(previous===id)d.chain=0;d.usedCards[id]=(d.usedCards[id]||0)+1;d.log.unshift(`${c.icon} ${c.name}: hod ${roll}+${mod} proti ${c.dc}. ${level==="critical"?"Kritický zásah":level==="success"?"Čistý zásah":level==="costly"?"Zásah za cenu":"Taktická komplikace"}; Věčný −${damage}.`);d.lastCard=id;d.nextBonus=0;resolveRivalMove();state.audit.rolls++;state.audit.outcomes[level]=(state.audit.outcomes[level]||0)+1;if(d.playerRep<=0||d.opponentRep<=0||d.round>=d.maxRounds)return finishDebate();d.round++;chooseRivalIntent();renderDebate()}
function resolveRivalMove(){const d=state.debate,m=rivalMoveDefs[d.intent];if(d.cancelOpponent){d.log.unshift(`🛑 ${m.name} byl zrušen dřív, než se stihl stát stanoviskem.`);d.cancelOpponent=false;return}let damage=m.damage+2+(d.round>=4?2:0);if(m.counter?.includes(d.lastCard))damage+=7;if(d.firstHitShield){damage=Math.ceil(damage/2);d.firstHitShield=false;d.log.unshift("🛡️ Nezlomný mandát absorboval polovinu prvního protiútoku.")}d.playerRep=clamp(d.playerRep-damage,0,100);d.opponentRep=clamp(d.opponentRep+(m.heal||0),0,100);d.mood=clamp(d.mood+(m.mood||0),-50,50);d.composure=clamp(d.composure+(m.trust||0),0,100);if(m.party){const ids=Object.keys(state.party);if(ids.length){const id=ids.sort((a,b)=>state.party[a].loyalty-state.party[b].loyalty)[0];state.party[id].loyalty=clamp(state.party[id].loyalty-4);d.log.unshift(`🪓 Věčný zasáhl ${state.party[id].name}: loajalita −4.`)}}if(m.adapt&&state.rivalAI?.adaptation)d.momentum=Math.max(0,d.momentum-1);d.log.unshift(`${m.icon} Věčný: ${m.name}. Vaše reputace −${damage}.`)}
function finishDebate(forced=null){const d=state.debate;if(!d.active)return;d.active=false;let diff=d.playerRep-d.opponentRep,grade=forced==="retreat"?"retreat":diff>=18?"dominant":diff>0?"win":diff>-10?"draw":"loss";state.flags.debateGrade=grade;state.flags.debateScore=Math.round(diff);if(grade==="dominant"){effect({support:13,trust:8,press:8,oldguard:-12,integrity:4});state.opponent.momentum=clamp(state.opponent.momentum-14);for(const id of Object.keys(voterDefs))adjustVoter(id,4,.01);addNews("Věčný prohrál debatu tak přesvědčivě, že jeho tým označil záznam za deepfake.","normal")}else if(grade==="win"){effect({support:8,trust:5,press:4,oldguard:-7});state.opponent.momentum=clamp(state.opponent.momentum-8);for(const id of Object.keys(voterDefs))adjustVoter(id,2);addNews("Debatu jste vyhrál. Místní rozhlas připouští, že mohlo jít o technickou závadu.","normal")}else if(grade==="draw"){effect({support:2,heat:3});state.opponent.momentum=clamp(state.opponent.momentum+2);addNews("Debata skončila remízou. Obě strany oznámily historické vítězství.")}else{effect({support:-8,trust:-5,oldguard:9,heat:4});state.opponent.momentum=clamp(state.opponent.momentum+10);addNews(forced==="retreat"?"Z debaty jste odešel. Věčný zbytek večera debatoval se svou vlastní zkušeností.":"Věčný vyhrál debatu a okamžitě slíbil, že výsledek nebude zneužívat déle než do voleb.","bad")}completeQuest("debate",`Debata: ${grade}, skóre ${Math.round(d.playerRep)}:${Math.round(d.opponentRep)}.`);state.rivalAI.adaptation=primaryRivalRead()||state.rivalAI.adaptation;if(grade==="dominant"||grade==="win")schedule(rivalCounterDefs[state.rivalAI.adaptation]||"counterCynicism",2);log(`Velká debata: ${grade}, reputace ${Math.round(d.playerRep)}:${Math.round(d.opponentRep)}.`);document.getElementById("debateScreen").classList.remove("active");document.getElementById("gameScreen").classList.add("active");consumeAction();if(!state.ended)showMap()}
function simulateDebate(strategy="mixed"){state.debate=debateBaseState();chooseRivalIntent();const cid=state.hero.classId;if(cid==="bard"){state.debate.mood+=14;state.debate.momentum=clamp(state.debate.momentum+2,0,6)}if(cid==="rogue"){state.debate.opponentRep=clamp(state.debate.opponentRep-8);state.debate.momentum=clamp(state.debate.momentum+2,0,6)}if(cid==="paladin"){state.debate.playerRep=clamp(state.debate.playerRep+12);state.debate.composure=clamp(state.debate.composure+10)}if(cid==="mage")state.debate.cancelOpponent=true;if(cid==="technocrat"){state.debate.nextBonus=state.classMastery==="impactModel"?3:2;state.debate.revealedIntent=true}if(cid==="necro"){state.debate.opponentRep=clamp(state.debate.opponentRep-(state.classMastery==="reserveCadre"?13:9));state.debate.momentum=clamp(state.debate.momentum+2,0,6)}let guard=0;while(state.debate.active&&guard++<8){const score=(id)=>{const t=debateCardDefs[id].tags;if(strategy==="ideal")return (t.includes("ethical")?8:0)+(t.includes("transparent")?6:0);if(strategy==="corrupt")return id==="expose"?10:t.includes("power")?6:0;if(strategy==="legal")return id==="facts"?10:0;if(strategy==="populist")return t.includes("public")?8:0;return rng()*6};const options=Object.keys(debateCardDefs).filter(id=>state.debate.momentum>=debateCardDefs[id].cost&&state.stats.leverage>=(debateCardDefs[id].leverage||0)).sort((a,b)=>score(b)-score(a));if(!options.length){state.debate.momentum++;continue}const id=options[0],c=debateCardDefs[id],mod=debateCardModifier(id),roll=rand(1,20),level=rollLevel(roll,roll+mod,c.dc),mult=level==="critical"?1.45:level==="success"?1:level==="costly"?.7:.25;const previous=state.debate.lastCard;state.debate.usedCards=state.debate.usedCards||{};state.debate.momentum-=c.cost;state.debate.opponentRep=clamp(state.debate.opponentRep-Math.round(c.damage*mult),0,100);state.debate.playerRep=clamp(state.debate.playerRep+Math.round((c.heal||0)*mult),0,100);if(previous&&previous!==id&&level!=="complication")state.debate.momentum=clamp(state.debate.momentum+((state.debate.chain||0)%2===1?1:0),0,6);state.debate.chain=previous&&previous!==id?(state.debate.chain||0)+1:0;state.debate.usedCards[id]=(state.debate.usedCards[id]||0)+1;state.debate.lastCard=id;resolveRivalMove();if(state.debate.playerRep<=0||state.debate.opponentRep<=0||state.debate.round>=state.debate.maxRounds)break;state.debate.round++;chooseRivalIntent()}const diff=state.debate.playerRep-state.debate.opponentRep;state.flags.debateGrade=diff>=18?"dominant":diff>0?"win":diff>-10?"draw":"loss";state.debate.active=false;completeQuest("debate",`Simulovaná debata ${state.flags.debateGrade}.`);return state.flags.debateGrade}
function triggerCompanionStories(){for(const [id,d] of Object.entries(companionStoryDefs)){const ev=id+"Personal",cs=state.companionStories[id];if(state.party[id]&&cs&&!cs.done&&state.day>=d.day&&!state.flags["personalQueued_"+id]&&!state.flags["resolved_"+ev]){schedule(ev,3);state.flags["personalQueued_"+id]=true;addNews(`${state.party[id].name} chce řešit osobní problém: ${d.title}. Ignorování sníží loajalitu.`,"bad")}}}
function companionQuestAvailable(id){const cs=state.companionStories[id],d=companionStoryDefs[id];return !!(state.party[id]&&cs&&!cs.done&&state.day>=d.day)}
function unlockCompanionPerk(id,perk){if(state.companionStories[id]){state.companionStories[id].done=true;state.companionStories[id].perk=perk}addNews(`${state.party[id]?.name||id} získává aktivní roli: ${perk}.`)}
function shiftLoyalty(id,delta){if(state.party[id])state.party[id].loyalty=clamp(state.party[id].loyalty+delta)}

function initVoters(){state.voters={};for(const [id,v] of Object.entries(voterDefs))state.voters[id]={support:v.base,turnout:v.turnout}}
function questDeadline(id){return (questDefs[id]?.deadline||99)+(state.quests[id]?.deadlineBonus||0)}
function adjustVoter(id,delta,turnout=0){if(!state.voters[id])return;const cur=state.voters[id].support;if(delta>0&&cur>=70)delta*=.35;else if(delta>0&&cur>=55)delta*=.65;state.voters[id].support=clamp(cur+delta);state.voters[id].turnout=Math.max(.15,Math.min(.95,state.voters[id].turnout+turnout))}
function applyVoterReaction(tags=[],eventId="",level="success"){
 const pos=level==="critical"?1.3:level==="success"?1:level==="costly"?.55:-.65;
 const neg=level==="critical"?.35:level==="success"?.55:level==="costly"?1:1.5;
 const d=(id,n,t=0)=>adjustVoter(id,Math.round(n*(n>=0?pos:neg)*.68),t*(n>=0?pos:neg)*.75);
 if(tags.includes("ethical")){d("parents",3);d("undecided",3);d("disengaged",2,.015)}
 if(tags.includes("transparent")){d("officials",4);d("parents",2);d("undecided",4)}
 if(tags.includes("public")){d("seniors",2);d("club",2);d("disengaged",3,.025)}
 if(tags.includes("children")){d("parents",7)}
 if(tags.includes("jzdDeal")){d("jzdWorkers",7);if(level==="costly"||level==="complication")d("undecided",-2)}
 if(tags.includes("police")){d("jzdWorkers",-5);d("officials",3)}
 if(tags.includes("contract")){d("entrepreneurs",6);if(level==="costly"||level==="complication")d("parents",-3)}
 if(tags.includes("corrupt")){
  if(level==="critical"||level==="success"){d("entrepreneurs",4);d("undecided",-1)}
  else if(level==="costly"){d("parents",-3);d("undecided",-4);d("officials",-3);d("entrepreneurs",2)}
  else{d("parents",-7);d("undecided",-8);d("officials",-6);d("entrepreneurs",-2)}
 }
 if(tags.includes("legal")){d("officials",6);d("undecided",2)}
 if(tags.includes("lie")){
  if(level==="critical"||level==="success"){d("seniors",3);d("disengaged",3,.02);d("undecided",-1)}
  else{d("seniors",-2);d("undecided",-5);d("parents",-3)}
 }
 if(tags.includes("antiBusiness")){d("entrepreneurs",-8);d("undecided",2)}
 if(eventId==="football")d("club",8);
 if(["roof","water","roofEmergency","roofCollapse"].includes(eventId))d("parents",5);
 if(["diesel","auditLeak","leakedTape"].includes(eventId))d("jzdWorkers",4);
 if(["waste","wasteStrike"].includes(eventId)){d("seniors",4);d("disengaged",4,.02)}
 if(eventId==="debate"){for(const id of Object.keys(voterDefs))d(id,2)}
}
function actionCost(choice,e=null){
 if(e?.id==="settleAccounts"&&choice.key==="repay")return activeCommitments("Tiskárna Klička").reduce((s,c)=>s+(c.amount||1),0);
 if(choice.cost!==undefined)return Math.max(0,choice.cost);
 const vals=[choice.success?.effects?.funds,choice.fail?.effects?.funds].filter(v=>typeof v==="number");
 if(vals.some(v=>v<0)||vals.some(v=>v>0))return 0;
 const tags=choice.tags||[];
 if(e?.repeatable)return tags.includes("lie")?3:2;
 if(tags.includes("corrupt")||tags.includes("contract")||tags.includes("jzdDeal"))return 0;
 if(tags.includes("public")||tags.includes("ethical"))return 1;
 if(tags.includes("transparent")||tags.includes("legal")||tags.includes("power")||tags.includes("lie"))return 1;
 return 0;
}
function addCommitment(data){
 if(state.commitments.some(c=>c.id===data.id&&c.status==="active"))return;
 state.commitments.push({id:data.id||`commitment_${++state.commitmentSeq}`,title:data.title,creditor:data.creditor||"Veřejnost",kind:data.kind||"private",due:data.due||13,status:"active",amount:data.amount||0,condition:data.condition||null,source:data.source||state.currentEvent,notes:data.notes||""});
 addNews(`Nový ${data.kind==="public"?"veřejný slib":"politický závazek"}: ${data.title}.`,data.kind==="public"?"normal":"bad");
}
function activeCommitments(creditor=null){return state.commitments.filter(c=>c.status==="active"&&(!creditor||c.creditor===creditor))}
function settleCommitments(creditor,status="fulfilled"){
 const list=activeCommitments(creditor);list.forEach(c=>c.status=status);return list.length;
}
function addManifestoPromises(){
 addCommitment({id:"promise_roof",title:"Škola nebude potřebovat deštníky",creditor:"Veřejnost",kind:"public",due:13,condition:"roof"});
 addCommitment({id:"promise_meadow",title:"O osudu louky rozhodnou lidé, ne bagr",creditor:"Veřejnost",kind:"public",due:13,condition:"meadow"});
 addCommitment({id:"promise_open",title:"Smlouvy a rozpočet budou dohledatelné",creditor:"Veřejnost",kind:"public",due:13,condition:"transparent"});
}
function createCommitmentFromChoice(eventId,choice,level){
 if(level==="complication"&&rng()<.45)return;
 const tags=choice.tags||[],label=choice.label||"";
 if(eventId==="intro"&&tags.includes("transparent"))addCommitment({id:"promise_radnice",title:"Otevřít radnici a zveřejnit smlouvy",creditor:"Veřejnost",kind:"public",due:13,condition:"transparent"});
 if(eventId==="hqVolunteers"&&label.includes("pět konkrétních"))addManifestoPromises();
 if((eventId==="intro"||eventId==="register")&&tags.includes("jzdDeal"))addCommitment({id:"brazda_entry",title:"Dát Brázdovi vliv na volební a zemědělský výbor",creditor:"Brázda",due:7,notes:"Podpora při vstupu do kampaně"});
 if(eventId==="diesel"&&tags.includes("corrupt"))addCommitment({id:"brazda_diesel",title:"Nechat Radovana a družstevní naftu na pokoji",creditor:"Brázda",due:9,notes:"Cena za lidi, pódium a peníze"});
 if(eventId==="roof"&&tags.includes("contract"))addCommitment({id:"holub_roof",title:"Přiklepnout Holubovi dodatek ke školní zakázce",creditor:"Holub",due:10,notes:"Rychlá oprava školy"});
 if(eventId==="meadow"&&(tags.includes("contract")||tags.includes("corrupt")))addCommitment({id:"holub_meadow",title:"Prosadit změnu územního plánu pro Holuba",creditor:"Holub",due:11,notes:"Developer financuje kampaň"});
 if(eventId==="oldfiles"&&tags.includes("destroyEvidence"))addCommitment({id:"bohumil_archive",title:"Ochraňovat Bohumila a jeho místo na úřadě",creditor:"Bohumil",due:12,notes:"Tepelná skartace archivu"});
 if(eventId==="genericJzd"&&tags.includes("corrupt"))addCommitment({id:`jzd_donation_${state.day}`,title:"Vrátit JZD laskavost za dar bez účtenky",creditor:"Brázda",due:Math.min(13,state.day+3),notes:"Kampaňové financování"});
}
function chargeChoice(choice){
 const cost=actionCost(choice,eventById(state.currentEvent));if(cost<=0)return true;
 if(choice.requireFunds&&state.stats.funds<cost){alert(`Na tuto možnost potřebujete ${cost}, ale kampaň má jen ${state.stats.funds}. Zvolte refinancování nebo sbírku.`);return false;}
 if(state.stats.funds>=cost){effect({funds:-cost});return}
 const shortage=cost-Math.max(0,state.stats.funds);state.stats.funds=0;state.debt+=shortage;
 addCommitment({id:`credit_${++state.commitmentSeq}`,title:`Překlenovací dluh kampaně ve výši ${shortage}`,creditor:"Tiskárna Klička",due:13,amount:shortage,notes:"Akce byla provedena na fakturu po volbách"});
 addNews(`Kampaň neměla na akci peníze. Tiskárna Klička ji provedla na politický dluh ${shortage}.`,"bad");return true;
}
function rollLevel(roll,total,dc){
 if(roll===20)return"critical";
 if(roll===1)return"complication";
 if(total>=dc+2)return"success";
 if(total>=dc-1)return"costly";
 return"complication";
}
function costlyPenalty(tags=[],eventId=""){
 const e={heat:3};
 if(tags.includes("ethical")||tags.includes("transparent"))e.funds=-2;
 else if(tags.includes("corrupt")||tags.includes("lie")){e.trust=-3;e.integrity=-2}
 else e.support=-2;
 if(["roof","water","waste"].includes(eventId))e.heat+=2;
 return e;
}
function dispatchCompanion(id){
 if(state.phase!=="map")return alert("Družinu lze vysílat jen z mapy.");
 if(state.partyUsedDay===state.day||state.partyAssignment)return alert("Dnes už jednu politickou výpravu řídíte. Více delegování by připomínalo státní správu.");
 const p=state.party[id];if(!p)return;state.partyFatigue=state.partyFatigue||{};const fatigue=state.partyFatigue[id]||0;if(fatigue>=4)return alert(`${p.name} je politicky vyčerpaný. Jeden den bez mise je levnější než veřejná zrada.`);state.partyAssignment={id,day:state.day};state.partyUsedDay=state.day;state.partyFatigue[id]=fatigue+2;
 addNews(`${p.name} vyráží na misi: ${p.mission}. Výsledek přijde na konci dne.`);log(`${p.name} vyslán na misi ${p.mission}.`);renderAll();
}
function resolvePartyAssignment(){
 const a=state.partyAssignment;if(!a)return;const p=state.party[a.id];state.partyAssignment=null;if(!p)return;
 const perk=state.companionStories?.[a.id]?.perk,roll=rand(1,20),fatigue=state.partyFatigue?.[a.id]||0,mod=Math.floor(p.loyalty/22)+(state.stats.influence>=55?1:0)+(perk?2:0)-Math.floor(fatigue/2),level=rollLevel(roll,roll+mod,perk?11:12);let text="",ef={};
 if(a.id==="marie"){ef=level==="critical"?{support:8,trust:7,citizens:7}:level==="success"?{support:5,trust:4,citizens:5}:level==="costly"?{support:3,trust:2,funds:-2}:{trust:-4,support:-2};text=`Marie ${level==="complication"?"se pohádala s rodiči kvůli využívání dětí v kampani":"mobilizovala rodiče a dobrovolníky"}.`;adjustVoter("parents",level==="complication"?-6:level==="costly"?3:7,.02)}
 if(a.id==="daniela"){ef=level==="critical"?{leverage:7,press:8,heat:-8}:level==="success"?{leverage:4,press:5,heat:-4}:level==="costly"?{leverage:3,press:2,heat:2}:{press:-5,heat:8,trust:-3};text=`Daniela ${level==="complication"?"našla stopu, která vede i k vám":"prověřila dokumenty a oddělila kauzu od hospodské legendy"}.`;adjustVoter("undecided",level==="complication"?-4:4)}
 if(a.id==="brazda"){ef=level==="critical"?{support:7,influence:8,jzd:8,funds:5}:level==="success"?{support:4,influence:5,jzd:6,funds:3}:level==="costly"?{support:3,jzd:4,integrity:-3}:{jzd:-6,heat:6,opponent:0};text=`Brázda ${level==="complication"?"svolal lidi, ale nechal je vyfotit s Věčným":"přivezl venkov i volební logistiku"}.`;if(level!=="complication")addCommitment({id:`brazda_mission_${state.day}`,title:"Odměnit Brázdu za mobilizaci JZD",creditor:"Brázda",due:Math.min(13,state.day+3),notes:"Aktivní mise družiny"});adjustVoter("jzdWorkers",level==="complication"?-5:6,.015)}
 if(a.id==="bohumil"){const urgent=Object.entries(state.quests).filter(([id,q])=>q.status==="active"&&questDefs[id]).sort((x,y)=>questDeadline(x[0])-questDeadline(y[0]))[0];if(urgent&&level!=="complication")state.quests[urgent[0]].deadlineBonus=(state.quests[urgent[0]].deadlineBonus||0)+1;ef=level==="critical"?{officials:8,heat:-6,leverage:3}:level==="success"?{officials:5,heat:-3}:level==="costly"?{officials:3,leverage:2}:{officials:-5,heat:7};text=`Bohumil ${level==="complication"?"našel dokument, ale omylem jej rozeslal i opozici":"našel procesní prostor a posunul nejbližší termín"}.`;adjustVoter("officials",level==="complication"?-5:6)}
 if(a.id==="holub"){ef=level==="critical"?{funds:10,business:9,influence:5}:level==="success"?{funds:7,business:6}:level==="costly"?{funds:5,business:4,heat:4}:{funds:2,heat:10,trust:-4};text=`Holub ${level==="complication"?"sehnal peníze i fotografa, který zdokumentoval jejich původ":"zajistil financování a profesionální servis"}.`;if(level!=="complication")addCommitment({id:`holub_mission_${state.day}`,title:"Vrátit Holubovi laskavost za financování",creditor:"Holub",due:Math.min(13,state.day+3),notes:"Aktivní mise družiny"});adjustVoter("entrepreneurs",level==="complication"?-3:6)}
 if(perk&&level!=="complication"){if(a.id==="daniela")addConspiracyClue(pick(["diesel","roof","meadow","archive"]),"Daniela využila osobní schopnost při misi.");if(a.id==="bohumil")changePlan("oldguard",-5,"Bohumil procesně zdržel staré struktury.");if(a.id==="brazda")changePlan("jzd",-4,"Brázda přesměroval vlastní síť.");if(a.id==="holub"&&state.conspiracy.exposed)changePlan("business",-5,"Holub zachraňuje vlastní projekt ústupky.");}
 effect(ef);p.loyalty=clamp(p.loyalty+(level==="critical"?5:level==="success"?2:level==="costly"?-1:-7));addNews(`${text} Hod ${roll}+${mod}: ${level==="critical"?"mimořádný úspěch":level==="success"?"úspěch":level==="costly"?"úspěch za cenu":"komplikace"}.`,level==="complication"?"bad":"normal");log(text);
}
function promiseConditionMet(c){
 if(c.condition==="roof")return state.quests.roof?.status==="done";
 if(c.condition==="meadow")return state.quests.meadow?.status==="done"&&state.factions.citizens>=0;
 if(c.condition==="transparent")return state.stats.integrity>=62&&(hasItem("auditReport")||state.factions.officials>=5||state.factions.press>=5);
 if(c.condition==="debateOath")return state.flags.debateGrade==="dominant"||state.flags.debateGrade==="win"||state.stats.trust>=65;
 return false;
}
function evaluateCommitments(){
 let fulfilled=0,broken=0;
 state.commitments.forEach(c=>{if(c.status!=="active")return;if(c.kind==="public"&&promiseConditionMet(c)){c.status="fulfilled";fulfilled++;adjustVoter("undecided",5);adjustVoter("parents",3)}else{c.status="broken";broken++;if(c.kind==="public"){effect({trust:-4,integrity:-3});adjustVoter("undecided",-6);adjustVoter("disengaged",-3)}else{effect({influence:-3,heat:4});if(c.creditor==="Brázda")adjustVoter("jzdWorkers",-7);if(c.creditor==="Holub")adjustVoter("entrepreneurs",-8);if(c.creditor==="Bohumil")adjustVoter("officials",-7);if(c.creditor==="Tiskárna Klička")state.debt+=c.amount||1}}});
 fulfilled+=state.commitments.filter(c=>c.status==="fulfilled").length-fulfilled;broken+=state.commitments.filter(c=>c.status==="broken").length-broken;state.promiseSummary={fulfilled,broken,active:0};
}
const questDefs={
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
function initQuests(){
 state.quests={
  register:{status:"active",stage:0},diesel:{status:"active",stage:0},roof:{status:"active",stage:0},
  meadow:{status:"locked",stage:0},paper:{status:"locked",stage:0},oldfiles:{status:"locked",stage:0},debate:{status:"locked",stage:0},
  water:{status:"locked",stage:0},budget:{status:"locked",stage:0},waste:{status:"locked",stage:0},ballots:{status:"locked",stage:0}
 };
}
function addNews(text,type="normal"){state.news.unshift({day:state.day,text,type});state.news=state.news.slice(0,10)}
function log(text){state.log.push(`Den ${state.day}: ${text}`)}
function effect(e={}){
 for(const [k,v] of Object.entries(e)){
  if(k in state.stats){
   let delta=v,current=state.stats[k];
   if(delta>0&&["support","trust","integrity","influence"].includes(k)){
    if(current>=85)delta=Math.max(1,Math.round(delta*.25));
    else if(current>=70)delta=Math.max(1,Math.round(delta*.55));
   }
   state.stats[k]=clamp(current+delta,k==="funds"?-20:0,k==="heat"?150:100);
  }else if(k in state.factions) state.factions[k]=clamp(state.factions[k]+v,-100,100);
 }
}
function addParty(id,delta=0){
 if(!state.party[id]) state.party[id]={...companions[id],loyalty:companions[id].loyalty};
 state.party[id].loyalty=clamp(state.party[id].loyalty+delta);
}
function partyReact(tags=[]){
 Object.entries(state.party).forEach(([id,p])=>{
  let d=0;
  if(id==="marie"){if(tags.includes("ethical"))d+=6;if(tags.includes("corrupt"))d-=14;if(tags.includes("children"))d+=5}
  if(id==="daniela"){if(tags.includes("transparent"))d+=7;if(tags.includes("lie"))d-=12;if(tags.includes("pressAttack"))d-=18}
  if(id==="brazda"){if(tags.includes("power"))d+=5;if(tags.includes("police"))d-=16;if(tags.includes("jzdDeal"))d+=8}
  if(id==="bohumil"){if(tags.includes("legal"))d+=5;if(tags.includes("destroyEvidence"))d-=14}
  if(id==="holub"){if(tags.includes("contract"))d+=10;if(tags.includes("antiBusiness"))d-=13}
  p.loyalty=clamp(p.loyalty+d);
  if(p.loyalty<=12){
   addNews(`${p.name} opouští vaši družinu. Oficiálně z osobních důvodů, neoficiálně kvůli vám.`,"bad");
   log(`${p.name} odešel z družiny.`);
   delete state.party[id];
   if(id==="daniela"||id==="bohumil")state.opponent.scandals+=1;
  }else if(p.loyalty<=25 && rng()<.25){
   addNews(`${p.name} poskytl anonymní rozhovor, v němž vás označil za člověka s dynamickým charakterem.`,"bad");
   effect({heat:6,trust:-3});
  }
 });
}
function hasItem(id){return state.items.includes(id)}
function addItem(id){if(!hasItem(id))state.items.push(id)}
function completeQuest(id,note){
 if(state.quests[id])state.quests[id].status="done";
 if(note)log(note);
}
function failQuest(id,note){
 if(state.quests[id])state.quests[id].status="failed";
 if(note)log(note);
}
function unlockQuest(id){if(state.quests[id]&&state.quests[id].status==="locked")state.quests[id].status="active"}
function primaryApproach(tags=[]){
 const order=["corrupt","transparent","ethical","lie","power","legal","public","contract","jzdDeal"];
 return order.find(x=>tags.includes(x))||"neutral";
}
function approachPenalty(choice){
 const a=primaryApproach(choice.tags||[]),heat=state.approachHeat?.[a]||0;
 if(a==="neutral")return 0;
 const repeated=(state.lastApproaches||[]).slice(-2).filter(x=>x===a).length;
 return (heat>=6?2:heat>=3?1:0)+(repeated>=2?1:0);
}
function registerApproach(tags=[]){
 const a=primaryApproach(tags);state.approachHeat=state.approachHeat||{};state.lastApproaches=state.lastApproaches||[];
 if(a!=="neutral"){state.approachHeat[a]=(state.approachHeat[a]||0)+1;state.lastApproaches.push(a);state.lastApproaches=state.lastApproaches.slice(-5);state.audit.approaches[a]=(state.audit.approaches[a]||0)+1}
}
function decayApproaches(){for(const k of Object.keys(state.approachHeat||{}))state.approachHeat[k]=Math.max(0,state.approachHeat[k]-1)}
function currentProjection(){
 let ballots=0,votes=0;for(const [id,d] of Object.entries(voterDefs)){const v=state.voters[id]||{support:d.base,turnout:d.turnout};const b=d.population*v.turnout;ballots+=b;votes+=b*v.support/100}
 let center=Math.round(votes/Math.max(1,ballots)*.72+state.stats.support*.18+state.stats.trust*.06-state.stats.heat*.025-state.debt*.08);
 if(state.conspiracy?.exposed)center+=3;if(state.conspiracy?.joined&&state.conspiracy?.resolved)center+=4;center=clamp(center,5,70);
 const uncertainty=Math.max(3,8-Math.floor(state.day/3));const low=clamp(center-uncertainty,3,70),high=clamp(center+uncertainty,3,72);
 const lc=councilResult(low),hc=councilResult(high),mid=councilResult(center);return {center,low,high,seats:mid.seats,seatLow:lc.seats,seatHigh:hc.seats,majority:mid.majority};
}
function nextThreat(){
 const pending=state.pendingEvents.map(id=>({id,meta:state.pendingMeta[id],e:eventById(id)})).filter(x=>x.e).sort((a,b)=>(a.meta?.expiresDay||99)-(b.meta?.expiresDay||99))[0];
 if(pending)return `${pending.e.title} · do dne ${pending.meta?.expiresDay||state.day+1}`;
 const [id,p]=Object.entries(state.factionPlans||{}).sort((a,b)=>(b[1].progress||0)-(a[1].progress||0))[0]||[];return id?`${factionPlanDefs[id].name} · ${Math.round(p.progress)} %`:"Věčný zatím pouze dýchá politicky";
}
function nextDeadline(){
 const active=Object.entries(state.quests).filter(([id,q])=>q.status==="active"&&questDefs[id]).sort((a,b)=>questDeadline(a[0])-questDeadline(b[0]));
 if(!active.length)return "Žádný známý termín";const [id]=active[0],left=questDeadline(id)-state.day;return `${questDefs[id].title} · ${left<=0?"dnes":left+" dny"}`;
}
function attributeMod(attr){
 let m=state.hero.attrs[attr]||0;
 if(hasItem("megaphone")&&attr==="charisma")m+=1;
 return m;
}
function schedule(id,ttl=null){
 if(!state.pendingEvents.includes(id)&&!state.flags["resolved_"+id]){
  state.pendingEvents.push(id);
  if(ttl!==null)state.pendingMeta[id]={scheduledDay:state.day,expiresDay:state.day+ttl};
 }
}
function makeOutcome(text,effects,tags=[],extra=()=>{}){return {text,effects,tags,extra}}
function checkBreakdown(choice){
 const rows=[],tags=choice.tags||[],c=classes[state.hero.classId],add=(label,val)=>{if(val)rows.push({label,val})};
 add(metricName(choice.check.attr),attributeMod(choice.check.attr));
 if(c.ability==="form"&&(tags.includes("legal")||tags.includes("contract")||state.currentEvent==="auditLeak"||state.currentEvent==="documentWar"))add("Dotační mág",2);
 if(c.ability==="model"&&(choice.check.attr==="intellect"||tags.includes("legal")||tags.includes("transparent")))add("Technokrat",1);
 if(c.ability==="revive"&&(tags.includes("power")||state.factions.oldguard>20))add("Nekromant",2);
 if(c.ability==="oath"&&tags.includes("ethical"))add("Paladinova přísaha",2);
 if(c.ability==="shadow"&&tags.includes("corrupt"))add("Rogue ve stínu",2);
 if(c.ability==="reframe"&&tags.includes("public"))add("Bardův refrén",1);
 if(state.hero.origin==="idealist"&&(tags.includes("ethical")||tags.includes("transparent")))add("Motivace: idealista",1);
 if(state.hero.origin==="ambitious"&&(tags.includes("power")||tags.includes("public")))add("Motivace: ambice",1);
 if(state.hero.origin==="revenge"&&(["debate","oldfiles","anonymousLeaflet"].includes(state.currentEvent)||tags.includes("antiBusiness")))add("Motivace: pergola",1);
 const partyBonus=(id,match)=>{const p=state.party[id];if(!p||!match)return 0;return p.loyalty>=65?2:p.loyalty>=40?1:p.loyalty<22?-1:0};
 add("Marie",partyBonus("marie",tags.includes("children")||tags.includes("ethical")));add("Daniela",partyBonus("daniela",tags.includes("transparent")||tags.includes("pressAttack")||state.currentLocation==="paper"));add("Brázda",partyBonus("brazda",tags.includes("jzdDeal")||state.currentLocation==="jzd"));add("Bohumil",partyBonus("bohumil",tags.includes("legal")||tags.includes("destroyEvidence")||state.currentLocation==="townhall"));add("Holub",partyBonus("holub",tags.includes("contract")||tags.includes("corrupt")||state.currentLocation==="meadow"));
 if(choice.companion&&state.party[choice.companion]?.loyalty>=45)add("Přímá pomoc družiny",1);
 const activeSupport=selectedSupportBonus(choice);if(activeSupport)add(`${companions[state.selectedSupport]?.name||"Družina"}: aktivní zásah`,activeSupport);
 const activeRelations=Object.entries(relationshipDefs).filter(([,d])=>state.party[d.a]&&state.party[d.b]).map(([id])=>state.relationships?.[id]??0);if(activeRelations.length){const avg=activeRelations.reduce((a,b)=>a+b,0)/activeRelations.length,min=Math.min(...activeRelations);if(min<-40)add("Rozhádaný štáb",-2);else if(avg<-15)add("Napětí ve štábu",-1);else if(avg>30)add("Soudržný štáb",1)}
 const item=(id,match,val,label)=>{if(hasItem(id)&&match)add(label,val)};
 item("dieselCopy",tags.includes("police")||state.currentEvent==="auditLeak"||state.currentEvent==="leakedTape",2,"Kopie z JZD");item("blackmail",tags.includes("jzdDeal")||tags.includes("power"),2,"Složka na Brázdu");item("schoolKeys",tags.includes("children"),2,"Klíče školy");item("envelope",tags.includes("contract")||tags.includes("corrupt"),1,"Obálka stability");item("zoningDeal",state.currentLocation==="meadow"||tags.includes("contract"),2,"Dodatek k louce");item("auditReport",tags.includes("legal")||tags.includes("transparent"),2,"Auditní zpráva");item("dossier",tags.includes("power")||tags.includes("lie"),2,"Složka na Věčného");item("ashes",tags.includes("destroyEvidence")||tags.includes("corrupt"),2,"Popel jistoty");item("scarf",state.currentLocation==="pitch"||state.phase==="finale",1,"Klubová šála");item("program",tags.includes("ethical")||state.phase==="finale",1,"Program");item("labReport",tags.includes("transparent")||tags.includes("legal"),1,"Rozbor vody");item("budgetDraft",state.currentLocation==="townhall"||tags.includes("power"),1,"Původní rozpočet");item("wasteContract",tags.includes("contract")||tags.includes("legal"),1,"Smlouva o svozu");item("ballotProof",state.phase==="finale",1,"Vadný lístek");
 const penalty=approachPenalty(choice);if(penalty)add("Únava stejné taktiky",-penalty);
 return rows;
}
function checkMod(choice){return clamp(checkBreakdown(choice).reduce((s,x)=>s+x.val,0),-2,5)}
function eventQuestId(id,e=events[id]){return e?.questId||id}
function canRepeat(id){return (state.genericUses[id]||0)<1 && (state.cooldowns[id]||0)<=state.day}
const events={
 intro:{
  id:"intro",location:"pub",title:"Prázdná židle po zabijačce",emoji:"🐷",kicker:"PROLOG",
  text:()=>[
   "Starosta Vladimír Věčný byl po sedmé jitrnici odvezen do okresní nemocnice. Jeho stav je stabilní, vážný a podle místního rozhlasu předvolebně citlivý.",
   "Máte třináct dní kampaně. Čtrnáctý den se volí. V sále sedí třicet sedm občanů, tři budoucí místostarostové a Oldřich Brázda, který nikdy nekandidoval, protože nemusel.",
   "Kandidaturu můžete oznámit různě. Každá cesta vytvoří první dojem a několik lidí, kteří vám ho později připomenou."
  ],
  choices:[
   {label:"Mluvit o otevřené radnici",detail:"Slibujete zveřejnit smlouvy a vysvětlovat rozhodnutí. Bohumil u skříně s archivem zbledne.",check:{attr:"charisma",dc:11},tags:["ethical","transparent","public"],
    success:makeOutcome("Lidé zatleskají. Ne všichni vědí proč, ale oceňují, že jste zatím nikoho neurazil.",{support:7,trust:8,integrity:8,citizens:8,press:4},["ethical","transparent"],()=>addParty("marie",5)),
    fail:makeOutcome("Projev je delší než zabijačka. Přesto získáte několik podpisů a jednoho psa, který za vámi chodí kvůli jitrnici.",{support:3,trust:3,integrity:5,citizens:3},["ethical"],()=>addParty("marie",1))},
   {label:"Vyhlásit konec starých pořádků",detail:"Využijete starostovy nepřítomnosti a označíte třicet let jeho vlády za éru sádla a strachu.",check:{attr:"authority",dc:12},tags:["public","power","lie"],
    success:makeOutcome("Dav ucítí krev. Nikdo přesně neví, z čeho Věčného obviňujete, ale každý si na něco vzpomene.",{support:10,trust:-4,influence:7,integrity:-7,oldguard:-8,heat:3},["power","lie"],()=>addItem("megaphone")),
    fail:makeOutcome("Věčného manželka je stále v sále. Vaše první fotografie kampaně zachycuje tlačenku letící vaším směrem.",{support:4,trust:-5,integrity:-4,heat:4},["lie"])},
   {label:"Nejprve se domluvit s Brázdou",detail:"Veřejnost počká. Nejdřív potřebujete člověka, který ji umí přivézt traktorem.",check:{attr:"cunning",dc:11},tags:["jzdDeal","power"],
    success:makeOutcome("Brázda vám stiskne ruku a řekne, že obec potřebuje změnu. Rozhoduje zde od doby, kdy změna znamenala nový typ dojírny.",{influence:11,funds:6,jzd:12,integrity:-5,support:3},["jzdDeal","power"],()=>addParty("brazda",8)),
    fail:makeOutcome("Brázda se usměje a poradí vám získat nejdřív podporu lidí. Myslí tím svoji podporu, ale dráž.",{influence:3,jzd:3,integrity:-2},["jzdDeal"],()=>addParty("brazda",-4))}
  ],
  after:()=>{state.flags.introDone=true;unlockQuest("meadow");addNews("Mimořádné volby potvrzeny. Kandidáti zatím slibují hlavně, že brzy zveřejní sliby.");}
 },
 register:{
  id:"register",location:"townhall",title:"Patnáct podpisů a jedna propiska",emoji:"✍️",kicker:"HLAVNÍ QUEST",
  available:()=>state.quests.register.status==="active",
  text:()=>[
   "Kandidátku je třeba podat do čtvrtého dne. Úředník Bohumil Tichý vysvětluje, že potřebujete patnáct platných podpisů, formulář A-17 a propisku, která nepíše modře příliš agresivně.",
   "Podpisy lze získat od občanů, přivézt je z JZD, nebo je administrativně objevit v příloze, kterou dosud nikdo nečetl."
  ],
  choices:[
   {label:"Obejít vesnici a podpisy získat osobně",detail:"Stojí to čas a několik rozhovorů o kanalizaci z roku 1998.",check:{attr:"charisma",dc:12},tags:["ethical","public"],
    success:makeOutcome("Vrátíte se s podpisy, dvěma buchtami a sedmi problémy, které už nelze předstírat, že neznáte.",{support:8,trust:8,citizens:10,integrity:6},["ethical","public"],()=>completeQuest("register","Kandidátka podána s pravými podpisy.")),
    fail:makeOutcome("Jeden podpis patří člověku, který zemřel před šesti lety. Je to stále méně podezřelé než některé místní kandidátky.",{support:3,trust:1,heat:3,integrity:3},["ethical"],()=>{completeQuest("register","Kandidátka podána po doplnění podpisů.");state.opponent.momentum+=3;})},
   {label:"Nechat podpisy dodat z JZD",detail:"Brázda má seznam zaměstnanců, rodin a lidí, kteří chtějí příští rok pronajmout pole.",check:{attr:"authority",dc:10},tags:["jzdDeal","power"],
    success:makeOutcome("Podpisy dorazí v abecedním pořadí a všichni zaměstnanci nezávisle napsali stejné písmeno K.",{influence:8,jzd:12,integrity:-8,heat:5},["jzdDeal","power"],()=>{completeQuest("register","Kandidátka podána s podporou JZD.");addParty("brazda",6)}),
    fail:makeOutcome("Brázda pošle jen čtrnáct podpisů. Patnáctý přidá Bohumil se slovy, že už viděl horší demokratické procesy.",{jzd:5,officials:5,integrity:-6,heat:7},["jzdDeal"],()=>{completeQuest("register","Kandidátka podána na poslední chvíli.");addParty("bohumil",4)})},
   {label:"Najít procesní zkratku v zákoně",detail:"Není to padělání. Je to rozšířený výklad pojmu osobní podpora.",check:{attr:"intellect",dc:15},tags:["legal","gray"],
    success:makeOutcome("Bohumil najde ustanovení z roku 1992. Kandidátka projde a nikdo neví proč, což je známka kvalitního práva.",{officials:12,influence:6,leverage:4,integrity:-2},["legal"],()=>{completeQuest("register","Kandidátka podána procesní zkratkou.");addParty("bohumil",7)}),
    fail:makeOutcome("Zkratka vede do správního řízení. Bohumil problém opraví, ale nyní vlastní informaci, která jednou může mít cenu náměstka.",{officials:5,heat:6,integrity:-4,leverage:2},["legal"],()=>{completeQuest("register","Kandidátka zachráněna Bohumilem.");addParty("bohumil",10)})}
  ]
 },
 diesel:{
  id:"diesel",location:"jzd",title:"Ani litr bez svědka",emoji:"🚜",kicker:"QUEST",
  available:()=>state.quests.diesel.status==="active",
  text:()=>[
   "Z družstevní nádrže mizí nafta. Brázda mluví o hybridním odpařování, ale kamera zachytila jeho syna Radovana, jak palivo prodává okresnímu dopravci.",
   "Důkaz může vyčistit JZD, zaplatit kampaň, nebo skončit v auditu, jehož závěr bude dostupný po volbách."
  ],
  choices:[
   {label:"Předat záznam policii",detail:"Pravidla platí i pro člověka, jehož otec vlastní volební stany.",check:{attr:"resilience",dc:13},companion:"daniela",tags:["ethical","police","transparent"],
    success:makeOutcome("Radovan je předvolán. Brázda vám slíbí, že politicky nepřežijete žně. Občané poprvé věří, že to myslíte vážně.",{trust:12,integrity:11,citizens:8,jzd:-18,influence:-4,heat:2},["ethical","police"],()=>{completeQuest("diesel","Krádeže předány policii.");state.flags.policeAlly=true;addItem("dieselCopy")}),
    fail:makeOutcome("Policista je Brázdův bratranec. Záznam se stane technicky nečitelným, ale kopii si ponecháte.",{trust:4,integrity:7,jzd:-8,heat:7,leverage:7},["police"],()=>{completeQuest("diesel","Případ odložen, kopie zůstala.");addItem("dieselCopy");schedule("policeInterview")})},
   {label:"Vyměnit ticho za podporu kampaně",detail:"Nafta bude dál mizet, ale alespoň ve prospěch místní demokracie.",check:{attr:"cunning",dc:11},tags:["corrupt","jzdDeal","power"],
    success:makeOutcome("Brázda dodá peníze, pódium a třicet lidí s transparenty. První kompromat chutná jako levná káva.",{funds:16,influence:13,jzd:18,integrity:-17,heat:13,leverage:9},["corrupt","jzdDeal"],()=>{completeQuest("diesel","Krádeže se staly součástí koaličního potenciálu.");addParty("brazda",12);addItem("blackmail")}),
    fail:makeOutcome("Brázda zapne diktafon. Nyní máte kompromat oba. V regionální politice se tomu říká strategická rovnováha.",{funds:6,influence:5,jzd:7,integrity:-12,heat:18,leverage:4},["corrupt","jzdDeal"],()=>{completeQuest("diesel","Vznikl vzájemně zajištěný vztah.");addParty("brazda",2);schedule("leakedTape")})},
   {label:"Objednat interní audit",detail:"Audit povede Brázdův švagr. Je nezávislý na všem kromě rodinných oslav.",check:{attr:"intellect",dc:14},tags:["legal","gray"],
    success:makeOutcome("Audit zjistí procesní nedostatky bez konkrétní odpovědnosti. Nafta mizí dál, nyní však v tabulce.",{officials:7,influence:8,funds:5,integrity:-4,heat:5},["legal"],()=>{completeQuest("diesel","Audit uzavřen bez viníka.");addParty("bohumil",2)}),
    fail:makeOutcome("Auditor omylem pošle předběžnou zprávu novinám. Titulek je kratší než vaše vysvětlení.",{press:-10,trust:-8,heat:14,integrity:-3},["legal"],()=>{completeQuest("diesel","Audit unikl do médií.");schedule("auditLeak")})}
  ]
 },
 roof:{
  id:"roof",location:"school",title:"Střecha nad budoucností",emoji:"🏫",kicker:"QUEST",
  available:()=>state.quests.roof.status==="active"&&state.quests.roof.stage===0,
  text:()=>[
   "Do třídy prší. Ředitelka Marie přesunula děti podle předpovědi počasí. Oprava stojí tři miliony, které obec nemá.",
   "Richard Holub ji zvládne za pět milionů okamžitě. Dva miliony navíc jsou cena za rychlost, flexibilitu a přátelskou atmosféru."
  ],
  choices:[
   {label:"Vypsat otevřenou soutěž",detail:"Správná cesta, pokud dokážete přežít námitky firem, které prohrály ještě před vypsáním.",check:{attr:"intellect",dc:14},companion:"bohumil",tags:["ethical","transparent","children","legal"],
    success:makeOutcome("Levnější firma opraví střechu. Marie se přidá ke kampani a děti poprvé kreslí mraky jen z vlastní vůle.",{trust:13,support:8,integrity:12,funds:-5,citizens:7,officials:6},["ethical","children","transparent"],()=>{completeQuest("roof","Škola opravena otevřenou soutěží.");addParty("marie",12);addItem("schoolKeys")}),
    fail:makeOutcome("Soutěž napadne firma, která podmínky nečetla. Oprava se zdrží a Věčný vás označí za člověka, který neumí zakrýt díru.",{trust:3,support:-3,integrity:8,funds:-3,heat:4},["ethical","children"],()=>{state.quests.roof.stage=1;schedule("roofEmergency")})},
   {label:"Dát zakázku Holubovi",detail:"Střecha bude rychle a kampaň nebude chudá. Budoucí vady jsou problém budoucího vedení.",check:{attr:"cunning",dc:11},tags:["corrupt","contract","children"],
    success:makeOutcome("Holub začne stavět ještě před podpisem. Spolek Přátelé suchých škol vám pošle dar.",{funds:18,influence:10,business:18,support:5,integrity:-18,heat:15,trust:-6},["corrupt","contract","children"],()=>{completeQuest("roof","Školu opravil sponzor kampaně.");addParty("holub",14);addItem("envelope")}),
    fail:makeOutcome("Krytina je položena obráceně. Škola už neteče dovnitř; voda se profesionálně drží ve střeše.",{funds:8,business:9,support:-8,trust:-10,integrity:-13,heat:18},["corrupt","contract","children"],()=>{state.quests.roof.stage=1;schedule("roofCollapse");addParty("holub",4)})},
   {label:"Svolat rodiče a opravit provizorně",detail:"Levnější, pomalejší a bez slavnostního přestřižení faktury.",check:{attr:"authority",dc:12},tags:["ethical","public","children"],
    success:makeOutcome("Rodiče, hasiči a dvě babičky školu zakryjí. Není to elegantní, ale první déšť zůstane venku.",{support:11,trust:9,citizens:12,integrity:8,funds:-2},["ethical","public","children"],()=>{completeQuest("roof","Škola provizorně zachráněna občany.");addParty("marie",8)}),
    fail:makeOutcome("Přijdou čtyři lidé a jeden z nich Holub. Oprava drží jen díky fotografii, na níž to vypadá jako velká akce.",{support:3,citizens:3,integrity:5,funds:-1,trust:1},["public","children"],()=>{state.quests.roof.stage=1;schedule("roofEmergency")})}
  ]
 },
 meadow:{
  id:"meadow",location:"meadow",title:"Poslední louka",emoji:"🌳",kicker:"QUEST",
  available:()=>state.quests.meadow.status==="active"&&state.quests.meadow.stage===0,
  text:()=>[
   "Richard Holub chce koupit poslední obecní louku. Postaví logistický park, který má přinést pracovní místa, světlo do oken ve dvě ráno a kamiony v každé zatáčce.",
   "Současné vedení už připravilo změnu územního plánu. Stačí ji zastavit, podepsat, nebo přepsat tak dlouze, aby nikdo nepoznal rozdíl."
  ],
  choices:[
   {label:"Svolat veřejné projednání",detail:"Občané rozhodnou, ale nejdřív budou dvě hodiny mluvit o psech a parkování.",check:{attr:"charisma",dc:13},tags:["ethical","public","antiBusiness"],
    success:makeOutcome("Louka zůstane veřejná. Holub vás přestane zdravit a místní děti objeví, že venku existuje něco bez loga sponzora.",{citizens:15,trust:11,support:8,integrity:10,business:-18,influence:-3},["ethical","public","antiBusiness"],()=>completeQuest("meadow","Louka zachována veřejnosti.")),
    fail:makeOutcome("Projednání ovládnou odpůrci všeho. Projekt se odloží, ale nikdo neví, zda kvůli přírodě, žábám, nebo 5G.",{citizens:5,trust:2,support:-2,integrity:6,business:-6},["public"],()=>{completeQuest("meadow","Projekt odložen chaosem.");state.opponent.momentum+=4})},
   {label:"Podepsat prodej a chtít něco zpět",detail:"Školka, silnice a příspěvek na kampaň. Veřejný zájem dostane přesný ceník.",check:{attr:"cunning",dc:13},tags:["corrupt","contract","power"],
    success:makeOutcome("Holub přistoupí na všechno, protože logistický park vydělá víc. Obec získá školku a vy člověka, který vám bude jednou volat bez pozdravu.",{funds:16,business:20,influence:12,support:4,integrity:-15,heat:14,leverage:5},["corrupt","contract","power"],()=>{completeQuest("meadow","Louka prodána za balík protislužeb.");addParty("holub",12);addItem("zoningDeal")}),
    fail:makeOutcome("Holub dostane pozemek, vy příslib a obec vizualizaci školky, která nebude součástí závazné části smlouvy.",{business:14,influence:5,support:-7,trust:-8,integrity:-13,heat:15},["corrupt","contract"],()=>{completeQuest("meadow","Louka prodána bez jistých výhod.");addParty("holub",4);schedule("developerBacklash")})},
   {label:"Rozdělit louku mezi park a obec",detail:"Kompromis, který naštve všechny přibližně stejně.",check:{attr:"intellect",dc:15},tags:["legal","gray"],
    success:makeOutcome("Vznikne menší park, větší mokřad a dokument o 146 stranách. Nikdo nejásá, což je u kompromisu téměř úspěch.",{citizens:6,business:6,trust:5,influence:5,integrity:2,heat:3},["legal"],()=>completeQuest("meadow","Louka rozdělena kompromisem.")),
    fail:makeOutcome("Geodet omylem vyměří retenční jezírko na parkovišti. Projekt se vrací na začátek a obě strany obviní vás.",{citizens:-4,business:-5,trust:-4,heat:7},["legal"],()=>{state.quests.meadow.stage=1;schedule("meadowProtest")})}
  ]
 },
 newsletter:{
  id:"newsletter",questId:"paper",location:"paper",title:"Nezávislý obecní zpravodaj",emoji:"📰",kicker:"QUEST",
  available:()=>state.quests.paper.status==="active",
  text:()=>[
   "Vejprnický hlas platí obec. Šéfredaktorka Daniela se ptá, zda smí zveřejnit kritický text o starém vedení i vaše odpovědi v plné délce.",
   "Můžete jí dát svobodu, koupit titulní stranu reklamou, nebo jí předat dokument, který poškodí Věčného a zároveň zamaskuje vaše slabiny."
  ],
  choices:[
   {label:"Garantovat redakční nezávislost",detail:"Riskujete kritiku i ve chvíli, kdy budete přesvědčen, že si ji nezasloužíte.",check:{attr:"resilience",dc:12},tags:["ethical","transparent","public"],
    success:makeOutcome("Daniela zveřejní tvrdý, ale férový profil všech kandidátů. Vaše chyby vypadají méně nebezpečně než cizí tajemství.",{press:16,trust:12,integrity:12,support:5,heat:-3},["ethical","transparent"],()=>{completeQuest("paper","Zpravodaj získal nezávislost.");addParty("daniela",15)}),
    fail:makeOutcome("První nezávislé číslo vyjde s titulkem KANDIDÁT NEVÍ, KOLIK STOJÍ ODPAD. Je to pravda a bolí to.",{press:7,trust:5,support:-5,integrity:9},["ethical","transparent"],()=>{completeQuest("paper","Zpravodaj je nezávislý i na vašem pohodlí.");addParty("daniela",8)})},
   {label:"Zaplatit velkou předvolební přílohu",detail:"Nebude to propaganda. Bude to placený prostor bez rušivého pluralismu.",check:{attr:"charisma",dc:11},tags:["lie","pressAttack","public"],
    success:makeOutcome("Vaše fotografie je na šesti stranách. Voliči si zapamatují jméno a zapomenou, kdo číslo zaplatil.",{support:12,press:-9,funds:-6,integrity:-9,heat:7},["lie","pressAttack"],()=>completeQuest("paper","Zpravodaj se stal inzertním nosičem.")),
    fail:makeOutcome("Tiskárna zamění vaše heslo OTEVŘEME RADNICI za OTEVŘEME KRÁNICI. Číslo se stane sběratelským.",{support:4,funds:-6,press:-6,integrity:-6},["lie"],()=>completeQuest("paper","Propagační číslo se stalo memem."))},
   {label:"Dát Daniele kompromat na Věčného",detail:"Veřejnost dostane pravdu, jen pečlivě vybranou a správně načasovanou.",check:{attr:"cunning",dc:14},companion:"bohumil",tags:["power","lie"],
    success:makeOutcome("Článek o Věčného pozemcích otřese vesnicí. Daniela tuší, že jste ji použil, ale dokumenty jsou pravé.",{support:10,press:4,oldguard:-18,leverage:8,integrity:-5,heat:5},["power","lie"],()=>{completeQuest("paper","Kompromat zveřejněn přes tisk.");state.opponent.momentum-=12;addParty("daniela",-2)}),
    fail:makeOutcome("Dokument obsahuje poznámku vaším rukopisem: POUŽÍT PŘED DEBATOU. Daniela zveřejní i ji.",{support:-5,press:-12,heat:13,integrity:-7,leverage:3},["lie"],()=>{completeQuest("paper","Únik se obrátil proti vám.");schedule("pressAmbush")})}
  ]
 },
 oldfiles:{
  id:"oldfiles",location:"townhall",title:"Skříň označená ÚKLID",emoji:"🗄️",kicker:"TAJNÝ QUEST",
  available:()=>state.quests.oldfiles.status==="active",
  text:()=>[
   "Bohumil odemyká archiv. Ve skříni leží smlouvy, zápisy, jedna láhev rumu a složka s názvem STAROSTA – NEOTVÍRAT PŘED VOLBAMI.",
   "Materiály mohou očistit obec, zničit Věčného, nebo zmizet spolu s několika papíry, které se nepříjemně týkají i vašich spojenců."
  ],
  choices:[
   {label:"Předat celý archiv nezávislé kontrole",detail:"Nevíte, koho zasáhne. To je na nezávislé kontrole ta nepříjemná část.",check:{attr:"resilience",dc:14},companion:"daniela",tags:["ethical","transparent","legal"],
    success:makeOutcome("Audit zasáhne Věčného, Holuba i Brázdu. Vaše družina se zmenší, ale obec poprvé vidí celý obraz.",{trust:15,integrity:15,press:12,oldguard:-15,business:-10,jzd:-10,heat:5},["ethical","transparent","legal"],()=>{completeQuest("oldfiles","Archiv předán kontrole.");state.opponent.momentum-=13;addItem("auditReport")}),
    fail:makeOutcome("Kontrola začne, ale unikne jen část dokumentů. Všichni vědí, že něco existuje, nikdo neví co. Nejhorší možná kombinace.",{trust:4,integrity:10,heat:14,press:5,oldguard:-5},["ethical","legal"],()=>{completeQuest("oldfiles","Archiv otevřen neúplně.");schedule("documentWar")})},
   {label:"Vybrat jen dokumenty proti Věčnému",detail:"Pravda bude zveřejněna v redakčně zkrácené verzi odpovídající vašemu zájmu.",check:{attr:"cunning",dc:12},tags:["power","lie"],
    success:makeOutcome("Věčný vysvětluje tři nevýhodné prodeje pozemků. Vy nevysvětlujete nic, protože vaše složky zůstaly ve skříni.",{support:11,leverage:14,oldguard:-20,integrity:-8,heat:7},["power","lie"],()=>{completeQuest("oldfiles","Archiv použit selektivně.");state.opponent.momentum-=16;addItem("dossier")}),
    fail:makeOutcome("Bohumil si nechá kopii všeho a pošle jednu Daniele. Věčný má problém, vy získáváte budoucí problém.",{support:5,leverage:8,oldguard:-10,heat:14,integrity:-8,press:-3},["power","lie"],()=>{completeQuest("oldfiles","Selektivní únik se rozšířil.");addParty("bohumil",-10);schedule("documentWar")})},
   {label:"Spálit složky, které ohrožují všechny",detail:"Nastane mír založený na popelu a vzájemném mlčení.",check:{attr:"authority",dc:13},tags:["corrupt","destroyEvidence","power"],
    success:makeOutcome("Bohumil zavře oči. Věčný, Brázda i Holub pochopí zprávu: minulost je bezpečná, pokud budete rozhodovat vy.",{influence:18,oldguard:12,business:10,jzd:10,integrity:-20,heat:12,leverage:10},["corrupt","destroyEvidence","power"],()=>{completeQuest("oldfiles","Archiv prošel tepelnou skartací.");addItem("ashes")}),
    fail:makeOutcome("Požární čidlo funguje poprvé za deset let. Hasiči zachrání část dokumentů a fotografii vás s krabicí.",{influence:5,integrity:-17,heat:25,trust:-12,leverage:4},["corrupt","destroyEvidence"],()=>{completeQuest("oldfiles","Pokus o skartaci zachytili hasiči.");schedule("policeInterview")})}
  ]
 },
 football:{
  id:"football",location:"pitch",title:"Přebor o duši obce",emoji:"⚽",kicker:"VEDLEJŠÍ QUEST",
  available:()=>!state.flags.footballDone && state.day>=3,
  text:()=>[
   "Místní klub potřebuje nové dresy a tři body. Předseda nabízí podporu dvou set příbuzných, pokud zařídíte dotaci a přestanete se ptát, proč klub eviduje sedm trenérů.",
   "Můžete podpořit mládež, koupit si tribunu, nebo poslat kontrolu a stát se prvním kandidátem vypískaným i při zápase dorostu."
  ],
  choices:[
   {label:"Dotaci dát jen na mládež a zveřejnit účetnictví",detail:"Děti dostanou dresy, funkcionáři formulář a vy několik nepřátel v klubovně.",check:{attr:"authority",dc:13},tags:["ethical","transparent","public"],
    success:makeOutcome("Mládež má dresy a účetní poprvé objeví sloupec účel platby.",{citizens:9,trust:8,support:6,integrity:8,funds:-3},["ethical","transparent"],()=>{state.flags.footballDone=true;addItem("scarf")}),
    fail:makeOutcome("Funkcionáři založí spolek rodičů proti byrokracii. Děti mají dresy, ale vaše jméno se na stadionu skloňuje v pádu.",{citizens:2,trust:3,support:-4,integrity:6,funds:-3},["ethical"],()=>state.flags.footballDone=true)},
   {label:"Zaplatit klub a získat celou tribunu",detail:"Sport spojuje. Především rozpočet s kandidátkou.",check:{attr:"cunning",dc:10},tags:["corrupt","public"],
    success:makeOutcome("Na příštím zápase visí vaše jméno vedle reklamy na pohřební službu. Obě značky slibují důstojnou budoucnost.",{support:12,citizens:6,funds:-6,integrity:-10,heat:6},["corrupt","public"],()=>{state.flags.footballDone=true;addItem("scarf")}),
    fail:makeOutcome("Klub peníze přijme, ale podporu veřejně označí za apolitickou. Apoliticky podpoří Věčného.",{support:-3,funds:-6,integrity:-8,oldguard:6},["corrupt"],()=>state.flags.footballDone=true)},
   {label:"Poslat kontrolu na sedm trenérů",detail:"Někdo musí položit otázku, proč tým o jedenácti hráčích zaměstnává sedm trenérů a dva koordinátory deště.",check:{attr:"intellect",dc:14},tags:["legal","antiBusiness"],
    success:makeOutcome("Kontrola najde fiktivní trenéry. Klub vás nenávidí, ale rodiče zjistí, kam mizely příspěvky.",{trust:7,officials:8,citizens:4,oldguard:-6,integrity:6,leverage:5},["legal"],()=>state.flags.footballDone=true),
    fail:makeOutcome("Kontrola zjistí, že všichni trenéři jsou legální, protože každý vede jinou věkovou kategorii od přípravky po veterány nad devadesát.",{support:-3,oldguard:5,heat:2},["legal"],()=>state.flags.footballDone=true)}
  ]
 },
 hqVolunteers:{
  id:"hqVolunteers",location:"hq",title:"Družina se sama nesestaví",emoji:"📣",kicker:"KAMPAŇ",
  available:()=>!state.flags.volunteers && state.day<=8,
  text:()=>[
   "V garáži se sešli dobrovolníci. Chtějí vědět, za co kandidujete, co budou dělat a zda se pizza proplácí z transparentního účtu.",
   "Můžete vytvořit skutečný program, postavit kampaň na jedné emoci, nebo najmout agenturu Richarda Holuba, která používá slovo autentický v každé faktuře."
  ],
  choices:[
   {label:"Sepsat pět konkrétních závazků",detail:"Později je bude možné zkontrolovat. Tím se závazky liší od běžného programu.",check:{attr:"intellect",dc:12},tags:["ethical","transparent"],
    success:makeOutcome("Dobrovolníci získají směr a vy pět budoucích problémů, pokud sliby nesplníte.",{support:7,trust:9,citizens:7,integrity:7,funds:-2},["ethical","transparent"],()=>{state.flags.volunteers=true;addItem("program")}),
    fail:makeOutcome("Program má devatenáct bodů a každý začíná slovem podpoříme. Dobrovolníci z něj udělají leták o dvou větách.",{support:4,trust:3,integrity:4,funds:-2},["ethical"],()=>state.flags.volunteers=true)},
   {label:"Postavit kampaň na hněvu proti okresu",detail:"Okres je dost daleko, aby se bránil, a dost blízko, aby za všechno mohl.",check:{attr:"charisma",dc:11},tags:["lie","public","power"],
    success:makeOutcome("Heslo VEJPRNICE NEJSOU DOJNÁ KRÁVA se šíří. JZD žádá drobnou grafickou úpravu.",{support:12,trust:-4,citizens:5,integrity:-8,heat:5},["lie","public"],()=>{state.flags.volunteers=true;addItem("megaphone")}),
    fail:makeOutcome("Heslo zní VRAŤTE NÁM OKRES. Nikdo netuší, co to znamená, a proto se chytí.",{support:6,trust:-3,integrity:-6},["lie"],()=>state.flags.volunteers=true)},
   {label:"Najmout profesionální agenturu",detail:"Holubova agentura zná obec přesně od chvíle, kdy obdržela zálohu.",check:{attr:"cunning",dc:12},tags:["contract","corrupt"],
    success:makeOutcome("Kampaň vypadá profesionálně. Vaše fotografie má o patnáct let méně a obec o osm tisíc méně.",{support:10,funds:-8,business:9,integrity:-6,heat:3},["contract","corrupt"],()=>{state.flags.volunteers=true;addParty("holub",7)}),
    fail:makeOutcome("Agentura použije slogan z kampaně na prodej oken. Polovina letáků slibuje trojsklo zdarma.",{support:3,funds:-8,business:4,integrity:-4},["contract"],()=>state.flags.volunteers=true)}
  ]
 },
 debate:{
  id:"debate",location:"pub",title:"Velká hospodská debata",emoji:"🎙️",kicker:"BOSSFIGHT",
  available:()=>state.quests.debate.status==="active",
  text:()=>[
   "Vladimír Věčný se vrátil z nemocnice zdravější než obecní rozpočet. V hospodě čeká publikum, Daniela s diktafonem a tři otázky, které vám nikdo neposlal předem.",
   "Věčný tvrdí, že zkušenost nelze nahradit nadšením. Vy víte, že jeho zkušenost zahrnuje třicet let rozhodování, komu se dovolí postavit garáž."
  ],
  choices:[
   {label:"Rozebrat jeho výsledky bod po bodu",detail:"Fakta jsou silná zbraň, pokud publikum ještě poslouchá.",check:{attr:"intellect",dc:15},companion:"daniela",tags:["transparent","public"],
    success:makeOutcome("Věčný poprvé hledá odpověď v papírech. Publikum zjistí, že některé sliby jsou starší než místní autobus.",{support:14,trust:10,oldguard:-14,press:8,integrity:5},["transparent","public"],()=>{completeQuest("debate","Debata vyhrána fakty.");state.opponent.momentum-=12}),
    fail:makeOutcome("U třetí tabulky přestane publikum vnímat. Věčný zakončí větou, že obec není excel, a dostane největší potlesk večera.",{support:-7,trust:1,oldguard:8,integrity:3},["transparent"],()=>{completeQuest("debate","Fakta prohrála s větou o zdravém rozumu.");state.opponent.momentum+=8})},
   {label:"Napadnout jeho charakter a staré vazby",detail:"Nevysvětlujete vlastní plán. Vysvětlujete, proč ho nepotřebujete, dokud existuje Věčný.",check:{attr:"authority",dc:14},tags:["power","lie","public"],
    success:makeOutcome("Věčný ztratí klid a omylem přizná, že o Holubově zakázce věděl dřív než zastupitelstvo.",{support:15,trust:-3,oldguard:-18,heat:6,integrity:-8,leverage:6},["power","lie"],()=>{completeQuest("debate","Debata vyhrána útokem.");state.opponent.momentum-=15}),
    fail:makeOutcome("Útok působí osobně. Věčný klidně řekne, že vám odpouští mládí. Je o dvanáct let starší.",{support:-8,trust:-7,oldguard:10,integrity:-7,heat:5},["lie"],()=>{completeQuest("debate","Útok se obrátil proti vám.");state.opponent.momentum+=10})},
   {label:"Nechat mluvit občany a odpovídat krátce",detail:"Riskujete chaos. Získáváte šanci, že Věčného porazí lidé, kteří ho znají déle než vy.",check:{attr:"resilience",dc:13},tags:["ethical","public"],
    success:makeOutcome("Občané vytáhnou silnici, kanalizaci i ztracené lavičky. Věčný zjistí, že třicet let historie má mnoho svědků.",{support:12,trust:12,citizens:13,oldguard:-10,integrity:8},["ethical","public"],()=>{completeQuest("debate","Debatu rozhodli občané.");state.opponent.momentum-=10}),
    fail:makeOutcome("Debatu ovládne muž, který chce zákaz psů, 5G a mokrého listí. Věčný působí jako jediný dospělý v místnosti.",{support:-5,trust:-2,citizens:-2,integrity:4,oldguard:7},["public"],()=>{completeQuest("debate","Debatu unesla místní agenda.");state.opponent.momentum+=7})}
  ]
 },

 counterFreeConcert:{id:"counterFreeConcert",location:"pub",title:"Věčný rozdává kulturu zdarma",emoji:"🎺",kicker:"PROTIÚTOK",queued:true,text:()=>["Věčný reaguje na vaše veřejné akce koncertem dechovky, gulášem a slibem, že obec zůstane obcí.","Není to program. Je to velmi hlasitá konkurence vašemu programu."],choices:[
  {label:"Přijít a převzít mikrofon",detail:"Riziko bučení, možnost ukrást publikum.",check:{attr:"charisma",dc:14},tags:["public","power"],success:makeOutcome("Z koncertu uděláte vlastní kontaktní kampaň. Kapela zahraje i váš slogan, protože byla zaplacena na hodinu.",{support:8,oldguard:-5,heat:3},["public","power"]),fail:makeOutcome("Mikrofon vám vypnou během druhé věty. Věčný nabídne pomoc s technikou.",{support:-5,oldguard:7,heat:4},["public"])},
  {label:"Nabídnout vlastní program vedle guláše",detail:"Méně efektní, více skutečné práce.",check:{attr:"resilience",dc:12},tags:["ethical","public"],success:makeOutcome("Lidé jedí, ptají se a někteří dokonce poslouchají. Věčný zjišťuje, že guláš nemá odpověď na školu.",{trust:7,support:5,citizens:5},["ethical","public"]),fail:makeOutcome("Program zůstane pod táckem. Guláš vítězí na body.",{support:-2,trust:1},["ethical"]) }],ignored:()=>effect({support:-5,oldguard:6})},
 counterPaperFlood:{id:"counterPaperFlood",location:"townhall",title:"Přílohová ofenziva",emoji:"📚",kicker:"PROTIÚTOK",queued:true,text:()=>["Věčný odpověděl na vaše audity zveřejněním 1 842 stran dokumentů bez rejstříku.","Právně je vše otevřené. Prakticky je pravda pohřbená pod přílohou 76b."],choices:[
  {label:"Postavit veřejný vyhledávač",detail:"Technické řešení politického problému.",check:{attr:"intellect",dc:14},tags:["legal","transparent"],success:makeOutcome("Bohumil najde metadata a Daniela tři rozpory. Datová mlha se mění v mapu.",{trust:8,officials:7,press:5,leverage:3},["legal","transparent"]),fail:makeOutcome("Vyhledávač funguje, ale pouze na slovo příloha. Vrátí 1 842 výsledků.",{trust:1,heat:3},["legal"])},
  {label:"Vytáhnout jedinou srozumitelnou fakturu",detail:"Redukovat pravdu na jednu fotografii.",check:{attr:"cunning",dc:13},tags:["pressAttack","power"],success:makeOutcome("Jedna faktura za poradenství se stane symbolem celé kauzy. Věčný nenávidí jednoduché příběhy, které nevymyslel.",{support:8,press:7,oldguard:-6,heat:4},["pressAttack","power"]),fail:makeOutcome("Faktura je z jiné obce. Věčný děkuje za propagaci transparentnosti.",{support:-5,trust:-4,heat:5},["pressAttack"]) }],ignored:()=>effect({trust:-5,oldguard:5})},
 counterDefection:{id:"counterDefection",location:"hq",title:"Nabídka pro vašeho člověka",emoji:"📞",kicker:"PROTIÚTOK",queued:true,text:()=>{const ids=Object.keys(state.party).sort((a,b)=>state.party[a].loyalty-state.party[b].loyalty),id=ids[0];state.flags.counterTarget=id;return [id?`Věčný zavolal ${state.party[id].name}. Nabízí klid, funkci a možnost říkat, že nikdy nebyl součástí vaší kampaně.`:"Věčný nabízí místo člověku, kterého ještě nemáte. Je to administrativně předběžná zrada.","Protiútok míří na nejslabší vztah ve štábu."]},choices:[
  {label:"Vyložit nabídku před celý štáb",detail:"Transparentnost může vztah zachránit nebo veřejně ukončit.",check:{attr:"authority",dc:13},tags:["transparent","ethical"],success:makeOutcome("Z nabídky uděláte test loajality. Štáb se semkne, protože společný nepřítel je levnější než teambuilding.",{trust:6,influence:4},["transparent","ethical"],()=>{const id=state.flags.counterTarget;if(state.party[id])state.party[id].loyalty=clamp(state.party[id].loyalty+10)}),fail:makeOutcome("Debata se změní v soud. Dotčený člověk zůstane, ale začne si ukládat všechny zprávy.",{trust:-3,heat:4},["transparent"],()=>{const id=state.flags.counterTarget;if(state.party[id])state.party[id].loyalty=clamp(state.party[id].loyalty-8)})},
  {label:"Přebít nabídku funkcí",detail:"Loajalita jako soutěžní zakázka.",check:{attr:"cunning",dc:12},tags:["power","corrupt"],success:makeOutcome("Člověk zůstává. Nová funkce zatím nemá náplň, ale má vizitky.",{influence:5,integrity:-5,funds:-3},["power","corrupt"],()=>{const id=state.flags.counterTarget;if(state.party[id])state.party[id].loyalty=clamp(state.party[id].loyalty+7)}),fail:makeOutcome("Věčný nabídku zvýší. Z vašeho štábu se stane aukce.",{influence:-4,integrity:-4,heat:4},["corrupt"],()=>{const id=state.flags.counterTarget;if(state.party[id])state.party[id].loyalty=clamp(state.party[id].loyalty-12)})}],ignored:()=>{const id=state.flags.counterTarget;if(state.party[id])state.party[id].loyalty=clamp(state.party[id].loyalty-15)}},
 counterLeak:{id:"counterLeak",location:"paper",title:"Anonymní složka o vašich anonymních složkách",emoji:"📩",kicker:"PROTIÚTOK",queued:true,text:()=>["Redakce dostala balík dokumentů dokazujících, že vaše kampaň shromažďuje kompromat.","Nejhorší je, že část dokumentů je pravá a část profesionálně sestavená."],choices:[
  {label:"Zveřejnit celý inventář",detail:"Odzbrojit útok pravdou, která také bolí.",check:{attr:"resilience",dc:14},tags:["transparent","ethical"],success:makeOutcome("Zveřejníte původ i použití dokumentů. Část spojenců zuří, veřejnost alespoň ví proč.",{trust:9,integrity:8,heat:-6,leverage:-5},["transparent","ethical"]),fail:makeOutcome("Inventář vypadá hůř bez kontextu. Kontext má 73 stran.",{trust:-6,heat:8,integrity:3},["transparent"])},
  {label:"Dokázat, že nejsprostší dokument je padělek",detail:"Napadnout část a nechat veřejnost zapomenout na zbytek.",check:{attr:"cunning",dc:13},tags:["power","pressAttack"],success:makeOutcome("Jedna falešná stránka otráví celý balík. Pravé dokumenty se vezou s ní.",{support:7,press:3,heat:3},["power","pressAttack"]),fail:makeOutcome("Forenzní expert označí padělek za váš vlastní export do PDF.",{support:-6,heat:10,trust:-5},["pressAttack"]) }],ignored:()=>effect({support:-6,heat:9,trust:-4})},
 counterCynicism:{id:"counterCynicism",location:"pub",title:"Kampaň proti slušnosti",emoji:"🙄",kicker:"PROTIÚTOK",queued:true,text:()=>["Věčný tvrdí, že vaše morální politika je jen nezkušenost převlečená za ctnost.","Heslo zní: AŽ BUDETE UMĚT KRÁST, POCHOPÍTE ROZPOČET. Část hospody se směje víc, než by měla."],choices:[
  {label:"Přijmout ironii a ukázat výsledky",detail:"Méně pohoršení, více důkazů.",check:{attr:"intellect",dc:13},tags:["ethical","transparent","public"],success:makeOutcome("Srovnání výsledků zlomí vtip. Věčný musí vysvětlit, proč zkušenost stojí tolik peněz.",{trust:8,support:6,integrity:5,oldguard:-4},["ethical","transparent"]),fail:makeOutcome("Výsledky mají graf. Věčný má punchline.",{support:-4,trust:1,integrity:3},["ethical"])},
  {label:"Vrátit úder: zkušenost není alibi",detail:"Tvrdší morální útok.",check:{attr:"authority",dc:14},tags:["ethical","power","public"],success:makeOutcome("Věta se chytí. Věčný poprvé vypadá jako minulost, ne tradice.",{support:8,trust:5,oldguard:-7},["ethical","power"]),fail:makeOutcome("Útok zní jako přednáška. Hospoda objedná další kolo.",{support:-4,oldguard:5},["public"]) }],ignored:()=>effect({support:-4,oldguard:5})},
 genericPub:{
  id:"genericPub",location:"pub",title:"Obchůzka stolů",emoji:"🍺",kicker:"KAMPAŇ",
  repeatable:true,text:()=>["Hospoda nabízí rychlý průzkum nálad. Každý stůl má jiný názor, ale všechny spojuje přesvědčení, že obec řídí idioti."],
  choices:[
   {label:"Naslouchat a zapisovat problémy",detail:"Pomalejší než slogan, ale lidé poznají, když si pamatujete jejich jméno.",check:{attr:"resilience",dc:11},tags:["ethical","public"],success:makeOutcome("Odcházíte s podporou a seznamem problémů delším než jídelní lístek.",{support:5,trust:4,citizens:5,integrity:3},["ethical","public"]),fail:makeOutcome("Po čtvrtém příběhu o kanalizaci začnete přikyvovat ve špatných místech.",{support:2,citizens:2},["public"])},
   {label:"Zaplatit rundu a pronést heslo",detail:"Politika v tekutém skupenství.",check:{attr:"charisma",dc:10},tags:["public"],success:makeOutcome("Heslo se chytí a účet také.",{support:7,funds:-3,citizens:3},["public"]),fail:makeOutcome("Rundu přijmou, heslo odmítnou. Demokracie si zachová standard.",{funds:-3,support:1},["public"])}
  ]
 },
 genericHQ:{
  id:"genericHQ",location:"hq",title:"Kampaňový tah",emoji:"📣",kicker:"KAMPAŇ",repeatable:true,
  text:()=>["V garáži zbývá tiskárna, káva a několik dobrovolníků, kteří ještě nezjistili, že politika je hlavně přenášení židlí."],
  choices:[
   {label:"Door-to-door kampaň",detail:"Dveře od dveří, pes od psa.",check:{attr:"charisma",dc:12},tags:["public","ethical"],success:makeOutcome("Dobrovolníci získají nové podporovatele a tři recepty na bábovku.",{support:7,citizens:5,trust:3,funds:-2},["public"]),fail:makeOutcome("Obejdete ulici, kde všichni volí Věčného nebo nejsou doma. Výsledek je statisticky nerozlišitelný.",{support:2,funds:-2},["public"])},
   {label:"Mikrocílená reklama",detail:"Každý občan uvidí jinou verzi stejného přesvědčení.",check:{attr:"intellect",dc:13},tags:["lie"],success:makeOutcome("Mladí vidí cyklostezku, starší parkování a Holub investiční příležitost.",{support:9,funds:-5,trust:-2,integrity:-5,heat:3},["lie"]),fail:makeOutcome("Reklama na levnější odpady se zobrazí lidem, kteří už rok třídí. Rozhněváte nejorganizovanější část obce.",{support:-3,funds:-5,trust:-2},["lie"])}
  ]
 },
 genericJzd:{
  id:"genericJzd",location:"jzd",title:"Jednání mezi silážemi",emoji:"🌾",kicker:"KONTAKT",repeatable:true,
  text:()=>["JZD je největší zaměstnavatel, dopravce i poskytovatel stanů. Brázda nabízí pomoc, ale každá pomoc má poznámku pod čarou."],
  choices:[
   {label:"Vyjednat veřejnou podporu",detail:"Brázda chce slyšet, co z toho bude mít venkov, JZD a Brázda.",check:{attr:"authority",dc:13},tags:["jzdDeal","power"],success:makeOutcome("Brázda vyšle zaměstnance na mítink. Tvrdí, že přišli dobrovolně a seřazení podle směn.",{jzd:8,support:5,influence:5,integrity:-2},["jzdDeal"]),fail:makeOutcome("Brázda podporu odloží. Traktor s vaším plakátem zaparkuje čelně ke zdi.",{jzd:-2,influence:-1},["jzdDeal"])},
   {label:"Získat drobný dar bez otázek",detail:"Otázky kazí vztahy i účetnictví.",check:{attr:"cunning",dc:11},tags:["corrupt","jzdDeal"],success:makeOutcome("Kampaň dostane palivo a hotovost. Účtenka dostane volno.",{funds:7,jzd:5,integrity:-8,heat:7},["corrupt","jzdDeal"]),fail:makeOutcome("Dar existuje jen ústně. Zato fotografie schůzky je velmi ostrá.",{heat:8,integrity:-5,jzd:2},["corrupt"])}
  ]
 },
 genericPaper:{
  id:"genericPaper",location:"paper",title:"Práce s obrazem",emoji:"📸",kicker:"MÉDIA",repeatable:true,
  text:()=>["Daniela připravuje další číslo. Má volnou jednu stranu, dvě nepříjemné otázky a nulovou chuť přepisovat tiskové prohlášení."],
  choices:[
   {label:"Dát otevřený rozhovor",detail:"Můžete získat důvěru nebo vytvořit větu, která vás bude pronásledovat.",check:{attr:"resilience",dc:13},tags:["transparent","public"],success:makeOutcome("Rozhovor působí lidsky a dokonce obsahuje odpovědi.",{press:8,trust:7,support:4,integrity:4},["transparent"]),fail:makeOutcome("Řeknete, že obec potřebuje řídit jako rodinu. Všichni si vzpomenou na vašeho strýce.",{press:2,support:-2,heat:3},["public"])},
   {label:"Podstrčit drobnou kauzu soupeře",detail:"Nejde o útok. Jen o pomoc veřejnosti s výběrem témat.",check:{attr:"cunning",dc:12},tags:["lie","power"],success:makeOutcome("Kauza o Věčného služebním křovinořezu se šíří rychleji, než by si křovinořez zasloužil.",{support:6,oldguard:-6,leverage:3,integrity:-5,heat:3},["lie"]),fail:makeOutcome("Daniela pozná zdroj a zveřejní, že kandidáti už bojují i o křovinořez.",{press:-5,trust:-3,integrity:-4},["lie"])}
  ]
 },
 grassrootsFunding:{
  id:"grassrootsFunding",location:"hq",title:"Kasa zeje transparentně prázdnotou",emoji:"🪙",kicker:"FINANCE",repeatable:true,
  available:()=>state.stats.funds<8&&(state.genericUses.grassrootsFunding||0)<2,
  text:()=>["Dobrovolníci upozorňují, že tiskárna nepřijímá důvěru ani integritu jako zákonné platidlo.","Můžete oslovit drobné dárce, prodávat absurdní kampaňový merch, nebo přijmout velký dar od člověka, který náhodou potřebuje územní plán."],
  choices:[
   {label:"Vybrat drobné transparentní dary",detail:"Padesát lidí, padesát převodů a padesát možností špatně napsat variabilní symbol.",check:{attr:"charisma",dc:13},tags:["ethical","transparent","public"],success:makeOutcome("Občané pošlou malé částky a velké množství rad, za co je smíte utratit.",{funds:9,trust:5,support:4,citizens:4},["ethical","transparent"]),fail:makeOutcome("Sbírka vybere méně než její grafika, ale několik lidí se poprvé zapojí.",{funds:4,trust:2,citizens:2},["ethical"])},
   {label:"Prodávat trička Slibem nezarmoutíš",detail:"Politický merchandising s účetně doložitelnou marží.",check:{attr:"intellect",dc:12},tags:["public","gray"],success:makeOutcome("Trička se vyprodají. Polovina ironicky, ale peníze nerozlišují motivaci.",{funds:7,support:4,heat:1},["public"]),fail:makeOutcome("Tiskárna obrátí slogan. Trička hlásají Nezarmoutíš slibem a stávají se sběratelským omylem.",{funds:2,support:2,heat:2},["public"])},
   {label:"Přijmout Holubův velký dar",detail:"Jedna platba, žádné administrativní starosti a velmi dlouhá paměť.",check:{attr:"cunning",dc:10},tags:["corrupt","contract"],success:makeOutcome("Kampaň je zachráněna. Holub už se ptá, jak široká bude příjezdová cesta k jeho budoucímu projektu.",{funds:16,business:7,integrity:-9,heat:5},["corrupt","contract"],()=>addCommitment({id:`holub_donation_${state.day}`,title:"Odměnit Holuba za velký dar kampani",creditor:"Holub",due:Math.min(13,state.day+3),notes:"Financování kampaně"})),fail:makeOutcome("Dar dorazí přes tři spolky a jeden z nich sídlí v pohřební službě.",{funds:10,heat:12,integrity:-10},["corrupt","contract"],()=>addCommitment({id:`holub_donation_${state.day}`,title:"Vysvětlit a odměnit Holubův dar",creditor:"Holub",due:Math.min(13,state.day+2),notes:"Podezřelé financování"}))}
  ]
 },
 obligationBrazda:{
  id:"obligationBrazda",location:"jzd",title:"Brázda si přišel pro svou část demokracie",emoji:"🤝",kicker:"POLITICKÝ DLUH",
  available:()=>activeCommitments("Brázda").some(c=>c.due<=state.day+1),
  text:()=>[`Brázda připomíná ${activeCommitments("Brázda").length} nesplacené závazky. Nevyhrožuje. Jen nahlas počítá autobusy, zaměstnance a příbuzné.`,`Politický dluh lze splnit, odložit, nebo veřejně roztrhat. Každá možnost má cenu.`],
  choices:[
   {label:"Splnit Brázdovy požadavky",detail:"Dáte mu vliv na výbor a slíbíte, že nafta už nebude společenské téma.",cost:2,check:{attr:"authority",dc:10},tags:["jzdDeal","power","corrupt"],success:makeOutcome("Brázda odchází spokojen. Obec získává stabilitu a dalšího člověka, kterého nikdo nevolil.",{jzd:12,influence:8,integrity:-12,trust:-3},["jzdDeal","corrupt"],()=>settleCommitments("Brázda","fulfilled")),fail:makeOutcome("Brázda přijme funkci, ale veřejně tvrdí, že jste ho prosil. Politický dluh je splacen s úrokem.",{jzd:6,influence:3,integrity:-13,heat:7},["jzdDeal","corrupt"],()=>settleCommitments("Brázda","fulfilled"))},
   {label:"Vyjednat odklad",detail:"Nabídnete mu příslib větší funkce později. Dluh roste, ale dnes zůstane klid.",check:{attr:"charisma",dc:14},tags:["gray","power"],success:makeOutcome("Brázda dá dva dny navíc. V kalendáři si však červeně zakroužkuje volební noc.",{influence:3,jzd:3,integrity:-4},["power"],()=>activeCommitments("Brázda").forEach(c=>c.due=Math.min(13,c.due+2))),fail:makeOutcome("Brázda odklad odmítne a pošle zaměstnance na Věčného mítink.",{jzd:-10,support:-5,heat:4},["power"])},
   {label:"Závazek zveřejnit a odmítnout",detail:"Přiznáte, co jste slíbil, a pokusíte se z politického dluhu udělat očistu.",check:{attr:"resilience",dc:15},tags:["ethical","transparent","police"],success:makeOutcome("Veřejnost ocení přiznání víc, než Brázda. Jeho síť se otočí proti vám, ale nevlastní vás.",{trust:10,integrity:12,jzd:-18,heat:5},["ethical","transparent"],()=>settleCommitments("Brázda","broken")),fail:makeOutcome("Přiznáte dohodu, ale nevysvětlíte, proč vznikla. Ztratíte Brázdu i část důvěry.",{trust:-5,integrity:5,jzd:-18,heat:13},["transparent"],()=>settleCommitments("Brázda","broken"))}
  ]
 },
 obligationHolub:{
  id:"obligationHolub",location:"meadow",title:"Holub fakturuje přátelství",emoji:"🏗️",kicker:"POLITICKÝ DLUH",
  available:()=>activeCommitments("Holub").some(c=>c.due<=state.day+1),
  text:()=>[`Holub přináší seznam ${activeCommitments("Holub").length} laskavostí, které podle něj vznikly spontánně. U každé je připravené políčko pro váš podpis.`,`Tvrdí, že nechce nic nezákonného. Chce jen zákon vyložit ve směru příjezdové cesty.`],
  choices:[
   {label:"Podepsat dodatky a změny",detail:"Kampaň bude pokračovat. Veřejný zájem získá soukromého provozovatele.",check:{attr:"cunning",dc:11},tags:["contract","corrupt","power"],success:makeOutcome("Holub získá dodatky a vy další podporu podnikatelů. Obec zaplatí rozdíl po volbách.",{business:14,funds:5,influence:8,integrity:-14,heat:7},["contract","corrupt"],()=>settleCommitments("Holub","fulfilled")),fail:makeOutcome("Dodatek obsahuje starou verzi projektu a novou cenu. Podepíšete obojí.",{business:7,funds:2,integrity:-15,heat:15,trust:-5},["contract","corrupt"],()=>settleCommitments("Holub","fulfilled"))},
   {label:"Nabídnout Holubovi menší kořist",detail:"Místo louky dostane reklamní plochy a catering. Korupce v dietní variantě.",check:{attr:"intellect",dc:14},tags:["gray","contract"],success:makeOutcome("Holub přijme menší zakázky. Dluh je splacen, jen rozdroben do účetně příjemnějších částek.",{business:7,funds:-2,integrity:-6,heat:3},["contract"],()=>settleCommitments("Holub","fulfilled")),fail:makeOutcome("Holub chápe nabídku jako urážku a předá faktury Věčnému.",{business:-12,heat:12,trust:-5},["contract"])},
   {label:"Roztrhat dohodu před kamerou",detail:"Dramatické, drahé a potenciálně osvobozující.",check:{attr:"authority",dc:15},tags:["ethical","transparent","antiBusiness"],success:makeOutcome("Holub přijde o páku a vy o sponzora. Nerozhodnutí poprvé uvěří, že se umíte vzdát výhody.",{trust:11,integrity:13,business:-20,funds:-4},["ethical","transparent"],()=>settleCommitments("Holub","broken")),fail:makeOutcome("Kamera zachytí jen to, že jste podepsaný dokument držel. Holub má kopii.",{trust:-7,heat:16,business:-12,integrity:3},["transparent"],()=>settleCommitments("Holub","broken"))}
  ]
 },
 obligationBohumil:{
  id:"obligationBohumil",location:"townhall",title:"Bohumil chce přežít další vedení",emoji:"🗄️",kicker:"POLITICKÝ DLUH",
  available:()=>activeCommitments("Bohumil").some(c=>c.due<=state.day+1),
  text:()=>[`Bohumil položí na stůl kopii dohody a žádost o jistotu zaměstnání. Nejde mu o moc. Jde mu o klíče od místnosti, kde se moc archivuje.`,`Můžete ho chránit, přimět ke svědectví, nebo mu vysvětlit, že loajalita je morální odměna bez platové třídy.`],
  choices:[
   {label:"Zaručit Bohumilovi místo a ochranu",detail:"Úřad dostane kontinuitu. Vy dostanete člověka, který ví, kde jsou všechny kopie.",check:{attr:"authority",dc:10},tags:["power","legal","corrupt"],success:makeOutcome("Bohumil přestane být nervózní a začne být užitečný. Závazek je splněn.",{officials:12,influence:7,integrity:-8},["power","legal"],()=>settleCommitments("Bohumil","fulfilled")),fail:makeOutcome("Slib zní nejistě. Bohumil si nechá ještě jednu kopii pro případ změny politického klimatu.",{officials:5,leverage:-2,heat:5,integrity:-7},["power"],()=>settleCommitments("Bohumil","fulfilled"))},
   {label:"Přesvědčit ho, aby vše zveřejnil",detail:"Z ochrany člověka uděláte ochranu whistleblowera. Může to zasáhnout i vás.",check:{attr:"resilience",dc:14},tags:["ethical","transparent","legal"],success:makeOutcome("Bohumil vystoupí veřejně a archiv získá mnoho majitelů. Už ho nelze jednoduše ztratit.",{trust:10,officials:8,press:7,heat:5,integrity:9},["ethical","transparent"],()=>settleCommitments("Bohumil","broken")),fail:makeOutcome("Bohumil odmítne hrdinství a předá kopii Daniele bez vašeho komentáře.",{press:3,heat:12,trust:-3},["transparent"],()=>settleCommitments("Bohumil","broken"))},
   {label:"Odmítnout a označit ho za vyděrače",detail:"Rychlé řešení, pokud zapomenete, že vyděrač má materiál.",check:{attr:"cunning",dc:15},tags:["lie","power"],success:makeOutcome("Bohumil ustoupí, ale přestane vám pomáhat. Vítězství bez přístupu ke skříni.",{influence:4,officials:-12,integrity:-5},["lie","power"],()=>settleCommitments("Bohumil","broken")),fail:makeOutcome("Bohumil zveřejní kopii i vaši hlasovou zprávu. Vydírání dostane veřejnoprávní podobu.",{heat:18,trust:-9,officials:-15,integrity:-8},["lie"],()=>settleCommitments("Bohumil","broken"))}
  ]
 },
 settleAccounts:{
  id:"settleAccounts",location:"hq",title:"Tiskárna chce peníze nebo budoucnost",emoji:"🧾",kicker:"FINANCE",
  available:()=>activeCommitments("Tiskárna Klička").length>0,
  text:()=>[`Kampaň dluží tiskárně ${activeCommitments("Tiskárna Klička").reduce((s,c)=>s+(c.amount||1),0)} jednotek. Majitel nechce být místostarosta. Stačí mu dlouhodobá smlouva na obecní tisk.`,`Dluh lze splatit, refinancovat u Holuba, nebo přeměnit v transparentní sbírku.`],
  choices:[
   {key:"repay",requireFunds:true,label:"Dluh skutečně splatit",detail:"Nečekaný politický experiment: účet bude zaplacen penězi.",check:{attr:"resilience",dc:9},tags:["ethical","legal"],success:makeOutcome("Tiskárna dostane peníze a poprvé během kampaně po vás nikdo nic dalšího nechce.",{trust:5,integrity:5},["ethical","legal"],()=>{const amount=activeCommitments("Tiskárna Klička").reduce((s,c)=>s+(c.amount||1),0);state.debt=Math.max(0,state.debt-amount);settleCommitments("Tiskárna Klička","fulfilled")}),fail:makeOutcome("Zaplatíte, ale účetní platbu pošle pod variabilním symbolem VĚČNÝ.",{trust:1,heat:3},["legal"],()=>{const amount=activeCommitments("Tiskárna Klička").reduce((s,c)=>s+(c.amount||1),0);state.debt=Math.max(0,state.debt-amount);settleCommitments("Tiskárna Klička","fulfilled")})},
   {label:"Refinancovat dluh u Holuba",detail:"Tiskárna dostane peníze. Holub dostane budoucnost.",check:{attr:"cunning",dc:11},tags:["contract","corrupt"],success:makeOutcome("Holub dluh zaplatí a přidá jej na seznam přátelských služeb.",{funds:3,business:5,integrity:-8},["contract","corrupt"],()=>{const amount=activeCommitments("Tiskárna Klička").reduce((s,c)=>s+(c.amount||1),0);settleCommitments("Tiskárna Klička","fulfilled");state.debt=Math.max(0,state.debt-amount);addCommitment({id:`holub_refi_${state.day}`,title:"Vrátit Holubovi refinancování kampaně",creditor:"Holub",due:13,amount,notes:"Převzal dluh tiskárně"})}),fail:makeOutcome("Holub zaplatí jen polovinu a druhou polovinu označí za váš osobní vklad.",{business:3,heat:5,integrity:-7},["contract"],()=>addCommitment({id:`holub_refi_${state.day}`,title:"Doplatit Holubovi refinancování",creditor:"Holub",due:13,notes:"Neúspěšné refinancování"}))},
   {label:"Vyhlásit veřejnou sbírku",detail:"Každý dárce dostane účtenku a právo ptát se, za co peníze utrácíte.",check:{attr:"charisma",dc:14},tags:["ethical","transparent","public"],success:makeOutcome("Drobní dárci dluh zaplatí. Kampaň získá peníze, ale ztratí právo předstírat, že nikomu nic nedluží.",{support:5,trust:8,citizens:6},["ethical","transparent"],()=>{const amount=activeCommitments("Tiskárna Klička").reduce((s,c)=>s+(c.amount||1),0);settleCommitments("Tiskárna Klička","fulfilled");state.debt=Math.max(0,state.debt-amount)}),fail:makeOutcome("Sbírka vybere třetinu a dva anonymní dary od společnosti R. Holub Consulting.",{funds:2,heat:6,integrity:-2},["transparent"]) }
  ]
 },
 policeInterview:{
  id:"policeInterview",location:"townhall",title:"Přátelský rozhovor bez obvinění",emoji:"🚓",kicker:"KOMPLIKACE",
  queued:true,text:()=>["Dva policisté se ptají na naftu, archiv nebo fotografii s krabicí. Zdůrazňují, že zatím nejde o výslech. Diktafon však položili velmi výslechově."],
  choices:[
   {label:"Říct celou pravdu",detail:"Může poškodit spojence, ale zmenší prostor pro vydírání.",check:{attr:"resilience",dc:13},tags:["ethical","police","transparent"],success:makeOutcome("Policie odchází s fakty a vy s menším počtem přátel, ale lehčím dechem.",{heat:-12,trust:5,integrity:8,leverage:-3},["ethical","police"],()=>state.opponent.scandals=Math.max(0,state.opponent.scandals-1)),fail:makeOutcome("Pravda je složitější, než zní. Policie si vás pozve znovu po volbách.",{heat:4,integrity:5,trust:1},["ethical","police"])},
   {label:"Nevzpomínat si v přesném pořadí",detail:"Paměť je lidská a zákon zná rozdíl mezi lží a procesní mlhou.",check:{attr:"cunning",dc:14},tags:["lie","legal"],success:makeOutcome("Policisté odcházejí s poznámkami, ale bez použitelné věty.",{heat:-4,integrity:-7,leverage:2},["lie","legal"]),fail:makeOutcome("Zapomenete, že jste před chvílí tvrdil opak. Poznámky se začnou červenat.",{heat:15,trust:-6,integrity:-8},["lie"])},
   {label:"Obětovat jednoho spojence",detail:"Politická odpovědnost sestoupí na člověka s menší kanceláří.",check:{attr:"authority",dc:12},tags:["corrupt","power"],success:makeOutcome("Případ dostane konkrétní jméno, které není vaše. Družina si všimne.",{heat:-10,influence:5,integrity:-15,trust:-4},["corrupt","power"],()=>{const ids=Object.keys(state.party);if(ids.length){const id=ids.sort((a,b)=>state.party[a].loyalty-state.party[b].loyalty)[0];delete state.party[id]}}),fail:makeOutcome("Spojenec začne mluvit dřív než policie. Váš pokus o oběť se mění v týmovou disciplínu opačným směrem.",{heat:18,trust:-8,integrity:-13,leverage:-3},["corrupt","power"])}
  ]
 },
 leakedTape:{
  id:"leakedTape",location:"paper",title:"Nahrávka, která neexistovala",emoji:"🎧",kicker:"KOMPLIKACE",queued:true,
  text:()=>["Na internetu se objeví úryvek vašeho jednání s Brázdou. Chybí začátek, konec i kontext. Obsahuje však přesně tu část, která kontext nepotřebuje."],
  choices:[
   {label:"Přiznat schůzku a vysvětlit ji",detail:"Krátkodobě bolestivé, dlouhodobě možná méně smrtelné.",check:{attr:"charisma",dc:14},tags:["transparent","ethical"],success:makeOutcome("Přiznání zastaví nejhorší spekulace. Daniela ocení, že alespoň jednou nemusí hledat pravdu sama.",{trust:6,heat:-8,support:-2,integrity:6,press:5},["transparent","ethical"]),fail:makeOutcome("Vysvětlení má osm minut a každá minuta vytváří novou otázku.",{heat:8,trust:-5,support:-5,integrity:3},["transparent"])},
   {label:"Označit nahrávku za podvrh",detail:"Technicky je sestříhaná. Politicky je to téměř totéž jako nepravdivá.",check:{attr:"authority",dc:13},tags:["lie","pressAttack"],success:makeOutcome("Vaši příznivci přestanou nahrávku poslouchat. Ostatní ji poslouchají dvakrát.",{support:3,heat:-2,press:-8,integrity:-10,trust:-5},["lie","pressAttack"]),fail:makeOutcome("Autor zveřejní celý záznam včetně vašeho výroku To se nikdy nesmí dostat ven.",{heat:20,trust:-12,support:-9,integrity:-11},["lie","pressAttack"])},
   {label:"Vypustit větší skandál Věčného",detail:"Požár se nehasí vodou, ale požárem s lepším titulkem.",check:{attr:"cunning",dc:15},tags:["power","lie"],success:makeOutcome("Věčný vysvětluje pozemek své švagrové. Vaše nahrávka zmizí z titulní strany, ne z internetu.",{support:8,heat:2,oldguard:-12,leverage:-4,integrity:-8},["power","lie"]),fail:makeOutcome("Média spojí obě kauzy do speciálu VÁLKA KOMPROMATŮ. Vy jste na titulní fotografii větší.",{heat:18,support:-8,press:-8,integrity:-7},["lie"])}
  ]
 },
 roofEmergency:{
  id:"roofEmergency",location:"school",title:"Déšť hlasuje proti vám",emoji:"🌧️",kicker:"KOMPLIKACE",queued:true,
  text:()=>["Přijde bouřka. Provizorní zakrytí povolí a školní tělocvična se mění v krytý bazén bez povolení."],
  choices:[
   {label:"Zrušit kampaňový den a osobně pomáhat",detail:"Ztratíte čas, ale lidé uvidí, že umíte držet i něco jiného než mikrofon.",check:{attr:"resilience",dc:11},tags:["ethical","children","public"],success:makeOutcome("Školu zachráníte a fotografie vzniknou bez objednaného fotografa.",{support:9,trust:10,integrity:9,funds:-3,citizens:7},["ethical","children"],()=>completeQuest("roof","Škola zachráněna při bouřce.")),fail:makeOutcome("Pomáháte, ale voda je rychlejší. Marie oceňuje snahu, opozice fotografii s kýblem.",{support:3,trust:4,integrity:7,funds:-3},["ethical","children"],()=>completeQuest("roof","Škola přežila s následky."))},
   {label:"Přijmout Holubovu nouzovou nabídku",detail:"V krizi se ceny nepředražují. Jen dynamicky reagují.",check:{attr:"cunning",dc:10},tags:["corrupt","contract","children"],success:makeOutcome("Holub školu zakryje do rána a fakturu do oběda.",{funds:-2,business:12,support:5,integrity:-10,heat:9},["corrupt","contract","children"],()=>{completeQuest("roof","Nouzovou opravu provedl Holub.");addParty("holub",8)}),fail:makeOutcome("Holub přijede pozdě, ale faktura včas.",{funds:-5,support:-5,trust:-5,integrity:-8,heat:8},["corrupt","contract"],()=>completeQuest("roof","Nouzová oprava selhala."))}
  ]
 },
 auditLeak:{
  id:"auditLeak",location:"paper",title:"Audit umí číst i novinář",emoji:"📑",kicker:"KOMPLIKACE",queued:true,
  text:()=>["Daniela drží uniklou zprávu o naftě. Je v ní Brázda, Radovan i vaše jméno v kolonce politická konzultace."],
  choices:[
   {label:"Pomoci jí zveřejnit všechno",detail:"Zasáhne to i vás, ale vezmete Brázdovi možnost dávkovat pravdu.",check:{attr:"resilience",dc:13},tags:["ethical","transparent"],success:makeOutcome("Článek bolí všechny přibližně spravedlivě. Brázda zuří, veřejnost vám část viny odpustí.",{trust:6,press:9,jzd:-14,integrity:8,heat:-3,support:-2},["ethical","transparent"],()=>addParty("daniela",8)),fail:makeOutcome("Zveřejnění působí jako panická obrana. Brázda i Věčný vás označí za viníka.",{trust:-5,press:2,jzd:-10,integrity:4,heat:8,support:-5},["transparent"])},
   {label:"Přesvědčit ji, že dokument není ověřený",detail:"Je ověřený, ale ne způsobem, který by byl pohodlný.",check:{attr:"charisma",dc:15},tags:["lie","pressAttack"],success:makeOutcome("Daniela vydání odloží. Nezapomene, že jste ji přesvědčil proti jejímu instinktu.",{heat:-6,press:-8,integrity:-10,leverage:4},["lie","pressAttack"],()=>addParty("daniela",-14)),fail:makeOutcome("Daniela zveřejní článek i váš pokus ho zastavit.",{heat:17,press:-13,trust:-9,integrity:-11},["lie","pressAttack"]) }
  ]
 },
 pressAmbush:{
  id:"pressAmbush",location:"paper",title:"Otázka s připraveným titulkem",emoji:"📹",kicker:"KOMPLIKACE",queued:true,
  text:()=>["Před úřadem čeká kamera. Otázka zní stručně: Manipuloval jste obecní tisk? Odpověď bude vysílána celá, pokud nebude příliš dlouhá, tedy nebude."],
  choices:[
   {label:"Odpovědět ano a převzít odpovědnost",detail:"Radikální technika založená na slově ano.",check:{attr:"resilience",dc:14},tags:["ethical","transparent"],success:makeOutcome("Reportér na chvíli ztratí další otázku. Přiznání vás poškodí méně než další výmluva.",{trust:7,heat:-8,support:-3,integrity:8,press:4},["ethical","transparent"]),fail:makeOutcome("Přiznání zní jako potvrzení všeho, co soupeř tvrdil. Je poctivé a volebně katastrofální.",{trust:2,support:-8,integrity:6,heat:2},["ethical"])},
   {label:"Přejít do protiútoku na média",detail:"Když nelze změnit odpověď, lze změnit nepřítele.",check:{attr:"authority",dc:12},tags:["lie","pressAttack","public"],success:makeOutcome("Vaši příznivci se semknou. Novináři také.",{support:6,press:-16,integrity:-9,trust:-5,heat:5},["lie","pressAttack"]),fail:makeOutcome("Útok působí zbaběle. Video s titulkem KANDIDÁT UTÍKÁ má víc zhlédnutí než celá kampaň.",{support:-10,press:-12,integrity:-8,heat:9},["lie","pressAttack"]) }
  ]
 },
 documentWar:{
  id:"documentWar",location:"townhall",title:"Válka složek",emoji:"📚",kicker:"KOMPLIKACE",queued:true,
  text:()=>["Po obci kolují tři verze stejné smlouvy. Každá je pravá, každá říká něco jiného a jedna má přílohu podepsanou člověkem, který tvrdí, že nikdy neuměl psát."],
  choices:[
   {label:"Zveřejnit datovou místnost se všemi verzemi",detail:"Veřejnost uvidí vše. Pravděpodobně tomu nebude rozumět, ale nikdo nebude moci tvrdit, že to neviděl.",check:{attr:"intellect",dc:14},tags:["transparent","legal"],success:makeOutcome("Daniela najde podstatné věci a vysvětlí je lidem. Věčný ztratí výhodu chaosu.",{trust:9,press:8,officials:8,integrity:6,oldguard:-7,heat:-4},["transparent","legal"]),fail:makeOutcome("Datová místnost obsahuje 4 800 souborů nazvaných scan. Pravda je zveřejněna a prakticky nedostupná.",{trust:2,officials:3,heat:2},["legal"])},
   {label:"Vytvořit jednu definitivní verzi",detail:"Historie potřebuje editora. Vy máte razítko.",check:{attr:"cunning",dc:13},tags:["corrupt","destroyEvidence","legal"],success:makeOutcome("Jedna verze se stane oficiální. Bohumil si tiše ponechá druhou.",{influence:10,heat:-3,integrity:-14,officials:5,leverage:5},["corrupt","destroyEvidence"],()=>addParty("bohumil",-9)),fail:makeOutcome("V nové verzi zapomenete změnit datum. Vznikne čtvrtá pravá smlouva.",{heat:13,integrity:-12,trust:-7},["corrupt","destroyEvidence"]) }
  ]
 },
 fireBrigade:{
  id:"fireBrigade",location:"pitch",title:"Hasiči chtějí cisternu a odpověď",emoji:"🚒",kicker:"NÁHODNÁ UDÁLOST",queued:true,
  text:()=>["Dobrovolní hasiči potřebují opravit cisternu. Věčný nabízí peníze po volbách. Holub nabízí sponzoring výměnou za své logo větší než obecní znak."],
  choices:[
   {label:"Najít peníze v rozpočtu a zveřejnit přesun",detail:"Méně plakátů, více vody.",check:{attr:"intellect",dc:12},tags:["ethical","transparent","public"],success:makeOutcome("Cisterna vyjede a hasiči vás veřejně podpoří, aniž byste jim to musel napsat.",{support:8,trust:7,citizens:8,integrity:7,funds:-4},["ethical","transparent"]),fail:makeOutcome("Peníze najdete, ale až po volbách. Hasiči vám přesto půjčí megafon, ne cisternu.",{support:3,trust:2,integrity:4,funds:-2},["ethical"])},
   {label:"Vzít Holubův sponzoring",detail:"Cisterna bude červená, logo zlaté a závazek neviditelný.",check:{attr:"cunning",dc:10},tags:["contract","corrupt"],success:makeOutcome("Hasiči mají cisternu. Holub má fotografii, vaše číslo a další důvod volat.",{support:7,business:10,integrity:-8,heat:5},["contract","corrupt"],()=>addParty("holub",5)),fail:makeOutcome("Logo překryje nápis HASIČI. Obec má nejrychlejší reklamní plochu v okrese.",{support:2,business:5,integrity:-6,heat:4},["contract"])}
  ]
 },
 anonymousLeaflet:{
  id:"anonymousLeaflet",location:"hq",title:"Anonymní leták se známým rukopisem",emoji:"🕵️",kicker:"TAH SOUPEŘE",queued:true,
  text:()=>["Ve schránkách se objeví leták tvrdící, že chcete zavřít hospodu, zdanit slepice a přestěhovat náves do okresního města."],
  choices:[
   {label:"Vyvrátit každou lež věcně",detail:"Devět bodů, osm zdrojů a nulová jistota, že to někdo dočte.",check:{attr:"intellect",dc:13},tags:["transparent"],success:makeOutcome("Daniela z letáku udělá příklad špinavé kampaně. Věčný se od něj distancuje podezřele rychle.",{trust:8,press:7,support:5,integrity:5,oldguard:-4},["transparent"]),fail:makeOutcome("Vyvracením představíte fámy lidem, kteří je ještě neznali.",{support:-4,trust:-2,integrity:3},["transparent"])},
   {label:"Vyrobit ještě absurdnější leták o Věčném",detail:"Když se pravidla rozpadla, můžete alespoň vyhrát v jejich disciplíně.",check:{attr:"cunning",dc:12},tags:["lie","power"],success:makeOutcome("Leták tvrdí, že Věčný prodá rybník zahraničním kaprům. Je tak absurdní, až mu část lidí uvěří.",{support:7,oldguard:-7,integrity:-9,heat:4},["lie","power"]),fail:makeOutcome("Tiskárna omylem přidá vaše logo. Anonymita trvá sedm minut.",{support:-6,heat:10,integrity:-8,trust:-5},["lie"])}
  ]
 },
 developerBacklash:{
  id:"developerBacklash",location:"meadow",title:"Vizualizace nelže, smlouva mlčí",emoji:"🏗️",kicker:"KOMPLIKACE",queued:true,
  text:()=>["Holub zveřejní krásnou vizualizaci školky, parku a šťastných lidí bez kamionů. Ve smlouvě školka není a kamiony ano."],
  choices:[
   {label:"Smlouvu zastavit a přiznat chybu",detail:"Přijdete o spojence i peníze, ale možná ne o louku.",check:{attr:"authority",dc:14},tags:["ethical","antiBusiness","transparent"],success:makeOutcome("Projekt se zastaví. Holub vás označí za nespolehlivého, což z jeho úst zní skoro jako pochvala.",{trust:9,citizens:8,business:-20,integrity:10,heat:-2,funds:-4},["ethical","antiBusiness"],()=>{state.quests.meadow.status="done";delete state.party.holub}),fail:makeOutcome("Smlouva už obsahuje sankci. Projekt pokračuje a obec platí za pokus být slušná.",{trust:-4,citizens:-7,business:5,integrity:6,funds:-8,heat:5},["ethical","antiBusiness"])},
   {label:"Přepsat příběh jako velké vítězství",detail:"Školka nebude, ale projekt vytvoří kapacitu pro budoucí diskusi o školce.",check:{attr:"charisma",dc:13},tags:["lie","public"],success:makeOutcome("Část obce přijme, že parkoviště je předstupeň školství. Holub je spokojen.",{support:5,business:7,trust:-5,integrity:-9,heat:3},["lie"]),fail:makeOutcome("Na veřejné schůzi se někdo zeptá, kde přesně budou děti spát mezi kamiony.",{support:-8,trust:-9,integrity:-8,heat:7},["lie"])}
  ]
 },
 meadowProtest:{
  id:"meadowProtest",location:"meadow",title:"Tábor na poslední louce",emoji:"⛺",kicker:"KOMPLIKACE",queued:true,
  text:()=>["Odpůrci projektu postavili na louce stanový tábor. Holub přivezl bagr a tvrdí, že jen symbolicky parkuje."],
  choices:[
   {label:"Postavit se mezi bagr a lidi",detail:"Autorita, reflexy a možnost stát se titulní fotografií.",check:{attr:"resilience",dc:13},tags:["ethical","public","antiBusiness"],success:makeOutcome("Bagr se zastaví. Protestující vás přijmou, Holub vyškrtně z vánočního seznamu.",{support:8,citizens:12,business:-14,integrity:9,trust:7},["ethical","antiBusiness"],()=>{if(state.quests.meadow.status==="active")completeQuest("meadow","Louka zachráněna při protestu.")}),fail:makeOutcome("Zakopnete o kolík stanu. Bagr stojí, ale fotografie má jiný hrdinský účinek.",{support:3,citizens:5,business:-5,integrity:6},["ethical"],()=>{if(state.quests.meadow.status==="active")completeQuest("meadow","Projekt zastavil chaos na louce.")})},
   {label:"Dohodnout noční kompromis",detail:"Bagr odjede, stany zmizí a ráno každý oznámí jiné vítězství.",check:{attr:"cunning",dc:14},tags:["gray","power"],success:makeOutcome("Krize skončí bez násilí. Holub dostane nový termín, aktivisté nový výbor a vy nový závazek.",{support:5,influence:8,citizens:3,business:3,integrity:-3,heat:3},["power"],()=>{if(state.quests.meadow.status==="active")completeQuest("meadow","Louka uzavřena nočním kompromisem.")}),fail:makeOutcome("Někdo zveřejní fotografii nočního jednání. Obě strany vás označí za zrádce.",{support:-8,citizens:-8,business:-8,heat:9,integrity:-4},["power"],()=>{if(state.quests.meadow.status==="active")failQuest("meadow","Louka skončila ve veřejné válce.")})}
  ]
 },
 roofCollapse:{
  id:"roofCollapse",location:"school",title:"Střecha hlasuje nohama",emoji:"💥",kicker:"KOMPLIKACE",queued:true,
  text:()=>["Část nové střechy se sesune během noci. Nikdo není zraněn. Holub tvrdí, že šlo o neočekávané gravitační zatížení."],
  choices:[
   {label:"Okamžitě vypovědět smlouvu a vše zveřejnit",detail:"Konec sponzora, začátek drahé opravy.",check:{attr:"authority",dc:14},tags:["ethical","transparent","children","antiBusiness"],success:makeOutcome("Holub přichází o zakázku a vy o peníze. Marie přesvědčí rodiče, že jste chybu alespoň nezakryl.",{trust:9,integrity:10,business:-20,funds:-9,heat:-3,citizens:6},["ethical","transparent","children"],()=>{completeQuest("roof","Vadná střecha odhalena.");delete state.party.holub}),fail:makeOutcome("Holub aktivuje smluvní dodatky. Obec platí za střechu i její demontáž.",{trust:-3,integrity:7,business:-8,funds:-12,heat:6},["ethical","children"],()=>completeQuest("roof","Vadná střecha se prodražila."))},
   {label:"Prohlásit závadu za plánovanou revizi",detail:"Střecha se nesesunula. Pouze přešla do kontrolní polohy.",check:{attr:"charisma",dc:15},tags:["lie","corrupt","children"],success:makeOutcome("Holub konstrukci opraví před svítáním. Příběh přežije, konstrukce snad také.",{support:2,business:9,integrity:-15,heat:10,trust:-5},["lie","corrupt","children"],()=>completeQuest("roof","Závada byla komunikačně opravena.")),fail:makeOutcome("Rodiče mají fotografie. Výraz plánovaná revize se stane místní nadávkou.",{support:-12,trust:-14,integrity:-14,heat:18,business:-3},["lie","children"],()=>completeQuest("roof","Střešní kauza explodovala."))}
  ]
 },
 water:{
  id:"water",location:"school",title:"Voda barvy volebního programu",emoji:"🚰",kicker:"POZDNÍ QUEST",
  available:()=>state.quests.water.status==="active",
  text:()=>["Rozbor vody ze školní kuchyně našel bakterie, rez a stopové množství optimismu. Hygiena chce odpověď do zítřka.","Věčný tvrdí, že vodu pil třicet let a nic mu není. Publikum si není jisté, zda tím pomáhá vašemu argumentu."],
  choices:[
   {label:"Zveřejnit rozbor a přivézt cisternu",detail:"Drahé a nepříjemné. Také je to pitná voda.",check:{attr:"resilience",dc:13},tags:["ethical","transparent","children"],success:makeOutcome("Cisterna dorazí, škola zůstane otevřená a lidé oceňují, že bakterie nedostaly komunikační embargo.",{trust:10,support:7,integrity:9,funds:-6,citizens:7,heat:-2},["ethical","transparent","children"],()=>{completeQuest("water","Kontaminace zveřejněna a voda zajištěna.");addItem("labReport")}),fail:makeOutcome("Cisterna zabloudí k vedlejší obci. Přesto jste problém přiznal dřív než Věčný stačil najít starou fotografii u studny.",{trust:4,support:1,integrity:7,funds:-5,heat:4},["ethical","transparent"],()=>{completeQuest("water","Nouzové zásobování se zpozdilo.");addItem("labReport")})},
   {label:"Označit výsledek za laboratorní názor",detail:"Bakterie mají právo na názor, nikoliv na tiskovou konferenci.",check:{attr:"charisma",dc:14},tags:["lie","pressAttack","children"],success:makeOutcome("Část obce uvěří, že voda je bezpečná, protože je česká. Hygiena nikoliv.",{support:5,trust:-8,integrity:-12,heat:12,oldguard:6},["lie","pressAttack"],()=>{completeQuest("water","Rozbor byl komunikačně zpochybněn.");schedule("regionalInspector",1)}),fail:makeOutcome("Daniela zveřejní celý protokol včetně věty NEPÍT. Vaše video má mezitím titulek PANIKA OPOZICE.",{support:-8,trust:-12,integrity:-13,heat:18,press:-8},["lie","pressAttack"],()=>{completeQuest("water","Zatajování vody prasklo.");schedule("regionalInspector",1)})},
   {label:"Koupit balenou vodu od Holuba",detail:"Každá lahev má logo kampaně a cenu menšího vína.",check:{attr:"cunning",dc:12},tags:["contract","corrupt","children"],success:makeOutcome("Voda dorazí okamžitě. Holub vydělá, děti pijí a vy získáte fotografii s lahví i budoucí fakturu.",{support:6,funds:-8,business:10,influence:5,integrity:-9,heat:7},["contract","corrupt"],()=>{completeQuest("water","Nouzovou vodu dodal sponzor.");addParty("holub",7)}),fail:makeOutcome("Na lahvích je vaše jméno, na faktuře trojnásobná cena a v jedné várce perlivá voda pro školní jídelnu.",{support:-4,funds:-10,business:5,integrity:-10,heat:13},["contract","corrupt"],()=>{completeQuest("water","Dodávka vody se stala kauzou.");schedule("mysteryDonation",1)})}
  ]
 },
 budget:{
  id:"budget",location:"townhall",title:"Rozpočet ve tři ráno",emoji:"🌙",kicker:"POZDNÍ QUEST",
  available:()=>state.quests.budget.status==="active",
  text:()=>["Věčný svolal mimořádné zastupitelstvo na 2:47 ráno. Balík obsahuje opravu silnice, chytrou lavičku, poradenskou studii a položku strategická rezerva bez slovesa.","Hlasovat se má za osm minut. Bohumil vám pod stolem podává původní verzi rozpočtu s červenými poznámkami."],
  choices:[
   {label:"Rozebrat rozpočet položku po položce",detail:"Nejdelší bossfight v obci. Káva je vedlejší mechanika.",check:{attr:"intellect",dc:15},companion:"bohumil",tags:["transparent","legal"],success:makeOutcome("Odhalíte lavičku za 890 tisíc a studii, která opisuje Wikipedii. Balík se rozpadne před svítáním.",{trust:11,support:8,officials:10,integrity:9,oldguard:-10,heat:2},["transparent","legal"],()=>{completeQuest("budget","Noční rozpočet rozebrán.");addItem("budgetDraft");state.opponent.momentum-=8}),fail:makeOutcome("U položky 67 usnete. Věčný nechá schválit vše kromě kávy, kterou jste vypil.",{support:-5,trust:-3,integrity:5,oldguard:8,heat:5},["transparent","legal"],()=>{completeQuest("budget","Rozpočet prošel po vyčerpání opozice.");addItem("budgetDraft")})},
   {label:"Vyměnit podporu za vlastní projekty",detail:"Rozpočet zůstane špatný, ale bude v něm i vaše špatnost.",check:{attr:"cunning",dc:13},tags:["power","gray","contract"],success:makeOutcome("Dostanete peníze na školu a kampaňovou garáž. Věčný dostane lavičku a jistotu, že jste už součástí tabulky.",{funds:8,influence:10,support:4,integrity:-7,heat:6,oldguard:3},["power","contract"],()=>{completeQuest("budget","Rozpočet schválen výměnou za dodatky.");addItem("budgetDraft")}),fail:makeOutcome("Věčný vaše dodatky přijme ústně a v konečné verzi chybí. Zůstane jen vaše hlasování pro.",{support:-7,trust:-8,integrity:-9,heat:10,oldguard:7},["power","contract"],()=>completeQuest("budget","Rozpočtový obchod se nepovedl."))},
   {label:"Spustit přímý přenos a obstrukci",detail:"Když nelze vyhrát hlasování, lze vyhrát klip.",check:{attr:"authority",dc:14},tags:["public","power","pressAttack"],success:makeOutcome("Přenos sleduje půl obce. Věčný ve 4:18 ztratí nervy a řekne, že veřejnost do rozpočtu nevidí. Poprvé má pravdu i problém.",{support:12,press:8,oldguard:-8,influence:5,heat:5,integrity:1},["public","power"],()=>{completeQuest("budget","Noční rozpočet zastavil veřejný přenos.");state.opponent.momentum-=7}),fail:makeOutcome("Internet vypadne po sedmi minutách. Obstrukce trvá do rána a veřejnost vidí jen fotografii vašeho spánku.",{support:-4,press:-2,oldguard:5,heat:4},["public","power"],()=>completeQuest("budget","Obstrukce se ztratila bez signálu."))}
  ]
 },
 waste:{
  id:"waste",location:"pitch",title:"Popelnicové povstání",emoji:"🗑️",kicker:"POZDNÍ QUEST",
  available:()=>state.quests.waste.status==="active",
  text:()=>["Svozová firma zastavila auta. Tvrdí, že obec dluží dvě faktury. Obec tvrdí, že faktury nemají správný font. Náves zatím fermentuje.","Věčný nabízí řešení: počkat do voleb a pak vyhlásit, že nový starosta zdědil katastrofu."],
  choices:[
   {label:"Zveřejnit smlouvu a dohodnout nouzový svoz",detail:"Nejdřív fakta, potom popelnice. Neobvyklé pořadí.",check:{attr:"intellect",dc:13},tags:["transparent","legal","public"],success:makeOutcome("Ukáže se, že obec skutečně dluží. Dohodnete splátku a svoz vyjede bez billboardu.",{trust:9,support:7,officials:7,funds:-5,integrity:8,heat:-2},["transparent","legal"],()=>{completeQuest("waste","Svoz obnoven po zveřejnění smlouvy.");addItem("wasteContract")}),fail:makeOutcome("Smlouva má šest dodatků a každý popírá předchozí. Svoz začne o den později a obec získá právní kompost.",{trust:3,support:1,funds:-6,integrity:5,heat:5},["transparent","legal"],()=>{completeQuest("waste","Svoz obnoven po smluvním chaosu.");addItem("wasteContract")})},
   {label:"Najmout Holubovy traktory",detail:"Odpad zmizí rychle. Faktura se objeví pomalu.",check:{attr:"cunning",dc:11},tags:["contract","corrupt","public"],success:makeOutcome("Traktory vyčistí náves za noc. Holub má nové fotografie, zakázku a důvod volat vám po volbách.",{support:10,business:12,funds:-7,influence:6,integrity:-9,heat:8},["contract","corrupt"],()=>{completeQuest("waste","Odpad odvezl sponzor.");addParty("holub",6)}),fail:makeOutcome("Jeden traktor vysype pytle před Věčného dům, druhý před váš. Obec získá vyvážené zpravodajství.",{support:-5,business:4,funds:-8,integrity:-7,heat:10},["contract","corrupt"],()=>completeQuest("waste","Nouzový svoz vytvořil dvě skládky."))},
   {label:"Vyhlásit obecní brigádu",detail:"Každý občan odnese pytel a jeden politický názor.",check:{attr:"charisma",dc:13},tags:["ethical","public"],success:makeOutcome("Přijde sedmdesát lidí, hasiči a tři kandidáti, kteří tvrdí, že akci svolali oni.",{support:11,citizens:12,trust:7,integrity:7,funds:-2},["ethical","public"],()=>completeQuest("waste","Odpad uklidila obecní brigáda.")),fail:makeOutcome("Přijdou dobrovolníci, ale také televize přesně ve chvíli, kdy se protrhne pytel s plenkami.",{support:2,citizens:5,trust:2,integrity:5,heat:5},["ethical","public"],()=>completeQuest("waste","Brigáda uspěla s obrazovou ztrátou."))}
  ]
 },
 ballots:{
  id:"ballots",location:"townhall",title:"Hlasovací lístky bez kandidáta",emoji:"🗳️",kicker:"POZDNÍ QUEST",
  available:()=>state.quests.ballots.status==="active",
  text:()=>["Bohumil přinese zkušební tisk hlasovacích lístků. Vaše jméno chybí, Věčný je uveden dvakrát a jeden kandidát se jmenuje Načítání dat.","Tiskárna slibuje opravu. Věčný navrhuje, aby se chyba nepolitizovala, protože jemu politicky vyhovuje."],
  choices:[
   {label:"Chybu okamžitě zveřejnit a vytisknout znovu",detail:"Drahé, ale voliči dostanou možnost volit i vás.",check:{attr:"authority",dc:12},tags:["transparent","legal","public"],success:makeOutcome("Nové lístky dorazí včas. Staré se stanou důkazem i nejžádanějším suvenýrem kampaně.",{trust:9,support:5,officials:8,integrity:8,funds:-4,heat:-2},["transparent","legal"],()=>{completeQuest("ballots","Hlasovací lístky opraveny veřejně.");addItem("ballotProof")}),fail:makeOutcome("Tiskárna opraví jméno, ale vytiskne vás jako nezávisle závislého kandidáta. Je to alespoň právně existující kategorie.",{trust:4,support:1,integrity:6,funds:-5,heat:3},["transparent","legal"],()=>{completeQuest("ballots","Lístky opraveny s novou chybou.");addItem("ballotProof")})},
   {label:"Rozdat vlastní správné lístky",detail:"Rychlé, účinné a na hraně volebního zákona i domácí tiskárny.",check:{attr:"cunning",dc:14},tags:["gray","power","legal"],success:makeOutcome("Dobrovolníci doručí správné lístky do většiny schránek. Bohumil dýchá do papírového sáčku, ale funguje to.",{support:8,influence:6,officials:-3,integrity:-3,heat:7,funds:-3},["power","legal"],()=>{completeQuest("ballots","Kampaň distribuovala vlastní lístky.");addItem("ballotProof")}),fail:makeOutcome("Část lístků skončí v sousední obci. Tam získáte rekordní podporu, která se bohužel nepočítá.",{support:-6,heat:11,officials:-7,integrity:-5,funds:-3},["power","legal"],()=>completeQuest("ballots","Vlastní distribuce selhala."))},
   {label:"Nechat chybu být a obvinit Věčného po volbách",detail:"Pokud prohrajete, máte kauzu. Pokud vyhrajete, máte legendu.",check:{attr:"resilience",dc:16},tags:["lie","power"],success:makeOutcome("Chyba vyvolá vztek a lidé si vaše číslo dopisují ručně. Volební komise zestárne o šest let.",{support:10,leverage:8,integrity:-9,heat:13,oldguard:-6},["lie","power"],()=>{completeQuest("ballots","Tisková chyba využita jako mobilizace.");addItem("ballotProof")}),fail:makeOutcome("Část voličů vás skutečně nenajde. Věčný vyjádří lítost a dvakrát se zakroužkuje.",{support:-12,trust:-8,integrity:-10,heat:14,oldguard:8},["lie","power"],()=>completeQuest("ballots","Chyba poškodila kandidaturu."))}
  ]
 },
 escapedBull:{
  id:"escapedBull",location:"jzd",title:"Býk vstoupil do kampaně",emoji:"🐂",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Z JZD utekl plemenný býk Bohouš a zamířil přímo na předvolební stánek. Brázda tvrdí, že zvíře reaguje na změnu klimatu, nikoliv na vaše plakáty."],
  choices:[
   {label:"Pomoci zahnat býka",detail:"Hrdinství, nebo velmi krátká politická kariéra.",check:{attr:"resilience",dc:13},tags:["ethical","public","jzdDeal"],success:makeOutcome("Bohouš se vrátí do ohrady a video s vámi získá víc zhlédnutí než program.",{support:9,jzd:7,citizens:6,trust:5},["ethical","public"]),fail:makeOutcome("Býk zničí stánek a ušetří vám distribuci poloviny letáků.",{support:2,funds:-4,heat:4},["public"])},
   {label:"Prohlásit býka za symbol změny",detail:"Když událost nelze řídit, lze ji alespoň brandovat.",check:{attr:"charisma",dc:12},tags:["public","lie"],success:makeOutcome("Hashtag #BohoušProStarostu trenduje. V průzkumu má býk devět procent.",{support:8,press:7,integrity:-3},["public","lie"]),fail:makeOutcome("Býk sežere transparent ZMĚNA. Věčný fotografii použije bez úprav.",{support:-4,press:-2,integrity:-2},["lie"])}
  ],ignored:()=>{effect({support:-4,funds:-3,jzd:-3});addNews("Býk Bohouš zničil kampaňový stánek. Věčný slíbil plot.","bad")}
 },
 powerOutage:{
  id:"powerOutage",location:"hq",title:"Tma nad transparentním účtem",emoji:"🔌",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Během živého přenosu vypadne proud. Tiskárna se zastaví, telefon svítí a dobrovolník omylem pustí zvukovou zprávu, která neměla opustit skupinový chat."],
  choices:[
   {label:"Pokračovat při svíčkách",detail:"Autentické, levné a požárně diskutabilní.",check:{attr:"charisma",dc:11},tags:["public","ethical"],success:makeOutcome("Přenos při svíčkách vypadá lidsky. Diváci odpustí i zvukovou zprávu o tom, že jsou diváci.",{support:7,trust:5,citizens:4},["public","ethical"]),fail:makeOutcome("Svíčka zapálí roh programu. Video se jmenuje KANDIDÁT PÁLÍ SLIBY.",{support:-3,heat:5,funds:-2},["public"])},
   {label:"Obvinit sabotáž starých struktur",detail:"Jistič je technický detail, nepřítel je příběh.",check:{attr:"authority",dc:13},tags:["lie","power"],success:makeOutcome("Dobrovolníci se semknou. Elektrikář mlčí, protože zakázku má od obce.",{support:8,oldguard:-5,integrity:-7,heat:4},["lie","power"]),fail:makeOutcome("Elektrikář zveřejní fotografii vaší přetížené prodlužovačky.",{support:-5,trust:-6,integrity:-6,heat:7},["lie"])}
  ],ignored:()=>{effect({funds:-3,support:-2});addNews("Výpadek proudu zničil část letáků. Věčný nabízí zapůjčení prodlužovačky.","bad")}
 },
 fakePoll:{
  id:"fakePoll",location:"paper",title:"Průzkum se vzorkem jednoho starosty",emoji:"📊",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Anonymní agentura ObecData zveřejnila průzkum: Věčný 61 procent, vy 14 a nerozhodnutí 37. Součet potvrzuje vysokou statistickou sebedůvěru."],
  choices:[
   {label:"Rozebrat metodiku veřejně",detail:"Můžeš dokázat, že čísla nesedí. Nejprve musí publikum přežít metodiku.",check:{attr:"intellect",dc:13},tags:["transparent","public"],success:makeOutcome("Daniela zjistí, že agenturu vlastní Věčného synovec. Průzkum se stane vtipem.",{trust:7,press:8,support:5,oldguard:-5},["transparent","public"]),fail:makeOutcome("Vaše vysvětlení vzorkování má devět minut. Lidé si zapamatují jen číslo 14.",{support:-3,trust:1},["transparent"])},
   {label:"Objednat vlastní ještě lepší průzkum",detail:"Věda skončila, začíná soutěž zadavatelů.",check:{attr:"cunning",dc:12},tags:["lie","power"],success:makeOutcome("Váš průzkum ukáže 48 procent. Obec nyní věří průměru obou lží.",{support:6,funds:-4,integrity:-7,heat:4},["lie","power"]),fail:makeOutcome("Agentura omylem pošle fakturu i zadání Daniele.",{support:-6,press:-8,integrity:-8,heat:9,funds:-4},["lie"])}
  ],ignored:()=>{effect({support:-5,oldguard:5});addNews("Neověřený průzkum ovládl hospodu. Metodika sedí u Věčného stolu.","bad")}
 },
 celebrityEndorsement:{
  id:"celebrityEndorsement",location:"pitch",title:"Celebrita přijela do špatné obce",emoji:"🎸",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Na hřiště dorazí zpěvák Bohuš Sláva, známý hitem z roku 1998 a aktuálními dluhy. Myslí si, že má podpořit vás. Jeho manažer tvrdí, že objednávka zněla Vejprnice."],
  choices:[
   {label:"Nechat ho vystoupit",detail:"Písně jsou staré, publikum také a faktura čerstvá.",check:{attr:"charisma",dc:12},tags:["public","contract"],success:makeOutcome("Koncert přitáhne dav. Bohuš vaše jméno vysloví správně na třetí pokus.",{support:9,citizens:5,funds:-4},["public","contract"]),fail:makeOutcome("Zpěvák zakončí slovy Volte Vladimíra. Manažer odmítne vrátit zálohu.",{support:-6,funds:-5,oldguard:4},["public","contract"])},
   {label:"Odhalit omyl a udělat si z něj legraci",detail:"Méně hvězdné, více věrohodné.",check:{attr:"resilience",dc:11},tags:["transparent","public"],success:makeOutcome("Upřímnost pobaví obec. Bohuš zahraje zdarma, protože už stejně vybalil aparaturu.",{trust:6,support:6,integrity:5},["transparent","public"]),fail:makeOutcome("Vtip urazí zpěváka i tři jeho fanoušky, kteří hlasují velmi disciplinovaně.",{support:-2,citizens:-2},["public"])}
  ],ignored:()=>{effect({support:-3,oldguard:3});addNews("Bohuš Sláva vystoupil pro Věčného. Starosta znal refrén i objednavatele.","bad")}
 },
 potholeSinkhole:{
  id:"potholeSinkhole",location:"townhall",title:"Výmol spolkl služební vůz",emoji:"🕳️",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Před úřadem se propadne vozovka a pohltí část služební fabie. Věčný tvrdí, že díra vznikla až pod tlakem vaší kampaně."],
  choices:[
   {label:"Zajistit místo a zveřejnit staré posudky",detail:"Díra je geologická, dokumenty politické.",check:{attr:"intellect",dc:12},tags:["transparent","legal"],success:makeOutcome("Posudek varoval před havárií tři roky. Věčný vysvětluje, proč tehdy investoval do fontány.",{trust:8,support:6,oldguard:-7,officials:5},["transparent","legal"]),fail:makeOutcome("Posudek má chybějící přílohu. Díra zůstává jasnější než odpovědnost.",{trust:2,heat:3},["legal"])},
   {label:"Spustit sbírku Zachraňme fabii",detail:"Katastrofa jako komunitní produkt.",check:{attr:"charisma",dc:11},tags:["public","gray"],success:makeOutcome("Lidé vytáhnou auto, vy podporu a místní hasič nové profilové foto.",{support:8,citizens:7,funds:2},["public"]),fail:makeOutcome("Sbírka vybere 640 korun a tři nabídky na odkup náhradních dílů.",{support:1,heat:2},["public"])}
  ],ignored:()=>{effect({support:-4,trust:-3});addNews("Věčný nechal výmol zasypat štěrkem a přestřihl pásku.","bad")}
 },
 mysteryDonation:{
  id:"mysteryDonation",location:"hq",title:"Dar od společnosti Neznámý občan s.r.o.",emoji:"💸",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Na účet kampaně přijde 80 tisíc korun od firmy založené včera. Jednatel má stejné příjmení jako Holubova účetní a stejný smysl pro transparentnost."],
  choices:[
   {label:"Dar okamžitě vrátit",detail:"Peníze odejdou, otázky možná také.",check:{attr:"resilience",dc:10},tags:["ethical","transparent"],success:makeOutcome("Dar vrátíte a zveřejníte. Daniela napíše krátkou zprávu bez otazníku.",{trust:7,integrity:8,funds:-1,heat:-5,press:4},["ethical","transparent"]),fail:makeOutcome("Banka vrácení zdrží. Tři dny vypadáte jako člověk, který čestně drží cizí peníze.",{trust:3,integrity:5,heat:4},["ethical","transparent"])},
   {label:"Ponechat si ho a rozdělit na menší dary",detail:"Velký problém se změní v osm malých občanů.",check:{attr:"cunning",dc:15},tags:["corrupt","legal"],success:makeOutcome("Účetnictví vypadá lidsky. Bohumil se však začne ptát, proč má osm dárců stejný variabilní symbol.",{funds:12,integrity:-13,heat:8,leverage:3},["corrupt","legal"]),fail:makeOutcome("Jeden z dárců je šestileté dítě. Daniela získá nejlepší titulek kampaně.",{funds:7,integrity:-14,heat:18,trust:-9,press:-8},["corrupt","legal"])}
  ],ignored:()=>{effect({heat:8,trust:-4});addNews("Nevysvětlený dar zůstal na účtu. Vysvětlení přislíbeno po volbách.","bad")}
 },
 hailstorm:{
  id:"hailstorm",location:"meadow",title:"Kroupy proti všem programům",emoji:"🌨️",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Kroupy zničí část úrody, plakáty i Holubovu vizualizaci logistického parku. Zemědělci chtějí pomoc, aktivisté oslavu a pojišťovna fotografii před bouřkou."],
  choices:[
   {label:"Organizovat pomoc zemědělcům",detail:"Bez loga kampaně, pokud to dokážete vydržet.",check:{attr:"authority",dc:12},tags:["ethical","public","jzdDeal"],success:makeOutcome("Dobrovolníci zachrání část úrody. Brázda poprvé poděkuje bez dodatku.",{jzd:10,citizens:7,trust:6,support:5,funds:-3},["ethical","public"]),fail:makeOutcome("Pomoc se zpozdí a Brázda tvrdí, že město nerozumí krupobití. Jste z vesnice.",{jzd:-4,support:-2,funds:-2},["public"])},
   {label:"Vyhlásit mimořádný dotační program",detail:"Kroupy roztají dřív než formulář, ale program bude mít logo.",check:{attr:"intellect",dc:14},tags:["legal","power"],success:makeOutcome("Najdete rezervu a vytvoříte pomoc, kterou lze skutečně čerpat. Dotační mágové tleskají.",{jzd:7,influence:7,trust:5,funds:-5},["legal","power"]),fail:makeOutcome("Program vyžaduje fotografii nepoškozené plodiny po škodě. Nikdo nesplní podmínky.",{jzd:-6,trust:-4,heat:4},["legal"])}
  ],ignored:()=>{effect({jzd:-7,support:-3});addNews("Kroupy zničily úrodu. Věčný slíbil jednání s počasím.","bad")}
 },
 weddingRally:{
  id:"weddingRally",location:"pub",title:"Svatba obsadila váš mítink",emoji:"💍",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Hospodu jste rezervoval pro mítink. Stejný sál si před rokem rezervovali Novákovi na svatbu. Hosté už tančí a ženich je Věčného synovec."],
  choices:[
   {label:"Přenechat sál a pogratulovat",detail:"Ztratíte mítink, získáte lidskost a možná řízek.",check:{attr:"charisma",dc:10},tags:["ethical","public"],success:makeOutcome("Novomanželé vás pozvou na fotografii. Věčného rodina se směje méně než zbytek sálu.",{trust:7,support:6,citizens:6,integrity:5},["ethical","public"]),fail:makeOutcome("Proslov je příliš politický. Nevěsta vás požádá, abyste opustil vlastní mítink.",{support:-3,trust:-2},["public"])},
   {label:"Spojit svatbu s mítinkem",detail:"Koaliční svazek dvou akcí bez souhlasu menšího partnera.",check:{attr:"cunning",dc:13},tags:["power","public"],success:makeOutcome("Kapela hraje váš slogan a hosté dostanou leták místo výslužky.",{support:8,citizens:3,integrity:-4,heat:3},["power","public"]),fail:makeOutcome("Ženich vás vyvede během polky. Video získá titul KANDIDÁT NEUSTÁL KOALICI.",{support:-7,heat:6},["power","public"])}
  ],ignored:()=>{effect({support:-2,oldguard:3});addNews("Věčný pronesl na svatbě přípitek a získal tři rodiny.","bad")}
 },
 regionalInspector:{
  id:"regionalInspector",location:"school",title:"Kontrola z kraje přijela bez ohlášení",emoji:"🧪",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Krajská hygienička vstoupí do školy právě ve chvíli, kdy kuchařka přelévá vodu z cisterny do hrnce označeného pitná asi. Má formulář a výraz člověka, který formulář použije."],
  choices:[
   {label:"Předložit všechno a přijmout opatření",detail:"Kontrola bolí méně než epidemie a více než tisková zpráva.",check:{attr:"resilience",dc:13},tags:["transparent","legal","children"],success:makeOutcome("Kontrola ocení spolupráci a nechá školu otevřenou s omezením. Marie vám věří o něco víc.",{trust:7,integrity:8,officials:6,heat:-4},["transparent","legal","children"]),fail:makeOutcome("Chybí jeden protokol a dvě teploty. Škola dostane pokutu, ne zákaz.",{funds:-4,trust:2,integrity:5,heat:4},["legal","children"])},
   {label:"Zdržet kontrolu kulturním programem",detail:"Děti zazpívají, než Bohumil najde správné razítko.",check:{attr:"cunning",dc:14},tags:["gray","children","power"],success:makeOutcome("Kontrola změkne po vystoupení sboru. Dokumenty se mezitím administrativně narodí.",{officials:4,support:4,integrity:-4,heat:1},["children","power"]),fail:makeOutcome("Děti zazpívají píseň Teče voda, teče. Hygienička si zapíše i ironii.",{trust:-4,heat:8,integrity:-5},["children","power"])}
  ],ignored:()=>{effect({funds:-5,trust:-5,heat:7});addNews("Krajská kontrola udělila škole pokutu. Věčný slíbil odvolání proti bakterii.","bad")}
 },
 missingCandidate:{
  id:"missingCandidate",location:"pub",title:"Věčný se na šest hodin ztratil",emoji:"🧭",kicker:"NEČEKANÁ UDÁLOST",queued:true,surprise:true,
  text:()=>["Starosta Věčný nedorazí na dva mítinky ani domů. Obcí se šíří, že utekl, byl unesen nebo odjel pro levnější pivo. Jeho tým žádá diskrétnost."],
  choices:[
   {label:"Pomoci ho hledat bez kampaně",detail:"Soupeř je pořád člověk. Bohužel také soupeř.",check:{attr:"resilience",dc:11},tags:["ethical","public"],success:makeOutcome("Najdete ho spícího v myslivecké chatě. Poděkuje vám soukromě a veřejně řekne, že situaci zvládl.",{trust:8,integrity:8,oldguard:3,leverage:3},["ethical","public"]),fail:makeOutcome("Hledání trvá celý večer. Věčný se mezitím vrátí taxíkem a tvrdí, že kontroloval okrajové části obce.",{support:-2,trust:2,integrity:5},["ethical"])},
   {label:"Využít prázdný prostor a svolat mítink",detail:"Demokracie nesnáší vakuum. Kampaň ho miluje.",check:{attr:"charisma",dc:12},tags:["power","public"],success:makeOutcome("Zaplníte náves a získáte den bez protiútoku. Věčný se vrátí přesně na fotografování.",{support:10,oldguard:-4,influence:4,integrity:-5},["power","public"]),fail:makeOutcome("Věčný se objeví uprostřed vašeho projevu a nechá se přivítat jako navrátivší státník.",{support:-5,oldguard:6,integrity:-3},["power","public"])}
  ],ignored:()=>{effect({oldguard:5,support:-2});addNews("Věčný se vrátil a své zmizení označil za terénní práci.","bad")}
 }
,
 mariePersonal:{id:"mariePersonal",location:"school",title:"Děti nejsou billboard",emoji:"🎒",kicker:"OSOBNÍ QUEST DRUŽINY",available:()=>companionQuestAvailable("marie"),text:()=>["Marie zjistila, že Věčný rozdává dětem sešity se svou fotografií. Zároveň po vás chce veřejný slib, že školu nebudete používat jako kulisu kampaně.","Pokud jí vyhovíte, přijdete o snadný symbol. Pokud ne, možná přijdete o Marii."],choices:[
 {label:"Podepsat pravidlo: děti mimo kampaň",detail:"Žádné fotky při výuce, žádné dětské hlasy v reklamě.",check:{attr:"resilience",dc:12},tags:["ethical","children","transparent"],success:makeOutcome("Marie mobilizuje rodiče právě proto, že jste jejich děti nepoužil.",{trust:8,support:5,citizens:7},["ethical","children"],()=>{unlockCompanionPerk("marie","Rodičovská mobilizace");adjustVoter("parents",10,.03)}),fail:makeOutcome("Pravidlo podepíšete, ale dobrovolníci už mají natočený spot. Marie zůstává, neodpouští.",{trust:3,heat:4},["ethical"],()=>{unlockCompanionPerk("marie","Rodičovská mobilizace");shiftLoyalty("marie",-8)})},
 {label:"Udělat ze školy symbol kampaně",detail:"Děti nic neříkají. Jen stojí za vámi ve správném světle.",check:{attr:"charisma",dc:13},tags:["public","lie","children"],success:makeOutcome("Spot funguje. Marie odchází z natáčení a rodiče se rozdělí přesně podle algoritmu.",{support:9,trust:-5,heat:5},["public","lie"],()=>{shiftLoyalty("marie",-22);unlockCompanionPerk("marie","Krizová rodičovská linka")}),fail:makeOutcome("Jedno dítě se do kamery zeptá, proč jste střechu neopravili dřív. Video má desetkrát větší dosah než spot.",{support:-6,trust:-7,heat:9},["lie"],()=>shiftLoyalty("marie",-28))}
 ]},
 danielaPersonal:{id:"danielaPersonal",location:"paper",title:"Článek, který poškodí každého",emoji:"📝",kicker:"OSOBNÍ QUEST DRUŽINY",available:()=>companionQuestAvailable("daniela"),text:()=>["Daniela má článek propojující Holuba, JZD a Věčného. Několik odstavců se nepříjemně dotýká také vašich schůzek.","Chce vědět, zda jí dáte plné dokumenty, nebo zda se z ní má stát další tiskové oddělení."],choices:[
 {label:"Dát jí všechno bez podmínek",detail:"Pravda zasáhne soupeře, spojence i vás.",check:{attr:"resilience",dc:14},tags:["ethical","transparent","press"],success:makeOutcome("Článek rozbije první část sítě a Daniela vám začne věřit jako zdroji, nikoli majiteli média.",{trust:10,press:12,heat:5,oldguard:-8,business:-6},["ethical","transparent"],()=>{unlockCompanionPerk("daniela","Ověření kompromatu");addConspiracyClue("archive","Daniela ověřila vlastnické vazby.")}),fail:makeOutcome("Článek vyjde, ale vaše jméno v něm dostane větší mezititulek, než jste čekal.",{trust:3,press:7,heat:12,support:-4},["transparent"],()=>unlockCompanionPerk("daniela","Ověření kompromatu"))},
 {label:"Dodat jen materiály proti Věčnému",detail:"Investigace s redakčním zadáním a předem vybraným padouchem.",check:{attr:"cunning",dc:13},tags:["power","lie","press"],success:makeOutcome("Věčný krvácí v titulku. Daniela si nechává kopii vynechaných stran.",{support:9,oldguard:-12,leverage:6,integrity:-7},["power","lie"],()=>{unlockCompanionPerk("daniela","Selektivní únik");shiftLoyalty("daniela",-12)}),fail:makeOutcome("Daniela porovná dodané materiály s archivem a zveřejní také způsob, jakým jste příběh krátil.",{heat:15,trust:-9,press:-7},["lie"],()=>shiftLoyalty("daniela",-24))}
 ]},
 brazdaPersonal:{id:"brazdaPersonal",location:"jzd",title:"Syn, nádrž a rodinná čest",emoji:"🛢️",kicker:"OSOBNÍ QUEST DRUŽINY",available:()=>companionQuestAvailable("brazda"),text:()=>["Brázda chce, abyste veřejně prohlásil Radovanovu kauzu za útok na celé zemědělství. Na oplátku dá k dispozici traktory, lidi a halu.","Poprvé nejedná předseda JZD. Jedná otec, který je zvyklý, že obě role rozhodují stejně."],choices:[
 {label:"Přinutit Radovana škodu zaplatit",detail:"Brázda zachová tvář, obec dostane peníze a rodina důvod k pomstě.",check:{attr:"authority",dc:14},tags:["legal","jzdDeal","power"],success:makeOutcome("Radovan podepíše náhradu škody. Brázda vás respektuje, protože jste ho veřejně neponížil.",{trust:6,jzd:7,influence:6},["legal","power"],()=>{unlockCompanionPerk("brazda","Traktorová logistika");changePlan("jzd",-10,"Radovanova dohoda rozbila část mobilizačního plánu.")}),fail:makeOutcome("Radovan odmítne a Brázda začne vozit voliče Věčnému.",{jzd:-8,oldguard:6,support:-3},["power"],()=>{shiftLoyalty("brazda",-18);changePlan("jzd",9,"Rodina se semkla proti kandidátovi.")})},
 {label:"Krýt rodinu výměnou za úplnou mobilizaci",detail:"Třicet voličů, čtyři traktory a jeden budoucí předseda výboru.",check:{attr:"cunning",dc:12},tags:["corrupt","jzdDeal","power"],success:makeOutcome("JZD se stane vaší terénní armádou. Brázda si do kalendáře píše povolební schůzku.",{support:10,funds:6,jzd:15,integrity:-13,heat:7},["corrupt","jzdDeal"],()=>{unlockCompanionPerk("brazda","Traktorová logistika");addCommitment({title:"Předat Brázdovi zemědělský výbor",creditor:"Brázda",due:13,notes:"Rodinná ochrana Radovana"});state.conspiracy.joined=true}),fail:makeOutcome("Radovan si dohodu nahraje. Rodina vás podpoří, ale vlastní kopii kampaně máte už i na cizím telefonu.",{support:5,jzd:7,heat:13,leverage:-3,integrity:-10},["corrupt"],()=>schedule("leakedTape"))}
 ]},
 bohumilPersonal:{id:"bohumilPersonal",location:"townhall",title:"Úředník chce beztrestnost",emoji:"📎",kicker:"OSOBNÍ QUEST DRUŽINY",available:()=>companionQuestAvailable("bohumil"),text:()=>["Bohumil má kopie smluv ze tří volebních období. Chce písemný slib, že po volbách nepřijde čistka a že nebude obětován jako technický pracovník systému.","Za bezpečí nabízí celý procesní mozek radnice."],choices:[
 {label:"Garantovat ochranu whistleblowera",detail:"Ochráníte ho, i kdyby dokumenty poškodily vaše lidi.",check:{attr:"intellect",dc:13},tags:["ethical","legal","transparent"],success:makeOutcome("Bohumil otevře druhou část archivu a naučí vás, kde se v předpisu skrývá čas.",{officials:12,trust:6,leverage:5},["ethical","legal"],()=>{unlockCompanionPerk("bohumil","Procesní odklad");addConspiracyClue("archive")}),fail:makeOutcome("Slib je právně nepřesný. Bohumil zůstává, ale nejcitlivější složku vrací do stropu.",{officials:4,trust:2},["legal"],()=>unlockCompanionPerk("bohumil","Procesní odklad"))},
 {label:"Připomenout mu, že je také podepsaný",detail:"Loajalita vytvořená vzájemným strachem je pořád loajalita.",check:{attr:"authority",dc:12},tags:["power","corrupt"],success:makeOutcome("Bohumil spolupracuje dokonale a od této chvíle si ukládá každou vaši větu.",{influence:8,officials:7,leverage:8,integrity:-9},["power","corrupt"],()=>{unlockCompanionPerk("bohumil","Chybějící příloha");shiftLoyalty("bohumil",-15)}),fail:makeOutcome("Bohumil pošle zálohu archivu Daniele a požádá o dovolenou.",{heat:12,officials:-7,press:5,leverage:-4},["corrupt"],()=>shiftLoyalty("bohumil",-30))}
 ]},
 holubPersonal:{id:"holubPersonal",location:"meadow",title:"Podíl na budoucnosti obce",emoji:"🏗️",kicker:"OSOBNÍ QUEST DRUŽINY",available:()=>companionQuestAvailable("holub"),text:()=>["Holub ukáže vizualizaci logistického areálu. Na střeše jsou stromy, pod stromy sklady a ve smlouvě poradenský podíl pro člověka, kterého můžete doporučit.","Neptá se, zda projekt podpoříte. Ptá se, jaký podíl na budoucnosti obce považujete za důstojný."],choices:[
 {label:"Vynutit veřejné přínosy a otevřené financování",detail:"Školka, obchvat a smlouva bez skrytého poradce.",check:{attr:"intellect",dc:15},tags:["legal","transparent","contract"],success:makeOutcome("Holub ustoupí, protože potřebuje povolení víc než tajemství. Projekt zůstává sporný, ale dohledatelný.",{business:5,citizens:5,trust:8,funds:4},["legal","transparent"],()=>{unlockCompanionPerk("holub","Krizová úvěrová linka");changePlan("business",-10,"Veřejné podmínky zpomalily Projekt SILO.")}),fail:makeOutcome("Holub souhlasí ústně. Písemně pošle stejnou smlouvu s jiným názvem přílohy.",{business:6,heat:6,trust:-2},["legal"],()=>unlockCompanionPerk("holub","Krizová úvěrová linka"))},
 {label:"Vzít skrytý podíl a převzít síť",detail:"Nechcete Projekt SILO zastavit. Chcete sedět v jeho řídicím výboru.",check:{attr:"cunning",dc:14},tags:["corrupt","contract","power"],success:makeOutcome("Holub vás přestane považovat za kandidáta a začne vás považovat za partnera.",{funds:14,influence:12,business:15,integrity:-18,heat:9},["corrupt","contract"],()=>{unlockCompanionPerk("holub","Tichá úvěrová linka");state.conspiracy.joined=true;state.conspiracy.revealed=true;changePlan("business",15,"Kandidát vstoupil do řídicí vrstvy Projektu SILO.")}),fail:makeOutcome("Holub pochopí, že chcete podíl bez kapitálu. Nabídne vám místo poradce po volbách.",{funds:5,business:5,integrity:-10,heat:10},["corrupt"],()=>addCommitment({title:"Po volbách sloužit jako poradce Projektu SILO",creditor:"Holub",due:13}))}
 ]},
 siloPattern:{id:"siloPattern",location:"paper",title:"Čtyři kauzy, stejné logo v zápatí",emoji:"🕸️",kicker:"HLAVNÍ KAUZA",queued:true,text:()=>["Daniela a Bohumil položí vedle sebe faktury za školu, geodetické práce a poradenskou smlouvu JZD. V zápatí všech dokumentů je stejné nenápadné logo: SILO Development.","Jednotlivé kauzy možná nejsou jednotlivé."],choices:[
 {label:"Založit společný vyšetřovací spis",detail:"Sbírat další důkazy a zatím nic nezveřejnit.",check:{attr:"intellect",dc:13},tags:["legal","transparent"],success:makeOutcome("Vzniká mapa firem, osob a protislužeb. Poprvé vidíte obrys celého mechanismu.",{leverage:7,press:5,heat:2},["legal","transparent"],()=>{state.conspiracy.stage=Math.max(1,state.conspiracy.stage);revealPlan("business")}),fail:makeOutcome("Některé dokumenty nesedí. Síť existuje, ale zatím by ji soud označil za grafickou tvorbu.",{leverage:3,heat:4},["legal"])},
 {label:"Okamžitě zveřejnit podezření",detail:"Málo důkazů, velký titulek a žádný čas na obranu soupeře.",check:{attr:"charisma",dc:14},tags:["public","power","press"],success:makeOutcome("Věčný i Holub vysvětlují stejné logo každý jinak. To veřejnosti stačí.",{support:9,oldguard:-7,business:-7,heat:8},["public","power"],()=>state.conspiracy.stage=Math.max(1,state.conspiracy.stage)),fail:makeOutcome("Holub hrozí žalobou a Věčný vás označí za výrobce konspiračních nástěnek.",{support:-5,heat:13,trust:-5},["power"]) }
 ]},
 siloLedger:{id:"siloLedger",location:"jzd",title:"Účetní kniha bez účetnictví",emoji:"📒",kicker:"HLAVNÍ KAUZA",queued:true,text:()=>["V zásuvce staré váhy najdete sešit s platbami za naftu, autobus, geodeta a předvolební tisk. Částky sedí na faktury Projektu SILO.","Sešit může síť zničit. Také ji může předat novému majiteli."],choices:[
 {label:"Zabezpečit originál a kopie",detail:"Daniela, policie a notář dostanou každá jednu verzi.",check:{attr:"resilience",dc:14},tags:["ethical","police","transparent"],success:makeOutcome("Důkaz už nelze ztratit jediným telefonátem. Projekt SILO se poprvé bojí vás.",{leverage:12,trust:8,heat:4,jzd:-6,business:-8},["ethical","police"],()=>{state.conspiracy.stage=2;changePlan("business",-15,"Účetní stopa narušila financování projektu.");changePlan("jzd",-12,"Družstevní účetní kniha byla zajištěna.")}),fail:makeOutcome("Jedna kopie unikne dřív než originál dorazí k notáři. Síť začne čistit další stopy.",{leverage:6,heat:12},["police"],()=>{state.conspiracy.stage=2;changePlan("business",8,"Síť začala krizové zakrývání stop.")})},
 {label:"Použít knihu k převzetí sítě",detail:"Nezveřejnit ji. Jen změnit, komu budou lidé volat.",check:{attr:"cunning",dc:15},tags:["corrupt","power","contract"],success:makeOutcome("Brázda a Holub přijmou nové rozdělení moci. Věčný zatím netuší, že jeho systém změnil správce.",{influence:16,funds:8,leverage:14,integrity:-18},["corrupt","power"],()=>{state.conspiracy.joined=true;state.conspiracy.stage=2;changePlan("business",12,"Síť dostala nového politického správce.")}),fail:makeOutcome("Holub pozná, že knihu máte, a nabídne lepší podmínky Věčnému.",{heat:15,leverage:3,oldguard:7,business:8},["corrupt"],()=>changePlan("oldguard",9,"Věčný dostal varování před převzetím sítě."))}
 ],after:()=>{if(!state.flags.siloFinalQueued){schedule(state.conspiracy.joined?"siloOffer":"siloConfrontation",4);state.flags.siloFinalQueued=true;addNews("Účetní kniha otevřela závěrečnou fázi Operace SILO.","bad")}}},
 siloConfrontation:{id:"siloConfrontation",location:"townhall",title:"Operace SILO: veřejné rozkrytí",emoji:"🏭",kicker:"HLAVNÍ BOSSFIGHT",queued:true,text:()=>["Máte dost stop, abyste propojil naftu, školu, louku, JZD a Věčného. V sále sedí občané, novináři, Holubovi právníci a lidé, kteří tvrdí, že stejné logo je náhoda.","Způsob, jakým kauzu uzavřete, určí nejen volby, ale i to, jaký systém po nich zůstane."],choices:[
 {label:"Zveřejnit celý spis bez výjimek",detail:"Padnou soupeři, spojenci a možná i část vaší kampaně.",check:{attr:"resilience",dc:16},tags:["ethical","transparent","public"],success:makeOutcome("Síť se rozpadá v přímém přenosu. Věčný ztrácí jistotu, Holub telefon a Brázda několik přátel.",{trust:15,support:12,oldguard:-20,business:-18,jzd:-12,heat:6,integrity:12},["ethical","transparent"],()=>{state.conspiracy.exposed=true;state.conspiracy.resolved=true;changePlan("oldguard",-30,"Operace SILO byla zveřejněna.");changePlan("business",-35,"Projekt ztratil politické krytí.")}),fail:makeOutcome("Spis je pravdivý, ale příliš rozsáhlý. Média z něj vyberou dvě vaše schůzky a jeden špatný podpis.",{trust:3,support:2,heat:18,oldguard:-8,business:-8},["transparent"],()=>{state.conspiracy.exposed=true;state.conspiracy.resolved=true})},
 {label:"Nabídnout síti amnestii za veřejné ústupky",detail:"Louka zůstane, škola se opraví a nikdo nepůjde sedět před volbami.",check:{attr:"authority",dc:15},tags:["legal","gray","power"],success:makeOutcome("Síť přežije, ale pod novými pravidly a veřejnými smlouvami. Každý tvrdí, že právě toto chtěl od začátku.",{support:8,trust:6,influence:12,business:3,jzd:3,integrity:-3},["legal","power"],()=>{state.conspiracy.resolved=true;state.flags.siloSettlement=true;changePlan("business",-12,"Síť přijala veřejné podmínky.")}),fail:makeOutcome("Holub vezme ústupky, Věčný popře dohodu a vy zůstanete jediný, kdo ji musí vysvětlovat.",{trust:-8,heat:14,business:7,oldguard:6},["gray"],()=>state.conspiracy.resolved=true)}
 ]},
 siloOffer:{id:"siloOffer",location:"meadow",title:"Operace SILO: místo u stolu",emoji:"🥂",kicker:"HLAVNÍ BOSSFIGHT",queued:true,text:()=>["Holub, Brázda a Věčný se setkají v zadním salonku. Na stole leží rozdělení zakázek, funkcí a pozemků. Jedna židle je prázdná.","Síť pochopila, že ji nechcete zničit. Chce vědět, zda ji dokážete řídit."],choices:[
 {label:"Převzít síť a odstranit Věčného",detail:"Projekt pokračuje. Pouze se mění politický vlastník.",check:{attr:"cunning",dc:16},tags:["corrupt","power","contract"],success:makeOutcome("Věčný zjistí, že jeho spojenci už podepsali budoucnost bez něj. Vy získáváte obec dřív než hlasy.",{influence:20,funds:14,leverage:16,oldguard:-15,business:14,jzd:12,integrity:-25,heat:10},["corrupt","power"],()=>{state.conspiracy.joined=true;state.conspiracy.resolved=true;state.flags.siloBoss=true}),fail:makeOutcome("Věčný vás nechá mluvit a pak ukáže nahrávku celé nabídky. Síť zůstává jeho, problém váš.",{heat:25,trust:-15,oldguard:12,leverage:-5},["corrupt"],()=>state.conspiracy.resolved=true)},
 {label:"Nahrát schůzku a na poslední chvíli přeběhnout",detail:"Zrada s morálním vysvětlením a technickým zabezpečením.",check:{attr:"cunning",dc:17},tags:["transparent","lie","power"],success:makeOutcome("Nahrávka rozbije síť a zároveň ukáže, jak blízko jste seděl. Veřejnost odpouští výsledek, ne metodu.",{support:10,trust:4,heat:12,oldguard:-20,business:-18,jzd:-10,integrity:-2},["transparent","power"],()=>{state.conspiracy.exposed=true;state.conspiracy.resolved=true}),fail:makeOutcome("Telefon přestane nahrávat při větě, která by vás zachránila. Zůstane jen část, kde žádáte lepší podíl.",{heat:28,trust:-18,integrity:-12},["lie"],()=>state.conspiracy.resolved=true)}
 ]},
 planOldguardBus:{id:"planOldguardBus",location:"pub",title:"Autobus tradičních hodnot",emoji:"🚌",kicker:"TAH FRAKCE",queued:true,text:()=>["Věčný objednal autobus pro seniory. Oficiálně na výlet k přehradě, prakticky přes jeho mítink a volební místnost."],choices:[{label:"Nabídnout vlastní dopravu bez agitace",detail:"Drahé a méně vděčné.",check:{attr:"authority",dc:12},tags:["ethical","public"],success:makeOutcome("Senioři oceňují dopravu a část z nich dokonce program.",{trust:5,support:5,oldguard:-4},["ethical"],()=>{adjustVoter("seniors",9,.03);changePlan("oldguard",-7)}),fail:makeOutcome("Váš mikrobus přijede pozdě. Věčný už rozdává řízky.",{support:-3,oldguard:5},["public"])},{label:"Zpochybnit financování autobusu",detail:"Kontrola místo řízku.",check:{attr:"intellect",dc:13},tags:["legal","press"],success:makeOutcome("Fakturu platila obecní firma bez smlouvy. Výlet se mění v kauzu.",{heat:3,oldguard:-8,press:5},["legal"],()=>changePlan("oldguard",-10)),fail:makeOutcome("Faktura je formálně čistá a vy vypadáte jako člověk bojující proti výletům seniorů.",{support:-5,oldguard:5},["legal"])}]},
 planOldguardCommission:{id:"planOldguardCommission",location:"townhall",title:"Volební komise se uzavírá",emoji:"🔐",kicker:"TAH FRAKCE",queued:true,text:()=>["Věčný dosadil do komise své lidi a přesunul školení na dobu, kdy má vaše zmocněnkyně směnu."],choices:[{label:"Vynutit náhradní termín",detail:"Procesní souboj o obyčejnou židli.",check:{attr:"intellect",dc:14},tags:["legal","transparent"],success:makeOutcome("Komise zůstane smíšená a Věčný ztratí jednu pojistku.",{officials:7,trust:4},["legal"],()=>changePlan("oldguard",-12)),fail:makeOutcome("Termín zůstane. Bohumil tvrdí, že náhoda má razítko.",{officials:-5,oldguard:7},["legal"])},{label:"Koupit loajalitu jednoho člena",detail:"Kontrola systému pomocí člověka uvnitř.",check:{attr:"cunning",dc:12},tags:["corrupt","power"],success:makeOutcome("Máte člověka v komisi i nový závazek.",{influence:7,leverage:4,integrity:-7},["corrupt"],()=>{changePlan("oldguard",-5);addCommitment({title:"Odměnit člena volební komise",creditor:"Komise",due:13})}),fail:makeOutcome("Člen komise nabídku přepošle Věčnému.",{heat:12,oldguard:8,integrity:-7},["corrupt"])}]},
 planOldguardPact:{id:"planOldguardPact",location:"pub",title:"Pakt malých kandidátek",emoji:"🤝",kicker:"TAH FRAKCE",queued:true,text:()=>["Věčný slibuje dvěma malým kandidátkám místa v radě, pokud po volbách podpoří jeho návrat."],choices:[{label:"Rozbít pakt veřejnou debatou",detail:"Donutit kandidáty říct před volbami, koho podpoří.",check:{attr:"charisma",dc:15},tags:["public","transparent"],success:makeOutcome("Jedna kandidátka od dohody odstoupí. Druhá tvrdí, že žádná dohoda nebyla.",{support:6,trust:6,oldguard:-10},["public"],()=>changePlan("oldguard",-15)),fail:makeOutcome("Kandidáti odmítnou ultimátum a spojí se proti vaší aroganci.",{oldguard:10,support:-5},["public"])},{label:"Nabídnout lepší funkce",detail:"Zásady se neprodávají. Pouze se nominují.",check:{attr:"authority",dc:14},tags:["power","corrupt"],success:makeOutcome("Pakt mění majitele. Povolební rada už má více míst než židlí.",{influence:12,oldguard:-6,integrity:-10},["power"],()=>{changePlan("oldguard",-8);state.flags.coalitionPact=true}),fail:makeOutcome("Obě nabídky se dostanou do stejné skupiny na telefonu.",{heat:14,trust:-8,oldguard:6},["corrupt"])}]},
 planOldguardCouncil:{id:"planOldguardCouncil",location:"townhall",title:"Rada připravená před volbami",emoji:"🪑",kicker:"TAH FRAKCE",queued:true,text:()=>["Věčný už rozděluje funkce v radě, přestože hlasy ještě nejsou sečteny. Někteří vaši podporovatelé dostali také nabídku."],choices:[{label:"Požadovat veřejné závazky kandidátů",detail:"Kdo chce přeběhnout, musí to říct před volbami.",check:{attr:"authority",dc:15},tags:["transparent","public"],success:makeOutcome("Dva kandidáti Věčného pakt popřou tak přesvědčivě, až z něj odejdou.",{trust:7,oldguard:-14,influence:5},["transparent"],()=>changePlan("oldguard",-18)),fail:makeOutcome("Vaše výzva odhalí, že i jeden váš člověk jednal o místostarostovi.",{trust:-7,oldguard:8},["public"])},{label:"Nechat pakt běžet a sbírat jména",detail:"Prohrát den, získat seznam budoucích zrádců.",check:{attr:"cunning",dc:14},tags:["power","gray"],success:makeOutcome("Získáte seznam celé povolební dohody. Koalice je silná, ale vydíratelná.",{leverage:15,oldguard:4,influence:7},["power"],()=>addItem("coalitionList")),fail:makeOutcome("Seznam je falešný a Věčný sleduje, koho oslovíte.",{leverage:2,oldguard:10,heat:6},["gray"])}]},
 planJzdList:{id:"planJzdList",location:"jzd",title:"Seznam správných zaměstnanců",emoji:"📋",kicker:"TAH FRAKCE",queued:true,text:()=>["Mistři JZD obcházejí zaměstnance a zapisují, kdo přijde na mítink. Brázda tomu říká organizační anketa."],choices:[{label:"Oslovit zaměstnance mimo vedení",detail:"Schůzka po směně bez traktorů a vedoucích.",check:{attr:"charisma",dc:13},tags:["ethical","public"],success:makeOutcome("Část JZD zjistí, že hlasování je tajné i před předsedou.",{trust:5,jzd:-5,support:5},["ethical"],()=>{adjustVoter("jzdWorkers",8);changePlan("jzd",-9)}),fail:makeOutcome("Na schůzku přijde jen Brázdův zástupce a zapisuje si otázky.",{jzd:6,support:-2},["public"])},{label:"Převzít seznam a použít ho",detail:"Nátlak je problém, dokud necílí správným směrem.",check:{attr:"cunning",dc:12},tags:["corrupt","jzdDeal"],success:makeOutcome("Seznam se stane vaším terénním plánem. Zaměstnanci získají dvě doporučení místo jednoho.",{support:7,jzd:8,integrity:-8},["corrupt"],()=>changePlan("jzd",5)),fail:makeOutcome("Brázda vám předá starý seznam a nechá si nový.",{jzd:5,integrity:-5},["corrupt"])}]},
 planJzdCleanup:{id:"planJzdCleanup",location:"jzd",title:"Nádrž je najednou čistá",emoji:"🧽",kicker:"TAH FRAKCE",queued:true,text:()=>["JZD nechalo umýt nádrž, kameru i účetní počítač. Brázda tvrdí, že jde o pravidelnou hygienu před auditem."],choices:[{label:"Zajistit zbytky dat přes Bohumila",detail:"Účetní záloha má delší paměť než nádrž.",check:{attr:"intellect",dc:14},tags:["legal","police"],success:makeOutcome("Záloha obnoví platby i jména. Čištění stopy jen zvýraznilo.",{leverage:8,heat:3,jzd:-7},["legal"],()=>{addConspiracyClue("diesel");changePlan("jzd",-14)}),fail:makeOutcome("Záloha je přepsaná prezentací o udržitelném zemědělství.",{jzd:6,leverage:-2},["legal"])},{label:"Nabídnout klid výměnou za mobilizaci",detail:"Stopy zmizí, hlasy přijdou.",check:{attr:"cunning",dc:12},tags:["corrupt","jzdDeal"],success:makeOutcome("JZD dokončí úklid a začne vozit lidi pro vás.",{support:8,jzd:12,integrity:-10,heat:5},["corrupt"],()=>{state.conspiracy.joined=true;changePlan("jzd",8)}),fail:makeOutcome("Úklid dokončí, podporu slíbí oběma stranám.",{jzd:7,integrity:-7},["corrupt"])}]},
 planJzdConvoy:{id:"planJzdConvoy",location:"pitch",title:"Traktorová kolona",emoji:"🚜",kicker:"TAH FRAKCE",queued:true,text:()=>["JZD připravilo kolonu traktorů a autobusů. Směr jízdy bude určen podle toho, kdo Brázdovi naposledy volal."],choices:[{label:"Získat kolonu veřejným programem pro venkov",detail:"Žádné tajné funkce, jen konkrétní ceny nájmů a cest.",check:{attr:"charisma",dc:15},tags:["public","ethical"],success:makeOutcome("Část kolony jede k vám bez příkazu. Brázda poprvé nezvládne všechny traktory.",{support:9,jzd:-4,trust:5},["public"],()=>{adjustVoter("jzdWorkers",10,.04);changePlan("jzd",-12)}),fail:makeOutcome("Program má sedm bodů. Brázdova věta o ceně nafty má jeden.",{support:-4,jzd:7},["public"])},{label:"Zaplatit naftu a změnit trasu",detail:"Traktory mají ideologii odpovídající plné nádrži.",check:{attr:"cunning",dc:13},tags:["corrupt","jzdDeal"],success:makeOutcome("Kolona přijede na váš mítink. Fotografie zakryje způsob úhrady.",{support:11,funds:-4,jzd:12,integrity:-8},["corrupt"],()=>changePlan("jzd",6)),fail:makeOutcome("Zaplatíte naftu, ale Brázda pošle kolonu k Věčnému jako důkaz venkovské jednoty.",{funds:-4,support:-6,jzd:8},["corrupt"])}]},
 planJzdDemand:{id:"planJzdDemand",location:"jzd",title:"Výbor ještě před volbami",emoji:"🪑",kicker:"TAH FRAKCE",queued:true,text:()=>["Brázda chce písemný závazek, že zemědělský výbor, pozemky a obecní techniku dostane jeho blok."],choices:[{label:"Odmítnout a riskovat odchod JZD",detail:"Vyhrát bez nejorganizovanější skupiny v obci.",check:{attr:"resilience",dc:15},tags:["ethical","power"],success:makeOutcome("Část zaměstnanců Brázdu neposlechne. JZD přestává být jeden volební organismus.",{trust:8,jzd:-12,integrity:8},["ethical"],()=>changePlan("jzd",-20)),fail:makeOutcome("Brázda přechází k Věčnému a bere s sebou halu, autobusy i řízky.",{support:-8,jzd:-15,oldguard:8},["ethical"])},{label:"Podepsat závazek",detail:"Jedna funkce za organizovanou část obce.",check:{attr:"authority",dc:12},tags:["corrupt","jzdDeal","power"],success:makeOutcome("JZD se zaváže dodat hlasy. Brázda se zaváže připomenout smlouvu.",{support:10,jzd:15,influence:8,integrity:-12},["corrupt"],()=>addCommitment({title:"Předat JZD zemědělský výbor a techniku",creditor:"Brázda",due:13})),fail:makeOutcome("Závazek unikne mezi zaměstnance a část z nich odmítne být součástí balíku.",{jzd:-5,heat:10,integrity:-9},["corrupt"])}]},
 planBusinessSurvey:{id:"planBusinessSurvey",location:"meadow",title:"Geodeti za úsvitu",emoji:"📐",kicker:"TAH FRAKCE",queued:true,text:()=>["Na louce se objeví geodeti s dokumentem podepsaným ještě před vypsáním projektu. Holub tvrdí, že jen měří budoucnost."],choices:[{label:"Zastavit práce předběžným opatřením",detail:"Papír proti lidem s vestami a drahým autem.",check:{attr:"intellect",dc:13},tags:["legal","antiBusiness"],success:makeOutcome("Geodeti odjíždějí. Kolíky zůstávají jako pomník rychlé přípravy.",{citizens:6,business:-7,trust:4},["legal"],()=>changePlan("business",-10)),fail:makeOutcome("Dokument je formálně platný díky příloze, kterou nikdo neviděl.",{business:7,citizens:-4},["legal"])},{label:"Nechat měřit výměnou za dar",detail:"Měření přece ještě není stavba. Dar přece ještě není úplatek.",check:{attr:"cunning",dc:11},tags:["corrupt","contract"],success:makeOutcome("Geodeti pracují a transparentní účet dostane netransparentní podporu.",{funds:8,business:9,integrity:-8,heat:4},["corrupt"],()=>{state.conspiracy.joined=true;changePlan("business",8)}),fail:makeOutcome("Dar přijde se zprávou PRO LOUKU. Daniela si zprávu uloží.",{funds:4,heat:11,press:4,integrity:-7},["corrupt"])}]},
 planBusinessContract:{id:"planBusinessContract",location:"school",title:"Dodatek schovaný ve střeše",emoji:"📑",kicker:"TAH FRAKCE",queued:true,text:()=>["Holubův školní dodatek obsahuje poradenskou firmu, která současně připravuje louku a logistiku JZD."],choices:[{label:"Zveřejnit dodatek a zastavit platbu",detail:"Škola může čekat, síť ne.",check:{attr:"intellect",dc:14},tags:["transparent","legal"],success:makeOutcome("Dodatek se stane druhou stopou společné sítě.",{trust:7,business:-8,heat:4},["transparent"],()=>{addConspiracyClue("roof");changePlan("business",-12)}),fail:makeOutcome("Platbu zastavíte, ale Holub obviní kampaň z ohrožení školy.",{support:-5,business:5,heat:7},["legal"])},{label:"Podepsat a vzít kontrolu nad poradcem",detail:"Cena zůstane. Jen poradce bude váš člověk.",check:{attr:"cunning",dc:13},tags:["corrupt","contract","power"],success:makeOutcome("Síť přijme nového prostředníka a vaše kampaň novou fakturu.",{funds:7,influence:8,business:10,integrity:-11},["corrupt"],()=>{state.conspiracy.joined=true;changePlan("business",9)}),fail:makeOutcome("Poradce je Holubův člověk, který souhlasí jen na nahrávce.",{heat:12,business:6,integrity:-8},["corrupt"])}]},
 planBusinessNetwork:{id:"planBusinessNetwork",location:"jzd",title:"JZD má být logistický uzel",emoji:"🔗",kicker:"TAH FRAKCE",queued:true,text:()=>["Projekt SILO propojuje louku, sklad JZD, obecní cestu a školní zakázku jako kompenzaci. Všechny konflikty byly zřejmě součástí jedné nabídky."],choices:[{label:"Rozdělit projekt na veřejně kontrolované části",detail:"Zničit síť tím, že každá smlouva bude muset přežít samostatně.",check:{attr:"intellect",dc:15},tags:["legal","transparent"],success:makeOutcome("Projekt ztrácí výhodu skrytého balíku. Holub musí poprvé ocenit každou laskavost zvlášť.",{trust:8,business:-10,officials:6},["legal"],()=>{addConspiracyClue("meadow");changePlan("business",-15)}),fail:makeOutcome("Úředníci tvrdí, že rozdělení by bylo obcházením zakázky. Celek byl přitom obcházením obce.",{officials:-4,business:7},["legal"])},{label:"Vstoupit jako politický garant",detail:"Síť bude fungovat, pokud bude potřebovat váš podpis.",check:{attr:"authority",dc:14},tags:["corrupt","power","contract"],success:makeOutcome("Holub i Brázda začnou koordinovat přes vás. Věčný zůstává ve schématu jako historická položka.",{influence:14,business:12,jzd:8,integrity:-15},["corrupt","power"],()=>{state.conspiracy.joined=true;state.conspiracy.revealed=true;changePlan("business",12)}),fail:makeOutcome("Síť přijme vaši garanci, ale ne kontrolu. Ručíte za něco, co neřídíte.",{heat:14,integrity:-10,business:8},["corrupt"])}]},
 planBusinessSignature:{id:"planBusinessSignature",location:"townhall",title:"Smlouva připravená na ráno po volbách",emoji:"✒️",kicker:"TAH FRAKCE",queued:true,text:()=>["Holubovi právníci připravili smlouvu s podmínkou, že nabude účinnosti po ustavení nové rady. Jméno starosty je ponecháno prázdné."],choices:[{label:"Zveřejnit smlouvu před volbami",detail:"Ať voliči vidí, co se má podepsat jejich jménem.",check:{attr:"resilience",dc:15},tags:["transparent","public"],success:makeOutcome("Prázdná kolonka starosty se stane nejslavnějším místem dokumentu.",{support:10,trust:9,business:-14,oldguard:-8},["transparent"],()=>{state.conspiracy.exposed=true;changePlan("business",-22)}),fail:makeOutcome("Holub doloží, že jde jen o pracovní návrh. Vaše podpisy v přílohách však pracovní nejsou.",{heat:14,trust:-5,business:5},["transparent"])},{label:"Nechat kolonku vyplnit svým jménem",detail:"Volby rozhodnou, zda byl podpis prozíravý, nebo trestný.",check:{attr:"cunning",dc:15},tags:["corrupt","contract","power"],success:makeOutcome("Projekt čeká na vaše vítězství. Kampaň dostane poslední finanční injekci.",{funds:15,influence:12,business:15,integrity:-20,heat:9},["corrupt"],()=>{state.conspiracy.joined=true;state.flags.siloSigned=true}),fail:makeOutcome("Kopie s vaším jménem dorazí Daniele dřív než peníze.",{heat:24,trust:-12,press:9,integrity:-15},["corrupt"])}]},
 planPressQuestions:{id:"planPressQuestions",location:"paper",title:"Sedm otázek bez bezpečné odpovědi",emoji:"❓",kicker:"TAH FRAKCE",queued:true,text:()=>["Daniela posílá sedm otázek k vašim schůzkám, financím a lidem v družině. Odpověď chce do večera."],choices:[{label:"Odpovědět dokumenty a přiznat mezery",detail:"Méně elegantní, lépe ověřitelné.",check:{attr:"resilience",dc:12},tags:["transparent","press"],success:makeOutcome("Článek je kritický, ale odděluje chyby od podvodu.",{trust:6,press:7,heat:-4},["transparent"],()=>changePlan("press",-5)),fail:makeOutcome("Přiznané mezery vypadají v titulku jako díry.",{trust:1,heat:6},["transparent"])},{label:"Odpovědět útokem na motivaci redakce",detail:"Otázky nezmizí. Čtenáři se rozdělí.",check:{attr:"authority",dc:13},tags:["pressAttack","lie","public"],success:makeOutcome("Vaše jádro se semkne a zbytek obce si článek přečte dvakrát.",{support:4,press:-9,heat:4,integrity:-6},["pressAttack"],()=>changePlan("press",7)),fail:makeOutcome("Redakce zveřejní otázky i vaše odmítnutí.",{heat:13,trust:-8,press:-7},["pressAttack"])}]},
 planPressOwners:{id:"planPressOwners",location:"paper",title:"Kdo vlastní poradce",emoji:"🔍",kicker:"TAH FRAKCE",queued:true,text:()=>["Redakce dohledala, že poradenské firmy u školy, JZD a louky mají společnou schránku a bývalého účetního Holuba."],choices:[{label:"Pomoci ověřit vlastnický řetězec",detail:"Dodat dokumenty i za cenu vlastního jména v článku.",check:{attr:"intellect",dc:14},tags:["transparent","legal"],success:makeOutcome("Vlastnická mapa potvrzuje Projekt SILO a stává se veřejným dokumentem.",{press:10,trust:7,leverage:6},["transparent"],()=>{addConspiracyClue("meadow");revealPlan("business");changePlan("press",-6)}),fail:makeOutcome("Schránky končí v zemi, kde se vlastnictví považuje za soukromý názor.",{press:4,heat:4},["legal"])},{label:"Koupit čas reklamní smlouvou",detail:"Nezastavit článek, jen ho přesunout za volby.",check:{attr:"cunning",dc:13},tags:["corrupt","press"],success:makeOutcome("Vydání se odkládá. Daniela si odkládá také důvěru.",{heat:-4,funds:-5,press:-10,integrity:-9},["corrupt"],()=>changePlan("press",-10)),fail:makeOutcome("Obchodní oddělení nabídku přijme a redakce o ní napíše.",{funds:-5,heat:15,press:-12},["corrupt"])}]},
 planPressLedger:{id:"planPressLedger",location:"paper",title:"Účetní stopa míří do kampaně",emoji:"🧾",kicker:"TAH FRAKCE",queued:true,text:()=>["Platby Projektu SILO se potkávají s účtem tiskárny a jedním vaším darem. Může jít o náhodu, nebo o skutečně špatně zvolenou náhodu."],choices:[{label:"Otevřít účetnictví kampaně",detail:"Ukázat vše, včetně politických dluhů.",check:{attr:"resilience",dc:15},tags:["transparent","legal"],success:makeOutcome("Redakce oddělí vaše dluhy od cizí sítě. Není to lichotivé, ale je to rozdíl.",{trust:8,heat:-5,press:8},["transparent"],()=>changePlan("press",-8)),fail:makeOutcome("Účetnictví je poctivé, ale chaotické. Titulek používá slovo neprůhledné.",{trust:-3,heat:8},["transparent"])},{label:"Přesměrovat stopu na Věčného",detail:"Použít správný dokument ve špatném pořadí.",check:{attr:"cunning",dc:15},tags:["lie","power","press"],success:makeOutcome("Věčný vysvětluje platby a vaše část grafu se zmenší.",{support:7,oldguard:-10,heat:2,integrity:-7},["lie","power"],()=>changePlan("press",-2)),fail:makeOutcome("Redakce zveřejní obě stopy a titulek používá množné číslo kandidáti.",{heat:18,trust:-10,oldguard:-4},["lie"])}]},
 planPressSpecial:{id:"planPressSpecial",location:"paper",title:"Předvolební speciál je hotový",emoji:"🗞️",kicker:"TAH FRAKCE",queued:true,text:()=>["Daniela má připravené celé číslo. Podle vašich činů může nést titul Síť kolem Věčného, Kandidát na dvě strany nebo Obec na prodej."],choices:[{label:"Nechat číslo vyjít bez zásahu",detail:"Důvěřovat dokumentům, nikoli titulku.",check:{attr:"resilience",dc:15},tags:["ethical","press","transparent"],success:makeOutcome("Speciál je tvrdý, ale potvrzuje většinu vašich tvrzení. Lidé získají souvislosti.",{trust:10,press:10,heat:2,oldguard:-8,business:-7},["ethical","transparent"],()=>{state.flags.pressSpecial=true;changePlan("press",-15)}),fail:makeOutcome("Číslo potvrzuje síť i vaše kompromisy. Každý si najde odstavec, který ho rozčílí.",{trust:1,heat:12,press:7},["transparent"],()=>state.flags.pressSpecial=true)},{label:"Zastavit distribuci přes tiskárnu",detail:"Číslo nebude v poště. Bude všude na internetu.",check:{attr:"cunning",dc:16},tags:["corrupt","pressAttack"],success:makeOutcome("Papírové vydání zmizí. Digitální verze získá menší zásah, ale trvalejší adresu.",{heat:7,press:-15,integrity:-12},["corrupt","pressAttack"],()=>changePlan("press",-18)),fail:makeOutcome("Tiskárna informuje redakci a titulní strana získá příběh o cenzuře.",{heat:24,trust:-14,press:-18},["pressAttack"])}]}

,
 conflictMarieHolub:{id:"conflictMarieHolub",location:"school",title:"Porada, na které prší ze stropu",emoji:"⚡",kicker:"KONFLIKT DRUŽINY",queued:true,text:()=>["Marie odmítá další Holubův dodatek ke střeše. Holub odmítá opravovat školu bez dodatku, který podle něj zajišťuje podnikatelskou jistotu.","Oba chtějí vědět, zda je váš štáb tým, nebo společná čekárna na funkce."],choices:[
  {label:"Postavit se za Marii",detail:"Škola není faktura s dětmi jako přílohou.",check:{attr:"authority",dc:13},tags:["ethical","children","antiBusiness"],success:makeOutcome("Holub stáhne dodatek. Marie zůstává a Holub začíná účtovat také uraženost.",{trust:6,citizens:5,business:-8},["ethical","children"],()=>{shiftLoyalty("marie",10);shiftLoyalty("holub",-16);adjustRelationship("marie","holub",-12,"spor se změnil v otevřenou válku");resolveCompanionConflict("marieHolub","marie")}),fail:makeOutcome("Holub vytáhne původní souhlas vašeho štábu. Marie vidí, že jste řídil spor bez znalosti vlastních papírů.",{trust:-4,business:4,heat:5},["children"],()=>{shiftLoyalty("marie",-8);shiftLoyalty("holub",-6);resolveCompanionConflict("marieHolub","failed")})},
  {label:"Dát za pravdu Holubovi",detail:"Střecha se opraví rychleji. Principy mohou schnout v kabinetu.",check:{attr:"cunning",dc:12},tags:["contract","power"],success:makeOutcome("Holub zajistí materiál. Marie vám připomene, že rychlost není totéž co veřejný zájem.",{funds:5,business:8,support:3,integrity:-6},["contract"],()=>{shiftLoyalty("holub",10);shiftLoyalty("marie",-18);adjustRelationship("marie","holub",-15,"dodatek zvítězil nad pedagogikou");resolveCompanionConflict("marieHolub","holub")}),fail:makeOutcome("Holub získá zakázku a Marie veřejně oznámí, že s rozhodnutím nesouhlasí.",{heat:8,trust:-7,business:5},["contract"],()=>{shiftLoyalty("marie",-24);resolveCompanionConflict("marieHolub","failed")})},
  {label:"Uzavřít veřejný kompromis",detail:"Dodatek se zveřejní a Marie bude kontrolovat plnění.",check:{attr:"intellect",dc:15},tags:["legal","transparent","children"],success:makeOutcome("Poprvé vznikne smlouva, kterou rozumí ředitelka i právník. Holub tvrdí, že to nebylo nutné, a podepíše.",{trust:8,officials:6,business:2},["legal","transparent"],()=>{shiftLoyalty("marie",6);shiftLoyalty("holub",4);adjustRelationship("marie","holub",22,"spor má písemná pravidla");resolveCompanionConflict("marieHolub","mediate")}),fail:makeOutcome("Kompromis má šest příloh a žádného vlastníka. Oba vám přestanou věřit současně.",{trust:-5,officials:-3},["legal"],()=>{shiftLoyalty("marie",-8);shiftLoyalty("holub",-8);resolveCompanionConflict("marieHolub","failed")})}
 ]},
 aftermathMarieHolub:{id:"aftermathMarieHolub",location:"school",title:"Účet za smír ve škole",emoji:"🧾",kicker:"NÁSLEDEK KONFLIKTU",queued:true,text:()=>["Spor Marie a Holuba se dostal mezi rodiče a dodavatele. I vyřešený konflikt potřebuje veřejnou verzi.",`Předchozí rozhodnutí: ${state.conflictStates.marieHolub?.path||"nikdo si nepamatuje, kdo vyhrál"}.`],choices:[
  {label:"Zveřejnit zápis celé porady",detail:"Důvěra za cenu toho, že veřejnost pozná váš štáb.",check:{attr:"resilience",dc:12},tags:["transparent","children"],success:makeOutcome("Rodiče ocení, že se štáb hádá o skutečný problém, ne o pořadí na fotografii.",{trust:6,parents:0,citizens:4},["transparent"],()=>{adjustVoter("parents",6,.01);state.conflictStates.marieHolub.aftermath=true}),fail:makeOutcome("Zápis odhalí větu, kterou všichni považovali za neveřejnou.",{heat:6,trust:-2},["transparent"],()=>state.conflictStates.marieHolub.aftermath=true)},
  {label:"Vydat jednotné stanovisko",detail:"Štáb je jednotný, protože text neříká, v čem.",check:{attr:"charisma",dc:12},tags:["public","lie"],success:makeOutcome("Spor zmizí z titulků, nikoli ze společné kanceláře.",{support:4,heat:-2,integrity:-3},["public"],()=>state.conflictStates.marieHolub.aftermath=true),fail:makeOutcome("Marie a Holub vydají každý vlastní jednotné stanovisko.",{heat:8,support:-3},["lie"],()=>state.conflictStates.marieHolub.aftermath=true)}
 ]},
 conflictDanielaBrazda:{id:"conflictDanielaBrazda",location:"jzd",title:"Článek proti rodinné cti",emoji:"📰",kicker:"KONFLIKT DRUŽINY",queued:true,text:()=>["Daniela chce zveřejnit Radovanovy účty. Brázda tvrdí, že novinářka útočí na celé zemědělství, rodinu a pravděpodobně i sklizeň.","Oba od vás čekají loajalitu. Každý jinému významu toho slova."],choices:[
  {label:"Dát Daniele dokumenty",detail:"Zdroj dostane pravdu. Brázda dostane titulní stranu.",check:{attr:"resilience",dc:14},tags:["transparent","press","legal"],success:makeOutcome("Článek vyjde s dokumenty. Brázda zůstane jen proto, aby věděl, co ještě máte.",{press:9,trust:7,jzd:-8},["transparent","press"],()=>{shiftLoyalty("daniela",12);shiftLoyalty("brazda",-16);adjustRelationship("daniela","brazda",-18,"titulní strana nahradila dialog");resolveCompanionConflict("danielaBrazda","daniela")}),fail:makeOutcome("Dokumenty nejsou kompletní. Daniela publikuje otazníky a Brázda odpovědi, které jste mu nedal.",{heat:8,press:3,jzd:-4},["press"],()=>resolveCompanionConflict("danielaBrazda","failed"))},
  {label:"Krýt Brázdovu rodinu",detail:"Traktory za mlčení. Zemědělská verze svobody tisku.",check:{attr:"cunning",dc:13},tags:["corrupt","jzdDeal","pressAttack"],success:makeOutcome("Daniela článek odloží, ale kopii uloží mimo redakci. Brázda slíbí plnou mobilizaci.",{jzd:12,support:5,press:-10,integrity:-10},["corrupt","jzdDeal"],()=>{shiftLoyalty("brazda",12);shiftLoyalty("daniela",-22);adjustRelationship("daniela","brazda",-20,"mlčení dostalo cenu");resolveCompanionConflict("danielaBrazda","brazda")}),fail:makeOutcome("Daniela zveřejní i váš pokus článek zastavit.",{heat:16,trust:-10,jzd:5,press:-8},["corrupt"],()=>resolveCompanionConflict("danielaBrazda","failed"))},
  {label:"Prosadit odklad a náhradu škody",detail:"Radovan zaplatí, článek počká na dokumenty a Brázda nebude moci tvrdit, že se nic nestalo.",check:{attr:"authority",dc:15},tags:["legal","power"],success:makeOutcome("Radovan platí. Daniela dostane ověřený příběh a Brázda cestu, jak neztratit celý podnik.",{trust:7,jzd:3,press:5},["legal"],()=>{shiftLoyalty("daniela",5);shiftLoyalty("brazda",5);adjustRelationship("daniela","brazda",20,"spor dostal fakta i termín");resolveCompanionConflict("danielaBrazda","mediate")}),fail:makeOutcome("Odklad vypadá jako cenzura a náhrada jako přiznání.",{heat:10,jzd:-4,press:-4},["legal"],()=>resolveCompanionConflict("danielaBrazda","failed"))}
 ]},
 aftermathDanielaBrazda:{id:"aftermathDanielaBrazda",location:"paper",title:"Traktory před redakcí",emoji:"🚜",kicker:"NÁSLEDEK KONFLIKTU",queued:true,text:()=>["Před redakcí stojí dva traktory, sedm zemědělců a transparent SVOBODU SLOVA ANO, ALE SLUŠNĚ.","Konflikt už není jen ve štábu."],choices:[
  {label:"Postavit se mezi obě skupiny",detail:"Veřejná mediace s rizikem, že vás přejede argument i traktor.",check:{attr:"authority",dc:14},tags:["public","legal"],success:makeOutcome("Protest skončí debatou a jednou rozbitou termoskou.",{trust:6,heat:-5,citizens:4},["public","legal"],()=>state.conflictStates.danielaBrazda.aftermath=true),fail:makeOutcome("Každá strana z vašeho projevu vystřihne jinou větu.",{heat:9,trust:-4},["public"],()=>state.conflictStates.danielaBrazda.aftermath=true)},
  {label:"Nechat je, ať se politicky vyčerpají",detail:"Konflikt se vyřeší bez vás. Také proti vám.",check:{attr:"cunning",dc:12},tags:["power"],success:makeOutcome("Po dvou hodinách se hádka přesune k ceně nafty a zapomene na vás.",{influence:3,heat:2},["power"],()=>state.conflictStates.danielaBrazda.aftermath=true),fail:makeOutcome("Obě strany se shodnou, že problémem je vaše vedení štábu.",{support:-6,heat:7},["power"],()=>state.conflictStates.danielaBrazda.aftermath=true)}
 ]},
 conflictDanielaBohumil:{id:"conflictDanielaBohumil",location:"townhall",title:"Zdroj, který chce přežít zveřejnění",emoji:"🗄️",kicker:"KONFLIKT DRUŽINY",queued:true,text:()=>["Daniela chce publikovat archiv. Bohumil chce záruku, že z dokumentů nepůjde poznat, kdo je kopíroval v čase oběda.","Bez něj nejsou dokumenty. Bez ní nejsou veřejné."],choices:[
  {label:"Chránit Bohumila jako zdroj",detail:"Článek vyjde později, ale úředník možná zůstane živý i zaměstnaný.",check:{attr:"intellect",dc:13},tags:["legal","transparent"],success:makeOutcome("Daniela anonymizuje stopu. Bohumil dodá další šanon.",{officials:8,press:5,trust:5},["legal","transparent"],()=>{shiftLoyalty("bohumil",10);shiftLoyalty("daniela",4);adjustRelationship("daniela","bohumil",20,"zdroj dostal ochranu");resolveCompanionConflict("danielaBohumil","protect")}),fail:makeOutcome("Anonymizace smaže také dvě důležité vazby.",{press:-2,officials:3,heat:3},["legal"],()=>resolveCompanionConflict("danielaBohumil","failed"))},
  {label:"Zveřejnit dokumenty v plném znění",detail:"Pravda bez začernění. Bohumil bez kanceláře.",check:{attr:"resilience",dc:14},tags:["transparent","press"],success:makeOutcome("Kauza je neprůstřelná. Bohumil podává výpověď dřív, než ji za něj napíše Věčný.",{press:12,trust:8,officials:-10},["transparent","press"],()=>{shiftLoyalty("daniela",12);shiftLoyalty("bohumil",-30);adjustRelationship("daniela","bohumil",-24,"dokument zvítězil nad zdrojem");resolveCompanionConflict("danielaBohumil","publish")}),fail:makeOutcome("Dokumenty obsahují osobní údaje a příběh se změní na váš procesní průšvih.",{heat:14,officials:-8,press:3},["transparent"],()=>resolveCompanionConflict("danielaBohumil","failed"))},
  {label:"Vytvořit nezávislou úschovu",detail:"Dokumenty dostane notář, redakce ověřené výstupy a Bohumil procesní krytí.",check:{attr:"intellect",dc:15},tags:["legal","contract"],success:makeOutcome("Nikdo není spokojený, což je obvykle známka kvalitního procesního řešení.",{officials:7,press:7,trust:6,funds:-2},["legal"],()=>{shiftLoyalty("daniela",6);shiftLoyalty("bohumil",8);adjustRelationship("daniela","bohumil",24,"spor převzala instituce");resolveCompanionConflict("danielaBohumil","mediate")}),fail:makeOutcome("Notář odmítne úschovu, protože krabice je popsaná FIXLOVÁNÍ 2002–2024.",{heat:7,officials:-2},["legal"],()=>resolveCompanionConflict("danielaBohumil","failed"))}
 ]},
 aftermathDanielaBohumil:{id:"aftermathDanielaBohumil",location:"townhall",title:"Kopie, která neměla existovat",emoji:"📠",kicker:"NÁSLEDEK KONFLIKTU",queued:true,text:()=>["Jedna stránka z archivu unikla anonymnímu profilu. Daniela tvrdí, že ji nevydala. Bohumil tvrdí, že kopii nikdy neudělal. Obě tvrzení mohou být současně pravdivá jen v politice."],choices:[
  {label:"Nechat únik nezávisle prověřit",detail:"Pomalé a důvěryhodné, pokud slovo nezávisle přežije obecní rozpočet.",check:{attr:"intellect",dc:13},tags:["legal","transparent"],success:makeOutcome("Prověření odliší autentický dokument od přidaného komentáře.",{trust:6,heat:-5,officials:4},["legal"],()=>state.conflictStates.danielaBohumil.aftermath=true),fail:makeOutcome("Posudek potvrdí dokument a nedokáže potvrdit, kdo ho zveřejnil.",{heat:4,trust:1},["legal"],()=>state.conflictStates.danielaBohumil.aftermath=true)},
  {label:"Použít únik proti Věčnému",detail:"Když už dokument unikl, může alespoň pracovat.",check:{attr:"cunning",dc:13},tags:["power","lie"],success:makeOutcome("Věčný vysvětluje obsah a nikdo se neptá na cestu dokumentu.",{support:6,oldguard:-8,integrity:-5},["power"],()=>state.conflictStates.danielaBohumil.aftermath=true),fail:makeOutcome("Věčný zpochybní cestu i obsah a vy obhajujete obojí.",{heat:9,trust:-6},["lie"],()=>state.conflictStates.danielaBohumil.aftermath=true)}
 ]},
 conflictGeneral:{id:"conflictGeneral",location:"hq",title:"Porada bez společného stanoviska",emoji:"🗯️",kicker:"KONFLIKT DRUŽINY",queued:true,text:()=>{const [a,b]=state.flags.generalConflictPair||Object.keys(state.party).slice(0,2);return [`${state.party[a]?.name||"První poradce"} a ${state.party[b]?.name||"druhý poradce"} připravili dvě vzájemně neslučitelné strategie pro stejný den.`,"Jedna chce rychlý politický efekt. Druhá tvrdí, že po volbách bude pořád existovat obec."]},choices:[
  {label:"Dát pravomoc prvnímu poradci",detail:"Rychlé rozhodnutí a pomalejší rozpad druhého vztahu.",check:{attr:"authority",dc:12},tags:["power"],success:makeOutcome("Štáb se pohne jedním směrem. Druhá polovina jde stejným směrem pouze fyzicky.",{influence:4,support:2},["power"],()=>{const[a,b]=state.flags.generalConflictPair;shiftLoyalty(a,8);shiftLoyalty(b,-12);adjustRelationship(a,b,-12,"vedení vybralo jednu stranu");state.conflictStates.general={resolved:true,path:a}}),fail:makeOutcome("Rozhodnutí je jasné jen do chvíle, než oba rozešlou vlastní instrukce.",{heat:6,support:-3},["power"],()=>state.conflictStates.general={resolved:true,path:"failed"})},
  {label:"Dát pravomoc druhému poradci",detail:"Stejná mocenská logika, jen s opačnou tiskovou zprávou.",check:{attr:"authority",dc:12},tags:["power"],success:makeOutcome("Strategie se sjednotí. Autor té druhé si ukládá dokument s názvem PO VOLBÁCH.",{influence:4,trust:2},["power"],()=>{const[a,b]=state.flags.generalConflictPair;shiftLoyalty(b,8);shiftLoyalty(a,-12);adjustRelationship(a,b,-12,"vedení vybralo druhou stranu");state.conflictStates.general={resolved:true,path:b}}),fail:makeOutcome("Oba pochopí rozhodnutí jako potvrzení vlastního návrhu.",{heat:6,trust:-3},["power"],()=>state.conflictStates.general={resolved:true,path:"failed"})},
  {label:"Rozdělit úkoly a společně určit hranice",detail:"Méně hrdinské než rozseknutí sporu, zato použitelné i zítra.",check:{attr:"intellect",dc:14},tags:["legal","transparent"],success:makeOutcome("Oba dostanou vlastní oblast, termín a veřejnou odpovědnost. Hádka se mění v řízení projektu.",{trust:6,officials:4},["legal","transparent"],()=>{const[a,b]=state.flags.generalConflictPair;shiftLoyalty(a,5);shiftLoyalty(b,5);adjustRelationship(a,b,18,"spor dostal hranice a odpovědnost");state.conflictStates.general={resolved:true,path:"mediate"}}),fail:makeOutcome("Rozdělení úkolů vytvoří dvě kampaně a jednu společnou fakturu.",{funds:-3,heat:5},["legal"],()=>state.conflictStates.general={resolved:true,path:"failed"})}
 ]},
 siloVerdict:{id:"siloVerdict",location:"townhall",title:"Operace SILO: komu patří vítězství",emoji:"⚖️",kicker:"BOSSFIGHT · FÁZE II",queued:true,text:()=>["Důkazy zazněly. Síť je otřesená, nikoli mrtvá. Holubovi právníci nabízejí dohodu, Daniela úplné zveřejnění a Bohumil upozorňuje, že obec musí fungovat také v pondělí.","Teď nerozhodujete, zda je Operace SILO skutečná. Rozhodujete, co s ní udělá moc."],choices:[
  {label:"Předat celý případ policii a auditorům",detail:"Čistý řez. Také několik měsíců bez lidí, kteří dosud uměli otevřít rozpočet.",check:{attr:"resilience",dc:16},tags:["ethical","transparent","legal"],success:makeOutcome("Síť se rozpadne do výslechů, auditů a lidí, kteří si náhle nevzpomínají na hesla.",{trust:12,integrity:12,heat:5,oldguard:-16,business:-14,jzd:-8},["ethical","transparent"],()=>{state.conspiracy.exposed=true;state.conspiracy.resolved=true;state.flags.siloFinalPath="prosecution"}),fail:makeOutcome("Případ je silný politicky a slabší trestně. Síť přežije první tiskovou konferenci.",{trust:2,heat:12,oldguard:-5},["legal"],()=>{state.conspiracy.resolved=true;state.flags.siloFinalPath="weak_case"})},
  {label:"Uzavřít veřejnou dohodu s tvrdými podmínkami",detail:"Louka zůstane, škola se opraví, smlouvy se otevřou. Viníci dostanou procesní budoucnost.",check:{attr:"authority",dc:15},tags:["legal","gray","power"],success:makeOutcome("Síť nezmizí, ale poprvé musí plnit veřejné podmínky a termíny.",{trust:8,influence:10,officials:7,business:-3,integrity:2},["legal","power"],()=>{state.conspiracy.resolved=true;state.flags.siloFinalPath="settlement";addCommitment({title:"Provést veřejnou reformu smluv",creditor:"Občané",due:13,kind:"public",notes:"Dohoda Operace SILO"})}),fail:makeOutcome("Dohoda poskytne síti čas a vám odpovědnost.",{trust:-7,heat:13,business:7,oldguard:5},["gray"],()=>{state.conspiracy.resolved=true;state.flags.siloFinalPath="captured_settlement"})},
  {label:"Rozdělit síť a koupit její nejslabší článek",detail:"Nečistý prostředek k čistšímu výsledku. Nebo opačně.",check:{attr:"cunning",dc:16},tags:["power","corrupt"],success:makeOutcome("Brázda vypoví Holuba, Holub Věčného a Věčný všechny. Síť končí, vaše složka začíná.",{influence:15,leverage:12,oldguard:-12,business:-8,integrity:-12,heat:7},["power","corrupt"],()=>{state.conspiracy.resolved=true;state.flags.siloFinalPath="split"}),fail:makeOutcome("Všichni pochopí nabídku a spojí se proti jedinému novému člověku u stolu.",{heat:20,trust:-13,oldguard:10,business:10,jzd:8},["corrupt"],()=>{state.conspiracy.resolved=true;state.flags.siloFinalPath="backfire"})}
 ]},
 siloBoardVote:{id:"siloBoardVote",location:"meadow",title:"Operace SILO: hlasování představenstva",emoji:"🥃",kicker:"BOSSFIGHT · FÁZE II",queued:true,text:()=>["Síť vás pustila ke stolu. Věčný si myslí, že jako hosta. Holub jako investici. Brázda jako budoucího dlužníka.","Máte jeden večer na to, abyste určil, zda síť převezmete, zradíte, nebo jí dovolíte přežít s novým předsedou."],choices:[
  {label:"Převzít předsednictví sítě",detail:"Každý dostane funkci. Vy dostanete každého.",check:{attr:"cunning",dc:16},tags:["corrupt","power","contract"],success:makeOutcome("Věčný zjistí, že hlasoval pro vlastní historickou roli. Síť má nového předsedu.",{influence:18,funds:12,leverage:15,integrity:-22,heat:8},["corrupt","power"],()=>{state.conspiracy.joined=true;state.conspiracy.resolved=true;state.flags.siloBoss=true;state.flags.siloFinalPath="takeover"}),fail:makeOutcome("Představenstvo odhlasuje, že jste byl pouze externí konzultant.",{heat:22,trust:-13,leverage:-5},["corrupt"],()=>{state.conspiracy.resolved=true;state.flags.siloFinalPath="expelled"})},
  {label:"Nahrát jednání a síť zradit",detail:"Jedna šance přeměnit spolupachatelství na whistleblowing.",check:{attr:"resilience",dc:17},tags:["transparent","power"],success:makeOutcome("Nahrávka rozbije síť i vaši pověst člověka, kterému lze věřit v zadním salonku.",{trust:10,press:12,oldguard:-15,business:-13,jzd:-8,heat:9,integrity:5},["transparent"],()=>{state.conspiracy.exposed=true;state.conspiracy.resolved=true;state.flags.siloFinalPath="betrayal"}),fail:makeOutcome("Holub na začátku jednání požádal všechny vypnout telefony. Jen váš zůstal položený displejem nahoru.",{heat:26,trust:-16,integrity:-12},["transparent"],()=>{state.conspiracy.resolved=true;state.flags.siloFinalPath="caught"})},
  {label:"Nechat síť běžet a vyjednat si veto",detail:"Nejste majitel. Jste člověk, bez něhož se nic nepodepíše.",check:{attr:"authority",dc:15},tags:["gray","power","contract"],success:makeOutcome("Síť přežije jako povolební koalice před volbami. Každý zisk potřebuje váš souhlas.",{influence:14,business:10,jzd:8,integrity:-12,leverage:8},["power","contract"],()=>{state.conspiracy.joined=true;state.conspiracy.resolved=true;state.flags.siloFinalPath="veto"}),fail:makeOutcome("Veto existuje jen ústně. Holub ho interpretuje jako doporučení.",{business:9,heat:10,integrity:-9},["gray"],()=>{state.conspiracy.resolved=true;state.flags.siloFinalPath="token_veto"})}
 ]}
,
 agendaMarie:{id:"agendaMarie",location:"school",title:"Marie chce školu vyjmout z kampaně",emoji:"🏫",kicker:"OSOBNÍ AMBICE",queued:true,text:()=>["Marie přináší návrh veřejného závazku: pevná část rozpočtu pro školu, zákaz používání dětí jako kulisy a kontrolní výbor rodičů.","Nežádá laskavost. Žádá pravidlo, které bude platit i pro vás."],choices:[
  {label:"Přijmout veřejný školský závazek",detail:"Získáte rodiče a nákladný slib, který přežije volby.",check:{attr:"authority",dc:12},tags:["children","ethical","public"],success:makeOutcome("Marie získá vlastní politickou agendu a štáb stabilní rodičovskou síť.",{trust:7,citizens:6,funds:-2},["children","ethical"],()=>resolveAmbition("marie","pledge")),fail:makeOutcome("Závazek je přijat, ale rozpočet v něm připomíná přání napsané na tabuli.",{trust:3,funds:-3},["children"],()=>resolveAmbition("marie","weak"))},
  {label:"Vyjednat podporu bez pevného procenta",detail:"Praktický kompromis, který Marie pozná jako praktický kompromis.",check:{attr:"intellect",dc:13},tags:["legal","gray"],success:makeOutcome("Vznikne kontrolní plán a pravidelné zveřejňování výdajů.",{trust:4,officials:4},["legal"],()=>resolveAmbition("marie","framework")),fail:makeOutcome("Rámec má dvanáct bodů a žádnou korunu. Marie stáhne část podpory.",{trust:-2},["legal"],()=>resolveAmbition("marie","frustrated",2))},
  {label:"Odmítnout: kampaň musí být flexibilní",detail:"Flexibilita je slovo, které rodiče slyší jako další plachtu na střeše.",check:{attr:"charisma",dc:14},tags:["public","lie"],success:makeOutcome("Odmítnutí ustojíte, Marie však přestane být automatickou tváří školské politiky.",{support:2,trust:-3},["public"],()=>resolveAmbition("marie","rejected",3)),fail:makeOutcome("Marie veřejně oznámí, že děti nebudou rekvizitou. Fotografie prázdného pódia oběhne obec.",{support:-6,trust:-6},["lie"],()=>resolveAmbition("marie","break",4))}
 ]},
 agendaDaniela:{id:"agendaDaniela",location:"paper",title:"Daniela požaduje redakční nezávislost",emoji:"📰",kicker:"OSOBNÍ AMBICE",queued:true,text:()=>["Daniela chce písemnou dohodu, že může zveřejnit ověřené informace i proti vlastní kampani.","Tvrdí, že jinak není novinářka, ale dražší tisková mluvčí."],choices:[
  {label:"Podepsat úplnou nezávislost",detail:"Získáte důvěryhodnost a možnost velmi nepříjemného překvapení.",check:{attr:"resilience",dc:12},tags:["transparent","ethical"],success:makeOutcome("Daniela přijme dohodu a odemkne síť ověřených kontaktů.",{press:8,trust:6,heat:-3},["transparent"],()=>resolveAmbition("daniela","independent")),fail:makeOutcome("Dohoda platí, ale první článek se ptá, proč vznikla až po nátlaku.",{press:3,heat:3},["transparent"],()=>resolveAmbition("daniela","watchdog"))},
  {label:"Dohodnout embargo do voleb",detail:"Pravda počká třináct dní. Daniela možná ne.",check:{attr:"cunning",dc:13},tags:["gray","legal"],success:makeOutcome("Embargo má podmínky a konečné datum. Daniela zůstává, ale vede si vlastní kalendář.",{press:4,leverage:3},["legal"],()=>resolveAmbition("daniela","embargo")),fail:makeOutcome("Daniela zveřejní existenci embarga. Článek je kratší než škoda.",{heat:7,trust:-5},["gray"],()=>resolveAmbition("daniela","leak",3))},
  {label:"Trvat na jednotné komunikaci",detail:"Kampaň mluví jedním hlasem. Ten hlas patří vám.",check:{attr:"authority",dc:14},tags:["power","pressAttack"],success:makeOutcome("Daniela zůstane jako analytik, nikoli jako loajální spojenec.",{influence:4,press:-3},["power"],()=>resolveAmbition("daniela","controlled",3)),fail:makeOutcome("Odchází a odnese si poznámky. Věčný získá jejich obsah dřív než vysvětlení.",{press:-10,heat:12,trust:-7},["pressAttack"],()=>resolveAmbition("daniela","break",5))}
 ]},
 agendaBrazda:{id:"agendaBrazda",location:"jzd",title:"Brázda chce místo pro rodinu i JZD",emoji:"🚜",kicker:"OSOBNÍ AMBICE",queued:true,text:()=>["Brázda žádá povolební zemědělský výbor a garanci, že jeho syn nebude obětován za staré chyby.","JZD prý není zájmová skupina. Je to obec s většími koly."],choices:[
  {label:"Přislíbit výbor a veřejná pravidla",detail:"Dáte JZD vliv, ale pod dohledem a s jasnými podmínkami.",check:{attr:"authority",dc:13},tags:["jzdDeal","legal"],success:makeOutcome("Brázda přijme veřejná pravidla, protože v nich stále vidí dost prostoru pro traktor.",{jzd:8,influence:6,trust:2},["jzdDeal","legal"],()=>resolveAmbition("brazda","committee")),fail:makeOutcome("Brázda slyší hlavně slovo dohled a začne hledat jiného kandidáta.",{jzd:-4,opponent:0},["legal"],()=>resolveAmbition("brazda","cold",3))},
  {label:"Dát mu neveřejnou garanci",detail:"Rychlá mobilizace výměnou za budoucí paměť.",check:{attr:"cunning",dc:12},tags:["jzdDeal","corrupt","power"],success:makeOutcome("Traktory, lidé i pódium jsou připravené. Účet přijde po volbách.",{support:6,jzd:10,influence:5,integrity:-7},["jzdDeal","corrupt"],()=>{resolveAmbition("brazda","deal");addCommitment({title:"Zajistit Brázdovi zemědělský výbor",creditor:"Brázda",due:13,notes:"Osobní agenda"})}),fail:makeOutcome("Garance unikne dřív, než začne fungovat.",{heat:8,trust:-5,jzd:3},["corrupt"],()=>resolveAmbition("brazda","leak",3))},
  {label:"Odmítnout rodinné požadavky",detail:"JZD může být partner. Rodinná imunita nikoli.",check:{attr:"resilience",dc:14},tags:["ethical","police"],success:makeOutcome("Brázda zůstává protivníkem, ale respektuje pevnou hranici.",{trust:5,jzd:-6,integrity:7},["ethical"],()=>resolveAmbition("brazda","respect")),fail:makeOutcome("Brázda přesměruje síť k Věčnému a nazve to ochranou venkova.",{jzd:-12,support:-4,oldguard:5},["police"],()=>resolveAmbition("brazda","break",4))}
 ]},
 agendaBohumil:{id:"agendaBohumil",location:"townhall",title:"Bohumil chce pojistku pro úřad",emoji:"🗄️",kicker:"OSOBNÍ AMBICE",queued:true,text:()=>["Bohumil žádá pravidlo, že po volbách nebude možné vyhodit úředníka jen podle toho, kdo ho zná z hospody.","Současně chce bezpečnou kopii archivu mimo radnici. Neříká kde."],choices:[
  {label:"Zavést služební pravidla a nezávislý archiv",detail:"Úřad získá kontinuitu, vy méně osobní kontroly.",check:{attr:"intellect",dc:12},tags:["legal","transparent"],success:makeOutcome("Bohumil poprvé mluví o budoucnosti bez slova přežít.",{officials:9,trust:5,heat:-3},["legal","transparent"],()=>resolveAmbition("bohumil","rules")),fail:makeOutcome("Pravidla vzniknou, ale každý úředník je chápe jinak.",{officials:4,heat:2},["legal"],()=>resolveAmbition("bohumil","paper"))},
  {label:"Dát Bohumilovi osobní ochranu",detail:"Jednodušší než reforma. Také mnohem osobnější dluh.",check:{attr:"authority",dc:11},tags:["gray","power"],success:makeOutcome("Bohumil získá jistotu a vy člověka, který nezapomíná vaše přílohy.",{officials:7,leverage:3,integrity:-3},["power"],()=>resolveAmbition("bohumil","protected")),fail:makeOutcome("Ochrana je příliš ústní. Bohumil pořídí další kopii pro jistotu.",{heat:5,leverage:-1},["gray"],()=>resolveAmbition("bohumil","insurance",2))},
  {label:"Odmítnout zvláštní zacházení",detail:"Stejná pravidla pro všechny, včetně člověka se všemi kopiemi.",check:{attr:"resilience",dc:13},tags:["ethical"],success:makeOutcome("Bohumil zůstane, protože věří pravidlu více než vám.",{trust:4,integrity:5,officials:2},["ethical"],()=>resolveAmbition("bohumil","institution")),fail:makeOutcome("Bohumil se stáhne do procedurální obrany a přestane zachraňovat vaše termíny.",{officials:-7,heat:5},["ethical"],()=>resolveAmbition("bohumil","withheld",3))}
 ]},
 agendaHolub:{id:"agendaHolub",location:"meadow",title:"Holub navrhuje investiční radu",emoji:"💼",kicker:"OSOBNÍ AMBICE",queued:true,text:()=>["Holub chce stálou investiční radu, v níž budou podnikatelé konzultovat zakázky ještě před jejich zveřejněním.","Nazývá to předvídatelné prostředí. Daniela to nazývá důkazní materiál."],choices:[
  {label:"Zřídit radu s veřejným registrem",detail:"Podnikatelé získají hlas, ale každá schůzka zanechá stopu.",check:{attr:"intellect",dc:14},tags:["contract","legal","transparent"],success:makeOutcome("Holub přijme pravidla, protože přístup je pro něj cennější než úplné ticho.",{business:8,funds:4,trust:3},["contract","legal"],()=>resolveAmbition("holub","registered")),fail:makeOutcome("Rada vznikne, registr ne. Veřejnost si všimne pořadí.",{business:6,heat:6,trust:-3},["contract"],()=>resolveAmbition("holub","captured",2))},
  {label:"Přijmout neveřejný investiční klub",detail:"Rychlé peníze, rychlé projekty, pomalá budoucí vysvětlení.",check:{attr:"cunning",dc:12},tags:["corrupt","contract","business"],success:makeOutcome("Klub naplní kasu a kalendář schůzek bez zápisu.",{funds:9,business:12,influence:6,integrity:-10},["corrupt","contract"],()=>{resolveAmbition("holub","club");addCommitment({title:"Pustit Holuba k investičním zakázkám",creditor:"Holub",due:13,notes:"Investiční klub"})}),fail:makeOutcome("První neveřejná schůzka má veřejnou fotografii.",{funds:4,heat:10,trust:-7},["corrupt"],()=>resolveAmbition("holub","photo",3))},
  {label:"Odmítnout privilegovaný přístup",detail:"Investice mohou přijít přes soutěž. Holub může odejít přes zadní vchod.",check:{attr:"authority",dc:14},tags:["ethical","antiBusiness"],success:makeOutcome("Část podnikatelů respektuje rovná pravidla. Holub nepatří mezi tuto část.",{trust:6,business:-6,integrity:8},["ethical"],()=>resolveAmbition("holub","rules")),fail:makeOutcome("Holub financuje Věčného a vysvětluje to jako diverzifikaci politického portfolia.",{business:-12,opponent:0,support:-3},["antiBusiness"],()=>resolveAmbition("holub","break",4))}
 ]},
 echoSchoolParents:{id:"echoSchoolParents",location:"school",title:"Rodiče kontrolují, co zbylo ze slibu",emoji:"🎒",kicker:"NÁVRAT NÁSLEDKU",queued:true,text:()=>["Rodiče vytahují staré fotografie střechy, vaše výroky a skutečné faktury.","Minulé rozhodnutí se vrací nikoli jako vzpomínka, ale jako tabulka s termíny."],choices:[
  {label:"Ukázat vše a přiznat cenu rozhodnutí",detail:"Otevřená kontrola může bolet méně než další slib.",check:{attr:"resilience",dc:13},tags:["transparent","children"],success:makeOutcome("Rodiče vidí chyby i pokrok. Podpora je méně hlasitá, ale skutečnější.",{trust:7,parents:0,citizens:4,heat:-3},["transparent","children"]),fail:makeOutcome("Dokumenty jsou pravdivé a vysvětlení příliš pozdní.",{trust:-3,support:-3},["transparent"])},
  {label:"Překrýt kontrolu novým slibem",detail:"Každý starý problém potřebuje čerstvější titulek.",check:{attr:"charisma",dc:14},tags:["public","lie"],success:makeOutcome("Nový slib získá týden pozornosti. Kampaň má jen několik dní.",{support:4,trust:-2,integrity:-4},["public","lie"]),fail:makeOutcome("Rodiče dokončí větu za vás a použijí přesnější čísla.",{support:-6,trust:-6},["lie"])}
 ]},
 echoDieselWitness:{id:"echoDieselWitness",location:"jzd",title:"Řidič nákladního auta si vzpomněl",emoji:"🚚",kicker:"NÁVRAT NÁSLEDKU",queued:true,text:()=>["Řidič, který vozil naftu, se vrací s účtenkami a velmi pružnou pamětí.","Je ochoten mluvit s policií, redakcí nebo tím, kdo zaplatí kávu a cestu."],choices:[
  {label:"Předat svědka Daniele a policii",detail:"Důkaz dostane instituci a vy ztratíte kontrolu nad tempem.",check:{attr:"resilience",dc:13},tags:["police","transparent"],success:makeOutcome("Účtenky propojí nádrž s dopravou černé kampaně.",{trust:6,leverage:4,jzd:-6,heat:2},["police","transparent"],()=>addConspiracyClue("diesel","Svědek potvrdil logistickou stopu.")),fail:makeOutcome("Svědek před výslechem změní verzi. Brázda tvrdí, že to dokazuje nevinu.",{jzd:4,heat:6},["police"])},
  {label:"Koupit jeho mlčení i doklady",detail:"Kontrola nad příběhem za cenu dalšího příběhu.",check:{attr:"cunning",dc:12},tags:["corrupt","power"],success:makeOutcome("Doklady končí u vás a svědek na dovolené.",{leverage:6,integrity:-7,heat:3},["corrupt","power"]),fail:makeOutcome("Svědek prodá stejný balík také Věčnému.",{heat:11,trust:-5},["corrupt"])}
 ]},
 echoMeadowFence:{id:"echoMeadowFence",location:"meadow",title:"Na louce vyrostl plot přes noc",emoji:"🚧",kicker:"NÁVRAT NÁSLEDKU",queued:true,text:()=>["Developer tvrdí, že plot chrání veřejnost před budoucí výstavbou.","Občané tvrdí, že chrání budoucí výstavbu před veřejností."],choices:[
  {label:"Nechat plot odstranit a svolat veřejnost",detail:"Viditelný konflikt s investorem a jasný signál voličům.",check:{attr:"authority",dc:14},tags:["ethical","public","antiBusiness"],success:makeOutcome("Plot mizí před kamerami. Holub zůstává, ale přestává se usmívat.",{support:7,citizens:8,business:-8,trust:4},["ethical","public"]),fail:makeOutcome("Plot zůstane a protest obsadí jedinou příjezdovou cestu.",{support:-4,heat:6,business:3},["public"])},
  {label:"Vyjednat průchod a ponechat geodetické práce",detail:"Louka je otevřená a současně stále více cizí.",check:{attr:"intellect",dc:13},tags:["gray","contract","legal"],success:makeOutcome("Vznikne dočasný režim. Každá strana ho vykládá jako vlastní vítězství.",{trust:3,business:4,citizens:2},["legal","contract"]),fail:makeOutcome("Dočasný režim přežije veřejný přístup jen na papíře.",{trust:-5,business:6},["gray"])}
 ]},
 echoPressCorrection:{id:"echoPressCorrection",location:"paper",title:"Oprava na straně osm má větší dopad než článek",emoji:"📝",kicker:"NÁVRAT NÁSLEDKU",queued:true,text:()=>["Redakce opravuje starší text a současně zveřejňuje původní komunikaci kampaně.","Oprava je malá. Screenshoty nikoli."],choices:[
  {label:"Přiznat chybu a dodat všechny podklady",detail:"Krátká bolest výměnou za dlouhou paměť důvěry.",check:{attr:"resilience",dc:12},tags:["transparent","press"],success:makeOutcome("Oprava se změní v příklad, že kampaň umí ustát vlastní chybu.",{trust:6,press:6,heat:-4},["transparent"]),fail:makeOutcome("Podklady ukážou další rozpor. Aspoň je tentokrát váš.",{heat:5,trust:-2},["transparent"])},
  {label:"Napadnout redakci za načasování",detail:"Přesměrujete téma z obsahu na motivaci novinářů.",check:{attr:"charisma",dc:13},tags:["pressAttack","public"],success:makeOutcome("Část lidí začne řešit redakci místo opravy.",{support:3,press:-5,heat:2},["pressAttack"]),fail:makeOutcome("Redakce zveřejní i zvuk vašeho útoku.",{support:-5,press:-8,heat:8},["pressAttack"])}
 ]},
 echoArchiveCopy:{id:"echoArchiveCopy",location:"townhall",title:"Kopie archivu se objevila mimo radnici",emoji:"📠",kicker:"NÁVRAT NÁSLEDKU",queued:true,text:()=>["Někdo poslal část starého archivu do okresní redakce. Dokumenty obsahují skutečné podpisy a velmi kreativní vysvětlivky.","Bohumil odmítá vědět, kdo pořídil kopii. To je jeho nejpřesvědčivější odpověď týdne."],choices:[
  {label:"Ověřit dokumenty a zveřejnit celý kontext",detail:"Získáte kontrolu nad pravostí, nikoli nad všemi titulky.",check:{attr:"intellect",dc:14},tags:["legal","transparent"],success:makeOutcome("Kontext ukáže síť vztahů a omezí nejhorší spekulace.",{trust:6,leverage:4,oldguard:-6},["legal","transparent"],()=>addConspiracyClue("archive","Kopie archivu potvrdila staré vazby.")),fail:makeOutcome("Ověření trvá déle než první vlna titulků.",{heat:7,trust:-3},["legal"])},
  {label:"Použít pouze nejvýbušnější stránku",detail:"Rychlý zásah s dlouhou otázkou, co zůstalo skryté.",check:{attr:"cunning",dc:13},tags:["power","pressAttack"],success:makeOutcome("Věčný vysvětluje podpis místo celé sítě.",{support:5,oldguard:-8,integrity:-4},["power"]),fail:makeOutcome("Zbytek archivu unikne a ukáže, co jste vynechal.",{heat:10,trust:-7},["pressAttack"])}
 ]}

};
const surpriseIds=["escapedBull","powerOutage","fakePoll","celebrityEndorsement","potholeSinkhole","mysteryDonation","hailstorm","weddingRally","regionalInspector","missingCandidate"];
function eventById(id){if(id==="classMastery")return classMasteryEvent();if(/^rivalOperationStage[123]$/.test(id))return rivalOperationEvent(+id.slice(-1));return events[id]}
function dueQuestCount(){
 return Object.entries(state.quests).filter(([id,q])=>q.status==="active"&&questDefs[id]&&questDeadline(id)-state.day<=2).length
}
function initSurprises(){
 const ids=shuffle(surpriseIds).slice(0,5),windows=[[2,4],[5,6],[7,9],[10,11],[12,13]];
 state.surprisePlan=ids.map((id,i)=>({id,day:rand(windows[i][0],windows[i][1])}));
}
function triggerSurprisesForDay(day){
 state.surprisePlan.filter(x=>x.day===day&&!state.flags["surprise_"+x.id]).forEach(x=>{
  state.flags["surprise_"+x.id]=true;
  if(state.flags["resolved_"+x.id]||state.pendingEvents.includes(x.id))return;
  state.surpriseTriggered++;schedule(x.id,1);
  const e=eventById(x.id);addNews(`Nečekaná událost: ${e.title}. Pokud ji necháte být, vyřeší se sama způsobem, který vám nebude vyhovovat.`,"bad");
 });
}
function unlockByDay(){
 if(state.day>=2)unlockQuest("paper");
 if(state.day>=3&&!state.classMastery&&!state.flags.classMasteryQueued&&!state.flags["resolved_classMastery"]){state.flags.classMasteryQueued=true;schedule("classMastery",4);addNews("Vaše povolání se může specializovat. V garáži čeká workshop bez facilitátora.","normal")}
 if(state.day>=4)unlockQuest("oldfiles");
 if(state.day>=6)unlockQuest("debate");
 if(state.day>=9)unlockQuest("water");
 if(state.day>=10){unlockQuest("budget");unlockQuest("waste")}
 if(state.day>=11)unlockQuest("ballots");
 triggerSurprisesForDay(state.day);
 triggerCompanionStories();triggerCompanionConflicts();
}
function activityForEvent(id,urgent=false){
 const e=eventById(id),uses=state.genericUses[id]||0,meta=state.pendingMeta[id];
 const fatigue=e.repeatable&&uses?` · už využito`:"";
 const expiry=meta?` · vyřešit do konce dne ${meta.expiresDay}`:"";
 return {id,icon:e.emoji,title:e.title,detail:e.kicker+fatigue+expiry,urgent};
}
function getActivities(loc){
 const list=[];
 state.pendingEvents.forEach(id=>{const e=eventById(id);if(e&&e.location===loc)list.push(activityForEvent(id,true))});
 for(const [id,e] of Object.entries(events)){
  if(e.location!==loc||!e.available||!e.available())continue;
  const qid=eventQuestId(id,e),q=state.quests[qid];
  const debtUrgent=id.startsWith("obligation")||id==="settleAccounts";
  const urgent=debtUrgent||id.endsWith("Personal")||id.startsWith("silo")||(q&&questDefs[qid]&&questDeadline(qid)-state.day<=2);
  list.push(activityForEvent(id,urgent));
 }
 if(loc==="pitch"&&events.football.available())list.push(activityForEvent("football"));
 if(loc==="hq"&&events.hqVolunteers.available())list.push(activityForEvent("hqVolunteers"));
 if(loc==="pub"&&canRepeat("genericPub"))list.push(activityForEvent("genericPub"));
 if(loc==="hq"&&canRepeat("genericHQ"))list.push(activityForEvent("genericHQ"));
 if(loc==="jzd"&&canRepeat("genericJzd"))list.push(activityForEvent("genericJzd"));
 if(loc==="paper"&&canRepeat("genericPaper"))list.push(activityForEvent("genericPaper"));
 return [...new Map(list.map(a=>[a.id,a])).values()].sort((a,b)=>(b.urgent?1:0)-(a.urgent?1:0)).slice(0,8);
}
function resolveChoice(choice){
 if(chargeChoice(choice)===false)return;
 const mod=checkMod(choice),roll=rand(1,20),total=roll+mod;
 let level=rollLevel(roll,total,choice.check.dc);
 if((level==="costly"||level==="complication")&&state.hero.classId==="bard"&&choice.tags?.includes("public")&&state.abilityUsedDay!==state.day){
  const reroll=rand(1,20),rerollTotal=reroll+mod;state.abilityUsedDay=state.day;
  pendingResolution={choice,roll:reroll,mod,total:rerollTotal,level:rollLevel(reroll,rerollTotal,choice.check.dc),rerolled:true};
 }else pendingResolution={choice,roll,mod,total,level};
 showDice();
}
function applyResolved(){
 const {choice,level}=pendingResolution,e=eventById(state.currentEvent);
 const out=(level==="critical"||level==="success"||level==="costly")?choice.success:choice.fail;
 let ef={...out.effects};
 if(e.repeatable){
  const uses=state.genericUses[e.id]||0,mult=[1,.62,.35][uses]||.2;
  Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.max(1,Math.round(ef[k]*mult))});
  if(uses>0)ef.heat=(ef.heat||0)+uses;
  state.genericUses[e.id]=uses+1;state.cooldowns[e.id]=state.day+2;
 }
 if(level==="critical"){Object.keys(ef).forEach(k=>ef[k]=Math.round(ef[k]*1.35));ef.support=(ef.support||0)+2}
 if(level==="costly"){Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.max(1,Math.round(ef[k]*.68))});const pen=costlyPenalty(choice.tags||[],e.id);for(const [k,v] of Object.entries(pen))ef[k]=(ef[k]||0)+v}
 if(level==="complication"&&pendingResolution.roll===1){Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.floor(ef[k]*.3);else ef[k]=Math.round(ef[k]*1.25)});ef.heat=(ef.heat||0)+5}
 if(state.hero.classId==="rogue"&&choice.tags?.includes("corrupt")&&ef.funds>0)ef.funds+=3;
 effect(ef);registerApproach(choice.tags||[]);state.audit.rolls++;state.audit.outcomes[level]=(state.audit.outcomes[level]||0)+1;state.audit.locations[state.currentLocation]=(state.audit.locations[state.currentLocation]||0)+1;applyVoterReaction(out.tags||choice.tags||[],e.id,level);partyReact(out.tags||choice.tags||[]);out.extra?.();if(e.id.endsWith("Personal")){const cid=e.id.replace("Personal","");if(state.companionStories[cid])state.companionStories[cid].done=true}createCommitmentFromChoice(e.id,choice,level);trackLivingWorld(e.id,choice,level);updateCompanionAmbitions(e.id,choice,level);if(echoEventDefs[e.id])registerEcho(e.id,{tags:choice.tags||[],level});consumeSelectedSupport(choice);postEventHooks(e.id,choice,level);
 e.after?.();
 if(!e.repeatable && !e.queued)state.flags["done_"+e.id]=true;
 if(e.queued||state.pendingEvents.includes(e.id)){state.pendingEvents=state.pendingEvents.filter(x=>x!==e.id);delete state.pendingMeta[e.id];state.flags["resolved_"+e.id]=true;}
 log(`${e.title}: ${choice.label}. ${out.text}`);
 showResult(out.text,ef,level,choice.tags||[]);
 pendingResolution=null;
}

function postEventHooks(eventId,choice,level){
 if(eventId==="siloConfrontation"&&!state.flags.siloVerdictQueued){state.flags.siloVerdictQueued=true;schedule("siloVerdict",3);addNews("Veřejné rozkrytí Operace SILO otevřelo druhou fázi: rozhodnutí, co se sítí udělat.","bad")}
 if(eventId==="siloOffer"&&!state.flags.siloBoardQueued){state.flags.siloBoardQueued=true;schedule("siloBoardVote",3);addNews("Místo u stolu nestačí. Síť svolala hlasování o skutečném vedení.","bad")}
}
function showResult(text,ef,level,tags=[]){
 const result=document.getElementById("resultBox"); if(!result)return;
 const changes=Object.entries(ef).filter(([,v])=>v).map(([k,v])=>`${metricName(k)} ${v>0?"+":""}${v}`).join(" · ");
 const title=level==="critical"?"Kritický úspěch":level==="success"?"Úspěch":level==="costly"?"Úspěch za cenu":"Komplikace";
 result.classList.remove("hidden");result.innerHTML=`<h3>${title}</h3><p>${text}</p>${level==="costly"?"<p><strong>Dosáhl jste cíle, ale vznikl vedlejší účet.</strong></p>":""}<p class="official">${officialLine(tags,level)}</p><p><strong>${changes||"Bez okamžitě viditelné změny."}</strong></p><button id="continueAfter" class="btn primary">Vrátit se na mapu</button>`;
 document.getElementById("choiceBox").classList.add("hidden");
 document.getElementById("continueAfter").onclick=()=>{consumeAction();if(state.finale===0)showMap()};
 renderAll();
}
function officialLine(tags=[],level="success"){
 let pool;
 if(tags.includes("transparent")||tags.includes("ethical"))pool=["Oficiální stanovisko: zveřejnili jsme všechno. Občané nyní žádají stručnější verzi všeho.","V hospodě: možná je slušný, ale jestli takhle bude vysvětlovat každý účet, zavřou dřív než kuchyň.","Vejprnický hlas: Kandidát odpověděl na otázku. Redakce tuto neobvyklou situaci dále sleduje."];
 else if(tags.includes("corrupt")||tags.includes("contract"))pool=["Oficiální stanovisko: nešlo o protislužbu, ale o souběh vzájemně výhodných veřejných zájmů.","V hospodě: obálka prý nebyla úplatek. Byla moc tenká na úplatek.","Vejprnický hlas: Zakázka má vítěze. Soutěž se k výsledku vyjádří později."];
 else if(tags.includes("lie")||tags.includes("pressAttack"))pool=["Tiskový mluvčí: výrok nebyl nepravdivý, pouze předběhl budoucí interpretaci reality.","V hospodě: lže dobře. To se může hodit, až bude jednat s okresem.","Vejprnický hlas: Kandidát popřel, že něco popřel. Video zůstává dostupné."];
 else pool=["Oficiální stanovisko: situace byla vyřešena v souladu s možnostmi, které byly politicky k dispozici.","V hospodě: druhý stůl tvrdí, že to bylo kvůli funkci. První stůl ještě čeká na rundu.","Vejprnický hlas: Kandidát učinil krok. Směr budou redaktoři nadále ověřovat."];
 if(level==="complication")pool.push("Místní rozhlas: prosíme majitele zapnutého mikrofonu, aby si jej okamžitě vyzvedl.");
 return pick(pool);
}
function consumeAction(){
 state.actions--;
 if(state.actions<=0){endDay()}else{state.phase="map";state.currentEvent=null;state.currentLocation=null}
 if(state.day>=14&&!state.ended)startFinale();
}
function skipDay(){
 if(state.phase!=="map"||state.ended)return;
 const unused=state.actions;
 if(unused>0){state.opponent.momentum=clamp(state.opponent.momentum+unused*2,0,100);log(`Kampaň ukončila den o ${unused} akce dřív. Věčný získal prostor.`);addNews(`Kandidát ukončil den dřív. Věčný mezitím stihl ${unused===2?"obejít dvě ulice":"obejít jednu ulici"}.`)}
 state.actions=0;endDay();if(state.finale===0)showMap();
}
function endDay(){
 worldTurn();
 state.day++;state.actions=2;state.partyUsedDay=0;unlockByDay();state.phase="map";state.currentEvent=null;state.currentLocation=null;
 if(state.day>=14)startFinale();else autoSave();
}
function expirePendingEvents(){
 const expired=state.pendingEvents.filter(id=>state.pendingMeta[id]&&state.day>=state.pendingMeta[id].expiresDay);
 expired.forEach(id=>{
  const e=eventById(id);if(e?.ignored)e.ignored();else if(id.endsWith("Personal")){const cid=id.replace("Personal","");if(state.party[cid])state.party[cid].loyalty=clamp(state.party[cid].loyalty-14);if(state.companionStories[cid])state.companionStories[cid].done=true;effect({trust:-2});addNews(`${state.party[cid]?.name||cid} svůj osobní problém vyřešil bez vás. Vztah to nepřežil beze změny.`,"bad")}else if(id.startsWith("plan")){effect({support:-2,heat:3});const pid=id.includes("Oldguard")?"oldguard":id.includes("Jzd")?"jzd":id.includes("Business")?"business":"press";changePlan(pid,6,"Ignorovaný tah frakce uspěl bez odporu.")}else effect({support:-2,heat:3});
  state.pendingEvents=state.pendingEvents.filter(x=>x!==id);delete state.pendingMeta[id];state.flags["resolved_"+id]=true;
  log(`${e?.title||id} bylo ignorováno a vyřešilo se bez vás.`);
 });
}
function worldTurn(){
 resolvePartyAssignment();
 expirePendingEvents();
 const unresolved=Object.entries(state.quests).filter(([id,q])=>q.status==="active"&&questDefs[id]);
 unresolved.forEach(([id,q])=>{
  const def=questDefs[id];
  if(state.day>=questDeadline(id)){
   if(id==="register"){
    completeQuest("register","Kandidátka byla zachráněna nouzově.");
    effect({funds:-5,trust:-7,heat:8,integrity:-5});addNews("Kandidátka podána po administrativním dramatu. Bohumil odmítá vysvětlit detaily.","bad");
   }else{
    failQuest(id,`${def.title} nebyl vyřešen včas.`);
    const consequences={
     diesel:()=>{effect({jzd:-8,trust:-4,heat:7});schedule("auditLeak");addNews("Nafta mizí dál. Věčný slibuje audit a fotografuje se u nádrže.","bad")},
     roof:()=>{effect({trust:-9,support:-6,citizens:-8});schedule("roofEmergency");addNews("Škola zavřela jednu třídu. Věčný přivezl plachtu a fotografa.","bad")},
     meadow:()=>{effect({business:10,citizens:-10,trust:-5});schedule("meadowProtest");addNews("Bagr vjel na poslední louku. Developer tvrdí, že jde o geodetickou diskusi.","bad")},
     paper:()=>{effect({press:-10,trust:-4});addNews("Obecní zpravodaj vydal osm stran fotografií starosty Věčného. Jedna byla omylem kritická.","bad")},
     oldfiles:()=>{effect({oldguard:8,leverage:-3});addNews("Archiv byl přestěhován na bezpečné místo. Nikdo neví kam, což potvrzuje bezpečnost.","bad")},
     water:()=>{effect({trust:-10,support:-7,heat:9});schedule("regionalInspector",1);addNews("Hygiena zavřela školní kuchyň. Věčný rozdává vodu s vlastní fotografií.","bad")},
     budget:()=>{effect({oldguard:10,trust:-5,funds:-4});addNews("Noční rozpočet prošel. Obec koupí chytrou lavičku, která neumí sedět levně.","bad")},
     debate:()=>{effect({support:-8,oldguard:10});addNews("Věčný vyhrál debatu bez soupeře a děkuje vám za konstruktivní nepřítomnost.","bad")},
     waste:()=>{effect({support:-9,citizens:-8,trust:-5});addNews("Náves zaplnil odpad. Věčný slíbil, že po volbách vyhodí viníka i pytle.","bad")},
     ballots:()=>{effect({support:-10,officials:-7,heat:10});addNews("Část hlasovacích lístků neobsahuje vaše jméno. Tiskárna se omlouvá všem kandidátům kromě vás.","bad")}
    };consequences[id]?.();
   }
  }
 });
 state.opponent.momentum=clamp(state.opponent.momentum+4+Math.max(0,state.factions.oldguard/20)-Math.max(0,state.factions.citizens/35),0,100);
 const moves=[];
 if(state.opponent.momentum>55&&rng()<.45)moves.push("anonymousLeaflet");
 if(state.stats.heat>35&&rng()<.38)moves.push("policeInterview");
 if(state.stats.integrity<35&&rng()<.3)moves.push("leakedTape");
 if(state.day>=5&&rng()<.22)moves.push("fireBrigade");
 moves.filter(id=>!state.pendingEvents.includes(id)&&!state.flags["seen_"+id]).slice(0,1).forEach(id=>{schedule(id);state.flags["seen_"+id]=true});
 if(rng()<.35){
  const drift=pick([
   ()=>{state.factions.oldguard=clamp(state.factions.oldguard+5,-100,100);addNews("Věčný navštívil seniory a slíbil, že zachová všechno, co už dávno nefunguje.")},
   ()=>{state.stats.support=clamp(state.stats.support+(state.stats.trust>60?3:-1));addNews("Nový průzkum v hospodě má vzorek 18 lidí a chybu měření dvě piva.")},
   ()=>{state.stats.funds+=2;addNews("Na transparentní účet dorazil dar 2 000 korun od člověka s netransparentním jménem.")},
   ()=>{state.factions.citizens=clamp(state.factions.citizens+3,-100,100);addNews("Dobrovolníci opravili lavičku bez dotace. Úřad ověřuje, zda je to dovoleno.")}
  ]);drift();
 }
 factionPlanTurn();updateRivalAI();livingWorldDailyTurn();
  Object.entries(state.party).forEach(([id,p])=>{p.loyalty=clamp(p.loyalty-1);state.partyFatigue[id]=Math.max(0,(state.partyFatigue[id]||0)-(state.partyAssignment?.id===id?0:1))});decayApproaches();
 addNews(`Končí den ${state.day}. Věčný mezitím získal ${Math.round(state.opponent.momentum)} bodů politické setrvačnosti.`)
}
function chooseFinalCrisis(){
 const p=state.pendingEvents;
 if(p.includes("policeInterview")||state.stats.heat>85)return "police";
 if(Object.values(state.party).some(x=>x.loyalty<28)||Object.keys(state.party).length===0)return "betrayal";
 if(state.stats.trust>75&&state.stats.integrity>60)return "smear";
 if(state.stats.leverage>12||p.some(x=>["leakedTape","auditLeak","documentWar"].includes(x)))return "dossier";
 return "scandal";
}
function startFinale(){
 if(state.finale===0){
  state.finale=1;state.actions=99;state.phase="finale";state.currentLocation=null;state.finalCrisis=chooseFinalCrisis();
  const unresolved=state.pendingEvents.length;
  if(unresolved){
   state.pendingEvents.forEach(id=>{const e=eventById(id);if(e?.ignored)e.ignored();else effect({heat:3,support:-1})});
   log(`${unresolved} nevyřešených komplikací dorazilo až do volebního dne a každá si přinesla vlastní účet.`)
  }
  state.pendingEvents=[];state.pendingMeta={};if(!AUTOTEST)showFinaleEvent(1);
 }
}
function finalCrisisEvent(){
 const type=state.finalCrisis||"scandal";
 if(type==="police")return {title:"Ranní razie před volební místností",emoji:"🚓",text:["Policie dorazí v 6:42. Tvrdí, že načasování nesouvisí s volbami. Kamera dorazila v 6:39.","Poslední test, zda vaši kampaň řídí program, právník, nebo nejpomalejší člen družiny."],choices:[
  {label:"Otevřít dveře i dokumenty",detail:"Ztratíte kontrolu nad příběhem, ale možná ne nad důvěrou.",check:{attr:"resilience",dc:14},tags:["ethical","transparent","police"],success:makeOutcome("Prohlídka nic zásadního nenajde. Otevřenost zkazí Věčnému titulek.",{trust:8,heat:-14,integrity:8,support:3},["ethical","transparent"]),fail:makeOutcome("Policie najde dokument, který jste považoval za účet za toner.",{support:-8,heat:16,integrity:3},["police"])},
  {label:"Zablokovat vše procesní námitkou",detail:"Právně čisté do zavírací doby podatelny.",check:{attr:"intellect",dc:15},tags:["legal","power"],success:makeOutcome("Razie se odloží. Voliči si musí vybrat dřív než soud.",{support:4,heat:-5,influence:6,integrity:-3},["legal"]),fail:makeOutcome("Námitka neprojde a vypadá jako panika s paragrafem.",{support:-7,heat:13,trust:-6},["legal"])},
  {label:"Poslat policii za nejslabším spojencem",detail:"Politická odpovědnost dostane konkrétní adresu.",check:{attr:"authority",dc:13},tags:["corrupt","power"],success:makeOutcome("Kamera odjede za jiným autem. Družina pochopí, že loajalita je jednosměrná.",{support:3,heat:-9,integrity:-14,trust:-5},["corrupt","power"],()=>{const id=Object.keys(state.party)[0];if(id)delete state.party[id]}),fail:makeOutcome("Spojenec ukáže na vás dřív, než policie položí otázku.",{support:-10,heat:18,integrity:-12},["corrupt"])}
 ]};
 if(type==="betrayal")return {title:"Družina zakládá vlastní kandidátku",emoji:"🗡️",text:["V noci unikla společná fotografie vašich poradců bez vás. Ráno oznamují platformu Skutečná změna bez osobních ambicí.","Každý chce zachránit obec. Především před ostatními členy družiny."],choices:[
  {label:"Přiznat chyby a nabídnout pravomoci",detail:"Méně kontroly, více šance, že někdo zůstane.",check:{attr:"charisma",dc:14},tags:["ethical","transparent"],success:makeOutcome("Část družiny se vrátí. Poprvé však chce i rozhodovat.",{trust:8,support:5,integrity:7,influence:-3},["ethical"]),fail:makeOutcome("Omluva přichází pozdě a zní jako další taktika.",{support:-7,trust:-6},["ethical"])},
  {label:"Rozdat funkce ještě před výsledkem",detail:"Místostarosta, výbor a koordinátor koordinátorů.",check:{attr:"authority",dc:12},tags:["power","corrupt"],success:makeOutcome("Vzpoura končí pod tíhou vizitek. Koalice existuje dřív než mandáty.",{support:5,influence:9,integrity:-10,funds:-3},["power","corrupt"]),fail:makeOutcome("Slíbíte dvěma lidem stejnou funkci. Nová kandidátka dostane i program.",{support:-9,influence:-6,integrity:-8},["corrupt"])},
  {label:"Označit je za zrádce změny",detail:"Když odejdou lidé, zůstane alespoň značka.",check:{attr:"charisma",dc:13},tags:["lie","public"],success:makeOutcome("Jádro voličů se semkne. Družina se už nevrátí.",{support:6,trust:-5,integrity:-7},["lie","public"],()=>{state.party={}}),fail:makeOutcome("Všichni zrádci byli ještě včera na vašem plakátu.",{support:-10,trust:-8,integrity:-6},["lie"])}
 ]};
 if(type==="smear")return {title:"Fotografie s obálkou, kterou jste nikdy nedržel",emoji:"📸",text:["Sítě zaplaví fotografie, na níž přebíráte obálku od Holuba. Je falešná, ale výraz je politicky přesvědčivý.","Věčný nic nešíří. Jen žádá, aby se pravda vyšetřila po volbách."],choices:[
  {label:"Zveřejnit originály a časovou osu",detail:"Nudná fakta proti dokonalému obrázku.",check:{attr:"intellect",dc:13},tags:["transparent","legal"],success:makeOutcome("Daniela rozebere podvrh dřív, než se stane folklorem.",{support:6,trust:9,press:8,integrity:5},["transparent"]),fail:makeOutcome("Vysvětlení má dvanáct snímků. Fotografie jen jednu.",{support:-5,trust:1,integrity:3},["transparent"])},
  {label:"Uděláme z toho vtip",detail:"Když nejde odstranit obrázek, lze mu změnit význam.",check:{attr:"charisma",dc:12},tags:["public"],success:makeOutcome("Obálka se změní v meme a útok ztratí vážnost.",{support:8,heat:-4,trust:2},["public"]),fail:makeOutcome("Vtip potvrdí, že situaci neberete vážně.",{support:-7,trust:-5},["public"])},
  {label:"Vrátit Věčnému skutečnou fotografii",detail:"Podvrh přebijete důkazem, který kontext nepotřebuje.",check:{attr:"cunning",dc:14},tags:["power","lie"],success:makeOutcome("Poslední hodiny patří Věčného obálce, která falešná není.",{support:7,oldguard:-10,integrity:-7,leverage:-5},["power","lie"]),fail:makeOutcome("Veřejnost dostane dvě obálky a nevěří nikomu.",{support:-7,trust:-8,integrity:-6},["lie"])}
 ]};
 if(type==="dossier")return {title:"Noc dlouhých složek",emoji:"🗂️",text:["Věčný nabízí příměří: vaše složka na něj zmizí a jeho složka na vás se nikdy neobjeví.","Daniela čeká na dokumenty. Brázda na telefon. Oba tvrdí, že jde o poslední šanci zachránit obec."],choices:[
  {label:"Zveřejnit obě složky",detail:"Pravda poškodí všechny včetně vás.",check:{attr:"resilience",dc:14},tags:["ethical","transparent"],success:makeOutcome("Obec dostane celý obraz. Věčný padá a vy zůstáváte poškrábaný.",{support:4,trust:8,oldguard:-12,heat:4,integrity:7,leverage:-8},["ethical","transparent"]),fail:makeOutcome("Dokumentů je tolik, že si každý vybere vlastní pravdu.",{support:-5,trust:-3,heat:9,leverage:-5},["transparent"])},
  {label:"Vyměnit mlčení za povolební většinu",detail:"Volby rozhodnou občané. Vedení obce už vy dva.",check:{attr:"authority",dc:13},tags:["corrupt","power"],success:makeOutcome("Věčný stáhne útok a připraví židle pro novou koalici.",{support:5,influence:12,integrity:-15,oldguard:6,leverage:-6},["corrupt","power"]),fail:makeOutcome("Věčný přijme vaše mlčení a zveřejní svou složku stejně.",{support:-9,heat:14,integrity:-12,leverage:-6},["corrupt"])},
  {label:"Podstrčit složky třetí straně",detail:"Ať se pravda zveřejní sama a bez zpáteční adresy.",check:{attr:"cunning",dc:15},tags:["lie","power"],success:makeOutcome("Dokumenty explodují bez vašeho otisku. Alespoň bez viditelného.",{support:7,oldguard:-10,integrity:-8,heat:3,leverage:-7},["lie","power"]),fail:makeOutcome("Metadata obsahují jméno vaší tiskárny i domácí Wi‑Fi.",{support:-8,heat:16,integrity:-9,leverage:-6},["lie"])}
 ]};
 return {title:"Poslední skandál",emoji:"💣",text:["Dvě hodiny před uzavřením voleb se objeví dokument. Může jít o kauzu, polopravdu nebo pravdu, kterou jste chtěl vysvětlit až po vítězství.","Média čekají na jednu větu."],choices:[
  {label:"Položit všechny karty na stůl",detail:"Přiznat chyby a zveřejnit dokumenty.",check:{attr:"resilience",dc:14},tags:["ethical","transparent"],success:makeOutcome("Skandál vás zasáhne, ale nepoloží.",{support:4,trust:9,heat:-12,integrity:8,press:7},["ethical","transparent"]),fail:makeOutcome("Přiznáte víc, než dokument dokazoval.",{support:-7,trust:2,integrity:5,heat:3},["ethical"])},
  {label:"Zahladit kauzu protikauzou",detail:"Vyhraje větší složka.",check:{attr:"cunning",dc:14},tags:["power","lie"],success:makeOutcome("Věčný vysvětluje vlastní dokument a váš mizí pod ním.",{support:7,oldguard:-9,leverage:-5,integrity:-9,heat:4},["power","lie"]),fail:makeOutcome("Obě kauzy se spojí do jednoho bahna.",{support:-8,heat:15,integrity:-8,press:-6},["lie"])},
  {label:"Označit vše za útok na vesnici",detail:"Terčem není vy, ale každý správný Vejprničan.",check:{attr:"authority",dc:13},tags:["lie","public"],success:makeOutcome("Vaši podporovatelé se semknou.",{support:6,trust:-5,integrity:-7,heat:2},["lie","public"]),fail:makeOutcome("Dokument mluví konkrétně o vás, nikoli o vesnici.",{support:-9,trust:-8,integrity:-7,heat:7},["lie"])}
 ]};
}
function showFinaleEvent(stage){
 const morning={title:"Volební ráno",emoji:"🗳️",text:["Volební místnost se otevřela. Věčný vozí voliče služebním mikrobusem, který oficiálně patří kulturnímu domu.","Máte poslední možnost rozhodnout, koho mobilizujete a jakou cenu za to zaplatíte."],choices:[
  {label:"Rozeslat dobrovolníky po celé obci",detail:"Slušné a závislé na tom, zda jste si je neznechutil.",check:{attr:"charisma",dc:13},tags:["ethical","public"],success:makeOutcome("Dobrovolníci přivádějí lidi, kteří běžně volby vynechávají.",{support:8,citizens:8,trust:4,integrity:4},["ethical"]),fail:makeOutcome("Jeden dobrovolník omylem mobilizuje Věčného tetu.",{support:2,citizens:2},["ethical"])},
  {label:"Použít JZD, klub a všechny závazky",detail:"Volič dostane odvoz a konkrétní doporučení.",check:{attr:"authority",dc:12},tags:["power","corrupt"],success:makeOutcome("Autobus, traktor i klubovna pracují pro vás.",{support:11,jzd:6,oldguard:-4,integrity:-10,heat:5},["power","corrupt"]),fail:makeOutcome("Brázda pošle autobus jinam a klub si splete číslo kandidátky.",{support:-3,integrity:-7,heat:4},["corrupt"])},
  {label:"Spustit poslední digitální útok",detail:"Každý volič uvidí jinou verzi stejného přesvědčení.",check:{attr:"intellect",dc:14},tags:["lie"],success:makeOutcome("Mladí dostanou meme, rodiče školu a podnikatelé parkování.",{support:9,funds:-5,integrity:-6,heat:3},["lie"]),fail:makeOutcome("Reklama se zobrazí i Věčnému, který ji sdílí jako důkaz manipulace.",{support:-5,funds:-5,heat:8,integrity:-5},["lie"])}
 ]};
 const f=stage===1?morning:finalCrisisEvent();state.currentEvent="__final"+stage;renderEventRaw(f,stage);
}
function councilResult(vote){
 const totalSeats=15,majority=8,seats=Math.max(1,Math.min(14,Math.round(vote/100*totalSeats)));
 return {totalSeats,majority,seats,needs:Math.max(0,majority-seats)};
}
function coalitionCapacity(){
 return state.stats.influence*.28+state.stats.leverage*.75+Math.max(0,state.factions.citizens)*.08+Math.max(0,state.factions.jzd)*.07+Math.max(0,state.factions.business)*.07+Math.max(0,state.factions.officials)*.08-state.promiseSummary.broken*4-state.stats.heat*.04-state.debt*.2;
}

function allocateCoalitionPartners(playerSeats){
 const remaining=15-playerSeats,weights={
  civic:2.4+Math.max(0,state.factions.citizens)/35+Math.max(0,state.factions.press)/45+state.stats.integrity/90,
  rural:2.2+Math.max(0,state.factions.jzd)/30+Math.max(0,state.voters.jzdWorkers?.support-35)/25,
  progress:1.8+Math.max(0,state.factions.business)/28+Math.max(0,state.stats.funds)/50,
  oldguard:2.5+state.opponent.momentum/35+Math.max(0,state.factions.oldguard)/30
 };
 const total=Object.values(weights).reduce((a,b)=>a+b,0),raw={},base={};let used=0;
 for(const [id,w] of Object.entries(weights)){raw[id]=remaining*w/total;base[id]=Math.floor(raw[id]);used+=base[id]}
 Object.entries(raw).sort((a,b)=>(b[1]-base[b[0]])-(a[1]-base[a[0]])).slice(0,remaining-used).forEach(([id])=>base[id]++);
 return base;
}
function initCoalition(council,ending,roll,silent=false){
 const seats=allocateCoalitionPartners(council.seats),resources=coalitionResources();state.preCoalitionEnding={ending,roll};state.coalition={active:true,round:1,maxRounds:3,partners:{},joined:[],seats:council.seats,playerSeats:council.seats,needed:council.majority,log:[`Volby daly vašemu klubu ${council.seats} mandátů. K většině je potřeba ${council.majority}.`],contracts:[],selected:null,resources};
 for(const [id,d] of Object.entries(coalitionPartnerDefs)){let attitude=0;if(id==="civic")attitude=Math.round((state.stats.trust+state.stats.integrity)/18+state.factions.citizens/12+state.factions.press/16-state.stats.heat/25);if(id==="rural")attitude=Math.round(state.factions.jzd/9+state.stats.influence/18+(state.party.brazda?4:0)-state.stats.integrity/45);if(id==="progress")attitude=Math.round(state.factions.business/9+state.stats.funds/16+(state.party.holub?4:0)-state.stats.heat/30);if(id==="oldguard")attitude=Math.round(state.factions.oldguard/10+state.opponent.momentum/18+state.stats.leverage/22-state.stats.trust/28);state.coalition.partners[id]={seats:seats[id]||0,attitude:clamp(attitude,-10,15),joined:false,locked:false,attempts:0}}
 state.ended=false;state.phase="coalition";if(!silent)showCoalitionScreen();
}
function coalitionOfferDefs(id){const p=state.coalition.partners[id],d=coalitionPartnerDefs[id];return [
 {id:"program",label:"Programová dohoda",detail:`Přijmout část požadavku: ${d.demand}.`,resource:"credibility",cost:10,attr:"intellect",baseDc:12,tags:["legal","transparent"],contract:`Programový závazek pro ${d.name}`},
 {id:"office",label:"Funkce a rozpočet",detail:"Nabídnout výbor, rozpočtovou kapitolu a kancelář s oknem.",resource:"patronage",cost:12,attr:"authority",baseDc:13,tags:["power","contract"],contract:`Funkce a rozpočet pro ${d.name}`},
 {id:"pressure",label:"Připomenout, co na ně máte",detail:"Koalice založená na společném strachu z příloh.",resource:"pressure",cost:10,attr:"cunning",baseDc:14,tags:["power","corrupt"],contract:`Mlčení a vzájemná ochrana s ${d.name}`}
 ].map(o=>({...o,dc:clamp(o.baseDc-Math.floor(p.attitude/4),9,18)}))}
function showCoalitionScreen(){
 ["startScreen","creationScreen","gameScreen","endingScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("coalitionScreen").classList.add("active");document.querySelectorAll("#mapBtn,#saveBtn,#loadBtn").forEach(b=>b.classList.add("hidden"));renderCoalition();
}
function renderCoalition(){const c=state.coalition;if(!c?.active)return;document.getElementById("coalitionSeatScore").textContent=`${c.seats} / ${c.needed}`;document.getElementById("coalitionRoundLabel").textContent=`kolo ${c.round} z ${c.maxRounds}`;const r=c.resources;document.getElementById("coalitionResources").innerHTML=[["Důvěryhodnost",r.credibility,"program"],["Trafiky a vliv",r.patronage,"funkce"],["Tlak a složky",r.pressure,"nátlak"]].map(x=>`<div class="resource"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("");
 document.getElementById("coalitionPartners").innerHTML=Object.entries(coalitionPartnerDefs).map(([id,d])=>{const p=c.partners[id];return `<div class="partner-card ${p.joined?"joined":""} ${p.locked?"locked":""}"><span class="seats">${p.seats}</span><h3>${d.icon} ${d.name}</h3><p>${d.motto}</p><div class="tags"><span class="tag">postoj ${p.attitude>0?"+":""}${p.attitude}</span><span class="tag">${d.demand}</span></div><button class="btn small" data-partner="${id}" ${p.joined||p.locked||p.seats===0?"disabled":""}>${p.joined?"V koalici":p.locked?"Jednání ukončeno":"Jednat"}</button></div>`}).join("");document.querySelectorAll("[data-partner]").forEach(b=>b.onclick=()=>openCoalitionOffers(b.dataset.partner));
 document.getElementById("coalitionLog").innerHTML=c.log.slice().reverse().map((x,i)=>`<div class="coalition-entry ${x.includes("PŘIPOJIL")?"coalition-contract":""}">${x}</div>`).join("");const pass=document.getElementById("coalitionPass");if(pass)pass.onclick=()=>{c.log.push("Jedno kolo skončilo bez dohody. Všichni účastníci jej označili za konstruktivní.");c.round++;if(c.round>c.maxRounds)finishCoalition(false);else renderCoalition()};
}
function openCoalitionOffers(id){state.coalition.selected=id;const d=coalitionPartnerDefs[id],p=state.coalition.partners[id],offers=coalitionOfferDefs(id),box=document.getElementById("coalitionOfferPanel");box.classList.remove("hidden");box.innerHTML=`<h3>${d.icon} Jednání: ${d.name} · ${p.seats} mandátů</h3><p>${d.motto}</p><div class="offer-grid">${offers.map((o,i)=>{const have=state.coalition.resources[o.resource],blocked=have<o.cost;return `<button class="offer" data-offer="${i}" ${blocked?"disabled":""}><strong>${o.label}</strong><small>${o.detail}</small><span class="check">${metricName(o.attr)} · DC ${o.dc} · spotřeba ${o.cost} ${o.resource}${blocked?" · NEDOSTATEK":""}</span></button>`}).join("")}</div><button id="cancelCoalition" class="btn small">Zpět bez nabídky</button>`;box.querySelectorAll("[data-offer]").forEach(b=>b.onclick=()=>resolveCoalitionOffer(id,offers[+b.dataset.offer]));document.getElementById("cancelCoalition").onclick=()=>{box.classList.add("hidden");state.coalition.selected=null};}
function resolveCoalitionOffer(id,offer){const c=state.coalition,p=c.partners[id],resource=c.resources[offer.resource];p.attempts++;const attr=attributeMod(offer.attr),classBonus=classCoalitionBonus(offer.id),support=Math.floor(resource/25),roll=rand(1,20),total=roll+attr+classBonus+support,level=rollLevel(roll,total,offer.dc);c.resources[offer.resource]=Math.max(0,resource-offer.cost);const success=level==="critical"||level==="success"||level==="costly";if(success){p.joined=true;c.joined.push(id);c.seats+=p.seats;c.contracts.push({partner:id,title:offer.contract,kind:offer.id});c.log.push(`${coalitionPartnerDefs[id].name} se PŘIPOJIL: ${offer.contract}. Hod ${roll}+${attr+classBonus+support} proti ${offer.dc}.`);if(offer.id==="program")addCommitment({title:offer.contract,creditor:coalitionPartnerDefs[id].name,due:13,kind:"public",notes:"Koaliční smlouva"});else addCommitment({title:offer.contract,creditor:coalitionPartnerDefs[id].name,due:13,notes:"Koaliční smlouva"});if(level==="costly"){state.stats.influence=clamp(state.stats.influence-4);state.stats.heat=clamp(state.stats.heat+4)}}else{p.attitude-=3;p.locked=p.attempts>=2||roll===1;c.log.push(`${coalitionPartnerDefs[id].name} nabídku ODMÍTL. Hod ${roll}+${attr+classBonus+support} proti ${offer.dc}.`);if(offer.id==="pressure")state.stats.heat=clamp(state.stats.heat+7)}c.round++;document.getElementById("coalitionOfferPanel").classList.add("hidden");if(c.seats>=c.needed)return finishCoalition(true);if(c.round>c.maxRounds)return finishCoalition(false);renderCoalition();}
function finishCoalition(success){const c=state.coalition;c.active=false;state.flags.coalitionFormed=success;state.flags.coalitionPartners=[...c.joined];state.flags.coalitionContracts=[...c.contracts];state.flags.coalitionTotalSeats=c.seats;state.ended=true;document.getElementById("coalitionScreen").classList.remove("active");const vote=state.flags.vote,seats=state.flags.seats;if(success){const clean=c.contracts.filter(x=>x.kind==="program").length,dirty=c.contracts.filter(x=>x.kind!=="program").length;const ending={emoji:dirty>clean?"🪑":"🤝",title:dirty>clean?"Starosta na splátky":"Koalice s čitelným účtem",lead:`Získal jste ${vote} procent a ${seats} mandátů. Po ${c.round-1} kolech jste sestavil většinu ${c.seats} hlasů.`,story:dirty>clean?"Radu jste sestavil pomocí funkcí, ochrany a slibů, které začnou zvonit hned ráno. Vláda stojí. Cena je rozepsaná v přílohách.":"Podporu jste proměnil v programovou dohodu. Partneři mají vlastní názory a poprvé také písemné termíny. Koalice bude nepohodlná, což je možná její nejlepší vlastnost."};showEnding(ending,state.preCoalitionEnding?.roll||0)}else{const ending={emoji:"🚪",title:"Vítěz voleb bez klíčů od radnice",lead:`Získal jste ${vote} procent a ${seats} mandátů, ale po ${c.maxRounds} kolech jste většinu nesložil.`,story:"Volby daly vašemu klubu sílu. Vyjednávání ukázalo, že síla bez vztahů, funkcí nebo důvěry zůstává číslem na výsledkové tabuli. Věčný skládá zbytek rady a všem nabízí přesně to, co jste odmítl nebo už neměl."};showEnding(ending,state.preCoalitionEnding?.roll||0)}}
function finalizeElection(){
 evaluateCommitments();
 const roll=rand(1,20),breakdown=[];let forVotes=0,totalVotes=0;
 for(const [id,v] of Object.entries(voterDefs)){
  const sv=state.voters[id]||{support:v.base,turnout:v.turnout};
  const global=(state.stats.support-50)*.11+(state.stats.trust-50)*.055-(state.stats.heat-35)*.05-(state.opponent.momentum-30)*.08+(roll-10)*.1;
  let machine=0;if(state.conspiracy.joined&&state.conspiracy.resolved){if(id==="entrepreneurs")machine+=28;if(id==="jzdWorkers")machine+=22;if(id==="officials")machine+=16;if(id==="club")machine+=10;if(id==="seniors")machine+=4}if(state.conspiracy.exposed){if(id==="parents"||id==="undecided")machine+=8;if(id==="officials")machine+=5}if(state.factionPlans.oldguard?.progress>=75&&(id==="seniors"||id==="officials"))machine-=8;
  const share=clamp(sv.support+global+machine,5,88),turnout=Math.max(.18,Math.min(.95,sv.turnout+(state.stats.support-45)*.0015));
  const ballots=Math.round(v.population*turnout),ours=Math.round(ballots*share/100);forVotes+=ours;totalVotes+=ballots;breakdown.push({id,name:v.name,icon:v.icon,share:Math.round(ours/Math.max(1,ballots)*100),votes:ours,ballots});
 }
 let rawVote=Math.round(forVotes/Math.max(1,totalVotes)*100);if(state.conspiracy.exposed)rawVote+=4;if(state.conspiracy.joined&&state.conspiracy.resolved)rawVote+=7;if(state.factionPlans.oldguard?.progress>=85)rawVote-=4;if(state.factionPlans.press?.progress>=90&&!state.flags.pressSpecial)rawVote-=3;const vote=clamp(rawVote,4,72),council=councilResult(vote),capacity=coalitionCapacity();
 const coalitionFormed=council.seats>=council.majority;
 state.electionBreakdown=breakdown;state.flags.vote=vote;state.flags.seats=council.seats;state.flags.majority=council.majority;state.flags.coalitionFormed=coalitionFormed;state.flags.coalitionCapacity=Math.round(capacity);state.ended=true;
 let ending;
 if(council.seats>=council.majority&&state.flags.siloBoss)ending={emoji:"🏭",title:"Předseda představenstva Dolních Vejprnic",lead:`Získal jste ${vote} procent a ${council.seats} mandátů. Volby jen potvrdily dohodu uzavřenou dříve.`,story:"Projekt SILO má nové politické vedení. Věčný ztratil obec, Holub získal partnera a Brázda výbor. Formálně jste starosta. Prakticky předsedáte představenstvu systému, který jste měl původně odhalit."};
 else if(council.seats>=council.majority&&state.conspiracy.exposed)ending={emoji:"🔦",title:"Starosta, který otevřel SILO",lead:`Získal jste ${vote} procent a ${council.seats} mandátů po zveřejnění celé sítě.`,story:"Nafta, škola, louka i archiv se spojily do jednoho příběhu. Síť jste rozkryl, ale její lidé, smlouvy a právníci nezmizeli. První den ve funkci začíná otázkou, zda lze obec opravit bez lidí, kteří ji dosud řídili."};
 else if(council.seats>=council.majority&&state.stats.heat>90)ending={emoji:"🚓",title:"Přímá většina pod modrými majáky",lead:`Získal jste ${vote} procent a ${council.seats} z ${council.totalSeats} mandátů. Koalici nepotřebujete. Právníka ano.`,story:"Volby jste vyhrál naprosto a radu obce můžete sestavit sám. Vysoký mediální a policejní tlak však znamená, že vaše většina může brzy hlasovat také o tom, kdo vás zastoupí během výslechu. Věčný vám podporu nenabízí — nemáte ji zapotřebí."};
 else if(council.seats>=council.majority&&state.stats.integrity>=65&&state.promiseSummary.broken<=1)ending={emoji:"🕊️",title:"Starosta s vlastní většinou",lead:`Získal jste ${vote} procent a ${council.seats} z ${council.totalSeats} mandátů. Vládnete bez koalice.`,story:"Dolní Vejprnice vám daly přímou většinu. Nejtěžší quest teprve začíná: splnit sliby i poté, co už ke každému rozhodnutí nepotřebujete cizí hlas."};
 else if(council.seats>=council.majority&&state.stats.integrity<35)ending={emoji:"👑",title:"Majitel Dolních Vejprnic",lead:`Získal jste ${vote} procent a ${council.seats} mandátů. Koaliční partner by pouze zabíral židli.`,story:"JZD, podnikatelé, klub i část úřadu jsou na jedné lince. Formálně jste starosta s vlastní většinou. Prakticky jste operační systém obce s několika známými bezpečnostními chybami."};
 else if(council.seats>=council.majority)ending={emoji:"🏛️",title:"Většina bez výmluv",lead:`Získal jste ${vote} procent a ${council.seats} z ${council.totalSeats} mandátů.`,story:"Radu sestavíte bez koalice. Od této chvíle už nelze každý problém vysvětlit nepohodlným partnerem, protože nepohodlným partnerem jste především vy sám."};
 else if(council.seats>=5)ending={emoji:"🚪",title:"Největší klub za zavřenými dveřmi",lead:`Získal jste ${vote} procent a ${council.seats} mandátů, ale většinu ${council.majority} jste nesložil.`,story:"Výsledek byl silný, vztahy slabší. Věčný spojil zbytek zastupitelstva proti vám. Volby jste neprohrál u urny, ale u stolů, ke kterým jste se během kampaně odmítl nebo zapomněl posadit."};
 else if(vote>=25&&state.stats.leverage>=10)ending={emoji:"🗂️",title:"Poražený, kterého nelze obejít",lead:`Získal jste ${vote} procent a ${council.seats} mandátů, ale složky mají vyšší koaliční potenciál než křesla.`,story:"Věčný sestavuje radu. Do rána však zjistí, že bez vašich dokumentů a mlčení nebude mít klid. Koryto jste nezískal. Získal jste kohoutek."};
 else if(state.stats.integrity>=70)ending={emoji:"🌱",title:"Čestný člověk mimo radu",lead:`Získal jste ${vote} procent a ${council.seats} mandátů.`,story:"Prohrál jste, ale vytvořil jste síť občanů, novinářů a úředníků, kteří už vědí, že obec lze řídit jinak. Věčný vítězí. Tentokrát však nemá klid."};
 else ending={emoji:"📺",title:"Budoucí politický komentátor",lead:`Získal jste ${vote} procent a ${council.seats} mandátů.`,story:"V kampani jste získal nepřátele, závazky a několik výborných historek. Většinu nikoli. Okresní televize vám nabízí pravidelný prostor hodnotit chyby lidí, kteří ji sestavili."};
 if(council.seats<council.majority&&council.seats>=4){initCoalition(council,ending,roll,AUTOTEST);if(!AUTOTEST)return}
 if(!AUTOTEST)showEnding(ending,roll);
}
function renderEventRaw(f,finalStage){
 hideViews();const box=document.getElementById("eventView");box.classList.remove("hidden");
 box.innerHTML=`<div class="scene-top"><div><p class="eyebrow">FINÁLE</p><h2>${f.title}</h2><p>Volební den</p></div><div class="big">${f.emoji}</div></div><div class="scene-body">${f.text.map(p=>`<p>${p}</p>`).join("")}<div id="choiceBox" class="choices">${f.choices.map((c,i)=>choiceHtml(c,i)).join("")}</div><div id="resultBox" class="result hidden"></div></div>`;
 f.choices.forEach((c,i)=>document.getElementById(`choice${i}`).onclick=()=>{state.flags.finalChoice=f.choices[i];resolveFinalChoice(f.choices[i],finalStage)});
}
function resolveFinalChoice(choice,stage){
 if(chargeChoice(choice)===false)return;const mod=checkMod(choice),roll=rand(1,20),total=roll+mod,level=rollLevel(roll,total,choice.check.dc);
 pendingResolution={choice,roll,mod,total,level,finalStage:stage};showDice(true);
}
function applyFinalResolved(){
 const {choice,level,finalStage}=pendingResolution,out=(level==="critical"||level==="success"||level==="costly")?choice.success:choice.fail;
 let ef={...out.effects};if(level==="critical")Object.keys(ef).forEach(k=>ef[k]=Math.round(ef[k]*1.3));if(level==="costly"){const pen=costlyPenalty(choice.tags||[],"finale");for(const [k,v] of Object.entries(pen))ef[k]=(ef[k]||0)+v}if(level==="complication"&&pendingResolution.roll===1)ef.heat=(ef.heat||0)+8;
 effect(ef);registerApproach(choice.tags||[]);state.audit.rolls++;state.audit.outcomes[level]=(state.audit.outcomes[level]||0)+1;applyVoterReaction(out.tags||[],"finale",level);partyReact(out.tags||[]);out.extra?.();log(`Finále: ${choice.label}. ${out.text}`);
 const result=document.getElementById("resultBox");result.classList.remove("hidden");document.getElementById("choiceBox").classList.add("hidden");
 result.innerHTML=`<h3>${level==="critical"?"Kritický tah":level==="success"?"Tah vyšel":level==="costly"?"Tah vyšel za cenu":"Tah vytvořil komplikaci"}</h3><p>${out.text}</p><button id="nextFinal" class="btn primary">${finalStage===1?"Pokračovat ke skandálu":"Sečíst hlasy"}</button>`;
 document.getElementById("nextFinal").onclick=()=>{finalStage===1?showFinaleEvent(2):finalizeElection()};pendingResolution=null;renderAll();
}
function metricName(k){return({support:"Podpora",trust:"Důvěra",funds:"Peníze",heat:"Mediální tlak",influence:"Vliv",integrity:"Integrita",leverage:"Kompromat",debt:"Dluh",citizens:"Občané",jzd:"JZD",business:"Podnikatelé",press:"Média",oldguard:"Staré struktury",officials:"Úředníci"})[k]||k}
function choiceOdds(c){
 const counts={critical:0,success:0,costly:0,complication:0},mod=checkMod(c);
 for(let roll=1;roll<=20;roll++)counts[rollLevel(roll,roll+mod,c.check.dc)]++;
 return {clean:counts.critical+counts.success,costly:counts.costly,complication:counts.complication};
}
function choiceHtml(c,i){
 const cost=actionCost(c,eventById(state.currentEvent)),debt=cost>Math.max(0,state.stats.funds),blocked=c.requireFunds&&debt,odds=choiceOdds(c),mods=checkBreakdown(c),pen=approachPenalty(c);
 const modText=mods.length?mods.map(x=>`${x.label} ${x.val>0?"+":""}${x.val}`).join(" · "):"bez bonusu";const risk=odds.complication>=35?"high":odds.complication<=20?"low":"";
 return `<button id="choice${i}" class="choice" ${blocked?"disabled":""}><strong>${c.label}</strong><small>${c.detail}</small><span class="check">d20 + ${checkMod(c)} (${metricName(c.check.attr)}) proti ${c.check.dc}</span><span class="modline">${modText}</span><span class="risk ${risk}">čistý úspěch ${odds.clean*5} % · cena ${odds.costly*5} % · komplikace ${odds.complication*5} %${pen?` · taktika unavená −${pen}`:""}</span>${cost?`<span class="check">náklady ${cost}${blocked?" · NEMÁTE":debt?" · na politický dluh":""}</span>`:""}</button>`;
}
function showLocation(id){
 state.currentLocation=id;state.phase="location";hideViews();const l=locations[id],acts=getActivities(id),box=document.getElementById("locationView");box.classList.remove("hidden");
 box.innerHTML=`<div class="scene-top"><div><p class="eyebrow">LOKACE</p><h2>${l.name}</h2><p>${locationDesc(id)}</p></div><div class="big">${l.icon}</div></div><div class="scene-body"><h3>Co zde uděláte?</h3><div class="activity-list">${acts.map((a,i)=>`<button class="activity ${a.urgent?"urgent":""}" id="act${i}"><span>${a.icon}</span><div><strong>${a.title}</strong><small>${a.detail}${a.urgent?" · TERMÍN HOŘÍ":""}</small></div></button>`).join("")||"<p>Teď tu není nic důležitého. To je na obecní instituci neobvyklé.</p>"}</div></div>`;
 acts.forEach((a,i)=>document.getElementById(`act${i}`).onclick=()=>showEvent(a.id));
 renderAll();
}
function showEvent(id){
 if(id==="debate")return startDebate();
 state.currentEvent=id;state.phase="event";if(events[id]?.queued)state.flags["seen_"+id]=true;
 const e=eventById(id);hideViews();const box=document.getElementById("eventView");box.classList.remove("hidden");
 box.innerHTML=`<div class="scene-top"><div><p class="eyebrow">${e.kicker}</p><h2>${e.title}</h2><p>${locations[e.location]?.name||"Dolní Vejprnice"}</p></div><div class="big">${e.emoji}</div></div><div class="scene-body">${e.text().map(p=>`<p>${p}</p>`).join("")}${supportBarHtml()}<div id="choiceBox" class="choices">${e.choices.map((c,i)=>choiceHtml(c,i)).join("")}</div><div id="resultBox" class="result hidden"></div></div>`;
 bindSupportButtons();e.choices.forEach((c,i)=>document.getElementById(`choice${i}`).onclick=()=>resolveChoice(c));
 renderAll();
}
function hideViews(){["mapView","locationView","eventView"].forEach(id=>document.getElementById(id).classList.add("hidden"))}
function showMap(){
 if(state.ended)return;state.selectedSupport=null;state.phase="map";state.currentEvent=null;state.currentLocation=null;hideViews();document.getElementById("mapView").classList.remove("hidden");renderAll()
}
function renderMap(){
 const map=document.getElementById("map");map.innerHTML=Object.entries(locations).map(([id,l])=>{
  const acts=getActivities(id),urgent=acts.some(a=>a.urgent),count=acts.filter(a=>!["genericPub","genericHQ","genericJzd","genericPaper"].includes(a.id)).length;
  return `<button class="location ${urgent?"hot":""}" data-loc="${id}"><span class="ico">${l.icon}</span><strong>${l.name} ${planLocationMarker(id)}</strong><small>${locationDesc(id)}</small>${count?`<span class="badge">${count}</span>`:""}</button>`
 }).join("");
 map.querySelectorAll("[data-loc]").forEach(b=>b.onclick=()=>showLocation(b.dataset.loc))
}
function renderMetrics(){
 const s=state.stats;document.getElementById("metrics").innerHTML=[["Podpora",s.support],["Důvěra",s.trust],["Peníze",s.funds],["Dluh",state.debt],["Mediální tlak",s.heat],["Vliv",s.influence],["Integrita",s.integrity],["Kompromat",s.leverage]].map(([a,b])=>`<div class="metric"><span>${a}</span><strong>${Math.round(b)}</strong></div>`).join("");
 const morality=clamp(s.integrity),corruption=clamp((100-s.integrity)*.65+s.heat*.2+state.debt*.8);document.getElementById("soulBars").innerHTML=barHtml("Státník",morality)+barHtml("Korytizace",corruption);
}
function barHtml(label,val){return `<div class="bar-row"><div class="bar-label"><span>${label}</span><strong>${Math.round(val)}</strong></div><div class="bar"><i style="width:${clamp(val)}%"></i></div></div>`}
function renderFactions(){
 const f=state.factions;document.getElementById("factionBars").innerHTML=Object.entries({citizens:"Občané",jzd:"JZD",business:"Podnikatelé",press:"Média",oldguard:"Staré struktury",officials:"Úředníci"}).map(([id,n])=>barHtml(n,(f[id]+100)/2)).join("")
}
function renderVoters(){
 const el=document.getElementById("voterBars");if(!el)return;el.innerHTML=Object.entries(voterDefs).map(([id,v])=>{const s=state.voters[id]||{support:v.base,turnout:v.turnout};return `<div class="bar-row"><div class="bar-label"><span>${v.icon} ${v.name}</span><b>${Math.round(s.support)} % · účast ${Math.round(s.turnout*100)} %</b></div><div class="bar"><i style="width:${clamp(s.support)}%"></i></div></div>`}).join("");
}


function renderWarRoom(){
 const el=document.getElementById("warRoom");if(!el)return;const p=currentProjection(),cap=Math.round(coalitionCapacity()),major=p.seats>=p.majority;el.innerHTML=`<div class="journal-item projection"><strong>🗳️ Projekce ${p.low}–${p.high} %</strong><span>${p.seatLow}–${p.seatHigh} mandátů z 15 · střed ${p.seats}${major?" · vlastní většina":" · koaliční kapacita "+cap}</span></div><div class="war-grid"><div class="war-item"><span>NEJBLIŽŠÍ TERMÍN</span><strong>${nextDeadline()}</strong></div><div class="war-item"><span>NEJBLIŽŠÍ HROZBA</span><strong>${nextThreat()}</strong></div><div class="war-item"><span>KÓD KAMPANĚ</span><strong>${state.seed||"bez razítka"}</strong></div><div class="war-item"><span>TAKTICKÁ ÚNAVA</span><strong>${Object.entries(state.approachHeat||{}).filter(([,v])=>v>=3).map(([k,v])=>`${k} ${v}`).join(", ")||"žádná"}</strong></div><div class="war-item"><span>KOALIČNÍ KAPITÁL</span><strong>Důvěra ${coalitionResources().credibility} · Trafiky ${coalitionResources().patronage} · Tlak ${coalitionResources().pressure}</strong></div><div class="war-item"><span>TŘÍDNÍ SPECIALIZACE</span><strong>${state.classMastery?(classMasteryDefs[state.hero.classId].find(x=>x.id===state.classMastery)?.name||state.classMastery):"čeká na výběr"}</strong></div><div class="war-item counter-read"><span>SOUPEŘOVA ADAPTACE</span><strong>${rivalReadLabel()}</strong></div></div>`;
}
function renderFactionPlans(){
 const box=document.getElementById("factionPlans");if(!box)return;box.innerHTML=Object.entries(factionPlanDefs).map(([id,d])=>{const p=state.factionPlans[id];if(!p)return"";const visible=p.revealed||p.stage>0||id==="oldguard";const pending=state.pendingEvents.map(eid=>({eid,e:eventById(eid),m:state.pendingMeta[eid]})).find(x=>x.e?.id?.toLowerCase().includes(id==="oldguard"?"oldguard":id));const timer=pending?.m?` · reakce do dne ${pending.m.expiresDay}`:"";return `<div class="journal-item ${p.progress>=75?"urgent":""}"><strong>${d.icon} ${visible?d.name:"Neznámý plán"}</strong><span>${visible?`${d.owner} · ${Math.round(p.progress)} % · ${planStepText(id)}${timer}`:"Někdo v obci koordinuje kroky bez veřejného programu."}</span></div>`}).join("");
}

function renderWorldPulse(){const el=document.getElementById("worldPulse");if(!el)return;const rows=(state.worldActions||[]).slice(0,8);el.innerHTML=rows.length?rows.map(x=>`<div class="world-action ${x.type||""}"><strong>Den ${x.day} · ${x.owner}</strong><span>${x.text}</span>${x.location?`<small>${locations[x.location]?.icon||""} ${locations[x.location]?.name||x.location}</small>`:""}</div>`).join(""):"<p style='color:var(--muted)'>Svět zatím čeká na první tah. To je podezřelé.</p>"}
function renderAmbitions(){const el=document.getElementById("ambitionPanel");if(!el)return;const rows=Object.entries(state.party).map(([id,p])=>{const d=companionAmbitionDefs[id],a=state.companionAmbitions?.[id];if(!d||!a)return"";const tension=a.tension>a.progress;return `<div class="ambition-row ${tension?"tense":""}"><div class="ambition-head"><strong>${d.icon} ${p.name}</strong><span>${a.resolved?"uzavřeno":tension?"napětí roste":"agenda postupuje"}</span></div><small>${d.name}</small><div class="ambition-meter"><i style="width:${clamp(tension?a.tension:a.progress)}%"></i></div><div class="tags"><span class="tag">cíl ${Math.round(a.progress||0)}</span><span class="tag">napětí ${Math.round(a.tension||0)}</span>${a.withheldUntil>=state.day?`<span class="tag">podpora stažena</span>`:""}</div></div>`}).filter(Boolean);el.innerHTML=rows.length?rows.join(""):"<p style='color:var(--muted)'>Bez štábu nejsou osobní ambice. Jen vaše.</p>"}
function renderRivalOperation(){const el=document.getElementById("rivalOperationPanel");if(!el)return;const o=state.rivalOperation;if(!o?.id){el.innerHTML=`<div class="operation-card"><strong>🎭 Věčný zatím sbírá vzorec</strong><p>${rivalReadLabel()}</p></div>`;return}const d=rivalOperationDefs[o.id];el.innerHTML=`<div class="operation-card"><strong>${d.icon} ${o.revealed?d.name:"Neznámá operace"}</strong><p>${o.revealed?d.stages[Math.max(0,(o.stage||1)-1)]:"Soupeř koordinuje několik tahů. Přesný cíl zatím neznáte."}</p><div class="operation-track"><i style="width:${clamp(o.progress||0)}%"></i></div><span class="world-chip">fáze ${o.stage||0}/3</span><span class="world-chip">postup ${Math.round(o.progress||0)} %</span><span class="world-chip">${o.completed?"dokončena":"probíhá"}</span></div>`}

function renderConspiracy(){
 const box=document.getElementById("conspiracyPanel");if(!box)return;const c=state.conspiracy;if(!c){box.innerHTML="";return}const hints={diesel:"JZD / nafta",roof:"škola / dodatek",meadow:"louka / vlastník",archive:"radnice / archiv"};const clues=Object.entries(c.pieces||{}).map(([id,ok])=>`<span class="tag ${ok?"":"clue-missing"}">${ok?"✓":"?"} ${ok?id:hints[id]}</span>`).join("");
 box.innerHTML=`<div class="journal-item ${c.clues>=3&&!c.resolved?"urgent":""}"><strong>${c.exposed?"✅ Rozkryta":c.joined?"🤝 Jste uvnitř":c.revealed?"🕸️ Síť odhalena":"❔ Pouhé podezření"}</strong><span>${c.clues}/4 stop · ${c.resolved?"kauza uzavřena":c.clues>=4?"čeká závěrečné rozhodnutí":c.clues>=2?"jednotlivé kauzy se propojují":"zatím chybí souvislosti"}</span><div class="tags">${clues}</div></div>`;
}
function renderCommitments(){
 const el=document.getElementById("commitments");if(!el)return;const rows=state.commitments.filter(c=>c.status==="active");
 el.innerHTML=rows.length?rows.sort((a,b)=>a.due-b.due).map(c=>`<div class="journal-item ${c.due-state.day<=1?"urgent":""}"><strong>${c.kind==="public"?"📣":"🤝"} ${c.title}</strong>${c.creditor} · termín den ${c.due}${c.amount?` · hodnota ${c.amount}`:""}<div class="tags"><span class="tag">${c.kind==="public"?"veřejný slib":"soukromý dluh"}</span><span class="tag">${c.notes||"politická paměť"}</span></div></div>`).join(""):"<p style='color:var(--muted)'>Nikomu nic nedlužíte. Buď jste na začátku, nebo velmi zkušený.</p>";
}


function renderRelationships(){const el=document.getElementById("relationshipPanel");if(!el)return;const rows=Object.entries(relationshipDefs).filter(([,d])=>state.party[d.a]&&state.party[d.b]);el.innerHTML=rows.length?rows.map(([id,d])=>{const v=state.relationships?.[id]??d.base;return `<div class="relationship ${v<-20?"tense":v>25?"good":""}"><strong>${companions[d.a].icon} ${companions[d.a].name} × ${companions[d.b].name} ${companions[d.b].icon}</strong><span>${d.label} · vztah ${Math.round(v)}</span></div>`}).join(""):"<p style='color:var(--muted)'>Zatím se ve štábu nemá kdo hádat. To se obvykle rychle napraví.</p>"}
function renderParty(){
 const el=document.getElementById("partyList"),ps=Object.entries(state.party),assigned=state.partyAssignment?.id;
 el.innerHTML=ps.length?ps.map(([id,p])=>{const cs=state.companionStories?.[id],pd=companionStoryDefs[id],fat=state.partyFatigue?.[id]||0,perk=cs?.perk,mod=Math.floor(p.loyalty/22)+(state.stats.influence>=55?1:0)+(perk?2:0)-Math.floor(fat/2),dc=perk?11:12,clean=[...Array(20)].filter((_,i)=>["critical","success"].includes(rollLevel(i+1,i+1+mod,dc))).length*5;const personal=cs?.done?(cs.perk?`<span class="tag">perk: ${cs.perk}</span>`:`<span class="tag">osobní quest uzavřen</span>`):state.day>=pd?.day?`<span class="tag">osobní quest čeká</span>`:`<span class="tag">osobní quest den ${pd?.day||"?"}</span>`;const av=companionAvailability(id),amb=state.companionAmbitions?.[id];return `<div class="party-item ${p.loyalty<28?"low":p.loyalty>65?"good":""}"><strong>${p.icon} ${p.name}</strong>${p.role} · loajalita ${Math.round(p.loyalty)} · únava <span class="${fat>=3?"fatigue":""}">${fat}/4</span><div class="tags"><span class="tag">${p.mission}</span><span class="tag">čistý úspěch ${clean} %</span>${personal}${amb?`<span class="tag">agenda ${Math.round(amb.progress||0)} / napětí ${Math.round(amb.tension||0)}</span>`:""}</div><small style="color:var(--muted)">${p.missionDesc}</small>${!av.ok?`<div class="availability-note">⚠ ${av.reason}</div>`:""}<button data-dispatch="${id}" class="btn small" style="margin-top:7px;width:100%" ${state.partyUsedDay===state.day||state.partyAssignment||fat>=4||!av.ok?"disabled":""}>${assigned===id?"Na misi":fat>=4?"Potřebuje odpočinek":"Vyslat dnes"}</button></div>`}).join(""):"<p style='color:var(--muted)'>Zatím za vámi stojí jen vaše vlastní přesvědčení. To bývá dočasné.</p>";
 el.querySelectorAll("[data-dispatch]").forEach(b=>b.onclick=()=>dispatchCompanion(b.dataset.dispatch));
}
function renderJournal(){
 const active=Object.entries(state.quests).filter(([,q])=>q.status==="active").sort((a,b)=>questDeadline(a[0])-questDeadline(b[0]));
 document.getElementById("journal").innerHTML=active.length?active.map(([id,q])=>{const d=questDefs[id],left=questDeadline(id)-state.day,pressure=left<=1?"KRITICKÉ":left<=3?"NALÉHAVÉ":"AKTIVNÍ";return `<div class="journal-item ${left<=2?"urgent":""}"><strong>${d.title}</strong><span>${d.desc}</span><div class="tags"><span class="tag">${pressure}</span><span class="tag">${left>=0?left+" dnů do termínu":"po termínu"}</span><span class="tag">${locations[d.location].name}</span></div><div class="micro"><b>Pokud selže:</b> ${d.failure}</div></div>`}).join(""):"<p style='color:var(--muted)'>Všechny známé problémy jsou vyřešeny, zameteny nebo přejmenovány.</p>";
}
function renderNews(){
 document.getElementById("news").innerHTML=state.news.length?state.news.slice(0,8).map(n=>`<div class="news-item"><strong>Den ${n.day}</strong> ${n.text}</div>`).join(""):"<p style='color:var(--muted)'>Zatím se nic nestalo. Místní rozhlas to brzy napraví.</p>"
}
function renderInventory(){
 const items={megaphone:["📣 Megafon zdravého rozumu","+1 charisma"],dieselCopy:["📼 Kopie záznamu z JZD","+2 při policejních a naftových komplikacích"],blackmail:["🗂️ Složka na Brázdu","+2 k mocenským a JZD hodům"],schoolKeys:["🔑 Klíče od školy","+2 při rozhodnutích o dětech a škole"],envelope:["✉️ Obálka stability","+1 ke korupčním a smluvním hodům"],zoningDeal:["📐 Dodatek k louce","+2 na louce a u developerských smluv"],auditReport:["📑 Auditní zpráva","+2 k transparentním a právním hodům"],dossier:["🧾 Složka na Věčného","+2 k útokům a manipulaci"],ashes:["🔥 Popel právní jistoty","+2 k ničení stop a korupci"],scarf:["🧣 Klubová šála","+1 na hřišti a ve volebním finále"],program:["📜 Pět kontrolovatelných slibů","+1 k čestným tahům a ve finále"],labReport:["🧪 Rozbor vody","+1 k transparentním a právním hodům"],budgetDraft:["📕 Původní rozpočet","+1 na úřadě a při mocenských hodech"],wasteContract:["🗑️ Smlouva o svozu","+1 ke smluvním a právním hodům"],ballotProof:["🗳️ Vadný hlasovací lístek","+1 ve volebním finále"]};
 document.getElementById("inventory").innerHTML=state.items.length?state.items.map(i=>{const x=items[i]||[i,""];return `<div class="party-item"><strong>${x[0]}</strong>${x[1]}</div>`}).join(""):"<p style='color:var(--muted)'>Prázdné kapsy a několik ústních příslibů.</p>"
}
function renderHeader(){
 document.getElementById("app").classList.toggle("pixel-off",state.ui?.pixelMap===false);const pt=document.getElementById("pixelToggle");if(pt)pt.textContent=`Pixelová mapa: ${state.ui?.pixelMap===false?"vypnuta":"zapnuta"}`;
 document.getElementById("heroLabel").textContent=state.hero.name;document.getElementById("classLabel").textContent=classes[state.hero.classId].name;
 document.getElementById("avatar").textContent=classes[state.hero.classId].icon;document.getElementById("timeLabel").textContent=`Den ${state.day} · ${state.actions} akce · ${state.seed||"bez kódu"}`;
 document.getElementById("clock").textContent=`Kampaň ${Math.min(state.day,13)}/13 · zbývají ${state.actions} akce · ${dueQuestCount()} hoří`;
}
function renderAll(){if(!document.getElementById("gameScreen").classList.contains("active"))return;renderHeader();renderMetrics();renderWarRoom();renderFactions();renderVoters();renderParty();renderRelationships();renderCommitments();renderFactionPlans();renderWorldPulse();renderAmbitions();renderRivalOperation();renderConspiracy();renderJournal();renderNews();renderInventory();renderMap()}
function showDice(finalMode=false){
 const o=document.getElementById("diceOverlay"),d=document.getElementById("d20"),r=pendingResolution;o.classList.remove("hidden");document.getElementById("diceClose").classList.add("hidden");
 document.getElementById("diceTitle").textContent=`Hod na ${metricName(r.choice.check.attr)}`;document.getElementById("diceOutcome").textContent="Kostka rozhoduje, zda realita přijme váš tiskový výklad.";
 let n=0,interval=setInterval(()=>{d.textContent=1+Math.floor(Math.random()*20);if(++n>12){clearInterval(interval);d.textContent=r.roll;document.getElementById("diceFormula").textContent=`${r.roll} + ${r.mod} = ${r.total} proti obtížnosti ${r.choice.check.dc}${r.rerolled?" · bard změnil téma a přehodil":""} · ${checkBreakdown(r.choice).map(x=>`${x.label} ${x.val>0?"+":""}${x.val}`).join(", ")}`;document.getElementById("diceOutcome").textContent=r.level==="critical"?"Mimořádný úspěch. Dokonce i fakta chvíli spolupracují.":r.level==="success"?"Úspěch. Tiskové oddělení může použít slovo zvládnuto.":r.level==="costly"?"Úspěch za cenu. Cíl splněn, účet dorazí později.":"Komplikace. Příběh pokračuje novým problémem.";const b=document.getElementById("diceClose");b.classList.remove("hidden");b.onclick=()=>{o.classList.add("hidden");finalMode?applyFinalResolved():applyResolved()}}},55)
}
function showEnding(e,roll){
 ["startScreen","creationScreen","gameScreen","coalitionScreen","debateScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("endingScreen").classList.add("active");
 document.getElementById("endingEmoji").textContent=e.emoji;document.getElementById("endingTitle").textContent=e.title;document.getElementById("endingLead").textContent=e.lead;
 const groups=state.electionBreakdown.map(x=>`<div class="final-stat"><span>${x.icon} ${x.name}</span><strong>${x.share} % (${x.votes}/${x.ballots})</strong></div>`).join("");
 const planSummary=Object.entries(factionPlanDefs).map(([id,d])=>`<div class="final-stat"><span>${d.icon} ${d.name}</span><strong>${Math.round(state.factionPlans[id]?.progress||0)} %</strong></div>`).join("");const siloSummary=`<div class="final-stat"><span>🏭 Operace SILO</span><strong>${state.conspiracy.exposed?"zveřejněna":state.conspiracy.joined?"převzata":state.conspiracy.resolved?"dohodnuta":state.conspiracy.clues+"/4 stop"}</strong></div>`;const coalitionSummary=(state.flags.coalitionContracts||[]).length?`<h3>Koaliční účet</h3>${state.flags.coalitionContracts.map(x=>`<div class="final-stat"><span>${coalitionPartnerDefs[x.partner]?.icon||"🤝"} ${coalitionPartnerDefs[x.partner]?.name||x.partner}</span><strong>${x.kind==="program"?"program":"funkce / ochrana"}</strong></div>`).join("")}`:"";
 document.getElementById("endingStory").innerHTML=`<h3>Jak jste vytvořil vlastní politickou legendu</h3><p style="line-height:1.7">${e.story}</p><p><strong>Volební hod kostkou:</strong> ${roll}</p><h3>Kdo vás skutečně volil</h3>${groups}<h3>Co mezitím dělaly frakce</h3>${planSummary}${siloSummary}${coalitionSummary}<h3>Kronika</h3><p>${state.log.slice(-8).join("<br><br>")}</p>`;
 const s=state.stats;document.getElementById("finalStats").innerHTML=[["Výsledek",state.flags.vote+" %"],["Mandáty",state.flags.seats+" / 15"],["Koaliční většina",state.flags.coalitionFormed&&state.flags.coalitionTotalSeats?state.flags.coalitionTotalSeats+" / 15":"—"],["Většina",state.flags.seats>=state.flags.majority?"Ano, bez koalice":state.flags.coalitionFormed?"Ano, koaliční":"Ne"],["Splněné závazky",state.promiseSummary.fulfilled],["Porušené závazky",state.promiseSummary.broken],["Dluh",state.debt],["Podpora před volbami",s.support],["Důvěra",s.trust],["Integrita",s.integrity],["Mediální tlak",s.heat],["Vliv",s.influence],["Tah Věčného",Math.round(state.opponent.momentum)],["Kód kampaně",state.seed],["Hody",state.audit.rolls]].map(([a,b])=>`<div class="final-stat"><span>${a}</span><strong>${b}</strong></div>`).join("");
}
function newGame(){
 state=deep(baseState);state.hero.name=document.getElementById("heroName").value.trim()||"Bohuslav Korytář";state.seed=`VEP-${hashSeed(state.hero.name+Date.now()).toString(36).slice(-6).toUpperCase()}`;state.rngState=hashSeed(state.seed);state.hero.classId=selectedClass;state.hero.origin=document.getElementById("origin").value;state.hero.attrs={...classes[selectedClass].attrs};
 if(state.hero.origin==="idealist"){effect({trust:5,integrity:10,funds:-2})}
 if(state.hero.origin==="ambitious"){effect({influence:6,support:3,integrity:-4})}
 if(state.hero.origin==="revenge"){effect({leverage:4,authority:1,integrity:-5});state.hero.attrs.authority++}
 initQuests();initVoters();initSurprises();initLivingWorld();state.news=[{day:1,text:"Starosta Věčný hospitalizován po obecní zabijačce. Místní rozhlas přeje brzký návrat, ale neupřesňuje do funkce.",type:"normal"}];
 ["startScreen","creationScreen","endingScreen","coalitionScreen","debateScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("gameScreen").classList.add("active");
 document.querySelectorAll("#saveBtn,#loadBtn,#restartBtn,#exportBtn,#mapBtn").forEach(b=>b.classList.remove("hidden"));
 showEvent("intro");
}
function normalizeState(){state.seed=state.seed||`VEP-${hashSeed(state.hero?.name||"migrace").toString(36).slice(-6).toUpperCase()}`;state.rngState=state.rngState||hashSeed(state.seed);state.approachHeat=state.approachHeat||{};state.lastApproaches=state.lastApproaches||[];state.partyFatigue=state.partyFatigue||{};state.audit=state.audit||{rolls:0,outcomes:{critical:0,success:0,costly:0,complication:0},locations:{},approaches:{},autosaves:0};state.audit.outcomes=state.audit.outcomes||{critical:0,success:0,costly:0,complication:0};state.audit.locations=state.audit.locations||{};state.audit.approaches=state.audit.approaches||{};state.relationships=state.relationships||{};for(const [id,d] of Object.entries(relationshipDefs))if(state.relationships[id]===undefined)state.relationships[id]=d.base;state.conflictStates=state.conflictStates||{};for(const id of Object.keys(conflictDefs))state.conflictStates[id]=state.conflictStates[id]||{queued:false,resolved:false,path:null,aftermath:false};state.companionSupportUsed=state.companionSupportUsed||{};state.selectedSupport=null;state.coalition=state.coalition||{active:false,round:0,maxRounds:3,partners:{},joined:[],seats:0,log:[],contracts:[],resources:{}};state.classMastery=state.classMastery||null;state.classAbilityUsed=!!state.classAbilityUsed;state.debate=state.debate||{active:false};state.rivalAI=state.rivalAI||{adaptation:null,reads:{},counters:0,lastCounterDay:0,revealed:false};state.rivalAI.reads=state.rivalAI.reads||{};state.worldActions=state.worldActions||[];state.factionActionCooldowns=state.factionActionCooldowns||{};state.companionAmbitions=state.companionAmbitions||{};for(const id of Object.keys(companionAmbitionDefs))state.companionAmbitions[id]=state.companionAmbitions[id]||{progress:18,tension:0,resolved:false,path:null,queued:false,withheldUntil:0,lastActionDay:0};state.echoes=state.echoes||[];state.echoHistory=state.echoHistory||[];state.rivalOperation=state.rivalOperation||{};state.ui=state.ui||{pixelMap:true};state.version="0.14"}
function autoSave(){if(state.phase!=="map"||state.ended)return;normalizeState();state.audit.autosaves++;const raw=JSON.stringify(state);try{localStorage.setItem("koryto_v014_auto",raw)}catch(e){memorySave=raw}}
function save(){if(state.phase!=="map")return alert("Ukládat lze jen na mapě. Rozhodnutí uprostřed věty se v politice ukládají jinak.");normalizeState();const raw=JSON.stringify(state);try{localStorage.setItem("koryto_v014",raw)}catch(e){memorySave=raw}addNews("Hra uložena. Na rozdíl od obecních smluv ji lze znovu najít.");renderAll()}
function load(){let raw=memorySave;try{raw=localStorage.getItem("koryto_v014")||localStorage.getItem("koryto_v014_auto")||localStorage.getItem("koryto_v013")||localStorage.getItem("koryto_v013_auto")||localStorage.getItem("koryto_v012")||localStorage.getItem("koryto_v012_auto")||localStorage.getItem("koryto_v011")||localStorage.getItem("koryto_v011_auto")||localStorage.getItem("koryto_v010")||localStorage.getItem("koryto_v091")||localStorage.getItem("koryto_v09")||raw}catch(e){}if(!raw)return alert("Žádná uložená hra nebyla nalezena.");state=JSON.parse(raw);normalizeState();state.commitments=state.commitments||[];state.voters=state.voters&&Object.keys(state.voters).length?state.voters:(()=>{const x={};for(const [id,v] of Object.entries(voterDefs))x[id]={support:v.base,turnout:v.turnout};return x})();state.debt=state.debt||0;if(!state.factionPlans||!Object.keys(state.factionPlans).length){const saved=deep(state);initLivingWorld();state.factionPlans=state.factionPlans||saved.factionPlans;state.conspiracy=state.conspiracy||saved.conspiracy;state.companionStories=state.companionStories||saved.companionStories;state.worldChanges=state.worldChanges||saved.worldChanges}state.partyAssignment=null;state.partyUsedDay=0;["startScreen","creationScreen","endingScreen","coalitionScreen","debateScreen"].forEach(id=>document.getElementById(id).classList.remove("active"));document.getElementById("gameScreen").classList.add("active");document.querySelectorAll("#saveBtn,#loadBtn,#restartBtn,#exportBtn,#mapBtn").forEach(b=>b.classList.remove("hidden"));showMap()}
function restart(){if(confirm("Opravdu zahodit rozehranou kariéru? Politické důsledky se běžně mažou hůř."))location.reload()}
function exportLog(){const text=`KORYTO v0.14 – KRONIKA\nKód kampaně: ${state.seed}\n${state.hero.name}, ${classes[state.hero.classId].name}\n\n${state.log.join("\n\n")}\n\nStav: ${JSON.stringify(state.stats,null,2)}\n\nAudit: ${JSON.stringify(state.audit,null,2)}`;const b=new Blob([text],{type:"text/plain;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="koryto_kronika.txt";a.click();URL.revokeObjectURL(a.href)}
function setup(){
 document.getElementById("startBtn").onclick=()=>{document.getElementById("startScreen").classList.remove("active");document.getElementById("creationScreen").classList.add("active")};
 document.getElementById("classGrid").innerHTML=Object.entries(classes).map(([id,c])=>`<button class="class-card ${id===selectedClass?"selected":""}" data-class="${id}"><span>${c.icon}</span><strong>${c.name}</strong><small>${c.desc}</small></button>`).join("");
 document.querySelectorAll("[data-class]").forEach(b=>b.onclick=()=>{selectedClass=b.dataset.class;document.querySelectorAll("[data-class]").forEach(x=>x.classList.toggle("selected",x.dataset.class===selectedClass))});
 document.getElementById("confirmBtn").onclick=newGame;document.getElementById("mapBtn").onclick=showMap;document.getElementById("endDayBtn").onclick=skipDay;document.getElementById("pixelToggle").onclick=()=>{state.ui=state.ui||{};state.ui.pixelMap=!state.ui.pixelMap;document.getElementById("app").classList.toggle("pixel-off",!state.ui.pixelMap);document.getElementById("pixelToggle").textContent=`Pixelová mapa: ${state.ui.pixelMap?"zapnuta":"vypnuta"}`;};document.getElementById("saveBtn").onclick=save;document.getElementById("loadBtn").onclick=load;document.getElementById("restartBtn").onclick=restart;document.getElementById("exportBtn").onclick=exportLog;document.getElementById("againBtn").onclick=()=>location.reload();
}
function simulateStrategy(strategy="mixed",runSeed=0){
 state=deep(baseState);state.seed=`SIM-${strategy}-${String(runSeed)}`;state.rngState=hashSeed(state.seed);state.hero={name:"Test",classId:strategy==="corrupt"?"rogue":strategy==="ideal"?"paladin":strategy==="legal"?"mage":"bard",origin:strategy==="ideal"?"idealist":"ambitious",attrs:{}};state.hero.attrs={...classes[state.hero.classId].attrs};initQuests();initVoters();initSurprises();initLivingWorld();normalizeState();state.flags.introDone=true;completeQuest("register");let guard=0,route=[];
 const scoreChoice=(c)=>{const t=c.tags||[];if(strategy==="ideal")return (t.includes("ethical")?5:0)+(t.includes("transparent")?4:0)-(t.includes("corrupt")?8:0)-(t.includes("lie")?3:0);if(strategy==="corrupt")return (t.includes("corrupt")?6:0)+(t.includes("power")?3:0)+(t.includes("contract")?3:0)-(t.includes("ethical")?2:0);if(strategy==="legal")return (t.includes("legal")?6:0)+(t.includes("transparent")?3:0);if(strategy==="populist")return (t.includes("public")?6:0)+(t.includes("lie")?2:0);return rng()*4};
 while(!state.ended&&guard++<90){
  unlockByDay();
  if(state.day>=14){finalizeElection();break}
  const locs=Object.keys(locations).map(id=>({id,acts:getActivities(id)})).filter(x=>x.acts.length);
  if(!locs.length){endDay();continue}
  const urgent=locs.flatMap(l=>l.acts.filter(a=>a.urgent).map(a=>({...a,loc:l.id})));
  const a=urgent.length?urgent.sort(()=>rng()-.5)[0]:(()=>{const l=pick(locs);return {...pick(l.acts),loc:l.id}})();
  state.currentLocation=a.loc;state.currentEvent=a.id;route.push(a.id);
  if(a.id==="debate"){simulateDebate(strategy);state.flags["done_debate"]=true;consumeAction();continue}
  const e=eventById(a.id),c=[...e.choices].sort((x,y)=>scoreChoice(y)-scoreChoice(x))[0];
  if(chargeChoice(c)===false){consumeAction();continue}
  const mod=checkMod(c);let roll=rand(1,20),level=rollLevel(roll,roll+mod,c.check.dc);
  if((level==="costly"||level==="complication")&&state.hero.classId==="bard"&&c.tags?.includes("public")&&state.abilityUsedDay!==state.day){roll=rand(1,20);level=rollLevel(roll,roll+mod,c.check.dc);state.abilityUsedDay=state.day}
  const out=(level==="critical"||level==="success"||level==="costly")?c.success:c.fail;let ef={...out.effects};
  if(e.repeatable){const uses=state.genericUses[e.id]||0,mult=[1,.62,.35][uses]||.2;Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.max(1,Math.round(ef[k]*mult))});if(uses>0)ef.heat=(ef.heat||0)+uses;state.genericUses[e.id]=uses+1;state.cooldowns[e.id]=state.day+2}
  if(level==="critical"){Object.keys(ef).forEach(k=>ef[k]=Math.round(ef[k]*1.35));ef.support=(ef.support||0)+2}
  if(level==="costly"){Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.max(1,Math.round(ef[k]*.68))});const pen=costlyPenalty(c.tags||[],e.id);for(const[k,v]of Object.entries(pen))ef[k]=(ef[k]||0)+v}
  if(level==="complication"&&roll===1){Object.keys(ef).forEach(k=>{if(ef[k]>0)ef[k]=Math.floor(ef[k]*.3);else ef[k]=Math.round(ef[k]*1.25)});ef.heat=(ef.heat||0)+5}
  if(state.hero.classId==="rogue"&&c.tags?.includes("corrupt")&&ef.funds>0)ef.funds+=3;
  effect(ef);registerApproach(c.tags||[]);state.audit.rolls++;state.audit.outcomes[level]=(state.audit.outcomes[level]||0)+1;state.audit.locations[state.currentLocation]=(state.audit.locations[state.currentLocation]||0)+1;applyVoterReaction(out.tags||c.tags||[],e.id,level);partyReact(out.tags||c.tags||[]);out.extra?.();if(e.id.endsWith("Personal")){const cid=e.id.replace("Personal","");if(state.companionStories[cid])state.companionStories[cid].done=true}createCommitmentFromChoice(e.id,c,level);trackLivingWorld(e.id,c,level);updateCompanionAmbitions(e.id,c,level);if(echoEventDefs[e.id])registerEcho(e.id,{tags:c.tags||[],level});e.after?.();
  if(!e.repeatable&&!e.queued)state.flags["done_"+e.id]=true;
  if(e.queued||state.pendingEvents.includes(e.id)){state.pendingEvents=state.pendingEvents.filter(x=>x!==e.id);delete state.pendingMeta[e.id];state.flags["resolved_"+e.id]=true}
  consumeAction();
 }
 if(state.coalition?.active){for(const id of ["civic","rural","progress","oldguard"]){if(state.coalition.seats>=state.coalition.needed||state.coalition.round>state.coalition.maxRounds)break;const p=state.coalition.partners[id];if(!p||p.seats===0||p.locked||p.joined)continue;const offers=coalitionOfferDefs(id),pref=strategy==="ideal"||strategy==="legal"?offers[0]:strategy==="corrupt"?offers[2]:offers[1];const resource=state.coalition.resources[pref.resource];if(resource<pref.cost)continue;state.coalition.resources[pref.resource]=Math.max(0,resource-pref.cost);const attr=attributeMod(pref.attr),bonus=classCoalitionBonus(pref.id)+Math.floor(resource/25),roll=rand(1,20),ok=roll+attr+bonus>=pref.dc;if(ok){p.joined=true;state.coalition.joined.push(id);state.coalition.seats+=p.seats}else p.locked=true;state.coalition.round++}state.flags.coalitionFormed=state.coalition.seats>=state.coalition.needed;state.ended=true}
 return {strategy,ended:state.ended,vote:state.flags.vote||0,seats:state.flags.seats||0,coalition:!!state.flags.coalitionFormed,debate:state.flags.debateGrade||"none",mastery:state.classMastery||"none",rivalCounters:state.rivalAI?.counters||0,worldActions:(state.worldActions||[]).length,ambitionsResolved:Object.values(state.companionAmbitions||{}).filter(x=>x.resolved).length,echoesTriggered:(state.echoes||[]).filter(x=>x.triggered).length,rivalOperationStage:state.rivalOperation?.stage||0,coalitionPartners:(state.coalition?.joined||[]).length,conflicts:Object.values(state.conflictStates||{}).filter(x=>x.resolved).length,heat:state.stats.heat,debt:state.debt,broken:state.promiseSummary.broken||0,clues:state.conspiracy?.clues||0,siloResolved:!!state.conspiracy?.resolved,personal:Object.values(state.companionStories||{}).filter(x=>x.done).length,planMax:Math.max(...Object.values(state.factionPlans||{}).map(x=>x.progress||0),0),outcomes:{...state.audit.outcomes},route:route.join("|")};
}
function runAutotest(){
 const strategies=["ideal","corrupt","legal","populist","mixed"],rows=[];for(const s of strategies)for(let i=0;i<120;i++)rows.push(simulateStrategy(s,i));
 const lines=["AUTOTEST KORYTO v0.14",`completed=${rows.filter(r=>r.ended).length}/${rows.length}`,`unique_routes=${new Set(rows.map(r=>r.route)).size}`];
 for(const s of strategies){const x=rows.filter(r=>r.strategy===s),avg=k=>(x.reduce((a,b)=>a+b[k],0)/x.length).toFixed(1);lines.push(`${s}: avg_vote=${avg("vote")} min=${Math.min(...x.map(r=>r.vote))} max=${Math.max(...x.map(r=>r.vote))} avg_heat=${avg("heat")} avg_debt=${avg("debt")} avg_broken=${avg("broken")} avg_clues=${avg("clues")} silo_resolved=${x.filter(r=>r.siloResolved).length}/${x.length} avg_personal=${avg("personal")} avg_plan_max=${avg("planMax")} coalition_rate=${x.filter(r=>r.coalition).length}/${x.length} avg_coalition_partners=${avg("coalitionPartners")} avg_conflicts=${avg("conflicts")} debate_wins=${x.filter(r=>r.debate==="win"||r.debate==="dominant").length}/${x.length} mastery=${x.filter(r=>r.mastery!=="none").length}/${x.length} avg_rival_counters=${avg("rivalCounters")} avg_world_actions=${avg("worldActions")} avg_ambitions_resolved=${avg("ambitionsResolved")} avg_echoes=${avg("echoesTriggered")} avg_rival_op_stage=${avg("rivalOperationStage")}`)}
 document.body.innerHTML=`<pre class="autotest">${lines.join("\n")}</pre>`;
}
if(AUTOTEST)runAutotest();else setup();
