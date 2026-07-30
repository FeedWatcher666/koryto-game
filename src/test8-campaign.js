import {COMPANIONS, VERSION} from "./data.js";
import {clamp, deriveAttributes} from "./rules.js";

export const TEST8_SAVE_SCHEMA = 3;
export const TEST8_STORAGE_KEY = "koryto.clean.v0200.test8";

export const TEST8_LOCATIONS = {
  jzd: {name: "Areál bývalého JZD", icon: "JZD", description: "Stroje mizí rychleji než zápisy z rady."},
  pub: {name: "Hospoda U Tří razítek", icon: "U3R", description: "Místní informační systém s pěnou."},
  office: {name: "Obecní úřad", icon: "OU", description: "Budova, kde příloha existuje hlavně jako pojem."}
};

export const TEST8_STAFF = {
  marie: {name: COMPANIONS.marie.name, role: "Odemkne úřední přílohy", locationId: "office"},
  bohumil: {name: COMPANIONS.bohumil.name, role: "Odemkne hospodskou koalici", locationId: "pub"},
  radek: {name: COMPANIONS.radek.name, role: "Odemkne skrytou halu JZD", locationId: "jzd"}
};

export const TEST8_STRATEGIES = {
  public: {name: "Veřejné jednání", description: "Opřít se o lidi a přinutit radu hlasovat před svědky.", attribute: "charisma"},
  legal: {name: "Právní přepad", description: "Položit na stůl přílohy, které starosta považoval za ztracené.", attribute: "intellect"},
  workers: {name: "Blokáda pracovníků", description: "Přivést lidi z JZD a zastavit odvoz majetku fyzicky.", attribute: "authority"}
};

