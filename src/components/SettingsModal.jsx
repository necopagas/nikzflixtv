import React from 'react';
import { useSettings } from '../context/SettingsContext';

export const SettingsModal = ({
    onClose,
    theme,
    toggleTheme,
    onClearContinueWatching,
    onClearWatchedHistory,
    onClearMyList
}) => {
    const settings = useSettings();
    const handleClearData = (clearFunction, type) => {
        if (window.confirm(`Are you sure you want to clear your ${type}? This action cannot be undone.`)) {
            clearFunction();
        }
    };
    
    // --- GIDUGANG NGA HANDLER PARA SA KEYBOARD ---
    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
            <div className="bg-[var(--bg-secondary)] w-full max-w-md p-6 rounded-lg shadow-2xl relative">
                <button
                    onClick={onClose}
                    tabIndex="0" // Make close button focusable
                    onKeyDown={(e) => handleKeyDown(e, onClose)} // Handle Enter/Space
                    className="absolute top-3 right-3 text-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] rounded-full" // Added focus style
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
                        <label htmlFor="theme-toggle-button" className="text-[var(--text-secondary)]">Theme</label> {/* Changed from htmlFor="theme-toggle" */}
                        <button
                            id="theme-toggle-button" // Added ID for label
                            onClick={toggleTheme}
                            tabIndex="0" // Make it focusable
                            onKeyDown={(e) => handleKeyDown(e, toggleTheme)} // Handle Enter/Space
                            className="px-4 py-1 rounded-full bg-[var(--bg-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-tertiary)] focus:ring-[var(--brand-color)]" // Added focus style
                        >
                            {theme === 'light' ? 'Dark' : 'Light'}
                        </button>
                    </div>
                </div>

                {/* --- Preview Toggle --- */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Previews</h3>
                    <div className="flex items-center justify-between bg-[var(--bg-tertiary)] p-3 rounded-md">
                        <label htmlFor="preview-toggle" className="text-[var(--text-secondary)]">Enable Hover Previews</label>
                        <button
                            id="preview-toggle"
                            onClick={() => settings.togglePreviews()}
                            className="px-4 py-1 rounded-full bg-[var(--bg-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-tertiary)] focus:ring-[var(--brand-color)]"
                            aria-pressed={!!settings.previewsEnabled}
                        >
                            {settings.previewsEnabled ? 'On' : 'Off'}
                        </button>
                    </div>
                </div>

                {/* --- Data Management Section --- */}
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Data Management</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => handleClearData(onClearContinueWatching, 'Continue Watching list')}
                            tabIndex="0" // Make it focusable
                            onKeyDown={(e) => handleKeyDown(e, () => handleClearData(onClearContinueWatching, 'Continue Watching list'))} // Handle Enter/Space
                            // Consistent secondary button style
                            className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" // Added focus style & font-medium
                        >
                            Clear Continue Watching
                        </button>
                        <button
                            onClick={() => handleClearData(onClearWatchedHistory, 'Watched History')}
                            tabIndex="0" // Make it focusable
                            onKeyDown={(e) => handleKeyDown(e, () => handleClearData(onClearWatchedHistory, 'Watched History'))} // Handle Enter/Space
                             // Consistent secondary button style
                            className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" // Added focus style & font-medium
                        >
                            Clear Watched History
                        </button>
                        <button
                            onClick={() => handleClearData(onClearMyList, 'My List')}
                            tabIndex="0" // Make it focusable
                            onKeyDown={(e) => handleKeyDown(e, () => handleClearData(onClearMyList, 'My List'))} // Handle Enter/Space
                             // Consistent secondary button style
                            className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary-hover)] p-3 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]" // Added focus style & font-medium
                        >
                            Clear My List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};