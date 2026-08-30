// popup.js — unlock the sealed vault (same AES-GCM/PBKDF2 scheme as the app) and hand a
// SESSION-ONLY flat field map to the content script. Plaintext never touches storage.
const $ = id => document.getElementById(id);
const msg = (t, err) => { $("msg").className = err ? "err" : "ok"; $("msg").textContent = t; };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

chrome.storage.local.get("anthropicKey").then(({ anthropicKey }) => { if (anthropicKey) $("key").value = anthropicKey; });
$("key").addEventListener("change", () => chrome.storage.local.set({ anthropicKey: $("key").value.trim() }));

async function deriveKey(pass, salt, iter) {
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, km,
    { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
}
function flatten(v) { // vault JSON → flat field map (AMC Form 140-complete; dest slots filled on-form)
  const split = n => { const s = (n || "").trim().split(/\s+/); return s.length > 1 ? [s.slice(0, -1).join(" "), s[s.length - 1]] : [s[0] || "", ""]; };
  const [af, al] = split(v.austin.name), [mf, ml] = split(v.montana.name);
  return {
    "t1_first": af, "t1_last": al, "t1_dod": v.austin.edipi, "t1_dob": v.austin.dob,
    "t1_rank": v.austin.rank, "t1_branch": v.austin.branch, "t1_status": v.austin.status, "t1_category": v.austin.cat || "VI",
    "t1_deers": v.austin.deers, "party_size": "2",
    "t1_email": v.contact.email, "t1_phone": v.contact.phone,
    "t1_passport": v.austin.passport, "t1_passport_country": v.austin.passportCountry, "t1_passport_type": v.austin.passportType, "t1_passport_expiry": v.austin.passportExp,
    "t2_first": mf, "t2_last": ml, "t2_dod": v.montana.edipi, "t2_dob": v.montana.dob,
    "t2_relationship": v.montana.relationship || "Spouse", "t2_deers": v.montana.deers,
    "t2_passport": v.montana.passport, "t2_passport_country": v.montana.passportCountry, "t2_passport_type": v.montana.passportType, "t2_passport_expiry": v.montana.passportExp,
    "t2_visa_notes": v.montana.visaNotes
  };
}
// The two failure modes people actually hit: (1) the page loaded before the extension did; (2) the
// AMC form lives on a domain not in the pre-match list (they keep moving it). Both are fixed the same
// way: your click on the popup grants activeTab, so we inject the script into the tab you're looking
// at — whatever its domain — and retry.
async function sendToTab(payload) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https?:/i.test(tab.url || "")) throw new Error("notab");
  try {
    return await chrome.tabs.sendMessage(tab.id, payload);
  } catch (e) {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["content.js"] });
    return await chrome.tabs.sendMessage(tab.id, payload);
  }
}
function explain(e) {
  const s = String((e && e.message) || e);
  if (s === "notab") return "Switch to the AMC sign-up TAB first — this button talks to the tab you're looking at — then reopen the popup and retry.";
  if (/Receiving end|Could not establish/i.test(s)) return "The sign-up page isn't listening — reload that tab once, then retry.";
  if (/Cannot access|cannot be scripted|chrome:\/\//i.test(s)) return "Chrome blocks extensions on this kind of page — make sure the ACTIVE tab is the AMC form itself.";
  return s;
}
$("unlock").onclick = async () => {
  try {
    if (!$("file").files.length) { msg("Pick your vault backup file first.", 1); return; }
    const blob = JSON.parse(await $("file").files[0].text());
    const key = await deriveKey($("pass").value, unb64(blob.salt), blob.iter || 150000);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(blob.iv) }, key, unb64(blob.ct));
    const vault = flatten(JSON.parse(new TextDecoder().decode(pt)));
    await sendToTab({ type: "VAULT_SESSION", vault });
    msg("Vault unlocked for this tab (session only). Log in, open the form, then hit ⚡ Auto-fill on the page.");
  } catch (e) {
    msg(/wrongsite|notab|Receiving end|Could not establish/i.test(String(e && e.message || e))
      ? explain(e) : "Unlock failed — wrong passphrase or not a vault backup.", 1);
  }
};
function importPacket(text) {
  return (async () => {
    let p = null;
    try { p = JSON.parse(text); } catch (e) { msg("That isn't the packet — in the planner hit ⚡ Send to Autofill, then retry.", 1); return; }
    if (!p || p.source !== "spacea-planner") { msg("Clipboard isn't a planner packet — use ⚡ Send to Autofill in the app first.", 1); return; }
    // identity fields stay constant; each registration carries its own terminal + destinations
    const vault = {};
    for (const [k, v] of Object.entries(p)) {
      if (k === "source" || k === "v" || k === "registrations" || v == null || v === "") continue;
      if (k === "destinations") { (v || []).slice(0, 5).forEach((d, i) => { vault["dest" + (i + 1)] = d; }); }
      else vault[k] = v;
    }
    const regs = (Array.isArray(p.registrations) && p.registrations.length)
      ? p.registrations.map(r => Object.assign({}, r, { terminal: r.terminal || "", destinations: (r.destinations || []).slice(0, 5) })) // keep dates + location hints
      : [{ terminal: p.terminal || "", destinations: (p.destinations || []).slice(0, 5), dateRange: p.travelWindow || "" }];
    try {
      await sendToTab({ type: "VAULT_SESSION", vault, regs });
      try { await chrome.storage.session.set({ afSession: { vault, regs, idx: 0 } }); } catch (e) {}
    } catch (e) { msg(explain(e), 1); return false; }
    msg(regs.length > 1
      ? "Imported " + regs.length + " sign-ups (destination + return). The page button walks them one base at a time — first up: " + (regs[0].terminal || "?") + "."
      : "Packet imported for this tab (session only) — terminal \"" + (regs[0].terminal || "?") + "\", " + regs[0].destinations.length + " destination(s). Hit ⚡ Auto-fill on the form.");
    return true;
  })();
}
$("import").onclick = async () => {
  let text = "";
  try { text = await navigator.clipboard.readText(); }
  catch (e) {
    $("pasteWrap").style.display = "block";
    msg("Chrome blocked the clipboard read here — paste the packet in the box below instead.", 1);
    return;
  }
  if (!text || !text.trim()) { $("pasteWrap").style.display = "block"; msg("Clipboard is empty — hit ⚡ Send to Autofill in the planner, or paste the packet below.", 1); return; }
  await importPacket(text);
};
$("importPasted").onclick = () => importPacket($("pk").value);
// 🤖 the one-button agent: packet in (clipboard or last import) → arm → fill this page NOW
$("go").onclick = async () => {
  let text = "";
  try { text = await navigator.clipboard.readText(); } catch (e) {}
  if (text && text.trim().startsWith("{")) {
    const ok = await importPacket(text);
    if (!ok) return;
  } else {
    let stored = null;
    try { ({ afSession: stored } = await chrome.storage.session.get("afSession")); } catch (e) {}
    if (!stored) { $("pasteWrap").style.display = "block";
      msg("No packet yet — in the planner hit \ud83d\udccb Re-copy packet, then press this again (or paste it below).", 1); return; }
    try { await sendToTab({ type: "VAULT_SESSION", vault: stored.vault, regs: stored.regs }); }
    catch (e) { msg(explain(e), 1); return; }
  }
  try { await sendToTab({ type: "RUN_FILL" });
    msg("\ud83e\udd16 Filling now — review the highlighted fields on the page, then click the site's Submit. It keeps auto-filling as you move base to base."); }
  catch (e) { msg(explain(e), 1); }
};
// 🩺 One button that says exactly where the chain is broken: tab → script → packet → form fields.
$("diag").onclick = async () => {
  const L = [];
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = (tab && tab.url) || "";
  const onHttp = /^https?:/i.test(url);
  L.push((onHttp ? "\u2705" : "\u274c") + " Active tab: " + (onHttp ? new URL(url).hostname : "not a normal web page — switch to the sign-up tab, then rerun"));
  if (onHttp) {
    let ping = null;
    try { ping = await chrome.tabs.sendMessage(tab.id, { type: "PING" }); }
    catch (e) {
      try { await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["content.js"] });
        ping = await chrome.tabs.sendMessage(tab.id, { type: "PING" }); L.push("\u2699\ufe0f Script wasn't loaded — injected it just now."); }
      catch (e2) { L.push("\u274c Page script unreachable: " + String(e2 && e2.message || e2).slice(0, 90)); }
    }
    if (ping && ping.ok) {
      L.push("\u2705 Page script alive — v" + ping.version + " (look for the status pill bottom-left of the page)");
      L.push((ping.armed ? "\u2705" : "\u274c") + " Packet session: " + (ping.armed ? ping.regs + " sign-up(s)" : "none — hit \u26a1 Import below"));
      L.push((ping.fields ? "\u2705" : "\u26a0\ufe0f") + " Fillable fields seen on page: " + ping.fields);
    }
  }
  try { const t = await navigator.clipboard.readText();
    const p = t && JSON.parse(t);
    L.push(p && p.source === "spacea-planner"
      ? "\u2705 Clipboard: planner packet (" + ((p.registrations || []).length || 1) + " sign-ups" + (p.travelWindow ? " \u00b7 " + p.travelWindow : "") + ")"
      : "\u26a0\ufe0f Clipboard: not a planner packet — press your fill button in the planner again");
  } catch (e) { L.push("\u26a0\ufe0f Clipboard unreadable here — use the paste box after hitting Import"); }
  const { anthropicKey } = await chrome.storage.local.get("anthropicKey");
  L.push((anthropicKey ? "\u2705" : "\u2139\ufe0f") + " Claude key " + (anthropicKey ? "set (identity fields will map)" : "not set — optional; trip fields fill without it"));
  $("msg").className = "ok"; $("msg").style.whiteSpace = "pre-line"; $("msg").textContent = L.join("\n");
};
$("lock").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try { await chrome.tabs.sendMessage(tab.id, { type: "VAULT_LOCK" }); } catch (e) {}
  msg("Session locked — vault cleared from the page.");
};
$("shot").onclick = async () => {
  const url = await chrome.tabs.captureVisibleTab();
  const a = document.createElement("a");
  a.href = url; a.download = "spacea-confirmation-" + new Date().toISOString().slice(0, 10) + ".png";
  a.click();
  msg("Screenshot downloaded — add it to the app's Document vault to timestamp the sign-up.");
};


