import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { FaCog, FaPalette, FaVideo, FaLanguage, FaDatabase, FaKeyboard, FaInfoCircle, FaDownload, FaShieldAlt, FaLock, FaSnowflake } from 'react-icons/fa';
import { useChristmasTheme } from '../hooks/useChristmasTheme';

export const SettingsModal = ({
    onClose,
    theme,
    toggleTheme,
    onClearContinueWatching,
    onClearWatchedHistory,
    onClearMyList
}) => {
    const settings = useSettings();
    const { 
        selectedTheme, 
        activeTheme,
        setTheme, 
        isChristmasMusicEnabled, 
        toggleChristmasMusic,
        isChristmasMode
    } = useChristmasTheme();
    const [activeTab, setActiveTab] = useState('general');
    const [videoQuality, setVideoQuality] = useState(localStorage.getItem('videoQuality') || 'auto');
    const [autoplay, setAutoplay] = useState(localStorage.getItem('autoplay') !== 'false');
    const [dataSaver, setDataSaver] = useState(localStorage.getItem('dataSaver') === 'true');
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
    const [showShortcuts, setShowShortcuts] = useState(false);
    
    // Advanced features
    const [autoSkipIntro, setAutoSkipIntro] = useState(localStorage.getItem('autoSkipIntro') !== 'false');
    const [autoSkipOutro, setAutoSkipOutro] = useState(localStorage.getItem('autoSkipOutro') === 'true');
    const [skipIntroTime, setSkipIntroTime] = useState(parseInt(localStorage.getItem('skipIntroTime') || '90'));
    const [subtitleSize, setSubtitleSize] = useState(parseInt(localStorage.getItem('subtitleSize') || '100'));
    const [parentalControl, setParentalControl] = useState(localStorage.getItem('parentalControl') === 'true');
    const [maturityRating, setMaturityRating] = useState(localStorage.getItem('maturityRating') || 'all');


    const handleClearData = (clearFunction, type) => {
        if (window.confirm(`Are you sure you want to clear your ${type}? This action cannot be undone.`)) {
            clearFunction();
        }
    };
    
    const handleVideoQualityChange = (quality) => {
        setVideoQuality(quality);
        localStorage.setItem('videoQuality', quality);
    };

    const handleAutoplayToggle = () => {
        const newValue = !autoplay;
        setAutoplay(newValue);
        localStorage.setItem('autoplay', String(newValue));
    };

    const handleDataSaverToggle = () => {
        const newValue = !dataSaver;
        setDataSaver(newValue);
        localStorage.setItem('dataSaver', String(newValue));
    };

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const handleClearCache = () => {
        if (window.confirm('Clear all cached images and data? This will free up storage space.')) {
            sessionStorage.clear();
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
            alert('Cache cleared successfully!');
        }
    };

    const handleExportSettings = () => {
        const settingsData = {
            theme,
            videoQuality,
            autoplay,
            dataSaver,
            language,
            previewsEnabled: settings.previewsEnabled,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nikzflix-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportSettings = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (imported.videoQuality) handleVideoQualityChange(imported.videoQuality);
                    if (typeof imported.autoplay !== 'undefined') {
                        setAutoplay(imported.autoplay);
                        localStorage.setItem('autoplay', String(imported.autoplay));
                    }
                    if (typeof imported.dataSaver !== 'undefined') {
                        setDataSaver(imported.dataSaver);
                        localStorage.setItem('dataSaver', String(imported.dataSaver));
                    }
                    if (imported.language) handleLanguageChange(imported.language);
                    alert('Settings imported successfully!');
                } catch (err) {
                    console.error('Failed to import settings', err);
                    alert('Failed to import settings. Invalid file format.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleAutoSkipIntroToggle = () => {
        const newValue = !autoSkipIntro;
        setAutoSkipIntro(newValue);
        localStorage.setItem('autoSkipIntro', String(newValue));
    };

    const handleAutoSkipOutroToggle = () => {
        const newValue = !autoSkipOutro;
        setAutoSkipOutro(newValue);
        localStorage.setItem('autoSkipOutro', String(newValue));
    };

    const handleSkipIntroTimeChange = (time) => {
        setSkipIntroTime(time);
        localStorage.setItem('skipIntroTime', String(time));
    };

    const handleSubtitleSizeChange = (size) => {
        setSubtitleSize(size);
        localStorage.setItem('subtitleSize', String(size));
    };

    const handleParentalControlToggle = () => {
        const newValue = !parentalControl;
        setParentalControl(newValue);
        localStorage.setItem('parentalControl', String(newValue));
    };

    const handleMaturityRatingChange = (rating) => {
        setMaturityRating(rating);
        localStorage.setItem('maturityRating', rating);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: FaCog },
        { id: 'appearance', label: 'Appearance', icon: FaPalette },
        { id: 'playback', label: 'Playback', icon: FaVideo },
        { id: 'data', label: 'Data', icon: FaDatabase },
        { id: 'about', label: 'About', icon: FaInfoCircle }
    ];

    const shortcuts = [
        { key: 'Space', action: 'Play/Pause' },
        { key: 'F', action: 'Fullscreen' },
        { key: 'M', action: 'Mute/Unmute' },
        { key: '←/→', action: 'Seek ±10s' },
        { key: '↑/↓', action: 'Volume ±10%' },
        { key: 'Esc', action: 'Exit Fullscreen/Close Modal' },
    ];


    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative overflow-hidden border border-[var(--border-color)]" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-900/20 to-red-600/20 p-6 border-b border-[var(--border-color)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaCog className="text-3xl text-red-500 animate-spin-slow" />
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
                                Settings
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-3xl text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300"
                            title="Close settings"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                                            : 'bg-[var(--bg-tertiary)] text-gray-400 hover:bg-[var(--bg-tertiary-hover)] hover:text-white'
                                    }`}
                                >
                                    <Icon />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-fade-in">
                            <SettingCard title="Language" icon={FaLanguage}>
                                <select
                                    value={language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                                >
                                    <option value="en">English</option>
                                    <option value="fil">Filipino</option>
                                    <option value="ceb">Cebuano</option>
                                    <option value="jp">日本語 (Japanese)</option>
                                    <option value="kr">한국어 (Korean)</option>
                                </select>
                            </SettingCard>

                            <SettingCard title="Keyboard Shortcuts" icon={FaKeyboard}>
                                <button
                                    onClick={() => setShowShortcuts(!showShortcuts)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all"
                                >
                                    {showShortcuts ? 'Hide' : 'Show'} Shortcuts
                                </button>
                                {showShortcuts && (
                                    <div className="mt-4 bg-black/30 rounded-lg p-4 space-y-2">
                                        {shortcuts.map((shortcut, i) => (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                                                <span className="text-gray-300">{shortcut.action}</span>
                                                <kbd className="px-3 py-1 bg-gray-700 rounded text-sm font-mono">{shortcut.key}</kbd>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SettingCard>

                            <SettingCard title="Import/Export Settings" icon={FaDownload}>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleExportSettings}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
                                    >
                                        Export Settings
                                    </button>
                                    <label className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all cursor-pointer text-center">
                                        Import Settings
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImportSettings}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </SettingCard>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-fade-in">
                            <SettingCard title="Theme" icon={FaPalette}>
                                <div className="flex gap-3">
                                    <button
                                        onClick={toggleTheme}
                                        className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all border-2 bg-gradient-to-r from-gray-900 to-black hover:scale-105"
                                    >
                                        {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                                    </button>
                                </div>
                            </SettingCard>

                            <SettingCard title="🎉 Seasonal Themes" icon={FaSnowflake}>
                                <div className="space-y-3">
                                    <label className="text-sm text-gray-400">Select Theme:</label>
                                    <select
                                        value={selectedTheme}
                                        onChange={(e) => setTheme(e.target.value)}
                                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    >
                                        <option value="auto">🔄 Auto (By Season)</option>
                                        <option value="none">🎨 Original Theme</option>
                                        <option value="halloween">🎃 Halloween</option>
                                        <option value="christmas">🎄 Christmas</option>
                                        <option value="newyear">🎆 New Year</option>
                                    </select>
                                    
                                    {/* Show current active theme */}
                                    <div className="p-2 bg-gray-800/50 rounded text-xs">
                                        <span className="text-gray-400">Currently Active: </span>
                                        <span className="text-white font-semibold">
                                            {activeTheme === 'halloween' && '🎃 Halloween'}
                                            {activeTheme === 'christmas' && '🎄 Christmas'}
                                            {activeTheme === 'newyear' && '🎆 New Year'}
                                            {activeTheme === 'none' && '🎨 Original'}
                                        </span>
                                    </div>

                                    {/* Christmas-specific options */}
                                    {isChristmasMode && (
                                        <div className="mt-3 space-y-3 p-3 bg-gradient-to-br from-red-900/20 to-green-900/20 rounded-lg border border-yellow-500/30">
                                            <p className="text-sm text-green-400 animate-pulse font-semibold">
                                                🎅 Ho ho ho! Merry Christmas! 🎄
                                            </p>
                                            <ToggleSwitch
                                                enabled={isChristmasMusicEnabled}
                                                onChange={toggleChristmasMusic}
                                                label="🎵 Enable Christmas Music"
                                            />
                                            <p className="text-xs text-gray-400">
                                                ✨ Festive lights, falling snow, glowing effects!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </SettingCard>

                            <SettingCard title="Hover Previews">
                                <ToggleSwitch
                                    enabled={settings.previewsEnabled}
                                    onChange={() => settings.togglePreviews()}
                                    label="Enable hover previews on posters"
                                />
                            </SettingCard>

                            <SettingCard title="Data Saver Mode">
                                <ToggleSwitch
                                    enabled={dataSaver}
                                    onChange={handleDataSaverToggle}
                                    label="Reduce image quality to save bandwidth"
                                />
                            </SettingCard>

                            <SettingCard title="Subtitle Size">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">
                                        Font Size: {subtitleSize}%
                                    </label>
                                    <input
                                        type="range"
                                        min="50"
                                        max="200"
                                        step="10"
                                        value={subtitleSize}
                                        onChange={(e) => handleSubtitleSizeChange(Number(e.target.value))}
                                        className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-red-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>50%</span>
                                        <span>100%</span>
                                        <span>200%</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Preview: <span style={{ fontSize: `${subtitleSize}%` }}>Sample subtitle text</span>
                                    </p>
                                </div>
                            </SettingCard>
                        </div>
                    )}

                    {/* Playback Tab */}
                    {activeTab === 'playback' && (
                        <div className="space-y-6 animate-fade-in">
                            <SettingCard title="Video Quality" icon={FaVideo}>
                                <div className="grid grid-cols-3 gap-3">
                                    {['auto', 'hd', 'sd'].map(quality => (
                                        <button
                                            key={quality}
                                            onClick={() => handleVideoQualityChange(quality)}
                                            className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                                videoQuality === quality
                                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                                                    : 'bg-[var(--bg-tertiary)] text-gray-400 hover:bg-[var(--bg-tertiary-hover)]'
                                            }`}
                                        >
                                            {quality.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </SettingCard>

                            <SettingCard title="Autoplay">
                                <ToggleSwitch
                                    enabled={autoplay}
                                    onChange={handleAutoplayToggle}
                                    label="Automatically play next episode"
                                />
                            </SettingCard>

                            <SettingCard title="Auto-Skip Intro">
                                <ToggleSwitch
                                    enabled={autoSkipIntro}
                                    onChange={handleAutoSkipIntroToggle}
                                    label="Automatically skip intro sequences"
                                />
                                {autoSkipIntro && (
                                    <div className="mt-4 space-y-2">
                                        <label className="text-sm text-gray-400">
                                            Skip Intro Time: {skipIntroTime}s
                                        </label>
                                        <input
                                            type="range"
                                            min="30"
                                            max="120"
                                            step="5"
                                            value={skipIntroTime}
                                            onChange={(e) => handleSkipIntroTimeChange(Number(e.target.value))}
                                            className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-red-600"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>30s</span>
                                            <span>120s</span>
                                        </div>
                                    </div>
                                )}
                            </SettingCard>

                            <SettingCard title="Auto-Skip Outro">
                                <ToggleSwitch
                                    enabled={autoSkipOutro}
                                    onChange={handleAutoSkipOutroToggle}
                                    label="Automatically skip outro/credits and play next episode"
                                />
                            </SettingCard>
                        </div>
                    )}

                    {/* Data Tab */}
                    {activeTab === 'data' && (
                        <div className="space-y-6 animate-fade-in">
                            <SettingCard title="Parental Controls" icon={FaLock}>
                                <ToggleSwitch
                                    enabled={parentalControl}
                                    onChange={handleParentalControlToggle}
                                    label="Enable content filtering by maturity rating"
                                />
                                {parentalControl && (
                                    <div className="mt-4 space-y-3">
                                        <label className="text-sm text-gray-400 block">Maximum Maturity Rating</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {['G', 'PG', 'PG-13', 'R', 'All'].map(rating => (
                                                <button
                                                    key={rating}
                                                    onClick={() => handleMaturityRatingChange(rating)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                        maturityRating === rating
                                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                                                            : 'bg-[var(--bg-tertiary)] text-gray-400 hover:bg-[var(--bg-tertiary-hover)]'
                                                    }`}
                                                >
                                                    {rating}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {maturityRating === 'G' && 'Only general audience content'}
                                            {maturityRating === 'PG' && 'Parental guidance suggested'}
                                            {maturityRating === 'PG-13' && 'Parents strongly cautioned'}
                                            {maturityRating === 'R' && 'Restricted content included'}
                                            {maturityRating === 'All' && 'No content filtering'}
                                        </p>
                                    </div>
                                )}
                            </SettingCard>

                            <SettingCard title="Cache Management" icon={FaDatabase}>
                                <button
                                    onClick={handleClearCache}
                                    className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-all"
                                >
                                    Clear Cache & Temporary Data
                                </button>
                            </SettingCard>

                            <SettingCard title="Data Management">
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleClearData(onClearContinueWatching, 'Continue Watching list')}
                                        className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-lg transition-all font-medium"
                                    >
                                        Clear Continue Watching
                                    </button>
                                    <button
                                        onClick={() => handleClearData(onClearWatchedHistory, 'Watched History')}
                                        className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-lg transition-all font-medium"
                                    >
                                        Clear Watched History
                                    </button>
                                    <button
                                        onClick={() => handleClearData(onClearMyList, 'My List')}
                                        className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-lg transition-all font-medium"
                                    >
                                        Clear My List
                                    </button>
                                </div>
                            </SettingCard>
                        </div>
                    )}

                    {/* About Tab */}
                    {activeTab === 'about' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-gradient-to-br from-red-900/20 to-purple-900/20 rounded-2xl p-8 text-center border border-red-500/30">
                                <div className="text-6xl mb-4">🎬</div>
                                <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
                                    NikzFlix TV
                                </h3>
                                <p className="text-gray-400 mb-4">Version 2.0.0</p>
                                <p className="text-gray-300 mb-6">
                                    Your ultimate streaming platform for anime, dramas, and more!
                                </p>
                                <div className="flex justify-center gap-4">
                                    <div className="bg-black/30 px-6 py-3 rounded-lg">
                                        <div className="text-2xl font-bold text-red-500">10K+</div>
                                        <div className="text-xs text-gray-400">Titles</div>
                                    </div>
                                    <div className="bg-black/30 px-6 py-3 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-500">HD</div>
                                        <div className="text-xs text-gray-400">Quality</div>
                                    </div>
                                    <div className="bg-black/30 px-6 py-3 rounded-lg">
                                        <div className="text-2xl font-bold text-green-500">24/7</div>
                                        <div className="text-xs text-gray-400">Available</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-6">
                                <h4 className="font-bold text-lg mb-3">Credits</h4>
                                <ul className="space-y-2 text-gray-300 text-sm">
                                    <li>• Developed by <span className="text-red-500 font-semibold">NikzFlix Team</span></li>
                                    <li>• Powered by TMDB API</li>
                                    <li>• Built with React & Vite</li>
                                    <li>• Made with ❤️ in the Philippines</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Components
const SettingCard = ({ title, icon: Icon, children }) => (
    <div className="bg-[var(--bg-tertiary)]/50 backdrop-blur-sm rounded-xl p-6 border border-[var(--border-color)]">
        <div className="flex items-center gap-3 mb-4">
            {Icon && <Icon className="text-red-500 text-xl" />}
            <h3 className="text-xl font-bold">{title}</h3>
        </div>
        {children}
    </div>
);

const ToggleSwitch = ({ enabled, onChange, label }) => {
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onChange();
        }
    };

    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-gray-300 text-sm sm:text-base">{label}</span>
            <button
                type="button"
                onClick={onChange}
                onKeyDown={handleKeyDown}
                role="switch"
                aria-checked={enabled}
                className={`relative w-14 h-7 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500/60 ${
                    enabled ? 'bg-red-600' : 'bg-gray-600'
                }`}
            >
                <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform transform ${
                        enabled ? 'translate-x-7' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
};