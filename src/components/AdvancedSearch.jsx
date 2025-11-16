import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiSearch,
  FiMic,
  FiMicOff,
  FiFilter,
  FiX,
  FiStar,
  FiCalendar,
  FiList,
  FiTrendingUp,
  FiClock,
} from 'react-icons/fi';

/**
 * Advanced Search Component with Voice Recognition
 *
 * Features:
 * - Voice search using Web Speech API
 * - Advanced filters (year, rating, genre, language)
 * - Autocomplete suggestions
 * - Search history with persistence
 * - Debounced search
 * - Real-time filter updates
 */

const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
  'Western',
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tl', name: 'Filipino' },
];

const RATING_RANGES = [
  { label: 'All Ratings', min: 0, max: 10 },
  { label: '9+ Excellent', min: 9, max: 10 },
  { label: '7+ Good', min: 7, max: 10 },
  { label: '5+ Average', min: 5, max: 10 },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i);

export const AdvancedSearch = ({
  onSearch,
  onFilterChange,
  placeholder = 'Search movies, anime, dramas...',
  showFilters = true,
  recentSearches: propRecentSearches = null,
  popularSearches = [],
  className = '',
}) => {
  // Search state
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    year: '',
    genre: '',
    language: '',
    rating: { min: 0, max: 10 },
    sortBy: 'popularity',
  });

  // History state
  const [searchHistory, setSearchHistory] = useState(() => {
    if (propRecentSearches) return propRecentSearches;
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Refs
  const searchInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = event => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        handleSearch(transcript);
      };

      recognitionRef.current.onerror = event => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length >= 2) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        handleSearch(query);
      }, 300);
    }

    return () => clearTimeout(debounceTimerRef.current);
  }, [query]);

  // Filter change effect
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  // Search handler
  const handleSearch = searchQuery => {
    if (!searchQuery.trim()) return;

    // Add to history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    if (onSearch) {
      onSearch(searchQuery, filters);
    }

    setShowSuggestions(false);
  };

  // Voice search handler
  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert('Voice search is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Filter handlers
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      year: '',
      genre: '',
      language: '',
      rating: { min: 0, max: 10 },
      sortBy: 'popularity',
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.year) count++;
    if (filters.genre) count++;
    if (filters.language) count++;
    if (filters.rating.min > 0 || filters.rating.max < 10) count++;
    return count;
  }, [filters]);

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) {
      return searchHistory.slice(0, 5);
    }

    const lowerQuery = query.toLowerCase();
    const filtered = searchHistory.filter(h => h.toLowerCase().includes(lowerQuery));

    return [...filtered, ...popularSearches].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
  }, [query, searchHistory, popularSearches]);

  return (
    <div className={`relative ${className}`} ref={suggestionsRef}>
      {/* Search Input */}
      <div className="relative flex items-center gap-2">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />

          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSearch(query);
              }
            }}
            placeholder={placeholder}
            className="w-full pl-12 pr-32 py-4 bg-gray-800 text-white rounded-xl border-2 border-gray-700 focus:border-purple-500 focus:outline-none transition-colors"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Voice Search Button */}
            <button
              onClick={toggleVoiceSearch}
              className={`p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={isListening ? 'Stop listening' : 'Voice search'}
            >
              {isListening ? <FiMicOff className="text-lg" /> : <FiMic className="text-lg" />}
            </button>

            {/* Clear Button */}
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                title="Clear"
              >
                <FiX className="text-lg" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Button */}
        {showFilters && (
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`relative px-6 py-4 rounded-xl font-medium transition-all ${
              showFiltersPanel
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiFilter className="text-xl" />
              <span className="hidden sm:inline">Filters</span>
            </div>

            {activeFiltersCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </div>
            )}
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <FiClock /> Recent Searches
                </h3>
                <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300">
                  Clear All
                </button>
              </div>

              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                    className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <FiSearch className="text-gray-400" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {popularSearches.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <FiTrendingUp /> Popular Searches
              </h3>

              <div className="space-y-1">
                {popularSearches.slice(0, 5).map((popular, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(popular);
                      handleSearch(popular);
                    }}
                    className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <FiTrendingUp className="text-purple-400" />
                    <span>{popular}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 w-full md:w-96 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Advanced Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Clear All
            </button>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <FiCalendar /> Release Year
            </label>
            <select
              value={filters.year}
              onChange={e => updateFilter('year', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Years</option>
              {YEARS.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <FiList /> Genre
            </label>
            <select
              value={filters.genre}
              onChange={e => updateFilter('genre', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Genres</option>
              {GENRES.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
            <select
              value={filters.language}
              onChange={e => updateFilter('language', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Languages</option>
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <FiStar /> Minimum Rating
            </label>
            <div className="space-y-2">
              {RATING_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => updateFilter('rating', { min: range.min, max: range.max })}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                    filters.rating.min === range.min && filters.rating.max === range.max
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={e => updateFilter('sortBy', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
              <option value="release_date">Release Date</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Voice Listening Indicator */}
      {isListening && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4">
          <div className="flex gap-1">
            <div className="w-1 h-8 bg-white rounded-full animate-pulse"></div>
            <div className="w-1 h-8 bg-white rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-8 bg-white rounded-full animate-pulse delay-150"></div>
          </div>
          <div>
            <p className="font-semibold">Listening...</p>
            <p className="text-sm opacity-90">Speak now</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
