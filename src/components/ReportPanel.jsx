import { useState } from 'react';

const SEV_BADGE = {
  CRITICAL: 'badge-critical',
  WARNING:  'badge-warning',
  INFO:     'badge-info',
  OK:       'badge-ok',
};

const DIFF_CLASS = {
  Easy:   'diff-easy',
  Medium: 'diff-medium',
  Hard:   'diff-hard',
};

// Severity sort order for grouped expanded view
const SEV_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };

const SEV_DIVIDER_COLOR = {
  CRITICAL: '#ff4444',
  WARNING:  '#f5c542',
  INFO:     '#4a9eff',
};

const SEV_DIVIDER_BG = {
  CRITICAL: '#ff444408',
  WARNING:  '#f5c54208',
  INFO:     '#4a9eff08',
};

function TopFixes({ fixes }) {
  return (
    <div>
      <div className="right-label">Top Fixes</div>
      <div className="fixes-list">
        {fixes.map((item, i) => {
          const fix     = typeof item === 'string' ? item : item.fix;
          const diff    = typeof item === 'object' ? item.difficulty : null;
          const diffKey = diff ? diff.toLowerCase() : '';
          return (
            <div key={i} className={`fix-card fix-card-${diffKey}`}>
              <div className="fix-card-header">
                <span className="fix-card-num">{i + 1}</span>
                {diff && <span className={`diff-badge ${DIFF_CLASS[diff] || ''}`}>{diff}</span>}
              </div>
              <div className="fix-card-text">{fix}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 40, cx = 45, cy = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const ringColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f5c542' : '#ff4444';
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle r={r} cx={cx} cy={cy} fill="none" stroke="#1a1a1a" strokeWidth={5} />
      <circle r={r} cx={cx} cy={cy} fill="none" stroke={ringColor} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 45 45)" strokeLinecap="butt" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={ringColor}
        fontSize="16" fontWeight="300" fontFamily="'JetBrains Mono', monospace">
        {score}
      </text>
    </svg>
  );
}

// Mini 20x20 score ring shown inline in each page accordion row
function MiniScoreRing({ score }) {
  const r = 7, cx = 10, cy = 10;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const ringColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f5c542' : '#ff4444';
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <circle r={r} cx={cx} cy={cy} fill="none" stroke="#1e1e1e" strokeWidth={2} />
      <circle
        r={r} cx={cx} cy={cy}
        fill="none"
        stroke={ringColor}
        strokeWidth={2}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 10 10)"
        strokeLinecap="butt"
      />
    </svg>
  );
}

// Severity-grouped expanded body for a page's issues
function GroupedIssueBody({ pageIssues }) {
  const groups = {};
  pageIssues.forEach(issue => {
    const sev = issue.sev === 'OK' ? 'INFO' : issue.sev; // merge OK into INFO visually
    if (!groups[sev]) groups[sev] = [];
    groups[sev].push(issue);
  });

  const orderedSevs = Object.keys(groups).sort(
    (a, b) => (SEV_ORDER[a] ?? 99) - (SEV_ORDER[b] ?? 99)
  );

  return (
    <div style={{ borderTop: '1px solid #1a1a1a' }}>
      {orderedSevs.map(sev => (
        <div key={sev}>
          {/* Severity section divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px 4px',
              background: SEV_DIVIDER_BG[sev] ?? 'transparent',
              borderBottom: `1px solid ${SEV_DIVIDER_COLOR[sev] ?? '#1e1e1e'}18`,
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: SEV_DIVIDER_COLOR[sev] ?? '#555',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {sev}
            </span>
            <span
              style={{
                fontSize: 8,
                color: '#333',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              ({groups[sev].length})
            </span>
          </div>

          {/* Issues in this severity group */}
          {groups[sev].map((issue, j) => (
            <div
              key={j}
              className={`issue-item ${issue.sev.toLowerCase()}`}
              style={{ paddingLeft: 20 }}
            >
              <span className={`badge ${SEV_BADGE[issue.sev] ?? 'badge-info'}`}>
                {issue.sev}
              </span>
              <span className="issue-msg">{issue.msg}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function generatePrintHTML(report, issues, stats, domain) {
  const nonOk = issues.filter(i => i.sev !== 'OK');
  const scoreColor = report.score >= 80 ? '#22c55e' : report.score >= 50 ? '#f5c542' : '#ff4444';
  const fixes = report.top3Fixes || [];

  const diffColors = { Easy: '#166534', Medium: '#854d0e', Hard: '#991b1b' };
  const diffBg    = { Easy: '#dcfce7', Medium: '#fef9c3', Hard: '#fee2e2' };

  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Site Autopsy — ${domain}</title>
<style>
  body{font-family:'Courier New',monospace;background:#fff;color:#111;padding:40px;max-width:820px;margin:0 auto}
  h1{font-size:18px;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:6px}
  h2{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#888;margin:22px 0 10px}
  .meta{font-size:11px;color:#888;margin-bottom:20px}
  .score{font-size:52px;font-weight:300;color:${scoreColor};line-height:1}
  .summary{font-size:12px;line-height:1.7;background:#f5f5f5;padding:12px 16px;border-left:3px solid #111;margin:0}
  .fix{display:flex;align-items:flex-start;gap:10px;margin-bottom:7px;font-size:12px}
  .fix-num{color:#bbb;flex-shrink:0}
  .diff{font-size:9px;font-weight:700;letter-spacing:.1em;padding:2px 6px;border-radius:2px;flex-shrink:0;margin-top:1px}
  .issue{font-size:11px;padding:5px 8px;margin-bottom:3px;border-left:3px solid #ddd;display:flex;gap:8px;align-items:flex-start}
  .issue.critical{border-color:#ff4444}.issue.warning{border-color:#f5c542}
  .sev{font-weight:700;font-size:9px;letter-spacing:.08em;flex-shrink:0;padding-top:1px}
  .sev.critical{color:#ff4444}.sev.warning{color:#f5c542}
  .ipath{color:#aaa;font-size:10px;display:block;margin-top:2px}
  @media print{body{padding:20px}}
</style>
</head><body>
<h1>Site Autopsy — ${domain}</h1>
<div class="meta">Generated ${new Date().toLocaleString()} · ${stats.crawled} pages · ${nonOk.filter(i=>i.sev==='CRITICAL').length} critical · ${nonOk.filter(i=>i.sev==='WARNING').length} warnings</div>
<div class="score">${report.score}<span style="font-size:24px;color:#ccc">/100</span></div>
<h2>Executive Summary</h2>
<div class="summary">${report.executiveSummary}</div>
<h2>Top Fixes</h2>
${fixes.map((item, i) => {
  const fix = typeof item === 'string' ? item : item.fix;
  const diff = typeof item === 'object' ? item.difficulty : null;
  return `<div class="fix"><span class="fix-num">${i+1}.</span>${diff ? `<span class="diff" style="background:${diffBg[diff]};color:${diffColors[diff]}">${diff}</span>` : ''}<span>${fix}</span></div>`;
}).join('')}
<h2>Issues (${nonOk.length})</h2>
${nonOk.map(issue => `<div class="issue ${issue.sev.toLowerCase()}"><span class="sev ${issue.sev.toLowerCase()}">${issue.sev}</span><span>${issue.msg}${issue.path ? `<span class="ipath">${issue.path}</span>` : ''}</span></div>`).join('')}
</body></html>`;
}

export default function ReportPanel({ issues, report, status, domain, stats }) {
  const [expanded, setExpanded] = useState([]);
  const isDone = status === 'done';
  const isRunning = status === 'running';

  const toggle = (path) =>
    setExpanded(p => p.includes(path) ? p.filter(x => x !== path) : [...p, path]);

  // Group non-OK issues by page
  const nonOk = issues.filter(i => i.sev !== 'OK');
  const pageMap = {};
  nonOk.forEach(issue => {
    const key = issue.path || '/';
    if (!pageMap[key]) pageMap[key] = { crits: 0, warnings: 0, issues: [] };
    pageMap[key].issues.push(issue);
    if (issue.sev === 'CRITICAL') pageMap[key].crits++;
    if (issue.sev === 'WARNING') pageMap[key].warnings++;
  });
  const pages = Object.entries(pageMap)
    .sort((a, b) => b[1].crits - a[1].crits || b[1].warnings - a[1].warnings);

  function handleExportJSON() {
    const data = {
      generatedAt: new Date().toISOString(),
      domain,
      score: report?.score,
      executiveSummary: report?.executiveSummary,
      top3Fixes: report?.top3Fixes,
      stats,
      issues: nonOk,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `autopsy-${domain}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleExportPDF() {
    const w = window.open('', '_blank');
    w.document.write(generatePrintHTML(report, issues, stats, domain));
    w.document.close();
    setTimeout(() => w.print(), 400);
  }

  return (
    <div className="right-inner">

      {/* Score */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="right-label" style={{ marginBottom: 0 }}>Health Score</span>
          {isDone && report && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="export-btn" onClick={handleExportJSON}>↓ JSON</button>
              <button className="export-btn" onClick={handleExportPDF}>↓ PDF</button>
            </div>
          )}
        </div>

        {(() => {
          const crits    = issues.filter(i => i.sev === 'CRITICAL').length;
          const warnings = issues.filter(i => i.sev === 'WARNING').length;
          const rawScore = report?.score ?? (isDone && issues.length > 0
            ? Math.max(0, 100 - crits * 15 - warnings * 5)
            : null);

          const scoreColor = rawScore === null ? '#22c55e'
            : rawScore >= 80 ? '#22c55e'
            : rawScore >= 50 ? '#f5c542'
            : '#ff4444';
          const scoreBg = rawScore === null ? '#22c55e11'
            : rawScore >= 80 ? '#22c55e11'
            : rawScore >= 50 ? '#f5c54211'
            : '#ff444411';
          const scoreBorder = rawScore === null ? '#22c55e55'
            : rawScore >= 80 ? '#22c55e55'
            : rawScore >= 50 ? '#f5c54255'
            : '#ff444455';
          const scoreDivider = rawScore === null ? '#22c55e22'
            : rawScore >= 80 ? '#22c55e22'
            : rawScore >= 50 ? '#f5c54222'
            : '#ff444422';
          const summaryColor = rawScore === null ? '#3a5c42'
            : rawScore >= 80 ? '#3a5c42'
            : rawScore >= 50 ? '#7a6a30'
            : '#7a3a3a';

          return rawScore !== null ? (
            <div className="score-box" style={{ borderColor: scoreBorder, background: 'transparent', padding: 0, overflow: 'hidden' }}>
              {/* Coloured top — ring + score */}
              <div style={{ background: scoreBg, padding: 16 }}>
                <div className="score-ring-wrap">
                  <ScoreRing score={rawScore} />
                  <div>
                    <div className="winner-header-label" style={{ color: scoreColor }}>SEO Score{!report ? ' (estimated)' : ''}</div>
                    <div className="winner-value" style={{ color: scoreColor }}>{rawScore}/100</div>
                    <div className="score-meta" style={{ color: summaryColor }}>
                      <span style={{ color: scoreColor }}>{crits}</span> critical &nbsp;·&nbsp;
                      <span style={{ color: scoreColor }}>{warnings}</span> warnings
                    </div>
                  </div>
                </div>
              </div>
              {/* Plain summary below */}
              {report?.executiveSummary && (
                <>
                  <hr className="score-divider" style={{ borderTopColor: scoreDivider, margin: 0 }} />
                  <div style={{ padding: 16, fontSize: 11, color: '#555', lineHeight: 1.7, fontWeight: 300 }}>
                    {report.executiveSummary}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="score-box" style={{ textAlign: 'center', padding: 26 }}>
              {isRunning ? (
                <div style={{ fontSize: 9, color: '#ff6b2b', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Analyzing...
                </div>
              ) : (
                <div style={{ fontSize: 28, fontWeight: 300, color: '#1a1a1a', lineHeight: 1 }}>—</div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Top Fixes — collapsible */}
      {report && (report.top3Fixes || []).length > 0 && (
        <TopFixes fixes={report.top3Fixes} />
      )}

      {/* Issues by page (accordion) */}
      {(pages.length > 0 || isDone) && (
        <div>
          <div className="right-label">
            Issues by Page {pages.length > 0 && `(${pages.length} pages, ${nonOk.length} total)`}
          </div>

          {pages.length === 0 ? (
            <div className="summary-box" style={{ textAlign: 'center', padding: 20 }}>
              <span className="badge badge-winner">No Issues Found</span>
            </div>
          ) : (
            <div className="accordion">
              {pages.map(([path, data]) => {
                const isOpen = expanded.includes(path);

                // Compute per-page mini score
                const pageScore = Math.max(0, 100 - data.crits * 15 - data.warnings * 5);

                return (
                  <div key={path} className="accordion-item">
                    <div className="accordion-header" onClick={() => toggle(path)}>
                      {/* Page path label — truncated if long */}
                      <span className="accordion-path" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {path}
                      </span>

                      {/* Right side: mini ring + severity badges + arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {/* Mini score ring — Change 6 */}
                        <MiniScoreRing score={pageScore} />

                        {data.crits > 0 && (
                          <span className="badge badge-critical">{data.crits}c</span>
                        )}
                        {data.warnings > 0 && (
                          <span className="badge badge-warning">{data.warnings}w</span>
                        )}
                        <span className="accordion-arrow">{isOpen ? '▾' : '▸'}</span>
                      </div>
                    </div>

                    {/* Expanded body — severity-grouped — Change 5 */}
                    {isOpen && (
                      <GroupedIssueBody pageIssues={data.issues} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Idle empty state */}
      {!isRunning && !isDone && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 9, color: '#1e1e1e', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Awaiting scan
          </div>
        </div>
      )}
    </div>
  );
}
