# 🎨 ColorGrab

<p align="center">
  <strong>A lightweight Chrome Extension for fast CSS inspection and color discovery</strong><br>
  Built with Manifest V3, pure vanilla JavaScript, and zero dependencies.
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white">
  <img alt="Vanilla JS" src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111">
  <img alt="No Dependencies" src="https://img.shields.io/badge/Dependencies-None-22C55E?style=for-the-badge">
  <img alt="Storage" src="https://img.shields.io/badge/Storage-chrome.storage.local-7C3AED?style=for-the-badge">
</p>

---

## ✨ Overview

**ColorGrab** helps developers and designers inspect UI elements directly on a webpage with a simple hover-based workflow.

When the inspector is active, the extension:

- highlights the hovered element
- shows a floating info panel near the cursor
- extracts colors used inside the element subtree
- displays typography and layout information
- lets you copy discovered values instantly

It is designed to be **fast**, **dependency-free**, and **easy to load unpacked** in Chrome.

---

## 🚀 Features

### 🧭 CSS Inspector
- Toggle inspector mode from the popup
- Hover any element to preview its visual properties
- Highlight the current target with a visible outline
- Show a floating tooltip with style information
- Click an element to copy a formatted CSS summary

### 🎨 Color Discovery
- Scan colors used by the hovered element and its children
- Display swatches with **HEX** and **RGB** values
- Click a color row to copy its HEX code

### 🧪 Eyedropper Support
- Uses the browser **EyeDropper API** when available
- Pick colors directly from the page
- Automatically copies the selected color

### 🌐 Bilingual UI
- Switch extension language between:
  - **English**
  - **Tiếng Việt**
- Popup UI and page tooltip are both localized
- Language preference is persisted with `chrome.storage.local`

### 💾 Persistent State
- Saves inspector active/inactive state
- Saves selected language
- Uses **`chrome.storage.local` only**
- No `localStorage`

---

## 🛠 Tech Stack

| Category | Details |
|---|---|
| Extension Platform | Chrome Extension Manifest V3 |
| UI | HTML + CSS |
| Logic | Vanilla JavaScript |
| Dependencies | None |
| Build Tool | None |
| Storage | `chrome.storage.local` |

---

## 📁 Project Structure

```text
ColorGrab/
├─ manifest.json
├─ background.js
├─ content.js
├─ popup.html
├─ popup.css
├─ popup.js
├─ README.md
└─ icons/
```

### File Roles

| File | Purpose |
|---|---|
| `manifest.json` | Declares extension metadata, permissions, popup, background worker, content scripts, and icons |
| `background.js` | Handles background messaging and extension lifecycle logic |
| `content.js` | Injected into pages to highlight elements, render tooltip UI, inspect styles, and copy values |
| `popup.html` | Popup markup |
| `popup.css` | Popup styling and UI appearance |
| `popup.js` | Popup behavior, toggle state, badge updates, and language switching |
| `icons/` | Extension icon assets |

---

## 🧩 Permissions

ColorGrab uses a small set of focused permissions:

| Permission | Why it is needed |
|---|---|
| `activeTab` | Interact with the currently active tab |
| `storage` | Persist language and inspector state |
| `scripting` | Support extension script interactions |
| `clipboardWrite` | Copy colors and CSS information to the clipboard |

---

## 🌍 Supported Pages

### Works on
- `http://*/*`
- `https://*/*`

### Does not work on
- `chrome://` pages
- Chrome Web Store internal pages
- browser-protected contexts
- some special document surfaces such as restricted internal pages

---

## 🖱 How It Works

1. Open the **ColorGrab** popup
2. Turn on the inspector toggle
3. Move your mouse over elements on the webpage
4. View the floating panel with colors, typography, and layout details
5. Click an element to copy a formatted summary
6. Use the **VI / EN** button to switch language

---

## 📦 Installation

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the **ColorGrab** folder
5. Pin the extension to the Chrome toolbar

---

## 🧠 Current Behavior

- Popup controls inspector activation
- Extension badge reflects active/inactive state
- Hovered elements are highlighted on the page
- Tooltip shows extracted style details
- Tooltip supports English and Vietnamese
- Pressing **Esc** deactivates the inspector

---

## 🔒 Implementation Notes

- No inline scripts
- No remote scripts
- No external CDN usage
- No `eval()` or dynamic code execution
- No `localStorage`
- Runs immediately after loading unpacked
- Pure client-side Chrome Extension architecture

---

## 🎯 Why ColorGrab?

ColorGrab is useful for:

- **frontend developers** inspecting spacing and typography
- **UI engineers** validating live page styles
- **designers** collecting colors from production pages
- **learners** exploring how interfaces are built

It aims to provide a **simple visual inspector** without requiring a heavy toolchain or large dependency set.

---

## 🔮 Future Ideas

Potential enhancements for future versions:

- richer computed-style groups
- improved CSS export formatting
- contrast checking between detected colors
- color history management
- Tailwind utility suggestions
- alternate popup themes

---

## 📌 Summary

ColorGrab is a small but practical Chrome Extension that combines:

- **element inspection**
- **color extraction**
- **copy-to-clipboard workflows**
- **bilingual UI support**
- **zero-dependency architecture**

If you want a quick in-browser helper for collecting visual styles, ColorGrab is built for that workflow.

---

<p align="center">
  Made for fast UI inspection with Chrome Extensions + vanilla JavaScript.
</p>