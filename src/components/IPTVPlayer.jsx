// src/components/IPTVPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { MediaPlayer } from 'dashjs';
import shaka from 'shaka-player/dist/shaka-player.compiled';
import { normalizeHeaders, buildDashRequestModifier, applyDashProtectionData, buildShakaDrmConfiguration } from '../utils/iptvDrm';
import { PiArrowsOutSimple, PiArrowsInSimple, PiPictureInPicture, PiGear, PiX } from 'react-icons/pi';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaBackward, FaForward, FaClosedCaptioning } from 'react-icons/fa';

const PROXY_PREFIX = '/api/proxy?url=';
const USE_PROXY = false; // Disable proxy for now due to CORS issues
const isProxiedUrl = (url = '') => typeof url === 'string' && url.includes(PROXY_PREFIX);
const buildProxyUrl = (url) => {
  if (!url || isProxiedUrl(url) || !USE_PROXY) return url;
  return `${PROXY_PREFIX}${encodeURIComponent(url)}`;
};
const extractOriginalUrl = (url, fallback = '') => {
  if (!isProxiedUrl(url)) return url || fallback;
  const idx = url.indexOf(PROXY_PREFIX);
  if (idx === -1) return fallback;
  const encoded = url.slice(idx + PROXY_PREFIX.length);
  try {
    return decodeURIComponent(encoded);
  } catch (error) {
    console.warn('[IPTV] Failed to decode proxied URL', error);
    return fallback;
  }
};


const HLS_HINTS = ['.m3u8', 'format=m3u8', 'format=hls', 'playlist.m3u', 'hls/', 'manifest.m3u8', 'output.m3u8'];
const DASH_HINTS = ['.mpd', 'manifest.mpd', 'format=mpd', 'dash/', 'manifest=mpd', '.ism/manifest', 'manifest.mpd?'];
const PROGRESSIVE_EXT = /\.(mp4|m4v|mov|webm|ogg|ogv|mkv|avi|ts)$/i;

const detectStreamType = (url) => {
  if (!url) return 'unknown';
  const normalized = url.toLowerCase();

  if (HLS_HINTS.some((hint) => normalized.includes(hint))) {
    return 'hls';
  }
  if (DASH_HINTS.some((hint) => normalized.includes(hint))) {
    return 'dash';
  }
  if (PROGRESSIVE_EXT.test(normalized)) {
    return 'progressive';
  }
  return 'unknown';
};

const resolveExplicitType = (channel = {}) => {
  const manual = channel.type || channel.streamType || channel.format || channel.protocol || channel.manifestType;
  if (!manual) return null;
  const value = String(manual).toLowerCase();
  if (['dash', 'mpd', 'mpeg-dash', 'dashjs', 'dash/shaka', 'dash_shaka'].includes(value)) return 'dash';
  if (['hls', 'm3u8', 'application/x-mpegurl', 'hls.js'].includes(value)) return 'hls';
  if (['progressive', 'mp4', 'file', 'direct'].includes(value)) return 'progressive';
  return null;
};

