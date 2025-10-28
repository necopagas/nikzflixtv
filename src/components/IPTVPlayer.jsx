// src/components/IPTVPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { MediaPlayer } from 'dashjs';
import { PiArrowsOutSimple, PiArrowsInSimple, PiPictureInPicture, PiGear, PiX } from 'react-icons/pi';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaBackward, FaForward, FaClosedCaptioning } from 'react-icons/fa';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

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
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  // detect mobile breakpoint for compact controls
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

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

  // Keyboard shortcuts: space (play/pause), left/right (seek), up/down (volume), m (mute), f (fullscreen), c (captions)
  // Control helpers must be declared before the keyboard useEffect to avoid TDZ errors
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleMute = () => setMuted((m) => !m);

  const seek = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min((video.duration || 0), video.currentTime + seconds));
  };

  const toggleCaptions = () => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks || [];
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = captionsEnabled ? 'disabled' : 'showing';
    }
    setCaptionsEnabled((c) => !c);
  };
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onKey = (e) => {
      // ignore if focused on input elements
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seek(-5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seek(5);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume(v => Math.min(1, +(v + 0.05).toFixed(2)));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume(v => Math.max(0, +(v - 0.05).toFixed(2)));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        toggleCaptions();
      }
    };
    container.addEventListener('keydown', onKey);
    // make container focusable
    container.tabIndex = container.tabIndex ?? 0;
    return () => container.removeEventListener('keydown', onKey);
  }, [togglePlay, seek, toggleMute, toggleFullscreen, toggleCaptions]);


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
  // (control helpers moved earlier to avoid TDZ issues)

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

      {/* --- CUSTOM OVERLAY CONTROLS (accessibility + mobile compact controls) --- */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-end text-white z-10">
          <div className="flex gap-2">
            <button onClick={() => setShowStats(s => !s)} aria-pressed={showStats} aria-label={showStats ? 'Hide stats' : 'Show stats'} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" title="Show/Hide Stats">
              <PiGear className="w-5 h-5" />
            </button>
             {document.pictureInPictureEnabled && videoRef.current && !videoRef.current.disablePictureInPicture && (
                <button onClick={() => videoRef.current?.requestPictureInPicture().catch(e => console.error("PiP Error:", e))} aria-label="Picture in Picture" className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" title="Picture-in-Picture">
                  <PiPictureInPicture className="w-5 h-5" />
                </button>
             )}
             <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                {isFullscreen ? <PiArrowsInSimple className="w-5 h-5" /> : <PiArrowsOutSimple className="w-5 h-5" />}
             </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => seek(-10)} aria-label="Rewind 10 seconds" className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" title="Rewind 10s"><FaBackward /></button>
              <button onClick={togglePlay} aria-pressed={isPlaying} aria-label={isPlaying ? 'Pause' : 'Play'} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button onClick={() => seek(10)} aria-label="Forward 10 seconds" className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" title="Forward 10s"><FaForward /></button>

              <div className="flex items-center gap-2 ml-2">
                <button onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Unmute' : 'Mute'} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" title={muted ? 'Unmute' : 'Mute'}>
                  {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" />
              </div>

              <h3 className="font-bold text-lg truncate max-w-[calc(100%-150px)]" aria-live="polite">
                {channel?.number ? `#${channel.number} ` : ''}{channel?.name || 'No Channel Selected'}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {latency !== null && !isNaN(latency) && (
                <span className={`text-xs px-2 py-1 rounded ${latency < 5 ? 'bg-green-600' : latency < 15 ? 'bg-orange-600' : 'bg-red-600'}`}>
                  {latency < 5 ? 'LIVE' : `Delay: ${latency}s`}
                </span>
              )}
              {qualities.length > 1 && (
                <button onClick={() => setShowQualityMenu(s => !s)} aria-expanded={showQualityMenu} aria-haspopup="menu" aria-label={`Quality ${currentQuality}`} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]">
                  {currentQuality} <span className="ml-1 text-xs">{showQualityMenu ? '▾' : '▴'}</span>
                </button>
              )}
              <div className="relative">
                <button onClick={() => setShowSpeedMenu(s => !s)} aria-expanded={showSpeedMenu} aria-haspopup="menu" aria-label={`Playback speed ${playbackRate}x`} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]">{playbackRate}x</button>
                {showSpeedMenu && (
                  <div className="absolute right-0 bottom-10 bg-black/90 rounded p-2">
                    {[0.5,0.75,1,1.25,1.5,2].map(rate => (
                      <button key={rate} onClick={() => { setPlaybackRate(rate); setShowSpeedMenu(false); }} className={`block w-full text-left px-3 py-1 text-sm hover:bg-white/20 ${playbackRate === rate ? 'text-[var(--brand-color)] font-bold' : ''}`}>{rate}x</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={toggleCaptions} aria-pressed={captionsEnabled} aria-label={captionsEnabled ? 'Disable captions' : 'Enable captions'} className={`p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] ${captionsEnabled ? 'text-[var(--brand-color)]' : ''}`} title="Toggle Captions"><FaClosedCaptioning /></button>
            </div>
          </div>

          {/* Quality Menu Popup */}
          {showQualityMenu && qualities.length > 1 && (
            <div className="absolute bottom-14 right-3 bg-black/90 rounded-lg p-2 min-w-[120px] max-h-48 overflow-y-auto z-50" role="menu" aria-label="Quality options">
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

      {/* Compact mobile control bar */}
      {isMobile && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-30 bg-black/60 rounded-full px-3 py-2 flex items-center gap-3 backdrop-blur-md">
          <button onClick={() => seek(-10)} aria-label="Rewind 10 seconds" className="p-2 rounded-full bg-black/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"><FaBackward /></button>
          <button onClick={togglePlay} aria-pressed={isPlaying} aria-label={isPlaying ? 'Pause' : 'Play'} className="p-3 rounded-full bg-[var(--brand-color)] text-black focus:outline-none focus:ring-2 focus:ring-white">{isPlaying ? <FaPause /> : <FaPlay />}</button>
          <button onClick={() => seek(10)} aria-label="Forward 10 seconds" className="p-2 rounded-full bg-black/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"><FaForward /></button>
          <button onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Unmute' : 'Mute'} className="p-2 rounded-full bg-black/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]">{muted ? <FaVolumeMute /> : <FaVolumeUp />}</button>
          <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} className="p-2 rounded-full bg-black/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"><PiArrowsOutSimple className="w-5 h-5" /></button>
        </div>
      )}

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