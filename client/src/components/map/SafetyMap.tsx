import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { getSSIColor, getSSILabel } from '@/lib/utils';
import { accommodationService } from '@/services/accommodationService';
import 'leaflet/dist/leaflet.css';

// ── Types ──────────────────────────────────────────────────────
interface MarkerData {
  _id: string;
  name: string;
  area: string;
  ssi: number;
  reportCount: number;
  location?: { type: string; coordinates: [number, number] };
  riskLevel?: string;
  type?: string;
}

// ── Tile layers ────────────────────────────────────────────────
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// ── Custom SSI marker icon ─────────────────────────────────────
function createSSIIcon(ssi: number): L.DivIcon {
  const color = getSSIColor(ssi);
  return L.divIcon({
    className: 'ssi-marker-wrapper',
    html: `<div class="ssi-marker" style="background:${color};color:#fff;font-weight:700;font-size:11px;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid rgba(255,255,255,0.9);">${ssi}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ── Auto-fit bounds to markers ─────────────────────────────────
function MapUpdater({ markers }: { markers: MarkerData[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers.map((m) => [m.location?.coordinates?.[1] ?? 17.385, m.location?.coordinates?.[0] ?? 78.487])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [markers, map]);
  return null;
}

// ── Fly to a single marker ─────────────────────────────────────
function FlyToMarker({ marker }: { marker: MarkerData | null }) {
  const map = useMap();
  useEffect(() => {
    if (!marker) return;
    const lat = marker.location?.coordinates?.[1] ?? 17.385;
    const lng = marker.location?.coordinates?.[0] ?? 78.487;
    map.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [marker, map]);
  return null;
}

// ── Fly to area markers ────────────────────────────────────────
function FlyToArea({ areaMarkers }: { areaMarkers: MarkerData[] }) {
  const map = useMap();
  useEffect(() => {
    if (areaMarkers.length === 0) return;
    if (areaMarkers.length === 1) {
      const lat = areaMarkers[0].location?.coordinates?.[1] ?? 17.385;
      const lng = areaMarkers[0].location?.coordinates?.[0] ?? 78.487;
      map.flyTo([lat, lng], 15, { duration: 1 });
    } else {
      const bounds = L.latLngBounds(
        areaMarkers.map((m) => [m.location?.coordinates?.[1] ?? 17.385, m.location?.coordinates?.[0] ?? 78.487])
      );
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1 });
    }
  }, [areaMarkers, map]);
  return null;
}

// ── Group markers by area ──────────────────────────────────────
interface AreaGroup {
  area: string;
  markers: MarkerData[];
}

function groupByArea(markers: MarkerData[]): AreaGroup[] {
  const map = new Map<string, MarkerData[]>();
  for (const m of markers) {
    const existing = map.get(m.area) || [];
    existing.push(m);
    map.set(m.area, existing);
  }
  return Array.from(map.entries())
    .map(([area, markers]) => ({ area, markers }))
    .sort((a, b) => b.markers.length - a.markers.length);
}

// ── Rich Popup Content (matching old map style) ────────────────
function MarkerPopupContent({ marker }: { marker: MarkerData }) {
  const navigate = useNavigate();
  const color = getSSIColor(marker.ssi);
  const label = getSSILabel(marker.ssi);

  return (
    <div style={{ padding: '4px', fontFamily: 'Inter, sans-serif', minWidth: '260px', maxWidth: '300px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>
            {marker.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
            {marker.area}, Hyderabad
          </p>
        </div>
        {marker.type && (
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            background: `${color}22`,
            color: color,
            border: `1px solid ${color}44`,
          }}>
            {marker.type}
          </span>
        )}
      </div>

      {/* SSI Gauge */}
      <div style={{
        background: '#f1f5f9',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Safety Index</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color, lineHeight: 1 }}>{marker.ssi}</span>
          <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>/ 100</span>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: '8px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${marker.ssi}%`, background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {marker.reportCount || 0} reports
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {marker.ssi >= 70 ? 'Verified' : 'Under review'}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => navigate('/accommodation/' + marker._id)}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '8px',
          background: '#6366f1',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#4f46e5')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#6366f1')}
      >
        View Details
      </button>
    </div>
  );
}

