import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface Props { onFilterChange: (f: any) => void; }
export function ReportFilters({ onFilterChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Filter className="h-4 w-4" />{t('map.filter')}</div>
      <select className="h-9 rounded-lg border border-slate-200 px-2 text-sm" onChange={(e) => onFilterChange({ category: e.target.value })}>
        <option value="">All Categories</option>
        <option value="harassment">{t('report.harassment')}</option>
        <option value="theft">{t('report.theft')}</option>
        <option value="unsafe_area">{t('report.unsafeArea')}</option>
      </select>
      <select className="h-9 rounded-lg border border-slate-200 px-2 text-sm" onChange={(e) => onFilterChange({ severity: e.target.value })}>
        <option value="">All Severities</option>
        <option value="low">{t('report.low')}</option>
        <option value="medium">{t('report.medium')}</option>
        <option value="high">{t('report.high')}</option>
        <option value="critical">{t('report.critical')}</option>
      </select>
      <Button variant="ghost" size="sm" onClick={() => onFilterChange({})}>Reset</Button>
    </div>
  );
}
