// Space-A bridge — runs on the planner website only. Relays two things from page → service worker:
// 1) "open this login in incognito"  2) "here's the traveler packet" (zero-touch handoff — the
// packet lands in extension session storage and every AMC tab arms itself; no clipboard, no popup).
(() => {
  if (window.__spaceaBridgeMounted) return; window.__spaceaBridgeMounted = true;
  window.addEventListener("message", ev => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || !d.spaceaBridge) return;
    if (d.spaceaBridge === "open-incognito" && d.url) {
      let u; try { u = new URL(d.url); } catch (e) { return; }
      if (u.protocol !== "https:") return;               // .gov/.mil logins only — never http
      chrome.runtime.sendMessage({ type: "OPEN_INCOGNITO", url: u.href }, r => {
        const err = chrome.runtime.lastError;
        window.postMessage({ spaceaBridge: "ack",
          ok: !!(r && r.ok), mode: (r && r.mode) || (err ? "error" : "unknown") }, "*");
      });
      return;
    }
    if (d.spaceaBridge === "packet-sync" && d.packet) {
      chrome.runtime.sendMessage({ type: "PACKET_SYNC", packet: d.packet }, r => {
        const err = chrome.runtime.lastError;
        window.postMessage({ spaceaBridge: "packet-ack", ok: !!(r && r.ok),
          regs: (r && r.regs) || 0, poked: (r && r.poked) || 0,
          error: (r && r.error) || (err ? String(err.message || err).slice(0, 80) : undefined) }, "*");
      });
    }
  });
})();
