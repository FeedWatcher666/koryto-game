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
    perk: "Při veřejném vystoupení získává výhodu. Mediální řešení často dostává třídní bonus.",
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
    label: "Přečíst jízdní řád a poznámky pod čarou",
    detail: "Text byl aktualizován naposledy v době, kdy autobus skutečně jezdil.",
    attribute: "intellect",
    dc: 11,
    disadvantage: {classes: ["bard"]},
    disadvantageLabels: {classes: {bard: "Drobné písmo je přirozený predátor mediálního barda."}}
  },
  {
    id: "follow-suit",
    label: "Sledovat muže s deskami a výrazem veřejné zakázky",
    detail: "Vypadá, že někam patří. V obci je to podezřelé.",
    attribute: "luck",
    dc: 12,
    advantage: {origins: ["revenge"]},
    disadvantage: {origins: ["idealist"]},
    advantageLabels: {origins: {revenge: "Navrátilec pozná člověka, který doufá, že si ho nikdo nepamatuje."}},
    disadvantageLabels: {origins: {idealist: "Idealista předpokládá, že desky obsahují zákonný postup."}}
  }
];

export const REGISTRATION_CHECKS = [
  {
    id: "public-speech",
    label: "Ohlásit kandidaturu před čekárnou",
    detail: "Veřejnost tvoří tři senioři, dítě a člověk, který přišel kvůli Czech POINTu.",
    attribute: "charisma",
    dc: 12,
    classBonus: {bard: 2},
    advantage: {classes: ["bard"], companions: ["bohumil"]},
    advantageLabels: {
      classes: {bard: "Bard ví, že každá čekárna je studio s horším osvětlením."},
      companions: {bohumil: "Bohumil zná publikum i jeho názor na starostovu poslední zabijačku."}
    }
  },
  {
    id: "find-paragraph",
    label: "Najít správný paragraf ve formuláři",
    detail: "Formulář má sedm stran. Potřebujete tu osmou.",
    attribute: "intellect",
    dc: 13,
    classBonus: {paladin: 1},
    advantage: {companions: ["marie"]},
    advantageLabels: {companions: {marie: "Marie ví, že správný formulář je vždy za špatným formulářem."}}
  },
  {
    id: "backroom-deal",
    label: "Domluvit registraci přes správného nesprávného člověka",
    detail: "Rychlé, účinné a obtížně vysvětlitelné na transparentním účtu.",
    attribute: "luck",
    dc: 11,
    dirty: true,
    classBonus: {rogue: 2},
    advantage: {classes: ["rogue"]},
    disadvantage: {origins: ["idealist"], companions: ["marie"]},
    advantageLabels: {classes: {rogue: "Rogue pozná dveře, které nemají být v organizačním schématu."}},
    disadvantageLabels: {
      origins: {idealist: "Idealista stále hledá kolonku pro čestný úplatek."},
      companions: {marie: "Marie odmítá nazývat obcházení zákona administrativním zrychlením."}
    },
    blockedClasses: ["paladin"]
  }
];

export const OUTCOMES = {
  critical: {label: "Kritický úspěch", tone: "gold", description: "Výsledek je lepší, než si obec zaslouží."},
  success: {label: "Úspěch", tone: "green", description: "Plán funguje a zatím není třeba nic popírat."},
  costly: {label: "Úspěch za cenu", tone: "amber", description: "Dostali jste, co jste chtěli. Někdo si to zapsal."},
  complication: {label: "Komplikace", tone: "red", description: "Příběh pokračuje, ale problém už má vaše telefonní číslo."}
};
