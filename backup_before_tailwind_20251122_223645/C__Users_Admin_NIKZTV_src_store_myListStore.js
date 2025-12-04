// src/store/myListStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useMyListStore = create(
  persist(
    (set, get) => ({
      myList: [],

      addToMyList: item =>
        set(state => {
          if (state.myList.some(i => i.id === item.id)) {
            return state;
          }
          return {
            myList: [...state.myList, { ...item, addedAt: Date.now() }],
          };
        }),

      removeFromMyList: itemId =>
        set(state => ({
          myList: state.myList.filter(item => item.id !== itemId),
        })),

      toggleMyList: item => {
        const { myList } = get();
        const exists = myList.some(i => i.id === item.id);

        if (exists) {
          get().removeFromMyList(item.id);
        } else {
          get().addToMyList(item);
        }
      },

      isInMyList: itemId => {
        return get().myList.some(item => item.id === itemId);
      },

      clearMyList: () => set({ myList: [] }),

      getMyListCount: () => get().myList.length,
    }),
    {
      name: 'nikzflix-mylist',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
