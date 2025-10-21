// src/utils/consumetApi.js

const API_BASE_URL = 'https://api.consumet.org';
// --- GIBALIK ANG XYRASTREAM NGA URL BASE SA IMONG FETCH EXAMPLE ---
const XYRASTREAM_API_BASE_URL = 'https://api.xyrastream.live/v1/dramacool';
const XYRASTREAM_API_KEY = "key1"; // Ang imong API key

/**
 * Function to fetch data from the Consumet API.
 */
const fetchConsumetData = async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Consumet API Error: ${response.status} for URL: ${url}`);
        }
        return await response.json();
    } catch (error)
    {
        console.error("Failed to fetch from Consumet API:", error);
        return null;
    }
};

/**
 * Function to fetch data from the XyraStream API using POST.
 * (Base sa imong gi-provide nga example)
 */
const fetchXyraStreamData = async (endpoint, body) => {
    const url = `${XYRASTREAM_API_BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ ...body, api_key: XYRASTREAM_API_KEY, }),
        });
        if (!response.ok) {
            throw new Error(`XyraStream API Error: ${response.status} for URL: ${url}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch from XyraStream API at ${endpoint}:`, error);
        return null;
    }
};

// --- General Search Function (Gigamit ang daan nga flixhq) ---
export const searchMoviesAndTV = async (query) => {
    if (!query) return [];
    // Kini mogamit sa api.consumet.org/movies/flixhq/
    const response = await fetchConsumetData(`/movies/flixhq/${encodeURIComponent(query)}`);
    return response?.results || [];
};


// --- DRAMA/MOVIES FUNCTIONS (Gigamit ang XyraStream) ---

export const searchDramas = async (query) => {
    if (!query) return [];
    // Endpoint: /search
    const response = await fetchXyraStreamData('/search', { query });
    return response?.results || [];
};

export const getRecentDramas = async (page = 1) => {
    // Endpoint: /recent-episodes
    const response = await fetchXyraStreamData('/recent-episodes', { page });
    return response?.results || [];
};

export const getDramaDetails = async (dramaId) => {
    if (!dramaId) return null;
    // Endpoint: /info
    return await fetchXyraStreamData('/info', { id: dramaId });
};

export const getDramaEpisodeSources = async (episodeId) => {
    if (!episodeId) return null;
    // Endpoint: /watch
    return await fetchXyraStreamData('/watch', { episodeId: episodeId });
};