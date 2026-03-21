/**
 * Build a force-graph data structure from a map of page → internal links.
 * linkMap: { absoluteUrl: [absoluteUrl, ...] }
 * rootUrl: the starting URL of the scan
 */
const MAX_DISCOVERED    = 15; // cap on unscanned hub nodes shown
const MIN_INBOUND_DISC  = 3;  // discovered node must be linked from ≥ N scanned pages

export function buildGraphData(linkMap, rootUrl) {
  const scannedSet = new Set(Object.keys(linkMap));
  if (rootUrl) scannedSet.add(rootUrl);

  // Count how many distinct scanned pages reference each unscanned target
  const refCount = {};
  for (const targets of Object.values(linkMap)) {
    const unique = new Set(targets || []);
    for (const t of unique) {
      if (!scannedSet.has(t)) refCount[t] = (refCount[t] || 0) + 1;
    }
  }

  // Paths that are platform internals, not real content pages
  const INTERNAL_PATH = /^\/(profile|_serverless|_api|_partials|_functions|_next|api\/)(\/|$)/i;

  // Pick the top MAX_DISCOVERED most-referenced unscanned nodes (skip platform internals)
  const topDiscovered = Object.entries(refCount)
    .filter(([url, c]) => {
      if (c < MIN_INBOUND_DISC) return false;
      try { return !INTERNAL_PATH.test(new URL(url).pathname); } catch { return false; }
    })
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_DISCOVERED)
    .map(([url]) => url);

  const discoveredSet = new Set([...scannedSet, ...topDiscovered]);
  const urlSet = discoveredSet;

  // Count inbound/outbound
  const inbound  = {};
  const outbound = {};
  for (const u of urlSet) { inbound[u] = 0; outbound[u] = 0; }

  const edgeSet = new Set();
  const links   = [];

  for (const [source, targets] of Object.entries(linkMap)) {
    if (!urlSet.has(source)) continue;
    for (const target of (targets || [])) {
      if (!urlSet.has(target) || target === source) continue;
      const key = `${source}→${target}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      links.push({ source, target });
      outbound[source] = (outbound[source] || 0) + 1;
      inbound[target]  = (inbound[target]  || 0) + 1;
    }
  }

  // BFS depth from root
  const depth   = {};
  const visited = new Set();
  if (rootUrl && urlSet.has(rootUrl)) {
    depth[rootUrl] = 0;
    visited.add(rootUrl);
    const queue = [rootUrl];
    while (queue.length) {
      const url = queue.shift();
      for (const target of (linkMap[url] || [])) {
        if (urlSet.has(target) && !visited.has(target)) {
          visited.add(target);
          depth[target] = depth[url] + 1;
          queue.push(target);
        }
      }
    }
  }

  const nodes = [...urlSet].map(url => {
    let path;
    try { path = new URL(url).pathname || '/'; } catch { path = url; }
    const isScanned = scannedSet.has(url);
    return {
      id:         url,
      path,
      inbound:    inbound[url]  || 0,
      outbound:   outbound[url] || 0,
      depth:      depth[url] ?? 99,
      isOrphan:   isScanned && (inbound[url] || 0) === 0 && url !== rootUrl,
      isDeadEnd:  isScanned && (outbound[url] || 0) === 0,
      isRoot:     url === rootUrl,
      isScanned,
    };
  });

  // Insights
  const orphans   = nodes.filter(n => n.isOrphan);
  const deepPages = nodes.filter(n => n.depth > 3 && n.depth < 99);
  const deadEnds  = nodes.filter(n => n.isDeadEnd && !n.isOrphan && !n.isRoot);
  const root      = nodes.find(n => n.isRoot);

  // Detect if most orphans are content-discovery paths (search, tags, shots, posts, etc.)
  // On such sites pages are found via search/browse/infinite-scroll, not <a> links —
  // so they look like orphans even though they're reachable.
  const CONTENT_PATH = /^\/(shots?|search|tags?|stories|posts?|articles?|photos?|products?|collections?|categories?|explore|feed|topics?)\b/i;
  const orphanContentRatio = orphans.length
    ? orphans.filter(n => CONTENT_PATH.test(n.path)).length / orphans.length
    : 0;
  const isContentSite = orphanContentRatio >= 0.5;

  const insights = [];
  if (orphans.length) {
    const caveat = isContentSite ? ' (may be reachable via search/browse — not a true crawl error)' : '';
    const sev = isContentSite ? 'WARNING' : 'CRITICAL';
    insights.push({ sev, msg: `${orphans.length} orphan page${orphans.length > 1 ? 's' : ''} — no inbound links found${caveat}` });
  }
  if (deepPages.length)
    insights.push({ sev: 'WARNING', msg: `${deepPages.length} page${deepPages.length > 1 ? 's' : ''} more than 3 clicks from homepage` });
  if ((root?.outbound || 0) > 50)
    insights.push({ sev: 'WARNING', msg: `Homepage links to ${root.outbound} pages — consider consolidating navigation` });
  if (deadEnds.length > 2)
    insights.push({ sev: 'INFO', msg: `${deadEnds.length} dead-end pages with no outbound internal links` });
  if (nodes.length > 3 && orphans.length / nodes.length > 0.3) {
    const sev = isContentSite ? 'WARNING' : 'CRITICAL';
    const caveat = isContentSite ? ' — typical for search-discovery sites' : ' — poor site architecture';
    insights.push({ sev, msg: `${Math.round(orphans.length / nodes.length * 100)}% of pages have no inbound links${caveat}` });
  }

  return { nodes, links, insights };
}

/** Strip www. prefix for loose domain comparison */
const bareHost = h => h.replace(/^www\./, '').toLowerCase();

/**
 * Normalise a URL to a canonical string.
 * - Strips query, hash, trailing slash
 * - Lowercases pathname
 * - Matches both www/non-www variants of baseDomain
 * - Returns URL using baseDomain as the canonical host
 */
export function normaliseUrl(href, baseDomain, base = null) {
  try {
    const u = base ? new URL(href, base) : new URL(href);
    // Only http/https
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    // Domain match: allow www/non-www to be treated as same
    if (bareHost(u.hostname) !== bareHost(baseDomain)) return null;
    // Normalize pathname: lowercase, strip index.html/index.htm, remove trailing slash
    let path = u.pathname.toLowerCase();
    path = path.replace(/\/index\.html?$/, '');   // /foo/index.html → /foo
    path = path.replace(/\/$/, '') || '/';         // /foo/ → /foo, '' → /
    return `${u.protocol}//${baseDomain}${path}`;
  } catch {
    return null;
  }
}
