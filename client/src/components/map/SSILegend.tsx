import { useTranslation } from 'react-i18next';
export function SSILegend() {
  const { t } = useTranslation();
  const levels = [
    { color: '#22c55e', label: t('map.filterSafe', 'Safe'), range: '70-100' },
    { color: '#f59e0b', label: t('map.filterModerate', 'Moderate'), range: '40-69' },
    { color: '#ef4444', label: t('map.filterRisky', 'Risky'), range: '0-39' },
  ];
  return (
    <div className="absolute bottom-6 right-6 z-[1000] rounded-xl bg-white/95 backdrop-blur shadow-lg border border-slate-200 p-4">
      <h4 className="text-xs font-semibold text-slate-700 mb-2">{t('map.ssiScore')}</h4>
      <div className="space-y-1.5">{levels.map((l) => (
        <div key={l.label} className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: l.color }} />
          <span className="text-xs text-slate-600">{l.label}</span>
          <span className="text-xs text-slate-400 ml-auto">{l.range}</span>
        </div>
      ))}</div>
    </div>
  );
}
