import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchManga, getTrendingManga } from '../utils/consumetApi';

// Debounce hook para dili dayon mo-search kada type
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export const MangaPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [mangaList, setMangaList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pageTitle, setPageTitle] = useState("Trending Manga");

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        setIsLoading(true);

        const fetchManga = async () => {
            let data;
            // Kung naay gi-type sa search bar...
            if (debouncedSearchQuery.trim()) {
                setPageTitle(`Search Results for "${debouncedSearchQuery.trim()}"`);
                setSearchParams({ q: debouncedSearchQuery.trim() }, { replace: true });
                data = await searchManga(debouncedSearchQuery.trim());
            } else {
            // Kung walay gi-type, ipakita ang trending
                setPageTitle("Trending Manga");
                setSearchParams({}, { replace: true });
                data = await getTrendingManga();
            }
            
            if (data) {
                // Normalize the data structure para parehas ang format
                const normalizedData = data.map(item => ({
                    id: item.id,
                    title: typeof item.title === 'object' ? item.title.romaji || item.title.english : item.title,
                    image: item.image || item.cover,
                })).filter(item => item.image); // I-filter para sure nga naay image

                setMangaList(normalizedData);
            } else {
                setMangaList([]);
            }

            setIsLoading(false);
        };

        fetchManga();
    }, [debouncedSearchQuery, setSearchParams]);

    const handleOpenManga = (mangaId) => {
        navigate(`/manga/${mangaId}`);
    };

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold mb-2">Manga Hub</h1>
                <p className="text-lg text-[var(--text-secondary)]">Powered by Consumet API</p>
            </div>

            <div className="flex justify-center mb-12">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Start typing to search..."
                    className="w-full max-w-lg p-3 bg-[var(--bg-tertiary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition-all"
                />
            </div>

            <h2 className="text-2xl font-bold mb-6">{isLoading ? "Loading..." : pageTitle}</h2>
            
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] skeleton rounded-md"></div>
                    ))}
                </div>
            ) : mangaList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {mangaList.map((manga) => (
                        <div
                            key={manga.id}
                            className="poster-wrapper group flex-shrink-0 relative cursor-pointer"
                            onClick={() => handleOpenManga(manga.id)}
                        >
                            <img
                                className="poster w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-110"
                                src={manga.image}
                                alt={manga.title}
                                loading="lazy"
                                // Kung mag-error ang image, magpakita ug placeholder
                                onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/200x300.png?text=No+Image'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute bottom-0 left-0 p-3 w-full">
                                <h3 className="text-white font-bold text-md transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 truncate">
                                    {manga.title}
                                </h3>
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