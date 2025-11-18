/**
 * Reusable Loading Skeleton Components
 * Provides consistent loading states across the app
 */
import React from 'react';

/**
 * Base Skeleton Component
 */
export const Skeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
}) => {
  return (
    <div
      className={`bg-linear-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse ${className}`}
      style={{ width, height, borderRadius }}
    >
      <div className="w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
    </div>
  );
};

/**
 * Channel List Item Skeleton for IPTV
 */
export const ChannelItemSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-b-gray-700">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton width="40px" height="40px" borderRadius="8px" />
        <div className="flex-1 space-y-2">
          <Skeleton height="16px" width="70%" />
          <Skeleton height="12px" width="40%" />
        </div>
      </div>
      <Skeleton width="20px" height="20px" borderRadius="50%" />
    </div>
  );
};

/**
 * Channel List Skeleton
 */
export const ChannelListSkeleton = ({ count = 10 }) => {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, index) => (
        <ChannelItemSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Video Player Skeleton
 */
export const PlayerSkeleton = () => {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Loading player...</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Card Grid Skeleton for Manga/Movies
 */
export const CardGridSkeleton = ({
  count = 12,
  columns = 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
}) => {
  return (
    <div className={`grid ${columns} gap-4`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height="280px" width="100%" borderRadius="12px" />
          <Skeleton height="16px" width="80%" />
          <Skeleton height="12px" width="60%" />
        </div>
      ))}
    </div>
  );
};

/**
 * List Item Skeleton (for downloads, playlists, etc.)
 */
export const ListItemSkeleton = () => {
  return (
    <div className="flex gap-4 p-4 bg-gray-800 rounded-xl">
      <Skeleton width="96px" height="144px" borderRadius="8px" className="shrink-0" />
      <div className="grow space-y-3">
        <Skeleton height="20px" width="70%" />
        <Skeleton height="14px" width="100%" />
        <Skeleton height="14px" width="90%" />
        <div className="flex gap-2 mt-4">
          <Skeleton height="32px" width="80px" borderRadius="6px" />
          <Skeleton height="32px" width="80px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
};

/**
 * List Skeleton
 */
export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ListItemSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Stats Card Skeleton
 */
export const StatsCardSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <Skeleton height="20px" width="60%" />
      </div>
      <Skeleton height="32px" width="80px" className="mb-2" />
      <Skeleton height="14px" width="50%" />
    </div>
  );
};

/**
 * Hero Banner Skeleton
 */
export const HeroSkeleton = () => {
  return (
    <div className="relative w-full h-[500px] md:h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      <Skeleton height="100%" width="100%" borderRadius="0" />
      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4 bg-linear-to-t from-black to-transparent">
        <Skeleton height="48px" width="60%" />
        <Skeleton height="20px" width="80%" />
        <Skeleton height="20px" width="70%" />
        <div className="flex gap-4 mt-6">
          <Skeleton height="48px" width="150px" borderRadius="8px" />
          <Skeleton height="48px" width="150px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
};

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-gray-700">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="p-4">
          <Skeleton height="16px" width="80%" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Table Skeleton
 */
export const TableSkeleton = ({ rows = 10, columns = 4 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Full Page Loading Skeleton
 */
export const PageSkeleton = () => {
  return (
    <div className="min-h-screen pt-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Skeleton height="40px" width="300px" className="mb-6" />
        <Skeleton height="20px" width="500px" className="mb-8" />
        <CardGridSkeleton count={12} />
      </div>
    </div>
  );
};

export default Skeleton;
