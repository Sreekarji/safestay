import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportFilterState { category: string; severity: string; }
interface Props { onFilterChange: (f: Partial<ReportFilterState>) => void; }

export function ReportFilters({ onFilterChange }: Props) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ReportFilterState>({ category: '', severity: '' });

  const updateFilter = (partial: Partial<ReportFilterState>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    onFilterChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Filter className="h-4 w-4" />{t('map.filter')}</div>
      <select className="h-9 rounded-lg border border-slate-200 px-2 text-sm" value={filters.category} onChange={(e) => updateFilter({ category: e.target.value })}>
        <option value="">All Categories</option>
        <option value="fire_safety">Fire Safety</option>
        <option value="water_quality">Water Quality</option>
        <option value="structural">Structural</option>
        <option value="electrical">Electrical</option>
        <option value="hygiene">Hygiene</option>
        <option value="security">Security</option>
        <option value="food_safety">Food Safety</option>
        <option value="other">Other</option>
      </select>
      <select className="h-9 rounded-lg border border-slate-200 px-2 text-sm" value={filters.severity} onChange={(e) => updateFilter({ severity: e.target.value })}>
        <option value="">All Severities</option>
        <option value="low">{t('report.low')}</option>
        <option value="medium">{t('report.medium')}</option>
        <option value="high">{t('report.high')}</option>
        <option value="critical">{t('report.critical')}</option>
      </select>
      <Button variant="ghost" size="sm" onClick={() => { setFilters({ category: '', severity: '' }); onFilterChange({}); }}>Reset</Button>
    </div>
  );
}
