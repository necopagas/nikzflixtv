import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiShare2,
  FiDownload,
  FiPlay,
  FiShuffle,
} from 'react-icons/fi';
import { usePlaylists } from '../hooks/usePlaylists';
import { OptimizedPoster, PosterSkeleton } from '../components/ProgressiveImage';
import PlaylistManager from '../components/PlaylistManager';

/**
 * Playlist View Page
 * Displays playlist contents with play controls
 */
export const PlaylistViewPage = ({ onOpenModal, isWatched }) => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { playlists, deletePlaylist, removeFromPlaylist, exportPlaylist, reorderPlaylist } =
    usePlaylists();

  const [showEditModal, setShowEditModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const playlist = playlists.find(p => p.id === playlistId);

  if (!playlist) {
    return (
      <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Playlist not found</h2>
        <button
          onClick={() => navigate('/playlists')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
        >
          Back to Playlists
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Delete "${playlist.name}"?`)) {
      deletePlaylist(playlistId);
      navigate('/playlists');
    }
  };

  const handleExport = () => {
    const json = exportPlaylist(playlistId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlayAll = () => {
    if (playlist.items.length > 0) {
      onOpenModal(playlist.items[0]);
    }
  };

  const handleShuffle = () => {
    const randomItem = playlist.items[Math.floor(Math.random() * playlist.items.length)];
    onOpenModal(randomItem);
  };

  const handleDragStart = index => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    reorderPlaylist(playlistId, draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <FiArrowLeft /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Thumbnail */}
          <div className="w-full md:w-80 aspect-video bg-gradient-to-br from-purple-900 to-gray-900 rounded-xl overflow-hidden flex-shrink-0">
            {playlist.thumbnail ? (
              <OptimizedPoster
                item={{ poster_path: playlist.thumbnail, title: playlist.name }}
                isLarge={true}
                onClick={() => {}}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-600">
                📋
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3">{playlist.name}</h1>
            <p className="text-gray-400 mb-4">{playlist.description || 'No description'}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
              <span>{playlist.items.length} items</span>
              <span>•</span>
              <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
            </div>

            {playlist.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {playlist.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePlayAll}
                disabled={playlist.items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPlay /> Play All
              </button>
              <button
                onClick={handleShuffle}
                disabled={playlist.items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiShuffle /> Shuffle
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                <FiEdit2 /> Edit
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                <FiDownload /> Export
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {playlist.items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-bold mb-2">Empty playlist</h3>
          <p className="text-gray-400">Add items from movies, anime, or dramas</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {playlist.items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="relative group cursor-move"
            >
              <OptimizedPoster
                item={item}
                onClick={onOpenModal}
                isWatched={id => isWatched(id)}
                showTitle={true}
              />

              {/* Remove Button */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (confirm('Remove from playlist?')) {
                    removeFromPlaylist(playlistId, item.id);
                  }
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Remove from playlist"
              >
                <FiTrash2 className="text-sm" />
              </button>

              {/* Drag indicator */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs font-bold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <PlaylistManager
          onClose={() => setShowEditModal(false)}
          onSelectPlaylist={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default PlaylistViewPage;
