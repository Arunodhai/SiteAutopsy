import { detectTechStack, categoryStyle } from '../lib/techStack.js';

export default function SnapshotSidebar({ rootScrape }) {
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

  const stack   = detectTechStack(html);
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

  return (
    <div className="sidebar-inner">

      {/* Page Identity */}
      <div>
        <div className="sidebar-section-label">Page Identity</div>
        {title ? (
          <div style={{
            fontSize: 10,
            color: '#c8c8c8',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
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
        {stack.length === 0 ? (
          <div style={{ fontSize: 10, color: '#2a2a2a' }}>Nothing detected</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {stack.map((tech, i) => {
              const s = categoryStyle(tech.category);
              return (
                <div key={i} style={{
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

      {/* Signals */}
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
                height: 20,
                borderRadius: 2,
                cursor: 'default',
                background: s.ok ? '#22c55e22' : '#ff444418',
                border: s.ok ? '1px solid #22c55e44' : '1px solid #ff444433',
              }}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
