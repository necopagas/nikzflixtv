// src/components/Modal.jsx
import React, { useState, useEffect, useRef } from 'react';
// --- DIRI NIMO GIDUGANG ANG FaShare ---
import { FaPlay, FaPlus, FaCheck, FaShare } from 'react-icons/fa';
// --- DIRI NIMO GI-IMPORT ANG CAPACITOR SHARE ---
import { Share } from '@capacitor/share';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, EMBED_URLS, SOURCE_ORDER, IMG_PATH, BACKDROP_PATH } from '../config';
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
  continueWatchingList,
}) => {
  const [item, setItem] = useState(initialItem);
  const [details, setDetails] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [currentSource, setCurrentSource] = useState(SOURCE_ORDER[0]); // Default to first source
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  const modalRef = useRef(null);

  const handlePlay = () => {
    setShowPlayer(true);
    if (isTV) {
      onEpisodePlay(item, selectedSeason, selectedEpisode);
    } else {
      onEpisodePlay(item, 1, 1);
    }
    addToWatched(item.id);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // --- ANIA ANG BAG-O NGA FUNCTION PARA SA SHARE ---
  const handleShare = async () => {
    try {
      // Siguraduha nga naay details una
      if (!details) {
        console.log('Details not yet loaded for sharing.');
        return;
      }

      await Share.share({
        title: details.title || details.name,
        text: `Check out ${details.title || details.name} on NikzFlix!`,
        url: window.location.href, // I-share ang current URL sa app
        dialogTitle: 'Share with friends',
      });
    } catch (error) {
      // Handle share error (e.g., user cancelled)
      console.error('Error sharing', error);
    }
  };
  // --- END SA BAG-O NGA FUNCTION ---

  useEffect(() => {
    setIsLoading(true);
    setItem(initialItem);
    setTrailer(null);
    setCurrentSource(SOURCE_ORDER[0]); // Reset to default source when item changes

    // Focus modal for accessibility
    setTimeout(() => {
      modalRef.current?.focus();
    }, 100);

    const mediaType = initialItem?.media_type || (initialItem?.title ? 'movie' : 'tv');

    Promise.all([
      fetchData(API_ENDPOINTS.details(mediaType, initialItem.id)),
      fetchData(API_ENDPOINTS.recommendations(mediaType, initialItem.id)),
    ])
      .then(([detailsData, recsData]) => {
        setDetails(detailsData);
        const officialTrailer = detailsData.videos?.results.find(
          v => v.type === 'Trailer' && v.site === 'YouTube'
        );
        setTrailer(officialTrailer);
        setRecommendations(recsData.results || []);

        if (mediaType === 'tv') {
          const savedProgress = continueWatchingList.find(
            i => i.id.toString() === initialItem.id.toString()
          );
          if (savedProgress?.season && savedProgress?.episode) {
            setSelectedSeason(savedProgress.season);
            setSelectedEpisode(savedProgress.episode);
          } else {
            setSelectedSeason(1);
            setSelectedEpisode(1);
          }
        }

        // Decide whether to show player immediately
        if (playOnOpen) {
          handlePlay(); // This also calls setShowPlayer(true)
        } else {
          setShowPlayer(false);
        }
      })
      .catch(error => {
        console.error('Failed to fetch modal data:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Re-run effect when initialItem or playOnOpen changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItem, playOnOpen]);

  const media_type = initialItem?.media_type || (initialItem?.title ? 'movie' : 'tv');
  const isTV = media_type === 'tv';

  const handleSeasonChange = seasonNumber => {
    setSelectedSeason(seasonNumber);
    setSelectedEpisode(1);
    // Do not automatically show player on season change, user might just be browsing
  };

  const handleEpisodeChange = episodeNumber => {
    setSelectedEpisode(episodeNumber);
    onEpisodePlay(item, selectedSeason, episodeNumber);
    setShowPlayer(true); // Show player when an episode is explicitly selected
    setCurrentSource(SOURCE_ORDER[0]); // Reset to default source for new episode
  };

  const handleSourceChange = source => {
    setCurrentSource(source);
  };

  const handleRecommendationClick = recItem => {
    onClose(); // Close current modal
    setTimeout(() => onOpenModal(recItem), 300); // Open new modal after slight delay
  };

  const getPlayerUrl = () => {
    if (!currentSource) return null; // Handle case where currentSource might be undefined

    const sourceConfig = EMBED_URLS[currentSource];
    if (!sourceConfig) return null; // Handle if source is not found in config

    let url;
    if (!isTV && typeof sourceConfig.movie === 'function') {
      url = sourceConfig.movie(item.id);
    } else if (isTV && typeof sourceConfig.tv === 'function') {
      url = sourceConfig.tv(item.id, selectedSeason, selectedEpisode);
    }
    // Add anime logic if needed
    // else if (media_type === 'anime' && typeof sourceConfig.anime === 'function') { ... }

    return url || null; // Return null if url function doesn't exist or returns undefined
  };

  // --- RENDER SOURCES FUNCTION (CONFIRMED PRESENT) ---
  const renderSources = () => (
    <div className="mb-4 px-8 pt-4 sm:px-0 sm:pt-0">
      {' '}
      {/* Added padding for mobile */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-semibold text-[var(--text-secondary)]">Source:</span>
        {SOURCE_ORDER.map(source => (
          <button
            key={source}
            onClick={() => handleSourceChange(source)}
            tabIndex="0"
            onKeyDown={e => handleKeyDown(e, () => handleSourceChange(source))}
            className={`source-btn px-3 py-1 rounded-full text-sm transition-colors ${currentSource === source ? 'active bg-[var(--brand-color)] text-white font-bold' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)]'}`}
          >
            {source.replace('_', '.')}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--text-secondary)] opacity-75 italic">
        💡 Tip: Dili mo gana ang video? Suwayi ang lain nga source sa taas kung naay problema.
      </p>
    </div>
  );
  // --- END RENDER SOURCES ---

  if (isLoading || !details) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center">
        <div className="player-loading"></div>
      </div>
    );
  }

  const playerUrl = getPlayerUrl();

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex="-1"
        onKeyDown={e => e.key === 'Escape' && onClose()}
        className="modal-content-wrapper focus:outline-none"
      >
        {/* --- GI-MOVE ANG CLOSE BUTTON SA GAWAS SA modal-body para pirmi visible --- */}
        <button
          onClick={onClose}
          tabIndex="0"
          onKeyDown={e => handleKeyDown(e, onClose)}
          className="absolute top-2 right-2 md:-top-4 md:-right-4 text-3xl text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-[var(--brand-color)] transition-all z-50 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close modal" // Added aria-label
        >
          &times;
        </button>

        <div className="modal-body p-0 sm:p-8 relative overflow-y-auto">
          {' '}
          {/* Adjusted padding */}
          {/* Close button removed from here */}
          {showPlayer ? (
            <div className="aspect-video bg-black rounded-lg">
              {/* --- SOURCE BUTTONS ARE RENDERED HERE --- */}
              {renderSources()}
              {playerUrl ? (
                <iframe
                  src={playerUrl}
                  width="100%"
                  height="100%"
                  allowFullScreen="allowfullscreen"
                  title="Video Player"
                  className="rounded-b-lg border-0"
                ></iframe>
              ) : (
                <div className="w-full h-[calc(100%-50px)] flex items-center justify-center text-center text-[var(--text-secondary)] rounded-b-lg">
                  <p>Sorry, the source '{currentSource}' is not available for this title.</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="h-64 sm:h-96 bg-cover bg-center rounded-lg relative"
              style={{ backgroundImage: `url(${BACKDROP_PATH}${details.backdrop_path})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent"></div>
              {/* --- Play button overlay --- */}
              <button
                onClick={handlePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm text-white flex items-center justify-center text-4xl transition-all duration-300 hover:bg-white/50 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/50"
                aria-label="Play trailer or video"
              >
                <FaPlay />
              </button>
            </div>
          )}
          {/* Details Section */}
          <div className="flex flex-col sm:flex-row gap-8 mt-6 px-4 pb-4 sm:px-0 sm:pb-0">
            {' '}
            {/* Added padding for mobile */}
            <div className="flex-1">
              {!showPlayer && ( // Only show details fully if player is hidden
                <>
                  <h1 className="text-3xl font-bold">{details.title || details.name}</h1>
                  <div className="flex items-center space-x-4 my-2 text-sm text-[var(--text-secondary)]">
                    <span>{details.release_date || details.first_air_date?.split('-')[0]}</span>
                    <span>
                      {isTV
                        ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`
                        : details.runtime
                          ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
                          : ''}
                    </span>
                  </div>
                  <p className="text-[var(--text-primary)] mb-4 text-sm sm:text-base">
                    {details.overview}
                  </p>
                </>
              )}
              {/* --- DIRI GIDUGANG ANG SHARE BUTTON --- */}
              <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                {' '}
                {/* Allow wrapping */}
                {!showPlayer && (
                  <button
                    onClick={handlePlay}
                    tabIndex="0"
                    onKeyDown={e => handleKeyDown(e, handlePlay)}
                    className="px-6 py-2 bg-[var(--brand-color)] hover:bg-red-700 rounded font-semibold transition-colors flex items-center gap-2"
                  >
                    <FaPlay className="text-xs" /> Play
                  </button>
                )}
                <button
                  onClick={() => onToggleMyList(item)}
                  tabIndex="0"
                  onKeyDown={e => handleKeyDown(e, () => onToggleMyList(item))}
                  className="px-6 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] rounded font-semibold transition-colors flex items-center gap-2"
                >
                  {isItemInMyList(item.id) ? (
                    <FaCheck className="text-xs" />
                  ) : (
                    <FaPlus className="text-xs" />
                  )}
                  My List
                </button>
                {/* Add to Playlist */}
                <AddToPlaylistButton item={item} />
                {/* Download Button */}
                <DownloadButton item={item} quality="720p" size="medium" showLabel={true} />
                {/* --- ANIA ANG BAG-O NGA SHARE BUTTON --- */}
                <button
                  onClick={handleShare}
                  tabIndex="0"
                  onKeyDown={e => handleKeyDown(e, handleShare)}
                  className="px-6 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] rounded font-semibold transition-colors flex items-center gap-2"
                  title="Share"
                >
                  <FaShare className="text-xs" />
                  Share
                </button>
                {/* --- END SA SHARE BUTTON --- */}
              </div>
            </div>
          </div>
          {/* Episodes Section */}
          {isTV && (
            <div className="episodes-section px-4 pb-4 sm:px-0 sm:pb-0">
              {' '}
              {/* Added padding for mobile */}
              <h3 className="section-title">Seasons & Episodes</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {details.seasons
                  ?.filter(s => s.season_number > 0)
                  .map(
                    (
                      season // Filter out season 0
                    ) => (
                      <button
                        key={season.id}
                        onClick={() => handleSeasonChange(season.season_number)}
                        tabIndex="0"
                        onKeyDown={e =>
                          handleKeyDown(e, () => handleSeasonChange(season.season_number))
                        }
                        className={`px-3 py-1 rounded-full transition-colors font-medium text-sm ${selectedSeason === season.season_number ? 'bg-[var(--brand-color)] text-white' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)]'}`}
                      >
                        {season.name}
                      </button>
                    )
                  )}
              </div>
              <div className="episodes grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {' '}
                {/* Adjusted columns */}
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
                    tabIndex="0"
                    onKeyDown={e => handleKeyDown(e, () => handleEpisodeChange(ep))}
                    className={`aspect-square rounded text-xs sm:text-sm ${selectedEpisode === ep && showPlayer ? 'active' : ''}`} // Active only if playing
                    title={`Episode ${ep}`}
                  >
                    {ep}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Trailer Section */}
          {trailer && !showPlayer && (
            <div className="mt-8 px-4 pb-4 sm:px-0 sm:pb-0">
              {' '}
              {/* Added padding for mobile */}
              <h3 className="section-title">Trailer</h3>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  width="100%"
                  height="100%"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div className="recommendations-section px-4 pb-4 sm:px-0 sm:pb-0">
              {' '}
              {/* Added padding for mobile */}
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
                          isWatched={isWatched(rec.id)}
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
