import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export function MiniMap({ nodes, links }) {
  const canvasRef = useRef(null);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !nodes?.length) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const pad = 8;

    const positioned = nodes.filter(n => isFinite(n.x) && isFinite(n.y));
    if (!positioned.length) return;

    const xs = positioned.map(n => n.x);
    const ys = positioned.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const scale = Math.min((W - pad * 2) / rangeX, (H - pad * 2) / rangeY);
    const offX = (W - rangeX * scale) / 2 - minX * scale;
    const offY = (H - rangeY * scale) / 2 - minY * scale;

    const toMX = x => x * scale + offX;
    const toMY = y => y * scale + offY;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Edges
    ctx.lineWidth = 0.5;
    for (const link of (links || [])) {
      const s = typeof link.source === 'object' ? link.source : null;
      const t = typeof link.target === 'object' ? link.target : null;
      if (!s || !t || !isFinite(s.x) || !isFinite(t.x)) continue;
      ctx.beginPath();
      ctx.moveTo(toMX(s.x), toMY(s.y));
      ctx.lineTo(toMX(t.x), toMY(t.y));
      ctx.strokeStyle = '#222';
      ctx.stroke();
    }

    // Nodes
    for (const node of positioned) {
      const mx = toMX(node.x);
      const my = toMY(node.y);
      const r = node.isRoot ? 4 : 2;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor(node);
      ctx.fill();
    }
  }

  // Redraw every 200 ms so the minimap tracks the live simulation
  useEffect(() => {
    draw();
    const id = setInterval(draw, 200);
    return () => clearInterval(id);
  }, [nodes, links]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 14,
      right: 14,
      zIndex: 20,
      border: '1px solid #1e1e1e',
      borderRadius: 3,
      overflow: 'hidden',
      background: '#000',
      opacity: 0.9,
    }}>
      <div style={{
        fontSize: 7,
        color: '#2a2a2a',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 7px',
        borderBottom: '1px solid #111',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>minimap</span>
        <span style={{ color: '#1a1a1a' }}>{nodes?.length} nodes</span>
      </div>
      <canvas ref={canvasRef} width={160} height={120} />
    </div>
  );
}

const SEV_COLOR = { CRITICAL: '#ff4444', WARNING: '#f5c542', INFO: '#00d4ff' };

// Depth ring color tints — subtle hue shifts per ring
const RING_COLORS = ['#1a1200', '#0a1218', '#0d0d14', '#111014', '#131313'];

function nodeColor(node) {
  if (node.isScanned === false) return '#333333';
  if (node.isRoot)       return '#ff6b2b';
  if (node.isOrphan)     return '#ff4444';
  if (node.inbound >= 5) return '#22c55e';
  if (node.inbound >= 2) return '#f5c542';
  return '#00d4ff';
}

function nodeR(node) {
  if (node.isScanned === false) return 3;
  if (node.isRoot) return 11;
  return Math.max(5, Math.min(5 + node.inbound * 1.8, 16));
}

const LOADING_MSGS = [
  'Building internal link graph...',
  'Mapping page connections...',
  'Computing SEO metrics...',
  'Rendering force layout...',
];

