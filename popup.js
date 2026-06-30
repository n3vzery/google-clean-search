'use strict';

const $ = (id) => document.getElementById(id);

const togEnabled   = $('togEnabled');
const togXClient   = $('togXClient');
const togNID       = $('togNID');
const togUA        = $('togUA');
const togMaps      = $('togMaps');
const togYouTube   = $('togYouTube');
const togNews      = $('togNews');
const togImages    = $('togImages');
const togScholar   = $('togScholar');
const togShopping  = $('togShopping');
const togWebStore  = $('togWebStore');
const nidPreview   = $('nidPreview');
const btnRegen     = $('btnRegen');
const statusBar    = $('statusBar');
const statusDot    = $('statusDot');
const statusText   = $('statusText');
const nidBox       = $('nidBox');
const nidLabel     = $('nidSectionLabel');
const nidNextRotation = $('nidNextRotation');
const counterEl    = $('requestCounter');

// Load settings and update UI
function loadSettings() {
  chrome.storage.local.get(
    ['enabled', 'spoofNID', 'removeXClientData', 'fakeNID', 'spoofUserAgent',
     'blockMaps', 'blockYouTube', 'blockNews', 'blockImages', 'blockScholar',
     'blockShopping', 'blockWebStore', 'totalProtected'],
    (data) => {
      togEnabled.checked   = data.enabled !== false;
      togXClient.checked   = data.removeXClientData !== false;
      togNID.checked       = data.spoofNID !== false;
      togUA.checked        = data.spoofUserAgent === true;
      togMaps.checked      = data.blockMaps !== false;
      togYouTube.checked   = data.blockYouTube === true;
      togNews.checked      = data.blockNews !== false;
      togImages.checked    = data.blockImages !== false;
      togScholar.checked   = data.blockScholar !== false;
      togShopping.checked  = data.blockShopping !== false;
      togWebStore.checked  = data.blockWebStore !== false;
      nidPreview.textContent = data.fakeNID ? data.fakeNID.substring(0, 30) + '...' : 'not set';

      updateStatus();
      updateNIDVisibility();
      renderCookieList();
      updateNextRotation();
      updateCounter(data.totalProtected || 0);
    }
  );
}

function updateCounter(total) {
  if (!counterEl) return;
  counterEl.textContent = total.toLocaleString();
}

// Render the allowed cookies list on-the-fly
function renderCookieList() {
  chrome.storage.local.get(['enabled', 'spoofNID', 'fakeNID'], (data) => {
    const cookiesList = $('cookiesList');

    if (data.enabled === false) {
      cookiesList.replaceChildren();
      const msg = document.createElement('div');
      msg.style.cssText = 'color:rgba(255,255,255,0.25);font-style:italic;';
      msg.textContent   = 'Protection disabled (Raw cookies sent)';
      cookiesList.appendChild(msg);
      return;
    }

    chrome.cookies.getAll({ url: 'https://www.google.com/search' }, (cookies) => {
      const cleanCookies = [];
      let hasNID = false;

      for (const cookie of cookies) {
        const name      = cookie.name;
        const nameUpper = name.toUpperCase();

        const isAccount =
          ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', 'SIDCC'].includes(nameUpper) ||
          nameUpper.includes('PSID') ||
          nameUpper.includes('PAPISID');

        if (isAccount) continue;

        let value  = cookie.value;
        let isFake = false;

        if (name === 'NID') {
          hasNID = true;
          if (data.spoofNID !== false && data.fakeNID) {
            value  = data.fakeNID;
            isFake = true;
          }
        }

        cleanCookies.push({ name, value, isFake });
      }

      if (!hasNID && data.spoofNID !== false && data.fakeNID) {
        cleanCookies.push({ name: 'NID', value: data.fakeNID, isFake: true });
      }

      if (cleanCookies.length === 0) {
        cookiesList.replaceChildren();
        const msg = document.createElement('div');
        msg.style.cssText = 'color:rgba(255,255,255,0.25);font-style:italic;';
        msg.textContent   = 'None (Cookie header removed)';
        cookiesList.appendChild(msg);
        return;
      }

      cleanCookies.sort((a, b) => {
        if (a.name === 'NID') return -1;
        if (b.name === 'NID') return  1;
        return a.name.localeCompare(b.name);
      });

      cookiesList.replaceChildren();
      for (const c of cleanCookies) {
        const truncated = c.value.length > 22 ? c.value.substring(0, 22) + '...' : c.value;

        const item  = document.createElement('div');
        item.className = 'cookie-item';

        const nameEl = document.createElement('span');
        nameEl.className   = 'cookie-name';
        nameEl.textContent = c.name;

        const valEl  = document.createElement('span');
        valEl.className    = 'cookie-value';
        valEl.title        = c.value;
        valEl.textContent  = truncated;

        if (c.isFake) {
          const tag = document.createElement('span');
          tag.style.cssText  = 'color:#34a853;font-weight:bold;';
          tag.textContent    = ' [fake]';
          valEl.appendChild(tag);
        }

        item.appendChild(nameEl);
        item.appendChild(valEl);
        cookiesList.appendChild(item);
      }
    });
  });
}

// ── Toggle listeners ──────────────────────────────────────────────────────────

togEnabled.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: togEnabled.checked });
  updateStatus();
  renderCookieList();
});

togXClient.addEventListener('change', () => {
  chrome.storage.local.set({ removeXClientData: togXClient.checked });
});

