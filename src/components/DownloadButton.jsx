import { useState } from 'react';
import { FiDownload, FiCheck, FiX, FiPause, FiPlay, FiLoader } from 'react-icons/fi';
import { useDownloadManager, DOWNLOAD_STATUS } from '../hooks/useDownloadManager';

/**
 * Download Button Component
 * Shows download status and controls for content
 */
const DownloadButton = ({ item, size = 'medium', showLabel = false }) => {
  const {
    isSupported,
    downloads,
    addDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
  } = useDownloadManager();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [_selectedQuality, setSelectedQuality] = useState('720p');

  // Find existing download for this item
  const existingDownload = downloads.find(d => d.itemId.toString() === item.id.toString());
  const status = existingDownload?.status;
  const progress = existingDownload?.progress || 0;

  if (!isSupported) {
    return null; // Don't show if downloads not supported
  }

  const handleDownload = async () => {
    if (existingDownload) {
      // Handle existing download actions
      if (status === DOWNLOAD_STATUS.DOWNLOADING) {
        await pauseDownload(existingDownload.id);
      } else if (status === DOWNLOAD_STATUS.PAUSED) {
        await resumeDownload(existingDownload.id);
      } else if (status === DOWNLOAD_STATUS.COMPLETED) {
        // Already downloaded, maybe show options
        setIsMenuOpen(!isMenuOpen);
      } else if (status === DOWNLOAD_STATUS.FAILED) {
        await resumeDownload(existingDownload.id);
      }
    } else {
      // Start new download
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const handleQualitySelect = async quality => {
    setSelectedQuality(quality);
    setIsMenuOpen(false);

    try {
      await addDownload(item, quality);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to start download. Please check storage space.');
    }
  };

  const handleDelete = async () => {
    if (existingDownload) {
      await deleteDownload(existingDownload.id);
    }
    setIsMenuOpen(false);
  };

  const handleCancel = async () => {
    if (existingDownload) {
      await cancelDownload(existingDownload.id);
    }
    setIsMenuOpen(false);
  };

  // Determine button appearance
  const getButtonConfig = () => {
    if (!existingDownload) {
      return {
        icon: FiDownload,
        label: 'Download',
        className: 'bg-blue-600 hover:bg-blue-700',
      };
    }

    switch (status) {
      case DOWNLOAD_STATUS.QUEUED:
        return {
          icon: FiLoader,
          label: 'Queued',
          className: 'bg-yellow-600 hover:bg-yellow-700 animate-pulse',
        };
      case DOWNLOAD_STATUS.DOWNLOADING:
        return {
          icon: FiPause,
          label: `${Math.round(progress)}%`,
          className: 'bg-green-600 hover:bg-green-700',
        };
      case DOWNLOAD_STATUS.PAUSED:
        return {
          icon: FiPlay,
          label: `${Math.round(progress)}%`,
          className: 'bg-orange-600 hover:bg-orange-700',
        };
      case DOWNLOAD_STATUS.COMPLETED:
        return {
          icon: FiCheck,
          label: 'Downloaded',
          className: 'bg-emerald-600 hover:bg-emerald-700',
        };
      case DOWNLOAD_STATUS.FAILED:
        return {
          icon: FiX,
          label: 'Failed',
          className: 'bg-red-600 hover:bg-red-700',
        };
      case DOWNLOAD_STATUS.CANCELLED:
        return {
          icon: FiDownload,
          label: 'Download',
          className: 'bg-blue-600 hover:bg-blue-700',
        };
      default:
        return {
          icon: FiDownload,
          label: 'Download',
          className: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const config = getButtonConfig();
  const Icon = config.icon;

  // Size classes
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleDownload}
        className={`download-button flex items-center gap-2 ${config.className} text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 ${sizeClasses[size]}`}
        title={config.label}
      >
        <Icon className={status === DOWNLOAD_STATUS.DOWNLOADING ? 'animate-spin' : ''} />
        {showLabel && <span>{config.label}</span>}
        {status === DOWNLOAD_STATUS.DOWNLOADING && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        )}
      </button>

      {/* Quality selection menu */}
      {isMenuOpen && !existingDownload && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
            <div className="p-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 font-medium">Select Quality</p>
            </div>
            {['360p', '480p', '720p', '1080p'].map(q => (
              <button
                key={q}
                onClick={() => handleQualitySelect(q)}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <span>{q}</span>
                <span className="text-xs text-gray-400">
                  ~{q === '360p' ? '300MB' : q === '480p' ? '500MB' : q === '720p' ? '1GB' : '2GB'}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Downloaded options menu */}
      {isMenuOpen && existingDownload && status === DOWNLOAD_STATUS.COMPLETED && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <FiX />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}

      {/* Downloading options menu */}
      {isMenuOpen &&
        existingDownload &&
        (status === DOWNLOAD_STATUS.DOWNLOADING || status === DOWNLOAD_STATUS.PAUSED) && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
              <button
                onClick={handleCancel}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FiX />
                <span>Cancel</span>
              </button>
            </div>
          </>
        )}
    </div>
  );
};

export default DownloadButton;
