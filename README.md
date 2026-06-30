# Google Clean Search

Search Google privately while staying signed in.

## Features
- Remove account cookies from search requests
- Spoof NID tracker (rotates every 3 days)
- Optional Firefox User‑Agent
- Strip `X‑Client‑Data` header
- SafeSearch bypass (toggle in popup)
- Badge indicator shows protection state (green/red)

## Protected services (default on/off)
- Search – **on**
- Maps – **on**
- News – **on**
- YouTube – **off**
- Images – **off**
- Scholar – **off**
- Shopping – **off**
- Chrome Web Store – **on**

## Install
1. Clone repo
   `git clone https://github.com/n3vzery/google-clean-search.git`
2. Open `chrome://extensions/`
3. Enable **Developer mode** → **Load unpacked** → select `google-clean-search`
4. Click the toolbar icon to toggle protection.

## Build .crx (for ungoogled‑chromium)
Run `./build.ps1` – it creates `build/google-clean-search-v4.1.crx` and `.zip`.

## License
GPL‑v3 – see [LICENSE](LICENSE).
