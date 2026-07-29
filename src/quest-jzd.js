export const JZD_ITEMS = {
  recorder: {
    name: "Kazetový diktafon",
    icon: "📼",
    description: "Nahrává všechno včetně okamžiku, kdy tvrdíte, že nenahráváte.",
    perk: "Pomáhá při zveřejnění důkazů a rozhovorech na kameru."
  },
  archiveKey: {
    name: "Klíč od archivu",
    icon: "🗝️",
    description: "Nikdo neví, od čeho je. Proto otevírá překvapivě mnoho obecních dveří.",
    perk: "Pomáhá při vstupu do kanceláře a hledání účetních stop."
  },
  thermos: {
    name: "Termoska odborového čaje",
    icon: "🫖",
    description: "Silný, sladký a politicky nezařaditelný. Přesně jako noční směna.",
    perk: "Pomáhá získat pracovníky a uklidnit hlídače."
  }
};

export const JZD_APPROACH_CHECKS = [
  {
    id: "official-gate",
    label: "Vstoupit hlavní branou jako veřejná kontrola",
    detail: "Reflexní vesta, pevný krok a věta: ‚Jdu z pověření občanů.‘ Občané o tom zatím nevědí.",
    attribute: "authority",
    dc: 13,
    honest: true,
    classBonus: {paladin: 1},
    companionBonus: {radek: 1},
    advantage: {classes: ["paladin"], companions: ["radek"]},
    advantageLabels: {
      classes: {paladin: "Paladin dokáže vyslovit slovo kontrola tak, že lidé začnou hledat šanon."},
      companions: {radek: "Radek zná jména lidí na vrátnici i jejich neproplacené přesčasy."}
    }
  },
  {
    id: "archive-door",
    label: "Vzít to přes kancelář a starý archiv",
    detail: "Dveře nesou ceduli SKLAD NEPOUŽÍVAT. V obci je to spolehlivé označení důležité místnosti.",
    attribute: "intellect",
    dc: 12,
    classBonus: {rogue: 1},
    companionBonus: {marie: 1, radek: 1},
    itemBonus: {archiveKey: 2},
    itemBonusLabels: {archiveKey: "Klíč od archivu"},
    advantage: {classes: ["rogue"], companions: ["marie", "radek"], items: ["archiveKey"]},
    advantageLabels: {
      classes: {rogue: "Rogue pozná neoficiální archiv podle toho, že má novější zámek než úřad."},
      companions: {
        marie: "Marie poznává systém ukládání dokumentů podle vrstev prachu.",
        radek: "Radek ví, které dveře se musí nejdřív kopnout a potom odemknout."
      },
      items: {archiveKey: "Klíč od archivu se rozhodl, že tentokrát opravdu někam patří."}
    }
  },
  {
    id: "canteen-route",
    label: "Projít přes závodní jídelnu a noční směnu",
    detail: "Bohumil tvrdí, že každá pevnost má zadní vchod. V JZD je to výdejní okénko na guláš.",
    attribute: "charisma",
    dc: 12,
    companionBonus: {bohumil: 2, radek: 1},
    itemBonus: {thermos: 1},
    itemBonusLabels: {thermos: "Odborový čaj"},
    advantage: {companions: ["bohumil", "radek"], items: ["thermos"]},
    advantageLabels: {
      companions: {
        bohumil: "Bohumil zná kuchařku, jejího bývalého i důvod, proč se o něm nemluví.",
        radek: "Radek je stále vedený v seznamu zaměstnanců, protože ho nikdo neumí smazat."
      },
      items: {thermos: "Termoska mění podezřelou návštěvu v přijatelnou přestávku."
      }
    }
  }
];

