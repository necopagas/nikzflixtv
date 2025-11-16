import { useState } from 'react';
import {
  FiDownload,
  FiTrash2,
  FiPause,
  FiPlay,
  FiX,
  FiHardDrive,
  FiAlertCircle,
} from 'react-icons/fi';
import { useDownloadManager, DOWNLOAD_STATUS } from '../hooks/useDownloadManager';
import { useNavigate } from 'react-router-dom';

/**
 * Downloads Page Component
 * Manage all downloads and view offline content
 */
const DownloadsPage = () => {
  const navigate = useNavigate();
  const {
    isSupported,
    downloads,
    storageInfo,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
    clearCompleted,
    clearAll,
    getDownloadsByStatus,
  } = useDownloadManager();

  const [filter, setFilter] = useState('all');

  // Filter downloads
  const getFilteredDownloads = () => {
    if (filter === 'all') return downloads;
    return getDownloadsByStatus(filter);
  };

  const filteredDownloads = getFilteredDownloads();

  // Calculate stats
  const activeDownloads = getDownloadsByStatus(DOWNLOAD_STATUS.DOWNLOADING).length;
  const completedDownloads = getDownloadsByStatus(DOWNLOAD_STATUS.COMPLETED).length;
  const queuedDownloads = getDownloadsByStatus(DOWNLOAD_STATUS.QUEUED).length;

  // Handle download actions
  const handlePause = async downloadId => {
    await pauseDownload(downloadId);
  };

  const handleResume = async downloadId => {
    await resumeDownload(downloadId);
  };

  const handleCancel = async downloadId => {
    if (confirm('Are you sure you want to cancel this download?')) {
      await cancelDownload(downloadId);
    }
  };

  const handleDelete = async downloadId => {
    if (confirm('Are you sure you want to delete this download?')) {
      await deleteDownload(downloadId);
    }
  };

  const handleClearCompleted = async () => {
    if (confirm('Clear all completed downloads?')) {
      await clearCompleted();
    }
  };

  const handleClearAll = async () => {
    if (confirm('Delete ALL downloads? This cannot be undone.')) {
      await clearAll();
    }
  };

  const handleItemClick = download => {
    if (download.status === DOWNLOAD_STATUS.COMPLETED) {
      // Navigate to watch page for completed downloads
      const type = download.mediaType === 'tv' ? 'series' : 'movie';
      navigate(`/watch/${type}/${download.itemId}`);
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black pt-20 px-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <FiAlertCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Downloads Not Supported</h1>
          <p className="text-gray-400 mb-6">
            Your browser doesn't support offline downloads. Please try using a modern browser like
            Chrome, Edge, or Firefox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black pt-20 px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FiDownload className="text-blue-500" />
            Downloads
          </h1>
          <p className="text-gray-400">Manage your offline content and downloads</p>
        </div>

        {/* Storage Info */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiHardDrive className="text-3xl text-blue-500" />
              <div>
                <h3 className="text-white font-semibold">Storage Usage</h3>
                <p className="text-gray-400 text-sm">
                  {storageInfo.used} MB used of {storageInfo.available} MB
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{storageInfo.percentage}%</p>
              <p className="text-gray-400 text-sm">Used</p>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500"
              style={{ width: `${storageInfo.percentage}%` }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Total Downloads</p>
            <p className="text-3xl font-bold text-white">{downloads.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Active</p>
            <p className="text-3xl font-bold text-green-500">{activeDownloads}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Queued</p>
            <p className="text-3xl font-bold text-yellow-500">{queuedDownloads}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Completed</p>
            <p className="text-3xl font-bold text-blue-500">{completedDownloads}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All ({downloads.length})
            </button>
            <button
              onClick={() => setFilter(DOWNLOAD_STATUS.DOWNLOADING)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === DOWNLOAD_STATUS.DOWNLOADING
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Active ({activeDownloads})
            </button>
            <button
              onClick={() => setFilter(DOWNLOAD_STATUS.COMPLETED)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === DOWNLOAD_STATUS.COMPLETED
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Completed ({completedDownloads})
            </button>
          </div>
          <div className="flex gap-2">
            {completedDownloads > 0 && (
              <button
                onClick={handleClearCompleted}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear Completed
              </button>
            )}
            {downloads.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Downloads List */}
        {filteredDownloads.length === 0 ? (
          <div className="text-center py-20">
            <FiDownload className="text-6xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Downloads</h3>
            <p className="text-gray-400">
              {filter === 'all'
                ? 'Start downloading content to watch offline'
                : `No ${filter} downloads`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDownloads.map(download => (
              <div
                key={download.id}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300"
              >
                <div className="flex gap-4 p-4">
                  {/* Poster */}
                  <div
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => handleItemClick(download)}
                  >
                    <img
                      src={
                        download.poster
                          ? `https://image.tmdb.org/t/p/w185${download.poster}`
                          : '/placeholder.png'
                      }
                      alt={download.title}
                      className="w-24 h-36 object-cover rounded-lg"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow">
                    <h3
                      className="text-lg font-semibold text-white mb-1 cursor-pointer hover:text-blue-400"
                      onClick={() => handleItemClick(download)}
                    >
                      {download.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{download.overview}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded ${
                          download.status === DOWNLOAD_STATUS.COMPLETED
                            ? 'bg-green-600/20 text-green-400'
                            : download.status === DOWNLOAD_STATUS.DOWNLOADING
                              ? 'bg-blue-600/20 text-blue-400'
                              : download.status === DOWNLOAD_STATUS.PAUSED
                                ? 'bg-orange-600/20 text-orange-400'
                                : download.status === DOWNLOAD_STATUS.FAILED
                                  ? 'bg-red-600/20 text-red-400'
                                  : 'bg-gray-600/20 text-gray-400'
                        }`}
                      >
                        {download.status}
                      </span>
                      <span className="text-gray-400">{download.quality}</span>
                      <span className="text-gray-400">{download.mediaType}</span>
                    </div>

                    {/* Progress Bar */}
                    {(download.status === DOWNLOAD_STATUS.DOWNLOADING ||
                      download.status === DOWNLOAD_STATUS.PAUSED) && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-400">
                            {Math.round(download.progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                            style={{ width: `${download.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {download.status === DOWNLOAD_STATUS.DOWNLOADING && (
                      <button
                        onClick={() => handlePause(download.id)}
                        className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                        title="Pause"
                      >
                        <FiPause />
                      </button>
                    )}
                    {download.status === DOWNLOAD_STATUS.PAUSED && (
                      <button
                        onClick={() => handleResume(download.id)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Resume"
                      >
                        <FiPlay />
                      </button>
                    )}
                    {(download.status === DOWNLOAD_STATUS.DOWNLOADING ||
                      download.status === DOWNLOAD_STATUS.PAUSED ||
                      download.status === DOWNLOAD_STATUS.QUEUED) && (
                      <button
                        onClick={() => handleCancel(download.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <FiX />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(download.id)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsPage;
