import {COMPANIONS, VERSION} from "./data.js";
import {clamp, deriveAttributes} from "./rules.js";

export const TEST8_SAVE_SCHEMA = 4;
export const TEST8_STORAGE_KEY = "koryto.clean.v0200.test8";

export const TEST8_LOCATIONS = {
  jzd: {name: "Areál bývalého JZD", icon: "JZD", description: "Stroje mizí rychleji než zápisy z rady."},
  pub: {name: "Hospoda U Tří razítek", icon: "U3R", description: "Místní informační systém s pěnou."},
  office: {name: "Obecní úřad", icon: "OU", description: "Budova, kde příloha existuje hlavně jako pojem."}
};

export const TEST8_STAFF = {
  marie: {name: COMPANIONS.marie.name, role: "Zlevní reakce na úřední blokády", locationId: "office"},
  bohumil: {name: COMPANIONS.bohumil.name, role: "Zlevní práci s veřejností a rodiči", locationId: "pub"},
  radek: {name: COMPANIONS.radek.name, role: "Zlevní reakce na zásahy v JZD", locationId: "jzd"}
};

export const TEST8_STRATEGIES = {
  public: {
    name: "Veřejný tlak",
    description: "Vyhrát počtem lidí, pozorností a veřejným hlasováním.",
    attribute: "charisma",
    primary: "Podpora",
    failure: "Podpora musí být alespoň 6."
  },
  legal: {
    name: "Právní útok",
    description: "Zastavit prodej dokumenty, programem jednání a procesní chybou.",
    attribute: "intellect",
    primary: "Důkazy",
    failure: "Důkazy musí být alespoň 6."
  },
  workers: {
    name: "Dělnická moc",
    description: "Udržet směnu pohromadě a fyzicky znemožnit odvoz majetku.",
    attribute: "authority",
    primary: "Připravenost JZD",
    failure: "Kauza JZD musí mít pokrok 4 a svědci nesmějí zůstat zastrašení."
  }
};

export const TEST8_FINALE_TACTICS = {
  public: {
    "open-mic": {name: "Otevřít mikrofon občanům", detail: "Vynutit veřejné výpovědi před hlasováním.", attribute: "charisma", baseDc: 13},
    livestream: {name: "Přenášet jednání živě", detail: "Proměnit každý pokus o zametení kauzy ve veřejný záznam.", attribute: "media", baseDc: 14}
  },
  legal: {
    injunction: {name: "Předběžné opatření", detail: "Položit radě na stůl návrh, který okamžitě zmrazí prodej.", attribute: "intellect", baseDc: 12},
    referral: {name: "Trestní oznámení před hlasováním", detail: "Donutit radu rozhodovat s vědomím osobní odpovědnosti.", attribute: "authority", baseDc: 15}
  },
  workers: {
    blockade: {name: "Blokáda bran", detail: "Zastavit techniku lidmi dřív, než rada stihne hlasovat.", attribute: "authority", baseDc: 13},
    strike: {name: "Stávkové hlasování", detail: "Proměnit pracovníky v politickou sílu, kterou nelze přepsat dodatkem.", attribute: "morality", baseDc: 14}
  }
};

const DAY1_ACTIONS = [
  {
    id: "jzd-logbook", day: 1, locationId: "jzd", title: "Zachránit knihu jízd",
    detail: "Vrátný má poslední kopii seznamu aut. Po dnešku už nemusí existovat.", intent: "+ důkazy o odvozu", risk: "Věčný zjistí, že se ptáte", attribute: "intellect", dc: 12,
    advantage: {classes: ["rogue"]}, advantageLabels: {classes: {rogue: "Rogue pozná falešnou SPZ i pravou lež."}},
    effects: {
      critical: {evidence: 3, case: {jzd: 2}, support: 1, text: "Najdete knihu jízd i podpis starostova řidiče."},
      success: {evidence: 2, case: {jzd: 2}, text: "Kniha jízd potvrzuje noční odvoz techniky."},
      costly: {evidence: 1, pressure: 1, case: {jzd: 1}, text: "Máte čísla aut, ale vrátný volá starostovi."},
      complication: {pressure: 2, neglect: {jzd: 1}, text: "Vrátný knihu zabaví a vaše jméno pošle dál."}
    },
    sacrifice: {
      title: "Kniha jízd shořela",
      text: "Nešli jste do JZD. Věčný nechal poslední kopii zničit a na druhý den uzavřel areál.",
      mutationId: "logbook-burned",
      effect: {evidence: -1, neglect: {jzd: 1}, flags: {logbookDestroyed: true}}
    }
  },
  {
    id: "pub-workers", day: 1, locationId: "pub", title: "Získat svědky z noční směny",
    detail: "Pracovníci vědí, co zmizelo. Dnes ještě mluví spolu.", intent: "+ podpora a svědectví", risk: "někdo rozhovor prodá dál", attribute: "charisma", dc: 10,
    advantage: {classes: ["bard"]}, advantageLabels: {classes: {bard: "Bard umí poslouchat způsobem, který vypadá jako vysílání."}},
    effects: {
      critical: {support: 3, evidence: 1, case: {jzd: 1}, flags: {witnessesSafe: true}, text: "Celá směna souhlasí, že vystoupí veřejně."},
      success: {support: 2, evidence: 1, case: {jzd: 1}, flags: {witnessesSafe: true}, text: "Získáte svědka a jméno řidiče."},
      costly: {support: 1, pressure: 1, flags: {witnessesSafe: true}, text: "Jeden svědek kývne, druhý už píše Věčnému."},
      complication: {support: -1, pressure: 1, neglect: {jzd: 1}, text: "Rozhovor se rozpadne na tři fámy a jednu urážku."}
    },
    sacrifice: {
      title: "Svědci podepsali mlčení",
      text: "Nechránili jste směnu. Věčný rozdal nové smlouvy a hospoda druhý den ztichla.",
      mutationId: "witnesses-intimidated",
      effect: {support: -1, neglect: {jzd: 1}, flags: {witnessesIntimidated: true}}
    }
  },
  {
    id: "office-contract", day: 1, locationId: "office", title: "Získat smlouvu a přílohu",
    detail: "Smlouva je veřejná. Příloha a skutečná cena jen do zavírací hodiny.", intent: "+ důkazy z úřadu", risk: "úřednice zavolá vedení", attribute: "authority", dc: 12, honest: true,
    advantage: {classes: ["paladin"]}, advantageLabels: {classes: {paladin: "Paladin vysloví slovo zákon tak, že se otevře i zamčená spisovna."}},
    effects: {
      critical: {evidence: 3, support: 1, case: {jzd: 2}, flags: {archiveOpen: true}, text: "Dostanete smlouvu i neveřejnou přílohu s cenou."},
      success: {evidence: 2, case: {jzd: 1}, flags: {archiveOpen: true}, text: "Smlouva potvrzuje prodej pod cenou."},
      costly: {evidence: 1, pressure: 1, flags: {archiveOpen: true}, text: "Smlouvu máte, ale úřad začne hledat, kdo ji vydal."},
      complication: {pressure: 2, text: "Úřad žádost zaeviduje pod názvem nepřátelská činnost."}
    },
    sacrifice: {
      title: "Archiv byl zapečetěn",
      text: "Nešli jste na úřad. Věčný přes noc změnil přístupová práva a druhý den uzavřel spisovnu.",
      mutationId: "archive-sealed",
      effect: {flags: {archiveSealed: true}}
    }
  }
];

