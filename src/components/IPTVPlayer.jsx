// src/components/IPTVPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { MediaPlayer } from 'dashjs';
import {
    PiPictureInPicture, PiGear, PiX, PiPlay, PiPause,
    PiSpeakerSimpleHigh, PiSpeakerSimpleSlash, PiArrowsOutSimple
} from 'react-icons/pi';

const detectStreamType = (url) => {
    if (!url) return 'unknown';
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mpd')) return 'dash';
    if (/\.(mp4|webm|ogg)$/i.test(url)) return 'progressive';
    
    // --- GI-MENTAIN NGA FIX ---
    // Kung unknown siya pero valid URL, i-assume nato nga HLS.
    // Kini para mo-handle sa mga IP:PORT nga stream.
    if (url.startsWith('http')) {
        return 'hls';
    }
    // --- END SA FIX ---

    return 'unknown';
};

export const IPTVPlayer = ({ channel, isLoading: parentLoading, onCanPlay, onError }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const dashRef = useRef(null);
    const containerRef = useRef(null);

    const [showControls, setShowControls] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState('Auto');
    const [latency, setLatency] = useState(null);
    const [bufferHealth, setBufferHealth] = useState(0);
    const [bitrate, setBitrate] = useState(0);
    const [isSwitching, setIsSwitching] = useState(false);

    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(1);

    // Auto-show/hide controls
    useEffect(() => {
        let timer;
        const container = containerRef.current;
        const resetTimer = () => {
            setShowControls(true);
            clearTimeout(timer);
            timer = setTimeout(() => setShowControls(false), 4000);
        };
        if (container) {
            container.addEventListener('mousemove', resetTimer);
            container.addEventListener('touchstart', resetTimer);
            resetTimer();
        }
        return () => {
            if (container) {
                container.removeEventListener('mousemove', resetTimer);
                container.removeEventListener('touchstart', resetTimer);
            }
            clearTimeout(timer);
        };
    }, []);

    // SYNC SA VIDEO STATE
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => {
            setIsMuted(video.muted);
            setVolume(video.volume);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('volumechange', handleVolumeChange);

        setIsPlaying(!video.paused);
        setIsMuted(video.muted);
        setVolume(video.volume);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('volumechange', handleVolumeChange);
        };
    }, [videoRef.current]);

    const cleanupPlayers = useCallback(() => {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        if (dashRef.current) {
            if (typeof dashRef.current.destroy === 'function') dashRef.current.destroy();
            else if (typeof dashRef.current.reset === 'function') dashRef.current.reset();
            dashRef.current = null;
        }
        const video = videoRef.current;
        if (video) { video.removeAttribute('src'); video.load(); }
    }, []);

    const initializePlayer = useCallback(() => {
        cleanupPlayers();
        const video = videoRef.current;
        if (!video || !channel?.url) return;

        video.muted = isMuted;

        // --- GIBALIK SA DATI (WALAY PROXY) ---
        const originalUrl = channel.url;
        const type = detectStreamType(originalUrl);

        try {
            // --- GI-UPDATE: I-apil ang 'unknown' sa HLS try ---
            if (type === 'hls' || type === 'unknown') {
                if (Hls.isSupported()) {
                    const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                    hlsRef.current = hls;
                    // --- Gamiton ang originalUrl ---
                    hls.loadSource(originalUrl);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        setQualities([{ label: 'Auto', value: -1 }, ...hls.levels.map((l, i) => ({ label: `${l.height}p`, value: i }))]);
                        video.play().catch(() => {});
                        onCanPlay?.();
                    });

                    hls.on(Hls.Events.LEVEL_SWITCHED, () => {
                        const level = hls.levels[hls.currentLevel];
                        setCurrentQuality(hls.currentLevel === -1 ? 'Auto' : `${level.height}p`);
                        setBitrate(level?.bitrate || 0);
                    });

                    hls.on(Hls.Events.ERROR, (e, data) => {
                        // --- Ang HLS mo-throw ug error tungod sa CORS, unya mo-trigger ni sa fallback ---
                        if (data.fatal && channel.fallback) {
                            setTimeout(() => onError?.(channel.fallback), 3000);
                        }
                    });

                    const updateStats = () => {
                        setLatency(hls.latency?.toFixed(1));
                        setBufferHealth(hls.bufferLength?.toFixed(1));
                    };
                    const interval = setInterval(updateStats, 1000);
                    return () => clearInterval(interval);

                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // --- Gamiton ang originalUrl ---
                    video.src = originalUrl;
                    video.play().catch(() => {});
                    video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
                }
            }
            else if (type === 'dash') {
                const player = MediaPlayer().create();
                dashRef.current = player;
                // --- Gamiton ang originalUrl ---
                player.initialize(video, originalUrl, true);
                player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => onCanPlay?.());
                player.on(dashjs.MediaPlayer.events.ERROR, () => channel.fallback && onError?.(channel.fallback));
            }
            else if (type === 'progressive') {
                // --- Gamiton ang originalUrl ---
                video.src = originalUrl;
                video.load();
                video.play().catch(() => {});
                video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
            }
        } catch (err) {
            console.error('Player init error:', err);
            onCanPlay?.();
        }
    }, [channel, cleanupPlayers, onCanPlay, onError, isMuted]);

    useEffect(() => {
        if (channel?.url) {
            setIsSwitching(true);
            setTimeout(() => {
                initializePlayer();
                setTimeout(() => setIsSwitching(false), 300);
            }, 200);
        }
    }, [channel?.url, initializePlayer]);

    useEffect(() => () => cleanupPlayers(), [cleanupPlayers]);

    // --- PLAYER CONTROL FUNCTIONS ---
    const togglePlayPause = () => {
        const video = videoRef.current;
        if (video) {
            video.paused ? video.play() : video.pause();
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (video) {
            video.muted = !video.muted;
        }
    };

    const handleVolumeChange = (e) => {
        const video = videoRef.current;
        const newVolume = parseFloat(e.target.value);
        if (video) {
            video.volume = newVolume;
            video.muted = newVolume === 0;
        }
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (container) {
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => console.error(err));
            } else {
                document.exitFullscreen();
            }
        }
    };

    const switchQuality = (level) => {
        if (hlsRef.current) hlsRef.current.currentLevel = level;
        setShowQualityMenu(false);
    };

    return (
        <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden aspect-video group">
            {(parentLoading || isSwitching) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <div className="w-12 h-12 border-4 border-t-[var(--brand-color)] border-gray-600 rounded-full animate-spin"></div>
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-full"
                playsInline
                autoPlay
                muted
                onClick={togglePlayPause}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="absolute top-0 left-0 right-0 p-3 flex justify-between text-white">
                    <div>
                        {latency !== null && (
                            <span className={`text-xs px-2 py-1 rounded ${latency < 5 ? 'bg-green-600' : 'bg-orange-600'} font-bold`}>
                                {latency < 5 ? 'LIVE' : `${latency}s`}
                            </span>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 text-white space-y-2">
                    <h3 className="font-bold text-lg truncate max-w-[80%]">
                        #{channel?.number} {channel?.name}
                    </h3>

                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <button onClick={togglePlayPause} className="p-2 hover:bg-white/20 rounded-full">
                                {isPlaying ? <PiPause className="w-6 h-6" /> : <PiPlay className="w-6 h-6" />}
                            </button>
                            <div className="flex items-center gap-2 group/volume">
                                <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full">
                                    {isMuted ? <PiSpeakerSimpleSlash className="w-6 h-6" /> : <PiSpeakerSimpleHigh className="w-6 h-6" />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-0 group-hover/volume:w-24 transition-all duration-300 accent-[var(--brand-color)]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowStats(s => !s)} className="p-2 hover:bg-white/20 rounded-full" title="Show Stats">
                                <PiGear className="w-5 h-5" />
                            </button>
                            <div className="relative">
                                <button onClick={() => setShowQualityMenu(s => !s)} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-semibold">
                                    {currentQuality}
                                </button>
                                {showQualityMenu && (
                                    <div className="absolute bottom-12 right-0 bg-black/90 rounded-lg p-2 min-w-[120px] z-50">
                                        {qualities.map(q => (
                                            <button key={q.value} onClick={() => switchQuality(q.value)} className={`block w-full text-left px-3 py-2 rounded hover:bg-white/20 text-sm ${currentQuality === q.label ? 'text-[var(--brand-color)] font-bold' : ''}`}>
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => videoRef.current?.requestPictureInPicture()} className="p-2 hover:bg-white/20 rounded-full" title="Picture-in-Picture">
                                <PiPictureInPicture className="w-5 h-5" />
                            </button>
                            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full" title="Fullscreen">
                                <PiArrowsOutSimple className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showStats && (
                <div className="absolute top-12 left-4 bg-black/80 text-green-400 text-xs p-3 rounded font-mono space-y-1 z-30">
                    <p>Buffer: {bufferHealth}s</p>
                    <p>Bitrate: {bitrate > 0 ? (bitrate / 1000).toFixed(0) : '?'} kbps</p>
                    <p>Latency: {latency !== null ? `${latency}s` : 'N/A'}</p>
                    <button onClick={() => setShowStats(false)} className="absolute top-1 right-1 text-white"><PiX className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};