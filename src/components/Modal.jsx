import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlay } from 'react-icons/fa';

export default function Modal({ item, onClose }) {
  // Gi-default nato sa vidsrcme kay kini ang pinakastable ug naay CSP protection pass
  const [activeSource, setActiveSource] = useState('vidsrcme');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerWrapperRef = useRef(null);

  const sources = [
    { id: 'vidsrcme', name: 'vidsrcme (Stable)' },
    { id: 'vidlink', name: 'vidlink' },
    { id: 'streamwish', name: 'streamwish' },
    { id: 'autoembed', name: 'autoembed' },
    { id: 'vidsrcxyz', name: 'vidsrcxyz' },
    { id: 'vidsrcnl', name: 'vidsrcnl' },
    { id: 'vidbinge', name: 'vidbinge' },
  ];

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

  if (!item) return null;

  const tmdbId = item.id;
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

  const getEmbedUrl = sourceId => {
    const protocols = {
      vidsrcme: `https://vidsrc.me/embed/${mediaType}?tmdb=${tmdbId}`,
      vidlink: `https://vidlink.pro/embed/${mediaType}/${tmdbId}`,
      streamwish: `https://streamwish.to/e/${tmdbId}`,
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
        >
          <FaTimes className="text-lg" />
        </button>

        <div className="p-6 flex flex-col gap-4">
          {!isFullscreen && (
            <div className="w-full bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
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
                        ? 'bg-red-600 text-white shadow-md scale-105'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {src.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-amber-500 italic">
                💡 Tip: Change the source player server if the movie keeps loading or gets blocked
                by browser protection.
              </p>
            </div>
          )}

          <div
            ref={playerWrapperRef}
            className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group border border-zinc-900"
          >
            <iframe
              src={getEmbedUrl(activeSource)}
              title="NikzFlix Video Stream"
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-same-origin allow-scripts"
              scrolling="no"
            />

            <button
              onClick={toggleFullscreen}
              className="absolute bottom-4 right-4 z-40 px-3 py-1.5 bg-black/60 hover:bg-red-600 text-white font-bold text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            </button>
          </div>

          {!isFullscreen && (
            <div className="mt-2">
              <h2 className="text-xl font-extrabold text-white mb-1">{item.title || item.name}</h2>
              <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{item.overview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
