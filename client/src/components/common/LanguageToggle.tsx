import { Globe } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  { code: 'te' as const, name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi' as const, name: 'हिन्दी', flag: '🇮🇳' },
];

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();
  const current = languages.find((l) => l.code === language) || languages[0];
  return (
    <DropdownMenu
      trigger={
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{current.flag} {current.name}</span>
          <span className="sm:hidden">{current.flag}</span>
        </button>
      }
      align="right"
    >
      {languages.map((lang) => (
        <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)}>
          <span className="mr-2">{lang.flag}</span>{lang.name}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
