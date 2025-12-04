import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiCheck, FiActivity } from 'react-icons/fi';

/**
 * Quality Selector Component
 *
 * Features:
 * - Manual quality selection (360p, 480p, 720p, 1080p, Auto)
 * - Auto quality based on network speed detection
 * - Bandwidth monitoring
 * - Quality preference persistence
 * - Smooth quality transitions
 * - Network speed indicator
 */

const QUALITY_LEVELS = [
  { value: 'auto', label: 'Auto', minBandwidth: 0 },
  { value: '360p', label: '360p', minBandwidth: 0.5, bitrate: 500 }, // 500 kbps
  { value: '480p', label: '480p', minBandwidth: 1, bitrate: 1000 }, // 1 Mbps
  { value: '720p', label: '720p (HD)', minBandwidth: 2.5, bitrate: 2500 }, // 2.5 Mbps
  { value: '1080p', label: '1080p (Full HD)', minBandwidth: 5, bitrate: 5000 }, // 5 Mbps
];

export const QualitySelector = ({
  currentQuality = 'auto',
  onQualityChange,
  availableQualities = ['360p', '480p', '720p', '1080p'],
  showBandwidthMonitor = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(currentQuality);
  const [bandwidth, setBandwidth] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const dropdownRef = useRef(null);

  // Load saved quality preference
  useEffect(() => {
    const savedQuality = localStorage.getItem('preferredQuality');
    if (savedQuality && availableQualities.includes(savedQuality)) {
      setSelectedQuality(savedQuality);
      if (onQualityChange) onQualityChange(savedQuality);
    }
  }, [availableQualities, onQualityChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Monitor bandwidth
  const measureBandwidth = async () => {
    if (!navigator.connection && !window.performance) {
      return null;
    }

    setIsMonitoring(true);

    try {
      // Use Network Information API if available
      if (navigator.connection) {
        const connection = navigator.connection;
        const downlink = connection.downlink; // Mbps

        setBandwidth(downlink);
        setIsMonitoring(false);
        return downlink;
      }

      // Fallback: Measure download speed
      const startTime = performance.now();
      const response = await fetch('https://www.google.com/favicon.ico', {
        cache: 'no-store',
      });
      const blob = await response.blob();
      const endTime = performance.now();

      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsLoaded = blob.size * 8;
      const speedBps = bitsLoaded / durationInSeconds;
      const speedMbps = speedBps / (1024 * 1024);

      setBandwidth(speedMbps);
      setIsMonitoring(false);
      return speedMbps;
    } catch (error) {
      console.error('Bandwidth measurement failed:', error);
      setIsMonitoring(false);
      return null;
    }
  };

  // Auto-select quality based on bandwidth
  const getRecommendedQuality = bandwidthMbps => {
    if (!bandwidthMbps) return '480p';

    if (bandwidthMbps >= 5) return '1080p';
    if (bandwidthMbps >= 2.5) return '720p';
    if (bandwidthMbps >= 1) return '480p';
    return '360p';
  };

  // Handle quality selection
  const handleQualitySelect = async quality => {
    setSelectedQuality(quality);
    localStorage.setItem('preferredQuality', quality);

    if (quality === 'auto') {
      const measuredBandwidth = await measureBandwidth();
      const recommended = getRecommendedQuality(measuredBandwidth);
      if (onQualityChange) onQualityChange(recommended, true); // true = auto mode
    } else {
      if (onQualityChange) onQualityChange(quality, false);
    }

    setIsOpen(false);
  };

  // Monitor bandwidth on mount if auto quality
  useEffect(() => {
    if (selectedQuality === 'auto' && showBandwidthMonitor) {
      measureBandwidth();

      // Re-measure every 30 seconds
      const interval = setInterval(measureBandwidth, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedQuality, showBandwidthMonitor]);

  const getCurrentQualityLabel = () => {
    if (selectedQuality === 'auto' && bandwidth) {
      const recommended = getRecommendedQuality(bandwidth);
      return `Auto (${recommended})`;
    }
    return QUALITY_LEVELS.find(q => q.value === selectedQuality)?.label || selectedQuality;
  };

  const getBandwidthColor = () => {
    if (!bandwidth) return 'text-gray-400';
    if (bandwidth >= 5) return 'text-green-400';
    if (bandwidth >= 2.5) return 'text-yellow-400';
    if (bandwidth >= 1) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Quality Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg transition-all duration-200 text-white font-medium"
        title="Quality Settings"
      >
        <FiSettings className="text-lg" />
        <span className="hidden sm:inline">{getCurrentQualityLabel()}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 min-w-[200px] z-50 animate-fadeIn">
          {/* Bandwidth Monitor */}
          {showBandwidthMonitor && (
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">Network Speed</span>
                {isMonitoring ? (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiActivity className={`text-sm ${getBandwidthColor()}`} />
                )}
              </div>

              {bandwidth ? (
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-bold ${getBandwidthColor()}`}>
                    {bandwidth.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">Mbps</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Measuring...</span>
              )}
            </div>
          )}

          {/* Quality Options */}
          <div className="py-2">
            {QUALITY_LEVELS.map(quality => {
              const isAvailable =
                quality.value === 'auto' || availableQualities.includes(quality.value);
              const isSelected = selectedQuality === quality.value;
              const isRecommended =
                selectedQuality === 'auto' &&
                bandwidth &&
                getRecommendedQuality(bandwidth) === quality.value;

              if (!isAvailable && quality.value !== 'auto') return null;

              return (
                <button
                  key={quality.value}
                  onClick={() => isAvailable && handleQualitySelect(quality.value)}
                  disabled={!isAvailable}
                  className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-800 transition-colors ${
                    isSelected ? 'bg-purple-600/20' : ''
                  } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-purple-400' : 'text-white'
                      }`}
                    >
                      {quality.label}
                    </span>

                    {isRecommended && (
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>

                  {isSelected && <FiCheck className="text-purple-400 text-lg" />}
                </button>
              );
            })}
          </div>

          {/* Info */}
          <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-400">
            <p>Auto adjusts based on your connection speed</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Quality Badge - Shows current quality in corner of video
 */
export const QualityBadge = ({ quality, className = '' }) => {
  const getQualityColor = () => {
    switch (quality) {
      case '1080p':
        return 'bg-purple-600';
      case '720p':
        return 'bg-blue-600';
      case '480p':
        return 'bg-green-600';
      case '360p':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div
      className={`${getQualityColor()} text-white text-xs font-bold px-2 py-1 rounded ${className}`}
    >
      {quality.toUpperCase()}
    </div>
  );
};

/**
 * Hook to manage quality preferences
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useQualityManager = () => {
  const [quality, setQuality] = useState(() => {
    return localStorage.getItem('preferredQuality') || 'auto';
  });

  const [bandwidth, setBandwidth] = useState(null);

  const updateQuality = newQuality => {
    setQuality(newQuality);
    localStorage.setItem('preferredQuality', newQuality);
  };

  const measureBandwidth = async () => {
    try {
      if (navigator.connection) {
        const downlink = navigator.connection.downlink;
        setBandwidth(downlink);
        return downlink;
      }

      const startTime = performance.now();
      const response = await fetch('https://www.google.com/favicon.ico', {
        cache: 'no-store',
      });
      const blob = await response.blob();
      const endTime = performance.now();

      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsLoaded = blob.size * 8;
      const speedMbps = bitsLoaded / durationInSeconds / (1024 * 1024);

      setBandwidth(speedMbps);
      return speedMbps;
    } catch (error) {
      console.error('Bandwidth measurement failed:', error);
      return null;
    }
  };

  const getRecommendedQuality = bandwidthMbps => {
    if (!bandwidthMbps) return '480p';
    if (bandwidthMbps >= 5) return '1080p';
    if (bandwidthMbps >= 2.5) return '720p';
    if (bandwidthMbps >= 1) return '480p';
    return '360p';
  };

  return {
    quality,
    bandwidth,
    updateQuality,
    measureBandwidth,
    getRecommendedQuality,
  };
};

export default QualitySelector;
