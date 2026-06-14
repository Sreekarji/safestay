import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { MapMarkerWithHistory } from '../../types';
import { getSSIColor } from '../../types';
import { fetchMapMarkersWithHistory, generateAISummary } from '../../services/mapData';
import { getRouteIntelligence, getRouteComparison } from '../../services/routeData';
import MarkerPopup from './MarkerPopup';
import RouteOverlay from './RouteOverlay';
import { DEFAULT_MAP_CENTER } from '../../lib/constants';

const DEFAULT_ZOOM = 12;
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// ── Custom SSI icon ──────────────────────────────────────────
function createSSIIcon(ssi: number): L.DivIcon {
  const color = getSSIColor(ssi);
  const glow = ssi >= 70 ? 'rgba(34,197,94,0.4)' : ssi >= 40 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.4)';
  return L.divIcon({
    className: 'ssi-marker-wrapper',
    html: `<div class="ssi-marker" style="background:${color};box-shadow:0 2px 12px ${glow}">${ssi}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ── Map sub-components ───────────────────────────────────────
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

function FlyToArea({ areaMarkers }: { areaMarkers: MapMarkerWithHistory[] }) {
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

// ── Props ────────────────────────────────────────────────────
export type MapMode = 'timeline' | 'route';

interface Props {
  mode: MapMode;
  selectedMonth: string;
  selectedMarker: MapMarkerWithHistory | null;
  onMarkerSelect: (m: MapMarkerWithHistory | null) => void;
  filter: 'all' | 'high' | 'medium' | 'low';
  accommodationId: string | null;
  collegeId: string | null;
  selectedHotspotId: string | null;
  routeComparisonMode: boolean;
  comparisonAccId: string | null;
  flyToAreaMarkers: MapMarkerWithHistory[];
}

// ── Main component ───────────────────────────────────────────
export default function SafetyMap({
  mode, selectedMonth, selectedMarker, onMarkerSelect, filter,
  accommodationId, collegeId, selectedHotspotId,
  routeComparisonMode, comparisonAccId,
  flyToAreaMarkers,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<MapMarkerWithHistory[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const mapKey = `${isDark ? 'dark' : 'light'}-${mode}`;

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    fetchMapMarkersWithHistory()
      .then(setMarkers)
      .catch((err) => { setApiError('Failed to load safety data. Please try again.'); console.error(err); })
      .finally(() => setLoading(false));
  }, []);

  // Compute current SSI based on selected month
  const markersWithScore = useMemo(() => {
    return markers.map((m) => {
      const entry = m.history.find((h) => h.month === selectedMonth);
      return { ...m, currentSSI: entry?.score ?? m.ssi };
    });
  }, [markers, selectedMonth]);

  // Apply filter
  const filtered = useMemo(() => {
    return markersWithScore.filter((m) => {
      if (filter === 'all') return true;
      if (filter === 'high') return m.currentSSI! >= 70;
      if (filter === 'medium') return m.currentSSI! >= 40 && m.currentSSI! < 70;
      return m.currentSSI! < 40;
    });
  }, [markersWithScore, filter]);

  // Route data
  const route = useMemo(() => {
    if (mode !== 'route' || !accommodationId || !collegeId) return null;
    return getRouteIntelligence(accommodationId, collegeId);
  }, [mode, accommodationId, collegeId]);

  // Route comparison
  const comparison = useMemo(() => {
    if (!routeComparisonMode || !comparisonAccId || !collegeId || comparisonAccId === accommodationId) return null;
    return getRouteComparison(comparisonAccId, accommodationId ?? '', collegeId);
  }, [routeComparisonMode, comparisonAccId, collegeId, accommodationId]);

  return (
    <div className="relative h-full w-full">
      {/* Error banner */}
      {apiError && (
        <div className="absolute top-2 left-2 right-2 z-[1000] bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center justify-between">
          <span>{apiError}</span>
          <button onClick={() => setApiError(null)} className="text-red-500 hover:text-red-700 font-medium ml-2">Dismiss</button>
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
      <MapContainer key={mapKey} center={DEFAULT_MAP_CENTER} zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true} className="h-full w-full rounded-none" zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url={isDark ? DARK_TILE : LIGHT_TILE}
        />
        <MapUpdater markers={filtered} />
        <FlyToMarker marker={selectedMarker} />
        <FlyToArea areaMarkers={flyToAreaMarkers} />

        {/* Route overlay */}
        {route && <RouteOverlay route={route} selectedHotspotId={selectedHotspotId} />}

        {/* Markers */}
        {filtered.map((marker) => (
          <Marker key={marker.id} position={[marker.latitude, marker.longitude]}
            icon={createSSIIcon(marker.currentSSI ?? marker.ssi)}
            eventHandlers={{ click: () => onMarkerSelect(marker) }}>
            <Popup maxWidth={320} minWidth={280}>
              <MarkerPopup marker={marker} selectedMonth={selectedMonth} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
