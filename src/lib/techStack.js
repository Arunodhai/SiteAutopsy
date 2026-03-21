/**
 * Detect tech stack from raw HTML.
 * Returns array of { name, category, confidence }
 */

const SIGNATURES = [
  // Frameworks / SSR
  { name: 'Next.js',      category: 'framework', pattern: /__NEXT_DATA__|_next\/static/i },
  { name: 'Nuxt',         category: 'framework', pattern: /__nuxt|_nuxt\//i },
  { name: 'Gatsby',       category: 'framework', pattern: /gatsby-|__gatsby/i },
  { name: 'Remix',        category: 'framework', pattern: /remix-|__remixContext/i },
  { name: 'Astro',        category: 'framework', pattern: /astro-island|astro:page/i },
  { name: 'SvelteKit',    category: 'framework', pattern: /sveltekit|__sveltekit/i },

  // CMS / Builders
  { name: 'WordPress',    category: 'cms', pattern: /wp-content|wp-includes|wordpress/i },
  { name: 'Shopify',      category: 'cms', pattern: /shopify|cdn\.shopify\.com/i },
  { name: 'Webflow',      category: 'cms', pattern: /webflow\.com|data-wf-/i },
  { name: 'Squarespace',  category: 'cms', pattern: /squarespace\.com|static\.squarespace/i },
  { name: 'Wix',          category: 'cms', pattern: /wix\.com|wixsite\.com/i },
  { name: 'Ghost',        category: 'cms', pattern: /ghost-url|content\.ghost\.io/i },
  { name: 'Contentful',   category: 'cms', pattern: /contentful\.com/i },
  { name: 'Sanity',       category: 'cms', pattern: /sanity\.io|_sanity/i },

  // JS Libraries
  { name: 'React',        category: 'library', pattern: /react(?:dom)?(?:\.development|\.production)?\.min\.js|__reactFiber/i },
  { name: 'Vue',          category: 'library', pattern: /vue(?:\.runtime)?(?:\.min)?\.js|__vue_/i },
  { name: 'Angular',      category: 'library', pattern: /angular(?:\.min)?\.js|ng-version/i },
  { name: 'Svelte',       category: 'library', pattern: /svelte(?:\.min)?\.js/i },
  { name: 'Alpine.js',    category: 'library', pattern: /alpinejs|x-data=/i },
  { name: 'htmx',         category: 'library', pattern: /htmx\.org|hx-get=/i },
  { name: 'jQuery',       category: 'library', pattern: /jquery(?:\.min)?\.js|jquery-\d/i },

  // CSS Frameworks
  { name: 'Tailwind',     category: 'css', pattern: /tailwindcss|tailwind\.min\.css/i },
  { name: 'Bootstrap',    category: 'css', pattern: /bootstrap(?:\.min)?\.css|bootstrap(?:\.min)?\.js/i },

  // Analytics / Marketing
  { name: 'Google Analytics', category: 'analytics', pattern: /google-analytics\.com\/analytics|gtag\('config'/i },
  { name: 'Google Tag Manager', category: 'analytics', pattern: /googletagmanager\.com\/gtm\.js/i },
  { name: 'Segment',      category: 'analytics', pattern: /segment\.com\/analytics|analytics\.load\(/i },
  { name: 'Mixpanel',     category: 'analytics', pattern: /mixpanel\.com\/lib|mixpanel\.init/i },
  { name: 'Hotjar',       category: 'analytics', pattern: /hotjar\.com\/c\/hotjar/i },
  { name: 'Intercom',     category: 'analytics', pattern: /intercomcdn\.com|Intercom\(/i },
  { name: 'HubSpot',      category: 'analytics', pattern: /js\.hs-scripts\.com|hubspot\.com/i },

  // Infra / CDN
  { name: 'Vercel',       category: 'infra', pattern: /vercel\.app|x-vercel-/i },
  { name: 'Cloudflare',   category: 'infra', pattern: /cloudflare\.com|__cf_/i },
  { name: 'Fastly',       category: 'infra', pattern: /fastly\.net/i },
  { name: 'AWS',          category: 'infra', pattern: /amazonaws\.com|cloudfront\.net/i },
];

const CATEGORY_ORDER = ['framework', 'cms', 'library', 'css', 'analytics', 'infra'];

export function detectTechStack(html) {
  if (!html) return [];
  const found = SIGNATURES.filter(s => s.pattern.test(html));

  // Deduplicate: if Next.js found, React is implied — suppress React to reduce noise
  const names = new Set(found.map(s => s.name));
  const deduped = found.filter(s => {
    if (s.name === 'React' && (names.has('Next.js') || names.has('Gatsby') || names.has('Remix'))) return false;
    if (s.name === 'Vue' && names.has('Nuxt')) return false;
    if (s.name === 'Svelte' && names.has('SvelteKit')) return false;
    return true;
  });

  // Sort by category order
  return deduped.sort((a, b) =>
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );
}

const CATEGORY_COLOR = {
  framework: { bg: '#4a9eff18', color: '#4a9eff', border: '#4a9eff33' },
  cms:       { bg: '#a855f718', color: '#a855f7', border: '#a855f733' },
  library:   { bg: '#22c55e18', color: '#22c55e', border: '#22c55e33' },
  css:       { bg: '#f5c54218', color: '#f5c542', border: '#f5c54233' },
  analytics: { bg: '#ff6b2b18', color: '#ff6b2b', border: '#ff6b2b33' },
  infra:     { bg: '#88888818', color: '#888888', border: '#88888833' },
};

export function categoryStyle(category) {
  return CATEGORY_COLOR[category] || CATEGORY_COLOR.infra;
}
