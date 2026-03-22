export default function SiteProfileView({ branding, screenshot, siteSummary, rootScrape, domain, status }) {
  if (!branding && !screenshot && !siteSummary && !rootScrape) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9, color: '#2a2a2a', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          run a scan to see site profile
        </div>
      </div>
    );
  }

  const {
    images = {},
    colors = {},
    fonts = [],
    typography = {},
    spacing = {},
    components = {},
    personality = {},
    colorScheme,
  } = branding || {};

  const logo    = images.logo    || branding?.logo    || null;
  const favicon = images.favicon || branding?.favicon || null;

  const colorEntries = [
    ['primary',    colors.primary],
    ['secondary',  colors.secondary],
    ['accent',     colors.accent],
    ['background', colors.background],
    ['text',       colors.textPrimary],
    ['link',       colors.link],
  ].filter(([, v]) => v);

  const fontList = fonts.length
    ? fonts.map(f => typeof f === 'string' ? f : f.family).filter(Boolean)
    : Object.values(typography.fontFamilies || {}).filter(Boolean);

  const uniqueFonts = [...new Set(fontList)].slice(0, 3);

  const fontSizes    = typography.fontSizes    || {};
  const fontFamilies = typography.fontFamilies || {};

  const btn    = components.buttonPrimary   || {};
  const btnSec = components.buttonSecondary || {};
  const hasButtons = btn.background || btnSec.borderColor;

  const pageUrl = rootScrape?.url || '';

  return (
    // Outer: full flex column, no scroll — screenshot will grow to fill
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Browser chrome (fixed) ── */}
      <div className="snapshot-browser-chrome" style={{ flexShrink: 0 }}>
        <div className="snapshot-traffic-lights">
          <span className="snapshot-tl snapshot-tl-red" />
          <span className="snapshot-tl snapshot-tl-yellow" />
          <span className="snapshot-tl snapshot-tl-green" />
        </div>
        <div className="snapshot-address-bar">
          <span className="snapshot-lock">🔒</span>
          <span className="snapshot-address-text">{pageUrl || domain}</span>
        </div>
      </div>

      {/* ── Screenshot — grows to fill remaining space, scrollable ── */}
      <div style={{ flex: 1, minHeight: 180, overflowY: 'auto', background: '#080808', position: 'relative' }}
        className="profile-view-scroll">
        {screenshot ? (
          <img
            src={screenshot}
            alt="Site screenshot"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        ) : (
          <div style={{ height: '100%', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: '#2a2a2a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {status === 'done' ? 'screenshot unavailable' : status === 'running' ? 'screenshot loading...' : 'run a scan to see screenshot'}
            </span>
          </div>
        )}
      </div>

      {/* ── Brand strip (fixed row) ── */}
      {branding && (
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid #181818',
          borderBottom: '1px solid #181818',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#050505',
          minHeight: 52,
          flexWrap: 'wrap',
        }}>
          {/* Logo + domain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {logo ? (
              <img src={logo} alt="logo"
                style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 2, opacity: 0.9 }}
                onError={e => { e.target.style.display = 'none'; }} />
            ) : favicon ? (
              <img src={favicon} alt="favicon"
                style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.7 }} />
            ) : null}
            <div>
              <div style={{ fontSize: 10, color: '#777', letterSpacing: '0.04em' }}>{domain}</div>
              {colorScheme && (
                <div style={{ fontSize: 7, color: '#2a2a2a', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
                  {colorScheme}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          {colorEntries.length > 0 && <div style={{ width: 1, height: 28, background: '#1e1e1e', flexShrink: 0 }} />}

          {/* Color swatches */}
          {colorEntries.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {colorEntries.slice(0, 6).map(([label, hex]) => (
                <div key={label} title={`${label}: ${hex}`} style={{
                  width: 20, height: 20, borderRadius: 2,
                  background: hex, border: '1px solid #ffffff0f',
                  cursor: 'default', flexShrink: 0,
                }} />
              ))}
            </div>
          )}

          {/* Divider */}
          {uniqueFonts.length > 0 && <div style={{ width: 1, height: 28, background: '#1e1e1e', flexShrink: 0 }} />}

          {/* Font chips */}
          {uniqueFonts.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              {uniqueFonts.map((name, i) => (
                <div key={i} style={{
                  padding: '1px 6px',
                  borderRadius: 2,
                  background: '#111',
                  border: '1px solid #1e1e1e',
                  fontSize: 8,
                  color: '#555',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  fontFamily: `'${name}', serif`,
                }}>
                  {name}
                </div>
              ))}
            </div>
          )}

          {/* Button components — at end of brand strip */}
          {hasButtons && (
            <>
              <div style={{ width: 1, height: 28, background: '#1e1e1e', flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                {btn.background && (
                  <div style={{
                    padding: '3px 10px', borderRadius: spacing.borderRadius || '4px',
                    background: btn.background, color: btn.textColor || '#fff',
                    fontSize: 9, fontWeight: 600, border: '1px solid transparent',
                    fontFamily: fontFamilies.primary ? `'${fontFamilies.primary}', sans-serif` : undefined,
                    flexShrink: 0,
                  }}>Primary</div>
                )}
                {btnSec.borderColor && (
                  <div style={{
                    padding: '3px 10px', borderRadius: spacing.borderRadius || '4px',
                    background: 'transparent', color: btnSec.textColor || btnSec.borderColor,
                    fontSize: 9, fontWeight: 600, border: `1px solid ${btnSec.borderColor}`,
                    fontFamily: fontFamilies.primary ? `'${fontFamilies.primary}', sans-serif` : undefined,
                    flexShrink: 0,
                  }}>Secondary</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Scrollable content below brand strip ── */}
      <div style={{ overflowY: 'auto', flexShrink: 0, maxHeight: '38%' }} className="profile-view-scroll">

        {/* Site summary */}
        {siteSummary && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #181818',
          }}>
            <div style={{
              fontSize: 9, color: '#ff6b2b', letterSpacing: '0.14em',
              textTransform: 'uppercase', marginBottom: 6, fontWeight: 500,
            }}>
              Site Summary
            </div>
            <p style={{
              fontSize: 11, color: '#555', lineHeight: 1.75, margin: 0, fontWeight: 300,
              borderLeft: '2px solid #ff6b2b33', paddingLeft: 10,
            }}>
              {siteSummary}
            </p>
          </div>
        )}

        {/* Identity: typography + personality in 2-col grid */}
        {branding && (Object.keys(fontSizes).length > 0 || personality.tone) && (
          <div style={{
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            borderBottom: '1px solid #181818',
          }}>
            {/* Typography scale */}
            {Object.keys(fontSizes).length > 0 && (
              <div>
                <div style={{ fontSize: 7, color: '#2a2a2a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>
                  Typography
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {fontSizes.h1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 7, color: '#2a2a2a', width: 24, flexShrink: 0 }}>H1</span>
                      <div style={{ flex: 1, height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ width: '90%', height: '100%', background: '#ff6b2b33' }} />
                      </div>
                      <span style={{ fontSize: 8, color: '#333', flexShrink: 0 }}>{fontSizes.h1}</span>
                    </div>
                  )}
                  {fontSizes.h2 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 7, color: '#2a2a2a', width: 24, flexShrink: 0 }}>H2</span>
                      <div style={{ flex: 1, height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ width: '65%', height: '100%', background: '#ff6b2b33' }} />
                      </div>
                      <span style={{ fontSize: 8, color: '#333', flexShrink: 0 }}>{fontSizes.h2}</span>
                    </div>
                  )}
                  {fontSizes.body && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 7, color: '#2a2a2a', width: 24, flexShrink: 0 }}>Body</span>
                      <div style={{ flex: 1, height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ width: '22%', height: '100%', background: '#ff6b2b33' }} />
                      </div>
                      <span style={{ fontSize: 8, color: '#333', flexShrink: 0 }}>{fontSizes.body}</span>
                    </div>
                  )}
                  {spacing.borderRadius && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 7, color: '#2a2a2a', width: 24, flexShrink: 0 }}>r</span>
                      <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                        {['2px','6px','12px'].map(r => (
                          <div key={r} style={{ width: 12, height: 12, border: '1px solid #2a2a2a', borderRadius: r }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 8, color: '#333', flexShrink: 0 }}>{spacing.borderRadius}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Personality */}
            {(personality.tone || personality.energy || personality.audience) && (
              <div>
                <div style={{ fontSize: 7, color: '#2a2a2a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>
                  Personality
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {personality.tone && (
                    <div style={{ display: 'flex', gap: 7 }}>
                      <span style={{ fontSize: 7, color: '#2a2a2a', width: 40, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tone</span>
                      <span style={{ fontSize: 9, color: '#555' }}>{personality.tone}</span>
                    </div>
                  )}
                  {personality.energy && (
                    <div style={{ display: 'flex', gap: 7 }}>
                      <span style={{ fontSize: 7, color: '#2a2a2a', width: 40, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Energy</span>
                      <span style={{ fontSize: 9, color: '#555' }}>{personality.energy}</span>
                    </div>
                  )}
                  {personality.audience && (
                    <div style={{ display: 'flex', gap: 7 }}>
                      <span style={{ fontSize: 7, color: '#2a2a2a', width: 40, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audience</span>
                      <span style={{ fontSize: 9, color: '#555' }}>{personality.audience}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
