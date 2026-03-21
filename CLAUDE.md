# Site Autopsy — Claude Code Instructions

A real-time SEO forensics tool. Crawls a website using Firecrawl, streams live findings to a terminal UI, and generates an AI-powered summary using Groq.

---

## Stack

- Vite + React (no TypeScript needed)
- `@mendable/firecrawl-js` — crawling
- `groq-sdk` — final AI summary
- No UI library, no Tailwind — pure CSS-in-JS

```bash
npm create vite@latest site-autopsy -- --template react
cd site-autopsy
npm install @mendable/firecrawl-js groq-sdk
npm run dev
```

---

## Project Structure

```
src/
  App.jsx            ← root, holds all state
  components/
    InputPanel.jsx   ← URL + API key inputs + RUN button
    Terminal.jsx     ← live streaming log feed
    Sidebar.jsx      ← left stats (pages crawled, issues found, etc.)
    ReportPanel.jsx  ← right panel, score ring + issue list + Groq summary
  lib/
    checks.js        ← pure SEO check functions (no API)
    groqSummary.js   ← Groq API call for final summary
  styles.js          ← all CSS as template literal (single source of truth)
```

---

## ═══════════════════════════════════════════
## AESTHETICS BIBLE — match this exactly
## ═══════════════════════════════════════════

This is the most important section. The entire app must look like a dark hacker terminal — dark panels, monospace font everywhere, orange accents, green status indicators, glowing dots. Every rule below is intentional and non-negotiable.

---

### Font

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');

font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

Use JetBrains Mono for **everything** — labels, inputs, buttons, body text, numbers. No exceptions. No system fonts anywhere.

---

### Color Palette

```js
// Primary accents
const ORANGE  = '#ff6b2b'   // section labels, large numbers, system logs, run button
const GREEN   = '#22c55e'   // OK status, COMPLETE, winner box, active dots
const RED     = '#ff4444'   // CRITICAL issues, diff removals
const YELLOW  = '#f5c542'   // WARNING issues
const BLUE    = '#4a9eff'   // INFO issues

// Text hierarchy
const TEXT_PRIMARY   = '#d4d4d4'  // agent names, message content, main text
const TEXT_SECONDARY = '#888888'  // sub-labels, captions, timestamps
const TEXT_DIM       = '#555555'  // tertiary text, paths, hints
const TEXT_GHOST     = '#2e2e2e'  // barely visible — timestamps, strikethrough

// Backgrounds — depth through darkness only, never shadows
const BG_PAGE    = '#0a0a0a'  // outermost page background + dot grid
const BG_APP     = '#0d0d0d'  // app wrapper
const BG_HEADER  = '#080808'  // header bar — darkest surface
const BG_SURFACE = '#0e0e0e'  // panel backgrounds (sidebar, center, right)
const BG_CARD    = '#111111'  // message cards, input fields
const BG_INSET   = '#0c0c0c'  // inset elements inside cards

// Semantic tinted backgrounds — very subtle, just a hint of color
const BG_GREEN  = '#0d150e'  // winner/OK box tint
const BG_ORANGE = '#150f0a'  // evaluating/warning box tint
const BG_RED    = '#150a0a'  // critical issue box tint

// Borders — always the same weight
const BORDER     = '#1e1e1e'  // default border everywhere
const BORDER_MID = '#2a2a2a'  // hover state border
const BORDER_LIT = '#333333'  // focused input border
```

---

### Background Texture

Apply to the outermost `.app` wrapper — this dot grid is the signature of the design:

```css
.app {
  background-color: #0a0a0a;
  background-image: radial-gradient(circle, #1c1c1c 1px, transparent 1px);
  background-size: 22px 22px;
  min-height: 100vh;
}
```

Do not skip this. It's what makes the background feel like a PCB or terminal grid.

---

### Borders

- **Always `1px solid #1e1e1e`** — never 0.5px, never 2px
- Winner/consensus box: `1px solid #22c55e33` (green, very transparent)
- Evaluating/warning box: `1px solid #ff6b2b33` (orange, very transparent)
- No `box-shadow` anywhere — depth comes only from background color differences between panels
- Dividers between columns: `1px solid #1e1e1e`

---

### Border Radius

```
3px  — cards, inputs, buttons, panels
2px  — badges, tags
50%  — dots and avatars only
```

**Never use border-radius above 4px.** No 8px, no 12px, no rounded-lg. The design has nearly square corners everywhere.

---

### Typography Scale

