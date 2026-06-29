'use strict';

const RULE_ID_REMOVE  = 1;
const RULE_ID_XCLIENT = 2;

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  spoofNID: true,
  removeXClientData: true,
  spoofUserAgent: false,
};

let settings = { ...DEFAULT_SETTINGS };

// Init

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  settings = { ...DEFAULT_SETTINGS, ...stored };
  await chrome.storage.local.set(settings);
  await applyRules();
});

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  settings = { ...DEFAULT_SETTINGS, ...stored };
  await applyRules();
});

chrome.storage.onChanged.addListener(async (changes) => {
  let needsUpdate = false;
  for (const key of Object.keys(changes)) {
    if (key in DEFAULT_SETTINGS) {
      settings[key] = changes[key].newValue;
      needsUpdate = true;
    }
  }
  if (needsUpdate) {
    await applyRules();
  }
});

// Listen for cookie changes on google.com to keep our filtered header updated
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  if (changeInfo.cookie.domain.endsWith('google.com')) {
    await applyRules();
  }
});

// Rules

async function getCleanCookieHeader() {
  try {
    // Query all cookies that match google.com search URL
    const cookies = await chrome.cookies.getAll({ url: 'https://www.google.com/search' });
    const stored = await chrome.storage.local.get(['spoofNID', 'fakeNID']);
    
    const cleanCookies = [];
    let hasNID = false;
    const sentCookieNames = [];

    for (const cookie of cookies) {
      const name = cookie.name;
      const nameUpper = name.toUpperCase();

      // Filter out ONLY the account/session tokens specified:
      // SID, HSID, SSID, APISID, SAPISID, SIDCC, and any containing PSID or PAPISID.
      const isAccount = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', 'SIDCC'].includes(nameUpper) || 
                        nameUpper.includes('PSID') || 
                        nameUpper.includes('PAPISID');
      
      if (isAccount) {
        continue;
      }

      let value = cookie.value;
      if (name === 'NID') {
        hasNID = true;
        if (stored.spoofNID !== false && stored.fakeNID) {
          value = stored.fakeNID;
        }
      }

      cleanCookies.push(`${name}=${value}`);
      sentCookieNames.push(name);
    }

    // Force inclusion of the fake NID if configured and not present
    if (!hasNID && stored.spoofNID !== false && stored.fakeNID) {
      cleanCookies.push(`NID=${stored.fakeNID}`);
      sentCookieNames.push('NID (spoofed)');
    }

    // Save for debug/popup display
    await chrome.storage.local.set({ 
      debug_sent_cookies: sentCookieNames,
      debug_raw_count: cookies.length
    });

    return cleanCookies.join('; ');
  } catch (error) {
    console.error('Error constructing clean cookie header:', error);
    return '';
  }
}

async function applyRules() {
  const toRemove = [RULE_ID_REMOVE, RULE_ID_XCLIENT];
  const toAdd = [];

  if (settings.enabled) {
    const cleanCookieValue = await getCleanCookieHeader();

    const requestHeaders = [
      cleanCookieValue 
        ? { header: 'Cookie', operation: 'set', value: cleanCookieValue }
        : { header: 'Cookie', operation: 'remove' }
    ];

    if (settings.spoofUserAgent) {
      requestHeaders.push({
        header: 'User-Agent',
        operation: 'set',
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0'
      });
    }

    // Rule 1: modify Cookie & User-Agent headers for search requests
    toAdd.push({
      id: RULE_ID_REMOVE,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: requestHeaders,
      },
      condition: {
        urlFilter: 'google.com/search',
        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'],
      },
    });

    // Rule 2: remove X-Client-Data if enabled
    if (settings.removeXClientData) {
      toAdd.push({
        id: RULE_ID_XCLIENT,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            { header: 'X-Client-Data', operation: 'remove' },
          ],
        },
        condition: {
          urlFilter: 'google.com/',
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'],
        },
      });
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: toRemove,
    addRules: toAdd,
  });
}

// Fake NID generation
// Called from popup via chrome.runtime.sendMessage

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'generateFakeNID') {
    sendResponse({ nid: generateFakeNID() });
  }
  if (msg.type === 'getSettings') {
    chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), (data) => {
      sendResponse({ ...DEFAULT_SETTINGS, ...data });
    });
    return true; // async
  }
});

// Generates a plausible-looking NID value (same format as real NID)
// NID format: "<version>=<base64url-like string>"
function generateFakeNID() {
  const version = Math.floor(Math.random() * 100 + 500);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const len = 180 + Math.floor(Math.random() * 40);
  let str = '';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (const b of arr) str += chars[b % chars.length];
  return `${version}=${str}`;
}
