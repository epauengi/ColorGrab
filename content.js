'use strict';

(function() {
  if (window.__COLORGRAB_INITIALIZED__) return;
  window.__COLORGRAB_INITIALIZED__ = true;

  let isActive = false;
  let isPinned = false;
  let currentTarget = null;
  let host = null;
  let shadow = null;
  let statusBadge = null;
  let currentLanguage = 'en';
  let copyFormat = 'hex';

  // ── Design tokens ────────────────────────────────────────────────
  const D = {
    bg: '#1a1f2e', bg2: '#242938', border: '#2d3548',
    accent: '#22c55e', accent2: '#16a34a',
    grad: 'linear-gradient(135deg, #22c55e 0%, #6b7280 100%)',
    text: '#f1f5f9', muted: '#94a3b8', value: '#e2e8f0',
    radius: '10px',
    shadow: '0 4px 6px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.5)',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  };

  // ── i18n ─────────────────────────────────────────────────────────
  const I18N = {
    en: {
      brand: '⬡ ColorGrab', colors: 'COLORS', typography: 'TYPOGRAPHY',
      layout: 'LAYOUT', contrast: 'CONTRAST', family: 'Family', size: 'Size',
      weight: 'Weight', margin: 'Margin', padding: 'Padding',
      footer: 'Click element to pin • Esc to quit',
      noColors: 'No colors found', more: '…and {count} more',
      eyedropperUnsupported: 'EyeDropper not supported',
      copied: '✓ Copied:', copiedFlash: '✓ Copied!',
      inspectorCopyTitle: '=== ColorGrab CSS Inspector ===',
      element: 'Element', colorsBlock: 'Colors', noColorsBlock: 'No colors found',
      typographyBlock: 'Typography', fontFamily: 'Font Family',
      fontSize: 'Font Size', fontWeight: 'Font Weight', layoutBlock: 'Layout',
      contrastBlock: 'Contrast', textColor: 'Text', bgColor: 'Background',
      ratio: 'Ratio', statusBadge: 'CG', undetermined: 'N/A',
      contrastNote: 'alpha/gradient — cannot determine',
      copyAll: 'Copy all', copyColor: 'Copy color', copySize: 'Copy size',
      copyRow: 'Copy', closePin: 'Close'
    },
    vi: {
      brand: '⬡ ColorGrab', colors: 'MÀU SẮC', typography: 'CHỮ',
      layout: 'BỐ CỤC', contrast: 'TƯƠNG PHẢN', family: 'Phông', size: 'Kích thước',
      weight: 'Độ đậm', margin: 'Lề ngoài', padding: 'Lề trong',
      footer: 'Nhấp phần tử để ghim • Esc để thoát',
      noColors: 'Không tìm thấy màu', more: '…và thêm {count} màu',
      eyedropperUnsupported: 'EyeDropper không được hỗ trợ',
      copied: '✓ Đã sao chép:', copiedFlash: '✓ Đã sao chép!',
      inspectorCopyTitle: '=== Trình kiểm tra CSS ColorGrab ===',
      element: 'Phần tử', colorsBlock: 'Màu sắc', noColorsBlock: 'Không tìm thấy màu',
      typographyBlock: 'Chữ', fontFamily: 'Phông chữ',
      fontSize: 'Cỡ chữ', fontWeight: 'Độ đậm', layoutBlock: 'Bố cục',
      contrastBlock: 'Tương phản', textColor: 'Chữ', bgColor: 'Nền',
      ratio: 'Tỉ lệ', statusBadge: 'CG', undetermined: 'N/A',
      contrastNote: 'alpha/gradient — không xác định được',
      copyAll: 'Sao chép tất cả', copyColor: 'Sao chép màu', copySize: 'Sao chép kích thước',
      copyRow: 'Sao chép', closePin: 'Đóng'
    }
  };

  function t(key, vars) {
    const dict = I18N[currentLanguage] || I18N.en;
    let text = dict[key] || I18N.en[key] || key;
    if (vars) Object.keys(vars).forEach(k => { text = text.replace(`{${k}}`, String(vars[k])); });
    return text;
  }

  // ── Color conversion (CSS Color 4 safe) ──────────────────────────
  const _cvs = document.createElement('canvas');
  _cvs.width = _cvs.height = 1;
  const _ctx = _cvs.getContext('2d', { willReadFrequently: true });

  function parseColor(cssValue) {
    if (!cssValue || cssValue === 'transparent' || cssValue === 'none' ||
        cssValue === 'initial' || cssValue === 'inherit' || cssValue === 'unset') return null;

    // Fast path: standard rgb/rgba (99% of getComputedStyle results)
    const m = cssValue.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
    if (m) {
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (a === 0) return null;
      return { r: Math.round(parseFloat(m[1])), g: Math.round(parseFloat(m[2])), b: Math.round(parseFloat(m[3])), a };
    }

    // Fallback: Canvas 1×1 normalizer for CSS Color 4 (oklch, lab, color(), named)
    try {
      _ctx.clearRect(0, 0, 1, 1);
      _ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      _ctx.fillStyle = cssValue;
      _ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = _ctx.getImageData(0, 0, 1, 1).data;
      if (a === 0) return null;
      return { r, g, b, a: a / 255 };
    } catch {
      return null;
    }
  }

  function rgbaToHex(c) {
    const h = v => v.toString(16).padStart(2, '0');
    return `#${h(c.r)}${h(c.g)}${h(c.b)}`.toUpperCase();
  }

  function rgbaToRgbStr(c) {
    return c.a < 1
      ? `rgba(${c.r}, ${c.g}, ${c.b}, ${round2(c.a)})`
      : `rgb(${c.r}, ${c.g}, ${c.b})`;
  }

  function rgbaToHsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return `hsl(0, 0%, ${Math.round(l * 100)}%)`;
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  function rgbaToOklch(c) {
    const lin = v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    const R = lin(c.r), G = lin(c.g), B = lin(c.b);
    const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
    const C = Math.sqrt(a * a + b_ * b_);
    let H = Math.atan2(b_, a) * 180 / Math.PI;
    if (H < 0) H += 360;
    return `oklch(${round2(L)} ${round3(C)} ${Math.round(H)})`;
  }

  function round2(v) { return Math.round(v * 100) / 100; }
  function round3(v) { return Math.round(v * 1000) / 1000; }

  function formatColor(c) {
    switch (copyFormat) {
      case 'rgb': return rgbaToRgbStr(c);
      case 'hsl': return rgbaToHsl(c);
      case 'oklch': return rgbaToOklch(c);
      default: return rgbaToHex(c);
    }
  }

  // ── WCAG 2.x Contrast ───────────────────────────────────────────
  function relativeLuminance(c) {
    const lin = v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  }

  function contrastRatio(c1, c2) {
    const l1 = relativeLuminance(c1), l2 = relativeLuminance(c2);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function alphaComposite(fg, bg) {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const blend = (cf, cb) => Math.round((cf * fg.a + cb * bg.a * (1 - fg.a)) / a);
    return { r: blend(fg.r, bg.r), g: blend(fg.g, bg.g), b: blend(fg.b, bg.b), a };
  }

  function getEffectiveBackground(el) {
    let current = el;
    let bg = { r: 0, g: 0, b: 0, a: 0 };
    const stack = [];

    while (current && current instanceof Element) {
      try {
        const cs = getComputedStyle(current);
        const bgVal = cs.backgroundColor;
        const parsed = parseColor(bgVal);
        if (parsed && parsed.a > 0) stack.push(parsed);
      } catch { /* ignore */ }
      current = current.parentElement;
    }
    stack.push({ r: 255, g: 255, b: 255, a: 1 });

    stack.reverse();
    for (const layer of stack) {
      bg = alphaComposite(layer, bg);
    }
    return bg;
  }

  function getContrastInfo(el) {
    try {
      const cs = getComputedStyle(el);
      const fgRaw = cs.color;
      const fg = parseColor(fgRaw);
      if (!fg) return null;

      const bgImage = cs.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        return { fg, bg: null, ratio: null, undetermined: true };
      }

      const effectiveBg = getEffectiveBackground(el);
      const compositeFg = fg.a < 1 ? alphaComposite(fg, effectiveBg) : fg;
      const ratio = contrastRatio(compositeFg, effectiveBg);
      return { fg: compositeFg, bg: effectiveBg, ratio, undetermined: false };
    } catch {
      return null;
    }
  }

  function wcagBadge(ratio) {
    if (ratio >= 7) return { label: 'AAA', cls: 'cg-badge-aaa' };
    if (ratio >= 4.5) return { label: 'AA', cls: 'cg-badge-aa' };
    if (ratio >= 3) return { label: 'AA Large', cls: 'cg-badge-aa-lg' };
    return { label: 'Fail', cls: 'cg-badge-fail' };
  }

  // ── Color scanning (capped for instantaneous response) ───────────
  function scanColors(rootEl) {
    const colors = [];
    const seen = new Set();
    const elements = [rootEl];
    try {
      const children = rootEl.querySelectorAll('*');
      const limit = Math.min(children.length, 30);
      for (let i = 0; i < limit; i++) {
        elements.push(children[i]);
      }
    } catch { /* ignore */ }

    for (const el of elements) {
      try {
        const cs = getComputedStyle(el);
        for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke']) {
          const val = cs.getPropertyValue(prop);
          const parsed = parseColor(val);
          if (!parsed) continue;
          const hex = rgbaToHex(parsed);
          if (seen.has(hex)) continue;
          seen.add(hex);
          colors.push({ ...parsed, hex, original: val });
          if (colors.length >= 16) break;
        }
      } catch { /* ignore */ }
      if (colors.length >= 16) break;
    }
    return colors;
  }

  function getSpacing(el, top, right, bottom, left) {
    try {
      const cs = getComputedStyle(el);
      const t = cs.getPropertyValue(top) || '0px';
      const r = cs.getPropertyValue(right) || '0px';
      const b = cs.getPropertyValue(bottom) || '0px';
      const l = cs.getPropertyValue(left) || '0px';
      if (t === r && r === b && b === l) return t;
      if (t === b && r === l) return `${t} ${r}`;
      return `${t} ${r} ${b} ${l}`;
    } catch {
      return '0px';
    }
  }

  // ── Tooltip CSS ──────────────────────────────────────────────────
  const TOOLTIP_CSS = `
    #cg-tooltip { width: 280px; background: ${D.bg}; border: 1px solid ${D.border}; border-radius: ${D.radius}; box-shadow: ${D.shadow}; overflow: hidden; font-family: ${D.font}; animation: cg-in 150ms ease-out; }
    #cg-tooltip.cg-pinned { border-color: ${D.accent}; }
    #cg-header { background: ${D.grad}; padding: 8px 10px; display: flex; align-items: center; gap: 6px; pointer-events: auto; }
    .cg-logo { font-size: 12px; font-weight: 700; color: #fff; flex: 1; }
    .cg-tag { font-size: 10px; font-family: monospace; color: rgba(255,255,255,.75); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cg-eyedropper-btn, .cg-close-btn { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); border-radius: 5px; padding: 3px 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 150ms; pointer-events: auto; color: #fff; }
    .cg-eyedropper-btn:hover, .cg-close-btn:hover { background: rgba(255,255,255,.28); }
    .cg-eyedropper-btn:focus-visible, .cg-close-btn:focus-visible, .cg-row-copy:focus-visible, .cg-btn-primary:focus-visible, .cg-btn-secondary:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
    #cg-body { padding: 10px 12px; }
    #cg-tooltip.cg-pinned #cg-body { pointer-events: auto; }
    .cg-section-label { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: ${D.muted}; margin-bottom: 6px; font-weight: 600; }
    .cg-row { display: flex; justify-content: space-between; align-items: center; gap: 4px; margin-bottom: 5px; }
    .cg-label { font-size: 11px; color: ${D.muted}; }
    .cg-value { font-size: 11px; color: ${D.value}; font-weight: 500; text-align: right; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .cg-row-copy { flex-shrink: 0; width: 20px; height: 20px; padding: 0; border: none; border-radius: 4px; background: transparent; color: ${D.muted}; cursor: pointer; display: flex; align-items: center; justify-content: center; pointer-events: auto; opacity: .7; }
    .cg-row-copy:hover { color: ${D.accent}; background: rgba(34,197,94,.12); opacity: 1; }
    #cg-actions { pointer-events: auto; padding: 8px 12px 10px; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid ${D.border}; }
    .cg-btn-primary { width: 100%; background: ${D.accent}; color: #052e16; border: none; border-radius: 6px; padding: 8px 10px; font-family: ${D.font}; font-size: 12px; font-weight: 700; cursor: pointer; }
    .cg-btn-primary:hover { background: ${D.accent2}; color: #fff; }
    .cg-btn-row { display: flex; gap: 6px; }
    .cg-btn-secondary { flex: 1; background: ${D.bg2}; color: ${D.value}; border: 1px solid ${D.border}; border-radius: 6px; padding: 6px 8px; font-family: ${D.font}; font-size: 11px; font-weight: 600; cursor: pointer; }
    .cg-btn-secondary:hover { border-color: ${D.accent}; color: ${D.accent}; }
    .cg-color-row { display: flex; align-items: center; gap: 6px; padding: 3px 4px; border-radius: 5px; cursor: pointer; pointer-events: auto; transition: background 100ms; margin-bottom: 3px; }
    .cg-color-row:hover { background: rgba(34,197,94,.1); }
    .cg-color-row.cg-copied { background: rgba(34,197,94,.2); }
    .cg-swatch { width: 14px; height: 14px; border-radius: 3px; border: 1px solid rgba(255,255,255,.15); flex-shrink: 0; }
    .cg-hex { font-size: 11px; color: ${D.value}; font-weight: 500; font-family: monospace; }
    .cg-secondary { font-size: 10px; color: ${D.muted}; font-family: monospace; margin-left: 4px; }
    .cg-divider { height: 1px; background: ${D.border}; margin: 8px 0; }
    #cg-footer { font-size: 9px; color: #4b5563; text-align: center; padding: 5px 0 7px; }
    .cg-no-colors { font-size: 11px; color: ${D.muted}; font-style: italic; }
    .cg-more { font-size: 10px; color: #6b7280; margin-top: 3px; text-align: center; }
    .cg-contrast-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .cg-contrast-preview { display: flex; align-items: center; gap: 4px; }
    .cg-contrast-swatch { width: 10px; height: 10px; border-radius: 2px; border: 1px solid rgba(255,255,255,.15); }
    .cg-contrast-ratio { font-size: 12px; color: ${D.value}; font-weight: 600; font-family: monospace; }
    .cg-badge { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px; }
    .cg-badge-aaa { background: #166534; color: #bbf7d0; }
    .cg-badge-aa { background: #15803d; color: #dcfce7; }
    .cg-badge-aa-lg { background: #a16207; color: #fef3c7; }
    .cg-badge-fail { background: #991b1b; color: #fecaca; }
    .cg-badge-na { background: #374151; color: #9ca3af; }
    .cg-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: ${D.bg2}; color: ${D.accent}; border: 1px solid ${D.accent}; border-radius: 8px; padding: 8px 16px; font-family: ${D.font}; font-size: 12px; font-weight: 600; z-index: 2147483647; pointer-events: none; animation: cg-toast-in .3s ease-out; box-shadow: 0 4px 12px rgba(0,0,0,.5); }
    @keyframes cg-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes cg-toast-in { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    @media (prefers-reduced-motion: reduce) { #cg-tooltip, .cg-toast { animation: none; } }
  `;

  const EYEDROPPER_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 10-10"/><path d="M12 12l9-9"/><path d="m15 15 3-3"/></svg>';
  const CLOSE_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  const COPY_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  // ── DOM helpers ──────────────────────────────────────────────────
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v);
      }
    }
    if (children) {
      for (const child of children) {
        if (typeof child === 'string') e.appendChild(document.createTextNode(child));
        else if (child) e.appendChild(child);
      }
    }
    return e;
  }

  // ── Tooltip init ─────────────────────────────────────────────────
  function initTooltip() {
    if (host) return;
    host = document.createElement('div');
    host.id = 'colorgrab-tooltip-host';
    Object.assign(host.style, {
      position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
      top: '0', left: '0', opacity: '0', transition: 'opacity .15s ease-out'
    });
    (document.body || document.documentElement).appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    shadow.appendChild(el('style', { text: TOOLTIP_CSS }));
    shadow.appendChild(el('div', { id: 'cg-tooltip' }));
  }

  // ── Positioning ──────────────────────────────────────────────────
  function updatePosition(clientX, clientY) {
    if (!host || !shadow) return;
    const tooltip = shadow.querySelector('#cg-tooltip');
    const h = tooltip ? tooltip.offsetHeight : 220;
    const w = 280;

    let left = clientX + 16;
    let top = clientY + 12;

    if (left + w > window.innerWidth) left = clientX - w - 16;
    if (top + h > window.innerHeight) top = clientY - h - 12;

    if (left < 8) left = 8;
    if (top < 8) top = 8;

    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
  }

  // ── Toast ────────────────────────────────────────────────────────
  let _toastTimeout = null;
  function showToast(message) {
    if (!shadow) return;
    let toast = shadow.querySelector('.cg-toast');
    if (toast) toast.remove();
    clearTimeout(_toastTimeout);
    toast = el('div', { class: 'cg-toast', text: message });
    shadow.appendChild(toast);
    _toastTimeout = setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2000);
  }

  // ── Inspector dump (Copy all) ────────────────────────────────────
  function buildInspectorDump(target) {
    const cs = getComputedStyle(target);
    const rect = target.getBoundingClientRect();
    const colors = scanColors(target);
    const contrastInfo = getContrastInfo(target);

    const tag = (target.tagName || 'div').toLowerCase();
    const id = target.id ? `#${target.id}` : '';
    let cls = '';
    if (typeof target.className === 'string' && target.className.trim()) {
      cls = '.' + target.className.trim().split(/\s+/).slice(0, 3).join('.');
    } else if (target.className && typeof target.className.baseVal === 'string' && target.className.baseVal.trim()) {
      cls = '.' + target.className.baseVal.trim().split(/\s+/).slice(0, 3).join('.');
    }

    const colorList = colors.map(c => `${rgbaToHex(c)} | ${rgbaToRgbStr(c)} | ${rgbaToHsl(c)} | ${rgbaToOklch(c)}`).join('\n');

    let contrastText = '';
    if (contrastInfo && !contrastInfo.undetermined && contrastInfo.ratio) {
      const r = Math.round(contrastInfo.ratio * 100) / 100;
      const badge = wcagBadge(contrastInfo.ratio);
      contrastText = `\n[${t('contrastBlock')}]\n${t('ratio')}: ${r}:1 (${badge.label})\n${t('textColor')}: ${contrastInfo.fg ? rgbaToHex(contrastInfo.fg) : '?'}\n${t('bgColor')}: ${contrastInfo.bg ? rgbaToHex(contrastInfo.bg) : '?'}`;
    }

    return `${t('inspectorCopyTitle')}
${t('element')}: ${tag}${cls}${id}

[${t('colorsBlock')}]
${colorList || t('noColorsBlock')}
${contrastText}
[${t('typographyBlock')}]
${t('fontFamily')}: ${cs.getPropertyValue('font-family').split(',')[0]}
${t('fontSize')}: ${cs.getPropertyValue('font-size')}
${t('fontWeight')}: ${cs.getPropertyValue('font-weight')}

[${t('layoutBlock')}]
${t('size')}: ${Math.round(rect.width)}px × ${Math.round(rect.height)}px
${t('margin')}: ${getSpacing(target, 'margin-top', 'margin-right', 'margin-bottom', 'margin-left')}
${t('padding')}: ${getSpacing(target, 'padding-top', 'padding-right', 'padding-bottom', 'padding-left')}`;
  }

  function copyValue(text, flashEl) {
    return copyToClipboard(text).then(() => {
      if (flashEl) {
        flashEl.classList.add('cg-copied');
        setTimeout(() => flashEl.classList.remove('cg-copied'), 1000);
      }
      showToast(`${t('copied')} ${text}`);
    });
  }

  // ── Update tooltip content ───────────────────────────────────────
  function updateTooltipContent(target) {
    if (!shadow || !host) return;
    try {
      const cs = getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      const colors = scanColors(target);
      const contrastInfo = getContrastInfo(target);
      const sizeText = `${Math.round(rect.width)}px × ${Math.round(rect.height)}px`;

      const tag = (target.tagName || 'div').toLowerCase();
      const idStr = target.id ? `#${target.id}` : '';
      let clsStr = '';
      if (typeof target.className === 'string' && target.className.trim()) {
        clsStr = '.' + target.className.trim().split(/\s+/).slice(0, 3).join('.');
      } else if (target.className && typeof target.className.baseVal === 'string' && target.className.baseVal.trim()) {
        clsStr = '.' + target.className.baseVal.trim().split(/\s+/).slice(0, 3).join('.');
      }
      const elementLabel = `${tag}${clsStr}${idStr}`;

      const fontRaw = cs.getPropertyValue('font-family') || '';
      const fontFamily = fontRaw.split(',')[0].replace(/['"]/g, '').trim() || 'inherit';
      const truncatedFont = fontFamily.length > 22 ? fontFamily.slice(0, 22) + '…' : fontFamily;
      const fontSize = cs.getPropertyValue('font-size') || 'inherit';
      const fontWeight = cs.getPropertyValue('font-weight') || 'normal';
      const margin = getSpacing(target, 'margin-top', 'margin-right', 'margin-bottom', 'margin-left');
      const padding = getSpacing(target, 'padding-top', 'padding-right', 'padding-bottom', 'padding-left');

      const tooltip = shadow.querySelector('#cg-tooltip');
      if (!tooltip) return;
      tooltip.textContent = '';
      tooltip.classList.toggle('cg-pinned', isPinned);

      // Header
      const headerKids = [
        el('span', { class: 'cg-logo', text: t('brand') }),
        el('span', { class: 'cg-tag', text: elementLabel }),
        el('button', { class: 'cg-eyedropper-btn', 'aria-label': 'Pick color with eyedropper', html: EYEDROPPER_SVG, onclick: handleEyedropper })
      ];
      if (isPinned) {
        headerKids.push(el('button', {
          class: 'cg-close-btn',
          'aria-label': t('closePin'),
          html: CLOSE_SVG,
          onclick: (e) => { e.stopPropagation(); unpin(); }
        }));
      }
      tooltip.appendChild(el('div', { id: 'cg-header' }, headerKids));

      // Body
      const body = el('div', { id: 'cg-body' });

      // Colors section
      body.appendChild(el('div', { class: 'cg-section-label', text: t('colors') }));
      if (colors.length === 0) {
        body.appendChild(el('div', { class: 'cg-no-colors', text: t('noColors') }));
      } else {
        const colorList = el('div', { id: 'cg-colors-list' });
        colors.slice(0, 12).forEach(c => {
          const row = el('div', { class: 'cg-color-row' }, [
            el('span', { class: 'cg-swatch', style: { background: rgbaToRgbStr(c) } }),
            el('span', { class: 'cg-hex', text: formatColor(c) }),
            el('span', { class: 'cg-secondary', text: copyFormat === 'hex' ? rgbaToRgbStr(c) : rgbaToHex(c) })
          ]);
          row.addEventListener('click', (e) => {
            e.stopPropagation();
            const formatted = formatColor(c);
            copyValue(formatted, row).then(() => {
              chrome.runtime.sendMessage({ action: 'saveColor', color: { hex: c.hex, rgb: rgbaToRgbStr(c) } });
            });
          });
          colorList.appendChild(row);
        });
        body.appendChild(colorList);
        if (colors.length > 12) {
          body.appendChild(el('div', { class: 'cg-more', text: t('more', { count: colors.length - 12 }) }));
        }
      }

      // Contrast section
      if (contrastInfo) {
        body.appendChild(el('div', { class: 'cg-divider' }));
        body.appendChild(el('div', { class: 'cg-section-label', text: t('contrast') }));
        const contrastRow = el('div', { class: 'cg-contrast-row' });
        let contrastCopy = '';
        if (contrastInfo.undetermined) {
          contrastRow.appendChild(el('span', { class: 'cg-label', text: t('contrastNote') }));
          contrastRow.appendChild(el('span', { class: 'cg-badge cg-badge-na', text: t('undetermined') }));
          contrastCopy = t('contrastNote');
        } else {
          const preview = el('div', { class: 'cg-contrast-preview' }, [
            el('span', { class: 'cg-contrast-swatch', style: { background: rgbaToRgbStr(contrastInfo.fg) } }),
            el('span', { class: 'cg-label', text: '/' }),
            el('span', { class: 'cg-contrast-swatch', style: { background: rgbaToRgbStr(contrastInfo.bg) } })
          ]);
          contrastRow.appendChild(preview);
          const r = Math.round(contrastInfo.ratio * 100) / 100;
          contrastRow.appendChild(el('span', { class: 'cg-contrast-ratio', text: `${r}:1` }));
          const badge = wcagBadge(contrastInfo.ratio);
          contrastRow.appendChild(el('span', { class: `cg-badge ${badge.cls}`, text: badge.label }));
          contrastCopy = `${r}:1 (${badge.label})`;
        }
        if (isPinned && contrastCopy) {
          contrastRow.appendChild(makeCopyBtn(contrastCopy));
        }
        body.appendChild(contrastRow);
      }

      // Typography
      body.appendChild(el('div', { class: 'cg-divider' }));
      body.appendChild(el('div', { class: 'cg-section-label', text: t('typography') }));
      body.appendChild(makeRow(t('family'), truncatedFont, fontFamily));
      body.appendChild(makeRow(t('size'), fontSize, fontSize));
      body.appendChild(makeRow(t('weight'), fontWeight, fontWeight));

      // Layout
      body.appendChild(el('div', { class: 'cg-divider' }));
      body.appendChild(el('div', { class: 'cg-section-label', text: t('layout') }));
      body.appendChild(makeRow(t('size'), sizeText, sizeText));
      body.appendChild(makeRow(t('margin'), margin, margin));
      body.appendChild(makeRow(t('padding'), padding, padding));

      tooltip.appendChild(body);

      if (isPinned) {
        const actions = el('div', { id: 'cg-actions' }, [
          el('button', {
            class: 'cg-btn-primary',
            text: t('copyAll'),
            onclick: (e) => {
              e.stopPropagation();
              copyValue(buildInspectorDump(target));
            }
          }),
          el('div', { class: 'cg-btn-row' }, [
            el('button', {
              class: 'cg-btn-secondary',
              text: t('copyColor'),
              onclick: (e) => {
                e.stopPropagation();
                if (!colors.length) { showToast(t('noColors')); return; }
                const formatted = formatColor(colors[0]);
                copyValue(formatted).then(() => {
                  chrome.runtime.sendMessage({ action: 'saveColor', color: { hex: colors[0].hex, rgb: rgbaToRgbStr(colors[0]) } });
                });
              }
            }),
            el('button', {
              class: 'cg-btn-secondary',
              text: t('copySize'),
              onclick: (e) => {
                e.stopPropagation();
                copyValue(sizeText);
              }
            })
          ])
        ]);
        tooltip.appendChild(actions);
      } else {
        tooltip.appendChild(el('div', { id: 'cg-footer', text: t('footer') }));
      }
    } catch (err) {
      console.error('ColorGrab update error:', err);
    }
  }

  function makeCopyBtn(text) {
    return el('button', {
      class: 'cg-row-copy',
      'aria-label': t('copyRow'),
      html: COPY_SVG,
      onclick: (e) => {
        e.stopPropagation();
        copyValue(text);
      }
    });
  }

  function makeRow(label, display, copyText) {
    const kids = [
      el('span', { class: 'cg-label', text: label }),
      el('span', { class: 'cg-value', text: display })
    ];
    if (isPinned && copyText) kids.push(makeCopyBtn(copyText));
    return el('div', { class: 'cg-row' }, kids);
  }

  // ── EyeDropper ───────────────────────────────────────────────────
  async function handleEyedropper() {
    if (!window.EyeDropper) {
      showToast(t('eyedropperUnsupported'));
      return;
    }
    const dropper = new EyeDropper();
    if (host) host.style.display = 'none';
    try {
      const result = await dropper.open();
      const hex = result.sRGBHex.toUpperCase();
      const parsed = parseColor(hex);
      const formatted = parsed ? formatColor(parsed) : hex;
      await copyToClipboard(formatted);
      showToast(`${t('copied')} ${formatted}`);
      chrome.runtime.sendMessage({ action: 'saveColor', color: { hex, rgb: parsed ? rgbaToRgbStr(parsed) : hex } });
    } catch { /* user cancelled */ }
    finally { if (host) host.style.display = ''; }
  }

  // ── Clipboard ────────────────────────────────────────────────────
  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  // ── Pin / Unpin ──────────────────────────────────────────────────
  function pin(target, clientX, clientY) {
    if (currentTarget && currentTarget !== target) {
      currentTarget.removeAttribute('data-colorgrab-highlight');
    }
    currentTarget = target;
    currentTarget.setAttribute('data-colorgrab-highlight', '');
    isPinned = true;
    initTooltip();
    updateTooltipContent(currentTarget);
    updatePosition(clientX, clientY);
    if (host) host.style.opacity = '1';
  }

  function unpin() {
    if (!isPinned) return;
    isPinned = false;
    if (currentTarget) {
      updateTooltipContent(currentTarget);
    } else if (host) {
      host.style.opacity = '0';
    }
  }

  // ── Event handlers ───────────────────────────────────────────────
  const _onMouseover = (e) => {
    if (!isActive || isPinned) return;
    const target = e.target && e.target.nodeType === 3 ? e.target.parentElement : e.target;
    if (!target || !(target instanceof Element)) return;
    if (host && (target === host || host.contains(target))) return;
    if (target === statusBadge) return;

    if (currentTarget && currentTarget !== target) {
      currentTarget.removeAttribute('data-colorgrab-highlight');
    }
    currentTarget = target;
    currentTarget.setAttribute('data-colorgrab-highlight', '');

    initTooltip();
    updateTooltipContent(currentTarget);
    updatePosition(e.clientX, e.clientY);
    if (host) host.style.opacity = '1';
  };

  const _onMousemove = (e) => {
    if (!isActive || !host || isPinned) return;
    updatePosition(e.clientX, e.clientY);
  };

  const _onMouseout = (e) => {
    if (!isActive || isPinned) return;
    if (e.relatedTarget && currentTarget && (e.relatedTarget === currentTarget || currentTarget.contains(e.relatedTarget))) return;
    if (e.relatedTarget && host && host.contains(e.relatedTarget)) return;
    if (currentTarget) currentTarget.removeAttribute('data-colorgrab-highlight');
    if (host) host.style.opacity = '0';
    currentTarget = null;
  };

  const _onClick = (e) => {
    if (!isActive) return;
    const target = e.target && e.target.nodeType === 3 ? e.target.parentElement : e.target;
    if (!target || !(target instanceof Element)) return;
    if (host && (target === host || host.contains(target))) return;
    if (target === statusBadge) return;

    e.preventDefault();
    e.stopPropagation();
    pin(target, e.clientX, e.clientY);
  };

  const _onKeydown = (e) => {
    if (e.key !== 'Escape' || !isActive) return;
    if (isPinned) {
      unpin();
      return;
    }
    deactivate();
    chrome.storage.local.set({ isActive: false });
    chrome.runtime.sendMessage({ action: 'syncState', isActive: false });
  };

  // ── Activate / Deactivate ────────────────────────────────────────
  function activate() {
    if (isActive) return;
    isActive = true;
    const style = document.createElement('style');
    style.id = 'colorgrab-highlight-style';
    style.textContent = `[data-colorgrab-highlight] { outline: 2px dashed ${D.accent} !important; background-color: rgba(34,197,94,.08) !important; box-shadow: 0 0 0 2px ${D.accent} !important; }`;
    (document.head || document.documentElement).appendChild(style);

    statusBadge = document.createElement('div');
    statusBadge.id = 'colorgrab-status-badge';
    statusBadge.textContent = t('statusBadge');
    Object.assign(statusBadge.style, {
      position: 'fixed', bottom: '10px', right: '10px',
      background: D.accent, color: 'white', fontFamily: 'sans-serif',
      fontSize: '12px', fontWeight: 'bold', padding: '4px 8px',
      borderRadius: '4px', zIndex: '2147483647', pointerEvents: 'none'
    });
    (document.body || document.documentElement).appendChild(statusBadge);

    document.addEventListener('mouseover', _onMouseover, true);
    document.addEventListener('mousemove', _onMousemove, true);
    document.addEventListener('mouseout', _onMouseout, true);
    document.addEventListener('click', _onClick, true);
    document.addEventListener('keydown', _onKeydown);
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;
    isPinned = false;
    document.removeEventListener('mouseover', _onMouseover, true);
    document.removeEventListener('mousemove', _onMousemove, true);
    document.removeEventListener('mouseout', _onMouseout, true);
    document.removeEventListener('click', _onClick, true);
    document.removeEventListener('keydown', _onKeydown);

    if (currentTarget) currentTarget.removeAttribute('data-colorgrab-highlight');
    const style = document.getElementById('colorgrab-highlight-style');
    if (style) style.remove();
    if (host) host.remove();
    host = null; shadow = null; currentTarget = null;
    if (statusBadge) { statusBadge.remove(); statusBadge = null; }
  }

  // ── Storage change listener (syncs across tabs live) ─────────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.isActive !== undefined) {
      changes.isActive.newValue ? activate() : deactivate();
    }
    if (changes.language !== undefined) {
      currentLanguage = changes.language.newValue === 'vi' ? 'vi' : 'en';
      if (currentTarget && host && shadow) updateTooltipContent(currentTarget);
      if (statusBadge) statusBadge.textContent = t('statusBadge');
    }
    if (changes.copyFormat !== undefined) {
      copyFormat = changes.copyFormat.newValue || 'hex';
      if (currentTarget && host && shadow) updateTooltipContent(currentTarget);
    }
  });

  // ── Runtime message listener (direct tab messaging) ──────────────
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setActive') {
      request.isActive ? activate() : deactivate();
      sendResponse?.({ status: 'ok', isActive });
    } else if (request.action === 'setLanguage') {
      currentLanguage = request.language === 'vi' ? 'vi' : 'en';
      if (currentTarget && host && shadow) updateTooltipContent(currentTarget);
      if (statusBadge) statusBadge.textContent = t('statusBadge');
      sendResponse?.({ status: 'ok' });
    } else if (request.action === 'setCopyFormat') {
      copyFormat = request.copyFormat || 'hex';
      if (currentTarget && host && shadow) updateTooltipContent(currentTarget);
      sendResponse?.({ status: 'ok' });
    } else if (request.action === 'ping') {
      sendResponse?.({ status: 'pong', isActive });
    }
  });

  // ── Initial state on load ─────────────────────────────────────────
  chrome.storage.local.get(['isActive', 'language', 'copyFormat'], (data) => {
    currentLanguage = data?.language === 'vi' ? 'vi' : 'en';
    copyFormat = data?.copyFormat || 'hex';
    if (data?.isActive) activate();
  });

})();
