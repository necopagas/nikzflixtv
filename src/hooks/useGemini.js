// src/hooks/useGemini.js
// Small client helper to call the server-side /api/gemini proxy.
export async function callGemini(
  providerUrl,
  payload = {},
  options = { method: 'POST', useQueryKey: false }
) {
  const body = {
    providerUrl,
    method: options.method || 'POST',
    payload,
    useQueryKey: !!options.useQueryKey,
  };

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err?.error || 'AI proxy request failed');
  }

  return res.json();
}

/* Usage examples:
// 1) Generic call to provider endpoint that accepts a JSON body
const providerUrl = 'https://api.provider.example/v1/chat:generate';
const payload = { prompt: 'Summarize the current channel in 2 sentences.' };
const result = await callGemini(providerUrl, payload);

// 2) If provider requires an API key via query string instead of Authorization header
// await callGemini('https://api.google.example/v1/xxx', payload, { useQueryKey: true });

Note: This helper assumes your server endpoint is reachable at /api/gemini and that
the server will attach the API key from process.env.GEMINI_API_KEY.
*/
