# Privacy Policy for Google Clean Search

**Last updated:** June 30, 2026

## Overview

Google Clean Search is a browser extension that protects your search privacy by filtering account-identifying cookies and headers from your Google requests. This privacy policy explains how the extension handles your data.

## Data Collection

**Google Clean Search does not collect, transmit, or store any personal data.** The extension operates entirely within your browser.

## What the Extension Does

- Removes account session cookies (SID, HSID, SSID, APISID, SAPISID, SIDCC, etc.) from outgoing requests to Google services
- Replaces your NID tracking cookie with a randomly generated anonymous value
- Optionally removes the X-Client-Data header from requests to Google
- Optionally modifies the User-Agent header on Google requests
- Counts the number of protected requests (stored locally on your device)

## Data Storage

The extension stores the following data locally on your device using Chrome's `chrome.storage.local` API:

- Your extension settings (toggles for each protection feature)
- A randomly generated fake NID cookie value
- A counter of protected requests
- Timestamp of the last NID rotation

This data never leaves your browser and is not accessible to any external server or third party.

## Network Requests

The extension does not make any network requests to external servers. It does not have a backend, analytics, or telemetry. All processing happens locally in your browser using Chrome's built-in `declarativeNetRequest` API.

## Third-Party Services

The extension does not integrate with any third-party services, APIs, or analytics platforms.

## Permissions

The extension requests only the minimum permissions necessary:

| Permission | Purpose |
|---|---|
| `declarativeNetRequest` | Modify outgoing request headers to remove tracking data |
| `declarativeNetRequestFeedback` | Count protected requests for the popup counter |
| `cookies` | Read and set the fake NID cookie |
| `storage` | Save settings locally |
| `alarms` | Schedule periodic NID cookie rotation |

Host permissions (`*.google.com`, `youtube.com`) are required to intercept and modify requests to these specific domains only.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/n3vzery/google-clean-search).
