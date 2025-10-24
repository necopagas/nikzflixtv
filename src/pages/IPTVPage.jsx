// src/pages/IPTVPage.jsx
import React, { useState, useEffect } from 'react';
import { IPTVPlayer } from '../components/IPTVPlayer';
import { IPTV_CHANNELS } from '../config'; // Mo-load gikan sa gi-update nga src/config.js

export const IPTVPage = () => {
  const [selectedUrl, setSelectedUrl] = useState(IPTV_CHANNELS[0]?.url);
  const [nowPlaying, setNowPlaying] = useState(IPTV_CHANNELS[0]?.name);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(IPTV_CHANNELS);

  useEffect(() => {
    const f = IPTV_CHANNELS.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(f);
  }, [search]);

  const play = (ch) => {
    if (ch.url !== selectedUrl) {
      setLoading(true);
      setSelectedUrl(ch.url);
      setNowPlaying(ch.name);
    }
  };

  return (
    // Gigamit ang imong existing page padding para mo-fit sa layout
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20"> 
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-[var(--brand-color)] mb-6">
          Live TV
        </h1>
        
        {/* Player Section (Gigamit imong theme colors) */}
        <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden mb-6 shadow-2xl">
          <div className="bg-gradient-to-r from-[var(--brand-color)] to-red-700 p-3">
            <p className="text-sm">NOW PLAYING:</p>
            <h2 className="text-xl font-bold">{nowPlaying}</h2>
          </div>
          <IPTVPlayer 
            url={selectedUrl} 
            isLoading={loading} 
            onCanPlay={() => setLoading(false)} 
          />
        </div>
        
        {/* Search Bar (Gigamit imong theme colors) */}
        <input
          type="text"
          placeholder="Search channels..."
          className="w-full max-w-md mx-auto block mb-6 p-3 rounded-lg bg-[var(--bg-secondary)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        {/* Channel List (Gigamit imong theme colors) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map(ch => (
            <button
              key={ch.name}
              onClick={() => play(ch)}
              className={`p-4 rounded-lg font-bold transition-all ${
                ch.url === selectedUrl 
                  ? 'bg-[var(--brand-color)] text-white shadow-lg' 
                  : 'bg-[var(--bg-secondary)] text-gray-300 hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};