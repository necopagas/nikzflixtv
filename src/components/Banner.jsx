// src/components/Banner.jsx — IMPROVED
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, BACKDROP_PATH } from '../config';
const ReactPlayer = React.lazy(() => import('react-player'));
import { FaPlay, FaInfoCircle, FaVolumeUp, FaVolumeMute, FaStar } from 'react-icons/fa';

// Helper: get age rating badge color
const getRatingColor = rating => {
  if (rating >= 8) return 'bg-green-500';
  if (rating >= 6.5) return 'bg-yellow-500';
  return 'bg-red-500';
};

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
      className="banner relative w-full h-[90vh] bg-cover bg-center text-white transition-all duration-1000"
      style={{ backgroundImage: `url(${BACKDROP_PATH}${item.backdrop_path})` }}
    >
      {/* Trailer Video Layer */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
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
      <div className="absolute inset-0 z-10 p-4 sm:p-8 md:p-16 flex flex-col justify-end pb-24 md:pb-32">
        <div className="flex justify-between items-end w-full">
          <div className="max-w-2xl">

            {/* Match % badge — Netflix style */}
            {matchPct && (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-green-400 font-bold text-lg md:text-xl">{matchPct}% Match</span>
                {year && <span className="text-white/70 text-sm">{year}</span>}
                {certification && (
                  <span className="border border-white/50 text-white/80 text-xs px-1.5 py-0.5 rounded">
                    {certification}
                  </span>
                )}
                {isTV && details?.number_of_seasons && (
                  <span className="text-white/70 text-sm">
                    {details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <h1 className="banner-title text-3xl md:text-6xl font-extrabold mb-3 drop-shadow-2xl leading-tight">
              {item.title || item.name}
            </h1>

            {/* Genre tags */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {genres.map(g => (
                  <span
                    key={g.id}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Star rating */}
            {item.vote_average > 0 && (
              <div className="flex items-center gap-1.5 mb-4">
                <FaStar className="text-yellow-400 text-sm" />
                <span className="text-white font-semibold text-sm">
                  {item.vote_average.toFixed(1)}
                </span>
                <span className="text-white/50 text-xs">/ 10</span>
                {item.vote_count && (
                  <span className="text-white/40 text-xs">
                    ({item.vote_count.toLocaleString()} votes)
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <p className="banner-desc text-sm md:text-base mb-8 max-w-xl text-white/85 leading-relaxed">
              {truncatedDesc}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onOpenModal(item, true)}
                className="banner-button bg-white text-black px-8 py-3 rounded-md font-bold shadow-lg hover:bg-white/90 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-base md:text-lg"
              >
                <FaPlay /> Play
              </button>
              <button
                onClick={() => onOpenModal(item)}
                className="banner-button bg-gray-500/60 backdrop-blur-sm text-white px-8 py-3 rounded-md font-bold hover:bg-gray-500/80 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-base md:text-lg border border-white/20"
              >
                <FaInfoCircle /> More Info
              </button>
            </div>
          </div>

          {/* Right side: Mute + Dot indicators */}
          <div className="flex flex-col items-end gap-6 mb-4">
            {showVideo && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hidden md:flex items-center justify-center w-11 h-11 rounded-full border border-white/40 bg-black/40 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <FaVolumeMute className="text-lg" /> : <FaVolumeUp className="text-lg" />}
              </button>
            )}

            {/* Dot navigation */}
            {items.length > 1 && (
              <div className="hidden md:flex flex-col gap-1.5">
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
  );
};
