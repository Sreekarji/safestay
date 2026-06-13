import type { RouteIntelligence } from '../../types';
import { getSSIColor } from '../../types';

interface Props {
  route: RouteIntelligence;
  onClose: () => void;
  onSelectHotspot: (id: string | null) => void;
}

export default function RouteSafetyPanel({ route, onClose, onSelectHotspot }: Props) {
  const color = getSSIColor(route.safetyScore);
  const riskColor = route.riskLevel === 'safe' ? '#22c55e' : route.riskLevel === 'moderate' ? '#f59e0b' : '#ef4444';

  return (
    <div className="w-80 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col overflow-y-auto transition-colors">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Route Intelligence</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {route.accommodationName} → {route.collegeName}
            </p>
          </div>
          <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Safety Score */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Route Safety Score</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${riskColor}20`, color: riskColor }}>
              {route.riskLevel}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black" style={{ color }}>{route.safetyScore}</span>
            <span className="text-sm text-slate-400 mb-1">/ 100</span>
          </div>
          <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${route.safetyScore}%`, background: color }} />
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 mb-1">Distance</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{route.distance}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 mb-1">Travel Time</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{route.travelTime}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 mb-1">Night Safety</p>
            <p className="text-sm font-bold" style={{ color: getSSIColor(route.nightSafetyRating) }}>{route.nightSafetyRating}/100</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 mb-1">Risk Zones</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{route.hotspots.length}</p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Student Recommendation</h4>
        <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">{route.recommendation}</p>
      </div>

      {/* AI Summary */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-purple-500/15 flex items-center justify-center">
            <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Safety Analysis</h4>
        </div>
        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-3">
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{route.aiSummary}</p>
        </div>
      </div>

      {/* Hotspots list */}
      {route.hotspots.length > 0 && (
        <div className="px-5 py-4 shrink-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Risk Hotspots ({route.hotspots.length})</h4>
          <div className="space-y-2">
            {route.hotspots.map((hs) => (
              <button key={hs.id}
                onMouseEnter={() => onSelectHotspot(hs.id)}
                onMouseLeave={() => onSelectHotspot(null)}
                className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">{hs.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{hs.reportCount} reports · Severity {hs.severity}/5</p>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: hs.severity >= 4 ? '#ef4444' : hs.severity >= 3 ? '#f97316' : '#f59e0b' }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