function InsightBar({ insights }) {
  if (!insights?.length) return null;
  return (
    <div className="graph-insight-bar">
      {insights.map((ins, i) => (
        <div key={i} className="graph-insight-item" style={{ borderLeftColor: SEV_COLOR[ins.sev] || '#333' }}>
          <span className="graph-insight-sev" style={{ color: SEV_COLOR[ins.sev] }}>{ins.sev}</span>
          <span className="graph-insight-msg">{ins.msg}</span>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="graph-legend">
      {[
        { color: '#ff6b2b', label: 'Root' },
        { color: '#22c55e', label: '5+ inbound' },
        { color: '#f5c542', label: '2–4 inbound' },
        { color: '#00d4ff', label: '1 inbound' },
        { color: '#ff4444', label: 'Orphan' },
        { color: '#333333', label: 'Discovered' },
      ].map(({ color, label }) => (
        <div key={label} className="graph-legend-item">
          <span className="graph-legend-dot" style={{ background: color, boxShadow: `0 0 6px ${color}88` }} />
          <span className="graph-legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// Build path → {crits, warnings, topIssues[]} index from issues array
function buildIssueIndex(issues = []) {
  const idx = {};
  for (const issue of issues) {
    if (!issue.path || issue.sev === 'OK') continue;
    if (!idx[issue.path]) idx[issue.path] = { crits: 0, warnings: 0, topIssues: [] };
    if (issue.sev === 'CRITICAL') idx[issue.path].crits++;
    else if (issue.sev === 'WARNING') idx[issue.path].warnings++;
    if (idx[issue.path].topIssues.length < 2) idx[issue.path].topIssues.push(issue);
  }
  return idx;
}

// Find shortest path from root to a given node using links
function pathToRoot(targetId, nodes, links) {
  const rootNode = nodes.find(n => n.isRoot);
  if (!rootNode || rootNode.id === targetId) return new Set([targetId]);

  // Build adjacency (undirected for path finding)
  const adj = {};
  for (const l of links) {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (!adj[s]) adj[s] = [];
    if (!adj[t]) adj[t] = [];
    adj[s].push(t);
    adj[t].push(s);
  }

  // BFS from root to target
  const visited = new Map(); // id → parentId
  visited.set(rootNode.id, null);
  const queue = [rootNode.id];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === targetId) break;
    for (const nb of (adj[cur] || [])) {
      if (!visited.has(nb)) {
        visited.set(nb, cur);
        queue.push(nb);
      }
    }
  }

  // Trace path back
  const pathSet = new Set();
  let cur = targetId;
  while (cur !== null && cur !== undefined) {
    pathSet.add(cur);
    cur = visited.get(cur);
  }
  return pathSet;
}

export default function GraphView({ graphData, issues, isBuilding, isActive }) {
  const containerRef = useRef(null);
  const fgRef        = useRef(null);
  const [dims, setDims]         = useState({ w: 800, h: 500 });
  const [hovered, setHovered]   = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [filterOrphans, setFilterOrphans] = useState(false);
  const [loadMsgIdx, setLoadMsgIdx]       = useState(0);

  // Issue index: path → {crits, warnings, topIssues}
  const issueIdx = useMemo(() => buildIssueIndex(issues), [issues]);

  // Path-to-root node set for selected node highlighting
  const pathSet = useMemo(() => {
    if (!selected || !graphData) return null;
    return pathToRoot(selected.id, graphData.nodes, graphData.links);
  }, [selected, graphData]);

  useEffect(() => {
    if (graphData) return;
    const t = setInterval(() => setLoadMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1100);
    return () => clearInterval(t);
  }, [graphData]);

  // Radial ring layout — depth rings as initial positions + custom force
  useEffect(() => {
    if (!fgRef.current || !graphData) return;
    const fg = fgRef.current;
    const { nodes, links } = graphData;

    for (const nd of nodes) {
      if (nd.isRoot) { nd.fx = 0; nd.fy = 0; }
      else           { delete nd.fx; delete nd.fy; }
    }

    const useRadial = nodes.length >= 7;
    const density = links.length / Math.max(nodes.length, 1);

    if (useRadial) {
      const maxD  = Math.max(...nodes.map(n => (n.depth < 99 ? n.depth : 0)), 1);
      const MAX_R = 230;
      const rStep = MAX_R / maxD;

      const byDepth = {};
      for (const n of nodes) {
        const d = n.depth < 99 ? n.depth : maxD + 1;
        (byDepth[d] = byDepth[d] || []).push(n);
      }
      for (const [ds, ring] of Object.entries(byDepth)) {
        const d = +ds;
        const r = d === 0 ? 0 : Math.min(d * rStep, MAX_R * 1.25);
        ring.forEach((nd, i) => {
          const θ = (2 * Math.PI * i) / ring.length - Math.PI / 2;
          nd.x  = r === 0 ? 0 : r * Math.cos(θ);
          nd.y  = r === 0 ? 0 : r * Math.sin(θ);
          nd.vx = 0;
          nd.vy = 0;
        });
      }

      fg.d3Force('charge')?.strength(Math.min(-220, -140 - density * 5));
      fg.d3Force('link')?.distance(rStep * 0.6).strength(0.02);
      fg.d3Force('center')?.strength(0.03);
      fg.d3Force('radial', α => {
        for (const nd of nodes) {
          const d  = nd.depth < 99 ? nd.depth : maxD + 1;
          const tR = d === 0 ? 0 : Math.min(d * rStep, MAX_R * 1.25);
          if (tR === 0) continue;
          const dx   = nd.x ?? 0;
          const dy   = nd.y ?? 0;
          const dist = Math.hypot(dx, dy) || 0.001;
          const pull = ((dist - tR) / dist) * 0.6 * α;
          nd.vx -= dx * pull;
          nd.vy -= dy * pull;
        }
      });
    } else {
      fg.d3Force('radial', null);
      fg.d3Force('charge')?.strength(-300);
      fg.d3Force('link')?.distance(100).strength(0.5);
      fg.d3Force('center')?.strength(0.1);
      nodes.forEach((nd, i) => {
        const θ = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        nd.x  = nodes.length === 1 ? 0 : 80 * Math.cos(θ);
        nd.y  = nodes.length === 1 ? 0 : 80 * Math.sin(θ);
        nd.vx = 0;
        nd.vy = 0;
      });
    }

    fg.d3ReheatSimulation();
  }, [graphData]);

  const fitGraph = (duration = 300) => {
    const fg = fgRef.current;
    if (!fg) return;
    if (graphData?.nodes?.length === 1) {
      fg.centerAt(0, 0, duration);
      fg.zoom(2, duration);
    } else {
      fg.zoomToFit(duration, 60);
    }
  };

  // After simulation settles, force-center the graph (covers case where tab is already visible)
  useEffect(() => {
    if (!graphData) return;
    // 150 ticks × ~16ms + buffer ≈ 2.8s
    const t = setTimeout(() => fitGraph(300), 2800);
    return () => clearTimeout(t);
  }, [graphData]);

  // Re-center when switching to graph tab (canvas was 0-width while hidden)
  useEffect(() => {
    if (!isActive || !graphData) return;
    const t = setTimeout(() => fitGraph(300), 80);
    return () => clearTimeout(t);
  }, [isActive, graphData]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDims({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleNodeHover = useCallback((node, _, evt) => {
    document.body.style.cursor = node ? 'pointer' : 'default';
    setHovered(node || null);
    if (evt) setMousePos({ x: evt.clientX, y: evt.clientY });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (hovered) setMousePos({ x: e.clientX, y: e.clientY });
  }, [hovered]);

  const handleNodeClick = useCallback((node) => {
    setSelected(prev => {
      const isAlreadySelected = prev?.id === node.id;
      if (isAlreadySelected) {
        // Deselect — zoom back out to fit all nodes
        fitGraph(400);
        return null;
      } else {
        // Select — zoom into the node
        fgRef.current?.centerAt(node.x, node.y, 500);
        fgRef.current?.zoom(4, 500);
        return node;
      }
    });
  }, []);

  const gData = (() => {
    if (!graphData) return { nodes: [], links: [] };
    if (!filterOrphans) return graphData;
    const orphanIds = new Set(graphData.nodes.filter(n => n.isOrphan).map(n => n.id));
    return {
      nodes: graphData.nodes.filter(n => orphanIds.has(n.id)),
      links: graphData.links.filter(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return orphanIds.has(s) || orphanIds.has(t);
      }),
    };
  })();

  const stats = graphData ? {
    total:   graphData.nodes.length,
    orphans: graphData.nodes.filter(n => n.isOrphan).length,
    links:   graphData.links.length,
  } : null;

  return (
    <div className="graph-wrap" ref={containerRef} onMouseMove={handleMouseMove}>
      {!graphData && (
        <div className="graph-placeholder">
          <div className="graph-loading-msg">{LOADING_MSGS[loadMsgIdx]}</div>
          <div className="graph-loading-sub">
            {isBuilding ? 'scan in progress — graph builds after completion' : 'run a scan to build the graph'}
          </div>
        </div>
      )}
      {graphData && (<>
      <div className="graph-stats-bar">
        <span className="graph-stat"><b>{stats.total}</b> pages</span>
        <span className="graph-stat"><b>{stats.links}</b> links</span>
        <span className="graph-stat" style={{ color: stats.orphans > 0 ? '#ff4444' : '#22c55e' }}>
          <b>{stats.orphans}</b> orphans
        </span>
        <button
          className={`graph-filter-btn${filterOrphans ? ' active' : ''}`}
          onClick={() => { setFilterOrphans(f => !f); setSelected(null); }}
        >
          {filterOrphans ? '✕ clear filter' : 'show orphans only'}
        </button>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={gData}
        width={dims.w}
        height={dims.h}
        backgroundColor="#000000"
        /* Depth ring guides + background gradient */
        onRenderFramePre={(ctx, globalScale) => {
          // Subtle radial vignette — darker at canvas edges
          const W = dims.w / globalScale;
          const H = dims.h / globalScale;
          const vignette = ctx.createRadialGradient(0, 0, 60, 0, 0, Math.max(W, H) * 0.8);
          vignette.addColorStop(0, 'rgba(0,0,0,0)');
          vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
          ctx.fillStyle = vignette;
          ctx.fillRect(-W, -H, W * 2, H * 2);

          // CRT scanline overlay — slow drift downward
          const scanlineSpacing = 4 / globalScale;
          const scanlineOffset  = ((Date.now() / 80) % scanlineSpacing);
          const W2 = dims.w / globalScale;
          const H2 = dims.h / globalScale;
          ctx.save();
          ctx.globalAlpha = 0.025;
          ctx.fillStyle = '#000';
          for (let y = -H2 + scanlineOffset; y < H2; y += scanlineSpacing) {
            ctx.fillRect(-W2, y, W2 * 2, scanlineSpacing * 0.4);
          }
          ctx.restore();

          if (!graphData?.nodes?.length || graphData.nodes.length < 7) return;
          const maxD  = Math.max(...graphData.nodes.map(n => (n.depth < 99 ? n.depth : 0)), 1);
          const rStep = 230 / maxD;
          ctx.save();
          for (let d = 1; d <= maxD + 1; d++) {
            const r = Math.min(d * rStep, 230 * 1.25);
            // Subtle colored fill tint for each ring band
            if (d <= maxD) {
              const ringFill = ctx.createRadialGradient(0, 0, d === 1 ? 0 : Math.min((d-1)*rStep, 230*1.25), 0, 0, r);
              ringFill.addColorStop(0, 'rgba(0,0,0,0)');
              ringFill.addColorStop(1, d % 2 === 0 ? 'rgba(0,212,255,0.022)' : 'rgba(255,107,43,0.015)');
              ctx.beginPath();
              ctx.arc(0, 0, r, 0, 2 * Math.PI);
              ctx.fillStyle = ringFill;
              ctx.fill();
            }
            // Ring stroke
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, 2 * Math.PI);
            ctx.strokeStyle = d <= maxD ? '#1e1e1e' : '#161616';
            ctx.lineWidth = d <= maxD ? 0.7 : 0.5;
            ctx.setLineDash([3, 9]);
            ctx.stroke();
            ctx.setLineDash([]);
            // Depth label at top of ring
            if (d <= maxD) {
              ctx.save();
              ctx.font = `${Math.max(2.5, 8 / globalScale)}px JetBrains Mono, monospace`;
              ctx.fillStyle = '#2a2a2a';
              ctx.textAlign = 'center';
              ctx.fillText(`depth ${d}`, 0, -r + Math.max(2, 7 / globalScale));
              ctx.restore();
            }
          }
          ctx.restore();
        }}
        /* Physics */
        nodeRelSize={6}
        nodeVal={n => nodeR(n)}
        nodeLabel={() => ''}
        /* Custom gradient edges */
        linkCanvasObject={(link, ctx) => {
          const start = link.source;
          const end   = link.target;
          if (!isFinite(start.x) || !isFinite(start.y) || !isFinite(end.x) || !isFinite(end.y)) return;

          const dx  = end.x - start.x;
          const dy  = end.y - start.y;
          const len = Math.hypot(dx, dy);
          if (len === 0) return;

          // Dim links whose endpoints are not on the selected path
          const linkOnPath = !pathSet || (pathSet.has(start.id) && pathSet.has(end.id));
          if (!linkOnPath) {
            ctx.save();
            ctx.globalAlpha = 0.06;
          }

          const sc = nodeColor(start);
          const tc = nodeColor(end);

          // Glow layer (wide, faint)
          const glowGrad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
          glowGrad.addColorStop(0, sc + '18');
          glowGrad.addColorStop(0.5, tc + '28');
          glowGrad.addColorStop(1, tc + '10');
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = glowGrad;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Core line (crisp)
          const lineGrad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
          lineGrad.addColorStop(0, sc + '55');
          lineGrad.addColorStop(1, tc + '33');
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Arrow head
          const angle  = Math.atan2(dy, dx);
          const endR   = nodeR(end) + 2;
          const ax     = end.x - endR * Math.cos(angle);
          const ay     = end.y - endR * Math.sin(angle);
          const spread = 0.38;
          const alen   = 5;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - alen * Math.cos(angle - spread), ay - alen * Math.sin(angle - spread));
          ctx.lineTo(ax - alen * Math.cos(angle + spread), ay - alen * Math.sin(angle + spread));
          ctx.closePath();
          ctx.fillStyle = tc + '66';
          ctx.fill();
          if (!linkOnPath) ctx.restore();
        }}
        linkCanvasObjectMode={() => 'replace'}
        /* Flowing particles along edges */
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={link => {
          const t = typeof link.target === 'object' ? link.target : {};
          return t.isRoot ? 2.5 : 1.5;
        }}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={link => {
          const t = typeof link.target === 'object' ? link.target : {};
          return nodeColor(t) + 'cc';
        }}
        /* Callbacks */
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        cooldownTicks={150}
        onEngineStop={() => fitGraph(300)}
        /* Custom node drawing */
        nodeCanvasObject={(node, ctx, globalScale) => {
          if (!isFinite(node.x) || !isFinite(node.y)) return;
          const r          = nodeR(node);
          const color      = nodeColor(node);
          const isSelected = selected?.id === node.id;
          const isHov      = hovered?.id  === node.id;

          // Path-to-root dimming: when a node is selected, dim nodes not on the path
          const onPath = !pathSet || pathSet.has(node.id);
          if (!onPath) {
            ctx.save();
            ctx.globalAlpha = 0.12;
          }

          // SEO severity ring (drawn before glow so it's under the node)
          const nodeIssues = issueIdx[node.path];
          if (nodeIssues && node.isScanned !== false) {
            const sevColor = nodeIssues.crits > 0 ? '#ff4444' : '#f5c542';
            const t = (Date.now() % 2000) / 2000;
            const sevPulse = nodeIssues.crits > 0
              ? r + 5 + 2.5 * Math.sin(t * 2 * Math.PI)
              : r + 4;
            ctx.beginPath();
            ctx.arc(node.x, node.y, sevPulse, 0, 2 * Math.PI);
            ctx.strokeStyle = sevColor + (nodeIssues.crits > 0
              ? Math.round(55 + 35 * Math.sin(t * 2 * Math.PI)).toString(16).padStart(2, '0')
              : '44');
            ctx.lineWidth = nodeIssues.crits > 0 ? 1.5 : 1;
            ctx.setLineDash(nodeIssues.crits > 0 ? [] : [3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Animated pulse ring for root node
          if (node.isRoot) {
            const t = (Date.now() % 2400) / 2400;
            const pulseA = r + 10 + 5 * Math.sin(t * 2 * Math.PI);
            const pulseB = r + 18 + 4 * Math.sin(t * 2 * Math.PI + Math.PI * 0.7);

            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseA, 0, 2 * Math.PI);
            ctx.strokeStyle = `${color}${Math.round(28 + 20 * Math.sin(t * 2 * Math.PI)).toString(16).padStart(2,'0')}`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseB, 0, 2 * Math.PI);
            ctx.strokeStyle = `${color}14`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          // Selection ring
          if (isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 7, 0, 2 * Math.PI);
            ctx.strokeStyle = `${color}99`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Outer glow — 3 layered radial gradients for depth
          const glowSizes = isSelected
            ? [r * 3.5, r * 2.2, r * 1.5]
            : isHov
            ? [r * 3,   r * 2,   r * 1.4]
            : [r * 2.5, r * 1.7, r * 1.3];

          const glowAlphas = ['14', '28', '44'];
          for (let i = 0; i < 3; i++) {
            const gr = ctx.createRadialGradient(node.x, node.y, r * 0.3, node.x, node.y, glowSizes[i]);
            gr.addColorStop(0, `${color}${glowAlphas[i]}`);
            gr.addColorStop(1, `${color}00`);
            ctx.beginPath();
            ctx.arc(node.x, node.y, glowSizes[i], 0, 2 * Math.PI);
            ctx.fillStyle = gr;
            ctx.fill();
          }

          // Core node fill with slight radial gradient (brighter center)
          const coreGrad = ctx.createRadialGradient(
            node.x - r * 0.2, node.y - r * 0.2, r * 0.05,
            node.x, node.y, r
          );
          coreGrad.addColorStop(0, color + 'ff');
          coreGrad.addColorStop(0.6, color + 'ee');
          coreGrad.addColorStop(1, color + 'aa');
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = coreGrad;
          ctx.fill();

          // Inner specular highlight
          const specGrad = ctx.createRadialGradient(
            node.x - r * 0.3, node.y - r * 0.3, 0,
            node.x - r * 0.3, node.y - r * 0.3, r * 0.55
          );
          specGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
          specGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = specGrad;
          ctx.fill();

          // Thin bright border ring
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.strokeStyle = color + (isHov || isSelected ? 'cc' : '55');
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Path label
          const label = node.path === '/' ? '/' : (node.path.split('/').filter(Boolean).pop() || node.path);
          const fontSize = Math.max(2.5, Math.min(3.5, 11 / Math.max(1, Math.sqrt(gData.nodes.length))));
          ctx.font = `${fontSize}px JetBrains Mono, monospace`;

          if (isHov || isSelected) {
            // Label background pill
            const tw = ctx.measureText(label.length > 14 ? label.slice(0, 13) + '…' : label).width;
            const lx = node.x - tw / 2 - 2;
            const ly = node.y + r + 1.5;
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(lx, ly, tw + 4, fontSize + 2.5);
            ctx.fillStyle = '#d4d4d4';
          } else {
            ctx.fillStyle = '#444';
          }
          ctx.textAlign = 'center';
          ctx.fillText(
            label.length > 14 ? label.slice(0, 13) + '…' : label,
            node.x,
            node.y + r + fontSize + 2
          );

          // Restore alpha if path-dimmed
          if (!onPath) ctx.restore();
        }}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={(node, color, ctx) => {
          if (!isFinite(node.x) || !isFinite(node.y)) return;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeR(node) + 4, 0, 2 * Math.PI);
          ctx.fill();
        }}
      />

      {/* Hover tooltip */}
      {hovered && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 16,
            top: mousePos.y - 12,
            pointerEvents: 'none',
            zIndex: 200,
          }}
          className="graph-tooltip"
        >
          <div className="graph-tooltip-path">{hovered.path}</div>
          <div className="graph-tooltip-meta">
            <span>in <b>{hovered.inbound}</b></span>
            <span>out <b>{hovered.outbound}</b></span>
            <span>depth <b>{hovered.depth === 99 ? '∞' : hovered.depth}</b></span>
          </div>
          {hovered.isOrphan  && <div className="graph-tooltip-tag" style={{ color: '#ff4444', borderColor: '#ff444433' }}>orphan</div>}
          {hovered.isDeadEnd && <div className="graph-tooltip-tag" style={{ color: '#f5c542', borderColor: '#f5c54233' }}>dead-end</div>}
          {hovered.isRoot    && <div className="graph-tooltip-tag" style={{ color: '#ff6b2b', borderColor: '#ff6b2b33' }}>root</div>}
          {/* Issue preview */}
          {(() => {
            const hi = issueIdx[hovered.path];
            if (!hi) return null;
            return (
              <div style={{ marginTop: 5, borderTop: '1px solid #1e1e1e', paddingTop: 5 }}>
                {hi.topIssues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 3 }}>
                    <span style={{
                      fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', flexShrink: 0, paddingTop: 1,
                      color: issue.sev === 'CRITICAL' ? '#ff4444' : '#f5c542',
                    }}>
                      {issue.sev === 'CRITICAL' ? '!' : '▲'}
                    </span>
                    <span style={{ fontSize: 9, color: '#888', lineHeight: 1.4 }}>{issue.msg}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Selected node detail panel */}
      {selected && (
        <div className="graph-node-detail">
          <button className="graph-node-close" onClick={() => { setSelected(null); fitGraph(400); }}>✕</button>
          <div className="graph-node-detail-path">{selected.path}</div>
          <div className="graph-node-detail-url">{selected.id}</div>
          <div className="graph-node-detail-metrics">
            {[
              { val: selected.inbound,  label: 'inbound',  color: '#22c55e' },
              { val: selected.outbound, label: 'outbound', color: '#4a9eff' },
              { val: selected.depth === 99 ? '∞' : selected.depth, label: 'depth', color: '#f5c542' },
            ].map(({ val, label, color }) => (
              <div key={label} className="graph-node-metric">
                <div className="graph-node-metric-val" style={{ color }}>{val}</div>
                <div className="graph-node-metric-label">{label}</div>
              </div>
            ))}
          </div>
          {selected.isOrphan  && <div className="graph-node-tag" style={{ color: '#ff4444', borderColor: '#ff444433' }}>ORPHAN — not reachable via internal links</div>}
          {selected.isDeadEnd && !selected.isOrphan && <div className="graph-node-tag" style={{ color: '#f5c542', borderColor: '#f5c54233' }}>DEAD END — no outbound internal links</div>}
          {/* Issue list for selected node */}
          {(() => {
            const si = issueIdx[selected.path];
            if (!si) return (
              <div style={{ fontSize: 8, color: '#22c55e55', letterSpacing: '0.08em', marginTop: 6 }}>NO ISSUES</div>
            );
            return (
              <div style={{ marginTop: 8, borderTop: '1px solid #1a1a1a', paddingTop: 7 }}>
                <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                  {si.crits > 0 && <span style={{ color: '#ff4444', marginRight: 8 }}>{si.crits} critical</span>}
                  {si.warnings > 0 && <span style={{ color: '#f5c542' }}>{si.warnings} warnings</span>}
                </div>
                {si.topIssues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: issue.sev === 'CRITICAL' ? '#ff4444' : '#f5c542', flexShrink: 0, paddingTop: 1 }}>
                      {issue.sev === 'CRITICAL' ? '!' : '▲'}
                    </span>
                    <span style={{ fontSize: 9, color: '#666', lineHeight: 1.4 }}>{issue.msg}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      <Legend />
      <InsightBar insights={graphData.insights} />
      </>)}
    </div>
  );
}
