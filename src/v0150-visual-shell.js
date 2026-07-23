"use strict";
(C => {
  if (!C) return;
  const { BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, nav, statBar } = C;
  function ensureTopbar() {
    if (document.getElementById("v0150Topbar")) return;
    const anchor = document.querySelector(".topbar") || document.body.firstElementChild;
    anchor?.insertAdjacentHTML("afterend", `<header id="v0150Topbar" class="v0150-topbar" aria-label="Stav kampaně">
      <section class="v0150-daybox">
        <span id="v0150WeatherIcon" class="v0150-weather-icon" aria-hidden="true">☀</span>
        <div class="v0150-daycopy"><b id="v0150Day">Den 1</b><span id="v0150Weekday">Pondělí</span><small id="v0150Date">Květen, rok 2</small></div>
        <div class="v0150-temp"><b id="v0150Temp">22°C</b><small id="v0150WeatherLabel">Slunečno</small></div>
        <small class="v0150-place">⌖ Dolní Vejprnice</small>
      </section>
      <button id="v0150Logo" class="v0150-logo" type="button" aria-label="Zpět na mapu"><span>KORYTO</span><small>POLITICKÁ RPG STRATEGIE</small></button>
      <section class="v0150-resourcebox">
        ${statBar("v0150Trust", "♟ DŮVĚRA", 50, "trust", "50 / 100")}
        ${statBar("v0150Influence", "♛ VLIV", 10, "influence", "10 / 100")}
        ${statBar("v0150Money", "◉ PENÍZE", 30, "money", "120 000 Kč")}
      </section>
      <button id="v0150SystemButton" class="v0150-gear" type="button" aria-expanded="false" aria-controls="v0150SystemMenu" aria-label="Nastavení a uložení">⚙</button>
    </header>`);
    document.getElementById("v0150Logo")?.addEventListener("click", () => navigate("map"));
    document.getElementById("v0150SystemButton")?.addEventListener("click", toggleSystemMenu);
  }

  function ensureSystemMenu() {
    if (document.getElementById("v0150SystemMenu")) return;
    document.body.insertAdjacentHTML("beforeend", `<aside id="v0150SystemMenu" class="v0150-system-menu" hidden aria-label="Systémové menu">
      <header><div><small>KAMPAŇOVÝ kufřík</small><h2>Nastavení</h2></div><button type="button" data-v0150-close-menu aria-label="Zavřít">✕</button></header>
      <div class="v0150-menu-actions">
        <button type="button" data-proxy="saveBtn">💾 Uložit hru</button>
        <button type="button" data-proxy="loadBtn">📂 Načíst hru</button>
        <button type="button" data-proxy="exportBtn">📜 Exportovat kroniku</button>
        <button type="button" data-proxy="restartBtn" class="danger">↻ Nová hra</button>
      </div>
      <fieldset><legend>Čitelnost</legend>
        <label><input type="checkbox" data-v0150-setting="largeText"> Větší text</label>
        <label><input type="checkbox" data-v0150-setting="highContrast"> Vysoký kontrast</label>
        <label><input type="checkbox" data-v0150-setting="reducedMotion"> Omezit animace</label>
      </fieldset>
      <button type="button" data-v0150-visualqa>🧰 Otevřít vizuální QA</button>
      <small class="v0150-build">Build ${BUILD_VERSION} · save ${SAVE_VERSION} · schema ${SAVE_SCHEMA}</small>
    </aside><button id="v0150MenuBackdrop" class="v0150-menu-backdrop" type="button" hidden aria-label="Zavřít menu"></button>`);
    const menu = document.getElementById("v0150SystemMenu");
    menu?.querySelector("[data-v0150-close-menu]")?.addEventListener("click", closeSystemMenu);
    document.getElementById("v0150MenuBackdrop")?.addEventListener("click", closeSystemMenu);
    menu?.querySelectorAll("[data-proxy]").forEach(button => button.addEventListener("click", () => {
      const proxy = document.getElementById(button.dataset.proxy);
      closeSystemMenu();
      proxy?.click();
    }));
    menu?.querySelectorAll("[data-v0150-setting]").forEach(input => input.addEventListener("change", () => {
      const className = `v0148-${input.dataset.v0150Setting}`;
      document.documentElement.classList.toggle(className, input.checked);
      try { localStorage.setItem(className, input.checked ? "1" : "0"); } catch (_) {}
    }));
    menu?.querySelector("[data-v0150-visualqa]")?.addEventListener("click", () => {
      closeSystemMenu();
      C.openVisualQa?.();
    });
  }

  function restoreSettings() {
    document.querySelectorAll("[data-v0150-setting]").forEach(input => {
      const className = `v0148-${input.dataset.v0150Setting}`;
      let enabled = document.documentElement.classList.contains(className);
      try { enabled = localStorage.getItem(className) === "1" || enabled; } catch (_) {}
      input.checked = enabled;
      document.documentElement.classList.toggle(className, enabled);
    });
  }

  function toggleSystemMenu() {
    const menu = document.getElementById("v0150SystemMenu");
    if (!menu) return;
    menu.hidden ? openSystemMenu() : closeSystemMenu();
  }
  function openSystemMenu() {
    const menu = document.getElementById("v0150SystemMenu");
    const backdrop = document.getElementById("v0150MenuBackdrop");
    if (!menu) return;
    menu.hidden = false;
    if (backdrop) backdrop.hidden = false;
    document.getElementById("v0150SystemButton")?.setAttribute("aria-expanded", "true");
    menu.querySelector("button")?.focus();
  }
  function closeSystemMenu() {
    const menu = document.getElementById("v0150SystemMenu");
    const backdrop = document.getElementById("v0150MenuBackdrop");
    if (menu) menu.hidden = true;
    if (backdrop) backdrop.hidden = true;
    document.getElementById("v0150SystemButton")?.setAttribute("aria-expanded", "false");
  }

  function ensureBottomNav() {
    if (document.getElementById("v0150BottomNav")) return;
    document.body.insertAdjacentHTML("beforeend", `<nav id="v0150BottomNav" class="v0150-bottom-nav" aria-label="Hlavní herní navigace">
      ${nav.map(([id, icon, label]) => `<button type="button" data-v0150-nav="${id}"><span>${icon}</span><b>${label}</b><em></em></button>`).join("")}
    </nav>`);
    document.querySelectorAll("[data-v0150-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.v0150Nav)));
  }

  function navigate(action) {
    if (action === "map") {
      globalThis.KorytoVisual148?.openDesk?.("close");
      globalThis.showMap?.();
      C.queueRefresh?.();
      return;
    }
    globalThis.KorytoVisual148?.openDesk?.(action);
    C.queueRefresh?.();
  }

  function ensureGamePanels() {
    const game = document.querySelector("#gameScreen .game");
    if (!game || document.getElementById("v0150LeftPanel")) return;
    game.classList.add("v0150-game-layout");
    const center = Array.from(game.children).find(node => node.tagName === "SECTION");
    if (!center) return;
    center.classList.add("v0150-main-stage");
    center.insertAdjacentElement("beforebegin", Object.assign(document.createElement("aside"), { id: "v0150LeftPanel", className: "v0150-side-panel v0150-side-left" }));
    center.insertAdjacentElement("afterend", Object.assign(document.createElement("aside"), { id: "v0150RightPanel", className: "v0150-side-panel v0150-side-right" }));
  }

  Object.assign(C, { ensureTopbar, ensureSystemMenu, restoreSettings, toggleSystemMenu, openSystemMenu, closeSystemMenu, ensureBottomNav, navigate, ensureGamePanels });
})(globalThis.KorytoVisual150Core);
