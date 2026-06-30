# Google Clean Search

> Search Google privately while staying signed in — no sign-out required.

[![Version](https://img.shields.io/badge/version-3.4-blue?style=flat-square)](https://github.com/n3vzery/google-clean-search)
[![Manifest](https://img.shields.io/badge/Manifest-v3-green?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/license-GPL%20v3-orange?style=flat-square)](LICENSE)

Google attaches your account session cookies to every search request, linking your queries to your Google account. **Google Clean Search** strips those cookies at the network level before they leave your browser — so Google sees you as an anonymous user while you stay logged into Gmail, YouTube and everything else normally.

---

## Features

| Feature | Description |
|---|---|
| **Cookie filtering** | Strips account cookies (`SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `SIDCC`, `PSID`, `PAPISID`) from every request while keeping harmless technical cookies so Google doesn't trigger captchas |
| **NID spoofing** | Replaces your real NID tracker with a random anonymous value. Auto-rotates every 3 days |
| **User-Agent spoofing** | Optional: identify as Firefox to reduce Chrome-specific browser fingerprinting |
| **X-Client-Data removal** | Strips the header that leaks your Chrome account flags |
| **Multi-service protection** | Independently toggle filtering for Search, Maps, News, and YouTube |
| **Request counter** | Tracks how many requests have been anonymized since install |

---

## Protected Services

Protection can be enabled or disabled per service independently:

- **Google Search** — always on when extension is enabled
- **Google Maps** — on by default
- **Google News** — on by default
- **YouTube** — off by default (may affect recommendations)

---

## How It Works

The extension uses Chrome's **declarativeNetRequest** API to intercept outgoing requests before they leave the browser. No external servers, no proxies — everything happens locally.

1. **Cookie header rewriting** — account session cookies are removed from the `Cookie` header. Technical cookies like `AEC` and `SOCS` are kept so Google doesn't show captchas.
2. **NID spoofing** — your real NID cookie is replaced with a randomly generated one. NID is not cryptographically signed, so Google accepts any value. The fake NID auto-rotates every 3 days via Chrome alarms.
3. **Header removal** — `X-Client-Data` header (which carries account flags) is stripped entirely.
4. **User-Agent spoofing** — optionally rewrites the UA string to a Firefox fingerprint, reducing browser-level profiling.

---

## Installation

> The extension is not yet published to the Chrome Web Store. Install it manually via developer mode.

1. Download or clone this repository:
   ```
   git clone https://github.com/n3vzery/google-clean-search.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `google-clean-search` folder

The extension icon will appear in your toolbar. Click it to manage settings.

---

## Permissions

| Permission | Why it's needed |
|---|---|
| `declarativeNetRequest` | Intercept and rewrite outgoing requests |
| `declarativeNetRequestFeedback` | Read match counts for the request counter |
| `cookies` | Read and set the fake NID cookie |
| `storage` | Save settings and NID between sessions |
| `alarms` | Schedule automatic NID rotation every 3 days |

---

## License

GPL v3 — see [LICENSE](LICENSE) for details.
