'use strict';

const RULE_ID_REMOVE     = 1;
const RULE_ID_XCLIENT    = 2;
const RULE_ID_MAPS       = 3;
const RULE_ID_YOUTUBE    = 4;
const RULE_ID_NEWS       = 5;
const RULE_ID_IMAGES     = 6;
const RULE_ID_SCHOLAR    = 7;
const RULE_ID_SHOPPING   = 8;
const RULE_ID_WEBSTORE   = 9;
const RULE_ID_SAFESEARCH = 10;

const ALL_RULE_IDS  = [
  RULE_ID_REMOVE, RULE_ID_XCLIENT, RULE_ID_MAPS, RULE_ID_YOUTUBE,
  RULE_ID_NEWS, RULE_ID_IMAGES, RULE_ID_SCHOLAR, RULE_ID_SHOPPING,
  RULE_ID_WEBSTORE, RULE_ID_SAFESEARCH,
];
const ALARM_NAME    = 'nid-rotation';
const COUNTER_ALARM = 'counter-update';
const ROTATION_DAYS = 3;

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  spoofNID: true,
  removeXClientData: true,
  spoofUserAgent: false,
  bypassSafeSearch: false, // opt-in only — user must enable explicitly
  blockMaps: true,
  blockYouTube: false,
  blockNews: true,
  blockImages: true,
  blockScholar: true,
  blockShopping: true,
  blockWebStore: true,
};

let settings = { ...DEFAULT_SETTINGS };
let rebuildTimer = null;

// ── Cookie sanitization ───────────────────────────────────────────────────────
// RFC 6265 cookie-octet: printable ASCII excluding whitespace, comma, semicolon, backslash
// Also explicitly block CR/LF/NUL to prevent header injection
const COOKIE_PART_RE = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/;

function isSafeCookiePart(str) {
  return typeof str === 'string' &&
         str.length > 0 &&
         !/[\r\n\0]/.test(str) &&
         COOKIE_PART_RE.test(str);
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function updateBadge() {
  const on = settings.enabled;
  chrome.action.setBadgeText({ text: on ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: on ? '#34a853' : '#ea4335' });
  chrome.action.setBadgeTextColor({ color: '#ffffff' });
}

// ── Init ──────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get([...Object.keys(DEFAULT_SETTINGS), 'fakeNID']);
  settings = { ...DEFAULT_SETTINGS, ...stored };
  await chrome.storage.local.set(settings);

  // Auto-generate a fake NID on first install if spoofing is enabled
  if (settings.spoofNID && !stored.fakeNID) {
    const nid = generateFakeNID();
    await chrome.storage.local.set({ fakeNID: nid });
    setNIDCookie(nid);
  }

  await applyRules();
  updateBadge();
  scheduleRotationAlarm();
  chrome.alarms.create(COUNTER_ALARM, { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  settings = { ...DEFAULT_SETTINGS, ...stored };
  await applyRules();
  updateBadge();
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
    updateBadge();
    scheduleRebuild();
    if ('spoofNID' in changes) {
      scheduleRotationAlarm();
    }
  }
});

// Flag to suppress cookie change events we triggered ourselves (NID rotation)
let suppressNIDCookieEvent = false;

// Centralised NID setter — all cookie.set calls go through here so we can
// suppress the resulting onChanged event and avoid an infinite rebuild loop.
function setNIDCookie(nid) {
  suppressNIDCookieEvent = true;
  chrome.cookies.set({
    url: 'https://www.google.com',
    name: 'NID',
    value: nid,
    domain: '.google.com',
    path: '/',
    secure: true,
    sameSite: 'lax',
    expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
  }, () => {
    // Chrome may not fire onChanged synchronously; reset after a short delay
    setTimeout(() => { suppressNIDCookieEvent = false; }, 500);
  });
}