const DOCTRINE_ACTIONS = [
  {
    id: "public-coalition", day: 2, requiresStrategy: "public", locationId: "pub", title: "Spojit rodiče a pracovníky",
    detail: "Z jedné kauzy uděláte společný problém obce.", intent: "+3 podpora", risk: "část lidí odejde, pokud dostane vlastní slib", attribute: "charisma", dc: 12,
    effects: {
      critical: {support: 4, case: {road: 2, jzd: 1}, text: "Rodiče a směna přijdou společně."},
      success: {support: 3, case: {road: 1, jzd: 1}, text: "Vznikne veřejná koalice obou kauz."},
      costly: {support: 2, pressure: 1, case: {road: 1}, text: "Koalice drží, ale každý chce první řadu."},
      complication: {support: -1, pressure: 2, text: "Schůze se rozpadne na soutěž křivd."}
    },
    sacrificePriority: 1,
    sacrifice: {title: "Věčný koupil rodičovský výbor", text: "Nevytvořili jste koalici. Věčný slíbil školní ulici samostatné peníze a uzavřel hospodu pro vlastní schůzi.", mutationId: "coalition-bought", effect: {support: -2, flags: {parentsBought: true}}}
  },
  {
    id: "public-expose", day: 2, requiresStrategy: "public", locationId: "office", title: "Zveřejnit mapu zakázek",
    detail: "Lidé uvidí jednu síť místo dvou nesouvisejících skandálů.", intent: "+2 podpora, +1 důkaz", risk: "Věčný zaútočí na vaši důvěryhodnost", attribute: "media", dc: 13,
    effects: {
      critical: {support: 3, evidence: 2, case: {road: 1}, text: "Mapa zakázek se šíří dřív než obecní vysvětlení."},
      success: {support: 2, evidence: 1, case: {road: 1}, text: "Veřejnost poprvé vidí společný vzorec."},
      costly: {support: 1, evidence: 1, pressure: 1, text: "Mapa funguje, ale jeden údaj je napaden."},
      complication: {support: -1, pressure: 2, text: "Věčný zveřejní vlastní mapu, na které jste hlavní problém vy."}
    },
    sacrificePriority: 2,
    sacrifice: {title: "Věčný převzal příběh", text: "Nezveřejnili jste souvislosti. Obecní zpravodaj označil kauzy za volební divadlo.", mutationId: "narrative-captured", effect: {support: -1, evidence: -1, flags: {narrativeCaptured: true}}}
  },
  {
    id: "legal-audit", day: 2, requiresStrategy: "legal", locationId: "office", title: "Sestavit důkazní řetězec",
    detail: "Nestačí mít dokumenty. Musí být jasné, odkud jsou a co dokazují.", intent: "+3 důkazy", risk: "úřad zpochybní původ kopií", attribute: "intellect", dc: 13,
    effects: {
      critical: {evidence: 4, case: {jzd: 1, road: 1}, text: "Dokumenty vytvoří uzavřený řetězec."},
      success: {evidence: 3, case: {road: 1}, text: "Důkazy mají pořadí, původ a konkrétní odpovědnost."},
      costly: {evidence: 2, pressure: 1, text: "Řetězec drží, ale jedna kopie zůstává napadnutelná."},
      complication: {evidence: -1, pressure: 2, text: "Jedna příloha se ukáže jako pracovní verze."}
    },
    sacrificePriority: 2,
    sacrifice: {title: "Účetní stopa byla rozbita", text: "Nesestavili jste řetězec. Věčný nechal jednu fakturu nahradit opravenou verzí.", mutationId: "audit-buried", effect: {evidence: -2, flags: {auditBuried: true}}}
  },
  {
    id: "legal-injunction", day: 2, requiresStrategy: "legal", locationId: "jzd", title: "Připravit návrh na zmrazení prodeje",
    detail: "Právní útok potřebuje nejen důkazy, ale okamžitý nástroj.", intent: "otevře předběžné opatření", risk: "Věčný urychlí termín prodeje", attribute: "authority", dc: 12, honest: true,
    effects: {
      critical: {evidence: 2, pressure: -2, case: {jzd: 2}, flags: {injunctionReady: true}, text: "Návrh je hotový a soud má službu."},
      success: {evidence: 1, pressure: -1, case: {jzd: 1}, flags: {injunctionReady: true}, text: "Máte právní nástroj k okamžitému zmrazení prodeje."},
      costly: {evidence: 1, pressure: 1, flags: {injunctionReady: true}, text: "Návrh je použitelný, ale Věčný ví, co přijde."},
      complication: {pressure: 2, text: "Návrh skončí na špatném oddělení a termín běží dál."}
    },
    sacrificePriority: 1,
    sacrifice: {title: "Prodej byl urychlen", text: "Nepřipravili jste zmrazení. Věčný posunul podpis smlouvy před veřejné jednání.", mutationId: "sale-accelerated", effect: {pressure: 2, flags: {saleAccelerated: true}}}
  },
  {
    id: "workers-organize", day: 2, requiresStrategy: "workers", locationId: "pub", title: "Svolat směnový výbor",
    detail: "Pracovníci musí vědět, kdo vydrží, až přijdou výhrůžky.", intent: "+ připravenost JZD", risk: "vedení rozdělí směny", attribute: "morality", dc: 12,
    effects: {
      critical: {support: 2, case: {jzd: 3}, flags: {shiftUnited: true, witnessesSafe: true}, text: "Směna zvolí vlastní výbor a společný postup."},
      success: {support: 1, case: {jzd: 2}, flags: {shiftUnited: true, witnessesSafe: true}, text: "Pracovníci se zavážou, že nikdo neustoupí sám."},
      costly: {case: {jzd: 1}, pressure: 1, flags: {shiftUnited: true}, text: "Výbor vznikne, ale dva lidé chtějí anonymitu."},
      complication: {pressure: 2, neglect: {jzd: 1}, text: "Směny se obviní navzájem z donášení."}
    },
    sacrificePriority: 1,
    sacrifice: {title: "Směna byla rozdělena", text: "Nesvolali jste výbor. Věčný rozdělil pracovníky novými smlouvami a zavřel hospodu pro jejich schůzi.", mutationId: "shift-split", effect: {case: {jzd: -1}, flags: {shiftSplit: true, witnessesIntimidated: true}}}
  },
  {
    id: "workers-secure", day: 2, requiresStrategy: "workers", locationId: "jzd", title: "Zajistit brány a klíče",
    detail: "Blokáda bez kontroly vstupu je jen skupinová fotografie.", intent: "otevře blokádu", risk: "obec povolá bezpečnostní službu", attribute: "authority", dc: 13,
    effects: {
      critical: {pressure: -2, case: {jzd: 2}, flags: {gatesSecured: true}, text: "Klíče, směny i vjezdy jsou pod kontrolou pracovníků."},
      success: {pressure: -1, case: {jzd: 1}, flags: {gatesSecured: true}, text: "Odvoz bez souhlasu směny už nebude možný."},
      costly: {pressure: 1, case: {jzd: 1}, flags: {gatesSecured: true}, text: "Brány drží, ale bezpečnostní služba je na cestě."},
      complication: {pressure: 2, text: "Náhradní klíče má člověk, který právě změnil stranu."}
    },
    sacrificePriority: 2,
    sacrifice: {title: "Brány převzala agentura", text: "Nezajistili jste vstup. Věčný najal bezpečnostní službu a uzavřel JZD.", mutationId: "gates-seized", effect: {pressure: 2, flags: {gatesSeized: true}}}
  }
];

