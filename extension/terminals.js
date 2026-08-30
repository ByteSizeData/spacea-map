// ═══ Every Space-A terminal and the page that publishes its boards ═══
// Sources: AMC's official Passenger Terminal Directory (amc.af.mil, checked Jul 2026) for the 37 that
// post there; the terminal's own active Facebook page where that IS the official channel (Iwakuni,
// Atsugi, North Island, Fort Worth, Selfridge); March ARB's own AFRC page. The remaining 12 publish no
// board anywhere public — the AMC directory is their only official index and phone/email is the real
// channel, so they are marked `board:false` and never produce a false "nothing posted" alert.
const TERMINALS = [
 {
  "k": "rota",
  "n": "NS Rota",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/EUCOM-Terminals/Navsta-Rota-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "ramstein",
  "n": "Ramstein AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/EUCOM-Terminals/Ramstein-AB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "aviano",
  "n": "Aviano AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/EUCOM-Terminals/Aviano-AB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "sig",
  "n": "NAS Sigonella",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/EUCOM-Terminals/Sigonella-NAS-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "souda",
  "n": "NSA Souda Bay",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/EUCOM-Terminals/NSA-Souda-Bay-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "yokota",
  "n": "Yokota AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Yokota-AB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "kadena",
  "n": "Kadena AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Kadena-AB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "osan",
  "n": "Osan AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Osan-AB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "andersen",
  "n": "Andersen AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Andersen-AFB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "hickam",
  "n": "JB Pearl Harbor-Hickam",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Joint-Base-Pearl-Harbor-Hickam-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "jber",
  "n": "JB Elmendorf-Richardson",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Joint-Base-Elmendorf-Richardson-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "eielson",
  "n": "Eielson AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Eielson-AFB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "singapore",
  "n": "Paya Lebar AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Paya-Lebar-AB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "travis",
  "n": "Travis AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Travis-AFB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "jblm",
  "n": "JB Lewis-McChord",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Joint-Base-Lewis-McChord-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "norfolk",
  "n": "NS Norfolk",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/NS-Norfolk-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "charleston",
  "n": "JB Charleston",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Joint-Base-Charleston-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "mcguire",
  "n": "JB McGuire-Dix-Lakehurst",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Joint-Base-MDL-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "bwi",
  "n": "BWI / Baltimore",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Baltimore-Washington-International-Airport-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "dover",
  "n": "Dover AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Dover-AFB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "fairchild",
  "n": "Fairchild AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Fairchild-AFB-Air-Transportation-Function/",
  "mail": null,
  "note": null
 },
 {
  "k": "andrews",
  "n": "JB Andrews",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Joint-Base-Andrews-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "littlerock",
  "n": "Little Rock AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Little-Rock-AFB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "macdill",
  "n": "MacDill AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/MacDill-AFB-Air-Transportation-Function/",
  "mail": null,
  "note": null
 },
 {
  "k": "mcconnell",
  "n": "McConnell AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/McConnell-AFB-Air-Transportation-Function/",
  "mail": null,
  "note": null
 },
 {
  "k": "nasjax",
  "n": "NAS Jacksonville",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/NAS-Jacksonville-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "pope",
  "n": "Pope Field",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Pope-Army-Airfield-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "scott",
  "n": "Scott AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Scott-AFB-Air-Transportation-Function/",
  "mail": null,
  "note": null
 },
 {
  "k": "seatac",
  "n": "Seattle-Tacoma Intl",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CONUS-Terminals/Seattle-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "naples",
  "n": "NAS Naples",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/EUCOM-Terminals/NSA-Naples-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "spangdahlem",
  "n": "Spangdahlem AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/Eucom-Terminals/Spangdahlem-AB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "mildenhall",
  "n": "RAF Mildenhall",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/EUCOM-Terminals/RAF-Mildenhall-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "lajes",
  "n": "Lajes Field",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/EUCOM-Terminals/Lajes-Field-AB-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "bahrain",
  "n": "NSA Bahrain",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CENTCOM-Terminals/",
  "mail": null,
  "note": null
 },
 {
  "k": "misawa",
  "n": "Misawa AB",
  "page": "https://www.misawa.af.mil/About-Us/Misawa-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "offutt",
  "n": "Offutt AFB",
  "page": "https://www.offutt.af.mil/Units/55th-Wing/55th-Mission-Support-Group/Offutt-AFB-Air-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "westover",
  "n": "Westover ARB",
  "page": "https://www.westover.afrc.af.mil/About-Us/Resources/Space-A/",
  "mail": null,
  "note": null
 },
 {
  "k": "march",
  "n": "March ARB",
  "page": "https://www.march.afrc.af.mil/Units/Space-A-Passenger-Terminal/",
  "mail": "452LRS.PAX.TERMINAL@usaf.mil",
  "note": "24-hr flight line (951) 655-2913"
 },
 {
  "k": "iwakuni",
  "n": "MCAS Iwakuni",
  "page": "https://www.mcasiwakuni.marines.mil/Organizations/Station/AMC-Passenger-Terminal/",
  "mail": null,
  "note": null
 },
 {
  "k": "atsugi",
  "n": "NAF Atsugi",
  "page": "https://www.facebook.com/AtsugiTerminal",
  "mail": null,
  "note": null
 },
 {
  "k": "northisland",
  "n": "NAS North Island",
  "page": "https://www.facebook.com/pages/NASNI-Air-Terminal/198319997003818",
  "mail": null,
  "note": null
 },
 {
  "k": "fortworth",
  "n": "NAS Fort Worth JRB",
  "page": "https://www.facebook.com/NAS-Fort-Worth-JRB-Passenger-Terminal-421926808378430",
  "mail": null,
  "note": null
 },
 {
  "k": "selfridge",
  "n": "Selfridge ANGB",
  "page": "https://www.127wg.ang.af.mil/About-127th-Wing/Space-A-Flight-Information/",
  "mail": "usaf.mi.127-wg.mbx.space-a-travel@mail.mil",
  "note": null
 },
 {
  "k": "keywest",
  "n": "NAS Key West",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/",
  "mail": null,
  "note": "No board online — fax AMC Form 140 to (305) 293-4223, then phone"
 },
 {
  "k": "hill",
  "n": "Hill AFB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/",
  "mail": "Hill.Space.Available@us.af.mil",
  "note": null
 },
 {
  "k": "peterson",
  "n": "Peterson SFB",
  "page": "https://www.facebook.com/pages/Peterson-AFB-Passenger-Terminal/576051055838695",
  "mail": "21lrs.lrrt@us.af.mil",
  "note": "Facebook page — last post May 2024, call to confirm"
 },
 {
  "k": "muniz",
  "n": "Muñiz ANGB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/",
  "mail": "156AWSpaceA@ang.af.mil",
  "note": null
 },
 {
  "k": "kunsan",
  "n": "Kunsan AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/PACOM-Terminals/Osan-AB-Passenger-Terminal/",
  "mail": "Kunsan.SPACEA@us.af.mil",
  "note": "Posts no board of its own — 8 FSS directs travellers to Osan's"
 },
 {
  "k": "richmond",
  "n": "RAAF Richmond",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/",
  "mail": "735amsdet1.richmondausspaceasignup@us.af.mil",
  "note": null
 },
 {
  "k": "aludeid",
  "n": "Al Udeid AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CENTCOM-Terminals/8-EAMS-Terminal/",
  "mail": "8eams.paxsignup@auab.afcent.af.mil",
  "note": null
 },
 {
  "k": "sotocano",
  "n": "Soto Cano AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/",
  "mail": "spacea@jtfb.southcom.mil",
  "note": null
 },
 {
  "k": "nellis",
  "n": "Nellis AFB",
  "page": "https://www.nellis.af.mil/Resources/Recreation/Space-Available-Travel/",
  "mail": "space-a.signup@us.af.mil",
  "note": "24-hr flight recording (702) 652-6099"
 },
 {
  "k": "wrightpat",
  "n": "Wright-Patterson AFB",
  "page": "https://www.wpafb.af.mil/Welcome/Fact-Sheets/Display/Article/3836516/88-abw-space-available-travel/",
  "mail": "WPAFB_SPACEA@us.af.mil",
  "note": null
 },
 {
  "k": "birmingham",
  "n": "Birmingham ANGB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/",
  "mail": "usaf.al.117-arw.list.lg-space-a-list@mail.mil",
  "note": null
 },
 {
  "k": "alisalem",
  "n": "Ali Al Salem AB",
  "page": "https://www.amc.af.mil/AMC-Travel-Site/Terminals/CENTCOM-Terminals/",
  "mail": "5eams.kbrpaxapod@kcab.afcent.af.mil",
  "note": null
 }
];
// Verified Jul 2026: these 8 publish no board anywhere online. Al Udeid (AMC 8 EAMS page, posts a
// real 30-day PDF), Kunsan (Osan posts its board), Peterson (Facebook) and Ali Al Salem (CENTCOM
// index) DO have a readable page and were moved out of this set.
const BOARDLESS = new Set(["keywest","hill","muniz","richmond","sotocano","birmingham"]);
// Facebook-hosted boards. The service worker holds no facebook.com host permission, and Facebook
// serves a login wall to an unauthenticated fetch anyway — so these can never be scraped. They are
// marked manual so the watcher SKIPS them rather than reporting a false "nothing posted".
const MANUAL = new Set(["atsugi","northisland","fortworth","peterson"]);
TERMINALS.forEach(t => {
  t.board  = !BOARDLESS.has(t.k) && !MANUAL.has(t.k);
  t.manual = MANUAL.has(t.k);
  if (t.manual && !t.note) t.note = "Facebook board — check by hand, the watcher cannot read Facebook";
});
// ── Mirror sources ──────────────────────────────────────────────────────────
// Public aggregators republish AMC postings for terminals that publish nothing scrapeable
// themselves. Hard limit: a mirror can only carry what exists upstream, so for a terminal that
// posts no board anywhere this adds nothing — the phone stays the real channel.
// CONFIRMED: slugs actually observed resolving. UNCONFIRMED: pattern-derived; a 404 is logged
// as a mirror miss and never reported as "nothing posted".
const MIRROR_CONFIRMED = {
  northisland: "https://spacea.app/terminals/north-island",
  fortworth: "https://spacea.app/terminals/fort-worth"
};
const MIRROR_UNCONFIRMED = {
  keywest: "https://spacea.app/terminals/key-west",
  hill: "https://spacea.app/terminals/hill",
  muniz: "https://spacea.app/terminals/muniz",
  richmond: "https://spacea.app/terminals/richmond",
  sotocano: "https://spacea.app/terminals/soto-cano",
  birmingham: "https://spacea.app/terminals/birmingham",
  atsugi: "https://spacea.app/terminals/atsugi",
  peterson: "https://spacea.app/terminals/peterson"
};
const MIRROR = Object.assign({}, MIRROR_CONFIRMED, MIRROR_UNCONFIRMED);
TERMINALS.forEach(x => {
  if (!MIRROR[x.k]) return;
  x.alt = MIRROR[x.k];
  x.altUnverified = !MIRROR_CONFIRMED[x.k];
});
// Run __mirrorCheck() from the service worker console to promote/demote slugs after a sweep.
if (typeof self !== "undefined") {
  self.MIRROR = MIRROR;
  self.__mirrorCheck = async () => {
    const out = [];
    for (const [k, url] of Object.entries(MIRROR)) {
      try { const r = await fetch(url, { method: "GET", cache: "no-store" }); out.push({ k, url, status: r.status, ok: r.ok }); }
      catch (e) { out.push({ k, url, status: "fetch failed", ok: false }); }
    }
    console.table(out);
    return out;
  };
}
if (typeof self !== "undefined") self.TERMINALS = TERMINALS;
