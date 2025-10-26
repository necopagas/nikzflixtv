// src/pages/IPTVPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // <-- GIDUGANG ANG useCallback
import { IPTVPlayer } from '../components/IPTVPlayer';
import { IPTV_CHANNELS } from '../config';

export const IPTVPage = () => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iptv_favorites') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    const last = localStorage.getItem('iptv_last_channel');
    if (last) {
      const ch = IPTV_CHANNELS.find(c => c.url === last);
      if (ch) { setSelectedChannel(ch); return; }
    }
    // I-set ang first channel as default kung walay last played
    if (IPTV_CHANNELS.length > 0) {
      setSelectedChannel(IPTV_CHANNELS[0]);
    }
  }, []); // Modagan ra ni kausa

  useEffect(() => {
    if (selectedChannel?.url) localStorage.setItem('iptv_last_channel', selectedChannel.url);
  }, [selectedChannel?.url]);

  useEffect(() => {
    localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const categories = useMemo(() => ['all', ...new Set(IPTV_CHANNELS.map(c => c.category).filter(Boolean))], []);

  const filtered = useMemo(() => IPTV_CHANNELS.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'all' || ch.category === category;
    return matchesSearch && matchesCat;
  }), [search, category]);

  const play = (ch) => {
    if (ch.url !== selectedChannel?.url) {
      setLoading(true);
      setSelectedChannel(ch);
    }
  };

  const toggleFavorite = (ch, e) => {
    e.stopPropagation(); // Ayaw i-play ang channel inig click sa favorite
    setFavorites(prev => prev.includes(ch.name) ? prev.filter(n => n !== ch.name) : [...prev, ch.name]);
  };

  // --- FIX: I-wrap sa useCallback ang event handlers ---
  const onPlayerCanPlay = useCallback(() => {
    setLoading(false);
  }, []); // Stable function

  const onPlayerError = useCallback((url) => {
    // Ang 'url' gikan sa onError kay mao ang channel.fallback
    setSelectedChannel(currentChannel => ({ ...currentChannel, url }));
  }, []); // Stable function
  // --- END SA FIX ---

  return (
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-center text-[var(--brand-color)] mb-8 bg-gradient-to-r from-[var(--brand-color)] to-red-600 bg-clip-text text-transparent">
          Live TV
        </h1>

        <div className="bg-[var(--bg-secondary)] rounded-2xl overflow-hidden mb-8 shadow-2xl">
          <div className="bg-gradient-to-r from-[var(--brand-color)] to-red-700 p-4">
            <p className="text-sm opacity-90">NOW PLAYING</p>
            <h2 className="text-2xl font-bold truncate">#{selectedChannel?.number} {selectedChannel?.name || 'Select a channel'}</h2>
          </div>
          <IPTVPlayer
            channel={selectedChannel}
            isLoading={loading}
            // --- FIX: Gamiton ang stable functions ---
            onCanPlay={onPlayerCanPlay}
            onError={onPlayerError}
            // --- END SA FIX ---
          />
        </div>

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
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Channels' : cat}</option>
            ))}
          </select>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col max-h-[70vh] overflow-y-auto">
            {filtered.length > 0 ? filtered.map(ch => (
              <button
                key={ch.number || ch.url} 
                onClick={() => play(ch)}
                className={`flex items-center justify-between p-4 w-full text-left transition-colors ${
                  ch.url === selectedChannel?.url 
                    ? 'bg-[var(--brand-color)] text-white' 
                    : 'text-gray-200 hover:bg-[var(--bg-tertiary)]'
                } border-b border-b-[var(--border-color)] last:border-b-0`}
              >
                <div className="flex items-center gap-4">
                  <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-xs font-bold ${
                    ch.url === selectedChannel?.url ? 'bg-white/20' : 'bg-[var(--bg-tertiary)]'
                  }`}>
                    #{ch.number}
                  </span>
                  <span className="font-semibold truncate">{ch.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => toggleFavorite(ch, e)} className="text-xl p-1" title="Toggle Favorite">
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
            )) : (
              <p className="p-8 text-center text-[var(--text-secondary)]">
                No channels found for "{search}".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};