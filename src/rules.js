import {CLASSES, COMPANIONS, ORIGINS, OUTCOMES} from "./data.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function deriveAttributes(classId, originId) {
  const selectedClass = CLASSES[classId] || CLASSES.bard;
  const origin = ORIGINS[originId] || ORIGINS.idealist;
  const result = {...selectedClass.base};
  for (const [attribute, modifier] of Object.entries(origin.modifiers)) {
    result[attribute] = clamp((result[attribute] || 1) + modifier, 1, 6);
  }
  return result;
}

export function rollD20(random = Math.random) {
  return 1 + Math.floor(random() * 20);
}

export function activePartyIds(state) {
  const questParty = state.quest?.status === "active" ? state.quest.party : null;
  const source = questParty?.length ? questParty : state.party?.members?.length ? state.party.members : state.party?.active ? [state.party.active] : [];
  return [...new Set(source)].filter(id => COMPANIONS[id]);
}

function matchedSource(choice, type, group, id) {
  if (!id || !choice[type]?.[group]?.includes(id)) return null;
  const fallback = `${type === "advantage" ? "Výhoda" : "Nevýhoda"}: ${group}`;
  return choice[`${type}Labels`]?.[group]?.[id] || fallback;
}

export function resolveRollMode(state, choice) {
  const partyIds = activePartyIds(state);
  const itemId = state.quest?.itemId || null;
  const advantageSources = [
    matchedSource(choice, "advantage", "classes", state.hero.classId),
    matchedSource(choice, "advantage", "origins", state.hero.originId),
    matchedSource(choice, "advantage", "items", itemId),
    ...partyIds.map(id => matchedSource(choice, "advantage", "companions", id))
  ].filter(Boolean);
  const disadvantageSources = [
    matchedSource(choice, "disadvantage", "classes", state.hero.classId),
    matchedSource(choice, "disadvantage", "origins", state.hero.originId),
    matchedSource(choice, "disadvantage", "items", itemId),
    ...partyIds.map(id => matchedSource(choice, "disadvantage", "companions", id))
  ].filter(Boolean);

  const chapterDebtAccepted = state.quest?.status === "active" && state.quest.rivalChoice === "play-along";
  if (choice.honest && state.hero.classId === "paladin" && !chapterDebtAccepted) {
    advantageSources.push("Přísaha paladina: čestné řešení bez dluhu přijatého v této kapitole.");
  }

  const cancelled = advantageSources.length > 0 && disadvantageSources.length > 0;
  const mode = cancelled ? "normal" : advantageSources.length > 0 ? "advantage" : disadvantageSources.length > 0 ? "disadvantage" : "normal";
  const notation = mode === "advantage" ? "2d20kh1" : mode === "disadvantage" ? "2d20kl1" : "1d20";
  const label = mode === "advantage" ? "Výhoda" : mode === "disadvantage" ? "Nevýhoda" : cancelled ? "Výhoda a nevýhoda se ruší" : "Běžný hod";

  return {mode, notation, label, advantageSources, disadvantageSources, cancelled};
}

function bestContribution(entries) {
  return entries.filter(entry => entry.value !== 0).sort((a, b) => b.value - a.value)[0] || null;
}

