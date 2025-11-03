// src/utils/fetchData.js
export const fetchData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`API Error: ${response.status} for URL: ${url}`);
            if (response.status === 401) {
                alert("Error: Invalid API Key. Please get a new one from themoviedb.org.");
            }
            return { results: [] };
        }
        return await response.json();
    } catch (error) {
        console.error(`Fetch failed for ${url}:`, error);
        // Return empty results instead of throwing to prevent app crashes
        return { results: [] };
    }
};