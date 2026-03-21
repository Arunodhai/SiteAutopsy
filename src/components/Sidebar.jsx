import { useState } from 'react';

function scoreColor(score) {
  return score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'red';
}

function timeAgo(ts) {
  const diff = Math.round((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

function Favicon({ domain }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="history-favicon-fallback">{domain[0]?.toUpperCase()}</span>;
  return (
    <img
      className="history-favicon"
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      onError={() => setFailed(true)}
      alt=""
    />
  );
}

export default function Sidebar({ stats, status, elapsed, history, onClearHistory }) {
  const isRunning = status === 'running';
  const isDone    = status === 'done';
  const pct       = stats.total > 0 ? Math.round((stats.crawled / stats.total) * 100) : 0;
  const [showAllHistory, setShowAllHistory] = useState(false);

  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

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
                {stats.crawled}/{stats.total} steps
              </span>
              <span style={{ fontSize: 10, color: '#ff6b2b' }}>{pct}%</span>
            </div>
          </>
        )}
      </div>

      {/* Scan Stats — quadrant layout */}
      <div>
        <div className="sidebar-section-label">Scan Stats</div>
        <div className="stats-quadrant">
          <div className="stats-quad-cell">
            <div className="stats-quad-val orange">{stats.crawled || '—'}</div>
            <div className="stats-quad-label">crawled pages</div>
          </div>
          <div className="stats-quad-cell">
            <div className="stats-quad-val white">{stats.total || '—'}</div>
            <div className="stats-quad-label">total pages</div>
          </div>
          <div className="stats-quad-cell">
            <div className="stats-quad-val red">{stats.crits}</div>
            <div className="stats-quad-label">critical issues</div>
          </div>
          <div className="stats-quad-cell">
            <div className="stats-quad-val yellow">{stats.warnings}</div>
            <div className="stats-quad-label">warnings</div>
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
          <div style={{ fontSize: 10, color: '#2a2a2a', lineHeight: 1.75 }}>No previous scans</div>
        ) : (
          <>
            {visibleHistory.map((entry, i) => (
              <div key={i} className="history-item">
                <Favicon domain={entry.url} />
                <div className="history-item-body">
                  <div className="history-row-top">
                    <span className="history-domain">{entry.url}</span>
                    <span className={`history-score ${scoreColor(entry.score)}`}>{entry.score ?? '—'}</span>
                  </div>
                  <div className="history-row-meta">
                    <span style={{ color: '#ff4444' }}>{entry.crits}c</span>
                    <span style={{ color: '#222' }}> · </span>
                    <span style={{ color: '#f5c542' }}>{entry.warnings}w</span>
                    <span style={{ color: '#222' }}> · {entry.elapsed}s</span>
                    <span style={{ color: '#222', marginLeft: 'auto' }}>{timeAgo(entry.ts)}</span>
                  </div>
                </div>
              </div>
            ))}
            {history.length > 5 && (
              <button className="clear-history-btn" style={{ marginTop: 8 }} onClick={() => setShowAllHistory(v => !v)}>
                {showAllHistory ? `show less` : `+ ${history.length - 5} more`}
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
}
