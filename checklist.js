// ═══ 🧭 Guided Trip Checklist — "hold my hand" mode ═══
// A panel docked beside the map + a persistent step bar across the top.
// One step at a time, and nothing turns green until it is really done.
//
// HOW IT'S ORGANISED
//   Trip      = one destination + a travel window (dates). Owns the checklist.
//   Ways      = the plans you keep for that trip (3–4 high-% ways there, ways home).
//   Sign-ups  = per BASE, not per flight. One sign-up covers every kept way that
//               leaves from that base (up to 5 destinations, ~60 days).
//
// Page globals used: TByKey, SCHEDULES, TERM_PAGE, AMC_TOOL, AMC_SELF_SIGNUP, CMD, VISA,
// toast, copyText, window.jmName/jmBand, window.openJourney, window.SPACEA_TRIP (tripbuilder.js),
// window.chkAutofill / chkVaultReady / chkOpenVault / chkSignups / chkAddSignup / chkDropSignup.
//
// STORAGE — local, one record per trip, shaped like the tables a backend would use:
//   trips            → {id, hub, start, win:{from,to}, outs[], homes[], view, updated}
//   checklist_items  → rec.bases["travis"] {signed, signupId, manual, listed}
//   confirmations    → rec.bases[k].proof / rec.legs[k].rollcall / rec.backup.proof
//                      {image, uploaded_at, note}
(function(){
const $=id=>document.getElementById(id);
const GREEN="#34D399", GREY="#8b90a6";
const nm=k=>(typeof window.jmName==="function"?window.jmName(k):((typeof TByKey!=="undefined"&&TByKey[k]||{}).name||k))||k;
const term=k=>(typeof TByKey!=="undefined"&&TByKey[k])||{};
const band=p=>(typeof window.jmBand==="function"&&p!=null)?window.jmBand(p):GREEN;

const css=document.createElement("style");
css.textContent=`
  :root{--chkw:420px;}
  #chkDock{position:fixed;top:0;right:0;bottom:0;width:min(var(--chkw),100vw);z-index:44;display:none;
    flex-direction:column;background:color-mix(in srgb,var(--color-surface) 97%,transparent);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-left:1px solid var(--color-divider);
    box-shadow:var(--shadow-lg);color:var(--color-text);font-family:var(--font-body);}
  #chkDock.show{display:flex;}
  body.chk-open #detail{right:calc(var(--chkw) + var(--space-6));}
  body.chk-open .tb-head{right:calc(var(--chkw) + 16px);}
  body.chk-open .tb-tabs{right:calc(var(--chkw) + 16px);}
  body.chk-open .tb-bar{left:calc(50% - var(--chkw)/2);}
  body.chk-open .tb-stack{right:calc(var(--chkw) + 272px) !important;}
  body.chk-open #bell,body.chk-open #bellPanel{right:calc(var(--chkw) + 20px);}
  #tripb.show ~ #chkBar,#chkBar{z-index:42;}
  @media (max-width:920px){ :root{--chkw:100vw;} body.chk-open #detail{right:var(--space-6);}
    body.chk-open #bell,body.chk-open #bellPanel{display:none;} }

  /* ── the persistent step bar ── */
  #chkBar{position:relative;position:fixed;top:0;left:0;right:0;z-index:42;display:none;align-items:center;gap:13px;
    padding:7px 13px;min-height:58px;color:var(--color-text);font-family:var(--font-body);overflow:hidden;
    background:color-mix(in srgb,var(--color-surface) 96%,transparent);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    border-bottom:1px solid var(--color-divider);box-shadow:var(--shadow-md);}
  #chkBar.show{display:flex;}
  body.chk-open #chkBar{right:min(var(--chkw),100vw);}
  body.chk-bar #controls{top:calc(var(--space-6) + 58px);max-height:calc(100% - 226px);}
  body.chk-bar #detail{top:calc(var(--space-6) + 58px);max-height:calc(100% - var(--space-8)*2 - 58px);}
  /* The trip builder owns the top edge while it's open — its own stepper IS the progress indicator,
     so this bar stands down rather than stacking two bars and taking 70px of globe with it. */
  body.chk-bar:not(:has(#tripb.show)) .tb-head{top:70px;}
  body.chk-bar:not(:has(#tripb.show)) .tb-tabs{top:124px;max-height:calc(100% - 260px);}
  body:has(#tripb.show) #chkBar{display:none;}
  .cb-of{flex:0 1 auto;min-width:0;max-width:34%;overflow:hidden;flex:0 1 auto;min-width:0;overflow:hidden;line-height:1.25;}
  .cb-of b{font-size:13px;display:block;white-space:nowrap;}
  .cb-of span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10.5px;color:color-mix(in srgb,var(--color-text) 62%,transparent);
    display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cb-of i{font-style:normal;color:${GREEN};font-weight:700;}
  .cb-track::-webkit-scrollbar{display:none;}
  .cb-prog{position:absolute;left:0;right:0;bottom:0;height:2px;overflow:hidden;
    background:color-mix(in srgb,var(--color-text) 8%,transparent);}
  .cb-prog i{display:block;height:100%;border-radius:0 2px 2px 0;
    background:linear-gradient(90deg,color-mix(in srgb,#34D399 55%,transparent),#34D399);
    transition:width .5s cubic-bezier(.22,1,.36,1);position:relative;}
  .cb-prog i::after{content:"";position:absolute;right:0;top:-2px;width:6px;height:6px;border-radius:50%;
    background:#34D399;animation:cbPulse 1.9s ease-in-out infinite;}
  @keyframes cbPulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,#34D399 70%,transparent);opacity:.95;}
    50%{box-shadow:0 0 0 5px color-mix(in srgb,#34D399 0%,transparent);opacity:.6;}}
  .cb-track{scrollbar-width:none;flex:1 1 auto;min-width:0;display:flex;align-items:center;
    overflow-y:hidden;overflow-x:auto;}   /* longhands: an overflow shorthand here would reset overflow-x */
  .cb-seg{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;}
  .cb-bar{flex:1 1 auto;height:3px;border-radius:2px;min-width:8px;
    background:color-mix(in srgb,var(--color-text) 15%,transparent);margin:0 3px 14px;}
  .cb-seg .cw{display:flex;flex-direction:column;align-items:center;gap:2px;flex:0 0 auto;
    background:none;border:0;font:inherit;color:var(--color-text);cursor:pointer;padding:2px 4px;border-radius:9px;}
  .cb-seg .cw:hover{background:color-mix(in srgb,var(--color-accent) 14%,transparent);}
  .cb-seg .dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:13.5px;border:1.5px solid var(--color-divider);background:color-mix(in srgb,#000 22%,transparent);}
  .cb-seg .cl{font-size:9.5px;white-space:nowrap;color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  .cb-seg.done .dot{border-color:${GREEN};color:${GREEN};background:color-mix(in srgb,${GREEN} 22%,transparent);}
  .cb-seg.done .cl{color:color-mix(in srgb,${GREEN} 80%,var(--color-text));}
  .cb-seg.now .dot{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 20%,transparent);
    animation:ckPulse 2s ease-out infinite;}
  .cb-seg.now .cl{color:var(--color-text);font-weight:700;}
  .cb-seg.lock{opacity:.4;}
  .cb-seg.lock .cw{cursor:default;}
  .cb-act{flex:0 1 auto;min-width:0;display:flex;gap:7px;align-items:center;}
  .cb-b{font:inherit;min-width:0;font-size:12px;font-weight:600;min-height:42px;padding:11px 14px;border-radius:11px;
    border:1px solid var(--color-accent);background:color-mix(in srgb,var(--color-accent) 15%,transparent);
    color:var(--color-text);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    max-width:250px;flex:0 1 auto;min-width:0;text-align:center;}
  .cb-b:hover{background:color-mix(in srgb,var(--color-accent) 26%,transparent);}
  .cb-b.ghost{border-color:var(--color-divider);background:none;flex:0 0 auto;}
  .cb-b.ghost:hover{border-color:var(--color-accent);}
  .cb-b.ghost.sm{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;padding:11px 12px;min-height:42px;
    border-color:color-mix(in srgb,#FF6B6B 34%,var(--color-divider));
    color:color-mix(in srgb,var(--color-text) 72%,transparent);}
  .cb-b.ghost.sm:hover{color:#FF8585;border-color:color-mix(in srgb,#FF6B6B 62%,transparent);}
  #chkBar.narrow .cb-seg .cl{display:none;}
  #chkBar.narrow .cb-bar{margin-bottom:0;}
  #chkBar.tight .cb-of span{display:none;}
  #chkBar.mini .cb-of{flex:0 1 auto;min-width:0;max-width:26%;}
  #chkBar.narrow .cb-bar{min-width:6px;}
  #chkBar.narrow .cb-seg .dot{width:26px;height:26px;}
  #chkBar.narrow .cb-seg .cw{padding:0 2px;}
  #chkBar.mini .cb-track{gap:0;}
  #chkBar.mini .cb-bar{min-width:6px;width:6px;margin:0 1px;}
  #chkBar.mini .cb-seg .dot{width:26px;height:26px;}
  #chkBar.mini .cb-seg .cw{padding:0 1px;}
  #chkBar.mini .cb-of b{font-size:11.5px;white-space:nowrap;}
  #chkBar.tight .cb-b.ghost.sm .rl{display:none;}   /* icon only once the bar gets tight */
  #chkBar.mini .cb-b.ghost{display:none;}
  /* mini: icon only, but never hidden — this is the moment someone reaches for it */
  #chkBar.mini .cb-b.ghost.sm{display:inline-flex;padding:11px 9px;}
  #chkBar.mini{gap:9px;}
  @keyframes ckPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--color-accent) 60%,transparent);}
    75%{box-shadow:0 0 0 11px transparent;}100%{box-shadow:0 0 0 0 transparent;}}
  @media (prefers-reduced-motion:reduce){.cb-seg.now .dot,.ck-seg.now .si{animation:none;}}

  /* ── dock head ── */
  .ck-head{padding:12px 14px;border-bottom:1px solid var(--color-divider);flex:0 0 auto;}
  .ck-top{display:flex;align-items:center;gap:7px;position:relative;}
  .ck-trips{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:7px;font:inherit;font-size:14px;
    font-weight:600;padding:8px 10px;border-radius:10px;border:1px solid transparent;background:none;
    color:var(--color-text);cursor:pointer;text-align:left;}
  .ck-trips:hover{border-color:var(--color-divider);background:color-mix(in srgb,#000 16%,transparent);}
  .ck-trips .tn{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .ck-trips .ar2{opacity:.45;font-weight:400;}
  .ck-trips .ar{flex:0 0 auto;font-size:10px;opacity:.6;}
  .ck-x{width:36px;height:36px;flex:0 0 auto;border-radius:50%;border:1px solid var(--color-divider);
    background:none;color:var(--color-text);font-size:14px;cursor:pointer;}
  .ck-x:hover{border-color:var(--color-accent);}
  .ck-of{margin-top:4px;font-size:12px;color:color-mix(in srgb,var(--color-text) 66%,transparent);}
  .ck-of b{color:${GREEN};}
  .ck-of .dot{opacity:.4;}
  .ck-fill{height:5px;border-radius:3px;background:color-mix(in srgb,#000 26%,transparent);margin:8px 0 9px;overflow:hidden;}
  .ck-fill i{display:block;height:100%;border-radius:3px;background:${GREEN};transition:width .4s ease;}
  .ck-segs{display:flex;gap:4px;}
  .ck-seg{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px 5px;
    border-radius:9px;border:1px solid transparent;background:none;font:inherit;color:var(--color-text);cursor:pointer;}
  .ck-seg .si{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:13px;border:1px solid var(--color-divider);background:color-mix(in srgb,#000 20%,transparent);}
  .ck-seg .sl{font-size:8.6px;text-align:center;line-height:1.15;
    color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .ck-seg.done .si{background:color-mix(in srgb,${GREEN} 22%,transparent);border-color:${GREEN};color:${GREEN};}
  .ck-seg.done .sl{color:color-mix(in srgb,${GREEN} 85%,var(--color-text));}
  .ck-seg.now{background:color-mix(in srgb,var(--color-accent) 13%,transparent);border-color:var(--color-accent);}
  .ck-seg.now .si{border-color:var(--color-accent);animation:ckPulse 2s ease-out infinite;}
  .ck-seg.now .sl{color:var(--color-text);font-weight:700;}
  .ck-seg.lock{opacity:.42;}

  .ck-body{flex:1 1 auto;overflow-y:auto;padding:14px 14px 18px;display:flex;flex-direction:column;gap:12px;}
  .ck-foot{flex:0 0 auto;padding:11px 14px 13px;border-top:1px solid var(--color-divider);
    display:flex;flex-direction:column;gap:7px;background:color-mix(in srgb,#000 12%,transparent);}
  .ck-go{font:inherit;font-size:14.5px;font-weight:600;min-height:52px;padding:14px 16px;border-radius:13px;
    border:1px solid ${GREEN};background:color-mix(in srgb,${GREEN} 17%,transparent);color:var(--color-text);cursor:pointer;}
  .ck-go:hover{background:color-mix(in srgb,${GREEN} 27%,transparent);}
  .ck-go[disabled]{opacity:.45;cursor:not-allowed;border-color:var(--color-divider);background:none;}
  .ck-why{font-size:11.5px;text-align:center;color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  .ck-pass{display:flex;gap:7px;align-items:stretch;}
  .ck-pass input{flex:1 1 auto;min-width:0;font:inherit;font-size:13px;min-height:52px;padding:12px 14px;
    border-radius:13px;border:1px solid var(--color-divider);color:var(--color-text);
    background:color-mix(in srgb,#000 22%,transparent);}
  .ck-pass input:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .ck-pass.bad input{border-color:color-mix(in srgb,#FF4D4D 55%,transparent);}
  .ck-all{font:inherit;font-size:12px;background:none;border:0;color:var(--color-accent);cursor:pointer;
    text-decoration:underline;padding:4px;min-height:32px;}
  .ck-flinks{display:flex;align-items:center;justify-content:space-between;gap:8px;}

  /* ⚡ run overlay */
  #chkRun{position:fixed;inset:0;z-index:66;display:none;align-items:center;justify-content:center;
    background:rgba(6,8,16,.72);backdrop-filter:blur(3px);padding:18px;font-family:var(--font-body);}
  #chkRun.show{display:flex;}
  .rn-box{width:min(430px,100%);max-height:88vh;overflow-y:auto;display:flex;flex-direction:column;gap:12px;
    padding:18px;border-radius:16px;border:1px solid color-mix(in srgb,var(--color-accent) 22%,var(--color-divider));color:var(--color-text);
    background:color-mix(in srgb,var(--color-surface) 98%,transparent);box-shadow:var(--shadow-lg);}
  .rn-head{display:flex;align-items:center;gap:11px;}
  .rn-badge{width:36px;height:36px;flex:0 0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:16px;background:color-mix(in srgb,var(--color-accent) 16%,transparent);
    border:1px solid color-mix(in srgb,var(--color-accent) 40%,transparent);
    box-shadow:0 0 16px color-mix(in srgb,var(--color-accent) 28%,transparent);}
  .rn-head b{display:block;font-size:15.5px;font-weight:500;letter-spacing:-.01em;}
  .rn-head span{display:block;font-size:11.5px;margin-top:1px;color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  .rn-fill{height:4px;border-radius:3px;background:color-mix(in srgb,#000 26%,transparent);overflow:hidden;}
  .rn-fill i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,color-mix(in srgb,${GREEN} 55%,var(--color-accent)),${GREEN});transition:width .3s ease;}
  /* the how-to, as three small steps — NOT .ck-note: its flex icon-row variant shredded this prose into columns */
  .rn-steps{display:flex;flex-direction:column;gap:7px;padding:2px 0;}
  .rn-step{display:flex;gap:9px;align-items:flex-start;font-size:11.5px;line-height:1.55;
    color:color-mix(in srgb,var(--color-text) 76%,transparent);}
  .rn-step i{flex:0 0 auto;width:17px;height:17px;margin-top:1px;border-radius:50%;font-style:normal;font-size:10px;
    display:flex;align-items:center;justify-content:center;color:var(--color-accent-300,var(--color-accent));
    border:1px solid color-mix(in srgb,var(--color-accent) 50%,transparent);}
  .rn-warn{font-size:11px;line-height:1.55;padding:9px 11px;border-radius:10px;
    color:color-mix(in srgb,var(--color-text) 72%,transparent);
    background:color-mix(in srgb,#FFD34D 6%,transparent);border:1px solid color-mix(in srgb,#FFD34D 20%,transparent);}
  .rn-list{display:flex;flex-direction:column;gap:6px;}
  .rn-row{display:grid;grid-template-columns:20px minmax(0,1fr) auto;align-items:center;gap:9px;
    padding:9px 10px;border-radius:11px;font-size:12px;
    border:1px solid var(--color-divider);opacity:.45;}
  .rn-row.now{opacity:1;border-color:color-mix(in srgb,var(--color-accent) 55%,transparent);
    background:color-mix(in srgb,var(--color-accent) 10%,transparent);}
  .rn-row.done{opacity:1;border-color:color-mix(in srgb,${GREEN} 45%,transparent);
    background:color-mix(in srgb,${GREEN} 8%,transparent);}
  .rn-row .ri{text-align:center;color:${GREEN};font-size:12px;}
  .rn-row.now .ri{color:var(--color-accent-300,var(--color-accent));}
  .rn-row .rt{min-width:0;}
  .rn-row .rt b{display:block;font-size:12.5px;font-weight:500;line-height:1.3;}
  .rn-row .rt small{display:block;font-size:10px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .rn-row .ra{display:flex;align-items:center;gap:10px;}
  .rn-row .ck-b,.rn-box .ck-btns .ck-b{white-space:nowrap;}
  .rn-lk{font-size:10.5px;white-space:nowrap;text-decoration:none;
    color:var(--color-accent-300,var(--color-accent));}
  .rn-lk:hover{text-decoration:underline;color:var(--color-text);}
  .rn-lk:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;border-radius:4px;}
  .rn-row .rr{font-size:10px;font-weight:700;color:${GREEN};}
  .rn-foot{font-size:10.5px;line-height:1.55;padding-top:10px;color:color-mix(in srgb,var(--color-text) 52%,transparent);
    border-top:1px solid transparent;
    border-image:linear-gradient(90deg,transparent,color-mix(in srgb,var(--color-text) 18%,transparent) 18%,color-mix(in srgb,var(--color-text) 18%,transparent) 82%,transparent) 1;}

  /* ── my trips ── */
  .ck-hh{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 50%,transparent);margin:2px 0 -4px;}
  .ck-tcard{border:1px solid var(--color-divider);border-radius:14px;padding:13px;display:flex;
    flex-direction:column;gap:9px;background:color-mix(in srgb,#000 10%,transparent);}
  .ck-tcard.on{border-color:color-mix(in srgb,${GREEN} 50%,transparent);
    background:color-mix(in srgb,${GREEN} 7%,transparent);}
  .ck-tcard .th{display:flex;align-items:flex-start;gap:9px;}
  .ck-tcard .th b{flex:1 1 auto;min-width:0;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .ck-tcard .when{font-size:11px;padding:3px 8px;border-radius:8px;white-space:nowrap;
    border:1px solid var(--color-divider);color:color-mix(in srgb,var(--color-text) 72%,transparent);}
  .ck-tcard .meta{font-size:11.5px;color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  .ck-mini{height:4px;border-radius:2px;background:color-mix(in srgb,#000 26%,transparent);overflow:hidden;}
  .ck-mini i{display:block;height:100%;background:${GREEN};}

  /* ── cards ── */
  .ck-card{border:1px solid var(--color-divider);border-radius:14px;padding:14px;
    display:flex;flex-direction:column;gap:10px;background:color-mix(in srgb,#000 10%,transparent);}
  .ck-h{display:flex;align-items:center;gap:8px;}
  .ck-h .hi{font-size:19px;}
  .ck-h b{font-size:15.5px;letter-spacing:-.01em;}
  .ck-sub{font-size:12.5px;line-height:1.55;color:color-mix(in srgb,var(--color-text) 74%,transparent);}
  .ck-note{font-size:11px;line-height:1.5;color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .ck-back{align-self:flex-start;font:inherit;font-size:11.5px;background:none;border:0;padding:2px 0;
    color:color-mix(in srgb,var(--color-text) 70%,transparent);cursor:pointer;}
  .ck-back:hover{color:var(--color-accent);}
  .ck-glance{border:1px solid var(--color-divider);border-radius:14px;overflow:hidden;flex:0 0 auto;}
  .ck-gt{width:100%;display:flex;align-items:center;gap:8px;font:inherit;font-size:12.5px;font-weight:600;
    padding:11px;min-height:44px;background:color-mix(in srgb,#000 14%,transparent);border:0;
    color:var(--color-text);cursor:pointer;text-align:left;}
  .ck-gt .ar{margin-left:auto;opacity:.6;font-size:10px;}
  .ck-gb{padding:11px;display:flex;flex-direction:column;gap:11px;font-size:12px;}
  .ck-line{display:flex;gap:7px;align-items:flex-start;}
  .lb{flex:0 0 auto;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 52%,transparent);}

  /* ── itinerary ── */
  .ck-itin{display:flex;flex-direction:column;}
  .ck-itin .lb{margin-bottom:5px;}
  .ck-stop{display:flex;align-items:center;gap:9px;font-size:12.5px;min-width:0;}
  .ck-stop .pin{flex:0 0 auto;width:20px;text-align:center;font-size:13px;}
  .ck-stop b{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .ck-hop{display:flex;align-items:center;gap:9px;font-size:10.5px;
    color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .ck-hop .rail{flex:0 0 auto;width:20px;display:flex;justify-content:center;}
  .ck-hop .rail::before{content:"";display:block;width:2px;height:22px;border-radius:1px;
    background:color-mix(in srgb,var(--color-text) 20%,transparent);}
  .ck-hop .hm{display:flex;align-items:center;gap:5px;white-space:nowrap;}
  .sdot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:0 0 auto;}

  /* ── ways (kept plans) ── */
  .ck-way{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:11px;
    border:1px solid var(--color-divider);font-size:12px;}
  .ck-way.pri{border-color:color-mix(in srgb,var(--color-accent) 50%,transparent);
    background:color-mix(in srgb,var(--color-accent) 9%,transparent);}
  .ck-way .wl{flex:1 1 auto;min-width:0;}
  .ck-way .wl b{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ck-way .wl small{display:block;font-size:10.5px;margin-top:1px;
    color:color-mix(in srgb,var(--color-text) 58%,transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ck-way .wp{flex:0 0 auto;font-weight:700;font-size:12.5px;display:flex;flex-direction:column;align-items:flex-end;line-height:1.05;}
  .ck-way .wp small{font-size:7.5px;font-weight:400;opacity:.7;max-width:54px;white-space:normal;text-align:right;line-height:1.1;}
  .ck-way .wx{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:1px solid var(--color-divider);
    background:none;color:color-mix(in srgb,var(--color-text) 55%,transparent);font-size:11px;cursor:pointer;}
  .ck-way .wx:hover{color:#FF6B6B;border-color:color-mix(in srgb,#FF6B6B 45%,transparent);}

  /* ── base sign-up cards ── */
  .ck-base{border:1px solid var(--color-divider);border-radius:13px;padding:11px;
    display:flex;flex-direction:column;gap:9px;}
  .ck-base.on{border-color:color-mix(in srgb,${GREEN} 50%,transparent);background:color-mix(in srgb,${GREEN} 7%,transparent);}
  .ck-base.grey{border-color:color-mix(in srgb,${GREY} 55%,transparent);background:color-mix(in srgb,${GREY} 8%,transparent);}
  .ck-base .bt{display:flex;align-items:center;gap:8px;}
  .ck-base .bt .tick{width:24px;height:24px;flex:0 0 auto;border-radius:50%;display:flex;align-items:center;
    justify-content:center;font-size:12px;border:1px solid var(--color-divider);}
  .ck-base.on .bt .tick{border-color:${GREEN};color:${GREEN};background:color-mix(in srgb,${GREEN} 18%,transparent);}
  .ck-base.grey .bt .tick{border-color:${GREY};color:${GREY};}
  .ck-base .bt b{flex:1 1 auto;min-width:0;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .ck-clock{flex:0 0 auto;font-size:10px;padding:3px 8px;border-radius:8px;white-space:nowrap;
    border:1px solid color-mix(in srgb,${GREEN} 45%,transparent);color:${GREEN};}
  .ck-clock.warn{border-color:color-mix(in srgb,#f0c33c 50%,transparent);color:#f0c33c;}
  .ck-brow{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:12px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,#000 8%,transparent);}
  .ck-brow.on{border-color:color-mix(in srgb,${GREEN} 50%,transparent);background:color-mix(in srgb,${GREEN} 8%,transparent);}
  .ck-tk{flex:0 0 auto;width:30px;height:30px;border-radius:50%;cursor:pointer;font:inherit;font-size:12px;
    border:1.5px solid color-mix(in srgb,var(--color-text) 26%,transparent);background:color-mix(in srgb,#000 18%,transparent);
    color:var(--color-text);display:flex;align-items:center;justify-content:center;}
  .ck-tk:hover{border-color:var(--color-accent);}
  .ck-brow.on .ck-tk{border-color:${GREEN};color:#0b1020;background:${GREEN};font-weight:700;}
  .ck-brow .bmain{flex:1 1 auto;min-width:0;}
  .ck-brow .bmain b{display:flex;align-items:center;gap:5px;font-size:13px;min-width:0;}
  .ck-brow .bmain b>span{flex:0 0 auto;}
  .ck-brow .bmain small{display:block;font-size:10.5px;margin-top:2px;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .ck-brow .bacts{flex:0 0 auto;display:flex;gap:4px;}
  .ck-brow .bacts button,.ck-brow .bacts a{width:36px;height:36px;border-radius:10px;cursor:pointer;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 80%,transparent);
    color:var(--color-text);font:inherit;font-size:13px;text-decoration:none;
    display:flex;align-items:center;justify-content:center;}
  .ck-brow .bacts button:hover,.ck-brow .bacts a:hover{border-color:var(--color-accent);
    background:color-mix(in srgb,var(--color-accent) 16%,transparent);}
  .ck-brow .bacts button[data-fill]{border-color:var(--color-accent);}
  .ck-covers{font-size:11.5px;line-height:1.5;color:color-mix(in srgb,var(--color-text) 70%,transparent);}
  .ck-covers b{color:var(--color-text);}
  .ck-tagrow{display:flex;flex-wrap:wrap;gap:5px;}
  .ck-tag{font-size:10px;padding:2px 7px;border-radius:8px;border:1px solid var(--color-divider);
    color:color-mix(in srgb,var(--color-text) 72%,transparent);white-space:nowrap;}
  .ck-tag.home{border-color:color-mix(in srgb,var(--color-accent) 55%,transparent);color:var(--color-accent);}
  .ck-btns{display:flex;flex-wrap:wrap;gap:6px;}
  .ck-b{font:inherit;font-size:12px;min-height:44px;padding:10px 12px;border-radius:11px;flex:1 1 auto;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 80%,transparent);
    color:var(--color-text);cursor:pointer;text-align:center;text-decoration:none;
    display:inline-flex;align-items:center;justify-content:center;gap:6px;}
  .ck-b:hover{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 14%,transparent);}
  .ck-b.zap{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 14%,transparent);font-weight:600;}
  .ck-b.yes{border-color:color-mix(in srgb,${GREEN} 60%,transparent);}
  .ck-b.yes.on{background:color-mix(in srgb,${GREEN} 22%,transparent);}
  .ck-b.small{flex:0 0 auto;min-height:36px;padding:7px 10px;font-size:11.5px;}
  .ck-b.wide{flex-basis:100%;}
  .ck-slot{display:flex;gap:9px;align-items:center;padding:9px;border-radius:11px;
    border:1px dashed color-mix(in srgb,var(--color-text) 26%,transparent);}
  .ck-slot.full{border-style:solid;border-color:color-mix(in srgb,${GREEN} 45%,transparent);}
  .ck-thumb{width:52px;height:52px;flex:0 0 auto;border-radius:9px;object-fit:cover;cursor:pointer;
    border:1px solid var(--color-divider);}
  .ck-slot .st{flex:1;min-width:0;font-size:11.5px;line-height:1.45;color:color-mix(in srgb,var(--color-text) 74%,transparent);}
  .ck-row{display:flex;align-items:center;gap:10px;padding:10px 11px;min-height:52px;border-radius:12px;
    border:1px solid var(--color-divider);background:none;color:var(--color-text);font:inherit;font-size:12.5px;
    text-align:left;cursor:pointer;width:100%;}
  .ck-row .bx{width:24px;height:24px;flex:0 0 auto;border-radius:7px;border:1.5px solid var(--color-divider);
    display:flex;align-items:center;justify-content:center;font-size:13px;}
  .ck-row.on{border-color:color-mix(in srgb,${GREEN} 55%,transparent);background:color-mix(in srgb,${GREEN} 9%,transparent);}
  .ck-row.on .bx{border-color:${GREEN};color:${GREEN};}
  .ck-row .rt{flex:1;min-width:0;}
  .ck-row .rt small{display:block;font-size:11px;color:color-mix(in srgb,var(--color-text) 60%,transparent);margin-top:2px;}
  .ck-step{display:flex;align-items:center;gap:9px;font-size:11.5px;padding:5px 2px;}
  .ck-step .ci{width:19px;height:19px;flex:0 0 auto;border-radius:50%;display:flex;align-items:center;
    justify-content:center;font-size:10.5px;border:1px solid var(--color-divider);}
  .ck-step.done .ci{border-color:${GREEN};color:${GREEN};}
  .ck-step.grey .ci{border-color:${GREY};color:${GREY};}
  .ck-spare{display:flex;align-items:center;gap:8px;font-size:12.5px;}
  .ck-spare button{width:38px;height:38px;border-radius:10px;border:1px solid var(--color-divider);
    background:none;color:var(--color-text);font:inherit;font-size:16px;cursor:pointer;}
  .ck-spare b{min-width:78px;text-align:center;}
  .ck-shots{display:flex;gap:6px;flex-wrap:wrap;}

  /* ── dates ── */
  .ck-dates{display:flex;gap:8px;}
  .ck-df{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:4px;}
  .ck-df span{font-size:10px;letter-spacing:.07em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 52%,transparent);}
  .ck-df input{font:inherit;font-size:12.5px;min-height:44px;padding:10px;border-radius:11px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,#000 20%,transparent);
    color:var(--color-text);color-scheme:dark;width:100%;box-sizing:border-box;}
  .ck-df input:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}

  /* \u2500\u2500 one question at a time \u2500\u2500 */
  .ck-q{display:flex;flex-direction:column;gap:7px;}
  .ck-q>b{font-family:var(--font-heading,var(--font-body));font-size:14px;font-weight:500;
    letter-spacing:-.01em;line-height:1.35;color:var(--color-text);}
  .ck-q input{font:inherit;font-size:14px;min-height:48px;padding:12px 13px;border-radius:12px;
    border:1px solid color-mix(in srgb,var(--color-accent) 34%,var(--color-divider));
    background:color-mix(in srgb,#000 24%,transparent);color:var(--color-text);
    color-scheme:dark;width:100%;box-sizing:border-box;}
  .ck-q input:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .ck-q>small{font-size:10.5px;line-height:1.45;color:color-mix(in srgb,var(--color-text) 48%,transparent);}
  /* ── H&R-Block style rows: a number, the day, and one plain sentence ── */
  .ck-row{display:flex;align-items:flex-start;gap:10px;padding:11px 0 12px;
    border-bottom:1px solid color-mix(in srgb,var(--color-text) 9%,transparent);}
  .ck-num{flex:0 0 auto;width:24px;height:24px;margin-top:1px;border-radius:50%;display:grid;
    place-items:center;font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums;
    color:var(--color-accent);
    border:1px solid color-mix(in srgb,var(--color-accent) 45%,transparent);
    background:color-mix(in srgb,var(--color-accent) 13%,transparent);}
  .ck-rt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px;}
  .ck-rt .rl{font-size:11px;letter-spacing:.07em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  .ck-rt>b{font-family:var(--font-heading,var(--font-body));font-size:17px;font-weight:500;
    letter-spacing:-.01em;line-height:1.2;font-variant-numeric:tabular-nums;color:var(--color-text);}
  .ck-rt>small{font-size:12.5px;line-height:1.6;color:color-mix(in srgb,var(--color-text) 78%,transparent);}
  .ck-row>button{flex:0 0 auto;font:inherit;font-size:11.5px;margin-top:2px;padding:5px 10px;
    border-radius:9px;cursor:pointer;border:1px solid transparent;background:transparent;
    color:color-mix(in srgb,var(--color-accent) 88%,var(--color-text));}
  .ck-row>button:hover{border-color:color-mix(in srgb,var(--color-accent) 45%,transparent);}
  .ck-row>button:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .ck-row.warn .ck-num{color:#FBBF24;border-color:color-mix(in srgb,#FBBF24 45%,transparent);
    background:color-mix(in srgb,#FBBF24 14%,transparent);}
  .ck-row.bad .ck-num{color:#FF6B6B;border-color:color-mix(in srgb,#FF6B6B 45%,transparent);
    background:color-mix(in srgb,#FF6B6B 14%,transparent);}
  .ck-row:last-child{border-bottom:0;}
  /* the plain-fact block: short lines, one fact each */
  .ck-facts{display:flex;flex-direction:column;gap:6px;margin-top:10px;padding:11px 12px;
    border-radius:12px;background:color-mix(in srgb,#000 20%,transparent);
    border:1px solid color-mix(in srgb,var(--color-text) 10%,transparent);}
  .ck-facts.one{margin-top:4px;}
  .ck-facts>b{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .ck-facts>span{font-size:12.5px;line-height:1.6;padding-left:13px;position:relative;
    color:color-mix(in srgb,var(--color-text) 82%,transparent);}
  .ck-facts>span::before{content:"";position:absolute;left:0;top:8px;width:5px;height:5px;
    border-radius:50%;background:color-mix(in srgb,var(--color-accent) 70%,transparent);}
  .ck-ans{display:flex;align-items:baseline;gap:8px;padding:7px 0;
    border-bottom:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);}
  .ck-ans span{flex:0 0 auto;font-size:10px;letter-spacing:.07em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 46%,transparent);}
  .ck-ans b{flex:1 1 auto;font-size:13px;font-weight:500;font-variant-numeric:tabular-nums;}
  .ck-ans button{font:inherit;font-size:10.5px;padding:3px 8px;border-radius:8px;cursor:pointer;
    border:1px solid transparent;background:transparent;
    color:color-mix(in srgb,var(--color-accent) 88%,var(--color-text));}
  .ck-ans button:hover{border-color:color-mix(in srgb,var(--color-accent) 45%,transparent);}
  .ck-ans button:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}

  .ck-qp{display:flex;gap:4px;}
  .ck-qp button{flex:1 1 0;min-width:0;white-space:nowrap;font:inherit;font-size:10px;letter-spacing:.01em;
    padding:4px 3px;border-radius:8px;cursor:pointer;
    border:1px solid color-mix(in srgb,var(--color-text) 14%,transparent);background:transparent;
    color:color-mix(in srgb,var(--color-text) 62%,transparent);transition:all .14s ease;}
  .ck-qp button:hover:not([disabled]){border-color:color-mix(in srgb,var(--color-accent) 55%,transparent);
    color:var(--color-text);}
  .ck-qp button.on{border-color:var(--color-accent);color:var(--color-text);
    background:color-mix(in srgb,var(--color-accent) 16%,transparent);}
  .ck-qp button[disabled]{opacity:.35;cursor:default;}
  .ck-qp button:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}

  /* ── the derived answer: when to file ── */
  .ck-file{margin-top:2px;padding:12px 13px 11px;border-radius:13px;
    border:1px solid color-mix(in srgb,var(--color-text) 11%,transparent);
    background:color-mix(in srgb,#000 22%,transparent);}
  .ck-fh{display:flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.08em;
    text-transform:uppercase;color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .ck-fd{width:6px;height:6px;border-radius:50%;background:#f0c33c;flex:0 0 auto;}
  .ck-file.ok .ck-fd,.ck-file.now .ck-fd{background:#34D399;}
  .ck-file.now .ck-fd{animation:ckPulse 1.9s ease-in-out infinite;}
  @keyframes ckPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.8)}}
  .ck-fw{display:flex;align-items:baseline;gap:8px;margin:5px 0 6px;flex-wrap:wrap;}
  .ck-fw b{font-family:var(--font-heading,var(--font-body));font-size:17px;font-weight:500;
    letter-spacing:-.01em;font-variant-numeric:tabular-nums;color:var(--color-text);}
  .ck-fw em{font-style:normal;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 42%,transparent);}
  .ck-fy{font-size:11.5px;line-height:1.5;color:color-mix(in srgb,var(--color-text) 74%,transparent);}
  .ck-fc{display:flex;align-items:center;gap:9px;flex-wrap:wrap;
    margin-top:7px;padding-top:7px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;
    border-top:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);
    color:color-mix(in srgb,var(--color-text) 46%,transparent);}
  .ck-lkb{font:inherit;display:block;width:100%;margin-top:11px;font-size:12.5px;letter-spacing:.01em;
    text-transform:none;padding:11px;border-radius:11px;cursor:pointer;
    border:1px solid color-mix(in srgb,#34D399 52%,transparent);background:transparent;color:#34D399;
    transition:background .14s ease;}
  .ck-lkb:hover{background:color-mix(in srgb,#34D399 14%,transparent);}
  .ck-lkb:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .ck-lk{font:inherit;display:block;width:100%;margin-top:11px;padding:11px;border-radius:11px;cursor:pointer;
    font-size:12.5px;letter-spacing:.01em;text-transform:none;color:#34D399;
    border:1px solid color-mix(in srgb,#34D399 40%,transparent);
    background:color-mix(in srgb,#34D399 12%,transparent);}
  .ck-lk:hover{background:color-mix(in srgb,#34D399 20%,transparent);}
  .ck-lk:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .ck-ask{display:flex;align-items:center;gap:9px;padding:11px 12px;border-radius:13px;font-size:11.5px;
    line-height:1.5;color:color-mix(in srgb,var(--color-text) 72%,transparent);
    border:1px dashed color-mix(in srgb,var(--color-text) 16%,transparent);}
  .ck-ask.bad{border-style:solid;border-color:color-mix(in srgb,#e06c75 45%,transparent);color:#e06c75;}
  .ck-note{display:flex;gap:8px;padding:8px 2px 0;font-size:11px;line-height:1.5;
    color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  /* ── bump gameplan: the days to hold on each end ── */
  .ck-gp{margin-top:9px;padding:4px 12px 10px;border-radius:13px;display:flex;flex-direction:column;gap:0;
    border:1px solid color-mix(in srgb,var(--color-accent) 26%,transparent);
    background:color-mix(in srgb,var(--color-accent) 7%,transparent);}
  .ck-gph{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;padding-bottom:3px;}
  .ck-gph .gi{font-size:13px;}
  .ck-gph b{font-size:12.5px;font-weight:600;}
  .ck-gph small{flex:1 1 100%;font-size:10.5px;line-height:1.45;
    color:color-mix(in srgb,var(--color-text) 52%,transparent);}
  .ck-gpr{display:flex;flex-direction:column;gap:1px;padding:7px 0 6px;
    border-top:1px solid color-mix(in srgb,var(--color-text) 9%,transparent);}
  .ck-gpr .gl{font-size:10px;letter-spacing:.09em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  .ck-gpr b{font-size:14px;font-weight:500;letter-spacing:-.01em;}
  .ck-gpr small{font-size:10.5px;line-height:1.45;color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .ck-gpb{display:flex;gap:9px;margin-top:8px;padding:9px 10px;border-radius:11px;
    border:1px solid color-mix(in srgb,#FBBF24 34%,transparent);
    background:color-mix(in srgb,#FBBF24 9%,transparent);}
  .ck-gpb .bd{flex:0 0 auto;width:7px;height:7px;margin-top:5px;border-radius:50%;background:#FBBF24;
    box-shadow:0 0 7px color-mix(in srgb,#FBBF24 60%,transparent);}
  .ck-gpb .bt{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .ck-gpb b{font-size:12.5px;font-weight:600;}
  .ck-gpb small{font-size:10.5px;line-height:1.5;color:color-mix(in srgb,var(--color-text) 66%,transparent);}
  .ck-gpb.tight{border-color:color-mix(in srgb,#FF6B6B 34%,transparent);
    background:color-mix(in srgb,#FF6B6B 9%,transparent);margin-top:6px;}
  .ck-gpb.tight .bd{background:#FF6B6B;box-shadow:0 0 7px color-mix(in srgb,#FF6B6B 55%,transparent);}

  /* ── warnings ── */
  .ck-warn{display:flex;gap:8px;padding:9px 11px;border-radius:11px;font-size:11.5px;line-height:1.5;
    border:1px solid color-mix(in srgb,#f0c33c 45%,transparent);background:color-mix(in srgb,#f0c33c 10%,transparent);}
  .ck-warn.bad{border-color:color-mix(in srgb,#e06c75 50%,transparent);background:color-mix(in srgb,#e06c75 11%,transparent);}
  .ck-warn.ok{border-color:color-mix(in srgb,${GREEN} 45%,transparent);background:color-mix(in srgb,${GREEN} 9%,transparent);}
  .ck-vs{border:1px solid var(--color-divider);border-radius:12px;overflow:hidden;}
  .ck-vs.ok{border-color:color-mix(in srgb,${GREEN} 40%,transparent);}
  .ck-vs.warn{border-color:color-mix(in srgb,#f0c33c 40%,transparent);}
  .ck-vs.bad{border-color:color-mix(in srgb,#e06c75 45%,transparent);}
  .ck-vt{display:flex;align-items:center;gap:9px;width:100%;font:inherit;text-align:left;
    padding:9px 11px;min-height:50px;background:none;border:0;color:var(--color-text);cursor:pointer;}
  .ck-vs.ok .ck-vt{background:color-mix(in srgb,${GREEN} 8%,transparent);}
  .ck-vs.warn .ck-vt{background:color-mix(in srgb,#f0c33c 8%,transparent);}
  .ck-vs.bad .ck-vt{background:color-mix(in srgb,#e06c75 10%,transparent);}
  .ck-vt .ic{flex:0 0 auto;font-size:15px;}
  .ck-vt .vtx{flex:1 1 auto;min-width:0;}
  .ck-vt .vtx b{display:block;font-size:12.5px;}
  .ck-vt .vtx small{display:block;font-size:11px;margin-top:1px;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .ck-vt .ar{flex:0 0 auto;font-size:9px;opacity:.55;}
  .ck-vb{padding:2px 12px 12px;font-size:11.5px;line-height:1.55;
    color:color-mix(in srgb,var(--color-text) 80%,transparent);}

  #chkView{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;
    background:rgba(6,8,16,.93);padding:20px;cursor:zoom-out;}
  #chkView.show{display:flex;}
  #chkView img{max-width:100%;max-height:100%;border-radius:10px;box-shadow:var(--shadow-lg);}
  #chkView .vx{position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 90%,transparent);
    color:var(--color-text);font-size:16px;cursor:pointer;}`;
css.textContent+=`
  #chk .si svg,#chk .dot svg,#chkBar .dot svg,#chk .rt svg{display:inline-block;vertical-align:-3px;}
  #chk .si,#chkBar .dot,#chk .dot{display:flex;align-items:center;justify-content:center;}
  #chk .rt{display:flex;align-items:center;gap:7px;}
  #chk .ck-warn svg{flex:0 0 auto;margin-top:1px;}`;
document.head.appendChild(css);

const STEPS=[
  {n:1,ic:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:18px;height:18px;display:block"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4.4 3.6 6.6v13L9 17.4l6 2.2 5.4-2.2v-13L15 6.6Z"></path><path d="M9 4.4v13M15 6.6v13"></path></g></svg>',short:"Trip",name:"Your trip & ways"},
  {n:2,ic:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:18px;height:18px;display:block"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"></path><path d="M16.8 3.9a1.9 1.9 0 0 1 2.7 2.7L8.9 17.2l-4 1.1 1.1-4Z"></path><path d="M14.9 5.8 17.6 8.5"></path></g></svg>',short:"Sign up",name:"Sign up at each base"},
  {n:3,ic:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:18px;height:18px;display:block"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.4"></rect><path d="M8.6 7 10 4.4h4L15.4 7"></path><circle cx="12" cy="13.4" r="3.3"></circle></g></svg>',short:"Prove it",name:"Prove it"},
  {n:4,ic:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:18px;height:18px;display:block"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.4 8.6V6.4h17.2v2.2a2.4 2.4 0 0 0 0 4.8v4.2H3.4v-4.2a2.4 2.4 0 0 0 0-4.8Z"></path><path d="M9.6 9.4v5.6"></path></g></svg>',short:"Backup",name:"Backup ticket"},
  {n:5,ic:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:18px;height:18px;display:block"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.6 12S6 6.4 12 6.4 21.4 12 21.4 12 18 17.6 12 17.6 2.6 12 2.6 12Z"></path><circle cx="12" cy="12" r="2.6"></circle></g></svg>',short:"Board",name:"Watch the board"},
  {n:6,ic:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:18px;height:18px;display:block"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 13.4 20.4 4.6l-4.2 8.2-1.6 7.4-2.8-4.6-5-1.2Z"></path><path d="M11.8 15.6 20.4 4.6"></path></g></svg>',short:"Fly day",name:"Pack & fly day"}
];
const PACK=[
  {k:"ids",t:"ID cards in hand",s:"Both military ID cards — the real cards, not photos."},
  {k:"passports",t:"Passports checked",s:"Good for 6+ months after you land."},
  {k:"bag",t:"Board bag measured",s:"Under 165 cm total counts as one of your bags."},
  {k:"arrive",t:"Know your arrive-by time",s:"Be at the desk 3 hours before roll call."}
];
const CHK={open:false,slot:null,home:false};

// ── trips ────────────────────────────────────────────────────────────────
const PFX="spacea.trip.v1.";
function allRecs(){
  const out=[];
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i);
    if(k&&k.indexOf(PFX)===0){ try{ const r=JSON.parse(localStorage.getItem(k));
      if(r&&r.plan&&r.plan.out&&r.plan.out.length) out.push(r); }catch(e){} } } }catch(e){}
  return out.sort((a,b)=>String(b.updated||"").localeCompare(String(a.updated||"")));
}
const NONE="__none__";                      // an explicit "no trip is current" marker
const curId=()=>{ try{ return localStorage.getItem("spacea.trip.cur")||null; }catch(e){ return null; } };
const setCur=id=>{ try{ localStorage.setItem("spacea.trip.cur",id); }catch(e){} };
const clearCur=()=>{ try{ localStorage.setItem("spacea.trip.cur",NONE);
  localStorage.removeItem("spacea.trip.current"); }catch(e){} };
function trip(){
  const t=window.SPACEA_TRIP;
  if(t&&t.start&&t.hub&&t.out&&t.out.length) return t;
  const id=curId();
  if(id===NONE) return null;                // deliberately nothing — never substitute another trip
  const list=allRecs();
  let r=id?list.filter(x=>x.id===id)[0]:null;
  if(id&&!r){ clearCur(); return null; }    // dangling pointer: heal it, don't adopt a stranger
  if(!r&&!id) r=list[0];
  if(r) return r.plan;
  try{ const s=JSON.parse(localStorage.getItem("spacea.trip.current")||"null");
    if(s&&s.start&&s.out&&s.out.length) return s; }catch(e){}
  return null;
}
function legsOf(t){
  const mk=(dir,l)=>({dir,f:l.f,to:l.t||l.to,comm:!!l.comm,cost:l.cost,p:l.p,key:dir+":"+l.f+">"+(l.t||l.to)});
  return (t.out||[]).map(l=>mk("out",l)).concat((t.home||[]).map(l=>mk("home",l)));
}
const flights=t=>legsOf(t).filter(l=>!l.comm);
const sigOf=legs=>(legs||[]).map(l=>l.f+">"+(l.t||l.to)+(l.comm?"$":"")).join("|");
const pathTxt=(startKey,legs)=>[startKey].concat((legs||[]).map(l=>l.t||l.to)).map(nm).join(" → ");

// ── storage ──────────────────────────────────────────────────────────────
const recKey=t=>PFX+t.start+">"+t.hub;
function load(t){
  let r=null, fresh=false;
  try{ r=JSON.parse(localStorage.getItem(recKey(t))||"null"); }catch(e){}
  if(!r){ fresh=true; r={}; }
  r._fresh=fresh;
  r.id=t.start+">"+t.hub; r.start=t.start; r.hub=t.hub;
  r.bases=r.bases||{}; r.legs=r.legs||{}; r.backup=r.backup||{}; r.pack=r.pack||{};
  r.win=r.win||{from:"",to:""}; r.view=r.view||1;
  if(t&&t.out&&t.out.length) r.plan={start:t.start,hub:t.hub,out:t.out,home:t.home||[],
    pctOut:t.pctOut,pctHome:t.pctHome,hrs:t.hrs,planLetter:t.planLetter};
  r.label=nm(t.start)+" → "+nm(t.hub);
  r.names=r.names||{}; r.names[t.start]=nm(t.start); r.names[t.hub]=nm(t.hub);
  legsOf(t).forEach(l=>{ r.names[l.f]=nm(l.f); r.names[l.to]=nm(l.to); });
  // kept ways — the plan on the map is always way #1
  r.outs=r.outs||[]; r.homes=r.homes||[];
  if(r.plan){
    const os=sigOf(r.plan.out);
    if(!r.outs.some(w=>w.sig===os)) r.outs.unshift({sig:os,legs:r.plan.out,pct:r.plan.pctOut,
      letter:r.plan.planLetter||"A",start:r.plan.start});
    if(r.plan.home&&r.plan.home.length){
      const hs=sigOf(r.plan.home);
      if(!r.homes.some(w=>w.sig===hs)) r.homes.unshift({sig:hs,legs:r.plan.home,pct:r.plan.pctHome,letter:"1"});
    }
  }
  if(r.backup.have==null) r.backup.have=false;   // never inherited: a ticket belongs to ONE trip
  if(r.backup.spare==null) r.backup.spare=Math.min(7,Math.max(3,parseInt(localStorage.getItem("spacea.home.spare")||"4",10)));
  return r;
}
function save(r){
  // After "Start over" the cur pointer is NONE. Handlers captured before the clear still hold the old
  // record and write it back on their next render — which is how a "1 saved trip" reappeared. Only
  // let a write through when it belongs to the trip that is genuinely live now.
  if(curId()===NONE){
    const live=window.SPACEA_TRIP;
    if(!(live&&live.start===r.start&&live.hub===r.hub)) return r;
  }
  r.updated=new Date().toISOString();
  try{
    localStorage.setItem(PFX+r.id,JSON.stringify(r));
    localStorage.setItem("spacea.home.spare",String(r.backup.spare||4));
  }catch(e){ toast("Storage is full — delete an old screenshot and try again"); }
}
const bitem=(r,k)=>(r.bases[k]=r.bases[k]||{});
const litem=(r,k)=>(r.legs[k]=r.legs[k]||{});

// every base you must sign up at, with the destinations each one covers
function basesOf(r){
  const map={}, order=[];
  const add=(w,dir)=>{
    (w.legs||[]).filter(l=>!l.comm).forEach(l=>{
      const to=l.t||l.to;
      if(!map[l.f]){ map[l.f]={key:l.f,dests:[],ways:[],dir}; order.push(l.f); }
      const b=map[l.f];
      if(b.dests.indexOf(nm(to))<0) b.dests.push(nm(to));
      const tag=(dir==="home"?"Home ":"Way ")+(w.letter||"");
      if(b.ways.indexOf(tag)<0) b.ways.push(tag);
      if(dir==="home") b.hasHome=true; else b.hasOut=true;
    });
  };
  (r.outs||[]).forEach(w=>add(w,"out"));
  (r.homes||[]).forEach(w=>add(w,"home"));
  return order.map(k=>map[k]);
}
// a live registration in the shared Sign-Up Center ledger
function ledgerFor(k){
  const list=(typeof window.chkSignups==="function")?window.chkSignups():[];
  const live=list.filter(x=>(x.terms||[]).indexOf(k)>=0).map(x=>{
    const exp=new Date(x.fired); exp.setDate(exp.getDate()+(x.validity||60));
    return {id:x.id,dests:x.dests||[],days:Math.ceil((exp-Date.now())/864e5)};
  }).filter(x=>x.days>0);
  return live.sort((a,b)=>b.days-a.days)[0]||null;
}
const signedAt=(r,k)=>!!bitem(r,k).signed||!!ledgerFor(k);

// ── progress ─────────────────────────────────────────────────────────────
function tally(t,r){
  const bs=basesOf(r), fl=flights(r.plan||t), items=[];
  items.push({s:1,done:!!(r.win&&r.win.from)});
  bs.forEach(b=>items.push({s:2,done:signedAt(r,b.key)}));
  bs.forEach(b=>{const it=bitem(r,b.key); items.push({s:3,done:!!(it.proof||it.manual)});});
  items.push({s:4,done:!!r.backup.have});
  fl.forEach(l=>items.push({s:5,done:!!litem(r,l.key).listed}));
  PACK.forEach(p=>items.push({s:6,done:!!r.pack[p.k]}));
  const stepDone=n=>items.filter(i=>i.s===n).every(i=>i.done);
  const done=items.filter(i=>i.done).length;
  return {items,stepDone,bases:bs,fl,pct:Math.round(done/items.length*100),
    firstOpen:(STEPS.find(s=>!stepDone(s.n))||{n:6}).n};
}
// work left on a base that no kept way uses any more
function stale(r,bs){
  const live=new Set(bs.map(b=>b.key));
  return Object.keys(r.bases).filter(k=>!live.has(k)&&(r.bases[k].signed||r.bases[k].proof||r.bases[k].manual));
}

// ── dates ────────────────────────────────────────────────────────────────
const fmtD=s=>{ if(!s) return ""; const d=new Date(s+"T12:00:00");
  return isNaN(d)?"":d.toLocaleDateString(undefined,{month:"short",day:"numeric"}); };
// the headline dates carry a weekday too — you file at a staffed desk, so the day of the week matters
const fmtDW=s=>{ if(!s) return ""; const d=new Date(s+"T12:00:00");
  return isNaN(d)?"":d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}); };
// The 60 days runs from the day you SIGN UP — never from the travel date.
function winNotices(r,navy45){
  const out=[];
  const f=r.win&&r.win.from, t2=r.win&&r.win.to;
  const life=navy45?45:60;
  const DAY=864e5, iso=x=>x.toISOString().slice(0,10);
  const today=new Date(); today.setHours(12,0,0,0);
  const cal='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:17px;height:17px;display:block"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.6" y="5.4" width="16.8" height="15" rx="2.2"></rect><path d="M3.6 10h16.8M8.4 3.6v3.4M15.6 3.6v3.4"></path></g></svg>';
  if(!f){ out.push({kind:"ask",ic:cal,txt:"Pick the day you want to leave — that alone tells us when to file."}); return out; }
  const dep=new Date(f+"T12:00:00"); if(isNaN(dep)) return out;
  const dDep=Math.round((dep-today)/DAY);
  if(dDep<0){ out.push({kind:"ask",tone:"bad",ic:cal,txt:"That date has passed — set your new travel dates."}); return out; }
  const back=t2?new Date(t2+"T12:00:00"):null, hasBack=back&&!isNaN(back);
  const trip=hasBack?Math.round((back-dep)/DAY):null;
  // A sign-up lives `life` days FROM THE DAY YOU FILE. To cover a flight on `dep` the file date F
  // must satisfy F <= dep; to also cover the return it must satisfy F + life >= back. So the legal
  // window is [back-life, dep] — and since queue position is set by filing time, the EARLIEST date
  // in that window is the best one: it still covers the way home and puts you highest in the line.
  const twoTrips=hasBack&&trip>life;
  let from=hasBack&&!twoTrips?new Date(back-life*DAY):new Date(today);
  if(from<today) from=new Date(today);
  const to=new Date(dep);
  const best=new Date(from);
  const dFrom=Math.round((from-today)/DAY);
  const covers=(twoTrips||!hasBack)?"the flight out":"both legs";   // no return date = nothing to promise about it
  const plan={kind:"plan",from:iso(from),to:iso(to),best:iso(best),
    tone:dFrom<=0?(dDep<=7?"now":"ok"):"soon",
    open:dFrom<=0, inDays:dFrom, depIn:dDep, life:life, covers:covers,
    line:twoTrips
      ? "Covers the flight out. You\u2019ll sign up again for the way home once you land."
      : dFrom<=0
        ? (dDep<=7
            ? "You fly in "+dDep+" day"+(dDep===1?"":"s")+". Everyone who filed before you is ahead in the queue."
            : "Filing today puts you highest in the queue, and it still covers your flight home.")
        : hasBack
          ? "That\u2019s "+dFrom+" day"+(dFrom===1?"":"s")+" from now \u2014 the earliest date that still covers your flight home."
          : "That\u2019s "+dFrom+" day"+(dFrom===1?"":"s")+" from now. File any earlier and it runs out before you fly."};
  out.push(plan);
  if(twoTrips) out.push({kind:"note",ic:"\u{1F3E0}",txt:"Your trip is <b>"+trip+" days</b> — longer than one sign-up lasts. File again for the flights home once you land; the app keeps that step on your checklist."});
  else if(!hasBack) out.push({kind:"note",ic:"\u{21A9}\u{FE0F}",txt:"Add a <b>back by</b> date and we can check the flights home are covered too."});
  if(hasBack&&trip>=0&&trip<3) out.push({kind:"note",ic:"\u{1F39F}\u{FE0F}",txt:"Only "+trip+" day"+(trip===1?"":"s")+" away — free seats need slack. Keep 3\u20137 spare days."});
  if(navy45) out.push({kind:"note",ic:"\u2693",txt:"A Navy desk on this trip caps sign-ups at <b>45 days</b>, so the shorter clock applies."});
  return out;
}

// ── bump gameplan ────────────────────────────────────────────────────────
// What the Space-A community actually does, encoded: 3 spare days minimum on each end (more when the
// odds are thin), the way home planned looser than the way out, a separate sign-up date for the return
// desk (never re-file at a desk you're already on — that resets your place in the queue), and a hard
// decision day where you stop waiting and buy. Summer adds slack: Jun–Aug is the busiest season.
function bumpPlan(r){
  const f=r.win&&r.win.from, t2=r.win&&r.win.to;
  if(!f) return null;
  const DAY=864e5, iso=d=>d.toISOString().slice(0,10);
  const today=new Date(); today.setHours(12,0,0,0);
  const dep=new Date(f+"T12:00:00");
  if(isNaN(dep)) return null;
  const back=t2?new Date(t2+"T12:00:00"):null;
  const hasBack=!!(back&&!isNaN(back));
  const trip=hasBack?Math.round((back-dep)/DAY):null;
  if(hasBack&&trip<0) return null;
  const pctOf=list=>{const w=(list||[])[0]; return w&&w.pct!=null?w.pct:null;};
  const outPct=pctOf(r.outs), homePct=pctOf(r.homes);
  // days between realistic shots at a seat: good odds means near-daily lift, thin odds means weekly
  const cad=p=>p==null?7:p>=60?2:p>=30?4:7;
  const summer=[5,6,7].indexOf(dep.getMonth())>=0||(hasBack&&[5,6,7].indexOf(back.getMonth())>=0);
  const clampBuf=(p,floor)=>Math.max(floor,Math.min(12,cad(p)*2))+(summer?2:0);
  let outBuf=clampBuf(outPct,3), homeBuf=clampBuf(homePct,5);
  const recOut=outBuf, recHome=homeBuf;
  // never let the buffers eat the whole trip
  const tight=hasBack&&(recOut+recHome)>Math.max(0,trip-1);
  if(tight){
    const room=Math.max(0,trip-1);
    outBuf=Math.max(1,Math.round(room*0.4)); homeBuf=Math.max(1,room-outBuf);
  }
  const add=(d,n)=>new Date(d.getTime()+n*DAY);
  const outEnd=add(dep,outBuf);
  // roll calls to actually show up for on the way out
  const step=cad(outPct), shots=[];
  for(let d=new Date(dep); d<=outEnd && shots.length<5; d=add(d,step)) shots.push(iso(d));
  const life=r.navy45?45:60;
  let homeStart=null, decide=null, noRoom=false, fileHome=null, homeFileWait=0;
  if(hasBack){
    // The way home can't start before you've stopped waiting to fly out, and "give up and buy" has to
    // leave at least one roll call after "start trying" — otherwise the card contradicts itself.
    homeStart=add(back,-homeBuf);
    if(homeStart<outEnd) homeStart=new Date(outEnd);
    if(homeStart>back) homeStart=new Date(back);
    homeBuf=Math.max(0,Math.round((back-homeStart)/DAY));
    // the return desk is a DIFFERENT desk, so filing there is free of the reset trap — but file late
    // enough that the 60 days still cover the day you actually fly home
    fileHome=add(back,-(life-1)); if(fileHome<today) fileHome=new Date(today);
    homeFileWait=Math.max(0,Math.round((fileHome-today)/DAY));
    decide=add(back,-2);     // one day to fly commercial, one to spare
    if(decide<=homeStart) decide=add(homeStart,1);
    noRoom=decide>=back;    // nothing left to wait with — say that instead of printing two dates
  }
  const cash=(()=>{ try{ return (r.hub&&r.start&&typeof window.jmBackup==="function")
    ? window.jmBackup(r.hub,r.start) : null; }catch(e){ return null; } })();
  return {hasBack:hasBack,outA:iso(dep),outB:iso(outEnd),outBuf:outBuf,shots:shots,
    homeA:homeStart?iso(homeStart):null,homeB:hasBack?iso(back):null,homeBuf:homeBuf,
    fileHome:fileHome?iso(fileHome):null,homeFileWait:homeFileWait,life:life,
    decide:decide?iso(decide):null,noRoom:noRoom,cash:cash,summer:summer,trip:trip,
    tight:tight,recOut:recOut,recHome:recHome,step:step,
    outPct:outPct,homePct:homePct};
}

// Plain words, one idea per line. Each row: what to do, the day, and why — nothing else.
function bumpRow(n,label,date,why,tone){
  return '<div class="ck-row '+(tone||"")+'"><span class="ck-num">'+n+'</span>'
    +'<span class="ck-rt"><span class="rl">'+label+'</span><b>'+date+'</b>'
    +'<small>'+why+'</small></span></div>';
}
function bumpHtml(g){
  if(!g||!g.hasBack) return "";
  const d=s=>fmtDW(s);
  const shot=g.shots.length;
  const rows=[
    bumpRow(3,"Sign up for the way home",
      g.homeFileWait?d(g.fileHome):"Today — same sign-up",
      g.homeFileWait
        ? "Wait "+g.homeFileWait+" day"+(g.homeFileWait===1?"":"s")+". Sign up sooner and it runs out before you fly home."
        : "Your sign-up already covers the way home. Nothing else to do."),
    bumpRow(4,g.noRoom?"No day left to wait":"If you still have no seat by",
      g.noRoom?"Move a date":d(g.decide),
      g.noRoom
        ? "These dates leave no day to wait for a free seat. Move your home-by date, or buy that leg."
        : "Buy a ticket that day"+(g.cash?" (about "+g.cash+")":"")+". Buy it refundable now and waiting costs you nothing.",
      "warn")
  ].join("");
  const tight=g.tight?'<div class="ck-row bad"><span class="ck-num">!</span>'
    +'<span class="ck-rt"><span class="rl">These dates are tight</span>'
    +'<b>'+g.trip+' days away</b><small>For this trip you want about '+g.recOut+' spare days going out and '
    +g.recHome+' coming home. You have '+g.trip+' days in total. Stay longer, or plan to buy one flight.</small></span></div>':"";
  return '<div class="ck-gp">'+rows+tight
    +'<div class="ck-facts"><b>Why the spare days?</b>'
    +'<span>A free seat is not a ticket. You wait in line for seats nobody paid for.</span>'
    +'<span>Retirees board last. Some days the plane fills up before your name. That is a bump.</span>'
    +'<span>Spare days are extra tries. '+(shot>1?"You get about "+shot+" tries going out.":"Right now you only get one try going out.")+'</span>'
    +'<span>Never sign up twice at the same desk. The new one replaces the old and you lose your place in line.</span>'
    +'<span>Bumped on a stopover? You keep your first sign-up date. Show your face at the desk within 24 hours of each roll call.</span>'
    +'</div></div>';
}
// ── images ───────────────────────────────────────────────────────────────
function shrink(file,cb){
  const fr=new FileReader();
  fr.onload=()=>{ const im=new Image();
    im.onload=()=>{ const m=1100, sc=Math.min(1,m/Math.max(im.width,im.height));
      const c=document.createElement("canvas"); c.width=Math.round(im.width*sc)||1; c.height=Math.round(im.height*sc)||1;
      c.getContext("2d").drawImage(im,0,0,c.width,c.height);
      cb(c.toDataURL("image/jpeg",0.72)); };
    im.onerror=()=>toast("That file isn't a picture");
    im.src=fr.result; };
  fr.readAsDataURL(file);
}
function pick(cb){
  const i=document.createElement("input"); i.type="file"; i.accept="image/*";
  i.onchange=()=>{ const f=i.files&&i.files[0]; if(f) shrink(f,cb); };
  i.click();
}
function viewer(src){
  let v=$("chkView");
  if(!v){ v=document.createElement("div"); v.id="chkView";
    v.innerHTML='<button class="vx" aria-label="Close">✕</button><img alt="Your screenshot">';
    document.body.appendChild(v); v.onclick=()=>v.classList.remove("show"); }
  v.querySelector("img").src=src; v.classList.add("show");
}
function put(r,k,img){
  const c={image:img,uploaded_at:new Date().toISOString(),note:""};
  if(k==="backup") r.backup.proof=c; else bitem(r,k).proof=c;
}

// ── pieces ───────────────────────────────────────────────────────────────
function itin(label,startKey,legs,endIsHome){
  const rows=[`<div class="ck-stop"><span class="pin">${endIsHome?"🏝️":"⭐"}</span><b>${nm(startKey)}</b></div>`];
  (legs||[]).forEach((l,i)=>{
    const to=l.t||l.to, last=i===legs.length-1;
    rows.push(`<div class="ck-hop"><span class="rail"></span><span class="hm">${l.comm
      ? `✈️ paid seat · ${l.cost||""}`
      : `<span class="sdot" style="background:${band(l.p)}"></span>${l.p!=null?l.p+"% chance of boarding · ":""}Free`}</span></div>`);
    rows.push(`<div class="ck-stop"><span class="pin">${last?(endIsHome?"⭐":"🏝️"):"✈️"}</span><b>${nm(to)}</b></div>`);
  });
  return `<div class="ck-itin"><span class="lb">${label}</span>${rows.join("")}</div>`;
}
function signupLink(k){
  if(typeof AMC_TOOL!=="undefined"&&AMC_TOOL.has&&AMC_TOOL.has(k)&&typeof AMC_SELF_SIGNUP!=="undefined") return AMC_SELF_SIGNUP;
  if(typeof TERM_PAGE!=="undefined"&&TERM_PAGE[k]) return TERM_PAGE[k];
  return term(k).fb||(typeof AMC_SELF_SIGNUP!=="undefined"?AMC_SELF_SIGNUP:"https://www.amc.af.mil/");
}
function boardLinks(k){
  const sch=(typeof SCHEDULES!=="undefined"&&SCHEDULES[k])||[];
  const out=sch.map(s=>`<a class="ck-b" href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a>`);
  if(!out.length){ const p=(typeof TERM_PAGE!=="undefined"&&TERM_PAGE[k])||term(k).fb;
    if(p) out.push(`<a class="ck-b" href="${p}" target="_blank" rel="noopener noreferrer">Their flight page ↗</a>`); }
  return out.join("")||`<span class="ck-note">No verified link for this base — call the desk: ${term(k).phone||"see the official page"}</span>`;
}
const JUR={yokota:"japan",kadena:"japan",misawa:"japan",iwakuni:"japan",atsugi:"japan",
  osan:"korea",kunsan:"korea",rota:"schengen",ramstein:"schengen",spangdahlem:"schengen",aviano:"schengen",
  sig:"schengen",naples:"schengen",souda:"schengen",lajes:"schengen",mildenhall:"uk",incirlik:"turkey",
  bahrain:"bahrain",utapao:"thailand",gitmo:"gtmo",diego:"biot"};
function jurOf(k){
  if(JUR[k]) return JUR[k];
  const cmd=(typeof CMD!=="undefined"&&CMD[k])||term(k).cmd;
  if(cmd==="CONUS") return "usa";
  if(["hickam","jber","eielson","andersen","northisland","fortworth","keywest","kelly","pittsburgh","whidbey"].indexOf(k)>=0) return "usa";
  return null;
}
function visaBlock(t,expanded){
  const j=jurOf(t.hub), v=(typeof VISA!=="undefined"&&j&&VISA[j])||null;
  if(!v) return `<div class="ck-vs warn"><button class="ck-vt" data-visa="1"><span class="ic">🛂</span>
    <span class="vtx"><b>Check entry rules for ${nm(t.hub)}</b><small>No verified passport rules for this stop yet</small></span>
    <span class="ar">${expanded?"▲":"▼"}</span></button>
    ${expanded?`<div class="ck-vb">Check the country's official page before you fly — we'd rather say “we don't know” than guess.</div>`:""}</div>`;
  const tone=v.gate.tone, ic=tone==="ok"?"✅":tone==="warn"?"⚠️":"⛔";
  const onward=v.us.onward||v.th.onward;
  const head=tone==="ok"?"Both passports can enter":tone==="warn"?"Read this before you fly":"A visa is needed";
  return `<div class="ck-vs ${tone==="ok"?"ok":tone==="bad"?"bad":"warn"}">
    <button class="ck-vt" data-visa="1"><span class="ic">${ic}</span>
      <span class="vtx"><b>${head}</b><small>${v.label}${onward?" · ticket out may be asked":""}</small></span>
      <span class="ar">${expanded?"▲":"▼"}</span></button>
    ${expanded?`<div class="ck-vb">${v.gate.text}
      ${onward?"<br><br>⚠ They can ask for a ticket out. Space-A gives you none — hold a cheap refundable one.":""}
      <div class="ck-note" style="margin-top:7px">Both passports need 6+ months left. Checked ${v.verified}.</div></div>`:""}</div>`;
}
function shotList(r){
  const out=[];
  Object.keys(r.bases).forEach(k=>{ const it=r.bases[k];
    if(it.proof) out.push({src:it.proof.image,t:"Sign-up: "+nm(k)}); });
  Object.keys(r.legs).forEach(k=>{ const it=r.legs[k];
    if(it.rollcall) out.push({src:it.rollcall.image,t:"Roll call: "+k.split(":")[1].replace(">"," → ")}); });
  if(r.backup&&r.backup.proof) out.push({src:r.backup.proof.image,t:"Backup ticket"});
  return out;
}

// ── step cards ───────────────────────────────────────────────────────────
function cardFor(n,t,r,T){
  const head=(ic,name,sub)=>`<div class="ck-h"><span class="hi">${ic}</span><b>${name}</b></div>
    ${sub?`<div class="ck-sub">${sub}</div>`:""}`;
  const bs=T.bases, fl=T.fl;
  const staleKeys=stale(r,bs);
  const staleWarn=staleKeys.length?`<div class="ck-warn">🔄<div><b>Your ways changed</b><br>
    ${staleKeys.map(nm).join(", ")} isn't part of any kept way now. Its sign-up still counts for 60 days —
    but nothing here needs it.
    <br><button class="ck-b small" data-clear-stale="1" style="margin-top:6px">Clear those</button></div></div>`:"";

  if(n===1){
    const navy45=bs.some(b=>["northisland","fortworth"].indexOf(b.key)>=0);
    const notices=winNotices(r,navy45);
    const ways=(r.outs||[]).map((w,i)=>`<div class="ck-way${i===0?" pri":""}">
        <span class="wl"><b>Way ${w.letter||i+1}${i===0?" · on the map":""}</b>
          <small>${pathTxt(w.start||r.start,w.legs)}</small></span>
        <span class="wp" style="color:${band(w.pct)}">${w.pct!=null?w.pct+"%":"paid"}<small>${w.pct!=null?"chance of boarding":""}</small></span>
        ${i===0?"":`<button class="wx" data-dropway="out:${w.sig}" title="Remove this way">✕</button>`}</div>`).join("");
    const homes=(r.homes||[]).map((w,i)=>`<div class="ck-way${i===0?" pri":""}">
        <span class="wl"><b>Way home ${w.letter||i+1}</b>
          <small>${pathTxt(r.hub,w.legs)}</small></span>
        <span class="wp" style="color:${band(w.pct)}">${w.pct!=null?w.pct+"%":"paid"}<small>${w.pct!=null?"chance of boarding":""}</small></span>
        ${i===0?"":`<button class="wx" data-dropway="home:${w.sig}" title="Remove this way">✕</button>`}</div>`).join("");
    const DAYms=864e5, t0=(()=>{const d=new Date();d.setHours(12,0,0,0);return d;})();
    const dayDiff=(a,b)=>Math.round((new Date(a+"T12:00:00")-b)/DAYms);
    const wFrom=(r.win&&r.win.from)||"", wTo=(r.win&&r.win.to)||"";
    const depPick=wFrom?dayDiff(wFrom,t0):null;
    const retPick=(wFrom&&wTo)?dayDiff(wTo,new Date(wFrom+"T12:00:00")):null;
    // one question at a time: answer it, it collapses to a line, the next one appears.
    const step=!wFrom?1:!wTo?2:3;
    const chips=(kind,list,sel)=>`<div class="ck-qp">${list.map(q=>
      `<button data-${kind}="${q[1]}"${sel===q[1]?' class="on"':""}>${q[0]}</button>`).join("")}</div>`;
    const answered=(lbl,val,which,n,sub)=>`<div class="ck-row"><span class="ck-num">${n}</span>
      <span class="ck-rt"><span class="rl">${lbl}</span><b>${fmtDW(val)}</b>
      ${sub?`<small>${sub}</small>`:""}</span>
      <button data-editdate="${which}">Change</button></div>`;
    const g=bumpPlan(Object.assign({navy45:navy45},r));
    const outSub=g?`Plan to try from ${fmtDW(g.outA)} to ${fmtDW(g.outB)}. That is ${g.outBuf} spare day${g.outBuf===1?"":"s"} — about ${g.shots.length} tr${g.shots.length===1?"y":"ies"} at a free seat.`:"";
    const homeSub=(g&&g.hasBack)?`Start trying to get home on ${fmtDW(g.homeA)}. That keeps ${g.homeBuf} spare day${g.homeBuf===1?"":"s"} in case you get bumped.`:"";
    const plan=notices.filter(x=>x.kind==="plan")[0];
    const extras=notices.filter(x=>x.kind==="note");
    const answer=plan?`<div class="ck-file ${plan.tone}">
      <div class="ck-fh"><span class="ck-fd"></span>${plan.open?(plan.depIn<=7?"File it today":"Sign up today"):"Sign up on"}</div>
      <div class="ck-fw"><b>${fmtDW(plan.best)}</b></div>
      <div class="ck-fy">${plan.line}</div>
      ${(r.win&&r.win.file===plan.best)
        ? `<button class="ck-lk" data-lock="">\u2713 Locked in \u2014 change</button>`
        : `<button class="ck-lkb" data-lock="${plan.best}">Lock it in</button>`}
      </div>`:"";
    return `<div class="ck-card on"><div class="ck-h"><span class="hi">\u{1F5D3}\u{FE0F}</span><b>When are you going?</b></div>
      ${step>1?answered("Fly out on",wFrom,"from",1,outSub):""}
      ${step>2?answered("Be home by",wTo,"to",2,homeSub):""}
      ${step===1?`<div class="ck-q"><b>What day do you want to fly out?</b>
        <input type="date" id="ckFrom" value="">
        ${chips("dep",[["2 wk",14],["1 mo",30],["2 mo",60],["3 mo",90]],depPick)}
        <small>Roughly is fine \u2014 you can change it any time.</small>
        <div class="ck-facts one"><b>Read this first</b>
          <span>A free military seat is not a ticket. You wait in line for empty seats.</span>
          <span>Pick the <b>first</b> day you could leave. We add spare days after it, so one full plane does not end your trip.</span>
        </div></div>`:""}
      ${step===2?`<div class="ck-q"><b>When do you need to be home?</b>
        <input type="date" id="ckTo" value="" min="${wFrom}">
        ${chips("ret",[["+1 wk",7],["+2 wk",14],["+3 wk",21],["+6 wk",42]],retPick)}
        <small>How long you\u2019ll be away.</small>
        <div class="ck-facts one"><b>Why we ask</b>
          <span>Getting home is the harder half. Small overseas desks fly less often.</span>
          <span>We will give you the day to <b>start trying</b> — several days before this one — and the day to stop waiting and buy.</span>
        </div></div>`:""}
      ${step===3?answer:""}
      ${step===3?bumpHtml(g):""}
      ${extras.map(n=>`<div class="ck-note">${n.ic}<div>${n.txt}</div></div>`).join("")}
      ${notices.filter(x=>x.kind==="ask"&&x.tone==="bad").map(n=>
        `<div class="ck-ask bad">${n.ic}<span>${n.txt}</span></div>`).join("")}
    </div>
    <div class="ck-card">${head("🗺️","Ways you're keeping",
      `Keep 3–4 good ways and sign up for all of them — there's no penalty, just more chances.
       ${bs.length} base${bs.length===1?"":"s"} to sign up at.`)}
      <span class="lb">Ways there</span>${ways||`<div class="ck-note">No way there yet.</div>`}
      <span class="lb" style="margin-top:4px">Ways home</span>${homes||`<div class="ck-note">No way home picked yet — do that on the map.</div>`}
      <div class="ck-btns">
        <button class="ck-b" data-change="1">🗺️ Pick more ways on the map</button>
        <button class="ck-b small" data-forget="1">Delete this trip</button>
      </div>
    </div>`;
  }

  if(n===2){
    const vOpen=typeof window.chkVaultReady==="function"&&window.chkVaultReady();
    const nOut=bs.filter(x=>x.hasOut).length, nHome=bs.filter(x=>x.hasHome&&!x.hasOut).length;
    const split=`${nOut} to your destination${nHome?` · ${nHome} for the return`:""}`;
    return `<div class="ck-card">${head("✍️","Sign up at each base",
      "One sign-up per base covers every plan that leaves from it — the way to your destination <b>and</b> the way home. Up to 5 destinations each, good for about 60 days.")}
      ${vOpen||!CHK.askPass?`<button class="ck-go" id="ckFillAll">${vOpen
        ? `⚡ Fill in all ${bs.length} sign-up${bs.length===1?"":"s"} — destination &amp; return`
        : `🔐 Unlock your vault to fill in ${bs.length} sign-up${bs.length===1?"":"s"}`}</button>`
        :`<div class="ck-pass${CHK.passBad?" bad":""}">
          <input type="password" id="ckPass" placeholder="Vault passphrase" autocomplete="current-password">
          <button class="ck-go" id="ckPassGo" style="min-height:44px;flex:0 0 auto;padding:10px 16px">Unlock &amp; fill →</button>
        </div>${CHK.passBad?`<div class="ck-why" style="color:#FF6B6B">Wrong passphrase — try again. There's no recovery; it's the one you sealed the vault with.</div>`:""}`}
      <div class="ck-note">${vOpen
        ? split+". One packet with every base, then the sign-up page opens — the ⚡ extension fills each form for you."
        : "Your passphrase unlocks the sealed vault in memory only — nothing is stored unencrypted, and Enter starts the run right here."}</div>
      <button class="ck-b" id="ckSignAll">✓ Mark all ${bs.length} as signed up (destination &amp; return)</button>
    </div>
    ${staleWarn}
    ${bs.map((b,i)=>{ const it=bitem(r,b.key), led=ledgerFor(b.key), on=signedAt(r,b.key), t2=term(b.key);
      return `<div class="ck-brow${on?" on":""}">
        <button class="ck-tk" data-signed="${b.key}" title="${on?"Signed up — tap to undo":"Mark as signed up"}">${on?"✓":i+1}</button>
        <span class="bmain"><b>${nm(b.key)}${b.hasHome&&!b.hasOut?` <span class="ck-tag home">home</span>`:""}${
            led?` <span class="ck-clock${led.days<14?" warn":""}">${led.days}d</span>`:""}</b>
          <small>ask for ${b.dests.join(", ")} · ${b.ways.join(" · ")}</small></span>
        <span class="bacts">
          <button data-fill="${b.key}" title="Fill it in for me">⚡</button>
          <a href="${signupLink(b.key)}" target="_blank" rel="noopener noreferrer" title="Open the sign-up page">↗</a>
          ${t2.email?`<button data-copy="${t2.email}" title="Copy their email">📋</button>`:""}
        </span>
      </div>`; }).join("")}`;
  }

  if(n===3){
    const anySigned=bs.some(b=>signedAt(r,b.key));
    return `<div class="ck-card">${head("📸","Prove it",
      "Add a picture of the confirmation email for each base. Green means really done.")}
      ${anySigned?"":`<div class="ck-warn">✍️<div><b>Nothing to prove yet</b><br>
        You haven't signed up at any base for this trip. Go back a step and run
        <b>⚡ Fill in all sign-ups</b> — the confirmations show up here afterwards.
        <br><button class="ck-b small" data-seg="2" style="margin-top:6px">← Back to sign-ups</button></div></div>`}</div>
    ${bs.map(b=>{ const it=bitem(r,b.key), p=it.proof;
      return `<div class="ck-base${p?" on":it.manual?" grey":""}">
        <div class="bt"><span class="tick">${p||it.manual?"✓":"?"}</span><b>${nm(b.key)}</b></div>
        <div class="ck-slot${p?" full":""}">
          ${p?`<img class="ck-thumb" src="${p.image}" alt="Confirmation screenshot" data-see="${b.key}">`:""}
          <span class="st">${p?`Saved ${new Date(p.uploaded_at).toLocaleDateString()} — tap it to see it big.`
            :it.manual?"Marked done at the counter — no picture, so this check stays grey.":"Add a screenshot of your confirmation email."}</span>
          <button class="ck-b small" data-shot="${b.key}">${p?"Replace":"📸 Add"}</button>
        </div>
        ${p?"":`<button class="ck-b${it.manual?" yes on":""}" data-manual="${b.key}">${it.manual?"✓ Signed up at the counter":"I signed up at the counter instead"}</button>`}
      </div>`; }).join("")}
    <div class="ck-note">You can paste too: copy a screenshot, then press ⌘/Ctrl + V here.</div>`;
  }

  if(n===4){
    const p=r.backup.proof;
    return `<div class="ck-card">${head("🎟️","Backup ticket",
      "Free seats can vanish. A refundable ticket home is your safety net — this step won't turn green without it.")}
      <button class="ck-row${r.backup.have?" on":""}" data-backup="1">
        <span class="bx">${r.backup.have?"✓":""}</span>
        <span class="rt">I have a refundable backup ticket<small>Refundable means you get your money back if you catch a free seat.</small></span>
      </button>
      <div class="ck-spare"><span>Spare days built in:</span>
        <button data-spare="-1">−</button><b>${r.backup.spare} day${r.backup.spare===1?"":"s"}</b><button data-spare="1">+</button></div>
      <div class="ck-note">Keep 3–7 spare days at the end of the trip. Free seats don't run on your calendar.</div>
      <div class="ck-slot${p?" full":""}">
        ${p?`<img class="ck-thumb" src="${p.image}" alt="Backup ticket screenshot" data-see="backup">`:""}
        <span class="st">${p?"Backup ticket saved — tap it to see it big.":"Add a picture of the backup ticket (optional, but nice to have)."}</span>
        <button class="ck-b small" data-shot="backup">${p?"Replace":"📸 Add"}</button>
      </div>
    </div>`;
  }

  if(n===5){
    const outs=[];
    fl.forEach(l=>{ if(outs.indexOf(l.f)<0) outs.push(l.f); });
    return `<div class="ck-card">${head("👀","Watch the board",
      "Each base posts its flights about 3 days ahead. Check the flights on your main way are really there — the % is your chance of boarding, not a seat.")}
      <div class="ck-warn">🎲<div><b>Seats are a chance, not a promise.</b><br>Even a listed flight can fill up or cancel.</div></div>
    </div>
    ${outs.map(k=>`<div class="ck-base">
      <div class="bt"><span class="tick">${fl.filter(l=>l.f===k).every(l=>litem(r,l.key).listed)?"✓":"👀"}</span><b>${nm(k)}</b></div>
      <div class="ck-btns">${boardLinks(k)}</div>
      ${fl.filter(l=>l.f===k).map(l=>{ const it=litem(r,l.key);
        return `<button class="ck-b yes wide${it.listed?" on":""}" data-listed="${l.key}">${it.listed?"✓":"☐"} My flight to ${nm(l.to)} is on the board</button>`; }).join("")}
    </div>`).join("")}`;
  }

  const j=jurOf(t.hub), v=(typeof VISA!=="undefined"&&j&&VISA[j])||null;
  const ppWarn=v?((v.us.onward||v.th.onward)?"They can ask for a ticket out — bring the backup ticket.":v.gate.text):"Check the country's passport rules.";
  return `<div class="ck-card">${head("🎒","Pack & fly day","Four things, then you're out the door.")}
    ${PACK.map(p=>`<button class="ck-row${r.pack[p.k]?" on":""}" data-pack="${p.k}">
      <span class="bx">${r.pack[p.k]?"✓":""}</span>
      <span class="rt">${p.t}<small>${p.k==="passports"?ppWarn:p.s}</small></span></button>`).join("")}
  </div>
  <div class="ck-card">${head("📣","After each flight","Take a picture of your roll-call result — it's your proof you were there.")}
    ${fl.map(l=>{ const it=litem(r,l.key), p=it.rollcall;
      return `<div class="ck-slot${p?" full":""}">
        ${p?`<img class="ck-thumb" src="${p.image}" alt="Roll call screenshot" data-see="roll:${l.key}">`:""}
        <span class="st">${nm(l.f)} → ${nm(l.to)}${p?" — saved":""}</span>
        <button class="ck-b small" data-roll="${l.key}">${p?"Replace":"📸 Add"}</button>
      </div>`; }).join("")}
  </div>`;
}

function allHtml(t,r,T){
  const line=(state,txt)=>`<div class="ck-step ${state}"><span class="ci">${state?"✓":""}</span><span>${txt}</span></div>`;
  return `<div class="ck-card"><div class="ck-h"><span class="hi">📋</span><b>The whole checklist</b></div>
    ${STEPS.map(s=>{
      const done=T.stepDone(s.n);
      let subs="";
      if(s.n===1) subs=line(r.win&&r.win.from?"done":"",`Travel dates${r.win&&r.win.from?": "+fmtD(r.win.from)+" → "+(fmtD(r.win.to)||"open"):""}`)
        +line("done",`${(r.outs||[]).length} way${(r.outs||[]).length===1?"":"s"} there · ${(r.homes||[]).length} home`);
      if(s.n===2) subs=T.bases.map(b=>line(signedAt(r,b.key)?"done":"",`Signed up · ${nm(b.key)}`)).join("");
      if(s.n===3) subs=T.bases.map(b=>{const it=bitem(r,b.key);return line(it.proof?"done":it.manual?"grey":"",`Proof · ${nm(b.key)}${it.manual&&!it.proof?" (counter, no picture)":""}`);}).join("");
      if(s.n===4) subs=line(r.backup.have?"done":"","Refundable backup ticket")+line(r.backup.proof?"done":"","Picture of the backup ticket");
      if(s.n===5) subs=T.fl.map(l=>line(litem(r,l.key).listed?"done":"",`On the board · ${nm(l.f)} → ${nm(l.to)}`)).join("");
      if(s.n===6) subs=PACK.map(p=>line(r.pack[p.k]?"done":"",p.t)).join("");
      return `<button class="ck-row${done?" on":""}" data-jump="${s.n}" style="margin-top:6px">
          <span class="bx">${done?"✓":s.n}</span><span class="rt">${s.ic} ${s.name}</span></button>
        <div style="padding-left:10px">${subs}</div>`;
    }).join("")}
  </div>`;
}

// ── my trips (grouped by destination) ────────────────────────────────────
function homeHtml(curRec){
  const list=allRecs();
  const groups={}, order=[];
  list.forEach(r2=>{ const g=nm(r2.hub); if(!groups[g]){ groups[g]=[]; order.push(g); } groups[g].push(r2); });
  const cards=order.map(g=>`<div class="ck-hh">🏝️ ${g}</div>
    ${groups[g].map(r2=>{ const T2=tally(r2.plan,r2), on=curRec&&r2.id===curRec.id;
      const nx=STEPS[Math.min(T2.firstOpen,6)-1];
      return `<div class="ck-tcard${on?" on":""}">
        <div class="th"><b>${nm(r2.plan.start)} → ${g}</b>
          <span class="when">${r2.win&&r2.win.from?fmtD(r2.win.from)+" → "+(fmtD(r2.win.to)||"open"):"no dates yet"}</span></div>
        <div class="ck-mini"><i style="width:${T2.pct}%"></i></div>
        <div class="meta">${T2.pct}% ready · ${(r2.outs||[]).length} way${(r2.outs||[]).length===1?"":"s"} ·
          ${T2.bases.length} base${T2.bases.length===1?"":"s"} · next: ${nx.name}</div>
        <div class="ck-btns">
          <button class="ck-b${on?" zap":""}" data-trip="${r2.id}">${on?"Continue this trip":"Open"}</button>
          <button class="ck-b small" data-deltrip="${r2.id}">Delete</button></div>
      </div>`; }).join("")}`).join("");
  return `<div class="ck-body">
    ${cards||`<div class="ck-card"><div class="ck-sub">No trips yet — pick a plan on the map and I'll walk you through the rest.</div></div>`}
    <button class="ck-b zap" id="ckNewTrip" style="min-height:52px">＋ Plan another trip</button>
    <div class="ck-note">Signing up for several trips at once is fine — each sign-up is its own 60-day clock, and being on more lists only helps.</div>
  </div>`;
}

// ── render ───────────────────────────────────────────────────────────────
function render(){
  const el=$("chkDock"); if(!el) return;
  const t=trip();
  if(!t){
    // No trip is current — but saved ones must stay reachable. The trips list lives only in this
    // panel, so an early return here orphaned every record.
    const saved=allRecs();
    el.innerHTML=`<div class="ck-head"><div class="ck-top"><button class="ck-trips" id="ckTrips"><span class="tn">🧭 My trips</span></button>
      <button class="ck-x" id="ckClose">✕</button></div></div>`
      +(saved.length?homeHtml(null)
        :`<div class="ck-body"><div class="ck-card"><div class="ck-sub">Pick a plan on the map first — then I'll walk you through the rest, one step at a time.</div>
          <button class="ck-b zap" data-change="1">🗺️ Open the map</button></div></div>`);
    wire(el,null,null,null); return; }
  const r=load(t), T=tally(t,r);
  const view=Math.min(r.view||1,6);
  const canSee=n=>n<=T.firstOpen;
  const gate=(()=>{
    if(view===1) return {ok:T.stepDone(1),label:"Next: sign up at each base →",why:"Add your travel dates first — they decide when to sign up."};
    if(view===2) return {ok:T.stepDone(2),label:"Next: prove it →",why:"Sign up at every base above, then tap “I signed up”."};
    if(view===3) return {ok:T.stepDone(3),label:"Next: backup ticket →",why:"Every base needs a screenshot, or a “signed up at the counter” tap."};
    if(view===4) return {ok:T.stepDone(4),label:"Next: watch the board →",why:"Tick the refundable backup ticket — this one can't be skipped."};
    if(view===5) return {ok:T.stepDone(5),label:"Next: pack & fly day →",why:"Check each flight on the base's board, then tick it."};
    return {ok:T.stepDone(6),label:T.pct===100?"🎉 You're ready to fly":"Finish packing",why:"Four things left in the list above."};
  })();
  const gl=r.glance!==false;
  const headHtml=`
  <div class="ck-head">
    <div class="ck-top">
      <button class="ck-trips" id="ckTrips" title="All my trips">
        <span class="tn">${CHK.home?"🧭 My trips":`${nm(t.start)} <span class="ar2">→</span> ${nm(t.hub)}`}</span>
        <span class="ar">${CHK.home?"✕":"▾"}</span></button>
      <button class="ck-x" id="ckClose" title="Close">✕</button></div>
    ${CHK.home?"":`
    <div class="ck-of">Step ${view} of 6 <span class="dot">·</span> <b>${T.pct}% ready</b>${
      r.win&&r.win.from?` <span class="dot">·</span> ${fmtD(r.win.from)} → ${fmtD(r.win.to)||"open"}`:""}</div>
    <div class="ck-fill"><i style="width:${T.pct}%"></i></div>
    <div class="ck-segs">${STEPS.map(s=>{
      const done=T.stepDone(s.n), now=s.n===view;
      return `<button class="ck-seg ${done?"done":""} ${now?"now":""} ${canSee(s.n)?"":"lock"}" data-seg="${s.n}" title="${s.name}">
        <span class="si">${done&&!now?"✓":s.ic}</span><span class="sl">${s.short}</span></button>`;}).join("")}</div>`}
  </div>`;
  if(CHK.home){ el.innerHTML=headHtml+homeHtml(r); wire(el,t,r,T); renderBar(); return; }
  el.innerHTML=headHtml+`
  <div class="ck-body">
    ${view===1?"":`<div class="ck-glance">
      <button class="ck-gt" id="ckGl">🧾 Your trip at a glance <span class="ar">${gl?"▲":"▼"}</span></button>
      ${gl?`<div class="ck-gb">
        ${itin("Going",t.start,t.out,false)}
        ${(t.home&&t.home.length)?itin("Home",t.hub,t.home,true):""}
        ${((r.outs||[]).length>1||(r.homes||[]).length>1)?`<div class="ck-note">＋ ${((r.outs||[]).length-1)+((r.homes||[]).length-1)} more kept way(s) — all covered by your sign-ups.</div>`:""}
        ${visaBlock(t,!!r.visaOpen)}
        ${(()=>{const sh=shotList(r);return sh.length?`<div class="ck-line"><span class="lb">Shots</span>
          <div class="ck-shots">${sh.map(s=>`<img class="ck-thumb" src="${s.src}" alt="${s.t}" title="${s.t}">`).join("")}</div></div>`:"";})()}
      </div>`:""}
    </div>`}
    ${view>1?`<button class="ck-back" data-seg="${view-1}">← back to ${STEPS[view-2].name}</button>`:""}
    ${cardFor(view,t,r,T)}
    ${view===1?visaBlock(t,!!r.visaOpen):""}
    ${r.showAll?allHtml(t,r,T):""}
  </div>
  <div class="ck-foot">
    <button class="ck-go" id="ckGo" ${gate.ok?"":"disabled"}>${gate.label}</button>
    ${gate.ok?"":`<div class="ck-why">${gate.why}</div>`}
    <div class="ck-flinks">
      <button class="ck-all" id="ckAll">${r.showAll?"Hide the whole checklist":"See the whole checklist"}</button>
      <a class="ck-all" href="SpaceA-Paperwork.html">📁 My paperwork</a>
    </div>
  </div>`;
  wire(el,t,r,T);
  renderBar();
}

function wire(el,t,r,T){
  const re=()=>{ if(r) save(r); render(); };
  const cl=$("ckClose"); if(cl) cl.onclick=()=>close();
  el.querySelectorAll("[data-change]").forEach(b=>b.onclick=()=>{
    const hub=t?t.hub:(r?r.hub:null);
    if(typeof window.openJourney!=="function"){ toast("Pick a destination on the map"); return; }
    close();                       // the map lives behind this panel — get out of its way
    setTimeout(()=>{ window.openJourney(hub);
      toast(hub?"Tick more ways here — then Start my checklist":"Pick a destination"); },60); });
  const tr=$("ckTrips"); if(tr) tr.onclick=()=>{ CHK.home=!CHK.home; render(); };
  const nt=$("ckNewTrip"); if(nt) nt.onclick=()=>{ CHK.home=false;
    toast("Tap any base on the map to plan your next trip");
    if(typeof window.openJourney==="function"&&t) window.openJourney(t.hub); };
  el.querySelectorAll("[data-trip]").forEach(b=>b.onclick=()=>{
    setCur(b.dataset.trip); window.SPACEA_TRIP=null; CHK.home=false; render(); });
  el.querySelectorAll("[data-deltrip]").forEach(b=>b.onclick=e=>{ e.stopPropagation();
    const id=b.dataset.deltrip;
    if(!confirm("Delete this trip and its checklist? Saved screenshots for it go too.")) return;
    try{ localStorage.removeItem(PFX+id); }catch(e2){}
    if(curId()===id) clearCur();   // deleting a trip must not silently promote a different one
    window.SPACEA_TRIP=null; toast("Trip deleted");
    if(trip()) render(); else { close(); renderBar(); } });
  if(!t||!r) return;
  el.querySelectorAll("[data-seg]").forEach(b=>b.onclick=()=>{
    const n=+b.dataset.seg;
    if(n>T.firstOpen){ toast("Finish step "+T.firstOpen+" first — we go in order"); return; }
    r.view=n; re(); });
  el.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>{
    const n=+b.dataset.jump;
    if(n>T.firstOpen){ toast("Finish step "+T.firstOpen+" first — we go in order"); return; }
    r.view=n; r.showAll=false; re(); });
  const gl=$("ckGl"); if(gl) gl.onclick=()=>{ r.glance=r.glance===false; re(); };
  const all=$("ckAll"); if(all) all.onclick=()=>{ r.showAll=!r.showAll; re(); };
  const go=$("ckGo"); if(go) go.onclick=()=>{ if(r.view<6){ r.view=r.view+1; re(); } else toast("🎉 Everything's done — safe travels"); };
  el.querySelectorAll("[data-visa]").forEach(b=>b.onclick=()=>{ r.visaOpen=!r.visaOpen; re(); });
  const isoAdd=(base,days)=>{const d=new Date(base);d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);};
  const f1=$("ckFrom"); if(f1) f1.onchange=()=>{ r.win.from=f1.value; r.win.file=""; re(); };
  const f2=$("ckTo"); if(f2) f2.onchange=()=>{ r.win.to=f2.value; r.win.file=""; re(); };
  // quick picks write the same fields the inputs do, so every downstream figure follows
  el.querySelectorAll("[data-dep]").forEach(b=>b.onclick=()=>{
    r.win.from=isoAdd(new Date(),+b.dataset.dep); r.win.file="";
    if(r.win.to&&r.win.to<r.win.from) r.win.to="";
    re(); });
  el.querySelectorAll("[data-ret]").forEach(b=>b.onclick=()=>{
    if(!r.win.from) return;
    r.win.to=isoAdd(new Date(r.win.from+"T12:00:00"),+b.dataset.ret); r.win.file=""; re(); });
  el.querySelectorAll("[data-editdate]").forEach(b=>b.onclick=()=>{
    const which=b.dataset.editdate;
    if(which==="from"){ r.win.from=""; r.win.to=""; } else r.win.to="";
    r.win.file=""; re(); });
  el.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{
    const d=b.dataset.lock;
    r.win.file=d; re();
    toast(d?"\u{1F4CC} Filing "+fmtD(d)+" \u2014 that holds your place in the queue":"Sign-up date unlocked"); });
  el.querySelectorAll("[data-dropway]").forEach(b=>b.onclick=()=>{
    const [kind,sig]=b.dataset.dropway.split(/:(.+)/);
    if(kind==="out") r.outs=(r.outs||[]).filter(w=>w.sig!==sig);
    else r.homes=(r.homes||[]).filter(w=>w.sig!==sig);
    toast("Way removed"); re(); });
  el.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>copyText(b.dataset.copy,"Email address copied"));
  const fa=$("ckFillAll"); if(fa) fa.onclick=()=>{
    const vOpen2=typeof window.chkVaultReady==="function"&&window.chkVaultReady();
    if(vOpen2){ runFillAll(t,r,T); return; }
    CHK.askPass=true; CHK.passBad=false; render(); };
  const pg=$("ckPassGo"), pi=$("ckPass");
  const tryUnlock=async()=>{
    const val=(pi&&pi.value)||"";
    if(!val){ if(pi) pi.focus(); return; }
    if(typeof window.chkUnlockVault!=="function"){ toast("Unlock isn't available — use the 🔐 badge"); return; }
    pg.disabled=true; pg.textContent="Unlocking…";
    const res=await window.chkUnlockVault(val);
    if(res==="ok"||res==="new"){
      CHK.askPass=false; CHK.passBad=false;
      toast("🔓 Unlocked — filling in your sign-ups");
      render();
      const t2=trip(); if(t2){ const r2=load(t2); runFillAll(t2,r2,tally(t2,r2)); }
    } else { CHK.passBad=true; render(); const p2=$("ckPass"); if(p2) p2.focus(); }
  };
  if(pg) pg.onclick=tryUnlock;
  if(pi){ pi.onkeydown=e=>{ if(e.key==="Enter"){ e.preventDefault(); tryUnlock(); }
      if(e.key==="Escape"){ CHK.askPass=false; CHK.passBad=false; render(); } };
    setTimeout(()=>pi.focus(),60); }
  const sall=$("ckSignAll"); if(sall) sall.onclick=()=>{
    let added=0;
    T.bases.forEach(b=>{ const it=bitem(r,b.key);
      if(it.signed) return;
      it.signed=true; it.signed_at=new Date().toISOString();
      if(typeof window.chkAddSignup==="function"){
        const res=window.chkAddSignup(b.key,b.dests,r.win); if(res) it.signupId=res.id; }
      added++; });
    toast(added?added+" sign-up"+(added===1?"":"s")+" tracked — clocks started":"All bases were already marked");
    re(); };
  el.querySelectorAll("[data-fill]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.fill, bs=T.bases.filter(x=>x.key===k)[0];
    if(typeof window.chkVaultReady!=="function"||!window.chkVaultReady()){
      toast("Unlock your sealed vault first — that's where your details live");
      if(typeof window.chkOpenVault==="function") window.chkOpenVault();
      return; }
    if(window.chkAutofill(k,bs?bs.dests:[nm(k)])){ bitem(r,k).filled_at=new Date().toISOString(); save(r); }
  });
  el.querySelectorAll("[data-signed]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.signed, it=bitem(r,k), bs=T.bases.filter(x=>x.key===k)[0];
    if(it.signed){
      if(it.signupId&&typeof window.chkDropSignup==="function") window.chkDropSignup(it.signupId);
      it.signed=false; it.signupId=null; toast("Sign-up removed from your tracker");
    } else {
      it.signed=true; it.signed_at=new Date().toISOString();
      if(typeof window.chkAddSignup==="function"){
        const res=window.chkAddSignup(k,bs?bs.dests:[nm(k)],r.win);
        if(res){ it.signupId=res.id; toast(res.days+"-day clock started — it's in your tracker and the bell"); }
      }
    }
    re(); });
  el.querySelectorAll("[data-manual]").forEach(b=>b.onclick=()=>{ const it=bitem(r,b.dataset.manual); it.manual=!it.manual; re(); });
  el.querySelectorAll("[data-listed]").forEach(b=>b.onclick=()=>{ const it=litem(r,b.dataset.listed); it.listed=!it.listed; re(); });
  el.querySelectorAll("[data-pack]").forEach(b=>b.onclick=()=>{ r.pack[b.dataset.pack]=!r.pack[b.dataset.pack]; re(); });
  el.querySelectorAll("[data-backup]").forEach(b=>b.onclick=()=>{ r.backup.have=!r.backup.have; re(); });
  el.querySelectorAll("[data-spare]").forEach(b=>b.onclick=()=>{
    r.backup.spare=Math.min(7,Math.max(3,(r.backup.spare||4)+ +b.dataset.spare)); re(); });
  el.querySelectorAll("[data-clear-stale]").forEach(b=>b.onclick=()=>{
    stale(r,T.bases).forEach(k=>{ delete r.bases[k]; }); toast("Cleared"); re(); });
  el.querySelectorAll("[data-forget]").forEach(b=>b.onclick=()=>{
    if(!confirm("Delete this trip and its checklist? Saved screenshots for it go too.")) return;
    try{ localStorage.removeItem(PFX+r.id); localStorage.removeItem("spacea.trip.current"); }catch(e){}
    window.SPACEA_TRIP=null; toast("Trip deleted");
    const nx=allRecs()[0]; if(nx){ setCur(nx.id); render(); } else { close(); renderBar(); } });
  el.querySelectorAll("[data-shot]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.shot; CHK.slot=k;
    pick(img=>{ put(r,k,img); toast("Screenshot saved"); re(); }); });
  el.querySelectorAll("[data-roll]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.roll; CHK.slot="roll:"+k;
    pick(img=>{ litem(r,k).rollcall={image:img,uploaded_at:new Date().toISOString()}; toast("Roll-call picture saved"); re(); }); });
  el.querySelectorAll("[data-see]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.see;
    const src=k==="backup"?(r.backup.proof||{}).image
      :k.indexOf("roll:")===0?(litem(r,k.slice(5)).rollcall||{}).image
      :(bitem(r,k).proof||{}).image;
    if(src) viewer(src); });
  el.querySelectorAll(".ck-shots img").forEach(im=>im.onclick=()=>viewer(im.src));
  if(!el._paste){ el._paste=true;
    document.addEventListener("paste",ev=>{
      if(!CHK.open) return;
      const its=(ev.clipboardData&&ev.clipboardData.items)||[];
      for(let i=0;i<its.length;i++){ const it=its[i];
        if(it.type&&it.type.indexOf("image")===0){
          const f=it.getAsFile(); if(!f) continue;
          const t2=trip(); if(!t2) return; const r2=load(t2), T2=tally(t2,r2);
          let k=CHK.slot;
          if(!k){ const open2=T2.bases.filter(b=>!bitem(r2,b.key).proof)[0];
            k=open2?open2.key:(r2.backup.proof?null:"backup"); }
          if(!k){ toast("Every slot already has a picture — tap Replace on the one you want"); return; }
          shrink(f,img=>{ if(k.indexOf("roll:")===0) litem(r2,k.slice(5)).rollcall={image:img,uploaded_at:new Date().toISOString()};
            else put(r2,k,img);
            save(r2); CHK.slot=null;
            toast(k==="backup"?"Backup ticket picture saved":"Screenshot saved to "+nm(k));
            render(); });
          ev.preventDefault(); return; } }
    });
  }
}

// ── ⚡ auto-fill run: walks every base, destination and return, and files a confirmation ──
function refFor(k,i){
  const abbr=nm(k).replace(/[^A-Za-z]/g,"").slice(0,3).toUpperCase()||"SPA";
  const yr=String(new Date().getFullYear()).slice(2);
  return "SA-"+yr+"-"+abbr+"-"+String(1000+((Date.now()/1000|0)+i*137)%9000);
}
// DMDC gets cranky about stale cookies (the identity-proofing loop) — a fresh incognito window
// is the reliable way in. Pages can't open incognito; the ⚡ extension's bridge can.
function openIncog(url){
  let done=false;
  const ack=ev=>{ const d=ev.data;
    if(ev.source!==window||!d||d.spaceaBridge!=="ack") return;
    done=true; window.removeEventListener("message",ack);
    if(d.ok) toast("🕶️ Opening DMDC in an incognito window");
    else if(d.mode==="blocked") toast("Flip ON “Allow in Incognito” for the ⚡ extension (page just opened), then click again");
    else fallback();
  };
  const fallback=()=>{ window.open(url,"_blank","noopener");
    try{ navigator.clipboard.writeText(url); }catch(e){}
    toast("For a clean login use incognito: Ctrl+Shift+N (⌘⇧N on Mac) — the link is on your clipboard"); };
  window.addEventListener("message",ack);
  window.postMessage({spaceaBridge:"open-incognito",url},"*");
  setTimeout(()=>{ if(!done){ window.removeEventListener("message",ack); fallback(); } },600);
}
async function runFillAll(t,r,T){
  const bs=T.bases.slice();
  if(!bs.length){ toast("No bases to sign up at yet"); return; }
  // resume the parked vault key first (stay-unlocked) — kills the passphrase re-prompt on most runs
  if(typeof window.chkResumeVault==="function"){ try{ await window.chkResumeVault(); }catch(e){} }
  if(typeof window.chkVaultReady!=="function"||!window.chkVaultReady()){
    toast("🔐 Vault is locked — type your passphrase, then hit ⚡ again");
    if(typeof window.chkOpenVault==="function") window.chkOpenVault();
    return;
  }
  // THE REAL THING: one packet with every base, copied, and the sign-up page opened
  const sent=(typeof window.chkAutofillAll==="function")
    && window.chkAutofillAll(bs.map(b=>({term:b.key,dests:b.dests,dir:(b.hasHome&&!b.hasOut)?"home":"out"})),r.win);
  if(!sent) return;
  const now=new Date().toISOString();
  bs.forEach(b=>{ bitem(r,b.key).filled_at=now; });
  save(r);

  let ov=$("chkRun");
  if(!ov){ ov=document.createElement("div"); ov.id="chkRun"; document.body.appendChild(ov); }
  const paint=()=>{
    const done=bs.filter(b=>bitem(r,b.key).signed).length;
    ov.innerHTML=`<div class="rn-box">
      <div class="rn-head"><span class="rn-badge">${done===bs.length?"✓":"⚡"}</span>
        <div><b>${done===bs.length?"All "+bs.length+" bases filed":"Your details are on the clipboard"}</b>
        <span>${done} of ${bs.length} filed · destination &amp; return</span></div></div>
      <div class="rn-fill"><i style="width:${Math.round(done/bs.length*100)}%"></i></div>
      <div class="ck-btns">
        <a class="ck-b small" id="rnLogin" href="${(window.chkSignupTargets&&window.chkSignupTargets().login)||"#"}" target="_blank" rel="noopener noreferrer" title="Opens in an incognito window — DMDC behaves better with no stale cookies">🔑 Log in first — DMDC myAccess 🕶️↗</a>
        <button class="ck-b small" id="rnRecopy" title="Copy the same packet again — for the extension popup's paste box">📋 Re-copy packet</button>
      </div>
      <div class="rn-steps">
        <div class="rn-step"><i>1</i><span>On the sign-up page, open the ⚡ extension → <b>Import from website</b> → <b>Auto-fill this form</b>.</span></div>
        <div class="rn-step"><i>2</i><span>Check the highlighted fields, then hit submit — that click is always yours.</span></div>
        <div class="rn-step"><i>3</i><span>Tick the base here — the extension's button walks you base to base.</span></div>
      </div>
      <div class="rn-warn"><b>Tool won't load?</b> ${(typeof AMC_SELF_SIGNUP!=="undefined"?"gatesea.mtmc.gov":"the tool")} is DoD-hosted and often won't resolve outside the US — use <b>Email ↗</b> instead: same packet, same ⚡ autofill, emailed straight to the terminal.</div>
      <div class="rn-list">${bs.map((b,i)=>{ const it=bitem(r,b.key), on=!!it.signed;
        return `<div class="rn-row ${on?"done":"now"}">
          <span class="ri">${on?"✓":i+1}</span>
          <span class="rt"><b>${nm(b.key)}</b><small>${b.hasHome&&!b.hasOut?"return":"destination"} · ask for ${b.dests.join(", ")}</small></span>
          <span class="ra">
            <a class="rn-lk" href="${signupLink(b.key)}" target="_blank" rel="noopener noreferrer" title="AMC self-signup tool (DoD network may be required)">Tool ↗</a>
            <a class="rn-lk" href="${(window.chkSignupTargets?window.chkSignupTargets().emailForm:signupLink(b.key))}" target="_blank" rel="noopener noreferrer" title="AMC's email sign-up form — works from any network">Email ↗</a>
            <button class="ck-b small${on?" yes on":""}" data-filed="${b.key}">${on?"Filed":"Mark filed"}</button>
          </span>
        </div>`;}).join("")}</div>
      <button class="ck-go" id="rnDone">${done===bs.length?"Next: prove it →":"Close"}</button>
      <div class="rn-foot">Nothing is submitted for you — the Submit click on the .gov form is always yours.
        Ticking a base starts its 60-day clock in your tracker.</div>
    </div>`;
    ov.classList.add("show");
    const rc=ov.querySelector("#rnRecopy");
    if(rc) rc.onclick=async()=>{
      const pk=window.__afPacket;
      if(!pk){ toast("Packet not built yet — press the ⚡ fill button above first"); return; }
      try{ await navigator.clipboard.writeText(pk); toast("Packet copied — paste it in the extension popup's paste box"); }
      catch(e){ toast("Copy blocked — select + copy from the popup paste box instead"); }
    };
    const lg=ov.querySelector("#rnLogin");
    if(lg) lg.onclick=ev=>{ ev.preventDefault(); openIncog(lg.href); };
    ov.querySelectorAll("[data-filed]").forEach(btn=>btn.onclick=()=>{
      const k=btn.dataset.filed, it=bitem(r,k), b=bs.filter(x=>x.key===k)[0];
      if(it.signed){
        if(it.signupId&&typeof window.chkDropSignup==="function") window.chkDropSignup(it.signupId);
        it.signed=false; it.signupId=null; it.confirm=null;
      } else {
        it.signed=true; it.signed_at=new Date().toISOString();
        if(typeof window.chkAddSignup==="function"){
          const res=window.chkAddSignup(k,b?b.dests:[nm(k)],r.win);
          if(res){ it.signupId=res.id;
            it.confirm={ref:"SU-"+String(res.id).slice(-4),at:new Date().toISOString(),base:nm(k),
              dests:b?b.dests.slice():[],dir:(b&&b.hasHome&&!b.hasOut)?"home":"out",trip:r.label||r.id};
            toast(res.days+"-day clock started for "+nm(k)); }
        }
      }
      save(r); paint(); renderBar();
    });
    const d=$("rnDone"); if(d) d.onclick=()=>{
      ov.classList.remove("show");
      if(bs.every(b=>bitem(r,b.key).signed)){ r.view=3; save(r); }
      render();
    };
  };
  paint();
}

// ── the step bar ─────────────────────────────────────────────────────────
function quickAction(t,r,T){
  const n=T.firstOpen;
  const openAt=s=>{ r.view=s; CHK.home=false; save(r); open(); };
  if(n===1) return {label:"🗓️ Add my travel dates",short:"🗓️ Add dates",run:()=>openAt(1)};
  if(n===2){
    const b=T.bases.filter(x=>!signedAt(r,x.key))[0];
    if(!b) return null;
    return {label:"⚡ Fill in "+nm(b.key)+" sign-up",short:"⚡ Fill in sign-up",run:()=>{
      if(typeof window.chkVaultReady!=="function"||!window.chkVaultReady()){
        toast("Unlock your sealed vault first — that's where your details live");
        if(typeof window.chkOpenVault==="function") window.chkOpenVault(); openAt(2); return; }
      if(window.chkAutofill(b.key,b.dests)) bitem(r,b.key).filled_at=new Date().toISOString();
      openAt(2); }};
  }
  if(n===3){
    const b=T.bases.filter(x=>{const it=bitem(r,x.key);return !it.proof&&!it.manual;})[0];
    if(!b) return null;
    return {label:"📸 Add "+nm(b.key)+" screenshot",short:"📸 Add screenshot",run:()=>{
      CHK.slot=b.key; pick(img=>{ put(r,b.key,img); toast("Screenshot saved"); openAt(3); }); }};
  }
  if(n===4) return {label:"🎟️ Sort my backup ticket",short:"🎟️ Backup ticket",run:()=>openAt(4)};
  if(n===5){
    const l=T.fl.filter(x=>!litem(r,x.key).listed)[0];
    const k=l?l.f:null;
    const sch=(k&&typeof SCHEDULES!=="undefined"&&SCHEDULES[k])||[];
    const url=sch.length?sch[0].url:(k&&typeof TERM_PAGE!=="undefined"&&TERM_PAGE[k])||null;
    return {label:"👀 Open "+(k?nm(k):"the")+" board",short:"👀 Open the board",run:()=>{
      if(url) window.open(url,"_blank","noopener,noreferrer"); else toast("No verified board link — call the desk");
      openAt(5); }};
  }
  return {label:"🎒 Finish fly-day list",short:"🎒 Fly-day list",run:()=>openAt(6)};
}
addEventListener("resize",()=>{ try{ renderBar(); }catch(e){} });   // breakpoint classes must not go stale
function renderBar(){
  const bar=$("chkBar"); if(!bar) return;
  const t=trip();
  if(!t){
    const rp=CHK.replanning;
    if(rp){   // mid-replan: name the trip being redone, not some other saved one
      bar.classList.remove("narrow","tight","mini");
      bar.innerHTML='<div class="cb-of"><b>Replanning</b><span>'+nm(rp.start)+' \u2192 '+nm(rp.hub)+
        ' \u00b7 pick your ways on the map</span></div>';
      bar.classList.add("show"); document.body.classList.add("chk-bar"); return;
    }
    const saved=allRecs();
    if(saved.length){
      // The bar is the ONLY way into the trips panel, so hiding it here stranded every saved trip.
      bar.classList.remove("narrow","tight","mini");
      bar.innerHTML='<div class="cb-of"><b>No trip selected</b><span>'+saved.length+
        ' saved trip'+(saved.length===1?"":"s")+' \u00b7 pick one to carry on</span></div>'+
        '<div class="cb-act"><button class="cb-b" id="cbTrips">\uD83E\uDDED My trips ('+saved.length+')</button></div>';
      bar.classList.add("show"); document.body.classList.add("chk-bar");
      const bt=$("cbTrips"); if(bt) bt.onclick=()=>{ CHK.home=true; open(); };
      return;
    }
    bar.innerHTML=""; bar.classList.remove("show","narrow","tight","mini");
    document.body.classList.remove("chk-bar"); return;
  }
  if(CHK.replanning&&allRecs().some(x=>x.id===CHK.replanning.start+">"+CHK.replanning.hub)) CHK.replanning=null;
  const r=load(t), T=tally(t,r);
  const view=CHK.open&&!CHK.home?Math.min(r.view||1,6):T.firstOpen;
  const qa=quickAction(t,r,T);
  const w=bar.clientWidth||innerWidth;
  const narrow=w<1120, tight=w<900, mini=w<640;   // tight before the squeeze, not after it
  bar._key=narrow+"|"+tight+"|"+mini;
  bar.classList.toggle("narrow",narrow);
  bar.classList.toggle("tight",tight);
  bar.classList.toggle("mini",mini);
  const saved=allRecs();
  const isSaved=saved.some(x=>x.id===r.id);
  const others=saved.filter(x=>x.id!==r.id).length;   // the live trip may not be saved yet
  const fresh=!isSaved||(CHK.replanning&&CHK.replanning.hub===t.hub);
  bar.innerHTML=`
    <div class="cb-of">${fresh
      ? `<b>Pick your ways</b><span>${nm(t.start)} → ${nm(t.hub)} · tick the ones you'd take${others>0?` · ${others} saved trip${others===1?"":"s"}`:""}</span>`
      : `<b>Step ${view} of 6</b><span><i>${T.pct}% ready</i> · ${nm(t.start)} → ${nm(t.hub)}${others>0?` · +${others} more trip${others===1?"":"s"}`:""}</span>`}</div>
    <div class="cb-prog"><i style="width:${T.pct}%"></i></div>
    <div class="cb-track">${STEPS.map((s,i)=>{
      const done=T.stepDone(s.n), now=s.n===view, lock=s.n>T.firstOpen;
      const prevDone=i===0?true:T.stepDone(STEPS[i-1].n);
      const conn=i?`<span class="cb-bar"${prevDone?` style="background:${GREEN}"`:""}></span>`:"";
      return conn+`<span class="cb-seg ${done?"done":""} ${now?"now":""} ${lock?"lock":""}">
          <button class="cw" data-bseg="${s.n}" ${lock?"disabled":""} title="${s.name}">
            <span class="dot">${done&&!now?"✓":s.ic}</span><span class="cl">${s.n} · ${s.short}</span></button></span>`;
    }).join("")}</div>
    <div class="cb-act">
      ${qa?`<button class="cb-b" id="cbQuick" title="${qa.label}">${narrow?(qa.short||qa.label):qa.label}</button>`:""}
      <button class="cb-b ghost sm" id="cbReplan" title="Delete every saved trip and start fresh"><svg viewBox="0 0 256 256" width="13" height="13" fill="currentColor" aria-hidden="true" style="vertical-align:-2px"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg><span class="rl"> Start over</span></button>
      <button class="cb-b ghost" id="cbOpen">${CHK.open?"Hide checklist":"My checklist →"}</button>
    </div>`;
  bar.classList.add("show"); document.body.classList.add("chk-bar");
  bar.querySelectorAll("[data-bseg]").forEach(b=>b.onclick=()=>{
    const n=+b.dataset.bseg;
    if(n>T.firstOpen){ toast("Finish step "+T.firstOpen+" first — we go in order"); return; }
    r.view=n; CHK.home=false; save(r); open(); });
  const q=$("cbQuick"); if(q&&qa) q.onclick=qa.run;
  const rp=$("cbReplan"); if(rp) rp.onclick=()=>{
    // No native confirm(): it renders as a browser security-style warning and reads alarming for an
    // action that destroys nothing lasting (filed sign-ups and screenshots live in Paperwork).
    // Blanking the fields wasn't enough: reopening the planner re-seeds the record from
    // window.SPACEA_TRIP, which put every way and tick straight back. Drop the record itself —
    // filed sign-ups and screenshots live in their own stores, so nothing lasting is lost.
    // "Start over" means start over: every saved trip goes, not just the one on screen. The bar was
    // still advertising "17 saved trips" from practice runs the user considers gone.
    const rid=r.id, hub=t.hub;
    try{ allRecs().forEach(x=>localStorage.removeItem(PFX+x.id)); localStorage.removeItem(PFX+rid); }catch(e){}
    window.SPACEA_TRIP=null;
    // Mark nothing current — removing the pointer wasn't enough, because trip() then fell through
    // to the first saved record and showed an unrelated base pair as if it were yours.
    clearCur();
    // wipe the globals that used to leak back into a fresh trip (the mystery green step 4)
    try{ localStorage.removeItem("spacea.home.backup"); }catch(e3){}
    CHK.replanning=null;
    // The planner stays open otherwise, and its next render writes window.SPACEA_TRIP straight back —
    // which is why the bar kept reappearing as "Pick your ways · Kadena AB → MacDill AFB".
    try{
      const TB=window.__TB;
      if(TB){ TB.sel={}; TB.plans=[]; TB.hub=null; TB.planIdx=0; TB.planTouched=false;
        TB.step=1; TB.trail=[]; TB.userView=null; TB.rot=null; }
      const pnl=document.getElementById("tripb");
      if(pnl){ pnl.classList.remove("show"); pnl.innerHTML=""; }
      document.body.classList.remove("tb-open");
    }catch(e4){}
    CHK.home=false; close(); renderBar();
    toast("All trips cleared — pick a destination to start fresh");

  };
  const o=$("cbOpen"); if(o) o.onclick=()=>{ if(CHK.open) close(); else open(); };
  if(!bar._ro&&window.ResizeObserver){
    bar._ro=new ResizeObserver(()=>{
      const w2=bar.clientWidth||innerWidth;
      const key=(w2<1120)+"|"+(w2<860)+"|"+(w2<640);
      if(key===bar._key||bar._raf) return;
      bar._raf=requestAnimationFrame(()=>{ bar._raf=0; renderBar(); });
    });
    bar._ro.observe(bar);
  }
}

// ── open / close ─────────────────────────────────────────────────────────
let VWATCH=null;
function watchVault(){
  if(VWATCH) return;
  const m=document.getElementById("vcModal"); if(!m||!window.MutationObserver) return;
  let was=typeof window.chkVaultReady==="function"&&window.chkVaultReady();
  VWATCH=new MutationObserver(()=>{
    const now=typeof window.chkVaultReady==="function"&&window.chkVaultReady();
    if(now!==was){ was=now; if(CHK.open) render(); else renderBar(); }
  });
  VWATCH.observe(m,{attributes:true,attributeFilter:["class"],subtree:true,childList:true});
}
function ensure(){
  let el=$("chkDock");
  if(!el){ el=document.createElement("div"); el.id="chkDock"; document.body.appendChild(el); }
  if(!$("chkBar")){ const b=document.createElement("div"); b.id="chkBar"; document.body.appendChild(b); }
  watchVault();
  return el;
}
function open(){
  const el=ensure();
  CHK.open=true; CHK.userClosed=false; el.classList.add("show"); document.body.classList.add("chk-open");
  const t=trip();
  if(t){ setCur(t.start+">"+t.hub);
    try{ localStorage.setItem("spacea.trip.current",JSON.stringify(t)); }catch(e){}
    const r0=load(t); if(r0._fresh) save(r0); }
  render();
}
function close(){
  const el=ensure(); CHK.open=false; CHK.userClosed=true; el.classList.remove("show");
  document.body.classList.remove("chk-open");
  renderBar();
}
window.openTripChecklist=open;
window.closeTripChecklist=close;
window.openTripsHome=function(){ CHK.home=true; open(); };
// tripbuilder → checklist: the plan currently on the map
window.__chkSync=function(){
  const t=trip(); if(!t) return;
  setCur(t.start+">"+t.hub);
  try{ localStorage.setItem("spacea.trip.current",JSON.stringify(t)); }catch(e){}
  ensure();
  const r=load(t);
  // a trip becomes real once it has a way home — glancing at plans shouldn't leave records behind
  if(r._fresh&&t.home&&t.home.length) save(r);
  if(!r.seen&&t.home&&t.home.length){ r.seen=true; save(r);
    if(!CHK.userClosed){ open(); return; } }
  if(CHK.open) render(); else renderBar();
};
// tripbuilder → checklist: replace the trip's ways with the ticked selection
window.__chkSetWays=function(kind,ways){
  const t=trip(); if(!t||!ways) return;
  const r=load(t);
  const list=ways.filter(w=>w&&w.legs&&w.legs.length).slice(0,6).map((w,i)=>({
    sig:sigOf(w.legs),legs:w.legs,pct:w.pct,letter:w.letter||String(i+1),start:w.start||r.start}));
  if(!list.length) return;
  if(kind==="home") r.homes=list; else r.outs=list;
  r._fresh=false; save(r);
  if(CHK.open) render(); else renderBar();
};
// tripbuilder → checklist: remember this way (out or home) on the current trip
window.__chkKeepWay=function(kind,way,quiet){
  const t=trip(); if(!t||!way||!way.legs||!way.legs.length){ toast("Nothing to keep yet"); return; }
  const r=load(t), sig=sigOf(way.legs);
  const list=kind==="home"?(r.homes=r.homes||[]):(r.outs=r.outs||[]);
  if(list.some(w=>w.sig===sig)){ return; }
  if(list.length>=4){ if(!quiet) toast("4 ways is plenty — remove one first"); return; }
  list.push({sig,legs:way.legs,pct:way.pct,letter:way.letter||String(list.length+1),start:way.start||r.start});
  save(r);
  if(!quiet) toast((kind==="home"?"Way home":"Way")+" "+(way.letter||"")+" kept — its bases are in your sign-up list");
  if(CHK.open) render(); else renderBar();
};
addEventListener("keydown",e=>{ if(e.key==="Escape"&&CHK.open&&!($("chkView")&&$("chkView").classList.contains("show"))) close(); });
// the earlier practice runs wrote real 60-day records into the tracker — clear them once
function sweepPracticeSignups(){
  try{
    if(localStorage.getItem("spacea.ledger.swept.v1")) return;
    const list=JSON.parse(localStorage.getItem("spacea.signups.v1")||"[]")||[];
    const keep=list.filter(x=>x.source!=="checklist");
    if(keep.length!==list.length){
      localStorage.setItem("spacea.signups.v1",JSON.stringify(keep));
      if(window.__bellRefresh) window.__bellRefresh();
    }
    localStorage.setItem("spacea.ledger.swept.v1","1");
  }catch(e){}
}
function pruneEmpty(){
  const cur=curId();
  try{ const kill=[];
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i);
      if(!k||k.indexOf(PFX)!==0) continue;
      let r=null; try{ r=JSON.parse(localStorage.getItem(k)); }catch(e){ continue; }
      if(!r||r.id===cur) continue;
      const noWork=!Object.keys(r.bases||{}).length&&!(r.win&&r.win.from)
        &&!(r.homes&&r.homes.length)&&!(r.backup&&r.backup.proof);
      if(noWork) kill.push(k);
    }
    kill.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
  }catch(e){}
}
function backfillLabels(){
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i);
    if(!k||k.indexOf(PFX)!==0) continue;
    let r=null; try{ r=JSON.parse(localStorage.getItem(k)); }catch(e){ continue; }
    if(!r||!r.id) continue;
    let dirty=false;
    const idp=String(r.id).split(">");
    const sKey=(r.plan&&r.plan.start)||idp[0], hKey=(r.plan&&r.plan.hub)||idp[1];
    if(!r.label&&sKey&&hKey){ r.label=nm(sKey)+" → "+nm(hKey); dirty=true; }
    const names=r.names||{};
    [sKey,hKey].concat(Object.keys(r.bases||{})).forEach(key=>{
      if(key&&!names[key]){ names[key]=nm(key); dirty=true; } });
    if(dirty){ r.names=names; try{ localStorage.setItem(k,JSON.stringify(r)); }catch(e){} }
  } }catch(e){}
}
addEventListener("load",()=>{ pruneEmpty(); backfillLabels(); ensure(); renderBar(); });
})();

