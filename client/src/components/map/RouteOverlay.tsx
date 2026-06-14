import { useEffect, useState } from 'react';
import { Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RouteIntelligence } from '../../types';
import { CATEGORY_LABELS, formatMonth } from '../../types';

// ── Custom marker icons ───────────────────────────────────────
function createLetterIcon(letter: string, color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;">
      <div style="background:${color};color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 4px 12px ${color}66;border:3px solid rgba(255,255,255,0.95);letter-spacing:-0.5px;">${letter}</div>
      <div style="position:absolute;top:-8px;right:-8px;width:16px;height:16px;background:#22c55e;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function createHotspotIcon(severity: number, type: string): L.DivIcon {
  const color = severity >= 4 ? '#ef4444' : severity >= 3 ? '#f97316' : '#f59e0b';
  const emoji = type === 'theft' ? '🔓' : type === 'hygiene' ? '🧹' : type === 'security' ? '🛡️' : type === 'water' ? '💧' : type === 'noise' ? '🔊' : '⚡';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;">
      <div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px ${color}55;border:2px solid rgba(255,255,255,0.9);font-size:12px;animation:hotspot-pulse 2s infinite;">${emoji}</div>
      <div style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <div style="width:6px;height:6px;background:${color};border-radius:50%;"></div>
      </div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// ── Animated route component ──────────────────────────────────
function AnimatedRoute({ route, onComplete }: { route: RouteIntelligence; onComplete: () => void }) {
  const map = useMap();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fit bounds to route
    const bounds = L.latLngBounds(route.routePoints.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [80, 80], duration: 0.8 });

    // Animate route drawing
    let frame = 0;
    const totalFrames = 40;
    const animate = () => {
      frame++;
      setProgress(frame / totalFrames);
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), 300);
    return () => clearTimeout(timer);
  }, [route, map, onComplete]);

  const visibleCount = Math.floor(route.routePoints.length * progress);
  const visiblePoints = route.routePoints.slice(0, visibleCount + 1);
  const glowPoints = visiblePoints.map((p) => [p.lat, p.lng] as [number, number]);

  // Build colored segments
  const segments: Array<{ points: [number, number][]; color: string }> = [];
  let currentSeg: { points: [number, number][]; color: string } = { points: [], color: '' };

  for (const pt of visiblePoints) {
    const color = pt.safetyScore >= 70 ? '#22c55e' : pt.safetyScore >= 40 ? '#f59e0b' : '#ef4444';
    if (currentSeg.color !== color && currentSeg.points.length > 0) {
      segments.push(currentSeg);
      currentSeg = { points: [currentSeg.points[currentSeg.points.length - 1]], color };
    }
    currentSeg.points.push([pt.lat, pt.lng]);
    currentSeg.color = color;
  }
  if (currentSeg.points.length > 0) segments.push(currentSeg);

  return (
    <>
      {/* Purple glow */}
      {glowPoints.length > 1 && (
        <Polyline positions={glowPoints} pathOptions={{
          color: '#8b5cf6', weight: 12, opacity: 0.15, lineCap: 'round', lineJoin: 'round',
        }} />
      )}
      {/* Second glow layer */}
      {glowPoints.length > 1 && (
        <Polyline positions={glowPoints} pathOptions={{
          color: '#6366f1', weight: 6, opacity: 0.2, lineCap: 'round', lineJoin: 'round',
        }} />
      )}
      {/* Colored safety segments */}
      {segments.map((seg, i) => (
        <Polyline key={i} positions={seg.points} pathOptions={{
          color: seg.color, weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round',
        }} />
      ))}
    </>
  );
}

interface Props {
  route: RouteIntelligence;
  selectedHotspotId: string | null;
}

export default function RouteOverlay({ route, selectedHotspotId }: Props) {
  const [routeDrawn, setRouteDrawn] = useState(false);

  const firstPt = route.routePoints[0];
  const lastPt = route.routePoints[route.routePoints.length - 1];

  return (
    <>
      {/* Animated route */}
      <AnimatedRoute route={route} onComplete={() => setRouteDrawn(true)} />

      {/* A marker (accommodation) */}
      <Marker position={[firstPt.lat, firstPt.lng]} icon={createLetterIcon('A', '#6366f1', route.accommodationName)}>
        <Popup maxWidth={280}>
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">A</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{route.accommodationName}</p>
                <p className="text-[10px] text-slate-500">Starting Point</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {route.travelTime}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {route.distance}
              </span>
            </div>
          </div>
        </Popup>
      </Marker>

      {/* B marker (college) */}
      <Marker position={[lastPt.lat, lastPt.lng]} icon={createLetterIcon('B', '#8b5cf6', route.collegeName)}>
        <Popup maxWidth={280}>
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold">B</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{route.collegeName}</p>
                <p className="text-[10px] text-slate-500">Destination</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${route.safetyScore >= 70 ? '#22c55e' : route.safetyScore >= 40 ? '#f59e0b' : '#ef4444'}15`,
                  color: route.safetyScore >= 70 ? '#22c55e' : route.safetyScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                SSI {route.safetyScore}
              </span>
              <span className="text-[10px] text-slate-400">{route.riskLevel}</span>
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Hotspot markers */}
      {routeDrawn && route.hotspots.map((hs) => (
        <Marker key={hs.id}
          position={[hs.latitude, hs.longitude]}
          icon={createHotspotIcon(hs.severity, hs.type)}>
          <Popup maxWidth={260}>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${hs.severity >= 4 ? '#ef4444' : hs.severity >= 3 ? '#f97316' : '#f59e0b'}15` }}>
                  <span className="text-sm">{hs.severity >= 4 ? '🔴' : hs.severity >= 3 ? '🟠' : '🟡'}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{hs.label}</p>
                  <p className="text-[10px] text-slate-500">{CATEGORY_LABELS[hs.type] ?? hs.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-[9px] text-slate-400 uppercase">Reports</p>
                  <p className="text-sm font-bold text-slate-900">{hs.reportCount}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-[9px] text-slate-400 uppercase">Severity</p>
                  <p className="text-sm font-bold" style={{ color: hs.severity >= 4 ? '#ef4444' : hs.severity >= 3 ? '#f97316' : '#f59e0b' }}>{hs.severity}/5</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Last reported: {formatMonth(hs.lastReported?.slice(0, 7) || new Date().toISOString().slice(0, 7))}</p>
            </div>
          </Popup>
        </Marker>
      ))}

    </>
  );
}
