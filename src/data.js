export const VERSION = "0.20.0-clean-test.6";

export const ATTRIBUTES = [
  ["charisma", "Charisma", "Přesvědčit lidi, že váš nápad byl vždycky jejich."],
  ["intellect", "Inteligence", "Najít paragraf nebo chybu v cizím paragrafu."],
  ["authority", "Autorita", "Přimět místnost ztichnout dřív než fakta."],
  ["media", "Mediální talent", "Proměnit nehodu v přijatelný titulek."],
  ["morality", "Morálka", "Odolat řešení, které potřebuje skartovačku."],
  ["luck", "Štěstí", "Potkat správného člověka místo jeho příbuzného."]
];

export const ORIGINS = {
  idealist: {
    name: "Místní idealista",
    description: "Věříte, že obec lze napravit. Obec zatím věří, že vás lze unavit.",
    modifiers: {morality: 2, charisma: 1, luck: -1}
  },
  ambitious: {
    name: "Okresní kariérista",
    description: "Přijeli jste pomoci. Především své budoucí vizitce.",
    modifiers: {media: 2, authority: 1, morality: -1}
  },
  revenge: {
    name: "Navrátilec s účtem",
    description: "Pamatujete si všechno. Zejména to, co ostatní považovali za promlčené.",
    modifiers: {luck: 2, intellect: 1, morality: -1}
  }
};

export const CLASSES = {
  bard: {
    name: "Mediální bard",
    icon: "🎙️",
    description: "Z neúspěchu udělá příběh. Bohužel často s vlastním jménem v titulku.",
    base: {charisma: 4, intellect: 2, authority: 3, media: 5, morality: 2, luck: 3},
    perk: "Při veřejném vystoupení získává výhodu. Jednou za scénu může změnit komplikaci na úspěch za cenu.",
    weakness: "Při čtení drobného písma hází s nevýhodou. Každá ostuda zvyšuje mediální tlak o 2."
  },
  paladin: {
    name: "Aktivistický paladin",
    icon: "🛡️",
    description: "Přísahá na transparentnost. Obec přísahá, že nic neslyšela.",
    base: {charisma: 3, intellect: 3, authority: 4, media: 2, morality: 5, luck: 2},
    perk: "Čestné řešení má výhodu, pokud jste v této kapitole nepřijali politický dluh.",
    weakness: "Nemůže zvolit řešení označené jako otevřený podvod."
  },
  rogue: {
    name: "Zákulisní rogue",
    icon: "🗝️",
    description: "Nezná správný vchod. Zná ale vchod, který se nezapisuje do knihy návštěv.",
    base: {charisma: 3, intellect: 4, authority: 2, media: 2, morality: 1, luck: 5},
    perk: "Při sledování lidí a použití zadního vchodu získává výhodu. Před hodem může odhalit skrytý modifikátor.",
    weakness: "Při kritické jedničce získá navíc vydíratelnost."
  }
};

export const COMPANIONS = {
  marie: {
    name: "Marie Čistá",
    icon: "📚",
    role: "Bývalá úřednice",
    description: "Zná předpisy, zásuvky a rozdíl mezi kopií a kopií určenou ke ztrátě.",
    bonus: {intellect: 2, morality: 1},
    demand: "Nesnáší otevřené lhaní občanům. Při hledání paragrafu dává výhodu."
  },
  bohumil: {
    name: "Bohumil Tichý",
    icon: "🍺",
    role: "Hospodský diplomat",
    description: "Ví, kdo s kým nemluví a kdo s kým nemluví jen před manželkou.",
    bonus: {charisma: 2, luck: 1},
    demand: "Nechce, aby hospoda přišla o obecní zakázky. Při veřejném projevu dává výhodu."
  },
  radek: {
    name: "Radek Šroub",
    icon: "🔧",
    role: "Údržbář bývalého JZD",
    description: "Opravuje stroje, které obec prodala, ale zapomněla odvézt. Zná haly, lidi i vypnuté kamery.",
    bonus: {authority: 1, intellect: 1},
    demand: "Nenechá pracovníky zaplatit za cizí tunel. Při pohybu v areálu JZD dává výhodu."
  }
};

