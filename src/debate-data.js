"use strict";
(() => {
  const VERSION = "0.14.4 TEST.6";
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


  globalThis.KorytoDebateData = { VERSION, classMasteryDefs, debateCardDefs, rivalMoveDefs, rivalCounterDefs };
})();
