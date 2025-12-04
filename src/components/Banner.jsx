// src/components/Banner.jsx
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, BACKDROP_PATH } from '../config';
const ReactPlayer = React.lazy(() => import('react-player'));
import { FaPlay, FaInfoCircle, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

export const Banner = ({ onOpenModal }) => {
  const [items, setItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const item = items[currentItemIndex];

  useEffect(() => {
    fetchData(API_ENDPOINTS.trending).then(data => {
      const validItems = (data.results || []).filter(item => item.backdrop_path);
      setItems(validItems);
      setCurrentItemIndex(Math.floor(Math.random() * validItems.length));
    });
  }, []);

  useEffect(() => {
    if (items.length > 1) {
      const timer = setInterval(() => {
        setCurrentItemIndex(prevIndex => (prevIndex + 1) % items.length);
      }, 15000);

      return () => clearInterval(timer);
    }
  }, [items]);

  const bannerTimerRef = useRef();
  useEffect(() => {
    if (item) {
      setTrailerKey(null);
      setShowVideo(false);

      const media_type = item.media_type || (item.title ? 'movie' : 'tv');

      fetchData(API_ENDPOINTS.details(media_type, item.id))
        .then(detailsData => {
          const videos = detailsData.videos?.results || [];
          let foundVideo = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
          if (!foundVideo)
            foundVideo = videos.find(v => v.type === 'Teaser' && v.site === 'YouTube');
          if (!foundVideo) foundVideo = videos.find(v => v.site === 'YouTube');
          if (foundVideo) {
            setTrailerKey(foundVideo.key);
            // Start video immediately (or very short delay)
            bannerTimerRef.current = setTimeout(() => setShowVideo(true), 500);
          } else {
            setTrailerKey(null);
          }
        })
        .catch(err => {
          console.error('Failed to fetch trailer', err);
          setTrailerKey(null);
        });
    }
    return () => clearTimeout(bannerTimerRef.current);
  }, [item]);

  if (!item) {
    return <div className="w-full h-[90vh] skeleton"></div>;
  }

  const truncatedDesc =
    item.overview.length > 200 ? `${item.overview.substring(0, 200)}...` : item.overview;

  return (
    <div
      className="banner relative w-full h-[90vh] bg-cover bg-center text-white transition-all duration-1000"
      style={{ backgroundImage: `url(${BACKDROP_PATH}${item.backdrop_path})` }}
    >
      {/* --- KANI ANG TRAILER PLAYER (z-0) --- */}
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
                transition: 'opacity 1s ease-in-out',
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

      {/* Ang `.banner::after` (ang gradient) kay naa sa z-index: 1 
              mao nga naa siya sa TALIWALA sa video ug sa text.
            */}

      {/* --- KANI ANG CONTENT (z-10) --- */}
      <div className="absolute inset-0 z-10 p-4 sm:p-8 md:p-16 flex flex-col justify-center">
        <div className="flex justify-between items-end">
          <div className="max-w-3xl">
            <h1 className="banner-title text-4xl md:text-7xl font-extrabold mb-4">
              {item.title || item.name}
            </h1>
            <p className="banner-desc text-md md:text-xl mb-8 max-w-md md:max-w-2xl">
              {truncatedDesc}
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* --- GI-UPDATE ANG BUTTON STYLE --- */}
              <button
                onClick={() => onOpenModal(item, true)}
                className="banner-button bg-linear-to-r from-(--brand-color) to-red-600 text-white px-8 py-3 rounded-md font-bold shadow-lg hover:shadow-red-500/40 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
              >
                <FaPlay /> Play
              </button>
              {/* --- GI-UPDATE ANG BUTTON STYLE --- */}
              <button
                onClick={() => onOpenModal(item)}
                className="banner-button bg-gray-700/70 backdrop-blur-sm text-white px-8 py-3 rounded-md font-bold hover:bg-gray-600/80 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
              >
                <FaInfoCircle /> More Info
              </button>
            </div>
          </div>

          {/* Mute Button (Right Side) */}
          {showVideo && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm text-white hover:bg-white/10 transition-all duration-200 mb-8 mr-4"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <FaVolumeMute className="text-xl" /> : <FaVolumeUp className="text-xl" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
