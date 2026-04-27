# UNC Reserved Parking Tracker (GitHub Pages)

This version is designed for **GitHub Pages** (static hosting, no backend required).

## Behavior

- The site only shows lots users report as reserved.
- Each report has community review buttons:
  - ✅ Accurate
  - ❌ Inaccurate
- Reports are stored in browser `localStorage`.
- Users can export/import reports as JSON for sharing across devices.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your branch and root folder (`/`).
5. Save. GitHub will publish `index.html`.

## Local run

Just open `index.html` in a browser.

## Notes

- Because GitHub Pages is static, storage is per-browser unless users export/import JSON.
- This tool is crowd-reported and should be verified against posted signage and official UNC announcements.
