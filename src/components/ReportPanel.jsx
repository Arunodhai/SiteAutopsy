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
          return rawScore !== null ? (
            <div className="score-box">
              <div className="score-ring-wrap">
                <ScoreRing score={rawScore} />
                <div>
                  <div className="winner-header-label">SEO Score{!report ? ' (estimated)' : ''}</div>
                  <div className="winner-value">{rawScore}/100</div>
                  <div className="score-meta">
                    <span>{crits}</span> critical &nbsp;·&nbsp;
                    <span>{warnings}</span> warnings
                  </div>
                </div>
              </div>
              <hr className="score-divider" />
              <div className="score-meta-row">
                <span className="score-meta">Pages scanned</span>
                <span className="score-meta"><span>{stats.crawled}</span></span>
              </div>
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

      {/* AI Summary */}
      {report && (
        <div>
          <div className="right-label">AI Summary</div>
          <div className="summary-text-block">{report.executiveSummary}</div>
        </div>
      )}

      {/* Top Fixes — card layout */}
      {report && (report.top3Fixes || []).length > 0 && (
        <div>
          <div className="right-label">Top Fixes</div>
          <div className="fixes-list">
            {(report.top3Fixes || []).map((item, i) => {
              const fix = typeof item === 'string' ? item : item.fix;
              const diff = typeof item === 'object' ? item.difficulty : null;
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
                return (
                  <div key={path} className="accordion-item">
                    <div className="accordion-header" onClick={() => toggle(path)}>
                      <span className="accordion-path">{path}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {data.crits > 0 && (
                          <span className="badge badge-critical">{data.crits}c</span>
                        )}
                        {data.warnings > 0 && (
                          <span className="badge badge-warning">{data.warnings}w</span>
                        )}
                        <span className="accordion-arrow">{isOpen ? '▾' : '▸'}</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="accordion-body">
                        {data.issues.map((issue, j) => (
                          <div key={j} className={`issue-item ${issue.sev.toLowerCase()}`}>
                            <span className={`badge ${SEV_BADGE[issue.sev]}`}>{issue.sev}</span>
                            <span className="issue-msg">{issue.msg}</span>
                          </div>
                        ))}
                      </div>
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
