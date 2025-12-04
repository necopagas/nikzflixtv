/**
 * IPTV Filters Component
 * Search and category filters for channels
 */
import React from 'react';

export const IPTVFilters = ({ search, onSearchChange, category, onCategoryChange, categories }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6 justify-center">
      <input
        type="text"
        placeholder="Search channels..."
        className="flex-1 min-w-[200px] max-w-md p-3 rounded-lg bg-(--bg-secondary) text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--brand-color)"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
      <select
        className="p-3 rounded-lg bg-(--bg-secondary) text-white focus:outline-none focus:ring-2 focus:ring-(--brand-color)"
        value={category}
        onChange={e => onCategoryChange(e.target.value)}
        aria-label="Filter channels by category"
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>
            {cat === 'all' ? 'All Channels' : cat}
          </option>
        ))}
      </select>
    </div>
  );
};

export default IPTVFilters;
