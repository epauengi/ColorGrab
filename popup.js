'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('inspector-toggle');
  const statusText = document.getElementById('status-text');
  const statusDesc = document.getElementById('status-description');
  const languageToggle = document.getElementById('language-toggle');
  const tipHover = document.getElementById('tip-hover');
  const tipCopy = document.getElementById('tip-copy');
  const tipEsc = document.getElementById('tip-esc');
  const footerText = document.getElementById('footer-text');

  const translations = {
    en: {
      htmlLang: 'en',
      languageButton: 'VI',
      languageAria: 'Switch extension language to Vietnamese',
      active: 'Inspector Active',
      inactive: 'Inspector Inactive',
      activeDesc: 'Hover any element to inspect its CSS',
      inactiveDesc: 'Click the toggle to start inspecting',
      tipHover: 'Hover any element to see CSS',
      tipCopy: 'Click element to copy all values',
      tipEsc: 'Press Esc to deactivate',
      footer: 'ColorGrab • CSS Inspector'
    },
    vi: {
      htmlLang: 'vi',
      languageButton: 'EN',
      languageAria: 'Chuyển ngôn ngữ tiện ích sang tiếng Anh',
      active: 'Trình kiểm tra đang bật',
      inactive: 'Trình kiểm tra đang tắt',
      activeDesc: 'Di chuột lên phần tử bất kỳ để xem CSS',
      inactiveDesc: 'Bật công tắc để bắt đầu kiểm tra',
      tipHover: 'Di chuột lên phần tử bất kỳ để xem CSS',
      tipCopy: 'Nhấp vào phần tử để sao chép toàn bộ giá trị',
      tipEsc: 'Nhấn Esc để tắt',
      footer: 'ColorGrab • Trình kiểm tra CSS'
    }
  };

  const stored = await chrome.storage.local.get(['isActive', 'language']);
  const isActive = stored.isActive || false;
  let currentLanguage = stored.language === 'vi' ? 'vi' : 'en';

  applyLanguage(currentLanguage);
  updateUI(isActive);

  languageToggle.addEventListener('click', async () => {
    currentLanguage = currentLanguage === 'en' ? 'vi' : 'en';
    await chrome.storage.local.set({ language: currentLanguage });
    applyLanguage(currentLanguage);
    await notifyActiveTabLanguage(currentLanguage);
  });

  toggle.addEventListener('change', async () => {
    const newState = toggle.checked;

    await chrome.storage.local.set({ isActive: newState });

    updateUI(newState);
    updateBadge(newState);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'setActive',
          isActive: newState
        });
        await chrome.tabs.sendMessage(tab.id, {
          action: 'setLanguage',
          language: currentLanguage
        });
      } catch (e) {
        console.log('Content script not yet injected or tab inaccessible');
      }
    }
  });

  function applyLanguage(language) {
    const text = translations[language] || translations.en;
    document.documentElement.lang = text.htmlLang;
    languageToggle.textContent = text.languageButton;
    languageToggle.setAttribute('aria-label', text.languageAria);
    tipHover.textContent = text.tipHover;
    tipCopy.textContent = text.tipCopy;
    tipEsc.textContent = text.tipEsc;
    footerText.textContent = text.footer;
    updateUI(toggle.checked);
  }

  function updateUI(active) {
    const text = translations[currentLanguage] || translations.en;
    toggle.checked = active;
    statusText.textContent = active ? text.active : text.inactive;
    statusDesc.textContent = active ? text.activeDesc : text.inactiveDesc;
  }

  function updateBadge(active) {
    chrome.action.setBadgeText({
      text: active ? 'ON' : 'OFF'
    });
    chrome.action.setBadgeBackgroundColor({
      color: active ? '#22c55e' : '#6b7280'
    });
  }

  async function notifyActiveTabLanguage(language) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'setLanguage',
        language
      });
    } catch (e) {
      console.log('Unable to sync language to current tab');
    }
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'syncState') {
      updateUI(request.isActive);
    }
  });
});
