import { useState } from 'react';

const PROVIDERS = [
  { id: 'nvidia', label: 'NVIDIA', sub: 'Kimi K2.5', placeholder: 'nvapi-...',  storageKey: 'sa_nvidia_key' },
  { id: 'groq',   label: 'Groq',   sub: 'Llama 3.3', placeholder: 'gsk_...',    storageKey: 'sa_groq_key'   },
];

export default function InputPanel({
  fcKey, setFcKey,
  llmProvider, setLlmProvider,
  nvidiaKey, setNvidiaKey,
  groqKey, setGroqKey,
  persist, status,
}) {
  const isRunning   = status === 'running';
  const allKeysSet  = !!fcKey && !!(llmProvider === 'nvidia' ? nvidiaKey : groqKey);
  const [expanded, setExpanded] = useState(!allKeysSet);

  function handleEnvLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const fc     = text.match(/(?:VITE_)?(?:FC|FIRECRAWL)[_-]?(?:API[_-]?)?KEY\s*=\s*(.+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '');
      const nvidia = text.match(/(?:VITE_)?(?:NVIDIA|NV)[_-]?(?:API[_-]?)?KEY\s*=\s*(.+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '');
      const groq   = text.match(/(?:VITE_)?GROQ[_-]?(?:API[_-]?)?KEY\s*=\s*(.+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '');
      if (fc)     { setFcKey(fc);         persist('sa_fc_key',     fc); }
      if (nvidia) { setNvidiaKey(nvidia); persist('sa_nvidia_key', nvidia); }
      if (groq)   { setGroqKey(groq);     persist('sa_groq_key',   groq); }
      setExpanded(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const activeKey    = llmProvider === 'nvidia' ? nvidiaKey    : groqKey;
  const setActiveKey = llmProvider === 'nvidia' ? setNvidiaKey : setGroqKey;
  const provider     = PROVIDERS.find(p => p.id === llmProvider);

  return (
    <div className="input-panel">
      {/* Header — always visible */}
      <div
        className="input-panel-header"
        onClick={() => setExpanded(v => !v)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="input-panel-label" style={{ marginBottom: 0 }}>API Keys</div>
          {allKeysSet && !expanded && (
            <span style={{ fontSize: 8, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>✓ configured</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!expanded && (
            <label className="env-load-btn" title="Load .env" onClick={e => e.stopPropagation()}>
              <input type="file" accept=".env,text/plain" style={{ display: 'none' }} onChange={handleEnvLoad} disabled={isRunning} />
              ↑ .env
            </label>
          )}
          <span style={{ fontSize: 10, color: '#333', lineHeight: 1 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Collapsible body */}
      {expanded && (
        <div className="input-panel-body" style={{ paddingTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <label className="env-load-btn" title="Load keys from a .env file">
              <input type="file" accept=".env,text/plain" style={{ display: 'none' }} onChange={handleEnvLoad} disabled={isRunning} />
              ↑ .env
            </label>
          </div>

          <div className="input-group">
            <div className="input-group-label" style={{ marginBottom: 8 }}>Firecrawl</div>
            <input
              className="text-input"
              type="password"
              placeholder="fc-..."
              value={fcKey}
              onChange={e => { setFcKey(e.target.value); persist('sa_fc_key', e.target.value); }}
              disabled={isRunning}
            />
          </div>

          <div className="input-group">
            <div className="input-group-label" style={{ marginBottom: 8 }}>AI Summary</div>
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
              style={{ marginTop: 6 }}
            />
          </div>

          {allKeysSet && (
            <button
              className="env-load-btn"
              style={{ width: '100%', textAlign: 'center', marginTop: 4 }}
              onClick={() => setExpanded(false)}
            >
              collapse ▲
            </button>
          )}
        </div>
      )}
    </div>
  );
}
