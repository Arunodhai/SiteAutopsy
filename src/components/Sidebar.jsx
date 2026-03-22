export default function Sidebar({ stats, status, elapsed, report, seoScore }) {
  const isRunning = status === 'running';
  const isDone    = status === 'done';
  const pct       = stats.total > 0 ? Math.round((stats.crawled / stats.total) * 100) : 0;

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

      {/* AI Summary — moved from right panel */}
      {report?.executiveSummary && (
        <div>
          <div className="sidebar-section-label">AI Summary</div>
          <div className="sidebar-summary">
            {report.executiveSummary}
          </div>
        </div>
      )}

    </div>
  );
}
