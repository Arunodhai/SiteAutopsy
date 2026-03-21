import { useEffect, useRef, useState } from 'react';
import GraphView, { MiniMap } from './GraphView.jsx';
import BrandingView from './BrandingView.jsx';
import SnapshotView from './SnapshotView.jsx';

const SEV_CLASS = {
  CRITICAL: 'sev-critical',
  WARNING:  'sev-warning',
  INFO:     'sev-info',
  OK:       'sev-ok',
  SYSTEM:   'sev-system',
  URL:      'sev-url',
};

const FILTERS = ['ALL', 'CRITICAL', 'WARNING', 'OK', 'SYSTEM'];

function groupLogs(logs) {
  const sections = [];
  let currentGroup = null;
  for (const log of logs) {
    if (log.sev === 'URL') {
      if (currentGroup) sections.push({ type: 'group', ...currentGroup });
      currentGroup = { urlLog: log, children: [] };
    } else if (currentGroup) {
      currentGroup.children.push(log);
    } else {
      sections.push({ type: 'flat', log });
    }
  }
  if (currentGroup) sections.push({ type: 'group', ...currentGroup });
  return sections;
}

function LogLine({ log }) {
  const lineClass = `log-line${log.sev === 'SYSTEM' ? ' log-system' : ''}`;
  return (
    <div className={lineClass}>
      <span className="log-time">{log.time}</span>
      <span className={`log-sev ${SEV_CLASS[log.sev] || ''}`}>{log.sev}</span>
      <span className="log-msg">{log.msg}</span>
    </div>
  );
}

