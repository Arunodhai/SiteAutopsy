function buildUrlTree(links, domain) {
  // Extract unique paths for this domain only
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

  // Build tree nodes: { path, depth, isLast, connector }
  const items = [];

  // Group by first segment
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
      // Show just the tail segment for readability
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

export default function Sidebar({ stats, status, elapsed, report, seoScore, mapLinks = [], domain }) {
  const isRunning = status === 'running';
  const isDone    = status === 'done';
  const pct       = stats.total > 0 ? Math.round((stats.crawled / stats.total) * 100) : 0;

  const treeItems = (isDone || isRunning) && mapLinks.length > 0
    ? buildUrlTree(mapLinks, domain)
    : [];

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

      {/* URL Structure */}
      {treeItems.length > 0 && (
        <div>
          <div className="sidebar-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>URL Structure</span>
            <span style={{ fontSize: 9, color: '#333', fontWeight: 400 }}>{mapLinks.length} found</span>
          </div>
          <div className="url-tree">
            {treeItems.map(item => (
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

      {/* AI Summary */}
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
