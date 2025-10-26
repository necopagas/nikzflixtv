// src/components/IPTVPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { MediaPlayer } from 'dashjs';
import { PiArrowsOutSimple, PiArrowsInSimple, PiPictureInPicture, PiGear, PiX } from 'react-icons/pi';

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Fullscreen functions (no change) ---
  const enterFullscreen = () => {
    const elem = containerRef.current;
    if (elem?.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
    } else if (elem?.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem?.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);


  // --- Auto-show/hide controls (no change) ---
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

  // --- FIX: Ang cleanupPlayers stable na ---
  const cleanupPlayers = useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (dashRef.current) {
      if (typeof dashRef.current.destroy === 'function') dashRef.current.destroy();
      else if (typeof dashRef.current.reset === 'function') dashRef.current.reset();
      dashRef.current = null;
    }
    const video = videoRef.current;
    if (video) { video.removeAttribute('src'); video.load(); }
  }, []); // Empty dependency array, safe na

  // --- FIX: Ang initializePlayer stable na (tungod sa stable props) ---
  const initializePlayer = useCallback(() => {
    cleanupPlayers(); // Limpyo daan
    const video = videoRef.current;
    if (!video || !channel?.url) {
        onCanPlay?.();
        return;
    }

    const type = detectStreamType(channel.url);
    console.log(`Initializing ${type} player for ${channel.url}`);
    let statsIntervalId = null; // Ip-define ang interval ID diri

    try {
      if (type === 'hls') {
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current = hls;
          hls.loadSource(channel.url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log("HLS Manifest Parsed");
            setQualities([{ label: 'Auto', value: -1 }, ...hls.levels.map((l, i) => ({ label: `${l.height}p`, value: i }))]);
            video.play().catch((e) => console.warn("HLS Autoplay prevented", e));
            onCanPlay?.(); // Tawagon *human* ma-parse
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
             const level = hls.levels[data.level];
             setCurrentQuality(hls.autoLevelEnabled ? 'Auto' : `${level.height}p`);
             setBitrate(level?.bitrate || 0);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            // Gamiton ang 'channel.fallback' gikan sa dependency
            if (data.fatal && channel.fallback && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              console.warn(`HLS Network Error, attempting fallback: ${channel.fallback}`);
              // Tawagon ang 'onError' gikan sa dependency
              setTimeout(() => onError?.(channel.fallback), 3000); 
            } else if (data.fatal) {
                console.warn("HLS Fatal error, re-initializing player...");
                // Dili na nato i-call ang initializePlayer diri,
                // ang fallback logic na ang mo-handle sa pag-re-init
            }
          });

          const updateStats = () => {
            if(hlsRef.current) {
                setLatency(hlsRef.current.latency?.toFixed(1));
                const bufferInfo = Hls.BufferHelper.bufferInfo(video, video.currentTime, 0.5);
                setBufferHealth(bufferInfo.len?.toFixed(1));
            }
          };
          statsIntervalId = setInterval(updateStats, 1000); // I-assign ang ID

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log("Using Native HLS");
          video.src = channel.url;
          video.play().catch((e) => console.warn("Native HLS Autoplay prevented", e));
          video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
           video.addEventListener('error', () => {
               console.error("Native HLS Error");
               if (channel.fallback) {
                   console.warn(`Native HLS Error, attempting fallback: ${channel.fallback}`);
                   onError?.(channel.fallback);
               }
           });
        } else {
             console.error("HLS not supported");
             onCanPlay?.();
        }
      }
      else if (type === 'dash') {
        console.log("Initializing DASH Player");
        const player = MediaPlayer().create();
        dashRef.current = player;
        player.initialize(video, channel.url, true);

        player.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
            console.log("DASH Stream Initialized");
            onCanPlay?.();
        });
        player.on(MediaPlayer.events.ERROR, (e) => {
            console.error("DASH Error:", e);
            if (channel.fallback) {
                console.warn(`DASH Error, attempting fallback: ${channel.fallback}`);
                onError?.(channel.fallback);
            } else {
                 onCanPlay?.();
            }
        });
      }
      else if (type === 'progressive') {
        console.log("Initializing Progressive Player");
        video.src = channel.url;
        video.load();
        video.play().catch((e) => console.warn("Progressive Autoplay prevented", e));
        video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
        video.addEventListener('error', () => {
            console.error("Progressive Playback Error");
            if (channel.fallback) {
                 console.warn(`Progressive Error, attempting fallback: ${channel.fallback}`);
                 onError?.(channel.fallback);
            } else {
                 onCanPlay?.();
            }
        });
      }
       else {
           console.error("Unsupported stream type");
           onCanPlay?.();
       }

    } catch (err) {
      console.error('Player initialization failed:', err);
      onCanPlay?.();
    }
    
    // I-return ang cleanup function para sa stats interval
    return () => {
        if (statsIntervalId) {
            clearInterval(statsIntervalId);
        }
    };
  // Karon, ang dependencies ani kay stable na gikan sa parent
  }, [channel, cleanupPlayers, onCanPlay, onError]);


  // --- FIX: GI-ILISAN ANG MAIN useEffect ---
  // Kini nga hook ang mo-handle sa pagtawag sa initializePlayer
  // ug sa pag-cleanup
  useEffect(() => {
    if (channel?.url) {
      setIsSwitching(true);

      let statsIntervalCleanup = null;
      let switchingTimeout = null;

      // Delay gamay ang initialization
      const initTimeout = setTimeout(() => {
        statsIntervalCleanup = initializePlayer(); // Modagan ang initializer

        // Delay ang pagtago sa spinner
        switchingTimeout = setTimeout(() => {
          setIsSwitching(false);
        }, 300);

      }, 50); // 50ms delay

      // Kini ang cleanup function para sa useEffect
      return () => {
        clearTimeout(initTimeout); // I-cancel ang init kung mo-change dayon
        if (switchingTimeout) {
            clearTimeout(switchingTimeout); // I-cancel ang spinner timeout
        }
        if (typeof statsIntervalCleanup === 'function') {
          statsIntervalCleanup(); // Limpyohon ang stats interval
        }
        cleanupPlayers(); // KINI ANG PINAKA-IMPORTANTE: Limpyohon ang player
      };
    } else {
      // Kung walay URL, limpyo lang
      cleanupPlayers();
      setIsSwitching(false);
      onCanPlay?.();
    }
  // Ang dependency kay 'channel' (ang tibuok object) ug ang stable initializers/callbacks
  }, [channel, initializePlayer, cleanupPlayers, onCanPlay]);


  // --- GITANGGAL ANG DAAN NGA `useEffect[channel?.url]` para sa stats kay redundant na ---

  // Cleanup on unmount (importante gihapon)
  useEffect(() => {
      return cleanupPlayers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Modagan ra ni kausa


  const switchQuality = (level) => {
    if (hlsRef.current) {
        console.log(`Switching HLS quality to level: ${level}`);
        hlsRef.current.currentLevel = parseInt(level, 10);
        setCurrentQuality(level === -1 ? 'Auto' : qualities.find(q => q.value === level)?.label || '...');
    }
    setShowQualityMenu(false);
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden aspect-video group">
      {(parentLoading || isSwitching) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 pointer-events-none">
          <div className="w-12 h-12 border-4 border-t-[var(--brand-color)] border-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full block"
        playsInline
        autoPlay
        controls // Keep default controls
      />

      {/* --- CUSTOM OVERLAY CONTROLS (walay pagbag-o) --- */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-end text-white z-10">
          <div className="flex gap-2">
            <button onClick={() => setShowStats(s => !s)} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors" title="Show/Hide Stats">
              <PiGear className="w-5 h-5" />
            </button>
             {document.pictureInPictureEnabled && videoRef.current && !videoRef.current.disablePictureInPicture && (
                <button onClick={() => videoRef.current?.requestPictureInPicture().catch(e => console.error("PiP Error:", e))} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors" title="Picture-in-Picture">
                  <PiPictureInPicture className="w-5 h-5" />
                </button>
             )}
             <button onClick={toggleFullscreen} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                {isFullscreen ? <PiArrowsInSimple className="w-5 h-5" /> : <PiArrowsOutSimple className="w-5 h-5" />}
             </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg truncate max-w-[calc(100%-150px)]">
              {channel?.number ? `#${channel.number} ` : ''}{channel?.name || 'No Channel Selected'}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {latency !== null && !isNaN(latency) && (
                <span className={`text-xs px-2 py-1 rounded ${latency < 5 ? 'bg-green-600' : latency < 15 ? 'bg-orange-600' : 'bg-red-600'}`}>
                  {latency < 5 ? 'LIVE' : `Delay: ${latency}s`}
                </span>
              )}
              {qualities.length > 1 && (
                <button onClick={() => setShowQualityMenu(s => !s)} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">
                  {currentQuality} <i className={`fas fa-chevron-${showQualityMenu ? 'down' : 'up'} ml-1 text-xs`}></i>
                </button>
              )}
            </div>
          </div>

          {/* Quality Menu Popup */}
          {showQualityMenu && qualities.length > 1 && (
            <div className="absolute bottom-14 right-3 bg-black/90 rounded-lg p-2 min-w-[120px] max-h-48 overflow-y-auto z-50">
              {qualities.map(q => (
                <button
                    key={q.value}
                    onClick={() => switchQuality(q.value)}
                    className={`block w-full text-left px-3 py-2 rounded hover:bg-white/20 text-sm transition-colors ${
                       (currentQuality === q.label && q.label !== 'Auto') || (currentQuality === 'Auto' && q.value === -1) ? 'text-[var(--brand-color)] font-bold' : ''
                    }`}
                 >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Overlay */}
      {showStats && (
        <div className="absolute top-4 left-4 bg-black/80 text-green-400 text-xs p-3 rounded font-mono space-y-1 z-20">
          <p>Buffer: {bufferHealth !== null && !isNaN(bufferHealth) ? `${bufferHealth}s` : 'N/A'}</p>
          <p>Bitrate: {bitrate > 0 ? `${(bitrate/1000).toFixed(0)} kbps` : 'N/A'}</p>
          <p>Latency: {latency !== null && !isNaN(latency) ? `${latency}s` : 'N/A'}</p>
          <button onClick={() => setShowStats(false)} className="absolute top-1 right-1 text-white hover:text-red-500"><PiX className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};