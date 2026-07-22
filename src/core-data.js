"use strict";
(() => {
  const VERSION = "0.14.4 TEST.2";
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

  globalThis.KorytoCoreData = { VERSION, classes, locations, voterDefs, baseState };
})();
