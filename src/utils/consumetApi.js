// src/utils/consumetApi.js

const API_BASE_URL = 'https://api.consumet.org';

// I-check kung naa ta sa development environment (gikan sa Vite)
const IS_DEV = import.meta.env.DEV;

/**
 * Function to fetch data from the Consumet API.
 * (Dynamic based on environment)
 */
const fetchConsumetData = async (endpoint) => {
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
                   console.error("Consumet API returned HTML, possibly an error page or proxy issue.");
                   return null; // Return null if HTML
               }
               // Try parsing as JSON if not HTML
               return JSON.parse(errorBody); // Or handle specific JSON error structure
                } catch (parseError) {
                    console.error("Could not parse Consumet API error response.", parseError);
                    return null; // Return null if parsing fails
                }
        }
        return await response.json();
    } catch (error)
    {
        console.error("Failed to fetch from Consumet API:", error);
        // Return null on network error or other fetch issues
        return null;
    }
};


// --- GI-TANGGAL ANG searchMoviesAndTV ---

// --- MANGA FUNCTIONS (using Consumet) ---
export const searchManga = async (query) => {
    if (!query) return [];
    const response = await fetchConsumetData(`/manga/mangadex/${encodeURIComponent(query)}`);
    return response?.results || [];
};

export const searchYouTube = async (query) => {
    if (!query) return [];
    
    try {
        console.log('Starting YouTube search for:', query);
        
        // Use Invidious public instance for YouTube search
        const invidiousInstances = [
            'https://invidious.snopyta.org',
            'https://yewtu.be',
            'https://inv.riverside.rocks',
            'https://invidious.fdn.fr',
            'https://inv.vern.cc'
        ];
        
        let results = [];
        
        for (const instance of invidiousInstances) {
            try {
                console.log(`Trying instance: ${instance}`);
                const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                console.log(`Response status from ${instance}:`, response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Got ${data.length} results from ${instance}`);
                    
                    results = data.map(item => ({
                        id: item.videoId,
                        title: item.title,
                        videoId: item.videoId,
                        channel: {
                            name: item.author
                        },
                        snippet: {
                            channelTitle: item.author
                        }
                    }));
                    
                    if (results.length > 0) {
                        console.log('Success! Returning results from', instance);
                        break; // Break if successful
                    }
                }
            } catch (err) {
                console.log(`Failed to fetch from ${instance}:`, err.message);
                continue;
            }
        }
        
        console.log('Final results:', results);
        return results;
    } catch (error) {
        console.error('YouTube search error:', error);
        return [];
    }
};