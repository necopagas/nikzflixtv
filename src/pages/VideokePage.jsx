// src/pages/VideokePage.jsx
import React, { useState, useEffect } from 'react';
import { searchYouTube } from '../utils/consumetApi'; // Import nato ang bag-ong function

export const VideokePage = () => {
    const [query, setQuery] = useState('OPM karaoke'); // Default search query
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const searchVideoke = async () => {
        setIsLoading(true);
        setError(null);
        setResults([]); // Clear previous results

        try {
            console.log('Searching for:', query);
            const ytResults = await searchYouTube(query);
            console.log('YouTube results:', ytResults);
            
            if (!ytResults || ytResults.length === 0) {
                setError('No results found. Try a different search term.');
                setIsLoading(false);
                return;
            }
            
            // I-normalize nato ang data gikan sa YouTube
            const formattedResults = ytResults.map(item => {
                console.log('Processing item:', item);
                // Consumet / YouTube search results may provide id in different shapes
                // e.g. item.id (string) or item.id.videoId or item.videoId
                const rawId = item?.id;
                const videoId = (typeof rawId === 'string' && rawId)
                    || rawId?.videoId
                    || item?.videoId
                    || item?.video?.id
                    || item?.id?.id;

                if (!videoId) {
                    console.warn('Skipping YouTube item without video id:', item);
                    return null;
                }

                return {
                    id: videoId,
                    title: item.title || item.snippet?.title || 'YouTube Video',
                    source: 'YouTube',
                    // Use modest branding and disable related videos; do not autoplay by default
                    embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
                    description: item.channel?.name || item.snippet?.channelTitle || 'YouTube Video'
                };
            }).filter(Boolean);

            console.log('Formatted results:', formattedResults);
            setResults(formattedResults);

        } catch (err) {
            console.error("Error searching videoke:", err);
            setError(`Failed to fetch results. ${err.message}`);
            setResults([]); // Clear results on error
        } finally {
            setIsLoading(false);
        }
    };

    // Initial search on component load
    useEffect(() => {
        searchVideoke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Modagan kausa inig load

    const handleSearchClick = () => {
        searchVideoke();
    };

    const handleInputChange = (event) => {
        setQuery(event.target.value);
    };

    const handleKeyDown = (event) => {
         if (event.key === 'Enter') {
             searchVideoke();
         }
    };

    return (
        // Gamiton nato ang existing padding classes
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--brand-color)]">
                🎤 NikzFlix Videoke
            </h1>

            {/* Search Box */}
            <div className="mb-8 max-w-xl mx-auto flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Pangita og kanta (e.g., OPM karaoke)"
                    className="flex-grow p-3 rounded-lg bg-[var(--bg-secondary)] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] text-white"
                />
                <button
                    onClick={handleSearchClick}
                    disabled={isLoading}
                    className="px-6 py-3 bg-[var(--brand-color)] hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                 <div className="flex justify-center items-center h-40">
                     <div className="player-loading"></div> {/* Reuse loading spinner style */}
                 </div>
            )}

            {/* Error Message */}
             {error && (
                 <p className="text-center text-red-500 bg-red-900 bg-opacity-30 p-4 rounded-lg">{error}</p>
             )}

            {/* Results Grid */}
            {!isLoading && !error && results.length === 0 && (
                 <p className="text-center text-gray-400">Walay nakita nga resulta para sa "{query}".</p>
            )}

            {!isLoading && results.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {results.map((item) => (
                        <div key={item.id} className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-lg flex flex-col">
                            <h3 className="text-lg font-semibold mb-2 truncate" title={item.title}>
                                🎵 {item.title}
                            </h3>
                            <div className="aspect-video mb-2 bg-black rounded overflow-hidden">
                                <iframe
                                    src={item.embedUrl}
                                    title={item.title}
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    className="w-full h-full border-0"
                                ></iframe>
                            </div>
                            <p className="text-xs text-gray-400 mt-auto">{item.description}</p>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );
};
