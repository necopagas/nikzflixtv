// src/components/Banner.jsx — IMPROVED
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, BACKDROP_PATH } from '../config';
const ReactPlayer = React.lazy(() => import('react-player'));
import { FaPlay, FaInfoCircle, FaVolumeUp, FaVolumeMute, FaStar } from 'react-icons/fa';

// Helper: match percentage from TMDB vote_average (out of 10)
const getMatchPct = rating => Math.round(Math.min(rating * 10, 99));

export const Banner = ({ onOpenModal }) => {
  const [items, setItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [details, setDetails] = useState(null);
  const [dotIndex, setDotIndex] = useState(0);

  const item = items[currentItemIndex];

  useEffect(() => {
    fetchData(API_ENDPOINTS.trending).then(data => {
      const validItems = (data.results || []).filter(i => i.backdrop_path);
      setItems(validItems.slice(0, 8)); // limit to 8 for banner rotation
      setCurrentItemIndex(Math.floor(Math.random() * Math.min(validItems.length, 8)));
    });
  }, []);

  // Auto-rotate banner every 15s
  useEffect(() => {
    if (items.length > 1) {
      const timer = setInterval(() => {
        setCurrentItemIndex(prev => (prev + 1) % items.length);
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [items]);

  // Sync dot indicator
  useEffect(() => {
    setDotIndex(currentItemIndex);
  }, [currentItemIndex]);

  const bannerTimerRef = useRef();

  useEffect(() => {
    if (!item) return;
    setTrailerKey(null);
    setShowVideo(false);
    setDetails(null);

    const media_type = item.media_type || (item.title ? 'movie' : 'tv');

    fetchData(API_ENDPOINTS.details(media_type, item.id))
      .then(detailsData => {
        setDetails(detailsData);
        const videos = detailsData.videos?.results || [];
        let foundVideo = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        if (!foundVideo) foundVideo = videos.find(v => v.type === 'Teaser' && v.site === 'YouTube');
        if (!foundVideo) foundVideo = videos.find(v => v.site === 'YouTube');
        if (foundVideo) {
          setTrailerKey(foundVideo.key);
          bannerTimerRef.current = setTimeout(() => setShowVideo(true), 800);
        }
      })
      .catch(() => {});

    return () => clearTimeout(bannerTimerRef.current);
  }, [item]);

  if (!item) {
    return <div className="w-full h-[90vh] skeleton" />;
  }

  const truncatedDesc =
    item.overview && item.overview.length > 180
      ? `${item.overview.substring(0, 180)}...`
      : item.overview;

  const genres = details?.genres?.slice(0, 3) || [];
  const matchPct = item.vote_average ? getMatchPct(item.vote_average) : null;
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  const isTV = !item.title;
  const certification = details?.release_dates?.results
    ?.find(r => r.iso_3166_1 === 'US')
    ?.release_dates?.find(d => d.certification)?.certification;

  return (
    <div
      className="banner relative w-full min-h-[90vh] overflow-hidden bg-cover bg-center text-white transition-all duration-1000"
      style={{ backgroundImage: `url(${BACKDROP_PATH}${item.backdrop_path})` }}
    >
      {/* Trailer Video Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {trailerKey && (
          <Suspense fallback={null}>
            <ReactPlayer
              url={`https://www.youtube.com/watch?v=${trailerKey}`}
              playing={true}
              muted={isMuted}
              loop={true}
              width="100%"
              height="100%"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.5)',
                opacity: showVideo ? 1 : 0,
                transition: 'opacity 1.2s ease-in-out',
              }}
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    disablekb: 1,
                    showinfo: 0,
                    modestbranding: 1,
                    fs: 0,
                    cc_load_policy: 0,
                    iv_load_policy: 3,
                    autohide: 1,
                    playsinline: 1,
                    rel: 0,
                  },
                },
              }}
            />
          </Suspense>
        )}
      </div>

      {/* Enhanced gradient overlay — stronger at bottom for readability */}
      <div className="absolute inset-0 z-1 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e]/40 to-transparent" />
      <div className="absolute inset-0 z-1 bg-gradient-to-r from-[#0a0b0e]/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[90vh] items-end">
        <div className="w-full px-4 py-8 pb-24 sm:px-8 sm:py-10 md:px-16 md:py-16 md:pb-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {/* Match % badge — Netflix style */}
              {matchPct && (
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold text-green-400 md:text-xl">
                    {matchPct}% Match
                  </span>
                  {year && <span className="text-sm text-white/70">{year}</span>}
                  {certification && (
                    <span className="rounded border border-white/50 px-1.5 py-0.5 text-xs text-white/80">
                      {certification}
                    </span>
                  )}
                  {isTV && details?.number_of_seasons && (
                    <span className="text-sm text-white/70">
                      {details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Title */}
              <h1 className="banner-title mb-3 text-3xl font-extrabold leading-tight drop-shadow-2xl md:text-6xl">
                {item.title || item.name}
              </h1>

              {/* Genre tags */}
              {genres.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {genres.map(g => (
                    <span
                      key={g.id}
                      className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Star rating */}
              {item.vote_average > 0 && (
                <div className="mb-4 flex items-center gap-1.5">
                  <FaStar className="text-sm text-yellow-400" />
                  <span className="text-sm font-semibold text-white">
                    {item.vote_average.toFixed(1)}
                  </span>
                  <span className="text-xs text-white/50">/ 10</span>
                  {item.vote_count && (
                    <span className="text-xs text-white/40">
                      ({item.vote_count.toLocaleString()} votes)
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              <p className="banner-desc mb-8 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
                {truncatedDesc}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => onOpenModal(item, true)}
                  className="banner-button flex w-full items-center justify-center gap-2 rounded-md bg-white px-8 py-3 text-base font-bold text-black shadow-lg transition-all duration-200 hover:scale-105 hover:bg-white/90 sm:w-auto md:text-lg"
                >
                  <FaPlay /> Play
                </button>
                <button
                  onClick={() => onOpenModal(item)}
                  className="banner-button flex w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-gray-500/60 px-8 py-3 text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-gray-500/80 sm:w-auto md:text-lg"
                >
                  <FaInfoCircle /> More Info
                </button>
              </div>
            </div>

            {/* Right side: Mute + Dot indicators */}
            <div className="flex flex-col items-start gap-6 md:items-end md:mb-4">
              {showVideo && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 md:flex"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <FaVolumeMute className="text-lg" />
                  ) : (
                    <FaVolumeUp className="text-lg" />
                  )}
                </button>
              )}

              {/* Dot navigation */}
              {items.length > 1 && (
                <div className="flex flex-col gap-1.5 md:flex">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentItemIndex(i)}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        i === dotIndex ? 'h-6 bg-white' : 'h-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
