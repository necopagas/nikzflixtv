import React, { useState, useEffect } from 'react';
import { useMyList } from '../hooks/useMyList';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useWatchedHistory } from '../hooks/useWatchedHistory'; 
import { Banner } from '../components/Banner';
import { GenreFilter } from '../components/GenreFilter';
import { Row } from '../components/Row';
import AdsterraBanner from '../AdsterraBanner';
import { AdsterraSmartlink } from '../components/AdsterraSmartlink';
// --- GIDUGANG ANG CURATED_COLLECTIONS IMPORT ---
import { API_ENDPOINTS, MOVIE_GENRES, CURATED_COLLECTIONS } from '../config'; 
import { fetchData } from '../utils/fetchData';

export const HomePage = ({ onOpenModal, isWatched }) => {
    const { myList, loading: myListLoading } = useMyList();
    const { continueWatchingList, loading: continueWatchingLoading } = useContinueWatching();
    const { watchedHistory, loading: historyLoading } = useWatchedHistory(); 
    
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

    // --- STATE PARA SA ATONG COLLECTIONS DATA ---
    const [collectionsData, setCollectionsData] = useState([]);
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);

    // --- EFFECT PARA MOKUHA SA STANDARD ROWS ---
    useEffect(() => {
        // Fetch data for standard rows
        fetchData(API_ENDPOINTS.trending).then(data => setTrending(data.results || []));
        fetchData(API_ENDPOINTS.popular).then(data => setPopular(data.results || []));
        fetchData(API_ENDPOINTS.toprated).then(data => setTopRated(data.results || []));
        fetchData(API_ENDPOINTS.tvshows).then(data => setTvShows(data.results || []));
        fetchData(API_ENDPOINTS.anime).then(data => setAnime(data.results || []));
        fetchData(API_ENDPOINTS.asianDramas).then(data => setAsianDramas(data.results || []));
    }, []);

    // --- EFFECT PARA MOKUHA SA RECOMMENDATIONS ---
    useEffect(() => {
        if (!historyLoading && watchedHistory.length > 0) {
            const lastWatchedId = watchedHistory[watchedHistory.length - 1]; 
            if (recommendationSourceItem?.id.toString() === lastWatchedId) return;

            setIsLoadingRecs(true);
            setRecommendations([]); 
            setRecommendationSourceItem(null);

            Promise.all([
                fetchData(API_ENDPOINTS.details('movie', lastWatchedId)).catch(() => null),
                fetchData(API_ENDPOINTS.details('tv', lastWatchedId)).catch(() => null)
            ]).then(([movieDetails, tvDetails]) => {
                const detailsData = movieDetails?.id ? movieDetails : tvDetails?.id ? tvDetails : null;
                const mediaType = movieDetails?.id ? 'movie' : 'tv';

                if (detailsData) {
                    setRecommendationSourceItem(detailsData);
                    return fetchData(API_ENDPOINTS.recommendations(mediaType, lastWatchedId));
                } else {
                    console.warn(`Could not find details for watched item ID: ${lastWatchedId}`);
                    return { results: [] }; 
                }
            })
            .then(recsData => {
                setRecommendations(recsData.results || []);
            })
            .catch(error => { console.error("Failed to fetch recommendations:", error); })
            .finally(() => { setIsLoadingRecs(false); });
        } else if (!historyLoading && watchedHistory.length === 0) {
             setRecommendations([]);
             setRecommendationSourceItem(null);
        }
    }, [watchedHistory, historyLoading, recommendationSourceItem]); 

    // --- BAG-ONG EFFECT PARA MOKUHA SA DATA SA COLLECTIONS ---
    useEffect(() => {
        setIsLoadingCollections(true);
        const fetchCollectionDetails = async () => {
            const allCollectionsPromises = CURATED_COLLECTIONS.map(async (collection) => {
                // Mag-fetch ta sa details para sa kada ID sa collection
                const itemDetailsPromises = collection.ids.map(itemRef => 
                    fetchData(API_ENDPOINTS.details(itemRef.type, itemRef.id)).catch(err => {
                        console.error(`Failed to fetch details for ${itemRef.type} ID ${itemRef.id}:`, err);
                        return null; // Return null kung naay error para dili madaot tanan
                    })
                );
                const itemsDetails = await Promise.all(itemDetailsPromises);
                // I-filter nato ang null (failed requests) ug siguraduon nga naay poster
                const validItems = itemsDetails.filter(details => details && details.poster_path); 
                return {
                    title: collection.title,
                    items: validItems
                };
            });

            const resolvedCollections = await Promise.all(allCollectionsPromises);
            setCollectionsData(resolvedCollections.filter(c => c.items.length > 0)); // Ipakita lang ang collection kung naay valid items
            setIsLoadingCollections(false);
        };

        fetchCollectionDetails();
    }, []); // Modagan ra ni kausa inig load sa page

    const handleGenreSelect = (genreId) => {
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

    return (
        <>
            <Banner onOpenModal={onOpenModal} />
            <div className="bg-[#0b0b0b] text-white min-h-screen">
              <div className="px-4 sm:px-8 md:px-16 pb-20">
                <GenreFilter
                    genres={MOVIE_GENRES}
                    selectedGenre={selectedGenre}
                    onGenreSelect={handleGenreSelect}
                />
                
                {selectedGenre && (
                    <Row
                        key={`genre-${selectedGenre}`}
                        title={MOVIE_GENRES.find(g => g.id === selectedGenre)?.name || 'Genre Results'}
                        items={genreMovies}
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                        isLoading={isLoadingGenre}
                    />
                )}

                {/* --- IBUTANG ANG CURATED COLLECTIONS ROWS DIRI --- */}
                {!isLoadingCollections && collectionsData.map((collection, index) => (
                    <Row
                        key={`collection-${index}-${collection.title}`} // Unique key
                        title={collection.title}
                        items={collection.items}
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                        // Pwede nimo i-set isLarge=true kung gusto nimo padak-on ang posters
                    />
                ))}
                {/* Kung nag-load pa ang collections, pwede magpakita og skeleton */}
                {isLoadingCollections && CURATED_COLLECTIONS.map((collection, index) => (
                    <Row
                         key={`collection-loading-${index}`}
                         title={collection.title}
                         items={[]} // Empty items
                         onOpenModal={onOpenModal}
                         isWatched={isWatched}
                         isLoading={true} // Set loading to true
                    />
                ))}
                {/* --- END SA COLLECTIONS ROWS --- */}

                {(recommendations.length > 0 || isLoadingRecs) && recommendationSourceItem && (
                    <Row 
                        title={getRecommendationTitle()} 
                        items={recommendations} 
                        onOpenModal={onOpenModal} 
                        isWatched={isWatched}
                        isLoading={isLoadingRecs}
                    />
                )}
                
                <Row title="Trending Now" items={trending} onOpenModal={onOpenModal} isWatched={isWatched} />
                
                {/* Smartlink Ad (Zone: 27694335) */}
                <AdsterraSmartlink />
                
                <Row title="Popular Movies" items={popular} onOpenModal={onOpenModal} isWatched={isWatched} />
                
                {(continueWatchingList.length > 0 || continueWatchingLoading) && (
                    <Row title="Continue Watching" items={continueWatchingList} onOpenModal={onOpenModal} isWatched={isWatched} isLoading={continueWatchingLoading} />
                )}

                <Row title="Top Rated Movies" items={topRated} onOpenModal={onOpenModal} isWatched={isWatched} />
                
                {/* Smartlink Ad (Zone: 27694335) */}
                <AdsterraSmartlink />
                
                <Row title="Popular TV Shows" items={tvShows} onOpenModal={onOpenModal} isWatched={isWatched} />

                {(myList.length > 0 || myListLoading) && (
                     <Row title="My List" items={myList} onOpenModal={onOpenModal} isWatched={isWatched} isLoading={myListLoading} />
                )}

                <Row title="Anime" items={anime} onOpenModal={onOpenModal} isWatched={isWatched} isLarge />
                <Row title="Asian Dramas" items={asianDramas} onOpenModal={onOpenModal} isWatched={isWatched} />
                
                {/* Native Banner at bottom */}
                <AdsterraBanner />
              </div>
            </div>
        </>
    );
};