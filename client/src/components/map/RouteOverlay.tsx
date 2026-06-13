import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { RouteIntelligence } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { formatMonth } from '../../types';

// ── Custom marker icons ───────────────────────────────────────
function createLetterIcon(letter: string, color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid rgba(255,255,255,0.9);">${letter}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createHotspotIcon(severity: number): L.DivIcon {
  const color = severity >= 4 ? '#ef4444' : severity >= 3 ? '#f97316' : '#f59e0b';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${color}66;animation:pulse 2s infinite;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

interface Props {
  route: RouteIntelligence;
  selectedHotspotId: string | null;
}

export default function RouteOverlay({ route, selectedHotspotId }: Props) {
  // Purple glow (wider, behind)
  const glowPoints = route.routePoints.map((p) => [p.lat, p.lng] as [number, number]);

  // Colored segments
  const segments: Array<{ points: [number, number][]; color: string }> = [];
  let currentSeg: { points: [number, number][]; color: string } = { points: [], color: '' };

  for (const pt of route.routePoints) {
    const color = pt.safetyScore >= 70 ? '#22c55e' : pt.safetyScore >= 40 ? '#f59e0b' : '#ef4444';
    if (currentSeg.color !== color && currentSeg.points.length > 0) {
      segments.push(currentSeg);
      currentSeg = { points: [currentSeg.points[currentSeg.points.length - 1]], color };
    }
    currentSeg.points.push([pt.lat, pt.lng]);
    currentSeg.color = color;
  }
  if (currentSeg.points.length > 0) segments.push(currentSeg);

  // Accommodation and college positions
  const firstPt = route.routePoints[0];
  const lastPt = route.routePoints[route.routePoints.length - 1];

  return (
    <>
      {/* Purple glow */}
      <Polyline positions={glowPoints} pathOptions={{
        color: '#8b5cf6', weight: 8, opacity: 0.25, lineCap: 'round',
      }} />
      {/* Colored segments */}
      {segments.map((seg, i) => (
        <Polyline key={i} positions={seg.points} pathOptions={{
          color: seg.color, weight: 4, opacity: 0.9, lineCap: 'round',
        }} />
      ))}
      {/* A marker (accommodation) */}
      <Marker position={[firstPt.lat, firstPt.lng]} icon={createLetterIcon('A', '#6366f1')}>
        <Popup><div className="p-1"><p className="text-xs font-bold text-slate-900">{route.accommodationName}</p><p className="text-[10px] text-slate-500">Start point</p></div></Popup>
      </Marker>
      {/* B marker (college) */}
      <Marker position={[lastPt.lat, lastPt.lng]} icon={createLetterIcon('B', '#8b5cf6')}>
        <Popup><div className="p-1"><p className="text-xs font-bold text-slate-900">{route.collegeName}</p><p className="text-[10px] text-slate-500">Destination</p></div></Popup>
      </Marker>
      {/* Hotspot markers */}
      {route.hotspots.map((hs) => (
        <Marker key={hs.id}
          position={[hs.latitude, hs.longitude]}
          icon={createHotspotIcon(hs.severity)}>
          <Popup maxWidth={240}>
            <div className="p-1 min-w-[180px]">
              <p className="text-xs font-bold text-slate-900">{hs.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{CATEGORY_LABELS[hs.type] ?? hs.type}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                <span>{hs.reportCount} reports</span>
                <span>·</span>
                <span>Severity {hs.severity}/5</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Last reported: {formatMonth(hs.lastReported?.slice(0, 7) || '2025-01')}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
