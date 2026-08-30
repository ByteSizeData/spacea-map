// ═══ ✨ Smart routes — every way out, drawn on the live globe. Hover a path, it tells you everything ═══
// No list, no panel: the world IS the board. Paths hold the data; the cursor asks for it.
(function(){
const $=id=>document.getElementById(id);
const GREEN="#34D399", AMBER="#FBBF24";
const nm=k=>(typeof jmName==="function"?jmName(k):k);
const css=document.createElement("style");
css.textContent=`
  /* the one bit of chrome: a pill that says how many ways there are, and how to read them */
  #srChip{position:fixed;right:18px;top:78px;z-index:44;display:none;align-items:center;gap:11px;
    padding:8px 10px 8px 13px;border-radius:13px;font-family:var(--font-body);font-size:12px;
    color:var(--color-text);border:1px solid var(--color-divider);
    background:color-mix(in srgb,var(--color-surface) 92%,transparent);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:var(--shadow-md);}
  #srChip.show{display:flex;}
  #srChip .ct{min-width:0;}
  #srChip .ct b{display:block;font-family:var(--font-heading);font-size:13px;font-weight:500;
    letter-spacing:-.01em;white-space:nowrap;}
  #srChip .ct span{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:10.5px;
    white-space:nowrap;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  #srChip .ct i{display:inline-block;width:13px;height:0;border-top:2.5px solid ${GREEN};border-radius:2px;}
  #srChip .ct i.pd{border-top-style:dashed;border-top-color:${AMBER};margin-left:3px;}
  #srChip .sx{flex:0 0 auto;width:26px;height:26px;border-radius:50%;border:1px solid var(--color-divider);
    background:none;color:var(--color-text);font-size:11px;cursor:pointer;}
  #srChip .sx:hover{border-color:var(--color-accent);
    background:color-mix(in srgb,var(--color-accent) 14%,transparent);}
  #srChip .sx:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  #srChip.none{display:none !important;}
  /* One affordance, not two: the line that names your origin IS the button that changes it. */
  #srChip .ctyb{display:block;margin:5px 0 0;padding:0 0 1px;border:0;background:none;font:inherit;
    font-size:10.5px;text-align:left;cursor:pointer;white-space:nowrap;
    color:color-mix(in srgb,var(--color-text) 45%,transparent);
    border-bottom:1px dashed color-mix(in srgb,var(--color-text) 24%,transparent);
    transition:color .18s,border-color .18s;}
  #srChip .ctyb:empty{display:none;}
  /* the routes page names its home bases in the title row — one control, not two */
  body.routes-page #srChip .ctyb{display:none;}
  #srChip .ctyb:hover,#srChip .ctyb.on{color:var(--color-accent);border-bottom-color:var(--color-accent);}
  #srChip .ctyb:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}

  /* ── "where are you flying from?" — one country, and the bases come with it ── */
  #srCty{position:fixed;right:18px;top:150px;z-index:45;display:none;width:250px;
    max-height:min(58vh,430px);overflow:auto;padding:9px;border-radius:13px;
    font-family:var(--font-body);border:1px solid var(--color-divider);
    background:color-mix(in srgb,var(--color-surface) 96%,transparent);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:var(--shadow-lg);}
  #srCty.show{display:block;}
  #srCty h6{margin:2px 4px 8px;font-family:var(--font-heading);font-size:11.5px;font-weight:500;
    letter-spacing:.02em;color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  #srCty button{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;
    font:inherit;font-size:12px;text-align:left;padding:7px 9px;margin-bottom:2px;border-radius:9px;
    border:1px solid transparent;background:none;color:var(--color-text);cursor:pointer;
    transition:background .18s,border-color .18s;}
  #srCty button small{flex:0 0 auto;font-size:10px;
    color:color-mix(in srgb,var(--color-text) 45%,transparent);}
  #srCty button:hover{border-color:color-mix(in srgb,var(--color-accent) 55%,transparent);
    background:color-mix(in srgb,var(--color-accent) 12%,transparent);}
  #srCty button.on{border-color:var(--color-accent);
    background:color-mix(in srgb,var(--color-accent) 16%,transparent);}
  #srCty button.on small{color:var(--color-accent);}
  #srCty button:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  @media (max-width:900px){ #srCty{right:12px;left:12px;width:auto;top:auto;bottom:96px;} }

  /* the floating card — everything the old row said, arriving under the cursor */
  #srTip{position:fixed;left:0;top:0;z-index:60;width:334px;pointer-events:none;opacity:0;
    transform:translate3d(0,4px,0);transition:opacity .13s ease,transform .13s ease;
    font-family:var(--font-body);color:var(--color-text);border-radius:13px;overflow:hidden;
    border:1px solid color-mix(in srgb,${GREEN} 34%,var(--color-divider));
    background:color-mix(in srgb,var(--color-surface) 95%,transparent);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:var(--shadow-lg);}
  #srTip.on{opacity:1;transform:translate3d(0,0,0);}
  #srTip.paidend{border-color:color-mix(in srgb,${AMBER} 34%,var(--color-divider));}
  #srTip .sr-th{display:flex;align-items:baseline;gap:8px;padding:10px 12px 8px;}
  #srTip .sr-th .sr-rk{flex:0 0 auto;font-size:10px;font-variant-numeric:tabular-nums;letter-spacing:.04em;
    color:color-mix(in srgb,var(--color-text) 40%,transparent);}
  #srTip .sr-th .sr-nmx{flex:1 1 auto;min-width:0;}
  #srTip .sr-th b{display:block;font-family:var(--font-heading);font-size:14px;font-weight:500;
    letter-spacing:-.01em;line-height:1.25;text-wrap:pretty;}
  #srTip .sr-th small{display:block;margin-top:2px;font-size:10.5px;
    color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  #srTip .sr-th .sr-ic{flex:0 0 auto;font-size:14px;}
  #srTip .sr-lgs{display:flex;flex-direction:column;gap:0;padding:0 12px 2px;}
  #srTip .sr-lg{display:grid;grid-template-columns:1fr auto;align-items:baseline;column-gap:8px;
    padding:5px 0;margin:0;font-size:10.5px;
    border-top:1px solid color-mix(in srgb,var(--color-text) 9%,transparent);}
  #srTip .sr-lg .sr-hop{display:block;min-width:0;margin:0;font-size:10.5px;line-height:1.45;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    color:color-mix(in srgb,var(--color-text) 78%,transparent);}
  #srTip .sr-lg .sr-hop em{font-style:normal;color:color-mix(in srgb,var(--color-text) 40%,transparent);}
  #srTip .sr-lg .sr-px{display:block;margin:0;font-size:11px;font-weight:600;
    font-variant-numeric:tabular-nums;color:${GREEN};text-align:right;white-space:nowrap;}
  #srTip .sr-lg .sr-px u{text-decoration:none;font-weight:400;font-size:10px;
    color:color-mix(in srgb,var(--color-text) 45%,transparent);}
  #srTip .sr-lg.p .sr-px{color:${AMBER};}
  #srTip .sr-lg.cur{box-shadow:inset 2px 0 0 ${GREEN};padding-left:7px;
    background:color-mix(in srgb,${GREEN} 9%,transparent);border-radius:0 4px 4px 0;}
  #srTip .sr-lg.cur.p{background:color-mix(in srgb,${AMBER} 9%,transparent);box-shadow:inset 2px 0 0 ${AMBER};}
  /* the odds band — the one number that decides whether you go, said in words too */
  #srTip .sr-odds{display:flex;align-items:center;gap:9px;margin:6px 10px 2px;padding:7px 10px;
    border-radius:9px;border:1px solid color-mix(in srgb,var(--color-text) 12%,transparent);}
  #srTip .sr-odds b{font-size:19px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;}
  #srTip .sr-odds .sr-ow{min-width:0;display:block;}
  #srTip .sr-odds .sr-ow i{display:block;font-style:normal;font-size:11px;font-weight:600;line-height:1.25;}
  #srTip .sr-odds .sr-ow u{display:block;text-decoration:none;font-size:9.5px;line-height:1.3;
    color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  /* labeled facts — no bare numbers left to decode */
  #srTip .sr-facts{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin-top:4px;
    padding:8px 12px 10px;font-size:10.5px;line-height:1.35;
    border-top:1px solid color-mix(in srgb,var(--color-text) 12%,transparent);
    background:color-mix(in srgb,#000 14%,transparent);}
  #srTip .sr-facts dt{margin:0;font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
    white-space:nowrap;color:color-mix(in srgb,var(--color-text) 42%,transparent);}
  #srTip .sr-facts dd{margin:0;min-width:0;color:color-mix(in srgb,var(--color-text) 88%,transparent);}
  #srTip .sr-facts dd b{font-weight:700;}
  #srTip .sr-facts dd.g b{color:${GREEN};}
  #srTip .sr-facts dd.a b{color:${AMBER};}
  #srTip .sr-cta{padding:6px 12px 8px;font-size:10px;letter-spacing:.02em;
    color:color-mix(in srgb,var(--color-text) 42%,transparent);}

  #srLabels{position:fixed;inset:0;z-index:20;pointer-events:none;}
  #srLabels .sl{position:absolute;transform:translate(-50%,-140%);white-space:nowrap;
    padding:3px 8px;border-radius:9px;font-size:11.5px;font-weight:500;font-family:var(--font-body);
    color:var(--color-text);border:1px solid color-mix(in srgb,${GREEN} 42%,transparent);
    background:color-mix(in srgb,var(--color-surface) 92%,transparent);
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:var(--shadow-sm);}
  #srLabels .sl.q{font-size:10.5px;padding:2px 7px;
    border-color:color-mix(in srgb,var(--color-text) 16%,transparent);
    color:color-mix(in srgb,var(--color-text) 82%,transparent);}
  #srLabels .lg{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:6px;
    white-space:nowrap;padding:2px 7px;border-radius:8px;font-family:var(--font-body);font-size:10.5px;
    background:color-mix(in srgb,var(--color-bg) 78%,transparent);
    backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}
  #srLabels .lg em{font-style:normal;font-weight:700;color:${GREEN};}
  #srLabels .lg.paid em{color:${AMBER};}
  #srLabels .lg.flip{transform:translate(-100%,-50%);}
  #srLabels .lg i{font-style:normal;font-variant-numeric:tabular-nums;
    color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  #srLabels .sl.flip{transform:translate(-100%,-140%);}
  #srLabels .sl.last{border-color:color-mix(in srgb,var(--color-accent) 60%,transparent);}
  /* Hovering a PATH must wake the bases on it — the same shake the star gives you on direct hover,
     driven off the route under the cursor instead. termShake lives in the page's own stylesheet. */
  #map .term.sr-lit .mk-inner{animation:termShake .52s cubic-bezier(.36,.07,.19,.97) both;}
  #map .term.sr-lit .term-ring{stroke-width:2px;
    filter:drop-shadow(0 0 6px color-mix(in srgb,var(--term) 80%,transparent));}
  #map .marker.signed.sr-lit .term-ring{
    filter:drop-shadow(0 0 7px color-mix(in srgb,var(--color-accent) 85%,transparent));}
  @media (prefers-reduced-motion:reduce){
    #map .term.sr-lit .mk-inner{animation:none;transform:scale(1.12);}
  }
  body.sr-open #map{cursor:default;}
  body.sr-hot #map{cursor:pointer;}
  @media (max-width:900px){ #srChip{right:12px;left:12px;top:auto !important;bottom:16px;}
    #srTip{width:min(334px,calc(100vw - 28px));} }`;
document.head.appendChild(css);

let ROWS=[], SEL=null, HOV=null, HOVLEG=null, ALL=false;

const byKey=k=>ROWS.filter(r=>r.key===k)[0]||null;

// ── Launch pads by COUNTRY. Nobody thinks in base keys — they think "I'm flying out of Japan".
// Pick the country and every Space-A terminal in it (plus any just over the border, within 900km)
// becomes a launch pad, which is what the route engine actually needs.
const CTAIL={ROK:"South Korea",AUS:"Australia",HN:"Honduras",UK:"United Kingdom",
  HI:"Hawaii",AK:"Alaska",PR:"Puerto Rico"};
function ctyOf(t){
  const tail=String(t.code||"").split(",").pop().trim();
  if(t.cmd==="CONUS") return "United States";
  if(CTAIL[tail]) return CTAIL[tail];
  if(tail==="DE") return "Germany";
  if(/^[A-Z]{2}$/.test(tail)) return "United States";
  if(tail==="Azores") return "Portugal";
  if(tail==="Indian Ocean") return "Diego Garcia";
  return tail;
}
function termsAll(){ return (typeof TERMS!=="undefined"?TERMS:[]).filter(t=>t&&t.key&&t.lat!=null); }
function countries(){
  const m=new Map();
  termsAll().forEach(t=>{ if(typeof RESTRICTED!=="undefined"&&RESTRICTED.has(t.key)) return;
    const c=ctyOf(t); if(!c) return;
    (m.get(c)||m.set(c,[]).get(c)).push(t); });
  return [...m.entries()].map(([c,ts])=>({c,ts})).sort((a,b)=>b.ts.length-a.ts.length||a.c.localeCompare(b.c));
}
function padsFor(list){
  const km=(a,b)=>(typeof window.tbKm==="function")?window.tbKm(a,b):1e9;
  const near=termsAll().filter(t=>!list.includes(t)&&list.some(o=>km(t,o)<900)
    &&!(typeof RESTRICTED!=="undefined"&&RESTRICTED.has(t.key)));
  let hq=null; try{ hq=JSON.parse(localStorage.getItem("spacea.hq")||"null"); }catch(e){}
  // in-country before over-the-border, the busy terminals before the quiet ones, and among equals
  // the ones nearest home — so a big country picks the bases you'd actually drive to.
  const rank=t=>(list.includes(t)?0:1000)+((typeof PRIMARY!=="undefined"&&PRIMARY.has(t.key))?0:100)
    +(hq&&hq.lat!=null?km(t,hq)/40000:0);
  return list.concat(near).sort((a,b)=>rank(a)-rank(b)).slice(0,5).map(t=>t.key);
}
function ctyNow(){
  const cur=(typeof window.tbStarts==="function")?window.tbStarts():[];
  const t=termsAll().find(x=>cur.indexOf(x.key)>-1);
  return t?ctyOf(t):null;
}
function ctyPanel(){
  let p=$("srCty");
  if(!p){ p=document.createElement("div"); p.id="srCty"; document.body.appendChild(p); }
  const now=ctyNow();
  p.innerHTML='<h6>Where are you flying out of?</h6>'+countries().map(g=>
    '<button data-cty="'+g.c.replace(/"/g,"&quot;")+'"'+(g.c===now?' class="on"':"")+'>'+
    '<span>'+g.c+'</span><small>'+g.ts.length+' base'+(g.ts.length===1?"":"s")+'</small></button>').join("");
  p.querySelectorAll("[data-cty]").forEach(b=>b.onclick=()=>{
    const g=countries().find(x=>x.c===b.dataset.cty); if(!g) return;
    const keys=padsFor(g.ts);
    if(typeof window.tbSetStarts==="function") window.tbSetStarts(keys);
    p.classList.remove("show");
    const rb=$("srChip")&&$("srChip").querySelector(".ctyb"); if(rb) rb.classList.remove("on");
    if(typeof toast==="function") toast(g.c+" — "+keys.length+" launch pad"+(keys.length===1?"":"s")+" set");
    window.openSmartRoutes({onMap:true});
  });
  return p;
}
function toggleCty(force){
  const p=ctyPanel();
  const on=force==null?!p.classList.contains("show"):!!force;
  p.classList.toggle("show",on);
  const rb=$("srChip")&&$("srChip").querySelector(".ctyb"); if(rb) rb.classList.toggle("on",on);
}
window.srPickCountry=()=>toggleCty(true);
function coordOf(k){
  if(typeof window.tbCoord==="function"){ const c=window.tbCoord(k); if(c) return c; }
  if(typeof G!=="undefined"&&G[k]) return G[k];
  return null;
}
// every leg of every route, as arcs the globe can draw — the hovered/picked one bright, the rest a quiet web
function arcsFor(){
  const out=[], seen={};
  const show=SEL?ROWS.filter(r=>r.key===SEL):ROWS;
  show.forEach((r,i)=>{
    const hot=SEL?true:(HOV===r.key);
    r.legs.forEach((l,j)=>{
      const A=coordOf(l.f), B=coordOf(l.t); if(!A||!B) return;
      // routes out of one HQ share their trunk hops — draw each hop ONCE or the
      // stacked strokes and glows compound into a blown-out white line
      const pair=(l.f<l.t?l.f+"\u2192"+l.t:l.t+"\u2192"+l.f), had=seen[pair];
      if(had){ if(hot){ had.hot=true; had.rkey=r.key; had.rleg=j; } return; }
      const a={id:"sr:"+pair,leg:true,hot,paid:l.paid,rkey:r.key,rleg:j,
        sLat:A.lat,sLon:A.lon,lat:B.lat,lon:B.lon,
        col:l.paid?AMBER:GREEN,act:r.act==="🏂"?"snow":"kite"};
      seen[pair]=a; out.push(a);
    });
  });
  // The board draws the BEST plan per destination, so a gateway that finishes a trip (Hickam finishes
  // Maui) looked like a dead end — its own departures were never on screen. Hover the star and they
  // fan out: every documented Space-A link out of that base, quiet so they never fight the routes.
  if(HOVT){
    const A=coordOf(HOVT);
    const E=(typeof window.JM_EDGES!=="undefined"?window.JM_EDGES:[]);
    if(A) E.filter(e=>e.f===HOVT).sort((x,y)=>y.p-x.p).slice(0,9).forEach(e=>{
      const B=coordOf(e.t); if(!B) return;
      const pair=(HOVT<e.t?HOVT+"\u2192"+e.t:e.t+"\u2192"+HOVT);
      if(seen[pair]) return;
      const arc={id:"srT:"+pair,leg:true,spoke:true,hot:false,paid:false,
        sLat:A.lat,sLon:A.lon,lat:B.lat,lon:B.lon,col:jmBandOf(e.p),act:"kite"};
      seen[pair]=arc; out.push(arc);
    });
  }
  return out;
}
const jmBandOf=p=>(typeof window.jmBand==="function")?window.jmBand(p):(p>=60?GREEN:p>=30?AMBER:"#FF6B6B");
const fh=x=>{ const v=Math.round(x*2)/2; return (v%1?v.toFixed(1):v)+"h"; };
// what the whole trip actually charges — summed from the paid legs' own ranges
function allIn(r){
  let lo=0,hi=0,any=false;
  r.legs.forEach(l=>{ if(!l.paid) return;
    const m=String(l.cost||"").replace(/[$,\s]/g,"").match(/(\d+)(?:[–\-](\d+))?/);
    if(!m) return; any=true; lo+=+m[1]; hi+=+(m[2]||m[1]); });
  return any?(lo===hi?"~$"+lo:"~$"+lo+"–"+hi):null;
}
// 42% means nothing on its own — say what it implies, and colour it the way the map does
function odds(p){
  if(p>=70) return {c:GREEN,w:"Good odds of a free seat",n:"seats usually go begging on this run"};
  if(p>=50) return {c:GREEN,w:"Decent odds of a free seat",n:"more often than not you get on"};
  if(p>=35) return {c:AMBER,w:"Coin flip on a free seat",n:"have a backup ticket ready"};
  if(p>=20) return {c:AMBER,w:"Long shot for a free seat",n:"only worth it if your dates are loose"};
  return {c:"#FF6B6B",w:"Rarely a free seat",n:"a lucky break, not a plan"};
}
// the honest headline: free all the way, a real saving, or simply what it costs
function headline(r){
  if(r.free) return {t:"Free the whole way",pay:false};
  if(r.save>0) return {t:"save ~$"+r.save+" each",pay:false};
  const a=allIn(r);
  return a?{t:a+" all-in each",pay:true}:{t:"about the same as flying commercial",pay:true};
}

// ── the floating card ──
function tipEl(){
  let t=$("srTip");
  if(!t){ t=document.createElement("div"); t.id="srTip"; document.body.appendChild(t); }
  return t;
}
function paintTip(r,legIdx){
  const t=tipEl();
  const rank=ROWS.indexOf(r)+1;
  const endPaid=r.legs.length&&r.legs[r.legs.length-1].paid;
  const hl=headline(r);
  const od=odds(r.pct);
  const offNote=r.act==="🏂"?"off-season — no snow yet":"off-season — wind is wrong";
  const nFree=r.legs.filter(l=>!l.paid).length, nPaid=r.legs.length-nFree;
  const hops=r.legs.length+" military hop"+(r.legs.length===1?"":"s")
    +(nPaid?" — "+nFree+" free, "+nPaid+" bought":", all free");
  t.classList.toggle("paidend",!!endPaid&&!r.free);
  t.innerHTML=`
    <div class="sr-th"><span class="sr-rk">${String(rank).padStart(2,"0")}</span>
      <span class="sr-nmx"><b>${r.spot}</b>
        <small>${r.act==="🏂"?"Snowboard":"Kitesurf"} · via ${nm(r.key)}</small></span>
      <span class="sr-ic">${r.act}</span></div>
    <div class="sr-lgs">${r.legs.map((l,j)=>`
      <div class="sr-lg${l.paid?" p":""}${j===legIdx?" cur":""}">
        <span class="sr-hop">${nm(l.f)} <em>→</em> ${nm(l.t)}</span>
        <span class="sr-px">${l.paid?"~"+l.cost:"Free"} <u>· ${fh(l.h||0)}</u></span></div>`).join("")}</div>
    <div class="sr-odds" style="border-color:color-mix(in srgb,${od.c} 38%,transparent);background:color-mix(in srgb,${od.c} 8%,transparent)">
      <b style="color:${od.c}">${r.pct}%</b>
      <span class="sr-ow"><i style="color:${od.c}">${od.w}</i><u>${od.n}</u></span></div>
    <dl class="sr-facts">
      <dt>Cost</dt><dd class="${hl.pay?"a":"g"}"><b>${hl.t}</b></dd>
      <dt>Time</dt><dd>≈${r.hrs}h door to door</dd>
      <dt>Flights</dt><dd>${hops}</dd>
      <dt>Season</dt><dd>${r.inSeason?"good to go right now":offNote}</dd>
      <dt>Confirm</dt><dd>the 72-hr board at ${nm(r.legs[0]?r.legs[0].f:r.start)}</dd>
    </dl>
    <div class="sr-cta">${document.body.classList.contains("routes-page")?"Click to plan this trip":SEL===r.key?"Click again to plan this trip":"Click to light it up"}</div>`;
}
function placeTip(x,y){
  const t=tipEl(), b=t.getBoundingClientRect();
  const w=b.width||264, h=b.height||150;
  let L=x+16, T=y+14;
  if(L+w>innerWidth-10) L=x-w-16;
  if(L<10) L=Math.min(10,innerWidth-w-10);
  if(T+h>innerHeight-10) T=Math.max(10,y-h-14);
  t.style.transform="translate3d("+Math.round(L)+"px,"+Math.round(T)+"px,0)";
}
function hideTip(){ const t=$("srTip"); if(t) t.classList.remove("on"); }

// ── hit-testing the paths: nearest arc within a forgiving radius, measured on screen ──
function nearestArc(cx,cy){
  const paths=document.querySelectorAll("#map path.arc, svg path.arc");
  let best=null, bd=1e9;
  for(let i=0;i<paths.length;i++){
    const el=paths[i], d=el.__data__;
    if(!d||!d.leg||!d.rkey) continue;
    const bb=el.getBoundingClientRect();
    if(!bb.width&&!bb.height) continue;
    if(cx<bb.left-18||cx>bb.right+18||cy<bb.top-18||cy>bb.bottom+18) continue;
    let L=0; try{ L=el.getTotalLength(); }catch(e){ continue; }
    if(!L) continue;
    const m=el.getScreenCTM(); if(!m) continue;
    const sc=Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))||1;
    const svg=el.ownerSVGElement; if(!svg) continue;
    const pt=svg.createSVGPoint(); pt.x=cx; pt.y=cy;
    const p=pt.matrixTransform(m.inverse());
    const n=Math.max(6,Math.min(26,Math.round(L/16)));
    let mn=1e12;
    for(let k=0;k<=n;k++){
      const q=el.getPointAtLength(L*k/n);
      const dd=(q.x-p.x)*(q.x-p.x)+(q.y-p.y)*(q.y-p.y);
      if(dd<mn) mn=dd;
    }
    const ds=Math.sqrt(mn)*sc;
    if(ds<bd){ bd=ds; best=d; }
  }
  return bd<=17?best:null;
}
let lastXY=null, lastRun=0, tmr=0;
function hoverAt(x,y){
  const d=nearestArc(x,y);
  const k=d?d.rkey:null, lg=d?d.rleg:null;
  document.body.classList.toggle("sr-hot",!!k);
  if(k!==HOV||lg!==HOVLEG){
    const rekey=k!==HOV;
    HOV=k; HOVLEG=lg;
    const r=k?byKey(k):null;
    if(r){ paintTip(r,lg); tipEl().classList.add("on"); } else hideTip();
    if(rekey&&!SEL) draw(); else if(rekey) labels();
  }
  if(k) placeTip(x,y);
}
// the world is everything that isn't chrome — panels, cards and controls keep their own clicks
const CHROME="#srChip,#srCty,#srTip,#srTop,#hero,button,a,input,select,textarea,label,[role=dialog],"+
  "#tripb,#chkPanel,#bellPanel,#detail,#controls,#legend,#chkBar,#chkStrip";
const onGlobe=e=>{ const t=e.target;
  return !(t&&t.closest&&t.closest(CHROME)); };
function runHover(){ tmr=0; lastRun=performance.now(); if(lastXY) hoverAt(lastXY[0],lastXY[1]); }
function onMove(e){
  if(!document.body.classList.contains("sr-open")) return;
  if(typeof window.pauseSpin==="function") window.pauseSpin(1200);   // don't slide the path out from under the cursor
  if(!onGlobe(e)){ if(HOV){ HOV=null; HOVLEG=null; hideTip();
      document.body.classList.remove("sr-hot"); if(!SEL) draw(); else labels(); }
    lastXY=null; return; }
  lastXY=[e.clientX,e.clientY];
  const dt=performance.now()-lastRun;
  if(dt>=45) runHover();
  else if(!tmr) tmr=setTimeout(runHover,45-dt);   // trailing edge: the last position always lands
}
// capture phase: the globe's own drag/hover handlers stop propagation, so we listen on the way down
addEventListener("pointermove",onMove,{passive:true,capture:true});
addEventListener("mousemove",onMove,{passive:true,capture:true});
addEventListener("pointerdown",e=>{
  if(!document.body.classList.contains("sr-open")||!onGlobe(e)) return;
  lastXY=[e.clientX,e.clientY]; hoverAt(e.clientX,e.clientY);
},{passive:true,capture:true});
window.__srHit=(x,y)=>{ const d=nearestArc(x,y); return d?{rkey:d.rkey,rleg:d.rleg}:null; };
// A card that's open must not have its subject drift away mid-read. Hold the world still for as long
// as one is live — re-armed every tick, not once per mouse move — and let it drift again the moment the
// card closes. With the globe stationary the re-check can never invalidate what you're reading.
setInterval(()=>{
  if(!document.body.classList.contains("sr-open")) return;
  if(HOV||SEL){ if(typeof window.pauseSpin==="function") window.pauseSpin(1200); }
  if(lastXY&&(HOV||SEL)) hoverAt(lastXY[0],lastXY[1]);
},200);

// ── clicking a path: light it up, then plan it ──
addEventListener("click",e=>{
  if(!document.body.classList.contains("sr-open")||!onGlobe(e)) return;
  const d=nearestArc(e.clientX,e.clientY);
  if(!d){ if(SEL){ SEL=null; hideTip(); draw(); } return; }
  const k=d.rkey;
  // On the routes page planning IS the point — one click, no "light it up first" step to discover.
  if(document.body.classList.contains("routes-page")){
    SEL=k; HOV=k; HOVLEG=d.rleg;
    const rr=byKey(k); if(rr) paintTip(rr,d.rleg);
    draw();
    close();
    if(typeof window.openJourney==="function") window.openJourney(k);
    else location.href="SpaceA-Kite-Snow-Map.html#plan="+encodeURIComponent(k);
    return;
  }
  if(SEL===k){
    // The routes page carries the whole app, so plan right here instead of bouncing to the map.
    close();
    if(typeof window.openJourney==="function") window.openJourney(k);
    else location.href="SpaceA-Kite-Snow-Map.html#plan="+encodeURIComponent(k);
    return;
  }
  SEL=k; HOV=k; HOVLEG=d.rleg;
  // the 200ms keeper above holds the world while this selection is live
  const r=byKey(k); if(r) paintTip(r,d.rleg);
  draw();
  // frame the whole route — average the stops, clamped so no end slips over the limb
  const stops=[r.start].concat(r.legs.map(x=>x.t)).map(coordOf).filter(Boolean);
  let c=coordOf(k);
  if(stops.length>1){
    const base=stops[0].lon;
    const lons=stops.map(p=>{ let dd=p.lon-base; while(dd>180)dd-=360; while(dd<-180)dd+=360; return base+dd; });
    const lo=Math.min.apply(null,lons), hi=Math.max.apply(null,lons);
    c={lon:(lo+hi)/2,
       lat:Math.max(-38,Math.min(46,stops.reduce((a,p)=>a+p.lat,0)/stops.length))};
  }
  if(c&&typeof window.spinTo==="function") window.spinTo(c.lon,c.lat);
  else if(typeof window.flyToBase==="function") window.flyToBase(k);
},true);

// Shake the bases that belong to the route under the cursor. Diffed against the last lit route, because
// labels() runs on every redraw — re-adding the class each frame would restart the animation forever.
let LITKEY=null, HOVT=null;
// Hovering a star asks "what flies out of here?" — answer on the globe, and clear it the moment the
// cursor leaves. Delegated because d3 rebuilds the marker groups.
document.addEventListener("mouseover",e=>{
  if(!document.body.classList.contains("sr-open")) return;
  const g=e.target&&e.target.closest?e.target.closest("#map .term"):null;
  const k=g&&g.__data__?g.__data__.key:null;
  if(k===HOVT) return;
  HOVT=k; draw();
},true);
document.addEventListener("mouseout",e=>{
  if(!HOVT) return;
  const g=e.target&&e.target.closest?e.target.closest("#map .term"):null;
  if(!g) return;
  const to=e.relatedTarget&&e.relatedTarget.closest?e.relatedTarget.closest("#map .term"):null;
  if(to&&to.__data__&&to.__data__.key===HOVT) return;
  HOVT=null; draw();
},true);
function litTerms(){
  const key=SEL||HOV;
  if(key===LITKEY) return;
  LITKEY=key;
  const r=key?byKey(key):null;
  const on=new Set();
  if(r){ on.add(r.start); r.legs.forEach(l=>{ on.add(l.f); on.add(l.t); }); }
  document.querySelectorAll("#map .term").forEach(g=>{
    const k=g.__data__&&g.__data__.key;
    g.classList.toggle("sr-lit",!!k&&on.has(k));
  });
}
// name the stops on the lit route — on a bare world the arcs need anchors
function labels(){
  litTerms();
  let l=$("srLabels");
  if(!l){ l=document.createElement("div"); l.id="srLabels"; document.body.appendChild(l); }
  const key=SEL||HOV;
  const r=key?byKey(key):null;
  if(!r||typeof window.projectPoint!=="function"){ l.innerHTML=""; return; }
  const full=!!SEL;            // picked → per-leg price chips too; merely hovered → just the stop names
  const guard=1e9;
  const legChips=full?r.legs.map(lg=>{
    const A=coordOf(lg.f), B=coordOf(lg.t); if(!A||!B) return "";
    // walk out from the middle until the arc is facing us — a direct hop must always carry its price
    let p=null, interp=null;
    try{ interp=d3.geoInterpolate([A.lon,A.lat],[B.lon,B.lat]); }catch(e){}
    let dl=B.lon-A.lon; while(dl>180)dl-=360; while(dl<-180)dl+=360;   // cross the date line the short way
    const ts=[.5,.45,.55,.4,.6,.35,.65,.3,.7,.25,.75,.2,.8];
    for(let i=0;i<ts.length&&!p;i++){
      const m=interp?interp(ts[i]):[A.lon+dl*ts[i],A.lat+(B.lat-A.lat)*ts[i]];
      p=window.projectPoint(m[0],m[1]);
    }
    if(!p) return "";
    const money=lg.paid?("~"+lg.cost):"Free";
    return '<span class="lg'+(lg.paid?" paid":"")+'" style="left:'+p[0]+'px;top:'+p[1]+'px">'
      +'<em>'+money+'</em><i>· '+fh(lg.h||0)+'</i></span>';
  }).join(""):"";
  const stops=[r.start].concat(r.legs.map(x=>x.t));
  const decollide=()=>{   // de-collide by measurement — chips and labels anchor differently
    const box=[];
    [].slice.call(l.children).forEach(el=>{
      el.style.top=(parseFloat(el.dataset.y||el.style.top)||0)+"px";
      if(!el.dataset.y) el.dataset.y=parseFloat(el.style.top)||0;
      let rc=el.getBoundingClientRect(), n=0;
      while(n++<9&&box.some(b=>rc.left<b.right&&b.left<rc.right&&rc.top<b.bottom&&b.top<rc.bottom)){
        el.style.top=((parseFloat(el.style.top)||0)+24)+"px";
        rc=el.getBoundingClientRect();
      }
      box.push(rc);
    });
  };
  l.innerHTML=legChips+stops.map((k,i)=>{
    const c=coordOf(k); if(!c) return "";
    let p=window.projectPoint(c.lon,c.lat), back=false;
    if(!p){   // walk toward its neighbour until the world faces us — better a limb label than none
      const nb=coordOf(i===0?stops[1]:stops[i-1]); if(!nb) return "";
      let dl=nb.lon-c.lon; while(dl>180)dl-=360; while(dl<-180)dl+=360;
      for(let t=.12;t<=.9&&!p;t+=.08) p=window.projectPoint(c.lon+dl*t,c.lat+(nb.lat-c.lat)*t);
      if(!p) return ""; back=true;
    }
    const flip=p[0]>guard-60;
    const cls="sl"+(full?"":" q")+(i===0?" first":"")+(i===stops.length-1?" last":"")
      +(flip?" flip":"")+(back?" back":"");
    const tag=i===0?"⭐ ":(i===stops.length-1?"📍 ":"");
    const x=flip?Math.min(p[0]-10,guard):p[0];
    return '<span class="'+cls+'" style="left:'+x+'px;top:'+p[1]+'px">'+tag+(back?"↩ ":"")+nm(k)+'</span>';
  }).join("");
  decollide();
}
window.srRelabel=labels;
function draw(){ if(typeof window.setBoardArcs==="function") window.setBoardArcs(arcsFor()); labels(); }
function close(){
  const c=$("srChip"); if(c) c.classList.remove("show");
  LITKEY=null; HOVT=null; document.querySelectorAll("#map .term.sr-lit").forEach(g=>g.classList.remove("sr-lit"));
  const cp=$("srCty"); if(cp) cp.classList.remove("show");
  SEL=null; HOV=null; HOVLEG=null; lastXY=null;
  hideTip();
  const l=$("srLabels"); if(l) l.innerHTML="";
  if(typeof window.clearBoardArcs==="function") window.clearBoardArcs();
  document.body.classList.remove("sr-open","sr-hot");
  const tgl=$("routesTgl"); if(tgl) tgl.checked=false;
  ALL=false;
}
// the routes page always shows routes: turning "all paths" off drops back to the smart ways, not darkness
function closeOrSmart(){
  if(document.body.classList.contains("routes-page")&&ALL){ window.openSmartRoutes({onMap:true}); return; }
  close();
}
window.srRoutesOff=closeOrSmart;
window.closeSmartRoutes=close;
window.openSmartRoutes=function(opts){
  opts=opts||{};
  ALL=!!opts.all;
  // land on the map first — this lives ON the world, not over it
  if(!opts.onMap){
    if(typeof window.openExplore==="function") window.openExplore();
    else { const hero=$("hero"); if(hero) hero.classList.add("gone"); }
  }
  const src=ALL?window.tbAllRows:window.tbBoardRows;
  const data=(typeof src==="function")?src():{rows:[]};
  ROWS=data.rows||[]; SEL=null; HOV=null; HOVLEG=null;
  const hm=(ROWS[0]&&ROWS[0].hm&&ROWS[0].hm.n)||"your HQ";
  let c=$("srChip");
  if(!c){ c=document.createElement("div"); c.id="srChip";
    c.innerHTML=`<div class="ct"><b></b><span></span><button class="ctyb" title="Pick the country you're flying from"></button></div>`+
      `<button class="sx" title="Close">✕</button>`;
    document.body.appendChild(c);
    c.querySelector(".sx").onclick=close;
    c.querySelector(".ctyb").onclick=()=>toggleCty();
  }
  c.querySelector(".ct b").textContent=(ALL?"🌐 every way out of ":"✨ "+ROWS.length+" ways out of ")+hm;
  c.querySelector(".ct span").innerHTML=ROWS.length
    ? (ALL?ROWS.length+" routes · hover one for the details ":"Hover a path for the details ")
      +`<i></i>free<i class="pd"></i>paid`
    : `Pick the country you're flying from →`;
  const cn0=ctyNow();
  const cty=c.querySelector(".ctyb");
  if(cty) cty.textContent=cn0?("out of "+cn0+" — change"):"Choose where you fly from";
  const hb=$("srHome");   // the routes page names its home bases in the title row
  if(hb){ hb.innerHTML='⭐ <b>'+(cn0||"Pick home bases")+'</b><span class="ch">change</span>';
    hb.onclick=()=>toggleCty(); }
  if(!ROWS.length) toggleCty(true);
  c.classList.add("show");
  document.body.classList.add("sr-open");
  const tgl=$("routesTgl"); if(tgl) tgl.checked=ALL;
  draw();
  if(opts.center!==false) centerOnFan(!!opts.instant);
};
// Open on the whole fan, not on HQ. Centring on home alone left the far ends of every route behind the
// limb; the smallest enclosing cap over every stop of every route is the one rotation that shows as much
// of the set at once as the sphere can hold. Exposed because the routes page has to re-run it once the
// topology has loaded — the first call lands before there's a world to rotate.
window.srCenter=function(instant){ centerOnFan(!!instant); };
function centerOnFan(instant){
  {
    const pts=[];
    const hm=(ROWS[0]&&ROWS[0].hm)||null;
    if(hm&&hm.lat!=null) pts.push(hm);
    ROWS.forEach(r=>{ [r.start].concat(r.legs.map(l=>l.t)).forEach(k2=>{ const c2=coordOf(k2); if(c2) pts.push(c2); }); });
    if(pts.length&&(typeof window.spinSet==="function"||typeof window.spinTo==="function")){
      const R=Math.PI/180;
      const norm=a=>{ const m=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/m,a[1]/m,a[2]/m]; };
      const vs=pts.map(p=>{ const la=p.lat*R, lo=p.lon*R;
        return [Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)]; });
      let c=norm(vs.reduce((a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],[0,0,0]));
      if(!isFinite(c[0])) c=vs[0].slice();
      for(let i=0;i<80;i++){
        let worst=vs[0], wdot=2;
        for(const p of vs){ const d=c[0]*p[0]+c[1]*p[1]+c[2]*p[2]; if(d<wdot){ wdot=d; worst=p; } }
        const step=0.5/(i+1);
        c=norm([c[0]+(worst[0]-c[0])*step,c[1]+(worst[1]-c[1])*step,c[2]+(worst[2]-c[2])*step]);
      }
      // A Pacific fan's true cap centre sits far north — that IS the great-circle view, and clamping it
      // down to mid-latitudes is what pushed half the stops over the limb. Allow the high view, and undo
      // spinTo's 0.7 latitude damping so the rotation actually lands where the solve says.
      const clat=Math.max(-78,Math.min(78,Math.asin(Math.max(-1,Math.min(1,c[2])))/R));
      const clon=Math.atan2(c[1],c[0])/R;
      const land=()=>{ if(typeof window.spinSet==="function") window.spinSet(clon,clat); };
      if(instant||typeof window.spinTo!=="function") land();
      else { window.spinTo(clon,clat/0.7,900); setTimeout(land,960); }   // animate, then guarantee the landing
    }
  }
}
addEventListener("keydown",e=>{
  if(e.key!=="Escape"||!document.body.classList.contains("sr-open")) return;
  if(SEL){ SEL=null; hideTip(); HOV=null; HOVLEG=null; draw(); } else close();
});
})();
