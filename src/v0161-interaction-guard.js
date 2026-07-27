"use strict";
(() => {
  let installed = false;
  let loading = false;
  let onboardingLoading = false;
  let polishLoading = false;

  function canonicalLabels() {
    document.title = "Koryto 0.16.9 TEST.1 – Release Polish";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Koryto 0.16.9 TEST.1: závěrečný UX, přístupnostní a release-polish pass pro celý offline build.");
  }

  function loadPlaytestLayer() {
    if (loading || typeof document === "undefined") return;
    loading = true;
    if (!document.querySelector('link[data-k162-style]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "styles/v0162-playtest.css";
      link.dataset.k162Style = "1";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-k162-runtime]')) {
      const script = document.createElement("script");
      script.src = "src/v0162-playtest.js";
      script.dataset.k162Runtime = "1";
      document.body.appendChild(script);
    }
  }

  function loadOnboardingLayer() {
    if (onboardingLoading || typeof document === "undefined") return;
    onboardingLoading = true;
    if (!document.querySelector('link[data-k168-style]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "styles/v0168-onboarding-ui.css";
      link.dataset.k168Style = "1";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-k168-runtime]')) {
      const script = document.createElement("script");
      script.src = "src/v0168-onboarding-ui.js";
      script.dataset.k168Runtime = "1";
      document.body.appendChild(script);
    }
  }

  function loadReleasePolishLayer() {
    if (polishLoading || typeof document === "undefined") return;
    polishLoading = true;
    canonicalLabels();
    if (!document.querySelector('link[data-k169-style]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "styles/v0169-release-polish.css";
      link.dataset.k169Style = "1";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-k169-runtime]')) {
      const script = document.createElement("script");
      script.src = "src/v0169-release-polish.js";
      script.dataset.k169Runtime = "1";
      document.body.appendChild(script);
    }
  }

  function install() {
    if (installed || typeof document === "undefined") return installed;
    const root = document.getElementById("v0160Root");
    if (!root) return false;
    root.addEventListener("click", event => event.stopPropagation());
    root.dataset.v0161InteractionGuard = "ready";
    loadPlaytestLayer();
    loadOnboardingLayer();
    loadReleasePolishLayer();
    installed = true;
    return true;
  }

  document.addEventListener("DOMContentLoaded", install, { once: true });
  setTimeout(install, 0);

  globalThis.KorytoInteractionGuard161 = { install, loadPlaytestLayer, loadOnboardingLayer, loadReleasePolishLayer, canonicalLabels };
})();