const DAY3_ACTIONS = [
  {
    id: "public-fill-hall", day: 3, requiresStrategy: "public", locationId: "pub", title: "Zaplnit sál vlastními lidmi",
    detail: "Veřejná strategie prohraje, pokud Věčný ovládne židle dřív než mikrofon.", intent: "+3 podpora", risk: "přijdou i placení příznivci starosty", attribute: "charisma", dc: 12,
    effects: {
      critical: {support: 4, pressure: -1, flags: {hallFilled: true}, text: "Přijde víc lidí než židlí a tentokrát to pomůže."},
      success: {support: 3, flags: {hallFilled: true}, text: "Sál bude plný vašich podporovatelů."},
      costly: {support: 2, pressure: 1, flags: {hallFilled: true}, text: "Sál se naplní oběma tábory."},
      complication: {pressure: 2, text: "Věčný obsadí první řady dřív."}
    },
    sacrificePriority: 1,
    sacrifice: {title: "Věčný obsadil sál", text: "Nezajistili jste účast. První řady patří lidem závislým na obci.", effect: {support: -2, flags: {hallCaptured: true}}}
  },
  {
    id: "public-broadcast", day: 3, requiresStrategy: "public", locationId: "office", title: "Připravit živý přenos",
    detail: "Když rada vypne mikrofon, musí zůstat obraz.", intent: "otevře živé finále", risk: "obec napadne pravidla přenosu", attribute: "media", dc: 13,
    effects: {
      critical: {support: 2, evidence: 1, flags: {broadcastReady: true}, text: "Přenos sleduje půl obce ještě před začátkem."},
      success: {support: 1, evidence: 1, flags: {broadcastReady: true}, text: "Každý zásah rady bude veřejný."},
      costly: {support: 1, pressure: 1, flags: {broadcastReady: true}, text: "Přenos poběží, ale obec hrozí žalobou."},
      complication: {pressure: 2, text: "Obecní síť náhle nezná internet."}
    },
    sacrificePriority: 2,
    sacrifice: {title: "Jednání zmizelo bez záznamu", text: "Nepřipravili jste přenos. Věčný může vypnout mikrofon bez svědků mimo sál.", effect: {flags: {broadcastBlocked: true}}}
  },
  {
    id: "legal-agenda", day: 3, requiresStrategy: "legal", locationId: "office", title: "Vynutit bod na programu",
    detail: "Bez bodu programu je důkaz jen papír s ambicí.", intent: "otevře procesní finále", risk: "rada vás může vykázat", attribute: "authority", dc: 13, honest: true,
    effects: {
      critical: {evidence: 2, support: 1, case: {road: 1}, flags: {agendaSecured: true}, text: "Tajemnice zařadí oba body a pošle program občanům."},
      success: {evidence: 2, case: {road: 1}, flags: {agendaSecured: true}, text: "Prodej JZD se dostane na program."},
      costly: {evidence: 1, pressure: 1, flags: {agendaSecured: true}, text: "Bod je na programu jako různé."},
      complication: {pressure: 2, text: "Rada bod odmítne a Věčný dostane čas připravit odpověď."}
    },
    sacrificePriority: 1,
    sacrifice: {title: "Rada vyřadila bod", text: "Nevynutili jste program. Právní útok začne bez hlasování, které měl zastavit.", effect: {pressure: 1, flags: {agendaMissing: true}}}
  },
  {
    id: "legal-affidavit", day: 3, requiresStrategy: "legal", locationId: "pub", title: "Sepsat čestná prohlášení svědků",
    detail: "Dokument bez člověka lze zpochybnit. Člověka bez dokumentu zastrašit.", intent: "+2 důkazy", risk: "svědci budou veřejně označeni", attribute: "morality", dc: 12,
    effects: {
      critical: {evidence: 3, support: 1, flags: {affidavitReady: true, witnessesSafe: true}, text: "Svědci podepíší společné prohlášení."},
      success: {evidence: 2, flags: {affidavitReady: true, witnessesSafe: true}, text: "Výpovědi mají jména, data a podpisy."},
      costly: {evidence: 1, pressure: 1, flags: {affidavitReady: true}, text: "Výpovědi jsou použitelné, ale jeden svědek chce ochranu."},
      complication: {evidence: -1, pressure: 2, text: "Jeden svědek text stáhne po telefonátu z obce."}
    },
    sacrificePriority: 2,
    sacrifice: {title: "Svědectví zůstalo ústní", text: "Nesepsali jste výpovědi. Věčný je před hlasováním označí za hospodské řeči.", effect: {evidence: -1, flags: {affidavitMissing: true}}}
  },
  {
    id: "workers-strike-vote", day: 3, requiresStrategy: "workers", locationId: "pub", title: "Nechat směnu hlasovat o stávce",
    detail: "Blokáda bez mandátu se rozpadne při první výhrůžce.", intent: "+ připravenost JZD", risk: "část pracovníků odmítne", attribute: "morality", dc: 12,
    effects: {
      critical: {support: 2, case: {jzd: 2}, flags: {strikeMandate: true, shiftUnited: true}, text: "Stávku podpoří všechny směny."},
      success: {support: 1, case: {jzd: 1}, flags: {strikeMandate: true}, text: "Pracovníci schválí společný postup."},
      costly: {case: {jzd: 1}, pressure: 1, flags: {strikeMandate: true}, text: "Mandát projde těsně a rozdělení zůstane viditelné."},
      complication: {pressure: 2, flags: {shiftSplit: true}, text: "Hlasování skončí obviněním z manipulace."}
    },
    sacrificePriority: 1,
    sacrifice: {title: "Směna nemá mandát", text: "Neproběhlo hlasování. Věčný označí blokádu za akci několika jednotlivců.", effect: {flags: {strikeMandateMissing: true, shiftSplit: true}}}
  },
  {
    id: "workers-blockade-prep", day: 3, requiresStrategy: "workers", locationId: "jzd", title: "Postavit směny k branám",
    detail: "Každá brána potřebuje lidi, náhradní klíče a plán při příjezdu policie.", intent: "otevře blokádu", risk: "tlak vyskočí ještě před finále", attribute: "authority", dc: 13,
    effects: {
      critical: {pressure: -2, case: {jzd: 2}, flags: {blockadeReady: true, gatesSecured: true}, text: "Brány drží a každá směna ví, co má dělat."},
      success: {pressure: -1, case: {jzd: 1}, flags: {blockadeReady: true}, text: "Odvoz nebude možný bez otevřeného konfliktu."},
      costly: {pressure: 1, case: {jzd: 1}, flags: {blockadeReady: true}, text: "Blokáda stojí, ale bezpečnostní služba je na cestě."},
      complication: {pressure: 2, flags: {gatesSeized: true}, text: "Agentura převezme jednu bránu ještě před směnou."}
    },
    sacrificePriority: 2,
    sacrifice: {title: "Brány zůstaly otevřené", text: "Nepřipravili jste blokádu. První kamion může odjet bez odporu.", effect: {pressure: 2, flags: {blockadeMissing: true}}}
  },
  {
    id: "road-last-chance", day: 3, locationId: "office", title: "Zachránit školní ulici",
    detail: "Můžete ještě dotáhnout druhou kauzu. Každá doktrína tím ale přijde o jednu vlastní přípravu.", intent: "+2 pokrok silnice", risk: "obětujete část finální doktríny", attribute: "intellect", dc: 12,
    effects: {
      critical: {evidence: 1, case: {road: 3}, text: "Dodatek je zastaven a peníze se vracejí do rozpočtu ulice."},
      success: {case: {road: 2}, text: "Druhá kauza má dost podkladů, aby přežila finále."},
      costly: {case: {road: 1}, pressure: 1, text: "Silnice dostane kontrolu, ale až po volbách."},
      complication: {pressure: 2, neglect: {road: 1}, text: "Dodatek je podepsán dřív, než žádost doputuje do podatelny."}
    },
    sacrificePriority: 3,
    sacrifice: {title: "Školní ulice zůstala rozkopaná", text: "Neřešili jste druhou kauzu. Peníze zmizely v dodatku a rodiče si to zapamatují.", effect: {neglect: {road: 1}, flags: {roadAbandoned: true}}}
  }
];

