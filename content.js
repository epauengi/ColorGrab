'use strict';

(function() {
  // Prevent multiple injections from creating multiple instances
  if (window.__COLORGRAB_INITIALIZED__) {
    return;
  }
  window.__COLORGRAB_INITIALIZED__ = true;

  let isActive = false;
  let currentTarget = null;
  let host = null;
  let shadow = null;
  let statusBadge = null; // New variable for the status badge
  let currentLanguage = 'en';

  const DESIGN = {
    bg: '#1a1f2e',
    bg2: '#242938',
    border: '#2d3548',
    accent1: '#22c55e',
    accent2: '#16a34a',
    grad: 'linear-gradient(135deg, #22c55e 0%, #6b7280 100%)',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textValue: '#e2e8f0',
    radius: '10px',
    shadow: '0 4px 6px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.5)',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  };

  const TOOLTIP_CSS = `
    :host { 
      all: initial; 
      /* These are now set directly on the host element for robustness */
      /* position: fixed; 
      z-index: 2147483647; 
      pointer-events: none; */
      opacity: 0;
      transition: opacity 0.15s ease-out;
    }
    #cg-tooltip { 
      width: 268px; 
      background: ${DESIGN.bg}; 
      border: 1px solid ${DESIGN.border}; 
      border-radius: ${DESIGN.radius}; 
      box-shadow: ${DESIGN.shadow}; 
      overflow: hidden; 
      font-family: ${DESIGN.font}; 
      animation: cg-in 150ms ease-out; 
    }
    #cg-header { 
      background: ${DESIGN.grad}; 
      padding: 8px 10px; 
      display: flex; 
      align-items: center; 
      gap: 6px; 
      pointer-events: auto; 
    }
    #cg-logo { font-size: 12px; font-weight: 700; color: #fff; flex: 1; }
    #cg-tag { 
      font-size: 10px; 
      font-family: monospace; 
      color: rgba(255,255,255,0.75); 
      max-width: 100px; 
      overflow: hidden; 
      text-overflow: ellipsis; 
      white-space: nowrap; 
    }
    #cg-eyedropper { 
      background: rgba(255,255,255,0.15); 
      border: 1px solid rgba(255,255,255,0.25); 
      border-radius: 5px; 
      padding: 3px 5px; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      transition: background 150ms ease; 
    }
    #cg-eyedropper:hover { background: rgba(255,255,255,0.28); }
    #cg-body { padding: 10px 12px; }
    .cg-section-label { 
      font-size: 9px; 
      text-transform: uppercase; 
      letter-spacing: 0.08em; 
      color: ${DESIGN.textMuted}; 
      margin-bottom: 6px; 
      font-weight: 600; 
    }
    .cg-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .cg-label { font-size: 11px; color: ${DESIGN.textMuted}; }
    .cg-value { 
      font-size: 11px; 
      color: ${DESIGN.textValue}; 
      font-weight: 500; 
      text-align: right; 
      max-width: 160px; 
      overflow: hidden; 
      text-overflow: ellipsis; 
      white-space: nowrap; 
    }
    .cg-color-row { 
      display: flex; 
      align-items: center; 
      gap: 6px; 
      padding: 3px 4px; 
      border-radius: 5px; 
      cursor: pointer; 
      pointer-events: auto; 
      transition: background 100ms ease; 
      margin-bottom: 3px; 
    }
    .cg-color-row:hover { background: rgba(34,197,94,0.1); }
    .cg-color-row.cg-copied { background: rgba(34,197,94,0.2); }
    .cg-swatch { 
      width: 14px; 
      height: 14px; 
      border-radius: 3px; 
      border: 1px solid rgba(255,255,255,0.15); 
      flex-shrink: 0; 
    }
    .cg-swatch-transparent { 
      background: repeating-conic-gradient(#888 0% 25%, #fff 0% 50%) 0 0 / 8px 8px; 
    }
    .cg-hex { font-size: 11px; color: ${DESIGN.textValue}; font-weight: 500; font-family: monospace; }
    .cg-rgb { font-size: 11px; color: ${DESIGN.textMuted}; }
    .cg-divider { height: 1px; background: ${DESIGN.border}; margin: 8px 0; }
    #cg-footer { font-size: 9px; color: #4b5563; text-align: center; padding: 5px 0 7px; }
    .cg-copied-flash { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 60px; 
      font-size: 14px; 
      font-weight: 600; 
      color: ${DESIGN.accent1}; 
    }
    .cg-no-colors { font-size: 11px; color: ${DESIGN.textMuted}; font-style: italic; }
    .cg-more { font-size: 10px; color: #6b7280; margin-top: 3px; text-align: center; }
    @keyframes cg-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { #cg-tooltip { animation: none; } }
  `;

  const EYEDROPPER_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 10-10"/><path d="M12 12l9-9"/><path d="m15 15 3-3"/></svg>`;

  const I18N = {
    en: {
      brand: '⬡ ColorGrab',
      colors: 'COLORS',
      typography: 'TYPOGRAPHY',
      layout: 'LAYOUT',
      family: 'Family',
      size: 'Size',
      weight: 'Weight',
      margin: 'Margin',
      padding: 'Padding',
      footer: 'Click element to copy all • Click color to copy hex',
      noColors: 'No colors found',
      more: '...and {count} more',
      eyedropperUnsupported: 'EyeDropper not supported',
      copied: '✓ Copied:',
      copiedFlash: '✓ Copied!',
      inspectorCopyTitle: '=== ColorGrab CSS Inspector ===',
      element: 'Element',
      colorsBlock: 'Colors',
      noColorsBlock: 'No colors found',
      typographyBlock: 'Typography',
      fontFamily: 'Font Family',
      fontSize: 'Font Size',
      fontWeight: 'Font Weight',
      layoutBlock: 'Layout',
      statusBadge: 'CG'
    },
    vi: {
      brand: '⬡ ColorGrab',
      colors: 'MÀU SẮC',
      typography: 'CHỮ',
      layout: 'BỐ CỤC',
      family: 'Phông',
      size: 'Kích thước',
      weight: 'Độ đậm',
      margin: 'Lề ngoài',
      padding: 'Lề trong',
      footer: 'Nhấp để sao chép toàn bộ • Nhấp màu để sao chép mã hex',
      noColors: 'Không tìm thấy màu',
      more: '...và thêm {count} màu',
      eyedropperUnsupported: 'Trình EyeDropper không được hỗ trợ',
      copied: '✓ Đã sao chép:',
      copiedFlash: '✓ Đã sao chép!',
      inspectorCopyTitle: '=== Trình kiểm tra CSS ColorGrab ===',
      element: 'Phần tử',
      colorsBlock: 'Màu sắc',
      noColorsBlock: 'Không tìm thấy màu',
      typographyBlock: 'Chữ',
      fontFamily: 'Phông chữ',
      fontSize: 'Cỡ chữ',
      fontWeight: 'Độ đậm',
      layoutBlock: 'Bố cục',
      statusBadge: 'CG'
    }
  };

  function t(key, vars) {
    const dict = I18N[currentLanguage] || I18N.en;
    let text = dict[key] || I18N.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        text = text.replace(`{${name}}`, String(vars[name]));
      });
    }
    return text;
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'none') return null;
    const match = rgb.match(/\d+/g);
    if (!match) return null;
    const [r, g, b] = match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0'));
    return `#${r}${g}${b}`.toUpperCase();
  }

  function isTransparent(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'none') return true;
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return false;
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
    return alpha === 0;
  }

  function scanColors(rootEl) {
    const colors = [];
    const seenHex = new Set();
    const elements = [rootEl, ...rootEl.querySelectorAll('*')];

    for (const el of elements) {
      const cs = window.getComputedStyle(el);
      const props = ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke'];
      
      for (const prop of props) {
        const val = cs.getPropertyValue(prop);
        if (!val || val === 'transparent' || val === 'none' || val === 'initial' || val === 'inherit' || val === 'unset') continue;
        if (isTransparent(val)) continue;

        const hex = rgbToHex(val);
        if (hex && !seenHex.has(hex)) {
          seenHex.add(hex);
          colors.push({ hex, rgb: val });
        }
      }
    }
    return colors;
  }

  function getSpacing(el, top, right, bottom, left) {
    const cs = window.getComputedStyle(el);
    const t = cs.getPropertyValue(top) || '0px';
    const r = cs.getPropertyValue(right) || '0px';
    const b = cs.getPropertyValue(bottom) || '0px';
    const l = cs.getPropertyValue(left) || '0px';
    if (t === r && r === b && b === l) return t;
    if (t === b && r === l) return `${t} ${r}`;
    return `${t} ${r} ${b} ${l}`;
  }

  function initTooltip() {
    if (host) return;
    host = document.createElement('div');
    host.id = 'colorgrab-tooltip-host';
    // Explicitly set host styles for robustness
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none'; // Default for host, overridden by children in shadow DOM
    host.style.top = '0';
    host.style.left = '0';
    host.style.opacity = '0'; // Initial state, will be set to 1 on mouseover
    host.style.transition = 'opacity 0.15s ease-out'; // Match :host transition
    
    (document.body || document.documentElement).appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    
    const styleTag = document.createElement('style');
    styleTag.textContent = TOOLTIP_CSS;
    shadow.appendChild(styleTag);

    const container = document.createElement('div');
    container.id = 'cg-tooltip';
    shadow.appendChild(container);
  }

  function updateTooltipContent(el) {
    if (!shadow || !host) return; // Ensure host is also present
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const colors = scanColors(el);
    
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
    const elementLabel = `${tag}${cls}${id}`;

    const fontFamily = cs.getPropertyValue('font-family').split(',')[0].replace(/['"]/g, '').trim();
    const truncatedFont = fontFamily.length > 24 ? fontFamily.slice(0, 24) + '…' : fontFamily;

    const colorRows = colors.slice(0, 12).map(c => `
      <div class="cg-color-row" data-hex="${c.hex}">
        <span class="cg-swatch" style="background:${c.rgb}"></span>
        <span class="cg-hex">${c.hex}</span>
        <span class="cg-rgb">| ${c.rgb}</span>
      </div>
    `).join('');

    const colorSection = colors.length === 0 
      ? `<div class="cg-no-colors">${t('noColors')}</div>` 
      : colorRows + (colors.length > 12 ? `<div class="cg-more">${t('more', { count: colors.length - 12 })}</div>` : '');

    const tooltip = shadow.querySelector('#cg-tooltip');
    if (!tooltip) return;

    tooltip.innerHTML = `
      <div id="cg-header">
        <span id="cg-logo">${t('brand')}</span>
        <span id="cg-tag">${elementLabel}</span>
        <button id="cg-eyedropper" aria-label="Pick color with eyedropper">${EYEDROPPER_SVG}</button>
      </div>
      <div id="cg-body">
        <div class="cg-section">
          <div class="cg-section-label">${t('colors')}</div>
          <div id="cg-colors-list">${colorSection}</div>
        </div>
        <div class="cg-divider"></div>
        <div class="cg-section">
          <div class="cg-section-label">${t('typography')}</div>
          <div class="cg-row"><span class="cg-label">${t('family')}</span><span class="cg-value">${truncatedFont}</span></div>
          <div class="cg-row"><span class="cg-label">${t('size')}</span><span class="cg-value">${cs.getPropertyValue('font-size')}</span></div>
          <div class="cg-row"><span class="cg-label">${t('weight')}</span><span class="cg-value">${cs.getPropertyValue('font-weight')}</span></div>
        </div>
        <div class="cg-divider"></div>
        <div class="cg-section">
          <div class="cg-section-label">${t('layout')}</div>
          <div class="cg-row"><span class="cg-label">${t('size')}</span><span class="cg-value">${Math.round(rect.width)}px × ${Math.round(rect.height)}px</span></div>
          <div class="cg-row"><span class="cg-label">${t('margin')}</span><span class="cg-value">${getSpacing(el, 'margin-top', 'margin-right', 'margin-bottom', 'margin-left')}</span></div>
          <div class="cg-row"><span class="cg-label">${t('padding')}</span><span class="cg-value">${getSpacing(el, 'padding-top', 'padding-right', 'padding-bottom', 'padding-left')}</span></div>
        </div>
      </div>
      <div id="cg-footer">${t('footer')}</div>
    `;

    shadow.querySelector('#cg-eyedropper').addEventListener('click', handleEyedropper);
    shadow.querySelectorAll('.cg-color-row').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const hex = row.getAttribute('data-hex');
        copyToClipboard(hex).then(() => {
          row.classList.add('cg-copied');
          setTimeout(() => row.classList.remove('cg-copied'), 1000);
        });
      });
    });
  }

  async function handleEyedropper() {
    if (!window.EyeDropper) {
      const header = shadow.querySelector('#cg-header');
      if (!header) return;
      const original = header.innerHTML;
      header.innerHTML = `<span style="color:white; font-size:11px">${t('eyedropperUnsupported')}</span>`;
      setTimeout(() => { 
        if (currentTarget) updateTooltipContent(currentTarget); 
      }, 2000);
      return;
    }

    const dropper = new EyeDropper();
    if (host) host.style.display = 'none';
    try {
      const result = await dropper.open();
      const hex = result.sRGBHex;
      const rgb = hexToRgb(hex);
      await copyToClipboard(hex);
      
      const header = shadow.querySelector('#cg-header');
      if (!header) return;
      const original = header.innerHTML;
      header.innerHTML = `<span style="color:white; font-size:11px">${t('copied')} ${hex} | ${rgb}</span>`;
      setTimeout(() => {
        if (currentTarget) updateTooltipContent(currentTarget);
      }, 2000);
    } catch (e) {
      // User cancelled
    } finally {
      if (host) host.style.display = '';
    }
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : '';
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  }

  const _onMouseover = (e) => {
    if (!isActive) return;
    if (host && (e.target === host || host.contains(e.target))) return;
    
    if (currentTarget) currentTarget.removeAttribute('data-colorgrab-highlight');
    
    currentTarget = e.target;
    currentTarget.setAttribute('data-colorgrab-highlight', '');
    
    initTooltip();
    updateTooltipContent(currentTarget);
    if (host) {
      host.style.opacity = '1';
      // host.style.transform = 'translateY(0)'; // Removed, handled by CSS transition on opacity
    }
  };

  const _onMousemove = (e) => {
    if (!isActive || !host || !shadow) return; // Ensure host and shadow are present
    let left = e.clientX + 16;
    let top = e.clientY + 12;
    const tooltip = shadow.querySelector('#cg-tooltip');
    if (!tooltip) return;

    if (left + 268 > window.innerWidth) left = e.clientX - 284;
    if (top + tooltip.offsetHeight > window.innerHeight) top = e.clientY - tooltip.offsetHeight - 12;

    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
  };

  const _onMouseout = (e) => {
    if (!isActive) return;
    if (e.relatedTarget && currentTarget && (e.relatedTarget === currentTarget || currentTarget.contains(e.relatedTarget))) return;
    if (e.relatedTarget && host && host.contains(e.relatedTarget)) return;

    if (currentTarget) currentTarget.removeAttribute('data-colorgrab-highlight');
    if (host) host.style.opacity = '0';
    currentTarget = null;
  };

  const _onClick = (e) => {
    if (!isActive || !currentTarget) return;
    e.preventDefault();
    e.stopPropagation();

    const cs = window.getComputedStyle(currentTarget);
    const rect = currentTarget.getBoundingClientRect();
    const colors = scanColors(currentTarget);
    
    const tag = currentTarget.tagName.toLowerCase();
    const id = currentTarget.id ? `#${currentTarget.id}` : '';
    const cls = currentTarget.className && typeof currentTarget.className === 'string' ? `.${currentTarget.className.trim().split(/\s+/).join('.')}` : '';
    
    const colorList = colors.map(c => `${c.hex} | ${c.rgb}`).join('\n');

    const copyText = `${t('inspectorCopyTitle')}
${t('element')}: ${tag}${cls}${id}

[${t('colorsBlock')}]
${colorList || t('noColorsBlock')}

[${t('typographyBlock')}]
${t('fontFamily')}: ${cs.getPropertyValue('font-family').split(',')[0]}
${t('fontSize')}: ${cs.getPropertyValue('font-size')}
${t('fontWeight')}: ${cs.getPropertyValue('font-weight')}

[${t('layoutBlock')}]
${t('size')}: ${Math.round(rect.width)}px × ${Math.round(rect.height)}px
${t('margin')}: ${getSpacing(currentTarget, 'margin-top', 'margin-right', 'margin-bottom', 'margin-left')}
${t('padding')}: ${getSpacing(currentTarget, 'padding-top', 'padding-right', 'padding-bottom', 'padding-left')}`;

    copyToClipboard(copyText).then(() => {
      const body = shadow.querySelector('#cg-body');
      if (!body) return;
      const original = body.innerHTML;
      body.innerHTML = `<div class="cg-copied-flash">${t('copiedFlash')}</div>`;
      setTimeout(() => { 
        if (shadow) {
          const currentBody = shadow.querySelector('#cg-body');
          if (currentBody) currentBody.innerHTML = original;
        }
      }, 1500);
    });
  };

  const _onKeydown = (e) => {
    if (e.key === 'Escape' && isActive) {
      deactivate();
      chrome.storage.local.set({ isActive: false });
      chrome.runtime.sendMessage({ action: 'syncState', isActive: false });
    }
  };

  function activate() {
    if (isActive) return;
    isActive = true;
    const style = document.createElement('style');
    style.id = 'colorgrab-highlight-style';
    style.textContent = `[data-colorgrab-highlight] { outline: 2px dashed ${DESIGN.accent1} !important; background-color: rgba(34, 197, 94, 0.08) !important; box-shadow: 0 0 0 2px ${DESIGN.accent1} !important; }`;
    (document.head || document.documentElement).appendChild(style);

    // Add status badge
    statusBadge = document.createElement('div');
    statusBadge.id = 'colorgrab-status-badge';
    statusBadge.textContent = t('statusBadge');
    statusBadge.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: ${DESIGN.accent1};
      color: white;
      font-family: sans-serif;
      font-size: 12px;
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
      z-index: 2147483647;
      pointer-events: none;
    `;
    document.body.appendChild(statusBadge);

    document.addEventListener('mouseover', _onMouseover, true);
    document.addEventListener('mousemove', _onMousemove, true);
    document.addEventListener('mouseout', _onMouseout, true);
    document.addEventListener('click', _onClick, true);
    document.addEventListener('keydown', _onKeydown);
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;
    document.removeEventListener('mouseover', _onMouseover, true);
    document.removeEventListener('mousemove', _onMousemove, true);
    document.removeEventListener('mouseout', _onMouseout, true);
    document.removeEventListener('click', _onClick, true);
    document.removeEventListener('keydown', _onKeydown);
    
    if (currentTarget) currentTarget.removeAttribute('data-colorgrab-highlight');
    const style = document.getElementById('colorgrab-highlight-style');
    if (style) style.remove();
    if (host) host.remove();
    host = null;
    shadow = null;
    currentTarget = null;

    // Remove status badge
    if (statusBadge) {
      statusBadge.remove();
      statusBadge = null;
    }
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'setActive') {
      if (request.isActive) activate();
      else deactivate();
    }

    if (request.action === 'setLanguage') {
      currentLanguage = request.language === 'vi' ? 'vi' : 'en';
      if (currentTarget && host && shadow) {
        updateTooltipContent(currentTarget);
      }
      if (statusBadge) {
        statusBadge.textContent = t('statusBadge');
      }
    }
  });

  // Initial state sync on content script load
  chrome.storage.local.get(['isActive', 'language'], (data) => {
    currentLanguage = data.language === 'vi' ? 'vi' : 'en';
    if (data.isActive) activate();
  });

})();