export default function Terminal({
  logs, status, url, setUrl, persist, onRun, onStop,
  missingFcKey, missingGroqKey, graphData, branding, screenshot, siteSummary, rootScrape, domain,
  activeTab, setActiveTab,
}) {
  const bodyRef   = useRef(null);
  const [filter, setFilter] = useState('ALL');

  // Auto-scroll feed
  useEffect(() => {
    if (bodyRef.current && activeTab === 'feed') {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  const isRunning = status === 'running';
  const isDone    = status === 'done';

  const handleKey = (e) => {
    if (e.key === 'Enter' && !isRunning && url) onRun();
  };

  const btnClass = `btn-run${isRunning ? ' running' : isDone ? ' done' : ''}`;
  const btnLabel = isRunning ? '▶ running...' : isDone ? '↺ run again' : 'run autopsy';

  const hasGraph    = graphData && graphData.nodes.length > 0;
  const hasBranding = !!branding;
  const hasProfile  = !!branding || !!screenshot || !!rootScrape;

  // Filter logs
  const filteredLogs = filter === 'ALL'
    ? logs
    : logs.filter(l => l.sev === filter || (filter === 'SYSTEM' && l.sev === 'URL'));

  const sections = groupLogs(filteredLogs);
  const urlGroupCount    = sections.filter(s => s.type === 'group').length;
  let   urlGroupRendered = 0;

  // Count per severity for filter badges
  const counts = { CRITICAL: 0, WARNING: 0, OK: 0, SYSTEM: 0 };
  logs.forEach(l => { if (counts[l.sev] !== undefined) counts[l.sev]++; });

  return (
    <>
      {/* Tab bar */}
      <div className="tab-bar">
        <button className={`tab-btn${activeTab === 'feed' ? ' tab-active' : ''}`} onClick={() => setActiveTab('feed')}>
          <span className={`tab-dot ${isRunning ? 'dot-orange dot-pulse' : logs.length ? 'dot-green' : 'dot-dim'}`} />
          Live Feed
        </button>
        <button className={`tab-btn${activeTab === 'graph' ? ' tab-active' : ''}`} onClick={() => setActiveTab('graph')}>
          <span className={`tab-dot ${hasGraph ? 'dot-green' : 'dot-dim'}`} />
          Graph
          {hasGraph && <span className="tab-badge">{graphData.nodes.length}</span>}
        </button>
        <button className={`tab-btn${activeTab === 'profile' ? ' tab-active' : ''}`} onClick={() => setActiveTab('profile')}>
          <span className={`tab-dot ${hasProfile ? 'dot-green' : 'dot-dim'}`} />
          Site Profile
        </button>

        <span className="tab-bar-right">
          {activeTab === 'feed'    && `${logs.length} events`}
          {activeTab === 'graph'   && hasGraph && `${graphData.links.length} links`}
          {activeTab === 'profile' && hasProfile && domain}
        </span>
      </div>

      {/* Filter bar (feed only) */}
      {activeTab === 'feed' && (
        <div className="feed-filter-bar">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`feed-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== 'ALL' && counts[f] > 0 && (
                <span className="feed-filter-count">{counts[f]}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Feed panel */}
      <div style={{ display: activeTab === 'feed' ? 'flex' : 'none', flex: 1, position: 'relative', minHeight: 0 }}>
      <div
        className="terminal-body"
        ref={bodyRef}
        style={{ flex: 1 }}
      >
        {logs.length === 0 ? (
          <div className="terminal-prompt-state">
            <div className="prompt-line"><span className="prompt-chevron">&gt;</span> Site Autopsy v2.0</div>
            <div className="prompt-line"><span className="prompt-chevron">&gt;</span> Ready. Enter a URL below to begin.</div>
            <div className="prompt-line" style={{ color: '#2a2a2a', fontSize: 10, marginTop: 8 }}>
              <span className="prompt-chevron">&gt;</span> Shortcuts: R = run · Esc = stop · 1-3 = tabs
            </div>
            <div className="prompt-line"><span className="prompt-chevron">&gt;</span> <span className="cursor">█</span></div>
          </div>
        ) : (
          <div className="log-feed">
            {sections.map((section, i) => {
              if (section.type === 'flat') return <LogLine key={i} log={section.log} />;
              const myIdx   = urlGroupRendered++;
              const isActive = isRunning && myIdx === urlGroupCount - 1;
              const { urlLog, children } = section;
              return (
                <div key={i} className="log-group">
                  <div className="log-line log-url-parent">
                    <span className={`log-url-dot${isActive ? ' log-url-dot-active' : ' log-url-dot-done'}`}>●</span>
                    <span className="log-time">{urlLog.time}</span>
                    <span className="log-sev sev-url">URL</span>
                    <span className="log-msg log-url-msg">{urlLog.msg}</span>
                  </div>
                  {children.length > 0 && (
                    <div className="log-children">
                      {children.map((child, j) => <LogLine key={j} log={child} />)}
                    </div>
                  )}
                </div>
              );
            })}
            {isRunning && (
              <div className="log-line">
                <span className="log-time" /><span className="log-sev sev-system" /><span className="cursor">█</span>
              </div>
            )}
          </div>
        )}
      </div>
      {graphData && graphData.nodes.length > 0 && (
        <MiniMap nodes={graphData.nodes} links={graphData.links} />
      )}
      </div>

      {/* Graph panel */}
      <div className="graph-tab-body" style={{ display: activeTab === 'graph' ? 'flex' : 'none', flexDirection: 'column' }}>
        <GraphView graphData={graphData} isBuilding={isRunning} isActive={activeTab === 'graph'} />
      </div>

      {/* Site Profile panel — branding left + snapshot right */}
      <div className="profile-split" style={{ display: activeTab === 'profile' ? 'flex' : 'none' }}>
        <div className="profile-split-left">
          <BrandingView branding={branding} />
        </div>
        <div className="profile-split-right">
          <SnapshotView screenshot={screenshot} siteSummary={siteSummary} rootScrape={rootScrape} domain={domain} />
        </div>
      </div>

      {/* URL input bar — pinned to bottom */}
      <div className="chat-input-bar">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              {url && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(url).hostname; } catch { return url; } })()}&sz=16`}
                  alt=""
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, opacity: 0.6, pointerEvents: 'none' }}
                />
              )}
              <input
                className="text-input chat-url-input"
                type="url"
                placeholder="https://example.com"
                value={url}
                style={{ width: '100%', paddingLeft: url ? 32 : undefined, paddingRight: url ? 28 : undefined }}
                onChange={e => { setUrl(e.target.value); persist('sa_url', e.target.value); }}
                onKeyDown={handleKey}
                disabled={isRunning}
              />
              {url && !isRunning && (
                <button
                  onClick={() => { setUrl(''); persist('sa_url', ''); }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#333', fontSize: 12, lineHeight: 1, padding: 2 }}
                >✕</button>
              )}
            </div>
            {isRunning && <button className="btn-stop" onClick={onStop}>■ stop</button>}
            <button className={btnClass} style={{ width: 'auto', padding: '10px 18px', flexShrink: 0 }} onClick={onRun} disabled={isRunning || !url}>
              {btnLabel}
            </button>
          </div>
          {!isRunning && (missingFcKey || missingGroqKey) && (
            <div className="key-warnings">
              {missingFcKey   && <span className="key-warn key-warn-critical">⚠ Firecrawl key missing</span>}
              {missingGroqKey && <span className="key-warn key-warn-soft">⚠ AI key missing — summary will be skipped</span>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