// ── Main SafetyMap Component ───────────────────────────────────
interface Props {
  filters?: any;
  onMarkerSelect?: (marker: MarkerData) => void;
  selectedMarker?: MarkerData | null;
}

export function SafetyMap({ filters, onMarkerSelect, selectedMarker }: Props) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [flyToAreaMarkers, setFlyToAreaMarkers] = useState<MarkerData[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Determine dark mode from html element
  const isDark = document.documentElement.classList.contains('dark');
  const mapKey = `${isDark ? 'dark' : 'light'}`;

  useEffect(() => {
    let mounted = true;
    accommodationService
      .getWithLocation()
      .then((data) => {
        if (mounted && Array.isArray(data)) setMarkers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter markers by SSI level
  const filtered = useMemo(() => {
    return markers.filter((m) => {
      if (filter === 'all') return true;
      if (filter === 'high') return m.ssi >= 70;
      if (filter === 'medium') return m.ssi >= 40 && m.ssi < 70;
      return m.ssi < 40;
    });
  }, [markers, filter]);

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return markers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.area.toLowerCase().includes(q) ||
        getSSILabel(m.ssi).toLowerCase().includes(q)
    );
  }, [markers, query]);

  // Group search results by area
  const areaGroups = useMemo(() => groupByArea(searchResults), [searchResults]);

  return (
    <div className="relative h-full w-full">
      {/* Search bar */}
      <div ref={searchRef} className="absolute top-4 left-80 z-[1001] w-80">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
            className="w-full bg-white/90 backdrop-blur-sm text-sm text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-9 py-2.5 border border-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-lg"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setShowDropdown(false);
                setFlyToAreaMarkers([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown with area grouping */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xl max-h-80 overflow-y-auto">
            {areaGroups.map((group, gi) => (
              <div key={group.area}>
                {/* Area header — clickable to zoom */}
                <button
                  onClick={() => {
                    setFlyToAreaMarkers(group.markers);
                    setQuery(group.area);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 transition-colors ${gi === 0 ? 'rounded-t-xl' : ''}`}
                >
                  <svg
                    className="w-3.5 h-3.5 text-blue-500 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-xs font-bold text-blue-600">{group.area}</span>
                  <span className="text-[10px] text-slate-400">
                    {group.markers.length} location{group.markers.length > 1 ? 's' : ''}
                  </span>
                  <svg
                    className="w-3 h-3 text-slate-300 ml-auto"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                {/* Markers in this area */}
                {group.markers.map((m) => (
                  <button
                    key={m._id}
                    onClick={() => {
                      onMarkerSelect?.(m);
                      setQuery(m.name);
                      setShowDropdown(false);
                      setFlyToAreaMarkers([]);
                    }}
                    className="w-full flex items-center gap-3 px-4 pl-9 py-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: getSSIColor(m.ssi) }}
                    >
                      {m.ssi}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{getSSILabel(m.ssi)}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {showDropdown && query.trim() && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xl px-4 py-3">
            <p className="text-xs text-slate-400 text-center">No locations found for &quot;{query}&quot;</p>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="absolute top-4 left-[448px] z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-200 shadow-lg transition-colors">
        <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
        {(['all', 'high', 'medium', 'low'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filter === f
                ? f === 'high'
                  ? 'bg-green-500 text-white'
                  : f === 'medium'
                    ? 'bg-amber-500 text-white'
                    : f === 'low'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'high' ? 'Safe (70+)' : f === 'medium' ? 'Moderate (40-69)' : 'Risky (<40)'}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-2">{filtered.length} locations</span>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading safety data...</p>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        key={mapKey}
        center={[17.385, 78.4867]}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full rounded-none"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url={isDark ? DARK_TILE : LIGHT_TILE}
        />
        <MapUpdater markers={filtered} />
        <FlyToMarker marker={selectedMarker ?? null} />
        <FlyToArea areaMarkers={flyToAreaMarkers} />
        {filtered.map((m) => {
          const lat = m.location?.coordinates?.[1] ?? 17.385;
          const lng = m.location?.coordinates?.[0] ?? 78.487;
          return (
            <Marker
              key={m._id}
              position={[lat, lng]}
              icon={createSSIIcon(m.ssi)}
              eventHandlers={{
                click: () => onMarkerSelect?.(m),
              }}
            >
              <Popup maxWidth={320} minWidth={260}>
                <MarkerPopupContent marker={m} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
