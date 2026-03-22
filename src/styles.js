const styles = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  background: #000000;
  color: #d4d4d4;
}

.app {
  background-color: #000000;
  background-image: radial-gradient(circle, #111111 1px, transparent 1px);
  background-size: 22px 22px;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  height: 57px;
  flex-shrink: 0;
  background: #000000;
  border-bottom: 1px solid #181818;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
}
.header::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,0.012) 2px,
    rgba(255,255,255,0.012) 4px
  );
  pointer-events: none;
}
.header { position: relative; }

.profile-view-scroll::-webkit-scrollbar       { width: 3px; }
.profile-view-scroll::-webkit-scrollbar-track { background: transparent; }
.profile-view-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }

.header-logo {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #ff6b2b;
}
.header-meta {
  font-size: 9px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #333;
}

/* Layout */
.app-layout {
  display: grid;
  grid-template-columns: 280px 1fr 350px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.col-sidebar {
  border-right: 1px solid #181818;
  background: #000000;
  overflow-y: auto;
  overflow-x: hidden;
}
.col-sidebar::-webkit-scrollbar       { width: 3px; }
.col-sidebar::-webkit-scrollbar-track { background: transparent; }
.col-sidebar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
.col-center {
  border-right: 1px solid #181818;
  background: #000000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100vh - 57px);
}
.col-right {
  background: #000000;
  overflow-y: auto;
  overflow-x: hidden;
}
.col-right::-webkit-scrollbar       { width: 3px; }
.col-right::-webkit-scrollbar-track { background: transparent; }
.col-right::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }

