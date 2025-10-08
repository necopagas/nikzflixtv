import React from 'react';

export const SettingsModal = ({
    onClose,
    theme,
    toggleTheme,
    onClearContinueWatching,
    onClearWatchedHistory,
    onClearMyList
}) => {
    const handleClearData = (clearFunction, type) => {
        if (window.confirm(`Are you sure you want to clear your ${type}? This action cannot be undone.`)) {
            clearFunction();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
            <div className="bg-[var(--bg-secondary)] w-full max-w-md p-6 rounded-lg shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Close settings"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                    Settings
                </h2>

                {/* --- Appearance Section --- */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Appearance</h3>
                    <div className="flex items-center justify-between bg-[var(--bg-tertiary)] p-3 rounded-md">
                        <label htmlFor="theme-toggle" className="text-[var(--text-secondary)]">Theme</label>
                        <button
                            onClick={toggleTheme}
                            className="px-4 py-1 rounded-full bg-[var(--bg-primary)] font-semibold"
                        >
                            {theme === 'light' ? 'Dark' : 'Light'}
                        </button>
                    </div>
                </div>

                {/* --- Data Management Section --- */}
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Data Management</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => handleClearData(onClearContinueWatching, 'Continue Watching list')}
                            className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-md transition-colors"
                        >
                            Clear Continue Watching
                        </button>
                        <button
                            onClick={() => handleClearData(onClearWatchedHistory, 'Watched History')}
                            className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-md transition-colors"
                        >
                            Clear Watched History
                        </button>
                        <button
                            onClick={() => handleClearData(onClearMyList, 'My List')}
                            className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-md transition-colors"
                        >
                            Clear My List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};