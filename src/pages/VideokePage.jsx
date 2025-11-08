// src/pages/VideokePage.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiArrowDown,
  FiArrowUp,
  FiBookOpen,
  FiCopy,
  FiExternalLink,
  FiPlay,
  FiShuffle,
  FiSkipForward,
  FiTrash2,
  FiYoutube,
  FiZap,
} from 'react-icons/fi';
import { searchYouTube } from '../utils/consumetApi';
import { useToast } from '../components/toastContext.js';
import VideoPlayerErrorBoundary from '../components/VideoPlayerErrorBoundary.jsx';

const PRESET_QUERIES = [
  { label: 'OPM Classics', value: 'opm karaoke minus one' },
  { label: 'Duet Night', value: 'karaoke duet songs' },
  { label: 'Power Ballads', value: 'power ballad karaoke' },
  { label: 'Throwback 90s', value: '90s karaoke hits' },
  { label: 'Party Hits', value: 'party karaoke upbeat' },
  { label: 'Tagalog Love', value: 'tagalog love song karaoke' },
];

const FALLBACK_QUERY = 'OPM karaoke';

let youTubeApiPromise = null;

const loadYouTubeIframeAPI = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API requires a browser environment.'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!youTubeApiPromise) {
    youTubeApiPromise = new Promise((resolve, reject) => {
      const handleFailure = () => {
        youTubeApiPromise = null;
        const danglingScript = document.getElementById('youtube-iframe-api');
        if (danglingScript) {
          try {
            // Use modern remove() method with fallback to removeChild()
            if (danglingScript.remove) {
              danglingScript.remove();
            } else if (danglingScript.parentNode) {
              danglingScript.parentNode.removeChild(danglingScript);
            }
          } catch (removeError) {
            console.warn('Failed to remove YouTube script element:', removeError);
          }
        }
        reject(new Error('Failed to load the YouTube player API.'));
      };

      let script = document.getElementById('youtube-iframe-api');
      if (!script) {
        script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = handleFailure;
        document.head.appendChild(script);
      } else {
        script.addEventListener('error', handleFailure, { once: true });
      }

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        const scriptEl = document.getElementById('youtube-iframe-api');
        if (scriptEl) {
          scriptEl.onerror = null;
        }
        if (window.YT?.Player) {
          resolve(window.YT);
        } else {
          handleFailure();
        }
      };
    });
  }

  return youTubeApiPromise;
};

