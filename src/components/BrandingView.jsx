function ColorDot({ color, label }) {
  if (!color) return null;
  return (
    <div className="brand-swatch">
      <div className="brand-swatch-color" style={{ background: color }} />
      <div className="brand-swatch-hex">{color}</div>
      {label && <div className="brand-swatch-role">{label}</div>}
    </div>
  );
}

export default function BrandingView({ branding }) {
  if (!branding) {
    return (
      <div className="branding-empty">
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2a2a2a' }}>
          run a scan to extract branding
        </div>
      </div>
    );
  }

  const {
    domain,
    images = {},
    colors = {},
    fonts = [],
    typography = {},
    spacing = {},
    components = {},
    personality = {},
    colorScheme,
  } = branding;

  const logo    = images.logo    || branding.logo    || null;
  const favicon = images.favicon || branding.favicon || null;
  const ogImage = images.ogImage || branding.ogImage || null;

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

  const fontSizes  = typography.fontSizes  || {};
  const fontFamilies = typography.fontFamilies || {};

  const btn = components.buttonPrimary || {};
  const btnSec = components.buttonSecondary || {};

  return (
    <div className="branding-view">

      {/* ── Hero ── */}
      <div className="brand-hero">
        {ogImage && (
          <div className="brand-hero-bg" style={{ backgroundImage: `url(${ogImage})` }} />
        )}
        <div className="brand-hero-overlay" />
        <div className="brand-hero-content">
          <div className="brand-hero-left">
            {logo ? (
              <div className="brand-logo-box">
                <img src={logo} alt="logo" className="brand-logo-img"
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
            ) : favicon ? (
              <div className="brand-logo-box brand-logo-box-sm">
                <img src={favicon} alt="favicon" className="brand-logo-img" />
              </div>
            ) : null}
            <div className="brand-hero-meta">
              <div className="brand-hero-domain">{domain}</div>
              {colorScheme && (
                <div className="brand-hero-sub">{colorScheme} theme</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Colors palette ── */}
      {colorEntries.length > 0 && (
        <div className="brand-section">
          <div className="brand-section-label">Brand Colors</div>
          <div className="brand-palette-strip">
            {colorEntries.map(([label, hex]) => (
              <div key={label} className="brand-palette-cell" style={{ background: hex }}>
                <div className="brand-palette-info">
                  <span className="brand-palette-hex">{hex}</span>
                  <span className="brand-palette-role">{label.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom grid: Fonts + Identity ── */}
      <div className="brand-bottom-grid">

        {/* Fonts */}
        {fontList.length > 0 && (
          <div className="brand-section">
            <div className="brand-section-label">Fonts</div>
            <div className="brand-fonts-list">
              {[...new Set(fontList)].map((name, i) => {
                const role = i === 0
                  ? (fontFamilies.primary === name ? 'primary' : 'body')
                  : (fontFamilies.heading === name ? 'heading'
                    : fontFamilies.code === name ? 'code' : 'secondary');
                return (
                  <div key={i} className="brand-font-card">
                    <div className="brand-font-preview" style={{ fontFamily: `'${name}', serif` }}>
                      {name}
                    </div>
                    <div className="brand-font-meta">
                      <span className="brand-font-sample" style={{ fontFamily: `'${name}', serif` }}>
                        Aa Bb Cc 123
                      </span>
                      <span className="brand-font-role">{role}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Identity */}
        <div className="brand-section">
          <div className="brand-section-label">Identity</div>

          {/* Typography scale */}
          {Object.keys(fontSizes).length > 0 && (
            <div className="brand-identity-card">
              {fontSizes.h1 && (
                <div className="brand-id-row">
                  <span className="brand-id-label">H1</span>
                  <span className="brand-id-bar"><span className="brand-id-bar-fill" style={{ width: '90%' }} /></span>
                  <span className="brand-id-val">{fontSizes.h1}</span>
                </div>
              )}
              {fontSizes.h2 && (
                <div className="brand-id-row">
                  <span className="brand-id-label">H2</span>
                  <span className="brand-id-bar"><span className="brand-id-bar-fill" style={{ width: '65%' }} /></span>
                  <span className="brand-id-val">{fontSizes.h2}</span>
                </div>
              )}
              {fontSizes.h3 && (
                <div className="brand-id-row">
                  <span className="brand-id-label">H3</span>
                  <span className="brand-id-bar"><span className="brand-id-bar-fill" style={{ width: '45%' }} /></span>
                  <span className="brand-id-val">{fontSizes.h3}</span>
                </div>
              )}
              {fontSizes.body && (
                <div className="brand-id-row">
                  <span className="brand-id-label">Body</span>
                  <span className="brand-id-bar"><span className="brand-id-bar-fill" style={{ width: '22%' }} /></span>
                  <span className="brand-id-val">{fontSizes.body}</span>
                </div>
              )}
              {spacing.borderRadius && (
                <>
                  <div className="brand-id-divider" />
                  <div className="brand-id-row">
                    <span className="brand-id-label">Radius</span>
                    <div style={{ flex: 1, paddingLeft: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                      {['2px', '6px', '12px'].map(r => (
                        <div key={r} className="brand-radius-demo" style={{ borderRadius: r }} />
                      ))}
                    </div>
                    <span className="brand-id-val">{spacing.borderRadius}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Personality */}
          {(personality.tone || personality.energy || personality.audience) && (
            <div className="brand-identity-card" style={{ marginTop: 8 }}>
              {personality.tone && (
                <div className="brand-id-row">
                  <span className="brand-id-label">Tone</span>
                  <span style={{ fontSize: 11, color: '#888' }}>{personality.tone}</span>
                </div>
              )}
              {personality.energy && (
                <div className="brand-id-row">
                  <span className="brand-id-label">Energy</span>
                  <span style={{ fontSize: 11, color: '#888' }}>{personality.energy}</span>
                </div>
              )}
              {personality.audience && (
                <div className="brand-id-row">
                  <span className="brand-id-label">Audience</span>
                  <span style={{ fontSize: 11, color: '#888', textAlign: 'right', flex: 1 }}>{personality.audience}</span>
                </div>
              )}
            </div>
          )}

          {/* Buttons preview */}
          {(btn.background || btnSec.borderColor) && (
            <>
              <div className="brand-section-label" style={{ marginTop: 10 }}>Components</div>
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
            </>
          )}

          {/* OG image */}
          {ogImage && (
            <div className="brand-og-thumb-wrap" style={{ marginTop: 8 }}>
              <div className="brand-og-label">OG IMAGE</div>
              <img src={ogImage} alt="OG" className="brand-og-thumb" />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
