// ─── Helpers ────────────────────────────────────────────────────────────────

function rgbToHex(r, g, b) {
  return [r, g, b].map(v => Math.min(255, +v).toString(16).padStart(2, '0')).join('');
}

function expandHex(h) {
  return h.length === 3 ? h.split('').map(c => c + c).join('') : h;
}

function isBoringColor(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (r < 25 && g < 25 && b < 25) return true;    // near-black
  if (r > 230 && g > 230 && b > 230) return true;  // near-white
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max - min < 18) return true;                  // near-gray
  return false;
}

const SYSTEM_FONTS = new Set([
  'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
  'arial', 'helvetica', 'georgia', 'times new roman', 'courier new',
  'verdana', 'tahoma', 'trebuchet ms', 'impact',
  'inherit', 'initial', 'unset', 'revert', 'none',
  '-apple-system', 'blinkmacsystemfont', 'system-ui', 'segoe ui',
  'roboto', 'oxygen', 'ubuntu', 'cantarell', 'helvetica neue',
  'noto sans', 'source sans pro', 'ui-sans-serif', 'ui-serif', 'ui-monospace',
]);

function isSystemFont(name) {
  return SYSTEM_FONTS.has(name.toLowerCase().trim());
}

// ─── CSS collection ─────────────────────────────────────────────────────────

function collectCss(doc) {
  const parts = [];

  // 1. Inline <style> tags
  for (const el of doc.querySelectorAll('style')) {
    parts.push(el.textContent);
  }

  // 2. Inline style attributes — build a fake CSS block from them
  for (const el of doc.querySelectorAll('[style]')) {
    parts.push(`__inline__ { ${el.getAttribute('style')} }`);
  }

  return parts.join('\n');
}

// ─── Favicon ────────────────────────────────────────────────────────────────

