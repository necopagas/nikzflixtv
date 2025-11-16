import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaSearch,
  FaBook,
  FaFire,
  FaStar,
  FaEye,
  FaExclamationTriangle,
  FaFilter,
  FaDownload,
} from 'react-icons/fa';
import {
  getContinueList,
  getDownloadQueue,
  removeContinueEntry,
  removeQueueEntry,
} from '../utils/tachiyomiStorage';
import { LoadingSpinner } from '../components/LoadingSpinner';

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
    name: 'Mangahere',
    id: 'mangahere',
    api: 'mangahere',
    baseUrl: 'https://www.mangahere.cc',
    lang: 'en',
    nsfw: false,
    info: 'Official Mangahere catalog with the full library and chapters - currently the only supported source',
    working: true,
    canRead: true,
    cloudflareProtected: true,
    fallbackMessage:
      'Mangahere pages may be protected depending on your location. If you hit barriers, try again in a few minutes.',
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
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [viewMode, setViewMode] = useState('popular'); // 'popular' or 'recent'
  const [error, setError] = useState(null);
  const currentSourceId = MANGA_SOURCES[0]?.id || 'mangahere';
  const currentSourceObj = MANGA_SOURCES[0] || null;
  const [continueList, setContinueList] = useState([]);
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');

  useEffect(() => {
    const loadLists = () => {
      setContinueList(getContinueList());
      setDownloadQueue(getDownloadQueue());
    };

    loadLists();
    if (typeof window === 'undefined') return () => {};
    const handleStorageUpdate = () => loadLists();
    window.addEventListener('tachiyomi-storage', handleStorageUpdate);
    return () => window.removeEventListener('tachiyomi-storage', handleStorageUpdate);
  }, []);

  const handleContinueNavigation = entry => {
    if (!entry?.mangaId) return;
    const encodedId = encodeURIComponent(entry.mangaId);
    let url = `/manga/${encodedId}?source=${currentSourceId}`;
    if (entry.chapterId) {
      url += `&chapter=${encodeURIComponent(entry.chapterId)}`;
    }
    navigate(url);
  };

  const handleRemoveContinue = mangaId => {
    if (!mangaId) return;
    removeContinueEntry(mangaId);
  };

  const handleRemoveQueue = chapterId => {
    if (!chapterId) return;
    removeQueueEntry(chapterId);
  };

  const filteredContinueList = useMemo(() => {
    if (!continueList || continueList.length === 0) return [];
    let list = [...continueList];
    if (statusFilter !== 'all') {
      list = list.filter(entry => (entry.status || '').toLowerCase() === statusFilter);
    }
    if (sortOrder === 'alphabetical') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.updatedAt || b.timestamp || 0).getTime() -
          new Date(a.updatedAt || a.timestamp || 0).getTime()
      );
    }
    return list;
  }, [continueList, statusFilter, sortOrder]);

  // Helper function to fetch from AniList
  const fetchAniList = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({ action, ...params }).toString();
      const response = await fetch(`/api/anilist?${queryParams}`);

      if (!response.ok) throw new Error('AniList request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from AniList:', error);
      throw error;
    }
  };

  // Helper function to fetch from Kitsu
  const fetchKitsu = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({ action, ...params }).toString();
      const response = await fetch(`/api/kitsu?${queryParams}`);

      if (!response.ok) throw new Error('Kitsu request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Kitsu:', error);
      throw error;
    }
  };

  // Helper function to fetch from WeebCentral
  const fetchWeebCentral = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        source: 'weebcentral',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

      const data = await response.json();

      // Check for Cloudflare or deployment protection errors
      if (!response.ok) {
        if (
          data.error &&
          (data.error.includes('Cloudflare') || data.error.includes('Deployment protected'))
        ) {
          throw new Error(data.message || data.error);
        }
        throw new Error('WeebCentral request failed');
      }

      return data;
    } catch (error) {
      console.error('Error fetching from WeebCentral:', error);
      throw error;
    }
  };

  // Helper function to fetch from Mangakakalot
  const fetchMangakakalot = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        source: 'mangakakalot',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

      if (!response.ok) throw new Error('Mangakakalot request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Mangakakalot:', error);
      throw error;
    }
  };

  // Helper function to fetch from Manganelo
  const fetchManganelo = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        source: 'manganelo',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

      if (!response.ok) throw new Error('Manganelo request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Manganelo:', error);
      throw error;
    }
  };

  // Helper function to fetch from MangaPanda
  const fetchMangaPanda = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        source: 'mangapanda',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

      if (!response.ok) throw new Error('MangaPanda request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from MangaPanda:', error);
      throw error;
    }
  };

  const fetchMangahere = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        source: 'mangahere',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

      if (!response.ok) throw new Error('Mangahere request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Mangahere:', error);
      throw error;
    }
  };

  // Fetch manga from AniList API
  const searchAniList = async query => {
    try {
      const data = await fetchAniList('search', { query, perPage: 20 });

      if (!data?.data?.Page?.media) return [];

      return data.data.Page.media.map(manga => ({
        id: manga.id,
        title: manga.title.english || manga.title.romaji || 'Unknown Title',
        description: manga.description?.replace(/<[^>]*>/g, '') || 'No description available',
        coverImage: manga.coverImage.large || 'https://via.placeholder.com/256x384?text=No+Cover',
        status: manga.status,
        rating: 'safe',
        year: manga.startDate?.year || null,
        tags: manga.genres?.slice(0, 5) || [],
        score: manga.averageScore,
        chapters: manga.chapters,
        volumes: manga.volumes,
        source: 'anilist',
      }));
    } catch (err) {
      console.error('Error fetching from AniList:', err);
      return [];
    }
  };

  // Fetch manga from Kitsu API
  const searchKitsu = async query => {
    try {
      const data = await fetchKitsu('search', { query, page: 1 });

      if (!data?.data) return [];

      return data.data.map(manga => ({
        id: manga.id,
        title: manga.attributes.canonicalTitle || 'Unknown Title',
        description:
          manga.attributes.description || manga.attributes.synopsis || 'No description available',
        coverImage:
          manga.attributes.posterImage?.large ||
          manga.attributes.posterImage?.medium ||
          'https://via.placeholder.com/256x384?text=No+Cover',
        status: manga.attributes.status,
        rating: manga.attributes.ageRating || 'safe',
        year: manga.attributes.startDate
          ? new Date(manga.attributes.startDate).getFullYear()
          : null,
        tags: [],
        score: manga.attributes.averageRating
          ? Math.round(parseFloat(manga.attributes.averageRating) / 10)
          : null,
        chapters: manga.attributes.chapterCount,
        volumes: manga.attributes.volumeCount,
        source: 'kitsu',
      }));
    } catch (err) {
      console.error('Error fetching from Kitsu:', err);
      return [];
    }
  };

  // Fetch manga from WeebCentral
  const searchWeebCentral = async query => {
    try {
      const data = await fetchWeebCentral('search', { query });

      if (!data?.results) return [];

      return data.results.map(manga => ({
        id: manga.id,
        slug: manga.slug,
        title: manga.title || 'Unknown Title',
        description: 'Click to view details',
        coverImage: manga.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
        status: 'unknown',
        rating: 'safe',
        year: null,
        tags: [],
        source: 'weebcentral',
      }));
    } catch (err) {
      console.error('Error fetching from WeebCentral:', err);
      return [];
    }
  };

  // Fetch manga from Mangakakalot
  const searchMangakakalot = async query => {
    try {
      const data = await fetchMangakakalot('search', { query });

      if (!data?.results) return [];

      return data.results.map(manga => ({
        id: manga.id,
        title: manga.title || 'Unknown Title',
        description: 'Click to view details',
        coverImage: manga.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
        status: 'unknown',
        rating: 'safe',
        year: null,
        tags: [],
        source: 'mangakakalot',
      }));
    } catch (err) {
      console.error('Error fetching from Mangakakalot:', err);
      return [];
    }
  };

  // Fetch manga from Manganelo
  const searchManganelo = async query => {
    try {
      const data = await fetchManganelo('search', { query });

      if (!data?.results) return [];

      return data.results.map(manga => ({
        id: manga.id,
        title: manga.title || 'Unknown Title',
        description: 'Click to view details',
        coverImage: manga.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
        status: 'unknown',
        rating: 'safe',
        year: null,
        tags: [],
        source: 'manganelo',
      }));
    } catch (err) {
      console.error('Error fetching from Manganelo:', err);
      return [];
    }
  };

  // Fetch manga from MangaPanda
  const searchMangaPanda = async query => {
    try {
      const data = await fetchMangaPanda('search', { query });

      if (!data?.results) return [];

      return data.results.map(manga => ({
        id: manga.id,
        title: manga.title || 'Unknown Title',
        description: 'Click to view details',
        coverImage: manga.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
        status: 'unknown',
        rating: 'safe',
        year: null,
        tags: [],
        source: 'mangapanda',
      }));
    } catch (err) {
      console.error('Error fetching from MangaPanda:', err);
      return [];
    }
  };

  const searchMangahere = async query => {
    try {
      const data = await fetchMangahere('search', { query });
      return data?.results || [];
    } catch (err) {
      console.error('Error searching Mangahere:', err);
      return [];
    }
  };

  // Fetch popular manga based on selected source
  const fetchPopularManga = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let manga = [];
      const sourceId = currentSourceId;

      if (sourceId === 'mangahere') {
        const data = await fetchMangahere('popular');

        if (data?.results) {
          manga = data.results.map(item => ({
            id: item.id,
            slug: item.slug,
            title: item.title || 'Unknown Title',
            description: item.description || 'Click to view details',
            coverImage: item.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
            status: item.status || 'unknown',
            rating: 'safe',
            year: null,
            tags: item.tags || item.genres || [],
            source: 'mangahere',
          }));
        }
      } else if (sourceId === 'weebcentral') {
        // Fetch from WeebCentral
        const data = await fetchWeebCentral('popular');

        if (data?.results) {
          manga = data.results.map(item => ({
            id: item.id,
            slug: item.slug,
            title: item.title || 'Unknown Title',
            description: 'Click to view details',
            coverImage: item.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
            status: 'unknown',
            rating: 'safe',
            year: null,
            tags: [],
            source: 'weebcentral',
          }));
        }
      } else if (sourceId === 'anilist') {
        // Fetch from AniList
        const data = await fetchAniList('popular', { perPage: 20 });

        if (!data?.data?.Page?.media) {
          throw new Error('No data received from AniList');
        }

        manga = data.data.Page.media.map(item => ({
          id: item.id,
          title: item.title.english || item.title.romaji || 'Unknown Title',
          description: item.description?.replace(/<[^>]*>/g, '') || 'No description available',
          coverImage: item.coverImage.large || 'https://via.placeholder.com/256x384?text=No+Cover',
          status: item.status,
          rating: 'safe',
          year: item.startDate?.year || null,
          tags: item.genres?.slice(0, 5) || [],
          score: item.averageScore,
          chapters: item.chapters,
          volumes: item.volumes,
          source: 'anilist',
        }));
      } else if (sourceId === 'kitsu') {
        // Fetch from Kitsu
        const data = await fetchKitsu('popular', { page: 1 });

        if (!data?.data) {
          throw new Error('No data received from Kitsu');
        }

        manga = data.data.map(item => ({
          id: item.id,
          title: item.attributes.canonicalTitle || 'Unknown Title',
          description:
            item.attributes.description || item.attributes.synopsis || 'No description available',
          coverImage:
            item.attributes.posterImage?.large ||
            item.attributes.posterImage?.medium ||
            'https://via.placeholder.com/256x384?text=No+Cover',
          status: item.attributes.status,
          rating: item.attributes.ageRating || 'safe',
          year: item.attributes.startDate
            ? new Date(item.attributes.startDate).getFullYear()
            : null,
          tags: [],
          score: item.attributes.averageRating
            ? Math.round(parseFloat(item.attributes.averageRating) / 10)
            : null,
          chapters: item.attributes.chapterCount,
          volumes: item.attributes.volumeCount,
          source: 'kitsu',
        }));
      } else if (sourceId === 'mangakakalot') {
        // Fetch from Mangakakalot
        const data = await fetchMangakakalot('popular');

        if (data?.results) {
          manga = data.results.map(item => ({
            id: item.id,
            title: item.title || 'Unknown Title',
            description: 'Click to view details',
            coverImage: item.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
            status: 'unknown',
            rating: 'safe',
            year: null,
            tags: [],
            source: 'mangakakalot',
          }));
        }
      } else if (sourceId === 'manganelo') {
        // Fetch from Manganelo
        const data = await fetchManganelo('popular');

        if (data?.results) {
          manga = data.results.map(item => ({
            id: item.id,
            title: item.title || 'Unknown Title',
            description: 'Click to view details',
            coverImage: item.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
            status: 'unknown',
            rating: 'safe',
            year: null,
            tags: [],
            source: 'manganelo',
          }));
        }
      } else if (sourceId === 'mangapanda') {
        // Fetch from MangaPanda
        const data = await fetchMangaPanda('popular');

        if (data?.results) {
          manga = data.results.map(item => ({
            id: item.id,
            title: item.title || 'Unknown Title',
            description: 'Click to view details',
            coverImage: item.coverImage || 'https://via.placeholder.com/256x384?text=No+Cover',
            status: 'unknown',
            rating: 'safe',
            year: null,
            tags: [],
            source: 'mangapanda',
          }));
        }
      }

      setMangaList(manga);
    } catch (err) {
      console.error('Error fetching popular manga:', err);

      // Check if it's a Cloudflare/Vercel protection error
      const errorMessage = err.message || '';
      const selectedSourceObj = currentSourceObj;

      if (
        errorMessage.includes('Cloudflare') ||
        errorMessage.includes('protected') ||
        errorMessage.includes('challenge')
      ) {
        const fallbackMessage =
          selectedSourceObj?.fallbackMessage ||
          `This source is protected and may not work in all environments. Please try again later.`;
        setError(
          `${selectedSourceObj?.name || 'Source'} is currently unavailable due to protection measures. ${fallbackMessage}`
        );
      } else {
        setError(
          `Failed to load manga from ${selectedSourceObj?.name || 'selected source'}. Please try again later.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recently updated manga
  const fetchRecentUpdates = async () => {
    try {
      setIsLoadingRecent(true);
      setError(null);

      // Recent updates not available for current sources
      // Just show popular manga instead
      await fetchPopularManga();
      setRecentUpdates([]);
    } catch (err) {
      console.error('Error fetching recent updates:', err);
      setError('Failed to load recent updates. Please try again.');
    } finally {
      setIsLoadingRecent(false);
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

  // Search manga
  const handleSearch = async query => {
    if (!query.trim()) {
      fetchPopularManga();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const sourceId = currentSourceId;
      let results;
      if (sourceId === 'mangahere') {
        results = await searchMangahere(query);
      } else if (sourceId === 'weebcentral') {
        results = await searchWeebCentral(query);
      } else if (sourceId === 'mangakakalot') {
        results = await searchMangakakalot(query);
      } else if (sourceId === 'manganelo') {
        results = await searchManganelo(query);
      } else if (sourceId === 'mangapanda') {
        results = await searchMangaPanda(query);
      } else if (sourceId === 'anilist') {
        results = await searchAniList(query);
      } else if (sourceId === 'kitsu') {
        results = await searchKitsu(query);
      } else {
        // Default to weebcentral if no source matches
        results = await searchWeebCentral(query);
      }

      if (!results || results.length === 0) {
        setError(`No results found for "${query}". Try different keywords.`);
      }

      setMangaList(results);
      setSearchParams({ q: query }, { replace: true });
    } catch (err) {
      console.error('Error searching manga:', err);

      // Check for Cloudflare or protection errors
      const errorMessage = err.message || '';
      const selectedSourceObj = currentSourceObj;

      if (
        errorMessage.includes('Cloudflare') ||
        errorMessage.includes('protected') ||
        errorMessage.includes('challenge')
      ) {
        const fallbackMessage =
          selectedSourceObj?.fallbackMessage ||
          `This source is protected and may not work in all environments. Please try again later.`;
        setError(
          `${selectedSourceObj?.name || 'Source'} is currently unavailable due to protection measures. ${fallbackMessage}`
        );
      } else {
        setError(
          `Failed to search manga from ${selectedSourceObj?.name || 'selected source'}. Please try again later.`
        );
      }
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
  }, [selectedGenre, viewMode]); // Re-fetch when genre or view mode changes

  // Handle search input
  const onSearchSubmit = e => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#0b0b10] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6 border-b border-gray-800 pb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Web Manga Reader</p>
              <h1 className="text-3xl font-semibold">Library</h1>
            </div>
            <span className="text-xs font-medium text-gray-400">Mangahere • Web Source</span>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Minimal layout inspired by Tachiyomi’s entry screen. Scroll to browse and tap a cover to
            open the reader.
          </p>
        </header>

        {/* Extensions Banner */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FaDownload className="text-purple-400 w-6 h-6" />
              <div>
                <h3 className="text-sm font-semibold">Need more manga sources?</h3>
                <p className="text-xs text-gray-400">
                  Download 100+ Tachiyomi/Aniyomi extensions para sa mobile (APK format)
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/manga-extensions')}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Get Extensions →
            </button>
          </div>
        </div>

        {/* Tachiyomi-style search */}
        <form onSubmit={onSearchSubmit} className="mb-8">
          <div className="relative max-w-3xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search Mangahere..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl bg-gray-900 border border-gray-800 px-4 py-3 pl-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/60"
            />
          </div>
        </form>

        {/* Source Banner */}
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-purple-300 mb-2">Source</p>
          <p className="text-lg font-semibold text-white">Mangahere (default + only option)</p>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl mx-auto">{MANGA_SOURCES[0]?.info}</p>
        </div>

        {/* Enhanced Genre Filter */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-500" />
            <div className="flex items-center gap-2 text-purple-400">
              <FaFilter className="text-xl" />
              <h3 className="text-lg font-bold uppercase tracking-wide">Genres</h3>
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-500" />
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-5xl mx-auto">
            {MANGA_GENRES.map(genre => (
              <button
                key={genre.id}
                onClick={() => handleGenreChange(genre.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  selectedGenre === genre.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/80 hover:text-white backdrop-blur-sm border border-gray-700'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tachiyomi-style tabs */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex rounded-full bg-gray-900 border border-gray-800 p-1">
            {[
              { id: 'popular', label: 'Popular', icon: FaFire },
              { id: 'recent', label: 'Recent', icon: FaBook },
            ].map(option => {
              const Icon = option.icon;
              const isActive = viewMode === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setViewMode(option.id)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isActive ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="text-base" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tachiyomi continue & queue */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
          <section className="rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-gray-900 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Continue</p>
                <h3 className="text-xl font-semibold">Continue Reading</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {['all', 'reading', 'completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      statusFilter === status
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
                <div className="flex items-center gap-1 text-gray-400">
                  <span className="text-[10px] uppercase tracking-wider">Sort</span>
                  <button
                    onClick={() => setSortOrder('recent')}
                    className={`px-3 py-1 rounded-full text-xs ${
                      sortOrder === 'recent'
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortOrder('alphabetical')}
                    className={`px-3 py-1 rounded-full text-xs ${
                      sortOrder === 'alphabetical'
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Title
                  </button>
                </div>
              </div>
            </div>
            {filteredContinueList.length === 0 ? (
              <p className="text-sm text-gray-500">Start reading a manga to appear here.</p>
            ) : (
              <div className="space-y-3">
                {filteredContinueList.map(entry => (
                  <div
                    key={`${entry.mangaId}-${entry.chapterId || 'latest'}`}
                    className="flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3"
                  >
                    <button
                      className="text-left"
                      type="button"
                      onClick={() => handleContinueNavigation(entry)}
                    >
                      <p className="text-sm font-semibold text-white line-clamp-1">
                        {entry.title || 'Unknown Title'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {entry.chapterName || entry.chapter || 'Continue chapter'} •{' '}
                        {entry.status ? entry.status.replace('_', ' ') : 'Unknown'}
                      </p>
                    </button>
                    <button
                      className="text-xs font-semibold text-red-400"
                      type="button"
                      onClick={() => handleRemoveContinue(entry.mangaId)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-3xl border border-gray-800 bg-gradient-to-b from-[#140015]/80 to-gray-900 p-5 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Queue</p>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  Download Queue
                  <FaEye className="text-sm text-gray-400" />
                </h3>
              </div>
              <span className="rounded-full bg-purple-600 px-3 py-1 text-[11px] font-semibold text-white">
                {downloadQueue.length} queued
              </span>
            </div>
            {downloadQueue.length === 0 ? (
              <p className="text-sm text-gray-500">
                Queued chapters show up here for offline grabs.
              </p>
            ) : (
              <div className="space-y-3">
                {downloadQueue.map(entry => (
                  <div
                    key={`${entry.chapterId}-${entry.mangaId}`}
                    className="flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white line-clamp-1">
                        {entry.chapterName || entry.chapter || 'Chapter'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {entry.title || entry.mangaTitle || 'Unknown Manga'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleContinueNavigation(entry)}
                        className="text-[11px] text-purple-400"
                        type="button"
                      >
                        Read
                      </button>
                      <button
                        onClick={() => handleRemoveQueue(entry.chapterId)}
                        className="text-[11px] font-semibold text-red-400"
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Enhanced Error Message */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="p-5 bg-gradient-to-r from-red-900/60 to-red-800/60 border-2 border-red-600/50 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-red-400 text-xl mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-100 font-medium mb-3">{error}</p>
                  {(error.includes('Cloudflare') || error.includes('protected')) && (
                    <div className="mt-3 pt-3 border-t border-red-500/30">
                      <p className="text-red-200 text-sm">
                        ✨ Mangahere may be blocked in your region. Try again later or refresh the
                        page.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

            {/* Tachiyomi Library Grid */}
            {(viewMode === 'recent' ? recentUpdates : mangaList).length === 0 ? (
              <div className="text-center py-20">
                <div className="relative inline-block">
                  <div className="absolute inset-0 blur-2xl opacity-30 bg-blue-600 animate-pulse" />
                  <FaBook className="relative w-20 h-20 mx-auto mb-6 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-400">Nothing yet</p>
                <p className="text-gray-500 mt-2">Search or switch to Popular to load titles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {(viewMode === 'recent' ? recentUpdates : mangaList).map(manga => (
                  <div
                    key={manga.id}
                    className="cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                    onClick={() => {
                      const encodedId = encodeURIComponent(manga.id);
                      const sourceParam = manga.source || currentSourceId;
                      let url = `/manga/${encodedId}?source=${sourceParam}`;
                      if (manga.slug) {
                        url += `&slug=${encodeURIComponent(manga.slug)}`;
                      }
                      navigate(url);
                    }}
                  >
                    <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-xl transition-all duration-300 hover:border-white">
                      <div className="aspect-[2/3] bg-gray-800">
                        <img
                          src={manga.coverImage}
                          alt={manga.title}
                          className="w-full h-full object-cover"
                          onError={e => {
                            e.target.src = 'https://via.placeholder.com/256x384?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="px-3 py-3 space-y-1">
                        <h3 className="text-sm font-semibold text-white line-clamp-2">
                          {manga.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 line-clamp-2">
                          {manga.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                          {manga.rating && (
                            <span className="rounded-full bg-gray-800 px-2 py-1 font-semibold">
                              {manga.rating}
                            </span>
                          )}
                          {manga.status && (
                            <span className="rounded-full bg-gray-800 px-2 py-1 font-semibold uppercase tracking-wide">
                              {manga.status}
                            </span>
                          )}
                          {manga.year && (
                            <span className="rounded-full bg-gray-800 px-2 py-1 font-semibold">
                              {manga.year}
                            </span>
                          )}
                          {manga.lastUpdate && viewMode === 'recent' && (
                            <span className="rounded-full bg-gray-800 px-2 py-1 font-semibold">
                              {new Date(manga.lastUpdate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        {manga.tags && manga.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                            {manga.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="rounded-full bg-gray-800 px-2 py-1">
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
