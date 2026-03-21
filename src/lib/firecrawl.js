const BASE   = 'https://api.firecrawl.dev/v1';
const BASE_V2 = 'https://api.firecrawl.dev/v2';

export async function mapUrl(url, apiKey) {
  const res = await fetch(`${BASE}/map`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`mapUrl ${res.status}: ${body.slice(0, 120)}`);
  }
  return res.json(); // { links: [...] }
}

export async function scrapeUrl(url, apiKey) {
  const res = await fetch(`${BASE}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ url, formats: ['html', 'rawHtml', 'links'] }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`scrapeUrl ${res.status}: ${text.slice(0, 120)}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`scrapeUrl bad JSON: ${text.slice(0, 80)}`);
  }

  if (data.success === false) {
    throw new Error(`scrapeUrl API error: ${data.error || JSON.stringify(data).slice(0, 80)}`);
  }

  // Firecrawl v1 wraps result in data.data
  return data.data ?? data;
}

// Returns { screenshot: string|null, summary: string|null }
export async function scrapeSnapshot(url, apiKey) {
  const res = await fetch(`${BASE_V2}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      url,
      onlyMainContent: false,
      formats: [
        'summary',
        { type: 'screenshot', fullPage: true },
      ],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`scrapeSnapshot ${res.status}: ${text.slice(0, 120)}`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('scrapeSnapshot bad JSON'); }
  const result = data.data ?? data;
  return {
    screenshot: result.screenshot ?? null,
    summary:    result.summary    ?? null,
  };
}

export async function scrapeBranding(url, apiKey) {
  const res = await fetch(`${BASE_V2}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ url, formats: ['branding'] }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`scrapeBranding ${res.status}: ${text.slice(0, 120)}`);

  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`scrapeBranding bad JSON`); }
  if (data.success === false) throw new Error(`scrapeBranding: ${data.error || 'unknown error'}`);

  const result = data.data ?? data;
  return result.branding ?? null;
}
