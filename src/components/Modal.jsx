import React, { useState, useEffect, useRef } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, EMBED_URLS, SOURCE_ORDER, IMG_PATH, BACKDROP_PATH } from '../config';
import { Poster } from './Poster';

export const Modal = ({ item: initialItem, onClose, isItemInMyList, onToggleMyList, playOnOpen, onEpisodePlay, addToWatched, isWatched, onOpenModal, continueWatchingList }) => {
    const [item, setItem] = useState(initialItem);
    const [details, setDetails] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [trailer, setTrailer] = useState(null);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [selectedEpisode, setSelectedEpisode] = useState(1);
    const [currentSource, setCurrentSource] = useState(SOURCE_ORDER[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPlayer, setShowPlayer] = useState(false);
    const modalRef = useRef();
    
    const media_type = initialItem?.media_type || (initialItem?.title ? 'movie' : 'tv');
    const isTV = media_type === 'tv';

    const handlePlay = () => {
        setShowPlayer(true);
        if (isTV) {
            onEpisodePlay(item, selectedSeason, selectedEpisode); 
        }
        addToWatched(item.id);
    };
    
    useEffect(() => {
        setIsLoading(true);
        setItem(initialItem);
        setTrailer(null);

        const mediaType = initialItem?.media_type || (initialItem?.title ? 'movie' : 'tv');

        Promise.all([
            fetchData(API_ENDPOINTS.details(mediaType, initialItem.id)),
            fetchData(API_ENDPOINTS.recommendations(mediaType, initialItem.id))
        ]).then(([detailsData, recsData]) => {
            setDetails(detailsData);
            const officialTrailer = detailsData.videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            setTrailer(officialTrailer);
            setRecommendations(recsData.results || []);

            if (mediaType === 'tv') {
                const savedProgress = continueWatchingList.find(i => i.id.toString() === initialItem.id.toString());
                if (savedProgress?.season && savedProgress?.episode) {
                    setSelectedSeason(savedProgress.season);
                    setSelectedEpisode(savedProgress.episode);
                } else {
                    setSelectedSeason(1);
                    setSelectedEpisode(1);
                }
            }
            
            if (playOnOpen) {
                handlePlay();
            } else {
                setShowPlayer(false);
            }

        }).catch(error => {
            console.error("Failed to fetch modal data:", error);
        }).finally(() => {
            setIsLoading(false);
        });

    }, [initialItem]);
    
    const handleSeasonChange = (seasonNumber) => {
        setSelectedSeason(seasonNumber);
        setSelectedEpisode(1);
    };

    const handleEpisodeChange = (episodeNumber) => {
        setSelectedEpisode(episodeNumber);
        onEpisodePlay(item, selectedSeason, episodeNumber);
        setShowPlayer(true);
    };
    
    const handleSourceChange = (source) => {
        setCurrentSource(source);
    };

    const handleRecommendationClick = (recItem) => {
        onClose();
        setTimeout(() => onOpenModal(recItem), 300);
    };

    const getPlayerUrl = () => {
        const imdb_id = details?.external_ids?.imdb_id;

        if (currentSource === 'videasy') {
            if (!isTV) return EMBED_URLS.videasy.movie(imdb_id);
            return EMBED_URLS.videasy.tv(imdb_id, selectedSeason, selectedEpisode);
        }

        if (!isTV) return EMBED_URLS[currentSource]?.movie(item.id);
        return EMBED_URLS[currentSource]?.tv(item.id, selectedSeason, selectedEpisode);
    };

    const renderSources = () => (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="font-semibold text-[var(--text-secondary)]">Source:</span>
            {SOURCE_ORDER.map(source => (
                <button
                    key={source}
                    onClick={() => handleSourceChange(source)}
                    className={`source-btn px-3 py-1 rounded-full text-sm transition-colors ${currentSource === source ? 'active' : ''}`}
                >
                    {source.replace('_', '.')}
                </button>
            ))}
        </div>
    );

    if (isLoading || !details) {
        return <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center"><div className="player-loading"></div></div>;
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={modalRef} className="modal-content-wrapper">
                <div className="modal-body p-8 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-white">&times;</button>
                    
                    {showPlayer ? (
                        <div className="aspect-video bg-black rounded-lg">
                            {renderSources()}
                            <iframe src={getPlayerUrl()} width="100%" height="100%" allowFullScreen="allowfullscreen" title="Video Player" className="rounded-b-lg"></iframe>
                        </div>
                    ) : (
                        <div className="h-64 sm:h-96 bg-cover bg-center rounded-lg relative" style={{backgroundImage: `url(${BACKDROP_PATH}${details.backdrop_path})`}}>
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent"></div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-8 mt-6">
                        <div className="flex-1">
                            {!showPlayer && (
                                <>
                                    <h1 className="text-3xl font-bold">{details.title || details.name}</h1>
                                    <div className="flex items-center space-x-4 my-2 text-sm text-[var(--text-secondary)]">
                                        <span>{details.release_date || details.first_air_date?.split('-')[0]}</span>
                                        <span>{isTV ? `${details.number_of_seasons} Seasons` : `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`}</span>
                                    </div>
                                    <p className="text-[var(--text-primary)] mb-4">{details.overview}</p>
                                </>
                            )}
                            <div className="flex space-x-2">
                                {!showPlayer && <button onClick={handlePlay} className="px-6 py-2 bg-red-600 rounded">Play</button>}
                                <button onClick={() => onToggleMyList(item)} className="px-6 py-2 bg-gray-700 rounded">
                                    {isItemInMyList(item.id) ? 'Remove from List' : 'Add to My List'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {isTV && (
                        <div className="episodes-section">
                            <h3 className="section-title">Seasons & Episodes</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {details.seasons?.map(season => (
                                    <button key={season.id} onClick={() => handleSeasonChange(season.season_number)} className={`px-3 py-1 rounded-full ${selectedSeason === season.season_number ? 'bg-red-600' : 'bg-[var(--bg-tertiary)]'}`}>
                                        {season.name}
                                    </button>
                                ))}
                            </div>
                            <div className="episodes grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                                {Array.from({ length: details.seasons?.find(s => s.season_number === selectedSeason)?.episode_count || 0 }, (_, i) => i + 1).map(ep => (
                                    <button key={ep} onClick={() => handleEpisodeChange(ep)} className={`aspect-square rounded ${selectedEpisode === ep ? 'active' : ''}`}>
                                        {ep}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {trailer && !showPlayer && (
                        <div className="mt-8">
                            <h3 className="section-title">Trailer</h3>
                            <div className="aspect-video rounded-lg overflow-hidden">
                                <iframe 
                                    src={`https://www.youtube.com/embed/${trailer.key}`}
                                    width="100%" 
                                    height="100%" 
                                    title="YouTube video player" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen>
                                </iframe>
                            </div>
                        </div>
                    )}

                    {recommendations.length > 0 && (
                        <div className="recommendations-section">
                            <h3 className="section-title">More Like This</h3>
                            <div className="recommendations-grid">
                                {recommendations.slice(0, 10).map(rec => (
                                    rec.poster_path && <Poster key={rec.id} item={rec} onOpenModal={handleRecommendationClick} isWatched={isWatched(rec.id)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};