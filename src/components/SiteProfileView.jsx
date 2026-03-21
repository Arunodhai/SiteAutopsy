import { detectTechStack } from '../lib/techStack.js';

export default function SiteProfileView({ branding, screenshot, siteSummary, rootScrape, domain }) {
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
  const ogImage = images.ogImage || branding?.ogImage || null;

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

  const fontSizes  = typography.fontSizes  || {};
  const fontFamilies = typography.fontFamilies || {};

  const btn    = components.buttonPrimary   || {};
  const btnSec = components.buttonSecondary || {};

  const pageUrl = rootScrape?.url || '';

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      className="profile-view-scroll">

      {/* ── Screenshot hero ── */}
      <div style={{ flexShrink: 0 }}>
        {/* Browser chrome */}
        <div className="snapshot-browser-chrome">
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

        {/* Screenshot */}
        <div style={{ height: 220, overflow: 'hidden', background: '#080808', position: 'relative' }}>
          {screenshot ? (
            <img src={screenshot} alt="Site screenshot"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#2a2a2a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                screenshot loading...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Brand strip ── */}
      {branding && (
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid #181818',
          borderBottom: '1px solid #181818',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#050505',
          minHeight: 56,
        }}>
          {/* Logo + domain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {logo ? (
              <img src={logo} alt="logo"
                style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 2, opacity: 0.9 }}
                onError={e => { e.target.style.display = 'none'; }} />
            ) : favicon ? (
              <img src={favicon} alt="favicon"
                style={{ width: 20, height: 20, objectFit: 'contain', opacity: 0.7 }} />
            ) : null}
            <div>
              <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.04em' }}>{domain}</div>
              {colorScheme && (
                <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
                  {colorScheme}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          {colorEntries.length > 0 && <div style={{ width: 1, height: 32, background: '#181818', flexShrink: 0 }} />}

          {/* Color swatches */}
          {colorEntries.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {colorEntries.slice(0, 6).map(([label, hex]) => (
                <div key={label} title={`${label}: ${hex}`} style={{
                  width: 24, height: 24, borderRadius: 2,
                  background: hex, border: '1px solid #ffffff11',
                  cursor: 'default', flexShrink: 0,
                }} />
              ))}
            </div>
          )}

          {/* Divider */}
          {uniqueFonts.length > 0 && <div style={{ width: 1, height: 32, background: '#181818', flexShrink: 0 }} />}

          {/* Font chips */}
          {uniqueFonts.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              {uniqueFonts.map((name, i) => (
                <div key={i} style={{
                  padding: '2px 7px',
                  borderRadius: 2,
                  background: '#111',
                  border: '1px solid #222',
                  fontSize: 9,
                  color: '#666',
                  letterSpacing: '0.06em',
                  fontFamily: `'${name}', serif`,
                  flexShrink: 0,
                }}>
                  {name}
                </div>
              ))}
            </div>
          )}

          {/* OG thumbnail pushed right */}
          {ogImage && (
            <img src={ogImage} alt="OG"
              style={{
                width: 48, height: 32, objectFit: 'cover', borderRadius: 2,
                border: '1px solid #1e1e1e', flexShrink: 0, marginLeft: 'auto',
              }} />
          )}
        </div>
      )}

      {/* ── Site summary ── */}
      {siteSummary && (
        <div style={{
          flexShrink: 0,
          padding: '14px 20px',
          borderBottom: '1px solid #181818',
        }}>
          <div style={{
            fontSize: 9, color: '#ff6b2b', letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 8, fontWeight: 500,
          }}>
            Site Summary
          </div>
          <p style={{
            fontSize: 11, color: '#666', lineHeight: 1.8, margin: 0, fontWeight: 300,
            borderLeft: '2px solid #ff6b2b44', paddingLeft: 10,
          }}>
            {siteSummary}
          </p>
        </div>
      )}

      {/* ── Identity: typography + personality ── */}
      {branding && (Object.keys(fontSizes).length > 0 || personality.tone) && (
        <div style={{
          flexShrink: 0,
          padding: '14px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          borderBottom: '1px solid #181818',
        }}>
          {/* Typography scale */}
          {Object.keys(fontSizes).length > 0 && (
            <div>
              <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                Typography
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fontSizes.h1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 8, color: '#333', width: 28, flexShrink: 0, letterSpacing: '0.06em' }}>H1</span>
                    <div style={{ flex: 1, height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ width: '90%', height: '100%', background: '#ff6b2b44', borderRadius: 1 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#444', flexShrink: 0 }}>{fontSizes.h1}</span>
                  </div>
                )}
                {fontSizes.h2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 8, color: '#333', width: 28, flexShrink: 0, letterSpacing: '0.06em' }}>H2</span>
                    <div style={{ flex: 1, height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ width: '65%', height: '100%', background: '#ff6b2b44', borderRadius: 1 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#444', flexShrink: 0 }}>{fontSizes.h2}</span>
                  </div>
                )}
                {fontSizes.body && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 8, color: '#333', width: 28, flexShrink: 0, letterSpacing: '0.06em' }}>Body</span>
                    <div style={{ flex: 1, height: 2, background: '#1a1a1a', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ width: '22%', height: '100%', background: '#ff6b2b44', borderRadius: 1 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#444', flexShrink: 0 }}>{fontSizes.body}</span>
                  </div>
                )}
                {spacing.borderRadius && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 8, color: '#333', width: 28, flexShrink: 0, letterSpacing: '0.06em' }}>r</span>
                    <div style={{ flex: 1, display: 'flex', gap: 5, alignItems: 'center' }}>
                      {['2px','6px','12px'].map(r => (
                        <div key={r} style={{
                          width: 14, height: 14, border: '1px solid #333',
                          borderRadius: r, background: '#111',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 9, color: '#444', flexShrink: 0 }}>{spacing.borderRadius}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personality */}
          {(personality.tone || personality.energy || personality.audience) && (
            <div>
              <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                Personality
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {personality.tone && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 8, color: '#333', width: 48, flexShrink: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tone</span>
                    <span style={{ fontSize: 10, color: '#666' }}>{personality.tone}</span>
                  </div>
                )}
                {personality.energy && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 8, color: '#333', width: 48, flexShrink: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Energy</span>
                    <span style={{ fontSize: 10, color: '#666' }}>{personality.energy}</span>
                  </div>
                )}
                {personality.audience && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 8, color: '#333', width: 48, flexShrink: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Audience</span>
                    <span style={{ fontSize: 10, color: '#666' }}>{personality.audience}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Button components ── */}
      {(btn.background || btnSec.borderColor) && (
        <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid #181818' }}>
          <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Components
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {btn.background && (
              <div style={{
                padding: '6px 14px', borderRadius: spacing.borderRadius || '4px',
                background: btn.background, color: btn.textColor || '#fff',
                fontSize: 10, fontWeight: 600, border: '1px solid transparent',
                fontFamily: fontFamilies.primary ? `'${fontFamilies.primary}', sans-serif` : undefined,
              }}>Primary</div>
            )}
            {btnSec.borderColor && (
              <div style={{
                padding: '6px 14px', borderRadius: spacing.borderRadius || '4px',
                background: 'transparent', color: btnSec.textColor || btnSec.borderColor,
                fontSize: 10, fontWeight: 600, border: `1px solid ${btnSec.borderColor}`,
                fontFamily: fontFamilies.primary ? `'${fontFamilies.primary}', sans-serif` : undefined,
              }}>Secondary</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
