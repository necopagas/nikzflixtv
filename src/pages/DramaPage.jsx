// src/pages/DramaPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// --- GIBALIK ANG DAAN NGA IMPORTS ---
import { searchDramas, getRecentDramas } from '../utils/consumetApi';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export const DramaPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [mediaList, setMediaList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pageTitle, setPageTitle] = useState("Recent Drama Releases");

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        setIsLoading(true);

        const fetchData = async () => {
            let data;
            if (debouncedSearchQuery.trim()) {
                setPageTitle(`Search Results for "${debouncedSearchQuery.trim()}"`);
                setSearchParams({ q: debouncedSearchQuery.trim() }, { replace: true });
                data = await searchDramas(debouncedSearchQuery.trim());
            } else {
                setPageTitle("Recent Drama Releases");
                setSearchParams({}, { replace: true });
                // --- GIBALIK ANG DAAN NGA FUNCTION ---
                data = await getRecentDramas();
            }
            
            setMediaList(data || []);
            setIsLoading(false);
        };

        fetchData();
    }, [debouncedSearchQuery, setSearchParams]);

    const handleOpenMedia = (mediaId) => {
        navigate(`/drama/${mediaId}`);
    };

    const handleKeyDown = (e, mediaId) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenMedia(mediaId);
        }
    };

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold mb-2">Drama Hub</h1>
                <p className="text-lg text-[var(--text-secondary)]">Watch Your Favorite Short Dramas</p>
            </div>

            {/* --- GIBALIK ANG SEARCH BAR --- */}
            <div className="flex justify-center mb-12">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a drama or movie..."
                    className="w-full max-w-lg p-3 bg-[var(--bg-tertiary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition-all"
                />
            </div>

            <h2 className="text-2xl font-bold mb-6">{isLoading ? "Loading..." : pageTitle}</h2>
            
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key="skeleton-drama-{i}" className="aspect-[2/3] skeleton rounded-md"></div>
                    ))}
                </div>
            ) : mediaList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {mediaList.map((media) => (
                        <div
                            key={media.id}
                            className="poster-wrapper group flex-shrink-0 relative cursor-pointer focus:outline-none"
                            onClick={() => handleOpenMedia(media.id)}
                            tabIndex="0"
                            onKeyDown={(e) => handleKeyDown(e, media.id)}
                            role="button"
                        >
                            <img
                                className="poster w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-110"
                                src={media.image}
                                alt={media.title}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute bottom-0 left-0 p-3 w-full">
                                <h3 className="text-white font-bold text-md transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 truncate">
                                    {media.title}
                                </h3>
                                {media.episodeNumber && <span className="text-xs text-gray-300">Episode {media.episodeNumber}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-xl text-[var(--text-secondary)]">No results found for "{debouncedSearchQuery}".</p>
                </div>
            )}
        </div>
    );
};