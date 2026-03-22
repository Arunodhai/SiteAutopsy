import { useEffect, useRef, useState } from 'react';
import GraphView, { MiniMap } from './GraphView.jsx';
import SiteProfileView from './SiteProfileView.jsx';

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

const PROVIDERS = [
  { id: 'nvidia', label: 'NVIDIA', sub: 'Kimi K2.5', placeholder: 'nvapi-...',  storageKey: 'sa_nvidia_key' },
  { id: 'groq',   label: 'Groq',   sub: 'Llama 3.3', placeholder: 'gsk_...',    storageKey: 'sa_groq_key'   },
];

export default function Terminal({
  logs, status, url, setUrl, persist, onRun, onStop,
  missingFcKey, missingGroqKey, graphData, issues, branding, screenshot, siteSummary, rootScrape, domain,
  activeTab, setActiveTab, report,
  fcKey, setFcKey, llmProvider, setLlmProvider, nvidiaKey, setNvidiaKey, groqKey, setGroqKey,
  history, onClearHistory, onSelectHistory,
}) {
  const bodyRef    = useRef(null);
  const gearRef    = useRef(null);
  const historyRef = useRef(null);
  const [filter, setFilter] = useState('ALL');
  const [gearOpen, setGearOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Auto-scroll feed
  useEffect(() => {
    if (bodyRef.current && activeTab === 'feed') {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  // Close popovers on outside click
  useEffect(() => {
    if (!gearOpen && !historyOpen) return;
    const handler = (e) => {
      if (gearOpen && gearRef.current && !gearRef.current.contains(e.target)) setGearOpen(false);
      if (historyOpen && historyRef.current && !historyRef.current.contains(e.target)) setHistoryOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [gearOpen, historyOpen]);

  const isRunning = status === 'running';
  const isDone    = status === 'done';

  const provider     = PROVIDERS.find(p => p.id === llmProvider);
  const activeKey    = llmProvider === 'nvidia' ? nvidiaKey    : groqKey;
  const setActiveKey = llmProvider === 'nvidia' ? setNvidiaKey : setGroqKey;
  const allKeysSet   = !!fcKey && !!activeKey;

  function handleEnvLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const fc     = text.match(/(?:VITE_)?(?:FC|FIRECRAWL)[_-]?(?:API[_-]?)?KEY\s*=\s*(.+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '');
      const nvidia = text.match(/(?:VITE_)?(?:NVIDIA|NV)[_-]?(?:API[_-]?)?KEY\s*=\s*(.+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '');
      const grq    = text.match(/(?:VITE_)?GROQ[_-]?(?:API[_-]?)?KEY\s*=\s*(.+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '');
      if (fc)     { setFcKey(fc);         persist('sa_fc_key',     fc); }
      if (nvidia) { setNvidiaKey(nvidia); persist('sa_nvidia_key', nvidia); }
      if (grq)    { setGroqKey(grq);     persist('sa_groq_key',   grq); }
      setGearOpen(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

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
          {report?.score != null && <span className="tab-badge">{report.score}</span>}
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
          </div>
        )}
      </div>
      {graphData && graphData.nodes.length > 0 && (
        <div onClick={() => setActiveTab('graph')} style={{ cursor: 'pointer' }}>
          <MiniMap nodes={graphData.nodes} links={graphData.links} />
        </div>
      )}
      </div>

      {/* Graph panel */}
      <div className="graph-tab-body" style={{ display: activeTab === 'graph' ? 'flex' : 'none', flexDirection: 'column' }}>
        <GraphView graphData={graphData} issues={issues} isBuilding={isRunning} isActive={activeTab === 'graph'} />
      </div>

      {/* Site Profile panel — single stacked column */}
      <div style={{ display: activeTab === 'profile' ? 'flex' : 'none', flex: 1, minHeight: 0, flexDirection: 'column' }}>
        <SiteProfileView
          branding={branding}
          screenshot={screenshot}
          siteSummary={siteSummary}
          rootScrape={rootScrape}
          domain={domain}
          status={status}
        />
      </div>

      {/* URL input bar — pinned to bottom */}
      <div className="chat-input-bar">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Gear icon + popover */}
            <div className="gear-wrapper" ref={gearRef}>
              <button
                className={`gear-btn${gearOpen ? ' gear-open' : ''}${!allKeysSet ? ' gear-warn' : ''}`}
                onClick={() => setGearOpen(v => !v)}
                title="API keys & model"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94L6.73 20.15a2.1 2.1 0 0 1-3-3l6.72-6.72a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                {!allKeysSet && <span className="gear-dot" />}
              </button>

              {gearOpen && (
                <div className="gear-popover">
                  <div className="gear-popover-header">
                    <span className="gear-popover-title">Configuration</span>
                    <label className="env-load-btn" title="Load keys from .env">
                      <input type="file" accept=".env,text/plain" style={{ display: 'none' }} onChange={handleEnvLoad} disabled={isRunning} />
                      ↑ .env
                    </label>
                  </div>

                  <div className="input-group">
                    <div className="input-group-label" style={{ marginBottom: 6 }}>Firecrawl</div>
                    <input
                      className="text-input"
                      type="password"
                      placeholder="fc-..."
                      value={fcKey}
                      onChange={e => { setFcKey(e.target.value); persist('sa_fc_key', e.target.value); }}
                      disabled={isRunning}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div className="input-group-label" style={{ marginBottom: 6 }}>AI Summary</div>
                    <div className="llm-toggle">
                      {PROVIDERS.map(p => (
                        <button
                          key={p.id}
                          className={`llm-toggle-btn${llmProvider === p.id ? ' active' : ''}`}
                          onClick={() => { setLlmProvider(p.id); persist('sa_llm_provider', p.id); }}
                          disabled={isRunning}
                        >
                          <span className="llm-toggle-label">{p.label}</span>
                          <span className="llm-toggle-sub">{p.sub}</span>
                        </button>
                      ))}
                    </div>
                    <input
                      className="text-input"
                      type="password"
                      placeholder={provider.placeholder}
                      value={activeKey}
                      onChange={e => { setActiveKey(e.target.value); persist(provider.storageKey, e.target.value); }}
                      disabled={isRunning}
                      style={{ width: '100%', marginTop: 6 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* History button + popover */}
            <div className="gear-wrapper" ref={historyRef}>
              <button
                className={`gear-btn${historyOpen ? ' gear-open' : ''}`}
                onClick={() => { setHistoryOpen(v => !v); setGearOpen(false); }}
                title="Scan history"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                {history && history.length > 0 && <span className="gear-dot" style={{ background: '#ff6b2b', boxShadow: '0 0 6px #ff6b2b66' }} />}
              </button>

              {historyOpen && (
                <div className="gear-popover history-popover">
                  <div className="gear-popover-header">
                    <span className="gear-popover-title">Scan History</span>
                    {history && history.length > 0 && (
                      <button className="env-load-btn" onClick={() => { onClearHistory(); setHistoryOpen(false); }}>clear</button>
                    )}
                  </div>
                  {(!history || history.length === 0) ? (
                    <div style={{ fontSize: 10, color: '#2a2a2a', padding: '4px 0' }}>No previous scans</div>
                  ) : (
                    <div className="history-popover-list">
                      {history.slice(0, 10).map((entry, i) => {
                        const sc = entry.score ?? 0;
                        const col = sc >= 80 ? '#22c55e' : sc >= 50 ? '#f5c542' : '#ff4444';
                        const ago = (() => {
                          const d = Math.round((Date.now() - entry.ts) / 1000);
                          if (d < 60) return `${d}s ago`;
                          if (d < 3600) return `${Math.round(d / 60)}m ago`;
                          return `${Math.round(d / 3600)}h ago`;
                        })();
                        return (
                          <div
                            key={i}
                            className="history-popover-item"
                            onClick={() => { onSelectHistory(entry.url); setHistoryOpen(false); }}
                          >
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${entry.url}&sz=32`}
                              alt=""
                              style={{ width: 14, height: 14, borderRadius: 2, opacity: 0.5, flexShrink: 0 }}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                            <span className="history-popover-domain">{entry.url}</span>
                            <span style={{ fontSize: 9, color: '#333', flexShrink: 0 }}>{ago}</span>
                            <span style={{ fontSize: 10, color: col, fontWeight: 500, flexShrink: 0, minWidth: 20, textAlign: 'right' }}>{entry.score ?? '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

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
