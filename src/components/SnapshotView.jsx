export default function SnapshotView({ screenshot, siteSummary, domain, rootScrape }) {
  if (!rootScrape && !screenshot && !siteSummary) {
    return (
      <div className="snapshot-empty">
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2a2a2a' }}>
          run a scan to capture snapshot
        </div>
      </div>
    );
  }

  const pageUrl = rootScrape?.url || '';

  return (
    <div className="snapshot-view">

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

      {/* Screenshot — fills remaining space, scrollable */}
      <div className="snapshot-screen">
        {screenshot ? (
          <img src={screenshot} alt="Site screenshot" className="snapshot-img" />
        ) : (
          <div className="snapshot-screen-loading">
            <span style={{ fontSize: 9, color: '#2a2a2a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              screenshot loading...
            </span>
          </div>
        )}
      </div>

      {/* Site summary — natural height, pushes screenshot up */}
      {siteSummary && (
        <div className="snapshot-summary-block">
          <div className="snapshot-panel-label">Site Summary</div>
          <p style={{ fontSize: 11, color: '#666', lineHeight: 1.8, margin: 0, fontWeight: 300 }}>
            {siteSummary}
          </p>
        </div>
      )}

    </div>
  );
}
