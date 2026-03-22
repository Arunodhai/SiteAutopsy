import { detectTechStack, categoryStyle } from '../lib/techStack.js';

// Identical to Sidebar.jsx buildUrlTree — same tree logic, same data source
function buildUrlTree(links, domain) {
  const paths = [...new Set(
    links.map(url => {
      try {
        const u = new URL(url);
        if (domain && u.hostname !== domain) return null;
        const p = u.pathname.replace(/\/$/, '') || '/';
        return p;
      } catch { return null; }
    }).filter(Boolean)
  )].sort();

  if (paths.length === 0) return [];

  const items = [];
  const roots = {};
  for (const path of paths) {
    if (path === '/') {
      roots['/'] = roots['/'] || { path: '/', children: [] };
    } else {
      const parts = path.split('/').filter(Boolean);
      const first = `/${parts[0]}`;
      if (!roots[first]) roots[first] = { path: first, children: [] };
      if (path !== first) roots[first].children.push(path);
    }
  }

  const rootEntries = Object.values(roots);
  rootEntries.forEach((node, ri) => {
    const isLastRoot = ri === rootEntries.length - 1;
    items.push({
      key: node.path,
      path: node.path,
      depth: node.path === '/' ? 0 : 1,
      connector: node.path === '/' ? '' : (isLastRoot ? '└─' : '├─'),
      indent: 0,
    });
    node.children.forEach((child, ci) => {
      const isLastChild = ci === node.children.length - 1;
      const tail = child.split('/').filter(Boolean).slice(1).join('/');
      const display = tail ? `…/${tail}` : child;
      items.push({
        key: child,
        path: display,
        depth: 2,
        connector: isLastChild ? '└─' : '├─',
        indent: 12,
      });
    });
  });

  return items;
}

function CheckHealthGrid({ issues, totalPages }) {
  if (!totalPages || totalPages === 0) return null;

  const countBySev = (pattern, sev) =>
    [...new Set(issues.filter(i => i.sev === sev && pattern.test(i.msg)).map(i => i.path))].length;

  const checks = [
    { abbr: 'TTL', label: 'Title tag',        crits: countBySev(/missing.*title|title.*missing/i, 'CRITICAL'), warns: countBySev(/title.*length/i, 'WARNING') },
    { abbr: 'DSC', label: 'Meta description', crits: countBySev(/missing.*desc|desc.*missing/i, 'CRITICAL'),  warns: countBySev(/desc.*length/i, 'WARNING') },
    { abbr: 'H1',  label: 'H1 tag',           crits: countBySev(/missing.*h1|h1.*missing/i, 'CRITICAL'),      warns: countBySev(/multiple.*h1/i, 'WARNING') },
    { abbr: 'ALT', label: 'Image alt text',   crits: 0,                                                        warns: countBySev(/missing.*alt|alt.*missing/i, 'WARNING') },
    { abbr: 'CAN', label: 'Canonical tag',    crits: 0,                                                        warns: countBySev(/canonical/i, 'WARNING') },
    { abbr: 'OG',  label: 'OG tags',          crits: 0,                                                        warns: countBySev(/og.*tag|open.*graph/i, 'WARNING') },
    { abbr: 'DUP', label: 'Duplicate titles', crits: 0,                                                        warns: countBySev(/duplicate.*title/i, 'WARNING') },
    { abbr: 'IDX', label: 'Robots noindex',   crits: countBySev(/noindex/i, 'CRITICAL'),                       warns: 0 },
    { abbr: 'LNK', label: 'Broken links',     crits: countBySev(/broken.*link|link.*broken/i, 'CRITICAL'),     warns: 0 },
    { abbr: 'PRF', label: 'Performance',      crits: 0,                                                        warns: countBySev(/thin.*content/i, 'WARNING') },
  ];

  return (
    <div>
      <div className="sidebar-section-label">Check Health</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {checks.map(({ abbr, label, crits, warns }) => {
          const hasCrit = crits > 0;
          const hasWarn = warns > 0;
          const bg     = hasCrit ? '#ff444422' : hasWarn ? '#f5c54218' : '#22c55e14';
          const border = hasCrit ? '#ff444455' : hasWarn ? '#f5c54244' : '#22c55e33';
          const color  = hasCrit ? '#ff4444'   : hasWarn ? '#f5c542'   : '#22c55e66';
          const tip    = `${label}: ${hasCrit ? `${crits} pages critical` : hasWarn ? `${warns} pages warned` : 'all passing'}`;
          return (
            <div key={abbr} title={tip} style={{
              width: 34, height: 28, borderRadius: 2,
              background: bg, border: `1px solid ${border}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2, cursor: 'default',
            }}>
              <span style={{ fontSize: 7, fontWeight: 600, color, letterSpacing: '0.04em' }}>{abbr}</span>
              <span style={{ fontSize: 7, color: hasCrit ? '#ff444499' : hasWarn ? '#f5c54299' : '#22c55e44' }}>
                {hasCrit ? crits : hasWarn ? warns : '✓'}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        {[['#ff4444', 'Critical'], ['#f5c542', 'Warning'], ['#22c55e', 'Pass']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: 1, background: c + '33', border: `1px solid ${c}55` }} />
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

export default function SnapshotSidebar({ rootScrape, issues = [], stats, mapLinks = [], domain = '' }) {
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
  const urlTree = buildUrlTree(mapLinks, domain);
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

      {/* Check Health Grid */}
      {isDone && (
        <CheckHealthGrid issues={issues} totalPages={stats.crawled} />
      )}

      {/* Coverage */}
      {isDone && (
        <Coverage issues={issues} totalPages={stats.crawled} />
      )}

      {/* URL Structure — identical to Live Feed sidebar */}
      {urlTree.length > 0 && (
        <div>
          <div className="sidebar-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>URL Structure</span>
            <span style={{ fontSize: 9, color: '#333', fontWeight: 400 }}>{mapLinks.length} found</span>
          </div>
          <div className="url-tree">
            {urlTree.map(item => (
              <div
                key={item.key}
                className="url-tree-row"
                style={{ paddingLeft: item.indent }}
                title={item.key}
              >
                {item.connector && (
                  <span className="url-tree-connector">{item.connector}</span>
                )}
                <span className={`url-tree-path ${item.depth === 0 ? 'root' : item.depth === 1 ? 'depth1' : 'depth2'}`}>
                  {item.path}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
