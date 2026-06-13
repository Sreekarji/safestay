import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEED_MARKERS, SEED_COLLEGES } from '../../services/mapData';
import { getSSIColor } from '../../types';

interface Props {
  accommodationId: string | null;
  collegeId: string | null;
  onAccommodationChange: (id: string | null) => void;
  onCollegeChange: (id: string | null) => void;
  loading?: boolean;
}

function AutocompleteDropdown({
  label, icon, options, value, onSelect, loading,
}: {
  label: string; icon: React.ReactNode;
  options: Array<{ id: string; name: string; area?: string; ssi?: number }>;
  value: string; onSelect: (id: string) => void; loading?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase()) ||
    o.area?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input ref={inputRef} type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400" />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50">
            {filtered.map((o) => (
              <button key={o.id} onClick={() => { setQuery(o.name); onSelect(o.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors first:rounded-t-xl last:rounded-b-xl">
                {o.ssi !== undefined ? (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: getSSIColor(o.ssi) }}>{o.ssi}</div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 10 3 12 0v-5" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{o.name}</p>
                  <p className="text-[11px] text-slate-400">{o.area}</p>
                </div>
                {o.ssi !== undefined && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${getSSIColor(o.ssi)}15`, color: getSSIColor(o.ssi) }}>
                    {o.ssi >= 70 ? 'Safe' : o.ssi >= 40 ? 'Moderate' : 'Risky'}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoutePlanner({ accommodationId, collegeId, onAccommodationChange, onCollegeChange, loading }: Props) {
  const accOptions = SEED_MARKERS.map((m) => ({ id: m.id, name: m.name, area: m.area, ssi: m.ssi }));
  const colOptions = SEED_COLLEGES.map((c) => ({ id: c.id, name: c.name, area: c.area }));

  const selectedAcc = SEED_MARKERS.find((m) => m.id === accommodationId);
  const selectedCol = SEED_COLLEGES.find((c) => c.id === collegeId);
  const hasRoute = accommodationId && collegeId;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-2xl p-5 w-80">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Route Planner</h3>
          <p className="text-[10px] text-slate-400">Find the safest commute</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <AutocompleteDropdown label="Accommodation" loading={loading}
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
          options={accOptions} value={selectedAcc?.name ?? ''} onSelect={onAccommodationChange} />

        <AutocompleteDropdown label="College" loading={loading}
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 10 3 12 0v-5" /></svg>}
          options={colOptions} value={selectedCol?.name ?? ''} onSelect={onCollegeChange} />
      </div>

      {/* Route status */}
      {hasRoute && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Route calculated • {selectedAcc?.area} → {selectedCol?.area}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
