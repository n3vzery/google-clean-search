# Google Clean Search

Search Google privately while staying signed in. No logout required.

## Features
* Remove account cookies from search requests
* Spoof NID tracker (rotates every 3 days)
* Optional Firefox User Agent
* Strip `X Client Data` header
* SafeSearch bypass (toggle in popup)
* Badge indicator shows protection state (green/red)

## Install

### Chrome / Edge / Brave (Developer Mode)

1. Download the latest `.zip` from [Releases](https://github.com/n3vzery/google-clean-search/releases) and extract it,
   or clone the repo:
   ```
   git clone https://github.com/n3vzery/google-clean-search.git
   ```
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked** and select the `google-clean-search` folder.
5. The extension icon appears in your toolbar. Click it to open the popup and toggle protection on/off per service.

> After updating the source files, go to `chrome://extensions/` and click the refresh icon on the card to reload the extension.

### Ungoogled Chromium (.crx)

1. Download `google-clean-search-v4.1.crx` from [Releases](https://github.com/n3vzery/google-clean-search/releases).
2. Open `chrome://extensions/`.
3. Drag and drop the `.crx` file onto the extensions page.
4. Click **Add extension** when prompted.

> Regular Chrome and Edge will block `.crx` installs from outside the Web Store. Use the **Load unpacked** method above instead.

### Build from source

Requires PowerShell and either `chrome`/`chromium` on PATH for CRX signing.

```powershell
git clone https://github.com/n3vzery/google-clean-search.git
cd google-clean-search
.\build.ps1
```

Output files go into `build/`:
* `google-clean-search-v4.1.zip` for manual load unpacked
* `google-clean-search-v4.1.crx` for ungoogled chromium

The first run generates a `google-clean-search.pem` key used to sign the CRX.
Keep it if you want future updates to share the same extension ID.

## License
GPL v3, see [LICENSE](LICENSE).
