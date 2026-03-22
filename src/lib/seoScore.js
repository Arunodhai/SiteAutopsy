/**
 * Professional SEO Scoring Engine
 *
 * Deterministic, rule-based scoring system using weighted categories.
 * Replaces LLM-generated scores for consistency and transparency.
 *
 * Categories & weights (total = 100):
 *   On-Page SEO        35pts  — title, meta description, H1, duplicate titles
 *   Technical SEO      25pts  — HTTPS, canonical, viewport, robots, structured data
 *   Content Quality    20pts  — thin content, images alt text
 *   Social & Sharing   10pts  — OG tags, Twitter card, OG image
 *   Performance        10pts  — preload hints, font optimization, sitemap
 *
 * Scoring method:
 *   Per-page checks are averaged across all crawled pages.
 *   Site-wide signals (from root HTML) contribute directly.
 */

const WEIGHTS = {
  onPage:      35,
  technical:   25,
  content:     20,
  social:      10,
  performance: 10,
};

/**
 * Calculate SEO score from issues and root HTML signals.
 *
 * @param {Array} issues     - All Issue objects from checks.js
 * @param {number} totalPages - Number of pages crawled
 * @param {string} rootHtml  - Raw HTML of root page (for signal detection)
 * @param {string} rootUrl   - Root URL (for HTTPS check)
 * @param {object} rootMeta  - Metadata from root page scrape
 * @returns {{ score: number, breakdown: object, grade: string }}
 */
export function calculateSeoScore(issues, totalPages, rootHtml = '', rootUrl = '', rootMeta = {}) {
  if (!totalPages || totalPages === 0) return { score: 0, breakdown: {}, grade: 'F' };

  const html = rootHtml || '';
  const pageIssues = issues.filter(i => i.sev !== 'OK');

  // ── On-Page SEO (35pts) ──────────────────────────────────────
  const onPage = calcOnPage(issues, pageIssues, totalPages);

  // ── Technical SEO (25pts) ────────────────────────────────────
  const technical = calcTechnical(issues, pageIssues, totalPages, html, rootUrl, rootMeta);

  // ── Content Quality (20pts) ──────────────────────────────────
  const content = calcContent(issues, pageIssues, totalPages);

  // ── Social & Sharing (10pts) ─────────────────────────────────
  const social = calcSocial(issues, pageIssues, totalPages, html, rootMeta);

  // ── Performance (10pts) ──────────────────────────────────────
  const performance = calcPerformance(html);

  // ── Final score ──────────────────────────────────────────────
  const breakdown = { onPage, technical, content, social, performance };
  const score = Math.round(
    onPage.score     * (WEIGHTS.onPage / 100) +
    technical.score  * (WEIGHTS.technical / 100) +
    content.score    * (WEIGHTS.content / 100) +
    social.score     * (WEIGHTS.social / 100) +
    performance.score * (WEIGHTS.performance / 100)
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown,
    grade: scoreToGrade(score),
  };
}

// ─── On-Page SEO ───────────────────────────────────────────────

function calcOnPage(allIssues, pageIssues, totalPages) {
  // Title: missing = 0, bad length = 50, good = 100
  const missingTitle = countPages(pageIssues, /missing.*<title>|missing.*title.*tag/i, 'CRITICAL');
  const badTitle     = countPages(pageIssues, /<title>.*length|title.*length/i, 'WARNING');
  const titleScore   = avgPageScore(totalPages, missingTitle, badTitle);

  // Meta description: missing = 0, bad length = 50, good = 100
  const missingDesc = countPages(pageIssues, /missing.*meta.*desc|missing.*description/i, 'CRITICAL');
  const badDesc     = countPages(pageIssues, /meta.*desc.*length|description.*length/i, 'WARNING');
  const descScore   = avgPageScore(totalPages, missingDesc, badDesc);

  // H1: missing = 0, multiple = 50, good = 100
  const missingH1  = countPages(pageIssues, /missing.*<h1>|missing.*h1.*tag/i, 'CRITICAL');
  const multipleH1 = countPages(pageIssues, /multiple.*h1/i, 'WARNING');
  const h1Score    = avgPageScore(totalPages, missingH1, multipleH1);

  // Duplicate titles: count unique pages with dupes
  const dupePages = countPages(pageIssues, /duplicate.*<title>|duplicate.*title/i, 'WARNING');
  const dupeScore = totalPages > 0 ? ((totalPages - dupePages) / totalPages) * 100 : 100;

  // Weighted sub-scores within on-page (title 30%, desc 25%, h1 25%, dupes 20%)
  const score = titleScore * 0.30 + descScore * 0.25 + h1Score * 0.25 + dupeScore * 0.20;

  return {
    score: Math.round(score),
    details: {
      title:      { score: Math.round(titleScore), missing: missingTitle, badLength: badTitle },
      description:{ score: Math.round(descScore),  missing: missingDesc,  badLength: badDesc },
      h1:         { score: Math.round(h1Score),     missing: missingH1,   multiple: multipleH1 },
      duplicates: { score: Math.round(dupeScore),   pages: dupePages },
    },
  };
}

// ─── Technical SEO ─────────────────────────────────────────────

