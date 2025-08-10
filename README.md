## Absolute Time for GitHub

Stop guessing what “3 days ago” means when you’re debugging or reviewing changes. This extension replaces GitHub’s relative timestamps with absolute dates/times where it matters.

### Features
- Replaces `<relative-time>` with absolute dates across GitHub
- Resilient to SPA navigation (Turbo/PJAX) and dynamic DOM updates
- Zero tracking, zero network calls; settings sync via Chrome storage

### Installation
1. Download or clone this repository
2. Open `chrome://extensions`
3. Enable Developer mode
4. Click “Load unpacked” and select this folder

### What you'll see
- Recent events: concise dates
- Older events: include year

### Settings
- Popup: quick toggles (enable/disable, debug)
- Options:
  - dateStyle: short | medium | long (default short)
  - showWeekday: never | olderYears | always (default olderYears)
  - showTime: never | actionsOnly | always (default actionsOnly)
  - includeSeconds: boolean (default false)
  - Reset to defaults

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

- Manifest V3, plain JavaScript
- Handles SPA navigation and dynamic content injection
- Minimal footprint, no trackers, no nonsense

### 🔒 Permissions
- storage
- Hosts: `https://github.com/*`, `https://*.github.com/*`

---

## 🤔 FAQ

**Q: Why not just hover to see the time?**  \
A: Hovering is slow when you’re scanning lists. Absolute time is glanceable.

**Q: Doesn't GitHub show absolute time sometimes?**  
A: Inconsistently. And usually not when you're scanning a list of commits or comments.

**Q: Mobile support?**  
A: Chrome extensions don’t work on mobile. Complain to your browser vendor.

**Q: Can I contribute?**  \
A: Yes. Keep it simple.

---

## 📜 License

MIT. Use it, fork it, remix it, make a competing extension that replaces my dates with Gregorian chant. Just don’t sue me.

[See LICENSE](./LICENSE) for the full text.

---

**Stop doing timestamp math. Start knowing when things actually happened.**

> This project is not affiliated with or endorsed by GitHub. It simply enhances the display of timestamps in your browser.