export function checkModifiers(state, choice) {
  const attributeValue = state.hero.attributes[choice.attribute] || 0;
  const classBonus = choice.classBonus?.[state.hero.classId] || 0;
  const partyIds = activePartyIds(state);
  const companionContribution = bestContribution(partyIds.map(id => {
    const choiceValue = choice.companionBonus?.[id] || 0;
    const passiveValue = COMPANIONS[id]?.bonus?.[choice.attribute] || 0;
    return {
      id,
      label: COMPANIONS[id].name,
      choiceValue,
      passiveValue,
      value: choiceValue + passiveValue
    };
  }));
  const itemId = state.quest?.itemId || null;
  const itemBonus = itemId ? choice.itemBonus?.[itemId] || 0 : 0;
  const itemLabel = choice.itemBonusLabels?.[itemId] || "Vybavení";
  const visibleModifier = attributeValue + classBonus + (companionContribution?.value || 0) + itemBonus;
  const hiddenModifier = choice.dirty && state.hero.classId !== "rogue" ? -1 : 0;
  const modifierBreakdown = [
    {id: "attribute", label: "Atribut", value: attributeValue},
    {id: "class", label: "Třída", value: classBonus},
    companionContribution ? {
      id: `companion-${companionContribution.id}`,
      label: `${companionContribution.label} · nejsilnější pomoc`,
      value: companionContribution.value
    } : null,
    itemBonus ? {id: `item-${itemId}`, label: itemLabel, value: itemBonus} : null
  ].filter(item => item && item.value !== 0);
  return {attributeValue, classBonus, companionContribution, itemBonus, visibleModifier, hiddenModifier, modifierBreakdown};
}

export function outcomeLevel(roll, total, dc) {
  if (roll === 20) return "critical";
  if (roll === 1) return "complication";
  if (total >= dc + 3) return "success";
  if (total >= dc - 1) return "costly";
  return "complication";
}

export function resolveCheck(state, choice, random = Math.random) {
  const modifiers = checkModifiers(state, choice);
  const rollMode = resolveRollMode(state, choice);
  const rolls = rollMode.mode === "normal" ? [rollD20(random)] : [rollD20(random), rollD20(random)];
  const keptIndex = rollMode.mode === "advantage"
    ? (rolls[1] > rolls[0] ? 1 : 0)
    : rollMode.mode === "disadvantage"
      ? (rolls[1] < rolls[0] ? 1 : 0)
      : 0;
  const roll = rolls[keptIndex];
  const total = roll + modifiers.visibleModifier + modifiers.hiddenModifier;
  const level = outcomeLevel(roll, total, choice.dc);

  return {
    choiceId: choice.id,
    attribute: choice.attribute,
    roll,
    rolls,
    keptIndex,
    discardedIndex: rolls.length > 1 ? (keptIndex === 0 ? 1 : 0) : null,
    rollMode: rollMode.mode,
    rollModeLabel: rollMode.label,
    rollNotation: rollMode.notation,
    advantageSources: rollMode.advantageSources,
    disadvantageSources: rollMode.disadvantageSources,
    cancelledRollModes: rollMode.cancelled,
    dc: choice.dc,
    visibleModifier: modifiers.visibleModifier,
    hiddenModifier: modifiers.hiddenModifier,
    modifierBreakdown: modifiers.modifierBreakdown,
    total,
    level,
    outcome: OUTCOMES[level]
  };
}

export function formatRollExpression(result) {
  const rolled = result.rolls.length > 1 ? `(${result.rolls.join(", ")}; ponecháno ${result.roll})` : `(${result.roll})`;
  const hidden = result.hiddenModifier ? ` ${result.hiddenModifier > 0 ? "+" : "−"} ${Math.abs(result.hiddenModifier)}` : "";
  return `${result.rollNotation} ${rolled} + ${result.visibleModifier}${hidden} = ${result.total} proti ${result.dc}`;
}

export function applyCheckConsequences(state, result, context) {
  const next = structuredClone(state);
  next.history.push({context, ...result});
  next.flags.lastResult = result;

  if (result.level === "critical") {
    next.resources.reputation += 8;
    next.resources.money += 1;
  } else if (result.level === "success") {
    next.resources.reputation += 4;
  } else if (result.level === "costly") {
    next.resources.reputation += 2;
    next.resources.heat += 2;
  } else {
    next.resources.heat += 4;
    next.resources.debt += 1;
  }

  if (context === "registration") {
    next.flags.candidacyRegistered = true;
    if (result.level === "complication") next.flags.registrationDebt = true;
  }

  return next;
}
