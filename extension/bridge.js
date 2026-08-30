// Space-A bridge — runs on the planner website only. One job: relay "open this login
// in an incognito window" from the page to the service worker. Pages can't open
// incognito themselves; the extension can, once "Allow in Incognito" is flipped on.
(() => {
  if (window.__spaceaBridgeMounted) return; window.__spaceaBridgeMounted = true;
  window.addEventListener("message", ev => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || d.spaceaBridge !== "open-incognito" || !d.url) return;
    let u; try { u = new URL(d.url); } catch (e) { return; }
    if (u.protocol !== "https:") return;                 // .gov/.mil logins only — never http
    chrome.runtime.sendMessage({ type: "OPEN_INCOGNITO", url: u.href }, r => {
      const err = chrome.runtime.lastError;
      window.postMessage({ spaceaBridge: "ack",
        ok: !!(r && r.ok), mode: (r && r.mode) || (err ? "error" : "unknown") }, "*");
    });
  });
})();
