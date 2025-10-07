import React, { useState, useEffect, useRef } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, EMBED_URLS, SOURCE_ORDER } from '../config';
import { Poster } from './Poster';

export const Modal = ({ item: initialItem, onClose, isItemInMyList, onToggleMyList, playOnOpen, onEpisodePlay, addToWatched, isWatched, onOpenModal }) => {
    const [item, setItem] = useState(initialItem);
    const [details, setDetails] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [selectedEpisode, setSelectedEpisode] = useState(1);
    const [currentSource, setCurrentSource] = useState(SOURCE_ORDER[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPlayer, setShowPlayer] = useState(playOnOpen);
    const modalRef = useRef();

    useEffect(() => {
        setItem(initialItem);
        setShowPlayer(playOnOpen);
    }, [initialItem, playOnOpen]);

    const media_type = item?.media_type || (item?.title ? 'movie' : 'tv');
    const isTV = media_type === 'tv';

    let embedUrl = null;
    if (details) {
        const imdb_id = details.external_ids?.imdb_id;
        if (currentSource === 'videasy') {
            embedUrl = isTV
                ? EMBED_URLS.videasy.tv(imdb_id, selectedSeason, selectedEpisode)
                : EMBED_URLS.videasy.movie(imdb_id);
        } else {
            embedUrl = isTV
                ? EMBED_URLS[currentSource]?.tv(details.id, selectedSeason, selectedEpisode)
                : EMBED_URLS[currentSource]?.movie(details.id);
        }
    }

    useEffect(() => {
        const fetchAllDetails = async () => {
            if (!item || !item.id || !media_type) {
                onClose();
                return;
            }
            setIsLoading(true);
            setDetails(null);
            
            const [detailsData, recommendationsData] = await Promise.all([
                fetchData(API_ENDPOINTS.details(media_type, item.id)),
                fetchData(API_ENDPOINTS.recommendations(media_type, item.id))
            ]);
            
            if (detailsData && detailsData.id) {
                setDetails(detailsData);
                setRecommendations(recommendationsData.results || []);
                setIsLoading(false);
            } else {
                onClose();
            }
        };
        fetchAllDetails();
    }, [item, media_type, onClose]);

    useEffect(() => {
        const handleKeydown = (e) => { if (e.key === 'Escape') onClose(); };
        const handleClickOutside = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) { onClose(); } };
        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handlePlay = () => {
        setShowPlayer(true);
        if (isTV) {
            onEpisodePlay(item, selectedSeason, selectedEpisode); 
            addToWatched(item.id);
        } else {
            addToWatched(item.id);
        }
    };
    
    const handleRecommendationClick = (selectedItem) => {
        onClose();
        setTimeout(() => onOpenModal(selectedItem), 300);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
            <div ref={modalRef} className="modal-content-wrapper">
                <div className="modal-body w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--bg-secondary)] rounded-lg shadow-2xl relative">
                    <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center z-20 hover:bg-red-600 transition-colors">
                        &times;
                    </button>
                    {isLoading || !details ? (
                         <div className="w-full aspect-video skeleton"></div>
                    ) : (
                        <>
                            {showPlayer ? (
                                <div className="player-wrapper relative aspect-video bg-black">
                                     {embedUrl ? (
                                        <iframe
                                            key={`${currentSource}-${details.id}-${selectedSeason}-${selectedEpisode}`}
                                            src={embedUrl}
                                            className="absolute top-0 left-0 w-full h-full"
                                            allowFullScreen
                                            title="Video Player"
                                            // --- FIX: Gitangtang na ang sandbox attribute ---
                                        ></iframe>
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-black text-white">
                                            Video source not available. Please try another source.
                                        </div>
                                     )}
                                </div>
                            ) : (
                                <div className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${details.backdrop_path})` }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-black/50"></div>
                                    <div className="absolute bottom-10 left-10 z-10">
                                        <h1 className="text-4xl font-bold mb-4">{details.title || details.name}</h1>
                                        <div className="flex items-center gap-4">
                                            <button onClick={handlePlay} className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-300 flex items-center gap-2 text-lg"><i className="fas fa-play"></i> Play</button>
                                            <button onClick={() => onToggleMyList(item)} className={`w-12 h-12 rounded-full border-2 ${isItemInMyList(item.id) ? 'border-red-500' : 'border-gray-400'} flex items-center justify-center text-xl hover:border-white transition-all`}>
                                                <i className={`fas ${isItemInMyList(item.id) ? 'fa-check' : 'fa-plus'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="p-8">
                                <p className="text-gray-300 mb-6">{details.overview}</p>
                                {isTV && details.seasons && (
                                     <div className="episodes-section mb-6">
                                        <div className="flex gap-4 mb-4 items-center">
                                            <h2 className="text-2xl font-bold">Episodes</h2>
                                            <select value={selectedSeason} onChange={(e) => setSelectedSeason(Number(e.target.value))} className="bg-[var(--bg-tertiary)] p-2 rounded">
                                                {details.seasons.filter(s => s.season_number > 0).map(s => <option key={s.id} value={s.season_number}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto episodes">
                                            {Array.from({ length: details.seasons.find(s => s.season_number === selectedSeason)?.episode_count || 0 }, (_, i) => i + 1).map(ep => (
                                                <button key={ep} onClick={() => setSelectedEpisode(ep)} className={`px-4 py-2 rounded ${selectedEpisode === ep ? 'active' : ''}`}>
                                                    Ep {ep}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="source-buttons flex flex-wrap gap-2 mb-6">
                                    {SOURCE_ORDER.map(source => (
                                        <button key={source} onClick={() => setCurrentSource(source)} className={`source-btn px-4 py-2 rounded ${currentSource === source ? 'active' : ''}`}>
                                            {source.charAt(0).toUpperCase() + source.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                {recommendations.length > 0 && (
                                    <div className="recommendations-section">
                                        <h3 className="text-2xl font-bold mb-4">More Like This</h3>
                                        <div className="recommendations-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                            {recommendations.map(recItem => (
                                                <Poster 
                                                    key={recItem.id} 
                                                    item={recItem}
                                                    isLarge={false}
                                                    isWatched={isWatched}
                                                    onOpenModal={handleRecommendationClick}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                             </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};