const STAFF_ACTIONS = [
  {
    id: "staff-marie-annex", day: 2, locationId: "office", requiresStaff: "marie", title: "Marie najde ztracenou přílohu",
    detail: "Příloha neleží ve spise. Leží ve složce Vánoční výzdoba 2019.", intent: "+2 důkazy", risk: "Marie bude označena za zdroj", automatic: true,
    effects: {success: {evidence: 2, case: {jzd: 1, road: 1}, pressure: 1, text: "Marie vytáhne přílohu spojující obě zakázky."}}
  },
  {
    id: "staff-bohumil-room", day: 2, locationId: "pub", requiresStaff: "bohumil", title: "Bohumil uzavře zadní salonek",
    detail: "Na dvě hodiny se z hospody stane bezpečný politický štáb.", intent: "+3 podpora", risk: "hospoda přijde o obecní večírek", automatic: true,
    effects: {success: {support: 3, pressure: 1, case: {road: 1}, text: "Bohumil spojí rodiče, pracovníky i dva věčné nespokojence."}}
  },
  {
    id: "staff-radek-hall", day: 2, locationId: "jzd", requiresStaff: "radek", title: "Radek otevře skrytou halu",
    detail: "Kamera je vypnutá, vrata ne. Radek ví proč.", intent: "+2 důkazy, +1 podpora", risk: "Věčný pozná, kdo vás pustil", automatic: true,
    effects: {success: {evidence: 2, support: 1, case: {jzd: 2}, pressure: 1, text: "V hale najdete prodané stroje, které nikdy neodjely."}}
  }
];

