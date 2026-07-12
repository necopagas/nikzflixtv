// src/components/Modal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPlus, FaCheck, FaShare } from 'react-icons/fa';
import { Share } from '@capacitor/share';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, EMBED_URLS, PLAYER_SOURCE_ORDER, BACKDROP_PATH } from '../config';
import { Poster } from './Poster';
import { AddToPlaylistButton } from './AddToPlaylistButton';
import DownloadButton from './DownloadButton';

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
  continueWatchingList = [],
}) => {
  const [item, setItem] = useState(initialItem);
  const [details, setDetails] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [currentSource, setCurrentSource] = useState('111movies');
  const [isModalLoading, setIsModalLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [sourceHealth, setSourceHealth] = useState('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const modalRef = useRef(null);
  const sourceTimeoutRef = useRef(null);
  const playerWrapperRef = useRef(null);

  useEffect(() => {
    setIsModalLoading(true);
    setIsLoading(true);
    setItem(initialItem);
    setTrailer(null);
    setCurrentSource('111movies');

    const mediaType = initialItem?.media_type || (initialItem?.title ? 'movie' : 'tv');

    Promise.all([
      fetchData(API_ENDPOINTS.details(mediaType, initialItem.id)),
      fetchData(API_ENDPOINTS.recommendations(mediaType, initialItem.id)),
    ])
      .then(([detailsData, recsData]) => {
        setDetails(detailsData);
        const officialTrailer = detailsData?.videos?.results?.find(
          v => v.type === 'Trailer' && v.site === 'YouTube'
        );
        setTrailer(officialTrailer || null);
        setRecommendations(recsData?.results || []);

        if (mediaType === 'tv') {
          const savedProgress = continueWatchingList.find(
            i => i.id?.toString() === initialItem.id?.toString()
          );
          if (savedProgress?.season && savedProgress?.episode) {
            setSelectedSeason(savedProgress.season);
            setSelectedEpisode(savedProgress.episode);
          } else {
            setSelectedSeason(1);
            setSelectedEpisode(1);
          }
        }

        if (playOnOpen) {
          setShowPlayer(true);
          setIsPlaying(true);
        } else {
          setShowPlayer(false);
          setIsPlaying(false);
        }
      })
      .catch(err => console.error('Failed to fetch modal data:', err))
      .finally(() => setIsModalLoading(false));

    setTimeout(() => modalRef.current?.focus(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItem, playOnOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (sourceTimeoutRef.current) {
        clearTimeout(sourceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showPlayer) return undefined;

    const handleGlobalKeyDown = event => {
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        setIsPlaying(prev => !prev);
        return;
      }

      if (event.key?.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showPlayer, isFullscreen]);

  const media_type = initialItem?.media_type || (initialItem?.title ? 'movie' : 'tv');
  const isTV = media_type === 'tv';
  const availableSources =
    PLAYER_SOURCE_ORDER?.filter(source => {
      const sourceConfig = EMBED_URLS?.[source];
      return isTV
        ? typeof sourceConfig?.tv === 'function'
        : typeof sourceConfig?.movie === 'function';
    }) || [];

  const handlePlay = () => {
    setShowPlayer(true);
    setIsLoading(true);
    setIsPlaying(true);
    if (isTV) onEpisodePlay?.(item, selectedSeason, selectedEpisode);
    else onEpisodePlay?.(item, 1, 1);
    addToWatched?.(item?.id);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const handleShare = async () => {
    try {
      if (!details) return;
      await Share.share({
        title: details.title || details.name,
        text: `Check out ${details.title || details.name} on NikzFlix!`,
        url: window.location.href,
        dialogTitle: 'Share with friends',
      });
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  const toggleFullscreen = () => {
    const element = playerWrapperRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }

    element.requestFullscreen?.();
  };

  const handleSeasonChange = seasonNumber => {
    setSelectedSeason(seasonNumber);
    setSelectedEpisode(1);
  };

  const handleEpisodeChange = episodeNumber => {
    setSelectedEpisode(episodeNumber);
    onEpisodePlay?.(item, selectedSeason, episodeNumber);
    setShowPlayer(true);
    setIsLoading(true);
    setCurrentSource('111movies');
  };

  const handleSourceChange = source => {
    setCurrentSource(source);
    setIsLoading(true);
  };
  const handleTryNextSource = () => {
    if (!availableSources.length) return;
    const currentIndex = availableSources.indexOf(currentSource);
    const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
    setCurrentSource(availableSources[nextIndex] || availableSources[0]);
  };
  const handleRecommendationClick = recItem => {
    onClose?.();
    setTimeout(() => onOpenModal?.(recItem), 300);
  };

  const getPlayerUrl = () => {
    if (!currentSource) return null;
    const sourceConfig = EMBED_URLS?.[currentSource];
    if (!sourceConfig) return null;
    if (!isTV && typeof sourceConfig.movie === 'function') return sourceConfig.movie(item.id);
    if (isTV && typeof sourceConfig.tv === 'function')
      return sourceConfig.tv(item.id, selectedSeason, selectedEpisode);
    return null;
  };

  const playerUrl = getPlayerUrl();

  useEffect(() => {
    if (sourceTimeoutRef.current) {
      clearTimeout(sourceTimeoutRef.current);
    }

    if (!showPlayer || !playerUrl) {
      setSourceHealth('idle');
      return;
    }

    setSourceHealth('loading');
    sourceTimeoutRef.current = setTimeout(() => {
      setSourceHealth(prev => (prev === 'loading' ? 'stalled' : prev));
    }, 8000);

    return () => {
      if (sourceTimeoutRef.current) {
        clearTimeout(sourceTimeoutRef.current);
      }
    };
  }, [showPlayer, playerUrl, currentSource]);

  const renderSources = () => {
    if (isFullscreen) return null;

    return (
      <div className="mb-4 px-8 pt-4 sm:px-0 sm:pt-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-semibold text-(--text-secondary)">Source:</span>
          {availableSources.map(source => (
            <button
              key={source}
              onClick={() => handleSourceChange(source)}
              tabIndex={0}
              onKeyDown={e => handleKeyDown(e, () => handleSourceChange(source))}
              className={`source-btn px-3 py-1 rounded-full text-sm transition-colors ${currentSource === source ? 'active bg-(--brand-color) text-white font-bold' : 'bg-(--bg-tertiary) hover:bg-(--bg-tertiary-hover)'}`}
            >
              {source.replace('_', '.')}
            </button>
          ))}
        </div>
        <p className="text-xs text-(--text-secondary) opacity-75 italic">
          💡 Tip: Try a different source if the video doesn't load.
        </p>
      </div>
    );
  };

  if (isModalLoading || !details) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-100 flex items-center justify-center">
        <div className="player-loading" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-130 flex items-center justify-center p-3 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={e => e.key === 'Escape' && onClose?.()}
        className="modal-content-wrapper focus:outline-none"
      >
        <button
          onClick={onClose}
          tabIndex={0}
          onKeyDown={e => handleKeyDown(e, onClose)}
          className="absolute top-2 right-2 md:-top-4 md:-right-4 text-3xl text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-(--brand-color) transition-all z-50 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close modal"
        >
          &times;
        </button>

        <div className="modal-body p-0 sm:p-8 relative overflow-y-auto overscroll-contain">
          {showPlayer ? (
            <div
              ref={playerWrapperRef}
              data-playing={isPlaying}
              className="aspect-video bg-black rounded-lg relative overflow-hidden"
            >
              {renderSources()}
              {(sourceHealth === 'stalled' || sourceHealth === 'error') && (
                <div className="mx-8 mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100 sm:mx-0">
                  <p className="mb-2">
                    This source may be blocked, slow, or unavailable right now.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTryNextSource}
                      className="rounded bg-(--brand-color) px-3 py-2 font-semibold text-white transition-colors hover:bg-red-700"
                    >
                      Try next source
                    </button>
                    {playerUrl && (
                      <a
                        href={playerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-(--bg-tertiary) px-3 py-2 font-semibold transition-colors hover:bg-(--bg-tertiary-hover)"
                      >
                        Open source in new tab
                      </a>
                    )}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="absolute right-4 top-4 z-20 rounded-full bg-black/60 px-3 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
                aria-label="Toggle fullscreen"
              >
                {document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/20 border-t-(--brand-color) animate-spin" />
                </div>
              )}
              {playerUrl ? (
                <iframe
                  data-playing={isPlaying}
                  src={playerUrl}
                  width="100%"
                  height="100%"
                  onLoad={() => {
                    if (sourceTimeoutRef.current) {
                      clearTimeout(sourceTimeoutRef.current);
                    }
                    setSourceHealth('loaded');
                    setIsLoading(false);
                  }}
                  onError={() => {
                    if (sourceTimeoutRef.current) {
                      clearTimeout(sourceTimeoutRef.current);
                    }
                    setSourceHealth('error');
                    setIsLoading(false);
                  }}
                  allowFullScreen
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Video Player"
                  className="relative z-0 h-full w-full rounded-b-lg border-0"
                />
              ) : (
                <div className="w-full h-[calc(100%-50px)] flex items-center justify-center text-center text-(--text-secondary) rounded-b-lg">
                  <p>Sorry, the source '{currentSource}' is not available for this title.</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="h-64 sm:h-96 bg-cover bg-center rounded-lg relative"
              style={{ backgroundImage: `url(${BACKDROP_PATH}${details.backdrop_path})` }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-(--bg-secondary) via-transparent to-transparent" />
              <button
                onClick={handlePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm text-white flex items-center justify-center text-4xl transition-all duration-300 hover:bg-white/50 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/50"
                aria-label="Play trailer or video"
              >
                <FaPlay />
              </button>
            </div>
          )}

          <div className="mt-6 px-4 pb-4 sm:px-0 sm:pb-0">
            {!showPlayer && (
              <>
                <h1 className="text-3xl font-bold">{details.title || details.name}</h1>
                <div className="flex items-center space-x-4 my-2 text-sm text-(--text-secondary)">
                  <span>{details.release_date || details.first_air_date?.split('-')[0]}</span>
                  <span>
                    {isTV
                      ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`
                      : details.runtime
                        ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
                        : ''}
                  </span>
                </div>
                <p className="text-(--text-primary) mb-4 text-sm sm:text-base">
                  {details.overview}
                </p>

                <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                  {!showPlayer && (
                    <button
                      onClick={handlePlay}
                      tabIndex={0}
                      onKeyDown={e => handleKeyDown(e, handlePlay)}
                      className="px-6 py-2 bg-(--brand-color) hover:bg-red-700 rounded font-semibold transition-colors flex items-center gap-2"
                    >
                      <FaPlay className="text-xs" /> Play
                    </button>
                  )}

                  <button
                    onClick={() => onToggleMyList?.(item)}
                    tabIndex={0}
                    onKeyDown={e => handleKeyDown(e, () => onToggleMyList?.(item))}
                    className="px-6 py-2 bg-(--bg-tertiary) hover:bg-(--bg-tertiary-hover) rounded font-semibold transition-colors flex items-center gap-2"
                  >
                    {isItemInMyList?.(item?.id) ? (
                      <FaCheck className="text-xs" />
                    ) : (
                      <FaPlus className="text-xs" />
                    )}{' '}
                    My List
                  </button>

                  <AddToPlaylistButton item={item} />
                  <DownloadButton item={item} quality="720p" size="medium" showLabel={true} />

                  <button
                    onClick={handleShare}
                    tabIndex={0}
                    onKeyDown={e => handleKeyDown(e, handleShare)}
                    className="px-6 py-2 bg-(--bg-tertiary) hover:bg-(--bg-tertiary-hover) rounded font-semibold transition-colors flex items-center gap-2"
                    title="Share"
                  >
                    <FaShare className="text-xs" /> Share
                  </button>
                </div>

                {isTV && (
                  <div className="mt-6">
                    <h3 className="section-title">Seasons & Episodes</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {details.seasons
                        ?.filter(s => s.season_number > 0)
                        .map(season => (
                          <button
                            key={season.id}
                            onClick={() => handleSeasonChange(season.season_number)}
                            tabIndex={0}
                            onKeyDown={e =>
                              handleKeyDown(e, () => handleSeasonChange(season.season_number))
                            }
                            className={`px-3 py-1 rounded-full transition-colors font-medium text-sm ${selectedSeason === season.season_number ? 'bg-(--brand-color) text-white' : 'bg-(--bg-tertiary) hover:bg-(--bg-tertiary-hover)'}`}
                          >
                            {season.name}
                          </button>
                        ))}
                    </div>

                    <div className="episodes grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {Array.from(
                        {
                          length:
                            details.seasons?.find(s => s.season_number === selectedSeason)
                              ?.episode_count || 0,
                        },
                        (_, i) => i + 1
                      ).map(ep => (
                        <button
                          key={ep}
                          onClick={() => handleEpisodeChange(ep)}
                          tabIndex={0}
                          onKeyDown={e => handleKeyDown(e, () => handleEpisodeChange(ep))}
                          className={`aspect-square rounded text-xs sm:text-sm ${selectedEpisode === ep && showPlayer ? 'active' : ''}`}
                          title={`Episode ${ep}`}
                        >
                          {ep}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {trailer && !showPlayer && (
            <div className="mt-8 px-4 pb-4 sm:px-0 sm:pb-0">
              <h3 className="section-title">Trailer</h3>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  width="100%"
                  height="100%"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="recommendations-section px-4 pb-4 sm:px-0 sm:pb-0">
              <h3 className="section-title">More Like This</h3>
              <div className="recommendations-grid">
                {recommendations
                  .slice(0, 10)
                  .map(
                    rec =>
                      rec.poster_path && (
                        <Poster
                          key={rec.id}
                          item={rec}
                          onOpenModal={handleRecommendationClick}
                          isWatched={isWatched?.(rec.id)}
                        />
                      )
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
