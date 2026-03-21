// Proxy routes defined in vite.config.js — avoids CORS when running locally
const INFER_URL  = '/nvidia-api/v1/chat/completions';
const STATUS_URL = '/nvidia-api/v1/status';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS  = 120_000; // 2 min max

async function pollForResult(requestId, apiKey, signal) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const res = await fetch(`${STATUS_URL}/${requestId}`, {
      signal,
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (res.status === 202) continue; // still processing
    if (!res.ok) throw new Error(`Poll error ${res.status}: ${await res.text().catch(() => '')}`);
    return res.json();
  }
  throw new Error('NVIDIA API timed out after 2 minutes');
}

function parseContent(data) {
  const text = data.choices[0].message.content.trim();
  // Strip <think>...</think> chain-of-thought blocks
  const noThink = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip markdown code fences if model wraps them
  const clean = noThink.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '');
  return JSON.parse(clean);
}

export async function kimiSummary(issues, domain, apiKey, signal) {
  // Only send non-OK issues, compact format, capped to avoid prompt size timeouts
  const nonOk = issues
    .filter(i => i.sev !== 'OK')
    .slice(0, 60)
    .map(i => `${i.sev}|${i.path || '/'}|${i.msg}`);

  const crits    = issues.filter(i => i.sev === 'CRITICAL').length;
  const warnings = issues.filter(i => i.sev === 'WARNING').length;

  const res = await fetch(INFER_URL, {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshotai/kimi-k2.5',
      max_tokens: 512,
      temperature: 0.6,
      top_p: 1,
      stream: false,
      chat_template_kwargs: { thinking: false },
      messages: [{
        role: 'user',
        content: `SEO audit for ${domain}. ${crits} critical, ${warnings} warnings.
Issues (sev|path|message):
${nonOk.join('\n')}

Reply ONLY with valid JSON, no markdown:
{"executiveSummary":"2 sentences","top3Fixes":[{"fix":"...","difficulty":"Easy"},{"fix":"...","difficulty":"Medium"},{"fix":"...","difficulty":"Hard"}],"score":0}
Replace score with 0-100 integer (start 100, minus 15 per CRITICAL, minus 5 per WARNING).
difficulty must be exactly Easy, Medium, or Hard.`,
      }],
    }),
  });

  // 202 = async processing — poll until done
  if (res.status === 202) {
    const reqId =
      res.headers.get('NVCF-ReqId') ||
      res.headers.get('nvcf-reqid') ||
      (await res.json().catch(() => null))?.id;
    if (!reqId) throw new Error('202 received but no request ID found for polling');
    const data = await pollForResult(reqId, apiKey, signal);
    return parseContent(data);
  }

  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`NVIDIA API error ${res.status}: ${err}`);
  }

  return parseContent(await res.json());
}
