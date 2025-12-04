import { MOVIE_GENRES, ANIME_GENRES } from '../config'; // Import nato ang genre lists

// Maghimo ta og Map para paspas ang pagpangita sa genre name
const genreMap = new Map();

// Isulod ang Movie/TV genres
MOVIE_GENRES.forEach(genre => {
    if (!genreMap.has(genre.id)) { // Likayan ang duplicate IDs kung naa man
        genreMap.set(genre.id, genre.name);
    }
});

// Isulod ang Anime genres (overwrites movie genres if IDs clash, which is fine)
ANIME_GENRES.forEach(genre => {
     // Handle the custom Isekai ID separately if needed, but the mapping works
    genreMap.set(genre.id, genre.name); 
});

/**
 * Mokuha sa mga ngalan sa genre base sa lista sa IDs.
 * @param {number[]} genreIds - Array sa genre IDs (e.g., [28, 12, 16]).
 * @returns {string[]} - Array sa mga genre names (e.g., ["Action", "Adventure", "Animation"]). Limitado sa 3.
 */
export const getGenreNamesByIds = (genreIds) => {
    if (!genreIds || !Array.isArray(genreIds) || genreIds.length === 0) {
        return [];
    }
    
    return genreIds
        .map(id => genreMap.get(id)) // Kuhaon ang ngalan gikan sa Map
        .filter(name => !!name) // Tangtangon kung naay ID nga wala sa Map
        .slice(0, 3); // Kuhaon lang ang first 3 genres para dili gubot tan-awon
};