'use strict';

// Safety no-op listener for action click
chrome.action.onClicked.addListener(() => {
  console.log('ColorGrab: Action clicked (popup is primary interface)');
});

// Initialize extension state on install
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ isActive: false });
  chrome.action.setBadgeText({ text: 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  
  // Inject into all existing tabs so it works immediately after install/reload
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && tab.url.startsWith('http')) {
      syncTabState(tab.id);
    }
  }
  console.log('ColorGrab: Installed and initialized across all tabs');
});

/**
 * Injects the content script and syncs the current active state
 * @param {number} tabId 
 */
async function syncTabState(tabId) {
  try {
    // 1. Inject the content script programmatically
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });

    // 2. Get current state from storage
    const { isActive } = await chrome.storage.local.get('isActive');

    // 3. Send state to the injected script
    await chrome.tabs.sendMessage(tabId, { 
      action: 'setActive', 
      isActive: isActive || false 
    });
  } catch (err) {
    // Fail silently for restricted pages (chrome://, etc.)
    console.log(`ColorGrab: Could not sync state for tab ${tabId}: ${err.message}`);
  }
}

// Sync state when user switches tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  syncTabState(activeInfo.tabId);
});

// Sync state when a page finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    syncTabState(tabId);
  }
});

// Handle state synchronization from content script (e.g., Esc key)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncState') {
    const isActive = request.isActive;
    
    // Update badge
    chrome.action.setBadgeText({ 
      text: isActive ? 'ON' : 'OFF' 
    });
    chrome.action.setBadgeBackgroundColor({ 
      color: isActive ? '#22c55e' : '#6b7280' 
    });
    
    console.log(`ColorGrab: State synced to ${isActive ? 'Active' : 'Inactive'}`);
  }
});