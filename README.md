<div align="center">

# ⬡ ColorGrab

**Instant CSS Inspector & Color Toolkit for Chrome**

*Inspect styles, calculate WCAG contrast, extract modern color formats, and grab colors with pixel precision. Free. Private. Zero dependencies.*

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](manifest.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](manifest.json)

</div>

---

## ✨ Features

- 🎯 **Hover Inspection:** Instantly view typography, computed colors, dimensions, margin, and padding of any element.
- ♿ **WCAG 2.x Contrast Ratio:** Real-time text-to-background contrast calculation with AA, AAA, AA Large, and Fail badges. Automatic ancestor alpha-compositing.
- 🎨 **Modern Color Formats (CSS Color 4):** Supports and converts between HEX, RGB, HSL, and OKLCH. Normalizes wide-gamut and CSS Color 4 values via Canvas sRGB.
- 👁️ **EyeDropper Tool:** Pixel-level precision screen color picker powered by the native browser EyeDropper API.
- 📜 **Color History:** Automatically saves your last 50 picked/inspected colors in local storage. Click any swatch in the popup to re-copy.
- 📋 **Configurable Copy Format:** Choose your default format (HEX, RGB, HSL, OKLCH) from popup settings.
- 🍞 **Visual Toast Feedback:** On-screen toast confirmation when copying values to clipboard.
- ⌨️ **Keyboard Shortcuts:** `Alt+Shift+C` to toggle inspector; `Esc` to deactivate.
- 🖱️ **Context Menu:** Right-click any element → "ColorGrab: Inspect this element".
- 🌓 **Dark / Light Theme:** Clean popup UI with full theme toggle.
- 🌐 **Bilingual (EN / VI):** Seamless one-click switch between English and Vietnamese.
- 🛡️ **Zero Tracking & Full Privacy:** 100% on-device processing. Zero network requests, zero telemetry, zero ads, zero remote code.

---

## 🚀 Installation (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/phongnguyendinh/ColorGrab.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top right toggle).
4. Click **Load unpacked** (top left button).
5. Select the `ColorGrab` folder.

---

## ⌨️ Shortcuts & Controls

| Action | Shortcut / Gesture |
|---|---|
| Toggle Inspector | `Alt+Shift+C` or toolbar toggle |
| Inspect Element via Menu | Right-click → **ColorGrab: Inspect this element** |
| Copy Full CSS Summary | Left-click on inspected element |
| Copy Single Color | Click any color row in tooltip |
| EyeDropper Pick | Click the eyedropper icon in tooltip |
| Deactivate Inspector | `Esc` key |

---

## 🏗️ Architecture

ColorGrab is built entirely with vanilla web technologies — no bundlers, no frameworks, zero runtime dependencies.

```
ColorGrab/
├── manifest.json        # MV3 manifest (activeTab, scripting, storage, clipboardWrite, contextMenus)
├── background.js        # Service worker: lifecycle, shortcuts, context menu, on-demand injection
├── content.js           # On-demand inspector: CSS Color 4 parser, WCAG contrast, Shadow DOM tooltip
├── popup.html           # Toolbar popup: controls, format selector, color history grid
├── popup.js             # Popup logic: live storage sync, theme/language/format persistence
├── popup.css            # Dark/light theme styles, responsive layout
├── icons/
│   ├── icon-16.png      # Favicon / extension list
│   ├── icon-32.png      # Windows taskbar / high-DPI
│   ├── icon-48.png      # Extension management page
│   ├── icon-128.png     # Chrome Web Store & installation
│   └── icon.svg         # Source vector graphic
├── CLAUDE.md            # AI assistant codebase guidance
├── PRIVACY.md           # Chrome Web Store privacy policy
└── README.md
```

---

## 🔒 Privacy & Permissions

ColorGrab follows the principle of least privilege:

- **`activeTab` + `scripting`:** Injects the inspector only when you explicitly invoke it. No background page tracking.
- **`storage`:** Saves your preferences (language, theme, format) and color history locally on your machine.
- **`clipboardWrite`:** Copies color codes and CSS summaries only upon your explicit click.
- **`contextMenus`:** Adds the right-click "Inspect this element" shortcut.

Read the full [Privacy Policy](PRIVACY.md).

---

## 📄 License

MIT License © Nguyen Dinh Phong
