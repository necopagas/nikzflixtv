// src/pages/DramaPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS } from '../config';
import { Poster } from '../components/Poster';
import { Row } from '../components/Row';
import AdsterraBanner from '../AdsterraBanner';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export const DramaPage = ({ onOpenModal, isWatched }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        if (debouncedSearchQuery.trim()) {
            setIsLoadingSearch(true);
            setSearchParams({ q: debouncedSearchQuery.trim() }, { replace: true });

            const fetchSearchResults = async () => {
                const data = await fetchData(API_ENDPOINTS.searchTv(debouncedSearchQuery.trim()));
                const formattedData = (data.results || []).map(item => ({
                    id: item.id,
                    title: item.name,
                    name: item.name,
                    poster_path: item.poster_path,
                    media_type: 'tv',
                    genre_ids: item.genre_ids || [],
                })).filter(item => item.poster_path);
                setSearchResults(formattedData);
                setIsLoadingSearch(false);
            };

            fetchSearchResults();
        } else {
            setSearchParams({}, { replace: true });
            setSearchResults([]);
            if (isLoadingSearch) setIsLoadingSearch(false);
        }
    }, [debouncedSearchQuery, setSearchParams, isLoadingSearch]);

    const handleSearchInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const showSearchResults = debouncedSearchQuery.trim().length > 0;

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold mb-2">Drama Hub</h1>
                <p className="text-lg text-[var(--text-secondary)]">Discover Popular Chinese Dramas</p>
            </div>

            <div className="flex justify-center mb-12">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Search for Chinese dramas..."
                    className="w-full max-w-lg p-3 bg-[var(--bg-tertiary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition-all"
                />
            </div>

            {showSearchResults ? (
                <>
                    <h2 className="text-2xl font-bold mb-6">Search Results for "{debouncedSearchQuery}"</h2>
                    {isLoadingSearch ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={`skeleton-search-${i}`} className="aspect-[2/3] skeleton rounded-md"></div>
                            ))}
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {searchResults.map((media) => (
                                <Poster
                                    key={media.id}
                                    item={media}
                                    onOpenModal={onOpenModal}
                                    isWatched={isWatched(media.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-xl text-[var(--text-secondary)]">No results found for "{debouncedSearchQuery}".</p>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <Row
                        title="Popular Chinese Dramas"
                        endpoint="dramaPopular"
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                        isLarge
                    />
                    <AdsterraBanner />
                    <Row
                        // --- GI-ILISAN ANG TITLE DIRI ---
                        title="Highly Rated Dramas" // <-- Ania ang gi-usab
                        endpoint="dramaTopRated"
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                    />
                </>
            )}
        </div>
    );
};