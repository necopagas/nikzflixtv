import React, { useState } from 'react';
import { FiPlus, FiCheck } from 'react-icons/fi';
import { usePlaylists } from '../hooks/usePlaylists';

/**
 * Add to Playlist Button
 * Shows in modals/cards to quickly add items to playlists
 */
export const AddToPlaylistButton = ({ item, className = '' }) => {
  const { playlists, createPlaylist, addToPlaylist, isInPlaylist } = usePlaylists();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleAddToPlaylist = playlistId => {
    addToPlaylist(playlistId, item);
    setShowDropdown(false);
  };

  const handleCreateAndAdd = e => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPlaylist = createPlaylist(newPlaylistName);
    addToPlaylist(newPlaylist.id, item);
    setNewPlaylistName('');
    setShowCreateForm(false);
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium"
        title="Add to Playlist"
      >
        <FiPlus /> Playlist
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowDropdown(false);
              setShowCreateForm(false);
            }}
          />
          <div className="absolute top-full mt-2 right-0 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 z-50 w-64 max-h-96 overflow-y-auto">
            {/* Create New Playlist */}
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-4 py-3 text-left hover:bg-gray-800 flex items-center gap-3 border-b border-gray-700 text-purple-400 font-medium"
              >
                <FiPlus /> Create New Playlist
              </button>
            ) : (
              <form onSubmit={handleCreateAndAdd} className="p-4 border-b border-gray-700">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name..."
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none mb-2"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Existing Playlists */}
            {playlists.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">No playlists yet</div>
            ) : (
              <div className="py-2">
                {playlists.map(playlist => {
                  const inPlaylist = isInPlaylist(playlist.id, item.id);
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => handleAddToPlaylist(playlist.id)}
                      disabled={inPlaylist}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-800 flex items-center justify-between transition-colors ${
                        inPlaylist ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{playlist.name}</div>
                        <div className="text-xs text-gray-400">{playlist.items.length} items</div>
                      </div>
                      {inPlaylist && <FiCheck className="text-green-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AddToPlaylistButton;
