// src/components/AdvancedPlayerControls.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute, 
  FaStepForward, FaStepBackward, FaCog, FaClosedCaptioning, FaTachometerAlt,
  FaForward, FaBackward
} from 'react-icons/fa';
import { MdPictureInPicture } from 'react-icons/md';

export const AdvancedPlayerControls = ({
  videoRef,
  isPlaying,
  onPlayPause,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  onSeek,
  onFullscreen,
  isFullscreen,
  onSkipIntro,
  showSkipIntro,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  playbackSpeed = 1,
  onSpeedChange,
  subtitles = [],
  currentSubtitle,
  onSubtitleChange
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const controlsTimeoutRef = useRef(null);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Update buffered amount
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const updateBuffer = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    video.addEventListener('progress', updateBuffer);
    return () => video.removeEventListener('progress', updateBuffer);
  }, [videoRef]);

  // Auto-hide controls
  useEffect(() => {
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    resetTimeout();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [currentTime, isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          onPlayPause();
          break;
        case 'f':
          e.preventDefault();
          onFullscreen();
          break;
        case 'm':
          e.preventDefault();
          onVolumeChange(volume > 0 ? 0 : 1);
          break;
        case 'arrowleft':
          e.preventDefault();
          onSeek(Math.max(0, currentTime - 10));
          break;
        case 'arrowright':
          e.preventDefault();
          onSeek(Math.min(duration, currentTime + 10));
          break;
        case 'arrowup':
          e.preventDefault();
          onVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          onVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'n':
          e.preventDefault();
          if (hasNext) onNext();
          break;
        case 'p':
          e.preventDefault();
          if (hasPrevious) onPrevious();
          break;
        case 's':
          e.preventDefault();
          if (showSkipIntro) onSkipIntro();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTime,
    duration,
    volume,
    isPlaying,
    showSkipIntro,
    hasNext,
    hasPrevious,
    onPlayPause,
    onFullscreen,
    onVolumeChange,
    onSeek,
    onNext,
    onPrevious,
    onSkipIntro,
  ]);

  const handlePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300 ${
        showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
      }`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Skip Intro Button */}
      {showSkipIntro && (
        <button
          onClick={onSkipIntro}
          className="absolute bottom-24 right-6 px-6 py-3 bg-white/90 hover:bg-white text-black font-bold rounded-lg shadow-2xl transition-all transform hover:scale-110 animate-bounce-in z-50"
        >
          Skip Intro →
        </button>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
        {/* Progress Bar */}
        <div className="relative group">
          {/* Buffered Bar */}
          <div className="absolute top-0 left-0 h-1 bg-gray-600 rounded-full" style={{ width: `${buffered}%` }}></div>
          
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => {
              onSeek((parseFloat(e.target.value) / 100) * duration);
            }}
            className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer group-hover:h-2 transition-all
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100
                     [&::-webkit-slider-track]:bg-transparent"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progress}%, rgba(75, 85, 99, 0.5) ${progress}%, rgba(75, 85, 99, 0.5) 100%)`
            }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              className="p-2 hover:bg-white/20 rounded-full transition-all transform hover:scale-110"
            >
              {isPlaying ? <FaPause className="text-2xl" /> : <FaPlay className="text-2xl" />}
            </button>

            {/* Previous Episode */}
            {hasPrevious && (
              <button
                onClick={onPrevious}
                className="p-2 hover:bg-white/20 rounded-full transition-all"
                title="Previous Episode (P)"
              >
                <FaStepBackward className="text-xl" />
              </button>
            )}

            {/* Next Episode */}
            {hasNext && (
              <button
                onClick={onNext}
                className="p-2 hover:bg-white/20 rounded-full transition-all"
                title="Next Episode (N)"
              >
                <FaStepForward className="text-xl" />
              </button>
            )}

            {/* Rewind/Forward */}
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="p-2 hover:bg-white/20 rounded-full transition-all"
              title="Rewind 10s (←)"
            >
              <FaBackward className="text-lg" />
            </button>
            
            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="p-2 hover:bg-white/20 rounded-full transition-all"
              title="Forward 10s (→)"
            >
              <FaForward className="text-lg" />
            </button>

            {/* Volume */}
            <div 
              className="flex items-center gap-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
                className="p-2 hover:bg-white/20 rounded-full transition-all"
              >
                {volume > 0 ? <FaVolumeUp className="text-xl" /> : <FaVolumeMute className="text-xl" />}
              </button>
              
              {showVolumeSlider && (
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value) / 100)}
                  className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(75, 85, 99) ${volume * 100}%, rgba(75, 85, 99) 100%)`
                  }}
                />
              )}
            </div>

            {/* Time */}
            <div className="text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-1 hover:bg-white/20 rounded-full transition-all flex items-center gap-2"
                title="Playback Speed"
              >
                <FaTachometerAlt />
                <span className="text-sm">{playbackSpeed}x</span>
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-xl rounded-lg p-3 min-w-[150px] border border-white/10">
                  <div className="text-xs font-semibold mb-2 text-gray-400">Playback Speed</div>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => {
                        onSpeedChange(speed);
                        setShowSettings(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-all ${
                        playbackSpeed === speed ? 'bg-red-600 text-white font-bold' : ''
                      }`}
                    >
                      {speed}x {speed === 1 && '(Normal)'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles */}
            {subtitles.length > 0 && (
              <div className="relative">
                <button
                  className="p-2 hover:bg-white/20 rounded-full transition-all"
                  title="Subtitles"
                  onClick={() => setShowSubtitleMenu((prev) => !prev)}
                >
                  <FaClosedCaptioning className={`text-xl ${currentSubtitle ? 'text-red-400' : ''}`} />
                </button>
                {showSubtitleMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-xl rounded-lg p-3 min-w-[180px] border border-white/10">
                    <div className="text-xs font-semibold mb-2 text-gray-400">Subtitles</div>
                    <button
                      type="button"
                      onClick={() => {
                        onSubtitleChange?.(null);
                        setShowSubtitleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-all ${
                        currentSubtitle === null ? 'bg-red-600 text-white font-bold' : ''
                      }`}
                    >
                      Off
                    </button>
                    {subtitles.map((subtitle) => (
                      <button
                        key={subtitle?.label || subtitle?.language || subtitle?.id}
                        type="button"
                        onClick={() => {
                          onSubtitleChange?.(subtitle);
                          setShowSubtitleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-all ${
                          currentSubtitle?.id === subtitle?.id || currentSubtitle === subtitle
                            ? 'bg-red-600 text-white font-bold'
                            : ''
                        }`}
                      >
                        {subtitle?.label || subtitle?.language || 'Subtitle'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Picture in Picture */}
            <button
              onClick={handlePiP}
              className="p-2 hover:bg-white/20 rounded-full transition-all"
              title="Picture in Picture"
            >
              <MdPictureInPicture className="text-xl" />
            </button>

            {/* Settings */}
            <button
              className="p-2 hover:bg-white/20 rounded-full transition-all"
              title="Settings"
            >
              <FaCog className="text-xl" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={onFullscreen}
              className="p-2 hover:bg-white/20 rounded-full transition-all"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <FaCompress className="text-xl" /> : <FaExpand className="text-xl" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
