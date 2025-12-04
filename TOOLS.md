# Local Performance & Analysis Tools

This file contains commands and quick steps to run local performance audits and bundle analysis for this project.

1. Install recommended dev tools (one-time)

```powershell
npm install --save-dev lighthouse @lhci/cli
npm install --save-dev rollup-plugin-visualizer
```

2. Bundle analysis (uses existing `rollup-plugin-visualizer` integration in `vite.config.js`)

```powershell
# Build production and generate `dist/stats.html`
npm run build

# Open the analyzer report (Windows PowerShell)
start dist\stats.html
```

Notes:

- `vite.config.js` already includes `rollup-plugin-visualizer` for production builds and produces `./dist/stats.html`.

3. Lighthouse audit (local)

Start the preview server, then run Lighthouse against it.

```powershell
# In one terminal: serve the built site
npm run build
npm run preview

# In another terminal: run Lighthouse (adjust URL/port if different)
npx lighthouse http://localhost:5173 --output html --output-path ./reports/lighthouse-report.html --chrome-flags="--headless"

# Open the report
start reports\lighthouse-report.html
```

Tips:

- If `npx lighthouse` fails due to Chrome installation, install Google Chrome and ensure it's on your PATH.
- For automated CI runs, consider using `@lhci/cli` and a GitHub Action to collect scores on PRs.

4. Quick checklist after running Lighthouse

- Inspect LCP, FCP, TBT, CLS values and identify top 3 largest opportunities.
- Look for large image files, render-blocking resources, and long main-thread tasks.
- Prioritize: images, code-splitting, caching, and server/TTFB improvements.

If you want, I can add a GitHub Action to run Lighthouse on PRs and upload reports automatically.
