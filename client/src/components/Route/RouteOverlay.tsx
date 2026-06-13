import { useEffect, useMemo } from 'react';
import { Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RouteIntelligence, RiskHotspot } from '../../types';
import { getSSIColor } from '../../types';

interface Props {
  route: RouteIntelligence | null;
  selectedHotspotId: string | null;
}

// Custom hotspot icon
function createHotspotIcon(severity: number): L.DivIcon {
  const color = severity >= 4 ? '#ef4444' : severity >= 2 ? '#f59e0b' : '#3b82f6';
  return L.divIcon({
    className: 'hotspot-marker',
    html: `<div style="width:28px;height:28px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;cursor:pointer;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// Start/End icons
function createEndpointIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: 'endpoint-marker',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:3px solid white;">
      <span style="color:white;font-size:11px;font-weight:700;">${label}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function FitRouteBounds({ route }: { route: RouteIntelligence }) {
  const map = useMap();
  useEffect(() => {
    if (route.routePoints.length > 0) {
      const bounds = L.latLngBounds(route.routePoints.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [80, 80], duration: 1 });
    }
  }, [route, map]);
  return null;
}

export default function RouteOverlay({ route, selectedHotspotId }: Props) {
  const map = useMap();

  // Create colored segments based on safety score
  const segments = useMemo(() => {
    if (!route) return [];
    const segs: Array<{ points: [number, number][]; color: string }> = [];
    let currentSeg: { points: [number, number][]; color: string } = { points: [], color: '' };

    for (const point of route.routePoints) {
      const color = getSSIColor(point.safetyScore);
      if (color !== currentSeg.color && currentSeg.points.length > 0) {
        segs.push(currentSeg);
        currentSeg = { points: [[point.lat, point.lng]], color };
      } else {
        currentSeg.points.push([point.lat, point.lng]);
        currentSeg.color = color;
      }
    }
    if (currentSeg.points.length > 0) segs.push(currentSeg);
    return segs;
  }, [route]);

  if (!route) return null;

  const firstPoint = route.routePoints[0];
  const lastPoint = route.routePoints[route.routePoints.length - 1];

  return (
    <>
      <FitRouteBounds route={route} />

      {/* Route segments */}
      {segments.map((seg, i) => (
        <Polyline
          key={i}
          positions={seg.points}
          pathOptions={{
            color: seg.color,
            weight: 6,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}

      {/* Glow effect */}
      <Polyline
        positions={route.routePoints.map((p) => [p.lat, p.lng])}
        pathOptions={{
          color: '#6366f1',
          weight: 12,
          opacity: 0.15,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Start marker */}
      {firstPoint && (
        <Marker
          position={[firstPoint.lat, firstPoint.lng]}
          icon={createEndpointIcon('#6366f1', 'A')}
        >
          <Popup><span style={{ fontSize: '14px', fontWeight: 500 }}>🏠 {route.accommodationName}</span></Popup>
        </Marker>
      )}

      {/* End marker */}
      {lastPoint && (
        <Marker
          position={[lastPoint.lat, lastPoint.lng]}
          icon={createEndpointIcon('#22c55e', 'B')}
        >
          <Popup><span style={{ fontSize: '14px', fontWeight: 500 }}>🎓 {route.collegeName}</span></Popup>
        </Marker>
      )}

      {/* Hotspot markers */}
      {route.hotspots.map((hs) => (
        <Marker
          key={hs.id}
          position={[hs.latitude, hs.longitude]}
          icon={createHotspotIcon(hs.severity)}
        >
          <Popup maxWidth={240}>
            <HotspotPopup hotspot={hs} />
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function HotspotPopup({ hotspot }: { hotspot: RiskHotspot }) {
  const isDark = document.documentElement.classList.contains('dark');
  return (
    <div style={{ padding: '8px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{hotspot.label}</span>
      </div>
      <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.6 }}>
        <p style={{ margin: '2px 0' }}><span style={{ fontWeight: 600 }}>Reports:</span> {hotspot.reportCount}</p>
        <p style={{ margin: '2px 0' }}><span style={{ fontWeight: 600 }}>Severity:</span> {hotspot.severity}/5</p>
        <p style={{ margin: '2px 0' }}><span style={{ fontWeight: 600 }}>Last reported:</span> {hotspot.lastReported}</p>
      </div>
    </div>
  );
}
