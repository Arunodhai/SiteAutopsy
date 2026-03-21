function KeyIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="3.5" cy="3.5" r="2.5" stroke="#333" strokeWidth="1.2" />
      <path d="M5.5 5.5L9 9M7 7.5H8.5M8.5 7.5V9" stroke="#333" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function InputPanel({ fcKey, setFcKey, groqKey, setGroqKey, persist, status }) {
  const isRunning = status === 'running';

  function handleEnvLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const fc = text.match(/(?:VITE_)?(?:FC|FIRECRAWL)[_-]?(?:API[_-]?)?KEY\s*=\s*(.+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '');
      const groq = text.match(/(?:VITE_)?(?:GROQ|NVIDIA|NV)[_-]?(?:API[_-]?)?KEY\s*=\s*(.+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '');
      if (fc)   { setFcKey(fc);     persist('sa_fc_key', fc); }
      if (groq) { setGroqKey(groq); persist('sa_nvidia_key', groq); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="input-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="input-panel-label" style={{ marginBottom: 0 }}>API Keys</div>
        <label className="env-load-btn" title="Load keys from a .env file">
          <input type="file" accept=".env,text/plain" style={{ display: 'none' }} onChange={handleEnvLoad} disabled={isRunning} />
          ↑ .env
        </label>
      </div>

      <div className="input-group">
        <div className="input-group-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <KeyIcon /> Firecrawl
        </div>
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
        <div className="input-group-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <KeyIcon /> NVIDIA (Kimi K2.5)
        </div>
        <input
          className="text-input"
          type="password"
          placeholder="nvapi-..."
          value={groqKey}
          onChange={e => { setGroqKey(e.target.value); persist('sa_nvidia_key', e.target.value); }}
          disabled={isRunning}
        />
      </div>
    </div>
  );
}
