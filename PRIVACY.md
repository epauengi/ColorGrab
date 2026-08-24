# Privacy Policy for ColorGrab

*Last updated: August 24, 2026*

ColorGrab ("we", "our", or "the extension") is a Chrome browser extension designed to inspect CSS styles and extract colors on webpages. We are committed to protecting your privacy.

## 1. Information Collection and Use

ColorGrab does **NOT** collect, transmit, sell, or share any personal data, browsing history, or user activity with any external servers.

- **On-Device Processing:** All CSS inspection, color extraction, contrast calculation, and layout measurements are performed entirely on your device inside your browser.
- **Local Storage:** The extension uses `chrome.storage.local` exclusively on your machine to save:
  - Your inspector toggle preference (`isActive`)
  - Your language preference (`language`: English or Vietnamese)
  - Your preferred copy format (`copyFormat`: HEX, RGB, HSL, or OKLCH)
  - Your theme preference (`theme`: dark or light)
  - Your recent color history (up to 50 colors)
- **Clipboard Access:** The extension only writes to your clipboard when you explicitly click an element or color swatch. It never reads your clipboard.

## 2. Permissions Used

| Permission | Purpose |
|---|---|
| `activeTab` | Temporary access to inspect styles on the current active tab only when you invoke the extension. |
| `scripting` | Programmatically injects the inspector tool into the active tab. |
| `storage` | Saves your preferences and color history locally on your device. |
| `clipboardWrite` | Copies selected CSS values and color codes to your system clipboard after user action. |
| `contextMenus` | Adds an "Inspect this element" option to the right-click context menu. |

## 3. Network and Third Parties

- **Zero Network Requests:** ColorGrab makes zero network requests. It contains no analytics, no tracking pixels, no telemetry, no ads, and no external dependencies.
- **No Remote Code:** All code is packaged locally within the extension.

## 4. Limited Use Disclosure

The use of information received from Google APIs adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the Limited Use requirements.

## 5. Contact

If you have questions about this privacy policy, please contact the developer via the GitHub repository.
