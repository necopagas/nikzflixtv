// src/components/IPTVPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { MediaPlayer } from 'dashjs';
// --- GIDUGANG ANG FULLSCREEN ICONS ---
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
  const containerRef = useRef(null); // Reference para sa whole player container

  const [showControls, setShowControls] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const [latency, setLatency] = useState(null);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [bitrate, setBitrate] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  // --- STATE PARA SA FULLSCREEN ---
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- FULLSCREEN FUNCTIONS ---
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

  // --- EFFECT PARA MO-UPDATE SA FULLSCREEN STATE KUNG MAG-CHANGE (e.g., press Esc) ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Para sa Safari

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);


  // --- Auto-show/hide controls (unchanged) ---
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
      // Ensure initial state shows controls briefly
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
    if (!video || !channel?.url) {
        onCanPlay?.(); // Ensure loading hides if no URL
        return;
    }

    const type = detectStreamType(channel.url);
    console.log(`Initializing ${type} player for ${channel.url}`);

    try {
      // --- HLS Initialization ---
      if (type === 'hls') {
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current = hls;
          hls.loadSource(channel.url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log("HLS Manifest Parsed");
            setQualities([{ label: 'Auto', value: -1 }, ...hls.levels.map((l, i) => ({ label: `${l.height}p`, value: i }))]);
            video.play().catch((e) => console.warn("HLS Autoplay prevented", e)); // Try to play
            onCanPlay?.(); // Assume ready after manifest parse
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
             const level = hls.levels[data.level];
             setCurrentQuality(hls.autoLevelEnabled ? 'Auto' : `${level.height}p`);
             setBitrate(level?.bitrate || 0);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (data.fatal && channel.fallback && data.type === Hls.ErrorTypes.NETWORK_ERROR) { // Only fallback on network errors initially
              console.warn(`HLS Network Error, attempting fallback: ${channel.fallback}`);
              setTimeout(() => onError?.(channel.fallback), 3000); // Trigger fallback after delay
            } else if (data.fatal) {
                // For other fatal errors, maybe just try re-initializing?
                console.warn("HLS Fatal error, re-initializing player...");
                setTimeout(initializePlayer, 5000);
            }
          });

          // Stats interval
          const updateStats = () => {
            // Check if hls instance still exists
            if(hlsRef.current) {
                setLatency(hlsRef.current.latency?.toFixed(1));
                // Use bufferInfo for more accurate buffer length
                const bufferInfo = Hls.BufferHelper.bufferInfo(video, video.currentTime, 0.5);
                setBufferHealth(bufferInfo.len?.toFixed(1));
            }
          };
          const intervalId = setInterval(updateStats, 1000);
          // Return cleanup for this interval
           return () => clearInterval(intervalId);

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) { // Native HLS
          console.log("Using Native HLS");
          video.src = channel.url;
          video.play().catch((e) => console.warn("Native HLS Autoplay prevented", e));
          video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
           video.addEventListener('error', () => { // Handle native errors
               console.error("Native HLS Error");
               if (channel.fallback) {
                   console.warn(`Native HLS Error, attempting fallback: ${channel.fallback}`);
                   onError?.(channel.fallback);
               }
           });
        } else {
             console.error("HLS not supported");
             onCanPlay?.(); // Hide loading even if unsupported
        }
      }
      // --- DASH Initialization ---
      else if (type === 'dash') {
        console.log("Initializing DASH Player");
        const player = MediaPlayer().create();
        dashRef.current = player;
        player.initialize(video, channel.url, true); // Autoplay true

        player.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
            console.log("DASH Stream Initialized");
            onCanPlay?.();
            // TODO: Populate qualities for DASH if needed (player.getBitrateInfoListFor('video'))
        });
        player.on(MediaPlayer.events.ERROR, (e) => {
            console.error("DASH Error:", e);
            if (channel.fallback) {
                console.warn(`DASH Error, attempting fallback: ${channel.fallback}`);
                onError?.(channel.fallback);
            } else {
                 onCanPlay?.(); // Hide loading on error if no fallback
            }
        });
         // TODO: Add DASH stats listeners if needed (player.getDashMetrics())
      }
      // --- Progressive/Direct File Initialization ---
      else if (type === 'progressive') {
        console.log("Initializing Progressive Player");
        video.src = channel.url;
        video.load(); // Explicitly load
        video.play().catch((e) => console.warn("Progressive Autoplay prevented", e));
        video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
        video.addEventListener('error', () => { // Handle errors
            console.error("Progressive Playback Error");
            if (channel.fallback) {
                 console.warn(`Progressive Error, attempting fallback: ${channel.fallback}`);
                 onError?.(channel.fallback);
            } else {
                 onCanPlay?.();
            }
        });
      }
      // --- Unsupported ---
       else {
           console.error("Unsupported stream type");
           onCanPlay?.(); // Hide loading
       }

    } catch (err) {
      console.error('Player initialization failed:', err);
      onCanPlay?.(); // Hide loading on failure
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, cleanupPlayers, onCanPlay, onError]); // Dependencies updated

  useEffect(() => {
    let intervalId;
    if (hlsRef.current) {
        // HLS stats update logic moved inside initializePlayer's HLS block
    } else if (dashRef.current) {
      // Setup DASH stats interval if needed
      // intervalId = setInterval(() => { /* get DASH stats */ }, 1000);
    }
    return () => clearInterval(intervalId); // Cleanup interval
  }, [channel?.url]); // Re-run stats interval setup if URL changes

  useEffect(() => {
    // Effect to handle initialization on mount and URL change
    if (channel?.url) {
      setIsSwitching(true);
      // Short delay before initializing to allow UI update
      const initTimeout = setTimeout(() => {
        const clearStatsInterval = initializePlayer(); // initializePlayer now returns the cleanup function for its interval
        const switchingTimeout = setTimeout(() => setIsSwitching(false), 300); // Delay hiding spinner slightly

        // Return a combined cleanup function
        return () => {
            clearTimeout(initTimeout);
            clearTimeout(switchingTimeout);
            if(typeof clearStatsInterval === 'function') {
                 clearStatsInterval(); // Clean up HLS stats interval
            }
            cleanupPlayers(); // Clean up players on URL change or unmount
        };
      }, 50); // Small delay before init
       return () => clearTimeout(initTimeout); // Clear init timeout if component unmounts quickly
    } else {
         cleanupPlayers(); // Cleanup if URL becomes null
         setIsSwitching(false);
         onCanPlay?.(); // Ensure loading is hidden
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.url]); // Depend only on URL string

  // Cleanup on unmount
  useEffect(() => {
      return cleanupPlayers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on unmount


  const switchQuality = (level) => {
    if (hlsRef.current) {
        console.log(`Switching HLS quality to level: ${level}`);
        hlsRef.current.currentLevel = parseInt(level, 10); // Ensure it's a number
        // Update state immediately for feedback, LEVEL_SWITCHED might take time
        setCurrentQuality(level === -1 ? 'Auto' : qualities.find(q => q.value === level)?.label || '...');
    }
    // TODO: Add DASH quality switching (player.setQualityFor('video', levelIndex))
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
        controls // Keep default controls as a fallback/alternative
      />

      {/* --- CUSTOM OVERLAY CONTROLS --- */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-end text-white z-10">
          <div className="flex gap-2">
            <button onClick={() => setShowStats(s => !s)} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors" title="Show/Hide Stats">
              <PiGear className="w-5 h-5" />
            </button>
            {/* Picture in Picture Button */}
             {document.pictureInPictureEnabled && videoRef.current && !videoRef.current.disablePictureInPicture && (
                <button onClick={() => videoRef.current?.requestPictureInPicture().catch(e => console.error("PiP Error:", e))} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors" title="Picture-in-Picture">
                  <PiPictureInPicture className="w-5 h-5" />
                </button>
             )}
             {/* --- GIDUGANG NGA FULLSCREEN BUTTON --- */}
             <button onClick={toggleFullscreen} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                {isFullscreen ? <PiArrowsInSimple className="w-5 h-5" /> : <PiArrowsOutSimple className="w-5 h-5" />}
             </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg truncate max-w-[calc(100%-150px)]"> {/* Limit width */}
              {channel?.number ? `#${channel.number} ` : ''}{channel?.name || 'No Channel Selected'}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0"> {/* Prevent shrinking */}
              {latency !== null && !isNaN(latency) && ( // Check if latency is a valid number
                <span className={`text-xs px-2 py-1 rounded ${latency < 5 ? 'bg-green-600' : latency < 15 ? 'bg-orange-600' : 'bg-red-600'}`}>
                  {latency < 5 ? 'LIVE' : `Delay: ${latency}s`}
                </span>
              )}
              {/* Quality Selector Button */}
              {qualities.length > 1 && ( // Only show if multiple qualities exist
                <button onClick={() => setShowQualityMenu(s => !s)} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">
                  {currentQuality} <i className={`fas fa-chevron-${showQualityMenu ? 'down' : 'up'} ml-1 text-xs`}></i>
                </button>
              )}
            </div>
          </div> {/* <-- THIS IS THE MISSING CLOSING DIV */}

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
