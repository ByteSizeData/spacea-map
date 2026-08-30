// ═══ 🔔 Auto-Alerts — 30-day schedule drops, 72-hour boards, and how you get told ═══
// Honest about what a page can and cannot do:
//   • Pop-ups while the app is open  → Notification API, right here.
//   • Email + phone push             → a calendar file with alarms. Google does the sending.
//   • App-closed watching            → the browser extension's service worker (steps included).
// Reading the board: a static page cannot fetch .mil (CORS), so you paste the board in and it
// translates. The extension can feed the same parser automatically once it is loaded.
(function(){
const $=id=>document.getElementById(id);
const EMAIL="bytesizedrift@gmail.com";
const K="spacea.alerts.v1";
const GREEN="#34D399", AMBER="#FBBF24", RED="#FF6B6B";
const load=()=>{ try{ return JSON.parse(localStorage.getItem(K)||"null")||{}; }catch(e){ return {}; } };
const save=o=>{ try{ localStorage.setItem(K,JSON.stringify(o)); }catch(e){} };
let A=load();
if(A.every==null) A.every=6;          // board checks, hours
if(A.pop==null) A.pop=true;

const css=document.createElement("style");
css.textContent=`
  #alBtn{position:fixed;right:20px;bottom:76px;width:46px;height:46px;border-radius:50%;z-index:50;
    display:flex;align-items:center;justify-content:center;font-size:19px;padding:0;cursor:pointer;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-surface) 90%,transparent);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:var(--color-text);}
  #alBtn:hover{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 18%,transparent);}
  #alBtn:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  #alBtn.live{border-color:${GREEN};box-shadow:0 0 0 3px color-mix(in srgb,${GREEN} 20%,transparent);}
  body.chk-open #alBtn{right:calc(var(--chkw,420px) + 20px);}

  #alWrap{position:fixed;inset:0;z-index:120;display:none;align-items:flex-start;justify-content:center;
    padding:24px 16px;overflow:auto;background:color-mix(in srgb,#000 58%,transparent);
    backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);font-family:var(--font-body);}
  #alWrap.show{display:flex;}
  #alCard{width:min(680px,100%);border-radius:16px;padding:0;overflow:hidden;
    border:1px solid var(--color-divider);background:var(--color-surface);box-shadow:var(--shadow-lg);}
  #alCard header{display:flex;align-items:center;gap:12px;padding:16px 18px 14px;
    border-bottom:1px solid var(--color-divider);}
  #alCard header h2{margin:0;flex:1 1 auto;font-family:var(--font-heading);font-size:17px;font-weight:500;
    letter-spacing:-.01em;color:var(--color-text);}
  #alCard header small{display:block;font-family:var(--font-body);font-size:11.5px;font-weight:400;
    color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  #alX{width:32px;height:32px;flex:0 0 auto;border-radius:50%;cursor:pointer;font:inherit;font-size:13px;
    border:1px solid var(--color-divider);background:none;color:var(--color-text);}
  #alX:hover{border-color:var(--color-accent);}
  #alBody{padding:16px 18px 20px;display:flex;flex-direction:column;gap:16px;}

  .al-sec{display:flex;flex-direction:column;gap:9px;}
  .al-sec > h3{margin:0;font-family:var(--font-heading);font-size:12px;font-weight:500;letter-spacing:.03em;
    text-transform:uppercase;color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .al-step{display:flex;gap:11px;align-items:flex-start;padding:12px 13px;border-radius:12px;
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-bg) 55%,transparent);}
  .al-step .num{flex:0 0 auto;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
    font-size:11px;font-weight:700;background:var(--color-accent);color:var(--color-bg);}
  .al-step.done .num{background:color-mix(in srgb,${GREEN} 20%,transparent);color:${GREEN};
    border:1px solid color-mix(in srgb,${GREEN} 55%,transparent);}
  .al-step .tx{flex:1 1 auto;min-width:0;font-size:13px;line-height:1.5;color:var(--color-text);}
  .al-step .tx b{font-weight:700;}
  .al-step .tx small{display:block;margin-top:3px;font-size:11.5px;
    color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .al-step .tx code{font-size:11.5px;padding:1px 5px;border-radius:5px;
    background:color-mix(in srgb,var(--color-text) 10%,transparent);}

  .al-btn{font:inherit;font-size:12.5px;font-weight:600;padding:9px 14px;border-radius:10px;cursor:pointer;
    white-space:nowrap;border:1px solid color-mix(in srgb,var(--color-accent) 60%,transparent);
    background:color-mix(in srgb,var(--color-accent) 14%,transparent);color:var(--color-text);
    transition:background .18s,border-color .18s;}
  .al-btn:hover{background:color-mix(in srgb,var(--color-accent) 26%,transparent);border-color:var(--color-accent);}
  .al-btn:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .al-btn.ok{border-color:color-mix(in srgb,${GREEN} 60%,transparent);color:${GREEN};
    background:color-mix(in srgb,${GREEN} 12%,transparent);}
  .al-btn.ghost{border-color:var(--color-divider);background:none;font-weight:500;}
  .al-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
  .al-in{font:inherit;font-size:13px;padding:9px 11px;border-radius:10px;color:var(--color-text);
    border:1px solid var(--color-divider);background:color-mix(in srgb,var(--color-bg) 70%,transparent);}
  .al-in:focus-visible{outline:2px solid var(--color-accent);outline-offset:1px;}
  #alPaste{width:100%;min-height:96px;resize:vertical;font-size:12.5px;line-height:1.5;}

  .al-card{padding:12px 13px;border-radius:12px;border:1px solid var(--color-divider);
    background:color-mix(in srgb,var(--color-bg) 55%,transparent);font-size:13.5px;line-height:1.55;}
  .al-card .hd{font-size:15px;font-weight:700;margin-bottom:2px;}
  .al-card .mt{font-size:11.5px;color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .al-card.g{border-color:color-mix(in srgb,${GREEN} 45%,transparent);}
  .al-card.a{border-color:color-mix(in srgb,${AMBER} 45%,transparent);}
  .al-card.r{border-color:color-mix(in srgb,${RED} 45%,transparent);}
  .al-when{font-weight:700;color:${AMBER};}
  .al-note{font-size:11.5px;line-height:1.55;color:color-mix(in srgb,var(--color-text) 52%,transparent);}
  .al-note b{color:color-mix(in srgb,var(--color-text) 75%,transparent);}
  @media (max-width:560px){ #alCard header h2{font-size:15px;} }`;
document.head.appendChild(css);

// ── dates ──────────────────────────────────────────────────────────────────
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate());
const stamp=d=>ymd(d)+"T"+pad(d.getUTCHours())+pad(d.getUTCMinutes())+"00Z";
const days=(d,n)=>new Date(d.getTime()+n*864e5);
const hours=(d,n)=>new Date(d.getTime()+n*36e5);
const human=d=>d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});

