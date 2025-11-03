// src/pages/IPTVPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { IPTVPlayer } from '../components/IPTVPlayer';
import { useIPTVSync } from '../hooks/useIPTVSync'; // Auto-sync hook
import { useChannelHealth } from '../hooks/useChannelHealth'; // Health check hook
import { FaSync, FaHeartbeat, FaCircle } from 'react-icons/fa';

export const IPTVPage = () => {
  // Use auto-sync hook (syncs once per hour)
  const { channels, isSyncing, syncStatus, syncChannels, hasUpdates } = useIPTVSync(true);
  
  // Use health check hook
  const { 
    healthMap, 
    isChecking, 
    progress, 
    checkAllChannels, 
    getStats, 
    getHealth 
  } = useChannelHealth(channels, false); // Don't auto-check on mount
  
  const [selectedChannel, setSelectedChannel] = useState(null);
  // Start not-loading by default; we only show the spinner when there's an actual channel to load
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iptv_favorites') || '[]'); }
    catch { return []; }
  });

  // Find first channel or last played
  useEffect(() => {
    if (channels.length === 0) return;
    
    const lastUrl = localStorage.getItem('iptv_last_channel');
    let initialChannel = null;
    if (lastUrl) {
      initialChannel = channels.find(c => c.url === lastUrl);
    }
    // If no last played or last played not found, use the first channel
    if (!initialChannel && channels.length > 0) {
      initialChannel = channels[0];
    }
    setSelectedChannel(initialChannel);
    // Show loading spinner only if we actually have a channel to load
    setLoading(!!initialChannel);
  }, [channels]); // Re-run when channels update

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

  // Save favorites
  useEffect(() => {
    localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const categories = useMemo(() => ['all', ...new Set(channels.map(c => c.category).filter(Boolean))], [channels]);

  // Filter channels based on search and category
  const filtered = useMemo(() => channels.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'all' || ch.category === category;
    return matchesSearch && matchesCat;
  }), [channels, search, category]);

  // Handle channel selection
  const play = useCallback((ch) => {
    if (ch.url !== selectedChannel?.url) {
      setLoading(true); // Show spinner immediately when clicking a new channel
      setSelectedChannel(ch);
    }
  }, [selectedChannel?.url]);

  // Toggle favorite status
  const toggleFavorite = useCallback((ch, e) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(ch.name) ? prev.filter(n => n !== ch.name) : [...prev, ch.name]);
  }, []);

  // Player event handlers (stable with useCallback)
  const onPlayerCanPlay = useCallback(() => {
    setLoading(false);
  }, []);

  const onPlayerError = useCallback((fallbackUrl) => {
    console.warn("Player error, attempting fallback:", fallbackUrl);
    // Update the selected channel state with the fallback URL
    // This will trigger the IPTVPlayer to re-initialize with the new URL
    setSelectedChannel(currentChannel => {
        if (currentChannel && currentChannel.url !== fallbackUrl) {
            return { ...currentChannel, url: fallbackUrl };
        }
        // If fallback is same as current or no current channel, stop loading
        setLoading(false);
        return currentChannel;
    });
  }, []);

  return (
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-5xl font-bold text-center text-[var(--brand-color)] bg-gradient-to-r from-[var(--brand-color)] to-red-600 bg-clip-text text-transparent">
            Live TV
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Health Check Button */}
            <button
              onClick={checkAllChannels}
              disabled={isChecking}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                isChecking 
                  ? 'bg-blue-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
              title="Check channel health"
            >
              <FaHeartbeat className={isChecking ? 'animate-pulse' : ''} />
              <span className="hidden lg:inline">
                {isChecking 
                  ? `Checking ${progress.current}/${progress.total}...` 
                  : 'Check Health'
                }
              </span>
            </button>
            
            {/* Sync Button */}
            <button
              onClick={syncChannels}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
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
              {isSyncing ? 'Syncing...' : hasUpdates ? `${channels.length} Channels (Updates!)` : `${channels.length} Channels`}
            </span>
          </button>
          </div>
        </div>

        {/* Health Stats Bar */}
        {getStats.checked > 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
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
            <div className="text-right">
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
                  <button
                    key={ch.number || ch.url}
                    onClick={() => play(ch)}
                    className={`flex items-center justify-between p-4 w-full text-left transition-colors ${
                      ch.url === selectedChannel?.url
                        ? 'bg-[var(--brand-color)] text-white font-bold'
                        : 'text-gray-200 hover:bg-[var(--bg-tertiary)]'
                    } border-b border-b-[var(--border-color)] last:border-b-0`}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-xs font-bold ${
                        ch.url === selectedChannel?.url ? 'bg-white/20' : 'bg-[var(--bg-tertiary)]'
                      }`}>
                        #{ch.number}
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
                      <button onClick={(e) => toggleFavorite(ch, e)} className="text-xl p-1" aria-label={`Toggle favorite for ${ch.name}`}>
                        <span className={`${favorites.includes(ch.name) ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}>★</span>
                      </button>
                      {ch.url === selectedChannel?.url && (
                        <div className="hidden sm:flex items-center gap-1.5 text-white animate-pulse">
                          <span className="live-dot bg-white"></span>
                          <span className="text-sm font-semibold">Playing</span>
                        </div>
                      )}
                    </div>
                  </button>
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
    </div>
  );
};