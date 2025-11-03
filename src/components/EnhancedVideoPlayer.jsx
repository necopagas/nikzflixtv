// src/components/EnhancedVideoPlayer.jsx
import React, { useRef, useState, useEffect } from 'react';
import { AdvancedPlayerControls } from './AdvancedPlayerControls';
import { IntroSkipper, PlaybackSpeedController, WatchProgressTracker } from '../utils/videoPlayerUtils';

export const EnhancedVideoPlayer = ({
    src,
    onEnded,
    onNext,
    onPrev,
    episodeId,
    autoplay = true,
    className = ''
}) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [buffered, setBuffered] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSkipIntro, setShowSkipIntro] = useState(false);

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

    // Track progress
    useEffect(() => {
        const interval = setInterval(() => {
            if (videoRef.current && episodeId && !videoRef.current.paused) {
                progressTracker.saveProgress(episodeId, videoRef.current.currentTime, videoRef.current.duration);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [episodeId, progressTracker]);

    // Handle intro/outro skipping
    useEffect(() => {
        if (!videoRef.current) return;

        const autoSkipIntro = localStorage.getItem('autoSkipIntro') === 'true';
        const skipIntroTime = parseInt(localStorage.getItem('skipIntroTime') || '90');

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

    const handleSeek = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (newVolume) => {
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

    const handleSpeedChange = (speed) => {
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
            videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
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
        </div>
    );
};
