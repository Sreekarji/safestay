import type { RouteComparison as RouteComparisonType } from '../../types';
import { getSSIColor } from '../../types';

interface Props {
  comparison: RouteComparisonType | null;
  onClose: () => void;
}

export default function RouteComparison({ comparison, onClose }: Props) {
  if (!comparison) return null;

  const { routeA, routeB, aiRecommendation } = comparison;

  return (
    <div className="w-[360px] h-full border-l border-slate-200/80 dark:border-slate-800/40 bg-white dark:bg-[#0c0f1a] flex flex-col overflow-y-auto animate-slide-in-right">
      {/* Header */}
      <div className="px-5 h-14 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/40 shrink-0">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Route Comparison</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Compare two accommodations</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors text-slate-400"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Route A */}
      <RouteCard route={routeA} label="A" isWinner={routeA.safetyScore >= routeB.safetyScore} />

      {/* Route B */}
      <RouteCard route={routeB} label="B" isWinner={routeB.safetyScore > routeA.safetyScore} />

      {/* AI Recommendation */}
      <div className="px-5 py-4 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-green-500/10 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Recommendation</h4>
        </div>
        <div className="bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10 rounded-xl p-4">
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">{aiRecommendation}</p>
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route, label, isWinner }: { route: { accommodationName: string; collegeName: string; safetyScore: number; riskLevel: string; travelTime: string; distance: string; nightSafetyRating: number }; label: string; isWinner: boolean }) {
  const color = getSSIColor(route.safetyScore);
  const badgeClass = route.riskLevel === 'safe' ? 'badge-safe' : route.riskLevel === 'moderate' ? 'badge-moderate' : 'badge-risky';

  return (
    <div className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800/40 ${isWinner ? 'bg-green-50/50 dark:bg-green-500/[0.02]' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${isWinner ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
          {label}
        </div>
        <span className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{route.accommodationName}</span>
        {isWinner && <span className="badge badge-safe text-[10px]">Better</span>}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-[11px] text-slate-400">{route.travelTime}</span>
        <span className="text-[10px] text-slate-300">·</span>
        <span className="text-[11px] text-slate-400">{route.distance}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[20px] font-bold" style={{ color }}>{route.safetyScore}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Route SSI</p>
        </div>
        <div className="text-center">
          <p className="text-[20px] font-bold text-slate-900 dark:text-white">{route.nightSafetyRating}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Night</p>
        </div>
        <div className="text-center">
          <p className={`badge ${badgeClass} text-[10px]`}>{route.riskLevel}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">Level</p>
        </div>
      </div>
    </div>
  );
}
