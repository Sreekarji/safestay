import { createContext, useContext } from 'react';
import type { MapMarkerWithHistory } from '@/types';

interface MapContextValue {
  flyToArea: (markers: MapMarkerWithHistory[]) => void;
}

export const MapContext = createContext<MapContextValue>({
  flyToArea: () => {},
});

export function useMapContext() {
  return useContext(MapContext);
}