const ACTIONS = [
  {
    id: "jzd-logbook", day: 1, locationId: "jzd", title: "Zkontrolovat knihu jízd",
    detail: "Vrátný má seznam aut. Tři z nich oficiálně neexistují.", intent: "+ důkazy o odvozu", risk: "Věčný zjistí, že se ptáte", attribute: "intellect", dc: 12,
    advantage: {classes: ["rogue"]}, advantageLabels: {classes: {rogue: "Rogue pozná falešnou SPZ i pravou lež."}},
    effects: {
      critical: {evidence: 3, case: {jzd: 2}, support: 1, text: "Najdete i kopii podpisu starostova řidiče."},
      success: {evidence: 2, case: {jzd: 2}, text: "Kniha jízd potvrzuje noční odvoz techniky."},
      costly: {evidence: 1, pressure: 1, case: {jzd: 1}, text: "Máte čísla aut, ale vrátný volá starostovi."},
      complication: {pressure: 2, neglect: {jzd: 1}, text: "Vrátný knihu zabaví a vaše jméno pošle dál."}
    }
  },
  {
    id: "pub-workers", day: 1, locationId: "pub", title: "Promluvit s noční směnou",
    detail: "Pracovníci vědí, co zmizelo. Nevědí, zda vám mohou věřit.", intent: "+ podpora a svědectví", risk: "někdo rozhovor prodá dál", attribute: "charisma", dc: 10,
    advantage: {classes: ["bard"]}, advantageLabels: {classes: {bard: "Bard umí poslouchat způsobem, který vypadá jako vysílání."}},
    effects: {
      critical: {support: 3, evidence: 1, case: {jzd: 1}, text: "Celá směna souhlasí, že vystoupí veřejně."},
      success: {support: 2, evidence: 1, case: {jzd: 1}, text: "Získáte svědka a jméno řidiče."},
      costly: {support: 1, pressure: 1, text: "Jeden svědek kývne, druhý už píše Věčnému."},
      complication: {support: -1, pressure: 1, neglect: {jzd: 1}, text: "Rozhovor se rozpadne na tři fámy a jednu urážku."}
    }
  },
  {
    id: "office-contract", day: 1, locationId: "office", title: "Vyžádat smlouvu o prodeji",
    detail: "Smlouva je veřejná. Příloha, cena a kupující už méně.", intent: "+ důkazy z úřadu", risk: "úřednice zavolá vedení", attribute: "authority", dc: 12, honest: true,
    advantage: {classes: ["paladin"]}, advantageLabels: {classes: {paladin: "Paladin vysloví slovo zákon tak, že se otevře i zamčená spisovna."}},
    effects: {
      critical: {evidence: 3, support: 1, case: {jzd: 2}, text: "Dostanete smlouvu i neveřejnou přílohu s cenou."},
      success: {evidence: 2, case: {jzd: 1}, text: "Smlouva potvrzuje prodej pod cenou."},
      costly: {evidence: 1, pressure: 1, text: "Smlouvu máte, ale úřad začne hledat, kdo ji vydal."},
      complication: {pressure: 2, text: "Úřad žádost zaeviduje pod názvem nepřátelská činnost."}
    }
  },
  {
    id: "jzd-witness", day: 2, locationId: "jzd", title: "Ochraňovat svědky z JZD",
    detail: "Věčný nabízí pracovníkům nové smlouvy výměnou za starou paměť.", intent: "+ podpora, zabránit odvetě", risk: "přijdete o čas na silnici", attribute: "morality", dc: 12,
    effects: {
      critical: {support: 3, case: {jzd: 2}, pressure: -1, text: "Pracovníci podepíší společnou výpověď."},
      success: {support: 2, case: {jzd: 1}, text: "Svědci zůstanou na vaší straně."},
      costly: {support: 1, pressure: 1, text: "Svědci vydrží, ale chtějí veřejnou ochranu."},
      complication: {pressure: 2, neglect: {jzd: 1}, text: "Jeden svědek couvne a druhý je přeřazen na noční."}
    }
  },
  {
    id: "pub-road", day: 2, locationId: "pub", title: "Získat rodiče ze školní ulice",
    detail: "Silnice ke škole je rozkopaná třetí rok. Dodavatel je bratranec správného člověka.", intent: "+ podpora pro druhou kauzu", risk: "JZD zůstane bez ochrany", attribute: "charisma", dc: 11,
    effects: {
      critical: {support: 3, case: {road: 2}, text: "Rodiče přinesou fotky, účtenky i vlastní megafon."},
      success: {support: 2, case: {road: 2}, text: "Školní ulice se přidá ke kampani."},
      costly: {support: 1, pressure: 1, case: {road: 1}, text: "Rodiče pomohou, ale chtějí silnici jako první slib."},
      complication: {support: -1, pressure: 1, neglect: {road: 1}, text: "Schůze se změní v hádku o parkování."}
    }
  },
  {
    id: "office-invoices", day: 2, locationId: "office", title: "Porovnat faktury za školní ulici",
    detail: "Stejný výkop byl podle účetnictví otevřen čtyřikrát.", intent: "+ důkazy k druhé kauze", risk: "přijdete o podporu svědků", attribute: "intellect", dc: 13,
    effects: {
      critical: {evidence: 3, case: {road: 2}, text: "Najdete čtyři faktury a jedinou díru."},
      success: {evidence: 2, case: {road: 2}, text: "Faktury dokazují opakované účtování stejné práce."},
      costly: {evidence: 1, pressure: 1, case: {road: 1}, text: "Čísla sedí jen díky tomu, že dvě stránky chybí."},
      complication: {pressure: 2, neglect: {road: 1}, text: "Účetní systém se náhle přepne do režimu údržby."}
    }
  },
  {
    id: "staff-marie-annex", day: 2, locationId: "office", requiresStaff: "marie", title: "Marie najde ztracenou přílohu",
    detail: "Příloha neleží ve spise. Leží ve složce Vánoční výzdoba 2019.", intent: "silný důkaz bez hodu", risk: "Marie bude označena za zdroj", automatic: true,
    effects: {success: {evidence: 2, case: {jzd: 1, road: 1}, pressure: 1, text: "Marie vytáhne přílohu spojující obě zakázky."}}
  },
  {
    id: "staff-bohumil-room", day: 2, locationId: "pub", requiresStaff: "bohumil", title: "Bohumil uzavře zadní salonek",
    detail: "Na dvě hodiny se z hospody stane bezpečný politický štáb.", intent: "silná podpora bez hodu", risk: "hospoda přijde o obecní večírek", automatic: true,
    effects: {success: {support: 3, pressure: 1, case: {road: 1}, text: "Bohumil spojí rodiče, pracovníky i dva věčné nespokojence."}}
  },
  {
    id: "staff-radek-hall", day: 2, locationId: "jzd", requiresStaff: "radek", title: "Radek otevře skrytou halu",
    detail: "Kamera je vypnutá, vrata ne. Radek ví proč.", intent: "důkaz a ochrana pracovníků", risk: "Věčný pozná, kdo vás pustil", automatic: true,
    effects: {success: {evidence: 2, support: 1, case: {jzd: 2}, pressure: 1, text: "V hale najdete prodané stroje, které nikdy neodjely."}}
  },
  {
    id: "jzd-final-prep", day: 3, locationId: "jzd", title: "Přivést pracovníky na jednání",
    detail: "Svědectví je silné jen tehdy, když svědek opravdu přijde.", intent: "+ podpora finále", risk: "Věčný zastraší rodiny", attribute: "authority", dc: 12,
    effects: {
      critical: {support: 3, case: {jzd: 1}, pressure: -1, text: "Přijde celá směna v montérkách."},
      success: {support: 2, case: {jzd: 1}, text: "Dva svědci přijdou osobně."},
      costly: {support: 1, pressure: 1, text: "Jeden svědek přijde, druhý chce anonymitu."},
      complication: {pressure: 2, support: -1, text: "Svědci zůstanou doma po návštěvě místostarosty."}
    }
  },
  {
    id: "pub-final-prep", day: 3, locationId: "pub", title: "Zaplnit veřejné jednání",
    detail: "Prázdná židle nepíská na starostu. Plná ano.", intent: "+ veřejná podpora", risk: "přijdou i Věčného lidé", attribute: "media", dc: 12,
    effects: {
      critical: {support: 4, pressure: -1, text: "Přijde víc lidí než židlí a poprvé to pomůže."},
      success: {support: 2, text: "Jednání bude plné vašich podporovatelů."},
      costly: {support: 1, pressure: 1, text: "Sál se naplní oběma tábory."},
      complication: {pressure: 2, text: "Pozvánku převezme Věčný a svolá vlastní publikum."}
    }
  },
  {
    id: "office-final-prep", day: 3, locationId: "office", title: "Vynutit bod na programu",
    detail: "Bez bodu programu je důkaz pouze papír s ambicí.", intent: "zlevnit finální střet", risk: "rada vás může vykázat", attribute: "authority", dc: 13, honest: true,
    effects: {
      critical: {evidence: 2, support: 1, case: {road: 1}, text: "Tajemnice zařadí oba body a pošle program občanům."},
      success: {evidence: 2, case: {road: 1}, text: "Prodej JZD se dostane na program."},
      costly: {evidence: 1, pressure: 1, text: "Bod je na programu jako různé."},
      complication: {pressure: 2, text: "Rada bod odmítne a Věčný dostane čas připravit odpověď."}
    }
  }
];

