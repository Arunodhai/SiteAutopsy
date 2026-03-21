import { useEffect, useRef, useState } from 'react';
import GraphView from './GraphView.jsx';
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
  logs, status, graphData, branding, screenshot, siteSummary, rootScrape, domain,
  activeTab,
}) {
  const bodyRef = useRef(null);
  const [filter, setFilter] = useState('ALL');

  // Auto-scroll feed
  useEffect(() => {
    if (bodyRef.current && activeTab === 'feed') {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  const isRunning = status === 'running';

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
      <div
        className="terminal-body"
        ref={bodyRef}
        style={{ display: activeTab === 'feed' ? 'flex' : 'none' }}
      >
        {logs.length === 0 ? (
          <div className="terminal-prompt-state">
            <div className="prompt-line"><span className="prompt-chevron">&gt;</span> Site Autopsy v2.0</div>
            <div className="prompt-line"><span className="prompt-chevron">&gt;</span> Ready. Enter a URL to begin.</div>
            <div className="prompt-line" style={{ color: '#2a2a2a', fontSize: 10, marginTop: 8 }}>
              <span className="prompt-chevron">&gt;</span> Shortcuts: R = run · Esc = stop · 1-3 = views
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

      {/* Graph panel */}
      <div className="graph-tab-body" style={{ display: activeTab === 'graph' ? 'flex' : 'none', flexDirection: 'column' }}>
        <GraphView graphData={graphData} isBuilding={isRunning} isActive={activeTab === 'graph'} />
      </div>

      {/* Site Profile panel — branding (left) + snapshot (right) */}
      <div className="profile-split" style={{ display: activeTab === 'profile' ? 'flex' : 'none' }}>
        <div className="profile-split-left">
          <BrandingView branding={branding} />
        </div>
        <div className="profile-split-right">
          <SnapshotView screenshot={screenshot} siteSummary={siteSummary} rootScrape={rootScrape} domain={domain} />
        </div>
      </div>
    </>
  );
}
