"use strict";
(() => {
  const INFO = globalThis.KorytoBuildInfo || {
    displayVersion: "0.17.2 TEST.1",
    buildVersion: "0.17.2-test.1",
    saveVersion: "0.14.3-test.2",
    saveSchema: 1
  };
  let queued = false;

  const riskWords = /riziko|postih|ztrát|skandál|kompromat|nedůvěr|selh|trest|pokut/i;
  const benefitWords = /bonus|výhod|důvěr|vliv|podpor|úspěch|odměn/i;
  const navBadges = Object.freeze({
    map: "M",
    quests: "K",
    staff: "Š",
    influence: "V",
    debate: "D",
    elections: "VO",
    coalition: "KO",
    archive: "A",
    more: "•••"
  });

  function choiceTone(choice) {
    const text = choice.textContent || "";
    if (choice.disabled) return "locked";
    if (riskWords.test(text)) return "risk";
    if (benefitWords.test(text)) return "opportunity";
    return "neutral";
  }

  function decorateChoices() {
    document.querySelectorAll(".k165-choice").forEach((choice, index) => {
      choice.dataset.k171Choice = String(index + 1);
      choice.dataset.k171Tone = choiceTone(choice);
      choice.setAttribute("aria-label", `Volba ${index + 1}: ${choice.querySelector("h2")?.textContent?.trim() || "rozhodnutí"}`);
    });
  }

  function decorateMap() {
    const primary = document.querySelector(".k16-case-primary");
    if (primary) primary.dataset.k171Priority = "hlavní";

    document.querySelectorAll(".k16-hotspot").forEach(hotspot => {
      hotspot.dataset.k171Attention = hotspot.classList.contains("hot") ? "urgent" : "normal";
    });
  }

  function decorateResult() {
    const result = document.querySelector(".k165-result-card");
    if (!result) return;
    result.dataset.k171Outcome = result.classList.contains("bad")
      ? "bad"
      : result.classList.contains("warn")
        ? "warn"
        : "good";
  }

  function normalizeOfflineBadges() {
    document.querySelectorAll(".k16-resource-icon,.k165-resource > span").forEach((icon, index) => {
      icon.textContent = ["D", "V", "K"][index % 3];
      icon.dataset.k171Badge = "resource";
    });

    document.querySelectorAll(".k16-settings,.k165-settings").forEach(button => {
      button.textContent = "UI";
      button.dataset.k171Badge = "settings";
    });

    document.querySelectorAll(".k16-bottom button,.k165-bottom button").forEach(button => {
      const key = button.dataset.k16Nav
        || button.dataset.k165Nav
        || (button.hasAttribute("data-k16-more") || button.hasAttribute("data-k165-more") ? "more" : "");
      const icon = button.querySelector("span");
      if (!icon || !navBadges[key]) return;
      icon.textContent = navBadges[key];
      icon.dataset.k171Badge = "navigation";
    });
  }

  function decorate() {
    if (typeof document === "undefined") return false;
    const html = document.documentElement;
    html.classList.add("k171-decision-hud");
    html.dataset.korytoPolish = INFO.buildVersion;

    decorateChoices();
    decorateMap();
    decorateResult();
    normalizeOfflineBadges();
    INFO.applyLabels?.();
    return true;
  }

  function queueDecorate() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      decorate();
    }, 0);
  }

  function audit() {
    const choices = [...document.querySelectorAll(".k165-choice")];
    const visible = element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    return {
      buildVersion: INFO.buildVersion,
      saveVersion: INFO.saveVersion,
      saveSchema: INFO.saveSchema,
      active: document.documentElement.classList.contains("k171-decision-hud"),
      visualMarker: document.documentElement.dataset.korytoPolish || null,
      numberedChoices: choices.filter(choice => choice.dataset.k171Choice).length,
      accessibleChoices: choices.filter(choice => choice.hasAttribute("aria-label")).length,
      visibleChoices: choices.filter(visible).length,
      offlineBadges: document.querySelectorAll("[data-k171-badge]").length,
      urgentHotspots: document.querySelectorAll('.k16-hotspot[data-k171-attention="urgent"]').length,
      resultOutcome: document.querySelector(".k165-result-card")?.dataset.k171Outcome || null
    };
  }

  function install() {
    if (typeof document === "undefined") return false;
    document.addEventListener("click", queueDecorate);
    document.addEventListener("change", queueDecorate);
    globalThis.addEventListener?.("load", decorate, {once: true});
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", decorate, {once: true});
    } else {
      decorate();
    }
    return true;
  }

  globalThis.KorytoUI171 = Object.freeze({
    VERSION: INFO.displayVersion,
    BUILD_VERSION: INFO.buildVersion,
    SAVE_VERSION: INFO.saveVersion,
    SAVE_SCHEMA: INFO.saveSchema,
    decorate,
    normalizeOfflineBadges,
    audit,
    install
  });
  install();
})();