const RIVAL_PLANS = {
  1: {title: "Odvézt poslední účetní knihy z JZD", trigger: "Pokud nezískáte alespoň 2 důkazy.", resolve(state) {
    if (state.resources.evidence >= 2 || state.campaign.cases.jzd.progress >= 2) return {pressure: 1, text: "Věčný odveze jen prázdné šanony. Ví ale, že jste ho zdrželi."};
    return {pressure: 2, evidence: -1, neglect: {jzd: 1}, text: "Z JZD odjede dodávka s účetními knihami. Zůstanou jen obaly."};
  }},
  2: {title: "Přesměrovat peníze ze školní ulice", trigger: "Pokud druhá kauza zůstane bez pokroku.", resolve(state) {
    if (state.campaign.cases.road.progress >= 2) return {pressure: 1, text: "Převod peněz se nepodaří utajit. Věčný přesto získá den navíc."};
    return {pressure: 2, support: -1, neglect: {road: 1}, text: "Rozpočet silnice zmizí v dodatku ke kulturnímu stanu."};
  }},
  3: {title: "Zaplnit jednání vlastními lidmi", trigger: "Pokud nemáte alespoň 5 podpory.", resolve(state) {
    if (state.resources.support >= 5) return {pressure: 1, text: "Věčného autobus přijede, ale sál už je plný."};
    return {pressure: 2, support: -1, text: "První tři řady obsadí zaměstnanci obce a příbuzní zaměstnanců obce."};
  }}
};

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
      day: 1, actionsLeft: 2, phase: "map", cases: baseCases(), usedActions: [], visitedLocations: [],
      actionLog: [], rivalLog: [], staffId: null, finalStrategy: null, lastResult: null, outcome: null,
      startedAt: Date.now(), finishedAt: null
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

