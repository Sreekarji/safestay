import { motion } from 'framer-motion';
import type { RouteComparison as RouteComparisonType } from '../../types';
import { getSSIColor } from '../../types';

interface Props {
  comparison: RouteComparisonType;
  onClose: () => void;
}

function RouteCard({ name, score, distance, time, hotspots, riskLevel, isWinner }: {
  name: string; score: number; distance: string; time: string; hotspots: number; riskLevel: string; isWinner: boolean;
}) {
  const color = getSSIColor(score);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl p-5 border-2 transition-all ${
        isWinner
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/5 border-green-200 dark:border-green-500/30 shadow-lg shadow-green-500/10'
          : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
      }`}>
      {isWinner && (
        <div className="absolute -top-3 left-5 px-3 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full shadow-lg">
          ✅ SAFER ROUTE
        </div>
      )}
      <div className="flex items-start gap-4">
        {/* Score ring */}
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          <svg width={96} height={96} className="-rotate-90">
            <circle cx={48} cy={48} r={radius} fill="none" stroke={isWinner ? '#dcfce7' : '#f1f5f9'} strokeWidth="6" />
            <motion.circle cx={48} cy={48} r={radius} fill="none" stroke={color} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference}
              animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{ color }}>{score}</span>
            <span className="text-[9px] text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">{name}</h4>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-3"
            style={{ background: `${color}15`, color }}>
            {riskLevel === 'high-risk' ? 'High Risk' : riskLevel === 'moderate' ? 'Moderate' : 'Safe'}
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2.5 py-1.5">
              <p className="text-[9px] text-slate-400 uppercase">Distance</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{distance}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2.5 py-1.5">
              <p className="text-[9px] text-slate-400 uppercase">Time</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{time}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2.5 py-1.5">
              <p className="text-[9px] text-slate-400 uppercase">Risk Zones</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{hotspots}</p>
            </div>
            {/* Night safety = base score minus 10 (min 20) to reflect reduced visibility and increased risk at night */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2.5 py-1.5">
              <p className="text-[9px] text-slate-400 uppercase">Night Safety</p>
              <p className="text-xs font-bold" style={{ color: getSSIColor(score - 10) }}>{Math.max(20, score - 10)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RouteComparison({ comparison, onClose }: Props) {
  const { routeA, routeB, aiRecommendation } = comparison;
  const winnerA = routeA.safetyScore >= routeB.safetyScore;

  return (
    <motion.div initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-[380px] h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 flex flex-col overflow-y-auto transition-colors">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Route Comparison</h3>
              <p className="text-[10px] text-slate-400">→ {routeA.collegeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Route cards */}
      <div className="px-5 py-4 space-y-4 shrink-0">
        <RouteCard name={routeA.accommodationName} score={routeA.safetyScore}
          distance={routeA.distance} time={routeA.travelTime}
          hotspots={routeA.hotspots.length} riskLevel={routeA.riskLevel} isWinner={winnerA} />
        <RouteCard name={routeB.accommodationName} score={routeB.safetyScore}
          distance={routeB.distance} time={routeB.travelTime}
          hotspots={routeB.hotspots.length} riskLevel={routeB.riskLevel} isWinner={!winnerA} />
      </div>

      {/* Score difference */}
      <div className="px-5 pb-4 shrink-0">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Safety Score Difference</span>
          <span className="text-sm font-bold" style={{ color: getSSIColor(Math.abs(routeA.safetyScore - routeB.safetyScore) + 50) }}>
            {Math.abs(routeA.safetyScore - routeB.safetyScore)} points
          </span>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Recommendation</h4>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/10 border border-purple-200/50 dark:border-purple-500/20 rounded-xl p-4">
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">{aiRecommendation}</p>
        </div>
      </div>
    </motion.div>
  );
}
