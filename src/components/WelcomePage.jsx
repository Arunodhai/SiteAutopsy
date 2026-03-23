import { useState } from 'react';
import CpuArchitecture from './CpuArchitecture';

const FEATURES = [
  {
    title: 'Real-Time Forensics',
    body: 'Crawls up to 20 pages sequentially. Every finding streams to the terminal live — titles, descriptions, H1s, canonical tags, alt text, OG tags, and more.',
  },
  {
    title: 'AI-Powered Summary',
    body: 'After the scan, NVIDIA Kimi K2.5 or Groq Llama 3.3 generates an executive summary and your top 3 actionable fixes, ranked by difficulty.',
  },
  {
    title: 'Health Score',
    body: 'A deterministic score across 5 weighted categories — On-Page, Technical, Content, Social, and Performance. Consistent, transparent, reproducible.',
  },
];

export default function WelcomePage({ onStart, url, setUrl, history, onSelectHistory }) {
  const [hovered, setHovered] = useState(null);

  const handleKey = (e) => {
    if (e.key === 'Enter' && url.trim()) onStart();
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: '#0a0a0a',
      backgroundImage: 'radial-gradient(circle, #1c1c1c 1px, transparent 1px)',
      backgroundSize: '22px 22px',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    }}>

      {/* CPU Architecture SVG background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.9,
      }}>
        {/* SVG viewBox is 200×100 (2:1). Fix width so traces frame the page nicely.
            At 1200px wide the height is 600px — fits most viewports without overflowing. */}
        <CpuArchitecture
          text="SEO"
          showChip={false}
          showCpuConnections={false}
          lineMarkerSize={6}
          style={{ width: '1200px', height: '600px', flexShrink: 0 }}
        />
      </div>

      {/* Header */}
      <header style={{
        height: 57, background: '#080808', borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', flexShrink: 0, position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff6b2b' }}>
          Site Autopsy
        </span>
        <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          seo forensics · real-time
        </span>
      </header>

      {/* Hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', gap: 0, position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 20 }}>
          {'> seo_forensics --mode=realtime'}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 36, fontWeight: 300, color: '#d4d4d4', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            Autopsy your website's
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, color: '#ff6b2b', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            SEO health
            <span style={{ animation: 'blink 1s step-end infinite', marginLeft: 3 }}>_</span>
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#444', lineHeight: 1.8, textAlign: 'center', maxWidth: 480, margin: '0 0 32px', fontWeight: 300 }}>
          Crawl up to 20 pages, stream live findings, detect critical SEO issues,
          and get an AI-powered executive summary with a deterministic health score.
        </p>

        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 520 }}>
          <input
            className="text-input"
            type="text"
            placeholder="https://yourdomain.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={handleKey}
            style={{ flex: 1, fontSize: 12 }}
            autoFocus
          />
          <button
            className="btn-run"
            onClick={onStart}
            disabled={!url.trim()}
            style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap' }}
          >
            Run Autopsy
          </button>
        </div>

        {history && history.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 520 }}>
            <span style={{ fontSize: 8, color: '#2a2a2a', letterSpacing: '0.1em', textTransform: 'uppercase', alignSelf: 'center' }}>
              recent:
            </span>
            {history.slice(0, 5).map((h, i) => (
              <button
                key={i}
                onClick={() => onSelectHistory(h.url)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${hovered === i ? '#333' : '#1e1e1e'}`,
                  borderRadius: 2, padding: '2px 8px', fontSize: 9,
                  color: hovered === i ? '#888' : '#444',
                  cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
              >
                {h.url}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feature strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '1px solid #1a1a1a', flexShrink: 0,
        position: 'relative', zIndex: 1,
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ padding: '22px 28px', borderRight: i < FEATURES.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ff6b2b', fontWeight: 500, marginBottom: 10 }}>
              {f.title}
            </div>
            <div style={{ fontSize: 10, color: '#333', lineHeight: 1.75, fontWeight: 300 }}>
              {f.body}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