export const JZD_SEARCH_CHECKS = [
  {
    id: "ledger-trail",
    label: "Sledovat faktury a účetní knihu",
    detail: "Čísla sedí. Jen pokaždé na jiné firmě, jiném pozemku a jiném příbuzném.",
    attribute: "intellect",
    dc: 14,
    companionBonus: {marie: 2, radek: 1},
    itemBonus: {archiveKey: 2},
    itemBonusLabels: {archiveKey: "Klíč od archivu"},
    advantage: {companions: ["marie"], items: ["archiveKey"]},
    advantageLabels: {
      companions: {marie: "Marie rozpozná falešnou přílohu podle skutečného razítka."},
      items: {archiveKey: "Klíč otevřel skříň, kterou účetní označil jako vánoční výzdobu."}
    }
  },
  {
    id: "worker-testimony",
    label: "Získat svědectví pracovníků",
    detail: "Všichni něco viděli. Nikdo nechce být první, kdo to viděl oficiálně.",
    attribute: "morality",
    dc: 13,
    honest: true,
    companionBonus: {radek: 2, bohumil: 1},
    itemBonus: {thermos: 2},
    itemBonusLabels: {thermos: "Odborový čaj"},
    advantage: {companions: ["radek"], items: ["thermos"]},
    advantageLabels: {
      companions: {radek: "Radek ručí vlastním jménem a dvěma nedokončenými opravami."},
      items: {thermos: "Čaj vytváří dočasně bezpečnější prostředí než obecní whistleblowing směrnice."}
    }
  },
  {
    id: "truck-footage",
    label: "Natočit noční odvoz obecního majetku",
    detail: "Kamion nemá logo. Zato řidič má bundu volebního týmu Vladimíra Věčného.",
    attribute: "media",
    dc: 13,
    classBonus: {bard: 1},
    companionBonus: {bohumil: 1},
    itemBonus: {recorder: 2},
    itemBonusLabels: {recorder: "Kazetový diktafon"},
    advantage: {classes: ["bard"], items: ["recorder"]},
    advantageLabels: {
      classes: {bard: "Bard ví, že roztřesený obraz působí autenticky, pokud je správně sestříhaný."},
      items: {recorder: "Diktafon zachytí řidičovo jméno i větu, že tohle se přece nenahrává."}
    }
  }
];

export const JZD_FINAL_CHECKS = [
  {
    id: "publish-dossier",
    label: "Zveřejnit celý spis a přinutit obec reagovat",
    detail: "Důkazy ven, tisková konference ráno a žádný čas na to, aby Věčný přepsal minulost.",
    attribute: "media",
    dc: 15,
    honest: true,
    classBonus: {bard: 2},
    companionBonus: {marie: 1, bohumil: 1},
    itemBonus: {recorder: 2},
    itemBonusLabels: {recorder: "Kazetový diktafon"},
    advantage: {classes: ["bard"], items: ["recorder"]},
    advantageLabels: {
      classes: {bard: "Bard umí z účetní přílohy udělat titulek, kterému rozumí i zastupitel."},
      items: {recorder: "Nahrávka dokazuje, že věta ‚nic se neodváží‘ zazněla vedle nastartovaného kamionu."}
    }
  },
  {
    id: "council-ambush",
    label: "Přivést pracovníky přímo na zastupitelstvo",
    detail: "Místo prezentace přijdou lidé, kteří stroje opravovali, nakládali a teď je mají údajně pronajaté sami sobě.",
    attribute: "authority",
    dc: 14,
    honest: true,
    classBonus: {paladin: 2},
    companionBonus: {radek: 2, marie: 1},
    itemBonus: {thermos: 1},
    itemBonusLabels: {thermos: "Odborový čaj"},
    advantage: {classes: ["paladin"], companions: ["radek"]},
    advantageLabels: {
      classes: {paladin: "Paladin dokáže z procedurální námitky udělat morální obžalobu."},
      companions: {radek: "Radek přivedl lidi, kteří poznají každý prodaný stroj podle zvuku převodovky."}
    }
  },
  {
    id: "trade-evidence",
    label: "Nabídnout Věčnému důkazy výměnou za politickou páku",
    detail: "Kauza zmizí. Vy získáte dveře, telefonní číslo a problém, který bude jednou vlastnit vás.",
    attribute: "luck",
    dc: 12,
    dirty: true,
    classBonus: {rogue: 2},
    companionBonus: {bohumil: 1},
    advantage: {classes: ["rogue"]},
    disadvantage: {origins: ["idealist"], companions: ["marie", "radek"]},
    advantageLabels: {classes: {rogue: "Rogue ví, že vydírání je jen koaliční vyjednávání bez občerstvení."}},
    disadvantageLabels: {
      origins: {idealist: "Idealista stále doufá, že obchod s důkazy může mít etický dodatek."},
      companions: {
        marie: "Marie odmítá předstírat, že skartace je forma právního řešení.",
        radek: "Radek nechce měnit svědectví pracovníků za vaši budoucí kancelář."
      }
    }
  }
];

