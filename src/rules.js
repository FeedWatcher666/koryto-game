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

function matchedSource(choice, type, group, id) {
  if (!id || !choice[type]?.[group]?.includes(id)) return null;
  const fallback = `${type === "advantage" ? "Výhoda" : "Nevýhoda"}: ${group}`;
  return choice[`${type}Labels`]?.[group]?.[id] || fallback;
}

export function resolveRollMode(state, choice) {
  const advantageSources = [
    matchedSource(choice, "advantage", "classes", state.hero.classId),
    matchedSource(choice, "advantage", "origins", state.hero.originId),
    matchedSource(choice, "advantage", "companions", state.party.active)
  ].filter(Boolean);
  const disadvantageSources = [
    matchedSource(choice, "disadvantage", "classes", state.hero.classId),
    matchedSource(choice, "disadvantage", "origins", state.hero.originId),
    matchedSource(choice, "disadvantage", "companions", state.party.active)
  ].filter(Boolean);

  if (choice.honest && state.hero.classId === "paladin" && state.resources.debt === 0) {
    advantageSources.push("Přísaha paladina: čestné řešení bez předchozího politického dluhu.");
  }

  const cancelled = advantageSources.length > 0 && disadvantageSources.length > 0;
  const mode = cancelled ? "normal" : advantageSources.length > 0 ? "advantage" : disadvantageSources.length > 0 ? "disadvantage" : "normal";
  const notation = mode === "advantage" ? "2d20kh1" : mode === "disadvantage" ? "2d20kl1" : "1d20";
  const label = mode === "advantage" ? "Výhoda" : mode === "disadvantage" ? "Nevýhoda" : cancelled ? "Výhoda a nevýhoda se ruší" : "Běžný hod";

  return {mode, notation, label, advantageSources, disadvantageSources, cancelled};
}

export function outcomeLevel(roll, total, dc) {
  if (roll === 20) return "critical";
  if (roll === 1) return "complication";
  if (total >= dc + 3) return "success";
  if (total >= dc - 1) return "costly";
  return "complication";
}

export function resolveCheck(state, choice, random = Math.random) {
  const attributeValue = state.hero.attributes[choice.attribute] || 0;
  const classBonus = choice.classBonus?.[state.hero.classId] || 0;
  const companionBonus = choice.companionBonus?.[state.party.active] || 0;
  const companion = COMPANIONS[state.party.active];
  const passiveBonus = companion?.bonus?.[choice.attribute] || 0;
  const visibleModifier = attributeValue + classBonus + companionBonus + passiveBonus;
  const hiddenModifier = choice.dirty && state.hero.classId !== "rogue" ? -1 : 0;
  const rollMode = resolveRollMode(state, choice);
  const rolls = rollMode.mode === "normal" ? [rollD20(random)] : [rollD20(random), rollD20(random)];
  const keptIndex = rollMode.mode === "advantage"
    ? (rolls[1] > rolls[0] ? 1 : 0)
    : rollMode.mode === "disadvantage"
      ? (rolls[1] < rolls[0] ? 1 : 0)
      : 0;
  const roll = rolls[keptIndex];
  const total = roll + visibleModifier + hiddenModifier;
  const level = outcomeLevel(roll, total, choice.dc);
  const modifierBreakdown = [
    {id: "attribute", label: "Atribut", value: attributeValue},
    {id: "class", label: "Třída", value: classBonus},
    {id: "companion-choice", label: "Příprava družiny", value: companionBonus},
    {id: "companion-passive", label: companion?.name || "Společník", value: passiveBonus}
  ].filter(item => item.value !== 0);

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
    visibleModifier,
    hiddenModifier,
    modifierBreakdown,
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