```css
/* Section label — orange, tiny, all-caps, heavily tracked */
font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: #ff6b2b; font-weight: 500;

/* Sub-label — dim, tiny, all-caps */
font-size: 9px; letter-spacing: 0.13em; text-transform: uppercase; color: #555; font-weight: 400;

/* Agent / item names */
font-size: 12px; color: #d4d4d4; font-weight: 400;

/* Status (COMPLETE, RUNNING) */
font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500;

/* Large accent number e.g. "3" */
font-size: 28px; font-weight: 300; color: #ff6b2b; line-height: 1;

/* Message body text */
font-size: 12px; color: #b0b0b0; line-height: 1.65;

/* Timestamps, paths, meta */
font-size: 10px; color: #444;

/* Terminal log lines */
font-size: 11px; line-height: 1.85;
```

---

### Status Dots

```css
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-green  { background: #22c55e; box-shadow: 0 0 6px #22c55e66; }
.dot-orange { background: #ff6b2b; box-shadow: 0 0 6px #ff6b2b66; }
.dot-dim    { background: #2a2a2a; /* no glow for inactive */ }

/* Active/running state */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
.dot-pulse { animation: pulse 2s ease-in-out infinite; }
```

---

### Badges

```css
.badge {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1px solid;
}
.badge-winner    { background: #22c55e18; color: #22c55e; border-color: #22c55e44; }
.badge-evaluating{ background: #ff6b2b18; color: #ff6b2b; border-color: #ff6b2b44; }
.badge-critical  { background: #ff444418; color: #ff4444; border-color: #ff444433; }
.badge-warning   { background: #f5c54218; color: #f5c542; border-color: #f5c54233; }
.badge-info      { background: #4a9eff18; color: #4a9eff; border-color: #4a9eff33; }
.badge-ok        { background: #22c55e11; color: #22c55e99; border-color: #22c55e22; }
```

---

### Inputs

```css
.text-input {
  background: #0a0a0a;       /* darker than surface — creates inset feel */
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  padding: 9px 12px;
  color: #c8c8c8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  outline: none;
  transition: border-color 0.15s;
}
.text-input:focus       { border-color: #333; }   /* subtle, no glow ring */
.text-input::placeholder { color: #2a2a2a; }      /* very dim */
```

---

### Buttons

```css
/* Primary — orange outlined */
.btn-run {
  width: 100%;
  background: #ff6b2b18;
  border: 1px solid #ff6b2b55;
  border-radius: 3px;
  color: #ff6b2b;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.btn-run:hover:not(:disabled) { background: #ff6b2b28; border-color: #ff6b2b99; }
.btn-run:disabled              { opacity: 0.35; cursor: not-allowed; }
.btn-run.running               { background: #f5c54211; border-color: #f5c54255; color: #f5c542; }
.btn-run.done                  { background: #22c55e11; border-color: #22c55e55; color: #22c55e; }
```

---

### Layout — 3-column grid

```css
.app-layout {
  display: grid;
  grid-template-columns: 210px 1fr 320px;
  min-height: calc(100vh - 57px);
}
.col-sidebar { border-right: 1px solid #1e1e1e; background: #0e0e0e; }
.col-center  { border-right: 1px solid #1e1e1e; background: #0e0e0e; display: flex; flex-direction: column; }
.col-right   { background: #0e0e0e; }
```

Header bar (top, full width):
```css
.header {
  height: 57px;
  background: #080808;
  border-bottom: 1px solid #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
}
```

---

### Sidebar internals

```css
.sidebar-inner {
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Agent row */
.agent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  margin-bottom: 9px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.agent-row:hover { opacity: 0.65; }

/* Time row */
.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.time-strike { text-decoration: line-through; color: #333; font-size: 10px; }
.time-value  { color: #ff6b2b; font-size: 13px; font-weight: 500; }
```

---

### Terminal feed

```css
.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 26px;
  font-size: 11px;
  line-height: 1.85;
  min-height: 0;
}
.terminal-body::-webkit-scrollbar       { width: 3px; }
.terminal-body::-webkit-scrollbar-track { background: transparent; }
.terminal-body::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }

/* Each log line */
.log-line {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: logIn 0.12s ease;
}
@keyframes logIn {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0); }
}

.log-time { color: #2e2e2e; min-width: 60px; font-size: 10px; flex-shrink: 0; }
.log-sev  { min-width: 42px; font-size: 9px; font-weight: 600; letter-spacing: 0.08em; flex-shrink: 0; }
.log-msg  { color: #c8c8c8; flex: 1; }
.log-path { color: #363636; font-size: 10px; margin-left: 4px; }

/* Severity colors on .log-sev */
.sev-critical { color: #ff4444; }
.sev-warning  { color: #f5c542; }
.sev-info     { color: #4a9eff; }
.sev-ok       { color: #22c55e99; }
.sev-system   { color: #ff6b2b; }
.sev-url      { color: #3a3a3a; }

/* System message makes entire line orange */
.log-system .log-msg { color: #ff6b2b; }
/* URL scan line — dim */
.log-url .log-msg    { color: #3a3a3a; }

/* Blinking cursor */
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.cursor { color: #ff6b2b; animation: blink 1s step-end infinite; }
```

