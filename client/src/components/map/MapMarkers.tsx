import { CircleMarker, Popup } from 'react-leaflet';
import { getSSIColor } from '@/lib/utils';
import type { MapMarker } from '@/types';
interface Props { markers: MapMarker[]; onMarkerClick?: (m: MapMarker) => void; }
export function MapMarkers({ markers, onMarkerClick }: Props) {
  return <>{markers.map((m) => (
    <CircleMarker key={m.id} center={[m.coordinates.lat, m.coordinates.lng]}
      radius={Math.max(8, Math.min(20, m.reportCount / 3))}
      pathOptions={{ color: getSSIColor(m.ssi), fillColor: getSSIColor(m.ssi), fillOpacity: 0.6, weight: 2 }}
      eventHandlers={{ click: () => onMarkerClick?.(m) }}>
      <Popup><div><h3 className="font-semibold text-sm">{m.name}</h3><p style={{ color: getSSIColor(m.ssi) }}>{m.ssi}</p></div></Popup>
    </CircleMarker>
  ))}</>;
}
