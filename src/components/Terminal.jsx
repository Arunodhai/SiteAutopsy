import { useEffect, useRef, useState } from 'react';
import GraphView from './GraphView.jsx';

const SEV_CLASS = {
  CRITICAL: 'sev-critical',
  WARNING:  'sev-warning',
  INFO:     'sev-info',
  OK:       'sev-ok',
  SYSTEM:   'sev-system',
  URL:      'sev-url',
};

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
  missingFcKey, missingGroqKey, graphData,
}) {
  const bodyRef  = useRef(null);
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  const isRunning = status === 'running';
  const isDone    = status === 'done';

  const handleKey = (e) => {
    if (e.key === 'Enter' && !isRunning && url) onRun();
  };

  const btnClass = `btn-run${isRunning ? ' running' : isDone ? ' done' : ''}`;
  const btnLabel = isRunning ? '▶ running...' : isDone ? '↺ run again' : 'run autopsy';

  const sections = groupLogs(logs);
  const urlGroupCount = sections.filter(s => s.type === 'group').length;
  let urlGroupRendered = 0;

  const hasGraph = graphData && graphData.nodes.length > 0;

  return (
    <>
      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === 'feed' ? ' tab-active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <span className={`tab-dot ${isRunning ? 'dot-orange dot-pulse' : logs.length ? 'dot-green' : 'dot-dim'}`} />
          Live Feed
        </button>
        <button
          className={`tab-btn${activeTab === 'graph' ? ' tab-active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          <span className={`tab-dot ${hasGraph ? 'dot-green' : 'dot-dim'}`} />
          Graph
          {hasGraph && (
            <span className="tab-badge">{graphData.nodes.length}</span>
          )}
        </button>

        {/* Right side event count */}
        <span className="tab-bar-right">
          {activeTab === 'feed' && `${logs.length} events`}
          {activeTab === 'graph' && hasGraph && `${graphData.links.length} links`}
        </span>
      </div>

      {/* Feed panel */}
      <div
        className="terminal-body"
        ref={bodyRef}
        style={{ display: activeTab === 'feed' ? 'flex' : 'none' }}
      >
        {logs.length === 0 ? (
          <div className="terminal-prompt-state">
            <div className="prompt-line"><span className="prompt-chevron">&gt;</span> Site Autopsy v1.0</div>
            <div className="prompt-line"><span className="prompt-chevron">&gt;</span> Ready. Enter a URL below to begin.</div>
            <div className="prompt-line"><span className="prompt-chevron">&gt;</span> <span className="cursor">█</span></div>
          </div>
        ) : (
          <div className="log-feed">
            {sections.map((section, i) => {
              if (section.type === 'flat') {
                return <LogLine key={i} log={section.log} />;
              }

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
                      {children.map((child, j) => (
                        <LogLine key={j} log={child} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isRunning && (
              <div className="log-line">
                <span className="log-time" />
                <span className="log-sev sev-system" />
                <span className="cursor">█</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Graph panel — always mounted so ResizeObserver can measure; hidden when inactive */}
      <div className="graph-tab-body" style={{ display: activeTab === 'graph' ? 'flex' : 'none', flexDirection: 'column' }}>
        <GraphView graphData={graphData} isBuilding={isRunning} />
      </div>

      {/* Chat-style input bar — always visible */}
      <div className="chat-input-bar">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="text-input chat-url-input"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={e => { setUrl(e.target.value); persist('sa_url', e.target.value); }}
              onKeyDown={handleKey}
              disabled={isRunning}
            />
            {isRunning && (
              <button className="btn-stop" onClick={onStop}>■ stop</button>
            )}
            <button
              className={btnClass}
              style={{ width: 'auto', padding: '10px 18px', flexShrink: 0 }}
              onClick={onRun}
              disabled={isRunning || !url}
            >
              {btnLabel}
            </button>
          </div>
          {!isRunning && (missingFcKey || missingGroqKey) && (
            <div className="key-warnings">
              {missingFcKey  && <span className="key-warn key-warn-critical">⚠ Firecrawl key missing</span>}
              {missingGroqKey && <span className="key-warn key-warn-soft">⚠ NVIDIA key missing — AI summary will be skipped</span>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
