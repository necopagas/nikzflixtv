// src/pages/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// --- GI-UPDATE ANG IMPORT ---
import { fetchData } from '../utils/fetchData'; // Gamiton ang fetchData
import { API_ENDPOINTS, IMG_PATH } from '../config'; // Import API_ENDPOINTS
import { Poster } from '../components/Poster';

export const SearchPage = ({ onOpenModal, isWatched }) => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        };

        const fetchSearchResults = async () => {
            setIsLoading(true);
            // --- GI-ILISAN OG TMDB SEARCH ---
            const data = await fetchData(API_ENDPOINTS.search(query));

            // Normalize TMDB data (parehas ra sa una pero gikan na sa TMDB)
            const normalizedData = (data.results || [])
                .filter(item => item.media_type === 'movie' || item.media_type === 'tv') // Filter lang para movies ug TV
                .map(item => ({
                    id: item.id,
                    title: item.title || item.name, // Use title for movie, name for TV
                    name: item.name || item.title,   // Use name for TV, title for movie
                    poster_path: item.poster_path, // TMDB uses poster_path
                    media_type: item.media_type,
                    genre_ids: item.genre_ids || [], // Include genre_ids
                }))
                .filter(item => item.poster_path); // Filter out items without a poster path

            setResults(normalizedData);
            setIsLoading(false);
        };

        fetchSearchResults();
    }, [query]);

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <h2 className="text-3xl font-bold mb-8">Search Results for "{query}"</h2>
            {isLoading ? ( // Ipakita ang skeleton kung loading
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={`skeleton-search-${i}`} className="aspect-[2/3] skeleton"></div>
                    ))}
                </div>
            ) : results.length > 0 ? ( // Ipakita ang results kung humana ug naay sulod
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {results.map(item => (
                        <Poster
                            key={item.id} // Ang key dapat unique gyud per item
                            item={item} // Ipasa ang tibuok item object
                            onOpenModal={onOpenModal}
                            isWatched={isWatched(item.id)}
                        />
                    ))}
                </div>
            ) : ( // Ipakita kung walay results human mag-load
                <p>No results found for "{query}".</p>
            )}
        </div>
    );
};