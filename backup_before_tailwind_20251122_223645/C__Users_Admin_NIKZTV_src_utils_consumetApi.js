// src/utils/consumetApi.js

const API_BASE_URL = 'https://api.consumet.org';

// I-check kung naa ta sa development environment (gikan sa Vite)
const IS_DEV = import.meta.env.DEV;

/**
 * Function to fetch data from the Consumet API.
 * (Dynamic based on environment)
 * NOTE: Currently unused as manga functions are deprecated
 */
const _UNUSED_fetchConsumetData = async endpoint => {
  // During development we use the Vite dev server proxy at /api/proxy
  // which is configured in vite.config.js to forward to https://api.consumet.org
  const url = IS_DEV
    ? `/api/proxy${endpoint}`
    : `/api/proxy?url=${encodeURIComponent(`${API_BASE_URL}${endpoint}`)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Return null instead of throwing error immediately, handle error in component
      console.error(`Consumet API Error: ${response.status} for URL: ${url}`);
      // Try parsing error if possible, otherwise return null
      try {
        const errorBody = await response.text();
        // Check if it's HTML
        if (errorBody.trim().startsWith('<!doctype')) {
          console.error('Consumet API returned HTML, possibly an error page or proxy issue.');
          return null; // Return null if HTML
        }
        // Try parsing as JSON if not HTML
        return JSON.parse(errorBody); // Or handle specific JSON error structure
      } catch (parseError) {
        console.error('Could not parse Consumet API error response.', parseError);
        return null; // Return null if parsing fails
      }
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch from Consumet API:', error);
    // Return null on network error or other fetch issues
    return null;
  }
};

// --- GI-TANGGAL ANG searchMoviesAndTV ---

// --- MANGA FUNCTIONS (deprecated - now using direct manga sources) ---
export const searchManga = async () => {
  console.warn('searchManga is deprecated - use manga sources directly');
  return [];
};

export const getTrendingManga = async () => {
  console.warn('getTrendingManga is deprecated - use manga sources directly');
  return [];
};

export const getMangaDetails = async () => {
  console.warn('getMangaDetails is deprecated - use manga sources directly');
  return null;
};

export const searchYouTube = async query => {
  if (!query) return [];

  try {
    console.log('Starting YouTube search for:', query);

    // First try our own API endpoint if available
    try {
      const apiResponse = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        if (apiData.success && apiData.results.length > 0) {
          console.log('Success from API endpoint!');
          return apiData.results;
        }
      }
    } catch {
      console.log('API endpoint not available, trying Invidious directly');
    }

    // Use working Invidious public instances for YouTube search
    const invidiousInstances = [
      'https://yewtu.be',
      'https://inv.vern.cc',
      'https://invidious.tiekoetter.com',
      'https://vid.puffyan.us',
      'https://invidious.sethforprivacy.com',
      'https://inv.riverside.rocks',
      'https://invidious.flokinet.to',
    ];

    let results = [];

    for (const instance of invidiousInstances) {
      try {
        console.log(`Trying instance: ${instance}`);
        const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`;

        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`Response status from ${instance}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`Got ${data.length} results from ${instance}`);

          if (Array.isArray(data) && data.length > 0) {
            results = data
              .filter(item => item.videoId && item.title) // Filter out invalid items
              .map(item => ({
                id: item.videoId,
                title: item.title,
                videoId: item.videoId,
                author: item.author || 'Unknown Artist',
                lengthSeconds: item.lengthSeconds,
                viewCount: item.viewCount,
                channel: {
                  name: item.author || 'Unknown Artist',
                },
                snippet: {
                  channelTitle: item.author || 'Unknown Artist',
                  title: item.title,
                },
              }))
              .slice(0, 20); // Limit to 20 results

            if (results.length > 0) {
              console.log('Success! Returning results from', instance);
              break; // Break if successful
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log(`Request timeout for ${instance}`);
        } else {
          console.log(`Failed to fetch from ${instance}:`, err.message);
        }
        continue;
      }
    }

    if (results.length === 0) {
      console.warn('All Invidious instances failed. Returning fallback data.');
      // Return some fallback karaoke videos as a last resort
      results = [
        {
          id: 'dQw4w9WgXcQ',
          title: 'OPM Karaoke Mix - Classic Filipino Love Songs',
          videoId: 'dQw4w9WgXcQ',
          author: 'Karaoke Channel',
          channel: { name: 'Karaoke Channel' },
          snippet: {
            channelTitle: 'Karaoke Channel',
            title: 'OPM Karaoke Mix - Classic Filipino Love Songs',
          },
        },
      ];
    }

    console.log('Final results:', results);
    return results;
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
};
