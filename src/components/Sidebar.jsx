function scoreColor(score) {
  return score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'red';
}

function timeAgo(ts) {
  const diff = Math.round((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export default function Sidebar({ stats, status, elapsed, history, onClearHistory }) {
  const isRunning = status === 'running';
  const isDone = status === 'done';
  const pct = stats.total > 0 ? Math.round((stats.crawled / stats.total) * 100) : 0;

  return (
    <div className="sidebar-inner">

      {/* Status */}
      <div>
        <div className="sidebar-section-label">Status</div>
        <div className="agent-row" style={{ cursor: 'default' }}>
          <div className="agent-row-left">
            <div className={`dot ${isRunning ? 'dot-orange dot-pulse' : isDone ? 'dot-green' : 'dot-dim'}`} />
            <span className="agent-name">
              {isRunning ? 'scanning' : isDone ? 'complete' : 'idle'}
            </span>
          </div>
          {isDone && elapsed > 0 && (
            <span style={{ fontSize: 10, color: '#444' }}>{elapsed}s</span>
          )}
        </div>

        {(isRunning || isDone) && (
          <>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {stats.crawled}/{stats.total} pages
              </span>
              <span style={{ fontSize: 10, color: '#ff6b2b' }}>{pct}%</span>
            </div>
          </>
        )}
      </div>

      {/* Scan Stats */}
      <div>
        <div className="sidebar-section-label">Scan Stats</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Crawled</div>
            <div className="stat-val orange">{stats.crawled}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-val white">{stats.total || '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Critical</div>
            <div className="stat-val red">{stats.crits}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Warnings</div>
            <div className="stat-val yellow">{stats.warnings}</div>
          </div>
        </div>
      </div>

      {/* Scan History */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="sidebar-section-label" style={{ marginBottom: 0 }}>History</div>
          {history.length > 0 && (
            <button className="clear-history-btn" onClick={onClearHistory}>clear</button>
          )}
        </div>
        {history.length === 0 ? (
          <div style={{ fontSize: 10, color: '#2a2a2a', lineHeight: 1.75 }}>
            No previous scans
          </div>
        ) : (
          history.map((entry, i) => (
            <div key={i} className="history-item">
              <div className="history-row-top">
                <span className="history-domain">{entry.url}</span>
                <span className={`history-score ${scoreColor(entry.score)}`}>{entry.score}</span>
              </div>
              <div className="history-row-meta">
                <span style={{ color: '#ff4444' }}>{entry.crits}c</span>
                <span style={{ color: '#222' }}> · </span>
                <span style={{ color: '#f5c542' }}>{entry.warnings}w</span>
                <span style={{ color: '#222' }}> · {entry.elapsed}s</span>
                <span style={{ color: '#222', marginLeft: 'auto' }}>{timeAgo(entry.ts)}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
