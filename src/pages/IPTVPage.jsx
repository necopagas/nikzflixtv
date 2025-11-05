// src/pages/IPTVPage.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { IPTVPlayer } from '../components/IPTVPlayer';
import { useIPTVSync } from '../hooks/useIPTVSync'; // Auto-sync hook
import { useChannelHealth } from '../hooks/useChannelHealth'; // Health check hook
import { FaSync, FaHeartbeat, FaCircle, FaSearch } from 'react-icons/fa';
import ChannelRequestModal from '../components/ChannelRequestModal';
import { useChannelDiscovery } from '../hooks/useChannelDiscovery';
import { getSeededScrapeCandidates } from '../utils/scrapeSeeds';

const DISCOVERY_STORAGE_KEY = 'iptv_discovery_cache_v1';
const MAX_DISCOVERY_CANDIDATES = 10;
const DISCOVERY_CACHE_STALE_MS = 30 * 60 * 1000;
const DISCOVERY_SUCCESS_TTL = 12 * 60 * 60 * 1000;

const buildDiscoveryKey = (channel) => {
  if (!channel) return '';
  const normalizedParts = [
    channel.discoveryKey,
    channel.id,
    channel.slug,
    channel.name,
    channel.number,
    channel.originalName,
  ]
    .filter((value) => value != null)
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);

  const joined = normalizedParts.length ? normalizedParts.join('::') : '';
  const fallback = typeof channel.url === 'string' ? channel.url.trim().toLowerCase() : '';
  return joined || fallback;
};

