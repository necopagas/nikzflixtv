import React, { useState, useEffect, useRef } from 'react';
import { useMyList } from '../hooks/useMyList';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useWatchedHistory } from '../hooks/useWatchedHistory';
import { useRecommendations } from '../hooks/useRecommendations';
import { Banner } from '../components/Banner';
import { GenreFilter } from '../components/GenreFilter';
import { Row } from '../components/Row';
import AdsterraBanner from '../AdsterraBanner';
// --- GIDUGANG ANG CURATED_COLLECTIONS IMPORT ---
import { API_ENDPOINTS, MOVIE_GENRES, CURATED_COLLECTIONS } from '../config';
import { fetchData } from '../utils/fetchData';

export const HomePage = ({ onOpenModal, isWatched }) => {
  const { myList, loading: myListLoading } = useMyList();
  const { continueWatchingList, loading: continueWatchingLoading } = useContinueWatching();
  const { watchedHistory, loading: historyLoading } = useWatchedHistory();
  const {
    recommendations: aiRecommendations,
    loading: recLoading,
    sourceItem,
    hasWatchHistory,
    hasMyList: hasMyListItems,
  } = useRecommendations();

  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [anime, setAnime] = useState([]);
  const [asianDramas, setAsianDramas] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreMovies, setGenreMovies] = useState([]);
  const [isLoadingGenre, setIsLoadingGenre] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationSourceItem, setRecommendationSourceItem] = useState(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const lastRecommendationIdRef = useRef(null);
  const isFetchingRecommendationsRef = useRef(false);

  // --- STATE PARA SA ATONG COLLECTIONS DATA ---
  const [collectionsData, setCollectionsData] = useState([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  // --- EFFECT PARA MOKUHA SA STANDARD ROWS ---
  useEffect(() => {
    let isMounted = true;

    const loadPrimaryRows = async () => {
      const [trendingData, popularData, topRatedData, tvShowsData, animeData, asianDramaData] =
        await Promise.all([
          fetchData(API_ENDPOINTS.trending),
          fetchData(API_ENDPOINTS.popular),
          fetchData(API_ENDPOINTS.toprated),
          fetchData(API_ENDPOINTS.tvshows),
          fetchData(API_ENDPOINTS.anime),
          fetchData(API_ENDPOINTS.asianDramas),
        ]);

      if (!isMounted) return;

      setTrending(trendingData.results || []);
      setPopular(popularData.results || []);
      setTopRated(topRatedData.results || []);
      setTvShows(tvShowsData.results || []);
      setAnime(animeData.results || []);
      setAsianDramas(asianDramaData.results || []);
    };

    loadPrimaryRows();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- EFFECT PARA MOKUHA SA RECOMMENDATIONS ---
  useEffect(() => {
    let isMounted = true;

    const loadRecommendations = async () => {
      if (historyLoading) return;

      if (watchedHistory.length === 0) {
        if (isMounted) {
          setIsLoadingRecs(false);
          setRecommendations([]);
          setRecommendationSourceItem(null);
        }
        lastRecommendationIdRef.current = null;
        isFetchingRecommendationsRef.current = false;
        return;
      }

      const lastWatchedRaw = watchedHistory[watchedHistory.length - 1];
      const lastWatchedId = lastWatchedRaw?.toString();

      if (
        lastRecommendationIdRef.current === lastWatchedId &&
        !isFetchingRecommendationsRef.current
      ) {
        return;
      }

      lastRecommendationIdRef.current = lastWatchedId;
      isFetchingRecommendationsRef.current = true;

      if (isMounted) {
        setIsLoadingRecs(true);
        setRecommendations([]);
        setRecommendationSourceItem(null);
      }

      try {
        const [movieDetails, tvDetails] = await Promise.all([
          fetchData(API_ENDPOINTS.details('movie', lastWatchedId)).catch(() => null),
          fetchData(API_ENDPOINTS.details('tv', lastWatchedId)).catch(() => null),
        ]);

        const detailsData = movieDetails?.id ? movieDetails : tvDetails?.id ? tvDetails : null;
        const mediaType = movieDetails?.id ? 'movie' : 'tv';

        if (!detailsData) {
          console.warn(`Could not find details for watched item ID: ${lastWatchedId}`);
          lastRecommendationIdRef.current = null;
          if (isMounted) {
            setRecommendations([]);
            setIsLoadingRecs(false);
          }
          return;
        }

        if (isMounted) {
          setRecommendationSourceItem(detailsData);
        }

        const recsData = await fetchData(API_ENDPOINTS.recommendations(mediaType, lastWatchedId));
        if (isMounted) {
          setRecommendations(recsData.results || []);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        lastRecommendationIdRef.current = null;
      } finally {
        isFetchingRecommendationsRef.current = false;
        if (isMounted) {
          setIsLoadingRecs(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [watchedHistory, historyLoading]);

  // --- BAG-ONG EFFECT PARA MOKUHA SA DATA SA COLLECTIONS ---
  useEffect(() => {
    let isMounted = true;
    const fetchCollectionDetails = async () => {
      if (isMounted) {
        setIsLoadingCollections(true);
      }
      const allCollectionsPromises = CURATED_COLLECTIONS.map(async collection => {
        // Two modes: endpoint (dynamic list) or explicit ids (hand-picked)
        if (collection.endpoint) {
          try {
            const data = await fetchData(collection.endpoint);
            const results = (data?.results || []).filter(d => d && d.poster_path);
            const limited = collection.limit ? results.slice(0, collection.limit) : results;
            return { title: collection.title, items: limited };
          } catch (err) {
            console.error(`Failed to fetch collection via endpoint for ${collection.title}:`, err);
            return { title: collection.title, items: [] };
          }
        }
        if (Array.isArray(collection.ids) && collection.ids.length) {
          const itemDetailsPromises = collection.ids.map(itemRef =>
            fetchData(API_ENDPOINTS.details(itemRef.type, itemRef.id)).catch(err => {
              console.error(`Failed to fetch details for ${itemRef.type} ID ${itemRef.id}:`, err);
              return null;
            })
          );
          const itemsDetails = await Promise.all(itemDetailsPromises);
          const validItems = itemsDetails.filter(
            details => details && (details.poster_path || details.backdrop_path)
          );
          return { title: collection.title, items: validItems };
        }
        return { title: collection.title, items: [] };
      });

      const resolvedCollections = await Promise.all(allCollectionsPromises);
      if (!isMounted) return;
      setCollectionsData(resolvedCollections.filter(c => c.items.length > 0)); // Ipakita lang ang collection kung naay valid items
      setIsLoadingCollections(false);
    };

    fetchCollectionDetails();
    return () => {
      isMounted = false;
    };
  }, []); // Modagan ra ni kausa inig load sa page

  const handleGenreSelect = genreId => {
    if (selectedGenre === genreId) {
      setSelectedGenre(null);
      setGenreMovies([]);
    } else {
      setSelectedGenre(genreId);
      setIsLoadingGenre(true);
      fetchData(API_ENDPOINTS.byGenre(genreId))
        .then(data => setGenreMovies(data.results || []))
        .finally(() => setIsLoadingGenre(false));
    }
  };

  const getRecommendationTitle = () => {
    if (!recommendationSourceItem) return '';
    const title = recommendationSourceItem.title || recommendationSourceItem.name;
    const shortTitle = title.length > 30 ? `${title.substring(0, 30)}...` : title;
    return `Because You Watched ${shortTitle}`;
  };

  const getAIRecommendationTitle = () => {
    if (!sourceItem) return 'Because You Watched';
    const title = sourceItem.title || sourceItem.name;
    const shortTitle = title.length > 30 ? `${title.substring(0, 30)}...` : title;
    return `Because You Watched ${shortTitle}`;
  };

  // Helper to get specific collection by title
  const findCollection = title => collectionsData.find(c => c.title === title);

  // Sidebar removed per request

  return (
    <>
      <Banner onOpenModal={onOpenModal} />
      <div className="bg-[#0b0b0b] text-white min-h-screen">
        <div className="px-4 sm:px-8 md:px-16 pb-20">
          {/* Main content (full width) */}
          <div>
            <main>
              <GenreFilter
                genres={MOVIE_GENRES}
                selectedGenre={selectedGenre}
                onGenreSelect={handleGenreSelect}
              />
              {selectedGenre && (
                <Row
                  id={`genre-${selectedGenre}`}
                  key={`genre-${selectedGenre}`}
                  title={MOVIE_GENRES.find(g => g.id === selectedGenre)?.name || 'Genre Results'}
                  items={genreMovies}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={isLoadingGenre}
                />
              )}
              {/* Curated Collections in requested order with emojis */}
              {!isLoadingCollections && (
                <>
                  {(() => {
                    const c = findCollection('Halloween Horrors');
                    return c ? (
                      <Row
                        id="halloween-horrors"
                        title="🎃 Halloween Horrors"
                        items={c.items}
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                      />
                    ) : null;
                  })()}
                  {(() => {
                    const c = findCollection('Mind-Bending Sci-Fi');
                    return c ? (
                      <Row
                        id="mind-bending-sci-fi"
                        title="🧠🚀 Mind-Bending Sci‑Fi"
                        items={c.items}
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                      />
                    ) : null;
                  })()}
                  {(() => {
                    const c = findCollection('Editor Picks');
                    return c ? (
                      <Row
                        id="editor-picks"
                        title="✍️⭐ Editor Picks"
                        items={c.items}
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                      />
                    ) : null;
                  })()}
                </>
              )}
              {isLoadingCollections && (
                <>
                  <Row
                    id="halloween-horrors"
                    title="🎃 Halloween Horrors"
                    items={[]}
                    onOpenModal={onOpenModal}
                    isWatched={isWatched}
                    isLoading={true}
                  />
                  <Row
                    id="mind-bending-sci-fi"
                    title="🧠🚀 Mind-Bending Sci‑Fi"
                    items={[]}
                    onOpenModal={onOpenModal}
                    isWatched={isWatched}
                    isLoading={true}
                  />
                  <Row
                    id="editor-picks"
                    title="✍️⭐ Editor Picks"
                    items={[]}
                    onOpenModal={onOpenModal}
                    isWatched={isWatched}
                    isLoading={true}
                  />
                </>
              )}
              {(recommendations.length > 0 || isLoadingRecs) && recommendationSourceItem && (
                <Row
                  id="because-you-watched"
                  title={`👀 ${getRecommendationTitle()}`}
                  items={recommendations}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={isLoadingRecs}
                />
              )}
              {/* AI-Powered Smart Recommendations */}
              {hasWatchHistory && aiRecommendations.becauseYouWatched.length > 0 && (
                <Row
                  id="ai-because-you-watched"
                  title={`🎯 ${getAIRecommendationTitle()}`}
                  items={aiRecommendations.becauseYouWatched}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={recLoading}
                />
              )}
              {hasWatchHistory && aiRecommendations.basedOnGenres.length > 0 && (
                <Row
                  id="ai-based-on-genres"
                  title="🎨 Based On Your Favorite Genres"
                  items={aiRecommendations.basedOnGenres}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={recLoading}
                />
              )}
              {aiRecommendations.forYou.length > 0 && (
                <Row
                  id="ai-for-you"
                  title="✨ Picked For You"
                  items={aiRecommendations.forYou}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={recLoading}
                />
              )}
              {hasMyListItems && aiRecommendations.similar.length > 0 && (
                <Row
                  id="ai-similar-to-list"
                  title="💫 More Like Your List"
                  items={aiRecommendations.similar}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={recLoading}
                />
              )}
              {aiRecommendations.trending.length > 0 && (
                <Row
                  id="ai-trending-for-you"
                  title="📈 Trending For You"
                  items={aiRecommendations.trending}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={recLoading}
                />
              )}{' '}
              <Row
                id="trending-now"
                title="🔥 Trending Now"
                items={trending}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
              <Row
                id="popular-movies"
                title="🍿 Popular Movies"
                items={popular}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
              {(continueWatchingList.length > 0 || continueWatchingLoading) && (
                <Row
                  id="continue-watching"
                  title="▶️ Continue Watching"
                  items={continueWatchingList}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={continueWatchingLoading}
                />
              )}
              <Row
                id="top-rated"
                title="🏆 Top Rated Movies"
                items={topRated}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
              <Row
                id="popular-tv"
                title="📺 Popular TV Shows"
                items={tvShows}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
              {(myList.length > 0 || myListLoading) && (
                <Row
                  id="my-list"
                  title="⭐ My List"
                  items={myList}
                  onOpenModal={onOpenModal}
                  isWatched={isWatched}
                  isLoading={myListLoading}
                />
              )}
              <Row
                id="anime"
                title="🐉 Anime"
                items={anime}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
                isLarge
              />
              <Row
                id="asian-dramas"
                title="🎭 Asian Dramas"
                items={asianDramas}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
              {/* Native Banner at bottom */}
              <AdsterraBanner />
            </main>
          </div>
        </div>
      </div>
    </>
  );
};
