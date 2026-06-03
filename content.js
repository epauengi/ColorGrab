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
      position: fixed; 
      z-index: 2147483647; 
      pointer-events: none; 
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
    (document.head || document.documentElement).appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    
    const styleTag = document.createElement('style');
    styleTag.textContent = TOOLTIP_CSS;
    shadow.appendChild(styleTag);

    const container = document.createElement('div');
    container.id = 'cg-tooltip';
    shadow.appendChild(container);
  }

  function updateTooltipContent(el) {
    if (!shadow) return;
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
      ? `<div class="cg-no-colors">No colors found</div>` 
      : colorRows + (colors.length > 12 ? `<div class="cg-more">...and ${colors.length - 12} more</div>` : '');

    const tooltip = shadow.querySelector('#cg-tooltip');
    if (!tooltip) return;

    tooltip.innerHTML = `
      <div id="cg-header">
        <span id="cg-logo">⬡ ColorGrab</span>
        <span id="cg-tag">${elementLabel}</span>
        <button id="cg-eyedropper" aria-label="Pick color with eyedropper">${EYEDROPPER_SVG}</button>
      </div>
      <div id="cg-body">
        <div class="cg-section">
          <div class="cg-section-label">COLORS</div>
          <div id="cg-colors-list">${colorSection}</div>
        </div>
        <div class="cg-divider"></div>
        <div class="cg-section">
          <div class="cg-section-label">TYPOGRAPHY</div>
          <div class="cg-row"><span class="cg-label">Family</span><span class="cg-value">${truncatedFont}</span></div>
          <div class="cg-row"><span class="cg-label">Size</span><span class="cg-value">${cs.getPropertyValue('font-size')}</span></div>
          <div class="cg-row"><span class="cg-label">Weight</span><span class="cg-value">${cs.getPropertyValue('font-weight')}</span></div>
        </div>
        <div class="cg-divider"></div>
        <div class="cg-section">
          <div class="cg-section-label">LAYOUT</div>
          <div class="cg-row"><span class="cg-label">Size</span><span class="cg-value">${Math.round(rect.width)}px × ${Math.round(rect.height)}px</span></div>
          <div class="cg-row"><span class="cg-label">Margin</span><span class="cg-value">${getSpacing(el, 'margin-top', 'margin-right', 'margin-bottom', 'margin-left')}</span></div>
          <div class="cg-row"><span class="cg-label">Padding</span><span class="cg-value">${getSpacing(el, 'padding-top', 'padding-right', 'padding-bottom', 'padding-left')}</span></div>
        </div>
      </div>
      <div id="cg-footer">Click element to copy all • Click color to copy hex</div>
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
      const original = header.innerHTML;
      header.innerHTML = `<span style="color:white; font-size:11px">EyeDropper not supported</span>`;
      setTimeout(() => { 
        updateTooltipContent(currentTarget); 
      }, 2000);
      return;
    }

    const dropper = new EyeDropper();
    host.style.display = 'none';
    try {
      const result = await dropper.open();
      const hex = result.sRGBHex;
      const rgb = hexToRgb(hex);
      await copyToClipboard(hex);
      
      const header = shadow.querySelector('#cg-header');
      const original = header.innerHTML;
      header.innerHTML = `<span style="color:white; font-size:11px">✓ Copied: ${hex} | ${rgb}</span>`;
      setTimeout(() => {
        updateTooltipContent(currentTarget);
      }, 2000);
    } catch (e) {
      // User cancelled
    } finally {
      host.style.display = '';
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
    host.style.opacity = '1';
    host.style.transform = 'translateY(0)';
  };

  const _onMousemove = (e) => {
    if (!isActive || !host) return;
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

    const copyText = `=== ColorGrab CSS Inspector ===
Element: ${tag}${cls}${id}

[Colors]
${colorList || 'No colors found'}

[Typography]
Font Family: ${cs.getPropertyValue('font-family').split(',')[0]}
Font Size: ${cs.getPropertyValue('font-size')}
Font Weight: ${cs.getPropertyValue('font-weight')}

[Layout]
Size: ${Math.round(rect.width)}px × ${Math.round(rect.height)}px
Margin: ${getSpacing(currentTarget, 'margin-top', 'margin-right', 'margin-bottom', 'margin-left')}
Padding: ${getSpacing(currentTarget, 'padding-top', 'padding-right', 'padding-bottom', 'padding-left')}`;

    copyToClipboard(copyText).then(() => {
      const body = shadow.querySelector('#cg-body');
      if (!body) return;
      const original = body.innerHTML;
      body.innerHTML = `<div class="cg-copied-flash">✓ Copied!</div>`;
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
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'setActive') {
      if (request.isActive) activate();
      else deactivate();
    }
  });

  chrome.storage.local.get('isActive', (data) => {
    if (data.isActive) activate();
  });

})();