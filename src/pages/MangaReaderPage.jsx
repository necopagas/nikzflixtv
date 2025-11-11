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
    name: 'WeebCentral',
    id: 'weebcentral',
    api: 'weebcentral',
    baseUrl: 'https://weebcentral.com',
    lang: 'en',
    nsfw: false,
    info: 'Extensive manga library with full reading support - ✅ Best for Reading (Complete chapters available)',
    useWeebCentral: true,
    working: true,
    canRead: true,
    cloudflareProtected: true,
    fallbackMessage:
      'WeebCentral uses Cloudflare protection. For full access, run the local proxy server with: npm run dev:with-proxy',
  },
  {
    name: 'Mangakakalot',
    id: 'mangakakalot',
    api: 'mangakakalot',
    baseUrl: 'https://mangapill.com',
    lang: 'en',
    nsfw: false,
    info: 'Popular manga source with extensive collection (now using Mangapill) - ✅ Full reading support',
    working: true,
    canRead: true,
    cloudflareProtected: false,
  },
  {
    name: 'Manganelo',
    id: 'manganelo',
    api: 'manganelo',
    baseUrl: 'https://manganelo.com',
    lang: 'en',
    nsfw: false,
    info: 'Large manga library with frequent updates - ✅ Full reading support',
    working: true,
    canRead: true,
    cloudflareProtected: false,
  },
  {
    name: 'MangaPanda',
    id: 'mangapanda',
    api: 'mangapanda',
    baseUrl: 'https://www.mangapanda.com',
    lang: 'en',
    nsfw: false,
    info: 'Classic manga reading site with vast collection - ✅ Full reading support',
    working: true,
    canRead: true,
    cloudflareProtected: false,
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
  const [selectedSource, setSelectedSource] = useState('weebcentral');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [viewMode, setViewMode] = useState('popular'); // 'popular' or 'recent'
  const [error, setError] = useState(null);

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

  // Fetch popular manga based on selected source
  const fetchPopularManga = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let manga = [];

      if (selectedSource === 'weebcentral') {
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
      } else if (selectedSource === 'anilist') {
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
      } else if (selectedSource === 'kitsu') {
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
      } else if (selectedSource === 'mangakakalot') {
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
      } else if (selectedSource === 'manganelo') {
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
      } else if (selectedSource === 'mangapanda') {
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
      } else {
        // Fetch from MangaDex (default)
        let endpoint =
          '/manga?limit=20&includes[]=cover_art&includes[]=author&order[followedCount]=desc';

        // Add genre filter if not "all"
        if (selectedGenre !== 'all') {
          endpoint += `&includedTags[]=${selectedGenre}`;
        }

        const data = await fetchMangaDex(endpoint);

        if (!data || !data.data) {
          throw new Error('No data received from MangaDex');
        }

        manga = data.data.map(item => {
          const coverArt = item.relationships.find(rel => rel.type === 'cover_art');
          const coverId = coverArt?.attributes?.fileName;

          return {
            id: item.id,
            title:
              item.attributes.title.en ||
              Object.values(item.attributes.title)[0] ||
              'Unknown Title',
            description:
              item.attributes.description?.en ||
              Object.values(item.attributes.description)[0] ||
              'No description available',
            coverImage: coverId
              ? `/api/manga-cover?mangaId=${item.id}&fileName=${coverId}&size=256`
              : 'https://via.placeholder.com/256x384?text=No+Cover',
            status: item.attributes.status,
            rating: item.attributes.contentRating,
            year: item.attributes.year,
            tags: item.attributes.tags?.slice(0, 5).map(tag => tag.attributes.name.en) || [],
            source: 'mangadex',
          };
        });
      }

      setMangaList(manga);
    } catch (err) {
      console.error('Error fetching popular manga:', err);

      // Check if it's a Cloudflare/Vercel protection error
      const errorMessage = err.message || '';
      const selectedSourceObj = MANGA_SOURCES.find(s => s.id === selectedSource);

      if (
        errorMessage.includes('Cloudflare') ||
        errorMessage.includes('protected') ||
        errorMessage.includes('challenge')
      ) {
        const fallbackMessage =
          selectedSourceObj?.fallbackMessage ||
          `This source is protected and may not work in all environments. Try using Mangakakalot, Manganelo, or MangaPanda instead.`;
        setError(
          `${selectedSourceObj?.name || 'Source'} is currently unavailable due to protection measures. ${fallbackMessage}`
        );
      } else {
        setError(
          `Failed to load manga from ${selectedSourceObj?.name || 'selected source'}. Please try again or switch to a different source.`
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

  // Handle source selection
  const handleSourceChange = sourceId => {
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
      if (selectedSource === 'weebcentral') {
        results = await searchWeebCentral(query);
      } else if (selectedSource === 'mangakakalot') {
        results = await searchMangakakalot(query);
      } else if (selectedSource === 'manganelo') {
        results = await searchManganelo(query);
      } else if (selectedSource === 'mangapanda') {
        results = await searchMangaPanda(query);
      } else if (selectedSource === 'anilist') {
        results = await searchAniList(query);
      } else if (selectedSource === 'kitsu') {
        results = await searchKitsu(query);
      } else {
        results = await searchMangaDex(query);
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
      const selectedSourceObj = MANGA_SOURCES.find(s => s.id === selectedSource);

      if (
        errorMessage.includes('Cloudflare') ||
        errorMessage.includes('protected') ||
        errorMessage.includes('challenge')
      ) {
        const fallbackMessage =
          selectedSourceObj?.fallbackMessage ||
          `This source is protected and may not work in all environments. Try using Mangakakalot, Manganelo, or MangaPanda instead.`;
        setError(
          `${selectedSourceObj?.name || 'Source'} is currently unavailable due to protection measures. ${fallbackMessage}`
        );
      } else {
        setError(
          `Failed to search manga from ${selectedSourceObj?.name || 'selected source'}. Please try again or switch to a different source.`
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
  }, [selectedSource, selectedGenre, viewMode]); // Re-fetch when source, genre, or view mode changes

  // Handle search input
  const onSearchSubmit = e => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header with Animated Gradient */}
        <div className="mb-10 text-center relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-blue-900/30 border border-purple-500/20 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 animate-pulse" />
          <h1 className="relative text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            📚 Manga Reader
          </h1>
          <p className="relative text-gray-300 text-lg font-medium drop-shadow-md">
            Discover and read thousands of manga from WeebCentral
          </p>
        </div>

        {/* Enhanced Search Bar with Glow Effect */}
        <form onSubmit={onSearchSubmit} className="mb-10">
          <div className="relative max-w-3xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-60 group-focus-within:opacity-60 transition-all duration-300" />
            <div className="relative flex items-center bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-500/30">
              <FaSearch className="absolute left-5 text-purple-400 text-xl group-focus-within:text-pink-400 transition-colors" />
              <input
                type="text"
                placeholder="Search for your favorite manga..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 text-white text-lg placeholder-gray-500 transition-all"
              />
            </div>
          </div>
        </form>

        {/* Source Selector */}
        <div className="mb-8">
          <h3 className="text-center text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
            Select Source
          </h3>
          <div className="flex flex-wrap justify-center gap-3 max-w-xl mx-auto">
            {MANGA_SOURCES.map(source => (
              <button
                key={source.id}
                onClick={() => handleSourceChange(source.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  selectedSource === source.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:text-white backdrop-blur-sm border border-gray-700'
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>
          {MANGA_SOURCES.find(s => s.id === selectedSource)?.info && (
            <div className="text-center mt-4">
              <p className="inline-flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                <FaBook className="text-purple-400" />
                {MANGA_SOURCES.find(s => s.id === selectedSource).info}
              </p>
            </div>
          )}
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

        {/* Enhanced View Mode Toggle */}
        <div className="mb-10">
          <div className="flex justify-center gap-4 max-w-xl mx-auto">
            <button
              onClick={() => setViewMode('popular')}
              className={`group flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'popular'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl shadow-orange-500/50'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700'
              }`}
            >
              <FaFire className={`text-2xl ${viewMode === 'popular' ? 'animate-pulse' : ''}`} />
              <span>Popular</span>
            </button>
            <button
              onClick={() => setViewMode('recent')}
              className={`group flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'recent'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl shadow-blue-500/50'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700'
              }`}
            >
              <FaBook className={`text-2xl ${viewMode === 'recent' ? 'animate-bounce' : ''}`} />
              <span>Recent</span>
            </button>
          </div>
        </div>

        {/* Enhanced Error Message */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="p-5 bg-gradient-to-r from-red-900/60 to-red-800/60 border-2 border-red-600/50 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-red-400 text-xl mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-100 font-medium mb-3">{error}</p>
                  {(error.includes('Cloudflare') || error.includes('protected')) &&
                    selectedSource === 'weebcentral' && (
                      <div className="mt-3 pt-3 border-t border-red-500/30">
                        <p className="text-red-200 text-sm mb-3">
                          ✨ Try these working alternatives instead:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedSource('anilist')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Switch to AniList
                          </button>
                          <button
                            onClick={() => setSelectedSource('kitsu')}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Switch to Kitsu
                          </button>
                          <button
                            onClick={() => setSelectedSource('mangadex')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Switch to MangaDex
                          </button>
                        </div>
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

            {/* Enhanced Manga Grid */}
            {(viewMode === 'recent' ? recentUpdates : mangaList).length === 0 ? (
              <div className="text-center py-20">
                <div className="relative inline-block">
                  <div className="absolute inset-0 blur-2xl opacity-30 bg-purple-600 animate-pulse" />
                  <FaBook className="relative w-20 h-20 mx-auto mb-6 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-400">No manga found</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {(viewMode === 'recent' ? recentUpdates : mangaList).map(manga => (
                  <div
                    key={manga.id}
                    className="group cursor-pointer"
                    onClick={() => {
                      const url = `/manga/${manga.id}?source=${manga.source || 'mangadex'}`;
                      if (manga.source === 'weebcentral' && manga.slug) {
                        navigate(`${url}&slug=${manga.slug}`);
                      } else {
                        navigate(url);
                      }
                    }}
                  >
                    <div className="relative overflow-hidden rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/50 group-hover:border-purple-500/50">
                      {/* Cover Image */}
                      <div className="aspect-[2/3] relative overflow-hidden">
                        <img
                          src={manga.coverImage}
                          alt={manga.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={e => {
                            e.target.src = 'https://via.placeholder.com/256x384?text=No+Image';
                          }}
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-xs text-gray-300 line-clamp-3 mb-2 leading-relaxed">
                              {manga.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              {manga.rating && (
                                <span
                                  className={`px-2 py-1 rounded-full font-semibold ${
                                    manga.rating === 'safe'
                                      ? 'bg-green-500/90 text-white'
                                      : manga.rating === 'suggestive'
                                        ? 'bg-yellow-500/90 text-white'
                                        : 'bg-red-500/90 text-white'
                                  }`}
                                >
                                  {manga.rating}
                                </span>
                              )}
                              {manga.status && (
                                <span className="px-2 py-1 bg-purple-500/90 text-white rounded-full font-semibold">
                                  {manga.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Info Card */}
                      <div className="p-3 bg-gradient-to-t from-gray-900/50 to-transparent">
                        <h3 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-purple-400 transition-colors leading-tight">
                          {manga.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {manga.year && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full font-medium">
                              {manga.year}
                            </span>
                          )}
                          {manga.lastUpdate && viewMode === 'recent' && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full font-medium">
                              {new Date(manga.lastUpdate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        {manga.tags && manga.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {manga.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full font-medium hover:bg-purple-500/30 transition-colors"
                              >
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