const MUTATIONS = {
  "logbook-burned": {
    title: "Věčný uzavřel JZD po požáru knihy jízd",
    text: "Areál je druhý den nepřístupný. Reakce stojí jednu ze dvou akcí.",
    blockedLocation: "jzd",
    response: {id: "respond-logbook-burned", day: 2, locationId: "office", title: "Najít záložní výpis v registru", detail: "Obejdete zničenou knihu jízd přes úřední systém.", intent: "znovu otevře JZD", risk: "stojí jednu akci", automatic: true, effects: {success: {evidence: 1, flags: {logbookBackup: true}, text: "Záložní výpis obnoví část stopy a JZD je znovu hratelné."}}},
    escalation: {evidence: -1, neglect: {jzd: 1}, flags: {logbookLostForever: true}}
  },
  "witnesses-intimidated": {
    title: "Věčný umlčel noční směnu",
    text: "Hospoda je druhý den prázdná. Reakce stojí jednu ze dvou akcí.",
    blockedLocation: "pub",
    response: {id: "respond-witnesses-intimidated", day: 2, locationId: "jzd", title: "Zajistit ochranu svědkům", detail: "Nabídnete směně společný postup a veřejnou ochranu.", intent: "znovu otevře hospodu", risk: "stojí jednu akci", attribute: "morality", dc: 11, effects: {
      critical: {support: 2, flags: {witnessesSafe: true, witnessesIntimidated: false}, text: "Svědci se vrátí a vystoupí společně."},
      success: {support: 1, flags: {witnessesSafe: true, witnessesIntimidated: false}, text: "Svědci se vrátí pod společnou ochranou."},
      costly: {pressure: 1, flags: {witnessesSafe: true, witnessesIntimidated: false}, text: "Svědci se vrátí, ale Věčný zná jejich jména."},
      complication: {pressure: 2, text: "Směna ochranu odmítne a hospoda zůstane tichá."}
    }},
    escalation: {support: -1, flags: {witnessesLost: true}}
  },
  "archive-sealed": {
    title: "Věčný zapečetil spisovnu",
    text: "Úřad je druhý den uzavřený pro všechny vaše akce. Reakce stojí jednu ze dvou akcí.",
    blockedLocation: "office",
    response: {id: "respond-archive-sealed", day: 2, locationId: "pub", title: "Přesvědčit tajemnici po zavíračce", detail: "Získáte jednorázový přístup mimo oficiální systém.", intent: "znovu otevře úřad", risk: "stojí jednu akci", automatic: true, effects: {success: {evidence: 1, flags: {archiveSealed: false, archiveOpen: true}, text: "Tajemnice otevře spisovnu na deset minut."}}},
    escalation: {evidence: -1, flags: {archiveLost: true}}
  },
  "coalition-bought": {
    title: "Věčný rezervoval hospodu pro vlastní koalici",
    text: "Třetí den je hospoda zavřená. Můžete ji získat zpět, ale přijdete o jednu přípravu.",
    blockedLocation: "pub",
    response: {id: "respond-coalition-bought", day: 3, locationId: "office", title: "Vynutit veřejný přístup do sálu", detail: "Přenesete konflikt z hospody na úřední pravidla.", intent: "znovu otevře hospodu", risk: "stojí jednu akci", automatic: true, effects: {success: {support: 1, flags: {parentsBought: false}, text: "Sál musí zůstat veřejný a hospoda se znovu zapojí."}}},
    escalation: {support: -2, flags: {publicRouteCaptured: true}}
  },
  "narrative-captured": {
    title: "Věčný ovládl místní informační kanály",
    text: "Třetí den je veřejná příprava v hospodě zablokovaná jeho verzí příběhu.",
    blockedLocation: "pub",
    response: {id: "respond-narrative-captured", day: 3, locationId: "jzd", title: "Přivést živé svědky místo tiskové zprávy", detail: "Obejdete obecní zpravodaj lidmi, kteří byli u odvozu.", intent: "znovu otevře hospodu", risk: "stojí jednu akci", attribute: "charisma", dc: 12, effects: {
      critical: {support: 2, flags: {narrativeCaptured: false}, text: "Svědci převezmou veřejnou debatu."},
      success: {support: 1, flags: {narrativeCaptured: false}, text: "Živé výpovědi rozbijí obecní verzi."},
      costly: {pressure: 1, flags: {narrativeCaptured: false}, text: "Příběh se otočí, ale svědci se vystaví útoku."},
      complication: {pressure: 2, text: "Svědci se před kamerou rozejdou v detailech."}
    }},
    escalation: {support: -1, flags: {broadcastBlocked: true}}
  },
  "audit-buried": {
    title: "Věčný nechal nahradit klíčovou fakturu",
    text: "Třetí den je úřad pro právní přípravu uzavřený, dokud nenajdete původní kopii.",
    blockedLocation: "office",
    response: {id: "respond-audit-buried", day: 3, locationId: "pub", title: "Najít kopii u dodavatele", detail: "Obejdete obecní účetnictví přes člověka, který fakturu vystavil.", intent: "znovu otevře úřad", risk: "stojí jednu akci", automatic: true, effects: {success: {evidence: 2, flags: {auditBuried: false}, text: "Původní faktura vrátí právnímu útoku pevnou půdu."}}},
    escalation: {evidence: -2, flags: {legalChainBroken: true}}
  },
  "sale-accelerated": {
    title: "Věčný posunul podpis prodeje před jednání",
    text: "Třetí den je úřad uzavřený přípravou podpisu. Reakce stojí jednu akci.",
    blockedLocation: "office",
    response: {id: "respond-sale-accelerated", day: 3, locationId: "jzd", title: "Doručit předběžné opatření přímo do areálu", detail: "Zastavíte podpis ještě před vstupem na úřad.", intent: "znovu otevře úřad", risk: "stojí jednu akci", automatic: true, effects: {success: {pressure: -1, flags: {saleAccelerated: false, injunctionReady: true}, text: "Podpis se odkládá a úřad je znovu hratelný."}}},
    escalation: {pressure: 2, flags: {saleSigned: true}}
  },
  "shift-split": {
    title: "Věčný rozdělil směny novými smlouvami",
    text: "Třetí den je hospoda pro dělnickou přípravu uzavřená. Reakce stojí jednu akci.",
    blockedLocation: "pub",
    response: {id: "respond-shift-split", day: 3, locationId: "jzd", title: "Svolat společnou směnu přímo u bran", detail: "Obejdete rozdělení tím, že všichni rozhodnou na jednom místě.", intent: "znovu otevře hospodu", risk: "stojí jednu akci", attribute: "authority", dc: 12, effects: {
      critical: {case: {jzd: 2}, flags: {shiftSplit: false, shiftUnited: true}, text: "Směny se znovu spojí a zvolí společný výbor."},
      success: {case: {jzd: 1}, flags: {shiftSplit: false, shiftUnited: true}, text: "Směny se znovu domluví na společném postupu."},
      costly: {pressure: 1, flags: {shiftSplit: false}, text: "Rozdělení ustoupí, ale důvěra zůstává křehká."},
      complication: {pressure: 2, text: "Společná schůze skončí dalším rozkolem."}
    }},
    escalation: {case: {jzd: -1}, flags: {workersRouteBroken: true}}
  },
  "gates-seized": {
    title: "Bezpečnostní agentura převzala brány JZD",
    text: "Třetí den je JZD uzavřené. Reakce stojí jednu akci.",
    blockedLocation: "jzd",
    response: {id: "respond-gates-seized", day: 3, locationId: "pub", title: "Získat náhradní klíče od bývalého mistra", detail: "Vrátíte pracovníkům přístup bez přímého střetu s agenturou.", intent: "znovu otevře JZD", risk: "stojí jednu akci", automatic: true, effects: {success: {case: {jzd: 1}, flags: {gatesSeized: false, gatesSecured: true}, text: "Náhradní klíče vrátí směně kontrolu nad jednou bránou."}}},
    escalation: {pressure: 2, flags: {blockadeMissing: true}}
  }
};

const ALL_ACTIONS = [...DAY1_ACTIONS, ...DOCTRINE_ACTIONS, ...DAY3_ACTIONS, ...STAFF_ACTIONS];

function baseCases() {
  return {
    jzd: {title: "Krysy v JZD", status: "active", progress: 0, neglect: 0, deadline: 3, threat: "Majetek bude rozprodán a svědci umlčeni."},
    road: {title: "Silnice ke škole", status: "locked", progress: 0, neglect: 0, deadline: 3, threat: "Peníze zmizí v dalším dodatku a ulice zůstane rozkopaná."}
  };
}

