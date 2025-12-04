/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

export const SettingsProvider = ({ children }) => {
  const STORAGE_KEY = 'nikz_settings_v1';
  const [previewsEnabled, setPreviewsEnabled] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.previewsEnabled === 'boolean') setPreviewsEnabled(parsed.previewsEnabled);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ previewsEnabled }));
    } catch {
      // ignore write errors
    }
  }, [previewsEnabled]);

  const togglePreviews = () => setPreviewsEnabled(v => !v);

  const value = {
    previewsEnabled,
    setPreviewsEnabled,
    togglePreviews,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
