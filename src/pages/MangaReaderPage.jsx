import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaSearch,
  FaBook,
  FaFire,
  FaStar,
  FaEye,
  FaExclamationTriangle,
  FaFilter,
} from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAgeVerification, AgeVerificationModal } from '../utils/ageVerification';

// Popular manga genres from MangaDex
const MANGA_GENRES = [
  { id: 'all', name: 'All Genres' },
  { id: '391b0423-d847-456f-aff0-8b0cfc03066b', name: 'Action' },
  { id: 'f8f62932-27da-4fe4-8ee1-6779a8c5edba', name: 'Adventure' },
  { id: '4d32cc48-9f00-4cca-9b5a-a839f0764984', name: 'Comedy' },
  { id: 'b9b8e24a-e9b7-4f8a-9c6d-e4d8f0e6a8d1', name: 'Drama' },
  { id: '423e2eae-a7a2-4a8b-ac03-a8351462d71d', name: 'Romance' },
  { id: '87cc87cd-a395-47af-b27a-93258283bbc6', name: 'Shounen' },
  { id: 'a3c67850-4684-404e-9b7f-c69850ee5da6', name: 'Shoujo' },
  { id: 'acc803a4-c95a-4c22-86fc-eb6b582d82a2', name: 'Isekai' },
  { id: '36fd93ea-e8b8-445e-b836-358f02b3d33d', name: 'Fantasy' },
  { id: '5920b825-4181-4a17-beeb-9918b0ff7a30', name: 'Horror' },
  { id: 'ee968100-4191-4968-93d3-f82d72be7e46', name: 'Mystery' },
  { id: '92d6d951-ca5e-429c-ac78-451071cbf064', name: 'Thriller' },
  { id: '5ca48985-9a9d-4bd8-be29-80dc0303db72', name: 'Sci-Fi' },
  { id: '81c836c9-914a-4eca-981a-560dad663e73', name: 'Slice of Life' },
];

// Manga sources from different providers
const MANGA_SOURCES = [
  {
    name: 'MangaDex',
    id: 'mangadex',
    api: 'mangadex',
    baseUrl: 'https://api.mangadex.org',
    lang: 'en',
    nsfw: false,
    info: 'Free manga database with official API',
    useConsumet: false,
  },
  {
    name: 'MangaPill',
    id: 'mangapill',
    api: 'mangapill',
    baseUrl: 'https://mangapill.com',
    lang: 'en',
    nsfw: false,
    info: 'Fast loading manga reader',
    useConsumet: true,
  },
  {
    name: 'MangaReader',
    id: 'mangareader',
    api: 'mangareader',
    baseUrl: 'https://mangareader.to',
    lang: 'en',
    nsfw: false,
    info: 'Large collection with manhwa & manhua',
    useConsumet: true,
  },
  {
    name: 'ComicK',
    id: 'comick',
    api: 'comick',
    baseUrl: 'https://comick.app',
    lang: 'en',
    nsfw: false,
    info: 'Modern manga reader with great UI',
    useConsumet: true,
  },
  {
    name: 'MangaKakalot',
    id: 'mangakakalot',
    api: 'mangakakalot',
    baseUrl: 'https://mangakakalot.com',
    lang: 'en',
    nsfw: false,
    info: 'Popular manga site with huge library',
    useConsumet: true,
  },
  {
    name: 'nHentai',
    id: 'nhentai',
    api: 'nhentai',
    baseUrl: 'https://nhentai.net',
    lang: 'en',
    nsfw: true,
    requiresAge: true,
    info: 'Adult manga content (18+ only)',
    useConsumet: true,
  },
];

const MangaReaderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [mangaList, setMangaList] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [selectedSource, setSelectedSource] = useState('mangadex');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [viewMode, setViewMode] = useState('popular'); // 'popular' or 'recent'
  const [error, setError] = useState(null);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [pendingSource, setPendingSource] = useState(null);

  const { isVerified, verifyAge } = useAgeVerification();

  // Helper function to fetch from MangaDex (with proxy fallback for production)
  const fetchMangaDex = async endpoint => {
    try {
      // In production, use the proxy to avoid CORS issues
      const isProduction = window.location.hostname !== 'localhost';

      if (isProduction) {
        const response = await fetch(`/api/mangadex?endpoint=${encodeURIComponent(endpoint)}`);
        if (!response.ok) throw new Error('Proxy request failed');
        return await response.json();
      } else {
        // In development, call MangaDex directly
        const response = await fetch(`https://api.mangadex.org${endpoint}`);
        if (!response.ok) throw new Error('MangaDex request failed');
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching from MangaDex:', error);
      throw error;
    }
  };

  // Fetch manga from MangaPill via Consumet API
  const searchMangaPill = async query => {
    try {
      const response = await fetch(
        `/api/consumet?provider=mangapill&action=search&query=${encodeURIComponent(query)}`
      );

      if (!response.ok) throw new Error('Failed to fetch from MangaPill');

      const data = await response.json();

      return (
        data.results?.map(manga => ({
          id: manga.id,
          title: manga.title || 'Unknown Title',
          description: manga.description || 'No description available',
          coverImage: manga.image || 'https://via.placeholder.com/256x384?text=No+Cover',
          status: manga.status || 'Unknown',
          rating: 'safe',
          year: null,
          tags: manga.genres || [],
        })) || []
      );
    } catch (err) {
      console.error('Error fetching from MangaPill:', err);
      return [];
    }
  };

  // Fetch manga from MangaDex API
  const searchMangaDex = async query => {
    try {
      const endpoint = `/manga?title=${encodeURIComponent(query)}&limit=20&includes[]=cover_art&includes[]=author`;
      const data = await fetchMangaDex(endpoint);

      return data.data.map(manga => {
        const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
        const coverId = coverArt?.attributes?.fileName;

        return {
          id: manga.id,
          title:
            manga.attributes.title.en ||
            Object.values(manga.attributes.title)[0] ||
            'Unknown Title',
          description:
            manga.attributes.description?.en ||
            Object.values(manga.attributes.description)[0] ||
            'No description available',
          coverImage: coverId
            ? `/api/manga-cover?mangaId=${manga.id}&fileName=${coverId}&size=256`
            : 'https://via.placeholder.com/256x384?text=No+Cover',
          status: manga.attributes.status,
          rating: manga.attributes.contentRating,
          year: manga.attributes.year,
          tags: manga.attributes.tags?.slice(0, 5).map(tag => tag.attributes.name.en) || [],
          source: 'mangadex',
        };
      });
    } catch (err) {
      console.error('Error fetching from MangaDex:', err);
      return [];
    }
  };

  // Fetch popular manga based on selected source
  const fetchPopularManga = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (selectedSource === 'mangapill') {
        // Fetch from MangaPill - search for popular terms
        const response = await fetch(
          '/api/consumet?provider=mangapill&action=search&query=popular'
        );

        if (!response.ok) throw new Error('Failed to fetch popular manga from MangaPill');

        const data = await response.json();

        const manga =
          data.results?.map(manga => ({
            id: manga.id,
            title: manga.title || 'Unknown Title',
            description: manga.description || 'No description available',
            coverImage: manga.image || 'https://via.placeholder.com/256x384?text=No+Cover',
            status: manga.status || 'Unknown',
            rating: 'safe',
            year: null,
            tags: manga.genres || [],
            source: 'mangapill',
          })) || [];

        setMangaList(manga);
      } else {
        // Fetch from MangaDex (default)
        let endpoint =
          '/manga?limit=20&includes[]=cover_art&includes[]=author&order[followedCount]=desc';

        // Add genre filter if not "all"
        if (selectedGenre !== 'all') {
          endpoint += `&includedTags[]=${selectedGenre}`;
        }

        const data = await fetchMangaDex(endpoint);

        const manga = data.data.map(manga => {
          const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
          const coverId = coverArt?.attributes?.fileName;

          return {
            id: manga.id,
            title:
              manga.attributes.title.en ||
              Object.values(manga.attributes.title)[0] ||
              'Unknown Title',
            description:
              manga.attributes.description?.en ||
              Object.values(manga.attributes.description)[0] ||
              'No description available',
            coverImage: coverId
              ? `/api/manga-cover?mangaId=${manga.id}&fileName=${coverId}&size=256`
              : 'https://via.placeholder.com/256x384?text=No+Cover',
            status: manga.attributes.status,
            rating: manga.attributes.contentRating,
            year: manga.attributes.year,
            tags: manga.attributes.tags?.slice(0, 5).map(tag => tag.attributes.name.en) || [],
            source: 'mangadex',
          };
        });

        setMangaList(manga);
      }
    } catch (err) {
      console.error('Error fetching popular manga:', err);
      setError('Failed to load manga. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recently updated manga
  const fetchRecentUpdates = async () => {
    try {
      setIsLoadingRecent(true);
      setError(null);

      // Fetch recently updated chapters to get manga IDs
      const endpoint =
        '/chapter?limit=30&order[publishAt]=desc&translatedLanguage[]=en&includes[]=manga';
      const chaptersData = await fetchMangaDex(endpoint);

      // Extract unique manga from chapters
      const mangaMap = new Map();

      for (const chapter of chaptersData.data) {
        const mangaRel = chapter.relationships.find(rel => rel.type === 'manga');
        if (mangaRel && !mangaMap.has(mangaRel.id)) {
          mangaMap.set(mangaRel.id, {
            id: mangaRel.id,
            title:
              mangaRel.attributes?.title?.en ||
              Object.values(mangaRel.attributes?.title || {})[0] ||
              'Unknown',
            lastUpdate: chapter.attributes.publishAt,
          });
        }

        // Stop at 20 unique manga
        if (mangaMap.size >= 20) break;
      }

      // Fetch full details for each manga
      const mangaIds = Array.from(mangaMap.keys());
      const mangaDetailsPromises = mangaIds.map(async mangaId => {
        try {
          const endpoint = `/manga/${mangaId}?includes[]=cover_art&includes[]=author`;
          const data = await fetchMangaDex(endpoint);

          const manga = data.data;
          const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
          const coverId = coverArt?.attributes?.fileName;

          return {
            id: manga.id,
            title:
              manga.attributes.title.en ||
              Object.values(manga.attributes.title)[0] ||
              'Unknown Title',
            description:
              manga.attributes.description?.en ||
              Object.values(manga.attributes.description)[0] ||
              'No description available',
            coverImage: coverId
              ? `/api/manga-cover?mangaId=${manga.id}&fileName=${coverId}&size=256`
              : 'https://via.placeholder.com/256x384?text=No+Cover',
            status: manga.attributes.status,
            rating: manga.attributes.contentRating,
            year: manga.attributes.year,
            tags: manga.attributes.tags?.slice(0, 5).map(tag => tag.attributes.name.en) || [],
            lastUpdate: mangaMap.get(mangaId).lastUpdate,
          };
        } catch (err) {
          console.error(`Error fetching manga ${mangaId}:`, err);
          return null;
        }
      });

      const mangaDetails = (await Promise.all(mangaDetailsPromises)).filter(m => m !== null);
      setRecentUpdates(mangaDetails);
    } catch (err) {
      console.error('Error fetching recent updates:', err);
      setError('Failed to load recent updates. Please try again.');
    } finally {
      setIsLoadingRecent(false);
    }
  };

  // Handle source selection with age verification
  const handleSourceChange = sourceId => {
    const source = MANGA_SOURCES.find(s => s.id === sourceId);

    if (source?.requiresAge && !isVerified) {
      setPendingSource(sourceId);
      setShowAgeVerification(true);
      return;
    }

    setSelectedSource(sourceId);
    // Reload manga for new source
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      fetchPopularManga();
    }
  };

  // Handle genre filter change
  const handleGenreChange = genre => {
    setSelectedGenre(genre);
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      fetchPopularManga();
    }
  };

  // Handle age verification
  const handleAgeVerify = birthYear => {
    if (verifyAge(birthYear)) {
      setShowAgeVerification(false);
      if (pendingSource) {
        setSelectedSource(pendingSource);
        setPendingSource(null);
      }
    }
  };

  // Search manga
  const handleSearch = async query => {
    if (!query.trim()) {
      fetchPopularManga();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let results;
      if (selectedSource === 'mangapill') {
        results = await searchMangaPill(query);
      } else {
        results = await searchMangaDex(query);
      }

      setMangaList(results);
      setSearchParams({ q: query }, { replace: true });
    } catch (err) {
      console.error('Error searching manga:', err);
      setError('Failed to search manga. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    } else {
      if (viewMode === 'popular') {
        fetchPopularManga();
      } else {
        fetchRecentUpdates();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, selectedGenre, viewMode]); // Re-fetch when source, genre, or view mode changes

  // Handle search input
  const onSearchSubmit = e => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Age Verification Modal */}
      {showAgeVerification && (
        <AgeVerificationModal
          onVerify={handleAgeVerify}
          onCancel={() => {
            setShowAgeVerification(false);
            setPendingSource(null);
          }}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Manga Reader
          </h1>
          <p className="text-gray-400 text-lg">Read manga online from multiple sources</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={onSearchSubmit} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search manga..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 text-white text-lg"
            />
          </div>
        </form>

        {/* Source Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {MANGA_SOURCES.map(source => (
              <button
                key={source.id}
                onClick={() => handleSourceChange(source.id)}
                className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedSource === source.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {source.name}
                {source.nsfw && (
                  <span className="ml-2 text-xs bg-red-600 px-2 py-0.5 rounded-full">18+</span>
                )}
              </button>
            ))}
          </div>

          {/* Source Info */}
          {MANGA_SOURCES.find(s => s.id === selectedSource)?.info && (
            <p className="text-center text-sm text-gray-400 mt-3">
              {MANGA_SOURCES.find(s => s.id === selectedSource).info}
            </p>
          )}

          {/* Age Warning */}
          {MANGA_SOURCES.find(s => s.id === selectedSource)?.nsfw && (
            <div className="max-w-2xl mx-auto mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0" />
              <p className="text-sm text-red-200">
                This source contains adult content (18+). By continuing, you confirm you are 18
                years or older.
              </p>
            </div>
          )}
        </div>

        {/* Genre Filter */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaFilter className="text-purple-400" />
            <h3 className="text-lg font-semibold">Filter by Genre</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {MANGA_GENRES.map(genre => (
              <button
                key={genre.id}
                onClick={() => handleGenreChange(genre.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedGenre === genre.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-8">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setViewMode('popular')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                viewMode === 'popular'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <FaFire />
              Popular Manga
            </button>
            <button
              onClick={() => setViewMode('recent')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                viewMode === 'recent'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <FaBook />
              Recent Updates
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/50 border border-red-700 rounded-lg text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading || isLoadingRecent ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="xl" />
          </div>
        ) : (
          <>
            {/* Page Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {searchQuery ? (
                  <>
                    <FaSearch className="text-purple-400" />
                    Search Results for "{searchQuery}"
                  </>
                ) : viewMode === 'recent' ? (
                  <>
                    <FaBook className="text-blue-500" />
                    Recently Updated
                  </>
                ) : (
                  <>
                    <FaFire className="text-orange-500" />
                    Popular Manga
                  </>
                )}
              </h2>
              <p className="text-gray-400 mt-2">
                {viewMode === 'recent'
                  ? `${recentUpdates.length} recently updated manga`
                  : `${mangaList.length} manga found`}
              </p>
            </div>

            {/* Manga Grid */}
            {(viewMode === 'recent' ? recentUpdates : mangaList).length === 0 ? (
              <div className="text-center py-16">
                <FaBook className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl text-gray-400">No manga found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {(viewMode === 'recent' ? recentUpdates : mangaList).map(manga => (
                  <div
                    key={manga.id}
                    className="group cursor-pointer"
                    onClick={() =>
                      navigate(`/manga/${manga.id}?source=${manga.source || selectedSource}`)
                    }
                  >
                    <div className="relative overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/50">
                      {/* Cover Image */}
                      <div className="aspect-[2/3] relative">
                        <img
                          src={manga.coverImage}
                          alt={manga.title}
                          className="w-full h-full object-cover"
                          onError={e => {
                            e.target.src = 'https://via.placeholder.com/256x384?text=No+Image';
                          }}
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="text-xs text-gray-300 line-clamp-3 mb-2">
                              {manga.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              {manga.rating && (
                                <span
                                  className={`px-2 py-1 rounded ${
                                    manga.rating === 'safe'
                                      ? 'bg-green-600'
                                      : manga.rating === 'suggestive'
                                        ? 'bg-yellow-600'
                                        : 'bg-red-600'
                                  }`}
                                >
                                  {manga.rating}
                                </span>
                              )}
                              {manga.status && (
                                <span className="px-2 py-1 bg-purple-600 rounded">
                                  {manga.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-purple-400 transition-colors">
                          {manga.title}
                        </h3>
                        {manga.year && <p className="text-xs text-gray-400">{manga.year}</p>}
                        {manga.lastUpdate && viewMode === 'recent' && (
                          <p className="text-xs text-green-400 mt-1">
                            Updated: {new Date(manga.lastUpdate).toLocaleDateString()}
                          </p>
                        )}
                        {manga.tags && manga.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {manga.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MangaReaderPage;
