"use strict";
(() => {
  const VERSION = "0.14.6 TEST.10";
  const BUILD_VERSION = "0.14.6-test.10";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const RELEASE_FLAG = "v0146PlaytestComplete";
  const CLASS_IDS = ["bard", "rogue", "paladin", "mage", "technocrat", "necro"];

  const profiles = {
    novice: {
      label: "Zacatecnik",
      strategy: "mixed",
      urgentBias: 9,
      firstChoiceBias: 8,
      skipRate: 0.03,
      weights: { public: 3, ethical: 2, transparent: 2, legal: 1 },
      expectedWinFloor: 5,
      coalitionStyle: "safe"
    },
    idealist: {
      label: "Poctivy idealista",
      strategy: "ideal",
      urgentBias: 8,
      skipRate: 0,
      weights: { ethical: 8, transparent: 6, legal: 4, public: 3, corrupt: -12, lie: -7, power: -2 },
      expectedWinFloor: 5
    },
    pragmatist: {
      label: "Pragmaticky vitez",
      strategy: "mixed",
      urgentBias: 7,
      skipRate: 0.01,
      effectWeights: { support: 2.2, trust: 1.6, influence: 1.6, funds: 0.7, heat: -0.7, integrity: 0.4 },
      expectedWinFloor: 10
    },
    corrupt: {
      label: "Bezohledny korytar",
      strategy: "corrupt",
      urgentBias: 5,
      skipRate: 0.02,
      weights: { corrupt: 9, power: 6, contract: 5, lie: 3, ethical: -5, transparent: -3 },
      effectWeights: { funds: 2, influence: 2, leverage: 1.5, integrity: -0.3 },
      expectedWinFloor: 5
    },
    chaotic: {
      label: "Chaoticky hrac",
      strategy: "mixed",
      urgentBias: 0,
      randomChoice: true,
      randomActivity: true,
      skipRate: 0.13
    },
    questIgnoring: {
      label: "Ignoruje questy",
      strategy: "populist",
      urgentBias: -8,
      skipRate: 0.08,
      repeatBias: 6,
      weights: { public: 5, lie: 2 }
    },
    resourceMax: {
      label: "Maximalizator zdroju",
      strategy: "legal",
      urgentBias: 3,
      skipRate: 0,
      effectWeights: { funds: 2.4, influence: 2.4, leverage: 1.5, support: 0.4, heat: -0.3 }
    },
    mobileMisclick: {
      label: "Mobilni nepresny hrac",
      strategy: "mixed",
      urgentBias: 6,
      firstChoiceBias: 3,
      misclickRate: 0.16,
      skipRate: 0.07,
      weights: { public: 2, ethical: 1, legal: 1 }
    }
  };

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const round = (value, digits = 1) => {
    const factor = 10 ** digits;
    return Math.round(finite(value) * factor) / factor;
  };
  const mean = values => values.length ? values.reduce((sum, value) => sum + finite(value), 0) / values.length : 0;
  const pct = (value, total) => total ? round(value * 100 / total, 1) : 0;
  const clone = value => JSON.parse(JSON.stringify(value));
  const choiceEffects = choice => ({ ...(choice?.success?.effects || {}), ...(choice?.effects || {}) });

  function weightedScore(choice, profile, index = 0) {
    if (profile.randomChoice) return rng() * 100;
    const tags = choice?.tags || [];
    let score = 0;
    for (const tag of tags) score += finite(profile.weights?.[tag]);
    const effects = choiceEffects(choice);
    for (const [key, weight] of Object.entries(profile.effectWeights || {})) score += finite(effects[key]) * finite(weight);
    if (profile.firstChoiceBias) score += index === 0 ? profile.firstChoiceBias : 0;
    score += rng() * 0.25;
    return score;
  }

  function activityScore(activity, locationId, profile) {
    let score = rng();
    if (activity?.urgent) score += finite(profile.urgentBias);
    if (activity?.repeatable) score += finite(profile.repeatBias);
    if (profile.randomActivity) return rng() * 100;
    const event = eventById(activity.id);
    if (event?.choices?.length) score += Math.max(...event.choices.map((choice, index) => weightedScore(choice, profile, index))) * 0.08;
    if (locationId === "hq" && profile === profiles.novice) score += 0.5;
    return score;
  }

  function snapshotQuests(target) {
    return Object.fromEntries(Object.entries(target?.quests || {}).map(([id, quest]) => [id, {
      status: quest?.status || "missing",
      stage: finite(quest?.stage)
    }]));
  }

  function questTransitions(before, after, telemetry) {
    for (const id of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
      const oldQuest = before?.[id] || { status: "missing", stage: 0 };
      const nextQuest = after?.[id] || { status: "missing", stage: 0 };
      if (oldQuest.status !== nextQuest.status || oldQuest.stage !== nextQuest.stage) {
        telemetry.questTransitions.push({ id, from: oldQuest, to: nextQuest, day: finite(state?.day) });
      }
    }
  }

  function applyChoiceResult(event, choice, level, roll) {
    const out = (level === "critical" || level === "success" || level === "costly") ? choice.success : choice.fail;
    let effects = { ...(out?.effects || {}) };
    if (event.repeatable) {
      const uses = state.genericUses[event.id] || 0;
      const multiplier = [1, 0.62, 0.35][uses] || 0.2;
      for (const key of Object.keys(effects)) if (effects[key] > 0) effects[key] = Math.max(1, Math.round(effects[key] * multiplier));
      if (uses > 0) effects.heat = (effects.heat || 0) + uses;
      state.genericUses[event.id] = uses + 1;
      state.cooldowns[event.id] = state.day + 2;
    }
    if (level === "critical") {
      for (const key of Object.keys(effects)) effects[key] = Math.round(effects[key] * 1.35);
      effects.support = (effects.support || 0) + 2;
    }
    if (level === "costly") {
      for (const key of Object.keys(effects)) if (effects[key] > 0) effects[key] = Math.max(1, Math.round(effects[key] * 0.68));
      const penalty = costlyPenalty(choice.tags || [], event.id);
      for (const [key, value] of Object.entries(penalty)) effects[key] = (effects[key] || 0) + value;
    }
    if (level === "complication" && roll === 1) {
      for (const key of Object.keys(effects)) effects[key] = effects[key] > 0 ? Math.floor(effects[key] * 0.3) : Math.round(effects[key] * 1.25);
      effects.heat = (effects.heat || 0) + 5;
    }
    if (state.hero.classId === "rogue" && choice.tags?.includes("corrupt") && effects.funds > 0) effects.funds += 3;
    effect(effects);
    registerApproach(choice.tags || []);
    state.audit.rolls++;
    state.audit.outcomes[level] = (state.audit.outcomes[level] || 0) + 1;
    state.audit.locations[state.currentLocation] = (state.audit.locations[state.currentLocation] || 0) + 1;
    applyVoterReaction(out?.tags || choice.tags || [], event.id, level);
    partyReact(out?.tags || choice.tags || []);
    out?.extra?.();
    if (event.id.endsWith("Personal")) {
      const companionId = event.id.replace("Personal", "");
      if (state.companionStories[companionId]) state.companionStories[companionId].done = true;
    }
    createCommitmentFromChoice(event.id, choice, level);
    trackLivingWorld(event.id, choice, level);
    updateCompanionAmbitions(event.id, choice, level);
    if (echoEventDefs[event.id]) registerEcho(event.id, { tags: choice.tags || [], level });
    event.after?.();
    if (!event.repeatable && !event.queued) state.flags["done_" + event.id] = true;
    if (event.queued || state.pendingEvents.includes(event.id)) {
      state.pendingEvents = state.pendingEvents.filter(id => id !== event.id);
      delete state.pendingMeta[event.id];
      state.flags["resolved_" + event.id] = true;
    }
    return { out, effects };
  }

  function finishCoalition(profile) {
    if (!state.coalition?.active) return;
    for (const id of ["civic", "rural", "progress", "oldguard"]) {
      if (state.coalition.seats >= state.coalition.needed || state.coalition.round > state.coalition.maxRounds) break;
      const partner = state.coalition.partners[id];
      if (!partner || partner.seats === 0 || partner.locked || partner.joined) continue;
      const offers = coalitionOfferDefs(id);
      const preferred = profile.coalitionStyle === "safe" || profile.strategy === "ideal" || profile.strategy === "legal" ? offers[0] : profile.strategy === "corrupt" ? offers[2] : offers[1];
      const resource = state.coalition.resources[preferred.resource];
      if (resource < preferred.cost) continue;
      state.coalition.resources[preferred.resource] = Math.max(0, resource - preferred.cost);
      const bonus = classCoalitionBonus(preferred.id) + Math.floor(resource / 25);
      const success = rand(1, 20) + attributeMod(preferred.attr) + bonus >= preferred.dc;
      if (success) {
        partner.joined = true;
        state.coalition.joined.push(id);
        state.coalition.seats += partner.seats;
      } else partner.locked = true;
      state.coalition.round++;
    }
    state.flags.coalitionFormed = state.coalition.seats >= state.coalition.needed;
    state.ended = true;
  }

  function simulateProfile(profileId = "novice", runSeed = 0, options = {}) {
    const profile = profiles[profileId] || profiles.novice;
    const classId = options.classId || CLASS_IDS[Math.abs(runSeed) % CLASS_IDS.length];
    const origin = options.origin || (profile.strategy === "ideal" ? "idealist" : profile.strategy === "corrupt" ? "ambitious" : "revenge");
    globalThis.__KORYTO_PLAYTEST_RUNNING__ = true;
    const telemetry = {
      profile: profileId,
      classId,
      origin,
      events: [],
      decisions: [],
      questTransitions: [],
      wastedActions: 0,
      emptyActivityDays: 0,
      invalidNumbers: [],
      deadlock: false
    };

    state = deep(baseState);
    state.seed = `LAB-${profileId}-${classId}-${String(runSeed)}`;
    state.rngState = hashSeed(state.seed);
    state.hero = { name: "AI Tester", classId, origin, attrs: { ...(classes[classId]?.attrs || classes.bard.attrs) } };
    initQuests();
    initVoters();
    initSurprises();
    initLivingWorld();
    normalizeState();
    state.flags.introDone = true;
    completeQuest("register");
    let guard = 0;

    while (!state.ended && guard++ < 100) {
      unlockByDay();
      if (state.day >= 5) unlockQuest("meadow");
      if (state.day >= 14) {
        finalizeElection();
        break;
      }
      if (state.actions > 0 && rng() < finite(profile.skipRate)) {
        telemetry.wastedActions += state.actions;
        const before = snapshotQuests(state);
        endDay();
        questTransitions(before, snapshotQuests(state), telemetry);
        continue;
      }
      const locationsWithActivities = Object.keys(locations)
        .map(id => ({ id, activities: getActivities(id) }))
        .filter(item => item.activities.length);
      if (!locationsWithActivities.length) {
        telemetry.emptyActivityDays++;
        const before = snapshotQuests(state);
        endDay();
        questTransitions(before, snapshotQuests(state), telemetry);
        continue;
      }
      const ranked = locationsWithActivities.flatMap(location => location.activities.map(activity => ({
        ...activity,
        locationId: location.id,
        score: activityScore(activity, location.id, profile)
      }))).sort((a, b) => b.score - a.score);
      const activity = ranked[0];
      state.currentLocation = activity.locationId;
      state.currentEvent = activity.id;
      telemetry.events.push(activity.id);
      const questsBefore = snapshotQuests(state);

      if (activity.id === "debate") {
        simulateDebate(profile.strategy);
        state.flags.done_debate = true;
        consumeAction();
        questTransitions(questsBefore, snapshotQuests(state), telemetry);
        continue;
      }

      const event = eventById(activity.id);
      if (!event?.choices?.length) {
        telemetry.deadlock = true;
        consumeAction();
        continue;
      }
      const rankedChoices = event.choices.map((choice, index) => ({ choice, index, score: weightedScore(choice, profile, index) })).sort((a, b) => b.score - a.score);
      let selected = rankedChoices[0];
      if (profile.misclickRate && rng() < profile.misclickRate) selected = rankedChoices[Math.min(1, rankedChoices.length - 1)];
      const choice = selected.choice;
      if (chargeChoice(choice) === false) {
        telemetry.decisions.push({ day: state.day, event: event.id, choice: selected.index, label: choice.label, blocked: true, level: "blocked", tags: choice.tags || [] });
        consumeAction();
        questTransitions(questsBefore, snapshotQuests(state), telemetry);
        continue;
      }
      const beforeStats = { ...state.stats };
      const modifier = checkMod(choice);
      let roll = rand(1, 20);
      let level = rollLevel(roll, roll + modifier, choice.check.dc);
      if ((level === "costly" || level === "complication") && state.hero.classId === "bard" && choice.tags?.includes("public") && state.abilityUsedDay !== state.day) {
        roll = rand(1, 20);
        level = rollLevel(roll, roll + modifier, choice.check.dc);
        state.abilityUsedDay = state.day;
      }
      const applied = applyChoiceResult(event, choice, level, roll);
      telemetry.decisions.push({
        day: state.day,
        event: event.id,
        location: activity.locationId,
        choice: selected.index,
        label: choice.label,
        tags: choice.tags || [],
        level,
        roll,
        modifier,
        effects: applied.effects,
        delta: Object.fromEntries(Object.keys(state.stats).map(key => [key, finite(state.stats[key]) - finite(beforeStats[key])]).filter(([, value]) => value !== 0))
      });
      questTransitions(questsBefore, snapshotQuests(state), telemetry);
      consumeAction();
    }

    if (guard >= 100 && !state.ended) telemetry.deadlock = true;
    finishCoalition(profile);
    for (const [key, value] of Object.entries(state.stats || {})) if (!Number.isFinite(Number(value))) telemetry.invalidNumbers.push(key);
    const quests = snapshotQuests(state);
    const seats = finite(state.flags?.seats);
    const majority = finite(state.flags?.majority, 8);
    const won = seats >= majority || Boolean(state.flags?.coalitionFormed);
    globalThis.__KORYTO_PLAYTEST_RUNNING__ = false;
    return {
      profile: profileId,
      classId,
      origin,
      ended: Boolean(state.ended),
      won,
      vote: finite(state.flags?.vote),
      seats,
      coalition: Boolean(state.flags?.coalitionFormed),
      heat: finite(state.stats?.heat),
      debt: finite(state.debt),
      trust: finite(state.stats?.trust),
      support: finite(state.stats?.support),
      integrity: finite(state.stats?.integrity),
      influence: finite(state.stats?.influence),
      funds: finite(state.stats?.funds),
      day: finite(state.day),
      actions: finite(state.actions),
      route: telemetry.events.join("|"),
      quests,
      telemetry
    };
  }

  function groupSummary(results, key) {
    const groups = {};
    for (const result of results) (groups[result[key]] ||= []).push(result);
    return Object.fromEntries(Object.entries(groups).map(([id, rows]) => [id, {
      runs: rows.length,
      completionRate: pct(rows.filter(row => row.ended).length, rows.length),
      winRate: pct(rows.filter(row => row.won).length, rows.length),
      averageVote: round(mean(rows.map(row => row.vote))),
      averageSeats: round(mean(rows.map(row => row.seats))),
      averageHeat: round(mean(rows.map(row => row.heat))),
      averageDebt: round(mean(rows.map(row => row.debt))),
      averageIntegrity: round(mean(rows.map(row => row.integrity))),
      deadlocks: rows.filter(row => row.telemetry.deadlock).length,
      wastedActions: rows.reduce((sum, row) => sum + row.telemetry.wastedActions, 0)
    }]));
  }

  function questSummary(results) {
    const ids = Object.keys(globalThis.KorytoQuestData?.definitions || {});
    return Object.fromEntries(ids.map(id => {
      const statuses = results.map(result => result.quests[id]?.status || "missing");
      return [id, {
        runs: results.length,
        completed: statuses.filter(status => status === "done").length,
        failed: statuses.filter(status => status === "failed").length,
        active: statuses.filter(status => status === "active").length,
        locked: statuses.filter(status => status === "locked").length,
        completionRate: pct(statuses.filter(status => status === "done").length, results.length),
        failureRate: pct(statuses.filter(status => status === "failed").length, results.length)
      }];
    }));
  }

  function eventSummary(results) {
    const visits = {};
    const decisions = {};
    for (const result of results) {
      for (const eventId of result.telemetry.events) visits[eventId] = (visits[eventId] || 0) + 1;
      for (const decision of result.telemetry.decisions) {
        const entry = decisions[decision.event] ||= { total: 0, choices: {}, outcomes: {}, profiles: {} };
        entry.total++;
        const profileEntry = entry.profiles[result.profile] ||= { total: 0, choices: {} };
        profileEntry.total++;
        profileEntry.choices[decision.choice] = (profileEntry.choices[decision.choice] || 0) + 1;
        entry.choices[decision.choice] = (entry.choices[decision.choice] || 0) + 1;
        entry.outcomes[decision.level] = (entry.outcomes[decision.level] || 0) + 1;
      }
    }
    return { visits, decisions };
  }

  function contentAudit() {
    const issues = [];
    const allEvents = globalThis.KorytoApp?.events || {};
    for (const [id, event] of Object.entries(allEvents)) {
      const choices = Array.isArray(event.choices) ? event.choices : [];
      if (!choices.length) issues.push({ severity: "P1", type: "event-without-choice", event: id, message: "Event nema zadnou volbu." });
      if (choices.length > 4) issues.push({ severity: "P3", type: "choice-overload", event: id, message: `Event ma ${choices.length} voleb.` });
      choices.forEach((choice, index) => {
        if (String(choice.label || "").length > 70) issues.push({ severity: "P3", type: "long-label", event: id, choice: index, message: "Tlacitko je prilis dlouhe." });
        if (String(choice.detail || "").length > 220) issues.push({ severity: "P3", type: "long-detail", event: id, choice: index, message: "Popis volby je prilis dlouhy." });
        if (!choice.check || !Number.isFinite(Number(choice.check.dc))) issues.push({ severity: "P1", type: "invalid-check", event: id, choice: index, message: "Volba nema platny hod." });
        if (!Array.isArray(choice.tags) || !choice.tags.length) issues.push({ severity: "P2", type: "missing-tags", event: id, choice: index, message: "Volba nema designove tagy." });
      });
    }
    return { ok: !issues.some(issue => issue.severity === "P1"), totalEvents: Object.keys(allEvents).length, issues };
  }

  function chaosAudit() {
    const cases = [];
    const engine = globalThis.KorytoGameEngine;
    const stateApi = globalThis.KorytoState;
    const saveApi = globalThis.KorytoSaveSystem;
    const fixtures = [
      { name: "numeric-strings", patch: { day: "7", actions: "2", stats: { support: "45", trust: "55" }, quests: { register: { status: "active", stage: "2", deadlineBonus: "1" } } } },
      { name: "broken-collections", patch: { party: { marie: null }, pendingEvents: null, commitments: "broken", factionPlans: [] } },
      { name: "negative-actions", patch: { actions: -12, day: -3, debt: -9 } },
      { name: "unknown-quest", patch: { quests: { phantom: { status: "active", stage: 999 } } } },
      { name: "nan-like", patch: { stats: { support: "NaN", heat: null, integrity: {} } } }
    ];
    for (const fixture of fixtures) {
      let target = deep(baseState);
      Object.assign(target, clone(fixture.patch));
      let error = null;
      try {
        target = stateApi?.normalizeCollections?.(target) || engine?.normalize?.(target, {}) || target;
      } catch (caught) {
        error = String(caught?.message || caught);
      }
      const first = JSON.stringify(target);
      try {
        target = stateApi?.normalizeCollections?.(target) || engine?.normalize?.(target, {}) || target;
      } catch (caught) {
        error ||= String(caught?.message || caught);
      }
      const second = JSON.stringify(target);
      const validation = stateApi?.validate?.(target) || [];
      const roundTrip = saveApi?.roundTrip?.(target) || { ok: true };
      cases.push({ name: fixture.name, error, idempotent: first === second, validation, roundTrip: Boolean(roundTrip.ok) });
    }
    return { ok: cases.every(item => !item.error && item.idempotent && item.roundTrip), cases };
  }

  function analyze(results, options = {}) {
    const byProfile = groupSummary(results, "profile");
    const byClass = groupSummary(results, "classId");
    const quests = questSummary(results);
    const events = eventSummary(results);
    const issues = [];
    const recommendations = [];
    const nonFinite = results.filter(result => result.telemetry.invalidNumbers.length);
    const deadlocks = results.filter(result => result.telemetry.deadlock || !result.ended);
    if (nonFinite.length) issues.push({ severity: "P1", type: "non-finite", count: nonFinite.length, message: "Nektere kampane obsahuji NaN nebo neplatne cislo." });
    if (deadlocks.length) issues.push({ severity: "P1", type: "deadlock", count: deadlocks.length, message: "Nektere kampane se nedokoncily nebo se zasekly." });

    for (const [id, row] of Object.entries(byProfile)) {
      const expectedFloor = finite(profiles[id]?.expectedWinFloor, 0);
      if (expectedFloor > 0 && row.winRate < expectedFloor) issues.push({ severity: "P2", type: "profile-cannot-win", profile: id, value: row.winRate, message: `Modelovy hrac je pod ocekavanym minimem ${expectedFloor} procent.` });
      if (row.winRate > 98) issues.push({ severity: "P2", type: "profile-auto-win", profile: id, value: row.winRate, message: "Modelovy hrac vyhrava temer automaticky." });
    }
    const classVotes = Object.values(byClass).map(row => row.averageVote);
    const classSpread = classVotes.length ? Math.max(...classVotes) - Math.min(...classVotes) : 0;
    if (classSpread > 12) issues.push({ severity: "P2", type: "class-spread", value: round(classSpread), message: "Rozdil prumerneho vysledku trid je prilis vysoky." });

    for (const [id, quest] of Object.entries(quests)) {
      if (quest.completionRate < 5) issues.push({ severity: "P2", type: "quest-never-completes", quest: id, value: quest.completionRate, message: "Quest se temer nikdy nedokonci." });
      if (quest.failureRate > 85) issues.push({ severity: "P2", type: "quest-mostly-fails", quest: id, value: quest.failureRate, message: "Quest ve vetsine kampani selze." });
    }

    for (const [eventId, event] of Object.entries(events.decisions)) {
      const topChoice = Object.entries(event.choices).sort((a, b) => b[1] - a[1])[0]?.[0];
      const top = Math.max(...Object.values(event.choices));
      const dominance = pct(top, event.total);
      const eligibleEntries = Object.entries(event.profiles || {}).filter(([, row]) => row.total >= 10);
      const alignedProfiles = eligibleEntries.filter(([, row]) => {
        const profileTop = Object.entries(row.choices).sort((a, b) => b[1] - a[1])[0];
        return profileTop && profileTop[0] === topChoice && pct(profileTop[1], row.total) > 80;
      }).length;
      const eligibleIds = eligibleEntries.map(([id]) => id);
      const hasEthicalFamily = eligibleIds.some(id => ["novice", "idealist"].includes(id));
      const hasPowerFamily = eligibleIds.some(id => ["pragmatist", "corrupt", "resourceMax"].includes(id));
      if (event.total >= Math.max(20, results.length * 0.03) && dominance > 92 && eligibleEntries.length >= 3 && alignedProfiles === eligibleEntries.length && hasEthicalFamily && hasPowerFamily) {
        issues.push({ severity: "P2", type: "dominant-choice", event: eventId, value: dominance, profiles: alignedProfiles, message: "Stejna volba dominuje napric protichudnymi strategickymi rodinami hracu." });
      }
    }

    const content = contentAudit();
    const chaos = chaosAudit();
    issues.push(...content.issues.filter(issue => issue.severity !== "P3"));
    if (!chaos.ok) issues.push({ severity: "P1", type: "chaos-audit", message: "Nektery poskozeny stav neprosel normalizaci nebo round-tripem." });

    const eventCount = Object.keys(globalThis.KorytoApp?.events || {}).length;
    const coveredEvents = Object.keys(events.visits).length;
    const coverageRate = pct(coveredEvents, eventCount);
    if (coverageRate < 70) issues.push({ severity: "P2", type: "event-coverage", value: coverageRate, message: "Playtest navstivil mene nez 70 procent udalosti." });

    const lowQuests = Object.entries(quests).filter(([, row]) => row.completionRate < 20).map(([id]) => id);
    if (lowQuests.length) recommendations.push(`Zkontrolovat viditelnost a terminy questu: ${lowQuests.join(", ")}.`);
    const dominant = issues.filter(issue => issue.type === "dominant-choice").map(issue => issue.event);
    if (dominant.length) recommendations.push(`Prepsat nebo vybalancovat dominantni volby v udalostech: ${dominant.join(", ")}.`);
    if (classSpread > 8) recommendations.push("Porovnat tridy v prvnich peti dnech a upravit pocatecni bonusy nebo mastery.");
    if (byProfile.novice?.winRate < 12) recommendations.push("Zjednodusit onboarding nebo zvysit ochranu zacatecnika v prvnich trech dnech.");
    if (byProfile.questIgnoring?.winRate > 35) recommendations.push("Zvysit cenu dlouhodobeho ignorovani hlavnich questu.");

    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      generatedAt: new Date().toISOString(),
      runs: results.length,
      seeds: options.seed || 0,
      completed: results.filter(result => result.ended).length,
      wins: results.filter(result => result.won).length,
      winRate: pct(results.filter(result => result.won).length, results.length),
      routeDiversity: new Set(results.map(result => result.route)).size,
      averageVote: round(mean(results.map(result => result.vote))),
      averageSeats: round(mean(results.map(result => result.seats))),
      classSpread: round(classSpread),
      eventCoverage: { covered: coveredEvents, total: eventCount, rate: coverageRate },
      byProfile,
      byClass,
      quests,
      events,
      content,
      chaos,
      issues,
      recommendations,
      releaseReady: !issues.some(issue => issue.severity === "P1")
    };
  }

  function runLab(options = {}) {
    const runs = Math.max(8, Math.floor(finite(options.runs, 1600)));
    const seed = Math.floor(finite(options.seed, 146000));
    const profileIds = Array.isArray(options.profiles) && options.profiles.length ? options.profiles : Object.keys(profiles);
    const results = [];
    for (let index = 0; index < runs; index++) {
      const profileId = profileIds[index % profileIds.length];
      const classId = CLASS_IDS[Math.floor(index / profileIds.length) % CLASS_IDS.length];
      results.push(simulateProfile(profileId, seed + index, { classId }));
    }
    return { results, report: analyze(results, { seed }) };
  }

  function markdown(report) {
    const lines = [
      `# Koryto ${report.version} - AI playtest report`,
      "",
      `- Runs: ${report.runs}`,
      `- Completed: ${report.completed}/${report.runs}`,
      `- Win rate: ${report.winRate} %`,
      `- Average vote: ${report.averageVote} %`,
      `- Average seats: ${report.averageSeats}`,
      `- Route diversity: ${report.routeDiversity}`,
      `- Event coverage: ${report.eventCoverage.covered}/${report.eventCoverage.total} (${report.eventCoverage.rate} %)` ,
      `- Release ready: ${report.releaseReady ? "YES" : "NO"}`,
      "",
      "## Profiles",
      "",
      "| Profile | Runs | Win % | Vote % | Seats | Deadlocks | Wasted actions |",
      "|---|---:|---:|---:|---:|---:|---:|"
    ];
    for (const [id, row] of Object.entries(report.byProfile)) lines.push(`| ${id} | ${row.runs} | ${row.winRate} | ${row.averageVote} | ${row.averageSeats} | ${row.deadlocks} | ${row.wastedActions} |`);
    lines.push("", "## Classes", "", "| Class | Runs | Win % | Vote % | Seats | Heat | Integrity |", "|---|---:|---:|---:|---:|---:|---:|");
    for (const [id, row] of Object.entries(report.byClass)) lines.push(`| ${id} | ${row.runs} | ${row.winRate} | ${row.averageVote} | ${row.averageSeats} | ${row.averageHeat} | ${row.averageIntegrity} |`);
    lines.push("", "## Quest completion", "", "| Quest | Complete % | Fail % | Active | Locked |", "|---|---:|---:|---:|---:|");
    for (const [id, row] of Object.entries(report.quests)) lines.push(`| ${id} | ${row.completionRate} | ${row.failureRate} | ${row.active} | ${row.locked} |`);
    lines.push("", "## Findings", "");
    if (!report.issues.length) lines.push("No P1/P2 findings.");
    for (const issue of report.issues) lines.push(`- **${issue.severity} ${issue.type}**: ${issue.message}${issue.value !== undefined ? ` (${issue.value})` : ""}`);
    lines.push("", "## Recommendations", "");
    if (!report.recommendations.length) lines.push("No automatic recommendation.");
    else report.recommendations.forEach(item => lines.push(`- ${item}`));
    return lines.join("\n");
  }

  function download(name, text, type = "text/plain;charset=utf-8") {
    if (typeof Blob !== "function" || typeof document === "undefined") return text;
    const blob = new Blob([text], { type });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = name;
    anchor.click?.();
    URL.revokeObjectURL(anchor.href);
    return text;
  }

  function showDashboard(runs = 400) {
    const lab = runLab({ runs });
    if (typeof document === "undefined") return lab;
    document.body.innerHTML = `<main style="max-width:1100px;margin:0 auto;padding:24px"><h1>Koryto AI QA Lab</h1><p>${lab.report.runs} kampani, coverage ${lab.report.eventCoverage.rate} %, P1/P2 nalezu ${lab.report.issues.length}.</p><button id="qaJson">Export JSON</button> <button id="qaMd">Export Markdown</button><pre style="white-space:pre-wrap">${markdown(lab.report).replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre></main>`;
    document.getElementById("qaJson").onclick = () => download("koryto-v0146-playtest.json", JSON.stringify(lab.report, null, 2), "application/json;charset=utf-8");
    document.getElementById("qaMd").onclick = () => download("koryto-v0146-playtest.md", markdown(lab.report));
    return lab;
  }


  function ensureMeadowUnlocked(target = typeof state !== "undefined" ? state : null) {
    if (!target || finite(target.day) < 5) return false;
    return globalThis.KorytoQuestRuntime?.unlock?.("meadow", target) || false;
  }

  function patchPressSpecial() {
    const event = typeof events !== "undefined" ? events.planPressSpecial : globalThis.KorytoApp?.events?.planPressSpecial;
    const choice = event?.choices?.[1];
    if (!choice || choice.__v0146Balanced) return false;
    choice.detail = "Cislo nebude v poste. Koupite si kratky klid, penize a trvalou digitalni stopu.";
    choice.check = { ...(choice.check || {}), attr: "cunning", dc: 14 };
    choice.tags = ["corrupt", "pressAttack", "power"];
    choice.success = {
      text: "Papirove vydani zmizi a tiskarna vrati cast nakladu pres spratelenou fakturu. Digitalni verze ma mensi zasah, ale trvalejsi adresu.",
      effects: { funds: 9, influence: 7, leverage: 4, heat: -3, press: -12, integrity: -13 },
      tags: ["corrupt", "pressAttack", "power"],
      extra: () => changePlan("press", -18)
    };
    choice.fail = {
      ...(choice.fail || {}),
      effects: { heat: 24, trust: -14, press: -18, integrity: -8 },
      tags: ["pressAttack"]
    };
    choice.__v0146Balanced = true;
    return true;
  }

  function decorateCoalitionGuidance() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#coalitionOfferPanel .offer").forEach(button => {
      if (button.querySelector?.(".v0146-coalition-tip")) return;
      const text = button.textContent || "";
      if (!/program|audit|verej|veřej/u.test(text)) return;
      button.classList?.add("v0146-recommended");
      const tip = document.createElement("span");
      tip.className = "v0146-coalition-tip";
      tip.textContent = "Doporuceno pro prvni hru: citelnejsi dohoda a mensi povolebni dluh.";
      button.appendChild?.(tip);
    });
  }

  function installGameplayFixes() {
    patchPressSpecial();
    ensureMeadowUnlocked();
    if (globalThis.__KORYTO_V0146_WRAPPED__) return true;
    globalThis.__KORYTO_V0146_WRAPPED__ = true;
    if (typeof normalizeState === "function") {
      const original = normalizeState;
      normalizeState = function v0146NormalizeState(...args) {
        const result = original.apply(this, args);
        ensureMeadowUnlocked(state);
        return result;
      };
    }
    if (typeof endDay === "function") {
      const original = endDay;
      endDay = function v0146EndDay(...args) {
        const result = original.apply(this, args);
        ensureMeadowUnlocked(state);
        return result;
      };
    }
    if (typeof showMap === "function") {
      const original = showMap;
      showMap = function v0146ShowMap(...args) {
        ensureMeadowUnlocked(state);
        return original.apply(this, args);
      };
    }
    if (typeof renderCoalition === "function") {
      const original = renderCoalition;
      renderCoalition = function v0146RenderCoalition(...args) {
        const result = original.apply(this, args);
        decorateCoalitionGuidance();
        return result;
      };
    }
    if (globalThis.KorytoApp) {
      Object.assign(globalThis.KorytoApp, {
        normalizeState: typeof normalizeState === "function" ? normalizeState : globalThis.KorytoApp.normalizeState,
        endDay: typeof endDay === "function" ? endDay : globalThis.KorytoApp.endDay,
        showMap: typeof showMap === "function" ? showMap : globalThis.KorytoApp.showMap
      });
    }
    return true;
  }

  function install() {
    installGameplayFixes();
    const target = globalThis.KorytoApp?.getState?.();
    if (target && typeof target === "object") {
      target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
      target.flags[RELEASE_FLAG] = VERSION;
    }
    if (globalThis.KorytoApp) {
      globalThis.KorytoApp.runPlaytestLab = runLab;
      globalThis.KorytoApp.simulateProfile = simulateProfile;
      globalThis.KorytoApp.VERSION = VERSION;
    }
    if (typeof location !== "undefined" && /(?:\?|&)qa=1(?:&|$)/.test(location.search || "")) setTimeout(() => showDashboard(400), 0);
    return true;
  }

  const api = {
    VERSION,
    BUILD_VERSION,
    SAVE_VERSION,
    SAVE_SCHEMA,
    RELEASE_FLAG,
    profiles,
    classIds: CLASS_IDS,
    simulateProfile,
    runLab,
    analyze,
    contentAudit,
    chaosAudit,
    markdown,
    showDashboard,
    ensureMeadowUnlocked,
    patchPressSpecial,
    decorateCoalitionGuidance,
    installGameplayFixes,
    install
  };

  globalThis.KorytoPlaytestLab = api;
  globalThis.KorytoTest146 = api;
  install();
})();
