// Space-A One-Button Autofill — content script (runs on amc.af.mil / GATES pages).
// Vault plaintext lives ONLY in this closure for the session; never persisted, never logged.
// v1.2: framework-proof fills for the AMC travel form — native value setters (React/Angular/Vue
// hijack .value), combobox dropdowns clicked like a human would, date-range + Country/State rules
// answered LOCALLY (no API call needed for the trip fields).
(() => {
  if (window.__spaceaAF) return; window.__spaceaAF = 1; // popup can inject on demand — never run twice
  let VAULT = null; // {flat identity map} sent from the popup after passphrase unlock
  let REGS = [], IDX = 0; // one registration per base: {terminal, destinations[], terminalLocation, dateRange, ...}
  let btn = null, nextBtn = null, banner = null, pill = null;
  const VERSION = (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || "?";

  const SKIP = /captcha|otp|mfa|passwd|password|pin\b|token|ssn-verify|secret/i;
  const mask = v => (v == null ? "" : "••••" + String(v).slice(-3));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

  chrome.runtime.onMessage.addListener((msg, s, respond) => {
    if (msg.type === "PING") { // popup diagnostic: prove the script is alive and say what it can see
      respond({ ok: true, version: VERSION, regs: REGS.length, armed: !!VAULT,
        fields: collectFields().length, host: location.hostname });
      return;
    }
    if (msg.type === "RUN_FILL") { // popup's one-button agent: fill this page right now
      if (!VAULT) { respond({ ok: false, error: "no session" }); return; }
      run(); respond({ ok: true });
      return;
    }
    if (msg.type === "VAULT_SESSION") {
      VAULT = msg.vault;
      REGS = Array.isArray(msg.regs) ? msg.regs : [];
      IDX = 0;
      ensureButton(); label(); pillPaint(); saveSession(); maybeAutoRun();
      respond({ ok: true });
    }
    if (msg.type === "VAULT_LOCK") { VAULT = null; REGS = []; IDX = 0;
      try { chrome.storage.session.remove("afSession"); } catch (e) {}
      if (btn) btn.remove(); btn = null;
      if (nextBtn) nextBtn.remove(); nextBtn = null;
      pillPaint();
      respond({ ok: true }); }
  });
  window.addEventListener("pagehide", () => { VAULT = null; REGS = []; }); // session-only

  const reg = () => REGS[IDX] || null;

  // ── "Kaiserslautern, DE" → {country:"Germany", state:""}; "Fairfield, CA" → USA + California ──
  const US_STATES = { AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
    DE:"Delaware", FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
    KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",
    MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
    NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",
    PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",
    VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia",
    PR:"Puerto Rico" };
  // NOTE: a bare "DE" is ambiguous — Dover's "Dover, DE" is Delaware, Ramstein's "Kaiserslautern, DE" is Germany.
  // Known German base towns win first; anything else falls through to the US-state table.
  const GERMAN_TOWNS = /kaiserslautern|ramstein|spangdahlem|stuttgart|wiesbaden|grafenwoehr|landstuhl/i;
  const CMAP = { UK:"United Kingdom", IT:"Italy", ES:"Spain", PT:"Portugal", JP:"Japan", KR:"South Korea",
    GR:"Greece", TR:"Turkey", BH:"Bahrain", QA:"Qatar", SG:"Singapore", TH:"Thailand", AU:"Australia",
    NL:"Netherlands", BE:"Belgium", DJ:"Djibouti", CU:"Cuba" };
  function locParts(loc) {
    const seg = String(loc || "").split(",").map(x => x.trim()).filter(Boolean);
    if (!seg.length) return { country: "", state: "" };
    const city = seg[0], last = seg[seg.length - 1];
    if (/^(usa|us|u\.s\.a?\.?)$/i.test(last)) return { country: "United States", state: "" };
    if (/^[A-Z]{2}$/.test(last)) {
      if (last === "DE" && GERMAN_TOWNS.test(city)) return { country: "Germany", state: "" };
      if (US_STATES[last]) return { country: "United States", state: US_STATES[last] };
      if (CMAP[last]) return { country: CMAP[last], state: "" };
    }
    return { country: last, state: "" };
  }

  // the identity map plus THIS base's terminal, destinations, dates and location hints
  function fillMap() {
    const m = Object.assign({}, VAULT);
    const r = reg();
    if (r) {
      if (r.terminal) m.terminal = r.terminal;
      (r.destinations || []).slice(0, 5).forEach((d, i) => { m["dest" + (i + 1)] = d; });
      if (r.dateRange) m.dateRange = r.dateRange;
      if (r.dateFrom) m.dateFrom = r.dateFrom;
      if (r.dateTo) m.dateTo = r.dateTo;
      const tl = locParts(r.terminalLocation);
      if (tl.country) m.termCountry = tl.country;
      if (tl.state) m.termState = tl.state;
      const dl = locParts((r.destinationLocations || [])[0]);
      if (dl.country) m.destCountry = dl.country;
      if (dl.state) m.destState = dl.state;
    }
    return m;
  }

  function label() {
    if (!btn) return;
    const r = reg();
    btn.textContent = REGS.length > 1 && r
      ? "⚡ Auto-fill — " + r.terminal + " (" + (IDX + 1) + " of " + REGS.length + ")"
      : "⚡ Auto-fill this form";
    if (REGS.length > 1) {
      if (!nextBtn) {
        nextBtn = document.createElement("button");
        Object.assign(nextBtn.style, { position: "fixed", right: "18px", bottom: "66px", zIndex: 2147483647,
          padding: "10px 16px", borderRadius: "22px", border: "1px solid #22D3EE", cursor: "pointer",
          background: "#0b1020", color: "#22D3EE", fontWeight: "700", fontSize: "13px",
          boxShadow: "0 4px 18px rgba(0,0,0,.4)" });
        nextBtn.onclick = () => {
          IDX = (IDX + 1) % REGS.length; label(); saveSession();
          note("Next base: " + reg().terminal + " — open a fresh sign-up form and I'll fill it the moment it appears. (" +
            (IDX + 1) + " of " + REGS.length + ")");
        };
        document.body.appendChild(nextBtn);
      }
      const nx = REGS[(IDX + 1) % REGS.length];
      nextBtn.textContent = "Next base → " + nx.terminal;
    }
  }

  function ensureButton() {
    if (btn || !VAULT) return;
    btn = document.createElement("button");
    btn.textContent = "⚡ Auto-fill this form";
    Object.assign(btn.style, { position: "fixed", right: "18px", bottom: "18px", zIndex: 2147483647,
      padding: "12px 18px", borderRadius: "24px", border: "0", cursor: "pointer",
      background: "#22D3EE", color: "#0b1020", fontWeight: "700", fontSize: "14px",
      boxShadow: "0 4px 18px rgba(0,0,0,.4)" });
    btn.onclick = run;
    document.body.appendChild(btn);
    note("Vault session active. Log in / clear MFA yourself, open the sign-up form, then hit ⚡ Auto-fill. You always click Submit.");
  }

  // ── the visible "is it even loaded?" checkbox, pinned to the sign-up page itself ──────────────
  // Grey = extension loaded, waiting for a packet. Green ✓ = packet imported, ready to fill.
  // Click it any time for a plain-words diagnostic of this exact page.
  function pillPaint() {
    if (!document.body) return;
    if (!pill) {
      pill = document.createElement("button");
      Object.assign(pill.style, { position: "fixed", left: "14px", bottom: "14px", zIndex: 2147483647,
        padding: "7px 12px", borderRadius: "18px", cursor: "pointer", fontSize: "12px", fontWeight: "600",
        fontFamily: "system-ui,sans-serif", boxShadow: "0 3px 14px rgba(0,0,0,.45)" });
      pill.title = "Space-A Autofill status — click for a diagnostic";
      pill.onclick = diag;
      document.body.appendChild(pill);
    }
    const armed = !!VAULT;
    pill.textContent = armed
      ? "\u2705 Autofill armed \u00b7 v" + VERSION + (REGS.length ? " \u00b7 " + REGS.length + " sign-up" + (REGS.length === 1 ? "" : "s") : "")
      : "\u2610 Autofill loaded \u00b7 v" + VERSION + " \u2014 import a packet";
    Object.assign(pill.style, armed
      ? { background: "#123526", color: "#4BFF9E", border: "1.5px solid #2c7d55" }
      : { background: "#191c29", color: "#aab1cf", border: "1.5px solid #3a3f58" });
  }
  function diag() {
    const fields = collectFields();
    const combos = fields.filter(f => f.combo).length;
    const r = reg();
    const lines = [
      "\u2705 Extension content script: LOADED (v" + VERSION + ") on " + location.hostname,
      (VAULT ? "\u2705" : "\u274c") + " Packet session: " + (VAULT ? (REGS.length + " sign-up(s)" + (r ? " \u00b7 next: " + r.terminal : "")) : "none \u2014 popup \u2192 \u26a1 Import from website"),
      (fields.length ? "\u2705" : "\u274c") + " Fillable fields on THIS page: " + fields.length + (fields.length ? " (" + combos + " dropdown-style)" : " \u2014 open the actual sign-up form first"),
      (r && r.dateRange ? "\u2705 Dates in packet: " + r.dateRange : "\u26a0\ufe0f No travel dates in packet \u2014 set your window in the checklist, then re-copy"),
      "\u2139\ufe0f Fill order: dates \u2192 departure \u2192 arrival \u2192 country/state. Cyan outline = confident, amber = check it."
    ];
    note(lines.join("\n"), "#12141f");
    banner.style.whiteSpace = "pre-line"; banner.style.textAlign = "left";
  }
  // Top frame: paint the status pill immediately. The AMC tool often renders its FORM inside an
  // embedded frame — there, paint only once fillable fields actually appear (the SPA renders late),
  // so the pill/⚡ button sit in the frame that can really be filled.
  if (window === window.top) pillPaint();
  else {
    let tries = 0;
    const t = setInterval(() => {
      if (collectFields().length) { pillPaint(); if (VAULT) { ensureButton(); label(); } clearInterval(t); }
      else if (++tries > 15) clearInterval(t);
    }, 800);
  }

  // ── the hybrid-agent core ──────────────────────────────────────────────────────────────────
  // The session (vault + registrations + which base is next) lives in extension session storage —
  // memory-backed, gone when the browser closes. It survives page navigations and MFA redirects, so
  // the agent re-arms on every page and AUTO-FILLS the moment it recognizes the trip form. The human
  // reviews the highlights and clicks Submit; the agent never does.
  function saveSession() {
    try { chrome.storage.session.set({ afSession: { vault: VAULT, regs: REGS, idx: IDX } }); } catch (e) {}
  }
  async function restoreSession() {
    try {
      const { afSession } = await chrome.storage.session.get("afSession");
      if (!afSession || VAULT) return;
      VAULT = afSession.vault || null; REGS = afSession.regs || []; IDX = afSession.idx || 0;
      if (VAULT) { ensureButton(); label(); pillPaint(); maybeAutoRun(); }
    } catch (e) {}
  }
  let _arT = null;
  function maybeAutoRun() {
    if (_arT) return; // throttle, not debounce — a page that mutates constantly (SPA tickers, animations) must not starve the fill
    _arT = setTimeout(() => {
      _arT = null;
      if (!VAULT) return;
      const key = "spaceaAuto:" + location.pathname + "|" + IDX;
      try { if (sessionStorage.getItem(key)) return; } catch (e) {}
      const plan = localPlan(collectFields(), fillMap());
      if (plan.length < 2) return;              // not the trip form (yet) — keep watching
      try { sessionStorage.setItem(key, "1"); } catch (e) {}
      note("\ud83e\udd16 Auto-filling" + (reg() ? " — " + reg().terminal : "") + ". Review the highlighted fields; the Submit click is yours.");
      run();
    }, 900);
  }
  new MutationObserver(() => { if (VAULT) maybeAutoRun(); })
    .observe(document.documentElement, { childList: true, subtree: true });
  restoreSession();
  try { // zero-touch: a packet beamed from the planner lands in session storage — adopt it live, no popup
    chrome.storage.session.onChanged.addListener(ch => {
      if (!ch.afSession || !ch.afSession.newValue) return;
      const s = ch.afSession.newValue;
      if (JSON.stringify(s) === JSON.stringify({ vault: VAULT, regs: REGS, idx: IDX })) return;
      VAULT = s.vault || null; REGS = s.regs || []; IDX = s.idx || 0;
      if (!VAULT) return;
      try { Object.keys(sessionStorage).forEach(k => { if (k.indexOf("spaceaAuto:") === 0) sessionStorage.removeItem(k); }); } catch (e) {}
      ensureButton(); label(); pillPaint();
      note("⚡ Packet received from your planner — auto-filling the moment the form appears. The Submit click stays yours.");
      maybeAutoRun();
    });
  } catch (e) {}

  function note(t, color) {
    if (banner) banner.remove();
    banner = document.createElement("div");
    banner.textContent = t;
    Object.assign(banner.style, { position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "70px",
      zIndex: 2147483647, maxWidth: "560px", padding: "10px 16px", borderRadius: "10px",
      background: color || "#12141f", color: "#e9e9ed", fontSize: "13px", boxShadow: "0 4px 18px rgba(0,0,0,.5)" });
    document.body.appendChild(banner);
    setTimeout(() => { if (banner) banner.remove(); banner = null; }, 9000);
  }

  // ── framework-proof write: the AMC form is a JS app — a bare .value= gets wiped on the next
  // render. Go through the native prototype setter, then speak the events the framework listens for.
  function setNative(el, v) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const d = Object.getOwnPropertyDescriptor(proto, "value");
    if (d && d.set) d.set.call(el, v); else el.value = v;
  }
  function fire(el) {
    el.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, data: el.value }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function settle(el) { el.dispatchEvent(new Event("blur", { bubbles: true })); el.dispatchEvent(new FocusEvent("focusout", { bubbles: true })); }

  // ── comboboxes (Departure/Arrival Airport, Country, State): type, wait for the overlay list,
  // click the best option — exactly the gesture the site expects, so its state stays consistent.
  const OPT_SEL = '[role="option"],.mat-option,.mat-mdc-option,.ng-option,li[role="option"],.p-dropdown-item,.dropdown-item,.usa-combo-box__list-option';
  // if a combo already holds junk (e.g. a stray paste), clear it before typing the real value
  async function fillCombo(el, val) {
    el.focus();
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.click();
    if (el.value) { setNative(el, ""); fire(el); await sleep(60); }
    setNative(el, val); fire(el);
    const nv = norm(val);
    // "JB Pearl Harbor-Hickam" must still find "HICKAM AFB": try whole-string matches first, then every
    // distinctive word, longest first (skips glue like AFB/AB/JB/base/joint/intl)
    const toks = nv.split(" ").filter(w => w.length > 3 && !/^(joint|base|field|intl|airport|naval|station)$/.test(w))
      .sort((a, b) => b.length - a.length);
    for (let t = 0; t < 10; t++) {
      await sleep(150);
      const opts = [...document.querySelectorAll(OPT_SEL)].filter(vis);
      if (!opts.length) continue;
      let best = opts.find(o => norm(o.textContent) === nv)
        || opts.find(o => norm(o.textContent).startsWith(nv))
        || opts.find(o => norm(o.textContent).includes(nv));
      if (!best) for (const w of toks) { best = opts.find(o => norm(o.textContent).includes(w)); if (best) break; }
      if (best) {
        best.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        best.click();
        await sleep(90);
        return true;
      }
    }
    settle(el); // leave the typed text for the human to finish
    return false;
  }

  async function fillPlain(el, val) {
    el.focus();
    setNative(el, val); fire(el); settle(el);
  }

  const comboish = el => el.getAttribute("role") === "combobox" || el.getAttribute("aria-autocomplete") === "list"
    || !!el.closest('[role="combobox"],mat-select,.mat-mdc-select,.ng-select,.p-dropdown,.usa-combo-box');

  function collectFields() {
    const els = [...document.querySelectorAll("input, select, textarea")].filter(el => {
      if (!vis(el)) return false;
      if (["hidden", "password", "submit", "button", "file"].includes(el.type)) return false;
      const meta = (el.name || "") + " " + (el.id || "") + " " + (el.placeholder || "");
      return !SKIP.test(meta); // the agent NEVER touches credentials/MFA/CAPTCHA fields
    });
    return els.map((el, i) => {
      let label = "";
      if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) label = l.textContent.trim(); }
      if (!label) { const l = el.closest("label"); if (l) label = l.textContent.trim(); }
      if (!label) { // floating labels (Angular Material & friends): the label lives in the field wrapper, not <label for>
        const c = el.closest(".mat-form-field,.mat-mdc-form-field,.form-group,.usa-form-group,[class*='form-field'],[class*='field']");
        if (c) { const l = c.querySelector("mat-label,label,.mat-mdc-floating-label,.mat-form-field-label,legend,.usa-label");
          if (l) label = l.textContent.trim(); }
      }
      if (!label && el.getAttribute("aria-labelledby")) {
        label = el.getAttribute("aria-labelledby").split(/\s+/)
          .map(id => { const n = document.getElementById(id); return n ? n.textContent.trim() : ""; })
          .join(" ").trim();
      }
      if (!label) label = el.getAttribute("aria-label") || el.placeholder || "";
      return { index: i, el, label: label.slice(0, 120), name: el.name || "", id: el.id || "",
        type: el.type || el.tagName.toLowerCase(), combo: comboish(el),
        options: el.tagName === "SELECT" ? [...el.options].map(o => o.text).slice(0, 30) : undefined };
    });
  }

  // ── trip fields answered locally — the exact AMC form in front of you needs no API call.
  // soft:1 = filled from a location hint; highlighted amber so you double-check it.
  const RULES = [
    { re: /start date/i, key: "dateFrom" },
    { re: /end date/i, key: "dateTo" },
    { re: /range.{0,14}dates?|available dates?|travel dates?|dates? of travel|mm\/dd\/yyyy\s*-\s*mm\/dd\/yyyy/i, key: "dateRange" },
    { re: /departure.{0,10}(airport|terminal|location|base)|origin.{0,10}(airport|terminal)|flying from|from airport/i, key: "terminal" },
    { re: /arrival.{0,10}(airport|terminal|location|base)|destination/i, key: "dest1" },
    { re: /\bcountry\b/i, key: "termCountry", soft: 1 },
    { re: /\bstate\b/i, key: "termState", soft: 1 }
  ];
  function localPlan(fields, MAP) {
    const plan = [];
    fields.forEach(f => {
      const text = f.label + " " + f.name + " " + f.id + " " + (f.el.placeholder || "");
      for (const rule of RULES) {
        if (!rule.re.test(text)) continue;
        const val = MAP[rule.key];
        if (val == null || val === "") break;
        plan.push({ f, val, soft: !!rule.soft, why: rule.key });
        return;
      }
    });
    return plan;
  }

  async function applyOne(f, val, soft) {
    if (f.el.tagName === "SELECT") {
      const opt = [...f.el.options].find(o => norm(o.text) === norm(val))
        || [...f.el.options].find(o => norm(o.text).includes(norm(val)))
        || [...f.el.options].find(o => norm(val).includes(norm(o.text)) && o.value);
      if (!opt) return false;
      setNative(f.el, opt.value); fire(f.el); settle(f.el);
    } else if (f.combo) {
      const ok = await fillCombo(f.el, String(val));
      if (!ok) soft = true; // typed but not confirmed from the list — flag for review
    } else {
      await fillPlain(f.el, String(val));
    }
    f.el.style.outline = soft ? "2px solid #FBBF24" : "2px solid #22D3EE";
    f.el.style.outlineOffset = "1px"; // review highlight: cyan = confident, amber = check me
    return true;
  }

  async function run() {
    if (!VAULT) { note("Vault session missing — open the extension popup and unlock first.", "#7a2b2b"); return; }
    const fields = collectFields();
    if (!fields.length) { note("No fillable form fields visible on this page yet — open the sign-up form first."); return; }
    const MAP = fillMap();
    const r0 = reg();

    // 1 · the trip fields this form actually shows, no network needed
    const local = localPlan(fields, MAP);
    let filled = 0, softN = 0, asked = 0;
    for (const step of local) {
      if (await applyOne(step.f, step.val, step.soft)) {
        filled++; if (step.soft) softN++;
        console.log("[SpaceA autofill]", step.f.label || step.f.name, "→", step.why, mask(step.val));
      }
    }

    // 2 · anything left (identity fields on longer forms) → Claude maps labels only; values never leave the page
    const rest = fields.filter(f => !local.some(s => s.f === f));
    if (rest.length) {
      note("Filled " + filled + " trip fields — asking Claude to map " + rest.length + " more (labels only)…");
      const resp = await chrome.runtime.sendMessage({
        type: "MAP_FIELDS",
        fields: rest.map(({ el, ...f }) => f),
        vaultKeys: Object.keys(MAP)
      }).catch(() => null);
      if (resp && !resp.error) {
        for (const step of resp.plan || []) {
          const f = rest[step.index]; if (!f || !(step.vaultField in MAP)) continue;
          const val = MAP[step.vaultField]; if (val == null || val === "") continue;
          if (step.confidence < 0.7) { // PAUSE-AND-ASK on anything Claude isn't sure about
            asked++;
            const ok = window.confirm(`Not sure about this one:\n\n"${f.label || f.name || "unlabeled field"}"\n→ fill with ${step.vaultField} (${mask(val)})?\n\nOK = fill · Cancel = skip`);
            if (!ok) continue;
          }
          if (await applyOne(f, val, false)) {
            filled++;
            console.log("[SpaceA autofill]", f.label || f.name, "→", step.vaultField, mask(val));
          }
        }
      } else if (!local.length) {
        note("Mapping failed: " + ((resp && resp.error) || "no response") + " — trip fields were still filled locally.", "#7a2b2b");
      }
    }

    const more = REGS.length > 1 ? ` Then hit "Next base → ${REGS[(IDX + 1) % REGS.length].terminal}" for the next one (${IDX + 1} of ${REGS.length} done).` : "";
    note(`✅ Filled ${filled} field${filled === 1 ? "" : "s"}${softN ? ` — ${softN} amber one${softN === 1 ? "" : "s"} (Country/State guessed from the base's location) need your eyes` : ""}${asked ? ` (${asked} confirmed with you)` : ""}${r0 ? " for " + r0.terminal : ""}. REVIEW the highlighted fields, then click the site's Submit yourself.${more} Use the popup's "Capture confirmation" to save proof.`, "#14321f");
    verifyStuck(local);
  }

  // SPAs sometimes re-render moments after the fill and wipe the values (late hydration — the AMC
  // tool does this). Check the fill STUCK; if a filled field went blank or was replaced, clear the
  // one-shot gate and fill again — up to 3 tries, so a stubborn page still can't loop forever.
  let _verifyN = 0;
  function verifyStuck(local) {
    if (!local.length) return;
    setTimeout(() => {
      if (!VAULT) return;
      const wiped = local.some(s => !s.f.el.isConnected || !s.f.el.value);
      if (!wiped) { _verifyN = 0; return; }
      if (_verifyN >= 3) { note("⚠️ The page keeps wiping the fill — hit the ⚡ button after it settles.", "#7a2b2b"); _verifyN = 0; return; }
      _verifyN++;
      try { sessionStorage.removeItem("spaceaAuto:" + location.pathname + "|" + IDX); } catch (e) {}
      note("🤖 The page re-rendered and wiped the fill — filling again (" + _verifyN + "/3)…");
      run();
    }, 1600);
  }
})();


// ═══ Did that just confirm? ═══
// After a Submit the terminal posts a plain-language confirmation. Watch for the wording, then ask the
// service worker for a screenshot — once per page, so a re-render never spams the folder.
(function watchForConfirmation(){
  const WORDS = /(thank you for (?:your )?(?:sign[- ]?up|registering)|sign[- ]?up (?:is )?(?:complete|received|confirmed|successful)|successfully (?:registered|signed up|submitted)|your (?:request|registration) has been (?:received|submitted)|confirmation number)/i;
  let done = false;
  const look = () => {
    if (done) return;
    const t = (document.body && document.body.innerText) || "";
    if (!WORDS.test(t)) return;
    done = true;
    const m = t.match(/confirmation (?:number|#)[:\s]*([A-Z0-9-]{4,})/i);
    chrome.runtime.sendMessage({
      type: "CAPTURE_CONFIRM",
      url: location.href,
      term: (location.hostname.split(".")[0] || "signup"),
      note: m ? "Confirmation " + m[1] : "Confirmation page"
    });
  };
  look();
  new MutationObserver(look).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("beforeunload", () => { /* keep the observer's last read */ }, { once: true });
})();
