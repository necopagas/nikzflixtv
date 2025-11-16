import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Playlists Hook
 * Manages user-created playlists with localStorage persistence
 */
export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('userPlaylists');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever playlists change
  useEffect(() => {
    localStorage.setItem('userPlaylists', JSON.stringify(playlists));
  }, [playlists]);

  // Create new playlist
  const createPlaylist = useCallback((name, description = '', tags = []) => {
    const newPlaylist = {
      id: `playlist_${Date.now()}`,
      name,
      description,
      tags,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      thumbnail: null,
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  }, []);

  // Delete playlist
  const deletePlaylist = useCallback(playlistId => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  }, []);

  // Update playlist metadata
  const updatePlaylist = useCallback((playlistId, updates) => {
    setPlaylists(prev =>
      prev.map(p => (p.id === playlistId ? { ...p, ...updates, updatedAt: Date.now() } : p))
    );
  }, []);

  // Add item to playlist
  const addToPlaylist = useCallback((playlistId, item) => {
    setPlaylists(prev =>
      prev.map(p => {
        if (p.id === playlistId) {
          // Check if item already exists
          const exists = p.items.some(i => i.id === item.id);
          if (exists) return p;

          // Update thumbnail to first item's poster if not set
          const thumbnail = p.thumbnail || item.poster_path || item.backdrop_path;

          return {
            ...p,
            items: [...p.items, { ...item, addedAt: Date.now() }],
            thumbnail,
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  }, []);

  // Remove item from playlist
  const removeFromPlaylist = useCallback((playlistId, itemId) => {
    setPlaylists(prev =>
      prev.map(p => {
        if (p.id === playlistId) {
          return {
            ...p,
            items: p.items.filter(i => i.id !== itemId),
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  }, []);

  // Check if item is in any playlist
  const isInPlaylist = useCallback(
    (playlistId, itemId) => {
      const playlist = playlists.find(p => p.id === playlistId);
      return playlist ? playlist.items.some(i => i.id === itemId) : false;
    },
    [playlists]
  );

  // Get playlists containing an item
  const getPlaylistsWithItem = useCallback(
    itemId => {
      return playlists.filter(p => p.items.some(i => i.id === itemId));
    },
    [playlists]
  );

  // Reorder items in playlist
  const reorderPlaylist = useCallback((playlistId, fromIndex, toIndex) => {
    setPlaylists(prev =>
      prev.map(p => {
        if (p.id === playlistId) {
          const newItems = [...p.items];
          const [movedItem] = newItems.splice(fromIndex, 1);
          newItems.splice(toIndex, 0, movedItem);
          return { ...p, items: newItems, updatedAt: Date.now() };
        }
        return p;
      })
    );
  }, []);

  // Export playlist as JSON
  const exportPlaylist = useCallback(
    playlistId => {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return null;

      const exportData = {
        name: playlist.name,
        description: playlist.description,
        tags: playlist.tags,
        items: playlist.items.map(item => ({
          id: item.id,
          title: item.title || item.name,
          type: item.media_type || 'movie',
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
        })),
        exportedAt: Date.now(),
      };

      return JSON.stringify(exportData, null, 2);
    },
    [playlists]
  );

  // Import playlist from JSON
  const importPlaylist = useCallback(jsonString => {
    try {
      const data = JSON.parse(jsonString);
      const newPlaylist = {
        id: `playlist_${Date.now()}`,
        name: data.name || 'Imported Playlist',
        description: data.description || '',
        tags: data.tags || [],
        items: data.items.map(item => ({
          ...item,
          addedAt: Date.now(),
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        thumbnail: data.items[0]?.poster_path || null,
      };

      setPlaylists(prev => [...prev, newPlaylist]);
      return newPlaylist;
    } catch (error) {
      console.error('Failed to import playlist:', error);
      return null;
    }
  }, []);

  // Duplicate playlist
  const duplicatePlaylist = useCallback(
    playlistId => {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return null;

      const newPlaylist = {
        ...playlist,
        id: `playlist_${Date.now()}`,
        name: `${playlist.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setPlaylists(prev => [...prev, newPlaylist]);
      return newPlaylist;
    },
    [playlists]
  );

  return {
    playlists,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    isInPlaylist,
    getPlaylistsWithItem,
    reorderPlaylist,
    exportPlaylist,
    importPlaylist,
    duplicatePlaylist,
  };
};
