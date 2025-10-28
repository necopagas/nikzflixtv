// api/gemini.js
// Simple secure proxy to forward requests to an AI provider using a server-side API key.
// IMPORTANT: Do NOT commit your API key. Set it in your environment as GEMINI_API_KEY.
// Load .env during local development so a .env file in the repo root works.
import 'dotenv/config';
import axios from 'axios';

export default async function handler(req, res) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'Missing server API key (GEMINI_API_KEY)' });

  // Expect body: { providerUrl: string, method?: 'POST'|'GET', payload?: any, useQueryKey?: boolean }
  const { providerUrl, method = 'POST', payload = null, useQueryKey = false } = req.body || {};

  if (!providerUrl || typeof providerUrl !== 'string') {
    return res.status(400).json({ error: 'providerUrl must be provided in request body' });
  }

  try {
    // Allow caller to request the key be attached as a query parameter (some Google APIs accept ?key=)
    let targetUrl = providerUrl;
    if (useQueryKey) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}key=${encodeURIComponent(API_KEY)}`;
    }

    const axiosConfig = {
      url: targetUrl,
      method: method.toLowerCase(),
      headers: {
        'Content-Type': 'application/json',
        // Primary auth method: Bearer token in Authorization header
        Authorization: `Bearer ${API_KEY}`,
      },
      timeout: 20000,
      // allow passing null payload for GET
      data: payload && Object.keys(payload).length ? payload : undefined,
      // We intentionally do not stream by default here; this is for JSON-like requests.
    };

    const providerResp = await axios(axiosConfig);

    // Forward status and data
    return res.status(providerResp.status).json(providerResp.data);
  } catch (err) {
    console.error('gemini proxy error:', err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { error: err.message };
    return res.status(status).json(data);
  }
}
