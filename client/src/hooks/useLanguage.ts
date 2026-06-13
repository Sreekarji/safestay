import { useLanguageStore } from '@/stores/languageStore';

export function useLanguage() {
  const { language, isChanging, setLanguage, toggleLanguage } = useLanguageStore();
  return { language, isChanging, setLanguage, toggleLanguage };
}
