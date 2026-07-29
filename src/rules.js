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
  const roll = rollD20(random);
  const total = roll + visibleModifier + hiddenModifier;
  const level = outcomeLevel(roll, total, choice.dc);

  return {
    choiceId: choice.id,
    attribute: choice.attribute,
    roll,
    dc: choice.dc,
    visibleModifier,
    hiddenModifier,
    total,
    level,
    outcome: OUTCOMES[level]
  };
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
