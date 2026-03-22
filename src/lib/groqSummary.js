import { aggregateIssues } from './aggregateIssues.js';

const GROQ_URL = '/groq-api/openai/v1/chat/completions';

function parseContent(data) {
  const text = data.choices[0].message.content.trim();
  const clean = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '');
  return JSON.parse(clean);
}

export async function groqSummary(issues, domain, apiKey, signal) {
  const aggregated = aggregateIssues(issues);
  const crits    = issues.filter(i => i.sev === 'CRITICAL').length;
  const warnings = issues.filter(i => i.sev === 'WARNING').length;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.6,
      stream: false,
      messages: [{
        role: 'user',
        content: `SEO audit for ${domain}. ${crits} critical, ${warnings} warnings across ${issues.length} total findings.
Issues (sev|affected pages|message):
${aggregated.join('\n')}

Respond ONLY with valid JSON, no markdown, no code blocks:
{"executiveSummary":"2 sentence summary","siteSummary":"1 sentence describing what this website is and who it serves","top3Fixes":[{"fix":"specific actionable fix","difficulty":"Easy"},{"fix":"specific actionable fix","difficulty":"Medium"},{"fix":"specific actionable fix","difficulty":"Hard"}]}
difficulty must be exactly "Easy", "Medium", or "Hard".`,
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  return parseContent(await res.json());
}
