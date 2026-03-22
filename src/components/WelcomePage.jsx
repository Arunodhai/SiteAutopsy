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

// ── Circuit canvas animation ──────────────────────────────────────────────────

function makeRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function pathLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++)
    len += Math.abs(pts[i][0] - pts[i-1][0]) + Math.abs(pts[i][1] - pts[i-1][1]);
  return len;
}

function posAtLen(pts, target) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.abs(pts[i][0]-pts[i-1][0]) + Math.abs(pts[i][1]-pts[i-1][1]);
    if (acc + seg >= target) {
      const f = seg === 0 ? 0 : (target - acc) / seg;
      return { x: pts[i-1][0] + (pts[i][0]-pts[i-1][0])*f, y: pts[i-1][1] + (pts[i][1]-pts[i-1][1])*f };
    }
    acc += seg;
  }
  return { x: pts.at(-1)[0], y: pts.at(-1)[1] };
}

// 2 traces per side = 8 total. Each stays in the outer ~40% of the screen.
function buildTraces(w, h) {
  const rng = makeRng(13);
  const traces = [];

  // Stop zone: traces end before reaching this inner rectangle
  const stopX = [w * 0.22, w * 0.78];
  const stopY = [h * 0.20, h * 0.78];

  // [side, slot] → start point + inward direction
  const configs = [
    // left side
    { sx: 0,  sy: h * (0.22 + rng() * 0.12), horiz: true  },
    { sx: 0,  sy: h * (0.60 + rng() * 0.12), horiz: true  },
    // right side
    { sx: w,  sy: h * (0.18 + rng() * 0.12), horiz: true  },
    { sx: w,  sy: h * (0.62 + rng() * 0.10), horiz: true  },
    // top side
    { sx: w * (0.20 + rng() * 0.10), sy: 0, horiz: false },
    { sx: w * (0.65 + rng() * 0.10), sy: 0, horiz: false },
    // bottom side
    { sx: w * (0.18 + rng() * 0.10), sy: h, horiz: false },
    { sx: w * (0.68 + rng() * 0.10), sy: h, horiz: false },
  ];

  for (const cfg of configs) {
    const { sx, sy, horiz } = cfg;

    // Terminal point: land just outside the stop zone
    let ex, ey;
    if (horiz) {
      ex = sx < w / 2 ? stopX[0] - rng() * w * 0.06 : stopX[1] + rng() * w * 0.06;
      ey = stopY[0] + rng() * (stopY[1] - stopY[0]);
    } else {
      ex = stopX[0] + rng() * (stopX[1] - stopX[0]);
      ey = sy < h / 2 ? stopY[0] - rng() * h * 0.06 : stopY[1] + rng() * h * 0.06;
    }

    const pts = [[sx, sy]];
    if (horiz) {
      const bx = sx + (ex - sx) * (0.45 + rng() * 0.25);
      pts.push([bx, sy]);
      pts.push([bx, ey]);
      pts.push([ex, ey]);
    } else {
      const by = sy + (ey - sy) * (0.45 + rng() * 0.25);
      pts.push([sx, by]);
      pts.push([ex, by]);
      pts.push([ex, ey]);
    }

    traces.push({
      pts,
      totalLen:  pathLength(pts),
      drawMs:    2000 + rng() * 2500,
      delay:     200  + rng() * 1800,
      drawProgress: 0,
      pulsePos:  rng(),
      pulseSpeed: 0.10 + rng() * 0.12,
      alpha: 0.28 + rng() * 0.18,
    });
  }

  return traces;
}

function CircuitCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let animId;
    let traces = [];
    let lastTs = null;

    const rebuild = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      traces = buildTraces(canvas.width, canvas.height);
    };
    rebuild();
    window.addEventListener('resize', rebuild);

    const draw = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(ts - lastTs, 50);
      lastTs = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const t of traces) {
        // Delay countdown
        if (t.delay > 0) { t.delay -= dt; continue; }

        // Grow draw progress
        t.drawProgress = Math.min(1, t.drawProgress + dt / t.drawMs);
        const drawnLen = t.totalLen * t.drawProgress;
        if (drawnLen < 1) continue;

        // Advance pulse position along the drawn portion only
        t.pulsePos = (t.pulsePos + t.pulseSpeed * dt / 1000) % 1;

        // ── Trace line ──────────────────────────────────────────────
        ctx.beginPath();
        ctx.moveTo(t.pts[0][0], t.pts[0][1]);
        let acc = 0;
        let done = false;
        for (let i = 1; i < t.pts.length && !done; i++) {
          const seg = Math.abs(t.pts[i][0]-t.pts[i-1][0]) + Math.abs(t.pts[i][1]-t.pts[i-1][1]);
          if (acc + seg <= drawnLen) {
            ctx.lineTo(t.pts[i][0], t.pts[i][1]);
            acc += seg;
          } else {
            const f = seg === 0 ? 0 : (drawnLen - acc) / seg;
            ctx.lineTo(
              t.pts[i-1][0] + (t.pts[i][0]-t.pts[i-1][0]) * f,
              t.pts[i-1][1] + (t.pts[i][1]-t.pts[i-1][1]) * f,
            );
            done = true;
          }
        }
        ctx.strokeStyle = `rgba(28, 28, 28, ${t.alpha})`;
        ctx.lineWidth   = 1;
        ctx.stroke();

        // ── Pulse dot ───────────────────────────────────────────────
        const pulseLen = t.pulsePos * drawnLen;
        const { x: px, y: py } = posAtLen(t.pts, pulseLen);

        const grd = ctx.createRadialGradient(px, py, 0, px, py, 5);
        grd.addColorStop(0, 'rgba(255, 107, 43, 0.35)');
        grd.addColorStop(1, 'rgba(255, 107, 43, 0)');
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 120, 50, 0.85)';
        ctx.fill();
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

// ── Welcome page ──────────────────────────────────────────────────────────────

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
        height: 57,
        background: '#080808',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff6b2b' }}>
          Site Autopsy
        </span>
        <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          seo forensics · real-time
        </span>
      </header>

      {/* Hero — flex: 1, centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        gap: 0,
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Eyebrow */}
        <div style={{
          fontSize: 9, color: '#333', letterSpacing: '0.22em',
          textTransform: 'uppercase', marginBottom: 20,
        }}>
          {'> seo_forensics --mode=realtime'}
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            fontSize: 36, fontWeight: 300, color: '#d4d4d4',
            letterSpacing: '-0.01em', lineHeight: 1.15,
          }}>
            Autopsy your website's
          </div>
          <div style={{
            fontSize: 36, fontWeight: 600, color: '#ff6b2b',
            letterSpacing: '-0.01em', lineHeight: 1.15,
          }}>
            SEO health
            <span style={{ animation: 'blink 1s step-end infinite', marginLeft: 3 }}>_</span>
          </div>
        </div>

        {/* Subline */}
        <p style={{
          fontSize: 11, color: '#444', lineHeight: 1.8,
          textAlign: 'center', maxWidth: 480, margin: '0 0 32px',
          fontWeight: 300,
        }}>
          Crawl up to 20 pages, stream live findings, detect critical SEO issues,
          and get an AI-powered executive summary with a deterministic health score.
        </p>

        {/* URL Input + CTA */}
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

        {/* Recent history */}
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
                  borderRadius: 2,
                  padding: '2px 8px',
                  fontSize: 9,
                  color: hovered === i ? '#888' : '#444',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '0.04em',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
              >
                {h.url}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feature strip — pinned to bottom */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '1px solid #1a1a1a',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            padding: '22px 28px',
            borderRight: i < FEATURES.length - 1 ? '1px solid #1a1a1a' : 'none',
          }}>
            <div style={{
              fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#ff6b2b', fontWeight: 500, marginBottom: 10,
            }}>
              {f.title}
            </div>
            <div style={{
              fontSize: 10, color: '#333', lineHeight: 1.75, fontWeight: 300,
            }}>
              {f.body}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
