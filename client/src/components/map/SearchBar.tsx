import { useRef, useEffect, useMemo } from 'react';
import type { MapMarkerWithHistory } from '../../types';
import { getSSIColor, getSSILabel } from '../../types';

interface Props {
  markers: MapMarkerWithHistory[];
  query: string;
  onQueryChange: (q: string) => void;
  onMarkerSelect: (m: MapMarkerWithHistory) => void;
  onAreaZoom: (markers: MapMarkerWithHistory[]) => void;
  showDropdown: boolean;
  onDropdownChange: (show: boolean) => void;
}

interface AreaGroup {
  area: string;
  markers: MapMarkerWithHistory[];
}

function groupByArea(markers: MapMarkerWithHistory[]): AreaGroup[] {
  const map = new Map<string, MapMarkerWithHistory[]>();
  for (const m of markers) {
    const existing = map.get(m.area) || [];
    existing.push(m);
    map.set(m.area, existing);
  }
  return Array.from(map.entries())
    .map(([area, markers]) => ({ area, markers }))
    .sort((a, b) => b.markers.length - a.markers.length);
}

export default function SearchBar({ markers, query, onQueryChange, onMarkerSelect, onAreaZoom, showDropdown, onDropdownChange }: Props) {
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        onDropdownChange(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onDropdownChange]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return markers.filter((m) => (
      m.name.toLowerCase().includes(q) ||
      m.area.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      getSSILabel(m.ssi).toLowerCase().includes(q)
    ));
  }, [markers, query]);

  const areaGroups = useMemo(() => groupByArea(searchResults), [searchResults]);

  return (
    <div ref={searchRef} className="absolute top-4 left-20 z-[1001] w-80">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text" value={query}
          onChange={(e) => { onQueryChange(e.target.value); onDropdownChange(true); }}
          onFocus={() => query.trim() && onDropdownChange(true)}
          placeholder="Search location, hostel name, or area..."
          className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl pl-10 pr-9 py-2.5 border border-slate-200 dark:border-slate-700/50 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-lg"
        />
        {query && (
          <button onClick={() => { onQueryChange(''); onDropdownChange(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-xl max-h-80 overflow-y-auto">
          {areaGroups.map((group, gi) => (
            <div key={group.area}>
              <button
                onClick={() => { onAreaZoom(group.markers); onQueryChange(group.area); onDropdownChange(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors ${gi === 0 ? 'rounded-t-xl' : ''}`}
              >
                <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{group.area}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {group.markers.length} location{group.markers.length > 1 ? 's' : ''}
                </span>
                <svg className="w-3 h-3 text-slate-300 dark:text-slate-600 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              {group.markers.map((m) => (
                <button key={m.id}
                  onClick={() => { onMarkerSelect(m); onQueryChange(m.name); onDropdownChange(false); }}
                  className="w-full flex items-center gap-3 px-4 pl-9 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: getSSIColor(m.ssi) }}>{m.ssi}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{m.type} · {getSSILabel(m.ssi)}</p>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {showDropdown && query.trim() && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-xl px-4 py-3">
          <p className="text-xs text-slate-400 text-center">No locations found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
