import React, { useState, useEffect } from 'react';
import { useCast } from '../hooks/useCast';
import { FiCast, FiMonitor, FiInfo, FiCheck, FiX } from 'react-icons/fi';

export const CastSettingsPage = () => {
  const { isCastAvailable, isAirPlayAvailable, isCasting, castDevice, stopCasting } = useCast();

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('nikzflix_cast_settings');
    return saved
      ? JSON.parse(saved)
      : {
          autoConnect: false,
          preferredDevice: null,
          showNotifications: true,
          quality: 'auto',
        };
  });

  useEffect(() => {
    localStorage.setItem('nikzflix_cast_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white pt-20 px-4 sm:px-8 md:px-16 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">📺 Cast Settings</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Configure casting to Chromecast and AirPlay devices
        </p>
      </div>

      {/* Device Status */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-900/40 rounded-xl p-6 mb-8 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FiMonitor className="text-blue-400" />
          Device Status
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Chromecast Status */}
          <div
            className={`p-4 rounded-lg border ${
              isCastAvailable
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-gray-800/50 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FiCast className={isCastAvailable ? 'text-green-400' : 'text-gray-500'} />
                <span className="font-semibold">Chromecast</span>
              </div>
              {isCastAvailable ? (
                <FiCheck className="text-green-400" />
              ) : (
                <FiX className="text-gray-500" />
              )}
            </div>
            <p className="text-sm text-gray-400">
              {isCastAvailable ? 'Available and ready to cast' : 'Not available on this device'}
            </p>
          </div>

          {/* AirPlay Status */}
          <div
            className={`p-4 rounded-lg border ${
              isAirPlayAvailable
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-gray-800/50 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FiMonitor className={isAirPlayAvailable ? 'text-green-400' : 'text-gray-500'} />
                <span className="font-semibold">AirPlay</span>
              </div>
              {isAirPlayAvailable ? (
                <FiCheck className="text-green-400" />
              ) : (
                <FiX className="text-gray-500" />
              )}
            </div>
            <p className="text-sm text-gray-400">
              {isAirPlayAvailable ? 'Available on this device' : 'Only available on Safari/iOS'}
            </p>
          </div>
        </div>

        {/* Currently Casting */}
        {isCasting && castDevice && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <FiCast className="text-white animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold">Currently Casting</p>
                  <p className="text-sm text-gray-400">{castDevice.name}</p>
                </div>
              </div>
              <button
                onClick={stopCasting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                Stop Casting
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cast Preferences */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-900/40 rounded-xl p-6 mb-8 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Cast Preferences</h2>

        <div className="space-y-4">
          {/* Auto Connect */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Auto-Connect</h3>
              <p className="text-sm text-gray-400">
                Automatically connect to previously used device
              </p>
            </div>
            <button
              onClick={() => updateSetting('autoConnect', !settings.autoConnect)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.autoConnect ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.autoConnect ? 'translate-x-7' : ''
                }`}
              />
            </button>
          </div>

          {/* Show Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Cast Notifications</h3>
              <p className="text-sm text-gray-400">
                Show notifications when casting starts or stops
              </p>
            </div>
            <button
              onClick={() => updateSetting('showNotifications', !settings.showNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.showNotifications ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.showNotifications ? 'translate-x-7' : ''
                }`}
              />
            </button>
          </div>

          {/* Cast Quality */}
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h3 className="font-semibold mb-3">Cast Quality</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['auto', '720p', '1080p', '4K'].map(quality => (
                <button
                  key={quality}
                  onClick={() => updateSetting('quality', quality)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.quality === quality
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {quality === 'auto' ? 'Auto' : quality}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Higher quality requires better network connection
            </p>
          </div>
        </div>
      </div>

      {/* How to Cast */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-900/40 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FiInfo className="text-blue-400" />
          How to Cast
        </h2>

        <div className="space-y-4">
          {isCastAvailable && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FiCast className="text-blue-400" />
                Chromecast
              </h3>
              <ol className="text-sm text-gray-400 space-y-2 ml-6 list-decimal">
                <li>Make sure your Chromecast and device are on the same WiFi network</li>
                <li>Start playing a video on NikzFlix</li>
                <li>Click the Cast button in the video player</li>
                <li>Select your Chromecast device from the list</li>
                <li>Enjoy watching on your TV!</li>
              </ol>
            </div>
          )}

          {isAirPlayAvailable && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FiMonitor className="text-purple-400" />
                AirPlay
              </h3>
              <ol className="text-sm text-gray-400 space-y-2 ml-6 list-decimal">
                <li>Ensure your Apple TV or AirPlay-enabled device is on the same network</li>
                <li>Start playing a video on NikzFlix</li>
                <li>Click the Cast button and select AirPlay</li>
                <li>Choose your AirPlay device</li>
                <li>Video will start playing on your TV</li>
              </ol>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong>Tip:</strong> For the best casting experience, use a 5GHz WiFi network and
              ensure your devices are close to the router.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
