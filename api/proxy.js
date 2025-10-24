// File: /api/proxy.js
import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL is required');
  }

  // Ibutang ang CORS headers para sa tanan nga tubag
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, api_key');

  // I-handle ang OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let axiosConfig = {
      method: req.method,
      url: url,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(req.headers.api_key && { 'api_key': req.headers.api_key }),
      },
    };

    // Kung POST, ipasa ang body
    if (req.method === 'POST') {
      axiosConfig.data = req.body;
    }

    // --- BAG-ONG LOGIC ---
    // I-stream lang ang actual video/audio segments, DILI ang manifest files
    if (url.includes('.ts') || url.includes('.m4s') || url.includes('.aac') || url.includes('.vtt')) {
      axiosConfig.responseType = 'stream';
    } else {
      // Para sa manifest (.m3u8, .mpd) or API calls, default response type (json/text)
      axiosConfig.responseType = 'default'; 
    }
    // --- END SA BAG-ONG LOGIC ---

    const response = await axios(axiosConfig);

    // Kopyaha ang headers gikan sa target response
    Object.entries(response.headers).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    // I-stream o ipadala ang data
    if (axiosConfig.responseType === 'stream') {
      response.data.pipe(res);
    } else {
      res.status(response.status).send(response.data);
    }

  } catch (error) {
    console.error('Proxy error:', error.message);
    const status = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data : 'Failed to fetch resource';
    res.status(status).send(message);
  }
}