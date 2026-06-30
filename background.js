'use strict';

const RULE_ID_REMOVE  = 1;
const RULE_ID_XCLIENT = 2;
const RULE_ID_MAPS    = 3;
const RULE_ID_YOUTUBE = 4;
const RULE_ID_NEWS    = 5;

const ALL_RULE_IDS  = [RULE_ID_REMOVE, RULE_ID_XCLIENT, RULE_ID_MAPS, RULE_ID_YOUTUBE, RULE_ID_NEWS];
const ALARM_NAME    = 'nid-rotation';
const COUNTER_ALARM = 'counter-update';
const ROTATION_DAYS = 3;

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  spoofNID: true,
  removeXClientData: true,
  spoofUserAgent: false,
  blockMaps: true,
  blockYouTube: false,
  blockNews: true,
};

let settings = { ...DEFAULT_SETTINGS };
let rebuildTimer = null;

// ── Init ──────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get([...Object.keys(DEFAULT_SETTINGS), 'fakeNID']);
  settings = { ...DEFAULT_SETTINGS, ...stored };
  await chrome.storage.local.set(settings);

  // Auto-generate a fake NID on first install if spoofing is enabled
  if (settings.spoofNID && !stored.fakeNID) {
    const nid = generateFakeNID();
    await chrome.storage.local.set({ fakeNID: nid });
    // FIX #4: use 'lax' instead of 'no_restriction' to prevent cross-site tracking
    chrome.cookies.set({
      url: 'https://www.google.com',
      name: 'NID',
      value: nid,
      domain: '.google.com',
      path: '/',
      secure: true,
      sameSite: 'lax',
      expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
    });
  }

  await applyRules();
  scheduleRotationAlarm();
  chrome.alarms.create(COUNTER_ALARM, { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  settings = { ...DEFAULT_SETTINGS, ...stored };
  await applyRules();
  scheduleRotationAlarm();
  chrome.alarms.create(COUNTER_ALARM, { periodInMinutes: 1 });
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
    scheduleRebuild();
    if ('spoofNID' in changes) {
      scheduleRotationAlarm();
    }
  }
});

// Listen for cookie changes on google.com / youtube.com to keep rules fresh
chrome.cookies.onChanged.addListener((changeInfo) => {
  const domain = changeInfo.cookie.domain;
  if (domain.endsWith('google.com') || domain.endsWith('youtube.com')) {
    scheduleRebuild();
  }
});

// Debounce helper to prevent rapid sequential rule rebuilds
function scheduleRebuild(delayMs = 200) {
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuildTimer = null;
    applyRules().catch((err) => console.error('Rebuild failed:', err));
  }, delayMs);
}

// ── NID auto-rotation alarm ───────────────────────────────────────────────────

function scheduleRotationAlarm() {
  if (settings.spoofNID) {
    chrome.alarms.get(ALARM_NAME, (existing) => {
      if (!existing) {
        chrome.alarms.create(ALARM_NAME, {
          delayInMinutes: ROTATION_DAYS * 24 * 60,
          periodInMinutes: ROTATION_DAYS * 24 * 60,
        });
      }
    });
  } else {
    chrome.alarms.clear(ALARM_NAME);
  }
}

// ── Request counter ───────────────────────────────────────────────────────────

async function updateCounter() {
  const stored = await chrome.storage.local.get(['lastCounterCheck', 'totalProtected']);
  const lastCheck = stored.lastCounterCheck || (Date.now() - 65 * 1000);
  const total = stored.totalProtected || 0;

  try {
    const result = await chrome.declarativeNetRequest.getMatchedRules({
      minTimeStamp: lastCheck,
    });
    // FIX #7: only count by ruleId, ignore tabId/timestamp metadata
    const newMatches = (result.rulesMatchedInfo || []).filter(m =>
      ALL_RULE_IDS.includes(m.rule.ruleId)
    ).length;
    await chrome.storage.local.set({
      totalProtected: total + newMatches,
      lastCounterCheck: Date.now(),
    });
  } catch (err) {
    console.error('[GCS] getMatchedRules failed:', err);
    await chrome.storage.local.set({ lastCounterCheck: Date.now() });
  }
}

// ── Alarm dispatcher ──────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    if (!settings.spoofNID) return;
    const nid = generateFakeNID();
    await chrome.storage.local.set({ fakeNID: nid, lastNIDRotation: Date.now() });
    // FIX #4: use 'lax' instead of 'no_restriction'
    chrome.cookies.set({
      url: 'https://www.google.com',
      name: 'NID',
      value: nid,
      domain: '.google.com',
      path: '/',
      secure: true,
      sameSite: 'lax',
      expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
    });
    await applyRules();
    console.log('[GCS] NID auto-rotated');
  }

  if (alarm.name === COUNTER_ALARM) {
    await updateCounter();
  }
});

// ── Rules ─────────────────────────────────────────────────────────────────────

