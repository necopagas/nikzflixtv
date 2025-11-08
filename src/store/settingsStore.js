// src/store/settingsStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const defaultSettings = {
  theme: 'dark',
  language: 'en',
  autoplay: true,
  quality: 'auto',
  hoverPreviews: true,
  dataSaver: false,
  subtitleSize: 100,
  autoSkipIntro: false,
  autoSkipOutro: false,
  skipIntroTime: 30,
  parentalControls: false,
  maturityRating: 'All',
};

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      ...defaultSettings,

      updateSetting: (key, value) => set({ [key]: value }),

      updateSettings: settings => set(settings),

      resetSettings: () => set(defaultSettings),

      toggleTheme: () =>
        set(state => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      exportSettings: () => {
        const settings = get();
        const blob = new Blob([JSON.stringify(settings, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nikzflix-settings-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },

      importSettings: async file => {
        try {
          const text = await file.text();
          const settings = JSON.parse(text);
          set(settings);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    }),
    {
      name: 'nikzflix-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
