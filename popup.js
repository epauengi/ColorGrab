'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('inspector-toggle');
  const statusText = document.getElementById('status-text');
  const statusDesc = document.getElementById('status-description');

  // Load initial state
  const data = await chrome.storage.local.get('isActive');
  const isActive = data.isActive || false;
  
  updateUI(isActive);

  toggle.addEventListener('change', async () => {
    const newState = toggle.checked;
    
    // Persist state
    await chrome.storage.local.set({ isActive: newState });
    
    // Update UI
    updateUI(newState);
    updateBadge(newState);
    
    // Notify content script in active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'setActive', 
          isActive: newState 
        });
      } catch (e) {
        console.log('Content script not yet injected or tab inaccessible');
      }
    }
  });

  function updateUI(active) {
    toggle.checked = active;
    statusText.textContent = active ? 'Inspector Active' : 'Inspector Inactive';
    statusDesc.textContent = active 
      ? 'Hover any element to inspect its CSS' 
      : 'Click the toggle to start inspecting';
  }

  function updateBadge(active) {
    chrome.action.setBadgeText({ 
      text: active ? 'ON' : 'OFF' 
    });
    chrome.action.setBadgeBackgroundColor({ 
      color: active ? '#22c55e' : '#6b7280' 
    });
  }

  // Listen for state changes from content script (e.g., Esc key)
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'syncState') {
      updateUI(request.isActive);
    }
  });
});