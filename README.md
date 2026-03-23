# Site Autopsy

> Real-time SEO forensics tool. Crawl any website, stream live findings to a terminal UI, and get an AI-powered executive summary with a deterministic health score.

![Built with Vite](https://img.shields.io/badge/built%20with-Vite%20%2B%20React-646cff?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)

---

## What it does

Site Autopsy crawls up to 20 pages of any website and delivers a full SEO forensics report — live, in a terminal-style interface.

- **Live terminal feed** — every page scanned streams findings in real time: title issues, missing H1s, broken canonicals, OG tags, alt text, noindex flags
- **AI executive summary** — after the scan, NVIDIA Kimi K2.5 or Groq Llama 3.3 generates a 2-sentence summary and your top 3 actionable fixes, ranked by difficulty
- **Deterministic SEO health score** — scored across 5 weighted categories: On-Page, Technical, Content, Social, and Performance. Consistent and reproducible.
- **Internal link graph** — force-directed visualization of how pages connect to each other
- **Site profile tab** — full-page screenshot in a browser chrome overlay, brand colors, fonts, typography scale, tech stack detection, and site personality analysis
- **Check health grid** — per-check-type health status (Title, H1, Alt, Canonical, OG, Robots, and more) with coverage bars across all crawled pages

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 19 |
| Styling | Pure CSS-in-JS — single `styles.js` source of truth, no Tailwind |
| Crawling | Firecrawl API (v1 scrape/map + v2 branding/snapshot) |
| AI summary | Groq Llama 3.3 70B · NVIDIA Kimi K2.5 (202 async polling) |
| Link graph | react-force-graph-2d |
| Tech detection | Custom `techStack.js` — 30+ signatures |
| Background animation | CSS `offset-path` comets on an SVG circuit board |

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/Arunodhai/SiteAutopsy.git
cd SiteAutopsy
npm install
npm run dev
```

Open `http://localhost:5173`

### 2. Get your API keys

Enter keys directly in the app sidebar — they are never stored outside your browser session.

| Key | Where to get it | Purpose |
|---|---|---|
| **Firecrawl** | [firecrawl.dev](https://firecrawl.dev) | Page crawling, HTML extraction, screenshots |
| **Groq** | [console.groq.com](https://console.groq.com) | AI summary via Llama 3.3 70B (free tier) |
| **NVIDIA** *(optional)* | [build.nvidia.com](https://build.nvidia.com) | Alternative AI via Kimi K2.5 |

---

## How a scan works

```
1. mapUrl(target)               → discovers up to 20 pages via Firecrawl map API
2. for each page (sequential):
     scrapeUrl(page)            → HTML + metadata
     runChecks(page)            → Issue[]  streamed live to terminal
3. checkDuplicateTitles()       → cross-page duplicate title detection
4. calculateSeoScore()          → deterministic score across 5 weighted categories
5. Promise.allSettled([
     scrapeBranding(),          → colors, fonts, logo, component styles
     scrapeSnapshot(),          → full-page screenshot + site summary
   ])
6. groqSummary() / kimiSummary() → AI executive summary + top 3 fixes
```

---

## SEO checks

| Check | CRITICAL | WARNING |
|---|---|---|
| `<title>` tag | Missing | < 10 or > 60 chars |
| Meta description | Missing | < 50 or > 160 chars |
| `<h1>` tag | Missing | More than 1 on a page |
| Image alt text | — | Any `<img>` without `alt` |
| Canonical tag | — | Missing |
| OG tags | — | `og:title` or `og:description` missing |
| Duplicate titles | — | Same title across 2+ pages |
| Robots noindex | Page blocked from indexing | — |
| Broken links | Detected broken internal links | — |

---

## Project structure

```
src/
  App.jsx                     ← root state, scan orchestration, all top-level state
  styles.js                   ← ALL CSS as a single exported template literal
  components/
    WelcomePage.jsx            ← landing page with circuit board animation
    CpuArchitecture.jsx        ← SVG circuit board with CSS offset-path comets
    Terminal.jsx               ← center pane: tab bar + live terminal feed
    Sidebar.jsx                ← left sidebar for Live Feed tab
    SnapshotSidebar.jsx        ← left sidebar for Site Profile tab
    ReportPanel.jsx            ← right panel: SEO score ring + issues list + top fixes
    GraphView.jsx              ← force-directed internal link graph
    BrandingView.jsx           ← brand colors, fonts, OG image, tech stack
    SiteProfileView.jsx        ← browser chrome + screenshot + brand strip + identity
    InputPanel.jsx             ← API key inputs + NVIDIA/Groq provider toggle
  lib/
    checks.js                  ← pure SEO check functions → Issue[]
    firecrawl.js               ← mapUrl, scrapeUrl, scrapeBranding, scrapeSnapshot
    groqSummary.js             ← Groq Llama 3.3 AI summary
    kimiSummary.js             ← NVIDIA Kimi K2.5 with 202 async polling (2 min timeout)
    seoScore.js                ← deterministic 5-category weighted scorer
    graphBuilder.js            ← buildGraphData + normaliseUrl
    techStack.js               ← 30+ technology signatures detected from HTML
    brandingExtractor.js       ← colors, fonts, component styles extracted from CSS/HTML
    aggregateIssues.js         ← issue deduplication and aggregation helpers
```

---

## Design system

No UI library, no Tailwind. The entire aesthetic is a **dark hacker terminal**.

```
Font      JetBrains Mono — everywhere, no exceptions
BG        #0a0a0a + radial dot grid (22px)
Orange    #ff6b2b — section labels, large numbers, run button
Green     #22c55e — OK status, complete, passing checks
Red       #ff4444 — CRITICAL issues
Yellow    #f5c542 — WARNING issues
Border    1px solid #1e1e1e — always, no shadows
Radius    max 3px — never above 4px, nearly square corners
```

---

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

---

## License

MIT
