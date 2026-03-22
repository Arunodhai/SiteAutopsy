const CLOUD_BASE    = 'https://api.firecrawl.dev/v1';
const CLOUD_BASE_V2 = 'https://api.firecrawl.dev/v2';

function headers(apiKey) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
}

export async function mapUrl(url, apiKey) {
  const res = await fetch(`${CLOUD_BASE}/map`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`mapUrl ${res.status}: ${body.slice(0, 120)}`);
  }
  return res.json();
}

export async function scrapeUrl(url, apiKey) {
  const res = await fetch(`${CLOUD_BASE}/scrape`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ url, formats: ['html', 'rawHtml', 'links'] }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`scrapeUrl ${res.status}: ${text.slice(0, 120)}`);

  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`scrapeUrl bad JSON: ${text.slice(0, 80)}`); }
  if (data.success === false) throw new Error(`scrapeUrl API error: ${data.error || JSON.stringify(data).slice(0, 80)}`);

  return data.data ?? data;
}

// Returns { screenshot: string|null, summary: string|null }
export async function scrapeSnapshot(url, apiKey) {
  const res = await fetch(`${CLOUD_BASE_V2}/scrape`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      url,
      onlyMainContent: false,
      formats: ['summary', { type: 'screenshot', fullPage: true }],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`scrapeSnapshot ${res.status}: ${text.slice(0, 120)}`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('scrapeSnapshot bad JSON'); }
  const result = data.data ?? data;
  return { screenshot: result.screenshot ?? null, summary: result.summary ?? null };
}

export async function scrapeBranding(url, apiKey) {
  const res = await fetch(`${CLOUD_BASE_V2}/scrape`, {
    method: 'POST',
    headers: headers(apiKey),
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
