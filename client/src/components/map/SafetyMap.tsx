import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { getSSIColor } from '@/lib/utils';
import { accommodationService } from '@/services/accommodationService';
import 'leaflet/dist/leaflet.css';

interface MarkerData {
  _id: string;
  name: string;
  area: string;
  ssi: number;
  reportCount: number;
  location?: { type: string; coordinates: [number, number] };
  riskLevel?: string;
}

export function SafetyMap({ filters }: { filters?: any }) {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    accommodationService.getWithLocation()
      .then((data) => {
        if (mounted && Array.isArray(data)) setMarkers(data);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <MapContainer center={[17.3850, 78.4867]} zoom={12} className="w-full h-full">
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map((m) => {
        const lat = m.location?.coordinates?.[1] ?? 17.385;
        const lng = m.location?.coordinates?.[0] ?? 78.487;
        return (
          <CircleMarker key={m._id} center={[lat, lng]}
            radius={Math.max(8, Math.min(20, (m.reportCount || 1) / 3))}
            pathOptions={{ color: getSSIColor(m.ssi), fillColor: getSSIColor(m.ssi), fillOpacity: 0.6, weight: 2 }}>
            <Popup><div className="p-2 min-w-[180px]">
              <h3 className="font-semibold text-slate-900">{m.name}</h3>
              <p className="text-xs text-slate-500">{m.area}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: getSSIColor(m.ssi) }}>{m.ssi}</p>
              <p className="text-xs text-slate-500">{m.reportCount || 0} reports</p>
              <button onClick={() => navigate('/report/' + m._id)} className="mt-2 w-full rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">View Details</button>
            </div></Popup>
          </CircleMarker>
        );
      })}
      {loading && markers.length === 0 && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow px-3 py-2 text-sm text-slate-500">
          Loading map data...
        </div>
      )}
    </MapContainer>
  );
}
