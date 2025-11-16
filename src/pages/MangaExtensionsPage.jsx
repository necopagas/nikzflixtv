import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FaSearch,
  FaFilter,
  FaGlobe,
  FaExclamationCircle,
  FaDownload,
  FaExternalLinkAlt,
  FaTimes,
  FaInfoCircle,
  FaMobileAlt,
  FaGlobeAmericas,
  FaBook,
  FaHeart,
  FaRegHeart,
  FaStar,
  FaChartBar,
  FaHistory,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaChevronLeft,
  FaChevronRight,
  FaBell,
  FaCheckCircle,
  FaCode,
  FaClock,
  FaHashtag,
} from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';

const MANGA_REPO_URL = 'https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json';
const ITEMS_PER_PAGE = 12;
const CACHE_KEY = 'manga_extensions_cache';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour
const FAVORITES_KEY = 'manga_favorites';
const DOWNLOADS_KEY = 'manga_downloads';
const SEARCH_HISTORY_KEY = 'manga_search_history';
const FILTER_PREFS_KEY = 'manga_filter_prefs';

const MangaExtensionsPage = () => {
  const [mangaData, setMangaData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [nsfwFilter, setNsfwFilter] = useState('all');
  const [showInstructions, setShowInstructions] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [minSources, setMinSources] = useState(0);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [_lastCheckedUpdates, setLastCheckedUpdates] = useState(null);
  const searchInputRef = useRef(null);
  const debounceTimeout = useRef(null);

  // Load saved data from localStorage
  useEffect(() => {
    const hasVisited = localStorage.getItem('manga-instructions-seen');
    if (!hasVisited) {
      setShowInstructions(true);
    }

    // Load favorites
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    // Load downloads history
    const savedDownloads = localStorage.getItem(DOWNLOADS_KEY);
    if (savedDownloads) {
      setDownloads(JSON.parse(savedDownloads));
    }

    // Load search history
    const savedSearchHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedSearchHistory) {
      setSearchHistory(JSON.parse(savedSearchHistory));
    }

    // Load filter preferences
    const savedPrefs = localStorage.getItem(FILTER_PREFS_KEY);
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setSelectedLang(prefs.lang || 'all');
      setNsfwFilter(prefs.nsfw || 'all');
      setSortBy(prefs.sortBy || 'name');
      setSortOrder(prefs.sortOrder || 'asc');
    }

    // Load last update check
    const lastCheck = localStorage.getItem('manga_last_update_check');
    if (lastCheck) {
      setLastCheckedUpdates(new Date(lastCheck));
    }
  }, []);

  const handleCloseInstructions = () => {
    localStorage.setItem('manga-instructions-seen', 'true');
    setShowInstructions(false);
  };

  // Fetch manga data with caching
  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);

        // Check cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cacheTimestamp = localStorage.getItem(CACHE_KEY + '_timestamp');

        if (cachedData && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age < CACHE_EXPIRY) {
            const data = JSON.parse(cachedData);
            setMangaData(data);
            setFilteredData(data);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const response = await fetch(MANGA_REPO_URL);
        if (!response.ok) throw new Error('Failed to fetch manga data');
        const data = await response.json();

        // Cache the data
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_KEY + '_timestamp', Date.now().toString());

        setMangaData(data);
        setFilteredData(data);
      } catch (err) {
        setError(err.message);

        // Try to use cached data even if expired
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          setMangaData(JSON.parse(cachedData));
          setFilteredData(JSON.parse(cachedData));
          setError('Using cached data - ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMangaData();
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // Save downloads to localStorage
  useEffect(() => {
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
  }, [downloads]);

  // Save filter preferences
  useEffect(() => {
    const prefs = { lang: selectedLang, nsfw: nsfwFilter, sortBy, sortOrder };
    localStorage.setItem(FILTER_PREFS_KEY, JSON.stringify(prefs));
  }, [selectedLang, nsfwFilter, sortBy, sortOrder]);

  // Get unique languages
  const languages = useMemo(() => {
    return ['all', ...new Set(mangaData.map(item => item.lang))].sort();
  }, [mangaData]);

  // Debounced search
  const handleSearchChange = useCallback(value => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);

      // Add to search history if not empty
      if (value.trim() && value.length > 2) {
        setSearchHistory(prev => {
          const updated = [value, ...prev.filter(term => term !== value)].slice(0, 10);
          localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    }, 300);
  }, []);

  // Filter and sort manga data
  useEffect(() => {
    let filtered = [...mangaData];

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(item => favorites.includes(item.pkg));
    }

    // Search filter (with fuzzy matching)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(searchLower);
        const pkgMatch = item.pkg.toLowerCase().includes(searchLower);
        const sourceMatch = item.sources?.some(source =>
          source.name.toLowerCase().includes(searchLower)
        );
        return nameMatch || pkgMatch || sourceMatch;
      });
    }

    // Language filter
    if (selectedLang !== 'all') {
      filtered = filtered.filter(item => item.lang === selectedLang);
    }

    // NSFW filter
    if (nsfwFilter !== 'all') {
      const nsfwValue = nsfwFilter === 'nsfw' ? 1 : 0;
      filtered = filtered.filter(item => item.nsfw === nsfwValue);
    }

    // Min sources filter
    if (minSources > 0) {
      filtered = filtered.filter(item => (item.sources?.length || 0) >= minSources);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'version':
          comparison = parseFloat(a.version) - parseFloat(b.version);
          break;
        case 'sources':
          comparison = (a.sources?.length || 0) - (b.sources?.length || 0);
          break;
        case 'language':
          comparison = a.lang.localeCompare(b.lang);
          break;
        case 'recent': {
          const aIndex = downloads.findIndex(d => d.pkg === a.pkg);
          const bIndex = downloads.findIndex(d => d.pkg === b.pkg);
          comparison = (aIndex === -1 ? 999999 : aIndex) - (bIndex === -1 ? 999999 : bIndex);
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedLang,
    nsfwFilter,
    mangaData,
    sortBy,
    sortOrder,
    showFavoritesOnly,
    favorites,
    minSources,
    downloads,
  ]);

  // Pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Toggle favorite
  const toggleFavorite = useCallback(pkg => {
    setFavorites(prev => {
      if (prev.includes(pkg)) {
        return prev.filter(p => p !== pkg);
      } else {
        return [...prev, pkg];
      }
    });
  }, []);

  // Track download
  const trackDownload = useCallback(pkg => {
    const downloadRecord = {
      pkg,
      timestamp: Date.now(),
    };
    setDownloads(prev => {
      const updated = [downloadRecord, ...prev.filter(d => d.pkg !== pkg)].slice(0, 50);
      return updated;
    });
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_KEY + '_timestamp');
    window.location.reload();
  }, []);

  // Export favorites
  const exportFavorites = useCallback(() => {
    const data = {
      favorites,
      downloads,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manga-favorites-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [favorites, downloads]);

  // Import favorites
  const importFavorites = useCallback(event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.favorites) setFavorites(data.favorites);
          if (data.downloads) setDownloads(data.downloads);
          alert('Favorites imported successfully!');
        } catch (err) {
          alert('Failed to import favorites: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const langStats = {};
    const nsfwCount = mangaData.filter(item => item.nsfw === 1).length;
    const totalSources = mangaData.reduce((acc, item) => acc + (item.sources?.length || 0), 0);

    mangaData.forEach(item => {
      langStats[item.lang] = (langStats[item.lang] || 0) + 1;
    });

    const topLanguages = Object.entries(langStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: mangaData.length,
      languages: Object.keys(langStats).length,
      nsfw: nsfwCount,
      sfw: mangaData.length - nsfwCount,
      totalSources,
      avgSources: (totalSources / mangaData.length).toFixed(1),
      topLanguages,
      totalDownloads: downloads.length,
      totalFavorites: favorites.length,
    };
  }, [mangaData, downloads, favorites]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !mangaData.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <FaExclamationCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Manga Extensions</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <FaInfoCircle className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Welcome to Manga Extensions!</h2>
              </div>
              <button
                onClick={handleCloseInstructions}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Intro */}
              <div className="text-center">
                <p className="text-lg text-gray-300">
                  Browse ug download manga extensions para sa{' '}
                  <span className="text-purple-400 font-semibold">Aniyomi</span> o{' '}
                  <span className="text-pink-400 font-semibold">Tachiyomi</span> apps!
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaSearch className="w-5 h-5 text-purple-400" />
                        Search ug Filter
                      </h3>
                      <p className="text-gray-400">
                        Use ang search box para hanapon ang specific extension. Filter by language
                        (EN, JA, etc.) o content type (SFW/NSFW).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-pink-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaMobileAlt className="w-5 h-5 text-pink-400" />
                        Download APK
                      </h3>
                      <p className="text-gray-400 mb-2">
                        Click ang{' '}
                        <span className="text-purple-400 font-semibold">"Download APK"</span> button
                        para i-download ang extension sa imong phone.
                      </p>
                      <p className="text-sm text-gray-500">
                        Install ang APK, then open Aniyomi/Tachiyomi → Browse → Extensions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaGlobeAmericas className="w-5 h-5 text-blue-400" />
                        Visit Source Website
                      </h3>
                      <p className="text-gray-400">
                        Or click ang{' '}
                        <span className="text-gray-300 font-semibold">"Visit Source"</span> button
                        para direct browse sa manga website.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FaExclamationCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-yellow-300 mb-1">Important:</h4>
                    <p className="text-sm text-gray-300">
                      Para sa mobile installation, enable ang "Install from Unknown Sources" sa
                      imong phone settings. Powered by{' '}
                      <span className="font-semibold">Keiyoushi Extensions</span> - the
                      community-maintained successor sa Tachiyomi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCloseInstructions}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                Sige, Get Started!
              </button>

              <p className="text-center text-sm text-gray-500">
                This message will only show once. You can always refer to the documentation file for
                more details.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Tachiyomi / Aniyomi Extensions
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            {filteredData.length} of {mangaData.length} manga extensions available
          </p>
          <p className="text-gray-500 text-sm">
            Download APK extensions para sa Tachiyomi/Aniyomi mobile apps - 100+ manga sources!
          </p>
          {error && (
            <p className="mt-2 text-yellow-400 text-sm flex items-center justify-center gap-2">
              <FaExclamationCircle /> {error}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600 border border-blue-500 rounded-lg transition-all duration-300 flex items-center gap-2"
          >
            <FaChartBar className="w-4 h-4" />
            Statistics
          </button>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-4 py-2 border rounded-lg transition-all duration-300 flex items-center gap-2 ${
              showFavoritesOnly
                ? 'bg-pink-600 border-pink-500'
                : 'bg-pink-600/50 hover:bg-pink-600 border-pink-500'
            }`}
          >
            <FaHeart className="w-4 h-4" />
            Favorites ({favorites.length})
          </button>
          <button
            onClick={exportFavorites}
            className="px-4 py-2 bg-green-600/50 hover:bg-green-600 border border-green-500 rounded-lg transition-all duration-300 flex items-center gap-2"
          >
            <FaDownload className="w-4 h-4" />
            Export
          </button>
          <label className="px-4 py-2 bg-green-600/50 hover:bg-green-600 border border-green-500 rounded-lg transition-all duration-300 flex items-center gap-2 cursor-pointer">
            <FaExternalLinkAlt className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={importFavorites} className="hidden" />
          </label>
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-red-600/50 hover:bg-red-600 border border-red-500 rounded-lg transition-all duration-300 flex items-center gap-2"
          >
            <FaTimes className="w-4 h-4" />
            Clear Cache
          </button>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="mb-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaChartBar className="w-6 h-6 text-purple-400" />
              Statistics Dashboard
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Extensions</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.languages}</div>
                <div className="text-sm text-gray-400">Languages</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-pink-400">{stats.totalFavorites}</div>
                <div className="text-sm text-gray-400">Favorites</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.totalDownloads}</div>
                <div className="text-sm text-gray-400">Downloads</div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-purple-300">Top Languages</h3>
                <div className="space-y-2">
                  {stats.topLanguages.map(([lang, count]) => (
                    <div key={lang} className="flex justify-between items-center">
                      <span className="text-gray-300">{lang.toUpperCase()}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-purple-300">Content Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">SFW Extensions</span>
                    <span className="text-green-400 font-semibold">{stats.sfw}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">NSFW Extensions</span>
                    <span className="text-red-400 font-semibold">{stats.nsfw}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Sources</span>
                    <span className="text-blue-400 font-semibold">{stats.totalSources}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg Sources/Extension</span>
                    <span className="text-purple-400 font-semibold">{stats.avgSources}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search with History */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search manga extensions... (fuzzy search enabled)"
              defaultValue={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => setShowSearchHistory(true)}
              onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
              className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current.value = '';
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white z-10"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}

            {/* Search History Dropdown */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FaHistory className="w-3 h-3" />
                      Recent Searches
                    </span>
                    <button
                      onClick={() => {
                        setSearchHistory([]);
                        localStorage.removeItem(SEARCH_HISTORY_KEY);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Clear
                    </button>
                  </div>
                  {searchHistory.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        searchInputRef.current.value = term;
                        handleSearchChange(term);
                        setShowSearchHistory(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FaGlobe className="w-4 h-4" />
                Language
              </label>
              <select
                value={selectedLang}
                onChange={e => setSelectedLang(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang === 'all' ? 'All Languages' : lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* NSFW Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FaFilter className="w-4 h-4" />
                Content
              </label>
              <select
                value={nsfwFilter}
                onChange={e => setNsfwFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                <option value="all">All Content</option>
                <option value="sfw">Safe for Work</option>
                <option value="nsfw">NSFW (18+)</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FaSort className="w-4 h-4" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                <option value="name">Name</option>
                <option value="version">Version</option>
                <option value="sources">Sources Count</option>
                <option value="language">Language</option>
                {downloads.length > 0 && <option value="recent">Recently Downloaded</option>}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                {sortOrder === 'asc' ? (
                  <FaSortAmountUp className="w-4 h-4" />
                ) : (
                  <FaSortAmountDown className="w-4 h-4" />
                )}
                Order
              </label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-purple-500 text-white transition-all duration-300 flex items-center justify-center gap-2"
              >
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
              </button>
            </div>
          </div>

          {/* Min Sources Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium flex items-center gap-2 min-w-[120px]">
              <FaHashtag className="w-4 h-4" />
              Min Sources: {minSources}
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={minSources}
              onChange={e => setMinSources(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(minSources / 20) * 100}%, rgb(55, 65, 81) ${(minSources / 20) * 100}%, rgb(55, 65, 81) 100%)`,
              }}
            />
            {minSources > 0 && (
              <button
                onClick={() => setMinSources(0)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Extension Details Modal */}
        {selectedExtension && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedExtension(null)}
          >
            <div
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold">
                  {selectedExtension.name.replace('Tachiyomi: ', '')}
                </h2>
                <button
                  onClick={() => setSelectedExtension(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-600/50 rounded-full text-sm font-medium">
                    {selectedExtension.lang.toUpperCase()}
                  </span>
                  {selectedExtension.nsfw === 1 && (
                    <span className="px-3 py-1 bg-red-600/50 rounded-full text-sm font-medium">
                      18+
                    </span>
                  )}
                  <span className="px-3 py-1 bg-blue-600/50 rounded-full text-sm font-medium">
                    v{selectedExtension.version}
                  </span>
                  <span className="px-3 py-1 bg-green-600/50 rounded-full text-sm font-medium">
                    {selectedExtension.sources?.length || 0} sources
                  </span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <p className="flex items-center gap-2">
                    <FaCode className="w-4 h-4 text-purple-400" />
                    <span className="font-medium">Package:</span>{' '}
                    <span className="text-sm text-gray-400 break-all">{selectedExtension.pkg}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FaHashtag className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">Version:</span> {selectedExtension.version}
                  </p>
                  <p className="flex items-center gap-2">
                    <FaBook className="w-4 h-4 text-green-400" />
                    <span className="font-medium">Total Sources:</span>{' '}
                    {selectedExtension.sources?.length || 0}
                  </p>
                </div>
                {selectedExtension.sources && selectedExtension.sources.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FaGlobeAmericas className="w-5 h-5 text-purple-400" />
                      Available Sources
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedExtension.sources.map((source, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-700/50 transition-colors"
                        >
                          <p className="font-medium text-white">{source.name}</p>
                          {source.baseUrl && (
                            <a
                              href={source.baseUrl.split('#')[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 text-sm break-all flex items-center gap-1 mt-1"
                            >
                              <FaExternalLinkAlt className="w-3 h-3" />
                              {source.baseUrl.split('#')[0]}
                            </a>
                          )}
                          {source.id && (
                            <p className="text-xs text-gray-500 mt-1">ID: {source.id}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <a
                    href={`https://raw.githubusercontent.com/keiyoushi/extensions/repo/apk/${selectedExtension.apk}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackDownload(selectedExtension.pkg)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition-all duration-300"
                  >
                    <FaDownload className="w-4 h-4" />
                    Download APK
                  </a>
                  <button
                    onClick={() => toggleFavorite(selectedExtension.pkg)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${favorites.includes(selectedExtension.pkg) ? 'bg-pink-600 hover:bg-pink-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    {favorites.includes(selectedExtension.pkg) ? (
                      <FaHeart className="w-5 h-5" />
                    ) : (
                      <FaRegHeart className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manga Grid */}
        {filteredData.length === 0 ? (
          <div className="text-center py-16">
            <FaBook className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400">No manga extensions found</p>
            {showFavoritesOnly && (
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Show All Extensions
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedData.map((manga, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all duration-300 hover:transform hover:scale-[1.02]"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3
                          className="text-xl font-semibold line-clamp-2 flex-1 cursor-pointer hover:text-purple-400 transition-colors"
                          onClick={() => setSelectedExtension(manga)}
                        >
                          {manga.name.replace('Tachiyomi: ', '')}
                        </h3>
                        <button
                          onClick={() => toggleFavorite(manga.pkg)}
                          className="ml-2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {favorites.includes(manga.pkg) ? (
                            <FaHeart className="w-5 h-5 text-pink-500" />
                          ) : (
                            <FaRegHeart className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-600/50 rounded-full text-xs font-medium">
                          {manga.lang.toUpperCase()}
                        </span>
                        {manga.nsfw === 1 && (
                          <span className="px-2 py-1 bg-red-600/50 rounded-full text-xs font-medium">
                            18+
                          </span>
                        )}
                        <span className="px-2 py-1 bg-blue-600/50 rounded-full text-xs font-medium">
                          v{manga.version}
                        </span>
                        {downloads.some(d => d.pkg === manga.pkg) && (
                          <span className="px-2 py-1 bg-green-600/50 rounded-full text-xs font-medium flex items-center gap-1">
                            <FaCheckCircle className="w-3 h-3" />
                            Downloaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-400">
                    <p>
                      <span className="font-medium">Package:</span>{' '}
                      <span className="text-xs break-all">{manga.pkg}</span>
                    </p>
                    {manga.sources && manga.sources.length > 0 && (
                      <p>
                        <span className="font-medium">Sources:</span> {manga.sources.length}
                      </p>
                    )}
                  </div>

                  {/* Sources Preview */}
                  {manga.sources && manga.sources.length > 0 && (
                    <div className="border-t border-gray-700 pt-4 mb-4">
                      <p className="text-sm font-medium mb-2">
                        Available Sources: {manga.sources.length}
                      </p>
                      <div className="space-y-2 max-h-24 overflow-y-auto">
                        {manga.sources.slice(0, 3).map((source, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="text-white font-medium line-clamp-1">{source.name}</p>
                          </div>
                        ))}
                        {manga.sources.length > 3 && (
                          <button
                            onClick={() => setSelectedExtension(manga)}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                          >
                            <FaInfoCircle className="w-3 h-3" />
                            View all {manga.sources.length} sources
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <a
                        href={`https://raw.githubusercontent.com/keiyoushi/extensions/repo/apk/${manga.apk}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackDownload(manga.pkg)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-center font-medium transition-all duration-300"
                      >
                        <FaDownload className="w-4 h-4" />
                        Download
                      </a>
                      <button
                        onClick={() => setSelectedExtension(manga)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all duration-300"
                      >
                        <FaInfoCircle className="w-4 h-4" />
                      </button>
                    </div>

                    {manga.sources && manga.sources.length > 0 && manga.sources[0].baseUrl && (
                      <a
                        href={manga.sources[0].baseUrl.split('#')[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-center font-medium transition-all duration-300"
                      >
                        <FaExternalLinkAlt className="w-4 h-4" />
                        Visit Source
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  <FaChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 font-bold'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  Next
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Results Info */}
            <div className="mt-4 text-center text-sm text-gray-400">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length}{' '}
              extensions
              {showFavoritesOnly && ' (Favorites only)'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MangaExtensionsPage;
