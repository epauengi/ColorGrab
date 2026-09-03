'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('inspector-toggle');
  const statusText = document.getElementById('status-text');
  const statusDesc = document.getElementById('status-description');
  const languageToggle = document.getElementById('language-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const formatSelect = document.getElementById('format-select');
  const formatLabel = document.getElementById('format-label');
  const historyTitle = document.getElementById('history-title');
  const historyGrid = document.getElementById('history-grid');
  const clearHistoryBtn = document.getElementById('clear-history');
  const tipHover = document.getElementById('tip-hover');
  const tipCopy = document.getElementById('tip-copy');
  const tipShortcut = document.getElementById('tip-shortcut');
  const footerText = document.getElementById('footer-text');

  const translations = {
    en: {
      htmlLang: 'en',
      languageButton: 'VI',
      languageAria: 'Switch language to Vietnamese',
      active: 'Inspector Active',
      inactive: 'Inspector Inactive',
      activeDesc: 'Hover any element • Alt+Shift+C',
      inactiveDesc: 'Click toggle or press Alt+Shift+C',
      formatLabel: 'Copy format',
      historyTitle: 'Color History',
      historyEmpty: 'No colors grabbed yet',
      clearHistory: 'Clear',
      tipHover: 'Hover any element to see CSS + WCAG contrast',
      tipCopy: 'Click element to copy CSS • Click swatch for color',
      tipShortcut: 'Alt+Shift+C toggle • Esc deactivate',
      footer: 'ColorGrab • CSS Inspector & Color Toolkit',
      copied: 'Copied!'
    },
    vi: {
      htmlLang: 'vi',
      languageButton: 'EN',
      languageAria: 'Chuyển ngôn ngữ sang tiếng Anh',
      active: 'Trình kiểm tra đang bật',
      inactive: 'Trình kiểm tra đang tắt',
      activeDesc: 'Di chuột lên phần tử • Alt+Shift+C',
      inactiveDesc: 'Bật công tắc hoặc nhấn Alt+Shift+C',
      formatLabel: 'Định dạng sao chép',
      historyTitle: 'Lịch sử màu',
      historyEmpty: 'Chưa có màu nào',
      clearHistory: 'Xoá',
      tipHover: 'Di chuột để xem CSS + độ tương phản WCAG',
      tipCopy: 'Nhấp phần tử sao chép CSS • Nhấp ô màu lấy mã',
      tipShortcut: 'Alt+Shift+C bật/tắt • Esc để tắt',
      footer: 'ColorGrab • Trình kiểm tra CSS & Bộ công cụ màu',
      copied: 'Đã sao chép!'
    }
  };

  // ── Load stored settings ─────────────────────────────────────────
  const stored = await chrome.storage.local.get([
    'isActive', 'language', 'theme', 'copyFormat', 'colorHistory'
  ]);
  const isActive = stored.isActive || false;
  let currentLanguage = stored.language === 'vi' ? 'vi' : 'en';
  let currentTheme = stored.theme || 'dark';
  let currentFormat = stored.copyFormat || 'hex';

  applyTheme(currentTheme);
  applyLanguage(currentLanguage);
  formatSelect.value = currentFormat;
  updateUI(isActive);
  renderHistory(stored.colorHistory || []);

  // ── Theme toggle ─────────────────────────────────────────────────
  themeToggle.addEventListener('click', async () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    await chrome.storage.local.set({ theme: currentTheme });
    applyTheme(currentTheme);
  });

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.textContent = '☀️';
      themeToggle.title = 'Switch to dark theme';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = '🌙';
      themeToggle.title = 'Switch to light theme';
    }
  }

  // ── Language toggle ──────────────────────────────────────────────
  languageToggle.addEventListener('click', async () => {
    currentLanguage = currentLanguage === 'en' ? 'vi' : 'en';
    await chrome.storage.local.set({ language: currentLanguage });
    applyLanguage(currentLanguage);
    await notifyTab({ action: 'setLanguage', language: currentLanguage });
  });

  function applyLanguage(lang) {
    const t = translations[lang] || translations.en;
    document.documentElement.lang = t.htmlLang;
    languageToggle.textContent = t.languageButton;
    languageToggle.setAttribute('aria-label', t.languageAria);
    formatLabel.textContent = t.formatLabel;
    historyTitle.textContent = t.historyTitle;
    clearHistoryBtn.textContent = t.clearHistory;
    tipHover.textContent = t.tipHover;
    tipCopy.textContent = t.tipCopy;
    tipShortcut.textContent = t.tipShortcut;
    footerText.textContent = t.footer;
    updateUI(toggle.checked);
  }

  // ── Copy format change ───────────────────────────────────────────
  formatSelect.addEventListener('change', async () => {
    currentFormat = formatSelect.value;
    await chrome.storage.local.set({ copyFormat: currentFormat });
    await notifyTab({ action: 'setCopyFormat', copyFormat: currentFormat });
  });

  // ── Inspector toggle ─────────────────────────────────────────────
  toggle.addEventListener('change', async () => {
    const newState = toggle.checked;
    await chrome.storage.local.set({ isActive: newState });
    updateUI(newState);
    updateBadge(newState);

    await notifyTab({ action: 'setActive', isActive: newState });
    if (newState) {
      await notifyTab({ action: 'setLanguage', language: currentLanguage });
      await notifyTab({ action: 'setCopyFormat', copyFormat: currentFormat });
    }
  });

  function updateUI(active) {
    const t = translations[currentLanguage] || translations.en;
    toggle.checked = active;
    statusText.textContent = active ? t.active : t.inactive;
    statusDesc.textContent = active ? t.activeDesc : t.inactiveDesc;
  }

  function updateBadge(active) {
    chrome.action.setBadgeText({ text: active ? 'ON' : 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: active ? '#22c55e' : '#6b7280' });
  }

  // ── Color History ────────────────────────────────────────────────
  function renderHistory(colors) {
    historyGrid.textContent = '';
    if (!colors || colors.length === 0) {
      const t = translations[currentLanguage] || translations.en;
      const empty = document.createElement('span');
      empty.id = 'history-empty';
      empty.className = 'history-empty';
      empty.textContent = t.historyEmpty;
      historyGrid.appendChild(empty);
      clearHistoryBtn.style.display = 'none';
      return;
    }

    clearHistoryBtn.style.display = '';
    colors.forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = 'history-swatch';
      swatch.tabIndex = 0;
      swatch.setAttribute('role', 'button');
      swatch.setAttribute('aria-label', `Color ${c.hex}`);
      swatch.style.background = c.hex;
      swatch.title = `${c.hex}\nClick to copy`;

      const copyHandler = async () => {
        const textToCopy = formatColorValue(c, currentFormat);
        await navigator.clipboard.writeText(textToCopy);
        swatch.title = '✓ Copied!';
        swatch.classList.add('copied');
        setTimeout(() => {
          swatch.title = `${c.hex}\nClick to copy`;
          swatch.classList.remove('copied');
        }, 800);
      };

      swatch.addEventListener('click', copyHandler);
      swatch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          copyHandler();
        }
      });
      historyGrid.appendChild(swatch);
    });
  }

  function formatColorValue(color, format) {
    if (format === 'rgb' && color.rgb) return color.rgb;
    return color.hex;
  }

  clearHistoryBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ colorHistory: [] });
    renderHistory([]);
  });

  // ── Tab messaging helper ─────────────────────────────────────────
  async function notifyTab(message) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || !tab.url.startsWith('http')) return;
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      // Content script may not be injected yet (e.g. tab was open before extension reload)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        // Retry message after injection
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (err) {
        console.log('Unable to inject content script:', err.message);
      }
    }
  }

  // ── Storage change listener (syncs history/state live) ───────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.colorHistory) {
      renderHistory(changes.colorHistory.newValue || []);
    }
    if (changes.isActive) {
      updateUI(changes.isActive.newValue);
    }
  });

  // ── Sync state from content script (Esc key) ─────────────────────
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'syncState') {
      updateUI(request.isActive);
    }
  });
});
