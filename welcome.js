// ═══ 🪁 First-run walkthrough — home base, then the best wind in the next two weeks ═══
// Shows once (spacea.welcome.v1). Cancel anywhere. Re-open with the 🪁 badge.
(function(){
const $=id=>document.getElementById(id);
const DONE="spacea.welcome.v1";
const say=m=>{ if(typeof toast==="function") toast(m); };
const nm=k=>(typeof window.jmName==="function"?window.jmName(k):k);
const HOMES=[
  {k:"bkk",flag:"🇹🇭",city:"Bangkok",sub:"U-Tapao, Kadena and Yokota become your launch pads",
    starts:["utapao","kadena","yokota"]},
  {k:"col",flag:"🏔️",city:"Colorado",sub:"Peterson SFB and Travis become your launch pads",
    starts:["peterson","travis"]}
];
const css=document.createElement("style");
css.textContent=`
  #rbBadge{position:fixed;right:300px;bottom:20px;width:46px;height:46px;border-radius:50%;z-index:50;
    display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;color:var(--color-text);
    border:1px solid color-mix(in srgb,#34D399 55%,transparent);
    background:color-mix(in srgb,#34D399 12%,var(--color-surface));
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    animation:rbGlow 2.6s ease-in-out infinite;}
  #rbBadge:hover{border-color:#34D399;background:color-mix(in srgb,#34D399 22%,var(--color-surface));}
  #rbBadge:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  @keyframes rbGlow{0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,.34),0 0 14px 0 rgba(52,211,153,.22);}
    50%{box-shadow:0 0 0 9px rgba(52,211,153,0),0 0 22px 3px rgba(52,211,153,.34);}}
  #rbBadge svg{width:23px;height:23px;overflow:visible;}
  #rbBadge .hb{animation:rbHop 2.6s ease-in-out infinite;transform-origin:12px 20px;}
  #rbBadge .sm{animation:rbSmoke 2.6s ease-in-out infinite;}
  #rbBadge .sm2{animation:rbSmoke 2.6s ease-in-out .55s infinite;}
  #rbBadge .dr{animation:rbDoor 2.6s ease-in-out infinite;transform-origin:12px 20px;}
  @keyframes rbHop{0%,68%,100%{transform:translateY(0) scaleY(1);}
    76%{transform:translateY(-1.6px) scaleY(1.05);} 88%{transform:translateY(0) scaleY(.97);}}
  @keyframes rbSmoke{0%{opacity:0;transform:translate(0,0) scale(.5);}
    22%{opacity:.85;} 100%{opacity:0;transform:translate(1.6px,-6px) scale(1.25);}}
  @keyframes rbDoor{0%,60%,100%{opacity:.55;} 78%{opacity:1;}}
  @media (prefers-reduced-motion:reduce){#rbBadge{animation:none;}
    #rbBadge .hb,#rbBadge .sm,#rbBadge .sm2,#rbBadge .dr{animation:none;}}
  body.chk-open #rbBadge{right:calc(var(--chkw,420px) + 300px);}
  @media (max-width:920px){ body.chk-open #rbBadge{display:none;} }
  #wkBadge{position:fixed;right:188px;bottom:20px;width:46px;height:46px;border-radius:50%;z-index:50;
    display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 90%,transparent);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:var(--color-text);}
  #wkBadge:hover{border-color:var(--color-accent);}
  body.chk-open #wkBadge{right:calc(var(--chkw,420px) + 188px);}
  @media (max-width:920px){ body.chk-open #wkBadge{display:none;} }
  #wkWrap{position:fixed;inset:0;z-index:420;display:none;align-items:center;justify-content:center;
    background:rgba(6,8,16,.74);backdrop-filter:blur(4px);padding:18px;font-family:var(--font-body);}
  #wkWrap.show{display:flex;}
  .wk-box{width:min(470px,100%);max-height:90vh;overflow-y:auto;display:flex;flex-direction:column;gap:13px;
    padding:18px;border-radius:18px;color:var(--color-text);border:1px solid var(--color-divider);
    background:color-mix(in srgb,var(--color-surface) 98%,transparent);box-shadow:var(--shadow-lg);}
  .wk-top{display:flex;align-items:flex-start;gap:10px;}
  .wk-top .tt{flex:1 1 auto;min-width:0;}
  .wk-top h3{margin:0;font-family:var(--font-heading);font-size:20px;font-weight:500;letter-spacing:-.015em;}
  .wk-top small{display:block;margin-top:4px;font-size:12.5px;line-height:1.55;text-wrap:pretty;
    color:color-mix(in srgb,var(--color-text) 64%,transparent);}
  .wk-x{width:34px;height:34px;flex:0 0 auto;border-radius:50%;border:1px solid var(--color-divider);
    background:none;color:var(--color-text);font-size:14px;cursor:pointer;}
  .wk-x:hover{border-color:var(--color-accent);}
  .wk-dots{display:flex;gap:5px;}
  .wk-dots i{width:22px;height:4px;border-radius:2px;background:color-mix(in srgb,var(--color-text) 16%,transparent);}
  .wk-dots i.on{background:var(--color-accent);}
  .wk-home{display:flex;align-items:center;gap:13px;width:100%;padding:14px;border-radius:14px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,#000 10%,transparent);
    color:var(--color-text);font:inherit;text-align:left;cursor:pointer;}
  .wk-home:hover{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 12%,transparent);}
  .wk-home:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .wk-home .fl{flex:0 0 auto;font-size:26px;}
  .wk-home .tx{flex:1 1 auto;min-width:0;}
  .wk-home .tx b{display:block;font-size:15.5px;}
  .wk-home .tx small{display:block;margin-top:2px;font-size:11.5px;line-height:1.45;
    color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .wk-home .go{flex:0 0 auto;color:var(--color-accent);font-size:15px;}
  .wk-spot{display:flex;align-items:flex-start;gap:11px;width:100%;padding:12px 13px;border-radius:13px;
    border:1px solid var(--color-divider);background:none;color:var(--color-text);font:inherit;
    text-align:left;cursor:pointer;}
  .wk-spot:hover{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 12%,transparent);}
  .wk-spot .fl{flex:0 0 auto;font-size:18px;width:24px;text-align:center;margin-top:1px;}
  .wk-spot .tx{flex:1 1 auto;min-width:0;}
  .wk-spot .tx b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .wk-spot .tx small{display:block;margin-top:2px;font-size:11px;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .wk-spot .rtg{display:grid;grid-template-columns:76px 1fr auto;gap:3px 10px;align-items:baseline;
    margin-top:7px;padding-top:7px;border-top:1px solid color-mix(in srgb,var(--color-text) 9%,transparent);}
  .wk-spot .rtg small{font-size:10.5px;white-space:nowrap;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .wk-spot .rtg b{font-size:11.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .wk-spot .rtg b.fr{color:#34D399;}
  .wk-spot .rtg b.pd2{color:#FBBF24;}
  .wk-spot .rtg u{text-decoration:none;font-size:11px;font-variant-numeric:tabular-nums;text-align:right;
    color:color-mix(in srgb,var(--color-text) 78%,transparent);}
  .wk-spot .rtg .no{opacity:.4;}
  .wk-spot .rtg b.fr.no{text-decoration:line-through;color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .wk-spot .rtg u.no{text-decoration:line-through;}
  .wk-spot .rtg .vd{grid-column:1/-1;font-size:10.5px;margin-top:1px;white-space:normal;
    color:#FBBF24;}
  .wk-spot .wd{flex:0 0 auto;text-align:right;line-height:1.15;margin-top:1px;}
  .wk-spot .wd b{display:block;font-size:13.5px;}
  .wk-spot .wd small{display:block;font-size:9.5px;color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .wk-hq{display:flex;align-items:center;gap:9px;padding:0 13px;border-radius:13px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,#000 20%,transparent);}
  .wk-hq:focus-within{border-color:var(--color-accent);}
  .wk-hq .ic{flex:0 0 auto;font-size:15px;}
  .wk-hq input{flex:1 1 auto;min-width:0;font:inherit;font-size:14px;min-height:48px;border:0;outline:0;
    background:none;color:var(--color-text);}
  .wk-hqlist{display:flex;flex-direction:column;gap:3px;}
  .hq-row{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:42px;
    padding:8px 12px;border-radius:11px;border:1px solid transparent;background:none;color:var(--color-text);
    font:inherit;font-size:13.5px;text-align:left;cursor:pointer;}
  .hq-row:hover{background:color-mix(in srgb,var(--color-accent) 14%,transparent);
    border-color:color-mix(in srgb,var(--color-accent) 45%,transparent);}
  .hq-row:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .hq-row.first{border-color:var(--color-divider);}
  .hq-row em{font-style:normal;font-size:10.5px;color:color-mix(in srgb,var(--color-text) 48%,transparent);white-space:nowrap;}
  .hq-none{font-size:12px;padding:9px 12px;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .wk-note{font-size:11px;line-height:1.55;color:color-mix(in srgb,var(--color-text) 52%,transparent);}
  .wk-skip{font:inherit;font-size:12px;background:none;border:0;color:var(--color-accent);cursor:pointer;
    text-decoration:underline;padding:6px;min-height:36px;}
  .wk-seg{display:flex;gap:6px;}
  .wk-modes .so{font-weight:600;}
  .wk-modes .so.hq{flex:0 0 auto;font-weight:500;font-size:11px;padding:7px 10px;
    color:color-mix(in srgb,var(--color-text) 70%,transparent);}
  .wk-seg .so{flex:1 1 0;min-height:38px;padding:7px 4px;border-radius:11px;font:inherit;font-size:12px;
    border:1px solid var(--color-divider);background:none;color:var(--color-text);cursor:pointer;white-space:nowrap;}
  .wk-seg .so:hover{border-color:var(--color-accent);}
  .wk-seg .so.on{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 14%,transparent);}
  .wk-wait{display:flex;align-items:center;gap:10px;padding:14px;border-radius:13px;font-size:12.5px;
    border:1px dashed var(--color-divider);color:color-mix(in srgb,var(--color-text) 62%,transparent);}
  @keyframes wkSpin{to{transform:rotate(360deg);}}
  .wk-wait .sp{animation:wkSpin 1.2s linear infinite;display:inline-block;}`;
document.head.appendChild(css);

const done=()=>{ try{ localStorage.setItem(DONE,"1"); }catch(e){} };
const homeCity=()=>{ try{ return localStorage.getItem("spacea.home.city")||""; }catch(e){ return ""; } };

function bandOf(v){ return (typeof knBand==="function")?knBand(v):{c:"#4FD0E0",l:""}; }
function flagOf(s){ try{ if(typeof flagFor==="function") return flagFor(s.country); }catch(e){} return "🪁"; }
function dayLabel(iso){ const d=new Date(iso+"T12:00:00");
  return isNaN(d)?"":d.toLocaleDateString(undefined,{weekday:"short"}); }

// 🪁 kite spots, ranked by the next 14 days of real wind — only ones you two can enter
function windPicks(){
  if(typeof window.syncUsVisaGates==="function") window.syncUsVisaGates();
  const gate=(typeof window.usGate==="function")?window.usGate():{cleared:true};
  const pts=window.WINDPTS||{};
  const month=new Date().getMonth();
  const rows=[]; let hidden=0;
  (typeof SPOTS!=="undefined"?SPOTS:[]).forEach(s=>{
    if(s.act!=="kite") return;
    try{
      const v=(typeof VISA!=="undefined")?VISA[jurFor(s)]:null;
      if(v&&v.ussoil){ if(!gate.cleared){ hidden++; return; } }
      else if(v&&v.gate.tone==="bad"){ hidden++; return; }
    }catch(e){}
    const wp=pts[s.id]; if(!wp||!wp.daily||!wp.daily.wind_speed_10m_max) return;
    const arr=wp.daily.wind_speed_10m_max.slice(0,14), time=(wp.daily.time||[]).slice(0,14);
    let best=-1,bi=0,windy=0;
    arr.forEach((x,i)=>{ if(x>best){ best=x; bi=i; } if(x>=16&&x<34) windy++; });
    if(best<16) return;
    let inSeason=true; try{ inSeason=(goldenFor(s).m||[]).indexOf(month)>=0; }catch(e){}
    rows.push({s,best:Math.round(best),day:time[bi]||"",windy,inSeason,rt:routeHours(s)});
  });
  rows.sort((a,b)=>(b.inSeason?1:0)-(a.inSeason?1:0)||b.windy-a.windy||b.best-a.best);
  return {rows:rows.slice(0,6),hidden,ready:Object.keys(pts).length>0};
}

// ── total-hours estimates: Space-A approach vs booking the whole thing ──
const R2=Math.PI/180;
const kmB=(a2,b2)=>12742*Math.asin(Math.sqrt(Math.sin((b2.lat-a2.lat)*R2/2)**2+Math.cos(a2.lat*R2)*Math.cos(b2.lat*R2)*Math.sin((b2.lon-a2.lon)*R2/2)**2));
const hAir=(a2,b2,kt)=>kmB(a2,b2)/1.852/kt+0.75;
const half=h=>Math.max(0.5,Math.round(h*2)/2);
const CITY={bkk:{lat:13.69,lon:100.75},col:{lat:39.86,lon:-104.67}};
// ── one-way economy airfare, calibrated against real 2026 fares (July) ──
// BKK–CMB 2,380km $107–190 · BKK–MAD 10,400km $288–560 · BKK–SDQ 16,300km $740–1000
// SJU–POP 500km $111–317 (thin island market — 3× an Asian hop of the same length)
function fareMid(km,mult){
  const d=Math.max(0,km); let m;
  if(d<=250)        m=70+d*0.09;
  else if(d<=800)   m=93+(d-250)*0.075;
  else if(d<=1500)  m=134+(d-800)*0.030;
  else if(d<=4000)  m=155+(d-1500)*0.020;
  else if(d<=8000)  m=205+(d-4000)*0.024;
  else if(d<=12000) m=301+(d-8000)*0.030;
  else              m=421+(d-12000)*0.095;
  // the local market sets short-hop prices; on intercontinental trunks the big carriers do — fade it out
  const taper=Math.max(0.2,Math.min(1,1-Math.max(0,d-2000)/14000*0.8));
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
  const wide=km<1500?1.9:1.5;
  return "$"+Math.round(m*0.75/10)*10+"–"+Math.round(m*wide/10)*10; }
const pMid=(a2,b2,c)=>fareMid(kmB(a2,b2),fareMult(c));
const pCostLo=(a2,b2,c)=>fareMid(kmB(a2,b2),fareMult(c))*0.75;
const pCostHi=(a2,b2,c)=>fareMid(kmB(a2,b2),fareMult(c))*(kmB(a2,b2)<1500?1.9:1.5);
const pEst=(a2,b2,c)=>fareRange(kmB(a2,b2),fareMult(c));
const pCost2=str=>{ const m=String(str).replace(/,/g,"").match(/\$(\d+)(?:[–-](\d+))?/g);
  if(!m) return [0,0];
  const last=m[m.length-1].match(/\$(\d+)(?:[–-](\d+))?/);
  return [+last[1],+(last[2]||last[1])]; };
function routeHours(s){
  if(typeof G==="undefined") return null;
  const gw=G[s.g]; if(!gw) return null;
  const h=HOMES.filter(x=>x.k===homeCity())[0]||HOMES[0];
  const hq=hqGet();
  let startKeys=h.starts;
  try{ const s2=JSON.parse(localStorage.getItem("spacea.hqstarts")||"null"); if(s2&&s2.length) startKeys=s2; }catch(e){}
  const starts=startKeys.map(k=>G[k]).filter(Boolean);
  if(!starts.length) return null;
  const mil=Math.min.apply(null,starts.map(st=>hAir(st,gw,450)));
  const tail=kmB(gw,s), tailPaid=tail>200;
  // the real military chain often has a paid leg in it — ask the plan builder instead of assuming free
  const rc=(typeof window.tbRouteCost==="function")?window.tbRouteCost(s.g):null;
  const sa=half((rc?rc.hrs:mil)+(tailPaid?hAir(gw,s,470):1));
  const city=hq||CITY[h.k]||CITY.bkk;
  const d=kmB(city,s);
  const ca=half(hAir(city,s,470)+(d>5500?2.5:0));
  // common sense: if the free route's paid hop costs about as much as just booking, cross Space-A out
  const hopMid=tailPaid?pMid(gw,s,s.country):0;
  const chainMid=rc?(rc.paid[0]+rc.paid[1])/2:0;
  const saMid=chainMid+hopMid, caMid=pMid(city,s,s.country);
  const lo=Math.round(saMid*0.78/10)*10, hi=Math.round(saMid*1.35/10)*10;
  const skip=saMid>=caMid*0.8||(sa>=ca+6&&saMid>=caMid*0.6);
  return {sa,ca,skip,saMid,caMid,
    saPrice:hi?"Free flights + $"+lo+"–"+hi:"Free",caPrice:"~"+pEst(city,s,s.country),
    why:skip?(sa>ca?"the hop costs about the same and it's ~"+Math.round(sa-ca)+"h longer":"the paid hop eats the savings"):""};
}
const PLACES=[
["Afghanistan",33.9,67.7],["Albania",41.2,20.2],["Algeria",28,1.7],["Andorra",42.5,1.5],["Angola",-11.2,17.9],["Argentina",-38.4,-63.6],["Armenia",40.1,45],["Australia",-25.3,133.8],["Austria",47.5,14.6],["Azerbaijan",40.1,47.6],
["Bahamas",25,-77.4],["Bahrain",26.1,50.6],["Bangladesh",23.7,90.4],["Barbados",13.2,-59.5],["Belarus",53.7,27.9],["Belgium",50.5,4.5],["Belize",17.2,-88.5],["Benin",9.3,2.3],["Bhutan",27.5,90.4],["Bolivia",-16.3,-63.6],
["Bosnia & Herzegovina",43.9,17.7],["Botswana",-22.3,24.7],["Brazil",-14.2,-51.9],["Brunei",4.5,114.7],["Bulgaria",42.7,25.5],["Burkina Faso",12.2,-1.6],["Burundi",-3.4,29.9],["Cambodia",12.6,105],["Cameroon",7.4,12.4],["Canada",56.1,-106.3],
["Cape Verde",16,-24],["Chad",15.5,18.7],["Chile",-35.7,-71.5],["China",35.9,104.2],["Colombia",4.6,-74.3],["Costa Rica",9.7,-83.8],["Croatia",45.1,15.2],["Cuba",21.5,-77.8],["Cyprus",35.1,33.4],["Czechia",49.8,15.5],
["Denmark",56.3,9.5],["Djibouti",11.8,42.6],["Dominican Republic",18.7,-70.2],["Ecuador",-1.8,-78.2],["Egypt",26.8,30.8],["El Salvador",13.8,-88.9],["Estonia",58.6,25],["Eswatini",-26.5,31.5],["Ethiopia",9.1,40.5],["Fiji",-17.7,178],
["Finland",61.9,25.7],["France",46.2,2.2],["Gabon",-0.8,11.6],["Gambia",13.4,-15.3],["Georgia (country)",42.3,43.4],["Germany",51.2,10.5],["Ghana",7.9,-1],["Greece",39.1,21.8],["Greenland",71.7,-42.6],["Guatemala",15.8,-90.2],
["Guinea",9.9,-9.7],["Guyana",4.9,-58.9],["Haiti",19,-72.3],["Honduras",15.2,-86.2],["Hungary",47.2,19.5],["Iceland",64.9,-19],["India",20.6,79],["Indonesia",-0.8,113.9],["Iraq",33.2,43.7],["Ireland",53.4,-8.2],
["Israel",31,34.9],["Italy",41.9,12.6],["Ivory Coast",7.5,-5.5],["Jamaica",18.1,-77.3],["Japan",36.2,138.3],["Jordan",30.6,36.2],["Kazakhstan",48,66.9],["Kenya",-0.02,37.9],["Kiribati",1.9,-157.4],["Kosovo",42.6,20.9],
["Kuwait",29.3,47.5],["Kyrgyzstan",41.2,74.8],["Laos",19.9,102.5],["Latvia",56.9,24.6],["Lebanon",33.9,35.9],["Lesotho",-29.6,28.2],["Liberia",6.4,-9.4],["Libya",26.3,17.2],["Liechtenstein",47.2,9.6],["Lithuania",55.2,23.9],
["Luxembourg",49.8,6.1],["Madagascar",-18.8,47],["Malawi",-13.3,34.3],["Malaysia",4.2,102],["Maldives",3.2,73.2],["Mali",17.6,-4],["Malta",35.9,14.4],["Marshall Islands",7.1,171.2],["Mauritania",21,-10.9],["Mauritius",-20.3,57.6],
["Mexico",23.6,-102.6],["Micronesia",7.4,150.5],["Moldova",47.4,28.4],["Monaco",43.7,7.4],["Mongolia",46.9,103.8],["Montenegro",42.7,19.4],["Morocco",31.8,-7.1],["Mozambique",-18.7,35.5],["Myanmar",21.9,96],["Namibia",-22.9,18.5],
["Nauru",-0.5,166.9],["Nepal",28.4,84.1],["Netherlands",52.1,5.3],["New Zealand",-40.9,174.9],["Nicaragua",12.9,-85.2],["Niger",17.6,8.1],["Nigeria",9.1,8.7],["North Macedonia",41.6,21.7],["Norway",60.5,8.5],["Oman",21.5,55.9],
["Pakistan",30.4,69.3],["Palau",7.5,134.6],["Panama",8.5,-80.8],["Papua New Guinea",-6.3,143.9],["Paraguay",-23.4,-58.4],["Peru",-9.2,-75],["Philippines",12.9,121.8],["Poland",51.9,19.1],["Portugal",39.4,-8.2],["Qatar",25.4,51.2],
["Romania",45.9,25],["Rwanda",-1.9,29.9],["Samoa",-13.8,-172.1],["San Marino",43.9,12.5],["Saudi Arabia",23.9,45.1],["Senegal",14.5,-14.5],["Serbia",44,21],["Seychelles",-4.7,55.5],["Sierra Leone",8.5,-11.8],["Singapore",1.35,103.8],
["Slovakia",48.7,19.7],["Slovenia",46.2,15],["Solomon Islands",-9.6,160.2],["Somalia",5.2,46.2],["South Africa",-30.6,22.9],["South Korea",35.9,127.8],["Spain",40.5,-3.7],["Sri Lanka",7.9,80.8],["Suriname",3.9,-56],["Sweden",60.1,18.6],
["Switzerland",46.8,8.2],["Taiwan",23.7,121],["Tajikistan",38.9,71.3],["Tanzania",-6.4,34.9],["Thailand",15.9,101],["Timor-Leste",-8.9,125.7],["Togo",8.6,0.8],["Tonga",-21.2,-175.2],["Trinidad & Tobago",10.7,-61.2],["Tunisia",33.9,9.5],
["Turkey",39,35.2],["Turkmenistan",38.97,59.6],["Tuvalu",-7.1,177.6],["Uganda",1.4,32.3],["Ukraine",48.4,31.2],["United Arab Emirates",23.4,53.8],["United Kingdom",55.4,-3.4],["Uruguay",-32.5,-55.8],["Uzbekistan",41.4,64.6],["Vanuatu",-15.4,166.9],
["Vietnam",14.1,108.3],["Zambia",-13.1,27.8],["Zimbabwe",-19,29.2],
["Alabama, USA",32.8,-86.8],["Alaska, USA",64.2,-149.5],["Arizona, USA",34,-111.1],["Arkansas, USA",34.8,-92.2],["California, USA",36.8,-119.4],["Colorado, USA",39.1,-105.4],["Connecticut, USA",41.6,-72.7],["Delaware, USA",39,-75.5],
["Florida, USA",27.8,-81.7],["Georgia, USA",32.2,-82.9],["Hawaii, USA",20.8,-156.3],["Idaho, USA",44.1,-114.7],["Illinois, USA",40,-89.2],["Indiana, USA",39.9,-86.3],["Iowa, USA",42,-93.2],["Kansas, USA",38.5,-98.4],
["Kentucky, USA",37.7,-84.7],["Louisiana, USA",31.2,-91.9],["Maine, USA",45.3,-69.2],["Maryland, USA",39,-76.6],["Massachusetts, USA",42.4,-71.4],["Michigan, USA",44.3,-85.6],["Minnesota, USA",46.7,-94.7],["Mississippi, USA",32.7,-89.7],
["Missouri, USA",38.5,-92.3],["Montana, USA",46.9,-110.4],["Nebraska, USA",41.5,-99.9],["Nevada, USA",38.8,-116.4],["New Hampshire, USA",43.2,-71.6],["New Jersey, USA",40.1,-74.4],["New Mexico, USA",34.5,-106],["New York, USA",43,-75],
["North Carolina, USA",35.6,-79],["North Dakota, USA",47.5,-100.5],["Ohio, USA",40.4,-82.8],["Oklahoma, USA",35.6,-97.1],["Oregon, USA",43.8,-120.6],["Pennsylvania, USA",41.2,-77.2],["Rhode Island, USA",41.6,-71.5],["South Carolina, USA",33.8,-80.9],
["South Dakota, USA",44.4,-100.2],["Tennessee, USA",35.7,-86.7],["Texas, USA",31.9,-99.9],["Utah, USA",39.3,-111.1],["Vermont, USA",44,-72.7],["Virginia, USA",37.4,-78.7],["Washington, USA",47.4,-120.7],["Washington DC, USA",38.9,-77],
["West Virginia, USA",38.6,-80.6],["Wisconsin, USA",44.3,-89.6],["Wyoming, USA",43.1,-107.3],["Puerto Rico, USA",18.2,-66.4],["Guam, USA",13.4,144.8],["Okinawa, Japan",26.3,127.8],["Bangkok, Thailand",13.7,100.5]
];
const hqGet=()=>{ try{ return JSON.parse(localStorage.getItem("spacea.hq")||"null"); }catch(e){ return null; } };
function hqSet(name,lat,lon){
  try{ localStorage.setItem("spacea.hq",JSON.stringify({n:name,lat,lon})); }catch(e){}
  // legacy home key keeps old logic sane: nearest of the two preset homes
  const dBkk=kmB({lat,lon},CITY.bkk), dCol=kmB({lat,lon},CITY.col);
  try{ localStorage.setItem("spacea.home.city",dBkk<=dCol?"bkk":"col"); }catch(e){}
  // Launch pads = every terminal on YOUR side of the world, not the three closest dots.
  // Three-nearest was picking an arbitrary huddle: from Bangkok it left out Yokota and Kadena, so the
  // engine never built the routes that matter — a long free military haul plus one short paid hop —
  // and priced the ones it did build against a start you'd have to fly to anyway. Take the whole
  // region, and let the plan list rank inside it.
  const cand={};
  try{ (typeof TERMS!=="undefined"?TERMS:[]).forEach(t=>{ if(t.lat!=null) cand[t.key]={lat:t.lat,lon:t.lon}; }); }catch(e){}
  if(typeof G!=="undefined") Object.keys(G).forEach(k=>{ if(!cand[k]) cand[k]=G[k]; });
  // only bases the plan engine can actually route from — "utapao" used to get seeded here and is not
  // in TERMS, so it sat in the saved pads forever producing no plans
  const real=new Set();
  try{ (typeof TERMS!=="undefined"?TERMS:[]).forEach(t=>real.add(t.key)); }catch(e){}
  const all=Object.keys(cand).filter(k=>!real.size||real.has(k))
    .map(k=>({k,d:kmB({lat,lon},cand[k])})).sort((a,b)=>a.d-b.d);
  // "Same side of the world" in plain distance: 7,000km covers a continent and its near neighbours
  // without reaching across an ocean. Always keep at least the 3 nearest so an isolated home (Guam,
  // the Azores) still gets pads, and cap at 8 so the plan list stays a list.
  const REGION=7000;
  let starts=all.filter(x=>x.d<=REGION).slice(0,8).map(x=>x.k);
  if(starts.length<3) starts=all.slice(0,3).map(x=>x.k);
  try{ localStorage.setItem("spacea.hqstarts",JSON.stringify(starts)); }catch(e){}
  // write BOTH keys: the trip builder reads spacea.starts first, so leaving it stale meant the new
  // pads never took effect
  try{ localStorage.setItem("spacea.starts",JSON.stringify(starts)); }catch(e){}
  if(typeof window.tbSetStarts==="function") window.tbSetStarts(starts);
  // the map's green/yellow "free from home" stars anchor on the HQ continent — repaint them now
  if(typeof window.freeRepaint==="function") window.freeRepaint();
  return starts;
}
const modeTabs=cur=>`<div class="wk-seg wk-modes">
  <button class="so${cur==="wind"?" on":""}" data-mode="wind">🌬️ Best wind</button>
  <button class="so${cur==="deals"?" on":""}" data-mode="deals">💡 Best savings</button>
  <button class="so hq" data-mode="hq" title="Change your headquarters — sets which terminals you fly from">🏠 Change HQ · ${((hqGet()||{}).n||"not set").split(",")[0]}</button></div>`;
function bindModes(box){
  box.querySelectorAll("[data-mode]").forEach(b2=>b2.onclick=()=>{
    const w2=$("wkWrap");
    if(b2.dataset.mode==="deals"){ w2.dataset.act=w2.dataset.act||"kite"; paintDeals(); }
    else if(b2.dataset.mode==="hq"){ STEP=1; paint(); }
    else { STEP=2; TRIES=0; paint(); }
  });
}
function dealPicks(act){
  if(typeof window.syncUsVisaGates==="function") window.syncUsVisaGates();
  const gate=(typeof window.usGate==="function")?window.usGate():{cleared:true};
  const month=new Date().getMonth();
  const rows=[]; let hidden=0;
  (typeof SPOTS!=="undefined"?SPOTS:[]).forEach(s=>{
    if(s.act!==act) return;
    try{
      const v=(typeof VISA!=="undefined")?VISA[jurFor(s)]:null;
      if(v&&v.ussoil){ if(!gate.cleared){ hidden++; return; } }
      else if(v&&v.gate.tone==="bad"){ hidden++; return; }
    }catch(e){}
    const rt=routeHours(s); if(!rt) return;
    let inSeason=true; try{ inSeason=(goldenFor(s).m||[]).indexOf(month)>=0; }catch(e){}
    const gw=G[s.g], h=HOMES.filter(x=>x.k===homeCity())[0]||HOMES[0], city=CITY[h.k]||CITY.bkk;
    // same yardstick the plan list and route board use: real chain cost vs. one airline ticket
    const save=Math.max(0,Math.round((rt.caMid-rt.saMid)/10)*10);
    rows.push({s,rt,inSeason,save,perTwo:save*2});
  });
  // worth-it trips first, then season, then size of the saving — never bury a real saving under "book it" rows
  rows.sort((a2,b2)=>(a2.rt.skip?1:0)-(b2.rt.skip?1:0)||(b2.inSeason?1:0)-(a2.inSeason?1:0)||b2.save-a2.save);
  return {rows:rows.slice(0,10),hidden};
}
function paintDeals(){
  const w2=$("wkWrap"); if(!w2) return;
  const box=w2.querySelector(".wk-box");
  const act=w2.dataset.act||"kite";
  const {rows,hidden}=dealPicks(act);
  const seg=[["kite","🪁 Kitesurf"],["snow","🏂 Snowboard"],["snowkite","🪁❄️ Snowkite"]];
  box.innerHTML=`
    <div class="wk-top"><div class="tt"><h3>💡 Best savings</h3>
      <small>Every spot you two can enter, ranked by real savings — the 🪖 free route vs ✈️ just booking it.
      Where booking wins, it says so.</small></div>
      <button class="wk-x" data-skip="1" title="Close">✕</button></div>
    ${modeTabs("deals")}
    <div class="wk-seg">${seg.map(x=>`<button class="so${x[0]===act?" on":""}" data-act="${x[0]}">${x[1]}</button>`).join("")}</div>
    ${rows.length?rows.map(r=>{
      const smart=!r.rt.skip;
      return `<button class="wk-spot" data-spot="${r.s.id}" data-g="${r.s.g}">
        <span class="fl">${flagOf(r.s)}</span>
        <span class="tx"><b>${r.s.name} · ${r.s.country}</b>
          <small>via ${nm(r.s.g)} · ${r.s.season}${r.inSeason?"":" · out of season"}</small>
          <span class="rtg">
            <small${smart?"":' class="no"'}>🪖 Space-A</small><b class="fr${smart?"":" no"}">${r.rt.saPrice}</b><u${smart?"":' class="no"'}>~${r.rt.sa}h</u>
            <small>✈️ Book it all</small><b class="pd2">${r.rt.caPrice}</b><u>~${r.rt.ca}h</u>
            ${smart?"":`<small class="vd">✈️ Just book this one — ${r.rt.why}.</small>`}
          </span></span>
        <span class="wd">${smart?`<b style="color:#34D399">save ~$${r.perTwo}</b><small>you two · each way</small>`:`<b style="color:#FBBF24">book it</b><small>~${r.rt.ca}h</small>`}</span>
      </button>`;}).join(""):`<div class="wk-wait">Nothing you two can enter right now${hidden?" — "+hidden+" spots are behind entry papers (the US-soil ones unlock the moment Montana's visa lands)":""}${act!=="kite"?". Snow season is Dec–Apr, so this list wakes up in late autumn":""}.</div>`}
    ${hidden?`<div class="wk-note">🔒 ${hidden} spot${hidden===1?"":"s"} hidden — entry papers you two don't hold yet.</div>`:""}`;
  box.querySelectorAll("[data-skip]").forEach(b2=>b2.onclick=()=>w2.classList.remove("show"));
  bindModes(box);
  box.querySelectorAll("[data-act]").forEach(b2=>b2.onclick=()=>{ w2.dataset.act=b2.dataset.act; paintDeals(); });
  box.querySelectorAll("[data-spot]").forEach(b2=>b2.onclick=()=>{
    w2.classList.remove("show");
    say("💡 Building every way to get there — the smart plans are the green ones");
    if(typeof window.openJourney==="function") window.openJourney(b2.dataset.g); });
}
window.openDeals=function(act){ let w2=$("wkWrap");
  if(!w2){ open(1); w2=$("wkWrap"); }
  w2.dataset.act=act||"kite"; w2.classList.add("show"); paintDeals(); };
let STEP=1, TRIES=0;
function paint(){
  const w=$("wkWrap"); if(!w) return;
  const box=w.querySelector(".wk-box");
  if(STEP===1){
    const hq=hqGet();
    box.innerHTML=`
      <div class="wk-top"><div class="tt"><h3>🏠 Set up your headquarters</h3>
        <small>Type where home is — country or US state — and I\'ll set your launch pads:
        the Space-A terminals on your side of the world.${hq?" Currently: <b>"+hq.n+"</b>.":""}</small></div>
        <button class="wk-x" data-skip="1" title="Skip">✕</button></div>
      <div class="wk-dots"><i class="on"></i><i></i></div>
      <div class="wk-hq"><span class="ic">📍</span>
        <input id="hqFind" placeholder="Try “Th…” → Thailand" autocomplete="off" spellcheck="false"></div>
      <div class="wk-hqlist" id="hqList"></div>
      ${HOMES.map(h2=>`<button class="wk-home" data-home="${h2.k}">
        <span class="fl">${h2.flag}</span>
        <span class="tx"><b>${h2.city}</b><small>${h2.sub}</small></span>
        <span class="go">→</span></button>`).join("")}
      <button class="wk-skip" data-skip="1">Skip — just show me the map</button>`;
    const inp=box.querySelector("#hqFind"), list=box.querySelector("#hqList");
    const paintList=q=>{
      if(!q){ list.innerHTML=""; return; }
      const ql=q.toLowerCase();
      const hits=PLACES.filter(p=>p[0].toLowerCase().includes(ql))
        .sort((x,y)=>x[0].toLowerCase().indexOf(ql)-y[0].toLowerCase().indexOf(ql)||x[0].length-y[0].length)
        .slice(0,7);
      list.innerHTML=hits.map((p,i2)=>`<button class="hq-row${i2===0?" first":""}" data-hq="${p[0]}">
        <span>${p[0]}</span><em>${i2===0?"press Enter ↵":""}</em></button>`).join("")
        ||`<div class="hq-none">Nothing matches “${q}” — try the country\'s English name.</div>`;
      list.querySelectorAll("[data-hq]").forEach(b2=>b2.onclick=()=>pickHq(b2.dataset.hq));
    };
    const pickHq=name=>{
      const p=PLACES.filter(x=>x[0]===name)[0]; if(!p) return;
      const starts=hqSet(p[0],p[1],p[2]);
      done();
      say("🏠 HQ: "+p[0]+" — launch pads: "+(starts.map(nm).join(", ")||"set"));
      STEP=2; TRIES=0; paint();
    };
    inp.oninput=()=>paintList(inp.value.trim());
    inp.onkeydown=e=>{ if(e.key==="Enter"){ const f=list.querySelector("[data-hq]"); if(f) pickHq(f.dataset.hq); e.preventDefault(); } };
    setTimeout(()=>inp.focus(),80);
  } else {
    const {rows,hidden,ready}=windPicks();
    const h=HOMES.filter(x=>x.k===homeCity())[0];
    box.innerHTML=`
      <div class="wk-top"><div class="tt"><h3>🪁 Best wind, next two weeks</h3>
        <small>Real forecasts for every kite spot you two can actually enter, ranked —
        from ${(hqGet()||{}).n||(h?h.city:"home")}. Each spot compares the 🪖 free Space-A route with ✈️ booking it all — flying hours each way, prices per person.</small></div>
        <button class="wk-x" data-skip="1" title="Close">✕</button></div>
      ${modeTabs("wind")}
      ${!ready
        ? `<div class="wk-wait"><span class="sp">🌀</span>Reading two weeks of wind for every spot…</div>`
        : rows.length
          ? rows.map(r=>{ const b=bandOf(r.best);
              return `<button class="wk-spot" data-spot="${r.s.id}" data-g="${r.s.g}">
                <span class="fl">${flagOf(r.s)}</span>
                <span class="tx"><b>${r.s.name} · ${r.s.country}</b>
                  <small>via ${nm(r.s.g)}${r.inSeason?"":" · out of season"} · ${r.windy} windy day${r.windy===1?"":"s"} ahead</small>
                  ${r.rt?`<span class="rtg">
                    <small${r.rt.skip?' class="no"':""}>🪖 Space-A</small><b class="fr${r.rt.skip?" no":""}">${r.rt.saPrice}</b><u${r.rt.skip?' class="no"':""}>~${r.rt.sa}h</u>
                    <small>✈️ Book it all</small><b class="pd2">${r.rt.caPrice}</b><u>~${r.rt.ca}h</u>
                    ${r.rt.skip?`<small class="vd">✈️ Just book this one — ${r.rt.why}.</small>`:""}
                  </span>`:""}</span>
                <span class="wd"><b style="color:${b.c}">${r.best} kt</b><small>${b.l} · ${dayLabel(r.day)}</small></span>
              </button>`;}).join("")
          : `<div class="wk-wait">No kiteable wind in the forecast right now — check back tomorrow, the wind moves.</div>`}
      ${hidden?`<div class="wk-note">🔒 ${hidden} spot${hidden===1?"":"s"} hidden — they need entry papers you two don't hold yet (US-soil spots stay hidden while Montana's visa is pending).</div>`:""}
      <button class="wk-skip" data-skip="1">Show me everything instead</button>`;
    if(!ready&&TRIES<20){ TRIES++; setTimeout(()=>{ if($("wkWrap").classList.contains("show")&&STEP===2) paint(); },700); }
  }
  box.querySelectorAll("[data-skip]").forEach(b=>b.onclick=()=>{ done(); w.classList.remove("show"); });
  bindModes(box);
  box.querySelectorAll("[data-home]").forEach(b=>b.onclick=()=>{
    const h=HOMES.filter(x=>x.k===b.dataset.home)[0]; if(!h) return;
    const c=h.k==="bkk"?{n:"Bangkok, Thailand",lat:13.7,lon:100.5}:{n:"Colorado, USA",lat:39.1,lon:-105.4};
    hqSet(c.n,c.lat,c.lon);
    try{ localStorage.setItem("spacea.hqstarts",JSON.stringify(h.starts)); }catch(e){} // presets keep curated pads
    if(typeof window.tbSetStarts==="function") window.tbSetStarts(h.starts);
    done();
    say("⭐ "+h.city+" it is — "+h.starts.map(nm).join(", ")+" are your launch pads");
    STEP=2; TRIES=0; paint();
  });
  box.querySelectorAll("[data-spot]").forEach(b=>b.onclick=()=>{
    done(); w.classList.remove("show");
    const g=b.dataset.g;
    say("🪁 Building every way to get there — tick the plans you like");
    if(typeof window.openJourney==="function") window.openJourney(g);
  });
}
function open(step){ STEP=step||1; TRIES=0;
  let w=$("wkWrap");
  if(!w){ w=document.createElement("div"); w.id="wkWrap";
    w.innerHTML='<div class="wk-box"></div>';
    w.addEventListener("click",e=>{ if(e.target.id==="wkWrap"){ done(); w.classList.remove("show"); } });
    document.body.appendChild(w); }
  w.classList.add("show"); paint();
}
window.openWelcome=open;
addEventListener("keydown",e=>{ const w=$("wkWrap");
  if(e.key==="Escape"&&w&&w.classList.contains("show")){ done(); w.classList.remove("show"); } });
addEventListener("load",()=>{
  if(!$("rbBadge")){ const rb=document.createElement("button"); rb.id="rbBadge"; rb.type="button";
    rb.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">'
      +'<circle class="sm" cx="17" cy="5.4" r="1.5" fill="#34D399"></circle>'
      +'<circle class="sm2" cx="17" cy="5.4" r="1.1" fill="#34D399"></circle>'
      +'<g class="hb" stroke="#34D399" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
      +'<path d="M3.4 11.2 12 4.2l8.6 7"></path>'
      +'<path d="M5.4 10.4V20h13.2v-9.6"></path>'
      +'<path d="M16.2 6.1V3.4h2.4v4.6"></path>'
      +'<path class="dr" d="M10 20v-5h4v5" fill="color-mix(in srgb,#34D399 30%,transparent)"></path>'
      +'</g></svg>';
    rb.title="Smart routes from your HQ — every way worth flying";
    rb.setAttribute("aria-label","Show smart routes from your headquarters");
    rb.onclick=()=>{ location.href="SpaceA-Smart-Routes.html"; };
    document.body.appendChild(rb); }
  if(!$("wkBadge")){ const b=document.createElement("button"); b.id="wkBadge"; b.type="button";
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:23px;height:23px"><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.9 2.7 20.8 9.1 11.9 14.3 6.2 8.2Z"></path><path d="M14.9 2.7 11.9 14.3" opacity=".75"></path><path d="M6.2 8.2 20.8 9.1" opacity=".75"></path><path d="M11.9 14.3c-1.1 1.9.5 2.3-.4 3.7s.8 1.8-.2 3.3"></path><path d="M11.1 17.1l1.8-.5M10.5 20l1.8-.5" opacity=".8"></path></g></svg>'; b.title="Trip guide — wind & savings";
    b.setAttribute("aria-label","Open the guided trip start");
    b.onclick=()=>open(hqGet()?2:1);
    document.body.appendChild(b); }
  let seen=null; try{ seen=localStorage.getItem(DONE); }catch(e){}
  // The home-base picker is the front door of the whole tool, so it needs a permanent way back in —
  // and anyone who set an HQ before the region rewrite is stranded on the old three-nearest pads with
  // no way to re-run it. Expose the picker, then migrate their stored HQ once.
  window.openHQ=()=>open(1);
  try{
    const hq0=hqGet();
    if(hq0&&hq0.lat!=null&&localStorage.getItem("spacea.hqstarts.v2")!=="1"){
      localStorage.setItem("spacea.hqstarts.v2","1");
      hqSet(hq0.n,hq0.lat,hq0.lon);          // re-picks pads by region, and drops stale non-terminals
    }
  }catch(e){}
  const askedHq=(()=>{ try{ return localStorage.getItem("spacea.hq.asked")==="1"; }catch(e){ return false; } })();
  const needsHq=!hqGet()||!askedHq;
  if(!seen||needsHq){
    const hero=document.getElementById("hero");
    const fire=()=>{ try{ localStorage.setItem("spacea.hq.asked","1"); }catch(e){} open(needsHq?1:2); };
    if(hero&&!hero.classList.contains("gone")&&window.MutationObserver){
      const mo=new MutationObserver(()=>{ if(hero.classList.contains("gone")){ mo.disconnect(); setTimeout(fire,420); } });
      mo.observe(hero,{attributes:true,attributeFilter:["class"]});
    } else setTimeout(fire,300);
  }
});
})();