export function createTest8State(playtests = []) {
  return {
    version: VERSION,
    saveSchema: TEST8_SAVE_SCHEMA,
    screen: "creation",
    hero: {name: "", classId: "bard", originId: "idealist", attributes: deriveAttributes("bard", "idealist")},
    party: {active: null, members: []},
    quest: {status: "inactive", party: [], itemId: null, rivalChoice: null},
    resources: {support: 2, evidence: 0, pressure: 1},
    campaign: {
      day: 1,
      actionsLeft: 2,
      phase: "map",
      cases: baseCases(),
      usedActions: [],
      visitedLocations: [],
      actionLog: [],
      rivalLog: [],
      sacrificeLog: [],
      mutationLog: [],
      activeMutationId: null,
      staffId: null,
      finalStrategy: null,
      finalTactic: null,
      flags: {},
      lastResult: null,
      outcome: null,
      startedAt: Date.now(),
      finishedAt: null
    },
    history: [],
    playtests: Array.isArray(playtests) ? playtests : []
  };
}

export function startTest8Campaign(state, form) {
  const next = structuredClone(state);
  next.screen = "campaign";
  next.hero.name = form.name.trim() || "Bezejmenný kandidát";
  next.hero.classId = form.classId;
  next.hero.originId = form.originId;
  next.hero.attributes = deriveAttributes(form.classId, form.originId);
  return next;
}

function mutationForState(state) {
  return state.campaign.activeMutationId ? MUTATIONS[state.campaign.activeMutationId] || null : null;
}

export function currentRivalPlan(state) {
  const mutation = mutationForState(state);
  if (mutation) return {title: mutation.title, trigger: mutation.text, blockedLocation: mutation.blockedLocation};
  if (state.campaign.day === 1) return {title: "Zničit příležitost, kterou necháte bez ochrany", trigger: "Po druhé akci Věčný trvale zasáhne přesně tam, kam jste nešli."};
  if (state.campaign.day === 2) return {title: "Napadnout slabé místo vaší doktríny", trigger: "Po druhé akci Věčný zablokuje jednu neprovedenou přípravu na třetí den."};
  return {title: "Využít přípravu, kterou obětujete", trigger: "Po druhé akci se neprovedená příprava promění ve finální nevýhodu."};
}

function responseAction(state) {
  const mutation = mutationForState(state);
  if (!mutation || mutation.response.day !== state.campaign.day) return null;
  return {...mutation.response, isResponse: true, mutationId: state.campaign.activeMutationId};
}

function baseAvailableActions(state) {
  return ALL_ACTIONS.filter(action => {
    if (action.day !== state.campaign.day) return false;
    if (action.requiresStrategy && action.requiresStrategy !== state.campaign.finalStrategy) return false;
    if (action.requiresStaff && action.requiresStaff !== state.campaign.staffId) return false;
    return true;
  });
}

export function availableCampaignActions(state) {
  if (state.screen !== "campaign" || state.campaign.phase !== "map" || state.campaign.actionsLeft <= 0) return [];
  const mutation = mutationForState(state);
  const candidates = [...baseAvailableActions(state), ...(responseAction(state) ? [responseAction(state)] : [])];
  return candidates.filter(action => {
    if (state.campaign.usedActions.includes(action.id)) return false;
    if (mutation?.blockedLocation === action.locationId && !action.isResponse) return false;
    return true;
  });
}

export function campaignActionById(state, actionId) {
  return availableCampaignActions(state).find(action => action.id === actionId) || null;
}

export function choiceForCampaignAction(state, action) {
  if (!action || action.automatic) return null;
  const pressurePenalty = Math.floor(state.resources.pressure / 4);
  const activeStaff = state.campaign.staffId;
  const locationStaff = activeStaff && TEST8_STAFF[activeStaff]?.locationId === action.locationId ? [activeStaff] : [];
  return {
    id: action.id,
    label: action.title,
    detail: action.detail,
    attribute: action.attribute,
    dc: action.dc + pressurePenalty,
    honest: Boolean(action.honest),
    dirty: Boolean(action.dirty),
    advantage: {
      classes: action.advantage?.classes || [],
      origins: action.advantage?.origins || [],
      companions: [...new Set([...(action.advantage?.companions || []), ...locationStaff])]
    },
    advantageLabels: {
      ...(action.advantageLabels || {}),
      companions: locationStaff.length ? {[activeStaff]: `${TEST8_STAFF[activeStaff].name} mění tuto lokaci ve vaši domácí půdu.`} : {}
    },
    companionBonus: activeStaff ? {[activeStaff]: 1} : {}
  };
}

function applyFlags(next, flags = {}) {
  for (const [key, value] of Object.entries(flags)) next.campaign.flags[key] = value;
}

function applyEffect(next, effect = {}) {
  next.resources.support = clamp(next.resources.support + (effect.support || 0), 0, 10);
  next.resources.evidence = clamp(next.resources.evidence + (effect.evidence || 0), 0, 10);
  next.resources.pressure = clamp(next.resources.pressure + (effect.pressure || 0), 0, 10);
  for (const [caseId, amount] of Object.entries(effect.case || {})) {
    next.campaign.cases[caseId].progress = clamp(next.campaign.cases[caseId].progress + amount, 0, 4);
  }
  for (const [caseId, amount] of Object.entries(effect.neglect || {})) {
    next.campaign.cases[caseId].neglect = clamp(next.campaign.cases[caseId].neglect + amount, 0, 3);
  }
  applyFlags(next, effect.flags);
}

function daySacrificeCandidates(next) {
  return baseAvailableActions(next)
    .filter(action => action.sacrifice)
    .filter(action => !next.campaign.usedActions.includes(action.id))
    .sort((a, b) => (a.sacrificePriority || 99) - (b.sacrificePriority || 99));
}

function applyEscalation(next) {
  const mutationId = next.campaign.activeMutationId;
  const mutation = mutationId ? MUTATIONS[mutationId] : null;
  if (!mutation) return null;
  applyEffect(next, mutation.escalation);
  next.campaign.mutationLog.push({day: next.campaign.day, mutationId, status: "ignored", title: mutation.title, text: "Nezareagovali jste. Věčný změnu uzamkl do další části kampaně."});
  next.campaign.activeMutationId = null;
  return mutation;
}

function applyDailySacrifice(next) {
  const action = daySacrificeCandidates(next)[0] || null;
  if (!action) return null;
  applyEffect(next, action.sacrifice.effect);
  const entry = {
    day: next.campaign.day,
    actionId: action.id,
    title: action.sacrifice.title,
    text: action.sacrifice.text,
    mutationId: action.sacrifice.mutationId || null
  };
  next.campaign.sacrificeLog.push(entry);
  if (entry.mutationId) next.campaign.activeMutationId = entry.mutationId;
  return entry;
}

function endWithPressureDefeat(next) {
  next.screen = "ending";
  next.campaign.phase = "finished";
  next.campaign.finishedAt = Date.now();
  for (const item of Object.values(next.campaign.cases)) item.status = "failed";
  next.campaign.outcome = {
    id: "pressure-defeat",
    won: false,
    title: "Věčný ovládl tempo kampaně",
    text: "Neprohráli jste jedním hodem. Prohráli jste tím, že soupeř určoval, co budete řešit.",
    reason: "Tlak dosáhl maxima před finálním střetem."
  };
  archivePlaytest(next);
}

