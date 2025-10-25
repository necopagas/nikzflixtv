// src/components/IPTVPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { MediaPlayer } from 'dashjs';
import { PiPictureInPicture, PiGear, PiX } from 'react-icons/pi';

const detectStreamType = (url) => {
  if (!url) return 'unknown';
  if (url.includes('.m3u8')) return 'hls';
  if (url.includes('.mpd')) return 'dash';
  if (/\.(mp4|webm|ogg)$/i.test(url)) return 'progressive';
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

  // Auto-show/hide controls
  useEffect(() => {
    let timer;
    const reset = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowControls(false), 4000);
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', reset);
      container.addEventListener('touchstart', reset);
      reset();
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', reset);
        container.removeEventListener('touchstart', reset);
      }
      clearTimeout(timer);
    };
  }, []);

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

    const type = detectStreamType(channel.url);

    try {
      if (type === 'hls') {
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current = hls;
          hls.loadSource(channel.url);
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
          video.src = channel.url;
          video.play().catch(() => {});
          video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
        }
      }

      else if (type === 'dash') {
        const player = MediaPlayer().create();
        dashRef.current = player;
        player.initialize(video, channel.url, true);
        player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => onCanPlay?.());
        player.on(dashjs.MediaPlayer.events.ERROR, () => channel.fallback && onError?.(channel.fallback));
      }

      else if (type === 'progressive') {
        video.src = channel.url;
        video.load();
        video.play().catch(() => {});
        video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
      }

    } catch (err) {
      console.error('Player init error:', err);
      onCanPlay?.();
    }
  }, [channel, cleanupPlayers, onCanPlay, onError]);

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

      <video ref={videoRef} className="w-full h-full" playsInline autoPlay muted />

      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-end text-white">
          <div className="flex gap-2">
            <button onClick={() => setShowStats(s => !s)} className="p-2 rounded-full bg-black/50 hover:bg-white/20">
              <PiGear className="w-5 h-5" />
            </button>
            <button onClick={() => videoRef.current?.requestPictureInPicture()} className="p-2 rounded-full bg-black/50 hover:bg-white/20">
              <PiPictureInPicture className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg truncate max-w-[70%]">#{channel?.number} {channel?.name}</h3>
            <div className="flex items-center gap-2">
              {latency !== null && (
                <span className={`text-xs px-2 py-1 rounded ${latency < 5 ? 'bg-green-600' : 'bg-orange-600'}`}>
                  {latency < 5 ? 'LIVE' : `${latency}s`}
                </span>
              )}
              <button onClick={() => setShowQualityMenu(s => !s)} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">
                {currentQuality}
              </button>
            </div>
          </div>

          {showQualityMenu && (
            <div className="absolute bottom-16 right-3 bg-black/90 rounded-lg p-2 min-w-[120px] z-50">
              {qualities.map(q => (
                <button key={q.value} onClick={() => switchQuality(q.value)} className={`block w-full text-left px-3 py-2 rounded hover:bg-white/20 text-sm ${currentQuality === q.label ? 'text-[var(--brand-color)] font-bold' : ''}`}>
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showStats && (
        <div className="absolute top-4 left-4 bg-black/80 text-green-400 text-xs p-3 rounded font-mono space-y-1">
          <p>Buffer: {bufferHealth}s</p>
          <p>Bitrate: {bitrate > 0 ? (bitrate/1000).toFixed(0) : '?'} kbps</p>
          <p>Latency: {latency !== null ? `${latency}s` : 'N/A'}</p>
          <button onClick={() => setShowStats(false)} className="absolute top-1 right-1"><PiX className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};