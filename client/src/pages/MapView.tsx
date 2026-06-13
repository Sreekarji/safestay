import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, List, MapPin } from 'lucide-react';
import { SafetyMap } from '@/components/map/SafetyMap';
import { SSILegend } from '@/components/map/SSILegend';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getSSIColor, getSSILabel } from '@/lib/utils';
import { accommodationService } from '@/services/accommodationService';

export function MapView() {
  const { t } = useTranslation();
  const [showSidebar, setShowSidebar] = useState(true);
  const [search, setSearch] = useState('');
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    accommodationService.getWithLocation()
      .then((data) => {
        if (mounted && Array.isArray(data)) setAccommodations(data);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = accommodations.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.area?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-3">
        <div className="flex-1 max-w-md"><ReportFilters onFilterChange={() => {}} /></div>
        <button onClick={() => setShowSidebar(!showSidebar)} className="h-10 w-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50"><List className="h-4 w-4" /></button>
      </div>
      {showSidebar && (
        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} className="absolute left-0 top-20 bottom-0 w-72 z-[1000] bg-white border-r border-slate-200 shadow-lg overflow-y-auto">
          <div className="p-4">
            <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder={t('map.searchArea')} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="space-y-2">
              {loading && <p className="text-sm text-slate-400">Loading...</p>}
              {!loading && filtered.length === 0 && <p className="text-sm text-slate-400">No accommodations found</p>}
              {filtered.map((acc) => (
                <Card key={acc._id} className="p-3 cursor-pointer hover:shadow-card-hover transition-all">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-slate-900">{acc.name}</p><p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{acc.area}</p></div>
                    <div className="text-right"><p className="text-lg font-bold" style={{ color: getSSIColor(acc.ssi) }}>{acc.ssi}</p><p className="text-xs text-slate-400">{getSSILabel(acc.ssi)}</p></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      )}
      <SafetyMap /><SSILegend />
    </div>
  );
}