export const IPTVPage = () => {
  // Use auto-sync hook (syncs once per hour)
  const { channels, isSyncing, syncStatus, syncChannels, hasUpdates } = useIPTVSync(true);
  const [userChannels, setUserChannels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iptv_user_channels') || '[]'); }
    catch { return []; }
  });
  
  // Use health check hook
  // Merge built-in with user-submitted and locally queued requests (by URL)
  const allChannels = useMemo(() => {
    let queued = [];
    try { queued = JSON.parse(localStorage.getItem('pending_channel_requests') || '[]'); }
    catch { queued = []; }
    const queuedPlayable = queued.filter(ch => ch?.url);
    const byUrl = new Map();
    [...userChannels, ...queuedPlayable, ...channels].forEach(ch => {
      if (ch?.url && !byUrl.has(ch.url)) byUrl.set(ch.url, ch);
    });
    return Array.from(byUrl.values());
  }, [channels, userChannels]);

  const { 
    healthMap, 
    isChecking, 
    progress,
    checkAllChannels, 
    getStats, 
    getHealth,
  } = useChannelHealth(allChannels, true); // Auto-check on mount
  
  const [selectedChannel, setSelectedChannel] = useState(null);
  // Start not-loading by default; we only show the spinner when there's an actual channel to load
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iptv_favorites') || '[]'); }
    catch { return []; }
  });
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { discover: discoverStreams } = useChannelDiscovery({
    country: 'PH',
    maxResults: 6,
    includeInternational: false,
    localOnly: true,
    verify: true,
    verifyLimit: 2,
    verifyTimeout: 4000,
  });
  const discoveryCacheRef = useRef(new Map());
  const discoveryInFlightRef = useRef(null);
  const selectedChannelRef = useRef(null);
  const discoveryPersistTimerRef = useRef(null);
  const discoveryStoreLoadedRef = useRef(false);
  const discoverySeedsPrimedRef = useRef(false);
  const [isDiscoveryChecking, setIsDiscoveryChecking] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState(null);

  const applySavedDiscovery = useCallback((channel) => {
    if (!channel || !channel.name) return channel;
    const cacheKey = buildDiscoveryKey(channel);
    if (!cacheKey) return channel;

    const cache = discoveryCacheRef.current.get(cacheKey);
    if (!cache || !Array.isArray(cache.queue) || cache.queue.length === 0) return channel;

    const now = Date.now();
    const eligibleEntries = cache.queue.filter((entry) => {
      if (!entry || typeof entry.url !== 'string' || entry.url.length < 5) return false;
      if (entry.requiresProxy) return false;
      if (entry.health && entry.health.isAlive === false) return false;
      return true;
    });

    if (!eligibleEntries.length) return channel;

    const successfulEntries = eligibleEntries.filter((entry) => {
      if (!entry.lastSuccess) return false;
      return now - entry.lastSuccess <= DISCOVERY_SUCCESS_TTL;
    });

    if (!successfulEntries.length) return channel;

    const bestCandidate = successfulEntries.reduce((best, entry) => {
      if (!best) return entry;
      const bestScore = best.lastSuccess || 0;
      const entryScore = entry.lastSuccess || 0;
      return entryScore > bestScore ? entry : best;
    }, null);

    if (!bestCandidate || !bestCandidate.url) return channel;

    const normalizedCurrent = typeof channel.url === 'string' ? channel.url.trim() : '';
    if (normalizedCurrent === bestCandidate.url) return channel;

    return {
      ...channel,
      url: bestCandidate.url,
      originalUrl: channel.originalUrl || channel.url,
      type: bestCandidate.type || channel.type,
      discoveryKey: channel.discoveryKey || cacheKey,
      discoveryMeta: {
        candidateName: bestCandidate.candidateName || channel.name,
        quality: bestCandidate.quality || null,
        source: bestCandidate.source || 'discovery-cache',
        reason: 'cached-success',
        verified: typeof bestCandidate.health?.isAlive === 'boolean' ? bestCandidate.health.isAlive : null,
        cacheKey,
        streamUrl: bestCandidate.url,
        type: bestCandidate.type || null,
        health: bestCandidate.health || null,
        discoveredAt: bestCandidate.discoveredAt || null,
        attemptedAt: bestCandidate.lastAttempt || bestCandidate.attemptedAt || null,
        requiresProxy: Boolean(bestCandidate.requiresProxy),
        restoredFromCache: true,
        lastSuccess: bestCandidate.lastSuccess || null,
      },
    };
  }, []);


  // Find first channel or last played
  useEffect(() => {
    if (allChannels.length === 0) return;

    const lastUrl = localStorage.getItem('iptv_last_channel');
    let initialChannel = null;
    if (lastUrl) {
      initialChannel = allChannels.find((c) => c.url === lastUrl);
    }
    if (!initialChannel && allChannels.length > 0) {
      initialChannel = allChannels[0];
    }

    const hydratedChannel = applySavedDiscovery(initialChannel);
    setSelectedChannel(hydratedChannel);
    setLoading(!!hydratedChannel);
  }, [allChannels, applySavedDiscovery]);

  // Safety: if loading doesn't resolve (player didn't call onCanPlay), clear spinner after 10s
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      // If still loading after 10s, stop spinner so page isn't stuck black
      setLoading(false);
      console.warn('IPTV player did not become ready within 10s — hiding spinner');
    }, 10000);
    return () => clearTimeout(t);
  }, [loading]);

  // Save last played channel
  useEffect(() => {
    if (selectedChannel?.url) {
      localStorage.setItem('iptv_last_channel', selectedChannel.url);
    }
  }, [selectedChannel?.url]);

  useEffect(() => {
    selectedChannelRef.current = selectedChannel;
  }, [selectedChannel]);

  useEffect(() => {
    if (!discoveryStatus || isDiscoveryChecking) return;
    const timer = setTimeout(() => {
      setDiscoveryStatus(null);
    }, 12000);
    return () => clearTimeout(timer);
  }, [discoveryStatus, isDiscoveryChecking]);

  useEffect(() => {
    const meta = selectedChannel?.discoveryMeta;
    if (!meta) return;
    if (meta.restoredFromCache) {
      setIsDiscoveryChecking(false);
      setDiscoveryStatus(
        `Using cached backup stream${meta.source ? ` (${meta.source})` : ''}`
      );
    }
  }, [selectedChannel]);

  const persistDiscoveryCache = useCallback((immediate = false) => {
    if (typeof window === 'undefined') return;

    const run = () => {
      discoveryPersistTimerRef.current = null;
      try {
        const snapshot = {};
        discoveryCacheRef.current.forEach((entry, key) => {
          if (!entry || !Array.isArray(entry.queue) || entry.queue.length === 0) return;
          const sanitizedQueue = entry.queue
            .filter((item) => item && typeof item.url === 'string' && item.url.length > 4)
            .slice(0, MAX_DISCOVERY_CANDIDATES)
            .map((item) => ({
              url: item.url,
              type: item.type ?? null,
              quality: item.quality ?? null,
              source: item.source ?? null,
              candidateName: item.candidateName ?? null,
              requiresProxy: Boolean(item.requiresProxy),
              health: item.health && typeof item.health === 'object'
                ? {
                    isAlive: typeof item.health.isAlive === 'boolean' ? item.health.isAlive : null,
                    status: item.health.status ?? null,
                    latency: item.health.latency ?? null,
                  }
                : null,
              lastSuccess: item.lastSuccess ?? null,
              discoveredAt: item.discoveredAt ?? null,
              attemptedAt: item.lastAttempt ?? item.attemptedAt ?? null,
            }));

          if (!sanitizedQueue.length) return;

          const attemptsArray = Array.from(
            entry.attempts instanceof Set
              ? entry.attempts
              : new Set(Array.isArray(entry.attempts) ? entry.attempts : [])
          ).filter((value) => typeof value === 'string' && value.length > 4);

          snapshot[key] = {
            queue: sanitizedQueue,
            timestamp: entry.timestamp || Date.now(),
            attempts: attemptsArray,
          };
        });

        localStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.warn('[IPTV] Failed to persist discovery cache', error);
      }
    };

    if (immediate) {
      if (discoveryPersistTimerRef.current) {
        clearTimeout(discoveryPersistTimerRef.current);
        discoveryPersistTimerRef.current = null;
      }
      run();
      return;
    }

    if (discoveryPersistTimerRef.current) return;
    discoveryPersistTimerRef.current = setTimeout(run, 500);
  }, []);

  useEffect(() => () => {
    if (discoveryPersistTimerRef.current) {
      clearTimeout(discoveryPersistTimerRef.current);
      discoveryPersistTimerRef.current = null;
    }
    persistDiscoveryCache(true);
  }, [persistDiscoveryCache]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (discoveryStoreLoadedRef.current) return;
    discoveryStoreLoadedRef.current = true;

    try {
      const raw = localStorage.getItem(DISCOVERY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      const map = discoveryCacheRef.current;
      Object.entries(parsed).forEach(([key, value]) => {
        if (!value || !Array.isArray(value.queue) || value.queue.length === 0) return;

        const queue = value.queue
          .map((item) => {
            if (!item || typeof item.url !== 'string' || item.url.length < 5) return null;
            return {
              url: item.url,
              type: item.type ?? undefined,
              quality: item.quality ?? null,
              source: item.source ?? null,
              candidateName: item.candidateName ?? null,
              requiresProxy: Boolean(item.requiresProxy),
              health: item.health && typeof item.health === 'object'
                ? {
                    isAlive: typeof item.health.isAlive === 'boolean' ? item.health.isAlive : null,
                    status: item.health.status ?? null,
                    latency: item.health.latency ?? null,
                  }
                : null,
              lastSuccess: item.lastSuccess ?? null,
              discoveredAt: item.discoveredAt ?? null,
              lastAttempt: item.attemptedAt ?? null,
            };
          })
          .filter(Boolean)
          .slice(0, MAX_DISCOVERY_CANDIDATES);

        if (!queue.length) return;

        map.set(key, {
          queue,
          index: 0,
          attempts: new Set(
            Array.isArray(value.attempts)
              ? value.attempts.filter((attempt) => typeof attempt === 'string' && attempt.length > 4)
              : []
          ),
          timestamp: value.timestamp || 0,
          pending: null,
        });
      });
    } catch (error) {
      console.warn('[IPTV] Failed to restore discovery cache', error);
    }
  }, []);

  useEffect(() => {
    if (!discoveryStoreLoadedRef.current) return;
    if (discoverySeedsPrimedRef.current) return;
    if (!allChannels.length) return;

    let mutated = false;
    const now = Date.now();

    allChannels.forEach((channel) => {
      const cacheKey = buildDiscoveryKey(channel);
      if (!cacheKey) return;

      const seeds = getSeededScrapeCandidates(channel.name, {
        maxResults: MAX_DISCOVERY_CANDIDATES,
        localOnly: true,
        targetRegion: 'philippines',
      });

      if (!seeds.length) return;

      let cache = discoveryCacheRef.current.get(cacheKey);
      if (!cache) {
        cache = {
          queue: [],
          index: 0,
          attempts: new Set(),
          timestamp: 0,
          pending: null,
        };
        discoveryCacheRef.current.set(cacheKey, cache);
      }

      if (!(cache.attempts instanceof Set)) {
        cache.attempts = new Set(Array.isArray(cache.attempts) ? cache.attempts : []);
      }
      if (!Array.isArray(cache.queue)) {
        cache.queue = [];
      }

      seeds.forEach((candidate) => {
        candidate.streams.forEach((stream) => {
          if (!stream?.url) return;
          const exists = cache.queue.some((entry) => entry?.url === stream.url);
          if (exists) return;
          cache.queue.push({
            url: stream.url,
            type: stream.streamType || null,
            quality: stream.quality || null,
            source: stream.source || candidate.source || 'seeded-scrape',
            candidateName: candidate.name,
            requiresProxy: Boolean(stream.requiresProxy),
            health: null,
            lastSuccess: null,
            discoveredAt: now,
            attemptedAt: null,
            seeded: true,
          });
          mutated = true;
        });
      });

      if (cache.queue.length > MAX_DISCOVERY_CANDIDATES) {
        cache.queue = cache.queue.slice(0, MAX_DISCOVERY_CANDIDATES);
      }

      if (mutated) {
        cache.timestamp = now;
      }
    });

    if (mutated) {
      persistDiscoveryCache(true);
    }

    discoverySeedsPrimedRef.current = true;
  }, [allChannels, persistDiscoveryCache]);

  // Save favorites
  useEffect(() => {
    localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const recordDiscoverySuccess = useCallback((channel) => {
    if (!channel || !channel.url) return;

    const cacheKey = channel.discoveryMeta?.cacheKey || buildDiscoveryKey(channel);
    if (!cacheKey) return;

    let cache = discoveryCacheRef.current.get(cacheKey);
    if (!cache) {
      cache = {
        queue: [],
        index: 0,
        attempts: new Set(),
        timestamp: 0,
        pending: null,
      };
      discoveryCacheRef.current.set(cacheKey, cache);
    }

    if (!Array.isArray(cache.queue)) {
      cache.queue = [];
    }

    if (!(cache.attempts instanceof Set)) {
      cache.attempts = new Set(Array.isArray(cache.attempts) ? cache.attempts : []);
    }

    const successUrl = channel.url;
    const queue = cache.queue;
    const existingIndex = queue.findIndex((entry) => entry?.url === successUrl);
    const baseEntry = existingIndex >= 0 ? queue[existingIndex] : null;

    const sourceMeta = channel.discoveryMeta || {};
    const enrichedEntry = {
      ...(baseEntry || {}),
      url: successUrl,
      type: sourceMeta.type || channel.type || baseEntry?.type,
      candidateName: sourceMeta.candidateName || baseEntry?.candidateName || channel.name,
      source: sourceMeta.source || baseEntry?.source || 'discovery',
      quality: sourceMeta.quality || baseEntry?.quality || null,
      requiresProxy: Boolean(sourceMeta.requiresProxy ?? baseEntry?.requiresProxy),
      health: (() => {
        const output = { ...(baseEntry?.health || {}) };
        if (typeof sourceMeta.verified === 'boolean') {
          output.isAlive = sourceMeta.verified;
        }
        if (sourceMeta.health && typeof sourceMeta.health === 'object') {
          if (typeof sourceMeta.health.isAlive === 'boolean') output.isAlive = sourceMeta.health.isAlive;
          if (sourceMeta.health.status) output.status = sourceMeta.health.status;
          if (sourceMeta.health.latency != null) output.latency = sourceMeta.health.latency;
        }
        return Object.keys(output).length ? output : null;
      })(),
      lastSuccess: Date.now(),
    };

    const filteredQueue = queue
      .filter((entry, index) => entry && entry.url && index !== existingIndex && entry.url !== successUrl)
      .slice(0, MAX_DISCOVERY_CANDIDATES - 1);

    cache.queue = [enrichedEntry, ...filteredQueue];
    cache.index = 0;
    cache.timestamp = Date.now();
    const cleanedSuccess = successUrl.trim();
    const remainingFailures = new Set();
    cache.attempts.forEach((value) => {
      if (typeof value !== 'string') return;
      const normalized = value.trim();
      if (!normalized || normalized === cleanedSuccess) return;
      remainingFailures.add(normalized);
    });
    cache.attempts = remainingFailures;
    discoveryCacheRef.current.set(cacheKey, cache);
    persistDiscoveryCache();
    setIsDiscoveryChecking(false);
    const label = sourceMeta.source || sourceMeta.candidateName || channel.name;
    setDiscoveryStatus(
      `Stream verified${label ? ` (${label})` : ''}`
    );
  }, [persistDiscoveryCache]);

  // Auto re-check when channel list changes (checks are cached per URL for 5 minutes)
  useEffect(() => {
    if (allChannels.length === 0) return;
    // Trigger if there are channels without health entries
    const missing = allChannels.some(ch => !healthMap.get(ch.url));
    if (missing && !isChecking) {
      checkAllChannels();
    }
  }, [allChannels, healthMap, isChecking, checkAllChannels]);

  // Periodic background health checks every 15 minutes
  useEffect(() => {
    if (allChannels.length === 0) return;
    const interval = setInterval(() => {
      if (!isChecking) {
        checkAllChannels();
      }
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [allChannels.length, isChecking, checkAllChannels]);

  const categories = useMemo(() => ['all', ...new Set(allChannels.map(c => c.category).filter(Boolean))], [allChannels]);

  const discoveryIndicatorClass = useMemo(() => {
    if (!discoveryStatus) return '';
    if (isDiscoveryChecking) return 'text-yellow-400 animate-pulse';
    const lowered = discoveryStatus.toLowerCase();
    if (lowered.includes('failed') || lowered.includes('no backup')) {
      return 'text-red-400';
    }
    if (lowered.includes('attempting') || lowered.includes('switching')) {
      return 'text-yellow-400';
    }
    return 'text-green-400';
  }, [discoveryStatus, isDiscoveryChecking]);

  // Filter channels based on search and category
  const filtered = useMemo(() => allChannels.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'all' || ch.category === category;
    return matchesSearch && matchesCat;
  }), [allChannels, search, category]);

  // Handle channel selection
  const play = useCallback((ch) => {
    if (!ch) return;
    const hydratedChannel = applySavedDiscovery(ch);
    const targetUrl = hydratedChannel?.url || ch.url;
    if (targetUrl !== selectedChannel?.url) {
      setLoading(true); // Show spinner immediately when clicking a new channel
      setSelectedChannel(hydratedChannel ?? ch);
      setIsDiscoveryChecking(false);
      setDiscoveryStatus(null);
    }
  }, [applySavedDiscovery, selectedChannel?.url]);

  // Toggle favorite status
  const toggleFavorite = useCallback((ch, e) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(ch.name) ? prev.filter(n => n !== ch.name) : [...prev, ch.name]);
  }, []);

  // Player event handlers (stable with useCallback)
  const onPlayerCanPlay = useCallback(() => {
    setLoading(false);
    setIsDiscoveryChecking(false);
    const current = selectedChannelRef.current;
    if (current?.discoveryMeta?.streamUrl) {
      recordDiscoverySuccess(current);
    }
  }, [recordDiscoverySuccess]);

  const attemptDiscoveryFallback = useCallback((reason, options = {}) => {
    if (discoveryInFlightRef.current) return discoveryInFlightRef.current;

    const { skipFailure = false, forceRefresh = false } = options;
    const currentSnapshot = selectedChannelRef.current;
    if (currentSnapshot?.name) {
      const prefix = reason === 'manual-discovery' ? 'Searching backups for' : 'Recovering stream for';
      setDiscoveryStatus(`${prefix} ${currentSnapshot.name}...`);
    } else {
      setDiscoveryStatus('Searching for backup stream...');
    }
    setIsDiscoveryChecking(true);

    const run = (async () => {
      const currentChannel = selectedChannelRef.current;
      if (!currentChannel || !currentChannel.name) {
        setLoading(false);
        setIsDiscoveryChecking(false);
        return;
      }

      setLoading(true);

      const cacheKey = buildDiscoveryKey(currentChannel);
      if (!cacheKey) {
        setLoading(false);
        setIsDiscoveryChecking(false);
        return;
      }

      let cache = discoveryCacheRef.current.get(cacheKey);
      if (!cache) {
        cache = {
          queue: [],
          index: 0,
          attempts: new Set(),
          timestamp: 0,
          pending: null,
        };
        discoveryCacheRef.current.set(cacheKey, cache);
      } else if (!(cache.attempts instanceof Set)) {
        cache.attempts = new Set(Array.isArray(cache.attempts) ? cache.attempts : []);
      }

      let persistNeeded = false;

      const registerFailure = (url) => {
        if (skipFailure) return;
        if (!url || typeof url !== 'string') return;
        const normalized = url.trim();
        if (normalized.length < 5) return;
        if (!cache.attempts.has(normalized)) {
          cache.attempts.add(normalized);
          persistNeeded = true;
        }
      };

      registerFailure(currentChannel.url);
      registerFailure(currentChannel.originalUrl);

      const now = Date.now();
      const isStale =
        forceRefresh ||
        !cache.queue.length ||
        cache.index >= cache.queue.length ||
        now - cache.timestamp > DISCOVERY_CACHE_STALE_MS;

      if (forceRefresh) {
        cache.queue = Array.isArray(cache.queue) ? cache.queue : [];
        cache.index = 0;
        cache.timestamp = 0;
      }

      const ensureQueue = async () => {
        const results = await discoverStreams(currentChannel.name, {
          verify: true,
          verifyLimit: 2,
          includeInternational: false,
          localOnly: true,
        });

        const queue = [];
        const seen = new Set();
        const discoveryStamp = Date.now();
        results.forEach((candidate) => {
          if (!candidate?.streams?.length) return;
          candidate.streams.forEach((stream) => {
            const rawUrl = typeof stream?.url === 'string' ? stream.url.trim() : '';
            if (rawUrl.length < 5) return;
            if (seen.has(rawUrl)) return;
            seen.add(rawUrl);

            queue.push({
              url: rawUrl,
              type: stream.streamType && stream.streamType !== 'unknown' ? stream.streamType : undefined,
              requiresProxy: Boolean(stream.requiresProxy),
              health: stream.health || null,
              quality: stream.quality || null,
              candidateName: candidate.name,
              source: stream.source || candidate.source || 'discovery',
              discoveredAt: discoveryStamp,
            });
          });
        });

        cache.queue = queue;
        cache.index = 0;
        cache.timestamp = Date.now();
        persistNeeded = true;
      };

      if (isStale) {
        if (!cache.pending) {
          cache.pending = ensureQueue();
        }
        try {
          await cache.pending;
        } catch (error) {
          console.warn('[IPTV] Discovery fallback fetch failed', error);
          setLoading(false);
          setIsDiscoveryChecking(false);
          if (persistNeeded) persistDiscoveryCache();
          return;
        } finally {
          cache.pending = null;
        }
      }

      let nextCandidate = null;
      while (cache.index < cache.queue.length) {
        const candidate = cache.queue[cache.index];
        cache.index += 1;
        if (!candidate?.url) continue;
        if (candidate.requiresProxy) {
          registerFailure(candidate.url);
          continue;
        }
        if (cache.attempts.has(candidate.url)) continue;
        if (candidate.health && candidate.health.isAlive === false) {
          registerFailure(candidate.url);
          continue;
        }
        if (candidate.url === currentChannel.url) continue;
        candidate.lastAttempt = Date.now();
        cache.timestamp = Date.now();
        nextCandidate = candidate;
        persistNeeded = true;
        break;
      }

      if (!nextCandidate) {
        console.warn('[IPTV] No discovery fallback streams available for', currentChannel.name);
        setLoading(false);
        setIsDiscoveryChecking(false);
        setDiscoveryStatus('No backup stream found');
        if (persistNeeded) persistDiscoveryCache();
        return;
      }

      console.info('[IPTV] Switching to discovery fallback stream', nextCandidate.url);
      setLoading(true);
      setSelectedChannel((channelState) => {
        if (!channelState) return channelState;

        const nextChannel = {
          ...channelState,
          url: nextCandidate.url,
          originalUrl: channelState.originalUrl || channelState.url,
          type: nextCandidate.type || channelState.type,
          discoveryKey: channelState.discoveryKey || cacheKey,
          discoveryMeta: {
            candidateName: nextCandidate.candidateName,
            quality: nextCandidate.quality,
            source: nextCandidate.source,
            reason,
            verified: typeof nextCandidate.health?.isAlive === 'boolean' ? nextCandidate.health.isAlive : null,
            cacheKey,
            streamUrl: nextCandidate.url,
            type: nextCandidate.type || null,
            health: nextCandidate.health || null,
            discoveredAt: nextCandidate.discoveredAt || Date.now(),
            attemptedAt: nextCandidate.lastAttempt || Date.now(),
            requiresProxy: Boolean(nextCandidate.requiresProxy),
          },
        };

        return nextChannel;
      });
      setDiscoveryStatus(
        `Switching to backup stream${nextCandidate.candidateName ? ` (${nextCandidate.candidateName})` : ''}${nextCandidate.source ? ` from ${nextCandidate.source}` : ''}`
      );
      if (persistNeeded) persistDiscoveryCache();
    })();

    discoveryInFlightRef.current = run
      .catch((error) => {
        console.warn('[IPTV] Discovery fallback failed', error);
        setLoading(false);
        setIsDiscoveryChecking(false);
        setDiscoveryStatus('Backup search failed');
      })
      .finally(() => {
        discoveryInFlightRef.current = null;
      });

    return discoveryInFlightRef.current;
  }, [discoverStreams, persistDiscoveryCache]);

  const handleManualDiscovery = useCallback(() => {
    if (!selectedChannel) return;
    attemptDiscoveryFallback('manual-discovery', {
      skipFailure: true,
      forceRefresh: true,
    });
  }, [attemptDiscoveryFallback, selectedChannel]);

  const onPlayerError = useCallback((fallbackPayload) => {
    const payload = typeof fallbackPayload === 'string' ? { url: fallbackPayload } : (fallbackPayload || {});
    const fallbackUrl = payload?.url;

    if (!fallbackUrl) {
      console.warn('Player error with no static fallback URL available. Triggering discovery.', payload.reason || '');
      setIsDiscoveryChecking(true);
      attemptDiscoveryFallback(payload.reason || 'no-static-fallback');
      return;
    }

    console.warn('Player error, attempting fallback:', fallbackUrl);
    setLoading(true);
    setDiscoveryStatus('Attempting built-in fallback stream...');
    setIsDiscoveryChecking(false);
    let switched = false;
    let shouldTriggerDiscovery = false;

    setSelectedChannel((currentChannel) => {
      if (!currentChannel) {
        setLoading(false);
        return currentChannel;
      }

      if (currentChannel.url === fallbackUrl && (!payload.type || currentChannel.type === payload.type)) {
        setLoading(false);
        shouldTriggerDiscovery = true;
        return currentChannel;
      }

      const nextChannel = { ...currentChannel, url: fallbackUrl };
      const originalSource = payload.originalUrl || currentChannel.originalUrl || currentChannel.url;
      if (originalSource) {
        nextChannel.originalUrl = originalSource;
      }

      if (payload.type) {
        nextChannel.type = payload.type;
      }

      if (nextChannel.discoveryMeta) {
        delete nextChannel.discoveryMeta;
      }

      switched = true;

      return nextChannel;
    });

    if (!switched && shouldTriggerDiscovery) {
      attemptDiscoveryFallback(payload.reason || 'duplicate-fallback');
    }
  }, [attemptDiscoveryFallback]);

  return (
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--brand-color)] bg-gradient-to-r from-[var(--brand-color)] to-red-600 bg-clip-text text-transparent">
              Live TV
            </h1>
            {discoveryStatus && (
              <div className="flex items-center gap-2 text-sm text-gray-200">
                <FaCircle className={discoveryIndicatorClass} size={10} />
                <span className="leading-snug">{discoveryStatus}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:justify-end">
            {/* Health Check Button */}
            <button
              onClick={checkAllChannels}
              disabled={isChecking}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all ${
                isChecking
                  ? 'bg-blue-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
              title="Check channel health"
            >
              <FaHeartbeat className={isChecking ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">
                {isChecking
                  ? `Checking ${progress.current}/${progress.total}...`
                  : 'Check Health'}
              </span>
              <span className="sm:hidden text-xs font-semibold">
                {isChecking ? 'Checking' : 'Health'}
              </span>
            </button>

            {/* Sync Button */}
            <button
              onClick={syncChannels}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all ${
                isSyncing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : hasUpdates
                  ? 'bg-yellow-600 hover:bg-yellow-500 animate-pulse'
                  : syncStatus === 'success'
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-[var(--brand-color)] hover:bg-red-600'
              }`}
              title={hasUpdates ? 'Channel updates available!' : 'Sync IPTV channels'}
            >
              <FaSync className={isSyncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">
                {isSyncing
                  ? 'Syncing...'
                  : hasUpdates
                  ? `${channels.length} Channels (Updates!)`
                  : `${channels.length} Channels`}
              </span>
              <span className="sm:hidden text-xs font-semibold">
                {isSyncing ? 'Sync' : `${channels.length}`}
              </span>
            </button>

            {/* Discover Backup Button */}
            <button
              onClick={handleManualDiscovery}
              disabled={isDiscoveryChecking || !selectedChannel}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all ${
                isDiscoveryChecking || !selectedChannel
                  ? 'bg-indigo-700 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
              title="Search for alternative streams"
            >
              <FaSearch className={isDiscoveryChecking ? 'animate-pulse' : ''} />
              <span className="hidden md:inline">
                {isDiscoveryChecking ? 'Searching...' : 'Find Backup'}
              </span>
              <span className="md:hidden text-xs font-semibold">
                {isDiscoveryChecking ? 'Searching' : 'Backup'}
              </span>
            </button>

            {/* Request Channel Button */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500"
              title="Suggest a new channel"
            >
              <span className="sm:hidden text-xs font-semibold">Request</span>
              <span className="hidden sm:inline">+ Request Channel</span>
            </button>
          </div>
        </div>

        {/* Health Stats Bar */}
        {getStats.checked > 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <FaCircle className="text-green-500 text-xs" />
                <span className="text-sm">
                  <strong className="text-green-500">{getStats.online}</strong> Online
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaCircle className="text-red-500 text-xs" />
                <span className="text-sm">
                  <strong className="text-red-500">{getStats.offline}</strong> Offline
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaCircle className="text-yellow-500 text-xs" />
                <span className="text-sm">
                  <strong className="text-yellow-500">{getStats.timeout}</strong> Timeout
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaCircle className="text-gray-500 text-xs" />
                <span className="text-sm">
                  <strong className="text-gray-500">{getStats.unchecked}</strong> Unchecked
                </span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-2xl font-bold text-[var(--brand-color)]">{getStats.percentage}%</div>
              <div className="text-xs opacity-70">Health Score</div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {/* Player (wide) */}
          <div className="md:col-span-2 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-[var(--brand-color)] to-red-700 p-4">
              <p className="text-sm opacity-90">NOW PLAYING</p>
              <h2 className="text-2xl font-bold truncate">
                {selectedChannel?.number ? `#${selectedChannel.number} ` : ''}
                {selectedChannel?.name || 'Select a channel'}
              </h2>
            </div>
            <IPTVPlayer
              channel={selectedChannel}
              isLoading={loading}
              onCanPlay={onPlayerCanPlay}
              onError={onPlayerError}
            />
          </div>

          {/* Controls + Channel list */}
          <div className="md:col-span-1">
            <div className="flex flex-wrap gap-3 mb-6 justify-center">
              <input
                type="text"
                placeholder="Search channels..."
                className="flex-1 min-w-[200px] max-w-md p-3 rounded-lg bg-[var(--bg-secondary)] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="p-3 rounded-lg bg-[var(--bg-secondary)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter channels by category"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'all' ? 'All Channels' : cat}</option>
                ))}
              </select>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-lg overflow-hidden">
              <div className="flex flex-col max-h-[70vh] overflow-y-auto">
                {filtered.length > 0 ? filtered.map(ch => {
                  const health = getHealth(ch.url);
                  const statusColor = health?.status === 'online' 
                    ? 'text-green-500' 
                    : health?.status === 'offline' 
                    ? 'text-red-500' 
                    : health?.status === 'timeout' 
                    ? 'text-yellow-500' 
                    : 'text-gray-500';
                  
                  return (
                    <div key={ch.number || ch.url} className="relative">
                      <button
                        onClick={() => play(ch)}
                        className={`flex items-center justify-between p-4 pr-12 w-full text-left transition-colors ${
                          ch.url === selectedChannel?.url
                            ? 'bg-[var(--brand-color)] text-white font-bold'
                            : 'text-gray-200 hover:bg-[var(--bg-tertiary)]'
                        } border-b border-b-[var(--border-color)] last:border-b-0`}
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-xs font-bold ${
                            ch.url === selectedChannel?.url ? 'bg-white/20' : 'bg-[var(--bg-tertiary)]'
                          }`}>
                            {typeof ch.number === 'number' ? `#${ch.number}` : '★'}
                          </span>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FaCircle className={`text-xs ${statusColor} ${health?.status === 'online' ? 'animate-pulse' : ''}`} />
                            <span className="font-semibold truncate">{ch.name}</span>
                            {health?.latency && (
                              <span className="text-xs text-gray-400 hidden lg:inline">
                                {health.latency}ms
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {ch.url === selectedChannel?.url && (
                            <div className="hidden sm:flex items-center gap-1.5 text-white animate-pulse">
                              <span className="live-dot bg-white"></span>
                              <span className="text-sm font-semibold">Playing</span>
                            </div>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(ch, e); }}
                        className="absolute top-4 right-4 text-xl p-1 z-10"
                        aria-label={`Toggle favorite for ${ch.name}`}
                      >
                        <span className={`${favorites.includes(ch.name) ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}>★</span>
                      </button>
                    </div>
                );
                }) : (
                  <p className="p-8 text-center text-[var(--text-secondary)]">
                    No channels found {search ? `for "${search}"` : ''} {category !== 'all' ? `in ${category}` : ''}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
      <ChannelRequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={(channel) => {
          try {
            // Assign a friendly number after existing ones
            const nextNumber = (channels[channels.length - 1]?.number || 0) + 1;
            const normalized = { category: 'Requested', number: nextNumber, ...channel };
            setUserChannels(prev => {
              const merged = [normalized, ...prev];
              localStorage.setItem('iptv_user_channels', JSON.stringify(merged));
              return merged;
            });
          } catch (e) {
            console.warn('Failed to add user channel locally', e);
          }
        }}
      />
    </div>
  );
};