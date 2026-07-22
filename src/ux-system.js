"use strict";
(() => {
  const VERSION="0.14.4 TEST.8";
  const STYLE_ID="koryto-v0144-ux";
  const microtask=globalThis.queueMicrotask||((fn)=>Promise.resolve().then(fn));
  function installStyles(){if(!document?.head||document.getElementById?.(STYLE_ID))return;const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
    html{scroll-padding-bottom:max(16px,env(safe-area-inset-bottom))}
    body.koryto-modal-open{overflow:hidden;overscroll-behavior:none}
    .overlay{overflow:hidden;overscroll-behavior:contain;padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}
    .overlay>.dialog,.overlay .dialog{display:flex;flex-direction:column;max-height:calc(100dvh - max(20px,env(safe-area-inset-top)) - max(20px,env(safe-area-inset-bottom)));overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable;touch-action:pan-y}
    .overlay .dialog>.btn:last-child,.overlay .dialog>[data-summary-close],.overlay .dialog .dialog-primary-action{position:sticky;bottom:0;z-index:6;width:100%;margin-top:14px;box-shadow:0 -12px 22px rgba(233,223,199,.97);padding-bottom:max(10px,env(safe-area-inset-bottom))}
    .v0142-summary-dialog{display:flex!important;flex-direction:column!important;overflow-y:auto!important;min-height:0!important}
    button,.btn,.choice,.activity{min-height:44px}
    button:focus-visible,.btn:focus-visible,.choice:focus-visible,.activity:focus-visible{outline:3px solid var(--gold,#d8aa38);outline-offset:2px}
    @media(max-width:760px){.overlay{place-items:stretch center}.overlay .dialog{width:100%;max-width:none;padding:18px 16px;border-radius:12px}.v0142-summary-grid,.v0142-driver-grid{grid-template-columns:1fr!important}.topbar .actions{width:100%}.topbar .actions .btn{flex:1 1 130px}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
  `;document.head.appendChild(style);}
  function overlays(){return [...(document.querySelectorAll?.(".overlay")||[])];}
  function openOverlays(){return overlays().filter(node=>!node.classList?.contains("hidden"));}
  function decorateDialogs(){for(const overlay of overlays()){overlay.setAttribute?.("aria-hidden",overlay.classList?.contains("hidden")?"true":"false");const dialog=overlay.querySelector?.(".dialog");if(!dialog)continue;dialog.setAttribute?.("role","dialog");dialog.setAttribute?.("aria-modal","true");dialog.setAttribute?.("tabindex","-1");const buttons=[...(dialog.querySelectorAll?.("button,.btn")||[])];buttons.at(-1)?.classList?.add("dialog-primary-action");}}
  function focusFirst(){const top=openOverlays().at(-1),dialog=top?.querySelector?.(".dialog");if(!dialog)return;const target=dialog.querySelector?.("button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])")||dialog;target.focus?.({preventScroll:true});}
  function syncModalState({focus=false}={}){decorateDialogs();const open=openOverlays();document.body?.classList?.toggle("koryto-modal-open",open.length>0);for(const overlay of overlays())overlay.setAttribute?.("aria-hidden",overlay.classList?.contains("hidden")?"true":"false");if(focus&&open.length)focusFirst();return open.length;}
  function closeTopOverlay(){const top=openOverlays().at(-1);if(!top)return false;top.classList.add("hidden");syncModalState();return true;}
  function trapFocus(event){if(event.key!=="Tab")return;const dialog=openOverlays().at(-1)?.querySelector?.(".dialog");if(!dialog)return;const items=[...(dialog.querySelectorAll?.("button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])")||[])];if(!items.length)return;const first=items[0],last=items.at(-1),active=document.activeElement;if(event.shiftKey&&active===first){event.preventDefault();last.focus?.();}else if(!event.shiftKey&&active===last){event.preventDefault();first.focus?.();}}
  function audit(){const issues=[],dialogs=[...(document.querySelectorAll?.(".overlay .dialog")||[])];for(const dialog of dialogs){if(dialog.getAttribute?.("role")!=="dialog")issues.push("Dialog bez role");if(dialog.getAttribute?.("aria-modal")!=="true")issues.push("Dialog bez aria-modal");}const duplicate=new Set(),seen=new Set();for(const node of document.querySelectorAll?.("[id]")||[]){if(seen.has(node.id))duplicate.add(node.id);seen.add(node.id);}if(duplicate.size)issues.push(`Duplicitní ID: ${[...duplicate].join(", ")}`);return {ok:issues.length===0,issues,dialogs:dialogs.length,open:openOverlays().length,styleInstalled:!!document.getElementById?.(STYLE_ID)};}
  installStyles();decorateDialogs();document.addEventListener?.("click",()=>microtask(()=>syncModalState({focus:true})),true);document.addEventListener?.("keydown",event=>{if(event.key==="Escape")microtask(()=>syncModalState());trapFocus(event);},true);
  globalThis.KorytoUXSystem={VERSION,installStyles,decorateDialogs,openOverlays,syncModalState,focusFirst,closeTopOverlay,trapFocus,audit};
})();