togNID.addEventListener('change', () => {
  chrome.storage.local.set({ spoofNID: togNID.checked });
  updateNIDVisibility();
  if (togNID.checked) {
    regenNID();
  } else {
    renderCookieList();
    updateNextRotation();
  }
});

togUA.addEventListener('change', () => {
  chrome.storage.local.set({ spoofUserAgent: togUA.checked });
});

togMaps.addEventListener('change', () => {
  chrome.storage.local.set({ blockMaps: togMaps.checked });
});

togYouTube.addEventListener('change', () => {
  chrome.storage.local.set({ blockYouTube: togYouTube.checked });
});

togNews.addEventListener('change', () => {
  chrome.storage.local.set({ blockNews: togNews.checked });
});

togImages.addEventListener('change', () => {
  chrome.storage.local.set({ blockImages: togImages.checked });
});

togScholar.addEventListener('change', () => {
  chrome.storage.local.set({ blockScholar: togScholar.checked });
});

togShopping.addEventListener('change', () => {
  chrome.storage.local.set({ blockShopping: togShopping.checked });
});

togWebStore.addEventListener('change', () => {
  chrome.storage.local.set({ blockWebStore: togWebStore.checked });
});

// ── NID management ────────────────────────────────────────────────────────────

btnRegen.addEventListener('click', regenNID);

function regenNID() {
  chrome.runtime.sendMessage({ type: 'generateFakeNID' }, (res) => {
    if (!res) return;
    chrome.storage.local.set({ fakeNID: res.nid, lastNIDRotation: Date.now() }, () => {
      nidPreview.textContent = res.nid.substring(0, 30) + '...';
      renderCookieList();
    });

    chrome.cookies.set({
      url: 'https://www.google.com',
      name: 'NID',
      value: res.nid,
      domain: '.google.com',
      path: '/',
      secure: true,
      sameSite: 'lax',
      expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
    });

    chrome.alarms.clear('nid-rotation', () => {
      chrome.alarms.create('nid-rotation', {
        delayInMinutes: 3 * 24 * 60,
        periodInMinutes: 3 * 24 * 60,
      });
      updateNextRotation();
    });
  });
}

function updateNextRotation() {
  if (!nidNextRotation) return;
  if (!togNID.checked) {
    nidNextRotation.textContent = 'disabled';
    nidNextRotation.style.color = 'rgba(255,255,255,0.25)';
    return;
  }
  chrome.alarms.get('nid-rotation', (alarm) => {
    if (!alarm) {
      nidNextRotation.textContent = 'not scheduled';
      nidNextRotation.style.color = 'rgba(255,255,255,0.25)';
      return;
    }
    const msLeft    = alarm.scheduledTime - Date.now();
    const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
    if (hoursLeft >= 48) {
      nidNextRotation.textContent = `in ${Math.ceil(hoursLeft / 24)}d`;
    } else if (hoursLeft >= 1) {
      nidNextRotation.textContent = `in ${hoursLeft}h`;
    } else {
      nidNextRotation.textContent = 'soon';
    }
    nidNextRotation.style.color = '#34a853';
  });
}

function updateStatus() {
  const on = togEnabled.checked;
  statusBar.className  = 'status-bar ' + (on ? 'on' : 'off');
  statusDot.className  = 'dot ' + (on ? 'on' : 'off');
  statusText.textContent = on ? 'Protection active' : 'Protection disabled';
}

function updateNIDVisibility() {
  const show = togNID.checked;
  nidBox.style.display   = show ? '' : 'none';
  nidLabel.style.display = show ? '' : 'none';
}

// Listen to storage changes to keep popup in sync
chrome.storage.onChanged.addListener((changes) => {
  if ('enabled'           in changes) togEnabled.checked   = changes.enabled.newValue !== false;
  if ('spoofNID'          in changes) togNID.checked       = changes.spoofNID.newValue !== false;
  if ('removeXClientData' in changes) togXClient.checked   = changes.removeXClientData.newValue !== false;
  if ('spoofUserAgent'    in changes) togUA.checked        = changes.spoofUserAgent.newValue === true;
  if ('blockMaps'         in changes) togMaps.checked      = changes.blockMaps.newValue !== false;
  if ('blockYouTube'      in changes) togYouTube.checked   = changes.blockYouTube.newValue === true;
  if ('blockNews'         in changes) togNews.checked      = changes.blockNews.newValue !== false;
  if ('blockImages'       in changes) togImages.checked    = changes.blockImages.newValue !== false;
  if ('blockScholar'      in changes) togScholar.checked   = changes.blockScholar.newValue !== false;
  if ('blockShopping'     in changes) togShopping.checked  = changes.blockShopping.newValue !== false;
  if ('blockWebStore'     in changes) togWebStore.checked  = changes.blockWebStore.newValue !== false;
  if ('fakeNID' in changes && changes.fakeNID.newValue) {
    nidPreview.textContent = changes.fakeNID.newValue.substring(0, 30) + '...';
  }
  if ('totalProtected' in changes) {
    updateCounter(changes.totalProtected.newValue || 0);
  }
  updateStatus();
  updateNIDVisibility();
  renderCookieList();
});

// Refresh on popup focus
window.addEventListener('focus', () => {
  renderCookieList();
  updateNextRotation();
  chrome.storage.local.get(['totalProtected'], (data) => {
    updateCounter(data.totalProtected || 0);
  });
});

// Initial load
loadSettings();
