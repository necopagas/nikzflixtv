// Kitsu API proxy endpoint
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, query, id, page = 1 } = req.query;
    let apiUrl = '';

    switch (action) {
      case 'search':
        // Search for manga by title
        apiUrl = `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(query)}&page[limit]=20&page[offset]=${(parseInt(page) - 1) * 20}`;
        break;

      case 'popular':
        // Get popular manga sorted by user count
        apiUrl = `https://kitsu.io/api/edge/manga?sort=-userCount&page[limit]=20&page[offset]=${(parseInt(page) - 1) * 20}`;
        break;

      case 'trending':
        // Get trending manga sorted by popularity rank
        apiUrl = `https://kitsu.io/api/edge/trending/manga?page[limit]=20&page[offset]=${(parseInt(page) - 1) * 20}`;
        break;

      case 'info':
        // Get specific manga details by ID
        apiUrl = `https://kitsu.io/api/edge/manga/${id}`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kitsu API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache for 10 minutes
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Kitsu API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from Kitsu API',
      message: error.message,
    });
  }
}
