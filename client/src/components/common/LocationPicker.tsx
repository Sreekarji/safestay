import { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon in bundlers
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function ClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  value,
  onChange,
  center = [17.385, 78.4867],
  zoom = 12,
  className = '',
}: LocationPickerProps) {
  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      onChange({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
    },
    [onChange]
  );

  const markerPosition = useMemo<[number, number] | null>(() => {
    if (value) return [value.lat, value.lng];
    return null;
  }, [value]);

  return (
    <div className={className}>
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <MapContainer
          center={value ? [value.lat, value.lng] : center}
          zoom={value ? 15 : zoom}
          style={{ height: '300px', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationSelect={handleLocationSelect} />
          {markerPosition && <Marker position={markerPosition} icon={markerIcon} />}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {value
          ? `📍 ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`
          : 'Click on the map to drop a pin'}
      </p>
    </div>
  );
}
