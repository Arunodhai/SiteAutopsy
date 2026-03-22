import { useState } from 'react';
import { detectTechStack } from '../lib/techStack.js';

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

function ScoreBar({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f5c542' : '#ff4444';
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div style={{ marginTop: 12 }}>
      {/* Three-zone track — dim segments */}
      <div style={{ position: 'relative', height: 3, display: 'flex', borderRadius: 1, overflow: 'visible' }}>
        <div style={{ width: '50%', height: '100%', background: '#ff444418', borderRadius: '1px 0 0 1px' }} />
        <div style={{ width: '30%', height: '100%', background: '#f5c54218' }} />
        <div style={{ width: '20%', height: '100%', background: '#22c55e18', borderRadius: '0 1px 1px 0' }} />
        {/* Solid fill overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${pct}%`, borderRadius: 1,
          background: color, opacity: 0.85,
          transition: 'width 0.5s ease',
        }} />
        {/* Marker */}
        <div style={{
          position: 'absolute', top: -4, left: `${pct}%`,
          transform: 'translateX(-50%)',
          width: 1, height: 11,
          background: color,
        }} />
      </div>
      {/* Tick labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 7, color: '#ff444444', letterSpacing: '0.06em' }}>0</span>
        <span style={{ fontSize: 7, color: '#2a2a2a', letterSpacing: '0.06em' }}>50</span>
        <span style={{ fontSize: 7, color: '#22c55e44', letterSpacing: '0.06em' }}>100</span>
      </div>
    </div>
  );
}

const CATEGORY_LABELS = {
  onPage:      { label: 'On-Page SEO',   weight: 35 },
  technical:   { label: 'Technical SEO',  weight: 25 },
  content:     { label: 'Content',        weight: 20 },
  social:      { label: 'Social',         weight: 10 },
  performance: { label: 'Performance',    weight: 10 },
};

function ScoreBreakdown({ breakdown }) {
  if (!breakdown) return null;
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1a1a1a' }}>
      <div style={{ fontSize: 8, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
        Score Breakdown
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(CATEGORY_LABELS).map(([key, { label, weight }]) => {
          const cat = breakdown[key];
          if (!cat) return null;
          const score = cat.score;
          const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f5c542' : '#ff4444';
          const weighted = Math.round(score * (weight / 100));
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.04em' }}>
                  {label}
                  <span style={{ color: '#333', marginLeft: 4, fontSize: 8 }}>{weight}%</span>
                </span>
                <span style={{ fontSize: 9, color, fontWeight: 500 }}>
                  {score}
                  <span style={{ color: '#333', marginLeft: 4, fontSize: 8 }}>+{weighted}pts</span>
                </span>
              </div>
              <div style={{ height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 1, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Issue heatmap — one square per page, colored by worst severity
function IssueHeatmap({ pageMap, totalPages }) {
  const entries = Object.values(pageMap);
  // Pad to totalPages if we have more crawled than issue-pages
  return (
    <div>
      <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
        Page Health Map
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {entries.map((data, i) => {
          const color = data.crits > 0 ? '#ff4444' : data.warnings > 0 ? '#f5c542' : '#22c55e';
          const bg    = data.crits > 0 ? '#ff444420' : data.warnings > 0 ? '#f5c54220' : '#22c55e20';
          const border= data.crits > 0 ? '#ff444444' : data.warnings > 0 ? '#f5c54244' : '#22c55e44';
          const label = data.crits > 0 ? `${data.crits}C ${data.warnings}W` : `${data.warnings}W`;
          return (
            <div key={i} title={`${data.path || '?'} — ${label}`} style={{
              width: 14, height: 14, borderRadius: 2,
              background: bg, border: `1px solid ${border}`,
              cursor: 'default',
            }} />
          );
        })}
        {/* Clean pages */}
        {Array.from({ length: Math.max(0, totalPages - entries.length) }).map((_, i) => (
          <div key={`ok-${i}`} title="Clean page" style={{
            width: 14, height: 14, borderRadius: 2,
            background: '#22c55e14', border: '1px solid #22c55e33',
            cursor: 'default',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        {[['#ff4444', 'Critical'], ['#f5c542', 'Warning'], ['#22c55e', 'Clean']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 1, background: c + '44', border: `1px solid ${c}66` }} />
            <span style={{ fontSize: 7, color: '#333', letterSpacing: '0.06em' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Coverage bars — % of pages with title, desc, H1, canonical
function CoveragePanel({ issues, totalPages }) {
  if (!totalPages || totalPages === 0) return null;
  const paths = [...new Set(issues.map(i => i.path).filter(Boolean))];

  const countMissing = (pattern) =>
    [...new Set(
      issues.filter(i => i.sev === 'CRITICAL' && pattern.test(i.msg)).map(i => i.path)
    )].length;

  const missingTitle    = countMissing(/title.*missing|missing.*title/i);
  const missingDesc     = countMissing(/description.*missing|missing.*desc/i);
  const missingH1       = countMissing(/h1.*missing|missing.*h1/i);
  const missingCanon    = [...new Set(
    issues.filter(i => /canonical/i.test(i.msg)).map(i => i.path)
  )].length;

  const rows = [
    { label: 'Title',       pct: Math.round(((totalPages - missingTitle) / totalPages) * 100) },
    { label: 'Description', pct: Math.round(((totalPages - missingDesc)  / totalPages) * 100) },
    { label: 'H1 tag',      pct: Math.round(((totalPages - missingH1)    / totalPages) * 100) },
    { label: 'Canonical',   pct: Math.round(((totalPages - missingCanon) / totalPages) * 100) },
  ];

  return (
    <div>
      <div className="right-label">Coverage</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rows.map(({ label, pct }) => {
          const color = pct >= 90 ? '#22c55e' : pct >= 60 ? '#f5c542' : '#ff4444';
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: '#444', letterSpacing: '0.06em' }}>{label}</span>
                <span style={{ fontSize: 9, color, fontWeight: 500 }}>{pct}%</span>
              </div>
              <div style={{ height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 1 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PageIssuebar({ crits, warnings }) {
  const total = Math.max(crits + warnings, 1);
  const critW = Math.round((crits / total) * 100);
  const warnW = Math.round((warnings / total) * 100);
  return (
    <div style={{ width: 36, height: 3, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ width: `${critW}%`, background: '#ff4444' }} />
        <div style={{ width: `${warnW}%`, background: '#f5c542' }} />
      </div>
    </div>
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

function generatePrintHTML({ report, issues, stats, domain, seoScore, rootScrape, branding, screenshot, siteSummary }) {
  const nonOk = issues.filter(i => i.sev !== 'OK');
  const score = seoScore?.score ?? 0;
  const grade = seoScore?.grade ?? 'F';
  const breakdown = seoScore?.breakdown || {};
  const fixes = report?.top3Fixes || [];
  const crits = nonOk.filter(i => i.sev === 'CRITICAL').length;
  const warns = nonOk.filter(i => i.sev === 'WARNING').length;
  const infos = nonOk.filter(i => i.sev === 'INFO').length;

  const scoreColor = score >= 80 ? '#22c55e' : score >= 50 ? '#e5a00d' : '#dc2626';
  const gradeBg    = score >= 80 ? '#f0fdf4' : score >= 50 ? '#fefce8' : '#fef2f2';
  const gradeBorder= score >= 80 ? '#bbf7d0' : score >= 50 ? '#fef08a' : '#fecaca';

  // Signals from root HTML
  const html = rootScrape?.res?.rawHtml || rootScrape?.res?.html || '';
  const meta = rootScrape?.res?.metadata || {};
  const rootUrl = rootScrape?.url || '';

  const signals = [
    { label: 'HTTPS',           ok: rootUrl.startsWith('https://') },
    { label: 'Viewport meta',   ok: /name=["']viewport["']/i.test(html) },
    { label: 'Canonical tag',   ok: /rel=["']canonical["']/i.test(html) },
    { label: 'OG image',        ok: /property=["']og:image["']/i.test(html) || !!meta.ogImage },
    { label: 'Twitter card',    ok: /<meta[^>]+name=["']twitter:card["'][^>]*content=/i.test(html) },
    { label: 'Structured data', ok: /application\/ld\+json/i.test(html) || /itemscope/i.test(html) },
    { label: 'Sitemap linked',  ok: /href=["'][^"']*sitemap[^"']*["']/i.test(html) },
    { label: 'Robots meta',     ok: /name=["']robots["']/i.test(html) },
    { label: 'Preload hints',   ok: /rel=["']preload["']/i.test(html) },
    { label: 'Font optimised',  ok: /font-display|preload.*font/i.test(html) },
  ];
  const passCount = signals.filter(s => s.ok).length;

  // Tech stack
  const allStack = html ? detectTechStack(html) : [];
  const buildStack = allStack.filter(t => ['framework', 'cms', 'library', 'css'].includes(t.category));

  // Coverage
  const totalPages = stats.crawled || 1;
  const countMissing = (pattern, sev = 'CRITICAL') =>
    [...new Set(issues.filter(i => i.sev === sev && pattern.test(i.msg)).map(i => i.path))].length;
  const coverage = [
    { label: 'Title',       pct: Math.round(((totalPages - countMissing(/missing.*title/i)) / totalPages) * 100) },
    { label: 'Description', pct: Math.round(((totalPages - countMissing(/missing.*desc/i)) / totalPages) * 100) },
    { label: 'H1 tag',      pct: Math.round(((totalPages - countMissing(/missing.*h1/i)) / totalPages) * 100) },
    { label: 'Canonical',   pct: Math.round(((totalPages - countMissing(/canonical/i, 'WARNING')) / totalPages) * 100) },
  ];

  // Group issues by page
  const pageMap = {};
  nonOk.forEach(issue => {
    const key = issue.path || '/';
    if (!pageMap[key]) pageMap[key] = { crits: 0, warnings: 0, infos: 0, issues: [] };
    pageMap[key].issues.push(issue);
    if (issue.sev === 'CRITICAL') pageMap[key].crits++;
    else if (issue.sev === 'WARNING') pageMap[key].warnings++;
    else pageMap[key].infos++;
  });
  const pageEntries = Object.entries(pageMap)
    .sort((a, b) => b[1].crits - a[1].crits || b[1].warnings - a[1].warnings);

  // Score breakdown categories
  const cats = [
    { key: 'onPage',      label: 'On-Page SEO',  weight: 35 },
    { key: 'technical',   label: 'Technical SEO', weight: 25 },
    { key: 'content',     label: 'Content',       weight: 20 },
    { key: 'social',      label: 'Social',        weight: 10 },
    { key: 'performance', label: 'Performance',   weight: 10 },
  ];

  const diffColors = { Easy: '#166534', Medium: '#854d0e', Hard: '#991b1b' };
  const diffBg     = { Easy: '#dcfce7', Medium: '#fef9c3', Hard: '#fee2e2' };

  const barColor = (v) => v >= 80 ? '#22c55e' : v >= 50 ? '#e5a00d' : '#dc2626';
  const barBg    = (v) => v >= 80 ? '#f0fdf4' : v >= 50 ? '#fefce8' : '#fef2f2';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>SEO Audit Report — ${domain}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#1a1a2e;font-size:11px;line-height:1.6}
  .page{max-width:800px;margin:0 auto;padding:40px 48px}

  /* Cover */
  .cover{padding:48px 0 36px;border-bottom:2px solid #1a1a2e;margin-bottom:36px}
  .cover-brand{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#888;margin-bottom:4px}
  .cover-title{font-size:22px;font-weight:700;color:#1a1a2e;margin-bottom:6px}
  .cover-meta{font-size:10px;color:#888;display:flex;gap:16px;flex-wrap:wrap}
  .cover-meta span{display:flex;align-items:center;gap:4px}

  /* Score hero */
  .score-hero{display:flex;gap:32px;align-items:center;padding:28px 32px;border:1px solid ${gradeBorder};background:${gradeBg};border-radius:8px;margin-bottom:32px}
  .score-ring{position:relative;width:100px;height:100px;flex-shrink:0}
  .score-ring svg{width:100px;height:100px}
  .score-num{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px;font-weight:700;color:${scoreColor};line-height:1}
  .score-num small{font-size:14px;color:#aaa;font-weight:400}
  .score-grade{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;padding:3px 10px;border-radius:4px;background:${scoreColor};color:#fff;margin-bottom:8px}
  .score-stats{display:flex;gap:20px;margin-top:8px}
  .score-stat{text-align:center}
  .score-stat-val{font-size:18px;font-weight:600;line-height:1}
  .score-stat-label{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-top:2px}

  /* Section */
  .section{margin-bottom:28px;page-break-inside:avoid}
  .section-title{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#888;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}

  /* Summary box */
  .summary-box{padding:14px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;line-height:1.75;color:#334155}

  /* Breakdown bars */
  .breakdown-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
  .breakdown-label{font-size:10px;color:#555;width:100px;flex-shrink:0}
  .breakdown-weight{font-size:9px;color:#aaa;width:28px;text-align:right;flex-shrink:0}
  .breakdown-track{flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}
  .breakdown-fill{height:100%;border-radius:3px;transition:width .3s}
  .breakdown-val{font-size:10px;font-weight:600;width:36px;text-align:right;flex-shrink:0}

  /* Fixes */
  .fix-card{display:flex;gap:12px;padding:12px 16px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:8px;align-items:flex-start}
  .fix-num{font-size:16px;font-weight:300;color:#bbb;flex-shrink:0;width:20px}
  .fix-body{flex:1}
  .fix-text{font-size:11px;color:#334155;line-height:1.65}
  .fix-diff{font-size:8px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-radius:3px;display:inline-block;margin-top:4px}

  /* Signals grid */
  .signals-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px}
  .signal-row{display:flex;align-items:center;gap:8px;padding:4px 0}
  .signal-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .signal-dot.pass{background:#22c55e}
  .signal-dot.fail{background:#dc2626}
  .signal-label{font-size:10px;color:#555;flex:1}
  .signal-status{font-size:9px;font-weight:600;letter-spacing:.06em}
  .signal-status.pass{color:#22c55e}
  .signal-status.fail{color:#dc2626}

  /* Coverage */
  .coverage-row{display:flex;align-items:center;gap:12px;margin-bottom:8px}
  .coverage-label{font-size:10px;color:#555;width:80px;flex-shrink:0}
  .coverage-track{flex:1;height:5px;background:#f1f5f9;border-radius:3px;overflow:hidden}
  .coverage-fill{height:100%;border-radius:3px}
  .coverage-val{font-size:10px;font-weight:600;width:36px;text-align:right;flex-shrink:0}

  /* Tech stack */
  .tech-tags{display:flex;flex-wrap:wrap;gap:6px}
  .tech-tag{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:500;padding:3px 10px;border-radius:4px;border:1px solid #e5e7eb;background:#f8fafc;color:#555}

  /* Page accordion */
  .page-section{border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:6px}
  .page-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9}
  .page-path{font-family:'JetBrains Mono',monospace;font-size:10px;color:#334155;font-weight:500}
  .page-badges{display:flex;gap:6px}
  .page-badge{font-size:8px;font-weight:700;letter-spacing:.06em;padding:2px 6px;border-radius:3px}
  .page-badge.critical{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
  .page-badge.warning{background:#fefce8;color:#a16207;border:1px solid #fef08a}
  .page-badge.info{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
  .page-issues{padding:0}
  .page-issue{display:flex;align-items:flex-start;gap:10px;padding:6px 14px;border-top:1px solid #f5f5f5;font-size:10px}
  .page-issue:first-child{border-top:none}
  .issue-sev{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.08em;flex-shrink:0;padding-top:1px;min-width:52px}
  .issue-sev.critical{color:#dc2626}
  .issue-sev.warning{color:#a16207}
  .issue-sev.info{color:#2563eb}
  .issue-msg{color:#555;flex:1;line-height:1.5}

  /* Site summary */
  .site-summary{font-size:11px;color:#555;line-height:1.7;font-style:italic;padding:10px 16px;background:#f8fafc;border-left:3px solid #e2e8f0;border-radius:0 6px 6px 0;margin-bottom:24px}

  /* Screenshot */
  .screenshot{border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px;max-height:400px}
  .screenshot img{width:100%;display:block;max-height:400px;object-fit:cover;object-position:top}

  /* Branding */
  .brand-colors{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .brand-swatch{width:28px;height:28px;border-radius:4px;border:1px solid #e5e7eb;flex-shrink:0}
  .brand-swatch-label{font-family:'JetBrains Mono',monospace;font-size:8px;color:#888;margin-left:2px}
  .brand-font{font-size:10px;color:#555;margin-top:4px;padding:4px 0;border-bottom:1px solid #f5f5f5}

  /* Footer */
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center}
  .footer-left{font-size:9px;color:#aaa;letter-spacing:.1em;text-transform:uppercase}
  .footer-right{font-size:9px;color:#aaa}

  /* Two-col layout */
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px}

  /* Print */
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{padding:24px 32px}
    .score-hero{page-break-inside:avoid}
    .fix-card{page-break-inside:avoid}
    .page-header{page-break-inside:avoid}
    .page-issue{page-break-inside:avoid}
    .two-col{page-break-inside:avoid}
    .screenshot{page-break-before:auto;max-height:380px}
  }
</style>
</head><body>
<div class="page">

  <!-- Cover -->
  <div class="cover">
    <div class="cover-brand">Site Autopsy</div>
    <div class="cover-title">SEO Audit Report — ${domain}</div>
    <div class="cover-meta">
      <span>${dateStr} at ${timeStr}</span>
      <span>${stats.crawled} pages scanned</span>
      <span>${crits} critical</span>
      <span>${warns} warnings</span>
      <span>${infos} info</span>
    </div>
  </div>

  ${siteSummary ? `<div class="site-summary">${siteSummary}</div>` : ''}

  <!-- Score Hero -->
  <div class="score-hero">
    <div class="score-ring">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" stroke-width="6"/>
        <circle cx="50" cy="50" r="42" fill="none" stroke="${scoreColor}" stroke-width="6"
          stroke-dasharray="${2 * Math.PI * 42}"
          stroke-dashoffset="${2 * Math.PI * 42 - (score / 100) * 2 * Math.PI * 42}"
          transform="rotate(-90 50 50)" stroke-linecap="round"/>
      </svg>
      <div class="score-num">${score}<small>/100</small></div>
    </div>
    <div>
      <div class="score-grade">Grade ${grade}</div>
      <div style="font-size:12px;color:#555;line-height:1.6;margin-top:4px">
        ${report?.executiveSummary || `${crits} critical and ${warns} warning-level issues detected across ${stats.crawled} pages.`}
      </div>
      <div class="score-stats">
        <div class="score-stat"><div class="score-stat-val" style="color:#dc2626">${crits}</div><div class="score-stat-label">Critical</div></div>
        <div class="score-stat"><div class="score-stat-val" style="color:#e5a00d">${warns}</div><div class="score-stat-label">Warnings</div></div>
        <div class="score-stat"><div class="score-stat-val" style="color:#2563eb">${infos}</div><div class="score-stat-label">Info</div></div>
        <div class="score-stat"><div class="score-stat-val" style="color:#22c55e">${stats.crawled}</div><div class="score-stat-label">Pages</div></div>
      </div>
    </div>
  </div>

  <!-- Score Breakdown -->
  <div class="section">
    <div class="section-title">Score Breakdown</div>
    ${cats.map(({ key, label, weight }) => {
      const val = breakdown[key]?.score ?? 0;
      const weighted = Math.round(val * (weight / 100));
      return `<div class="breakdown-row">
        <div class="breakdown-label">${label}</div>
        <div class="breakdown-weight">${weight}%</div>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${val}%;background:${barColor(val)}"></div></div>
        <div class="breakdown-val" style="color:${barColor(val)}">${val}</div>
      </div>`;
    }).join('')}
  </div>

  <!-- Two column: Signals + Coverage -->
  <div class="two-col">
    <div class="section">
      <div class="section-title">Technical Signals (${passCount}/10)</div>
      <div class="signals-grid">
        ${signals.map(s => `<div class="signal-row">
          <div class="signal-dot ${s.ok ? 'pass' : 'fail'}"></div>
          <div class="signal-label">${s.label}</div>
          <div class="signal-status ${s.ok ? 'pass' : 'fail'}">${s.ok ? 'PASS' : 'FAIL'}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">SEO Coverage</div>
      ${coverage.map(({ label, pct }) => `<div class="coverage-row">
        <div class="coverage-label">${label}</div>
        <div class="coverage-track"><div class="coverage-fill" style="width:${pct}%;background:${barColor(pct)}"></div></div>
        <div class="coverage-val" style="color:${barColor(pct)}">${pct}%</div>
      </div>`).join('')}

      ${buildStack.length > 0 ? `
        <div style="margin-top:16px">
          <div style="font-size:9px;color:#888;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Tech Stack</div>
          <div class="tech-tags">${buildStack.map(t => `<span class="tech-tag">${t.name}</span>`).join('')}</div>
        </div>
      ` : ''}
    </div>
  </div>

  <!-- Top Fixes -->
  ${fixes.length > 0 ? `
    <div class="section">
      <div class="section-title">Priority Fixes</div>
      ${fixes.map((item, i) => {
        const fix = typeof item === 'string' ? item : item.fix;
        const diff = typeof item === 'object' ? item.difficulty : null;
        return `<div class="fix-card">
          <div class="fix-num">${i + 1}</div>
          <div class="fix-body">
            <div class="fix-text">${fix}</div>
            ${diff ? `<span class="fix-diff" style="background:${diffBg[diff]};color:${diffColors[diff]}">${diff}</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  ` : ''}

  ${screenshot ? `
    <div class="section">
      <div class="section-title">Site Screenshot</div>
      <div class="screenshot"><img src="${screenshot}" alt="Screenshot of ${domain}"></div>
    </div>
  ` : ''}

  ${(() => {
    if (!branding) return '';
    const colorEntries = branding.colors && typeof branding.colors === 'object' && !Array.isArray(branding.colors)
      ? Object.entries(branding.colors).filter(([, v]) => typeof v === 'string' && v.startsWith('#'))
      : Array.isArray(branding.colors) ? branding.colors.map((c, i) => [`color-${i}`, c]) : [];
    const fontList = (branding.fonts || []).map(f => typeof f === 'string' ? f : f?.family || '').filter(Boolean);
    if (colorEntries.length === 0 && fontList.length === 0) return '';
    return `
    <div class="section">
      <div class="section-title">Brand Identity</div>
      ${colorEntries.length > 0 ? `
        <div style="margin-bottom:12px">
          <div style="font-size:9px;color:#888;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Colors</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
            ${colorEntries.map(([name, hex]) => `
              <div style="display:flex;align-items:center;gap:8px">
                <div class="brand-swatch" style="background:${hex}"></div>
                <div>
                  <div style="font-size:9px;color:#334155;text-transform:capitalize">${name.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:#aaa">${hex}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${fontList.length > 0 ? `
        <div>
          <div style="font-size:9px;color:#888;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">Typography</div>
          ${fontList.map(f => `<div class="brand-font">${f}</div>`).join('')}
        </div>
      ` : ''}
    </div>`;
  })()}

  <!-- Issues by Page -->
  <div class="section">
    <div class="section-title">Issues by Page (${pageEntries.length} pages, ${nonOk.length} issues)</div>
    ${pageEntries.length === 0 ? '<div style="text-align:center;padding:20px;color:#22c55e;font-weight:600">No issues found</div>' : ''}
    ${pageEntries.map(([path, data]) => `
      <div class="page-section">
        <div class="page-header">
          <span class="page-path">${path}</span>
          <div class="page-badges">
            ${data.crits > 0 ? `<span class="page-badge critical">${data.crits} Critical</span>` : ''}
            ${data.warnings > 0 ? `<span class="page-badge warning">${data.warnings} Warning</span>` : ''}
            ${data.infos > 0 ? `<span class="page-badge info">${data.infos} Info</span>` : ''}
          </div>
        </div>
        <div class="page-issues">
          ${data.issues.map(issue => `
            <div class="page-issue">
              <span class="issue-sev ${issue.sev.toLowerCase()}">${issue.sev}</span>
              <span class="issue-msg">${issue.msg}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">Site Autopsy · SEO Forensics</div>
    <div class="footer-right">Generated ${dateStr} at ${timeStr} · ${domain}</div>
  </div>

</div>
</body></html>`;
}

export default function ReportPanel({ issues, report, status, domain, stats, seoScore, rootScrape, branding, screenshot, siteSummary }) {
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
      score: seoScore?.score,
      grade: seoScore?.grade,
      breakdown: seoScore?.breakdown,
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
    w.document.write(generatePrintHTML({ report, issues, stats, domain, seoScore, rootScrape, branding, screenshot, siteSummary }));
    w.document.close();
    setTimeout(() => w.print(), 400);
  }

  return (
    <div className="right-inner">

      {/* Score */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="right-label" style={{ marginBottom: 0 }}>Health Score</span>
          {isDone && seoScore && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="export-btn" onClick={handleExportJSON}>↓ JSON</button>
              <button className="export-btn" onClick={handleExportPDF}>↓ PDF</button>
            </div>
          )}
        </div>

        {(() => {
          const crits    = issues.filter(i => i.sev === 'CRITICAL').length;
          const warnings = issues.filter(i => i.sev === 'WARNING').length;
          const rawScore = seoScore?.score ?? null;

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
            <div className="score-box" style={{ borderColor: scoreBorder, background: scoreBg, padding: 16 }}>
              {/* Score number + label */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div className="winner-header-label" style={{ color: scoreColor }}>
                    SEO Score{seoScore?.grade ? ` · ${seoScore.grade}` : ''}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 300, color: scoreColor, lineHeight: 1, marginTop: 4 }}>
                    {rawScore}
                    <span style={{ fontSize: 16, color: scoreColor + '55', marginLeft: 3 }}>/100</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', paddingBottom: 2 }}>
                  <div style={{ fontSize: 9, color: '#ff4444', letterSpacing: '0.08em', marginBottom: 3 }}>
                    {crits} CRITICAL
                  </div>
                  <div style={{ fontSize: 9, color: '#f5c542', letterSpacing: '0.08em' }}>
                    {warnings} WARNINGS
                  </div>
                </div>
              </div>
              {/* Gradient bar */}
              <ScoreBar score={rawScore} />
              <ScoreBreakdown breakdown={seoScore?.breakdown} />
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


      {/* Top Fixes */}
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

                      {/* Right side: bar + badges + arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <PageIssuebar crits={data.crits} warnings={data.warnings} />
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