export const IPTVPlayer = ({ channel, isLoading: parentLoading, onCanPlay, onError }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const dashRef = useRef(null);
  const shakaRef = useRef(null);
  const containerRef = useRef(null);
  const playbackGuardRef = useRef(null);
  const playbackMonitorRef = useRef(null);
  const attemptedUrlsRef = useRef(new Set());
  const channelAttemptKeyRef = useRef(null);

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

  // Try autoplay, force mute on first failure to satisfy browser policies
  const attemptAutoplay = useCallback((videoElement) => {
    const target = videoElement || videoRef.current;
    if (!target) return Promise.resolve();

    return target.play().catch((err) => {
      if (!target.muted) {
        console.warn('[IPTV] Autoplay prevented, muting and retrying.', err);
        target.muted = true;
        setMuted(true);
        return target.play().catch((retryErr) => {
          console.warn('[IPTV] Autoplay failed even after muting.', retryErr);
          return Promise.reject(retryErr);
        });
      }
      return Promise.reject(err);
    });
  }, [setMuted]);

  // --- Fullscreen functions (no change) ---
  // fullscreen handled inline in toggleFullscreen

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!document.fullscreenElement && elem?.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

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
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const seek = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min((video.duration || 0), video.currentTime + seconds));
  }, []);

  const toggleCaptions = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks || [];
    // Toggle based on previous value
    setCaptionsEnabled((prev) => {
      const next = !prev;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = next ? 'showing' : 'disabled';
      }
      return next;
    });
  }, []);
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
    if (playbackGuardRef.current) {
      clearTimeout(playbackGuardRef.current);
      playbackGuardRef.current = null;
    }
    if (playbackMonitorRef.current) {
      try {
        playbackMonitorRef.current();
      } catch (error) {
        console.warn('[IPTV] playback monitor cleanup failed', error);
      }
      playbackMonitorRef.current = null;
    }
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (dashRef.current) {
      if (typeof dashRef.current.destroy === 'function') dashRef.current.destroy();
      else if (typeof dashRef.current.reset === 'function') dashRef.current.reset();
      dashRef.current = null;
    }
    if (shakaRef.current) {
      try {
        const destroyResult = shakaRef.current.destroy?.();
        if (destroyResult?.catch) {
          destroyResult.catch((error) => console.warn('[IPTV] Shaka destroy error', error));
        }
      } catch (error) {
        console.warn('[IPTV] Shaka destroy error', error);
      }
      shakaRef.current = null;
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

    const originalSourceUrl = channel?.originalUrl || extractOriginalUrl(channel.url, channel.url);
    const channelAttemptKey = channel
      ? `${channel?.name || 'unknown'}::${channel?.number || ''}::${originalSourceUrl}`
      : null;

    if (channelAttemptKeyRef.current !== channelAttemptKey) {
      channelAttemptKeyRef.current = channelAttemptKey;
      attemptedUrlsRef.current = new Set();
    }
    attemptedUrlsRef.current.add(channel.url);

    const explicitType = resolveExplicitType(channel);
    const detectionSource = explicitType ? channel.url : originalSourceUrl;
    const type = explicitType || detectStreamType(detectionSource);
    const baseHeaders = normalizeHeaders(channel?.headers);
    const hlsHeaders = normalizeHeaders(channel?.hls?.headers || baseHeaders);
    const dashHeaders = normalizeHeaders(channel?.dash?.headers || baseHeaders);
    const withCredentials = Boolean(channel?.withCredentials);
    const hlsWithCredentials = channel?.hls?.withCredentials ?? withCredentials;
    const dashWithCredentials = channel?.dash?.withCredentials ?? withCredentials;
    console.log(`Initializing ${type} player for ${channel.url}`);
    let statsIntervalId = null; // Ip-define ang interval ID diri
    const guardDelay = Math.max(4000, Number(channel?.playbackGuardMs) || 8000);
    let playbackConfirmed = false;
    let fallbackTriggered = false;

    const stopPlaybackMonitor = () => {
      if (playbackGuardRef.current) {
        clearTimeout(playbackGuardRef.current);
        playbackGuardRef.current = null;
      }
      if (playbackMonitorRef.current) {
        try {
          playbackMonitorRef.current();
        } catch (error) {
          console.warn('[IPTV] playback monitor cleanup failed', error);
        }
        playbackMonitorRef.current = null;
      }
    };

    const attemptFallback = (reason, urlOverride = null, delayMs = 0) => {
      if (fallbackTriggered) return;
      console.warn(reason);

      const fallbackCandidates = [];
      const seenFallbackUrls = new Set();

      const addCandidate = (candidateUrl, detectionUrl) => {
        if (!candidateUrl) return;
        if (candidateUrl === channel.url) return;
        if (attemptedUrlsRef.current.has(candidateUrl)) return;
        if (seenFallbackUrls.has(candidateUrl)) return;
        seenFallbackUrls.add(candidateUrl);
        const typeHint = detectStreamType(detectionUrl || extractOriginalUrl(candidateUrl, candidateUrl));
        fallbackCandidates.push({
          url: candidateUrl,
          type: typeHint && typeHint !== 'unknown' ? typeHint : undefined,
        });
      };

      const addCandidateVariants = (rawUrl) => {
        if (!rawUrl) return;
        addCandidate(rawUrl, rawUrl);
        const decoded = extractOriginalUrl(rawUrl, rawUrl);
        if (decoded && decoded !== rawUrl) {
          addCandidate(decoded, decoded);
        }
        const proxied = buildProxyUrl(decoded);
        if (proxied) {
          addCandidate(proxied, decoded);
        }
      };

      addCandidateVariants(urlOverride);
      addCandidateVariants(channel?.fallback);
      addCandidateVariants(channel?.hls?.url);
      addCandidateVariants(channel?.dash?.fallback);
      addCandidateVariants(channel?.dash?.fallbackUrl);
      addCandidateVariants(channel?.streamFallback);
      addCandidateVariants(channel?.backupUrl);

      if (isProxiedUrl(channel.url)) {
        if (originalSourceUrl && originalSourceUrl !== channel.url) {
          addCandidate(originalSourceUrl, originalSourceUrl);
        }
      } else {
        const proxiedCurrent = buildProxyUrl(originalSourceUrl);
        if (proxiedCurrent) {
          addCandidate(proxiedCurrent, originalSourceUrl);
        }
      }

      const targetCandidate = fallbackCandidates.find(Boolean);

      if (targetCandidate) {
        fallbackTriggered = true;
        stopPlaybackMonitor();
        if (statsIntervalId) {
          clearInterval(statsIntervalId);
          statsIntervalId = null;
        }
        attemptedUrlsRef.current.add(targetCandidate.url);
        const payload = {
          url: targetCandidate.url,
          originalUrl: originalSourceUrl,
        };
        if (targetCandidate.type) {
          payload.type = targetCandidate.type;
        }

        const runner = () => onError?.(payload);
        if (delayMs > 0) setTimeout(runner, delayMs);
        else runner();
      } else {
        fallbackTriggered = true;
        stopPlaybackMonitor();
        if (statsIntervalId) {
          clearInterval(statsIntervalId);
          statsIntervalId = null;
        }

        console.warn('[IPTV] No fallback candidates available for', channel?.name || channel?.url);
        onError?.({
          url: null,
          originalUrl: originalSourceUrl,
          reason: 'no-fallback',
        });
        onCanPlay?.();
      }
    };

    const markPlaybackStarted = () => {
      if (playbackConfirmed) return;
      const v = videoRef.current;
      if (!v) return;
      const hasBuffered = (() => {
        try {
          return v.buffered?.length && (v.buffered.end(v.buffered.length - 1) - v.currentTime > 0.1);
        } catch {
          return false;
        }
      })();
      if (v.readyState >= 2 && !v.paused && (v.currentTime > 0.2 || hasBuffered)) {
        playbackConfirmed = true;
        stopPlaybackMonitor();
      }
    };

    const startPlaybackMonitor = () => {
      const v = videoRef.current;
      if (!v) return;

      const handleProgress = () => markPlaybackStarted();
      const handlePlaying = () => markPlaybackStarted();
      const handleTimeUpdate = () => markPlaybackStarted();
      const handleLoaded = () => markPlaybackStarted();

      v.addEventListener('progress', handleProgress);
      v.addEventListener('playing', handlePlaying);
      v.addEventListener('timeupdate', handleTimeUpdate);
      v.addEventListener('loadeddata', handleLoaded);

      playbackMonitorRef.current = () => {
        v.removeEventListener('progress', handleProgress);
        v.removeEventListener('playing', handlePlaying);
        v.removeEventListener('timeupdate', handleTimeUpdate);
        v.removeEventListener('loadeddata', handleLoaded);
      };

      playbackGuardRef.current = setTimeout(() => {
        if (playbackConfirmed || fallbackTriggered) return;
        markPlaybackStarted();
        if (!playbackConfirmed && !fallbackTriggered) {
          attemptFallback(`[IPTV] Playback stalled for ${channel?.name || channel.url}. Switching to fallback if available.`);
        }
      }, guardDelay);
    };

    startPlaybackMonitor();

    try {
      if (type === 'hls') {
        if (Hls.isSupported()) {
          const hlsConfig = {
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: channel?.hls?.backBufferLength,
          };

          if (Object.keys(hlsHeaders).length > 0 || hlsWithCredentials) {
            hlsConfig.xhrSetup = (xhr) => {
              if (hlsWithCredentials) {
                xhr.withCredentials = true;
              }
              Object.entries(hlsHeaders).forEach(([key, value]) => {
                try {
                  xhr.setRequestHeader(key, value);
                } catch (error) {
                  console.warn('[IPTV] Unable to set HLS header', key, error);
                }
              });
            };

            hlsConfig.fetchSetup = (context, init) => {
              const nextInit = { ...init };
              const headerBag = { ...(context?.headers || {}), ...(init?.headers || {}) };
              Object.entries(hlsHeaders).forEach(([key, value]) => {
                headerBag[key] = value;
              });
              if (Object.keys(headerBag).length > 0) {
                nextInit.headers = headerBag;
              }
              if (hlsWithCredentials) {
                context.credentials = 'include';
                nextInit.credentials = 'include';
              }
              context.headers = headerBag;
              return nextInit;
            };
          }

          const mergedConfig = channel?.hls?.config ? { ...hlsConfig, ...channel.hls.config } : hlsConfig;
          const hls = new Hls(mergedConfig);
          hlsRef.current = hls;
          hls.loadSource(channel.url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log("HLS Manifest Parsed");
            setQualities([{ label: 'Auto', value: -1 }, ...hls.levels.map((l, i) => ({ label: `${l.height}p`, value: i }))]);
            attemptAutoplay(video)
              .then(() => markPlaybackStarted())
              .catch((e) => console.warn("HLS Autoplay failed", e));
            onCanPlay?.(); // Tawagon *human* ma-parse
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
             const level = hls.levels[data.level];
             setCurrentQuality(hls.autoLevelEnabled ? 'Auto' : `${level.height}p`);
             setBitrate(level?.bitrate || 0);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            const errorMsg = data.details ? `${data.type}: ${data.details}` : data.type;
            const fatalMsg = data.fatal ? ' (fatal)' : '';
            console.error(`HLS Error: ${errorMsg}${fatalMsg}`, data.error || data);

            // Only attempt fallback for fatal errors, not for non-fatal fragParsingError
            if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              attemptFallback(`[IPTV] HLS network error for ${channel?.name || channel.url}.`, channel.fallback);
            } else if (data.fatal) {
              attemptFallback(`[IPTV] HLS fatal error for ${channel?.name || channel.url}.`, channel.fallback, 200);
            }
            // Non-fatal errors like fragParsingError are logged but don't trigger fallback
          });

          const updateStats = () => {
            if(hlsRef.current) {
                setLatency(hlsRef.current.latency?.toFixed(1));
                try {
                  const bufferInfo = Hls.BufferHelper?.bufferInfo(video, video.currentTime, 0.5);
                  setBufferHealth(bufferInfo?.len?.toFixed(1) || '0.0');
                } catch {
                  setBufferHealth('0.0');
                }
            }
          };
          statsIntervalId = setInterval(updateStats, 1000); // I-assign ang ID

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log("Using Native HLS");
          video.src = channel.url;
          attemptAutoplay(video)
            .then(() => markPlaybackStarted())
            .catch((e) => console.warn("Native HLS Autoplay failed", e));
          video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
           video.addEventListener('error', () => {
               console.error("Native HLS Error");
               attemptFallback(`[IPTV] Native HLS error for ${channel?.name || channel.url}.`, channel.fallback);
           });
        } else {
             console.error("HLS not supported");
             onCanPlay?.();
        }
      }
      else if (type === 'dash') {
        console.log("Initializing DASH Player");

        let dashFallbackTried = false;

        const startDashWithDashJS = () => {
          dashFallbackTried = true;
          try {
            const player = MediaPlayer().create();
            dashRef.current = player;

            player.updateSettings({
              debug: { logLevel: 4 },
              streaming: {
                abr: {
                  autoSwitchBitrate: { video: true, audio: true },
                  limitBitrateByPortal: true,
                },
                buffer: {
                  fastSwitchEnabled: true,
                  bufferTimeAtTopQuality: 30,
                  bufferTimeAtTopQualityLongForm: 60,
                  initialBufferLevel: 10,
                  stableBufferTime: 20,
                  bufferPruningInterval: 10,
                },
                gaps: {
                  jumpGaps: true,
                  jumpLargeGaps: true,
                  smallGapLimit: 1.5,
                },
                retryAttempts: {
                  MPD: 10,
                  XLinkExpansion: 5,
                  MediaSegment: 10,
                  InitializationSegment: 10,
                  BitstreamSwitching: 5,
                },
                retryIntervals: {
                  MPD: 1000,
                  XLinkExpansion: 1000,
                  MediaSegment: 1000,
                  InitializationSegment: 1000,
                  BitstreamSwitching: 1000,
                },
                lowLatencyEnabled: false,
                liveCatchup: { enabled: true },
              },
            });

            if (channel?.dash?.settings) {
              player.updateSettings(channel.dash.settings);
            }

            if (typeof channel?.dash?.requestModifier === 'function') {
              player.extend('RequestModifier', channel.dash.requestModifier, true);
            } else {
              player.extend('RequestModifier', buildDashRequestModifier(dashHeaders, dashWithCredentials), true);
            }

            applyDashProtectionData(player, channel?.dash?.drm || channel?.drm);

            player.initialize(video, channel.url, true);

            player.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
              const bitrateList = player.getBitrateInfoListFor('video');
              if (bitrateList?.length) {
                const qualityOptions = bitrateList.map((item, idx) => ({
                  label: `${item.height}p`,
                  value: idx,
                  bitrate: item.bitrate,
                }));
                setQualities([{ label: 'Auto', value: -1 }, ...qualityOptions]);
              }

              attemptAutoplay(video)
                .then(() => markPlaybackStarted())
                .catch((e) => console.warn('DASH (dash.js) Autoplay failed', e));
              onCanPlay?.();
            });

            player.on(MediaPlayer.events.PLAYBACK_STARTED, () => {
              setIsPlaying(true);
              markPlaybackStarted();
            });

            player.on(MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e) => {
              if (e.mediaType === 'video') {
                const bitrateList = player.getBitrateInfoListFor('video');
                const currentBitrate = bitrateList?.[e.newQuality];
                if (currentBitrate) {
                  setCurrentQuality(player.getSettings().streaming.abr.autoSwitchBitrate.video ? 'Auto' : `${currentBitrate.height}p`);
                  setBitrate(currentBitrate.bitrate || 0);
                }
              }
            });

            player.on(MediaPlayer.events.ERROR, (e) => {
              console.error('dash.js error', e);
              attemptFallback(`[IPTV] dash.js error for ${channel?.name || channel.url}.`, channel.fallback, 400);
            });

            const updateDashStats = () => {
              if (fallbackTriggered) return;
              if (dashRef.current && video) {
                const metrics = dashRef.current.getMetricsFor('video');
                if (metrics) {
                  const dashMetrics = dashRef.current.getDashMetrics();
                  const bufferLevel = dashMetrics?.getCurrentBufferLevel('video');
                  if (bufferLevel !== undefined) {
                    setBufferHealth(bufferLevel.toFixed(1));
                  }
                }
                if (typeof dashRef.current.getCurrentLiveLatency === 'function') {
                  const liveLatency = dashRef.current.getCurrentLiveLatency();
                  if (typeof liveLatency === 'number' && !Number.isNaN(liveLatency)) {
                    setLatency(liveLatency.toFixed(1));
                  }
                }
                const currentIndex = typeof dashRef.current.getQualityFor === 'function'
                  ? dashRef.current.getQualityFor('video')
                  : null;
                const bitrateList = dashRef.current.getBitrateInfoListFor?.('video');
                if (Array.isArray(bitrateList) && typeof currentIndex === 'number' && bitrateList[currentIndex]) {
                  setBitrate(bitrateList[currentIndex].bitrate || 0);
                }
              }
            };
            statsIntervalId = setInterval(updateDashStats, 1000);

            return true;
          } catch (error) {
            console.error('dash.js initialization error:', error);
            attemptFallback(`[IPTV] dash.js initialization failed for ${channel?.name || channel.url}.`, channel.fallback);
            return false;
          }
        };

        const startDashWithShaka = () => {
          if (typeof shaka === 'undefined' || !shaka.Player || !shaka.Player.isBrowserSupported()) {
            return false;
          }

          try {
            shaka.polyfill?.installAll?.();

            const player = new shaka.Player(video);
            shakaRef.current = player;

            player.configure({
              streaming: {
                rebufferingGoal: 10,
                bufferingGoal: 20,
                lowLatencyMode: false,
                jumpLargeGaps: true,
              },
              abr: {
                enabled: true,
                defaultBandwidthEstimate: 5_000_000,
              },
            });

            if (channel?.dash?.shakaConfig) {
              player.configure(channel.dash.shakaConfig);
            }

            const drmConfig = channel?.dash?.drm || channel?.drm;
            const shakaDrm = buildShakaDrmConfiguration(drmConfig);
            const mergedLicenseHeaders = {};

            if (shakaDrm) {
              const drmSettings = {};

              if (shakaDrm.servers && Object.keys(shakaDrm.servers).length) {
                drmSettings.servers = shakaDrm.servers;
              }
              if (shakaDrm.advanced && Object.keys(shakaDrm.advanced).length) {
                drmSettings.advanced = shakaDrm.advanced;
              }
              if (shakaDrm.clearKeys && Object.keys(shakaDrm.clearKeys).length) {
                drmSettings.clearKeys = shakaDrm.clearKeys;
              }

              if (Object.keys(drmSettings).length) {
                player.configure({ drm: drmSettings });
              }

              Object.values(shakaDrm.licenseHeaders || {}).forEach((headers) => {
                Object.assign(mergedLicenseHeaders, headers);
              });
            }

            const networking = player.getNetworkingEngine?.();
            if (networking) {
              const RequestType = shaka.net.NetworkingEngine.RequestType;
              const mediaRequestTypes = new Set([
                RequestType.MANIFEST,
                RequestType.SEGMENT,
                RequestType.SEGMENT_LIST,
                RequestType.TIMELINE,
                RequestType.SEGMENT_INIT,
                RequestType.APP_MANIFEST,
              ]);

              networking.clearAllRequestFilters?.();
              networking.registerRequestFilter((type, request) => {
                const headers = request.headers || (request.headers = {});
                if (dashWithCredentials || (drmConfig?.withCredentials ?? false)) {
                  request.allowCrossSiteCredentials = true;
                }

                if (mediaRequestTypes.has(type) && Object.keys(dashHeaders).length > 0) {
                  Object.assign(headers, dashHeaders);
                }

                if (type === RequestType.LICENSE && Object.keys(mergedLicenseHeaders).length > 0) {
                  Object.assign(headers, mergedLicenseHeaders);
                }
              });
            }

            const handleShakaFatal = (error) => {
              if (fallbackTriggered) return;
              console.error('[Shaka] fatal error', error);
              if (statsIntervalId) {
                clearInterval(statsIntervalId);
                statsIntervalId = null;
              }

              if (!dashFallbackTried) {
                console.warn('[Shaka] falling back to dash.js');
                cleanupPlayers();
                stopPlaybackMonitor();
                startPlaybackMonitor();
                const dashStarted = startDashWithDashJS();
                if (!dashStarted) {
                  attemptFallback(`[IPTV] Shaka fatal error, dash.js unavailable for ${channel?.name || channel.url}.`, channel.fallback, 500);
                }
                return;
              }

              attemptFallback(`[IPTV] Shaka fatal error for ${channel?.name || channel.url}.`, channel.fallback, 500);
            };

            player.addEventListener('error', (event) => {
              const detail = event?.detail || event;
              const severity = detail?.severity;
              if (typeof severity === 'number' && shaka.util?.Error?.Severity) {
                if (severity !== shaka.util.Error.Severity.CRITICAL) {
                  console.warn('[Shaka] non-fatal error', detail);
                  return;
                }
              }
              handleShakaFatal(detail);
            });

            player.addEventListener('adaptation', () => {
              const tracks = player.getVariantTracks?.() || [];
              const activeTrack = tracks.find((track) => track.active);
              const abrEnabled = player.getConfiguration().abr.enabled;
              if (activeTrack) {
                setCurrentQuality(abrEnabled ? 'Auto' : `${activeTrack.height || Math.round((activeTrack.bandwidth || 0) / 1000)}p`);
                setBitrate(activeTrack.bandwidth || 0);
                markPlaybackStarted();
              }
            });

            player.load(channel.url).then(() => {
              const tracks = player.getVariantTracks?.() || [];
              const seen = new Set();
              const qualityOptions = tracks
                .filter((track) => track.type === 'variant' && track.height)
                .filter((track) => {
                  const key = `${track.height}-${track.bandwidth}`;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                })
                .sort((a, b) => (a.height || 0) - (b.height || 0))
                .map((track, idx) => ({
                  label: `${track.height}p`,
                  value: track.id ?? idx,
                  trackId: track.id,
                  bandwidth: track.bandwidth,
                  height: track.height,
                }));

              setQualities([{ label: 'Auto', value: -1 }, ...qualityOptions]);

              attemptAutoplay(video)
                .then(() => markPlaybackStarted())
                .catch((e) => console.warn('Shaka Autoplay failed', e));
              onCanPlay?.();
            }).catch((error) => {
              handleShakaFatal(error);
            });

            const updateShakaStats = () => {
              if (fallbackTriggered) return;
              if (!shakaRef.current || !video) return;

              const buffered = video.buffered;
              if (buffered?.length) {
                const bufferAhead = buffered.end(buffered.length - 1) - video.currentTime;
                if (!Number.isNaN(bufferAhead)) {
                  setBufferHealth(bufferAhead.toFixed(1));
                }
              }

              const latencyValue = shakaRef.current.getPresentationLatency?.();
              if (typeof latencyValue === 'number' && !Number.isNaN(latencyValue)) {
                setLatency(latencyValue.toFixed(1));
              }

              const stats = shakaRef.current.getStats?.();
              if (stats?.estimatedBandwidth) {
                setBitrate(stats.estimatedBandwidth);
              }
            };

            statsIntervalId = setInterval(updateShakaStats, 1000);

            return true;
          } catch (error) {
            console.error('Shaka initialization error:', error);
            attemptFallback(`[IPTV] Shaka initialization failed for ${channel?.name || channel.url}.`, channel.fallback);
            return false;
          }
        };

        const shakaStarted = startDashWithShaka();
        if (!shakaStarted) {
          startDashWithDashJS();
        }
      }
      else if (type === 'progressive') {
        console.log("Initializing Progressive Player");
        video.src = channel.url;
        video.load();
        attemptAutoplay(video)
          .then(() => markPlaybackStarted())
          .catch((e) => console.warn("Progressive Autoplay failed", e));
        video.addEventListener('canplay', () => onCanPlay?.(), { once: true });
        video.addEventListener('error', () => {
            console.error("Progressive Playback Error");
            attemptFallback(`[IPTV] Progressive playback error for ${channel?.name || channel.url}.`, channel.fallback);
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
  }, [channel, cleanupPlayers, onCanPlay, onError, attemptAutoplay]);


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


  const switchQuality = (value) => {
    const selected = qualities.find((q) => String(q.value) === String(value));
    if (!selected) return;

    if (hlsRef.current) {
      const levelIndex = Number(selected.value);
      console.log(`Switching HLS quality to level: ${levelIndex}`);
      hlsRef.current.currentLevel = levelIndex;
      const levelInfo = levelIndex >= 0 ? hlsRef.current.levels?.[levelIndex] : null;
      if (levelInfo?.bitrate) {
        setBitrate(levelInfo.bitrate);
      }
      setCurrentQuality(levelIndex === -1 ? 'Auto' : selected.label || `${levelInfo?.height || ''}p`);
    } else if (dashRef.current) {
      const levelIndex = Number(selected.value);
      console.log(`Switching dash.js quality to level: ${levelIndex}`);
      const settings = dashRef.current.getSettings();

      if (levelIndex === -1) {
        settings.streaming.abr.autoSwitchBitrate.video = true;
        dashRef.current.updateSettings(settings);
        setCurrentQuality('Auto');
      } else {
        settings.streaming.abr.autoSwitchBitrate.video = false;
        dashRef.current.updateSettings(settings);
        dashRef.current.setQualityFor('video', levelIndex);
        setCurrentQuality(selected.label || '...');
        const bitrateList = dashRef.current.getBitrateInfoListFor?.('video');
        const info = bitrateList?.[levelIndex];
        if (info?.bitrate) {
          setBitrate(info.bitrate);
        }
      }
    } else if (shakaRef.current) {
      console.log(`Switching Shaka quality to value: ${selected.value}`);
      if (selected.value === -1) {
        shakaRef.current.configure({ abr: { enabled: true } });
        setCurrentQuality('Auto');
      } else {
        shakaRef.current.configure({ abr: { enabled: false } });
        const tracks = shakaRef.current.getVariantTracks?.() || [];
        const targetTrack = tracks.find((track) => String(track.id ?? track.height) === String(selected.trackId ?? selected.value));
        if (targetTrack) {
          shakaRef.current.selectVariantTrack(targetTrack, true, 0);
          setCurrentQuality(selected.label || `${targetTrack.height || Math.round((targetTrack.bandwidth || 0) / 1000)}p`);
          if (targetTrack.bandwidth) {
            setBitrate(targetTrack.bandwidth);
          }
        }
      }
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