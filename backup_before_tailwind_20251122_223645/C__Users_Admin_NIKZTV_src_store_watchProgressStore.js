// src/store/watchProgressStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useWatchProgressStore = create(
  persist(
    (set, get) => ({
      continueWatching: [],
      watchedHistory: [],

      setItemProgress: item =>
        set(state => {
          const existing = state.continueWatching.findIndex(i => i.itemId === item.itemId);

          if (existing !== -1) {
            const updated = [...state.continueWatching];
            updated[existing] = { ...item, timestamp: Date.now() };
            return { continueWatching: updated };
          }

          return {
            continueWatching: [{ ...item, timestamp: Date.now() }, ...state.continueWatching].slice(
              0,
              20
            ),
          };
        }),

      getItemProgress: itemId => {
        return get().continueWatching.find(item => item.itemId === itemId);
      },

      removeFromContinueWatching: itemId =>
        set(state => ({
          continueWatching: state.continueWatching.filter(item => item.itemId !== itemId),
        })),

      clearContinueWatching: () => set({ continueWatching: [] }),

      addToWatchedHistory: item =>
        set(state => {
          if (state.watchedHistory.some(i => i.id === item.id)) {
            return state;
          }
          return {
            watchedHistory: [{ ...item, watchedAt: Date.now() }, ...state.watchedHistory].slice(
              0,
              100
            ),
          };
        }),

      isWatched: itemId => {
        return get().watchedHistory.some(item => item.id === itemId);
      },

      clearWatchedHistory: () => set({ watchedHistory: [] }),
    }),
    {
      name: 'nikzflix-progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