function concludeDay(next) {
  const escalated = applyEscalation(next);
  const sacrifice = applyDailySacrifice(next);
  const title = sacrifice?.title || escalated?.title || "Věčný využil konec dne";
  const textParts = [escalated ? "Ignorovaná krize se zhoršila." : null, sacrifice?.text || null].filter(Boolean);
  next.campaign.rivalLog.push({day: next.campaign.day, title, text: textParts.join(" "), sacrificeActionId: sacrifice?.actionId || null, mutationId: sacrifice?.mutationId || null});
  next.campaign.lastResult = {kind: "rival", title, text: textParts.join(" ")};
  if (next.resources.pressure >= 10) {
    endWithPressureDefeat(next);
    return next;
  }
  if (next.campaign.day === 1) {
    next.campaign.phase = "staff";
    next.campaign.cases.road.status = "active";
  } else if (next.campaign.day === 2) {
    next.campaign.day = 3;
    next.campaign.actionsLeft = 2;
    next.campaign.phase = "map";
  } else {
    next.campaign.phase = "final-tactic";
  }
  return next;
}

export function applyCampaignAction(state, actionId, result = null) {
  const action = campaignActionById(state, actionId);
  if (!action) return state;
  const next = structuredClone(state);
  const level = action.automatic ? "success" : result?.level;
  if (!level || !action.effects[level]) return state;
  const effect = action.effects[level];
  applyEffect(next, effect);
  next.campaign.actionsLeft -= 1;
  next.campaign.usedActions.push(action.id);
  if (!next.campaign.visitedLocations.includes(action.locationId)) next.campaign.visitedLocations.push(action.locationId);
  const entry = {day: next.campaign.day, actionId: action.id, locationId: action.locationId, level, roll: result?.roll ?? null, text: effect.text};
  next.campaign.actionLog.push(entry);
  next.history.push({context: `campaign-day-${next.campaign.day}`, ...entry, ...(result || {})});
  next.campaign.lastResult = {kind: action.isResponse ? "response" : "action", title: action.title, level, text: effect.text, roll: result?.roll ?? null};
  if (action.isResponse && (action.automatic || level === "critical" || level === "success" || level === "costly")) {
    next.campaign.mutationLog.push({day: next.campaign.day, mutationId: action.mutationId, status: "resolved", title: action.title, text: effect.text});
    next.campaign.activeMutationId = null;
  }
  if (next.resources.pressure >= 10) {
    endWithPressureDefeat(next);
    return next;
  }
  if (next.campaign.actionsLeft <= 0) return concludeDay(next);
  return next;
}

export function chooseCampaignStaff(state, staffId) {
  if (state.campaign.phase !== "staff" || !TEST8_STAFF[staffId]) return state;
  const next = structuredClone(state);
  next.campaign.staffId = staffId;
  next.party.active = staffId;
  next.party.members = [staffId];
  next.campaign.phase = "strategy";
  next.campaign.lastResult = {kind: "decision", title: `Do štábu přichází ${TEST8_STAFF[staffId].name}`, text: TEST8_STAFF[staffId].role};
  return next;
}

export function chooseFinalStrategy(state, strategyId) {
  if (state.campaign.phase !== "strategy" || !TEST8_STRATEGIES[strategyId]) return state;
  const next = structuredClone(state);
  next.campaign.finalStrategy = strategyId;
  next.campaign.day = 2;
  next.campaign.actionsLeft = 2;
  next.campaign.phase = "map";
  next.campaign.lastResult = {kind: "decision", title: TEST8_STRATEGIES[strategyId].name, text: `${TEST8_STRATEGIES[strategyId].description} Podmínka prohry: ${TEST8_STRATEGIES[strategyId].failure}`};
  return next;
}

export function availableFinalTactics(state) {
  if (state.campaign.phase !== "final-tactic") return [];
  return Object.entries(TEST8_FINALE_TACTICS[state.campaign.finalStrategy] || {}).map(([id, item]) => ({id, ...item}));
}

export function chooseFinalTactic(state, tacticId) {
  if (state.campaign.phase !== "final-tactic") return state;
  const tactic = TEST8_FINALE_TACTICS[state.campaign.finalStrategy]?.[tacticId];
  if (!tactic) return state;
  const next = structuredClone(state);
  next.campaign.finalTactic = tacticId;
  next.campaign.phase = "final";
  next.campaign.lastResult = {kind: "decision", title: tactic.name, text: tactic.detail};
  return next;
}

function doctrineGate(state) {
  const strategyId = state.campaign.finalStrategy;
  if (strategyId === "public") {
    const resourceOk = state.resources.support >= 6;
    const tacticOk = state.campaign.finalTactic === "open-mic" ? Boolean(state.campaign.flags.hallFilled) : Boolean(state.campaign.flags.broadcastReady);
    const ok = resourceOk && tacticOk;
    return {ok, label: state.campaign.finalTactic === "open-mic" ? "Podpora 6+ a zaplněný sál" : "Podpora 6+ a připravený přenos", actual: state.resources.support, reason: ok ? "Veřejný tlak má lidi i konkrétní nástroj." : "Chybí podpora nebo příprava zvolené veřejné taktiky."};
  }
  if (strategyId === "legal") {
    const resourceOk = state.resources.evidence >= 6 && !state.campaign.flags.legalChainBroken && !state.campaign.flags.saleSigned;
    const tacticOk = state.campaign.finalTactic === "injunction" ? Boolean(state.campaign.flags.injunctionReady) : Boolean(state.campaign.flags.affidavitReady);
    const ok = resourceOk && tacticOk;
    return {ok, label: state.campaign.finalTactic === "injunction" ? "Důkazy 6+ a připravené opatření" : "Důkazy 6+ a podepsaná svědectví", actual: state.resources.evidence, reason: ok ? "Právní řetězec i zvolený nástroj drží." : "Právní útok nemá důkazy nebo přípravu zvolené taktiky."};
  }
  const resourceOk = state.campaign.cases.jzd.progress >= 4 && !state.campaign.flags.workersRouteBroken && !state.campaign.flags.witnessesIntimidated && !state.campaign.flags.shiftSplit;
  const tacticOk = state.campaign.finalTactic === "blockade" ? Boolean(state.campaign.flags.blockadeReady || state.campaign.flags.gatesSecured) : Boolean(state.campaign.flags.strikeMandate);
  const ok = resourceOk && tacticOk;
  return {ok, label: state.campaign.finalTactic === "blockade" ? "JZD 4/4, jednotná směna a připravené brány" : "JZD 4/4, jednotná směna a stávkový mandát", actual: state.campaign.cases.jzd.progress, reason: ok ? "Směna drží pohromadě a má zvolený nástroj." : "Pracovníci nejsou jednotní nebo chybí příprava zvolené taktiky."};
}

