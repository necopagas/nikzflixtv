// src/components/EnhancedVideoPlayer.jsx
import React, { useRef, useState, useEffect } from 'react';
import isSmartTV from '../utils/isSmartTV';
import useRemoteNavigation from '../hooks/useRemoteNavigation';
import '../styles/tv.css';
import { AdvancedPlayerControls } from './AdvancedPlayerControls';
import {
  IntroSkipper,
  PlaybackSpeedController,
  WatchProgressTracker,
} from '../utils/videoPlayerUtils';
import QualitySelector from './QualitySelector';
import { CastButton } from './CastButton';
import WatchPartyControls from './WatchPartyControls';

export const EnhancedVideoPlayer = ({
  src,
  onEnded,
  onNext,
  onPrev,
  episodeId,
  autoplay = true,
  className = '',
  availableQualities = ['360p', '480p', '720p', '1080p'],
  onQualityChange = null,
  contentMetadata = null, // For cast feature
}) => {
  const videoRef = useRef(null);
  // hlsAttached is intentionally not exposed in UI; keep for future telemetry
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(() => {
    return localStorage.getItem('preferredQuality') || 'auto';
  });

  // Initialize utilities
  const [introSkipper] = useState(() => new IntroSkipper());
  const [speedController] = useState(() => new PlaybackSpeedController());
  const [progressTracker] = useState(() => new WatchProgressTracker());

  // Load saved settings
  useEffect(() => {
    if (videoRef.current) {
      const savedSpeed = speedController.getSpeed();
      videoRef.current.playbackRate = savedSpeed;
      setPlaybackSpeed(savedSpeed);

      const savedVolume = localStorage.getItem('videoVolume');
      if (savedVolume) {
        const vol = parseFloat(savedVolume);
        videoRef.current.volume = vol;
        setVolume(vol);
      }

      // Auto-play if enabled
      if (autoplay) {
        const autoplayEnabled = localStorage.getItem('autoplay') !== 'false';
        if (autoplayEnabled) {
          videoRef.current.play().catch(err => {
            console.warn('Autoplay prevented:', err);
          });
        }
      }

      // Load saved progress
      if (episodeId) {
        const savedProgress = progressTracker.getProgress(episodeId);
        if (savedProgress && savedProgress.percentage < 90) {
          videoRef.current.currentTime = savedProgress.time;
        }
      }
    }
  }, [src, episodeId, autoplay, speedController, progressTracker]);

  // Apply TV mode class and remote navigation
  useEffect(() => {
    if (isSmartTV()) {
      document.body.classList.add('tv-mode');
    } else {
      document.body.classList.remove('tv-mode');
    }
  }, []);

  useRemoteNavigation({
    onEnter: el => {
      // if focused element is video, toggle play/pause
      if (el === videoRef.current) {
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
      }
    },
    onBack: () => {
      // try to exit fullscreen on back
      if (document.fullscreenElement) document.exitFullscreen();
    },
  });

  // HLS fallback: if src looks like m3u8 and native can't play it, use hls.js
  useEffect(() => {
    if (!src || !videoRef.current) return;
    const isM3U8 = /\.m3u8(\?|$)/i.test(String(src));
    const video = videoRef.current;

    const canPlayHlsNatively =
      video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl');

    let hlsInstance = null;
    let cancelled = false;

    async function attachHls() {
      try {
        const Hls = (await import('hls.js')).default;
        if (cancelled) return;
        if (Hls && Hls.isSupported()) {
          hlsInstance = new Hls();
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);
          // hls.js attached
        }
      } catch (err) {
        console.warn('HLS load error', err);
      }
    }

    if (isM3U8 && !canPlayHlsNatively) {
      attachHls();
    }

    return () => {
      cancelled = true;
      try {
        if (hlsInstance) hlsInstance.destroy();
      } catch (e) {
        console.warn('Error destroying hls instance', e);
      }
    };
  }, [src]);

  // Track progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && episodeId && !videoRef.current.paused) {
        progressTracker.saveProgress(
          episodeId,
          videoRef.current.currentTime,
          videoRef.current.duration
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [episodeId, progressTracker]);

  // Handle intro/outro skipping
  useEffect(() => {
    if (!videoRef.current) return;

    const autoSkipIntro = localStorage.getItem('autoSkipIntro') === 'true';

    if (episodeId) {
      introSkipper.reset(episodeId);
    }

    const checkIntro = () => {
      const time = videoRef.current.currentTime;
      const shouldShowSkip = introSkipper.shouldShowSkipButton(time);
      setShowSkipIntro(shouldShowSkip);

      if (autoSkipIntro && shouldShowSkip && !introSkipper.hasSkipped) {
        introSkipper.skip(videoRef.current);
      }
    };

    const intervalId = setInterval(checkIntro, 500);
    return () => clearInterval(intervalId);
  }, [episodeId, introSkipper]);

  // Auto-skip outro
  useEffect(() => {
    if (!videoRef.current) return;

    const autoSkipOutro = localStorage.getItem('autoSkipOutro') === 'true';

    const checkOutro = () => {
      const time = videoRef.current.currentTime;
      const shouldSkipOutro = introSkipper.shouldSkipOutro(time, videoRef.current.duration);

      if (autoSkipOutro && shouldSkipOutro && onNext) {
        onNext();
      }
    };

    const intervalId = setInterval(checkOutro, 1000);
    return () => clearInterval(intervalId);
  }, [introSkipper, onNext]);

  // Update time and buffered
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);

      // Update buffered
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered((bufferedEnd / videoRef.current.duration) * 100);
      }
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = time => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = newVolume => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      localStorage.setItem('videoVolume', newVolume.toString());
      if (newVolume > 0) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleToggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTogglePiP = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.error('PiP error:', err);
      }
    }
  };

  const handleSpeedChange = speed => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      speedController.setSpeed(speed);
      setPlaybackSpeed(speed);
    }
  };

  const handleSkipIntro = () => {
    if (videoRef.current) {
      introSkipper.skip(videoRef.current);
      setShowSkipIntro(false);
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + 10
      );
    }
  };

  const handleQualityChange = (quality, isAuto) => {
    setCurrentQuality(quality);
    if (onQualityChange) {
      onQualityChange(quality, isAuto);
    }
  };

  const handleEnded = () => {
    if (episodeId) {
      progressTracker.saveProgress(episodeId, 0, 0); // Reset progress
    }
    if (onEnded) {
      onEnded();
    }
    // Auto-play next if enabled
    const autoplayNext = localStorage.getItem('autoplay') !== 'false';
    if (autoplayNext && onNext) {
      setTimeout(() => onNext(), 1000);
    }
  };

  return (
    <div className={`relative bg-black group ${className}`} style={{ aspectRatio: '16/9' }}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        playsInline
      />

      {/* Quality Selector - Top Right */}
      <div className="absolute top-4 right-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
        <CastButton videoElement={videoRef.current} videoUrl={src} metadata={contentMetadata} />
        <QualitySelector
          currentQuality={currentQuality}
          onQualityChange={handleQualityChange}
          availableQualities={availableQualities}
          showBandwidthMonitor={true}
        />
      </div>

      <AdvancedPlayerControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        buffered={buffered}
        playbackSpeed={playbackSpeed}
        showSkipIntro={showSkipIntro}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleFullscreen={handleToggleFullscreen}
        onTogglePiP={handleTogglePiP}
        onSpeedChange={handleSpeedChange}
        onSkipIntro={handleSkipIntro}
        onRewind={handleRewind}
        onForward={handleForward}
        onNext={onNext}
        onPrev={onPrev}
        hasNext={!!onNext}
        hasPrev={!!onPrev}
      />

      {/* Watch Party Controls */}
      <WatchPartyControls videoRef={videoRef} videoUrl={src} videoMetadata={contentMetadata} />
    </div>
  );
};
