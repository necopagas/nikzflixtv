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
                if (danglingScript?.parentNode) {
                    danglingScript.parentNode.removeChild(danglingScript);
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
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const readyRef = useRef(false);
    const lastVideoRef = useRef(null);

    const destroyPlayer = useCallback(() => {
        if (playerRef.current?.destroy) {
            try {
                playerRef.current.destroy();
            } catch (destroyError) {
                console.error('Failed to destroy YouTube player instance.', destroyError);
            }
        }
        playerRef.current = null;
        readyRef.current = false;
        lastVideoRef.current = null;
        registerPlayer?.(null);
    }, [registerPlayer]);

    useEffect(() => () => destroyPlayer(), [destroyPlayer]);

    useEffect(() => {
        let isActive = true;

        if (!videoId) {
            destroyPlayer();
            return undefined;
        }

        loadYouTubeIframeAPI()
            .then((YT) => {
                if (!isActive) {
                    return;
                }

                if (!containerRef.current) {
                    return;
                }

                const playerVars = {
                    autoplay: 1,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    enablejsapi: 1,
                    origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                };

                const bindExistingPlayer = () => {
                    if (!readyRef.current || !playerRef.current) {
                        return;
                    }
                    try {
                        if (lastVideoRef.current !== videoId) {
                            playerRef.current.loadVideoById(videoId);
                            lastVideoRef.current = videoId;
                        }
                        registerPlayer?.(playerRef.current);
                        onReady?.({ target: playerRef.current });
                    } catch (loadError) {
                        onError?.(loadError);
                    }
                };

                if (!playerRef.current) {
                    playerRef.current = new YT.Player(containerRef.current, {
                        videoId,
                        width: '100%',
                        height: '100%',
                        playerVars,
                        events: {
                            onReady: (event) => {
                                if (!isActive) {
                                    return;
                                }
                                readyRef.current = true;
                                lastVideoRef.current = videoId;
                                registerPlayer?.(event.target);
                                onReady?.(event);
                            },
                            onStateChange: (event) => {
                                if (!isActive) {
                                    return;
                                }
                                if (event.data === YT.PlayerState.ENDED) {
                                    onEnded?.();
                                }
                            },
                            onError: (event) => {
                                if (!isActive) {
                                    return;
                                }
                                onError?.(event);
                            },
                        },
                    });
                    registerPlayer?.(playerRef.current);
                } else {
                    bindExistingPlayer();
                }
            })
            .catch((error) => {
                if (!isActive) {
                    return;
                }
                onError?.(error);
            });

        return () => {
            isActive = false;
        };
    }, [videoId, onReady, onEnded, onError, registerPlayer, destroyPlayer]);

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
    const playerRef = useRef(null);
    const searchRequestIdRef = useRef(0);

    const registerPlayer = useCallback((playerInstance) => {
        playerRef.current = playerInstance ?? null;
    }, []);

    const attemptPlay = useCallback(() => {
        const internalPlayer = playerRef.current;
        if (!internalPlayer) {
            return;
        }

        try {
            if (typeof internalPlayer.playVideo === 'function') {
                internalPlayer.playVideo();
                return;
            }

            if (typeof internalPlayer.play === 'function') {
                const playPromise = internalPlayer.play();
                if (playPromise?.catch) {
                    playPromise.catch(() => {
                        showToast('Autoplay blocked. Tap play to continue.', 'info', 2400);
                    });
                }
            }
        } catch (playError) {
            console.error('Autoplay attempt failed', playError);
            showToast('Autoplay blocked. Tap play to continue.', 'info', 2400);
        }
    }, [showToast]);

    const searchVideoke = async (nextQuery) => {
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
            const ytResults = await searchYouTube(finalQuery);
            
            if (requestId !== searchRequestIdRef.current) {
                return;
            }

            if (!ytResults || ytResults.length === 0) {
                setError('No results found. Try a different search term.');
                setQueue([]);
                return;
            }
            
            const formattedResults = ytResults.map(item => {
                const rawId = item?.id;
                const videoId = (typeof rawId === 'string' && rawId)
                    || rawId?.videoId
                    || item?.videoId
                    || item?.video?.id
                    || item?.id?.id;

                if (!videoId) {
                    return null;
                }

                return {
                    id: videoId,
                    title: item.title || item.snippet?.title || 'YouTube Video',
                    source: 'YouTube',
                    embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
                    playerUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    description: item.channel?.name || item.snippet?.channelTitle || 'YouTube Video',
                };
            }).filter(Boolean);

            setResults(formattedResults);
            setQueue([]);

        } catch (err) {
            if (requestId !== searchRequestIdRef.current) {
                return;
            }
            const errorMessage = err instanceof Error && err.message
                ? err.message
                : 'An unexpected error occurred.';
            setError(`Failed to fetch results. ${errorMessage}`);
            setResults([]);
            setQueue([]);
        } finally {
            if (requestId === searchRequestIdRef.current) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        searchVideoke(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (results.length === 0) {
            setActiveSong(null);
            return;
        }

        if (!activeSong || !results.some((song) => song.id === activeSong.id)) {
            setActiveSong(results[0]);
            setQueue(results.slice(1));
            return;
        }
    }, [results, activeSong]);

    useEffect(() => {
        if (!activeSong && results.length > 0) {
            setActiveSong(results[0]);
            setQueue(results.slice(1));
        }
    }, [activeSong, results]);

    useEffect(() => {
        setPlayerError(null);
    }, [activeSong?.id]);

    const handleSearchClick = () => {
        searchVideoke(query);
    };

    const handleInputChange = (event) => {
        setQuery(event.target.value);
    };

    const handleKeyDown = (event) => {
         if (event.key === 'Enter') {
             searchVideoke(query);
         }
    };

    const handlePresetSelect = (value) => {
        searchVideoke(value);
    };

    const handleSelectSong = (song, options = {}) => {
        const { fromQueue = false } = options;
        const previousActive = activeSong;
        setActiveSong(song);
        setQueue((prevQueue) => {
            const withoutSong = prevQueue.filter((item) => item.id !== song.id);
            if (fromQueue) {
                return withoutSong;
            }

            if (!previousActive || previousActive.id === song.id) {
                return withoutSong;
            }

            if (withoutSong.some((item) => item.id === previousActive.id)) {
                return withoutSong;
            }

            return [previousActive, ...withoutSong];
        });
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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
        const pool = results.filter((song) => song.id !== activeSong?.id);
        const nextSong = pool[Math.floor(Math.random() * pool.length)] || results[0];
        setActiveSong(nextSong);
        setQueue(pool.filter((item) => item.id !== nextSong.id));
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
        setAmbientMode((prev) => !prev);
        showToast(ambientMode ? 'Stage lights dimmed.' : 'Stage lights on!', 'info', 2000);
    };

    const handlePlayerError = useCallback((event) => {
        console.error('YouTube player error', event);
        let message = 'Playback error. Try another track or open it on YouTube.';
        if (event?.data === 150 || event?.data === 101) {
            message = 'This track is blocked from being played in embedded players.';
        } else if (event instanceof Error && event.message) {
            message = event.message;
        }
        setPlayerError(message);
        showToast(message, 'error', 3200);
    }, [showToast]);

    const handleQueueAdd = (song) => {
        if (queue.some((queued) => queued.id === song.id)) {
            showToast('Song already in queue.', 'info', 2000);
            return;
        }

        setQueue((prev) => [...prev, song]);
        showToast(`Added to queue: ${song.title}`, 'success', 2200);
    };

    const handleQueueRemove = (songId) => {
        setQueue((prev) => prev.filter((item) => item.id !== songId));
    };

    const handleQueueClear = () => {
        setQueue([]);
        showToast('Queue cleared.', 'info', 1800);
    };

    const handlePlayNextFromQueue = (options = {}) => {
        const { auto = false } = options;
        if (queue.length === 0) {
            showToast(auto ? 'Queue finished. Add more tracks to keep singing.' : 'Queue is empty.', 'info', 2000);
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
        setQueue((prev) => {
            const index = prev.findIndex((song) => song.id === songId);
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
                    <p>Type an artist, song, or pick a preset setlist. Every result is tuned for karaoke night.</p>
                </div>

                <div className="videoke-search">
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for a song, artist, or genre (e.g., Morissette karaoke)"
                    />
                    <button
                        type="button"
                        onClick={handleSearchClick}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Searching…' : 'Search'}
                    </button>
                </div>

                <div className="videoke-presets">
                    {PRESET_QUERIES.map((preset) => (
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

            {error && (
                <p className="videoke-error">{error}</p>
            )}

            {isLoading && (
                <div className="videoke-loading">
                    <div className="player-loading" />
                    <p>Warming up the stage…</p>
                </div>
            )}

            {activeSong && !isLoading && (
                <section className={`videoke-stage ${ambientMode ? 'ambient' : ''}`}>
                    <div className="videoke-stage-frame">
                        <YouTubeStagePlayer
                            key={activeSong.id}
                            videoId={activeSong.id}
                            onReady={attemptPlay}
                            onEnded={handleStageEnded}
                            onError={handlePlayerError}
                            registerPlayer={registerPlayer}
                        />
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
                            <p>{queue.length} song{queue.length > 1 ? 's' : ''} lined up.</p>
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
                                                    <button type="button" onClick={() => handleQueueRemove(song.id)} aria-label="Remove from queue">
                                                        <FiTrash2 />
                                                    </button>
                                                    <button type="button" onClick={() => handleSelectSong(song, { fromQueue: true })} aria-label="Play this song">
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
                        {results.map((item) => (
                            <article
                                key={item.id}
                                className={`videoke-card ${activeSong?.id === item.id ? 'active' : ''}`}
                            >
                                <div className="videoke-card-video">
                                    <iframe
                                        src={item.embedUrl}
                                        title={item.title}
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
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
                                            disabled={queue.some((queued) => queued.id === item.id) || activeSong?.id === item.id}
                                        >
                                            Add to queue
                                        </button>
                                        <button type="button" onClick={() => window.open(item.watchUrl, '_blank', 'noopener,noreferrer')}>
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
