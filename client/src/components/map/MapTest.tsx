import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Minimal test component to verify Leaflet setup works independently.
 * Renders a single map with one marker at Hyderabad center.
 */
export default function MapTest() {
  return (
    <div className="h-screen w-full">
      <div className="bg-blue-500 text-white p-3 text-center text-sm font-medium">
        🧪 MapTest — Verifying Leaflet setup
      </div>
      <MapContainer center={[17.385, 78.4867]} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[17.385, 78.4867]} radius={12}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.7, weight: 2 }}>
          <Popup>
            <div className="p-2">
              <p className="text-sm font-bold text-slate-900">Hyderabad Center</p>
              <p className="text-xs text-slate-500">Leaflet is working! ✅</p>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
