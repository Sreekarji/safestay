import { getSSIColor, getSSILabel } from '@/lib/utils';
import type { MapMarker } from '@/types';
interface Props { marker: MapMarker; onViewDetails: () => void; }
export function AreaPopup({ marker, onViewDetails }: Props) {
  return (
    <div className="p-2 min-w-[200px]">
      <h3 className="font-semibold text-slate-900 mb-1">{marker.name}</h3>
      <p className="text-xs text-slate-500 mb-2">{marker.area}</p>
      <span className="text-2xl font-bold" style={{ color: getSSIColor(marker.ssi) }}>{marker.ssi}</span>
      <span className="text-xs text-slate-500 ml-2">{getSSILabel(marker.ssi)}</span>
      <p className="text-xs text-slate-500 mt-1">{marker.reportCount} reports</p>
      <button onClick={onViewDetails} className="mt-2 w-full rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">View Details</button>
    </div>
  );
}
