# Google Clean Search

A lightweight Chrome extension that removes account-identifying session cookies and custom headers from Google Search requests. It protects your search privacy while keeping you logged into other Google services (Gmail, YouTube, etc.) on other tabs. Includes Firefox User-Agent and NID cookie spoofing to bypass bot-detection captchas.

## Features

- **Selective Cookie Filtering**: Strips tracking and account cookies (`SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `SIDCC`, `PSID`, `PAPISID`) from search queries, while keeping harmless technical cookies (`AEC`, `SOCS`, `__Secure-BUCKET`, `__Secure-ENID`) so Google doesn't trigger captchas.
- **NID Cookie Spoofing**: Automatically replaces the unique `NID` tracker cookie with a randomized anonymous value on every search request.
- **User-Agent Spoofing**: Optional feature to rewrite outgoing headers to identify as a Firefox browser, reducing Chrome-specific fingerprinting.
- **Minimalist Popup**: Easily toggle settings on/off and view a real-time list of allowed cookies being sent to Google.

## Installation

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the project folder containing the files.

## License

This project is licensed under the GNU GPL v3 License. See the [LICENSE](LICENSE) file for details.