Auto-scroll terminal on every new log entry:
```js
useEffect(() => {
  if (terminalRef.current) {
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }
}, [logs]);
```

---

### Message cards (if used in terminal area)

```css
.msg-card {
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  padding: 14px 16px;
  background: #0d0d0d;
  margin-bottom: 10px;
}
.msg-card.winner     { border-color: #22c55e22; background: #0d150e; }
.msg-card.evaluating { border-color: #ff6b2b22; background: #150f0a; }
.msg-card.critical   { border-color: #ff444422; background: #150a0a; }
```

---

### Right panel — report

```css
.right-inner { padding: 26px 20px; display: flex; flex-direction: column; gap: 22px; }

.right-label {
  font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
  color: #444; margin-bottom: 14px;
}

/* Score / winner box */
.score-box {
  border: 1px solid #22c55e33;
  border-radius: 3px;
  background: #0d150e;
  padding: 16px;
}
.winner-header-label {
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: #22c55e; font-weight: 500;
}
.winner-value {
  font-size: 17px; font-weight: 400; color: #22c55e;
  letter-spacing: 0.04em; margin: 8px 0;
}
.score-meta       { font-size: 10px; color: #3a6647; }
.score-meta span  { color: #22c55e; font-weight: 500; }
.score-divider    { border: none; border-top: 1px solid #1a2e1e; margin: 12px 0; }
.score-meta-row   { display: flex; justify-content: space-between; }
```

SVG score ring:
```jsx
// r=40, cx=cy=45, viewBox="0 0 90 90"
const circ = 2 * Math.PI * 40;
const offset = circ - (score / 100) * circ;
const ringColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f5c542' : '#ff4444';
// <circle r=40 cx=45 cy=45 fill="none" stroke={ringColor} strokeWidth=5
//   strokeDasharray={circ} strokeDashoffset={offset}
//   transform="rotate(-90 45 45)" strokeLinecap="butt" />
```

Diff block:
```css
.diff-row     { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 5px; }
.diff-name    { color: #444; }
.diff-add     { color: #22c55e; font-weight: 500; }
.diff-rem     { color: #ff4444; font-weight: 500; }
.diff-summary {
  font-size: 10px; color: #333;
  border-top: 1px solid #1a1a1a;
  padding-top: 8px; margin-top: 8px;
  display: flex; justify-content: space-between;
}
```

---

### Stat cards

```css
.stat-card {
  background: #0d0d0d;
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  padding: 12px 14px;
}
.stat-label { font-size: 8px; letter-spacing: 0.13em; text-transform: uppercase; color: #444; margin-bottom: 6px; }
.stat-val   { font-size: 22px; font-weight: 300; line-height: 1; }
.stat-val.orange { color: #ff6b2b; }
.stat-val.green  { color: #22c55e; }
.stat-val.red    { color: #ff4444; }
.stat-val.yellow { color: #f5c542; }
.stat-val.white  { color: #c8c8c8; }
```

---

### Bottom feature strip

```css
.feature-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid #1a1a1a;
}
.feature-card { padding: 26px 32px; border-right: 1px solid #1a1a1a; }
.feature-card:last-child { border-right: none; }
.feature-title {
  font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
  color: #c8c8c8; font-weight: 500; margin-bottom: 12px;
}
.feature-body { font-size: 11px; color: #444; line-height: 1.8; font-weight: 300; }
```

---

### Avatars

```css
.avatar {
  width: 26px; height: 26px; border-radius: 50%;
  border: 1px solid #2a2a2a; background: #141414;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; color: #555; flex-shrink: 0;
}
```

---

### Hard DON'Ts — things that will break the aesthetic

```
❌ border-radius above 4px
❌ box-shadow for elevation — use bg color differences only
❌ gradients anywhere
❌ white or light backgrounds
❌ Inter, Roboto, system-ui, or any sans-serif font
❌ hover states that fill with color — hover only brightens the border
❌ animations other than: dot pulse, cursor blink, log line fade-in
❌ padding above 32px
❌ font sizes above 28px (only the accent number)
❌ colored backgrounds except the subtle tinted card variants listed above
❌ glow effects except on the status dots
```

---

## Core Flow

```
1. User enters: target URL, Firecrawl API key, Groq API key
2. Click RUN AUTOPSY
3. firecrawl.mapUrl(url)      → get all page URLs, limit to 20
4. For each URL (sequential):
     firecrawl.scrapeUrl(url, { formats: ['html', 'metadata'] })
     → runChecks(url, metadata, html)
     → push each finding to terminal log immediately
     → update sidebar counters live
5. After all pages done:
     → groqSummary(allIssues, domain)
     → render final score + top fixes
```

