// ═══ WHEN each board actually drops — so we check when it matters, not on a blind timer ═══
// Sourced Jul 2026:
//   • 30-day Patriot Express slides: AMC allows posting NO EARLIER than 7 days before the following
//     month, and terminals in practice post from ~a week before the month to a few days after it starts.
//     → the release window is day 24 of the previous month through day 4 of the month. Poll hard in it.
//   • The 30-day slide carries DATE + DESTINATION only — no roll call, no seat counts. Never imply seats.
//   • Seats exist only inside 72 hours of the flight. → the 72-hr board is the only seat source, and it
//     is worth polling hard only when a watched departure is inside that window.
//   • AMC's own file URLs keep a CONSTANT name and change a ?ver= hash on repost
//     (…/30 DAY PE SCHEDULE.pdf?ver=ZXH6kNr3…), so the ver token is the true "reposted" signal.
const CADENCE = {
  // day-of-month window when the next month's PE slides appear
  peWindow: { fromDay: 24, toDay: 4 },
  // minutes between checks
  every: {
    peHot:    120,   // inside the release window
    peCalm:   720,   // outside it — slides do get re-cut mid-month
    board:    360,   // the rolling 72-hr posting, normal days
    boardHot:  45,   // a watched departure is inside 72 h — seats appear and vanish fast
    rollCall:  20    // last 12 h before a roll call we know about
  }
};

// Is today inside the monthly slide-drop window?
function inPeWindow(d){
  const day = (d || new Date()).getDate();
  return day >= CADENCE.peWindow.fromDay || day <= CADENCE.peWindow.toDay;
}
// How urgent is this terminal right now? Returns the minutes between checks it has earned.
function dueEvery(t, ctx){
  const dep = ctx && ctx.departMs ? ctx.departMs : 0;
  const h = dep ? (dep - Date.now()) / 36e5 : Infinity;
  if (ctx && ctx.watched) {
    if (h <= 12 && h > -6)  return CADENCE.every.rollCall;
    if (h <= 72 && h > -6)  return CADENCE.every.boardHot;
  }
  return Math.min(inPeWindow() ? CADENCE.every.peHot : CADENCE.every.peCalm, CADENCE.every.board);
}
if (typeof self !== "undefined") { self.CADENCE = CADENCE; self.inPeWindow = inPeWindow; self.dueEvery = dueEvery; }