// Build a clean Cookie header string for a given URL, stripping account tokens.
async function getCleanCookieHeader(queryUrl = 'https://www.google.com/search') {
  try {
    const cookies = await chrome.cookies.getAll({ url: queryUrl });
    const stored  = await chrome.storage.local.get(['spoofNID', 'fakeNID']);

    const cleanCookies = [];
    let hasNID = false;

    for (const cookie of cookies) {
      const name      = cookie.name;
      const nameUpper = name.toUpperCase();

      // Strip account/session tokens
      const isAccount =
        ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', 'SIDCC'].includes(nameUpper) ||
        nameUpper.includes('PSID') ||
        nameUpper.includes('PAPISID');

      if (isAccount) continue;

      let value = cookie.value;
      if (name === 'NID') {
        hasNID = true;
        if (stored.spoofNID !== false && stored.fakeNID) {
          value = stored.fakeNID;
        }
      }

      cleanCookies.push(`${name}=${value}`);
    }

    // Force fake NID on google.com domains if configured and missing
    if (!hasNID && queryUrl.includes('google.com') && stored.spoofNID !== false && stored.fakeNID) {
      cleanCookies.push(`NID=${stored.fakeNID}`);
    }

    return cleanCookies.join('; ');
  } catch (error) {
    console.error('Error constructing clean cookie header:', error);
    return '';
  }
}

// Helper: build a modifyHeaders rule
// FIX #1: use precise initiatorDomains + regexFilter instead of broad urlFilter strings
function makeHeaderRule(id, regexFilter, initiatorDomains, cookieValue, extraHeaders = []) {
  return {
    id,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        cookieValue
          ? { header: 'Cookie', operation: 'set', value: cookieValue }
          : { header: 'Cookie', operation: 'remove' },
        ...extraHeaders,
      ],
    },
    condition: {
      regexFilter,
      initiatorDomains,
      resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'],
    },
  };
}

async function applyRules() {
  const toRemove = [...ALL_RULE_IDS];
  const toAdd    = [];

  if (settings.enabled) {
    // FIX #6: randomise minor UA version tokens per session to avoid static-string fingerprint
    const uaHeader = settings.spoofUserAgent
      ? [{ header: 'User-Agent', operation: 'set',
           value: buildRandomUA() }]
      : [];

    // Fetch cookie headers for all enabled domains in parallel
    const [searchCookies, mapsCookies, youtubeCookies, newsCookies] = await Promise.all([
      getCleanCookieHeader('https://www.google.com/search'),
      settings.blockMaps    ? getCleanCookieHeader('https://maps.google.com/')  : Promise.resolve(null),
      settings.blockYouTube ? getCleanCookieHeader('https://www.youtube.com/') : Promise.resolve(null),
      settings.blockNews    ? getCleanCookieHeader('https://news.google.com/')  : Promise.resolve(null),
    ]);

    // FIX #1: scope each rule tightly with regexFilter + initiatorDomains
    // Rule 1: Google Search only (/search path on google.com)
    toAdd.push(makeHeaderRule(
      RULE_ID_REMOVE,
      'https://[^/]*\\.google\\.com/search',
      ['google.com'],
      searchCookies,
      uaHeader
    ));

    // Rule 2: Remove X-Client-Data from google.com requests
    if (settings.removeXClientData) {
      toAdd.push({
        id: RULE_ID_XCLIENT,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [{ header: 'X-Client-Data', operation: 'remove' }],
        },
        condition: {
          regexFilter: 'https://[^/]*\\.google\\.com/',
          initiatorDomains: ['google.com'],
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'],
        },
      });
    }

    // Rule 3: Google Maps
    if (settings.blockMaps && mapsCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_MAPS,
        'https://maps\\.google\\.com/',
        ['google.com'],
        mapsCookies,
        uaHeader
      ));
    }

    // Rule 4: YouTube
    if (settings.blockYouTube && youtubeCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_YOUTUBE,
        'https://[^/]*\\.youtube\\.com/',
        ['youtube.com'],
        youtubeCookies,
        uaHeader
      ));
    }

    // Rule 5: Google News
    if (settings.blockNews && newsCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_NEWS,
        'https://news\\.google\\.com/',
        ['google.com'],
        newsCookies,
        uaHeader
      ));
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: toRemove,
    addRules: toAdd,
  });
}

// ── Fake NID generation ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'generateFakeNID') {
    sendResponse({ nid: generateFakeNID() });
  }
  if (msg.type === 'getSettings') {
    chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), (data) => {
      sendResponse({ ...DEFAULT_SETTINGS, ...data });
    });
    return true;
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

// FIX #6: randomise minor Firefox version to avoid static UA fingerprint
function buildRandomUA() {
  const rv  = 115 + Math.floor(Math.random() * 20);   // e.g. 115..134
  const ver = rv + '.0';
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${ver}) Gecko/20100101 Firefox/${ver}`;
}