function extractFavicon(doc, rootUrl, domain) {
  const rels = [
    'link[rel="icon"][sizes="32x32"]',
    'link[rel="icon"][sizes="64x64"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
  ];
  for (const sel of rels) {
    const el = doc.querySelector(sel);
    const href = el?.getAttribute('href');
    if (href && !href.startsWith('data:')) {
      try { return new URL(href, rootUrl).href; } catch { /* skip */ }
    }
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// ─── Logo ───────────────────────────────────────────────────────────────────

function extractLogo(doc, rootUrl) {
  // img-based logos
  const imgSelectors = [
    'img[class*="logo" i]', 'img[id*="logo" i]', 'img[alt*="logo" i]',
    'a[class*="logo" i] img', 'a[id*="logo" i] img',
    '.logo img', '#logo img', '[class*="navbar"] img', '[class*="header"] img',
    'header a img', 'nav a:first-child img', 'a[href="/"] img',
    'header img:first-of-type',
  ];
  for (const sel of imgSelectors) {
    try {
      const el = doc.querySelector(sel);
      const src = el?.getAttribute('src');
      if (src && !src.startsWith('data:') && src.length < 600) {
        return new URL(src, rootUrl).href;
      }
    } catch { /* skip */ }
  }
  return null;
}

// ─── Colors ─────────────────────────────────────────────────────────────────

function extractColors(css, doc) {
  const counts = {};

  const addHex = (hex) => {
    if (!isBoringColor(hex)) counts[hex] = (counts[hex] || 0) + 1;
  };

  // 1. theme-color meta
  const themeColor = doc.querySelector('meta[name="theme-color"]')?.getAttribute('content');
  if (themeColor?.startsWith('#')) {
    const hex = expandHex(themeColor.slice(1).toLowerCase());
    if (hex.length === 6) { addHex(hex); counts[hex] = (counts[hex] || 0) + 9; } // boost
  }

  // 2. CSS hex colors
  const hexRe = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
  let m;
  while ((m = hexRe.exec(css)) !== null) {
    addHex(expandHex(m[1].toLowerCase()));
  }

  // 3. rgb() / rgba()
  const rgbRe = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi;
  while ((m = rgbRe.exec(css)) !== null) {
    addHex(rgbToHex(m[1], m[2], m[3]));
  }

  // 4. CSS custom properties (--color-*, --primary, etc.)
  const varRe = /--(?:color|primary|accent|brand|bg|background|foreground|text)[^:]*:\s*(#[0-9a-f]{3,6}|rgba?\([^)]+\))/gi;
  while ((m = varRe.exec(css)) !== null) {
    const val = m[1].trim();
    if (val.startsWith('#')) {
      const hex = expandHex(val.slice(1).toLowerCase());
      if (hex.length === 6) { addHex(hex); counts[hex] = (counts[hex] || 0) + 4; } // boost vars
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => '#' + hex);
}

// ─── Fonts ──────────────────────────────────────────────────────────────────

function extractFonts(css, doc) {
  const fonts = new Map(); // name → role

  // 1. Google Fonts <link>
  for (const link of doc.querySelectorAll('link[href*="fonts.googleapis.com"]')) {
    const href = link.getAttribute('href') || '';
    const fam = href.match(/family=([^&?#]+)/i);
    if (fam) {
      decodeURIComponent(fam[1]).split('|').forEach((f, i) => {
        const name = f.split(':')[0].replace(/\+/g, ' ').trim();
        if (name && !isSystemFont(name) && !fonts.has(name)) {
          fonts.set(name, i === 0 ? 'body' : 'heading');
        }
      });
    }
  }

  // 2. Font preload links (self-hosted fonts)
  for (const link of doc.querySelectorAll('link[rel="preload"][as="font"]')) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/([^/]+?)\.(woff2?|ttf|otf)/i);
    if (match) {
      const raw = match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      // strip weight suffixes like Regular, Bold, Italic
      const name = raw.replace(/\s*(Regular|Bold|Italic|Light|Medium|SemiBold|Black|Thin|ExtraBold)\s*/gi, '').trim();
      if (name.length > 1 && !isSystemFont(name) && !fonts.has(name)) {
        fonts.set(name, 'custom');
      }
    }
  }

  // 3. @font-face
  const ffRe = /@font-face\s*\{[^}]*font-family\s*:\s*['"]?([^;'"{}]+)['"]?/gi;
  let m;
  while ((m = ffRe.exec(css)) !== null) {
    const name = m[1].trim();
    if (name && !isSystemFont(name) && !fonts.has(name)) fonts.set(name, 'custom');
  }

  // 4. font-family declarations
  const famRe = /font-family\s*:\s*([^;{}]+)/gi;
  while ((m = famRe.exec(css)) !== null) {
    for (const part of m[1].split(',')) {
      const name = part.trim().replace(/['"]/g, '').trim();
      if (name && !isSystemFont(name) && !fonts.has(name) && name.length < 60 && !name.startsWith('var(')) {
        fonts.set(name, 'unknown');
        break;
      }
    }
  }

  return [...fonts.entries()].slice(0, 6).map(([name, role]) => ({ name, role }));
}

// ─── Typography ─────────────────────────────────────────────────────────────

function extractTypography(css) {
  function findSize(selectors) {
    for (const sel of selectors) {
      const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(
        `(?:^|[^\\w-])${escaped}\\s*(?:[^{]*?)\\{[^}]*?font-size\\s*:\\s*([^;\\s}]+)`,
        'im'
      );
      const match = css.match(re);
      if (match) return match[1].trim();
    }
    return null;
  }
  return {
    h1:   findSize(['h1', '.h1', '[class*="h1"]']),
    h2:   findSize(['h2', '.h2']),
    body: findSize(['body', 'p', ':root']),
  };
}

// ─── Spacing ────────────────────────────────────────────────────────────────

function extractSpacing(css) {
  const varMatch = css.match(/--(?:border-radius|radius)[^:]*:\s*([^;}\s]+)/i);
  const cssMatch = css.match(/(?:^|[^-])border-radius\s*:\s*([^;]+)/im);
  const raw = varMatch?.[1] || cssMatch?.[1];
  return { borderRadius: raw ? raw.trim().split(/\s+/)[0] : null };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function extractBranding(rootUrl, metadata, rawHtml) {
  const domain = (() => { try { return new URL(rootUrl).hostname; } catch { return rootUrl; } })();
  const doc = new DOMParser().parseFromString(rawHtml || '', 'text/html');
  const css = collectCss(doc);

  const ogImage = metadata?.ogImage
    || doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
    || null;

  return {
    domain,
    favicon:    extractFavicon(doc, rootUrl, domain),
    ogImage,
    logo:       extractLogo(doc, rootUrl),
    colors:     extractColors(css, doc),
    fonts:      extractFonts(css, doc),
    typography: extractTypography(css),
    spacing:    extractSpacing(css),
  };
}
