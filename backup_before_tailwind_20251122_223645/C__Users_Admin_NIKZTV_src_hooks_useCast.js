import { useState, useEffect, useCallback } from 'react';

/**
 * Chromecast & AirPlay Support Hook
 * Manages casting to TV devices using Google Cast SDK and Remote Playback API
 */

export const useCast = () => {
  const [isCastAvailable, setIsCastAvailable] = useState(false);
  const [isAirPlayAvailable, setIsAirPlayAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castDevice, setCastDevice] = useState(null);
  const [castState, setCastState] = useState('NOT_CONNECTED'); // NOT_CONNECTED, CONNECTING, CONNECTED

  // Check for Chromecast availability
  useEffect(() => {
    const checkChromecast = () => {
      // Check if Google Cast API is loaded
      if (window.chrome && window.chrome.cast && window.chrome.cast.isAvailable) {
        setIsCastAvailable(true);
      } else {
        // Wait for Cast API to load
        window['__onGCastApiAvailable'] = isAvailable => {
          setIsCastAvailable(isAvailable);
        };
      }
    };

    checkChromecast();

    // Listen for cast state changes
    const handleCastStateChanged = () => {
      const castSession = window.cast?.framework?.CastContext?.getInstance()?.getCurrentSession();
      if (castSession) {
        setIsCasting(true);
        setCastState('CONNECTED');
        setCastDevice({
          name: castSession.getCastDevice().friendlyName,
          type: 'chromecast',
        });
      } else {
        setIsCasting(false);
        setCastState('NOT_CONNECTED');
        setCastDevice(null);
      }
    };

    window.addEventListener('cast-state-changed', handleCastStateChanged);

    return () => {
      window.removeEventListener('cast-state-changed', handleCastStateChanged);
    };
  }, []);

  // Check for AirPlay availability (Remote Playback API)
  useEffect(() => {
    const checkAirPlay = () => {
      // Check if Remote Playback API is supported (Safari/iOS)
      if ('remote' in HTMLVideoElement.prototype) {
        setIsAirPlayAvailable(true);
      }
    };

    checkAirPlay();
  }, []);

  // Initialize Google Cast
  const initializeCast = useCallback(() => {
    if (!window.chrome || !window.chrome.cast || !window.chrome.cast.isAvailable) {
      console.warn('Chromecast not available');
      return;
    }

    const castContext = window.cast.framework.CastContext.getInstance();

    castContext.setOptions({
      receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    // Listen for session state changes
    castContext.addEventListener(
      window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      event => {
        switch (event.sessionState) {
          case window.cast.framework.SessionState.SESSION_STARTED:
            setCastState('CONNECTED');
            setIsCasting(true);
            break;
          case window.cast.framework.SessionState.SESSION_RESUMED:
            setCastState('CONNECTED');
            setIsCasting(true);
            break;
          case window.cast.framework.SessionState.SESSION_ENDED:
            setCastState('NOT_CONNECTED');
            setIsCasting(false);
            setCastDevice(null);
            break;
          default:
            break;
        }
      }
    );
  }, []);

  // Cast video to Chromecast
  const castToChromecast = useCallback(
    async (videoUrl, metadata) => {
      if (!isCastAvailable) {
        throw new Error('Chromecast not available');
      }

      try {
        const castContext = window.cast.framework.CastContext.getInstance();
        const session = castContext.getCurrentSession();

        if (!session) {
          // Request session
          await castContext.requestSession();
          const newSession = castContext.getCurrentSession();
          if (!newSession) throw new Error('Failed to start cast session');

          return loadMedia(newSession, videoUrl, metadata);
        }

        return loadMedia(session, videoUrl, metadata);
      } catch (error) {
        console.error('Error casting to Chromecast:', error);
        throw error;
      }
    },
    [isCastAvailable]
  );

  // Load media on Chromecast
  const loadMedia = (session, videoUrl, metadata) => {
    const mediaInfo = new window.chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');

    mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = metadata.title || 'NikzFlix Video';
    mediaInfo.metadata.subtitle = metadata.subtitle || '';

    if (metadata.poster) {
      mediaInfo.metadata.images = [new window.chrome.cast.Image(metadata.poster)];
    }

    const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;

    return session.loadMedia(request);
  };

  // Stop casting
  const stopCasting = useCallback(() => {
    if (!isCasting) return;

    try {
      const castContext = window.cast.framework.CastContext.getInstance();
      const session = castContext.getCurrentSession();

      if (session) {
        session.endSession(true);
      }
    } catch (error) {
      console.error('Error stopping cast:', error);
    }
  }, [isCasting]);

  // Enable AirPlay for video element
  const enableAirPlay = useCallback(
    videoElement => {
      if (!isAirPlayAvailable || !videoElement) return false;

      try {
        // Enable AirPlay
        videoElement.setAttribute('x-webkit-airplay', 'allow');
        videoElement.setAttribute('airplay', 'allow');

        // Show AirPlay button in controls
        if (videoElement.webkitShowPlaybackTargetPicker) {
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error enabling AirPlay:', error);
        return false;
      }
    },
    [isAirPlayAvailable]
  );

  // Show AirPlay picker
  const showAirPlayPicker = useCallback(
    videoElement => {
      if (!isAirPlayAvailable || !videoElement) {
        console.warn('AirPlay not available');
        return;
      }

      try {
        if (videoElement.webkitShowPlaybackTargetPicker) {
          videoElement.webkitShowPlaybackTargetPicker();
        }
      } catch (error) {
        console.error('Error showing AirPlay picker:', error);
      }
    },
    [isAirPlayAvailable]
  );

  // Get current playback state
  const getPlaybackState = useCallback(() => {
    if (!isCasting) return null;

    try {
      const castContext = window.cast.framework.CastContext.getInstance();
      const session = castContext.getCurrentSession();

      if (!session) return null;

      const media = session.getMediaSession();
      if (!media) return null;

      return {
        currentTime: media.getEstimatedTime(),
        duration: media.media.duration,
        playerState: media.playerState,
        isPaused: media.playerState === window.chrome.cast.media.PlayerState.PAUSED,
        isPlaying: media.playerState === window.chrome.cast.media.PlayerState.PLAYING,
      };
    } catch (error) {
      console.error('Error getting playback state:', error);
      return null;
    }
  }, [isCasting]);

  // Control playback
  const controlPlayback = useCallback(
    (command, value) => {
      if (!isCasting) return;

      try {
        const castContext = window.cast.framework.CastContext.getInstance();
        const session = castContext.getCurrentSession();

        if (!session) return;

        const media = session.getMediaSession();
        if (!media) return;

        switch (command) {
          case 'play':
            media.play(new window.chrome.cast.media.PlayRequest());
            break;
          case 'pause':
            media.pause(new window.chrome.cast.media.PauseRequest());
            break;
          case 'seek': {
            const seekRequest = new window.chrome.cast.media.SeekRequest();
            seekRequest.currentTime = value;
            media.seek(seekRequest);
            break;
          }
          case 'volume': {
            const volumeRequest = new window.chrome.cast.media.VolumeRequest(
              new window.chrome.cast.Volume(value, false)
            );
            media.setVolume(volumeRequest);
            break;
          }
          default:
            break;
        }
      } catch (error) {
        console.error('Error controlling playback:', error);
      }
    },
    [isCasting]
  );

  return {
    // Availability
    isCastAvailable,
    isAirPlayAvailable,
    isCasting,
    castDevice,
    castState,

    // Chromecast methods
    initializeCast,
    castToChromecast,
    stopCasting,
    getPlaybackState,
    controlPlayback,

    // AirPlay methods
    enableAirPlay,
    showAirPlayPicker,
  };
};