// ═══ Board watch panel — what the scraper found, in plain words ═══
(function(){
  const $ = id => document.getElementById(id);
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4);
    return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.round(m / 60) + " h ago"; };
  const verdict = f => f.seats == null ? "🕒 seats not posted"
    : f.seats >= 20 ? "🟢 " + f.seats + " seats — plenty!"
    : f.seats >= 6  ? "🟡 " + f.seats + " seats — early 🤞"
    :                 "🔴 " + f.seats + " — backup ticket ⚠️";

  async function paint(){
    const d = await chrome.storage.local.get(["findings", "lastSweep", "watchEveryH", "seen"]);
    const ev = $("swEvery"); if (ev && d.watchEveryH) ev.value = String(d.watchEveryH);
    const st = $("swStatus");
    const n = Object.keys(d.seen || {}).length;
    if (st) st.textContent = d.lastSweep
      ? "Last check " + ago(d.lastSweep) + " · " + n + " terminal" + (n === 1 ? "" : "s") + " read"
      : "Not checked yet — hit the button.";
    const box = $("swFindings"); if (!box) return;
    const F = (d.findings || []).slice(0, 25);
    if (!F.length) { box.innerHTML = '<div style="font-size:11.5px;opacity:.55">Nothing new yet. You are told the moment a board or schedule changes.</div>'; return; }
    box.innerHTML = F.map(f => {
      const head = f.kind === "schedule" ? "📅 New schedule — " + f.name
        : f.kind === "confirm" ? "📸 " + (f.name || "Confirmation saved")
        : "🎟️ Board updated — " + f.name;
      const body = f.kind === "board" && f.flights
        ? f.flights.slice(0, 5).map(x => '<div style="font-size:11.5px">' +
            (x.time ? '<b>' + x.time + '</b>  ' : "") + (x.dest || "") + "  " + verdict(x) + "</div>").join("")
        : f.items ? f.items.map(i => '<div style="font-size:11.5px">' + (i.label || i) + "</div>").join("")
        : "";
      return '<a href="' + (f.open || "#") + '" target="_blank" style="text-decoration:none;color:inherit">' +
        '<div style="padding:9px 10px;border-radius:9px;border:1px solid #2a2d3d;background:#191c29">' +
        '<div style="font-size:12.5px;font-weight:700;margin-bottom:3px">' + head + "</div>" + body +
        '<div style="font-size:10.5px;opacity:.5;margin-top:4px">' + ago(f.at) + " · click to open</div></div></a>";
    }).join("");
  }

  const now = $("swNow");
  if (now) now.onclick = async () => {
    now.disabled = true; now.textContent = "⏳ Reading every board…";
    try { await chrome.runtime.sendMessage({ type: "SWEEP_NOW" }); } catch (e) {}
    now.disabled = false; now.textContent = "🔎 Check every board now";
    paint();
  };
  const ev = $("swEvery");
  if (ev) ev.onchange = () => chrome.runtime.sendMessage({ type: "SET_WATCH", everyH: +ev.value });
  paint();
  setInterval(paint, 20000);
})();


// ═══ Watch list from the app ═══
// The app cannot write into the extension's storage, so it hands over one line of JSON and this reads it.
(function(){
  const $=id=>document.getElementById(id);
  const box=$("swPaste"); if(!box) return;
  $("swLoad").onclick=async()=>{
    let o=null;
    try{ o=JSON.parse(box.value.trim()); }catch(e){ $("swLoadMsg").textContent="That is not the watch code — copy it again from the app."; return; }
    const keys=Array.isArray(o.keys)?o.keys:[];
    await chrome.storage.local.set({ watchKeys:keys, departMs:o.departMs||0, watchLabel:o.label||"" });
    await chrome.runtime.sendMessage({ type:"SET_WATCH", keys, everyH:+($("swEvery")||{}).value||6 });
    $("swLoadMsg").textContent="✅ Watching "+keys.length+" terminal"+(keys.length===1?"":"s")+
      (o.departMs?" · departure "+new Date(o.departMs).toDateString():"");
    box.value="";
  };
})();