// the one date everything hangs off: when you want to fly
function departDate(){
  if(A.depart) { const d=new Date(A.depart+"T09:00:00"); if(!isNaN(d)) return d; }
  try{ const t=JSON.parse(localStorage.getItem("spacea.trip.current")||"null");
    const s=t&&(t.depart||t.from||t.date); if(s){ const d=new Date(s); if(!isNaN(d)) return d; } }catch(e){}
  return null;
}
function baseName(){
  const T=window.SPACEA_TRIP;
  if(T&&T.start&&typeof window.jmName==="function") return window.jmName(T.start);
  try{ const st=JSON.parse(localStorage.getItem("spacea.starts")||"[]");
    if(st[0]&&typeof window.jmName==="function") return window.jmName(st[0]); }catch(e){}
  return "your launch pad";
}
function destName(){
  const T=window.SPACEA_TRIP;
  if(T&&T.hub&&typeof window.jmName==="function") return window.jmName(T.hub);
  return "your destination";
}

// ── the alert schedule ─────────────────────────────────────────────────────
// Sign-up validity is 60 days (45 at some Navy desks), and the 30-day Patriot Express slides drop
// monthly — so the sign-up nudge fires the moment a new schedule can exist for your travel month.
function plan(){
  const dep=departDate(); if(!dep) return [];
  const base=baseName(), dest=destName();
  const release=new Date(Date.UTC(dep.getUTCFullYear(),dep.getUTCMonth()-1,1,14,0));  // slides drop ~a month ahead
  const out=[
    {k:"release",emoji:"📅",tone:"a",when:release,
     title:"New 30-day schedule is out",
     body:"The Patriot Express slides for your travel month should be posted. <b>Open "+base+"'s board</b> and see if your flight is on it."},
    {k:"signup",emoji:"⚡",tone:"g",when:days(dep,-60),
     title:"Sign-up window opens today",
     body:"You can now register for <b>"+dest+"</b>. Sixty days is the earliest that counts — <b>fire it today</b> for the best queue date."},
    {k:"sweet",emoji:"⭐",tone:"g",when:days(dep,-45),
     title:"Sweet spot — sign up now if you haven't",
     body:"45 to 60 days out is the documented sweet spot. If the packet is still sitting there, <b>send it today</b>."},
    {k:"board",emoji:"👀",tone:"a",when:days(dep,-7),
     title:"Watch the board daily now",
     body:"One week out. Check <b>"+base+"</b>'s 72-hr board once a day, and have a backup ticket priced."},
    {k:"rc72",emoji:"🎟️",tone:"g",when:hours(dep,-72),
     title:"72-hour board is live",
     body:"Your flight is now on the 72-hr board. <b>Call the terminal to confirm seats</b>, then check back every "+A.every+" hours."},
    {k:"rc24",emoji:"🧳",tone:"a",when:hours(dep,-24),
     title:"Pack and print",
     body:"Bags under the limit, passports and DoD IDs in hand, printed confirmations in the folder."},
    {k:"roll",emoji:"✈️",tone:"r",when:hours(dep,-4),
     title:"Get to roll call",
     body:"Be at the terminal for roll call. <b>Missing it loses your seat</b> — no exceptions."}
  ];
  return out.filter(x=>!isNaN(x.when));
}

