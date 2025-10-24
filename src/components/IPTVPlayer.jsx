// src/components/IPTVPlayer.jsx
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
// --- GI-USAB ANG IMPORT ---
import { MediaPlayer } from 'dashjs';

export const IPTVPlayer = ({ url, isLoading, onCanPlay }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const dashRef = useRef(null);

  useEffect(() => {
    if (!url || !videoRef.current) return;

    const video = videoRef.current;

    const cleanupPlayers = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (dashRef.current) {
        // dashjs v4+ uses destroy(). For older versions, use reset().
        // Check if destroy exists, otherwise use reset.
        if (typeof dashRef.current.destroy === 'function') {
            dashRef.current.destroy();
        } else if (typeof dashRef.current.reset === 'function') {
            dashRef.current.reset(); // Fallback for older dashjs versions if needed
        }
        dashRef.current = null;
      }
      video.removeAttribute('src'); // Use removeAttribute for better cleanup
      video.load(); // Helps reset the video element state
    };

    cleanupPlayers();

    // --- FUNCTION PARA SA INIT (para dali tawagon og usab kung naay error) ---
    const initializePlayer = () => {
        cleanupPlayers(); // Limpyo usa
        try { // Ibutang sa try...catch para ma-handle ang potential errors sa initialization

            // Check kung HLS (.m3u8)
            if (url.includes('.m3u8')) {
                if (Hls.isSupported()) {
                    const hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                    });
                    hlsRef.current = hls;

                    hls.loadSource(url);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        video.play().catch(error => console.warn("HLS Autoplay prevented:", error));
                        if (onCanPlay) onCanPlay();
                    });

                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error('HLS.js Error:', data.type, data.details, data.fatal);
                         if (data.fatal) {
                           switch(data.type) {
                             case Hls.ErrorTypes.NETWORK_ERROR:
                               console.warn('HLS Fatal network error, trying to recover...');
                               hls.startLoad();
                               break;
                             case Hls.ErrorTypes.MEDIA_ERROR:
                               console.warn('HLS Fatal media error, trying to recover...');
                               hls.recoverMediaError();
                               break;
                             default:
                               console.error('Unrecoverable HLS error, attempting to reinitialize...');
                               setTimeout(initializePlayer, 5000); // Try re-init after 5s
                               break;
                           }
                         } else {
                           // Handle non-fatal errors if needed
                         }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = url;
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                         playPromise.catch(error => console.warn("Native HLS Autoplay prevented:", error));
                    }
                    // Use 'canplay' event for native HLS as 'loadedmetadata' might fire too early
                    video.addEventListener('canplay', () => {
                        if (onCanPlay) onCanPlay();
                    }, { once: true }); // Use { once: true } para kausa ra mo-fire
                    video.addEventListener('error', (e) => console.error('Native HLS Error:', e));
                } else {
                    console.error("HLS is not supported on this browser.");
                    if (onCanPlay) onCanPlay();
                }
            }
            // Check kung DASH (.mpd)
            else if (url.includes('.mpd')) {
                // --- GI-USAB ANG PAG-CREATE SA PLAYER ---
                const player = MediaPlayer().create();
                dashRef.current = player;
                /*
                Optional: Add configuration before initialize
                player.updateSettings({
                    'streaming': {
                        'lowLatencyEnabled': true, // Example setting
                        'abr': {
                           'useDefaultABRRules': true,
                           'ABRStrategy': 'abrThroughput' // Example setting
                        }
                    }
                });
                */
                player.initialize(video, url, true); // true for autoplay

                player.on(dashjs.MediaPlayer.events.ERROR, (e) => {
                    console.error('DashJS Error code', e.error?.code, ':', e.error?.message);
                    if (onCanPlay) onCanPlay(); // Hide loading indicator on error
                    // Optional: Attempt to reinitialize on specific errors after a delay
                    // setTimeout(initializePlayer, 5000);
                });

                player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
                    console.log('DASH Stream Initialized');
                    // We call onCanPlay here because autoplay is true in initialize
                    if (onCanPlay) onCanPlay();
                });

                 // Listen for playback started to be sure (optional)
                 player.on(dashjs.MediaPlayer.events.PLAYBACK_PLAYING, () => {
                     console.log('DASH Playback playing');
                     // Might call onCanPlay here if not called on STREAM_INITIALIZED
                     // if (onCanPlay) onCanPlay();
                 });

            } else {
                console.error("Unsupported stream type:", url);
                if (onCanPlay) onCanPlay();
            }
        } catch (error) {
             console.error("Error initializing player:", error);
             if (onCanPlay) onCanPlay(); // Hide loading on initialization error
        }
    };

    initializePlayer(); // Tawagon ang function para magsugod

    // Cleanup function remains the same
    return () => {
      cleanupPlayers();
      // Remove native HLS listeners if added directly to video element
       if (videoRef.current) {
            // videoRef.current.removeEventListener('canplay', yourCanPlayHandler);
            // videoRef.current.removeEventListener('error', yourErrorHandler);
       }
    };
  }, [url, onCanPlay]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
          <div className="player-loading"></div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full block"
        controls
        playsInline
        autoPlay // Keep attempting autoplay
        muted    // Important for autoplay
      />
    </div>
  );
};