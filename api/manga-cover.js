// Serverless function to proxy manga cover images
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
    const { mangaId, fileName, size = '256' } = req.query;

    if (!mangaId || !fileName) {
      return res.status(400).json({ error: 'mangaId and fileName parameters are required' });
    }

    // Build MangaDex cover URL
    const coverUrl = `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.${size}.jpg`;

    console.log('Fetching cover:', coverUrl);

    const response = await fetch(coverUrl, {
      headers: {
        'User-Agent': 'NikzFlixTV/1.0',
        Referer: 'https://mangadex.org/',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch cover:', response.status, response.statusText);
      // Return a placeholder image
      return res.redirect(
        307,
        `https://via.placeholder.com/${size}x${Math.floor(size * 1.5)}?text=No+Cover`
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Set content type and cache headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache for 24 hours

    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Proxy error:', error);
    // Return placeholder on error
    const size = req.query.size || '256';
    return res.redirect(
      307,
      `https://via.placeholder.com/${size}x${Math.floor(size * 1.5)}?text=No+Cover`
    );
  }
}
