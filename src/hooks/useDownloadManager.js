import { useState, useEffect, useCallback } from 'react';

/**
 * Download Manager Hook
 * Manages offline downloads using IndexedDB and Service Worker
 */

const DB_NAME = 'nikzflix_downloads';
const DB_VERSION = 1;
const STORE_NAME = 'downloads';

// Download statuses
export const DOWNLOAD_STATUS = {
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const useDownloadManager = () => {
  const [downloads, setDownloads] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0, percentage: 0 });

  // Initialize IndexedDB
  const initDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('addedAt', 'addedAt', { unique: false });
        }
      };
    });
  }, []);

  // Check for download support
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        'serviceWorker' in navigator && 'indexedDB' in window && 'storage' in navigator;

      setIsSupported(supported);

      if (supported) {
        await loadDownloads();
        await updateStorageInfo();
      }
    };

    checkSupport();
  }, []);

  // Update storage information
  const updateStorageInfo = async () => {
    if (!navigator.storage || !navigator.storage.estimate) return;

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const percentage = available > 0 ? (used / available) * 100 : 0;

      setStorageInfo({
        used: Math.round(used / (1024 * 1024)), // MB
        available: Math.round(available / (1024 * 1024)), // MB
        percentage: Math.round(percentage),
      });
    } catch (error) {
      console.error('Error getting storage info:', error);
    }
  };

  // Load downloads from IndexedDB
  const loadDownloads = async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        setDownloads(request.result || []);
      };
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  };

  // Add download to queue
  const addDownload = async (item, quality = '720p') => {
    try {
      const download = {
        id: `${item.id}_${quality}_${Date.now()}`,
        itemId: item.id,
        title: item.title || item.name,
        poster: item.poster_path,
        backdrop: item.backdrop_path,
        overview: item.overview,
        mediaType: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
        quality,
        status: DOWNLOAD_STATUS.QUEUED,
        progress: 0,
        addedAt: new Date().toISOString(),
        completedAt: null,
        size: 0,
        error: null,
      };

      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await store.add(download);
      await loadDownloads();
      await updateStorageInfo();

      // Start download
      startDownload(download.id);

      return download;
    } catch (error) {
      console.error('Error adding download:', error);
      throw error;
    }
  };

  // Start downloading
  const startDownload = async downloadId => {
    try {
      const download = downloads.find(d => d.id === downloadId);
      if (!download) return;

      // Update status to downloading
      await updateDownloadStatus(downloadId, DOWNLOAD_STATUS.DOWNLOADING);

      // In a real implementation, this would communicate with Service Worker
      // to handle the actual download. For now, we'll simulate progress.
      simulateDownload(downloadId);
    } catch (error) {
      console.error('Error starting download:', error);
      await updateDownloadStatus(downloadId, DOWNLOAD_STATUS.FAILED, { error: error.message });
    }
  };

  // Simulate download progress (replace with actual SW communication)
  const simulateDownload = async downloadId => {
    let progress = 0;
    const interval = setInterval(async () => {
      progress += Math.random() * 15;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        await updateDownload(downloadId, {
          status: DOWNLOAD_STATUS.COMPLETED,
          progress: 100,
          completedAt: new Date().toISOString(),
        });
      } else {
        await updateDownload(downloadId, { progress: Math.min(progress, 100) });
      }
    }, 500);
  };

  // Pause download
  const pauseDownload = async downloadId => {
    try {
      await updateDownloadStatus(downloadId, DOWNLOAD_STATUS.PAUSED);
    } catch (error) {
      console.error('Error pausing download:', error);
    }
  };

  // Resume download
  const resumeDownload = async downloadId => {
    try {
      await updateDownloadStatus(downloadId, DOWNLOAD_STATUS.DOWNLOADING);
      startDownload(downloadId);
    } catch (error) {
      console.error('Error resuming download:', error);
    }
  };

  // Cancel download
  const cancelDownload = async downloadId => {
    try {
      await updateDownloadStatus(downloadId, DOWNLOAD_STATUS.CANCELLED);
      await loadDownloads();
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  };

  // Delete download
  const deleteDownload = async downloadId => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await store.delete(downloadId);
      await loadDownloads();
      await updateStorageInfo();
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  };

  // Update download status
  const updateDownloadStatus = async (downloadId, status, extra = {}) => {
    await updateDownload(downloadId, { status, ...extra });
  };

  // Update download
  const updateDownload = async (downloadId, updates) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(downloadId);

      request.onsuccess = async () => {
        const download = request.result;
        if (download) {
          const updated = { ...download, ...updates };
          await store.put(updated);
          await loadDownloads();
        }
      };
    } catch (error) {
      console.error('Error updating download:', error);
    }
  };

  // Clear completed downloads
  const clearCompleted = async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.openCursor(DOWNLOAD_STATUS.COMPLETED);

      request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          loadDownloads();
          updateStorageInfo();
        }
      };
    } catch (error) {
      console.error('Error clearing completed downloads:', error);
    }
  };

  // Clear all downloads
  const clearAll = async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await store.clear();
      await loadDownloads();
      await updateStorageInfo();
    } catch (error) {
      console.error('Error clearing all downloads:', error);
    }
  };

  // Check if item is downloaded
  const isDownloaded = useCallback(
    itemId => {
      return downloads.some(
        d => d.itemId.toString() === itemId.toString() && d.status === DOWNLOAD_STATUS.COMPLETED
      );
    },
    [downloads]
  );

  // Get download by item ID
  const getDownloadByItemId = useCallback(
    itemId => {
      return downloads.find(
        d => d.itemId.toString() === itemId.toString() && d.status === DOWNLOAD_STATUS.COMPLETED
      );
    },
    [downloads]
  );

  // Get downloads by status
  const getDownloadsByStatus = useCallback(
    status => {
      return downloads.filter(d => d.status === status);
    },
    [downloads]
  );

  return {
    isSupported,
    downloads,
    storageInfo,
    addDownload,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
    clearCompleted,
    clearAll,
    isDownloaded,
    getDownloadByItemId,
    getDownloadsByStatus,
    updateStorageInfo,
  };
};
