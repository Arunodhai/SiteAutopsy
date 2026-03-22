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

function getPathLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1]);
  }
  return len;
}

function getPartialLength(points, upTo) {
  let len = 0;
  for (let i = 1; i <= upTo; i++) {
    len += Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1]);
  }
  return len;
}

function getPosAtLen(points, targetLen) {
  let drawn = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1]);
    if (drawn + seg >= targetLen) {
      const frac = seg === 0 ? 0 : (targetLen - drawn) / seg;
      return {
        x: points[i - 1][0] + (points[i][0] - points[i - 1][0]) * frac,
        y: points[i - 1][1] + (points[i][1] - points[i - 1][1]) * frac,
      };
    }
    drawn += seg;
  }
  return { x: points[points.length - 1][0], y: points[points.length - 1][1] };
}

function buildTrace(w, h, rng) {
  const cx = w / 2 + (rng() - 0.5) * 160;
  const cy = h / 2 + (rng() - 0.5) * 100;

  const side = Math.floor(rng() * 4); // 0=left 1=right 2=top 3=bottom
  let sx, sy;
  if (side === 0)      { sx = 0;  sy = h * (0.1 + rng() * 0.8); }
  else if (side === 1) { sx = w;  sy = h * (0.1 + rng() * 0.8); }
  else if (side === 2) { sx = w * (0.1 + rng() * 0.8); sy = 0; }
  else                 { sx = w * (0.1 + rng() * 0.8); sy = h; }

  const pts = [[sx, sy]];

  // Build 2–3 right-angle segments toward center
  const horiz = side === 0 || side === 1;
  if (horiz) {
    const mid1x = sx + (cx - sx) * (0.35 + rng() * 0.35);
    pts.push([mid1x, sy]);
    if (rng() > 0.45) {
      const mid2y = sy + (cy - sy) * (0.3 + rng() * 0.35);
      pts.push([mid1x, mid2y]);
      const mid3x = mid1x + (cx - mid1x) * (0.4 + rng() * 0.45);
      pts.push([mid3x, mid2y]);
      pts.push([mid3x, cy]);
      pts.push([cx, cy]);
    } else {
      pts.push([mid1x, cy]);
      pts.push([cx, cy]);
    }
  } else {
    const mid1y = sy + (cy - sy) * (0.35 + rng() * 0.35);
    pts.push([sx, mid1y]);
    if (rng() > 0.45) {
      const mid2x = sx + (cx - sx) * (0.3 + rng() * 0.35);
      pts.push([mid2x, mid1y]);
      const mid3y = mid1y + (cy - mid1y) * (0.4 + rng() * 0.45);
      pts.push([mid2x, mid3y]);
      pts.push([cx, mid3y]);
      pts.push([cx, cy]);
    } else {
      pts.push([cx, mid1y]);
      pts.push([cx, cy]);
    }
  }

  const totalLen = getPathLength(pts);
  const drawDuration = 2000 + rng() * 3000;    // ms to fully draw the trace
  const delay        = rng() * 4000;            // ms before it starts drawing
  const pulseSpeed   = 0.18 + rng() * 0.22;    // fraction/sec along the path

  return { pts, totalLen, drawDuration, delay, delay0: delay, pulseSpeed, pulsePos: rng(), opacity: 0.55 + rng() * 0.35 };
}

// Simple seeded RNG so traces are deterministic on resize
function makeRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function CircuitCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let traces = [];
    let lastTs = null;

    const rebuild = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width  = w;
      canvas.height = h;
      const rng = makeRng(42);
      const count = Math.round(w / 90); // ~10–14 traces depending on width
      traces = Array.from({ length: count }, () => buildTrace(w, h, rng));
      traces.forEach(t => { t.drawProgress = 0; });
    };

    rebuild();

    const onResize = () => rebuild();
    window.addEventListener('resize', onResize);

    const draw = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(ts - lastTs, 50); // cap at 50ms (tab blur)
      lastTs = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const t of traces) {
        // Countdown delay
        if (t.delay > 0) { t.delay -= dt; continue; }

        // Advance draw progress (0 → 1)
        t.drawProgress = Math.min(1, t.drawProgress + dt / t.drawDuration);

        // Advance pulse (loops 0 → 1 → 0 → …)
        t.pulsePos = (t.pulsePos + t.pulseSpeed * dt / 1000) % 1;

        const targetLen = t.totalLen * t.drawProgress;
        if (targetLen < 1) continue;

        // ── Draw the trace (dim lines) ──────────────────────────────
        ctx.beginPath();
        ctx.moveTo(t.pts[0][0], t.pts[0][1]);
        let drawn = 0;
        for (let i = 1; i < t.pts.length; i++) {
          const seg = Math.abs(t.pts[i][0] - t.pts[i - 1][0]) + Math.abs(t.pts[i][1] - t.pts[i - 1][1]);
          if (drawn + seg <= targetLen) {
            ctx.lineTo(t.pts[i][0], t.pts[i][1]);
            drawn += seg;
          } else {
            const frac = seg === 0 ? 0 : (targetLen - drawn) / seg;
            ctx.lineTo(
              t.pts[i - 1][0] + (t.pts[i][0] - t.pts[i - 1][0]) * frac,
              t.pts[i - 1][1] + (t.pts[i][1] - t.pts[i - 1][1]) * frac,
            );
            break;
          }
        }
        ctx.strokeStyle = `rgba(38, 38, 38, ${t.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── Corner nodes ────────────────────────────────────────────
        for (let i = 1; i < t.pts.length - 1; i++) {
          const plen = getPartialLength(t.pts, i);
          if (plen > targetLen) break;
          ctx.beginPath();
          ctx.arc(t.pts[i][0], t.pts[i][1], 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(55, 55, 55, ${t.opacity})`;
          ctx.fill();
        }

        // ── Orange pulse dot traveling along drawn portion ──────────
        const pulseLen = t.pulsePos * targetLen;
        const { x: px, y: py } = getPosAtLen(t.pts, pulseLen);

        // Outer glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 9);
        grd.addColorStop(0, 'rgba(255, 107, 43, 0.55)');
        grd.addColorStop(1, 'rgba(255, 107, 43, 0)');
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 107, 43, 0.9)';
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
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