export function finalCampaignChoice(state) {
  if (state.campaign.phase !== "final") return null;
  const strategyId = state.campaign.finalStrategy;
  const tactic = TEST8_FINALE_TACTICS[strategyId]?.[state.campaign.finalTactic];
  if (!tactic) return null;
  const gate = doctrineGate(state);
  const relevantPreparation = strategyId === "public"
    ? state.resources.support
    : strategyId === "legal"
      ? state.resources.evidence
      : state.campaign.cases.jzd.progress + (state.campaign.flags.gatesSecured ? 2 : 0) + (state.campaign.flags.strikeMandate ? 2 : 0);
  const reduction = Math.min(4, Math.floor(relevantPreparation / 2));
  const pressurePenalty = Math.floor(state.resources.pressure / 3);
  const mutationPenalty = state.campaign.activeMutationId ? 2 : 0;
  const flagBonus = [state.campaign.flags.hallFilled, state.campaign.flags.broadcastReady, state.campaign.flags.agendaSecured, state.campaign.flags.affidavitReady, state.campaign.flags.blockadeReady, state.campaign.flags.strikeMandate].filter(Boolean).length;
  const staffId = state.campaign.staffId;
  return {
    id: `final-${strategyId}-${state.campaign.finalTactic}`,
    label: tactic.name,
    detail: tactic.detail,
    attribute: tactic.attribute,
    gate,
    dc: clamp(tactic.baseDc - reduction - Math.min(2, flagBonus) + pressurePenalty + mutationPenalty, 8, 20),
    advantage: {
      classes: strategyId === "public" ? ["bard"] : strategyId === "legal" ? ["rogue"] : ["paladin"],
      companions: staffId ? [staffId] : []
    },
    advantageLabels: {
      classes: {
        bard: "Bard umí proměnit veřejný střet v událost.",
        rogue: "Rogue přesně ví, kterou přílohu položit navrch.",
        paladin: "Paladin udrží pracovníky pohromadě před tlakem rady."
      },
      companions: staffId ? {[staffId]: `${TEST8_STAFF[staffId].name} připravil finální tah ve své specializaci.`} : {}
    }
  };
}

function archivePlaytest(state) {
  const summary = playtestSummary(state);
  if (!state.playtests.some(item => item.runId === summary.runId)) state.playtests.push(summary);
}

function resolveCaseStatuses(next, won) {
  for (const item of Object.values(next.campaign.cases)) {
    if (won && item.progress >= 2) item.status = "resolved";
    else if (won) item.status = "carried";
    else if (item.neglect > 0 || item.progress < 2) item.status = "failed";
    else item.status = "unresolved";
  }
}

export function applyFinalCampaignResult(state, result) {
  if (state.campaign.phase !== "final" || !result) return state;
  const choice = finalCampaignChoice(state);
  if (!choice) return state;
  const next = structuredClone(state);
  const solvedCases = Object.values(next.campaign.cases).filter(item => item.progress >= 2).length;
  const totalNeglect = Object.values(next.campaign.cases).reduce((sum, item) => sum + item.neglect, 0);
  const strategicScore = next.resources.support + next.resources.evidence + solvedCases * 2 - next.resources.pressure - totalNeglect * 2;
  const rollWon = result.level === "critical" || result.level === "success" || (result.level === "costly" && strategicScore >= 5);
  const won = choice.gate.ok && rollWon;
  next.screen = "ending";
  next.campaign.phase = "finished";
  next.campaign.finishedAt = Date.now();
  next.history.push({context: "campaign-final", strategy: next.campaign.finalStrategy, tactic: next.campaign.finalTactic, ...result});
  resolveCaseStatuses(next, won);
  next.campaign.outcome = won ? {
    id: result.level === "costly" ? "costly-win" : "campaign-win",
    won: true,
    title: next.campaign.finalStrategy === "public" ? "Věčný prohrál před plným sálem" : next.campaign.finalStrategy === "legal" ? "Prodej zastavil právní zásah" : "Odvoz zastavila vlastní směna",
    text: solvedCases === 2 ? "Zastavili jste prodej JZD i rozpočtový trik se školní ulicí." : "Jednu kauzu jste zlomili. Druhá přežije do další kapitoly.",
    reason: `${choice.gate.reason} Strategická příprava ${strategicScore}, finální hod ${result.total} proti ${result.dc}.`
  } : {
    id: choice.gate.ok ? "campaign-defeat" : `${next.campaign.finalStrategy}-gate-defeat`,
    won: false,
    title: choice.gate.ok ? "Věčný ustál poslední střet" : "Doktrína selhala ještě před hodem",
    text: choice.gate.ok ? "Okamžik jste nezvládli, přestože příprava dávala šanci." : choice.gate.reason,
    reason: `${choice.gate.label}: skutečnost ${choice.gate.actual}. Finální hod ${result.total} proti ${result.dc}.`
  };
  archivePlaytest(next);
  return next;
}

export function playtestSummary(state, buildSha = "unknown") {
  const finishedAt = state.campaign.finishedAt || Date.now();
  return {
    runId: `${state.campaign.startedAt}-${state.hero.classId}-${state.hero.originId}`,
    version: state.version,
    buildSha,
    durationSeconds: Math.max(0, Math.round((finishedAt - state.campaign.startedAt) / 1000)),
    hero: {classId: state.hero.classId, originId: state.hero.originId},
    daysReached: state.campaign.day,
    actions: state.campaign.actionLog,
    visitedLocations: state.campaign.visitedLocations,
    sacrifices: state.campaign.sacrificeLog,
    mutations: state.campaign.mutationLog,
    activeMutationId: state.campaign.activeMutationId,
    cases: state.campaign.cases,
    rivalActions: state.campaign.rivalLog,
    staffId: state.campaign.staffId,
    finalStrategy: state.campaign.finalStrategy,
    finalTactic: state.campaign.finalTactic,
    rolls: state.history.filter(item => Number.isInteger(item.roll)).map(item => ({context: item.context, actionId: item.actionId || item.choiceId, roll: item.roll, level: item.level})),
    resources: state.resources,
    flags: state.campaign.flags,
    outcome: state.campaign.outcome
  };
}

export function exportPlaytest(state, buildSha = "unknown") {
  return JSON.stringify(playtestSummary(state, buildSha), null, 2);
}

export function saveTest8State(state) {
  try { localStorage.setItem(TEST8_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

export function loadTest8State() {
  try {
    const raw = localStorage.getItem(TEST8_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.saveSchema !== TEST8_SAVE_SCHEMA) return null;
    parsed.version = VERSION;
    return parsed;
  } catch { return null; }
}

export function clearTest8Save() {
  try { localStorage.removeItem(TEST8_STORAGE_KEY); return true; } catch { return false; }
}
