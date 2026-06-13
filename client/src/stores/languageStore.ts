import { create } from 'zustand';
import i18next from 'i18next';

interface LanguageState {
  language: 'en' | 'te' | 'hi';
  isChanging: boolean;
  setLanguage: (lang: 'en' | 'te' | 'hi') => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: (localStorage.getItem('language') as 'en' | 'te' | 'hi') || 'en',
  isChanging: false,

  setLanguage: (lang) => {
    set({ isChanging: true });
    localStorage.setItem('language', lang);
    i18next.changeLanguage(lang);
    set({ language: lang, isChanging: false });
  },

  toggleLanguage: () => {
    const current = get().language;
    const next = current === 'en' ? 'te' : current === 'te' ? 'hi' : 'en';
    get().setLanguage(next);
  },
}));
