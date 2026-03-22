import { detectTechStack, categoryStyle } from '../lib/techStack.js';

// Short labels for each signal cell — must match signals array order
const SIGNAL_ABBR = ['TLS', 'VIEW', 'CAN', 'OG', 'TW', 'SD', 'MAP', 'BOT', 'PRE', 'FONT'];

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

export default function SnapshotSidebar({ rootScrape, issues = [] }) {
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

  // Only show build-stack tech (no analytics/infra)
  const allStack  = detectTechStack(html);
  const buildStack = allStack.filter(t => ['framework', 'cms', 'library', 'css'].includes(t.category));

  const signals = [
    { label: 'HTTPS',           ok: url.startsWith('https://') },
    { label: 'Viewport meta',   ok: /name=["']viewport["']/i.test(html) },
    { label: 'Canonical tag',   ok: /rel=["']canonical["']/i.test(html) },
    { label: 'OG image',        ok: /property=["']og:image["']/i.test(html) || !!meta.ogImage },
    { label: 'Twitter card',    ok: /name=["']twitter:card["']/i.test(html) },
    { label: 'Structured data', ok: /application\/ld\+json/i.test(html) || /itemscope/i.test(html) },
    { label: 'Sitemap linked',  ok: /href=["'][^"']*sitemap[^"']*["']/i.test(html) },
    { label: 'Robots meta',     ok: /name=["']robots["']/i.test(html) },
    { label: 'Preload hints',   ok: /rel=["']preload["']/i.test(html) },
    { label: 'Font optimised',  ok: /font-display|preload.*font/i.test(html) },
  ];
  const passCount  = signals.filter(s => s.ok).length;
  const scoreColor = passCount >= 8 ? '#22c55e' : passCount >= 5 ? '#f5c542' : '#ff4444';

  const title = meta.title || meta.ogTitle || '';

  const urlTree = buildUrlTree(issues);

  return (
    <div className="sidebar-inner">

      {/* Page Identity */}
      <div>
        <div className="sidebar-section-label">Page Identity</div>
        {title ? (
          <div style={{
            fontSize: 10,
            color: '#c8c8c8',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {title}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#2a2a2a' }}>No title</div>
        )}
      </div>

      {/* Tech Stack — build only */}
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
                  padding: '2px 7px',
                  borderRadius: 2,
                  border: `1px solid ${s.border}`,
                  background: s.bg,
                  color: s.color,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                }}>
                  {tech.name}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signals — 5×2 grid with abbreviated labels */}
      <div>
        <div className="sidebar-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Signals</span>
          <span style={{ color: scoreColor, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
            {passCount}/10
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
          {signals.map((s, i) => (
            <div
              key={i}
              title={s.label}
              style={{
                height: 26,
                borderRadius: 2,
                cursor: 'default',
                background: s.ok ? '#22c55e1a' : '#ff44441a',
                border: s.ok ? '1px solid #22c55e44' : '1px solid #ff444433',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 3,
              }}
            >
              <span style={{
                fontSize: 6,
                letterSpacing: '0.04em',
                fontWeight: 600,
                color: s.ok ? '#22c55e99' : '#ff444466',
              }}>
                {SIGNAL_ABBR[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* URL Structure Tree */}
      {urlTree.length > 0 && (
        <div>
          <div className="sidebar-section-label">URL Structure</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {urlTree.map(([segment, count]) => (
              <div key={segment} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: '#555', fontFamily: 'inherit', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
