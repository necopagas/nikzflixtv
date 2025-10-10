import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS } from '../config';
import { Poster } from '../components/Poster';

export const SearchPage = ({ onOpenModal, isWatched }) => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [query]);

    useEffect(() => {
        if (!query) return;

        const fetchSearchResults = async () => {
            setIsLoading(true);
            const data = await fetchData(API_ENDPOINTS.search(query, page));
            const validResults = data.results.filter(item => item.poster_path);
            setResults(prev => [...prev, ...validResults]);
            setHasMore(data.page < data.total_pages);
            setIsLoading(false);
        };

        fetchSearchResults();
    }, [query, page]);

    const loadMore = () => {
        if (!isLoading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <h2 className="text-3xl font-bold mb-8">Search Results for "{query}"</h2>
            {results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {results.map(item => (
                        <Poster 
                            key={item.id} 
                            item={item} 
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
                        <div key={i} className="aspect-[2/3] skeleton"></div>
                    ))}
                </div>
            )}
            {hasMore && !isLoading && (
                <div className="flex justify-center mt-8">
                    <button onClick={loadMore} className="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700">
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
};