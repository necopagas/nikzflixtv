// Serverless function to proxy MangaDex API requests
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { endpoint } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    // Build MangaDex API URL
    const apiUrl = `https://api.mangadex.org${endpoint}`;

    console.log('Fetching from MangaDex:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'NikzFlixTV/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('MangaDex API error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'MangaDex API request failed',
        status: response.status,
      });
    }

    const data = await response.json();

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from MangaDex',
      message: error.message,
    });
  }
}