const YouTubeStagePlayer = ({ videoId, onReady, onEnded, onError, registerPlayer }) => {
  const [playerKey, setPlayerKey] = useState(0); // Force recreation with key
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const lastVideoRef = useRef(null);
  const isMountedRef = useRef(true);
  const [useIframe, setUseIframe] = useState(true); // Default to iframe for reliability
  const songTimerRef = useRef(null);

  // Force iframe approach for more reliable video transitions
  useEffect(() => {
    if (videoId && lastVideoRef.current && lastVideoRef.current !== videoId) {
      console.log('Video changed, forcing iframe recreation');
      setPlayerKey(prev => prev + 1); // Force complete recreation

      // Clear any existing timer
      if (songTimerRef.current) {
        clearTimeout(songTimerRef.current);
        songTimerRef.current = null;
      }
    }
    lastVideoRef.current = videoId;
  }, [videoId]);

  // Set up automatic song ending timer (default 4 minutes for most songs)
  useEffect(() => {
    if (videoId && useIframe) {
      // Clear any existing timer
      if (songTimerRef.current) {
        clearTimeout(songTimerRef.current);
      }

      // Set timer for automatic progression (4 minutes = 240 seconds)
      songTimerRef.current = setTimeout(() => {
        console.log('Song timer ended, triggering onEnded');
        onEnded?.();
      }, 240000); // 4 minutes

      return () => {
        if (songTimerRef.current) {
          clearTimeout(songTimerRef.current);
          songTimerRef.current = null;
        }
      };
    }
  }, [videoId, useIframe, onEnded]);

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        // Stop video before destroying to prevent audio-only playback
        if (typeof playerRef.current.stopVideo === 'function') {
          playerRef.current.stopVideo();
          console.log('Stopped video before destroying player');
        }

        // Clear video content
        if (typeof playerRef.current.clearVideo === 'function') {
          playerRef.current.clearVideo();
        }

        // Destroy the player
        if (typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
          console.log('Player destroyed successfully');
        }
      } catch (destroyError) {
        console.error('Failed to destroy YouTube player instance.', destroyError);
      }
    }

    playerRef.current = null;
    readyRef.current = false;
    lastVideoRef.current = null;

    // Clear the container element
    if (containerRef.current) {
      try {
        containerRef.current.innerHTML = '';
      } catch (clearError) {
        console.log('Failed to clear container:', clearError);
      }
    }

    if (isMountedRef.current) {
      registerPlayer?.(null);
    }
  }, [registerPlayer]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      destroyPlayer();
    };
  }, [destroyPlayer]);

  useEffect(() => {
    let isActive = true;

    if (!videoId) {
      destroyPlayer();
      return undefined;
    }

    loadYouTubeIframeAPI()
      .then(YT => {
        console.log('YouTube API loaded successfully');
        if (!isActive) {
          return;
        }

        if (!containerRef.current) {
          console.log('No container ref available');
          return;
        }

        const playerVars = {
          autoplay: 1, // Enable autoplay for main player
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          controls: 1,
          iv_load_policy: 3,
          fs: 1,
          mute: 0,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        };

        const bindExistingPlayer = () => {
          if (!readyRef.current || !playerRef.current || !isMountedRef.current) {
            return;
          }
          try {
            if (lastVideoRef.current !== videoId) {
              console.log('Different video detected, destroying and recreating player');
              console.log('Switching from video:', lastVideoRef.current, 'to:', videoId);

              // For video transitions, destroy the old player completely and create new one
              destroyPlayer();

              // Wait a bit, then recreate the player with new video
              setTimeout(() => {
                if (isMountedRef.current && containerRef.current) {
                  console.log('Creating fresh player for video:', videoId);

                  // Clear the container completely
                  containerRef.current.innerHTML = '';

                  playerRef.current = new YT.Player(containerRef.current, {
                    videoId,
                    width: '100%',
                    height: '100%',
                    playerVars,
                    events: {
                      onReady: event => {
                        console.log('Fresh YouTube player ready for video:', videoId);
                        if (!isActive || !isMountedRef.current) {
                          return;
                        }
                        readyRef.current = true;
                        lastVideoRef.current = videoId;
                        registerPlayer?.(event.target);
                        onReady?.(event);
                      },
                      onStateChange: event => {
                        console.log(
                          'Fresh YouTube player state change:',
                          event.data,
                          'for video:',
                          videoId
                        );
                        if (!isActive || !isMountedRef.current) {
                          return;
                        }

                        // Handle video ended
                        if (event.data === YT.PlayerState.ENDED) {
                          console.log('Video ended, triggering onEnded');
                          onEnded?.();
                        }

                        // Handle video playing - ensure video is visible
                        if (event.data === YT.PlayerState.PLAYING) {
                          console.log('Video is playing, checking visibility');
                          // Force a small resize to ensure video is visible
                          setTimeout(() => {
                            if (playerRef.current && isMountedRef.current) {
                              try {
                                const iframe = containerRef.current?.querySelector('iframe');
                                if (iframe) {
                                  iframe.style.visibility = 'visible';
                                  iframe.style.opacity = '1';
                                }
                              } catch (err) {
                                console.log('Minor iframe visibility fix failed:', err);
                              }
                            }
                          }, 100);
                        }
                      },
                      onError: event => {
                        console.error(
                          'Fresh YouTube player error:',
                          event.data,
                          'for video:',
                          videoId
                        );
                        if (!isActive || !isMountedRef.current) {
                          return;
                        }
                        onError?.(event);
                      },
                    },
                  });
                }
              }, 500); // Give time for cleanup
              return;
            }
            registerPlayer?.(playerRef.current);
            onReady?.({ target: playerRef.current });
          } catch (loadError) {
            console.error('Error in bindExistingPlayer:', loadError);
            if (isMountedRef.current) {
              onError?.(loadError);
            }
          }
        };

        if (!playerRef.current) {
          console.log('Creating new YouTube player for video:', videoId);
          playerRef.current = new YT.Player(containerRef.current, {
            videoId,
            width: '100%',
            height: '100%',
            playerVars,
            events: {
              onReady: event => {
                console.log('YouTube player ready for video:', videoId);
                if (!isActive || !isMountedRef.current) {
                  return;
                }
                readyRef.current = true;
                lastVideoRef.current = videoId;
                registerPlayer?.(event.target);
                onReady?.(event);
              },
              onStateChange: event => {
                console.log('YouTube player state change:', event.data, 'for video:', videoId);
                if (!isActive || !isMountedRef.current) {
                  return;
                }

                // Handle video ended
                if (event.data === YT.PlayerState.ENDED) {
                  console.log('Video ended, triggering onEnded');
                  onEnded?.();
                }

                // Handle video playing - ensure video is visible
                if (event.data === YT.PlayerState.PLAYING) {
                  console.log('Video is playing, checking visibility');
                  // Force a small resize to ensure video is visible
                  setTimeout(() => {
                    if (playerRef.current && isMountedRef.current) {
                      try {
                        const iframe = containerRef.current?.querySelector('iframe');
                        if (iframe) {
                          iframe.style.visibility = 'visible';
                          iframe.style.opacity = '1';
                        }
                      } catch (err) {
                        console.log('Minor iframe visibility fix failed:', err);
                      }
                    }
                  }, 100);
                }
              },
              onError: event => {
                console.error('YouTube player error:', event.data, 'for video:', videoId);
                if (!isActive || !isMountedRef.current) {
                  return;
                }
                onError?.(event);
              },
            },
          });
          registerPlayer?.(playerRef.current);
        } else {
          console.log('Reusing existing player for video:', videoId);
          bindExistingPlayer();
        }
      })
      .catch(error => {
        console.error('YouTube API failed to load, using iframe fallback:', error);
        if (!isActive) {
          return;
        }
        // Use iframe fallback
        setUseIframe(true);
        setTimeout(() => {
          onReady?.({ target: null });
        }, 500);
      });

    return () => {
      isActive = false;
    };
  }, [videoId, onReady, onEnded, onError, registerPlayer, destroyPlayer]);

  // Hooks for iframe fallback - must be called before any conditional returns
  useEffect(() => {
    if (!useIframe) return;
    // Simulate onReady after iframe loads - faster for iframe approach
    const timer = setTimeout(() => {
      onReady?.({ target: null });
    }, 300); // Reduced from 1000ms to 300ms for faster loading

    return () => clearTimeout(timer);
  }, [onReady, videoId, useIframe]);

  useEffect(() => {
    if (!useIframe) return;
    // Set up a message listener for iframe events
    const handleMessage = event => {
      if (event.origin !== 'https://www.youtube.com') return;

      try {
        const data = JSON.parse(event.data);
        if (data.event === 'video-progress') {
          // YouTube iframe doesn't reliably send ended events, so we'll use a different approach
          // We'll let the parent component handle this with a timer or other mechanism
        }
      } catch {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded, useIframe]);

  // Iframe fallback when YouTube API fails OR for reliable video transitions
  if (useIframe) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&enablejsapi=1`;

    return (
      <div key={playerKey} style={{ width: '100%', height: '100%' }}>
        <iframe
          src={embedUrl}
          title="YouTube Video Player"
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 0 }}
          onLoad={() => {
            // Clear loading state as soon as iframe loads
            setTimeout(() => {
              onReady?.({ target: null });
            }, 200); // Very fast loading for iframe
          }}
        />
      </div>
    );
  }

  return <div ref={containerRef} className="videoke-stage-player" />;
};

export const VideokePage = () => {
  const { showToast } = useToast();
  const [query, setQuery] = useState(FALLBACK_QUERY);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSong, setActiveSong] = useState(null);
  const [ambientMode, setAmbientMode] = useState(true);
  const [queue, setQueue] = useState([]);
  const [playerError, setPlayerError] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showAutoplayPrompt, setShowAutoplayPrompt] = useState(false);
  const playerRef = useRef(null);
  const searchRequestIdRef = useRef(0);

  const registerPlayer = useCallback(playerInstance => {
    playerRef.current = playerInstance ?? null;
  }, []);

  const attemptPlay = useCallback(() => {
    const internalPlayer = playerRef.current;
    console.log(
      'attemptPlay called, player:',
      internalPlayer,
      'hasUserInteracted:',
      hasUserInteracted
    );

    if (!internalPlayer) {
      console.log('No player available for autoplay');
      return;
    }

    try {
      if (typeof internalPlayer.playVideo === 'function') {
        console.log('Using YouTube playVideo method');

        // Try autoplay for main player always
        setTimeout(() => {
          try {
            internalPlayer.playVideo();
            console.log('playVideo called successfully');
            setHasUserInteracted(true); // Mark as interacted after successful play
            setShowAutoplayPrompt(false); // Hide prompt if autoplay works
          } catch (playError) {
            console.log('playVideo failed:', playError);
            if (!hasUserInteracted) {
              // Show autoplay prompt after a delay if autoplay fails
              setTimeout(() => setShowAutoplayPrompt(true), 2000);
              showToast('Click the play button to start', 'info', 3000);
            }
          }
        }, 500);
        return;
      }

      if (typeof internalPlayer.play === 'function') {
        console.log('Using standard play method');
        const playPromise = internalPlayer.play();
        if (playPromise?.catch) {
          playPromise.catch(playError => {
            console.log('Autoplay failed:', playError);
            if (!hasUserInteracted) {
              showToast('Click the video to start playing', 'info', 3000);
            }
          });
        } else {
          setHasUserInteracted(true);
        }
      }
    } catch (playError) {
      console.error('Autoplay attempt failed', playError);
      if (!hasUserInteracted) {
        showToast('Click the video to start playing', 'info', 3000);
      }
    }
  }, [showToast, hasUserInteracted]);

  const searchVideoke = async nextQuery => {
    const finalQuery = (nextQuery ?? query)?.trim();
    if (!finalQuery) {
      setError('Please enter a song or artist.');
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (nextQuery && nextQuery !== query) {
      setQuery(finalQuery);
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      showToast('Searching for karaoke videos...', 'info', 1500);
      const ytResults = await searchYouTube(finalQuery);
      console.log('Search results received:', ytResults);

      if (requestId !== searchRequestIdRef.current) {
        return;
      }

      if (!ytResults || ytResults.length === 0) {
        console.log('No search results found');
        setError(
          'No results found. Try a different search term or check your internet connection.'
        );
        setQueue([]);
        return;
      }

      const formattedResults = ytResults
        .map(item => {
          console.log('Processing search item:', item);
          const rawId = item?.id;
          const videoId =
            (typeof rawId === 'string' && rawId) ||
            rawId?.videoId ||
            item?.videoId ||
            item?.video?.id ||
            item?.id?.id;

          console.log('Extracted video ID:', videoId, 'from item:', item);

          if (!videoId) {
            console.log('No valid video ID found for item:', item);
            return null;
          }

          const formattedItem = {
            id: videoId,
            title: item.title || item.snippet?.title || 'YouTube Video',
            source: 'YouTube',
            embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`, // NO autoplay for previews!
            playerUrl: `https://www.youtube.com/watch?v=${videoId}`,
            watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
            description:
              item.author || item.channel?.name || item.snippet?.channelTitle || 'YouTube Video',
          };

          console.log('Formatted item:', formattedItem);
          return formattedItem;
        })
        .filter(Boolean);

      console.log('Final formatted results:', formattedResults);
      setResults(formattedResults);
      setQueue([]);

      if (formattedResults.length > 0) {
        showToast(`Found ${formattedResults.length} karaoke tracks!`, 'success', 2000);
      }
    } catch (err) {
      if (requestId !== searchRequestIdRef.current) {
        return;
      }
      const errorMessage =
        err instanceof Error && err.message
          ? err.message
          : 'An unexpected error occurred while searching.';
      setError(`Failed to fetch results. ${errorMessage}`);
      setResults([]);
      setQueue([]);
      showToast('Search failed. Please try again.', 'error', 3000);
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('VideokePage mounted, searching for:', query);
    searchVideoke(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('Results changed:', results);
    if (results.length === 0) {
      setActiveSong(null);
      return;
    }

    if (!activeSong || !results.some(song => song.id === activeSong.id)) {
      console.log('Setting first result as active song:', results[0]);
      setActiveSong(results[0]);
      setQueue(results.slice(1));
      return;
    }
  }, [results, activeSong]);

  useEffect(() => {
    console.log('Active song changed:', activeSong);
    if (!activeSong && results.length > 0) {
      console.log('No active song but have results, setting first result');
      setActiveSong(results[0]);
      setQueue(results.slice(1));
    }
  }, [activeSong, results]);

  useEffect(() => {
    console.log('Clearing player error for active song:', activeSong?.id);
    setPlayerError(null);
  }, [activeSong?.id]);

  // Global click listener to enable autoplay
  useEffect(() => {
    const handleFirstClick = () => {
      if (!hasUserInteracted) {
        console.log('First user interaction detected');
        setHasUserInteracted(true);
      }
    };

    document.addEventListener('click', handleFirstClick);
    document.addEventListener('touchstart', handleFirstClick);

    return () => {
      document.removeEventListener('click', handleFirstClick);
      document.removeEventListener('touchstart', handleFirstClick);
    };
  }, [hasUserInteracted]);

  const handleSearchClick = () => {
    searchVideoke(query);
  };

  const handleInputChange = event => {
    setQuery(event.target.value);
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      searchVideoke(query);
    }
  };

  const handlePresetSelect = value => {
    searchVideoke(value);
  };

  const handleSelectSong = useCallback(
    (song, options = {}) => {
      console.log('handleSelectSong called with:', song, options);
      const { fromQueue = false } = options;
      const previousActive = activeSong;

      // Mark user interaction for autoplay permission
      setHasUserInteracted(true);

      // Clear any previous player errors when switching songs
      setPlayerError(null);
      setShowAutoplayPrompt(false); // Hide autoplay prompt when switching songs

      console.log('Setting active song:', song);
      setActiveSong(song);
      setQueue(prevQueue => {
        const withoutSong = prevQueue.filter(item => item.id !== song.id);
        if (fromQueue) {
          return withoutSong;
        }

        if (!previousActive || previousActive.id === song.id) {
          return withoutSong;
        }

        if (withoutSong.some(item => item.id === previousActive.id)) {
          return withoutSong;
        }

        return [previousActive, ...withoutSong];
      });

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [activeSong]
  );

  const handleOpenYoutube = () => {
    if (!activeSong) {
      return;
    }
    window.open(activeSong.watchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    if (!activeSong) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeSong.watchUrl);
      showToast('Song link copied to clipboard.', 'success', 2000);
    } catch (clipError) {
      console.error('Copy to clipboard failed', clipError);
      showToast('Copy failed. Tap the YouTube button instead.', 'error', 2800);
    }
  };

  const handleShuffle = () => {
    if (results.length < 2) {
      showToast('Need more songs to shuffle. Try another search.', 'info', 2800);
      return;
    }
    const pool = results.filter(song => song.id !== activeSong?.id);
    const nextSong = pool[Math.floor(Math.random() * pool.length)] || results[0];
    setActiveSong(nextSong);
    setQueue(pool.filter(item => item.id !== nextSong.id));
    showToast(`Random pick: ${nextSong.title}`, 'info', 2400);
  };

  const handleLyrics = () => {
    if (!activeSong) {
      return;
    }
    const queryString = encodeURIComponent(`${activeSong.title} lyrics`);
    window.open(`https://www.google.com/search?q=${queryString}`, '_blank', 'noopener,noreferrer');
  };

  const toggleAmbientMode = () => {
    setAmbientMode(prev => !prev);
    showToast(ambientMode ? 'Stage lights dimmed.' : 'Stage lights on!', 'info', 2000);
  };

  const handlePlayerError = useCallback(
    event => {
      console.error('YouTube player error', event);

      let message = 'Playback error. Trying next song...';

      if (event?.data === 150 || event?.data === 101) {
        message = 'This track is blocked from being played. Skipping to next song...';
      } else if (event?.data === 5) {
        message = 'HTML5 player error. Trying next song...';
      } else if (event?.data === 2) {
        message = 'Invalid video ID. Skipping to next song...';
      } else if (event instanceof Error && event.message) {
        message = `Error: ${event.message}. Trying next song...`;
      }

      setPlayerError(message);
      showToast(message, 'error', 2000);

      // Auto-play next song in queue if available
      setTimeout(() => {
        if (queue.length > 0) {
          const nextSong = queue[0];
          handleSelectSong(nextSong, { fromQueue: true });
          showToast(`Skipped to: ${nextSong.title}`, 'info', 2000);
        } else {
          showToast('No more songs in queue. Please add more tracks.', 'info', 3000);
        }
      }, 1500);
    },
    [showToast, queue, handleSelectSong]
  );

  const handleQueueAdd = song => {
    if (queue.some(queued => queued.id === song.id)) {
      showToast('Song already in queue.', 'info', 2000);
      return;
    }

    setQueue(prev => [...prev, song]);
    showToast(`Added to queue: ${song.title}`, 'success', 2200);
  };

  const handleQueueRemove = songId => {
    setQueue(prev => prev.filter(item => item.id !== songId));
  };

  const handleQueueClear = () => {
    setQueue([]);
    showToast('Queue cleared.', 'info', 1800);
  };

  const handlePlayNextFromQueue = (options = {}) => {
    const { auto = false } = options;
    if (queue.length === 0) {
      showToast(
        auto ? 'Queue finished. Add more tracks to keep singing.' : 'Queue is empty.',
        'info',
        2000
      );
      return;
    }
    const [nextSong, ...rest] = queue;
    handleSelectSong(nextSong, { fromQueue: true });
    setQueue(rest);
    if (!auto) {
      showToast(`Playing next: ${nextSong.title}`, 'success', 2000);
    }
  };

  const handleStageEnded = () => {
    handlePlayNextFromQueue({ auto: true });
  };

  useEffect(() => {
    if (activeSong) {
      attemptPlay();
    }
  }, [activeSong, attemptPlay]);

  const handleQueueReorder = (songId, direction) => {
    setQueue(prev => {
      const index = prev.findIndex(song => song.id === songId);
      if (index === -1) {
        return prev;
      }
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= prev.length) {
        return prev;
      }
      const newQueue = [...prev];
      const [song] = newQueue.splice(index, 1);
      newQueue.splice(swapIndex, 0, song);
      return newQueue;
    });
  };

  const controls = [
    {
      id: 'youtube',
      label: 'Open in YouTube',
      icon: <FiYoutube />,
      onClick: handleOpenYoutube,
    },
    {
      id: 'copy',
      label: 'Copy Link',
      icon: <FiCopy />,
      onClick: handleCopyLink,
    },
    {
      id: 'lyrics',
      label: 'Find Lyrics',
      icon: <FiBookOpen />,
      onClick: handleLyrics,
    },
    {
      id: 'shuffle',
      label: 'Shuffle Song',
      icon: <FiShuffle />,
      onClick: handleShuffle,
    },
    {
      id: 'lights',
      label: ambientMode ? 'Lights Off' : 'Lights On',
      icon: <FiZap />,
      onClick: toggleAmbientMode,
    },
    {
      id: 'next',
      label: 'Play Next in Queue',
      icon: <FiSkipForward />,
      onClick: handlePlayNextFromQueue,
    },
    {
      id: 'popout',
      label: 'Pop-out Player',
      icon: <FiExternalLink />,
      onClick: handleOpenYoutube,
    },
  ];

  return (
    <div className="videoke-page px-4 sm:px-8 md:px-16 pt-28 pb-24 text-white min-h-screen">
      <section className="videoke-hero">
        <div className="videoke-hero-copy">
          <span className="videoke-badge">Live Videoke Mode</span>
          <h1>Mic on. Lights on. Ready, set, belt it out!</h1>
          <p>
            Type an artist, song, or pick a preset setlist. Every result is tuned for karaoke night.
          </p>
        </div>

        <div className="videoke-search">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search for a song, artist, or genre (e.g., Morissette karaoke)"
          />
          <button type="button" onClick={handleSearchClick} disabled={isLoading}>
            {isLoading ? 'Searching…' : 'Search'}
          </button>
        </div>

        <div className="videoke-presets">
          {PRESET_QUERIES.map(preset => (
            <button
              key={preset.value}
              type="button"
              className={`videoke-preset ${query === preset.value ? 'active' : ''}`}
              onClick={() => handlePresetSelect(preset.value)}
              disabled={isLoading}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="videoke-error">{error}</p>}

      {isLoading && (
        <div className="videoke-loading">
          <div className="player-loading" />
          <p>Warming up the stage…</p>
        </div>
      )}

      {activeSong && !isLoading && (
        <section className={`videoke-stage ${ambientMode ? 'ambient' : ''}`}>
          <div className="videoke-stage-frame">
            <VideoPlayerErrorBoundary videoId={activeSong.id}>
              <YouTubeStagePlayer
                key={activeSong.id}
                videoId={activeSong.id}
                onReady={attemptPlay}
                onEnded={handleStageEnded}
                onError={handlePlayerError}
                registerPlayer={registerPlayer}
              />
            </VideoPlayerErrorBoundary>
            {showAutoplayPrompt && !hasUserInteracted && !playerError && (
              <div
                className="videoke-stage-fallback"
                style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">🎵 Autoplay Blocked</h3>
                  <p className="mb-4">Your browser blocked autoplay. Click to start singing!</p>
                  <button
                    type="button"
                    onClick={() => {
                      setHasUserInteracted(true);
                      setShowAutoplayPrompt(false);
                      attemptPlay();
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    ▶ Start Karaoke
                  </button>
                </div>
              </div>
            )}
            {playerError && (
              <div className="videoke-stage-fallback">
                <p>{playerError}</p>
                <button type="button" onClick={handleOpenYoutube}>
                  Watch on YouTube
                </button>
              </div>
            )}
          </div>
          <div className="videoke-stage-info">
            <span className="videoke-badge">Now Playing</span>
            <h2>{activeSong.title}</h2>
            <p>{activeSong.description}</p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setHasUserInteracted(true);
                  attemptPlay();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
              >
                ▶ Play Video
              </button>
              <button
                type="button"
                onClick={() =>
                  console.log(
                    'Current player:',
                    playerRef.current,
                    'Active song:',
                    activeSong,
                    'Has interacted:',
                    hasUserInteracted,
                    'Show prompt:',
                    showAutoplayPrompt
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🔍 Debug Info
              </button>
            </div>
          </div>
          <div className="videoke-controls">
            {controls.map(({ id, label, icon, onClick }) => (
              <button key={id} type="button" onClick={onClick}>
                <span className="icon">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {queue.length > 0 && !isLoading && (
        <section className="videoke-queue">
          <header className="videoke-queue-header">
            <div>
              <h3>Up Next</h3>
              <p>
                {queue.length} song{queue.length > 1 ? 's' : ''} lined up.
              </p>
            </div>
            <div className="videoke-queue-actions">
              <button type="button" onClick={() => handlePlayNextFromQueue()}>
                Play next
              </button>
              <button type="button" onClick={handleQueueClear}>
                Clear queue
              </button>
            </div>
          </header>
          <ol className="videoke-queue-list">
            {queue.map((song, index) => (
              <li key={song.id}>
                <div className="videoke-queue-item">
                  <div className="videoke-queue-meta">
                    <span className="videoke-queue-index">{index + 1}</span>
                    <div>
                      <h4 title={song.title}>{song.title}</h4>
                      <p title={song.description}>{song.description}</p>
                    </div>
                  </div>
                  <div className="videoke-queue-controls">
                    <button
                      type="button"
                      onClick={() => handleQueueReorder(song.id, 'up')}
                      aria-label="Move up"
                      disabled={index === 0}
                    >
                      <FiArrowUp />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQueueReorder(song.id, 'down')}
                      aria-label="Move down"
                      disabled={index === queue.length - 1}
                    >
                      <FiArrowDown />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQueueRemove(song.id)}
                      aria-label="Remove from queue"
                    >
                      <FiTrash2 />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSong(song, { fromQueue: true })}
                      aria-label="Play this song"
                    >
                      <FiPlay />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!isLoading && !error && results.length === 0 && (
        <p className="videoke-empty">No tracks yet for “{query}”. Try another vibe.</p>
      )}

      {!isLoading && results.length > 0 && (
        <section className="videoke-results">
          <header>
            <h3>Song line-up</h3>
            <p>Select a track to put it on the main stage.</p>
          </header>
          <div className="videoke-grid">
            {results.map(item => (
              <article
                key={item.id}
                className={`videoke-card ${activeSong?.id === item.id ? 'active' : ''}`}
              >
                <div className="videoke-card-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${item.id}?rel=0&modestbranding=1&autoplay=0&controls=0`}
                    title={item.title}
                    allowFullScreen={false}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ pointerEvents: 'none' }} // Prevent interaction with preview
                  />
                </div>
                <div className="videoke-card-body">
                  <h4 title={item.title}>{item.title}</h4>
                  <p title={item.description}>{item.description}</p>
                  <div className="videoke-card-actions">
                    <button type="button" onClick={() => handleSelectSong(item)}>
                      Sing this
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQueueAdd(item)}
                      disabled={
                        queue.some(queued => queued.id === item.id) || activeSong?.id === item.id
                      }
                    >
                      Add to queue
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(item.watchUrl, '_blank', 'noopener,noreferrer')}
                    >
                      Watch on YouTube
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
