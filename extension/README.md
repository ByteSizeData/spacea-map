# Space-A One-Button Autofill (browser extension)

Fills the official AMC Space-A sign-up form from the app's encrypted traveler vault,
with Claude (`claude-opus-4-8`) mapping form fields → vault fields.
A same-origin web app cannot fill a cross-domain .gov form — this extension is the
supported path. The in-app **copy packet** remains the fallback when it isn't installed.

## Install (Chrome / Edge)
1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → pick this `extension/` folder.
2. On the extension's **Details** page, flip ON **Allow in Incognito** — this lets the app's
   **🔑 Log in first** button open DMDC in a fresh incognito window (clean cookies = no
   identity-proofing loop). Testing from a local `file://` page? Also flip **Allow access to file URLs**.
3. Click the extension icon → paste your **Anthropic API key** (stored locally, used only to map field labels).

## Quick flow (v1.3.1 hybrid agent — arm once per session)
1. Log into the AMC tool yourself (banner, MFA, CAPTCHA).
2. Popup → **🤖 Fill this form now** — this arms the session.
3. From then on the page handles itself: status pill bottom-left, cyan **⚡ Auto-fill** button bottom-right.
   Each new sign-up form auto-fills as you advance; **Next base →** cycles the packet. You always click Submit.

## Full flow (one packet covers every base — destination and return)
1. In the app's Sign-Up Center: **⬇ Download vault backup** (the sealed ciphertext file).
2. Open the AMC Travel Self-Signup Tool (https://gatesea.mtmc.gov/amctravel/). **You** handle login, the DoD banner, MFA, any CAPTCHA.
3. Extension popup → pick the backup file → passphrase → **Unlock & send vault to this tab** (memory only).
4. On the form, hit the floating **⚡ Auto-fill — <base> (1 of N)** button. Claude maps the visible fields
   (labels/names only — never your values), the content script fills locally, masks values in logs,
   and highlights everything it touched.
5. If unsure about a field, it **pauses and asks** ("fill with montana.deers (••••123)?").
6. **You review the highlighted fields and click the site's Submit.** The agent never submits.
6b. With several bases in the packet, hit **Next base → <base>** (above the ⚡ button), open a fresh
   sign-up form, and ⚡ again. The identity fields stay loaded; only the terminal and its up-to-5
   destinations change, so one packet walks the whole shortlist — the way out and the way home.
7. Popup → **📸 Capture confirmation screenshot** → drop the PNG into the app's Document vault.

## Packet shape
The app's **⚡ Fill in all sign-ups** copies one packet: the traveler identity fields plus
`registrations: [{ terminal, destinations[] }, …]` — one entry per base, out-bound bases first,
return bases after. Older single-base packets (`terminal` + `destinations`) still work.

## Guardrails
- Never touches credentials, MFA codes, or CAPTCHAs (password/OTP-like fields are skipped by filter).
- Never auto-submits — the Submit click is always yours.
- Vault plaintext exists only in tab memory; cleared on tab close or the popup's **Lock session**.
- Only field METADATA and vault field NAMES go to Claude; values never leave the page.
- Console logs mask all values (`••••123`).
