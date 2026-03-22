import { useState, useEffect, useRef } from 'react';

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

// ── Circuit canvas ─────────────────────────────────────────────────────────────

function pathLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++)
    len += Math.abs(pts[i][0]-pts[i-1][0]) + Math.abs(pts[i][1]-pts[i-1][1]);
  return len;
}

function posAtLen(pts, target) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.abs(pts[i][0]-pts[i-1][0]) + Math.abs(pts[i][1]-pts[i-1][1]);
    if (acc + seg >= target) {
      const f = seg === 0 ? 0 : (target - acc) / seg;
      return { x: pts[i-1][0]+(pts[i][0]-pts[i-1][0])*f, y: pts[i-1][1]+(pts[i][1]-pts[i-1][1])*f };
    }
    acc += seg;
  }
  return { x: pts.at(-1)[0], y: pts.at(-1)[1] };
}

// Trace definitions as [x%, y%] waypoints from edge → toward center
// (8 traces, 2 per side, designed to frame the hero)
const TRACE_DEFS = [
  // Left — upper: routes to top-left corner of hero
  [[0, 36], [26, 36], [26, 28], [32, 28]],
  // Left — lower: routes to bottom-left of hero
  [[0, 60], [22, 60], [22, 67], [31, 67]],
  // Right — upper: routes to top-right of hero
  [[100, 32], [74, 32], [74, 26], [68, 26]],
  // Right — lower: routes to bottom-right of hero
  [[100, 62], [78, 62], [78, 68], [69, 68]],
  // Top — left: routes down to just above headline
  [[40, 0], [40, 20], [33, 20], [33, 27]],
  // Top — right: routes down to just above headline
  [[60, 0], [60, 16], [67, 16], [67, 27]],
  // Bottom — left: routes up to just below history pills
  [[40, 100], [40, 80], [32, 80], [32, 68]],
  // Bottom — right: routes up to just below history pills
  [[60, 100], [60, 82], [68, 82], [68, 68]],
];

function CircuitCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let animId;
    let lastTs = null;
    let traces = [];

    const CORNER_R  = 14;   // rounded corner radius
    const TAIL_LEN  = 80;   // comet tail length in px
    const TRACE_A   = 0.75; // trace line alpha
    const TRACE_COL = `rgba(30, 30, 30, ${TRACE_A})`;

    const rebuild = () => {
      const w = canvas.width  = window.innerWidth;
      const h = canvas.height = window.innerHeight;

      traces = TRACE_DEFS.map((pcts, i) => ({
        pts:        pcts.map(([px, py]) => [w * px / 100, h * py / 100]),
        pulsePos:   i / TRACE_DEFS.length,           // stagger starts
        pulseSpeed: 0.065 + (i % 4) * 0.018,         // slightly varied speeds
        totalLen:   0, // computed below
      }));
      traces.forEach(t => { t.totalLen = pathLength(t.pts); });
    };

    rebuild();
    window.addEventListener('resize', rebuild);

    // Draw a trace with rounded corners using arcTo
    const strokeTrace = (pts) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        ctx.arcTo(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1], CORNER_R);
      }
      ctx.lineTo(pts.at(-1)[0], pts.at(-1)[1]);
      ctx.strokeStyle = TRACE_COL;
      ctx.lineWidth   = 1;
      ctx.stroke();
    };

    // Small circular pad (ring + inner dot) — matches reference
    const drawPad = (x, y, alpha = 0.75) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(42, 42, 42, ${alpha})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(42, 42, 42, ${alpha * 0.8})`;
      ctx.fill();
    };

    // Comet: gradient tail + glowing head
    const drawComet = (pts, headLen) => {
      const tailStart = Math.max(0, headLen - TAIL_LEN);
      const steps     = 20;

      for (let i = 0; i <= steps; i++) {
        const t   = i / steps;
        const len = tailStart + t * (headLen - tailStart);
        const { x, y } = posAtLen(pts, len);
        const alpha = Math.pow(t, 1.8) * 0.88;
        const r     = 0.5 + t * 2.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 43, ${alpha})`;
        ctx.fill();
      }

      // Glow halo at head
      const { x: hx, y: hy } = posAtLen(pts, headLen);
      const grd = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10);
      grd.addColorStop(0,   'rgba(255, 120, 50, 0.80)');
      grd.addColorStop(0.35,'rgba(255, 107, 43, 0.30)');
      grd.addColorStop(1,   'rgba(255, 107, 43, 0)');
      ctx.beginPath();
      ctx.arc(hx, hy, 10, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    };

    const draw = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(ts - lastTs, 50);
      lastTs = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const t of traces) {
        t.pulsePos = (t.pulsePos + t.pulseSpeed * dt / 1000) % 1;

        // Base trace (rounded corners, always visible)
        strokeTrace(t.pts);

        // Terminal pad at inner end (near hero)
        drawPad(t.pts.at(-1)[0], t.pts.at(-1)[1]);
        // Smaller dot at outer edge start
        drawPad(t.pts[0][0], t.pts[0][1], 0.45);

        // Comet
        drawComet(t.pts, t.pulsePos * t.totalLen);
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', rebuild); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

// ── Welcome page ───────────────────────────────────────────────────────────────

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

      <CircuitCanvas />

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
