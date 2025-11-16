// api/vivamax.js
// Server-side endpoint to fetch Vivamax movies from TMDB
// Uses discover endpoint with company filter (149142) for better results
// Implements in-memory caching (TTL) and per-IP rate limiting.
import axios from 'axios';

const CACHE = new Map(); // key -> { expiresAt, data }
const RATE = new Map(); // ip -> { count, resetAt }
const TTL_MS = 1000 * 60 * 5; // 5 minutes
const MAX_PER_HOUR = 120; // per IP

const API_KEY = process.env.TMDB_API_KEY || '';
const DEFAULT_KEY = API_KEY || '3b0f392b6173455e37624a78bd5f79d4';

export default async function handler(req, res) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Rate limiting
    const rate = RATE.get(ip) || { count: 0, resetAt: now + 1000 * 60 * 60 };
    if (now > rate.resetAt) {
      rate.count = 0;
      rate.resetAt = now + 1000 * 60 * 60;
    }
    rate.count += 1;
    RATE.set(ip, rate);
    if (rate.count > MAX_PER_HOUR) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const page = parseInt(req.query.page || '1', 10) || 1;
    const cacheKey = `vivamax:page:${page}`;
    const cached = CACHE.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return res.status(200).json({ cached: true, ...cached.data });
    }

    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${DEFAULT_KEY}&with_companies=149142&sort_by=popularity.desc&page=${page}`;
    const resp = await axios.get(url, { timeout: 10000 });
    const data = resp.data;

    // Log for debugging
    console.log(
      `Vivamax API response: ${data.results?.length || 0} results, page ${data.page}, total ${data.total_results}`
    );

    CACHE.set(cacheKey, { expiresAt: now + TTL_MS, data });

    res.setHeader('Cache-Control', `public, max-age=${Math.floor(TTL_MS / 1000)}`);
    return res.status(200).json({ cached: false, ...data });
  } catch (err) {
    console.error('vivamax proxy error', err?.response?.data || err.message);
    return res
      .status(err?.response?.status || 500)
      .json({ error: err?.response?.data || err.message });
  }
}
