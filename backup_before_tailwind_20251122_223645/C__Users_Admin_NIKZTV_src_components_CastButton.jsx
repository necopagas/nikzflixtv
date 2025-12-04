import React, { useState, useEffect } from 'react';
import { useCast } from '../hooks/useCast';
import { FiCast, FiMonitor, FiX } from 'react-icons/fi';

export const CastButton = ({ videoElement, videoUrl, metadata, className = '' }) => {
  const {
    isCastAvailable,
    isAirPlayAvailable,
    isCasting,
    castDevice,
    castToChromecast,
    stopCasting,
    showAirPlayPicker,
    enableAirPlay,
    initializeCast,
  } = useCast();

  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize cast on mount
  useEffect(() => {
    if (isCastAvailable) {
      initializeCast();
    }
  }, [isCastAvailable, initializeCast]);

  // Enable AirPlay on video element
  useEffect(() => {
    if (isAirPlayAvailable && videoElement) {
      enableAirPlay(videoElement);
    }
  }, [isAirPlayAvailable, videoElement, enableAirPlay]);

  const handleChromecast = async () => {
    setIsLoading(true);
    try {
      await castToChromecast(videoUrl, {
        title: metadata?.title || metadata?.name || 'Video',
        subtitle: metadata?.overview || '',
        poster: metadata?.poster_path
          ? `https://image.tmdb.org/t/p/w500${metadata.poster_path}`
          : metadata?.backdrop_path
            ? `https://image.tmdb.org/t/p/original${metadata.backdrop_path}`
            : undefined,
      });
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to cast:', error);
      alert('Failed to start casting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAirPlay = () => {
    if (videoElement) {
      showAirPlayPicker(videoElement);
      setShowMenu(false);
    }
  };

  const handleStopCasting = () => {
    stopCasting();
    setShowMenu(false);
  };

  // Don't show button if neither cast method is available
  if (!isCastAvailable && !isAirPlayAvailable) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Cast Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`cast-button ${isCasting ? 'casting' : ''}`}
        title={isCasting ? `Casting to ${castDevice?.name}` : 'Cast to TV'}
        disabled={isLoading}
      >
        {isCasting ? (
          <div className="flex items-center gap-2">
            <FiCast className="animate-pulse" />
            <span className="text-xs hidden sm:inline">{castDevice?.name}</span>
          </div>
        ) : (
          <FiCast />
        )}
      </button>

      {/* Cast Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />

          {/* Menu */}
          <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden z-50 min-w-[200px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiMonitor className="text-blue-400" />
                <span className="font-semibold text-sm">Cast to Device</span>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Options */}
            <div className="py-2">
              {isCasting ? (
                /* Currently Casting */
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <FiCast className="text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">Connected</p>
                      <p className="text-xs text-gray-400">{castDevice?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleStopCasting}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Stop Casting
                  </button>
                </div>
              ) : (
                /* Available Cast Options */
                <>
                  {isCastAvailable && (
                    <button
                      onClick={handleChromecast}
                      disabled={isLoading}
                      className="w-full px-4 py-3 hover:bg-gray-800 transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                        <FiCast className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Chromecast</p>
                        <p className="text-xs text-gray-400">Cast to Google devices</p>
                      </div>
                    </button>
                  )}

                  {isAirPlayAvailable && (
                    <button
                      onClick={handleAirPlay}
                      className="w-full px-4 py-3 hover:bg-gray-800 transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                        <FiMonitor className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">AirPlay</p>
                        <p className="text-xs text-gray-400">Cast to Apple devices</p>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Info Footer */}
            {!isCasting && (
              <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Make sure your device is on the same network
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