// Listen for cookie changes on google.com / youtube.com to keep rules fresh
chrome.cookies.onChanged.addListener((changeInfo) => {
  // Ignore changes we caused ourselves (NID rotation / regen)
  if (suppressNIDCookieEvent && changeInfo.cookie.name === 'NID') {
    return;
  }
  const domain = changeInfo.cookie.domain;
  if (domain.endsWith('.google.com') || domain === 'google.com' ||
      domain.endsWith('.youtube.com') || domain === 'youtube.com') {
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
    setNIDCookie(nid); // uses centralised setter — suppresses self-triggered rebuild
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

      // Sanitize per RFC 6265: skip malformed name or value to prevent header injection
      if (!isSafeCookiePart(name) || !isSafeCookiePart(value)) {
        console.warn('[GCS] Skipping malformed cookie:', name);
        continue;
      }

      cleanCookies.push(`${name}=${value}`);
    }

    // Force fake NID on google.com domains if configured and missing
    if (!hasNID && queryUrl.includes('google.com') && stored.spoofNID !== false && stored.fakeNID) {
      // fakeNID is generated by generateFakeNID() which only uses safe chars — safe to push directly
      cleanCookies.push(`NID=${stored.fakeNID}`);
    }

    return cleanCookies.join('; ');
  } catch (error) {
    console.error('Error constructing clean cookie header:', error);
    return '';
  }
}

// Helper: build a modifyHeaders rule
// initiatorDomains: if empty, rule applies regardless of where request came from
function makeHeaderRule(id, regexFilter, cookieValue, extraHeaders = [], initiatorDomains = []) {
  const condition = {
    regexFilter,
    resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'],
  };
  if (initiatorDomains && initiatorDomains.length > 0) {
    condition.initiatorDomains = initiatorDomains;
  }
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
    condition,
  };
}

// Mutex with dirty flag: if settings change while a rebuild is in-flight,
// we schedule one more rebuild after it finishes so DNR always reflects
// the latest settings state (not the state at the start of the first call).
let applyRulesInFlight = null;
let rebuildRequestedAgain = false;

async function applyRules() {
  if (applyRulesInFlight) {
    rebuildRequestedAgain = true;  // mark that settings changed during the run
    return applyRulesInFlight;
  }
  applyRulesInFlight = doApplyRules().finally(() => {
    applyRulesInFlight = null;
    if (rebuildRequestedAgain) {
      rebuildRequestedAgain = false;
      applyRules(); // re-run with the latest settings
    }
  });
  return applyRulesInFlight;
}

