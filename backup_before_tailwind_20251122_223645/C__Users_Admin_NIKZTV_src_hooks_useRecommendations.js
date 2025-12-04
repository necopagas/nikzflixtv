import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWatchedHistory } from './useWatchedHistory';
import { useMyList } from './useMyList';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS } from '../config';

/**
 * Smart Recommendations AI System
 * Analyzes watch history, favorite genres, and viewing patterns
 * to generate personalized content recommendations
 */
export const useRecommendations = () => {
  const { watchedHistory } = useWatchedHistory();
  const { myList } = useMyList();

  const [recommendations, setRecommendations] = useState({
    becauseYouWatched: [],
    basedOnGenres: [],
    trending: [],
    similar: [],
    forYou: [],
  });

  const [loading, setLoading] = useState(false);
  const [sourceItem, setSourceItem] = useState(null);

  // Memoize check values to prevent unnecessary recalculations
  const hasWatchHistory = useMemo(() => watchedHistory.length > 0, [watchedHistory.length]);
  const hasMyList = useMemo(() => myList.length > 0, [myList.length]);

  /**
   * Extract genre frequencies from watch history
   * Returns sorted array of [genreId, count]
   */
  const analyzeGenrePreferences = useCallback(async () => {
    if (watchedHistory.length === 0) return [];

    const genreFrequency = {};

    // Sample recent watch history (last 20 items)
    const recentHistory = watchedHistory.slice(-20);

    for (const itemId of recentHistory) {
      try {
        // Try as movie first, then TV
        const [movieData, tvData] = await Promise.all([
          fetchData(API_ENDPOINTS.details('movie', itemId)).catch(() => null),
          fetchData(API_ENDPOINTS.details('tv', itemId)).catch(() => null),
        ]);

        const data = movieData?.id ? movieData : tvData;
        if (!data?.genres) continue;

        // Count genre occurrences
        data.genres.forEach(genre => {
          genreFrequency[genre.id] = (genreFrequency[genre.id] || 0) + 1;
        });
      } catch (error) {
        console.error('Error analyzing item:', itemId, error);
      }
    }

    // Sort genres by frequency
    return Object.entries(genreFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([genreId]) => parseInt(genreId));
  }, [watchedHistory]);

  /**
   * Generate "Because You Watched X" recommendations
   * Based on the most recently watched item
   */
  const generateBecauseYouWatched = useCallback(async () => {
    if (watchedHistory.length === 0) return [];

    const lastWatchedId = watchedHistory[watchedHistory.length - 1];

    try {
      // Get details of last watched item
      const [movieDetails, tvDetails] = await Promise.all([
        fetchData(API_ENDPOINTS.details('movie', lastWatchedId)).catch(() => null),
        fetchData(API_ENDPOINTS.details('tv', lastWatchedId)).catch(() => null),
      ]);

      const details = movieDetails?.id ? movieDetails : tvDetails;
      const mediaType = movieDetails?.id ? 'movie' : 'tv';

      if (!details) return [];

      setSourceItem(details);

      // Get TMDB recommendations
      const recsData = await fetchData(API_ENDPOINTS.recommendations(mediaType, lastWatchedId));
      return (recsData.results || []).slice(0, 15);
    } catch (error) {
      console.error('Error generating "Because You Watched" recommendations:', error);
      return [];
    }
  }, [watchedHistory]);

  /**
   * Generate genre-based recommendations
   * Uses user's top 3 favorite genres
   */
  const generateGenreBasedRecommendations = useCallback(async () => {
    const topGenres = await analyzeGenrePreferences();
    if (topGenres.length === 0) return [];

    try {
      // Get content from top 3 favorite genres
      const genrePromises = topGenres.slice(0, 3).map(genreId =>
        fetchData(API_ENDPOINTS.byGenre(genreId))
          .then(data => data.results || [])
          .catch(() => [])
      );

      const genreResults = await Promise.all(genrePromises);

      // Merge and deduplicate
      const allItems = genreResults.flat();
      const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

      // Filter out already watched items
      const filteredItems = uniqueItems.filter(
        item => !watchedHistory.includes(item.id.toString())
      );

      // Sort by vote average and popularity
      return filteredItems
        .sort((a, b) => {
          const scoreA = (a.vote_average || 0) * 0.6 + (a.popularity || 0) * 0.4;
          const scoreB = (b.vote_average || 0) * 0.6 + (b.popularity || 0) * 0.4;
          return scoreB - scoreA;
        })
        .slice(0, 20);
    } catch (error) {
      console.error('Error generating genre-based recommendations:', error);
      return [];
    }
  }, [analyzeGenrePreferences, watchedHistory]);

  /**
   * Generate trending recommendations
   * Filtered to match user's genre preferences
   */
  const generateTrendingForYou = useCallback(async () => {
    try {
      const trendingData = await fetchData(API_ENDPOINTS.trending);
      const trendingItems = trendingData.results || [];

      // If user has watch history, filter by genre preferences
      if (watchedHistory.length > 0) {
        const topGenres = await analyzeGenrePreferences();

        return trendingItems
          .filter(item => {
            if (!item.genre_ids) return true;
            return item.genre_ids.some(genreId => topGenres.includes(genreId));
          })
          .slice(0, 15);
      }

      return trendingItems.slice(0, 15);
    } catch (error) {
      console.error('Error generating trending recommendations:', error);
      return [];
    }
  }, [watchedHistory, analyzeGenrePreferences]);

  /**
   * Generate "More Like This" recommendations
   * Based on items in user's list
   */
  const generateSimilarToMyList = useCallback(async () => {
    if (myList.length === 0) return [];

    try {
      // Get recommendations from multiple items in my list
      const listPromises = myList.slice(0, 3).map(async item => {
        const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        try {
          const recsData = await fetchData(API_ENDPOINTS.recommendations(mediaType, item.id));
          return recsData.results || [];
        } catch {
          return [];
        }
      });

      const similarResults = await Promise.all(listPromises);
      const allSimilar = similarResults.flat();

      // Deduplicate and filter
      const uniqueItems = Array.from(new Map(allSimilar.map(item => [item.id, item])).values());

      return uniqueItems.filter(item => !watchedHistory.includes(item.id.toString())).slice(0, 15);
    } catch (error) {
      console.error('Error generating similar recommendations:', error);
      return [];
    }
  }, [myList, watchedHistory]);

  /**
   * Generate "For You" personalized recommendations
   * Combines multiple signals: watch history, genres, ratings
   */
  const generateForYou = useCallback(async () => {
    try {
      // Get popular and top rated content
      const [popularData, topRatedData] = await Promise.all([
        fetchData(API_ENDPOINTS.popular),
        fetchData(API_ENDPOINTS.toprated),
      ]);

      const allItems = [...(popularData.results || []), ...(topRatedData.results || [])];

      // Deduplicate
      const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

      // Filter out watched items
      const unwatched = uniqueItems.filter(item => !watchedHistory.includes(item.id.toString()));

      // If user has watch history, apply preference-based scoring
      if (watchedHistory.length > 0) {
        const topGenres = await analyzeGenrePreferences();

        const scored = unwatched.map(item => {
          // Calculate genre match score
          const genreMatchScore = item.genre_ids
            ? item.genre_ids.filter(id => topGenres.includes(id)).length / item.genre_ids.length
            : 0;

          // Combine multiple factors
          const score =
            (item.vote_average || 0) * 0.3 +
            (item.popularity || 0) * 0.2 +
            genreMatchScore * 10 * 0.5;

          return { ...item, score };
        });

        return scored.sort((a, b) => b.score - a.score).slice(0, 20);
      }

      // For new users, return highest rated popular content
      return unwatched.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 20);
    } catch (error) {
      console.error('Error generating "For You" recommendations:', error);
      return [];
    }
  }, [watchedHistory, analyzeGenrePreferences]);

  /**
   * Main effect to generate all recommendations
   */
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const generateAllRecommendations = async () => {
      // Skip if no watch history (nothing to base recommendations on)
      if (watchedHistory.length === 0) {
        setLoading(false);
        setRecommendations({
          becauseYouWatched: [],
          basedOnGenres: [],
          trending: [],
          similar: [],
          forYou: [],
        });
        return;
      }

      setLoading(true);

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('Recommendations loading timeout');
          setLoading(false);
        }
      }, 15000); // 15 second timeout

      try {
        // Generate all recommendation types in parallel
        const [becauseYouWatched, basedOnGenres, trending, similar, forYou] = await Promise.all([
          generateBecauseYouWatched(),
          generateGenreBasedRecommendations(),
          generateTrendingForYou(),
          generateSimilarToMyList(),
          generateForYou(),
        ]);

        if (!isMounted) return;

        clearTimeout(timeoutId);

        setRecommendations({
          becauseYouWatched,
          basedOnGenres,
          trending,
          similar,
          forYou,
        });
      } catch (error) {
        console.error('Error generating recommendations:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateAllRecommendations();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedHistory.length, myList.length]);

  return {
    recommendations,
    loading,
    sourceItem,
    hasWatchHistory,
    hasMyList,
  };
};
