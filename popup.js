'use strict';

const $ = (id) => document.getElementById(id);

const togEnabled = $('togEnabled');
const togXClient = $('togXClient');
const togNID     = $('togNID');
const togUA      = $('togUA');
const nidPreview = $('nidPreview');
const btnRegen   = $('btnRegen');
const statusBar  = $('statusBar');
const statusDot  = $('statusDot');
const statusText = $('statusText');
const nidBox     = $('nidBox');
const nidLabel   = $('nidSectionLabel');

// Load settings and NID on open
chrome.storage.local.get(['enabled', 'spoofNID', 'removeXClientData', 'fakeNID', 'debug_sent_cookies', 'spoofUserAgent'], (data) => {
  togEnabled.checked = data.enabled !== false;
  togXClient.checked = data.removeXClientData !== false;
  togNID.checked     = data.spoofNID !== false;
  togUA.checked      = data.spoofUserAgent === true;
  nidPreview.textContent = data.fakeNID ? data.fakeNID.substring(0, 30) + '...' : 'not set';
  
  const cookiesList = $('cookiesList');
  if (data.debug_sent_cookies && data.debug_sent_cookies.length > 0) {
    cookiesList.textContent = data.debug_sent_cookies.join(', ');
  } else {
    cookiesList.textContent = 'None (Cookie header removed)';
  }
  
  updateStatus();
  updateNIDVisibility();
});

// Toggle listeners
togEnabled.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: togEnabled.checked });
  updateStatus();
});

togXClient.addEventListener('change', () => {
  chrome.storage.local.set({ removeXClientData: togXClient.checked });
});

togNID.addEventListener('change', () => {
  chrome.storage.local.set({ spoofNID: togNID.checked });
  updateNIDVisibility();
  if (togNID.checked) regenNID();
});

togUA.addEventListener('change', () => {
  chrome.storage.local.set({ spoofUserAgent: togUA.checked });
});

// Regenerate NID button
btnRegen.addEventListener('click', regenNID);

function regenNID() {
  chrome.runtime.sendMessage({ type: 'generateFakeNID' }, (res) => {
    if (!res) return;
    chrome.storage.local.set({ fakeNID: res.nid });
    nidPreview.textContent = res.nid.substring(0, 30) + '...';

    // Inject the fake NID into google.com cookie
    chrome.cookies.set({
      url: 'https://www.google.com',
      name: 'NID',
      value: res.nid,
      domain: '.google.com',
      path: '/',
      secure: true,
      sameSite: 'no_restriction',
      expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
    });
  });
}

function updateStatus() {
  const on = togEnabled.checked;
  statusBar.className = 'status-bar ' + (on ? 'on' : 'off');
  statusDot.className = 'dot ' + (on ? 'on' : 'off');
  statusText.textContent = on ? 'Protection active' : 'Protection disabled';
}

function updateNIDVisibility() {
  const show = togNID.checked;
  nidBox.style.display   = show ? '' : 'none';
  nidLabel.style.display = show ? '' : 'none';
}
