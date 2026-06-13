import type { RouteComparison as RouteComparisonType } from '../../types';
import { getSSIColor } from '../../types';

interface Props {
  comparison: RouteComparisonType;
  onClose: () => void;
}

function RouteCard({ name, score, distance, time, hotspots, riskLevel }: {
  name: string; score: number; distance: string; time: string; hotspots: number; riskLevel: string;
}) {
  const color = getSSIColor(score);
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 truncate">{name}</h4>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-xs text-slate-400 mb-0.5">/ 100</span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div><span className="text-slate-400">Distance:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{distance}</span></div>
        <div><span className="text-slate-400">Time:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{time}</span></div>
        <div><span className="text-slate-400">Risk zones:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{hotspots}</span></div>
        <div><span className="text-slate-400">Level:</span> <span className="font-medium capitalize" style={{ color }}>{riskLevel}</span></div>
      </div>
    </div>
  );
}

export default function RouteComparison({ comparison, onClose }: Props) {
  const { routeA, routeB, aiRecommendation } = comparison;

  return (
    <div className="w-96 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col overflow-y-auto transition-colors">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Route Comparison</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">→ {routeA.collegeName}</p>
          </div>
          <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Route cards */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0 space-y-3">
        <RouteCard name={routeA.accommodationName} score={routeA.safetyScore}
          distance={routeA.distance} time={routeA.travelTime}
          hotspots={routeA.hotspots.length} riskLevel={routeA.riskLevel} />
        <RouteCard name={routeB.accommodationName} score={routeB.safetyScore}
          distance={routeB.distance} time={routeB.travelTime}
          hotspots={routeB.hotspots.length} riskLevel={routeB.riskLevel} />
      </div>

      {/* AI Recommendation */}
      <div className="px-5 py-4 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-purple-500/15 flex items-center justify-center">
            <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Recommendation</h4>
        </div>
        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-3.5">
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">{aiRecommendation}</p>
        </div>
      </div>
    </div>
  );
}