export function currentRivalPlan(state) {
  return RIVAL_PLANS[state.campaign.day] || RIVAL_PLANS[3];
}

export function availableCampaignActions(state) {
  if (state.screen !== "campaign" || state.campaign.phase !== "map" || state.campaign.actionsLeft <= 0) return [];
  return ACTIONS.filter(action => {
    if (action.day !== state.campaign.day) return false;
    if (state.campaign.usedActions.includes(action.id)) return false;
    if (action.requiresStaff && action.requiresStaff !== state.campaign.staffId) return false;
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

function applyEffect(next, effect) {
  next.resources.support = clamp(next.resources.support + (effect.support || 0), 0, 10);
  next.resources.evidence = clamp(next.resources.evidence + (effect.evidence || 0), 0, 10);
  next.resources.pressure = clamp(next.resources.pressure + (effect.pressure || 0), 0, 10);
  for (const [caseId, amount] of Object.entries(effect.case || {})) {
    next.campaign.cases[caseId].progress = clamp(next.campaign.cases[caseId].progress + amount, 0, 4);
  }
  for (const [caseId, amount] of Object.entries(effect.neglect || {})) {
    next.campaign.cases[caseId].neglect = clamp(next.campaign.cases[caseId].neglect + amount, 0, 3);
  }
}

function applyRivalPlan(next) {
  const plan = currentRivalPlan(next);
  const effect = plan.resolve(next);
  applyEffect(next, effect);
  next.campaign.rivalLog.push({day: next.campaign.day, title: plan.title, text: effect.text});
  return effect;
}

function endWithPressureDefeat(next) {
  next.screen = "ending";
  next.campaign.phase = "finished";
  next.campaign.finishedAt = Date.now();
  next.campaign.outcome = {
    id: "pressure-defeat", won: false, title: "Věčný ovládl tempo kampaně",
    text: "Neprohráli jste jedním hodem. Prohráli jste tím, že soupeř určoval, co budete řešit.",
    reason: "Tlak dosáhl maxima před finálním střetem."
  };
  archivePlaytest(next);
}

function concludeDay(next) {
  const rivalEffect = applyRivalPlan(next);
  next.campaign.lastResult = {kind: "rival", title: currentRivalPlan(next).title, text: rivalEffect.text};
  if (next.resources.pressure >= 10) {
    endWithPressureDefeat(next);
    return next;
  }
  if (next.campaign.day === 1) {
    next.campaign.phase = "staff";
    next.campaign.cases.road.status = "active";
  } else if (next.campaign.day === 2) {
    next.campaign.phase = "strategy";
  } else {
    next.campaign.phase = "final";
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
  next.campaign.lastResult = {kind: "action", title: action.title, level, text: effect.text, roll: result?.roll ?? null};
  if (next.campaign.actionsLeft <= 0) return concludeDay(next);
  return next;
}

export function chooseCampaignStaff(state, staffId) {
  if (state.campaign.phase !== "staff" || !TEST8_STAFF[staffId]) return state;
  const next = structuredClone(state);
  next.campaign.staffId = staffId;
  next.party.active = staffId;
  next.party.members = [staffId];
  next.campaign.day = 2;
  next.campaign.actionsLeft = 2;
  next.campaign.phase = "map";
  next.campaign.lastResult = {kind: "decision", title: `Do štábu přichází ${TEST8_STAFF[staffId].name}`, text: TEST8_STAFF[staffId].role};
  return next;
}

export function chooseFinalStrategy(state, strategyId) {
  if (state.campaign.phase !== "strategy" || !TEST8_STRATEGIES[strategyId]) return state;
  const next = structuredClone(state);
  next.campaign.finalStrategy = strategyId;
  next.campaign.day = 3;
  next.campaign.actionsLeft = 2;
  next.campaign.phase = "map";
  next.campaign.lastResult = {kind: "decision", title: TEST8_STRATEGIES[strategyId].name, text: TEST8_STRATEGIES[strategyId].description};
  return next;
}

export function finalCampaignChoice(state) {
  if (state.campaign.phase !== "final") return null;
  const strategyId = state.campaign.finalStrategy || "public";
  const strategy = TEST8_STRATEGIES[strategyId];
  const preparation = strategyId === "public"
    ? state.resources.support
    : strategyId === "legal"
      ? state.resources.evidence
      : state.campaign.cases.jzd.progress + Math.max(0, state.resources.support - 2);
  const reduction = Math.min(4, Math.floor(preparation / 2));
  const neglectPenalty = state.campaign.cases.jzd.neglect + state.campaign.cases.road.neglect;
  const pressurePenalty = Math.floor(state.resources.pressure / 3);
  const staffId = state.campaign.staffId;
  return {
    id: `final-${strategyId}`,
    label: strategy.name,
    detail: strategy.description,
    attribute: strategy.attribute,
    dc: clamp(15 - reduction + neglectPenalty + pressurePenalty, 8, 20),
    advantage: {
      classes: strategyId === "public" ? ["bard"] : strategyId === "legal" ? ["rogue"] : ["paladin"],
      companions: staffId ? [staffId] : []
    },
    advantageLabels: {
      classes: {
        bard: "Bard umí proměnit jednání v událost.",
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

export function applyFinalCampaignResult(state, result) {
  if (state.campaign.phase !== "final" || !result) return state;
  const next = structuredClone(state);
  const solvedCases = Object.values(next.campaign.cases).filter(item => item.progress >= 2).length;
  const totalNeglect = Object.values(next.campaign.cases).reduce((sum, item) => sum + item.neglect, 0);
  const strategicScore = next.resources.support + next.resources.evidence + solvedCases * 2 - next.resources.pressure - totalNeglect * 2;
  const won = result.level === "critical" || result.level === "success" || (result.level === "costly" && strategicScore >= 5);
  next.screen = "ending";
  next.campaign.phase = "finished";
  next.campaign.finishedAt = Date.now();
  next.history.push({context: "campaign-final", strategy: next.campaign.finalStrategy, ...result});
  next.campaign.outcome = won ? {
    id: result.level === "costly" ? "costly-win" : "campaign-win", won: true,
    title: result.level === "costly" ? "Vyhráli jste, ale obec vystavila účet" : "Věčný ztratil kontrolu nad jednáním",
    text: solvedCases === 2 ? "Zastavili jste prodej JZD i rozpočtový trik se školní ulicí." : "Jednu kauzu jste zlomili. Druhá přežije do další kapitoly.",
    reason: `Strategická příprava ${strategicScore}, finální hod ${result.total} proti ${result.dc}.`
  } : {
    id: "campaign-defeat", won: false, title: "Jednání skončilo dřív, než začala pravda",
    text: "Důkazy, lidé nebo čas nestačily současně. Věčný ustál hlasování a získal další období klidu.",
    reason: `Strategická příprava ${strategicScore}, finální hod ${result.total} proti ${result.dc}.`
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
    cases: state.campaign.cases,
    rivalActions: state.campaign.rivalLog,
    staffId: state.campaign.staffId,
    finalStrategy: state.campaign.finalStrategy,
    rolls: state.history.filter(item => Number.isInteger(item.roll)).map(item => ({context: item.context, actionId: item.actionId || item.choiceId, roll: item.roll, level: item.level})),
    resources: state.resources,
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