async function doApplyRules() {
  const toRemove = [...ALL_RULE_IDS];
  const toAdd    = [];

  if (settings.enabled) {
    const uaHeader = settings.spoofUserAgent
      ? [{ header: 'User-Agent', operation: 'set', value: buildRandomUA() }]
      : [];

    // Fetch cookie headers for all enabled domains in parallel
    const [searchCookies, mapsCookies, youtubeCookies, newsCookies,
           imagesCookies, scholarCookies, shoppingCookies, webstoreCookies] = await Promise.all([
      getCleanCookieHeader('https://www.google.com/search'),
      settings.blockMaps     ? getCleanCookieHeader('https://maps.google.com/')     : Promise.resolve(null),
      settings.blockYouTube  ? getCleanCookieHeader('https://www.youtube.com/')      : Promise.resolve(null),
      settings.blockNews     ? getCleanCookieHeader('https://news.google.com/')      : Promise.resolve(null),
      settings.blockImages   ? getCleanCookieHeader('https://images.google.com/')    : Promise.resolve(null),
      settings.blockScholar  ? getCleanCookieHeader('https://scholar.google.com/')   : Promise.resolve(null),
      settings.blockShopping ? getCleanCookieHeader('https://shopping.google.com/')  : Promise.resolve(null),
      settings.blockWebStore ? getCleanCookieHeader('https://chromewebstore.google.com/') : Promise.resolve(null),
    ]);

    // Rule 1: Google Search (/search path on google.com)
    // No initiatorDomains: protects direct navigation AND navigation from other pages
    toAdd.push(makeHeaderRule(
      RULE_ID_REMOVE,
      'https://[^/]*\\.google\\.com/search',
      searchCookies,
      uaHeader
    ));

    // Rule 2: Remove X-Client-Data from google.com requests
    // Keeps initiatorDomains only for this rule because the regex is very broad (all of google.com)
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

    // Rule 3: Google Maps (no initiatorDomains: works on direct navigation too)
    if (settings.blockMaps && mapsCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_MAPS,
        'https://maps\\.google\\.com/',
        mapsCookies,
        uaHeader
      ));
    }

    // Rule 4: YouTube (no initiatorDomains)
    if (settings.blockYouTube && youtubeCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_YOUTUBE,
        'https://[^/]*\\.youtube\\.com/',
        youtubeCookies,
        uaHeader
      ));
    }

    // Rule 5: Google News (no initiatorDomains)
    if (settings.blockNews && newsCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_NEWS,
        'https://news\\.google\\.com/',
        newsCookies,
        uaHeader
      ));
    }

    // Rule 6: Google Images (no initiatorDomains)
    if (settings.blockImages && imagesCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_IMAGES,
        'https://images\\.google\\.com/',
        imagesCookies,
        uaHeader
      ));
    }

    // Rule 7: Google Scholar (no initiatorDomains)
    if (settings.blockScholar && scholarCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_SCHOLAR,
        'https://scholar\\.google\\.com/',
        scholarCookies,
        uaHeader
      ));
    }

    // Rule 8: Google Shopping (no initiatorDomains)
    if (settings.blockShopping && shoppingCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_SHOPPING,
        'https://shopping\\.google\\.com/',
        shoppingCookies,
        uaHeader
      ));
    }

    // Rule 9: Chrome Web Store (no initiatorDomains - fix for direct navigation)
    if (settings.blockWebStore && webstoreCookies !== null) {
      toAdd.push(makeHeaderRule(
        RULE_ID_WEBSTORE,
        'https://chromewebstore\\.google\\.com/',
        webstoreCookies,
        uaHeader
      ));
    }

    // Rule 10: SafeSearch Bypass
    // Adds safe=off to Google search requests.
    // Note: DNR redirect rules do not support lookahead regex, so we use a simpler filter
    // and rely on addOrReplaceParams which always overwrites the 'safe' value.
    // Works when account cookies are stripped (user appears anonymous).
    // Has no effect if SafeSearch is locked at network/DNS/Family Link level.
    if (settings.bypassSafeSearch) {
      toAdd.push({
        id: RULE_ID_SAFESEARCH,
        priority: 2,
        action: {
          type: 'redirect',
          redirect: {
            transform: {
              queryTransform: {
                addOrReplaceParams: [{ key: 'safe', value: 'off' }]
              }
            }
          }
        },
        condition: {
          // Match any google search/images/imgres page.
          // addOrReplaceParams is idempotent: if safe=off is already present, Chrome detects
          // the result URL equals the request URL and does NOT redirect (no infinite loop).
          // NOTE: `\\.` in a JS string produces `\.` = literal dot in RE2 regex.
          // `\\?` produces `\?` = literal question mark in RE2.
          regexFilter: '^https://[^/]*\\.google\\.[a-z]{2,}/(search|images|imgres)(\\?.*)?$',
          resourceTypes: ['main_frame']
        }
      });
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
  if (msg.type === 'setNIDCookie' && msg.nid) {
    // Called from popup's regenNID — use centralised setter so suppress flag is set
    setNIDCookie(msg.nid);
  }
  if (msg.type === 'getSettings') {
    chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), (data) => {
      sendResponse({ ...DEFAULT_SETTINGS, ...data });
    });
    return true;
  }
});

// Generates a plausible-looking NID value (same format as real NID)
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

// Randomise minor Firefox version to avoid static UA fingerprint
function buildRandomUA() {
  const rv  = 115 + Math.floor(Math.random() * 20);
  const ver = rv + '.0';
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${ver}) Gecko/20100101 Firefox/${ver}`;
}
