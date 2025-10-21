import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMoviesAndTV } from '../utils/consumetApi'; // <-- GIBALIK SA DAAN NGA IMPORT
import { Poster } from '../components/Poster';
import { IMG_PATH } from '../config'; // Import IMG_PATH for the poster

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
            const data = await searchMoviesAndTV(query);
            
            // Normalize the data to match what the Poster component expects
            const normalizedData = data.map(item => ({
                id: item.id,
                title: item.title,
                name: item.title, // Use title for name as well
                poster_path: item.image, // Map image to poster_path
                media_type: item.type === 'Movie' ? 'movie' : 'tv',
            })).filter(item => item.poster_path); // Filter out items without an image

            setResults(normalizedData);
            setIsLoading(false);
        };

        fetchSearchResults();
    }, [query]);

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <h2 className="text-3xl font-bold mb-8">Search Results for "{query}"</h2>
            {results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {results.map(item => (
                        <Poster 
                            key={item.id} 
                            item={{...item, poster_path: item.poster_path}} // Ang poster component mo-handle na sa full URL
                            onOpenModal={onOpenModal} 
                            isWatched={isWatched(item.id)} 
                        />
                    ))}
                </div>
            ) : (
                !isLoading && <p>No results found for "{query}".</p>
            )}
            {isLoading && (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key="skeleton-search-{i}" className="aspect-[2/3] skeleton"></div>
                    ))}
                </div>
            )}
        </div>
    );
};