export const JZD_RIVAL_CHOICES = [
  {
    id: "call-bluff",
    title: "Zveřejnit Věčného výhrůžku ještě před důkazy",
    description: "Získáte pozornost, ale soupeř zjistí, že jste blízko.",
    effect: "Reputace +2, tlak Věčného +2. Zveřejnění spisu bude snazší."
  },
  {
    id: "play-along",
    title: "Předstírat, že nabídku přijímáte",
    description: "Získáte čas a další schůzku. Věčný získá důvod tvrdit, že už spolu jednáte.",
    effect: "Politický dluh +1, tlak Věčného −1. Obchod s důkazy bude snazší."
  },
  {
    id: "protect-workers",
    title: "Nechat Věčného mluvit a mezitím ukrýt svědky",
    description: "Méně efektní, zato lidé z JZD možná zůstanou zaměstnaní i živí v obecním smyslu.",
    effect: "Důvěra pracovníků +2. Zastupitelská cesta bude snazší."
  }
];

export function startJzdQuest(state) {
  const next = structuredClone(state);
  next.day = Math.max(2, next.day);
  next.actions = 3;
  next.scene = "jzdBriefing";
  next.quest = {
    id: "rats-in-jzd",
    status: "active",
    phase: "briefing",
    party: next.party.active ? [next.party.active] : [],
    itemId: null,
    route: null,
    evidence: 0,
    workerTrust: 0,
    rivalPressure: 0,
    rivalChoice: null,
    ending: null,
    endingTitle: null,
    endingText: null,
    consequences: [],
    results: []
  };
  return next;
}

export function choicesForJzd(state, phase) {
  const source = phase === "approach" ? JZD_APPROACH_CHECKS : phase === "search" ? JZD_SEARCH_CHECKS : JZD_FINAL_CHECKS;
  return source.map(item => {
    const choice = structuredClone(item);
    if (phase === "final") {
      choice.dc = Math.max(9, choice.dc - Math.min(3, state.quest.evidence));
      if (choice.id === "publish-dossier" && state.quest.rivalChoice === "call-bluff") choice.dc = Math.max(9, choice.dc - 1);
      if (choice.id === "council-ambush" && state.quest.rivalChoice === "protect-workers") choice.dc = Math.max(9, choice.dc - 2);
      if (choice.id === "trade-evidence" && state.quest.rivalChoice === "play-along") choice.dc = Math.max(9, choice.dc - 2);
      choice.pressurePenalty = Math.min(3, Math.floor(state.quest.rivalPressure / 2));
      choice.rivalPressure = state.quest.rivalPressure;
      choice.dc = Math.min(20, choice.dc + choice.pressurePenalty);
    }
    return choice;
  });
}

function levelValue(level, table) {
  return table[level] ?? 0;
}

