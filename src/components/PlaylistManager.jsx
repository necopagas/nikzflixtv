import React, { useState, useRef } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiShare2,
  FiDownload,
  FiUpload,
  FiCopy,
  FiList,
  FiX,
  FiTag,
  FiCalendar,
  FiClock,
  FiMoreVertical,
} from 'react-icons/fi';
import { usePlaylists } from '../hooks/usePlaylists';
import { OptimizedPoster } from './ProgressiveImage';

/**
 * Playlist Manager Component
 * Full playlist CRUD interface with import/export
 */
export const PlaylistManager = ({ onClose, onSelectPlaylist }) => {
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    exportPlaylist,
    importPlaylist,
    duplicatePlaylist,
  } = usePlaylists();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const fileInputRef = useRef(null);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">My Playlists</h2>
            <p className="text-gray-400 text-sm mt-1">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <FiX className="text-2xl text-gray-400" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-6 border-b border-gray-800 flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            <FiPlus /> Create Playlist
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            <FiUpload /> Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = event => {
                  importPlaylist(event.target.result);
                };
                reader.readAsText(file);
              }
            }}
          />
        </div>

        {/* Playlists Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {playlists.length === 0 ? (
            <div className="text-center py-20">
              <FiList className="text-6xl text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No playlists yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first playlist to organize your content
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map(playlist => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onSelect={() => onSelectPlaylist?.(playlist)}
                  onEdit={() => setEditingPlaylist(playlist)}
                  onDelete={() => {
                    if (confirm(`Delete "${playlist.name}"?`)) {
                      deletePlaylist(playlist.id);
                    }
                  }}
                  onExport={() => {
                    const json = exportPlaylist(playlist.id);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${playlist.name.replace(/\s+/g, '_')}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  onDuplicate={() => duplicatePlaylist(playlist.id)}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPlaylist) && (
        <PlaylistFormModal
          playlist={editingPlaylist}
          onSave={data => {
            if (editingPlaylist) {
              updatePlaylist(editingPlaylist.id, data);
              setEditingPlaylist(null);
            } else {
              createPlaylist(data.name, data.description, data.tags);
              setShowCreateModal(false);
            }
          }}
          onClose={() => {
            setShowCreateModal(false);
            setEditingPlaylist(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Playlist Card Component
 */
const PlaylistCard = ({
  playlist,
  onSelect,
  onEdit,
  onDelete,
  onExport,
  onDuplicate,
  activeMenu,
  setActiveMenu,
}) => {
  const itemCount = playlist.items.length;
  const isMenuOpen = activeMenu === playlist.id;

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all group">
      {/* Thumbnail */}
      <div
        className="aspect-video bg-linear-to-br from-purple-900 to-gray-900 relative cursor-pointer"
        onClick={onSelect}
      >
        {playlist.thumbnail ? (
          <OptimizedPoster
            item={{ poster_path: playlist.thumbnail, title: playlist.name }}
            isLarge={true}
            onClick={() => {}}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiList className="text-6xl text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg font-medium">
            View Playlist
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-white text-lg line-clamp-1">{playlist.name}</h3>
          <div className="relative">
            <button
              onClick={e => {
                e.stopPropagation();
                setActiveMenu(isMenuOpen ? null : playlist.id);
              }}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <FiMoreVertical className="text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                <div className="absolute right-0 top-full mt-1 bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-1 z-50 w-48">
                  <button
                    onClick={() => {
                      onEdit();
                      setActiveMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-800 flex items-center gap-2 text-white"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate();
                      setActiveMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-800 flex items-center gap-2 text-white"
                  >
                    <FiCopy /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onExport();
                      setActiveMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-800 flex items-center gap-2 text-white"
                  >
                    <FiDownload /> Export
                  </button>
                  <hr className="border-gray-700 my-1" />
                  <button
                    onClick={() => {
                      onDelete();
                      setActiveMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-800 flex items-center gap-2 text-red-400"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
          {playlist.description || 'No description'}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          <span className="flex items-center gap-1">
            <FiClock />
            {new Date(playlist.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {playlist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {playlist.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Playlist Form Modal
 */
const PlaylistFormModal = ({ playlist, onSave, onClose }) => {
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(playlist?.tags || []);

  const handleSubmit = e => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, tags });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6">
        <h3 className="text-2xl font-bold mb-6">
          {playlist ? 'Edit Playlist' : 'Create New Playlist'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Playlist Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Action Movies"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags..."
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700"
              >
                <FiTag />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                      className="hover:text-white"
                    >
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              {playlist ? 'Save Changes' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaylistManager;
