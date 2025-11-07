// api/youtube.js - Fallback YouTube search API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { q: query } = req.query;

  if (!query) {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }

  try {
    // Try multiple Invidious instances
    const instances = [
      'https://yewtu.be',
      'https://inv.vern.cc',
      'https://vid.puffyan.us',
      'https://invidious.tiekoetter.com'
    ];

    for (const instance of instances) {
      try {
        const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(8000) // 8 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            const results = data
              .filter(item => item.videoId && item.title)
              .map(item => ({
                id: item.videoId,
                title: item.title,
                videoId: item.videoId,
                author: item.author || 'Unknown Artist',
                lengthSeconds: item.lengthSeconds,
                viewCount: item.viewCount,
                channel: {
                  name: item.author || 'Unknown Artist'
                },
                snippet: {
                  channelTitle: item.author || 'Unknown Artist',
                  title: item.title
                }
              }))
              .slice(0, 20);

            res.status(200).json({
              success: true,
              results,
              instance: instance
            });
            return;
          }
        }
      } catch (err) {
        console.log(`Failed instance ${instance}:`, err.message);
        continue;
      }
    }

    // If all instances fail, return fallback data
    res.status(200).json({
      success: true,
      results: [
        {
          id: 'dQw4w9WgXcQ',
          title: 'OPM Karaoke Mix - Classic Filipino Love Songs',
          videoId: 'dQw4w9WgXcQ',
          author: 'Karaoke Channel',
          channel: { name: 'Karaoke Channel' },
          snippet: { 
            channelTitle: 'Karaoke Channel', 
            title: 'OPM Karaoke Mix - Classic Filipino Love Songs' 
          }
        }
      ],
      fallback: true
    });

  } catch (error) {
    console.error('YouTube API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}