import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { getSSIColor } from '@/lib/utils';
import type { MapMarker } from '@/types';
import 'leaflet/dist/leaflet.css';

const mockMarkers: MapMarker[] = [
  { id: '1', name: 'Gachibowli Hostel', area: 'Gachibowli', coordinates: { lat: 17.4401, lng: 78.3489 }, ssi: 82, reportCount: 12, accommodation: '1' },
  { id: '2', name: 'Madhapur PG', area: 'Madhapur', coordinates: { lat: 17.4483, lng: 78.3915 }, ssi: 65, reportCount: 28, accommodation: '2' },
  { id: '3', name: 'Kondapur Residences', area: 'Kondapur', coordinates: { lat: 17.4618, lng: 78.3588 }, ssi: 71, reportCount: 15, accommodation: '3' },
  { id: '4', name: 'Hitech City Lodge', area: 'Hitech City', coordinates: { lat: 17.4435, lng: 78.3772 }, ssi: 45, reportCount: 42, accommodation: '4' },
  { id: '5', name: 'Banjara Heights', area: 'Banjara Hills', coordinates: { lat: 17.4156, lng: 78.4347 }, ssi: 88, reportCount: 5, accommodation: '5' },
  { id: '6', name: 'Jubilee Towers', area: 'Jubilee Hills', coordinates: { lat: 17.4239, lng: 78.4091 }, ssi: 76, reportCount: 18, accommodation: '6' },
  { id: '7', name: 'Secunderabad Inn', area: 'Secunderabad', coordinates: { lat: 17.4399, lng: 78.4983 }, ssi: 52, reportCount: 35, accommodation: '7' },
  { id: '8', name: 'Ameerpet Stay', area: 'Ameerpet', coordinates: { lat: 17.4374, lng: 78.4484 }, ssi: 38, reportCount: 51, accommodation: '8' },
];

export function SafetyMap({ filters }: { filters?: any }) {
  const navigate = useNavigate();
  return (
    <MapContainer center={[17.3850, 78.4867]} zoom={12} className="w-full h-full">
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {mockMarkers.map((m) => (
        <CircleMarker key={m.id} center={[m.coordinates.lat, m.coordinates.lng]}
          radius={Math.max(8, Math.min(20, m.reportCount / 3))}
          pathOptions={{ color: getSSIColor(m.ssi), fillColor: getSSIColor(m.ssi), fillOpacity: 0.6, weight: 2 }}>
          <Popup><div className="p-2 min-w-[180px]">
            <h3 className="font-semibold text-slate-900">{m.name}</h3>
            <p className="text-xs text-slate-500">{m.area}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: getSSIColor(m.ssi) }}>{m.ssi}</p>
            <p className="text-xs text-slate-500">{m.reportCount} reports</p>
            <button onClick={() => navigate('/report/' + m.id)} className="mt-2 w-full rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">View Details</button>
          </div></Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
