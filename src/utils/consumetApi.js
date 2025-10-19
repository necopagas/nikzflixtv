// src/utils/consumetApi.js

const API_BASE_URL = 'https://api.consumet.org';

/**
 * Main function to fetch data from the Consumet API.
 */
const fetchConsumetData = async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Consumet API Error: ${response.status} for URL: ${url}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch from Consumet API:", error);
        return null;
    }
};


// --- MANGA FUNCTIONS ---

export const getTrendingManga = async (page = 1, perPage = 18) => {
    const response = await fetchConsumetData(`/meta/anilist-manga/trending?page=${page}&perPage=${perPage}`);
    return response?.results || [];
};

export const searchManga = async (query) => {
    if (!query) return [];
    const response = await fetchConsumetData(`/manga/mangadex/${encodeURIComponent(query)}`);
    return response?.results || [];
};

export const getMangaDetails = async (mangaId) => {
    if (!mangaId) return null;
    return await fetchConsumetData(`/manga/mangadex/info/${mangaId}`);
};

export const getChapterPages = async (chapterId) => {
    if (!chapterId) return [];
    const response = await fetchConsumetData(`/manga/mangadex/read/${chapterId}`);
    return response || [];
};


// --- DRAMA/MOVIES FUNCTIONS ---

/**
 * Searches for dramas on DramaCool.
 * @param {string} query - The search term.
 * @returns {Promise<Array>} - A list of drama search results.
 */
export const searchDramas = async (query) => {
    if (!query) return [];
    const response = await fetchConsumetData(`/movies/dramacool/${encodeURIComponent(query)}`);
    return response?.results || [];
};

/**
 * Gets the most recently added drama episodes from DramaCool.
 * @param {number} page - The page number.
 * @returns {Promise<Array>} - A list of recent dramas.
 */
export const getRecentDramas = async (page = 1) => {
    const response = await fetchConsumetData(`/movies/dramacool/recent-episodes?page=${page}`);
    return response?.results || [];
};

/**
 * Gets detailed information and episode list for a specific drama.
 * @param {string} dramaId - The ID of the drama.
 * @returns {Promise<object|null>} - The drama details or null if not found.
 */
export const getDramaDetails = async (dramaId) => {
    if (!dramaId) return null;
    return await fetchConsumetData(`/movies/dramacool/info?id=${dramaId}`);
};

/**
 * Gets the streaming sources for a specific drama episode.
 * @param {string} episodeId - The ID of the episode.
 * @returns {Promise<object|null>} - An object containing streaming sources.
 */
export const getDramaEpisodeSources = async (episodeId) => {
    if (!episodeId) return null;
    return await fetchConsumetData(`/movies/dramacool/watch?episodeId=${episodeId}`);
};