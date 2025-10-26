// src/utils/consumetApi.js

const API_BASE_URL = 'https://api.consumet.org';
const XYRASTREAM_API_BASE_URL = 'https://api.xyrastream.live/v1/dramacool';
const XYRASTREAM_API_KEY = "key1"; // Ang imong API key

// I-check kung naa ta sa development environment (gikan sa Vite)
const IS_DEV = import.meta.env.DEV;

/**
 * Function to fetch data from the Consumet API.
 * (Dynamic based on environment)
 */
const fetchConsumetData = async (endpoint) => {
    // Kung DEV, gamit sa Vite proxy. Kung PROD, gamit sa Vercel proxy.
    const url = IS_DEV 
        ? `/api/consumet${endpoint}` // Para sa Vite (e.g., /api/consumet/utils/youtube/...)
        : `/api/proxy?url=${encodeURIComponent(`${API_BASE_URL}${endpoint}`)}`; // Para sa Vercel

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
 * (Dynamic based on environment)
 */
const fetchXyraStreamData = async (endpoint, body) => {
    const targetUrl = `${XYRASTREAM_API_BASE_URL}${endpoint}`;
    
    // Kung DEV, gamit sa Vite proxy. Kung PROD, gamit sa Vercel proxy.
    const url = IS_DEV
        ? `/api/xyra/v1/dramacool${endpoint}` // Para sa Vite (e.g., /api/xyra/v1/dramacool/search)
        : `/api/proxy?url=${encodeURIComponent(targetUrl)}`; // Para sa Vercel
    
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
    // Kini mogamit na sa sakto nga proxy (consumet)
    const response = await fetchConsumetData(`/movies/flixhq/${encodeURIComponent(query)}`);
    return response?.results || [];
};

/**
 * Searches YouTube via Consumet API.
 */
export const searchYouTube = async (query) => {
    if (!query) return [];
    // Kini mogamit na sa sakto nga proxy (consumet)
    const response = await fetchConsumetData(`/utils/youtube/search/${encodeURIComponent(query)}`);
    return response?.results && Array.isArray(response.results) ? response.results : [];
};


// --- DRAMA/MOVIES FUNCTIONS (Gigamit ang XyraStream) ---

export const searchDramas = async (query) => {
    if (!query) return [];
    // Endpoint: /search (Mogamit na ni sa XyraStream proxy)
    const response = await fetchXyraStreamData('/search', { query });
    return response?.results || [];
};

export const getRecentDramas = async (page = 1) => {
    // Endpoint: /recent-episodes (Mogamit na ni sa XyraStream proxy)
    const response = await fetchXyraStreamData('/recent-episodes', { page });
    return response?.results || [];
};

export const getDramaDetails = async (dramaId) => {
    if (!dramaId) return null;
    // Endpoint: /info (Mogamit na ni sa XyraStream proxy)
    return await fetchXyraStreamData('/info', { id: dramaId });
};

export const getDramaEpisodeSources = async (episodeId) => {
    if (!episodeId) return null;
    // Endpoint: /watch (Mogamit na ni sa XyraStream proxy)
    return await fetchXyraStreamData('/watch', { episodeId: episodeId });
};
