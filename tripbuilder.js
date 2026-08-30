// ═══ 🗺️ Flight-Plan Trip Builder — multi-start plans, flight hours, animated planes ═══
// Uses page globals: d3, landFeat, TERMS, TByKey, G, PRIMARY, SCHEDULES, TERM_PAGE, mkHash, toast,
// openRapidFire + IIFE exports: JM_EDGES, JM_HOME, JM_NAMES, jmName, jmBand, jmChip, jmBackup.
(function(){
const $=id=>document.getElementById(id);
const css=document.createElement("style");
css.textContent=`
  /* ── base overlay chrome (restored: these were lost from the page's stylesheet) ── */
  #tripb{position:fixed;inset:0;z-index:410;display:none;overflow:hidden;
    background:var(--color-bg);color:var(--color-text);font-family:var(--font-body);}
  #tripb.show{display:block;}
  #tripb svg{position:absolute;inset:0;width:100%;height:100%;display:block;}
  /* The header is a band, not a row of loose parts: controls left, chips right, and one status line
     under them — so nothing has to shrink and no chip loses its name mid-word. */
  .tb-head{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;flex-direction:column;
    align-items:stretch;gap:5px;padding:13px 16px 11px;
    background:linear-gradient(to bottom,color-mix(in srgb,var(--color-bg) 96%,transparent) 30%,color-mix(in srgb,var(--color-bg) 62%,transparent) 72%,transparent);}
  .tb-head::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;pointer-events:none;
    background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--color-text) 13%,transparent) 10% 74%,transparent);}
  .tb-hrow{display:flex;align-items:center;gap:9px;min-width:0;}
  .tb-hrow>*{flex:0 0 auto;}
  .tb-hgap{flex:1 1 auto!important;min-width:8px;}
  /* the chip cluster shrinks and scrolls rather than letting a base name get cut in half */
  .tb-hrow>.tb-hchips{flex:0 1 auto;min-width:0;display:flex;align-items:center;gap:8px;
    overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;padding:3px 1px;}
  .tb-hchips::-webkit-scrollbar{display:none;}
  .tb-hchips.fade{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 24px),transparent);
    mask-image:linear-gradient(90deg,#000 calc(100% - 24px),transparent);}
  .tb-hchips .tb-chips{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
  .tb-hchips>*,.tb-hchips .tb-chip{flex:0 0 auto;}
  .tb-hsub{display:flex;align-items:baseline;gap:14px;min-width:0;padding-left:3px;}
  .tb-x{width:34px;height:34px;flex:0 0 auto;border-radius:50%;cursor:pointer;font:inherit;font-size:14px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 88%,transparent);
    color:var(--color-text);}
  .tb-x:hover{border-color:var(--color-accent);}
  .tb-x:focus-visible,.tb-btn:focus-visible,.tb-chip:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  /* One hairline of progress across the very top edge, numbered nodes beneath it — the tax-filing
     stepper pattern: vibrant where you ARE, quiet everywhere else, no boxes competing with the globe. */
  .tb-prog{position:absolute;left:0;right:0;top:0;height:2.5px;
    background:color-mix(in srgb,var(--color-text) 9%,transparent);}
  .tb-prog i{display:block;height:100%;border-radius:0 3px 3px 0;
    background:linear-gradient(90deg,var(--color-accent),#34D399);
    box-shadow:0 0 12px color-mix(in srgb,#34D399 50%,transparent);
    transition:width .5s cubic-bezier(.4,0,.2,1);}
  .tb-steps{display:flex;align-items:center;gap:0;flex:0 0 auto;}
  .tb-step{font:inherit;font-size:11.5px;padding:4px 9px 4px 4px;border:0;background:none;
    white-space:nowrap;color:color-mix(in srgb,var(--color-text) 46%,transparent);
    transition:color .25s;}
  .tb-step .n{width:19px;height:19px;flex:0 0 auto;border-radius:50%;display:grid;place-items:center;
    font-size:10px;font-weight:600;letter-spacing:0;
    border:1px solid color-mix(in srgb,var(--color-text) 20%,transparent);
    transition:background .3s,border-color .3s,color .3s,box-shadow .3s;}
  .tb-step:hover{color:var(--color-text);}
  .tb-step.on{color:var(--color-text);}
  .tb-step.on .n{border-color:var(--color-accent);background:var(--color-accent);color:var(--color-bg);
    box-shadow:0 0 0 3px color-mix(in srgb,var(--color-accent) 18%,transparent);}
  .tb-step.done{color:color-mix(in srgb,#34D399 78%,var(--color-text));}
  .tb-step.done .n{border-color:color-mix(in srgb,#34D399 60%,transparent);
    background:color-mix(in srgb,#34D399 16%,transparent);color:#34D399;}
  .tb-join{width:20px;height:1px;flex:0 0 auto;
    background:color-mix(in srgb,var(--color-text) 15%,transparent);}
  .tb-join.lit{background:linear-gradient(90deg,var(--color-accent),#34D399);}
  .tb-arrow{font-size:12px;color:color-mix(in srgb,var(--color-text) 40%,transparent);}
  /* #tripb svg{position:absolute;inset:0;width:100%;height:100%} is an ID rule — the icon rule has to
     be scoped under the same id to outrank it, or position/inset/display silently lose. */
  #tripb .tb-head svg.tbi{position:static;inset:auto;display:inline-block;
    width:14px;height:14px;vertical-align:-2px;flex:0 0 auto;}
  .tb-head .tb-step,.tb-head .tb-chip{display:inline-flex;align-items:center;gap:6px;}
  .tb-head .tb-x .tbi{vertical-align:0;}
  .tb-chip{font:inherit;font-size:11.5px;padding:5px 11px;min-height:32px;border-radius:16px;cursor:pointer;
    white-space:nowrap;border:1px solid var(--color-divider);color:var(--color-text);
    background:color-mix(in srgb,var(--color-surface) 80%,transparent);}
  .tb-chip:hover{border-color:var(--color-accent);}
  .tb-bar{position:absolute;left:14px;right:14px;bottom:14px;z-index:6;display:flex;align-items:center;
    justify-content:center;flex-wrap:wrap;gap:9px;padding:9px 13px;border-radius:15px;font-size:12px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 95%,transparent);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:var(--shadow-md);}
  .tb-btn{font:inherit;font-size:12px;font-weight:600;min-height:38px;padding:8px 15px;border-radius:11px;
    cursor:pointer;white-space:nowrap;border:1px solid color-mix(in srgb,var(--color-accent) 60%,transparent);
    background:none;color:var(--color-text);}
  .tb-btn:hover{background:color-mix(in srgb,var(--color-accent) 16%,transparent);}
  .tb-btn.ghost{border-color:var(--color-divider);font-weight:500;}
  .tb-btn[disabled]{opacity:.45;cursor:not-allowed;}
  .tb-tabs{position:absolute;right:14px;top:104px;bottom:82px;z-index:5;display:flex;flex-direction:column;
    width:min(300px,calc(100vw - 32px));
    gap:5px;padding:10px;overflow-y:auto;border-radius:14px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 96%,transparent);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:var(--shadow-lg);}
  .tb-tabs h6{margin:0;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  .tb-tab{display:flex;align-items:center;gap:8px;width:100%;padding:7px 8px;border-radius:10px;
    border:1px solid transparent;background:none;color:var(--color-text);font:inherit;text-align:left;cursor:pointer;}
  .tb-tab:hover{background:color-mix(in srgb,var(--color-accent) 12%,transparent);}
  .tb-tab.on{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 14%,transparent);}
  .tb-tab .sd{flex:0 0 auto;width:8px;height:8px;border-radius:50%;}
  .tb-tab .tt{flex:1 1 auto;min-width:0;}
  .tb-tab .tl{display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .tb-tab .tsub{display:flex;flex-wrap:wrap;gap:5px;font-size:10px;margin-top:1px;
    color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .tb-tab .tnow{margin-left:5px;font-size:8.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    padding:2px 5px;border-radius:6px;color:var(--color-accent);
    border:1px solid color-mix(in srgb,var(--color-accent) 45%,transparent);}
  .tb-tab .tfrom{font-weight:400;color:color-mix(in srgb,var(--color-text) 50%,transparent);}
  .tb-tab .tmoney{font-weight:700;}
  .tb-tab .tpct{flex:0 0 auto;font-size:14px;font-weight:700;text-align:right;line-height:1.1;}
  .tb-tab .tpct small{display:block;font-size:8px;font-weight:400;
    color:color-mix(in srgb,var(--color-text) 50%,transparent);}
  .tb-pin{position:absolute;transform:translate(-50%,-50%);padding:5px 8px;border-radius:9px;
    font-size:11.5px;line-height:1.3;white-space:nowrap;pointer-events:all;cursor:pointer;
    background:color-mix(in srgb,var(--color-bg) 82%,transparent);}
  .tb-pin .pn{display:block;font-size:11.5px;}
  .tb-pin .pp{font-weight:700;}
  .tb-pin .pnote{font-size:9px;color:color-mix(in srgb,var(--color-text) 48%,transparent);}
  .tb-pin .sd{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:3px;vertical-align:1px;}
  .tb-hub{position:absolute;transform:translate(-50%,-50%);text-align:center;pointer-events:all;cursor:pointer;}
  .tb-card{position:absolute;left:14px;top:120px;z-index:5;display:flex;flex-direction:column;gap:6px;
    width:min(300px,calc(100vw - 28px));padding:12px 13px;border-radius:14px;font-size:12.5px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 96%,transparent);
    box-shadow:var(--shadow-md);}
  .tb-start{position:absolute;left:14px;top:120px;z-index:6;display:flex;flex-direction:column;gap:8px;
    width:min(330px,calc(100vw - 28px));padding:13px;border-radius:15px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 97%,transparent);
    box-shadow:var(--shadow-lg);}
  .tb-slist{display:flex;flex-direction:column;gap:3px;overflow-y:auto;}
  .jm-empty{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;
    padding:11px 15px;border-radius:13px;font-size:12.5px;text-align:center;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 95%,transparent);}
  .jm-cap{font-size:10.5px;color:color-mix(in srgb,var(--color-text) 52%,transparent);}
  .tb-strip{position:absolute;left:50%;bottom:66px;transform:translateX(-50%);z-index:4;display:flex;flex-direction:column;gap:5px;align-items:center;max-width:min(900px,calc(100vw - 20px));background:color-mix(in srgb,var(--color-surface) 93%,transparent);border:1px solid var(--color-divider);border-radius:var(--radius-lg);box-shadow:var(--shadow-md);padding:9px 12px;}
  .tb-srow{display:flex;align-items:flex-start;justify-content:center;gap:0;flex-wrap:wrap;
    max-width:100%;padding:2px 2px 0;}
  /* Stops are type on a hairline, not boxes. The old pill-per-base + label-per-arrow packed four
     competing weights into one strip; this leaves one voice per row. */
  .tb-stop{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:5px;padding:0 2px;}
  .tb-stop .sname{font-size:12px;font-weight:600;letter-spacing:.01em;white-space:nowrap;
    color:var(--color-text);}
  .tb-stop .sdot{width:7px;height:7px;border-radius:50%;background:color-mix(in srgb,var(--color-text) 38%,transparent);
    box-shadow:0 0 0 3px color-mix(in srgb,var(--color-bg) 80%,transparent);}
  .tb-stop.end .sdot{background:var(--color-accent);}
  .tb-stop.start .sdot{background:color-mix(in srgb,var(--color-text) 70%,transparent);}
  .tb-hop{flex:1 1 auto;min-width:74px;display:flex;flex-direction:column;align-items:center;gap:5px;
    padding:0 6px;}
  .tb-hop .hline{align-self:stretch;height:1px;margin-top:calc(1.05em + 2px);
    background:color-mix(in srgb,var(--color-text) 20%,transparent);}
  .tb-hop.paid .hline{background:repeating-linear-gradient(90deg,
    color-mix(in srgb,#FBBF24 55%,transparent) 0 4px,transparent 4px 8px);}
  .tb-hop .hfx{display:flex;flex-direction:column;align-items:center;gap:1px;line-height:1.25;}
  .tb-hop .hmain{font-size:9.5px;font-weight:600;letter-spacing:.01em;white-space:nowrap;}
  .tb-hop.weak .hline{background:repeating-linear-gradient(90deg,
    color-mix(in srgb,#FF6B6B 50%,transparent) 0 3px,transparent 3px 7px);}
  .tb-hop.weak .hsub{color:color-mix(in srgb,#FF6B6B 78%,var(--color-text));}
  .tb-hop .hsub{font-size:9.5px;white-space:nowrap;font-variant-numeric:tabular-nums;
    color:color-mix(in srgb,var(--color-text) 68%,transparent);}
  .tb-leg{display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 10px;border-radius:10px;border:1px solid var(--color-divider);background:color-mix(in srgb,#000 16%,transparent);font-size:12px;white-space:nowrap;flex:0 0 auto;}
  .tb-leg.comm{border-style:dashed;}
  .tb-leg b{font-size:12.5px;}
  .tb-leg .lnote{font-size:8px;color:color-mix(in srgb,var(--color-text) 45%,transparent);}
  .tb-leg .lh{font-size:10px;color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .tb-sar{display:flex;flex-direction:column;align-items:center;gap:0;flex:0 0 auto;padding:0 2px;}
  .tb-sar em{font-style:normal;font-size:9.5px;font-weight:700;white-space:nowrap;line-height:1.25;}
  .tb-sar em.h{font-weight:400;font-size:9px;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .tb-sar i{font-style:normal;font-size:13px;line-height:1;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .tb-scap{display:flex;justify-content:center;flex-wrap:wrap;gap:2px 18px;padding-top:3px;
    font-size:11px;color:color-mix(in srgb,var(--color-text) 65%,transparent);text-align:center;}
  .tb-scap .f{display:flex;align-items:baseline;gap:6px;line-height:1.3;}
  .tb-scap .f i{font-style:normal;font-size:9.5px;font-weight:700;letter-spacing:.07em;
    text-transform:uppercase;color:color-mix(in srgb,var(--color-text) 66%,transparent);}
  .tb-plab{font-size:12px;font-weight:700;letter-spacing:.02em;
    color:color-mix(in srgb,var(--color-text) 80%,transparent);}
  .tb-scap .f b{font-size:11.5px;font-weight:700;color:color-mix(in srgb,var(--color-text) 92%,transparent);}
  .tb-slab{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:color-mix(in srgb,var(--color-text) 72%,transparent);}
  .tb-stack{position:absolute;left:10px;right:10px;bottom:66px;z-index:4;display:flex;gap:10px;
    align-items:flex-end;justify-content:center;flex-wrap:wrap;overflow-y:auto;}
  .tb-stack .tb-strip{position:static;transform:none;bottom:auto;left:auto;
    min-width:0;max-width:min(460px,100%);}
  .tb-stack.one .tb-strip{max-width:100%;}
  .tb-stack .tb-srow{max-width:100%;}
  .tb-start{position:absolute;left:50%;top:70px;transform:translateX(-50%);z-index:6;width:min(440px,calc(100vw - 28px));max-height:calc(100vh - 160px);overflow-y:auto;padding:16px;background:color-mix(in srgb,var(--color-surface) 96%,transparent);border:1px solid var(--color-accent);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);display:flex;flex-direction:column;gap:9px;}
  .tb-start .tb-chips{max-height:96px;overflow-y:auto;flex:0 0 auto;}
  .tb-start b{font-size:15px;}
  .tb-start input{font:inherit;padding:8px 11px;border-radius:8px;border:1px solid var(--color-divider);background:color-mix(in srgb,#000 18%,transparent);color:var(--color-text);}
  .tb-slist{max-height:170px;min-height:60px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;flex:1 1 auto;}
  .tb-slist button{font:inherit;font-size:12.5px;text-align:left;padding:6px 9px;border-radius:7px;border:0;background:none;color:var(--color-text);cursor:pointer;}
  .tb-slist button:hover{background:color-mix(in srgb,var(--color-accent) 14%,transparent);}
  .tb-slist button.on{background:color-mix(in srgb,#f0c33c 14%,transparent);}
  .tb-chip{font:inherit;font-size:11.5px;padding:6px 11px;border-radius:14px;border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 88%,transparent);color:var(--color-text);cursor:pointer;white-space:nowrap;}
  .tb-chip:hover{border-color:var(--color-accent);}
  .tb-chip .x{opacity:.6;margin-left:4px;}
  .tb-chips{display:flex;gap:5px;flex-wrap:wrap;align-items:center;}
  .tb-hub .he.gold{font-size:33px;}
  /* 🏠 home-base house: waving pennant + breathing window glow; rides the same tb-fl bob */
  #tripb .tb-hub .he.gold svg{position:static;inset:auto;width:36px;height:36px;display:block;margin:0 auto;overflow:visible;
    filter:drop-shadow(0 2px 4px rgba(0,0,0,.45));}
  .hb-flag{animation:hbFlag 1.7s ease-in-out infinite;transform-origin:18px 4.6px;transform-box:view-box;}
  .hb-win{animation:hbWin 2.9s ease-in-out infinite;transform-origin:18px 23px;transform-box:view-box;}
  @keyframes hbFlag{0%,100%{transform:rotate(-7deg) scaleY(1);}45%{transform:rotate(5deg) scaleY(.92);}70%{transform:rotate(1deg) scaleY(1.04);}}
  @keyframes hbWin{0%,100%{opacity:.55;}50%{opacity:1;}}
  @media (prefers-reduced-motion:reduce){.hb-flag,.hb-win{animation:none;}}
  .tb-hub.dimstart{opacity:.35;}
  /* every base star answers the cursor — tapping one flies you from there (or to there) */
  .tb-hub .he{transition:transform .15s ease,filter .15s ease;}
  .tb-hub:hover{opacity:1;}
  .tb-hub:hover .he{transform:scale(1.15);filter:drop-shadow(0 0 7px rgba(240,195,60,.6));}
  .tb-hub:hover .hn{color:var(--color-text);}
  .tb-hub:focus-visible{outline:2px solid var(--color-accent);outline-offset:3px;border-radius:10px;}
  @media (prefers-reduced-motion:reduce){.tb-hub:hover .he{transform:none;}}
  .tb-fl{display:inline-block;animation:tbBob var(--bd,4s) ease-in-out var(--bp,0s) infinite;will-change:transform;}
  @keyframes tbBob{0%,100%{transform:translateY(3px);}50%{transform:translateY(-3px);}}
  .tb-gl{width:20px;height:5px;border-radius:50%;margin:-1px auto 0;
    background:radial-gradient(ellipse at center,var(--glc,rgba(0,0,0,.5)) 0%,transparent 70%);
    animation:tbGlow var(--bd,4s) ease-in-out var(--bp,0s) infinite;will-change:transform,opacity;}
  @keyframes tbGlow{0%,100%{transform:scale(.65);opacity:.3;}50%{transform:scale(1.2);opacity:.75;}}
  #tripb.dragging .tb-fl,#tripb.dragging .tb-gl,#tripb.tb-paused .tb-fl,#tripb.tb-paused .tb-gl{animation-play-state:paused;}
  @media (prefers-reduced-motion:reduce){.tb-fl,.tb-gl{animation:none;}}
  .tb-clip{position:absolute;transform:translateX(-50%);bottom:150px;z-index:6;white-space:nowrap;
    display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;
    padding:7px 14px;border-radius:999px;color:var(--color-accent-200);
    background:color-mix(in srgb,var(--color-accent) 14%,var(--color-surface));
    border:1px solid color-mix(in srgb,var(--color-accent) 55%,transparent);box-shadow:var(--shadow-md);}
  .tb-clip:hover{background:color-mix(in srgb,var(--color-accent) 24%,var(--color-surface));}
  .tb-clip .tbi{position:static;width:13px;height:13px;flex:0 0 13px;}
  #tripb.narrow .tb-clip{bottom:auto;top:96px;}
  .tb-badge{font-size:9.5px;font-weight:700;color:#34D399;border:1px solid color-mix(in srgb,#34D399 45%,transparent);border-radius:8px;padding:1px 6px;}
  @keyframes tbFlow{to{stroke-dashoffset:var(--fo,-36px);}}
  .tb-flow{animation:tbFlow 2.3s linear infinite;}
  #tripb svg path{shape-rendering:geometricPrecision;}
  @media (prefers-reduced-motion:reduce){.tb-flow{animation:none;}}
  /* ── calmer chrome: one line per thing, nothing wraps ── */
  .tb-head{flex-wrap:nowrap;overflow:hidden;}
  .tb-head .tb-chips{flex-wrap:nowrap;overflow:hidden;min-width:0;}
  .tb-head .tb-chip{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .tb-head .jm-cap{flex:0 1 auto;min-width:0;font-size:10.5px;opacity:.55;white-space:nowrap;
    overflow:hidden;text-overflow:ellipsis;}
  .tb-lock{flex:0 1 auto;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    color:color-mix(in srgb,var(--color-text) 88%,transparent);}
  .tb-crumb{max-width:320px;overflow:hidden;}
  .tb-tab{align-items:center;gap:8px;padding:8px 9px;}
  .tb-tab .tt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
  .tb-tab .tl{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  /* The plan's name is a kicker + a letter, not a sentence — so "from …" never truncates it. */
  .tb-tab .tl{display:flex;align-items:baseline;gap:5px;font-weight:500;}
  .tb-tab .tk{flex:0 0 auto;font-size:9px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-text) 44%,transparent);}
  .tb-tab .tix{flex:0 0 auto;font-style:normal;font-size:15.5px;font-weight:500;line-height:1;
    letter-spacing:.01em;color:color-mix(in srgb,var(--color-text) 95%,transparent);}
  .tb-tab.on .tk{color:color-mix(in srgb,var(--color-accent) 72%,var(--color-text));}
  .tb-tab .tfrom{font-weight:500;color:color-mix(in srgb,var(--color-text) 72%,transparent);}
  .tb-tab .tfrom{font-weight:400;font-size:11px;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .tb-tab .tnow{margin-left:5px;font-size:8.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    padding:2px 5px;border-radius:6px;color:var(--color-accent);
    border:1px solid color-mix(in srgb,var(--color-accent) 45%,transparent);}
  .tb-tab .tnow{margin-left:1px;padding:2px 6px;border:0;letter-spacing:.08em;
    color:color-mix(in srgb,var(--color-accent-200,#c3bbec) 90%,var(--color-text));
    background:color-mix(in srgb,var(--color-accent) 24%,transparent);}
  .tb-tab .tsub{display:flex;align-items:baseline;flex-wrap:wrap;gap:2px 6px;font-size:10.5px;min-width:0;
    color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  /* Two lines, not an ellipsis. This line names the bases the plan flies through — it IS the plan's
     identity — and it only ever gets 149px (checkbox + % column eat 110 of the 300px rail), so any
     route naming two bases clips. Trading it for row height bought nothing: the chips below wrap to
     three lines regardless. */
  .tb-tab .tvia{flex:1 1 100%;min-width:0;white-space:normal;overflow:hidden;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.35;
    color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  .tb-tab .thrs{flex:0 0 auto;white-space:nowrap;font-size:11px;font-weight:700;color:#4FD0E0;
    letter-spacing:-.01em;}
  .tb-tab .tmoney{flex:0 0 auto;white-space:nowrap;font-size:11px;font-weight:700;letter-spacing:-.01em;}
  .tb-tab b{flex:0 0 auto;font-size:13px;}
  .tb-tab .tpct{display:flex;flex-direction:column;align-items:flex-end;line-height:1.05;font-size:14.5px;
    text-shadow:0 0 10px color-mix(in srgb,currentColor 30%,transparent);}
  .tb-tab .tpct small{font-size:7.5px;font-weight:400;letter-spacing:.01em;opacity:.7;max-width:52px;white-space:normal;text-align:right;line-height:1.1;}
  .tb-pickdest{width:min(430px,calc(100vw - 28px));gap:11px;}
  .tb-dhead{display:flex;align-items:center;gap:9px;}
  .tb-dhead b{flex:1 1 auto;font-size:16px;font-family:var(--font-heading);font-weight:500;}
  .tb-dhead .tb-x{margin-left:0;}
  .tb-dlist{max-height:min(46vh,380px);gap:4px;}
  .tb-drow{display:flex;align-items:center;gap:11px;width:100%;min-height:54px;padding:9px 11px;
    border-radius:12px;border:1px solid transparent;background:none;color:var(--color-text);
    font:inherit;text-align:left;cursor:pointer;}
  .tb-drow:hover{background:color-mix(in srgb,var(--color-accent) 14%,transparent);
    border-color:color-mix(in srgb,var(--color-accent) 45%,transparent);}
  .tb-drow:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .tb-drow.here{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 12%,transparent);}
  .tb-drow.usb{opacity:.45;}
  .tb-drow.usb:hover{background:color-mix(in srgb,#FF4D4D 10%,transparent);
    border-color:color-mix(in srgb,#FF4D4D 40%,transparent);}
  .tb-drow .di{flex:0 0 auto;width:22px;text-align:center;font-size:15px;}
  .tb-drow .dt{flex:1 1 auto;min-width:0;}
  .tb-drow .dt b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .tb-drow .dt small{display:block;font-size:11px;margin-top:1px;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .tb-drow .dp{flex:0 0 auto;font-size:13px;font-weight:700;}
  .tb-drow .dusb{flex:0 0 auto;font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    padding:2px 6px;border-radius:6px;color:#FF6B6B;border:1px solid color-mix(in srgb,#FF4D4D 45%,transparent);}
  .tb-destbtn{border-color:color-mix(in srgb,var(--color-accent) 55%,transparent);font-weight:600;}
  .tb-board{gap:3px;}
  .tb-board .tb-brow{flex:0 0 auto;}
  .tb-bcap{font-size:10.5px;line-height:1.5;padding:0 3px 7px;
    color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .tb-brow{display:flex;align-items:center;gap:9px;width:100%;min-height:50px;padding:8px 9px;border-radius:11px;
    border:1px solid transparent;background:none;color:var(--color-text);font:inherit;text-align:left;cursor:pointer;}
  .tb-brow:hover{background:color-mix(in srgb,var(--color-accent) 14%,transparent);
    border-color:color-mix(in srgb,var(--color-accent) 45%,transparent);}
  .tb-brow:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .tb-brow.top{border-color:color-mix(in srgb,#34D399 30%,transparent);
    background:color-mix(in srgb,#34D399 7%,transparent);}
  /* the row whose route is lit on the globe — and the fifteen that aren't */
  .tb-brow.hot{border-color:color-mix(in srgb,#34D399 75%,transparent);
    background:color-mix(in srgb,#34D399 15%,transparent);
    box-shadow:0 0 0 1px color-mix(in srgb,#34D399 30%,transparent);}
  .tb-brow.off{opacity:.42;}
  .tb-brow .bn{flex:0 0 auto;width:24px;text-align:center;font-size:14px;}
  .tb-brow .bt{flex:1 1 auto;min-width:0;}
  .tb-brow .bt b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .tb-brow .bt small{display:block;margin-top:1px;font-size:10px;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .tb-brow .bv{flex:0 0 auto;text-align:right;line-height:1.2;}
  .tb-brow .bv b{display:block;font-size:12px;}
  .tb-brow .bv small{display:block;font-size:9.5px;font-variant-numeric:tabular-nums;
    color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .tb-bcount{font-size:11.5px;font-weight:600;white-space:nowrap;color:#34D399;}
  /* The airline yardstick. A reference figure, not a warning — and it must not eat the list it is a
     reference FOR: one line, kicker inline, figures pushed right. It was a 118px stacked card sitting
     above a panel that then had room for zero plan rows. */
  .tb-comm{position:relative;display:flex;align-items:baseline;flex-wrap:wrap;gap:3px 9px;margin:2px 0 9px;padding:8px 11px 9px;
    border-radius:12px;border:1px solid color-mix(in srgb,#E3B04B 22%,transparent);
    background:linear-gradient(118deg,color-mix(in srgb,#E3B04B 8%,transparent),color-mix(in srgb,#000 17%,transparent) 58%);}
  .tb-comm::before{content:"";position:absolute;left:11px;right:11px;top:0;height:1px;
    background:linear-gradient(90deg,transparent,color-mix(in srgb,#E3B04B 38%,transparent) 30%,transparent 85%);}
  .tb-comm .ck{flex:0 0 auto;font-size:8.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;
    color:color-mix(in srgb,#E3B04B 58%,var(--color-text) 20%);}
  .tb-comm .cr{flex:0 0 auto;display:flex;align-items:baseline;gap:8px;margin-left:auto;}
  .tb-comm .cro{flex:1 1 auto;min-width:0;display:flex;align-items:baseline;gap:5px;
    font-size:11.5px;font-weight:500;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    color:color-mix(in srgb,var(--color-text) 88%,transparent);}
  .tb-comm .cro i{font-style:normal;font-size:10px;color:color-mix(in srgb,#E3B04B 48%,transparent);}
  .tb-comm .cm{font-size:15px;font-weight:500;line-height:1;letter-spacing:-.015em;
    font-variant-numeric:tabular-nums;color:#E3B04B;text-shadow:0 0 14px color-mix(in srgb,#E3B04B 35%,transparent);}
  .tb-comm .ch{font-size:11.5px;font-weight:500;line-height:1;font-variant-numeric:tabular-nums;
    padding-left:9px;border-left:1px dashed color-mix(in srgb,#E3B04B 34%,transparent);
    color:color-mix(in srgb,var(--color-text) 78%,transparent);}
  .tb-comm .cs{display:none;}
  .tb-comm .cm small,.tb-comm .ch small{display:none;}
  .tb-reach{font-size:9.5px;line-height:1.5;padding:0 3px 7px;
    color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .tb-reach b{font-weight:700;color:color-mix(in srgb,var(--color-text) 82%,transparent);}
  .tb-trow .tlong{margin-left:5px;padding:1px 5px;border-radius:6px;font-size:8.5px;font-weight:700;
    letter-spacing:.04em;text-transform:uppercase;color:#FBBF24;
    background:color-mix(in srgb,#FBBF24 16%,transparent);}
  .tb-trow .ttrade{flex:0 0 auto;white-space:nowrap;font-size:9.5px;font-weight:600;letter-spacing:.01em;color:#34D399;}
  /* the headline number: what the free legs would have cost you. Inline — as a block it added a whole
     line, and with tcost and ttrade also block the row grew to 172px, taller than half the list. */
  .tb-trow .tfree{flex:0 0 auto;white-space:nowrap;font-size:10px;font-weight:700;letter-spacing:.01em;color:#4BFF9E;}
  .tb-trow .treach{flex:0 0 auto;white-space:nowrap;font-size:9.5px;
    color:color-mix(in srgb,var(--color-text) 46%,transparent);}
  .tb-trow .tcost{flex:0 0 auto;white-space:nowrap;font-size:9.5px;font-weight:600;letter-spacing:.01em;
    color:color-mix(in srgb,#FBBF24 82%,var(--color-text));}
  .tb-trow.usblock{opacity:.42;position:relative;transition:opacity .15s ease;}
  .tb-trow.usblock:hover,.tb-trow.usblock:focus-within{opacity:1;}
  .tb-trow.usblock::after{content:attr(data-usmsg);position:absolute;inset:-1px 0;z-index:3;
    display:flex;align-items:center;justify-content:center;text-align:center;
    padding:6px 12px;border-radius:16px;font-size:11.5px;font-weight:600;line-height:1.3;
    color:#FFD9D9;background:color-mix(in srgb,#3A1620 92%,transparent);
    border:1px solid color-mix(in srgb,#FF4D4D 45%,transparent);
    box-shadow:0 4px 14px rgba(0,0,0,.4);
    opacity:0;pointer-events:none;transform:scale(.97);transition:opacity .15s ease,transform .15s ease;}
  .tb-trow.usblock:hover::after,.tb-trow.usblock:focus-within::after{opacity:1;transform:none;}
  @media (prefers-reduced-motion:reduce){.tb-trow.usblock::after{transition:none;}}
  .tb-trow.usblock .tb-ck{border-color:color-mix(in srgb,#FF4D4D 55%,transparent);background:none;cursor:not-allowed;}
  .tb-tab .tusb{margin-left:5px;font-size:8.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    padding:2px 5px;border-radius:6px;color:#FF6B6B;border:1px solid color-mix(in srgb,#FF4D4D 45%,transparent);}
  .tb-keepcap{font-size:10px;line-height:1.4;padding:7px 5px 0;
    color:color-mix(in srgb,var(--color-text) 50%,transparent);}
  /* A STACK, not a row. As one line .twords was the only shrinkable child sharing 265px with a 31px
     numeral and two nowrap buttons (49 + 66), so the label got 93px and "18 more the long way round"
     broke across three lines. Line one holds the count and the controls; the note gets the full width
     to itself and never wraps. Same fix as #lassoPanel .lp-h. */
  .tb-thead{display:flex;flex-direction:column;align-items:stretch;gap:2px;position:sticky;top:-8px;
    z-index:2;padding-top:8px;margin-top:-8px;
    background:color-mix(in srgb,var(--color-surface) 96%,transparent);}
  .tb-thead h6{flex:1 1 auto;min-width:0;}
  /* The count is the headline — a numeral carries it better than two lines of shouting caps. */
  .tb-title{display:flex;align-items:center;gap:10px;padding:2px 0 8px;}
  .tb-title .tnum{flex:0 0 auto;font-size:31px;font-weight:500;line-height:.9;letter-spacing:-.03em;
    font-variant-numeric:tabular-nums;
    background:linear-gradient(180deg,#f4f4f8 12%,var(--color-accent-200,#c3bbec) 96%);
    -webkit-background-clip:text;background-clip:text;color:transparent;}
  .tb-title .twords{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;}
  .tb-title .twords b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13.5px;font-weight:500;line-height:1.1;letter-spacing:.005em;
    color:color-mix(in srgb,var(--color-text) 92%,transparent);}
  .tb-title .tsub2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px;line-height:1.2;
    color:color-mix(in srgb,var(--color-text) 46%,transparent);}
  /* controls get their own full-width line — two even pills, nothing ever clips */
  .tb-ctr{display:flex;gap:6px;padding:0 0 9px;}
  .tb-ctr .tb-selall,.tb-ctr .tb-voy{flex:1 1 0;min-width:0;margin:0;height:29px;display:flex;align-items:center;justify-content:center;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 8px;border-radius:9px;font-size:11px;}
  /* the note lives inside .twords now (.tsub2); .tnote kept for nothing — removed */
  .tb-thead::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;
    background:linear-gradient(90deg,color-mix(in srgb,var(--color-text) 16%,transparent),transparent 78%);}
  .tb-selall{flex:0 0 auto;white-space:nowrap;font:inherit;font-size:10.5px;background:none;cursor:pointer;
    padding:3px 9px;border-radius:8px;border:1px solid color-mix(in srgb,var(--color-accent) 30%,transparent);
    color:color-mix(in srgb,var(--color-accent-200,#c3bbec) 85%,var(--color-text));}
  .tb-selall:hover{background:color-mix(in srgb,var(--color-accent) 15%,transparent);}
  .tb-selall:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  /* the deep-search switch: longer, multi-country journeys */
  .tb-voy{flex:0 0 auto;white-space:nowrap;font:inherit;font-size:10px;cursor:pointer;
    padding:3px 8px;border-radius:8px;
    border:1px solid color-mix(in srgb,#A78BFA 40%,transparent);background:none;
    color:color-mix(in srgb,#A78BFA 88%,var(--color-text));}
  .tb-voy:hover{background:color-mix(in srgb,#A78BFA 16%,transparent);}
  .tb-voy.on{background:color-mix(in srgb,#A78BFA 26%,transparent);color:#fff;
    border-color:color-mix(in srgb,#A78BFA 75%,transparent);}
  .tb-voy:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .tb-trow .tctry{flex:0 0 auto;white-space:nowrap;font-size:9.5px;font-weight:600;color:#C4B5FD;}
  .tb-tab .tchain{font-weight:700;letter-spacing:.02em;color:#C4B5FD;}
  .tb-trow{display:flex;align-items:center;gap:4px;}
  .tb-trow .tb-tab{flex:1 1 auto;min-width:0;}
  .tb-ck{flex:0 0 auto;width:26px;height:26px;border-radius:8px;cursor:pointer;font:inherit;font-size:13px;
    border:1.5px solid color-mix(in srgb,var(--color-text) 28%,transparent);background:color-mix(in srgb,#000 20%,transparent);
    color:#0b1020;display:flex;align-items:center;justify-content:center;}
  .tb-ck:hover{border-color:var(--color-accent);}
  .tb-ck.on{background:#34D399;border-color:#34D399;font-weight:700;}
  .tb-go{width:100%;margin-top:10px;position:sticky;bottom:-8px;z-index:3;
    box-shadow:0 -14px 16px -8px color-mix(in srgb,#000 75%,transparent);font:inherit;font-size:12.5px;font-weight:600;min-height:46px;padding:12px;
    border-radius:11px;cursor:pointer;color:var(--color-text);
    border:1px solid color-mix(in srgb,#34D399 65%,transparent);
    background:color-mix(in srgb,#34D399 20%,var(--color-surface));}
  .tb-go:hover{background:color-mix(in srgb,#34D399 32%,var(--color-surface));}
  .tb-go[disabled]{cursor:not-allowed;border-color:var(--color-divider);color:color-mix(in srgb,var(--color-text) 45%,transparent);
    background:var(--color-surface);}
  /* Step 2 is a different question — tint the whole list so you can't mistake "ways home" for "ways there" */
  #tripb.home .tb-tabs{border-color:color-mix(in srgb,var(--color-accent) 52%,transparent);
    background:color-mix(in srgb,var(--color-accent) 11%,var(--color-surface));
    box-shadow:0 0 0 1px color-mix(in srgb,var(--color-accent) 16%,transparent),var(--shadow-md);}
  #tripb.home .tb-thead{background:transparent;}
  #tripb.home .tb-title .tnum{color:color-mix(in srgb,var(--color-accent-200,#c3bbec) 80%,var(--color-text));}
  #tripb.home .tb-title .twords b::after{content:" \\1F3E0";}
  #tripb.home .tb-tab.on{background:color-mix(in srgb,var(--color-accent) 22%,transparent);}
  #tripb.home.narrow .tb-thead{background:color-mix(in srgb,var(--color-accent) 11%,var(--color-surface));}
  #tripb.home .tb-reach,#tripb.home .tb-keepcap{color:color-mix(in srgb,var(--color-text) 74%,transparent);}
  /* One bubble per value tier, tinted by --gc: free at the top, all-paid at the bottom. */
  .tb-bub{display:flex;flex-direction:column;gap:2px;margin:0 -2px 8px;padding:5px 4px 5px;
    border-radius:14px;border:1px solid color-mix(in srgb,var(--gc) 26%,transparent);
    background:color-mix(in srgb,var(--gc) 7%,transparent);}
  .tb-grp{display:flex;flex-wrap:wrap;align-items:baseline;gap:3px 6px;padding:2px 6px 6px;}
  .tb-grp .gdot{flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:var(--gc);
    box-shadow:0 0 6px color-mix(in srgb,var(--gc) 60%,transparent);}
  .tb-grp .gl{flex:0 0 auto;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
    color:color-mix(in srgb,var(--gc) 78%,var(--color-text));}
  /* The subtitle IS the explanation of the tier, so it gets its own full-width line rather than being
     ellipsed away in a 300px rail ("one small payment, still …" told you nothing). */
  .tb-grp .gs{flex:1 1 100%;order:2;min-width:0;font-size:9.5px;letter-spacing:.02em;line-height:1.45;
    white-space:normal;color:color-mix(in srgb,var(--color-text) 44%,transparent);}
  .tb-grp .gn{flex:0 0 auto;margin-left:auto;font-size:9.5px;font-weight:700;font-variant-numeric:tabular-nums;
    padding:1px 6px;border-radius:8px;color:color-mix(in srgb,var(--gc) 85%,var(--color-text));
    background:color-mix(in srgb,var(--gc) 14%,transparent);}
  #tripb.narrow.railmin .tb-grp{display:none;}
  /* the folded-away pile: one line, not forty rows */
  .tb-badbar{display:flex;align-items:center;gap:9px;width:100%;margin:4px 0 2px;padding:9px 11px;
    border-radius:13px;cursor:pointer;font:inherit;text-align:left;color:var(--color-text);
    border:1px dashed color-mix(in srgb,var(--color-text) 18%,transparent);
    background:color-mix(in srgb,#000 16%,transparent);}
  .tb-badbar:hover{border-style:solid;border-color:color-mix(in srgb,var(--color-text) 32%,transparent);
    background:color-mix(in srgb,#000 26%,transparent);}
  .tb-badbar:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .tb-badbar .bb-n{flex:0 0 auto;min-width:26px;height:26px;padding:0 6px;border-radius:8px;
    display:grid;place-items:center;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;
    color:color-mix(in srgb,var(--color-text) 62%,transparent);
    border:1px solid color-mix(in srgb,var(--color-text) 20%,transparent);}
  .tb-badbar .bb-t{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;}
  .tb-badbar .bb-t b{font-size:12px;font-weight:500;
    color:color-mix(in srgb,var(--color-text) 78%,transparent);}
  .tb-badbar .bb-t small{font-size:9.5px;line-height:1.4;
    color:color-mix(in srgb,var(--color-text) 48%,transparent);}
  .tb-badbar .bb-c{flex:0 0 auto;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;
    color:color-mix(in srgb,var(--color-accent) 90%,var(--color-text));}
  .tb-grp .gx{margin-left:0;font:inherit;font-size:10px;padding:1px 7px;border-radius:7px;cursor:pointer;
    border:1px solid color-mix(in srgb,var(--color-text) 20%,transparent);background:none;
    color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .tb-grp .gx:hover{color:var(--color-text);border-color:color-mix(in srgb,var(--color-text) 40%,transparent);}
  .tb-nogood{font-size:10.5px;line-height:1.5;padding:6px 4px 2px;
    color:color-mix(in srgb,var(--color-text) 52%,transparent);}
  #tripb.narrow.railmin .tb-bub{border-color:transparent;background:none;margin-bottom:0;padding:0;}
  .tb-tabs{scroll-padding-bottom:58px;}
  /* ≤900px the plan rail becomes a bottom sheet. A full-height right rail is 300px of a 360px
     window — it simply covered the globe and the flight paths it was describing. */
  #tripb.narrow .tb-tabs{left:8px;right:8px;top:auto;bottom:8px;width:auto;}
  #tripb.narrow .tb-thead{position:sticky;top:-10px;z-index:2;padding-top:4px;margin-top:-4px;
    background:color-mix(in srgb,var(--color-surface) 97%,transparent);}
  #tripb.narrow .tb-stack{display:none;}
  #tripb.narrow.railmin .tb-comm,#tripb.narrow.railmin .tb-keepcap,
  #tripb.narrow.railmin .tb-trow:not(.cur){display:none;}
  #tripb.narrow.railmin .tb-stack{display:flex;}
  .tb-railmin{display:none;}
  #tripb.narrow .tb-railmin{display:flex;align-items:center;justify-content:center;flex:0 0 auto;
    width:32px;height:32px;border-radius:9px;font:inherit;font-size:13px;cursor:pointer;
    border:1px solid var(--color-divider);background:none;color:var(--color-text);}
  #tripb.narrow .tb-railmin:hover{border-color:var(--color-accent);}
  @media (max-width:1100px){ .tb-head .jm-cap{display:none;} }`;
document.head.appendChild(css);

const TB={sel:{},mode:"plan",step:1,starts:[],hub:null,plans:[],planIdx:0,home:null,trail:[],userView:null,rot:null,_drag:null,hubCard:false,pendingDest:null,_raf:0};
try{
  TB.starts=JSON.parse(localStorage.getItem("spacea.starts")||"null")||[];
  if(!TB.starts.length){ const old=localStorage.getItem("spacea.start"); if(old) TB.starts=[old]; }
}catch(e){}
window.__TB=TB;   // diagnostics handle
// 🏠 the launch-pad marker: a cozy sticker-house (gold walls, accent roof, glowing window,
// waving pennant) — replaces the old ⭐ so "home base" actually looks like one
const HB_SVG=`<svg viewBox="0 0 36 36" aria-hidden="true">
  <ellipse cx="18" cy="32.4" rx="10.5" ry="2.4" fill="rgba(240,195,60,.22)"/>
  <g class="hb-flag"><line x1="18" y1="7.6" x2="18" y2="2.2" stroke="#171a28" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M18 2.4 L24 4.1 L18 5.8 Z" fill="#FFD34D" stroke="#171a28" stroke-width="1.1" stroke-linejoin="round"/></g>
  <rect x="9.4" y="16.5" width="17.2" height="14.2" rx="2.8" fill="#E8B45B" stroke="#171a28" stroke-width="1.6"/>
  <path d="M6.2 18.2 L18 7.2 L29.8 18.2 Q30.8 19.2 29.6 19.9 L18.8 19.9 L6.4 19.9 Q5.2 19.2 6.2 18.2 Z" fill="#9184d9" stroke="#171a28" stroke-width="1.6" stroke-linejoin="round"/>
  <circle class="hb-win" cx="18" cy="24.6" r="3.4" fill="#FFE9A8" stroke="#171a28" stroke-width="1.4"/>
  <path d="M18 21.6 v6 M15 24.6 h6" stroke="#c99b45" stroke-width=".9"/>
</svg>`;
const saveStarts=()=>{ try{ localStorage.setItem("spacea.starts",JSON.stringify(TB.starts)); }catch(e){} };
const TB_XY={kelly:{lat:29.384,lon:-98.581},pittsburgh:{lat:40.491,lon:-80.233},whidbey:{lat:48.352,lon:-122.656},utapao:{lat:12.68,lon:101.005}};
const tbCoord=k=>{const t=TByKey[k]||G[k]||TB_XY[k];return t&&t.lat!=null?{lat:t.lat,lon:t.lon}:null;};
const TB_BKK={lat:13.69,lon:100.75};
const pCost=s=>{const m=String(s).replace(/,/g,"").match(/\$?(\d+)(?:[–-](\d+))?/);return m?[+m[1],+(m[2]||m[1])]:[0,0];};
const fCost=c=>c[0]>=c[1]?`$${c[0]}`:`$${c[0]}–${c[1]}`;
const commColor=c=>{const r=pCost(c),m=(r[0]+r[1])/2;return m<100?"#7EA6C7":m<=300?"#FBBF24":"#F97316";}; // price tiers: soft blue / amber / orange-red
// ── one-way economy airfare, calibrated against real 2026 fares (July) ──
// Calibrated one-way economy anchors (model output in brackets):
// BKK–CMB 2,380km $107–190 [$110–230] · BKK–MAD 10,400km $288–560 [$340–500] · BKK–SDQ 16,300km $740–1000 [$760–1120]
// SJU–POP 500km $111–317 (thin island market — 3× an Asian hop of the same length)
function fareMid(km,mult){
  const d=Math.max(0,km); let m;
  if(d<=250)        m=70+d*0.09;
  else if(d<=800)   m=93+(d-250)*0.075;
  else if(d<=1500)  m=134+(d-800)*0.030;
  else if(d<=4000)  m=155+(d-1500)*0.020;
  else if(d<=8000)  m=205+(d-4000)*0.024;
  else if(d<=12000) m=301+(d-8000)*0.038;
  else              m=453+(d-12000)*0.092;
  // the local market sets short-hop prices; on intercontinental trunks the big carriers do, and the
  // base curve is already calibrated on trunk anchors — so fade the market factor out by ~9,000 km
  const taper=Math.max(0.05,Math.min(1,1-Math.max(0,d-1500)/7500));
  return m*(1+((mult||1)-1)*taper);
}
// market factor — budget-carrier density vs thin island/regional routes
const FARE_MKT={
  "Thailand":0.7,"Vietnam":0.7,"Malaysia":0.7,"Indonesia":0.7,"Philippines":0.7,"Cambodia":0.7,
  "Japan":0.8,"South Korea":0.8,"Sri Lanka":0.8,"India":0.75,"China":0.8,"Taiwan":0.8,
  "Spain":0.75,"Portugal":0.75,"Italy":0.75,"Greece":0.75,"Germany":0.8,"United Kingdom":0.8,
  "Ireland":0.75,"Netherlands":0.8,"France":0.8,"Turkey":0.75,"Morocco":0.85,"Egypt":0.9,
  "United Arab Emirates":0.85,"Oman":0.95,"Bahrain":0.95,
  "Dominican Republic":1.5,"Puerto Rico":1.5,"Bahamas":1.5,"Aruba":1.45,"Jamaica":1.35,
  "Cuba":1.4,"Barbados":1.5,"Antigua and Barbuda":1.5,"Cape Verde":1.4,"Mauritius":1.35,
  "Tanzania":1.3,"Kenya":1.25,"Madagascar":1.4,"Seychelles":1.4,"Fiji":1.45,
  "French Polynesia":1.6,"New Caledonia":1.5,"Iceland":1.15,"Norway":1.05,"Australia":1.1,
  "New Zealand":1.05,"Brazil":1.2,"Peru":1.1,"Chile":1.1,"Canada":1.15
};
function fareMult(country){ return FARE_MKT[country]||1; }
function fareRange(km,mult){ const m=fareMid(km,mult);
  // thin regional markets swing wildly; trunk economy fares sit in a much narrower band
  const lo=km<1500?0.75:km<4000?0.80:km<9000?0.85:0.87;
  const hi=km<1500?1.9:km<4000?1.6:km<9000?1.5:1.28;
  return "$"+Math.round(m*lo/10)*10+"–"+Math.round(m*hi/10)*10; }
const havKm=(a,b)=>{const R2=Math.PI/180,x=(b.lat-a.lat)*R2,y=(b.lon-a.lon)*R2,h=Math.sin(x/2)**2+Math.cos(a.lat*R2)*Math.cos(b.lat*R2)*Math.sin(y/2)**2;return 12742*Math.asin(Math.sqrt(h));};
const legHrs=(A,B,comm)=>{ if(!A||!B) return 0; const nm=havKm(A,B)/1.852, h=nm/(comm?470:450)+0.75; return Math.max(0.5,Math.round(h*2)/2); };
const fH=h=>`${h%1?h.toFixed(1):h}h`;
const planHrs=pl=>pl.legs.reduce((n,l)=>n+legHrs(tbCoord(l.f),tbCoord(l.t),!!l.comm),0);
const planPct=p=>Math.round(p.prob*100);
const legSig=pl=>pl.legs.map(l=>l.f+">"+l.t+(l.comm?"$":"")).join("|");
const selKey=pl=>(TB.step===2?"h:":"o:")+legSig(pl);
function tbCountryOf(key){
  const L=(typeof SPOTS!=="undefined"?SPOTS:[]).filter(sp=>sp.g===key);
  return L.length?L[0].country:"";
}
// The NATION a terminal sits in. tbCountryOf answers a different question — "where do the spots this
// base serves live" — so it returned US states as separate countries (and "Vermont, USA" for McGuire,
// which is in New Jersey; that was Killington's country leaking through its gateway). Read the base's
// own location instead, and fold every US state into one USA.
const TB_US_TERR={"Guam":"USA","Puerto Rico":"USA","Hawaii":"USA","Alaska":"USA","DC":"USA"};
// A bare two-letter tail is only a US state if it IS one — "Kaiserslautern, DE" was being read as a
// state abbreviation and putting Ramstein in America.
const TB_US_ST=new Set(("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO "
  +"MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR GU VI AS MP").split(" "));
const TB_ISO2={DE:"Germany",IT:"Italy",ES:"Spain",GR:"Greece",UK:"United Kingdom",GB:"United Kingdom",
  JP:"Japan",KR:"South Korea",TR:"Turkey",PT:"Portugal",QA:"Qatar",BH:"Bahrain",KW:"Kuwait",
  AE:"UAE",HN:"Honduras",CU:"Cuba",SG:"Singapore",AU:"Australia",NL:"Netherlands",BE:"Belgium"};
function tbNationOf(key){
  const t=(typeof TByKey!=="undefined"&&TByKey[key])||null;
  const code=t&&t.code?String(t.code):"";
  const tail=(code.split(",").pop()||"").trim();
  // "DE" is Delaware and it is Germany. Two-letter tails are genuinely ambiguous, so let geography
  // decide rather than a lookup order: Ramstein sits at lon 7.6, which is not Delaware.
  const inUS=(()=>{
    if(!t||t.lat==null) return false;
    const la=t.lat, lo=t.lon;
    return (la>24&&la<50&&lo<-66&&lo>-125)      // CONUS
      ||(la>51&&la<72&&lo<-129&&lo>-172)        // Alaska
      ||(la>18&&la<23&&lo<-154&&lo>-161)        // Hawaii
      ||(la>13&&la<14&&lo>144&&lo<145.5)        // Guam
      ||(la>17&&la<19&&lo<-65&&lo>-68);         // Puerto Rico
  })();
  if(/^[A-Za-z]{2}$/.test(tail)){
    const up=tail.toUpperCase();
    if(inUS&&TB_US_ST.has(up)) return "USA";
    if(TB_ISO2[up]) return TB_ISO2[up];
    if(TB_US_ST.has(up)) return "USA";
  }
  if(TB_US_TERR[tail]) return TB_US_TERR[tail];
  if(/\bUSA?\b/.test(tail)) return "USA";
  if(/Azores/i.test(tail)) return "Portugal";
  if(/Okinawa/i.test(tail)) return "Japan";
  if(/^ROK$/i.test(tail)) return "South Korea";
  if(/^AUS$/i.test(tail)) return "Australia";
  if(tail) return tail;
  return inUS?"USA":(t&&t.name?t.name:"");
}
window.tbNationOf=tbNationOf;
window.tbCountryOf=tbCountryOf;
window.fareRange=fareRange; window.fareMult=fareMult; window.tbCoord=tbCoord; window.tbKm=havKm;
const planPaid=p=>p.legs.filter(l=>l.comm).reduce((a,l)=>[a[0]+pCost(l.cost)[0],a[1]+pCost(l.cost)[1]],[0,0]);

// plan search from ONE start; merged across starts in buildPlans()
function tbPaths(S,D,deep){
  if(!S||!D||S===D) return [];
  const DC=tbCoord(D); if(!DC) return [];
  const distD=k2=>{const c=tbCoord(k2);return c?havKm(c,DC):1e9;};
  const adj={}; JM_EDGES.forEach(e=>{ if(tbCoord(e.f)&&tbCoord(e.t)) (adj[e.f]=adj[e.f]||[]).push(e); });
  const out=[];
  // Every hop had to land strictly closer to D, and the walk stopped at 3 legs. Together those rules
  // deleted the whole eastward bridge: Yokota→Ramstein is ~9,300km, so Yokota→Travis (which starts by
  // flying 8,300km the "wrong" way) was rejected at its first leg — and that is the route Space-A
  // travellers actually fly to Europe from Asia.
  // A per-hop progress test can't express this, because the world is round: judge the WHOLE journey
  // instead. You may fly up to ~2.2x the direct distance, which fits a genuine circumnavigation
  // (Yokota→Travis→Dover→Ramstein is 18,500km against 9,300 direct) while still rejecting the loops
  // that relaxing the hop test produced (Kadena→Travis→Yokota→Ramstein, 26,600km).
  const legKm=e=>{const A=tbCoord(e.f),B=tbCoord(e.t);return (A&&B)?havKm(A,B):0;};
  // Voyage mode says the quiet part out loud: if you're happy to wait at each desk until something
  // flies, the journey doesn't have to be short OR direct. Six legs and 3.6x the direct distance is
  // room to cross three or four countries on the way — which is how these trips actually happen.
  const budget=distD(S)*(deep?3.2:2.2)+2000, MAXLEGS=deep?6:4, CAP=deep?1200:2500;
  // A distance budget alone does not bound this search. Six legs at 3.2x the direct distance is a
  // ~33,000km allowance for Souda, which is most of the way round the planet, so the tree is
  // effectively unbounded and the CAP on RESULTS never fires — the page locked up. Bound the WORK:
  // count node expansions and stop. The paths that matter are found early (best odds first is a
  // separate sort anyway), so a cap costs breadth on hopeless branches, not real routes.
  let work=0; const WORK=deep?120000:40000;
  (function walk(node,legs,prob,vis,km){
    if(node===D&&legs.length){ out.push({legs:legs.slice(),prob,hybrid:false,start:S}); return; }
    if(legs.length===MAXLEGS||out.length>CAP||++work>WORK) return;
    (adj[node]||[]).forEach(e=>{ if(vis.has(e.t)) return;
      const km2=km+legKm(e);
      if(km2+distD(e.t)>budget) return;   // this hop can no longer reach D inside the budget
      vis.add(e.t);
      legs.push(e); walk(e.t,legs,prob*(e.p/100),vis,km2); legs.pop(); vis.delete(e.t); });
  })(S,[],1,new Set([S]),0);
  const best={};
  (function walk2(node,legs,prob,vis,km){
    if(legs.length&&(!best[node]||best[node].prob<prob)) best[node]={legs:legs.slice(),prob};
    if(legs.length===3||++work>WORK*2) return;
    (adj[node]||[]).forEach(e=>{ if(vis.has(e.t)) return;
      const km2=km+legKm(e);
      if(km2+distD(e.t)>budget) return;   // same journey budget for the paid hand-off
      vis.add(e.t);
      legs.push(e); walk2(e.t,legs,prob*(e.p/100),vis,km2); legs.pop(); vis.delete(e.t); });
  })(S,[],1,new Set([S]),0);
  Object.entries(best).forEach(([X,b])=>{
    if(X===D||b.prob<0.12) return;
    out.push({legs:b.legs.concat([{f:X,t:D,p:100,comm:true,cost:jmBackup(X,D)}]),prob:b.prob,hybrid:true,start:S});
  });
  JM_EDGES.forEach(e=>{ // paid feeder first, free finish — e.g. Charleston –$→ Travis –80% free→ Yokota
    if(e.t!==D||e.f===S||e.p<30||!tbCoord(e.f)) return;
    out.push({legs:[{f:S,t:e.f,p:100,comm:true,cost:jmBackup(S,e.f)},Object.assign({},e)],prob:e.p/100,hybrid:true,start:S});
  });
  if(!out.length) out.push({legs:[{f:S,t:D,p:100,comm:true,cost:jmBackup(S,D)}],prob:1,hybrid:true,allPaid:true,start:S});
  return out;
}
// Order the plans the way you'd actually choose one. The old rank put every all-free plan above every
// hybrid REGARDLESS of odds, which is why a 9% long shot sat above an 80% plan. Odds lead now:
//   1· all-paid fallbacks always last          2· odds band — good, then coin-flip, then long shot
//   3· fewer hours in the air first             4· then cheaper all-in       5· then higher odds
const oddsBand=p=>{const v=Math.round((p||0)*100); return v>=50?0:v>=25?1:2;};
const planCost=pl=>{const c=planPaid(pl); return (c[0]+c[1])/2;};
const planRank=(a,b)=>
  (a.allPaid?1:0)-(b.allPaid?1:0)
  || oddsBand(a.prob)-oddsBand(b.prob)
  || planHrs(a)-planHrs(b)
  || planCost(a)-planCost(b)
  || b.prob-a.prob;
function buildPlans(D,shallow){
  const rank=planRank;
  // Board mode ranks DESTINATIONS — one buildPlans() per candidate — so honouring TB.voyage there ran
  // the 6-leg deep search dozens of times and froze the thread for ~0.6s on any launch-pad click. It
  // only needs the best way to each place, not every multi-country epic, so it asks for shallow.
  const deep=!shallow&&!!TB.voyage;
  const byStart=TB.starts.filter(S=>S!==D).map(S=>tbPaths(S,D,deep).sort(rank));
  const seen=new Set();
  const uniq=p=>{ const sig=p.start+"|"+p.legs.map(l=>l.f+">"+l.t+(l.comm?"$":"")).join("|"); if(seen.has(sig)) return false; seen.add(sig); return true; };
  // per-start diversity: every start's best plan makes the list first, then ALL remaining plans by rank
  const firsts=byStart.map(list=>list[0]).filter(Boolean).sort(rank).filter(uniq);
  const rest=byStart.flatMap(list=>list.slice(1)).sort(rank).filter(uniq);
  // A quota, not a partition. Putting EVERY zero-cost plan ahead of every paid one starved 13
  // destinations of their best route: for Hill, an 80%-odds "free to Travis, buy the short hop"
  // hybrid was displaced by an 11%-odds all-free chain, and the panel then claimed nothing good
  // existed. Reserve room for the free long-haul routes this search exists to surface, then fill the
  // rest strictly by rank, so a 5% four-legger can never outrank an 80% hybrid.
  const FREE_QUOTA=deep?24:15, CAP=deep?90:60;
  const ordered=firsts.concat(rest);
  // Dominance pruning. Eight pads generate permutation spam — osan→yokota→travis→jblm→northisland is
  // the same trip as osan→yokota→travis→northisland with an extra hop, worse odds, more hours and the
  // same money. A plan stays only if no same-start plan beats-or-ties it on odds, hours, own-leg cost
  // AND hop count (one strictly better). North Island: 63 "almost free" rows → the ~20 real offers.
  const ownMid=p=>{const c=planPaid(p);return (c[0]+c[1])/2;};
  const alive=ordered.filter(P=>!ordered.some(Q=>{
    if(Q===P||Q.start!==P.start) return false;
    const ge=Q.prob>=P.prob&&planHrs(Q)<=planHrs(P)&&ownMid(Q)<=ownMid(P)&&Q.legs.length<=P.legs.length;
    const gt=Q.prob>P.prob||planHrs(Q)<planHrs(P)||ownMid(Q)<ownMid(P)||Q.legs.length<P.legs.length;
    return ge&&gt;
  }));
  const keep=alive.filter(p=>!p.legs.some(l=>l.comm)).slice(0,FREE_QUOTA);
  const kept=new Set(keep);
  const filler=alive.filter(p=>!kept.has(p)).sort(rank);
  return keep.concat(filler).slice(0,CAP);
}

// ✨ ROUTE BOARD — every destination worth flying to from your HQ, best plan each
function hqPoint(){
  try{ const hq=JSON.parse(localStorage.getItem("spacea.hq")||"null");
    if(hq&&hq.lat!=null) return {lat:hq.lat,lon:hq.lon,n:String(hq.n).split(",")[0]}; }catch(e){}
  try{ return (localStorage.getItem("spacea.home.city")==="col")
    ?{lat:39.86,lon:-104.67,n:"Denver"}:{lat:13.69,lon:100.75,n:"Bangkok"}; }catch(e){}
  return {lat:13.69,lon:100.75,n:"Bangkok"};
}
function boardRoutes(all){
  const hm=hqPoint();
  const gate=(typeof window.usGate==="function")?window.usGate():{cleared:true,label:""};
  const pM=(A,B,c)=>fareMid(havKm(A,B),fareMult(c));
  const month=new Date().getMonth();
  // a base only earns a row if you can actually RIDE somewhere from it
  const rides={};
  (typeof SPOTS!=="undefined"?SPOTS:[]).forEach(sp=>{
    if(!sp.g) return;
    let inSeason=true;
    try{ if(typeof goldenFor==="function") inSeason=(goldenFor(sp).m||[]).indexOf(month)>=0; }catch(e){}
    const cur=rides[sp.g];
    if(!cur||(inSeason&&!cur.inSeason)) rides[sp.g]={sp,inSeason,n:(cur?cur.n:0)+1};
    else cur.n++;
  });
  const ICON={kite:"🪁",snow:"🏂",snowkite:"🪁❄️"};
  const rows=[];
  Object.keys(rides).forEach(D=>{
    if(TB.starts.indexOf(D)>=0) return;
    const C=tbCoord(D); if(!C) return;
    const pls=buildPlans(D,true); if(!pls.length) return;   // shallow: this is a destination ranking
    // "all" also keeps the quick paid hops — every way there, not just the ways worth flying
    const pl=pls.filter(p=>!p.allPaid)[0]||(all?pls[0]:null); if(!pl) return;
    if(!gate.cleared&&typeof window.planTouchesUsSoil==="function"
      &&window.planTouchesUsSoil(pl.legs.concat([{f:pl.start,t:pl.start}]))) return;
    const r=rides[D], SP=r.sp;
    // measure the whole door-to-beach trip, same as the guide: chain + the local hop to the sand
    const beach=(SP.lat!=null&&SP.lon!=null)?{lat:SP.lat,lon:SP.lon}:C;
    const tailKm=havKm(C,beach), tailMid=tailKm>200?fareMid(tailKm,fareMult(SP.country)):0;
    const paid=planPaid(pl), mid=(paid[0]+paid[1])/2+tailMid, air=pM(hm,beach,SP.country);
    if(!all&&mid>=air*0.8) return;             // no real saving → not common sense
    const pct=planPct(pl); if(!all&&pct<25) return;  // long-shot odds → skip
    rows.push({k:D,pl,pct,hrs:planHrs(pl),paid,save:Math.max(0,Math.round((air-mid)/10)*10),
      free:!paid[1]&&!tailMid,alt:pls.length,
      spot:r.sp.name,act:ICON[r.sp.act]||"🪁",inSeason:r.inSeason,spots:r.n});
  });
  rows.sort((a,b)=>(b.inSeason?1:0)-(a.inSeason?1:0)||b.save-a.save||b.pct-a.pct);
  return {rows:all?rows:rows.slice(0,16),hm};
}
// the honest cost of getting to a base: what the best real plan actually charges
function boardShape(all){
  if(!TB.starts.length){ try{ TB.starts=JSON.parse(localStorage.getItem("spacea.starts")||"null")||[]; }catch(e){}
    if(!TB.starts.length){ try{ TB.starts=JSON.parse(localStorage.getItem("spacea.hqstarts")||"null")||[]; }catch(e){} } }
  if(!TB.starts.length) return {rows:[],starts:[]};
  const b=boardRoutes(all);
  return {rows:b.rows.map(r=>({key:r.k,spot:r.spot,act:r.act,pct:r.pct,hrs:r.hrs,save:r.save,
    free:r.free,inSeason:r.inSeason,alt:r.alt,start:r.pl.start,hm:b.hm,
    legs:r.pl.legs.map(l=>({f:l.f,t:l.t,paid:!!l.comm,cost:l.cost,p:l.p,
      h:legHrs(tbCoord(l.f),tbCoord(l.t),!!l.comm)}))})),starts:TB.starts.slice()};
}
window.tbBoardRows=function(){ return boardShape(false); };   // the ways worth flying
window.tbAllRows=function(){ return boardShape(true); };      // every way, paid quick hops included
window.tbRouteCost=function(D){
  if(!TB.starts.length){ try{ TB.starts=JSON.parse(localStorage.getItem("spacea.starts")||"null")||[]; }catch(e){}
    if(!TB.starts.length){ try{ TB.starts=JSON.parse(localStorage.getItem("spacea.hqstarts")||"null")||[]; }catch(e){} } }
  if(!TB.starts.length||!tbCoord(D)) return null;
  const pls=buildPlans(D); if(!pls.length) return null;
  const pl=pls.filter(p=>!p.allPaid)[0]||pls[0];
  const paid=planPaid(pl);
  return {paid,hrs:planHrs(pl),pct:pl.allPaid?null:planPct(pl),allPaid:!!pl.allPaid,
    start:pl.start,hops:pl.legs.length};
};
window.openRouteBoard=function(){
  let el=$("tripb");
  if(!el){ el=document.createElement("div"); el.id="tripb"; document.body.appendChild(el);
    addEventListener("resize",()=>{ if(el.classList.contains("show")) tbRender(); });
    document.addEventListener("visibilitychange",()=>el.classList.toggle("tb-paused",document.hidden)); }
  if(!TB.starts.length){ try{ TB.starts=JSON.parse(localStorage.getItem("spacea.starts")||"null")||[]; }catch(e){}
    if(!TB.starts.length){ try{ const s2=JSON.parse(localStorage.getItem("spacea.hqstarts")||"null"); if(s2) TB.starts=s2; }catch(e){} } }
  el.classList.add("show");
  if(!TB.starts.length){ TB.board=false; TB.mode="pickStart"; tbRender(); return; }
  TB.board=true; TB.boardHover=null; TB.mode="plan"; TB.step=1; TB.hub=null; TB.plans=[]; TB.boardFrom=null;
  TB.trail=[]; TB.userView=null; TB.hubCard=false; TB.pickDest=false;
  tbRender();
};
function tbRender(){
  const el=$("tripb"); if(!el) return;
  cancelAnimationFrame(TB._raf);
  const W3=innerWidth,H3=innerHeight;
  const proj=d3.geoOrthographic().clipAngle(90);   // the same globe as the map page, on every view
  const pick=TB.mode==="pickStart", payoff=TB.step===3;
  // Resolve the picked plan by SIGNATURE, not by index: the plan list re-sorts TB.plans in place
  // further down this same render, so an index read here went stale — the ⭐ drawn as "the active
  // start" then disagreed with the row the list highlighted.
  const planOut=(!pick&&TB.plans.length)
    ?((TB.outSig&&TB.plans.find(pl=>legSig(pl)===TB.outSig))||TB.plans[Math.min(TB.planIdx,TB.plans.length-1)])
    :null;
  if(planOut){ const pi=TB.plans.indexOf(planOut); if(pi>=0) TB.planIdx=pi; }
  const activeStart=planOut?planOut.start:(TB.starts[0]||null);
  // 🏠 the way HOME = plans BACK to your ⭐ start — same engine, reversed
  const homePlans=(!pick&&TB.step>=2&&activeStart&&TB.hub&&TB.hub!==activeStart)?(()=>{const seen=new Set();
    return tbPaths(TB.hub,activeStart).filter(p=>{const sig=p.legs.map(l=>l.f+">"+l.t+(l.comm?"$":"")).join("|");if(seen.has(sig))return false;seen.add(sig);return true;})
      .sort(planRank).slice(0,40);})():[];
  const plan2=homePlans.length
    ?((TB.homeSig&&homePlans.find(pl=>legSig(pl)===TB.homeSig))||homePlans[Math.min(TB.homeIdx||0,homePlans.length-1)])
    :null;
  if(plan2){ const hi=homePlans.indexOf(plan2); if(hi>=0) TB.homeIdx=hi; }
  const plan=TB.step===2?plan2:planOut;
  // If the ACTIVE plan changed since the view was last framed (re-sort, default pick — anything that
  // swaps the highlighted way without a click), drop any hand zoom/spin so the new path is framed
  // whole. A zoom made while the SAME plan stays active is untouched — the signature hasn't moved.
  if(!pick&&!TB.board&&plan){ const sg=legSig(plan)+"@"+TB.step;
    if(TB._frameSig!==sg){ TB._frameSig=sg; TB.userView=null; TB.rot=null; TB._drag=null; } }
  // US-soil gate (Montana's visa) — read once, used by the map and the plan list below
  const gate=(typeof window.usGate==="function")?window.usGate():{cleared:true,label:""};
  const usBlocked=pl=>!gate.cleared&&typeof window.planTouchesUsSoil==="function"
    &&window.planTouchesUsSoil(pl.legs.concat([{f:pl.start,t:pl.start}]));
  // publish the picked trip for the guided checklist (checklist.js)
  if(planOut&&activeStart){
    window.SPACEA_TRIP={start:activeStart,hub:TB.hub,
      planLetter:"ABCDEFGH"[TB.planIdx]||String(TB.planIdx+1),
      out:planOut.legs.map(l=>({f:l.f,t:l.t,comm:!!l.comm,cost:l.cost,p:l.p})),
      home:plan2?plan2.legs.map(l=>({f:l.f,t:l.t,comm:!!l.comm,cost:l.cost,p:l.p})):[],
      pctOut:planOut.allPaid?null:planPct(planOut),
      pctHome:(plan2&&!plan2.allPaid)?planPct(plan2):null,
      hrs:Math.round((planHrs(planOut)+(plan2?planHrs(plan2):0))*10)/10};
  }
  // Center so the WHOLE path lands on the face you're looking at. A mean of longitudes doesn't do
  // that — one long leg drags the average and the far end slips over the limb. Solve the smallest
  // enclosing cap instead (1-center: start at the vector mean, then walk repeatedly toward whichever
  // stop is currently farthest), which is the single rotation that shows as much of the plan as the
  // sphere can hold. A hand-spun rotation still wins — that's the `!TB.rot` gate.
  const BOARD=TB.board?boardRoutes():null;
  // Hovering a row on the ways-out board is a request to LOOK at that route. Board mode fits one cap
  // over all sixteen at once, so without re-centring the hovered one usually sits on the far side of
  // the horizon and clips to a few stray pixels — Maui drew literally nothing. Frame the hovered route
  // alone, and let it beat a hand-spun rotation: you asked to see this one.
  const hoverRow=(BOARD&&TB.boardHover)?BOARD.rows.find(r=>r.k===TB.boardHover):null;
  {
    const pts=[];
    if(!pick){
      if(hoverRow){
        hoverRow.pl.legs.forEach(l=>{ const A=tbCoord(l.f),B=tbCoord(l.t); if(A&&B){ pts.push(A,B); } });
      } else {
        // Step 2 asks ONE question — "which way home?" — so frame that path ALONE. Folding the
        // outbound plan into the same cap dragged the centre toward the outbound corridor and pushed
        // the home path's far end to the limb or under the plan rail. Step 3 shows the whole trip.
        const capPlans=TB.step===2?(plan2?[plan2]:[planOut]):(TB.step>=3?[planOut,plan2]:[planOut]);
        capPlans.forEach(pl=>{ if(!pl) return;
          pl.legs.forEach(l=>{ const A=tbCoord(l.f),B=tbCoord(l.t); if(A&&B){ pts.push(A,B); } }); });
      }
    }
    if(pts.length&&(!TB.rot||hoverRow)){
      const R=Math.PI/180;
      const norm=a=>{ const m=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/m,a[1]/m,a[2]/m]; };
      const vs=pts.map(p=>{ const la=p.lat*R, lo=p.lon*R;
        return [Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)]; });
      let c=norm(vs.reduce((a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],[0,0,0]));
      if(!isFinite(c[0])) c=vs[0].slice();
      for(let i=0;i<80;i++){
        let worst=vs[0], wdot=2;
        for(const p of vs){ const d=c[0]*p[0]+c[1]*p[1]+c[2]*p[2]; if(d<wdot){ wdot=d; worst=p; } }
        const step=0.5/(i+1);   // shrinking walk → converges on the cap centre
        c=norm([c[0]+(worst[0]-c[0])*step,c[1]+(worst[1]-c[1])*step,c[2]+(worst[2]-c[2])*step]);
      }
      const clat=Math.max(-72,Math.min(72,Math.asin(Math.max(-1,Math.min(1,c[2])))/R));
      proj.rotate([-Math.atan2(c[1],c[0])/R,-clat]);
    }
  }
  if(TB.rot&&!hoverRow) proj.rotate(TB.rot.slice());
  // Fit the sphere to the space actually LEFT OVER: the plan list holds the right rail and the journey
  // strip the bottom, so a path centred on the raw viewport ended up half-buried under chrome.
  // ≤900px there is no room for a rail — the list drops to a bottom sheet, so the reserve is height.
  const narrow=W3<=900;
  const railW=(W3>900&&!pick)?300:0, stripH=pick?76:132;
  // the checklist dock (body.chk-open) shoves the rail LEFT by --chkw — the occluded right zone
  // must follow the rail's real position, not the 300px constant
  const chkW=(railW&&document.body.classList.contains("chk-open"))?((parseInt(getComputedStyle(document.body).getPropertyValue("--chkw"))||300)+16):0;
  const railRes=railW?railW+14+chkW:0;
  // the sheet's real height is measured after render and cached per mode, so the globe fits the gap
  const sheetKey=TB.railMin?"_shMin":"_shOpen";
  const sheetH=(narrow&&!pick)?((TB[sheetKey]||(TB.railMin?210:Math.round(H3*0.44)))+16):0;
  const botRes=Math.min(Math.max(60,H3-190),(narrow&&!pick)?sheetH:stripH);
  proj.fitExtent([[10,50],[W3-10-railRes,H3-botRes]],{type:"Sphere"});
  // Rotating to face the route isn't enough on its own: a short hop like Dover→Norfolk is a handful of
  // pixels at whole-globe scale. Zoom to the hovered route too, capped so a single-city-pair route
  // can't blow the sphere up past any useful size.
  if(hoverRow){
    const coords=[];
    hoverRow.pl.legs.forEach(l=>{ const A=tbCoord(l.f),B=tbCoord(l.t);
      if(A&&B) coords.push([A.lon,A.lat],[B.lon,B.lat]); });
    if(coords.length>1){
      const sphereS=proj.scale();
      const x0=40, y0=86, x1=W3-40-railRes, y1=H3-botRes-30;
      if(x1>x0+80&&y1>y0+80){
        proj.fitExtent([[x0,y0],[x1,y1]],{type:"LineString",coordinates:coords});
        const maxS=sphereS*9;   // 3.4x still left Dover→Norfolk at 12px; short hops need real zoom
        if(proj.scale()>maxS){                       // scale about the centre of the fitted box
          const t=proj.translate(), s=proj.scale(), k=maxS/s;
          const cx=(x0+x1)/2, cy=(y0+y1)/2;
          proj.scale(maxS).translate([cx+(t[0]-cx)*k, cy+(t[1]-cy)*k]);
        }
      }
    }
  }
  const gp=d3.geoPath(proj);
  // clipAngle only clips PATH streams — proj([lon,lat]) still returns a point for the far side, which
  // folds onto the visible disc. Test every pin the same way the map page does.
  const rotNow=proj.rotate();
  const front=(lon,lat)=>d3.geoDistance([lon,lat],[-rotNow[0],-rotNow[1]])<1.5507;
  const hiddenStops=[];
  const line=(A,B)=>({type:"LineString",coordinates:[[A.lon,A.lat],[B.lon,B.lat]]});
  let drawLegs=[];
  if(BOARD){
    // Hovering a row answers "which line on the globe is THIS one?" — sixteen routes drawn at once is a
    // thicket. The hovered route lights and flies a plane; every other route drops to the dim web.
    const hk=TB.boardHover;
    BOARD.rows.forEach((r,i)=>{
      const hot=hk?(r.k===hk):(i<3);
      const quiet=hk?(r.k!==hk):(i>=8);
      r.pl.legs.forEach(l=>drawLegs.push({A:tbCoord(l.f),B:tbCoord(l.t),
        p:l.p,comm:!!l.comm,cost:l.cost,glow:hot,plane:hot,dim:quiet}));
    });
  }
  const liveBlocked=plan&&!gate.cleared&&typeof window.planTouchesUsSoil==="function"
    &&window.planTouchesUsSoil(plan.legs);
  if(plan&&!payoff){
    // ghost every other ticked way so you can see your whole shortlist at once
    const tp=TB.step===2?homePlans:TB.plans, ti=TB.step===2?(TB.homeIdx||0):TB.planIdx;
    tp.forEach((pl2,i2)=>{ if(i2===ti||!TB.sel[selKey(pl2)]) return;
      pl2.legs.forEach(l=>drawLegs.push({A:tbCoord(l.f),B:tbCoord(l.t),p:l.p,comm:!!l.comm,cost:l.cost,dim:true})); });
    drawLegs=drawLegs.concat(plan.legs.map(l=>({A:tbCoord(l.f),B:tbCoord(l.t),p:l.p,comm:!!l.comm,cost:l.cost,
      glow:!liveBlocked,plane:!liveBlocked,dim:liveBlocked})));
  }
  if(payoff){
    drawLegs=(planOut||{legs:[]}).legs.map(l=>({A:tbCoord(l.f),B:tbCoord(l.t),p:l.p,comm:!!l.comm,cost:l.cost,glow:true,plane:true}))
      .concat((plan2||{legs:[]}).legs.map(l=>({A:tbCoord(l.f),B:tbCoord(l.t),p:l.p,comm:!!l.comm,cost:l.cost,glow:true,plane:true})));
  }
  let k=1,tx=0,ty=0; // whole-world view always — no auto-zoom (user asked); pan/zoom stays manual
  if(TB.userView){ k=TB.userView.k; tx=TB.userView.tx; ty=TB.userView.ty; }
  const T=p=>[k*p[0]+tx,k*p[1]+ty];
  // The header note catches stops on the FAR SIDE of the globe; this catches the nearer failure —
  // a stop that is front-side but pushed off-screen or under the rail by a hand zoom/pan, which
  // silently cut the picked way's path. One tap brings the whole path back.
  let clipped=false;
  if(!pick&&!payoff&&!TB.board&&plan&&(TB.userView||TB.rot)){
    const vx0=6,vy0=52,vx1=narrow?W3-6:W3-railRes-6,vy1=H3-botRes+24;
    [plan.start].concat(plan.legs.map(l=>l.t)).forEach(kk=>{ const c=tbCoord(kk); if(!c) return;
      if(!front(c.lon,c.lat)){ clipped=true; return; }
      const p=T(proj([c.lon,c.lat]));
      if(p[0]<vx0||p[0]>vx1||p[1]<vy0||p[1]>vy1) clipped=true; });
  }
  const tbGrads=`<radialGradient id="tbOcean" cx="38%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#1a2138"></stop><stop offset="65%" stop-color="#12172a"></stop>
      <stop offset="100%" stop-color="#1e3050"></stop></radialGradient>
    <radialGradient id="tbAtmo">
      <stop offset="74%" stop-color="rgba(130,160,255,0)"></stop>
      <stop offset="90%" stop-color="rgba(135,165,255,.16)"></stop>
      <stop offset="100%" stop-color="rgba(150,185,255,0)"></stop></radialGradient>`;
  let defs=`<defs>${tbGrads}${[["g","#34D399"],["y","#FBBF24"],["r","#FF4D4D"],["c","#7EA6C7"],["o","#F97316"]].map(([id,c])=>
    `<marker id="tbm${id}" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="${(8/k).toFixed(2)}" markerHeight="${(8/k).toFixed(2)}" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0.5,0.8L9.5,5L0.5,9.2L2.6,5Z" fill="${c}"></path></marker>`).join("")}`;
  const sph=proj.translate(), sr=proj.scale();
  let svg=`<circle class="tb-atmo" cx="${sph[0]}" cy="${sph[1]}" r="${sr*1.085}" fill="url(#tbAtmo)" pointer-events="none"></circle>
    <path d="${gp({type:"Sphere"})}" fill="url(#tbOcean)" stroke="color-mix(in srgb,var(--color-accent) 28%,transparent)" stroke-width="${1/k}"></path>
    <path d="${gp(d3.geoGraticule().step([30,30])())||""}" fill="none" stroke="color-mix(in srgb,var(--color-text) 7%,transparent)" stroke-width="${0.5/k}"></path>
    ${typeof landFeat!=="undefined"&&landFeat?`<path d="${gp(landFeat)}" fill="#232739" stroke="color-mix(in srgb,var(--color-accent) 26%,#3a4058)" stroke-width="${0.7/k}"></path>`:""}`;
  drawLegs.forEach((l,i)=>{
    if(!l.A||!l.B) return;
    const d=gp(line(l.A,l.B)); if(!d) return;
    const col=l.comm?commColor(l.cost):"#34D399"; // free military hop = always green; paid legs keep price colors
    const m=l.comm?(col==="#7EA6C7"?"c":col==="#FBBF24"?"y":"o"):"g";
    const pa=proj([l.A.lon,l.A.lat]), pb=proj([l.B.lon,l.B.lat]);
    defs+=`<linearGradient id="tbg${i}" gradientUnits="userSpaceOnUse" x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}"><stop offset="0" stop-color="${col}" stop-opacity=".14"></stop><stop offset=".45" stop-color="${col}" stop-opacity=".72"></stop><stop offset="1" stop-color="${col}" stop-opacity=".98"></stop></linearGradient>`;
    // every width divides by k, so the ribbon keeps the same delicate weight at any zoom
    const w=(l.comm?1.7:(2.1+l.p/100*2.3))/k;
    const dim=l.dim?0.14:1;
    const ds=(a,b)=>`stroke-dasharray="${(a/k).toFixed(2)} ${(b/k).toFixed(2)}"`;
    if(l.glow&&!l.comm){
      svg+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${w*3.4}" stroke-linecap="round" opacity="${0.09*dim}" style="filter:blur(${(3/k).toFixed(2)}px)"></path>`;
      svg+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${w*1.8}" stroke-linecap="round" opacity="${0.16*dim}" style="filter:blur(${(1.2/k).toFixed(2)}px)"></path>`;
    }
    svg+=`<path d="${d}" fill="none" stroke="url(#tbg${i})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${dim}" ${l.comm?ds(6,5):""} marker-end="url(#tbm${m})" ${l.plane?`data-plane="1" data-pcol="${col}"`:""}></path>`;
    if(l.glow&&!l.comm) svg+=`<path class="tb-flow" d="${d}" fill="none" stroke="${col}" stroke-width="${w*0.7}" stroke-linecap="round" ${ds(1.6,11)} opacity="${0.9*dim}" style="--fo:${(-25/k).toFixed(2)}px"></path>`;
    // little joint beads so the stops still read as stops when you zoom right in
    [pa,pb].forEach(pt=>{ svg+=`<circle cx="${pt[0]}" cy="${pt[1]}" r="${(w*0.9).toFixed(2)}" fill="var(--color-bg)" stroke="${col}" stroke-width="${(w*0.42).toFixed(2)}" opacity="${0.9*dim}"></circle>`; });
    if(l.k) svg+=`<path d="${d}" fill="none" stroke="transparent" stroke-width="${16/Math.sqrt(k)}" data-arc="${l.k}" style="pointer-events:stroke;cursor:pointer"></path>`;
  });
  defs+="</defs>";
  // pins + hubs
  let pins="",leaders="";
  const placed=[{x:W3-286,y:60,w:276,h:Math.min(H3-260,440)}];
  const pushHub=(c,name,pulse,icon,clickable,gold,dim,glowCol,dy,key)=>{ if(!c) return;
    if(!front(c.lon,c.lat)){ if(name) hiddenStops.push(String(name).replace(/ \(start\)$/,"")); return; }
    const p=T(proj([c.lon,c.lat]));
    const oy=dy||0;
    let hx=p[0], hy=p[1]+oy, noName=false, hidden=false;
    if(dim){ // dimmed hubs declutter against already-placed hubs: shift → icon-only → hide
      const box=(x,y,w,h)=>({x:x-w/2,y:y-h/2,w,h});
      const coll=r=>placed.some(o=>r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y);
      let tries=0;
      while(coll(box(hx,hy,144,62))&&tries<8){
        const a2=(mkHash(name||"x")%8)*(Math.PI/4)+tries*(Math.PI/4);
        hx=p[0]+(24+10*tries)*Math.cos(a2); hy=p[1]+oy+(24+10*tries)*Math.sin(a2); tries++;
      }
      if(coll(box(hx,hy,144,62))){ noName=true; hx=p[0]; hy=p[1]+oy;
        if(coll(box(hx,hy,40,40))) hidden=true; }
      if(hidden) return;
      if(Math.hypot(hx-p[0],hy-(p[1]+oy))>14) leaders+=`<line x1="${p[0]}" y1="${p[1]+oy}" x2="${hx}" y2="${hy}" stroke="color-mix(in srgb,var(--color-text) 38%,transparent)" stroke-width="1"></line>`;
    }
    placed.push(noName?{x:hx-20,y:hy-20,w:40,h:40}:{x:hx-72,y:hy-28,w:144,h:62});
    const hk=(name||"").length+(gold?7:0);
    const bd=(3.2+((mkHash(name||"x")%18)/10)).toFixed(1), bp=(-(mkHash(name||"x")%47)/10).toFixed(1); // per-marker phase/duration — stable, desynced
    pins+=`<div class="tb-hub${pulse?" pulse":""}${dim?" dimstart":""}"${clickable?' data-hub="1"':""}${key?` data-hubkey="${key}" tabindex="0" role="button"`:""} title="${name}" style="left:${hx}px;top:${hy}px">
      <div class="tb-fl" style="--bd:${bd}s;--bp:${bp}s"><div class="he${gold?" gold":""}">${icon}</div></div>
      ${dim?"":`<div class="tb-gl" style="--bd:${bd}s;--bp:${bp}s${glowCol?`;--glc:${glowCol}`:""}"></div>`}
      <div class="hn" style="${gold?"font-size:13px;":""}${noName?"display:none;":""}">${name}</div></div>`; };
  if(pick){ /* no hubs in pick mode */ }
  else if(payoff){
    pushHub(tbCoord(activeStart),jmName(activeStart),false,HB_SVG,false,true,false,"rgba(240,195,60,.55)",26,activeStart);
    if(TB.hub!==activeStart) pushHub(tbCoord(TB.hub),jmName(TB.hub),false,"✈️",false,false,false,planOut?`color-mix(in srgb,${jmBand(planPct(planOut))} 55%,transparent)`:null,0,TB.hub);
  } else {
    if(activeStart) pushHub(tbCoord(activeStart),jmName(activeStart)+" (start)",true,HB_SVG,false,true,false,"rgba(240,195,60,.55)",0,activeStart);
    if(TB.hub&&TB.hub!==activeStart) pushHub(tbCoord(TB.hub),jmName(TB.hub),false,"✈️",TB.step===1,false,false,plan?`color-mix(in srgb,${jmBand(planPct(plan))} 55%,transparent)`:null,0,TB.hub);
    const planStarts=TB.step===1?[...new Set(TB.plans.map(pl=>pl.start))]:[];
    const selNodes=new Set(plan?[plan.start].concat(plan.legs.map(l=>l.t)).concat(plan.legs.map(l=>l.f)):[]);
    planStarts.forEach(S=>{ if(S===activeStart||selNodes.has(S)) return; // a start that's already a node of this plan is labeled by its via pin
      pushHub(tbCoord(S),jmName(S),false,HB_SVG,false,true,true,null,0,S); });
  }
  // pin items
  let items=[];
  if(pick){
    items=TERMS.filter(t=>PRIMARY.has(t.key)||TB.starts.includes(t.key)).map(t=>({k:t.key,label:(TB.starts.includes(t.key)?"⭐ ":"")+t.name,p:null,on:false}));
  } else if(TB.step===1&&!plan){
    // no plan yet (or you tapped one of your own ⭐ starts): show every base as a tappable pin so you can pick a destination
    items=TERMS.filter(t=>PRIMARY.has(t.key)||TB.starts.includes(t.key)).map(t=>({k:t.key,label:(TB.starts.includes(t.key)?"⭐ ":"")+t.name,p:null,on:false,dim:TB.starts.includes(t.key)}));
  } else if(plan){
    const endNode=TB.step===2?activeStart:TB.hub;
    const planNodes=new Set([plan.start,endNode]);
    plan.legs.forEach(l=>{planNodes.add(l.f);planNodes.add(l.t);});
    plan.legs.forEach((l,li)=>{ if(l.t!==endNode) items.push({k:l.t,label:jmName(l.t),p:l.p,on:true,via:true,
      last:li===plan.legs.length-1,
      comm:!!l.comm,cost:l.cost,hrs:legHrs(tbCoord(l.f),tbCoord(l.t),!!l.comm)}); });
    // arc mid-label ONLY where no pin already carries the leg (the last hop into the destination) —
    // a via pin shows the same "80% chance of boarding · Free · ~10.5h", so two labels would repeat
    plan.legs.forEach((l,li)=>{
      if(l.t!==endNode) return;
      const A=tbCoord(l.f),B=tbCoord(l.t); if(!A||!B) return;
      const ip=d3.geoInterpolate([A.lon,A.lat],[B.lon,B.lat]);
      items.push({k:"arc_"+li,label:"",p:l.comm?null:l.p,on:false,arc:true,comm:!!l.comm,cost:l.cost,
        hrs:legHrs(A,B,!!l.comm),mid:ip(0.5),alts:[ip(0.35),ip(0.65),ip(0.25),ip(0.75)],noPin:true,
        txt:(l.comm?`✈️ buy a ticket ~${l.cost}`:`🪖 FREE military flight · ${l.p}% chance of boarding`)+` · ~${fH(legHrs(A,B,!!l.comm))}`});
    });
    const extras=new Set();
    if(TB.step===1){
      TB.plans.forEach(pl=>pl.legs.forEach(l=>{[l.f,l.t].forEach(n=>{ if(!planNodes.has(n)) extras.add(n); });}));
      JM_EDGES.filter(e=>e.t===TB.hub).forEach(e=>{ if(!planNodes.has(e.f)) extras.add(e.f); });
    }
    [...extras].slice(0,10).forEach(n=>{ const e=JM_EDGES.find(x=>x.f===n&&x.t===TB.hub);
      items.push({k:n,label:jmName(n),p:e?e.p:null,on:false,dim:true}); });
  }
  items=items.filter(it=>{
    if(!(it.arc||tbCoord(it.k))) return false;
    const c=it.arc?{lon:it.mid[0],lat:it.mid[1]}:tbCoord(it.k);
    return front(c.lon,c.lat);
  }).map(it=>{
    const pt=it.arc?proj(it.mid):proj([tbCoord(it.k).lon,tbCoord(it.k).lat]);
    const P2=T(pt);
    if(it.arc) it.altPts=(it.alts||[]).map(a=>T(proj(a)));
    const onTxt=it.on?((it.label||"")+" 80% chance of boarding · Free ~10.5h").length:0; // real footprint, not a guess
    return Object.assign(it,{ax:P2[0],ay:P2[1],
      w:it.arc?(it.txt.length*6.5+30):it.on?Math.min(360,onTxt*7.5+46):Math.min(260,(it.label.length*7.5)+(it.p!=null?84:26)),
      h:it.arc?28:it.on?(it.s&&it.s.extra?104:it.s?88:44):40});
  }).sort((a,b)=>a.k<b.k?-1:1);
  const rectOf=(it,x,y)=>({x:x-it.w/2,y:y-it.h,w:it.w,h:it.h});
  // A label is up to 300px wide and centred on its point, so a flat 66px screen margin still let the
  // wide ones hang off the left edge (half of "JB Lewis-McChord · 42% chance" fell outside the view).
  // Clamp each one by its OWN half-width instead — every name stays whole on screen.
  const mX=it=>Math.min(it.w/2+10,Math.max(50,W3/2-20));
  const cX=(it,v)=>Math.max(mX(it),Math.min(W3-mX(it),v));
  const hits=r=>placed.some(o=>r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y);
  items.forEach(it=>{
    const MAXTRY=items.length>8?16:9, STEP=items.length>8?22:17;
    let x=cX(it,(it.ax)), y=Math.max(96,Math.min(H3-80,it.ay)), tries=0;
    while(hits(rectOf(it,x,y))&&tries<MAXTRY){
      const r=rectOf(it,x,y);
      const off=placed.find(o=>r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y);
      let a2=Math.atan2((y-it.h/2)-(off.y+off.h/2),x-(off.x+off.w/2));
      if(!isFinite(a2)) a2=(mkHash(it.k)%8)*(Math.PI/4);
      x=cX(it,(x+STEP*Math.cos(a2)));
      y=Math.max(96,Math.min(H3-80,y+STEP*Math.sin(a2)));
      tries++;
    }
    it.rect=rectOf(it,x,y);
    placed.push(it.rect);
    it.fx=x; it.fy=y;
  });
  items.forEach(it=>{ // final sweep: dot-only → re-seek → hide
    const idx=placed.indexOf(it.rect);
    if(idx>-1) placed.splice(idx,1);
    const collides=r=>placed.some(o=>r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y);
    if(collides(rectOf(it,it.fx,it.fy))){
      if(it.arc){ // re-seek along the arc itself, then hash rings, then hide
        let ok=false;
        (it.altPts||[]).forEach(ap=>{ if(ok) return;
          const nx=cX(it,(ap[0])), ny=Math.max(96,Math.min(H3-80,ap[1]));
          if(!collides(rectOf(it,nx,ny))){ it.fx=nx; it.fy=ny; ok=true; } });
        for(let t2=0;t2<10&&!ok;t2++){
          const a3=(mkHash(it.k)%8)*(Math.PI/4)+t2*(Math.PI/4);
          const nx=cX(it,(it.ax+(22+9*t2)*Math.cos(a3)));
          const ny=Math.max(96,Math.min(H3-80,it.ay+(22+9*t2)*Math.sin(a3)));
          if(!collides(rectOf(it,nx,ny))){ it.fx=nx; it.fy=ny; ok=true; }
        }
        if(!ok) it.hidden=true;
        it.rect=rectOf(it,it.fx,it.fy); placed.push(it.rect); return;
      }
      if(it.on){ // via/selected pins are never demoted (their markup can't fit 64px) — the arc label yields instead
        const mine=rectOf(it,it.fx,it.fy);
        items.forEach(o=>{ if(!o.arc||o.hidden||!o.rect) return;
          const r=o.rect;
          if(mine.x<r.x+r.w&&mine.x+mine.w>r.x&&mine.y<r.y+r.h&&mine.y+mine.h>r.y){
            o.hidden=true; const j=placed.indexOf(o.rect); if(j>-1) placed.splice(j,1); }});
        it.rect=mine; placed.push(it.rect); return;
      }
      it.noName=true; it.w=64; it.h=36;
      let ok=false;
      for(let t2=0;t2<12&&!ok;t2++){
        const a3=(mkHash(it.k)%8)*(Math.PI/4)+t2*(Math.PI/4);
        const nx=cX(it,(it.ax+(18+9*t2)*Math.cos(a3)));
        const ny=Math.max(96,Math.min(H3-80,it.ay+(18+9*t2)*Math.sin(a3)));
        if(!collides(rectOf(it,nx,ny))){ it.fx=nx; it.fy=ny; ok=true; }
      }
      if(!ok) it.hidden=true;
    }
    it.rect=rectOf(it,it.fx,it.fy);
    placed.push(it.rect);
  });
  items.forEach(it=>{
    if(it.hidden) return;
    const x=it.fx,y=it.fy;
    if(Math.hypot(x-it.ax,y-it.ay)>30&&!it.arc) leaders+=`<line x1="${it.ax}" y1="${it.ay}" x2="${x}" y2="${y-it.h/2}" stroke="color-mix(in srgb,var(--color-text) 13%,transparent)" stroke-width="0.7" stroke-linecap="round"></line>`;
    if(it.arc){ // arc mid-label
      const col=it.comm?commColor(it.cost):"#34D399";
      pins+=`<div class="tb-pin" style="left:${x}px;top:${y}px;pointer-events:none">
        <div class="pn" style="font-size:10.5px;color:${col}">${it.comm?`✈️ buy a ticket ~${it.cost}`:`<span class="sd" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${col};margin-right:3px;vertical-align:1px"></span>${it.p}% chance of boarding · Free`} · ~${fH(it.hrs)}</div>
        ${it.comm?"":`<div class="pnote">confirm on the 72-hr board</div>`}</div>`;
      return;
    }
    const col=it.p!=null?jmBand(it.p):"var(--color-accent)";
    if(it.on&&it.s){ const s=it.s;
      pins+=`<div class="tb-pin" data-pin="${s.k}" style="left:${x}px;top:${y}px;max-width:176px">
        <div class="pn" style="white-space:normal">${s.label}</div>
        <div class="pp" style="color:${col}"><span class="sd" style="background:${col}"></span>${s.p}% <span style="font-weight:400;font-size:11px">· ~${fH(s.hrs)}</span></div>
        ${s.extra?`<div class="pnote" style="font-size:10px;color:inherit">${s.extra}</div>`:""}${s.k==="utapao"?`<div class="pnote">don't count on it — nice surprise only</div>`:jmChip(s.p,s.cost)}<div class="pnote">a chance, not a promise · confirm on the 72-hr board</div>
      </div>`;
    } else if(it.on){
      const vcol=it.comm?commColor(it.cost):"#34D399";
      leaders+=`<circle class="tb-hit" cx="${it.ax}" cy="${it.ay}" r="20" fill="transparent" data-pinhit="${it.k}"></circle>`;
      pins+=`<div class="tb-pin" data-pin="${it.k}" style="left:${x}px;top:${y}px">
        <div class="pn">✈️ ${it.label} <span class="pp" style="color:${vcol};font-size:13px">${it.comm?`✈️ buy a ticket ~${it.cost}`:`<span class="sd" style="background:${vcol}"></span>${it.p}% chance of boarding · Free`}</span> <span style="font-size:10px;opacity:.7">~${fH(it.hrs)}</span></div>
        ${it.comm||!it.last?"":`<div class="pnote">confirm on the 72-hr board</div>`}</div>`;
    } else {
      // an anchor bead at the base's exact spot — zooming in shows precisely where it is
      leaders+=`<circle cx="${it.ax}" cy="${it.ay}" r="3.4" fill="var(--color-bg)" opacity=".9"></circle>
        <circle cx="${it.ax}" cy="${it.ay}" r="2.1" fill="${it.p!=null?col:"color-mix(in srgb,var(--color-text) 60%,transparent)"}" opacity="${it.dim?0.3:0.95}"></circle>
        <circle class="tb-hit" cx="${it.ax}" cy="${it.ay}" r="20" fill="transparent" data-pinhit="${it.k}"></circle>`;
      pins+=`<div class="tb-pin" data-pin="${it.k}" style="left:${x}px;top:${y}px${it.dim?";opacity:.3":""}"${it.noName?` title="${it.label}"`:""}>
        <div class="pn" style="font-weight:600;color:color-mix(in srgb,var(--color-text) ${k>1.5?84:68}%,transparent)">${it.noName?"":it.label+" "}${it.p!=null?`<span class="pp" style="color:color-mix(in srgb,${col} 55%,#e9e9ed);font-size:12.5px;font-weight:700"><span class="sd" style="background:${col};opacity:.85"></span>${it.p}%</span>`:(it.noName?"•":"")}</div>
      </div>`;
    }
  });
  // story strip
  const stripFor=(pl,endNode,label,compact)=>{
    if(!pl) return "";
    const startIsMine=TB.starts.includes(pl.start);
    // Stops read as type on a hairline; each hop carries its own two quiet lines underneath.
    let cards=`<span class="tb-stop start"><span class="sname">${jmName(pl.start)}</span><span class="sdot"></span></span>`;
    // 11% is 80% x 40% x 34% — you must win EVERY draw. Name the draw that costs you the most.
    const freeLegs=pl.legs.filter(x=>!x.comm);
    const weakP=freeLegs.length?Math.min.apply(null,freeLegs.map(x=>x.p)):null;
    let weakMarked=false;
    pl.legs.forEach((l,li)=>{
      const hrs=legHrs(tbCoord(l.f),tbCoord(l.t),!!l.comm);
      const col=l.comm?commColor(l.cost):"#34D399";
      const weak=!l.comm&&freeLegs.length>1&&l.p===weakP&&!weakMarked;
      if(weak) weakMarked=true;
      const main=l.comm?("~"+l.cost):("Free · "+l.p+"% chance");
      const last=l.t===endNode;
      cards+=`<span class="tb-hop${l.comm?" paid":""}${weak?" weak":""}"><span class="hline"></span>
        <span class="hfx"><span class="hmain" style="color:${weak?jmBand(l.p):col}">${main}</span>
          <span class="hsub">${fH(hrs)}${weak?" · weakest hop":""}</span></span></span>
      <span class="tb-stop${last?" end":""}"><span class="sname">${jmName(l.t)}</span><span class="sdot"></span></span>`;
    });
    let totH=planHrs(pl);
    const pct=planPct(pl), paid=planPaid(pl), paidStr=paid[1]?fCost(paid):null;
    const fallback=jmBackup(pl.start,endNode);
    const art=/^(8|11|18)/.test(String(pct))?"an":"a";
    // three labelled facts instead of one sentence strung together with five middots
    const fact=(lab,val,col)=>`<span class="f"><i>${lab}</i><b${col?` style="color:${col}"`:""}>${val}</b></span>`;
    const cap=pl.allPaid
      ? fact("Cost","~"+pl.legs[0].cost,"#7EA6C7")+fact("Flying",fH(totH))
      : pl.hybrid
        ? fact(freeLegs.length>1?"All "+freeLegs.length+" free hops":"Seat odds",pct+"%",jmBand(pct))+fact("You pay",paidStr,"#FBBF24")+fact("Flying",fH(totH))
        : fact(pl.legs.length>1?"All "+pl.legs.length+" hops":"Seat odds",pct+"%",jmBand(pct))
          +(weakP!=null&&freeLegs.length>1?fact("Weakest hop",weakP+"%",jmBand(weakP)):"")
          +fact("Cost","Free","#34D399")+fact("Flying",fH(totH))+fact("If it fills","~"+fallback);
    return `<div class="tb-strip"${label?` data-label="${label}"`:""}>${label?`<div class="tb-slab">${label}</div>`:""}<div class="tb-srow">${cards}</div><div class="tb-scap">${cap}</div></div>`;
  };
  let strip="";
  if(plan&&!payoff) strip=stripFor(plan,TB.step===2?activeStart:TB.hub);
  if(payoff) strip=stripFor(planOut,TB.hub,"✈️ There",true)+(plan2?stripFor(plan2,activeStart,"🏠 Home",true):"");
  if(strip) strip=`<div class="tb-stack${payoff&&plan2?"":" one"}">${strip}</div>`;
  // tabs
  let tabs="";
  if(BOARD){
    tabs=`<div class="tb-tabs tb-board" style="width:min(324px,calc(100vw - 32px))">
      <div class="tb-thead"><h6>✨ ${BOARD.rows.length} smart ways out of ${TB.boardFrom?jmName(TB.boardFrom):BOARD.hm.n}</h6></div>
      <div class="tb-bcap">Places you can actually ride, reachable from your ⭐ launch pads for real savings — in-season first.</div>
      ${BOARD.rows.map((r,i)=>`<button class="tb-brow${i<3?" top":""}${TB.boardHover===r.k?" hot":""}${TB.boardHover&&TB.boardHover!==r.k?" off":""}" data-board="${r.k}">
        <span class="bn">${r.act}</span>
        <span class="bt"><b>${r.spot}${r.inSeason?"":" ·  off-season"}</b>
          <small>via ${jmName(r.k)} · ${r.pl.legs.length===1?"direct":r.pl.legs.length+" hops"} from ${jmName(r.pl.start)}</small></span>
        <span class="bv"><b style="color:#34D399">${r.free?"Free":"save ~$"+r.save+" each"}</b>
          <small>${r.pct}% · ≈${fH(r.hrs)}</small></span>
      </button>`).join("")}
      ${BOARD.rows.length?"":`<div class="bp-empty">No standout savings right now — open a destination to see every option.</div>`}
    </div>`;
  }
  const tabPlans=TB.step===2?homePlans:TB.plans, tabIdx=TB.step===2?(TB.homeIdx||0):TB.planIdx;
  if(!TB.selTouched&&tabPlans.length&&!tabPlans.some(pl=>TB.sel[selKey(pl)])){
    const cur=tabPlans[Math.min(tabIdx,tabPlans.length-1)];
    if(cur) TB.sel[selKey(cur)]=true; }
  if(!payoff&&!pick&&!BOARD&&tabPlans.length){
    const multi=new Set(tabPlans.map(p=>p.start)).size>1;
    const endNode=TB.step===2?activeStart:TB.hub;
    // the plain-airline yardstick from home city (Bangkok/Denver) to this destination
    const CITY2={bkk:{lat:13.69,lon:100.75,n:"Bangkok"},col:{lat:39.86,lon:-104.67,n:"Denver"}};
    const hm=(function(){
      try{ const hq=JSON.parse(localStorage.getItem("spacea.hq")||"null");
        if(hq&&hq.lat!=null) return {lat:hq.lat,lon:hq.lon,n:hq.n.split(",")[0]}; }catch(e){}
      try{ return CITY2[localStorage.getItem("spacea.home.city")||"bkk"]||CITY2.bkk; }catch(e){ return CITY2.bkk; }
    })();
    // step 1: home city → destination · step 2: the airline flight HOME (destination → home city)
    const dst=tbCoord(TB.hub);
    const pM=(A,B,c)=>fareMid(havKm(A,B),fareMult(c));
    const pR=(A,B,c)=>fareRange(havKm(A,B),fareMult(c));
    const dstC=tbCountryOf(TB.hub);
    // door to door: cruise + check-in, plus a real stopover allowance per connection you'd actually make
    const cKm=dst?havKm(hm,dst):0;
    // Bangkok has non-stop service out to ~9,000 km (Tokyo, Seoul, Delhi, Dubai, Doha, Istanbul,
    // London), so anything inside that is a non-stop; one hub past it, two for the far corners.
    const stops=cKm>15000?2:cKm>9000?1:0;
    // some bases share their runway with a civil terminal — the rest need a real drive or train
    const CIVIL={hickam:1,muniz:1,lajes:1,souda:1,charleston:1,norfolk:1,andersen:1,bahrain:1,singapore:1};
    const ground=(cKm>2500&&!CIVIL[TB.hub])?1:0;
    const comm=dst?{h:Math.max(0.5,Math.round((cKm/1.852/470+0.75+stops*1.5+ground)*2)/2),stops:stops,
      mid:pM(hm,dst,dstC),rng:pR(hm,dst,dstC)}:null;
    // getting from HQ to the sign-up base is a real ticket the plans never carried — the app's own
    // JM_HOME table prices it. Without it the plans were understated by that much against the airline.
    const jmBackup2=(A2,B2,key)=>{ try{ return fareRange(havKm(A2,B2),fareMult(tbCountryOf(key))); }catch(e){ return null; } };
    const reachOf=S=>{
      if(!S) return null;
      const c=tbCoord(S); if(c&&havKm(hm,c)<250) return null;   // the base IS your town
      const spoke=(typeof JM_HOME!=="undefined"?JM_HOME:[]).filter(x=>x.key===S)[0];
      const rng=(spoke&&spoke.cost&&spoke.cost!=="$0")?spoke.cost:(c?jmBackup2(hm,c,S):null);
      if(!rng) return null;
      const r=pCost(rng); if(!r[1]) return null;
      return {rng:rng,lo:r[0],hi:r[1],mid:(r[0]+r[1])/2};
    };
    const reachCache={};
    // step 1 the gap is HQ -> the sign-up base you start from; step 2 it is the base you land at -> home
    const reachKey=pl=>TB.step===2
      ? (pl.legs.length?pl.legs[pl.legs.length-1].t:pl.start)
      : pl.start;
    const reach=pl=>{ const S=reachKey(pl); if(!(S in reachCache)) reachCache[S]=reachOf(S); return reachCache[S]; };
    // every comparison below is all-in from HQ: the plan's paid legs PLUS the ride to its start base
    const paidMid=pl=>{const p=planPaid(pl),r=reach(pl);return (p[0]+p[1])/2+(r?r.mid:0);};
    const allInRng=pl=>{const p=planPaid(pl),r=reach(pl);
      return (p[1]||r)?fCost([p[0]+(r?r.lo:0),p[1]+(r?r.hi:0)]):null;};
    const badDeal=pl=>{ if(!comm||pl.allPaid) return false;
      // A route with nothing to buy cannot cost about the same as a ticket. paidMid() is all-in from
      // HQ — it adds the ride to the sign-up base — so a $0 direct free leg (Andersen→Hickam, 67%) was
      // filed under "the long way round" while its own money cell read "Free". That ride is a shared
      // constant the .tb-reach banner states once above the list; judge the route on its OWN legs.
      const own=planPaid(pl); if(!own[1]) return false;
      return (own[0]+own[1])/2>=comm.mid*0.8; };            // no real saving -> say so
    // saves real money but costs you hours: the honest trade, not a warning
    const tradeOff=pl=>{ if(!comm||pl.allPaid||badDeal(pl)) return null;
      const extra=Math.round(planHrs(pl)-comm.h);
      if(extra<4) return null;
      const save=Math.round((comm.mid-paidMid(pl))/10)*10;
      return save>=60?{save:save,extra:extra}:null; };
    // one honest note: the ride to the sign-up base, folded into every figure below
    // Three groups, because there are only three answers worth giving: this one is free, this one is
    // nearly free, or this one is not worth doing.
    // Tier on the plan's OWN legs. The ride to the sign-up base is a shared constant — the same money
    // whichever row you pick — and the .tb-reach banner above the list already states it once. Folding
    // it into grpOf made tier 0 unreachable (no terminal sits within 250km of Bangkok, so reach() is
    // truthy for every plan), which filed rows whose own money cell reads "Free" under "Almost free".
    // Named, because these indices are referenced a dozen places below and a magic 2 or 3 is how the
    // tiering kept getting re-scoped by mistake.
    const G_FREE=0, G_FEE=1, G_EXPL=2, G_VOY=3, G_BAD=4;
    const GRP=[{l:"100% free",s:"no ticket on any leg of this route",c:"#34D399"},
      {l:"Almost free",s:"one small payment, still beats a ticket",c:"#E3B04B"},
      {l:"Explorer routes",s:"free the whole way, but a long shot — you don't mind waiting",c:"#5EEAD4"},
      {l:"Multi-stop trips",s:"four or more hops across several countries — explore until a flight shows up",c:"#A78BFA"},
      {l:"The long way round",s:"more waiting, or about the same money — take it for the ride",c:"#7EA6C7"}];
    // A voyage isn't a worse version of a direct plan, it's a different trip: several countries, no
    // schedule, each desk reached when something flies. It ranks ABOVE "the long way round" — filed
    // below it, the free multi-country runs this mode exists to find sat under 73 rows of same-money
    // routes the moment you expanded the list.
    const countriesOf=pl=>{
      const seen=[];
      [pl.start].concat(pl.legs.map(l=>l.t)).forEach(k=>{
        const c=tbNationOf(k);
        if(c&&seen.indexOf(c)<0) seen.push(c); });
      return seen;
    };
    const isVoyage=pl=>!!TB.voyage&&pl.legs.length>=4;
    // A 19% four-legger that costs nothing is not the same offer as a 75% direct that costs nothing,
    // and filing both under one "100% free" heading made the good one look like the bad one's peer.
    // Nothing to buy anywhere, and either a long way round (3+ hops) or genuinely unlikely (<25%):
    // a different kind of trip — you go because the flying is free and the waiting is fine, not
    // because it is the sensible way there. Keying on hops ALONE dropped 22 free two-leg long shots
    // into the same pile as routes that cost real money.
    const isExplorer=pl=>{
      if(pl.allPaid||planPaid(pl)[1]) return false;        // must be free the whole way
      return pl.legs.length>=3?planPct(pl)<35:planPct(pl)<25;
    };
    // A five-hop via list needs four lines in a 149px column, so the 2-line clamp ate the middle of
    // every voyage — and the middle IS the journey. Voyage rows show the country chain instead; the
    // full base-by-base path stays in the row's title attribute.
    const NAT_ABBR={"USA":"US","Japan":"JP","South Korea":"KR","Germany":"DE","Italy":"IT",
      "Spain":"ES","Greece":"GR","Portugal":"PT","United Kingdom":"UK","Bahrain":"BH",
      "Qatar":"QA","Kuwait":"KW","Honduras":"HN","Singapore":"SG","Australia":"AU"};
    const natAbbr=n=>NAT_ABBR[n]||String(n).slice(0,2).toUpperCase();
    const grpOf=pl=>{
      // Viability first, ALWAYS. Testing isVoyage() ahead of the reject let every ≥4-leg route skip the
      // odds floor, so a 0.07%-chance six-hop chain led the board and became the plan drawn on the
      // globe while 62 plausible routes sat collapsed behind a "show more" bar. "Explore until a
      // flight shows up" still needs a flight that shows up.
      if(pl.allPaid||badDeal(pl)||planPct(pl)<10) return G_BAD;
      if(isVoyage(pl)) return G_VOY;
      if(isExplorer(pl)) return G_EXPL;     // free, long, unlikely — its own kind of trip
      if(planPct(pl)<25) return G_BAD;
      return planPaid(pl)[1]?G_FEE:G_FREE;
    };
    // What the free legs are actually worth: the fare you'd have paid to fly them yourself. This is
    // the number the whole tool exists to produce — a route that hauls you Yokota→Travis→Dover for
    // nothing and asks $180 for the last hop is the biggest win on the board, and nothing on the row
    // said so. Ranked on inside each tier, and printed on the row.
    const freeValue=pl=>{
      let v=0;
      pl.legs.forEach(l=>{ if(l.comm) return;
        const A=tbCoord(l.f), B=tbCoord(l.t); if(!A||!B) return;
        v+=fareMid(havKm(A,B),1); });
      return Math.round(v/10)*10;
    };
    const reachNote=(()=>{
      const rs=tabPlans.map(pl=>({k:reachKey(pl),r:reach(pl)})).filter(x=>x.r);
      if(!rs.length) return "";
      const keys=[...new Set(rs.map(x=>x.k))];
      // With eight launch pads the old line named all eight and quoted one range across all of them
      // (~$40–500 — a 12x spread that tells you nothing) in a 53px wall above a list that then had no
      // room for a single row. The figure is per-plan, so it belongs ON the plan; this is one line.
      const phrase=TB.step===2?"to fly home from your launch pad":"to reach your launch pad";
      const named=keys.slice(0,2).map(jmName).join(" / ");
      const more=keys.length>2?" and "+(keys.length-2)+" more":"";
      // Deliberately empty: every row now carries its own "+~$150–320 to get there", which is the
      // actionable number. A banner repeating it cost 50px above a list that fitted one row.
      void phrase; void named; void more;
      return ""; })();
    // what this particular plan costs to get to, so the row can say it
    const reachOne=pl=>{ const r=reach(pl); return r?r.rng:null; };
    // Common sense first. planRank (in buildPlans) can't see the airline yardstick or the ride to the
    // start base, so it can't tell a genuine saving from one that costs more than just buying a ticket.
    // Now that badDeal exists, re-order here: plans that beat the airline lead, then odds, then hours.
    {
      // Which plan is "the one on the map" must survive this re-sort. At step 2 homePlans is rebuilt
      // from scratch every render, so a bare index pointed at a different way each time (↑ once and
      // you'd land 15 rows down). Track the plan by signature and re-find it after sorting.
      const curSig=TB.step===2?TB.homeSig:TB.outSig;
      const cur=(curSig&&tabPlans.find(pl=>legSig(pl)===curSig))||tabPlans[Math.min(tabIdx,tabPlans.length-1)];
      // Round-robin the starts inside each tier. Straight odds order filed every plan from a nearer
      // pad above ALL of a farther pad's — from Osan the best route sat at row 25 under twenty
      // 75-80% rows from Kadena and Yokota, which is where "you're hiding my good routes" came from.
      // Round 0 is every pad's best plan in the tier (by odds), then every pad's second-best, and so
      // on — so odds still order each round, but no pad's best can be buried by another pad's fifth.
      const roundOf=(()=>{ const cnt={}, m=new Map();
        tabPlans.slice().sort((a,b)=>grpOf(a)-grpOf(b)||b.prob-a.prob||freeValue(b)-freeValue(a))
          .forEach(pl=>{ const k2=grpOf(pl)+"|"+pl.start; const r=cnt[k2]||0; cnt[k2]=r+1; m.set(pl,r); });
        return pl=>m.get(pl)||0; })();
      tabPlans.sort((a,b)=>
        grpOf(a)-grpOf(b)
        || roundOf(a)-roundOf(b)
        // Odds lead in EVERY tier, unconditionally. Within a tier the money cell is already equal
        // (every "100% free" row costs $0), so freeValue is not a saving comparison there at all — it
        // is a proxy for route length, and it therefore rewards adding hops. It ranked a 31%/21.5h
        // four-legger above a 75%/9.5h direct route of identical cost. Free mileage stays, as the
        // tie-break AFTER odds, where it distinguishes equally-likely routes.
        || b.prob-a.prob
        || freeValue(b)-freeValue(a)
        || planHrs(a)-planHrs(b)
        || paidMid(a)-paidMid(b));
      const ni=TB.planTouched?tabPlans.indexOf(cur):0;
      if(ni>=0){ if(TB.step===2){ TB.homeIdx=ni; TB.homeSig=legSig(tabPlans[ni]); } else { TB.planIdx=ni; TB.outSig=legSig(tabPlans[ni]); } }
      // On a fresh destination the list picks row 0 of THIS sort — which may not be the plan the globe
      // above was just drawn from. Reconcile SYNCHRONOUSLY: requestAnimationFrame never fires in a
      // hidden or throttled tab, which left the flag latched and the gold ⭐ naming the wrong base.
      const chosen=tabPlans[ni>=0?ni:0];
      if(chosen&&chosen!==plan&&!TB._resync){
        TB._resync=1;
        try{ tbRender(); } finally{ TB._resync=0; }
        return;   // nothing has been written to the DOM yet — the inner render owns this frame
      }
    }
    const tIdx=TB.step===2?(TB.homeIdx||0):TB.planIdx;
    // The dud pile opens only when there is genuinely nothing better, or when the plan currently on
    // the map happens to live in it — otherwise you'd be looking at a highlighted row you can't see.
    const nGood=tabPlans.filter(pl=>grpOf(pl)!==G_BAD).length;
    const nBad=tabPlans.length-nGood;
    // Two ways the dud pile shows: you asked for it, or the plan on the map lives there. When there is
    // nothing good AT ALL, forty duds is still forty duds — show the best five and say so honestly,
    // rather than either hiding the whole answer or dumping the wall back on screen.
    const badPlans=tabPlans.filter(pl=>grpOf(pl)===G_BAD);
    // The map-plan living in the dud pile only forces it open when a better pile exists to hide it
    // behind; when EVERY plan is a dud that test is always true and re-opened the whole wall.
    const forced=!!TB.showBad||(nGood>0&&!!tabPlans[tIdx]&&grpOf(tabPlans[tIdx])===G_BAD);
    const badShow=forced?badPlans.length:(nGood?0:Math.min(5,badPlans.length));
    const badVis=new Set(badPlans.slice(0,badShow).map(pl=>legSig(pl)));
    const badHidden=badPlans.length-badShow;
    const showBad=badShow>0;
    const rowVis=tabPlans.map(pl=>grpOf(pl)!==G_BAD||badVis.has(legSig(pl)));
    // "Select all" has to mean the rows you can actually see. Counting the whole array ticked the 35
    // duds folded away below — invisibly enrolling you in routes the app had just called not worth it,
    // and pushing every one of them into the sign-up checklist. All three counts are scoped to screen.
    const visPlans=tabPlans.filter((pl,i)=>rowVis[i]);
    TB._visKeys=visPlans.map(pl=>selKey(pl));   // the Select-all handler runs outside this block
    const selN=visPlans.filter(pl=>TB.sel[selKey(pl)]).length;
    const allOn=!!visPlans.length&&selN===visPlans.length;
    // what the collapsed line says about the pile it's hiding — counted over the HIDDEN plans only,
    // or the breakdown adds up to more than the number on the chip
    const badWhy=(()=>{
      const bads=badPlans.slice(badShow);
      if(!bads.length) return "";
      const paidOnly=bads.filter(pl=>pl.allPaid).length;
      const longShot=bads.filter(pl=>!pl.allPaid&&planPct(pl)<25).length;
      const bits=[];
      if(bads.length-paidOnly-longShot>0) bits.push((bads.length-paidOnly-longShot)+" cost about the same as a ticket");
      if(longShot) bits.push(longShot+" under 25% odds");
      if(paidOnly) bits.push(paidOnly+" all-paid");
      return bits.join(" \u00b7 ");
    })();
    tabs=`<div class="tb-tabs">
      <div class="tb-thead">
        <div class="tb-title">
          <span class="tnum">${nGood+badShow}</span>
          <span class="twords"><b>ways ${TB.step===2?"home":"there"}</b><span class="tsub2">${badHidden?badHidden+" more the long way round":"tick the ones you'd take"}</span></span>
          <span style="flex:1 1 auto"></span>
          <button class="tb-railmin" id="tbRailMin" title="${TB.railMin?"Show every way":"Collapse — show the globe"}">${TB.railMin?"▴":"▾"}</button>
        </div>
        <div class="tb-ctr">
          <button class="tb-selall" id="tbSelAll">${allOn?"Clear all":"Select all"}</button>
          <button class="tb-voy${TB.voyage?" on":""}" id="tbVoyage" title="Also search longer trips with more stops — up to six hops through several countries">🌏 Multi-stop trips</button>
        </div></div>
      ${comm?`<div class="tb-comm" title="What one ordinary airline ticket costs for the same journey — the yardstick every plan below is measured against.">
        <span class="ck">If you just bought a ticket</span>
        <span class="cro">${TB.step===2?`${jmName(TB.hub)} <i>→</i> ${hm.n}`:`${hm.n} <i>→</i> ${jmName(TB.hub)}`}<span class="cs">${comm.stops?comm.stops+(comm.stops>1?" stops":" stop"):"non-stop"}</span></span>
        <span class="cr"><span class="cm">${comm.rng}<small>each</small></span><span class="ch">${fH(comm.h)}<small>door to door</small></span></span></div>`:""}${reachNote}
      ${tabPlans.map((pl,i)=>{const pct=planPct(pl);
        const g=grpOf(pl);
        if(!rowVis[i]) return "";
        // group boundaries walk the VISIBLE rows — using raw indices would leave a bubble unclosed
        // the moment a hidden dud fell between two shown ones.
        let pv=-1; for(let q=i-1;q>=0;q--){ if(rowVis[q]){ pv=q; break; } }
        let nx=-1; for(let q=i+1;q<tabPlans.length;q++){ if(rowVis[q]){ nx=q; break; } }
        const gNew=pv<0||grpOf(tabPlans[pv])!==g;
        const gCount=g===G_BAD?badPlans.length:tabPlans.filter(x=>grpOf(x)===g).length;
        const gHead=gNew?`<div class="tb-grp"><span class="gdot"></span><span class="gl">${GRP[g].l}</span><span class="gs">${GRP[g].s}</span><span class="gn">${gCount}</span>${(g===G_BAD&&TB.showBad)?`<button class="gx" id="tbHideBad">Hide</button>`:""}</div>`:"";
        const gShut=(nx<0||grpOf(tabPlans[nx])!==g)?"</div>":"";
        const via=pl.legs.map(l=>l.t).filter(k=>k!==endNode).map(jmName);
        const paid=planPaid(pl);
        const moneyHtml=pl.allPaid
          ? `<span class="tmoney" style="color:#7EA6C7">You pay ${pl.legs[0].cost}</span>`
          : paid[1]
            ? `<span class="tmoney" style="color:#FBBF24">You pay ${fCost(paid)}</span>`
            : `<span class="tmoney" style="color:#34D399">Free</span>`;
        const on=!!TB.sel[selKey(pl)];
        const usb=usBlocked(pl);
        const bad=!usb&&badDeal(pl);
        const fv=(!pl.allPaid)?freeValue(pl):0;
        // freeValue says the same thing as tradeOff but in the number that matters, so only one shows
        const trade=!usb&&!bad&&fv<150&&tradeOff(pl);
        return (gNew?`<div class="tb-bub" style="--gc:${GRP[g].c}">`+gHead:"")+`<div class="tb-trow${i===tIdx?" cur":""}${usb?" usblock":""}"${usb?` data-usmsg="⛔ Lands on US soil — ${gate.label}"`:""}>
        <button class="tb-ck${on?" on":""}" data-ck="${i}" role="checkbox" aria-checked="${on}" ${usb?'data-usb="1"':""} title="${usb?"Touches US soil — Montana needs her US visa first":on?"Signing up for this one":"Add this one to my sign-ups"}">${usb?"⛔":on?"✓":""}</button>
        <button class="tb-tab${i===tIdx?" on":""}" data-plan="${i}" title="${[pl.start].concat(pl.legs.map(l=>l.t)).map(jmName).join(" → ")}">
          <span class="sd" style="background:${pl.allPaid?"#7EA6C7":jmBand(pct)}"></span>
          <span class="tt">
            <span class="tl"><span class="tk">${TB.step===2?"Way":"Plan"}</span><em class="tix">${"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i]||i+1}</em>${i===tIdx?`<span class="tnow">on the map</span>`:""}${usb?`<span class="tusb">US soil</span>`:""}${(!pl.allPaid&&pct<25)?`<span class="tlong">unlikely</span>`:""}</span>
            <span class="tsub"><span class="tvia">${(grpOf(pl)===G_VOY)?`<span class="tfrom">from ${jmName(pl.start)}</span> · <span class="tchain">${countriesOf(pl).map(natAbbr).join(" → ")}</span> · via ${jmName(pl.legs[0].t)}${pl.legs.length>2?" +"+(pl.legs.length-2):""}`:`${multi?`<span class="tfrom">from ${jmName(pl.start)}</span> · `:""}${via.length?"via "+via.join(", "):"direct"}`}</span><span class="thrs">${fH(planHrs(pl))}</span>${reachOne(pl)?`<span class="treach">+~${reachOne(pl)}</span>`:""}${trade?`<span class="ttrade">Saves $${trade.save} each</span>`:""}${moneyHtml}${(!pl.allPaid&&fv>=150)?`<span class="tfree">✈️ $${fv} free</span>`:""}${(grpOf(pl)===2)?`<span class="tctry">${countriesOf(pl).length} countries</span>`:""}${bad?`<span class="tcost">Same money as flying</span>`:""}</span></span>
          <b class="tpct" style="color:${pl.allPaid?"#7EA6C7":jmBand(pct)}">${pl.allPaid?"paid":pct+"%"}<small>${pl.allPaid?"":"get a seat"}</small></b></button></div>`+gShut;}).join("")}
      ${badHidden?`<button class="tb-badbar" id="tbShowBad">
        <span class="bb-n">${badHidden}</span>
        <span class="bb-t"><b>more ${badHidden===1?"way":"ways"} \u2014 the long way round</b>
          <small>${badWhy}</small></span>
        <span class="bb-c">Show</span></button>`:""}
      ${(!nGood&&badShow)?`<div class="tb-nogood">Nothing here beats a plane ticket on money${badHidden?`. Showing the best ${badShow}`:""}.</div>`:""}
      <button class="tb-go" id="tbGo" ${selN?"":"disabled"}>${TB.step===2
        ? `Start my checklist → ${selN?"("+selN+" way"+(selN===1?"":"s")+" home)":""}`
        : `Next: flight home → ${selN?"("+selN+" way"+(selN===1?"":"s")+")":""}`}</button>
      <div class="tb-keepcap">Ticking more is free — one sign-up per base covers them all.</div></div>`;
  }
  // header
  // Phosphor, rendered the design-system way: one filled path, fill=currentColor, no stroke.
  // arrow + sparkle are verbatim from the DS icon sheet; the others are Phosphor Regular.
  const TBI=d=>`<svg class="tbi" viewBox="0 0 256 256" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
  const TB_ICON={
    // DS `arrow`, verbatim — outbound. The step separator is dropped so it does not read twice.
    there:TBI("M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"),
    home:TBI("M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"),
    dest:TBI("M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"),
    star:TBI("M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z"),
    plus:TBI("M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"),
    center:TBI("M128,72a56,56,0,1,0,56,56A56.06,56.06,0,0,0,128,72Zm0,96a40,40,0,1,1,40-40A40,40,0,0,1,128,168Zm104-48H215.6A88.13,88.13,0,0,0,136,40.4V24a8,8,0,0,0-16,0V40.4A88.13,88.13,0,0,0,40.4,120H24a8,8,0,0,0,0,16H40.4A88.13,88.13,0,0,0,120,215.6V232a8,8,0,0,0,16,0V215.6A88.13,88.13,0,0,0,215.6,136H232a8,8,0,0,0,0-16ZM128,200a72,72,0,1,1,72-72A72.08,72.08,0,0,1,128,200Z"),
    x:TBI("M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"),
    // check-circle — the trip is complete, distinct from the starred base chip
    done:TBI("M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z")
  };
  const pctDone=payoff?100:TB.step===2?66:33;
  const steps=`<div class="tb-prog"><i style="width:${pctDone}%"></i></div>
    <div class="tb-steps">
      <button class="tb-step ${TB.step===1?"on":"done"}" id="tbStep1" style="cursor:pointer">
        <span class="n">${TB.step>1?"✓":"1"}</span>Flight there</button>
      <span class="tb-join${TB.step>1?" lit":""}"></span>
      <button class="tb-step ${TB.step===2?"on":TB.step===3?"done":""}" id="tbStep2" style="cursor:pointer">
        <span class="n">${TB.step>2?"✓":"2"}</span>Flight home</button>
      ${payoff?`<span class="tb-join lit"></span><span class="tb-step on"><span class="n">✓</span>Your whole trip</span>`:""}</div>`;
  const startChips=pick?"":`<span class="tb-chips">${TB.starts.slice(0,2).map(S=>`<button class="tb-chip" data-rmstart="${S}" title="Remove this start base">${TB_ICON.star} ${jmName(S)}<span class="x">${TB_ICON.x}</span></button>`).join("")}${TB.starts.length>2?`<button class="tb-chip" id="tbAddStart2" title="See all my start bases">+${TB.starts.length-2} more</button>`:""}<button class="tb-chip" id="tbAddStart" title="Add a start base">${TB_ICON.plus} base</button>${TB.starts.length>1?`<button class="tb-chip" data-clearstarts="1" title="Remove all my start bases" style="color:#FF4D4D;border-color:color-mix(in srgb,#FF4D4D 45%,transparent)">${TB_ICON.x}</button>`:""}</span>`;
  const destBtn=(!pick&&!payoff)?`<button class="tb-chip tb-destbtn" id="tbPickDest">${TB_ICON.dest} ${TB.hub?"Change destination":"Pick a destination"}</button>`:"";
  const crumb=(TB.trail.length&&TB.step===1&&!pick)?`<span class="tb-crumb"><button id="tbBackHub">←</button>${TB.trail.map(jmName).join(" → ")} → <b>${jmName(TB.hub)}</b></span>`:"";
  const lock=(TB.step>=2&&planOut)?`<span class="tb-lock">There: ${jmName(planOut.start)} → ${jmName(TB.hub)} <span style="color:${jmBand(planPct(planOut))}">● ${planPct(planOut)}% chance of boarding</span></span>`:"";
  const hubCard=(TB.hubCard&&TB.step===1&&!pick&&!payoff)?(()=>{
    const sch=(typeof scheduleRows==="function"?scheduleRows(TB.hub):((typeof SCHEDULES!=="undefined"&&SCHEDULES[TB.hub])||[]));
    const off=(typeof TERM_PAGE!=="undefined"&&TERM_PAGE[TB.hub])||null;
    const links=sch.map(s2=>`<a class="tb-btn ghost" style="text-decoration:none;text-align:center" href="${s2.url}" target="_blank" rel="noopener noreferrer">${s2.label} ↗</a>`).join("")
      +(off?`<a class="tb-btn ghost" style="text-decoration:none;text-align:center" href="${off}" target="_blank" rel="noopener noreferrer">Official page ↗</a>`:"");
    return `<div class="tb-card"><b>✈️ ${jmName(TB.hub)}</b>
      ${links||`<span class="jm-cap">No verified live link — check the official page.</span>`}
      <span class="jm-cap">Tap any base on the map to fly there instead.</span></div>`;})():"";
  const destCard=(TB.pickDest&&!pick&&!payoff)?(()=>{
    const gate2=gate;
    const list=TERMS.filter(t=>PRIMARY.has(t.key)||TB.starts.includes(t.key))
      .slice().sort((a,b)=>a.name.localeCompare(b.name));
    const region=t=>({CONUS:"United States",EUCOM:"Europe",INDOPACOM:"Asia & Pacific",CENTCOM:"Middle East",SOUTHCOM:"Americas"})[t.cmd]||t.cmd||"";
    const rows=list.map(t=>{
      const mine=TB.starts.includes(t.key), here=t.key===TB.hub;
      const usb=!gate2.cleared&&typeof window.isUsSoil==="function"&&window.isUsSoil(t.key);
      const e=JM_EDGES.filter(x=>x.t===t.key).sort((a,b)=>b.p-a.p)[0];
      return `<button class="tb-drow${here?" here":""}${usb?" usb":""}" data-dest="${t.key}"${usb?' data-usb="1"':""}>
        <span class="di">${mine?"⭐":here?"📍":"✈️"}</span>
        <span class="dt"><b>${t.name}</b><small>${region(t)}${here?" · you're planning here":mine?" · one of your start bases":""}</small></span>
        ${usb?`<span class="dusb">US soil</span>`
          :e?`<span class="dp" style="color:${jmBand(e.p)}">${e.p}%</span>`:""}
      </button>`;}).join("");
    return `<div class="tb-start tb-pickdest">
      <div class="tb-dhead"><b>Where do you want to fly?</b>
        <button class="tb-x" id="tbDestClose" title="Close">✕</button></div>
      <span class="jm-cap">Pick a base and we'll build every way to get there.</span>
      <input id="tbDestSearch" placeholder="Type a base or a country…" autocomplete="off">
      <div class="tb-slist tb-dlist" id="tbDlist">${rows}</div>
    </div>`;})():"";
  const startCard=pick?(()=>{
    const list=TERMS.slice().sort((a,b)=>a.name.localeCompare(b.name));
    return `<div class="tb-start"><div style="display:flex;align-items:center;gap:10px;margin-bottom:2px">
        <b style="flex:1 1 auto;margin:0">Where are you flying from?</b>
        ${TB.starts.length?`<button class="tb-chip" data-clearstarts="1" title="Remove every launch pad" style="flex:0 0 auto;border-color:color-mix(in srgb,#FF4D4D 50%,transparent);color:#FF8585">Clear all (${TB.starts.length}) ✕</button>`:""}</div>
      <div class="tb-chips">${TB.starts.map(S=>`<button class="tb-chip" data-rmstart="${S}">⭐ ${jmName(S)}<span class="x">✕</span></button>`).join("")||`<span class="jm-cap">Pick one or more bases — tap the map or the list.</span>`}</div>
      <div class="tb-chips"><span class="jm-cap" style="flex-basis:100%">Quick add a whole region:</span>
        <button class="tb-chip" data-qadd="INDOPACOM">🌏 + All Asia/Pacific</button>
        <button class="tb-chip" data-qadd="EUCOM">🌍 + All Europe</button>
        <button class="tb-chip" data-qadd="CONUS">🇺🇸 + All CONUS</button>
        <button class="tb-chip" data-qadd="CENTCOM">🌴 + Gulf</button></div>
      <input id="tbSearch" placeholder="Type a base…" autocomplete="off">
      <div class="tb-slist" id="tbSlist">${list.map(t=>`<button data-start="${t.key}" class="${TB.starts.includes(t.key)?"on":""}">${TB.starts.includes(t.key)?"⭐ ":""}${t.name} <span style="opacity:.5;font-size:11px">${t.code||""}</span></button>`).join("")}</div>
      <button class="tb-btn" id="tbStartDone" ${TB.starts.length?"":"disabled"}>Done — build my plans</button>
      <span class="jm-cap">Saved for every future trip until you change it.</span></div>`;})():"";
  // bar
  let bar="";
  if(pick) bar=`Tap every base you can fly from — each gets a ⭐.`;
  else if(payoff){
    const p1=planOut||{legs:[],prob:1,start:activeStart}, p2=plan2||{legs:[],prob:1,start:TB.hub};
    const paid=[planPaid(p1)[0]+planPaid(p2)[0],planPaid(p1)[1]+planPaid(p2)[1]];
    const totH=planHrs(p1)+planHrs(p2);
    const weakPct=Math.min(planPct(p1),plan2?planPct(p2):100);
    const fb=weakPct>=30?"":`<span style="color:#FBBF24">If the free seats don't come through: the paid way is about ${jmBackup(activeStart,TB.hub)} each way.</span>`;
    bar=(paid[1]?`Whole trip ≈ <b>${fCost(paid)}</b> and about <b>${fH(totH)}</b> flying (plus waiting for free seats). `
      :`Whole trip ≈ <b>$0</b> and about <b>${fH(totH)}</b> flying (plus waiting for free seats). `)+fb+`
      <button class="tb-btn ghost" id="tbRestart">Start over</button>
      <button class="tb-btn" id="tbChk">🧭 Hold my hand — my checklist</button>
      <button class="tb-btn" id="tbFire">⚡ Sign up at ${jmName(activeStart)}</button>`;
  } else if(TB.step===1){
    // only speak up when something is actually wrong — otherwise the header and the plans panel have it
    bar=(!plan&&TB.hub)
      ? (TB.starts.includes(TB.hub)?`That's one of your launch pads — pick where you want to fly.`:`No plan yet.`)
        +`<button class="tb-btn ghost" id="tbPickDest2">Pick a destination</button>`
      : (liveBlocked?`<span class="tb-usbar">⛔ Lands on US soil — ${gate.label}</span>`:"");
  } else {
    bar=plan2
      ? `<button class="tb-btn" id="tbNext">See your whole trip</button>`
      : `No known way back to ${jmName(activeStart)} — check that base's 72-hr board`;
  }
  if(BOARD) bar=`<span class="tb-bcount">✨ ${BOARD.rows.length} destinations worth the trip</span>
    <span class="tb-lgd"><i class="fr"></i>Free hop&nbsp;&nbsp;<i class="pd"></i>paid airline</span>
    <button class="tb-btn" id="tbBoardOut">Pick a destination instead →</button>`;
  // Ticking a plan re-renders the whole panel, which dropped the list back to the top — three clicks
  // in and you were hunting for your place again. Carry every scroller's position across the rebuild.
  const keepScroll=[...el.querySelectorAll(".tb-tabs,.tb-slist")]
    .map(n=>[n.className,n.scrollTop]).filter(p=>p[1]>0);
  el.innerHTML=`<svg>${defs}<g id="tbz" transform="translate(${tx},${ty}) scale(${k})">${svg}</g><g id="tbLead">${leaders}</g></svg>
    <div class="tb-head">
      <div class="tb-hrow">
        <button class="tb-x" id="tbClose">${TB_ICON.x}</button>${steps}
        <span class="tb-hgap"></span><span class="tb-hchips">${destBtn}${startChips}${crumb}</span>
        <button class="tb-x" id="tbRecenter" title="Recenter">${TB_ICON.center}</button>
      </div>
      <div class="tb-hsub">${lock}
        <span class="jm-cap">${pick?"Pick your start bases":"drag to spin the globe · scroll to zoom"}${hiddenStops.length?` · <b style="color:#FBBF24">${[...new Set(hiddenStops)].join(", ")}</b> ${hiddenStops.length>1?"are":"is"} on the far side — drag to spin`:""}</span>
      </div></div>
    ${hubCard}${startCard}${destCard}
    ${clipped?`<button class="tb-clip" id="tbSeePath" style="left:${Math.round((W3-(narrow?0:railRes))/2)}px">${TB_ICON.center} Show my whole path</button>`:""}
    <div id="tbPins" style="position:absolute;inset:0;pointer-events:none;z-index:3">${pins}</div>${tabs}${strip}
    ${(!pick&&TB.step===1&&!TB.plans.length&&TB.hub&&!TB.starts.includes(TB.hub))?`<div class="jm-empty">No known flights in here — check this base's 72-hr board.</div>`:""}
    ${bar?`<div class="tb-bar">${bar}</div>`:""}`;
  keepScroll.forEach(([cls,top])=>{ const n=el.querySelector("."+cls.trim().split(/\s+/).join(".")); if(n) n.scrollTop=top; });
  el.classList.toggle("dense",items.length>8);
  el.classList.toggle("uv",!!TB.userView);
  el.classList.toggle("narrow",narrow);
  el.classList.toggle("home",!pick&&!payoff&&TB.step===2);
  const hchips=el.querySelector(".tb-hchips");
  if(hchips) hchips.classList.toggle("fade",hchips.scrollWidth>hchips.clientWidth+2);
  el.classList.toggle("railmin",narrow&&!!TB.railMin);
  // one stack holds every strip; clamp it to the gap between header and bar so it can never cross either
  const barEl=el.querySelector(".tb-bar"), headEl=el.querySelector(".tb-head"), stackEl=el.querySelector(".tb-stack");
  // narrow: the list is a bottom sheet, so the action bar rides above it instead of underneath
  const sheetEl=narrow?el.querySelector(".tb-tabs"):null;
  if(sheetEl){
    sheetEl.style.maxHeight=TB.railMin?"none":Math.round(H3*0.44)+"px";
    if(barEl) barEl.style.bottom=(sheetEl.offsetHeight+16)+"px";
    const real=sheetEl.offsetHeight;
    if(Math.abs((TB[sheetKey]||0)-real)>12){ TB[sheetKey]=real;
      if(!TB._refit){ TB._refit=1;                       // synchronous: a hidden tab never runs rAF
        try{ tbRender(); } finally{ TB._refit=0; }
        return; } }
  }
  if(stackEl){
    const bh=(barEl?barEl.offsetHeight+16:14)+(sheetEl?sheetEl.offsetHeight+16:0);
    const hh=(headEl?headEl.offsetHeight:100)+22;
    const tabsEl=narrow?null:el.querySelector(".tb-tabs");
    const gut=tabsEl?tabsEl.offsetWidth+26:10;
    stackEl.style.right=(W3-gut-10<520?10:gut)+"px";   // don't starve the rail for a floating panel
    stackEl.style.bottom=bh+"px";
    stackEl.style.maxHeight=Math.max(90,H3-bh-hh)+"px";
  }
  // ── animated planes along the selected plan ──
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches){
    const paths=[...el.querySelectorAll("path[data-plane]")];
    if(paths.length){
      const layer=el.querySelector("#tbz");
      const planes=paths.map((p,i)=>{
        const g=document.createElementNS("http://www.w3.org/2000/svg","g");
        g.innerHTML=`<path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" fill="${p.dataset.pcol}" transform="translate(-12,-12)"></path>`;
        layer.appendChild(g);
        let len=0; try{ len=p.getTotalLength(); }catch(e){}
        return {g,p,len,dur:4200+(i%3)*900,phase:(i*0.37)%1};
      }).filter(pl=>pl.len>2);
      const sc=0.72/k;
      const step2=now=>{
        if(!el.classList.contains("show")||!document.contains(planes[0].g)){ TB._raf=0; return; }
        if(!document.hidden) planes.forEach(pl=>{
          const t=((now/pl.dur)+pl.phase)%1;
          const a=pl.p.getPointAtLength(t*pl.len), b=pl.p.getPointAtLength(Math.min(pl.len,t*pl.len+1.5));
          const ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
          pl.g.setAttribute("transform",`translate(${a.x},${a.y}) rotate(${ang+90}) scale(${sc})`);
        });
        TB._raf=requestAnimationFrame(step2);
      };
      TB._raf=requestAnimationFrame(step2);
    }
  }
  // handlers
  $("tbClose").onclick=()=>{ cancelAnimationFrame(TB._raf); el.classList.remove("show"); };
  // the row order is re-derived every render, so remember the PLAN you picked, not its position
  const markSig=i=>{ const pl=tabPlans[i]; if(!pl) return;
    if(TB.step===2) TB.homeSig=legSig(pl); else TB.outSig=legSig(pl); };
  el.querySelectorAll("[data-plan]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.plan;
    TB.planTouched=true; markSig(i);
    if(TB.step===2) TB.homeIdx=i; else TB.planIdx=i;
    TB.userView=null; TB.rot=null; TB._drag=null;   // re-frame on the path you just picked
    tbRender(); });
  // ↑/↓ walks the list of ways — each step re-frames the globe on that path, same as clicking it
  const stepPlan=d=>{
    if(pick||payoff||!tabPlans.length) return false;
    const cur=TB.step===2?(TB.homeIdx||0):TB.planIdx;
    const next=Math.max(0,Math.min(tabPlans.length-1,cur+d));
    if(next!==cur){
      TB.planTouched=true; markSig(next);
      if(TB.step===2) TB.homeIdx=next; else TB.planIdx=next;
      TB.userView=null; TB.rot=null; TB._drag=null;
      TB._focusPlan=true;
      tbRender();
    }
    return true;
  };
  TB._stepPlan=stepPlan;   // the window-level key handler calls the CURRENT render's closure
  el.querySelectorAll("[data-plan]").forEach(b=>b.onkeydown=e=>{
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); stepPlan(e.key==="ArrowDown"?1:-1); }
  });
  if(TB._focusPlan){ TB._focusPlan=false;
    const on=el.querySelector("[data-plan].on");
    if(on){ on.focus({preventScroll:true});
      const box=on.closest(".tb-tabs");
      if(box){ const want=on.offsetTop-box.clientHeight/2+on.offsetHeight/2;   // keep the pick centred; never scrollIntoView
        box.scrollTop=Math.max(0,Math.min(box.scrollHeight-box.clientHeight,want)); } } }
  el.querySelectorAll("[data-ck]").forEach(b=>b.onclick=e=>{ e.stopPropagation();
    const i=+b.dataset.ck, pl=tabPlans[i]; if(!pl) return;
    if(b.dataset.usb){ toast("⛔ This way lands on US soil — "+(gate.label||"Montana needs her US visa")+". Greyed out until it's in hand."); return; }
    TB.selTouched=true;
    const k2=selKey(pl), was=!!TB.sel[k2];
    if(was) delete TB.sel[k2]; else TB.sel[k2]=true;
    if(!was){ markSig(i); if(TB.step===2) TB.homeIdx=i; else TB.planIdx=i; TB.userView=null; TB.rot=null; TB._drag=null; } // show what you just ticked
    tbRender(); });
  const rm=$("tbRailMin"); if(rm) rm.onclick=e=>{ e.stopPropagation(); TB.railMin=!TB.railMin; tbRender(); };
  const sb=$("tbShowBad"); if(sb) sb.onclick=e=>{ e.stopPropagation(); TB.showBad=true; tbRender(); };
  const vy=$("tbVoyage"); if(vy) vy.onclick=e=>{ e.stopPropagation();
    TB.voyage=!TB.voyage; TB.planTouched=false; TB.outSig=null; TB.homeSig=null;
    if(TB.hub) TB.plans=buildPlans(TB.hub);
    toast(TB.voyage?"Multi-stop trips on — longer journeys, more countries":"Multi-stop trips off");
    tbRender(); };
  const hb=$("tbHideBad"); if(hb) hb.onclick=e=>{ e.stopPropagation(); TB.showBad=false; tbRender(); };
  const sa=$("tbSelAll"); if(sa) sa.onclick=()=>{
    TB.selTouched=true;
    // scoped to the visible rows — never the folded-away duds
    const keys=(TB._visKeys&&TB._visKeys.length)?TB._visKeys:tabPlans.map(pl=>selKey(pl));
    const allOn2=keys.every(k2=>TB.sel[k2]);
    keys.forEach(k2=>{ if(allOn2) delete TB.sel[k2]; else TB.sel[k2]=true; });
    tbRender(); };
  const gb=$("tbGo"); if(gb) gb.onclick=()=>{
    const n=pushSelected();
    if(!n){ toast("Tick at least one plan first"); return; }
    if(TB.step===1){ TB.step=2; TB.homeIdx=0; TB.homeSig=null; TB.userView=null; tbRender(); toast(n+" way"+(n===1?"":"s")+" saved — now pick your ways home"); }
    else if(typeof window.openTripChecklist==="function"){ TB.step=3; TB.userView=null; tbRender(); openChk(); }
  };
  const wayOf=(pl,i)=>({legs:pl.legs.map(l=>({f:l.f,t:l.t,comm:!!l.comm,cost:l.cost,p:l.p})),
    pct:pl.allPaid?null:planPct(pl),letter:"ABCDEFGH"[i]||String(i+1),start:pl.start});
  const pushSelected=()=>{ if(typeof window.__chkSetWays!=="function") return 0;
    const picked=tabPlans.map((pl,i)=>({pl,i})).filter(x=>TB.sel[selKey(x.pl)]);
    window.__chkSetWays(TB.step===2?"home":"out",picked.map(x=>wayOf(x.pl,x.i)));
    return picked.length; };
  el.querySelectorAll("[data-start]").forEach(b=>b.onclick=()=>toggleStart(b.dataset.start));
  el.querySelectorAll("[data-clearstarts]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); // full reset → re-pick from scratch
    TB.starts=[]; saveStarts(); TB.plans=[]; TB.planIdx=0;
    TB.mode="pickStart"; TB.pendingDest=TB.hub; TB.userView=null; tbRender(); });
  el.querySelectorAll("[data-qadd]").forEach(b=>b.onclick=()=>{ // quick add a whole region
    const cmd=b.dataset.qadd;
    const restricted=(typeof RESTRICTED!=="undefined")?RESTRICTED:new Set();
    const add=TERMS.filter(t=>t.cmd===cmd&&!restricted.has(t.key)&&!TB.starts.includes(t.key)).map(t=>t.key);
    if(!add.length){ toast("All "+(cmd==="INDOPACOM"?"Asia/Pacific":cmd==="EUCOM"?"Europe":cmd==="CENTCOM"?"Gulf":"CONUS")+" bases are already ⭐"); return; }
    TB.starts=TB.starts.concat(add); saveStarts(); toast("Added "+add.length+" bases ⭐"); tbRender(); });
  el.querySelectorAll("[data-rmstart]").forEach(b=>b.onclick=e=>{ e.stopPropagation();
    TB.starts=TB.starts.filter(S=>S!==b.dataset.rmstart); saveStarts();
    if(!pick&&TB.hub&&!TB.starts.includes(TB.hub)&&TB.starts.length){ TB.plans=buildPlans(TB.hub); TB.planIdx=0; }
    if(!TB.starts.length){ TB.mode="pickStart"; TB.pendingDest=TB.hub; }
    tbRender(); });
  const ad=$("tbAddStart"); if(ad) ad.onclick=()=>{ TB.mode="pickStart"; TB.pendingDest=TB.hub; TB.userView=null; tbRender(); };
  const ad2=$("tbAddStart2"); if(ad2) ad2.onclick=()=>{ TB.mode="pickStart"; TB.pendingDest=TB.hub; TB.userView=null; tbRender(); };
  const sd=$("tbStartDone"); if(sd) sd.onclick=()=>{ if(!TB.starts.length) return;
    TB.mode="plan"; const d=TB.pendingDest; TB.pendingDest=null;
    if(d&&!TB.starts.includes(d)) setDest(d); else if(TB.hub&&!TB.starts.includes(TB.hub)) setDest(TB.hub); else tbRender(); };
  const se=$("tbSearch"); if(se){ se.oninput=()=>{ const q=se.value.toLowerCase();
      $("tbSlist").querySelectorAll("button").forEach(b=>{ b.style.display=b.textContent.toLowerCase().includes(q)?"":"none"; }); };
    setTimeout(()=>se.focus(),50); }
  // A start you're not currently flying from: tapping its ⭐ switches the plan to leave from there.
  const flyFrom=S=>{ const i=TB.plans.findIndex(pl=>pl.start===S);
    if(i<0){ toast("No known way from "+jmName(S)+" to "+jmName(TB.hub)); return; }
    TB.planTouched=true;
    TB.outSig=legSig(TB.plans[i]);   // without this the re-sort snaps straight back to the old plan
    TB.planIdx=i;
    TB.userView=null; TB.rot=null; TB._drag=null;
    TB._focusPlan=true;
    toast("Flying from "+jmName(S));
    tbRender(); };
  const pickBase=k2=>{
    if(pick){ toggleStart(k2); return; }
    if(payoff||TB.step===2) return;
    if(TB.starts.includes(k2)){ if(k2!==activeStart) flyFrom(k2); return; }
    if(k2===TB.hub) return;
    TB.trail.push(TB.hub); setDest(k2);
  };
  el.querySelectorAll("[data-pinhit]").forEach(n=>{
    n.style.pointerEvents="all"; n.style.cursor="pointer";
    n.onclick=e=>{ e.stopPropagation(); pickBase(n.dataset.pinhit); };
  });
  el.querySelectorAll(".tb-pin[data-pin]").forEach(n=>n.onclick=e=>{ e.stopPropagation(); pickBase(n.dataset.pin); });
  // every base star on the globe, not just the destination one
  el.querySelectorAll("[data-hubkey]").forEach(n=>{
    const act=e=>{ e.stopPropagation();
      const k2=n.dataset.hubkey;
      if(n.hasAttribute("data-hub")){ TB.hubCard=!TB.hubCard; tbRender(); return; }
      if(!pick&&k2===activeStart){ toast("Departing from "+jmName(k2)+" — tap another ⭐ to fly from there instead"); return; }
      pickBase(k2); };
    n.onclick=act;
    n.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); act(e); } };
  });
  const bh=$("tbBackHub"); if(bh) bh.onclick=()=>{ setDest(TB.trail.pop()); };
  const s1=$("tbStep1"); if(s1) s1.onclick=()=>{ TB.step=1; TB.userView=null; TB.rot=null; TB._drag=null; tbRender(); };
  const s2=$("tbStep2"); if(s2) s2.onclick=()=>{ if(TB.plans.length){ TB.step=2; TB.homeIdx=0; TB.homeSig=null; TB.userView=null; TB.rot=null; TB._drag=null; tbRender(); } else toast("Build your flight there first"); };
  // clear the grab too, or a stale pointermove writes the hand-spin straight back
  const rc=$("tbRecenter"); if(rc) rc.onclick=()=>{ TB.userView=null; TB.rot=null; TB._drag=null; tbRender(); };
  const sp=$("tbSeePath"); if(sp) sp.onclick=()=>{ TB.userView=null; TB.rot=null; TB._drag=null; tbRender(); };
  el.querySelectorAll("[data-board]").forEach(b=>{
    b.onclick=()=>{ TB.board=false; TB.boardHover=null; setDest(b.dataset.board);
      toast("Every way to "+jmName(b.dataset.board)); };
    // hover a row → that route lights on the globe, the other fifteen fall back to the quiet web
    b.onmouseenter=()=>{ if(TB.boardHover===b.dataset.board) return;
      TB.boardHover=b.dataset.board; tbRender(); };
    b.onfocus=b.onmouseenter;
  });
  const blist=el.querySelector(".tb-board");
  if(blist) blist.onmouseleave=()=>{ if(!TB.boardHover) return; TB.boardHover=null; tbRender(); };
  const bo=$("tbBoardOut"); if(bo) bo.onclick=()=>{ TB.board=false; TB.boardHover=null; TB.pickDest=true; tbRender(); };
  ["tbPickDest","tbPickDest2"].forEach(id=>{ const b=$(id); if(b) b.onclick=()=>{ TB.pickDest=true; tbRender(); }; });
  const dc=$("tbDestClose"); if(dc) dc.onclick=()=>{ TB.pickDest=false; tbRender(); };
  const ds=$("tbDestSearch"); if(ds){ ds.oninput=()=>{ const q=ds.value.toLowerCase();
      $("tbDlist").querySelectorAll("button").forEach(b=>{ b.style.display=b.textContent.toLowerCase().includes(q)?"":"none"; }); };
    setTimeout(()=>ds.focus(),60); }
  el.querySelectorAll("[data-dest]").forEach(b=>b.onclick=()=>{
    if(b.dataset.usb){ toast("⛔ That base is on US soil — "+(gate.label||"Montana needs her US visa")); return; }
    const k2=b.dataset.dest;
    TB.pickDest=false;
    if(k2===TB.hub){ tbRender(); return; }
    if(TB.hub) TB.trail.push(TB.hub);
    setDest(k2);
    toast("Planning ways to "+jmName(k2)); });
  const nx=$("tbNext"); if(nx) nx.onclick=()=>{ if(TB.step===1&&plan){ TB.step=2; TB.homeIdx=0; TB.homeSig=null; } else if(TB.step===2&&plan2) TB.step=3; TB.userView=null; TB.rot=null; TB._drag=null; tbRender(); };
  const bk=$("tbBack"); if(bk) bk.onclick=()=>{ TB.step=1; TB.userView=null; TB.rot=null; TB._drag=null; tbRender(); };
  const rs=$("tbRestart"); if(rs) rs.onclick=()=>{ TB.step=1; TB.homeIdx=0; TB.homeSig=null; TB.userView=null; TB.rot=null; TB._drag=null; tbRender(); };
  const tf=$("tbFire"); if(tf) tf.onclick=()=>openRapidFire(activeStart||TB.starts[0]);
  // The checklist dock lives at z-index 44; this overlay sits at 410 and covers the whole screen, so
  // opening it without standing aside looked like the button did nothing.
  const openChk=()=>{
    if(typeof window.openTripChecklist!=="function"){ toast("Checklist isn't loaded yet — reload the page"); return; }
    cancelAnimationFrame(TB._raf); TB._raf=0;
    el.classList.remove("show");
    window.openTripChecklist();
  };
  const ck=$("tbChk"); if(ck) ck.onclick=openChk;
  if(typeof window.__chkSync==="function") window.__chkSync();
  // pan/zoom
  const sv=el.querySelector("svg");
  sv.style.touchAction="none";
  sv.addEventListener("wheel",e=>{ e.preventDefault();
    const cur=TB.userView||{k,tx,ty};
    const nk=Math.max(.7,Math.min(9,cur.k*Math.exp(-e.deltaY*0.0016)));
    TB.userView={k:nk,tx:e.clientX-(e.clientX-cur.tx)*nk/cur.k,ty:e.clientY-(e.clientY-cur.ty)*nk/cur.k};
    tbRender();
  },{passive:false});
  // Dragging SPINS the globe (it used to slide the whole drawing, which could never reach the far
  // side). The drag state lives on TB, not in this closure: every pointermove re-renders the panel and
  // reattaches these handlers, so a local would be reset to null after the first move of every drag.
  // Only the grab starts here. Move/up live on window and are installed ONCE (see tbSpinBind below):
  // this <svg> is rebuilt on every spin frame, so anything bound to it — including pointer capture,
  // whose loss fires pointercancel — dies mid-drag and froze the rotation after the first move.
  const dpp=90/Math.max(60,proj.scale()*k);   // degrees per pixel — the grab feels 1:1 at any zoom
  sv.onpointerdown=e=>{ const r=proj.rotate();
    TB._drag={x:e.clientX,y:e.clientY,r:[r[0],r[1]],dpp:dpp,moved:false};
    el.classList.add("dragging"); };
}
// bound once, on window — survives every re-render the spin itself triggers
(function tbKeyBind(){
  addEventListener("keydown",e=>{
    if(e.key!=="ArrowDown"&&e.key!=="ArrowUp") return;
    const el=document.getElementById("tripb");
    if(!el||!el.classList.contains("show")) return;
    const t=e.target;
    if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable)) return;
    if(t&&t.closest&&t.closest("[data-plan]")) return;   // the button's own handler has it
    if(typeof TB._stepPlan==="function"&&TB._stepPlan(e.key==="ArrowDown"?1:-1)) e.preventDefault();
  });
})();
(function tbSpinBind(){
  const end=()=>{ if(!TB._drag) return;
    TB._drag=null;
    const el=$("tripb"); if(el) el.classList.remove("dragging");
    if(TB._spinRaf){ cancelAnimationFrame(TB._spinRaf); TB._spinRaf=0; }
    tbRender(); };
  addEventListener("pointermove",e=>{ const d=TB._drag; if(!d) return;
    const dx=e.clientX-d.x, dy=e.clientY-d.y;
    if(!d.moved&&Math.hypot(dx,dy)<=3) return;
    d.moved=true;
    TB.rot=[d.r[0]+dx*d.dpp, Math.max(-88,Math.min(88,d.r[1]-dy*d.dpp))];
    if(!TB._spinRaf) TB._spinRaf=requestAnimationFrame(()=>{ TB._spinRaf=0; tbRender(); });
  },{passive:true});
  addEventListener("pointerup",end,{passive:true});
  addEventListener("pointercancel",end,{passive:true});
})();
function toggleStart(k2){
  if(TB.starts.includes(k2)) TB.starts=TB.starts.filter(S=>S!==k2);
  else TB.starts.push(k2);
  saveStarts(); tbRender();
}
function setDest(k2){
  TB.board=false; TB.boardHover=null; TB.showBad=false;   // a new destination starts folded again
  TB.hub=k2; TB.planIdx=0; TB.outSig=null; TB.homeSig=null; TB.planTouched=false; TB.hubCard=false; TB.userView=null; TB.rot=null; TB._drag=null; TB.step=1;
  TB.plans=buildPlans(TB.hub);
  tbRender();
}
window.tbStarts=function(){
  if(!TB.starts.length){ try{ TB.starts=JSON.parse(localStorage.getItem("spacea.starts")||"null")||[]; }catch(e){} }
  return TB.starts.slice();
};
window.tbSetStarts=function(arr){
  TB.starts=(arr||[]).filter(k=>tbCoord(k));
  saveStarts();
};
window.openJourney=function(key){
  TB.board=false; TB.boardHover=null; TB.showBad=false;
  let el=$("tripb");
  if(!el){ el=document.createElement("div"); el.id="tripb"; document.body.appendChild(el);
    addEventListener("resize",()=>{ if(el.classList.contains("show")) tbRender(); });
    document.addEventListener("visibilitychange",()=>el.classList.toggle("tb-paused",document.hidden)); }
  el.classList.add("show");
  TB.trail=[]; TB.homeIdx=0; TB.homeSig=null; TB.outSig=null; TB.step=1; TB.userView=null; TB.rot=null; TB._drag=null; TB.hubCard=false;
  if(!TB.starts.length){ try{ TB.starts=JSON.parse(localStorage.getItem("spacea.starts")||"null")||[]; }catch(e){}
    if(!TB.starts.length){ try{ const old=localStorage.getItem("spacea.start"); if(old) TB.starts=[old]; }catch(e){} } }
  if(!TB.starts.length){ TB.mode="pickStart"; TB.pendingDest=key; tbRender(); return; }
  TB.mode="plan";
  // Clicking a base you launch FROM used to open an empty planner ("pick somewhere else"), which read
  // as nothing happening. A launch pad is not a dead end — show every way OUT of it instead.
  if(TB.starts.includes(key)){
    TB.hub=null; TB.plans=[]; TB.trail=[]; TB.hubCard=false; TB.pickDest=false;
    let n=0; try{ n=boardRoutes().rows.length; }catch(e){}
    if(n){ TB.board=true; TB.boardFrom=key; if(typeof toast==="function") toast(jmName(key)+" is one of your launch pads — here's every way out"); }
    else { TB.board=false; TB.pickDest=true; if(typeof toast==="function") toast(jmName(key)+" is a launch pad — pick where you want to fly"); }
    tbRender(); return;
  }
  setDest(key);
};
})();
