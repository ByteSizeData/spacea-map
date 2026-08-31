// Space-A One-Button Autofill — service worker.
// Maps form fields → vault field NAMES via Claude (claude-opus-4-8).
// PRIVACY: only field metadata (labels/names/types) and the LIST of vault field names are sent
// to Claude — never any vault VALUES. Filling happens locally in the content script.

const MODEL = "claude-opus-4-8";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "MAP_FIELDS") return;
  (async () => {
    const { anthropicKey } = await chrome.storage.local.get("anthropicKey");
    if (!anthropicKey) { sendResponse({ error: "No Anthropic API key set — open the extension popup." }); return; }
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2000,
          messages: [{
            role: "user",
            content:
`You are mapping HTML form fields on the official AMC Space-A sign-up form to a traveler vault.
Vault field names (the ONLY values available): ${msg.vaultKeys.join(", ")}.
Form fields (index, label, name, id, type, options):
${JSON.stringify(msg.fields, null, 1)}

Return ONLY a JSON array, one entry per form field you can map:
[{"index": <field index>, "vaultField": "<vault field name>", "confidence": 0.0-1.0}]
Rules: never map password/OTP/CAPTCHA-like fields; if a field is for the sponsor use austin.* fields, dependent → montana.*; destinations map to dest1..dest5; unknown → omit or confidence < 0.5.`
          }]
        })
      });
      const js = await r.json();
      const text = (js.content && js.content[0] && js.content[0].text) || "";
      const m = text.match(/\[[\s\S]*\]/);
      sendResponse(m ? { plan: JSON.parse(m[0]) } : { error: "Claude returned no plan", raw: text.slice(0, 300) });
    } catch (e) { sendResponse({ error: String(e) }); }
  })();
  return true; // async response
});


importScripts("terminals.js", "cadence.js", "pdf.js");

// Let content scripts read extension session storage — this is what makes the zero-touch flow real:
// the beamed packet survives navigations/MFA redirects and every AMC page re-arms itself from it.
try { chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" }); } catch (e) {}

// planner packet JSON → {vault, regs} (same shape the popup's manual import builds)
function packetToSession(p) {
  const vault = {};
  for (const [k, v] of Object.entries(p)) {
    if (k === "source" || k === "v" || k === "registrations" || v == null || v === "") continue;
    if (k === "destinations") { (v || []).slice(0, 5).forEach((d, i) => { vault["dest" + (i + 1)] = d; }); }
    else if (typeof v !== "object") vault[k] = v;
  }
  const regs = (Array.isArray(p.registrations) && p.registrations.length)
    ? p.registrations.map(r => Object.assign({}, r, { terminal: r.terminal || "", destinations: (r.destinations || []).slice(0, 5) }))
    : [{ terminal: p.terminal || "", destinations: (p.destinations || []).slice(0, 5), dateRange: p.travelWindow || "" }];
  return { vault, regs, idx: 0 };
}

// ═══ THE SCRAPER — every terminal, both boards, read and reported ═══
// A web page cannot fetch .mil (the sites block cross-origin reads). This service worker can, because
// of host_permissions, so ALL scraping lives here. It wakes on an alarm, pulls each watched terminal's
// page, pulls out what actually matters, and notifies the moment something is NEW — with the content,
// not just "something changed".
const WATCH = "spacea-board-watch";

async function cfg(){
  const d = await chrome.storage.local.get(["watchKeys","watchEveryH","seen","findings"]);
  return { keys: d.watchKeys || [], everyH: d.watchEveryH || 6, seen: d.seen || {}, findings: d.findings || [] };
}
// One steady heartbeat; the CADENCE decides which terminals are actually due on each beat. A flat
// "every 6 hours" both missed the slide drop and hammered quiet bases for nothing.
async function arm(){ chrome.alarms.create(WATCH, { periodInMinutes: 15, delayInMinutes: 1 }); }
chrome.runtime.onInstalled.addListener(arm);
chrome.runtime.onStartup.addListener(arm);

const strip = h => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();

// ── the 30-day schedule: a monthly slide deck. Its FILE changes when they repost, so the link is the
// signal. Catch pdf/pptx/xlsx/image links whose text or filename says schedule / 30 day / slide.
function findSchedules(html, base){
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+\.(?:pdf|pptx?|xlsx?|docx?|jpe?g|png))["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1], label = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const hay = (href + " " + label).toLowerCase();
    if (!/(30[\s-]?day|schedule|slide|pe\b|patriot|flight)/.test(hay)) continue;
    let url = href;
    try { url = new URL(href, base).href; } catch (e) {}
    out.push({ url, label: label || href.split("/").pop() });
  }
  return out.slice(0, 8);
}

