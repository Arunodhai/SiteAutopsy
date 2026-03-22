import { detectTechStack, categoryStyle } from '../lib/techStack.js';

// Build URL structure tree from issue paths
function buildUrlTree(issues) {
  const paths = [...new Set(
    ['/', ...issues.map(i => i.path).filter(Boolean)]
  )];

  const segments = {};
  paths.forEach(p => {
    const parts = p.split('/').filter(Boolean);
    const key = parts.length === 0 ? '/' : '/' + parts[0] + (parts.length > 1 ? '/' : '');
    segments[key] = (segments[key] || 0) + 1;
  });

  return Object.entries(segments)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 8);
}

function PageHealthMap({ issues, totalPages }) {
  const nonOk = issues.filter(i => i.sev !== 'OK');
  const pageMap = {};
  nonOk.forEach(issue => {
    const key = issue.path || '/';
    if (!pageMap[key]) pageMap[key] = { crits: 0, warnings: 0, path: key };
    if (issue.sev === 'CRITICAL') pageMap[key].crits++;
    if (issue.sev === 'WARNING') pageMap[key].warnings++;
  });
  const entries = Object.values(pageMap);
  const cleanCount = Math.max(0, totalPages - entries.length);

  return (
    <div>
      <div className="sidebar-section-label">Page Health Map</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {entries.map((data, i) => {
          const bg     = data.crits > 0 ? '#ff444420' : '#f5c54220';
          const border = data.crits > 0 ? '#ff444444' : '#f5c54244';
          const label  = data.crits > 0 ? `${data.crits}C ${data.warnings}W` : `${data.warnings}W`;
          return (
            <div key={i} title={`${data.path} — ${label}`} style={{
              width: 13, height: 13, borderRadius: 2,
              background: bg, border: `1px solid ${border}`,
              cursor: 'default',
            }} />
          );
        })}
        {Array.from({ length: cleanCount }).map((_, i) => (
          <div key={`ok-${i}`} title="Clean page" style={{
            width: 13, height: 13, borderRadius: 2,
            background: '#22c55e14', border: '1px solid #22c55e33',
            cursor: 'default',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
        {[['#ff4444', 'Critical'], ['#f5c542', 'Warning'], ['#22c55e', 'Clean']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: 1, background: c + '44', border: `1px solid ${c}66` }} />
            <span style={{ fontSize: 7, color: '#333', letterSpacing: '0.06em' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Coverage({ issues, totalPages }) {
  if (!totalPages || totalPages === 0) return null;

  const countMissing = (pattern) =>
    [...new Set(
      issues.filter(i => i.sev === 'CRITICAL' && pattern.test(i.msg)).map(i => i.path)
    )].length;

  const missingTitle = countMissing(/title.*missing|missing.*title/i);
  const missingDesc  = countMissing(/description.*missing|missing.*desc/i);
  const missingH1    = countMissing(/h1.*missing|missing.*h1/i);
  const missingCanon = [...new Set(
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
      <div className="sidebar-section-label">Coverage</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rows.map(({ label, pct }) => {
          const color = pct >= 90 ? '#22c55e' : pct >= 60 ? '#f5c542' : '#ff4444';
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.06em' }}>{label}</span>
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

export default function SnapshotSidebar({ rootScrape, issues = [], stats }) {
  if (!rootScrape) {
    return (
      <div className="sidebar-inner">
        <div style={{ fontSize: 9, color: '#2a2a2a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          run a scan to see snapshot info
        </div>
      </div>
    );
  }

  const html = rootScrape?.res?.rawHtml || rootScrape?.res?.html || '';
  const meta = rootScrape?.res?.metadata || {};
  const url  = rootScrape?.url || '';

  const allStack   = detectTechStack(html);
  const buildStack = allStack.filter(t => ['framework', 'cms', 'library', 'css'].includes(t.category));

  const signals = [
    { label: 'HTTPS',           abbr: 'TLS',  ok: url.startsWith('https://') },
    { label: 'Viewport meta',   abbr: 'VIEW', ok: /name=["']viewport["']/i.test(html) },
    { label: 'Canonical tag',   abbr: 'CAN',  ok: /rel=["']canonical["']/i.test(html) },
    { label: 'OG image',        abbr: 'OG',   ok: /property=["']og:image["']/i.test(html) || !!meta.ogImage },
    { label: 'Twitter card',    abbr: 'TW',   ok: /<meta[^>]+name=["']twitter:card["'][^>]*content=/i.test(html) },
    { label: 'Structured data', abbr: 'SD',   ok: /application\/ld\+json/i.test(html) || /itemscope/i.test(html) },
    { label: 'Sitemap linked',  abbr: 'MAP',  ok: /href=["'][^"']*sitemap[^"']*["']/i.test(html) },
    { label: 'Robots meta',     abbr: 'BOT',  ok: /name=["']robots["']/i.test(html) },
    { label: 'Preload hints',   abbr: 'PRE',  ok: /rel=["']preload["']/i.test(html) },
    { label: 'Font optimised',  abbr: 'FONT', ok: /font-display|preload.*font/i.test(html) },
  ];
  const passCount  = signals.filter(s => s.ok).length;
  const scoreColor = passCount >= 8 ? '#22c55e' : passCount >= 5 ? '#f5c542' : '#ff4444';

  const title   = meta.title || meta.ogTitle || '';
  const urlTree = buildUrlTree(issues);
  const isDone  = stats?.crawled > 0;

  return (
    <div className="sidebar-inner">

      {/* Page Identity */}
      <div>
        <div className="sidebar-section-label">Page Identity</div>
        {title ? (
          <div style={{
            fontSize: 10, color: '#c8c8c8', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {title}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#2a2a2a' }}>No title</div>
        )}
      </div>

      {/* Tech Stack */}
      <div>
        <div className="sidebar-section-label">Tech Stack</div>
        {buildStack.length === 0 ? (
          <div style={{ fontSize: 10, color: '#2a2a2a' }}>Nothing detected</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {buildStack.map((tech, i) => {
              const s = categoryStyle(tech.category);
              return (
                <div key={i} title={tech.category} style={{
                  padding: '2px 7px', borderRadius: 2,
                  border: `1px solid ${s.border}`,
                  background: s.bg, color: s.color,
                  fontSize: 9, fontWeight: 500, letterSpacing: '0.06em',
                }}>
                  {tech.name}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signals — row list */}
      <div>
        <div className="sidebar-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Signals</span>
          <span style={{ color: scoreColor, fontSize: 10, textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
            {passCount}/10
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {signals.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '3px 0',
              borderBottom: i < signals.length - 1 ? '1px solid #111' : 'none',
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                background: s.ok ? '#22c55e' : '#ff4444',
                boxShadow: s.ok ? '0 0 5px #22c55e66' : '0 0 5px #ff444455',
              }} />
              <span style={{
                fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#2a2a2a', fontWeight: 600, flexShrink: 0, width: 26,
              }}>
                {s.abbr}
              </span>
              <span style={{
                fontSize: 9, color: s.ok ? '#3a5c42' : '#4a2a2a', flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
              <span style={{
                fontSize: 8, letterSpacing: '0.06em', fontWeight: 600, flexShrink: 0,
                color: s.ok ? '#22c55e' : '#ff4444',
              }}>
                {s.ok ? 'OK' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Page Health Map */}
      {isDone && (
        <PageHealthMap issues={issues} totalPages={stats.crawled} />
      )}

      {/* Coverage */}
      {isDone && (
        <Coverage issues={issues} totalPages={stats.crawled} />
      )}

      {/* URL Structure Tree */}
      {urlTree.length > 0 && (
        <div>
          <div className="sidebar-section-label">URL Structure</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {urlTree.map(([segment, count]) => (
              <div key={segment} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: '#555', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {segment}
                </span>
                <span style={{ fontSize: 8, color: '#333', flexShrink: 0 }}>{count}p</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