---

## SEO Checks — `src/lib/checks.js`

```js
// runChecks(url, metadata, html) → Issue[]
// Issue: { sev: 'CRITICAL'|'WARNING'|'INFO'|'OK', msg: String, path: String }
```

| Check | CRITICAL | WARNING | OK |
|---|---|---|---|
| `<title>` | missing | <10 or >60 chars | good length |
| Meta description | missing | <50 or >160 chars | good length |
| `<h1>` | missing | more than 1 | exactly 1 |
| Images alt text | — | any `<img>` missing `alt=` | all present |
| Canonical tag | — | missing | present |
| OG tags | — | og:title or og:desc missing | both present |

After all pages: check for **duplicate titles** across pages → flag each as WARNING.

---

## Groq Summary — `src/lib/groqSummary.js`

```js
import Groq from 'groq-sdk';

export async function groqSummary(issues, domain, apiKey) {
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  const res = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You are an SEO analyst. Issues found on ${domain}:
${JSON.stringify(issues, null, 2)}

Respond ONLY with valid JSON, no markdown:
{
  "executiveSummary": "2 sentence summary",
  "top3Fixes": ["fix 1", "fix 2", "fix 3"],
  "score": <0-100>
}
Score: 100 minus 15 per CRITICAL, 5 per WARNING.`
    }]
  });
  return JSON.parse(res.choices[0].message.content);
}
```

---

## State Shape

```js
const [url, setUrl]         = useState('')
const [fcKey, setFcKey]     = useState('')
const [groqKey, setGroqKey] = useState('')
const [status, setStatus]   = useState('idle')   // idle | running | done | error
const [logs, setLogs]       = useState([])
const [issues, setIssues]   = useState([])
const [stats, setStats]     = useState({ crawled: 0, total: 0, crits: 0, warnings: 0 })
const [report, setReport]   = useState(null)

const pushLog = (sev, msg, path = '') =>
  setLogs(prev => [...prev, {
    sev, msg, path,
    time: new Date().toLocaleTimeString('en-GB', { hour12: false })
  }]);
```

---

## Run Function

```js
async function runAutopsy() {
  setStatus('running');
  setLogs([]); setIssues([]); setReport(null);
  setStats({ crawled: 0, total: 0, crits: 0, warnings: 0 });

  const fc = new FirecrawlApp({ apiKey: fcKey });
  const domain = new URL(url).hostname;

  pushLog('SYSTEM', `Initializing autopsy on ${domain}`);

  const mapRes = await fc.mapUrl(url);
  const urls = (mapRes.links || [url]).slice(0, 20);
  pushLog('SYSTEM', `Discovered ${urls.length} pages — beginning scan`);
  setStats(s => ({ ...s, total: urls.length }));

  const allIssues = [];

  for (const pageUrl of urls) {
    const path = (() => { try { return new URL(pageUrl).pathname; } catch { return pageUrl; } })();
    pushLog('URL', `Scanning ${path}`);

    try {
      const res = await fc.scrapeUrl(pageUrl, { formats: ['html', 'metadata'] });
      const found = runChecks(pageUrl, res.metadata, res.html);
      found.forEach(issue => {
        allIssues.push(issue);
        if (issue.sev !== 'OK') pushLog(issue.sev, issue.msg, path);
      });
      if (!found.some(i => i.sev === 'CRITICAL' || i.sev === 'WARNING')) {
        pushLog('OK', 'No issues found', path);
      }
    } catch {
      pushLog('WARNING', 'Scrape failed — skipping', path);
    }

    setIssues([...allIssues]);
    setStats(s => ({
      ...s,
      crawled: s.crawled + 1,
      crits: allIssues.filter(i => i.sev === 'CRITICAL').length,
      warnings: allIssues.filter(i => i.sev === 'WARNING').length,
    }));
  }

  pushLog('SYSTEM', 'Generating AI summary...');
  try {
    const summary = await groqSummary(allIssues, domain, groqKey);
    setReport(summary);
    pushLog('SYSTEM', `Autopsy complete — health score: ${summary.score}/100`);
  } catch {
    pushLog('WARNING', 'Groq summary failed — showing raw results');
  }

  setStatus('done');
}
```

---

## Important Notes

- `dangerouslyAllowBrowser: true` required on both Firecrawl and Groq clients
- Auto-scroll terminal: `useEffect(() => { ref.current.scrollTop = ref.current.scrollHeight }, [logs])`
- API keys in state only — never hardcode
- If `mapUrl` fails, fall back to scraping root URL only
- All CSS in `src/styles.js` as one exported template string, injected via `<style>` tag in App.jsx
- Push log entries inside the loop one at a time — never batch. The live stream effect is the whole UX.
