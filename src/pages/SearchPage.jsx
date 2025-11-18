// src/pages/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// --- GI-UPDATE ANG IMPORT ---
import { fetchData } from '../utils/fetchData'; // Gamiton ang fetchData
import { API_ENDPOINTS, IMG_PATH } from '../config'; // Import API_ENDPOINTS
import { Poster } from '../components/Poster';
import AdvancedSearch from '../components/AdvancedSearch';
import { OptimizedPoster, PosterSkeleton } from '../components/ProgressiveImage';

export const SearchPage = ({ onOpenModal, isWatched }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    year: '',
    genre: '',
    language: '',
    rating: { min: 0, max: 10 },
    sortBy: 'popularity',
  });

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    fetchSearchResults(query, filters);
  }, [query, filters]);

  const fetchSearchResults = async (searchQuery, searchFilters) => {
    if (!searchQuery) return;

    setIsLoading(true);

    try {
      // Build API endpoint with filters
      let endpoint = API_ENDPOINTS.search(searchQuery);

      // Add filters as query params
      const params = new URLSearchParams();
      if (searchFilters.year) params.append('year', searchFilters.year);
      if (searchFilters.genre) params.append('with_genres', searchFilters.genre);
      if (searchFilters.language) params.append('language', searchFilters.language);
      if (searchFilters.rating.min > 0) params.append('vote_average.gte', searchFilters.rating.min);
      if (searchFilters.rating.max < 10)
        params.append('vote_average.lte', searchFilters.rating.max);

      const paramsString = params.toString();
      if (paramsString) {
        endpoint += (endpoint.includes('?') ? '&' : '?') + paramsString;
      }

      const data = await fetchData(endpoint);

      // Normalize TMDB data
      let normalizedData = (data.results || [])
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
        .map(item => ({
          id: item.id,
          title: item.title || item.name,
          name: item.name || item.title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          media_type: item.media_type,
          genre_ids: item.genre_ids || [],
          release_date: item.release_date || item.first_air_date,
        }))
        .filter(item => item.poster_path);

      // Apply sorting
      if (searchFilters.sortBy === 'rating') {
        normalizedData.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      } else if (searchFilters.sortBy === 'release_date') {
        normalizedData.sort(
          (a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0)
        );
      } else if (searchFilters.sortBy === 'title') {
        normalizedData.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      }

      setResults(normalizedData);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchQuery, searchFilters) => {
    setSearchParams({ q: searchQuery });
    fetchSearchResults(searchQuery, searchFilters || filters);
  };

  const handleFilterChange = newFilters => {
    setFilters(newFilters);
    if (query) {
      fetchSearchResults(query, newFilters);
    }
  };

  const popularSearches = [
    'Avengers',
    'Naruto',
    'One Piece',
    'Spider-Man',
    'Demon Slayer',
    'The Batman',
    'Stranger Things',
    'Breaking Bad',
  ];

  return (
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
      {/* Advanced Search */}
      <div className="mb-12">
        <AdvancedSearch
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          placeholder="Search movies, anime, dramas, and more..."
          showFilters={true}
          popularSearches={popularSearches}
        />
      </div>

      {/* Results Header */}
      {query && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Search Results for "{query}"</h2>
          <p className="text-gray-400">
            {isLoading ? 'Searching...' : `${results.length} results found`}
          </p>
        </div>
      )}

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <PosterSkeleton count={12} />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map(item => (
            <OptimizedPoster
              key={item.id}
              item={item}
              onClick={onOpenModal}
              isWatched={id => isWatched(id)}
              showTitle={true}
            />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-2">No results found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchParams({});
              setFilters({
                year: '',
                genre: '',
                language: '',
                rating: { min: 0, max: 10 },
                sortBy: 'popularity',
              });
            }}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold mb-2">Start searching</h3>
          <p className="text-gray-400">Enter a query above to find movies, anime, and dramas</p>
        </div>
      )}
    </div>
  );
};
