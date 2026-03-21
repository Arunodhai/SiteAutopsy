/**
 * runChecks(url, metadata, html) → Issue[]
 * Issue: { sev: 'CRITICAL'|'WARNING'|'INFO'|'OK', msg: String, path: String }
 */
// Non-HTML resource extensions — skip HTML-specific SEO checks for these
const NON_HTML_EXT = /\.(xml|txt|pdf|json|rss|atom|csv|xlsx|docx|zip|png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$/i;

export function runChecks(url, metadata = {}, html = '') {
  const issues = [];
  const path = (() => { try { return new URL(url).pathname; } catch { return url; } })();

  // Skip non-HTML resources — checking them for title/h1/meta produces false positives
  if (NON_HTML_EXT.test(path)) {
    return [{ sev: 'INFO', msg: `Skipped — non-HTML resource (${path.split('.').pop()})`, path }];
  }

  // Title check
  const title = metadata?.title || '';
  if (!title) {
    issues.push({ sev: 'CRITICAL', msg: 'Missing <title> tag', path });
  } else if (title.length < 10 || title.length > 60) {
    issues.push({ sev: 'WARNING', msg: `<title> length ${title.length} (ideal: 10–60 chars)`, path });
  } else {
    issues.push({ sev: 'OK', msg: `<title> looks good (${title.length} chars)`, path });
  }

  // Meta description
  const desc = metadata?.description || '';
  if (!desc) {
    issues.push({ sev: 'CRITICAL', msg: 'Missing meta description', path });
  } else if (desc.length < 50 || desc.length > 160) {
    issues.push({ sev: 'WARNING', msg: `Meta description length ${desc.length} (ideal: 50–160 chars)`, path });
  } else {
    issues.push({ sev: 'OK', msg: `Meta description looks good (${desc.length} chars)`, path });
  }

  // H1 check
  const h1Matches = html ? (html.match(/<h1[\s>]/gi) || []) : [];
  if (h1Matches.length === 0) {
    issues.push({ sev: 'CRITICAL', msg: 'Missing <h1> tag', path });
  } else if (h1Matches.length > 1) {
    issues.push({ sev: 'WARNING', msg: `Multiple <h1> tags found (${h1Matches.length})`, path });
  } else {
    issues.push({ sev: 'OK', msg: '<h1> tag present (exactly 1)', path });
  }

  // Images alt text
  if (html) {
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const missingAlt = imgTags.filter(tag => !/alt\s*=/i.test(tag));
    if (missingAlt.length > 0) {
      issues.push({ sev: 'WARNING', msg: `${missingAlt.length} image(s) missing alt text`, path });
    } else if (imgTags.length > 0) {
      issues.push({ sev: 'OK', msg: `All ${imgTags.length} image(s) have alt text`, path });
    }
  }

  // Canonical tag — prefer metadata.canonical (reliable), fall back to HTML scan
  if (html || metadata?.canonicalUrl !== undefined) {
    const hasCanonical = !!(
      metadata?.canonicalUrl ||
      metadata?.canonical ||
      (html && /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html))
    );
    if (!hasCanonical) {
      issues.push({ sev: 'WARNING', msg: 'Missing canonical tag', path });
    } else {
      issues.push({ sev: 'OK', msg: 'Canonical tag present', path });
    }
  }

  // OG tags
  const ogTitle = metadata?.ogTitle || (html && /<meta[^>]+property=["']og:title["'][^>]*>/i.test(html));
  const ogDesc = metadata?.ogDescription || (html && /<meta[^>]+property=["']og:description["'][^>]*>/i.test(html));
  if (!ogTitle || !ogDesc) {
    issues.push({ sev: 'WARNING', msg: `Missing OG tags: ${[!ogTitle && 'og:title', !ogDesc && 'og:description'].filter(Boolean).join(', ')}`, path });
  } else {
    issues.push({ sev: 'OK', msg: 'OG tags (title + description) present', path });
  }

  // Robots noindex — page is blocked from search engines
  const robotsMeta = metadata?.robots || (html && (html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i) || [])[1]) || '';
  if (/noindex/i.test(robotsMeta)) {
    issues.push({ sev: 'CRITICAL', msg: 'Page has noindex — blocked from search engines', path });
  }

  // Viewport meta — prefer metadata field, fall back to HTML scan
  {
    const hasViewport = !!(
      metadata?.viewport ||
      (html && /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html))
    );
    if (!hasViewport) {
      issues.push({ sev: 'WARNING', msg: 'Missing viewport meta tag — not mobile-friendly', path });
    }
  }

  // Schema markup (JSON-LD) — Firecrawl strips <script> tags from HTML,
  // so rely primarily on metadata fields it extracts
  {
    const hasSchemaInHtml = html
      ? /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(html)
      : false;
    const hasSchemaInMeta = !!(
      metadata?.jsonLd ||
      metadata?.schema ||
      metadata?.structuredData ||
      metadata?.['@type'] ||
      // Firecrawl sometimes surfaces schema fields at top level
      metadata?.priceRange ||   // Restaurant
      metadata?.ratingValue ||  // Review schema
      metadata?.addressLocality // LocalBusiness
    );
    if (!hasSchemaInHtml && !hasSchemaInMeta) {
      issues.push({ sev: 'INFO', msg: 'No structured data (JSON-LD) found', path });
    }
  }

  // Thin content — strip tags and count words
  if (html) {
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[\s\S]*?<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ').trim();
    const wordCount = text ? text.split(' ').filter(w => w.length > 1).length : 0;
    if (wordCount > 0 && wordCount < 100) {
      issues.push({ sev: 'WARNING', msg: `Thin content — only ~${wordCount} words on page`, path });
    }
  }

  return issues;
}

/**
 * Check for duplicate titles across all pages
 */
export function checkDuplicateTitles(allIssues, pageMetadata) {
  const titleMap = {};
  pageMetadata.forEach(({ url, title }) => {
    if (!title) return;
    if (!titleMap[title]) titleMap[title] = [];
    titleMap[title].push(url);
  });

  const duplicateIssues = [];
  Object.entries(titleMap).forEach(([title, urls]) => {
    if (urls.length > 1) {
      urls.forEach(url => {
        const path = (() => { try { return new URL(url).pathname; } catch { return url; } })();
        duplicateIssues.push({
          sev: 'WARNING',
          msg: `Duplicate <title> found on ${urls.length} pages: "${title.substring(0, 40)}${title.length > 40 ? '…' : ''}"`,
          path,
        });
      });
    }
  });

  return duplicateIssues;
}
