import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStateStorage } from '../storage/mmkv';
import { saveLocale, type SupportedLocale } from '../i18n';

export interface PreferencesState {
  locale: SupportedLocale;
  pushPermissionAsked: boolean;
  recentSearches: string[];
  setLocale: (locale: SupportedLocale) => void;
  markPushPermissionAsked: () => void;
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      pushPermissionAsked: false,
      recentSearches: [],
      setLocale: (locale) => {
        saveLocale(locale);
        set({ locale });
      },
      markPushPermissionAsked: () => set({ pushPermissionAsked: true }),
      addRecentSearch: (term) => {
        const cleaned = term.trim();
        if (!cleaned) return;
        const current = get().recentSearches.filter(
          (item) => item.toLowerCase() !== cleaned.toLowerCase(),
        );
        set({ recentSearches: [cleaned, ...current].slice(0, 10) });
      },
      removeRecentSearch: (term) =>
        set({
          recentSearches: get().recentSearches.filter((item) => item !== term),
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'az-preferences',
      storage: createJSONStorage(() => mmkvStateStorage),
    },
  ),
);
