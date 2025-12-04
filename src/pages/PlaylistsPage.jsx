import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiGrid, FiList as FiListIcon } from 'react-icons/fi';
import { usePlaylists } from '../hooks/usePlaylists';
import PlaylistManager from '../components/PlaylistManager';
import { OptimizedPoster } from '../components/ProgressiveImage';

/**
 * Playlists Page
 * Overview of all user playlists
 */
export const PlaylistsPage = () => {
  const navigate = useNavigate();
  const { playlists } = usePlaylists();
  const [showManager, setShowManager] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  return (
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Playlists</h1>
          <p className="text-gray-400">Organize and manage your favorite content</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FiListIcon />
            </button>
          </div>

          <button
            onClick={() => setShowManager(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            <FiPlus /> New Playlist
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold text-purple-400 mb-1">{playlists.length}</div>
          <div className="text-gray-400 text-sm">Total Playlists</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {playlists.reduce((sum, p) => sum + p.items.length, 0)}
          </div>
          <div className="text-gray-400 text-sm">Total Items</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {playlists.length > 0
              ? Math.round(playlists.reduce((sum, p) => sum + p.items.length, 0) / playlists.length)
              : 0}
          </div>
          <div className="text-gray-400 text-sm">Avg Items per Playlist</div>
        </div>
      </div>

      {/* Playlists */}
      {playlists.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-bold mb-2">No playlists yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first playlist to start organizing your content
          </p>
          <button
            onClick={() => setShowManager(true)}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-lg transition-colors"
          >
            Create Playlist
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
              className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all cursor-pointer group"
            >
              <div className="aspect-video bg-linear-to-br from-purple-900 to-gray-900 relative">
                {playlist.thumbnail ? (
                  <OptimizedPoster
                    item={{ poster_path: playlist.thumbnail, title: playlist.name }}
                    isLarge={true}
                    onClick={() => {}}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">📋</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg font-medium">
                    View Playlist
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg line-clamp-1 mb-1">{playlist.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                  {playlist.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{playlist.items.length} items</span>
                  <span>{new Date(playlist.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
              className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all cursor-pointer flex items-center gap-6"
            >
              <div className="w-32 h-20 bg-linear-to-br from-purple-900 to-gray-900 rounded-lg overflow-hidden shrink-0">
                {playlist.thumbnail ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${playlist.thumbnail}`}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">📋</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-1">{playlist.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-1 mb-2">
                  {playlist.description || 'No description'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{playlist.items.length} items</span>
                  <span>•</span>
                  <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
                  {playlist.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{playlist.tags.length} tags</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manager Modal */}
      {showManager && (
        <PlaylistManager
          onClose={() => setShowManager(false)}
          onSelectPlaylist={playlist => {
            setShowManager(false);
            navigate(`/playlist/${playlist.id}`);
          }}
        />
      )}
    </div>
  );
};

export default PlaylistsPage;
