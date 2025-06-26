# Absolute Time for GitHub

*Because “3 days ago” tells you absolutely nothing when you're trying to figure out if that critical bug was introduced before or after the weekend deployment.*

---

## 🧠 What This Does

This cross-browser extension fixes GitHub's... *creative* decision to show you relative timestamps like "2 weeks ago" instead of, you know, **the actual date and time something happened**.

**Now works with both Chrome and Firefox!**

Say goodbye to:
- "3 days ago" ← Was that Tuesday? Wednesday? Who knows!
- "2 weeks ago" ← Could be anywhere from 8 to 21 days
- "last month" ← Cool. So... when?

Say hello to:
- "Thu, Dec 15, 06:40 PM" ← Definitely after the deployment
- "Wed, Nov 6, 2024" ← That was before we changed the API

---

## 📦 Installation

### Chrome/Chromium
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the extension directory
5. Visit GitHub and enjoy not being gaslit by "2 days ago"

### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click **This Firefox** in the sidebar
4. Click **Load Temporary Add-on**
5. Navigate to the extension directory and select the `manifest.json` file
6. The extension will be loaded temporarily

*For permanent Firefox installation, the extension would need to be signed through Mozilla's add-on store.*

### What You'll See
- **Recent events**: `Thu, Jun 26`
- **Older events**: `Wed, Nov 6, 2024`

### Settings
Click the extension icon for quick toggles:
- Turn the feature on or off
- Enable debug mode if you're curious (or something breaks)

Right-click the icon → “Options” to access full settings.

---

## 🌍 Where It Works

Pretty much everywhere GitHub uses `<relative-time>` elements:
- Commit timestamps
- Pull requests
- Comments
- Releases
- Actions/workflows
- Even those subtle "updated X ago" lines

### 🎯 Smart Route Filtering

The extension is **intentionally disabled** on certain GitHub pages where precision matters less than context:

**Disabled on:**
- **Issues pages** (`/issues`) - Issue discussions are more conversational and community-focused
- **Discussions pages** (`/discussions`) - Community forums where relative time feels more natural

**Why?** These are thread-like, community-oriented spaces where "3 days ago" actually provides better social context than "Thu, Dec 15". When you're reading a discussion or issue thread, knowing something was "recently" or "a while back" often matters more than the exact timestamp.

**Enabled everywhere else** because commits, PRs, releases, and actions are where you need precision for debugging, deployment tracking, and technical decision-making.

---

## ⚙️ Technical Notes

### Cross-Browser Compatibility
- **Chrome**: Uses Manifest V3 with Chrome Extension APIs
- **Firefox**: Uses WebExtensions API with browser polyfills
- **Unified codebase**: Single extension that works in both browsers
- **Automatic detection**: Detects browser environment and uses appropriate APIs

### Development Features
- **No frameworks**, just vanilla JavaScript and browser Extension APIs
- **Functional programming**: Pure functions and immutable data structures
- **Modern JavaScript**: ES6+ features with proper JSDoc documentation
- **Error handling**: Robust error handling throughout the codebase
- **Accessibility**: Semantic HTML and ARIA attributes
- Handles **SPA navigation** and **dynamic content injection**
- Minimal footprint, no trackers, no nonsense

---

## 🤔 FAQ

**Q: Why not just hover to see the time?**  
A: 🙄 Hovering is for cowards and timestamp apologists.

**Q: Doesn't GitHub show absolute time sometimes?**  
A: Inconsistently. And usually not when you're scanning a list of commits or comments.

**Q: Does this work in Firefox now?**  
A: Yes! The extension now works in both Chrome and Firefox using a unified codebase.

**Q: Mobile support?**  
A: Chrome extensions don’t work on mobile. Complain to your browser vendor.

**Q: Can I contribute?**  
A: Yes. The code is simple and boring. That’s the point. Fork, PR, scream into the void.

---

## 📜 License

MIT. Use it, fork it, remix it, make a competing extension that replaces my dates with Gregorian chant. Just don’t sue me.

[See LICENSE](./LICENSE) for the full text.

---

**Stop doing timestamp math. Start knowing when things actually happened.**

> This project is not affiliated with or endorsed by GitHub. It simply enhances the display of timestamps in your browser.