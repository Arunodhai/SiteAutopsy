import { detectTechStack, categoryStyle } from '../lib/techStack.js';

function Signal({ label, value, ok }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, padding: '2px 0' }}>
      <span style={{ color: ok ? '#22c55e' : '#ff4444', fontWeight: 600, width: 12, flexShrink: 0 }}>
        {ok ? '✓' : '✗'}
      </span>
      <span style={{ color: '#666', flex: 1 }}>{label}</span>
      {value && <span style={{ fontSize: 8, color: '#ff4444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{value}</span>}
    </div>
  );
}

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

  const title       = meta.title || meta.ogTitle || '';
  const description = meta.description || meta.ogDescription || '';
  const ogImage     = meta.ogImage || '';

  return (
    <div className="sidebar-inner">

      {/* Page Identity */}
      <div>
        <div className="sidebar-section-label">Page Identity</div>
        {title && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Title</div>
            <div style={{ fontSize: 10, color: '#c8c8c8', lineHeight: 1.5 }}>{title}</div>
          </div>
        )}
        {description && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Desc</div>
            <div style={{ fontSize: 10, color: '#888', lineHeight: 1.5 }}>{description}</div>
          </div>
        )}
        {ogImage && (
          <div>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>OG Image</div>
            <img src={ogImage} alt="OG" style={{ width: '100%', borderRadius: 3, border: '1px solid #1a1a1a', objectFit: 'cover', maxHeight: 90 }} />
          </div>
        )}
      </div>

      {/* Tech Stack */}
      <div>
        <div className="sidebar-section-label">Tech Stack</div>
        {stack.length === 0 ? (
          <div style={{ fontSize: 10, color: '#2a2a2a' }}>Nothing detected</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {stack.map((tech, i) => {
              const s = categoryStyle(tech.category);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '4px 7px', borderRadius: 2, border: `1px solid ${s.border}`,
                  background: s.bg, color: s.color, fontSize: 10, fontWeight: 500,
                }}>
                  {tech.name}
                  <span style={{ fontSize: 8, opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {tech.category}
                  </span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {signals.map((s, i) => <Signal key={i} {...s} />)}
        </div>
      </div>

    </div>
  );
}
