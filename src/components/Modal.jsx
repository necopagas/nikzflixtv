// src/components/Modal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, EMBED_URLS, SOURCE_ORDER, IMG_PATH, BACKDROP_PATH } from '../config';
import { Poster } from './Poster';

export const Modal = ({ 
  item: initialItem, 
  onClose, 
  isItemInMyList, 
  onToggleMyList, 
  playOnOpen, 
  onEpisodePlay, 
  addToWatched, 
  isWatched, 
  onOpenModal, 
  continueWatchingList 
}) => {
  const [item, setItem] = useState(initialItem);
  const [details, setDetails] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0); // Use index for auto-switch
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerError, setPlayerError] = useState(false); // Detect if iframe fails

  const modalRef = useRef(null);
  const iframeRef = useRef(null);

  const currentSource = SOURCE_ORDER[currentSourceIndex];
  const media_type = initialItem?.media_type || (initialItem?.title ? 'movie' : 'tv');
  const isTV = media_type === 'tv';

  // === AUTO SWITCH SOURCE IF ERROR ===
  const handlePlayerError = useCallback(() => {
    if (currentSourceIndex < SOURCE_ORDER.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
      setPlayerError(false);
    } else {
      setPlayerError(true); // All sources failed
    }
  }, [currentSourceIndex]);

  // Reset error when source changes
  useEffect(() => {
    setPlayerError(false);
  }, [currentSourceIndex]);

  // === PLAY HANDLER ===
  const handlePlay = () => {
    setShowPlayer(true);
    setCurrentSourceIndex(0); // Reset to first source
    if (isTV) {
      onEpisodePlay(item, selectedSeason, selectedEpisode);
    } else {
      onEpisodePlay(item, 1, 1);
    }
    addToWatched(item.id);
  };

  // === KEYBOARD NAVIGATION ===
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // === FETCH DATA ON MOUNT ===
  useEffect(() => {
    setIsLoading(true);
    setItem(initialItem);
    setTrailer(null);
    setCurrentSourceIndex(0);
    setPlayerError(false);

    setTimeout(() => modalRef.current?.focus(), 100);

    const fetchDetails = async () => {
      try {
        const [detailsData, recsData] = await Promise.all([
          fetchData(API_ENDPOINTS.details(media_type, initialItem.id)),
          fetchData(API_ENDPOINTS.recommendations(media_type, initialItem.id))
        ]);

        setDetails(detailsData);
        const officialTrailer = detailsData.videos?.results.find(
          v => v.type === 'Trailer' && v.site === 'YouTube'
        );
        setTrailer(officialTrailer);
        setRecommendations(recsData.results || []);

        if (isTV) {
          const saved = continueWatchingList.find(i => i.id === initialItem.id);
          if (saved?.season && saved?.episode) {
            setSelectedSeason(saved.season);
            setSelectedEpisode(saved.episode);
          } else {
            setSelectedSeason(1);
            setSelectedEpisode(1);
          }
        }

        if (playOnOpen) handlePlay();
        else setShowPlayer(false);
      } catch (error) {
        console.error("Failed to fetch modal data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [initialItem, playOnOpen, media_type, continueWatchingList, onEpisodePlay, addToWatched]);

  // === SEASON & EPISODE HANDLERS ===
  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setSelectedEpisode(1);
    setShowPlayer(false);
  };

  const handleEpisodeChange = (episode) => {
    setSelectedEpisode(episode);
    onEpisodePlay(item, selectedSeason, episode);
    setShowPlayer(true);
    setCurrentSourceIndex(0); // Reset source
  };

  // === GET PLAYER URL ===
  const getPlayerUrl = () => {
    if (!details || !currentSource) return null;
    const src = EMBED_URLS[currentSource];
    if (!src) return null;

    const imdb_id = details.external_ids?.imdb_id;

    if (!isTV && src.movie) {
      return imdb_id && currentSource === 'videasy' ? src.movie(imdb_id) : src.movie(item.id);
    }
    if (isTV && src.tv) {
      return imdb_id && currentSource === 'videasy' 
        ? src.tv(imdb_id, selectedSeason, selectedEpisode)
        : src.tv(item.id, selectedSeason, selectedEpisode);
    }
    return null;
  };

  // === RENDER SOURCE BUTTONS ===
  const renderSources = () => (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="font-semibold text-[var(--text-secondary)] text-sm">Source:</span>
      {SOURCE_ORDER.map((source, idx) => (
        <button
          key={source}
          onClick={() => setCurrentSourceIndex(idx)}
          tabIndex="0"
          onKeyDown={(e) => handleKeyDown(e, () => setCurrentSourceIndex(idx))}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            currentSourceIndex === idx
              ? 'bg-[var(--brand-color)] text-white shadow-md'
              : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)]'
          }`}
        >
          {source.charAt(0).toUpperCase() + source.slice(1).replace('_', '.')}
        </button>
      ))}
      {currentSourceIndex < SOURCE_ORDER.length - 1 && (
        <button
          onClick={() => setCurrentSourceIndex(prev => prev + 1)}
          className="ml-2 text-xs text-[var(--text-secondary)] hover:text-[var(--brand-color)]"
        >
          Next Server →
        </button>
      )}
    </div>
  );

  // === LOADING STATE ===
  if (isLoading || !details) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--brand-color)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        tabIndex="-1"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl max-w-5xl w-full max-h-screen overflow-y-auto focus:outline-none"
      >
        <div className="p-6 md:p-8 relative">
          {/* Close Button */}
          <button 
            onClick={onClose}
            tabIndex="0"
            onKeyDown={(e) => handleKeyDown(e, onClose)}
            className="absolute top-4 right-4 text-3xl text-[var(--text-secondary)] hover:text-white transition z-10"
            aria-label="Close"
          >
            ×
          </button>

          {/* Player or Backdrop */}
          {showPlayer ? (
            <div className="relative bg-black rounded-lg overflow-hidden">
              {renderSources()}
              {playerError ? (
                <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                  <p className="text-lg mb-4">All sources failed to load.</p>
                  <button 
                    onClick={() => setCurrentSourceIndex(0)}
                    className="px-4 py-2 bg-[var(--brand-color)] rounded"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={getPlayerUrl()}
                  width="100%"
                  height="500"
                  allowFullScreen
                  title="Video Player"
                  className="w-full"
                  onError={handlePlayerError}
                  onLoad={() => setPlayerError(false)}
                />
              )}
            </div>
          ) : (
            <div 
              className="h-64 md:h-96 bg-cover bg-center rounded-lg relative"
              style={{ backgroundImage: `url(${BACKDROP_PATH}${details.backdrop_path})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent"></div>
            </div>
          )}

          {/* Content */}
          <div className="mt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                {!showPlayer && (
                  <>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{details.title || details.name}</h1>
                    <div className="flex items-center gap-4 my-2 text-sm text-[var(--text-secondary)]">
                      <span>{(details.release_date || details.first_air_date)?.split('-')[0]}</span>
                      {isTV ? (
                        <span>{details.number_of_seasons} Season{ деталей.number_of_seasons > 1 ? 's' : ''}</span>
                      ) : (
                        <span>{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>
                      )}
                    </div>
                    <p className="text-[var(--text-primary)] mt-3 line-clamp-4">{details.overview}</p>
                  </>
                )}

                <div className="flex gap-3 mt-4">
                  {!showPlayer && (
                    <button 
                      onClick={handlePlay}
                      tabIndex="0"
                      onKeyDown={(e) => handleKeyDown(e, handlePlay)}
                      className="px-6 py-2 bg-[var(--brand-color)] hover:bg-red-700 rounded font-bold transition"
                    >
                      Play
                    </button>
                  )}
                  <button 
                    onClick={() => onToggleMyList(item)}
                    tabIndex="0"
                    onKeyDown={(e) => handleKeyDown(e, () => onToggleMyList(item))}
                    className="px-6 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] rounded font-medium transition"
                  >
                    {isItemInMyList(item.id) ? 'Remove' : 'Add to List'}
                  </button>
                </div>
              </div>
            </div>

            {/* Seasons & Episodes */}
            {isTV && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-3">Episodes</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {details.seasons?.map(season => (
                    <button
                      key={season.season_number}
                      onClick={() => handleSeasonChange(season.season_number)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        selectedSeason === season.season_number
                          ? 'bg-[var(--brand-color)] text-white'
                          : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)]'
                      }`}
                    >
                      {season.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {Array.from(
                    { length: details.seasons?.find(s => s.season_number === selectedSeason)?.episode_count || 0 },
                    (_, i) => i + 1
                  ).map(ep => (
                    <button
                      key={ep}
                      onClick={() => handleEpisodeChange(ep)}
                      className={`aspect-square rounded text-sm font-medium transition ${
                        selectedEpisode === ep
                          ? 'bg-[var(--brand-color)] text-white'
                          : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)]'
                      }`}
                    >
                      {ep}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trailer */}
            {trailer && !showPlayer && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-3">Trailer</h3>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer.key}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-3">More Like This</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recommendations.slice(0, 10).map(rec => (
                    rec.poster_path && (
                      <Poster
                        key={rec.id}
                        item={rec}
                        onOpenModal={(item) => {
                          onClose();
                          setTimeout(() => onOpenModal(item), 300);
                        }}
                        isWatched={isWatched(rec.id)}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
