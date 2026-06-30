# Google Clean Search

> Search Google privately while staying signed in. No sign-out required.

[![Version](https://img.shields.io/badge/version-4.1-blue?style=flat-square)](https://github.com/n3vzery/google-clean-search)
[![Manifest](https://img.shields.io/badge/Manifest-v3-green?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/license-GPL%20v3-orange?style=flat-square)](LICENSE)

Google attaches your account session cookies to every request, linking your searches, maps lookups, shopping queries and more to your Google account. **Google Clean Search** strips those cookies at the network level before they leave your browser — so Google sees you as an anonymous user while you stay logged into Gmail, YouTube and everything else normally.

---

## Features

| Feature | Description |
|---|---|
| **Cookie filtering** | Strips account cookies (`SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `SIDCC`, `PSID`, `PAPISID`) from every request. Keeps harmless technical cookies so Google doesn't trigger captchas |
| **NID spoofing** | Replaces your real NID tracker with a random anonymous value. Auto-rotates every 3 days |
| **SafeSearch bypass** | Adds `safe=off` to search requests. Works because account cookies are stripped, so Google treats you as anonymous. Does not bypass network-level restrictions (DNS, Family Link) |
| **User-Agent spoofing** | Optional: identify as Firefox to reduce Chrome-specific browser fingerprinting |
| **X-Client-Data removal** | Strips the header that leaks your Chrome account flags |
| **Multi-service protection** | Independently toggle filtering per service |
| **Badge indicator** | Green **ON** / red **OFF** badge on the extension icon — see protection status at a glance |
| **Request counter** | Tracks how many requests have been anonymized since install |

---

## Protected Services

Each service can be enabled or disabled independently:

| Service | Domain | Default |
|---|---|---|
| Google Search | google.com/search | ✅ Always on |
| Google Maps | maps.google.com | ✅ On |
| Google News | news.google.com | ✅ On |
| Google Images | images.google.com | ✅ On |
| Google Scholar | scholar.google.com | ✅ On |
| Google Shopping | shopping.google.com | ✅ On |
| Chrome Web Store | chromewebstore.google.com | ✅ On |
| YouTube | youtube.com | ⬜ Off (may affect recommendations) |

> Protection applies regardless of how you navigate to these services — both direct URL entry and links from other pages are covered.

---

## How It Works

The extension uses Chrome's **declarativeNetRequest** API to intercept outgoing requests before they leave the browser. No external servers, no proxies — everything happens locally.

1. **Cookie header rewriting** — account session cookies are removed from the `Cookie` header. Technical cookies like `AEC` and `SOCS` are kept so Google doesn't show captchas.
2. **NID spoofing** — your real NID cookie is replaced with a randomly generated one. NID is not cryptographically signed, so Google accepts any value. The fake NID auto-rotates every 3 days.
3. **SafeSearch bypass** — a `redirect` DNR rule rewrites `?safe=` to `safe=off` on search requests. Since account cookies are stripped, Google has no account settings to enforce.
4. **Header removal** — `X-Client-Data` (which carries account flags) is stripped entirely.
5. **User-Agent spoofing** — optionally rewrites the UA string to a Firefox fingerprint.

---

## Installation

### Option A — Load unpacked (Chrome / Edge / Brave)

1. Download the latest ZIP from [Releases](https://github.com/n3vzery/google-clean-search/releases) and extract it, **or** clone the repo:
   ```
   git clone https://github.com/n3vzery/google-clean-search.git
   ```
2. Open `chrome://extensions/`
3. Enable **Developer mode** (toggle top-right)
4. Click **Load unpacked** → select the `google-clean-search` folder

### Option B — Install .crx (Ungoogled Chromium)

1. Download `google-clean-search-v4.1.crx` from [Releases](https://github.com/n3vzery/google-clean-search/releases)
2. Drag and drop the `.crx` file onto `chrome://extensions/`

---

## Building from source

A PowerShell build script is included:

```powershell
# Build both ZIP and CRX
.\build.ps1

# ZIP only
.\build.ps1 -ZipOnly

# CRX only
.\build.ps1 -CrxOnly
```

Output files are placed in the `build/` directory. The first CRX build generates a `google-clean-search.pem` signing key — keep it safe if you want to update the same CRX later.

---

## Permissions

| Permission | Why it's needed |
|---|---|
| `declarativeNetRequest` | Intercept and rewrite outgoing requests |
| `declarativeNetRequestFeedback` | Read match counts for the request counter |
| `cookies` | Read and set the fake NID cookie |
| `storage` | Save settings and NID between sessions |
| `alarms` | Schedule automatic NID rotation every 3 days |

Host permissions cover `*.google.com`, `*.youtube.com`, and `chromewebstore.google.com` — only the services listed above.

---

## Privacy

No data ever leaves your browser. The extension has no remote endpoints, no telemetry, and no analytics. See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

---

## License

GPL v3 — see [LICENSE](LICENSE) for details.