export function applyJzdCheck(state, result, context, choice) {
  const next = structuredClone(state);
  next.history.push({context, ...result});
  next.flags.lastResult = result;
  next.quest.results.push({context, choiceId: choice.id, level: result.level, roll: result.roll});
  next.actions = Math.max(0, next.actions - 1);

  if (context === "jzd-approach") {
    next.quest.phase = "approach-result";
    next.quest.route = choice.id;
    next.quest.evidence += levelValue(result.level, {critical: 2, success: 1, costly: 1, complication: 0});
    next.quest.rivalPressure += levelValue(result.level, {critical: 0, success: 0, costly: 1, complication: 2});
    if (choice.id === "canteen-route") next.quest.workerTrust += result.level === "complication" ? 0 : 1;
    if (result.level === "complication") next.quest.consequences.push("Vrátnice poslala Věčnému fotografii vašeho příchodu.");
    next.scene = "jzdApproachResult";
  } else if (context === "jzd-search") {
    next.quest.phase = "search-result";
    next.quest.evidence += levelValue(result.level, {critical: 4, success: 3, costly: 2, complication: 1});
    next.quest.rivalPressure += levelValue(result.level, {critical: 0, success: 1, costly: 2, complication: 3});
    if (choice.id === "worker-testimony") next.quest.workerTrust += levelValue(result.level, {critical: 3, success: 2, costly: 1, complication: 0});
    if (choice.id === "ledger-trail" && result.level !== "complication") next.quest.consequences.push("Máte kopii účetní knihy s ručně dopsaným jménem starostova švagra.");
    if (choice.id === "truck-footage" && result.level !== "complication") next.quest.consequences.push("Máte záznam nočního odvozu obecního majetku.");
    if (result.level === "complication") next.quest.consequences.push("Věčný ví, kterou stopu sledujete, a začal uklízet rychleji než obecní služby.");
    next.scene = "jzdSearchResult";
  } else if (context === "jzd-final") {
    next.quest.phase = "final-result";
    next.quest.ending = choice.id;
    const quality = levelValue(result.level, {critical: 3, success: 2, costly: 1, complication: 0});
    if (choice.id === "publish-dossier") {
      next.resources.reputation += 3 + quality * 2;
      next.resources.heat += result.level === "complication" ? 4 : 2;
      next.quest.endingTitle = result.level === "complication" ? "Kauza venku, důkazy napůl" : "JZD se dostalo na titulní strany";
      next.quest.endingText = result.level === "complication"
        ? "Příběh explodoval dřív než důkazní balík. Věčný přežil první den, ale kraj si vyžádal podklady."
        : "Zveřejněné faktury a nahrávky spustily kontrolu. Věčný ztratil klid, nikoli funkci.";
      next.quest.consequences.push("Krajský audit dorazí za několik dní a bude chtít originály.");
    } else if (choice.id === "council-ambush") {
      next.resources.reputation += 2 + quality * 2;
      next.quest.workerTrust += 2 + quality;
      next.relationships.radek += 2;
      next.quest.endingTitle = result.level === "complication" ? "Zastupitelstvo přerušeno občany" : "Pracovníci obsadili veřejné jednání";
      next.quest.endingText = result.level === "complication"
        ? "Jednání skončilo chaosem, ale svědci už nejdou administrativně vymazat."
        : "Lidé z JZD vypovídali veřejně a obec musela prodej majetku pozastavit.";
      next.quest.consequences.push("Pracovníci JZD vám dluží podporu, ale očekávají ochranu před odvetou.");
    } else {
      next.resources.leverage += 2 + quality;
      next.resources.debt += 1;
      next.resources.reputation += result.level === "critical" ? 2 : 0;
      next.relationships.marie -= 2;
      next.relationships.radek -= 2;
      next.quest.endingTitle = result.level === "complication" ? "Věčný vzal důkazy i iniciativu" : "Důkazy se změnily v politickou páku";
      next.quest.endingText = result.level === "complication"
        ? "Schůzku jste přežili, ale kopii dohody drží člověk, kterého jste chtěli vydírat."
        : "Kauza zmizela z veřejnosti. Vy jste získali přístup, který bude jednou velmi drahý.";
      next.quest.consequences.push("Vladimír Věčný má důkaz, že jste byli ochotni obchodovat.");
    }
    next.scene = "jzdFinalResult";
  }
  return next;
}

export function applyJzdRivalChoice(state, choiceId) {
  const next = structuredClone(state);
  next.quest.rivalChoice = choiceId;
  next.quest.phase = "final";
  if (choiceId === "call-bluff") {
    next.resources.reputation += 2;
    next.quest.rivalPressure += 2;
    next.quest.consequences.push("Věčný ví, že chystáte veřejný útok.");
  } else if (choiceId === "play-along") {
    next.resources.debt += 1;
    next.quest.rivalPressure = Math.max(0, next.quest.rivalPressure - 1);
    next.quest.consequences.push("Věčný může tvrdit, že už spolu neveřejně vyjednáváte.");
  } else {
    next.quest.workerTrust += 2;
    next.relationships.radek += 1;
    next.quest.consequences.push("Svědci byli přesunuti z dosahu obecních personálních rozhodnutí.");
  }
  next.scene = "jzdFinal";
  return next;
}
