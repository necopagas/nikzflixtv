// src/pages/ShortDramaPage.jsx
import React, { useState, useEffect, useCallback } from 'react';

export const ShortDramaPage = () => {
  const [query, setQuery] = useState('Korean short drama CC'); // Default search query
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Make searchDramas accept an explicit query param so it's stable for useCallback
  const searchDramas = useCallback(async q => {
    const term = q;
    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results

    try {
      // 1. Search Internet Archive
      const archiveUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)}+collection:moviesandfilms+mediatype:movies&fl[]=identifier,title,description,year&sort[]=titleSorter+asc&rows=12&page=1&output=json`;
      const response = await fetch(archiveUrl);

      if (!response.ok) {
        throw new Error(`Archive.org fetch failed: ${response.statusText}`);
      }

      const archiveData = await response.json();
      const archiveResults =
        archiveData.response?.docs?.map(item => ({
          id: item.identifier,
          title: item.title || 'Asian Short Drama',
          source: 'Archive.org',
          embedUrl: `https://archive.org/embed/${item.identifier}`,
          year: item.year || 'Unknown',
          description: `Public Domain • ${item.year || 'Unknown'}`,
        })) || [];

      // 2. Search YouTube CC (Simulated - Replace with actual API call later if needed)
      const sampleYT = [
        {
          id: 'dQw4w9WgXcQ',
          title: 'Sample Korean Short: First Love (CC)',
          embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0',
          description: 'Creative Commons • 15 min romance',
          source: 'YouTube (Sample)',
        },
      ];

      const lowered = term.toLowerCase();
      const filteredYT = sampleYT.filter(
        v =>
          v.title.toLowerCase().includes(lowered.split(' ')[0]) ||
          v.description.toLowerCase().includes(lowered)
      );

      setResults([...archiveResults, ...filteredYT]); // Combine results
    } catch (err) {
      console.error('Error searching dramas:', err);
      setError(`Failed to fetch results. ${err.message}. Try adding a CORS proxy?`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial search on component load
  // We intentionally run this once on mount; call with explicit query

  useEffect(() => {
    searchDramas(query);
  }, [searchDramas, query]); // Re-run when query changes

  const handleSearchClick = () => {
    searchDramas(query);
  };

  const handleInputChange = event => {
    setQuery(event.target.value);
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      searchDramas(query);
    }
  };

  return (
    // Use existing padding from other pages
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-(--brand-color)">
        🔥 Asian Short Dramas
      </h1>

      {/* Search Box using Tailwind */}
      <div className="mb-8 max-w-xl mx-auto flex gap-2">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Korean romance short drama"
          className="flex-grow p-3 rounded-lg bg-(--bg-secondary) border border-gray-700 focus:outline-none focus:ring-2 focus:ring-(--brand-color) text-white"
        />
        <button
          onClick={handleSearchClick}
          disabled={isLoading}
          className="px-6 py-3 bg-(--brand-color) hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
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

      {/* Results Grid using Tailwind */}
      {!isLoading && !error && results.length === 0 && (
        <p className="text-center text-gray-400">
          No results found. Try changing your search query (e.g., "Korean short drama CC").
        </p>
      )}

      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map(item => (
            <div
              key={item.id || item.embedUrl}
              className="bg-(--bg-secondary) p-4 rounded-lg shadow-lg flex flex-col"
            >
              <h3 className="text-lg font-semibold mb-2 truncate" title={item.title}>
                {item.source === 'Archive.org' ? '📽️' : '🎬'} {item.title}
              </h3>
              <div className="aspect-video mb-2 bg-black rounded overflow-hidden">
                <iframe
                  src={item.embedUrl}
                  title={item.title}
                  allowFullScreen
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
