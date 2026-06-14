import { useTranslation } from 'react-i18next';

// Filter key naming: 'high' means high SSI (safe), 'medium' means moderate SSI, 'low' means low SSI (risky).
// Thresholds: high = SSI >= 70 (safe/green), medium = SSI 40-69 (moderate/amber), low = SSI < 40 (risky/red).
interface Props {
  filter: 'all' | 'high' | 'medium' | 'low';
  onFilterChange: (f: 'all' | 'high' | 'medium' | 'low') => void;
  count: number;
}

export default function FilterBar({ filter, onFilterChange, count }: Props) {
  const { t } = useTranslation();
  return (
    <div className="absolute top-4 left-[340px] z-[1000] flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 shadow-lg transition-colors">
      <span className="text-xs text-slate-400 font-medium mr-1">{t('map.filterLabel')}</span>
      {(['all', 'high', 'medium', 'low'] as const).map((f) => (
        <button key={f} onClick={() => onFilterChange(f)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            filter === f
              ? f === 'high' ? 'bg-green-500 text-white'
                : f === 'medium' ? 'bg-amber-500 text-white'
                : f === 'low' ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}>
          {f === 'all' ? t('map.filterAll') : f === 'high' ? t('map.filterSafe') : f === 'medium' ? t('map.filterModerate') : t('map.filterRisky')}
        </button>
      ))}
      <span className="text-xs text-slate-400 ml-2">{t('map.locationCount', { count })}</span>
    </div>
  );
}