export const FIRST_CHECKS = [
  {
    id: "ask-local",
    label: "Zeptat se muže čekajícího od roku 1998",
    detail: "Možná čeká na autobus. Možná na kanalizaci.",
    attribute: "charisma",
    dc: 10,
    advantage: {classes: ["bard"]},
    advantageLabels: {classes: {bard: "Mediální bard umí zahájit rozhovor dřív než protistrana uteče."}}
  },
  {
    id: "read-board",
    label: "Rozluštit obecní vývěsku",
    detail: "Pět šipek, tři razítka a jedna příloha bez přílohy.",
    attribute: "intellect",
    dc: 11,
    advantage: {origins: ["revenge"]},
    disadvantage: {classes: ["bard"]},
    advantageLabels: {origins: {revenge: "Navrátilec si pamatuje, kam obec schovává důležité přílohy."}},
    disadvantageLabels: {classes: {bard: "Mediální bard rozezná titulek. Drobné písmo už méně."}}
  },
  {
    id: "follow-folders",
    label: "Následovat lidi s deskami",
    detail: "Metoda bez dat, zato s tradicí.",
    attribute: "luck",
    dc: 12,
    advantage: {classes: ["rogue"]},
    disadvantage: {origins: ["idealist"]},
    advantageLabels: {classes: {rogue: "Rogue bezpečně pozná člověka, který používá vedlejší vchod."}},
    disadvantageLabels: {origins: {idealist: "Idealista předpokládá, že lidé s deskami jdou za veřejným zájmem."}}
  }
];

export const REGISTRATION_CHECKS = [
  {
    id: "public-speech",
    label: "Vyhlásit kandidaturu rovnou ve vestibulu",
    detail: "Veřejnost jako beranidlo. A kamera místního hasiče jako svědek.",
    attribute: "charisma",
    dc: 13,
    classBonus: {bard: 2},
    companionBonus: {bohumil: 1},
    advantage: {classes: ["bard"], companions: ["bohumil"]},
    advantageLabels: {
      classes: {bard: "Bard promění vestibul v pódium."},
      companions: {bohumil: "Bohumil přivedl publikum, které už má názor i žízeň."}
    }
  },
  {
    id: "find-paragraph",
    label: "Najít paragraf, který úřad přehlédl",
    detail: "Marie tvrdí, že správný formulář existuje. Jen je veden pod názvem kotelna.",
    attribute: "intellect",
    dc: 13,
    classBonus: {paladin: 1, rogue: 1},
    companionBonus: {marie: 2},
    honest: true,
    advantage: {companions: ["marie"]},
    advantageLabels: {companions: {marie: "Marie zná číslo zásuvky i člověka, který tvrdí, že neexistuje."}}
  },
  {
    id: "back-door",
    label: "Použít služební vchod a cizí razítko",
    detail: "Rychlé, účinné a později velmi dobře dohledatelné.",
    attribute: "luck",
    dc: 12,
    classBonus: {rogue: 2},
    companionBonus: {bohumil: 1},
    dirty: true,
    advantage: {classes: ["rogue"]},
    disadvantage: {origins: ["idealist"]},
    advantageLabels: {classes: {rogue: "Zákulisní rogue pozná neoficiální vchod podle toho, že je lépe udržovaný."}},
    disadvantageLabels: {origins: {idealist: "Idealistovi se při držení cizího razítka třese ruka i svědomí."}}
  }
];

export const OUTCOMES = {
  critical: {
    title: "Kritický triumf",
    label: "Kritická dvacítka",
    description: "Dosáhli jste víc, než bylo rozumné požadovat. Obec to bude dlouho vysvětlovat.",
    tone: "gold"
  },
  success: {
    title: "Čistý úspěch",
    label: "Úspěch",
    description: "Plán funguje a účet zatím nikdo nepřinesl.",
    tone: "green"
  },
  costly: {
    title: "Úspěch za cenu",
    label: "Cena",
    description: "Dostali jste, co jste chtěli. Někdo si ale zapsal vaše jméno.",
    tone: "amber"
  },
  complication: {
    title: "Komplikace",
    label: "Neúspěch, který pokračuje",
    description: "Příběh nekončí. Jen se stává dražší, osobnější a směšnější.",
    tone: "red"
  }
};
