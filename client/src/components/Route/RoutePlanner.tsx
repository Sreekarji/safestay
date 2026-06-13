import { useState, useRef, useEffect } from 'react';
import type { RouteLocation } from '../../types';
import { COLLEGES, ACCOMMODATIONS } from '../../services/routeData';

interface Props {
  accommodationId: string | null;
  collegeId: string | null;
  onAccommodationChange: (id: string | null) => void;
  onCollegeChange: (id: string | null) => void;
}

export default function RoutePlanner({
  accommodationId,
  collegeId,
  onAccommodationChange,
  onCollegeChange,
}: Props) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-lg px-4 py-3">
      <div className="flex items-center gap-2 text-slate-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-wider">Route</span>
      </div>
      <LocationSelect
        label="Accommodation"
        placeholder="Select PG / Hostel"
        locations={ACCOMMODATIONS}
        selectedId={accommodationId}
        onChange={onAccommodationChange}
      />
      <div className="flex flex-col items-center gap-1 pt-5">
        <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
      <LocationSelect
        label="College"
        placeholder="Select College"
        locations={COLLEGES}
        selectedId={collegeId}
        onChange={onCollegeChange}
      />
    </div>
  );
}

function LocationSelect({
  label,
  placeholder,
  locations,
  selectedId,
  onChange,
}: {
  label: string;
  placeholder: string;
  locations: RouteLocation[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = locations.find((l) => l.id === selectedId);

  const filtered = query.trim()
    ? locations.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.area.toLowerCase().includes(query.toLowerCase()),
      )
    : locations;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg text-left text-sm transition-colors hover:border-slate-300 dark:hover:border-slate-600"
      >
        {selected ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-slate-900 dark:text-white font-medium truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}
        <svg className={`w-4 h-4 ml-auto text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {selected && (
              <button
                onClick={() => { onChange(null); setQuery(''); setOpen(false); }}
                className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Clear selection
              </button>
            )}
            {filtered.map((loc) => (
              <button
                key={loc.id}
                onClick={() => { onChange(loc.id); setQuery(''); setOpen(false); }}
                className={`w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 ${
                  loc.id === selectedId ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${loc.id === selectedId ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{loc.name}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{loc.area}</p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