function calcTechnical(allIssues, pageIssues, totalPages, html, rootUrl, meta) {
  // HTTPS (20% of technical)
  const https = rootUrl.startsWith('https://') ? 100 : 0;

  // Canonical (25% of technical) — per-page
  const missingCanon = countPages(pageIssues, /missing.*canonical/i, 'WARNING');
  const canonScore = totalPages > 0 ? ((totalPages - missingCanon) / totalPages) * 100 : 100;

  // Viewport (20% of technical) — per-page
  const missingViewport = countPages(pageIssues, /missing.*viewport/i, 'WARNING');
  const viewportScore = totalPages > 0 ? ((totalPages - missingViewport) / totalPages) * 100 : 100;

  // Robots noindex (20% of technical) — pages with noindex penalized heavily
  const noindexPages = countPages(pageIssues, /noindex/i, 'CRITICAL');
  const robotsScore = totalPages > 0 ? ((totalPages - noindexPages) / totalPages) * 100 : 100;

  // Structured data (15% of technical) — site-wide from root
  const hasSchema = /application\/ld\+json/i.test(html) || /itemscope/i.test(html) ||
    !!(meta?.jsonLd || meta?.schema || meta?.structuredData);
  const schemaScore = hasSchema ? 100 : 0;

  const score = https * 0.20 + canonScore * 0.25 + viewportScore * 0.20 +
                robotsScore * 0.20 + schemaScore * 0.15;

  return {
    score: Math.round(score),
    details: {
      https:          { score: https },
      canonical:      { score: Math.round(canonScore), missing: missingCanon },
      viewport:       { score: Math.round(viewportScore), missing: missingViewport },
      robots:         { score: Math.round(robotsScore), noindex: noindexPages },
      structuredData: { score: schemaScore, present: hasSchema },
    },
  };
}

// ─── Content Quality ───────────────────────────────────────────

function calcContent(allIssues, pageIssues, totalPages) {
  // Images alt text (50% of content)
  const pagesWithMissingAlt = countPages(pageIssues, /image.*missing.*alt|missing.*alt.*text/i, 'WARNING');
  const altScore = totalPages > 0 ? ((totalPages - pagesWithMissingAlt) / totalPages) * 100 : 100;

  // Thin content (50% of content)
  const thinPages = countPages(pageIssues, /thin.*content/i, 'WARNING');
  const thinScore = totalPages > 0 ? ((totalPages - thinPages) / totalPages) * 100 : 100;

  const score = altScore * 0.50 + thinScore * 0.50;

  return {
    score: Math.round(score),
    details: {
      altText:     { score: Math.round(altScore), pagesWithIssues: pagesWithMissingAlt },
      thinContent: { score: Math.round(thinScore), pages: thinPages },
    },
  };
}

// ─── Social & Sharing ──────────────────────────────────────────

function calcSocial(allIssues, pageIssues, totalPages, html, meta) {
  // OG tags (50% of social) — per-page
  const missingOg = countPages(pageIssues, /missing.*og.*tag/i, 'WARNING');
  const ogScore = totalPages > 0 ? ((totalPages - missingOg) / totalPages) * 100 : 100;

  // Twitter card (25% of social) — site-wide from root
  const hasTwitter = /<meta[^>]+name=["']twitter:card["'][^>]*content=/i.test(html);
  const twitterScore = hasTwitter ? 100 : 0;

  // OG image (25% of social) — site-wide from root
  const hasOgImage = /property=["']og:image["']/i.test(html) || !!meta?.ogImage;
  const ogImageScore = hasOgImage ? 100 : 0;

  const score = ogScore * 0.50 + twitterScore * 0.25 + ogImageScore * 0.25;

  return {
    score: Math.round(score),
    details: {
      ogTags:      { score: Math.round(ogScore), missing: missingOg },
      twitterCard: { score: twitterScore, present: hasTwitter },
      ogImage:     { score: ogImageScore, present: hasOgImage },
    },
  };
}

// ─── Performance ───────────────────────────────────────────────

function calcPerformance(html) {
  // Preload hints (30%)
  const hasPreload = /rel=["']preload["']/i.test(html);
  const preloadScore = hasPreload ? 100 : 0;

  // Font optimization (30%)
  const hasFontOpt = /font-display|preload.*font/i.test(html);
  const fontScore = hasFontOpt ? 100 : 0;

  // Sitemap reference (20%)
  const hasSitemap = /href=["'][^"']*sitemap[^"']*["']/i.test(html);
  const sitemapScore = hasSitemap ? 100 : 0;

  // Robots meta — having a robots meta = crawl guidance (20%)
  const hasRobotsMeta = /name=["']robots["']/i.test(html);
  const robotsMetaScore = hasRobotsMeta ? 100 : 0;

  const score = preloadScore * 0.30 + fontScore * 0.30 + sitemapScore * 0.20 + robotsMetaScore * 0.20;

  return {
    score: Math.round(score),
    details: {
      preload:  { score: preloadScore, present: hasPreload },
      fontOpt:  { score: fontScore, present: hasFontOpt },
      sitemap:  { score: sitemapScore, present: hasSitemap },
      robotsMeta: { score: robotsMetaScore, present: hasRobotsMeta },
    },
  };
}

// ─── Helpers ───────────────────────────────────────────────────

/** Count unique pages matching a pattern + severity */
function countPages(issues, pattern, sev) {
  return [...new Set(
    issues.filter(i => i.sev === sev && pattern.test(i.msg)).map(i => i.path)
  )].length;
}

/** Average score: missing pages get 0, warning pages get 50, rest get 100 */
function avgPageScore(total, missing, warnings) {
  if (total === 0) return 100;
  const good = total - missing - warnings;
  return ((good * 100 + warnings * 50) / total);
}

/** Convert numeric score to letter grade */
function scoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
