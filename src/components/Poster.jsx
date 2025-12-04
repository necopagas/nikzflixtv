// src/components/Poster.jsx
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { IMG_PATH, BACKDROP_PATH, API_ENDPOINTS } from '../config';
import { getGenreNamesByIds } from '../utils/genreUtils';
import { escapeRegex } from '../utils/text';
import { FaPlay, FaInfoCircle, FaCheck } from 'react-icons/fa';
import ProgressiveImage from './ProgressiveImage';
const ReactPlayer = React.lazy(() => import('react-player'));
import { fetchData } from '../utils/fetchData';
import { usePreviewsSetting } from '../hooks/usePreviewsSetting';
import { useSettings } from '../context/SettingsContext';

// Simple in-memory cache so repeated hovers don't refetch details
const trailerCache = new Map();

export const Poster = ({ item, onOpenModal, isWatched, isLarge, season, episode, query = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewKey, setPreviewKey] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const previewTimerRef = useRef(null);
  const hoverDebounceRef = useRef(null);
  // prefer context
  usePreviewsSetting(); // hook kept for side-effect / preference wiring (settings used below)
  const settings = useSettings();
  const isPreviewCapable =
    typeof window !== 'undefined'
      ? settings?.previewsEnabled &&
        window.matchMedia &&
        window.matchMedia('(hover: hover)').matches &&
        window.innerWidth >= 640
      : false;

  // Prefer poster; fallback to backdrop if poster is missing
  const hasPoster = !!item.poster_path;
  const hasBackdrop = !!item.backdrop_path;
  const imageUrl = hasPoster
    ? item.poster_path?.startsWith('http')
      ? item.poster_path
      : `${IMG_PATH}${item.poster_path}`
    : hasBackdrop
      ? `${BACKDROP_PATH}${item.backdrop_path}`
      : '/no-image.svg';
  // low-res placeholder (blur-up)
  const lowResBase = IMG_PATH.replace('/w500', '/w92');
  const lowResUrl = hasPoster
    ? item.poster_path?.startsWith('http')
      ? item.poster_path
      : `${lowResBase}${item.poster_path}`
    : hasBackdrop
      ? `${BACKDROP_PATH}${item.backdrop_path}`
      : '/no-image.svg';

  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenModal(item);
    }
  };

  // Simplified LQIP - just use the low-res URL directly, no fetch/CORS issues
  useEffect(() => {
    setMounted(true);
    return () => {
      clearTimeout(previewTimerRef.current);
    };
  }, []);

  const loadPreview = async () => {
    if (!isPreviewCapable) return;
    const id = item.id;
    if (trailerCache.has(id)) {
      const cached = trailerCache.get(id);
      setPreviewKey(cached);
      setShowPreview(!!cached);
      if (cached) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => setShowPreview(false), 8000);
      }
      return;
    }

    try {
      const media_type = item.media_type || (item.title ? 'movie' : 'tv');
      const details = await fetchData(API_ENDPOINTS.details(media_type, id));
      const videos = details.videos?.results || [];
      let found = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (!found) found = videos.find(v => v.type === 'Teaser' && v.site === 'YouTube');
      if (!found) found = videos.find(v => v.site === 'YouTube');
      const key = found ? found.key : null;
      trailerCache.set(id, key);
      setPreviewKey(key);
      if (key) {
        setShowPreview(true);
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => setShowPreview(false), 8000);
      }
    } catch (err) {
      console.warn('Failed to load preview for', item.id, err);
      trailerCache.set(item.id, null);
    }
  };

  const genreNames = getGenreNamesByIds(item.genre_ids);
  const displayTitle = item.title || item.name || 'Untitled';
  const widthClass = isLarge ? 'w-64' : 'w-40';

  // Highlight matched query substrings in titles (use helper)
  const renderHighlighted = text => {
    const q = (query || '').trim();
    if (!q) return text;
    try {
      // We'll build parts using a safe regex and render spans
      const escaped = escapeRegex(q);
      const parts = String(text).split(new RegExp(`(${escaped})`, 'ig'));
      return parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <span key={i} className="text-yellow-300">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    } catch {
      return text;
    }
  };

  return (
    // --- CONTAINER: Adjusted hover effects, removed explicit cursor ---
    <div
      // --- GIBALHIN NATO ANG widthClass SA SULOD NGA WRAPPER ---
      className={`poster-container relative group focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-primary) focus-visible:ring-(--brand-color) rounded-lg`} // Removed width, added rounding here
      onClick={() => onOpenModal(item)}
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        setIsHovered(true);
        // Debounce hover to avoid rapid fetches when moving across posters
        clearTimeout(hoverDebounceRef.current);
        hoverDebounceRef.current = setTimeout(() => {
          if (isPreviewCapable) loadPreview();
        }, 300);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowPreview(false);
        clearTimeout(previewTimerRef.current);
        clearTimeout(hoverDebounceRef.current);
      }}
    >
      {/* --- WRAPPER PARA SA IMAGE UG TITLE (KANI NA ANG NAAY SIZE UG HOVER EFFECT) --- */}
      <div
        // --- GIBUTANG ANG WIDTH UG HOVER EFFECT DIRI ---
        className={`relative ${widthClass} flex flex-col rounded-lg overflow-hidden bg-(--bg-secondary) shadow-md transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-110 group-hover:z-10`}
      >
        {/* --- IMAGE WRAPPER --- */}
        <div
          className={`poster-image-wrapper relative w-full aspect-2/3 overflow-hidden bg-gray-800 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} transition-transform transition-opacity duration-500`}
        >
          {/* Progressive image (low-res placeholder -> high-res) */}
          <ProgressiveImage
            src={imageUrl}
            placeholderSrc={lowResUrl}
            alt={displayTitle}
            className="w-full h-full"
            imgProps={{
              className: `absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`,
              fetchPriority: isLarge ? 'high' : 'low',
              onLoad: () => setImgLoaded(true),
              onError: e => {
                e.target.onerror = null;
                e.target.src = '/no-image.svg';
                setImgLoaded(true);
              },
            }}
          />
          {/* Base Info Layer (Always Visible) */}
          <div className="absolute left-0 right-0 bottom-0 p-3 bg-linear-to-t from-black/90 via-black/70 to-transparent">
            <h4 className="text-sm font-bold text-white truncate mb-1" title={displayTitle}>
              {renderHighlighted(displayTitle)}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              {item.release_date && <span>{new Date(item.release_date).getFullYear()}</span>}
              {item.vote_average > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  {item.vote_average.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          {/* Season/Episode Badge */}
          {season && episode && (
            <div className="absolute top-2 left-2 bg-black/75 text-white text-xs font-bold px-2 py-1 rounded-md z-30">
              S{season}: E{episode}
            </div>
          )}
          {/* Watched Checkmark */}
          {isWatched && (
            <div
              className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white z-30 shadow-lg"
              title="Watched"
            >
              <FaCheck className="text-sm" />
            </div>
          )}
          {/* --- HOVER OVERLAY --- */}
          <div
            className={`absolute inset-0 bg-linear-to-t from-black via-black/90 to-transparent p-3 transition-all duration-300 ease-in-out z-30 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto ${
              isHovered ? 'opacity-100 pointer-events-auto' : ''
            }`}
          >
            {/* Preview video (behind the overlay controls) */}
            {showPreview && previewKey && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <Suspense fallback={null}>
                  <ReactPlayer
                    url={`https://www.youtube.com/watch?v=${previewKey}`}
                    playing={true}
                    muted={true}
                    loop={true}
                    width="100%"
                    height="100%"
                    style={{
                      objectFit: 'cover',
                      filter: 'brightness(0.6)',
                      transform: 'scale(1.05)',
                      position: 'absolute',
                      inset: 0,
                    }}
                    config={{
                      youtube: {
                        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0 },
                      },
                    }}
                  />
                </Suspense>
              </div>
            )}
            {/* Play/Info Buttons */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onOpenModal(item, true);
                }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 text-black flex items-center justify-center text-xl md:text-2xl transition-all duration-200 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white ring-offset-2 ring-offset-transparent"
                title="Play"
                aria-label="Play"
              >
                <FaPlay />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onOpenModal(item);
                }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-600/80 backdrop-blur-sm text-white flex items-center justify-center text-xl md:text-2xl transition-all duration-200 hover:bg-gray-500/90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white ring-offset-2 ring-offset-transparent"
                title="More Info"
                aria-label="More Info"
              >
                <FaInfoCircle />
              </button>
            </div>

            {/* Genres on Hover */}
            {genreNames.length > 0 && (
              <div className="absolute bottom-3 left-3 w-[calc(100%-24px)] transition-all duration-300">
                <p className="text-white/90 text-xs font-medium leading-relaxed">
                  {genreNames.slice(0, 3).join(' • ')}
                </p>
              </div>
            )}
          </div>{' '}
          {/* End Hover Overlay */}
        </div>{' '}
        {/* End poster-image-wrapper */}
        {/* Title integrated into Poster — small caption overlay on focus/always visible below image */}
        <div className="pt-2 pb-2 px-2 bg-transparent">
          <h3
            className="text-sm font-semibold text-(--text-primary) transition-colors duration-200 truncate group-hover:text-white"
            title={displayTitle}
          >
            {renderHighlighted(displayTitle)}
          </h3>
        </div>
      </div>{' '}
      {/* End scaling/sizing wrapper */}
    </div> // End poster-container
  );
};