// ── the 72-hour board: destination + roll call + seats, however they wrote it.
function findFlights(text){
  const out = [];
  // PDF kerning glues tokens together ("42SEATS", "YOKOTAAB") — put the seams back before parsing.
  const norm = String(text)
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  norm.split(/\n+/).forEach(raw => {
    const l = raw.trim();
    if (l.length < 6 || l.length > 180) return;
    const seats = l.match(/\b(\d{1,3})\s*(?:\+\s*)?(?:T\b|tentative|seats?|pax\b)/i);
    const time  = l.match(/\b([01]?\d|2[0-3])[:.]?([0-5]\d)\s*(?:L|Z|hrs?|local|zulu)\b/i);
    if (!seats && !time) return;
    if (!/[A-Za-z]{3}/.test(l)) return;
    const dest = l.replace(/\b\d{1,4}[:.]?\d{0,2}\s*(?:L|Z|hrs?|local|zulu)?\b/gi, " ")
      .replace(/\b(seats?|pax|tentative|roll ?call|show ?time|destination|dep|etd|tba?d?|t\b|na|tbd)\b/gi, " ")
      .replace(/[|,;–-]+/g, " ").replace(/\s{2,}/g, " ").trim();
    out.push({ dest: dest.slice(0, 44) || "flight", seats: seats ? +seats[1] : null,
               time: time ? String(time[1]).padStart(2, "0") + ":" + time[2] : null, line: l.slice(0, 140) });
  });
  // de-dupe on the shape of the row, keep the fullest first
  const seen = new Set();
  return out.filter(f => { const k = f.dest + "|" + f.seats + "|" + f.time;
    if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 14);
}

const icon = e => "data:image/svg+xml;base64," + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="26" fill="#161826"/><text x="64" y="88" font-size="62" text-anchor="middle">' + e + '</text></svg>');

function say(id, title, message, items){
  const o = { type: "basic", iconUrl: icon(title.slice(0, 2).trim() || "✈️"), title, message, priority: 2 };
  if (items && items.length > 1) { o.type = "list"; o.items = items.slice(0, 6); }
  chrome.notifications.create(id, o);
}

// what the flights MEAN, in the words you asked for
const verdict = f => f.seats == null ? "🕒 time posted, seats not yet"
  : f.seats >= 20 ? "🟢 " + f.seats + " seats — plenty, go for it!"
  : f.seats >= 6  ? "🟡 " + f.seats + " seats — show up early 🤞"
  :                 "🔴 " + f.seats + " seat" + (f.seats === 1 ? "" : "s") + " — bring a backup ticket ⚠️";

async function sweep(reason){
  const { keys, seen, findings } = await cfg();
  const d2 = await chrome.storage.local.get("departMs");
  const force = reason === "manual";
  const list = (self.TERMINALS || []).filter(t => {
    if (!t.board && !t.alt) return false;   // mirror-only terminals still sweep, via t.alt
    if (keys.length && !keys.includes(t.k)) return false;
    if (force) return true;
    const last = (seen[t.k] || {}).at || 0;
    const mins = self.dueEvery(t, { watched: keys.includes(t.k), departMs: d2.departMs || 0 });
    return (Date.now() - last) >= mins * 6e4;      // not yet due → skip, don't hammer
  });
  if (!list.length) { await chrome.storage.local.set({ lastSweep: Date.now(), lastReason: (reason||"tick") + " · nothing due" }); return { checked: 0 }; }
  const next = Object.assign({}, seen);
  const log = findings.slice();
  for (const t of list) {
    try {
      // own page first; a terminal that publishes nothing falls back to its public mirror
      let src = t.board ? t.page : (t.alt || t.page);
      let r = await fetch(src, { cache: "no-store", credentials: "omit" });
      if (!r.ok && t.alt && src !== t.alt) { src = t.alt; r = await fetch(src, { cache: "no-store", credentials: "omit" }); }
      if (!r.ok) { if (t.altUnverified) console.info("mirror miss", t.k, src, r.status); continue; }
      const html = await r.text();
      const text = strip(html);
      const docs = findSchedules(html, src).map(s =>
        Object.assign({ kind: self.classifyDoc(s.label, s.url) }, s));
      const board = docs.find(d => d.kind === "board72");
      const scheds = docs.filter(d => d.kind !== "board72" && d.kind !== "rollcall");
      const prev = seen[t.k] || {};

      // The page text almost never carries the flights — they are inside the 72-hour PDF. Open it.
      let flights = [], boardText = "";
      if (board){
        try{ boardText = await self.pdfText(board.url); flights = findFlights(boardText); }
        catch(e){ boardText = ""; }
      }
      if (!flights.length) flights = findFlights(text);   // a few terminals do inline it on the page

      // 📅 a 30-day schedule link we have never seen → tell them at once, with its name
      // AMC keeps the filename and bumps a ?ver= hash, so compare FULL urls — a new ver means reposted,
      // even though the path is byte-identical to last month's.
      const fresh = scheds.filter(s => !(prev.scheds || []).includes(s.url));
      if (fresh.length && prev.scheds) {
        const isPe = fresh.some(s => /30[\s-]?day|patriot|\bpe\b/i.test(s.label + s.url));
        say("sched-" + t.k + "-" + Date.now(),
          (isPe ? "📅 New 30-day schedule — " : "📄 New posting — ") + t.n,
          fresh.map(s => s.label).join(" · ").slice(0, 150) +
          (isPe ? "  ·  dates & destinations only — seats appear 72 h out 🕒" : ""),
          fresh.map(s => s.label));
        log.unshift({ kind: "schedule", term: t.k, name: t.n, at: Date.now(),
                      items: fresh, open: fresh[0].url });
      }

      // 🎟️ the 72-hr board changed → tell them WHAT it says
      const sig = (board ? board.url + "::" : "") + flights.map(f => f.dest + f.seats + f.time).join("|");
      if (flights.length && prev.sig !== undefined && sig !== prev.sig) {
        const best = flights.slice().sort((a, b) => (b.seats || 0) - (a.seats || 0))[0];
        say("board-" + t.k + "-" + Date.now(),
          "🎟️ 72-hr board updated — " + t.n,
          (best ? verdict(best) + (best.dest ? " → " + best.dest : "") : "New posting") +
          "  ·  " + flights.length + " flight" + (flights.length === 1 ? "" : "s") + " listed",
          flights.map(f => (f.time ? f.time + "  " : "") + f.dest + "  " + verdict(f)));
        log.unshift({ kind: "board", term: t.k, name: t.n, at: Date.now(),
                      flights, open: (board && board.url) || t.page });
      }
      next[t.k] = { scheds: scheds.map(s => s.url), sig, at: Date.now(), flights,
                    count: flights.length, board: board ? board.url : null,
                    boardLabel: board ? board.label : null,
                    read: board ? (boardText ? "pdf" : "pdf-unreadable") : "page" };
    } catch (e) {
      next[t.k] = Object.assign({}, seen[t.k], { error: String(e).slice(0, 90), at: Date.now() });
    }
  }
  await chrome.storage.local.set({ seen: next, findings: log.slice(0, 120), lastSweep: Date.now(), lastReason: reason || "alarm" });
  return { checked: list.length, findings: log.length };
}

chrome.alarms.onAlarm.addListener(a => { if (a.name === WATCH) sweep("alarm"); });
chrome.notifications.onClicked.addListener(async id => {
  const key = String(id).split("-")[1];
  const t = (self.TERMINALS || []).find(x => x.k === key);
  if (t) chrome.tabs.create({ url: t.page });
});

// ═══ Confirmation capture — the receipt, filed without you thinking about it ═══
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SWEEP_NOW") { sweep("manual").then(sendResponse); return true; }
  // DMDC login in a FRESH incognito window — kills the stale-cookie identity-proofing loop.
  // Needs the user's one-time "Allow in Incognito" switch; if it's off we open that page instead.
  if (msg.type === "OPEN_INCOGNITO") {
    (async () => {
      try {
        const allowed = await chrome.extension.isAllowedIncognitoAccess();
        if (allowed) {
          await chrome.windows.create({ url: msg.url, incognito: true, focused: true });
          sendResponse({ ok: true, mode: "incognito" });
        } else {
          await chrome.tabs.create({ url: "chrome://extensions/?id=" + chrome.runtime.id });
          say("incog-" + Date.now(), "🕶️ One switch to flip",
            "Turn ON “Allow in Incognito” on this page, then hit the login button again.");
          sendResponse({ ok: false, mode: "blocked" });
        }
      } catch (e) { sendResponse({ ok: false, mode: "error", error: String(e).slice(0, 120) }); }
    })();
    return true;
  }
  // Zero-touch handoff: planner beams the packet via the bridge. Store it session-wide (RAM only —
  // same privacy model as the popup import) and poke any open tabs so already-open forms arm NOW.
  if (msg.type === "PACKET_SYNC") {
    (async () => {
      try {
        let p = msg.packet; if (typeof p === "string") p = JSON.parse(p);
        if (!p || p.source !== "spacea-planner") { sendResponse({ ok: false, error: "not a planner packet" }); return; }
        const sess = packetToSession(p);
        await chrome.storage.session.set({ afSession: sess });
        let poked = 0;
        try {
          const tabs = await chrome.tabs.query({});
          for (const t of tabs) {
            if (!t.url || !/^https:/.test(t.url)) continue;
            try { await chrome.tabs.sendMessage(t.id, { type: "VAULT_SESSION", vault: sess.vault, regs: sess.regs }); poked++; } catch (e) {}
          }
        } catch (e) {}
        sendResponse({ ok: true, regs: sess.regs.length, poked });
      } catch (e) { sendResponse({ ok: false, error: String(e).slice(0, 120) }); }
    })();
    return true;
  }
  if (msg.type === "SET_WATCH") {
    chrome.storage.local.set({ watchKeys: msg.keys || [], watchEveryH: msg.everyH || 6 })
      .then(arm).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type !== "CAPTURE_CONFIRM") return;
  (async () => {
    try {
      const png = await chrome.tabs.captureVisibleTab({ format: "png" });
      const when = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      await chrome.downloads.download({ url: png, saveAs: false,
        filename: "spacea-confirmations/" + (msg.term || "signup") + "-" + when + ".png" });
      const d = await chrome.storage.local.get("findings");
      const log = d.findings || [];
      log.unshift({ kind: "confirm", term: msg.term || "", name: msg.note || "Confirmation",
                    at: Date.now(), open: msg.url || "" });
      await chrome.storage.local.set({ findings: log.slice(0, 120) });
      say("shot-" + Date.now(), "📸 Confirmation saved",
        "Filed in spacea-confirmations. Nothing else to do.");
      sendResponse({ ok: true });
    } catch (e) { sendResponse({ error: String(e) }); }
  })();
  return true;
});
