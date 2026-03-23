export default function CpuArchitecture({
  text = 'SEO',
  showChip = true,
  showCpuConnections = true,
  animateText = true,
  lineMarkerSize = 6,
  animateLines = true,
  animateMarkers = true,
  style = {},
}) {
  return (
    <svg
      style={{ color: '#161616', ...style }}
      width="100%"
      height="100%"
      viewBox="0 0 200 100"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Peripheral clip — hides everything inside the hero content zone */}
      <defs>
        <clipPath id="cpu-periphery-clip">
          {/* evenodd: full canvas minus the center content rectangle */}
          <path fillRule="evenodd" d="M0,0 H200 V100 H0 Z M52,24 H148 V76 H52 Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#cpu-periphery-clip)">

      {/* Paths */}
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth="0.3"
        strokeDasharray="100 100"
        pathLength="100"
        markerStart="url(#cpu-circle-marker)"
      >
        <path strokeDasharray="100 100" pathLength="100" d="M 10 20 h 79.5 q 5 0 5 5 v 30" />
        <path strokeDasharray="100 100" pathLength="100" d="M 180 10 h -69.7 q -5 0 -5 5 v 30" />
        <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" />
        <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" />
        <path strokeDasharray="100 100" pathLength="100" d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20" />
        <path d="M 94.8 95 v -36" />
        <path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14" />
        <path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20" />
        {animateLines && (
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        )}
      </g>

      {/* Colored light particles */}
      <g mask="url(#cpu-mask-1)">
        <circle className="cpu-architecture cpu-line-1" cx="0" cy="0" r="8" fill="url(#cpu-orange-grad-a)" />
      </g>
      <g mask="url(#cpu-mask-2)">
        <circle className="cpu-architecture cpu-line-2" cx="0" cy="0" r="8" fill="url(#cpu-orange-grad-b)" />
      </g>
      <g mask="url(#cpu-mask-3)">
        <circle className="cpu-architecture cpu-line-3" cx="0" cy="0" r="8" fill="url(#cpu-orange-grad-c)" />
      </g>
      <g mask="url(#cpu-mask-4)">
        <circle className="cpu-architecture cpu-line-4" cx="0" cy="0" r="8" fill="url(#cpu-white-grad)" />
      </g>
      <g mask="url(#cpu-mask-5)">
        <circle className="cpu-architecture cpu-line-5" cx="0" cy="0" r="8" fill="url(#cpu-orange-grad-d)" />
      </g>
      <g mask="url(#cpu-mask-6)">
        <circle className="cpu-architecture cpu-line-6" cx="0" cy="0" r="8" fill="url(#cpu-orange-grad-e)" />
      </g>
      <g mask="url(#cpu-mask-7)">
        <circle className="cpu-architecture cpu-line-7" cx="0" cy="0" r="8" fill="url(#cpu-dim-grad)" />
      </g>
      <g mask="url(#cpu-mask-8)">
        <circle className="cpu-architecture cpu-line-8" cx="0" cy="0" r="8" fill="url(#cpu-orange-grad-f)" />
      </g>

      </g> {/* end periphery clip group */}

      {/* CPU Box */}
      {showChip && <g>
        {showCpuConnections && (
          <g fill="url(#cpu-connection-gradient)">
            <rect x="93" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="104" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="116.3" y="44" width="2.5" height="5" rx="0.7" transform="rotate(90 116.25 45.5)" />
            <rect x="122.8" y="44" width="2.5" height="5" rx="0.7" transform="rotate(90 116.25 45.5)" />
            <rect x="104" y="16" width="2.5" height="5" rx="0.7" transform="rotate(180 105.25 39.5)" />
            <rect x="114.5" y="16" width="2.5" height="5" rx="0.7" transform="rotate(180 105.25 39.5)" />
            <rect x="80" y="-13.6" width="2.5" height="5" rx="0.7" transform="rotate(270 115.25 19.5)" />
            <rect x="87" y="-13.6" width="2.5" height="5" rx="0.7" transform="rotate(270 115.25 19.5)" />
          </g>
        )}
        <rect x="85" y="40" width="30" height="20" rx="2" fill="#141414" filter="url(#cpu-light-shadow)" />
        <text
          x="92" y="52.5" fontSize="7"
          fill={animateText ? 'url(#cpu-text-gradient)' : '#888'}
          fontWeight="600"
          letterSpacing="0.05em"
          fontFamily="'JetBrains Mono', monospace"
        >
          {text}
        </text>
      </g>}

      <defs>
        {/* Masks */}
        <mask id="cpu-mask-1"><path d="M 10 20 h 79.5 q 5 0 5 5 v 24" strokeWidth="0.5" stroke="white" /></mask>
        <mask id="cpu-mask-2"><path d="M 180 10 h -69.7 q -5 0 -5 5 v 24" strokeWidth="0.5" stroke="white" /></mask>
        <mask id="cpu-mask-3"><path d="M 130 20 v 21.8 q 0 5 -5 5 h -25" strokeWidth="0.5" stroke="white" /></mask>
        <mask id="cpu-mask-4"><path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -65" strokeWidth="0.5" stroke="white" /></mask>
        <mask id="cpu-mask-5"><path d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -35" strokeWidth="0.5" stroke="white" /></mask>
        <mask id="cpu-mask-6"><path d="M 94.8 95 v -46" strokeWidth="0.5" stroke="white" /></mask>
        <mask id="cpu-mask-7"><path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 28" strokeWidth="0.5" stroke="white" /></mask>
        <mask id="cpu-mask-8"><path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 35" strokeWidth="0.5" stroke="white" /></mask>

        {/* Orange-themed gradients (matching app accent color) */}
        <radialGradient id="cpu-orange-grad-a" fx="1">
          <stop offset="0%" stopColor="#ff6b2b" />
          <stop offset="50%" stopColor="#ff8c50" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad-b" fx="1">
          <stop offset="0%" stopColor="#ffaa60" />
          <stop offset="50%" stopColor="#ff6b2b" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad-c" fx="1">
          <stop offset="0%" stopColor="#ff6b2b" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-white-grad" fx="1">
          <stop offset="0%" stopColor="#888" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad-d" fx="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad-e" fx="1">
          <stop offset="0%" stopColor="#ff6b2b" />
          <stop offset="50%" stopColor="#ffaa60" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-dim-grad" fx="1">
          <stop offset="0%" stopColor="#555" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad-f" fx="1">
          <stop offset="0%" stopColor="#ff8c50" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <filter id="cpu-light-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1.5" dy="1.5" stdDeviation="1" floodColor="black" floodOpacity="0.2" />
        </filter>
        <marker id="cpu-circle-marker" viewBox="0 0 10 10" refX="5" refY="5" markerWidth={lineMarkerSize} markerHeight={lineMarkerSize}>
          <circle cx="5" cy="5" r="2" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="0.5">
            {animateMarkers && <animate attributeName="r" values="0; 3; 2" dur="0.5s" />}
          </circle>
        </marker>
        <linearGradient id="cpu-connection-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="60%" stopColor="#111" />
        </linearGradient>
        <linearGradient id="cpu-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#444">
            <animate attributeName="offset" values="-2; -1; 0" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="25%" stopColor="#ff6b2b">
            <animate attributeName="offset" values="-1; 0; 1" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="50%" stopColor="#444">
            <animate attributeName="offset" values="0; 1; 2" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
        </linearGradient>
      </defs>
    </svg>
  );
}
