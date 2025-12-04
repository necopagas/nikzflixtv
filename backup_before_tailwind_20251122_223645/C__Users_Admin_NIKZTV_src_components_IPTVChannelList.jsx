/**
 * IPTV Channel List Component
 * Displays a list of channels with health status and favorites
 */
import React from 'react';
import { FaCircle } from 'react-icons/fa';

export const IPTVChannelList = ({
  channels,
  selectedChannel,
  onChannelSelect,
  getHealth,
  favorites,
  onToggleFavorite,
  search = '',
  category = 'all',
}) => {
  if (!channels || channels.length === 0) {
    return (
      <div className="p-8 text-center text-(--text-secondary)">
        No channels found {search ? `for "${search}"` : ''}{' '}
        {category !== 'all' ? `in ${category}` : ''}.
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[70vh] overflow-y-auto">
      {channels.map(ch => {
        const health = getHealth(ch.url);
        const statusColor =
          health?.status === 'online'
            ? 'text-green-500'
            : health?.status === 'offline'
              ? 'text-red-500'
              : health?.status === 'timeout'
                ? 'text-yellow-500'
                : 'text-gray-500';

        return (
          <div key={ch.number || ch.url} className="relative">
            <button
              onClick={() => onChannelSelect(ch)}
              className={`flex items-center justify-between p-4 pr-12 w-full text-left transition-colors ${
                ch.url === selectedChannel?.url
                  ? 'bg-(--brand-color) text-white font-bold'
                  : 'text-gray-200 hover:bg-(--bg-tertiary)'
              } border-b border-b-(--border-color) last:border-b-0`}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <span
                  className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-xs font-bold ${
                    ch.url === selectedChannel?.url ? 'bg-white/20' : 'bg-(--bg-tertiary)'
                  }`}
                >
                  {typeof ch.number === 'number' ? `#${ch.number}` : '★'}
                </span>
                <div className="flex items-center gap-2 overflow-hidden">
                  <FaCircle
                    className={`text-xs ${statusColor} ${health?.status === 'online' ? 'animate-pulse' : ''}`}
                  />
                  <span className="font-semibold truncate">{ch.name}</span>
                  {health?.latency && (
                    <span className="text-xs text-gray-400 hidden lg:inline">
                      {health.latency}ms
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {ch.url === selectedChannel?.url && (
                  <div className="hidden sm:flex items-center gap-1.5 text-white animate-pulse">
                    <span className="live-dot bg-white"></span>
                    <span className="text-sm font-semibold">Playing</span>
                  </div>
                )}
              </div>
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleFavorite(ch, e);
              }}
              className="absolute top-4 right-4 text-xl p-1 z-10"
              aria-label={`Toggle favorite for ${ch.name}`}
            >
              <span
                className={`${favorites.includes(ch.name) ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
              >
                ★
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default IPTVChannelList;
