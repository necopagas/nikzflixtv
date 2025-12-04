/**
 * IPTV Controls Component
 * Search and filter controls for IPTV channels
 */
import React from 'react';
import { FaSync, FaHeartbeat, FaSearch } from 'react-icons/fa';

export const IPTVControls = ({
  // Health check
  isChecking,
  onHealthCheck,
  progress,
  // Sync
  isSyncing,
  onSync,
  hasUpdates,
  syncStatus,
  channelCount,
  // Discovery
  isDiscoveryChecking,
  onDiscovery,
  selectedChannel,
  // Request
  onOpenRequest,
  // Discovery status
  discoveryStatus,
  discoveryIndicatorClass,
}) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-(--brand-color) to-red-600 bg-clip-text text-transparent">
          Live TV
        </h1>
        {discoveryStatus && (
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <span className={`w-2 h-2 rounded-full ${discoveryIndicatorClass}`}></span>
            <span className="leading-snug">{discoveryStatus}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:justify-end">
        {/* Health Check Button */}
        <button
          onClick={onHealthCheck}
          disabled={isChecking}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all ${
            isChecking ? 'bg-blue-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
          }`}
          title="Check channel health"
        >
          <FaHeartbeat className={isChecking ? 'animate-pulse' : ''} />
          <span className="hidden sm:inline">
            {isChecking ? `Checking ${progress.current}/${progress.total}...` : 'Check Health'}
          </span>
          <span className="sm:hidden text-xs font-semibold">
            {isChecking ? 'Checking' : 'Health'}
          </span>
        </button>

        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all ${
            isSyncing
              ? 'bg-gray-600 cursor-not-allowed'
              : hasUpdates
                ? 'bg-yellow-600 hover:bg-yellow-500 animate-pulse'
                : syncStatus === 'success'
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-(--brand-color) hover:bg-red-600'
          }`}
          title={hasUpdates ? 'Channel updates available!' : 'Sync IPTV channels'}
        >
          <FaSync className={isSyncing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">
            {isSyncing
              ? 'Syncing...'
              : hasUpdates
                ? `${channelCount} Channels (Updates!)`
                : `${channelCount} Channels`}
          </span>
          <span className="sm:hidden text-xs font-semibold">
            {isSyncing ? 'Sync' : `${channelCount}`}
          </span>
        </button>

        {/* Discover Backup Button */}
        <button
          onClick={onDiscovery}
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
          onClick={onOpenRequest}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500"
          title="Suggest a new channel"
        >
          <span className="sm:hidden text-xs font-semibold">Request</span>
          <span className="hidden sm:inline">+ Request Channel</span>
        </button>
      </div>
    </div>
  );
};

export default IPTVControls;
