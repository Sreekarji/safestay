import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ latitude, longitude, onLocationChange }) => {
  const defaultCenter: [number, number] = [17.385, 78.4867];
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;
  const zoom = latitude && longitude ? 15 : 12;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        📍 Click on the map to set location
      </label>
      <div className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm" style={{ height: '300px' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationChange={onLocationChange} />
          {latitude && longitude && (
            <Marker position={[latitude, longitude]} />
          )}
        </MapContainer>
      </div>
      {latitude && longitude && (
        <p className="text-xs text-gray-500">
          📍 Selected: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
