/**
 * IPTV Health Stats Component
 * Displays channel health statistics
 */
import React from 'react';
import { FaCircle } from 'react-icons/fa';

export const IPTVHealthStats = ({ stats }) => {
  if (!stats || stats.checked === 0) {
    return null;
  }

  return (
    <div className="bg-(--bg-secondary) rounded-xl p-4 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <FaCircle className="text-green-500 text-xs" />
          <span className="text-sm">
            <strong className="text-green-500">{stats.online}</strong> Online
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FaCircle className="text-red-500 text-xs" />
          <span className="text-sm">
            <strong className="text-red-500">{stats.offline}</strong> Offline
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FaCircle className="text-yellow-500 text-xs" />
          <span className="text-sm">
            <strong className="text-yellow-500">{stats.timeout}</strong> Timeout
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FaCircle className="text-gray-500 text-xs" />
          <span className="text-sm">
            <strong className="text-gray-500">{stats.unchecked}</strong> Unchecked
          </span>
        </div>
      </div>
      <div className="text-center md:text-right">
        <div className="text-2xl font-bold text-(--brand-color)">{stats.percentage}%</div>
        <div className="text-xs opacity-70">Health Score</div>
      </div>
    </div>
  );
};

export default IPTVHealthStats;
