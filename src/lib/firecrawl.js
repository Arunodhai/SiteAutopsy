const BASE = 'https://api.firecrawl.dev/v1';

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
