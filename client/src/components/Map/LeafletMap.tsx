import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { MapMarkerWithHistory, RouteIntelligence } from '../../types';
import { getSSIColor, getSSILabel } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import MarkerPopup from './MarkerPopup';
import RouteOverlay from '../Route/RouteOverlay';
import { fetchMapMarkersWithHistory } from '../../services/api';

// Hyderabad center coordinates
const HYDERABAD_CENTER: [number, number] = [17.385, 78.4867];
const DEFAULT_ZOOM = 12;

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

function createSSIIcon(ssi: number): L.DivIcon {
  const color = getSSIColor(ssi);
  return L.divIcon({
    className: 'ssi-marker-wrapper',
    html: `<div class="ssi-marker" style="background:${color}">${ssi}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function MapUpdater({ markers }: { markers: MapMarkerWithHistory[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [markers, map]);
  return null;
}

function FlyToMarker({ marker }: { marker: MapMarkerWithHistory | null }) {
  const map = useMap();
  useEffect(() => {
    if (!marker) return;
    map.flyTo([marker.latitude, marker.longitude], 15, { duration: 1.2 });
  }, [marker, map]);
  return null;
}

// Fly to all markers in an area
function FlyToArea({ areaMarkers }: { areaMarkers: (MapMarkerWithHistory | MarkerWithSSI)[] }) {
  const map = useMap();
  useEffect(() => {
    if (areaMarkers.length === 0) return;
    if (areaMarkers.length === 1) {
      map.flyTo([areaMarkers[0].latitude, areaMarkers[0].longitude], 15, { duration: 1 });
    } else {
      const bounds = L.latLngBounds(areaMarkers.map((m) => [m.latitude, m.longitude]));
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1 });
    }
  }, [areaMarkers, map]);
  return null;
}

// Marker with computed SSI for selected month
type MarkerWithSSI = MapMarkerWithHistory & { currentSSI: number };

interface Props {
  selectedMonth: string;
  selectedMarker: MapMarkerWithHistory | null;
  onMarkerSelect: (marker: MapMarkerWithHistory) => void;
  route?: RouteIntelligence | null;
  selectedHotspotId?: string | null;
  mode?: 'timeline' | 'route';
}

// Group search results by area
interface AreaGroup {
  area: string;
  markers: MarkerWithSSI[];
}

function groupByArea(markers: MarkerWithSSI[]): AreaGroup[] {
  const map = new Map<string, MarkerWithSSI[]>();
  for (const m of markers) {
    const existing = map.get(m.area) || [];
    existing.push(m);
    map.set(m.area, existing);
  }
  return Array.from(map.entries())
    .map(([area, markers]) => ({ area, markers }))
    .sort((a, b) => b.markers.length - a.markers.length);
}

export default function LeafletMap({ selectedMonth, selectedMarker, onMarkerSelect, route, selectedHotspotId, mode = 'timeline' }: Props) {
  const { theme } = useTheme();
  const [markers, setMarkers] = useState<MapMarkerWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [flyToAreaMarkers, setFlyToAreaMarkers] = useState<MapMarkerWithHistory[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const mapKey = `${theme}-${selectedMonth}`;

  useEffect(() => {
    fetchMapMarkersWithHistory()
      .then(setMarkers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markersWithScore: MarkerWithSSI[] = useMemo(() => {
    return markers.map((m) => {
      const entry = m.history.find((h) => h.month === selectedMonth);
      return { ...m, currentSSI: entry?.score ?? m.ssi };
    });
  }, [markers, selectedMonth]);

  const filtered = markersWithScore.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'high') return m.currentSSI >= 80;
    if (filter === 'medium') return m.currentSSI >= 60 && m.currentSSI < 80;
    return m.currentSSI < 60;
  });

  // Search: match name, area, type, or SSI label
  const searchResults: MarkerWithSSI[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return markersWithScore.filter((m) => (
      m.name.toLowerCase().includes(q) ||
      m.area.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      getSSILabel(m.currentSSI).toLowerCase().includes(q)
    ));
  }, [markersWithScore, query]);

  const areaGroups = useMemo(() => groupByArea(searchResults), [searchResults]);

  // Unique areas that match the query (for area header clicks)
  const matchedAreas = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const areas = new Set<string>();
    for (const m of markersWithScore) {
      if (m.area.toLowerCase().includes(q)) {
        areas.add(m.area);
      }
    }
    return Array.from(areas);
  }, [markersWithScore, query]);

  return (
    <div className="relative h-full w-full">
      {/* Search bar */}
      <div ref={searchRef} className="absolute top-4 left-4 z-[1001] w-80">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
              setFlyToAreaMarkers([]);
            }}
            onFocus={() => query.trim() && setShowDropdown(true)}
            placeholder="Search location, hostel name, or area..."
            className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl pl-10 pr-9 py-2.5 border border-slate-200 dark:border-slate-700/50 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-lg"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setShowDropdown(false); setFlyToAreaMarkers([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown with area grouping */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-xl max-h-80 overflow-y-auto">
            {areaGroups.map((group, gi) => (
              <div key={group.area}>
                {/* Area header — clickable to zoom */}
                <button
                  onClick={() => {
                    setFlyToAreaMarkers(group.markers);
                    setQuery(group.area);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors ${gi === 0 ? 'rounded-t-xl' : ''}`}
                >
                  <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{group.area}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {group.markers.length} location{group.markers.length > 1 ? 's' : ''}
                  </span>
                  <svg className="w-3 h-3 text-slate-300 dark:text-slate-600 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                {/* Markers in this area */}
                {group.markers.map((m) => (
                  <button
                    key={m.accommodationId}
                    onClick={() => {
                      onMarkerSelect(m);
                      setQuery(m.name);
                      setShowDropdown(false);
                      setFlyToAreaMarkers([]);
                    }}
                    className="w-full flex items-center gap-3 px-4 pl-9 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: getSSIColor(m.currentSSI) }}
                    >
                      {m.currentSSI}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{m.type} · {getSSILabel(m.currentSSI)}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {showDropdown && query.trim() && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-xl px-4 py-3">
            <p className="text-xs text-slate-400 text-center">No locations found for "{query}"</p>
          </div>
        )}
      </div>

      {/* Filter bar — only in timeline mode */}
      {mode === 'timeline' && (
        <div className="absolute top-4 left-[340px] z-[1000] flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 shadow-lg transition-colors">
          <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
          {(['all', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                filter === f
                  ? f === 'high' ? 'bg-green-500 text-white'
                    : f === 'medium' ? 'bg-amber-500 text-white'
                    : f === 'low' ? 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'high' ? 'Safe (80+)' : f === 'medium' ? 'Moderate (60-79)' : 'Risky (<60)'}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-2">{filtered.length} locations</span>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading safety data...</p>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        key={mapKey}
        center={HYDERABAD_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="h-full w-full rounded-none"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url={theme === 'dark' ? DARK_TILE : LIGHT_TILE}
        />
        <MapUpdater markers={filtered} />
        <FlyToMarker marker={selectedMarker} />
        <FlyToArea areaMarkers={flyToAreaMarkers} />
        {route && <RouteOverlay route={route} selectedHotspotId={selectedHotspotId ?? null} />}
        {filtered.map((marker) => (
          <Marker
            key={marker.accommodationId}
            position={[marker.latitude, marker.longitude]}
            icon={createSSIIcon(marker.currentSSI)}
            eventHandlers={{
              click: () => onMarkerSelect(marker),
            }}
          >
            <Popup maxWidth={320} minWidth={280}>
              <MarkerPopup marker={marker} selectedMonth={selectedMonth} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
