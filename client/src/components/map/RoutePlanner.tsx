import { useState, useRef, useEffect } from 'react';
import { SEED_MARKERS, SEED_COLLEGES } from '../../services/mapData';
import { getSSIColor } from '../../types';

interface Props {
  accommodationId: string | null;
  collegeId: string | null;
  onAccommodationChange: (id: string | null) => void;
  onCollegeChange: (id: string | null) => void;
}

function AutocompleteDropdown({
  label, options, value, onSelect, getSub,
}: {
  label: string; options: Array<{ id: string; name: string; area?: string; ssi?: number }>;
  value: string; onSelect: (id: string) => void; getSub?: (o: any) => string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()) || o.area?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <label className="text-[10px] font-medium text-slate-400 mb-1 block">{label}</label>
      <input type="text" value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={`Search ${label.toLowerCase()}...`}
        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500/60 transition-all" />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
          {filtered.map((o) => (
            <button key={o.id} onClick={() => { setQuery(o.name); onSelect(o.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              {o.ssi !== undefined && (
                <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ background: getSSIColor(o.ssi) }}>{o.ssi}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{o.name}</p>
                <p className="text-[10px] text-slate-400">{getSub ? getSub(o) : o.area}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoutePlanner({ accommodationId, collegeId, onAccommodationChange, onCollegeChange }: Props) {
  const accOptions = SEED_MARKERS.map((m) => ({ id: m.id, name: m.name, area: m.area, ssi: m.ssi }));
  const colOptions = SEED_COLLEGES.map((c) => ({ id: c.id, name: c.name, area: c.area }));

  const selectedAcc = SEED_MARKERS.find((m) => m.id === accommodationId);
  const selectedCol = SEED_COLLEGES.find((c) => c.id === collegeId);

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-xl p-4 w-72">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Route Planner</h3>
      </div>
      <div className="space-y-3">
        <AutocompleteDropdown label="Accommodation" options={accOptions}
          value={selectedAcc?.name ?? ''} onSelect={onAccommodationChange} />
        <AutocompleteDropdown label="College" options={colOptions}
          value={selectedCol?.name ?? ''} onSelect={onCollegeChange} />
      </div>
    </div>
  );
}
