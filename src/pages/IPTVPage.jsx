// src/pages/IPTVPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

  const toggleFavorite = (ch) => {
    setFavorites(prev => prev.includes(ch.name) ? prev.filter(n => n !== ch.name) : [...prev, ch.name]);
  };

  // --- FIX 1: Gamit ug functional update para malikayan ang stale state ---
  const handleFallback = (url) => {
    setSelectedChannel(currentChannel => ({ ...currentChannel, url }));
  };
  // --- END SA FIX 1 ---

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
            onCanPlay={() => setLoading(false)}
            onError={handleFallback}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(ch => (
            <button
              // --- FIX 2: Gamiton ang `ch.number` or `ch.url` kay unique ni ---
              key={ch.number || ch.url} 
              // --- END SA FIX 2 ---
              onClick={() => play(ch)}
              onDoubleClick={() => toggleFavorite(ch)}
              className={`p-4 rounded-xl font-bold transition-all ${ch.url === selectedChannel?.url ? 'bg-[var(--brand-color)] text-white shadow-xl scale-105' : 'bg-[var(--bg-secondary)] text-gray-300 hover:bg-[var(--bg-tertiary)] hover:scale-105'}`}
            >
              <p className="text-xs opacity-70">#{ch.number}</p>
              <p className="text-sm truncate">{ch.name}</p>
              {favorites.includes(ch.name) && <span className="text-yellow-400 text-lg">★</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};