'use strict';

// ── Install / Update ──────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First install: set defaults
    await chrome.storage.local.set({ isActive: false, language: 'en', copyFormat: 'hex' });
  }
  // Restore badge from storage (covers install + update + chrome_update)
  await restoreBadge();

  // Context menu (persists across SW restarts; recreate on install/update)
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'colorgrab-inspect',
      title: 'ColorGrab: Inspect this element',
      contexts: ['page', 'frame', 'image', 'link', 'editable', 'selection']
    });
  });
});

// ── Startup: restore badge ────────────────────────────────────────
chrome.runtime.onStartup.addListener(restoreBadge);

async function restoreBadge() {
  const { isActive } = await chrome.storage.local.get('isActive');
  const on = isActive || false;
  chrome.action.setBadgeText({ text: on ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: on ? '#22c55e' : '#6b7280' });
}

// ── Programmatic injection (replaces declarative content_scripts) ─
async function ensureContentScript(tabId) {
  try {
    // Check if already injected
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!window.__COLORGRAB_INITIALIZED__
    });
    if (result?.result) return true;

    // Inject
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    return true;
  } catch {
    // Restricted page (chrome://, chrome-extension://, etc.)
    return false;
  }
}

async function activateTab(tabId) {
  const { isActive, language, copyFormat } = await chrome.storage.local.get(['isActive', 'language', 'copyFormat']);
  if (!isActive) return;
  if (!(await ensureContentScript(tabId))) return;
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'setActive', isActive: true });
    await chrome.tabs.sendMessage(tabId, { action: 'setLanguage', language: language || 'en' });
    await chrome.tabs.sendMessage(tabId, { action: 'setCopyFormat', copyFormat: copyFormat || 'hex' });
  } catch { /* tab not ready */ }
}

// ── Toggle inspector ──────────────────────────────────────────────
async function toggleInspector(tab) {
  if (!tab?.id) return;
  const { isActive } = await chrome.storage.local.get('isActive');
  const newState = !isActive;
  await chrome.storage.local.set({ isActive: newState });

  // Badge
  chrome.action.setBadgeText({ text: newState ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: newState ? '#22c55e' : '#6b7280' });

  if (!(await ensureContentScript(tab.id))) return;

  const { language, copyFormat } = await chrome.storage.local.get(['language', 'copyFormat']);
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'setActive', isActive: newState });
    if (newState) {
      await chrome.tabs.sendMessage(tab.id, { action: 'setLanguage', language: language || 'en' });
      await chrome.tabs.sendMessage(tab.id, { action: 'setCopyFormat', copyFormat: copyFormat || 'hex' });
    }
  } catch { /* tab not ready */ }
}

// ── Keyboard shortcut ─────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-inspector') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) await toggleInspector(tab);
  }
});

// ── Context menu ──────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'colorgrab-inspect' && tab?.id) {
    // Force activate on this tab
    await chrome.storage.local.set({ isActive: true });
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

    if (!(await ensureContentScript(tab.id))) return;
    const { language, copyFormat } = await chrome.storage.local.get(['language', 'copyFormat']);
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'setActive', isActive: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'setLanguage', language: language || 'en' });
      await chrome.tabs.sendMessage(tab.id, { action: 'setCopyFormat', copyFormat: copyFormat || 'hex' });
    } catch { /* tab not ready */ }
  }
});

// ── Tab lifecycle: sync state on activate / navigate ──────────────
chrome.tabs.onActivated.addListener((activeInfo) => {
  activateTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    activateTab(tabId);
  }
});

// ── State sync from content script (Esc key, etc.) ────────────────
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'syncState') {
    const on = request.isActive;
    chrome.action.setBadgeText({ text: on ? 'ON' : 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: on ? '#22c55e' : '#6b7280' });
  }
  if (request.action === 'saveColor') {
    // Save to color history
    saveColorHistory(request.color);
  }
});

async function saveColorHistory(color) {
  if (!color) return;
  const { colorHistory = [] } = await chrome.storage.local.get('colorHistory');
  // Remove duplicate, prepend, cap at 50
  const filtered = colorHistory.filter(c => c.hex !== color.hex);
  filtered.unshift(color);
  if (filtered.length > 50) filtered.length = 50;
  await chrome.storage.local.set({ colorHistory: filtered });
}
