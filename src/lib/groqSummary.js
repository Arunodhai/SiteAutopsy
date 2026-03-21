const GROQ_URL = '/groq-api/openai/v1/chat/completions';

function parseContent(data) {
  const text = data.choices[0].message.content.trim();
  const clean = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '');
  return JSON.parse(clean);
}

export async function groqSummary(issues, domain, apiKey, signal) {
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
        content: `You are an SEO analyst. Issues found on ${domain}:
${JSON.stringify(issues, null, 2)}

Respond ONLY with valid JSON, no markdown, no code blocks:
{
  "executiveSummary": "2 sentence summary",
  "top3Fixes": [
    {"fix": "specific actionable fix", "difficulty": "Easy"},
    {"fix": "specific actionable fix", "difficulty": "Medium"},
    {"fix": "specific actionable fix", "difficulty": "Hard"}
  ],
  "score": <0-100>
}
difficulty must be exactly "Easy", "Medium", or "Hard".
Score: start at 100, subtract 15 per CRITICAL issue and 5 per WARNING, minimum 0.`,
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  return parseContent(await res.json());
}
