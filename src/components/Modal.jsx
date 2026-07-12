import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlay } from 'react-icons/fa';

export default function Modal({ item, isOpen, onClose }) {
  const [activeSource, setActiveSource] = useState('streamwish');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerWrapperRef = useRef(null);

  // Source list configuration
  const sources = [
    { id: 'streamwish', name: 'streamwish' },
    { id: 'vidfast', name: 'vidfast' },
    { id: 'vidlink', name: 'vidlink' },
    { id: 'autoembed', name: 'autoembed' },
    { id: 'moviesapi', name: 'moviesapi' },
    { id: 'vidsrcme', name: 'vidsrcme' },
    { id: 'vidsrcxyz', name: 'vidsrcxyz' },
    { id: 'vidsrcnl', name: 'vidsrcnl' },
    { id: 'vidbinge', name: 'vidbinge' },
    { id: 'frembed', name: 'frembed' },
    { id: '111movies', name: '111movies' },
    { id: 'lookmovie', name: 'lookmovie' },
  ];

  // Monitor fullscreen change events globally to dynamically hide source selector
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement && playerWrapperRef.current) {
        setIsFullscreen(document.fullscreenElement === playerWrapperRef.current);
      } else {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen || !item) return null;

  const tmdbId = item.id;
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

  // Safe dynamic fallback endpoints generator
  const getEmbedUrl = sourceId => {
    const protocols = {
      streamwish: `https://streamwish.to/e/${tmdbId}`,
      '111movies': `https://111movies.com/embed/${mediaType}/${tmdbId}`,
      vidlink: `https://vidlink.pro/embed/${mediaType}/${tmdbId}`,
      vidsrcme: `https://vidsrc.me/embed/${mediaType}?tmdb=${tmdbId}`,
      vidsrcxyz: `https://vidsrc.xyz/embed/${mediaType}?tmdb=${tmdbId}`,
      autoembed: `https://player.autoembed.cc/embed/${mediaType}/${tmdbId}`,
    };
    return protocols[sourceId] || `https://vidsrc.me/embed/${mediaType}?tmdb=${tmdbId}`;
  };

  const toggleFullscreen = () => {
    if (!playerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      playerWrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#141414] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
        >
          <FaTimes className="text-lg" />
        </button>

        <div className="p-6 flex flex-col gap-4">
          {/* CONTROL BLOCK: Hidden dynamically during browser level fullscreen */}
          {!isFullscreen && (
            <div className="w-full bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 transition-all duration-300">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mr-2">
                  Source:
                </span>
                {sources.map(src => (
                  <button
                    key={src.id}
                    onClick={() => setActiveSource(src.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      activeSource === src.id
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20 scale-105'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {src.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-amber-500 italic flex items-center gap-1">
                💡 Tip: Try a different source if the video doesn't load or shows an iframe error
                block.
              </p>
            </div>
          )}

          {/* DYNAMIC PLAYER CONTAINER WRAPPER */}
          <div
            ref={playerWrapperRef}
            className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group shadow-inner border border-zinc-900"
          >
            <iframe
              src={getEmbedUrl(activeSource)}
              title="NikzFlix Video Stream"
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-same-origin allow-scripts"
              scrolling="no"
            />

            {/* Custom Desktop Fullscreen Float Trigger */}
            <button
              onClick={toggleFullscreen}
              className="absolute bottom-4 right-4 z-40 px-3 py-1.5 bg-black/60 hover:bg-red-600 text-white font-bold text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            </button>
          </div>

          {/* Media Info Meta Text Block */}
          {!isFullscreen && (
            <div className="mt-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight mb-1">
                {item.title || item.name}
              </h2>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl line-clamp-2">
                {item.overview}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
