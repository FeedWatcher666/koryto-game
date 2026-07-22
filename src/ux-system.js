"use strict";
(() => {
  const VERSION = "0.14.3 TEST.9";
  const STYLE_ID = "koryto-v0143-test9-ux";
  function installStyles() {
    if (!document?.head || [...(document.head.children || [])].some(node => node.id === STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html{scroll-padding-bottom:max(16px,env(safe-area-inset-bottom))}
      body.koryto-modal-open{overflow:hidden;overscroll-behavior:none}
      .overlay{overflow:hidden;overscroll-behavior:contain;padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}
      .overlay>.dialog,.overlay .dialog{max-height:calc(100dvh - max(20px,env(safe-area-inset-top)) - max(20px,env(safe-area-inset-bottom)));overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable;touch-action:pan-y}
      .overlay .dialog>.btn:last-child,.overlay .dialog>[data-summary-close]{position:sticky;bottom:0;z-index:5;width:100%;margin-top:14px;box-shadow:0 -10px 18px rgba(233,223,199,.96);padding-bottom:max(10px,env(safe-area-inset-bottom))}
      .v0142-summary-dialog{display:flex!important;flex-direction:column!important;overflow-y:auto!important}
      button,.btn,.choice,.activity{min-height:44px}
      button:focus-visible,.btn:focus-visible,.choice:focus-visible{outline:3px solid var(--gold,#d8aa38);outline-offset:2px}
      @media(max-width:760px){.overlay{place-items:stretch center}.overlay .dialog{width:100%;padding:18px 16px;border-radius:12px}.v0142-summary-grid,.v0142-driver-grid{grid-template-columns:1fr!important}.topbar .actions{width:100%}.topbar .actions .btn{flex:1 1 130px}}
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
    `;
    document.head.appendChild(style);
  }
  function openOverlays() {
    return [...(document.querySelectorAll?.(".overlay") || [])].filter(node => !node.classList?.contains("hidden"));
  }
  function syncModalState() {
    document.body?.classList?.toggle("koryto-modal-open", openOverlays().length > 0);
  }
  function closeTopOverlay() {
    const list = openOverlays();
    const top = list[list.length - 1];
    if (!top) return false;
    top.classList.add("hidden");
    syncModalState();
    return true;
  }
  function audit() {
    const issues = [];
    const dialogs = [...(document.querySelectorAll?.(".overlay .dialog") || [])];
    for (const dialog of dialogs) {
      if (!dialog.getAttribute?.("role") && !dialog.closest?.("[role=dialog]")) issues.push("Dialog bez role");
    }
    const duplicate = new Set(), seen = new Set();
    for (const node of document.querySelectorAll?.("[id]") || []) { if (seen.has(node.id)) duplicate.add(node.id); seen.add(node.id); }
    if (duplicate.size) issues.push(`Duplicitní ID: ${[...duplicate].join(", ")}`);
    return {ok:issues.length === 0,issues,dialogs:dialogs.length,open:openOverlays().length};
  }
  installStyles();
  document.addEventListener?.("click", () => queueMicrotask(syncModalState), true);
  document.addEventListener?.("keydown", event => { if (event.key === "Escape") queueMicrotask(syncModalState); }, true);
  globalThis.KorytoUXSystem = {VERSION,installStyles,openOverlays,syncModalState,closeTopOverlay,audit};
})();
