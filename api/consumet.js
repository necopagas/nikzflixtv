// Serverless function to proxy Consumet Manga API
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
    const { provider, action, query, id } = req.query;

    if (!provider || !action) {
      return res.status(400).json({ error: 'provider and action parameters are required' });
    }

    let apiUrl = `https://api.consumet.org/manga/${provider}`;

    // Build URL based on action
    switch (action) {
      case 'search':
        if (!query) return res.status(400).json({ error: 'query parameter required for search' });
        apiUrl += `/${encodeURIComponent(query)}`;
        break;
      case 'info':
        if (!id) return res.status(400).json({ error: 'id parameter required for info' });
        apiUrl += `/info?id=${encodeURIComponent(id)}`;
        break;
      case 'read':
        if (!id) return res.status(400).json({ error: 'id parameter required for read' });
        apiUrl += `/read?chapterId=${encodeURIComponent(id)}`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: search, info, or read' });
    }

    console.log('Fetching from Consumet:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'NikzFlixTV/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Consumet API error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'Consumet API request failed',
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
      error: 'Failed to fetch from Consumet API',
      message: error.message,
    });
  }
}