/* Dots */
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-green  { background: #22c55e; box-shadow: 0 0 6px #22c55e66; }
.dot-orange { background: #ff6b2b; box-shadow: 0 0 6px #ff6b2b66; }
.dot-dim    { background: #2a2a2a; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.dot-pulse { animation: pulse 2s ease-in-out infinite; }

/* Badges */
.badge {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1px solid;
}
.badge-winner     { background: #22c55e18; color: #22c55e; border-color: #22c55e44; }
.badge-evaluating { background: #ff6b2b18; color: #ff6b2b; border-color: #ff6b2b44; }
.badge-critical   { background: #ff444418; color: #ff4444; border-color: #ff444433; }
.badge-warning    { background: #f5c54218; color: #f5c542; border-color: #f5c54233; }
.badge-info       { background: #4a9eff18; color: #4a9eff; border-color: #4a9eff33; }
.badge-ok         { background: #22c55e11; color: #22c55e99; border-color: #22c55e22; }

/* Inputs */
.text-input {
  background: #0a0a0a;
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  padding: 9px 12px;
  color: #c8c8c8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}
.text-input:focus        { border-color: #333; }
.text-input::placeholder { color: #2a2a2a; }

/* Buttons */
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
  white-space: nowrap;
}
.btn-run:hover:not(:disabled) { background: #ff6b2b28; border-color: #ff6b2b99; }
.btn-run:disabled              { opacity: 0.35; cursor: not-allowed; }
.btn-run.running               { background: #f5c54211; border-color: #f5c54255; color: #f5c542; }
.btn-run.done                  { background: #22c55e11; border-color: #22c55e55; color: #22c55e; }

/* Input Panel (API keys only) */
.input-panel {
  border-bottom: 1px solid #181818;
  flex-shrink: 0;
}
.input-panel-label {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ff6b2b;
  font-weight: 500;
}
.input-group {
  margin-bottom: 10px;
}
.input-group-label {
  font-size: 9px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #444;
  margin-bottom: 5px;
}

/* Sidebar */
.sidebar-inner {
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.sidebar-section-label {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ff6b2b;
  font-weight: 500;
  margin-bottom: 14px;
}
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
.agent-row-left { display: flex; align-items: center; gap: 8px; }
.agent-name { font-size: 12px; color: #d4d4d4; }
.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.time-strike { text-decoration: line-through; color: #333; font-size: 10px; }
.time-value  { color: #ff6b2b; font-size: 13px; font-weight: 500; }

/* Stat cards */
.stat-card {
  background: #050505;
  border: 1px solid #181818;
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
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

/* Quadrant stat layout — cross divider, no outer box */
.stats-quadrant {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.stats-quad-cell {
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.stats-quad-cell:nth-child(1) { border-right: 1px solid #1e1e1e; border-bottom: 1px solid #1e1e1e; }
.stats-quad-cell:nth-child(2) { border-bottom: 1px solid #1e1e1e; padding-left: 16px; }
.stats-quad-cell:nth-child(3) { border-right: 1px solid #1e1e1e; }
.stats-quad-cell:nth-child(4) { padding-left: 16px; }
.stats-quad-val  { font-size: 26px; font-weight: 300; line-height: 1; }
.stats-quad-label { font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: #2e2e2e; }
.stats-quad-val.orange { color: #ff6b2b; }
.stats-quad-val.red    { color: #ff4444; }
.stats-quad-val.yellow { color: #f5c542; }
.stats-quad-val.white  { color: #c8c8c8; }

/* History favicon */
.history-favicon {
  width: 32px; height: 32px;
  border-radius: 3px;
  flex-shrink: 0;
  opacity: 0.9;
  object-fit: contain;
}
.history-favicon-fallback {
  width: 32px; height: 32px;
  border-radius: 3px;
  flex-shrink: 0;
  font-size: 13px;
  color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
  border: 1px solid #1e1e1e;
}

/* Terminal */
.terminal-header {
  padding: 14px 26px;
  border-bottom: 1px solid #181818;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.terminal-header-label {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ff6b2b;
  font-weight: 500;
}
.terminal-header-status {
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #444;
}

/* Chat-style terminal body — content anchors to bottom, but scrollable */
.terminal-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 26px;
  font-size: 11px;
  line-height: 1.85;
}
.terminal-body::-webkit-scrollbar       { width: 3px; }
.terminal-body::-webkit-scrollbar-track { background: transparent; }
.terminal-body::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }

/* Log feed — margin-top: auto anchors it to the bottom when short, scrollable when tall */
.log-feed {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.log-line {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: logIn 0.12s ease;
}
@keyframes logIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.log-time { color: #2e2e2e; min-width: 60px; font-size: 10px; flex-shrink: 0; }
.log-sev  { min-width: 42px; font-size: 9px; font-weight: 600; letter-spacing: 0.08em; flex-shrink: 0; }
.log-msg  { color: #c8c8c8; flex: 1; }
.log-path { color: #363636; font-size: 10px; margin-left: 4px; }

.sev-critical { color: #ff4444; }
.sev-warning  { color: #f5c542; }
.sev-info     { color: #4a9eff; }
.sev-ok       { color: #22c55e99; }
.sev-system   { color: #ff6b2b; }
.sev-url      { color: #3a3a3a; }

.log-system .log-msg { color: #ff6b2b; }

/* URL grouping */
.log-group { margin-bottom: 2px; }

.log-url-parent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: logIn 0.12s ease;
}

/* ● dot — 14px wide so its center (7px) aligns with the connector line */
.log-url-dot {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  font-size: 9px;
  line-height: 1.85;
  color: #4a9eff;
}

.log-url-msg { color: #3a3a3a; flex: 1; }

/* Children container — connector line as ::before */
.log-children {
  position: relative;
  padding-left: 20px;
  margin-bottom: 4px;
}
.log-children::before {
  content: '';
  position: absolute;
  left: 7px;       /* center of the ● dot above */
  top: 0;
  bottom: 0;
  width: 1px;
  background: #1e1e1e;
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.cursor { color: #ff6b2b; animation: blink 1s step-end infinite; }

/* Key warning hints below input bar */
.key-warnings {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.key-warn {
  font-size: 9px;
  letter-spacing: 0.08em;
}
.key-warn-critical { color: #ff4444; }
.key-warn-soft     { color: #555; }

/* Chat input bar — pinned to bottom of center pane */
.chat-input-bar {
  flex-shrink: 0;
  border-top: 1px solid #181818;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #000000;
}
.chat-url-input {
  flex: 1;
  font-size: 12px;
  padding: 10px 14px;
}

/* Right panel */
.right-inner { padding: 22px 18px; display: flex; flex-direction: column; gap: 18px; }
.right-label {
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #444;
  margin-bottom: 14px;
}
.score-box {
  border: 1px solid #22c55e33;
  border-radius: 3px;
  background: #000000;
  padding: 16px;
}
.score-ring-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.winner-header-label {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #22c55e;
  font-weight: 500;
}
.winner-value {
  font-size: 17px;
  font-weight: 400;
  color: #22c55e;
  letter-spacing: 0.04em;
  margin: 8px 0;
}
.score-meta      { font-size: 10px; color: #3a5040; }
.score-meta span { color: #22c55e; font-weight: 500; }
.score-divider   { border: none; border-top: 1px solid #181818; margin: 12px 0; }
.score-meta-row  { display: flex; justify-content: space-between; }

/* Issues list */
.issue-list { display: flex; flex-direction: column; gap: 6px; }
.issue-item {
  border: 1px solid #1a1a1a;
  border-radius: 3px;
  padding: 8px 10px;
  background: #000000;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.issue-item.critical { border-color: #ff444430; }
.issue-item.warning  { border-color: #f5c54228; }
.issue-item.info     { border-color: #4a9eff28; }
.issue-msg  { font-size: 11px; color: #b0b0b0; line-height: 1.5; flex: 1; }
.issue-path { font-size: 9px; color: #333; margin-top: 2px; }

/* AI Summary text block */
.summary-text-block {
  font-size: 11px;
  color: #777;
  line-height: 1.75;
  border-left: 2px solid #1e1e1e;
  padding-left: 10px;
}

/* Top Fixes — card layout */
.fixes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fix-card {
  border: 1px solid #181818;
  border-left-width: 3px;
  border-radius: 3px;
  background: #000000;
  padding: 10px 12px;
}
.fix-card-easy   { border-left-color: #22c55e; }
.fix-card-medium { border-left-color: #f5c542; }
.fix-card-hard   { border-left-color: #ff4444; }
.fix-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.fix-card-num {
  font-size: 9px;
  color: #2a2a2a;
  flex-shrink: 0;
  font-weight: 500;
  letter-spacing: 0.06em;
}
.fix-card-text {
  font-size: 11px;
  color: #888;
  line-height: 1.6;
}

/* Groq summary (legacy — kept for PDF export compat) */
.summary-box {
  border: 1px solid #1a1a1a;
  border-radius: 3px;
  background: #000000;
  padding: 14px;
}
.summary-text  { font-size: 11px; color: #888; line-height: 1.75; margin-bottom: 12px; }
.summary-fixes { display: flex; flex-direction: column; gap: 6px; }
.fix-item {
  font-size: 10px;
  color: #4a9eff;
  line-height: 1.5;
  display: flex;
  gap: 8px;
}
.fix-num { color: #2a2a2a; flex-shrink: 0; }

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 10px;
  padding: 40px;
}
.empty-state-label {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #333;
}
.empty-state-hint { font-size: 10px; color: #2a2a2a; text-align: center; line-height: 1.75; }

/* Terminal empty state — prompt style, anchored to bottom */
.terminal-prompt-state {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
  margin-top: auto;
}
.prompt-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #2a2a2a;
  line-height: 1.85;
  animation: logIn 0.2s ease;
}
.prompt-chevron { color: #ff6b2b; flex-shrink: 0; }

/* History items */
.history-item {
  border: 1px solid #181818;
  border-radius: 3px;
  padding: 10px;
  background: #000000;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.history-item-body {
  flex: 1;
  min-width: 0;
}
.history-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}
.history-domain {
  font-size: 10px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-score {
  font-size: 16px;
  font-weight: 300;
  flex-shrink: 0;
}
.history-score.green  { color: #22c55e; }
.history-score.yellow { color: #f5c542; }
.history-score.red    { color: #ff4444; }
.history-row-meta {
  display: flex;
  align-items: center;
  font-size: 9px;
  color: #333;
}

/* Export buttons */
.export-btn {
  background: #111;
  border: 1px solid #222;
  border-radius: 3px;
  color: #555;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.1em;
  padding: 3px 8px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.export-btn:hover { border-color: #333; color: #888; }

/* Stop button */
.btn-stop {
  background: #ff444418;
  border: 1px solid #ff444455;
  border-radius: 3px;
  color: #ff4444;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 10px 14px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.btn-stop:hover { background: #ff444428; border-color: #ff444499; }

/* Clear history button */
.clear-history-btn {
  background: transparent;
  border: 1px solid #222;
  border-radius: 2px;
  color: #333;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 6px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.clear-history-btn:hover { border-color: #444; color: #666; }

/* .env load button */
.env-load-btn {
  background: transparent;
  border: 1px solid #1e1e1e;
  border-radius: 2px;
  color: #333;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 7px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  white-space: nowrap;
}
.env-load-btn:hover { border-color: #333; color: #555; }

/* LLM provider toggle */
.llm-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  overflow: hidden;
}
.llm-toggle-btn {
  background: transparent;
  border: none;
  border-right: 1px solid #1e1e1e;
  padding: 8px 6px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: background 0.12s;
}
.llm-toggle-btn:last-child { border-right: none; }
.llm-toggle-btn:hover:not(:disabled) { background: #111; }
.llm-toggle-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.llm-toggle-btn.active { background: #ff6b2b14; border-bottom: 1px solid #ff6b2b44; }
.llm-toggle-label {
  font-size: 10px; font-weight: 500; letter-spacing: 0.08em;
  color: #666; text-transform: uppercase;
}
.llm-toggle-btn.active .llm-toggle-label { color: #ff6b2b; }
.llm-toggle-sub {
  font-size: 8px; color: #333; letter-spacing: 0.06em;
}
.llm-toggle-btn.active .llm-toggle-sub { color: #ff6b2b66; }

/* Dynamic URL dot states */
@keyframes dotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
.log-url-dot-active { color: #ff4444 !important; animation: dotPulse 0.7s ease-in-out infinite; }
.log-url-dot-done   { color: #22c55e !important; }

/* Fix difficulty badges */
.diff-badge {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 1px;
}
.diff-easy   { background: #021005; color: #22c55e; }
.diff-medium { background: #100c00; color: #f5c542; }
.diff-hard   { background: #100000; color: #ff4444; }

/* Accordion */
.accordion { display: flex; flex-direction: column; gap: 4px; }
.accordion-item {
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  overflow: hidden;
}
.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  cursor: pointer;
  background: #000000;
  gap: 8px;
  transition: background 0.1s;
}
.accordion-header:hover { background: #0a0a0a; }
.accordion-path {
  font-size: 10px;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.accordion-arrow { font-size: 10px; color: #333; }
.accordion-body {
  border-top: 1px solid #181818;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #000000;
}

/* ─── Tabs ─────────────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid #181818;
  background: #000000;
  flex-shrink: 0;
  padding: 0 20px;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #333;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 13px 14px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}
.tab-btn:hover { color: #666; background: #ffffff04; }
.tab-active { color: #ff6b2b !important; border-bottom-color: #ff6b2b !important; background: #ff6b2b09 !important; }
.tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tab-badge {
  background: #ff6b2b22;
  border: 1px solid #ff6b2b44;
  border-radius: 2px;
  color: #ff6b2b;
  font-size: 8px;
  padding: 0 4px;
  line-height: 14px;
}
.tab-bar-right {
  margin-left: auto;
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #2a2a2a;
}

/* Graph tab body — fills remaining space */
.graph-tab-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

/* ─── Graph ─────────────────────────────────────────────────────────── */
.graph-wrap {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  background: #000000;
  overflow: hidden;
}

/* Stats bar above graph */
.graph-stats-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  background: #00000099;
  border-bottom: 1px solid #181818;
  z-index: 10;
  backdrop-filter: blur(4px);
}
.graph-stat {
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #444;
}
.graph-stat b { font-weight: 600; color: #888; }
.graph-filter-btn {
  margin-left: auto;
  background: transparent;
  border: 1px solid #222;
  border-radius: 2px;
  color: #333;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 8px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.graph-filter-btn:hover   { border-color: #333; color: #666; }
.graph-filter-btn.active  { border-color: #ff4444aa; color: #ff4444; background: #ff444411; }

/* Tooltip */
.graph-tooltip {
  position: absolute;
  background: #050505;
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  padding: 8px 10px;
  min-width: 160px;
  pointer-events: none;
  z-index: 50;
}
.graph-tooltip-path {
  font-size: 11px;
  color: #c8c8c8;
  margin-bottom: 5px;
  word-break: break-all;
}
.graph-tooltip-meta {
  display: flex;
  gap: 10px;
  font-size: 9px;
  color: #555;
  letter-spacing: 0.06em;
}
.graph-tooltip-meta b { color: #888; }
.graph-tooltip-tag {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 5px;
  padding: 1px 5px;
  border: 1px solid;
  border-radius: 2px;
  display: inline-block;
}
.graph-tooltip-tag.red    { color: #ff4444; border-color: #ff444433; }
.graph-tooltip-tag.yellow { color: #f5c542; border-color: #f5c54233; }
.graph-tooltip-tag.orange { color: #ff6b2b; border-color: #ff6b2b33; }

/* Selected node detail panel */
.graph-node-detail {
  position: absolute;
  top: 40px;
  right: 12px;
  background: #050505;
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  padding: 14px;
  width: 200px;
  z-index: 20;
  animation: logIn 0.15s ease;
}
.graph-node-detail-path {
  font-size: 11px;
  color: #c8c8c8;
  margin-bottom: 2px;
  word-break: break-all;
}
.graph-node-detail-url {
  font-size: 9px;
  color: #2a2a2a;
  margin-bottom: 10px;
  word-break: break-all;
}
.graph-node-detail-metrics {
  display: flex;
  gap: 0;
  border: 1px solid #181818;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}
.graph-node-metric {
  flex: 1;
  padding: 8px 6px;
  text-align: center;
  border-right: 1px solid #181818;
}
.graph-node-metric:last-child { border-right: none; }
.graph-node-metric-val {
  font-size: 16px;
  font-weight: 300;
  line-height: 1;
  margin-bottom: 3px;
}
.graph-node-metric-label {
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #333;
}
.graph-node-tag {
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 2px;
  padding: 2px 6px;
  margin-bottom: 4px;
}
.graph-node-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  color: #333;
  font-size: 11px;
  cursor: pointer;
  line-height: 1;
  padding: 2px;
  transition: color 0.15s;
}
.graph-node-close:hover { color: #888; }

/* Legend */
.graph-legend {
  position: absolute;
  bottom: 14px;
  left: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 10;
}
.graph-legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
}
.graph-legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.graph-legend-label {
  font-size: 9px;
  letter-spacing: 0.08em;
  color: #444;
}

/* Insights bar */
.graph-insight-bar {
  position: absolute;
  bottom: 14px;
  left: 120px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
  max-width: 360px;
}
.graph-insight-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #00000099;
  border: 1px solid #1a1a1a;
  border-left-width: 2px;
  border-radius: 2px;
  padding: 5px 8px;
  backdrop-filter: blur(4px);
}
.graph-insight-sev {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
  flex-shrink: 0;
  padding-top: 1px;
}
.graph-insight-msg {
  font-size: 10px;
  color: #666;
  line-height: 1.5;
}

/* Graph placeholder / loading */
.graph-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 10px;
}
.graph-loading-msg {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #ff6b2b;
  animation: pulse 1.5s ease-in-out infinite;
}
.graph-loading-sub {
  font-size: 9px;
  color: #2a2a2a;
  letter-spacing: 0.1em;
}

/* Progress bar */
.progress-bar-wrap {
  height: 2px;
  background: #1a1a1a;
  border-radius: 1px;
  overflow: hidden;
  margin-top: 8px;
}
.progress-bar-fill {
  height: 100%;
  background: #ff6b2b;
  transition: width 0.3s ease;
  border-radius: 1px;
}

/* ── Branding tab ─────────────────────────────────────── */
.branding-tab-body {
  flex: 1;
  min-height: 0;
}
.branding-view {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.branding-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Section */
.brand-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.brand-section-label {
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #444;
  font-weight: 500;
}

/* Hero */
.brand-hero {
  position: relative;
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  overflow: hidden;
  height: 110px;
  background: #0d0d0d;
}
.brand-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(14px) brightness(0.25);
  transform: scale(1.1);
}
.brand-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.7) 40%, transparent);
}
.brand-hero-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}
.brand-hero-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.brand-logo-box {
  width: 64px;
  height: 64px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.brand-logo-box-sm {
  width: 44px;
  height: 44px;
}
.brand-logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.brand-hero-domain {
  font-size: 16px;
  font-weight: 300;
  color: #d4d4d4;
  letter-spacing: 0.02em;
}
.brand-hero-sub {
  font-size: 9px;
  color: #444;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 4px;
}
.brand-hero-favicon {
  width: 20px;
  height: 20px;
  opacity: 0.6;
  image-rendering: pixelated;
}

/* Palette strip */
.brand-palette-strip {
  display: flex;
  height: 52px;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid #1e1e1e;
}
.brand-palette-cell {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 0 0 5px 5px;
  overflow: hidden;
  cursor: default;
  transition: flex 0.2s ease;
}
.brand-palette-cell:hover {
  flex: 2;
}
.brand-palette-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.15s;
}
.brand-palette-cell:hover .brand-palette-info {
  opacity: 1;
}
.brand-palette-hex {
  font-size: 8px;
  color: #ffffffcc;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}
.brand-palette-role {
  font-size: 7px;
  color: #ffffff88;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Bottom grid */
.brand-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

/* Font cards */
.brand-fonts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.brand-font-card {
  background: #0d0d0d;
  border: 1px solid #1a1a1a;
  border-radius: 3px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.brand-font-preview {
  font-size: 15px;
  font-weight: 400;
  color: #c8c8c8;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-font-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.brand-font-sample {
  font-size: 11px;
  color: #444;
}
.brand-font-role {
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #333;
}

/* Identity card */
.brand-identity-card {
  background: #0d0d0d;
  border: 1px solid #1a1a1a;
  border-radius: 3px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.brand-id-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-id-label {
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #444;
  width: 36px;
  flex-shrink: 0;
}
.brand-id-bar {
  flex: 1;
  height: 3px;
  background: #1a1a1a;
  border-radius: 2px;
  overflow: hidden;
}
.brand-id-bar-fill {
  display: block;
  height: 100%;
  background: #ff6b2b44;
  border-radius: 2px;
}
.brand-id-val {
  font-size: 10px;
  color: #ff6b2b;
  min-width: 64px;
  text-align: right;
  flex-shrink: 0;
}
.brand-id-divider {
  height: 1px;
  background: #1a1a1a;
  margin: 2px 0;
}
.brand-radius-demo {
  width: 20px;
  height: 20px;
  border: 1px solid #333;
  background: #1a1a1a;
  flex-shrink: 0;
}

/* OG thumbnail */
.brand-og-thumb-wrap {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 4px;
}
.brand-og-label {
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #333;
}
.brand-og-thumb {
  width: 100%;
  border-radius: 3px;
  border: 1px solid #1a1a1a;
  object-fit: cover;
  max-height: 120px;
}

/* ── Snapshot tab ── */
.snapshot-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.snapshot-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.snapshot-browser-chrome {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #0c0c0c;
  border-bottom: 1px solid #1a1a1a;
  flex-shrink: 0;
}
.snapshot-traffic-lights {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
.snapshot-tl {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.snapshot-tl-red    { background: #ff5f57; }
.snapshot-tl-yellow { background: #febc2e; }
.snapshot-tl-green  { background: #28c840; }
.snapshot-address-bar {
  flex: 1;
  background: #111;
  border: 1px solid #1e1e1e;
  border-radius: 3px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}
.snapshot-lock { font-size: 9px; flex-shrink: 0; }
.snapshot-address-text {
  font-size: 10px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Screenshot — takes remaining space after summary, scrollable inside */
.snapshot-screen {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  scrollbar-width: thin;
  scrollbar-color: #2a2a2a transparent;
}
.snapshot-screen::-webkit-scrollbar { width: 3px; }
.snapshot-screen::-webkit-scrollbar-track { background: transparent; }
.snapshot-screen::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
.snapshot-img {
  width: 100%;
  display: block;
}
.snapshot-screen-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #0a0a0a;
}
/* Summary block — natural height, pushes screenshot up */
.snapshot-summary-block {
  padding: 18px 20px;
  border-top: 1px solid #1a1a1a;
  flex-shrink: 0;
}

.snapshot-panel-label {
  font-size: 8px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #ff6b2b;
  margin-bottom: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Tech badges */
.snapshot-tech-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 7px;
  border-radius: 2px;
  border: 1px solid;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.snapshot-tech-badge:last-child { margin-bottom: 0; }
.snapshot-tech-cat {
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.6;
}

/* Signals */
.snapshot-signal-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  padding: 2px 0;
}
.snapshot-signal-icon {
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
  width: 12px;
}
.snapshot-signal-label {
  color: #666;
  flex: 1;
}
.snapshot-signal-val {
  font-size: 8px;
  color: #ff4444;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ── Feed filter bar ───────────────────────────────────── */
.feed-filter-bar {
  display: flex;
  gap: 4px;
  padding: 8px 20px;
  border-bottom: 1px solid #181818;
  flex-shrink: 0;
  background: #000000;
}
.feed-filter-btn {
  background: transparent;
  border: 1px solid #1a1a1a;
  border-radius: 2px;
  color: #2a2a2a;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 7px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.feed-filter-btn:hover { border-color: #2a2a2a; color: #555; }
.feed-filter-btn.active { border-color: #ff6b2b55; color: #ff6b2b; background: #ff6b2b0a; }
.feed-filter-count { font-size: 8px; color: inherit; opacity: 0.7; }

/* ── Sidebar URL section ────────────────────────────────── */
.sidebar-url-section {
  padding: 14px 16px 12px;
  border-bottom: 1px solid #181818;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Sidebar vertical nav ───────────────────────────────── */
.sidebar-nav {
  border-bottom: 1px solid #181818;
  flex-shrink: 0;
}
.sidebar-nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  padding: 9px 16px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  transition: background 0.1s, border-color 0.1s;
}
.sidebar-nav-btn:hover { background: #080808; }
.sidebar-nav-btn.active { border-left-color: #ff6b2b; background: #ff6b2b08; }
.sidebar-nav-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #333;
  flex: 1;
  text-align: left;
}
.sidebar-nav-btn.active .sidebar-nav-label { color: #ff6b2b; }
.sidebar-nav-shortcut { font-size: 9px; color: #1e1e1e; letter-spacing: 0.06em; }
.sidebar-nav-btn.active .sidebar-nav-shortcut { color: #ff6b2b44; }
.sidebar-nav-count {
  font-size: 9px;
  color: #2a2a2a;
  letter-spacing: 0.04em;
}

/* ── Site Profile panel — branding + snapshot split ─────── */
.profile-split {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.profile-split-left {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid #181818;
  min-width: 0;
}
.profile-split-left::-webkit-scrollbar       { width: 3px; }
.profile-split-left::-webkit-scrollbar-track { background: transparent; }
.profile-split-left::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
.profile-split-right {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── Input panel collapsible ────────────────────────────── */
.input-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 14px 16px;
  transition: background 0.1s;
}
.input-panel-header:hover { background: #080808; }
.input-panel-body {
  padding: 0 16px 14px;
}
`;

export default styles;
