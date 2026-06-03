# ColorGrab

ColorGrab is a lightweight Chrome Extension for inspecting UI styles directly on a webpage. It is built with Manifest V3 and uses only vanilla HTML, CSS, and JavaScript, with no build tools and no external dependencies.

## Overview

ColorGrab helps you inspect the visual properties of elements on a page by hovering over them. When the inspector is active, the extension highlights the current element and shows a floating information panel with useful style details such as:

- Colors used in the element
- Typography information
- Layout dimensions
- Margin and padding values

It also supports quick copying of discovered values and includes a built-in language switch between English and Vietnamese.

## Main Features

### 1. CSS Inspector
- Toggle the inspector on or off from the popup
- Hover elements to preview their styles
- Highlight the current element with a visible outline
- Show a floating tooltip panel near the cursor
- Click an element to copy a formatted summary of its styles

### 2. Color Discovery
- Detect colors used inside the hovered element subtree
- Show swatches and HEX/RGB values
- Click a color row to copy its HEX value

### 3. Eyedropper Support
- Uses the browser `EyeDropper` API when available
- Lets you pick a color directly from the page
- Copies the selected color automatically

### 4. Language Toggle
- Switch the extension UI between:
  - English
  - Tiếng Việt
- Language preference is stored in `chrome.storage.local`
- Popup text and page tooltip text update to match the selected language

### 5. Persistent State
- Stores inspector on/off state
- Stores language preference
- Uses `chrome.storage.local` only

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Vanilla HTML
- Vanilla CSS
- No npm
- No bundler
- No frameworks
- No external libraries

## Project Files

### `manifest.json`
Defines the Chrome Extension configuration:
- Manifest version
- Popup entry
- Background service worker
- Permissions
- Content script registration
- Icons

### `popup.html`
Popup user interface for controlling the inspector.

### `popup.css`
Popup styling, including:
- Theme colors
- Toggle switch UI
- Language button styling
- Layout and spacing

### `popup.js`
Popup behavior, including:
- Inspector state sync
- Badge updates
- Language toggle
- Storage integration
- Messaging with content script

### `content.js`
Injected into supported pages to:
- Track hovered elements
- Highlight targets
- Render tooltip UI
- Scan computed styles and colors
- Copy values
- Handle tooltip localization

### `background.js`
Background service worker used for extension lifecycle and message handling.

### `icons/`
Contains extension icon assets.

## Permissions Used

ColorGrab uses the following permissions:

- `activeTab`  
  Access the current active tab for inspection actions.

- `storage`  
  Save extension settings such as active state and language.

- `scripting`  
  Support script-related extension interactions.

- `clipboardWrite`  
  Copy values like colors and CSS information to the clipboard.

## Supported Pages

ColorGrab works on standard web pages such as:

- `http://*/*`
- `https://*/*`

It does not work on restricted Chrome pages such as:
- `chrome://`
- Chrome Web Store internal pages
- some browser-protected contexts

## How It Works

1. Open the ColorGrab popup.
2. Turn on the inspector toggle.
3. Move the mouse over elements on the current webpage.
4. View the floating info panel with colors and CSS details.
5. Click an element to copy its summary.
6. Use the `VI` or `EN` button in the popup to switch the extension language.

## Installation

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the ColorGrab project folder
5. Pin the extension to the Chrome toolbar

## Development Notes

- No inline scripts are used
- No remote code is loaded
- No `localStorage` is used
- All saved settings use `chrome.storage.local`
- Built to run immediately after loading unpacked

## Current Behavior

- Popup controls inspector activation
- Badge shows active/inactive state
- Page overlay highlights hovered elements
- Tooltip displays extracted style information
- Tooltip and popup support English and Vietnamese
- ESC deactivates inspector from the page

## Future Improvement Ideas

Potential future enhancements could include:
- More detailed computed style groups
- Better CSS export formatting
- Contrast checking between detected colors
- Full color history management
- Tailwind class suggestions
- Theme variants for the popup

## Authoring Notes

This project is designed to be:
- fast to load
- easy to understand
- easy to modify
- dependency-free

It is suitable for developers, UI engineers, and designers who want a simple in-browser inspection helper without installing a large toolchain.