// ── calendar file: this is what makes Google email you and buzz your phone ──
function ics(){
  const items=plan(); if(!items.length) return null;
  const esc=s=>String(s).replace(/<[^>]+>/g,"").replace(/([,;\\])/g,"\\$1").replace(/\n/g,"\\n");
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Space-A Adventure Planner//Alerts//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Space-A alerts"];
  items.forEach((x,i)=>{
    const end=hours(x.when,1);
    L.push("BEGIN:VEVENT","UID:spacea-"+x.k+"-"+ymd(x.when)+"@spacea.local",
      "DTSTAMP:"+stamp(new Date()),"DTSTART:"+stamp(x.when),"DTEND:"+stamp(end),
      "SUMMARY:"+esc(x.emoji+" "+x.title),"DESCRIPTION:"+esc(x.body),
      "BEGIN:VALARM","TRIGGER:-PT30M","ACTION:DISPLAY","DESCRIPTION:"+esc(x.title),"END:VALARM",
      "BEGIN:VALARM","TRIGGER:-PT12H","ACTION:EMAIL","ATTENDEE:mailto:"+EMAIL,
      "SUMMARY:"+esc(x.title),"DESCRIPTION:"+esc(x.body),"END:VALARM","END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.join("\r\n");
}
function downloadIcs(){
  const t=ics(); if(!t){ toastish("Set your travel date first"); return; }
  const b=new Blob([t],{type:"text/calendar;charset=utf-8"});
  const u=URL.createObjectURL(b), a=document.createElement("a");
  a.href=u; a.download="spacea-alerts.ics"; a.click();
  setTimeout(()=>URL.revokeObjectURL(u),4000);
  toastish("Calendar file saved — import it into Google Calendar");
}
function gcalLink(x){
  const end=hours(x.when,1);
  return "https://calendar.google.com/calendar/render?action=TEMPLATE"
    +"&text="+encodeURIComponent(x.emoji+" "+x.title)
    +"&dates="+stamp(x.when)+"/"+stamp(end)
    +"&details="+encodeURIComponent(String(x.body).replace(/<[^>]+>/g,""));
}
function gmailDigest(){
  const items=plan();
  const body=items.length
    ? items.map(x=>x.emoji+"  "+human(x.when)+" — "+x.title+"\n    "+String(x.body).replace(/<[^>]+>/g,"")).join("\n\n")
    : "Set a travel date in the Space-A planner to build the schedule.";
  return "https://mail.google.com/mail/?view=cm&fs=1&to="+encodeURIComponent(EMAIL)
    +"&su="+encodeURIComponent("✈️ Space-A alert schedule — "+baseName()+" → "+destName())
    +"&body="+encodeURIComponent(body);
}
function taskText(){
  return plan().map(x=>"[ ] "+human(x.when)+" — "+x.emoji+" "+x.title).join("\n");
}

// ── pop-ups while the app is open ──────────────────────────────────────────
async function askPop(){
  if(!("Notification" in window)){ toastish("This browser has no pop-up alerts"); return; }
  if(Notification.permission==="denied"){
    toastish("Pop-ups are blocked — click the padlock in the address bar and allow Notifications");
    return;
  }
  const p=await Notification.requestPermission();
  A.pop=(p==="granted"); save(A); render();
  toastish(A.pop?"Pop-up alerts are on":"Pop-ups stayed off");
}
function fireDue(){
  if(!A.pop||!("Notification" in window)||Notification.permission!=="granted") return;
  const now=Date.now(), sent=A.sent||{};
  plan().forEach(x=>{
    const t=x.when.getTime();
    if(t>now||sent[x.k]) return;
    if(now-t>3*864e5) { sent[x.k]=1; return; }              // don't shout about last week
    try{ new Notification(x.emoji+"  "+x.title,{body:String(x.body).replace(/<[^>]+>/g,""),tag:"spacea-"+x.k}); }catch(e){}
    sent[x.k]=1;
  });
  A.sent=sent; save(A);
}

// ── the board, in plain words ──────────────────────────────────────────────
// Paste the terminal's 72-hr posting and get bold, colour-coded cards out of it.
function readBoard(txt){
  const lines=String(txt).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const out=[];
  lines.forEach(l=>{
    const seats=l.match(/(\d{1,3})\s*(?:\+\s*)?(?:T|tentative|seats?|pax|F\b)/i);
    const time=l.match(/\b([01]?\d|2[0-3])[:.]?([0-5]\d)\s*(?:L|Z|hrs?|hours?)?\b/);
    const dest=l.replace(/[0-9:.]+\s*(?:L|Z)?/g,"").replace(/\b(seats?|pax|tentative|roll ?call|show ?time)\b/gi,"").trim();
    if(!seats&&!time) return;
    const n=seats?+seats[1]:null;
    out.push({dest:dest.slice(0,46)||"Unnamed flight", seats:n,
      time:time?pad(+time[1])+":"+time[2]:null,
      tone:n==null?"a":n>=20?"g":n>=6?"a":"r"});
  });
  return out;
}
function boardCards(rows){
  if(!rows.length) return `<div class="al-note">Nothing readable yet — paste the terminal's 72-hr posting above and it will translate.</div>`;
  return rows.map(r=>{
    const face=r.seats==null?"🕒":r.seats>=20?"🟢":r.seats>=6?"🟡":"🔴";
    const verdict=r.seats==null?"<b>Time posted, seats not yet</b> — check again later."
      :r.seats>=20?"<b style=\"color:"+GREEN+"\">Plenty of seats — go for it! 🎉</b>"
      :r.seats>=6?"<b style=\"color:"+AMBER+"\">A few seats — show up early and hope. 🤞</b>"
      :"<b style=\"color:"+RED+"\">Almost full — have a backup ticket ready. ⚠️</b>";
    return `<div class="al-card ${r.tone}">
      <div class="hd">${face} ${r.dest}</div>
      <div>${r.seats!=null?"<b>"+r.seats+" seats</b>":"Seats: not posted"}${r.time?' · roll call <b class="al-when">'+r.time+"</b>":""}</div>
      <div style="margin-top:4px">${verdict}</div></div>`;
  }).join("");
}

// ── UI ─────────────────────────────────────────────────────────────────────
function toastish(m){ if(typeof window.toast==="function") window.toast(m); }
function ensure(){
  if($("alWrap")) return;
  const w=document.createElement("div"); w.id="alWrap";
  w.innerHTML=`<div id="alCard"><header>
      <h2>🔔 Auto-alerts<small>Told in time, every time — no jargon</small></h2>
      <button id="alX" title="Close">✕</button></header><div id="alBody"></div></div>`;
  document.body.appendChild(w);
  $("alX").onclick=close;
  w.addEventListener("click",e=>{ if(e.target===w) close(); });
}
function render(){
  const b=$("alBody"); if(!b) return;
  const dep=departDate(), items=plan();
  const popOn=("Notification" in window)&&Notification.permission==="granted"&&A.pop;
  const next=items.filter(x=>x.when.getTime()>Date.now())[0];
  b.innerHTML=`
    <div class="al-sec">
      <h3>1 · When do you want to fly?</h3>
      <div class="al-row">
        <input class="al-in" id="alDep" type="date" value="${A.depart||""}">
        <button class="al-btn" id="alSaveDep">Save the date</button>
        ${dep?`<span style="font-size:12.5px">✈️ <b>${human(dep)}</b> · ${baseName()} → ${destName()}</span>`:""}
      </div>
      ${next?`<div class="al-card a"><div class="hd">${next.emoji} Next: ${next.title}</div>
        <div class="mt">${human(next.when)}</div><div style="margin-top:4px">${next.body}</div></div>`:
        `<div class="al-note">Pick a date and the whole alert schedule builds itself.</div>`}
    </div>

    <div class="al-sec">
      <h3>2 · How you get told</h3>
      <div class="al-step ${popOn?"done":""}"><span class="num">${popOn?"✓":"1"}</span><span class="tx">
        <b>Pop-ups while the app is open</b>
        <small>${popOn?"On — you'll get a pop-up the moment something is due.":
          Notification.permission==="denied"?"Blocked by the browser. Click the padlock in the address bar → Notifications → Allow.":
          "Off. One click turns them on."}</small>
        ${popOn?"":`<div class="al-row" style="margin-top:8px"><button class="al-btn" id="alPop">Turn on pop-ups</button></div>`}
      </span></div>

      <div class="al-step ${A.cal?"done":""}"><span class="num">${A.cal?"✓":"2"}</span><span class="tx">
        <b>Email + phone push, via Google Calendar</b>
        <small>Download the file, then in Google Calendar: <b>Settings → Import &amp; export → Import</b> and pick
        <code>spacea-alerts.ics</code>. Google then emails <b>${EMAIL}</b> 12 h ahead and buzzes your phone 30 min ahead. One import covers every alert.</small>
        <div class="al-row" style="margin-top:8px">
          <button class="al-btn" id="alIcs">⬇️ Download the calendar file</button>
          <button class="al-btn ghost" id="alCalOpen">Open Google Calendar import</button>
          ${A.cal?"":`<button class="al-btn ghost" id="alCalDone">I've imported it ✓</button>`}
        </div>
      </span></div>

      <div class="al-step"><span class="num">3</span><span class="tx">
        <b>Google Tasks</b>
        <small>Tasks has no add-by-link, so copy the list and paste it in — one line per task.</small>
        <div class="al-row" style="margin-top:8px">
          <button class="al-btn" id="alTasks">📋 Copy the task list</button>
          <button class="al-btn ghost" id="alTasksOpen">Open Google Tasks</button>
        </div>
      </span></div>

      <div class="al-step"><span class="num">4</span><span class="tx">
        <b>Email yourself the whole schedule</b>
        <small>Opens Gmail with every date already written out, addressed to ${EMAIL}.</small>
        <div class="al-row" style="margin-top:8px"><button class="al-btn" id="alMail">✉️ Draft the email</button></div>
      </span></div>
    </div>

    <div class="al-sec">
      <h3>3 · Watching with the app closed</h3>
      <div class="al-step"><span class="num">⚡</span><span class="tx">
        <b>Load the extension — then it checks every ${A.every} hours on its own</b>
        <small>
          <b>1.</b> Download the project and find the <code>extension</code> folder.<br>
          <b>2.</b> In Chrome go to <code>chrome://extensions</code>.<br>
          <b>3.</b> Turn on <b>Developer mode</b> (top-right switch).<br>
          <b>4.</b> Click <b>Load unpacked</b> and choose that <code>extension</code> folder.<br>
          <b>5.</b> Pin it, open it once, and paste your Anthropic key so the autofill can map fields.<br>
          <b>6.</b> Hit <b>🔎 Check every board now</b> in its popup. From then on it wakes every
          ${A.every} h on its own.
        </small>
        <small style="margin-top:6px">
          <b>What it reads:</b> all <b>42 terminals that publish a board</b> — the 📅 30-day Patriot
          Express slides <i>and</i> the 🎟️ 72-hour posting. When a new slide deck appears or the board
          changes, you get an OS notification <b>naming the flights, times and seat counts</b>, not just
          "something changed". Click it and the terminal page opens. It also files a 📸 screenshot the
          moment a sign-up confirms.
        </small>
        <div class="al-row" style="margin-top:8px">
          <button class="al-btn" id="alWatch">📋 Copy watch code</button>
          <label style="font-size:12px">Check every
            <select class="al-in" id="alEvery" style="padding:6px 8px;margin-left:6px">
              ${[1,3,6,12,24].map(h=>`<option value="${h}"${A.every===h?" selected":""}>${h} h</option>`).join("")}
            </select></label>
        </div>
        <small style="margin-top:6px"><b>When it checks:</b> AMC lets terminals post next month's slides no
        earlier than <b>7 days before the month</b>, and some post a few days into it — so from the
        <b>24th to the 4th</b> it looks every 2 h, otherwise twice a day. Once your departure is inside
        <b>72 hours</b> it switches to every 45 min, and in the last 12 h every 20 min, because that is the
        only time seat counts exist.</small>
      </span></div>
      <div class="al-note"><b>Why the extension?</b> A web page is not allowed to read <b>.mil</b> pages directly —
      the military sites block it. The extension is, so it does the reading and the app shows the result.
      <b>13 terminals publish no board anywhere public</b> (Key West, Hill, Peterson, Muñiz, Kunsan, Richmond,
      Al Udeid, Soto Cano, Nellis, Wright-Patt, Birmingham, Ali Al Salem, March's is on AFRC) — for those the
      phone and the sign-up address are the only real channels, so they're never scraped and never fake an alert.</div>
    </div>

    <div class="al-sec">
      <h3>4 · Read a board right now</h3>
      <div class="al-note">Paste the terminal's 72-hr posting and it turns into plain language.</div>
      <textarea class="al-in" id="alPaste" placeholder="Paste the 72-hr board here — e.g.  KADENA  0630L  42 seats  YOKOTA">${A.paste||""}</textarea>
      <div class="al-row"><button class="al-btn" id="alRead">🔎 Translate it</button>
        <button class="al-btn ghost" id="alBoardOpen">Open the official board</button></div>
      <div id="alOut">${boardCards(readBoard(A.paste||""))}</div>
    </div>`;

  const on=(id,fn)=>{ const el=$(id); if(el) el.onclick=fn; };
  on("alSaveDep",()=>{ A.depart=$("alDep").value||""; A.sent={}; save(A); render(); toastish(A.depart?"Schedule built":"Date cleared"); });
  on("alPop",askPop);
  on("alIcs",()=>{ downloadIcs(); });
  on("alCalOpen",()=>window.open("https://calendar.google.com/calendar/u/0/r/settings/export","_blank"));
  on("alCalDone",()=>{ A.cal=true; save(A); render(); toastish("Nice — Google has it from here"); });
  on("alTasks",()=>{ const t=taskText();
    if(!t){ toastish("Set your travel date first"); return; }
    if(typeof window.copyText==="function") window.copyText(t,"Task list copied — paste into Google Tasks");
    else navigator.clipboard.writeText(t).then(()=>toastish("Task list copied")); });
  on("alTasksOpen",()=>window.open("https://tasks.google.com/","_blank"));
  on("alMail",()=>window.open(gmailDigest(),"_blank"));
  on("alRead",()=>{ A.paste=$("alPaste").value; save(A); $("alOut").innerHTML=boardCards(readBoard(A.paste)); });
  on("alBoardOpen",()=>{
    let url="https://www.amc.af.mil/AMC-Travel-Site/Terminals/";
    try{ const st=JSON.parse(localStorage.getItem("spacea.starts")||"[]");
      if(st[0]&&typeof TERM_PAGE!=="undefined"&&TERM_PAGE[st[0]]) url=TERM_PAGE[st[0]]; }catch(e){}
    window.open(url,"_blank"); });
  // one line of JSON the extension can swallow: the bases you actually signed up at, plus the date
  on("alWatch",()=>{
    const keys=new Set();
    try{ (JSON.parse(localStorage.getItem("spacea.signups.v1")||"[]")||[]).forEach(s=>(s.terms||[]).forEach(k=>keys.add(k))); }catch(e){}
    if(!keys.size){ try{ (JSON.parse(localStorage.getItem("spacea.starts")||"[]")||[]).forEach(k=>keys.add(k)); }catch(e){} }
    const dep=departDate();
    const code=JSON.stringify({keys:[...keys],departMs:dep?dep.getTime():0,
      label:baseName()+" \u2192 "+destName()});
    if(typeof window.copyText==="function") window.copyText(code,"Watch code copied \u2014 paste it into the extension popup");
    else navigator.clipboard.writeText(code).then(()=>toastish("Watch code copied"));
  });
  const ev=$("alEvery"); if(ev) ev.onchange=()=>{ A.every=+ev.value; save(A); render(); };
  const btn=$("alBtn"); if(btn) btn.classList.toggle("live",!!(A.depart&&(popOn||A.cal)));
}
function open2(){ ensure(); render(); $("alWrap").classList.add("show"); }
function close(){ const w=$("alWrap"); if(w) w.classList.remove("show"); }

const btn=document.createElement("button");
btn.id="alBtn"; btn.type="button"; btn.title="Auto-alerts — 30-day & 72-hour"; btn.textContent="🔔";
btn.setAttribute("aria-label","Auto-alerts");
btn.onclick=open2;
addEventListener("load",()=>{ document.body.appendChild(btn); render(); fireDue();
  setInterval(fireDue,15*6e4); });
window.openAlerts=open2;
window.spaceaAlertPlan=plan;
window.spaceaReadBoard=readBoard;   // the extension feeds the same parser
})();
