import { motion } from 'framer-motion';
import type { RouteIntelligence } from '../../types';
import { getSSIColor, CATEGORY_LABELS, formatMonth } from '../../types';

interface Props {
  route: RouteIntelligence;
  onClose: () => void;
  onSelectHotspot: (id: string | null) => void;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const color = getSSIColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-2xl font-black" style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          {score}
        </motion.span>
        <span className="text-[9px] text-slate-400 -mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700/30">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="text-slate-400">{icon}</div>
        <span className="text-[10px] text-slate-400 font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold" style={{ color: color || 'rgb(15 23 42)' }}>{value}</p>
    </motion.div>
  );
}

export default function RouteSafetyPanel({ route, onClose, onSelectHotspot }: Props) {
  const riskColor = route.riskLevel === 'safe' ? '#22c55e' : route.riskLevel === 'moderate' ? '#f59e0b' : '#ef4444';

  return (
    <motion.div initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-[340px] h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 flex flex-col overflow-y-auto transition-colors">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Route Intelligence</h3>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 ml-9">
              {route.accommodationName} → {route.collegeName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Score Ring */}
      <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800/50 shrink-0 flex items-center gap-4">
        <ScoreRing score={route.safetyScore} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Risk Level</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: `${riskColor}15`, color: riskColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskColor }} />
            {route.riskLevel === 'high-risk' ? 'High Risk' : route.riskLevel === 'moderate' ? 'Moderate' : 'Safe'}
          </span>
          <p className="text-[11px] text-slate-400 mt-2">
            {route.safetyScore >= 70 ? 'Recommended for daily commute' :
             route.safetyScore >= 40 ? 'Exercise caution during evening' : 'Consider alternative route'}
          </p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="grid grid-cols-2 gap-2.5">
          <InfoCard icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
            label="Distance" value={route.distance} />
          <InfoCard icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label="Travel Time" value={route.travelTime} />
          <InfoCard icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            label="Night Safety" value={`${route.nightSafetyRating}/100`} color={getSSIColor(route.nightSafetyRating)} />
          <InfoCard icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            label="Risk Zones" value={`${route.hotspots.length} found`} color={route.hotspots.length > 0 ? '#f97316' : '#22c55e'} />
        </div>
      </div>

      {/* Recommendation */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-green-500/15 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Student Recommendation</h4>
        </div>
        <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed pl-7">{route.recommendation}</p>
      </div>

      {/* AI Summary */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Safety Analysis</h4>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/10 border border-purple-200/50 dark:border-purple-500/20 rounded-xl p-4">
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">{route.aiSummary}</p>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-500/15">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: riskColor }} />
              <span className="text-[10px] font-medium text-slate-500 capitalize">{route.riskLevel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-medium text-slate-500">{route.routePoints.length} waypoints</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspots */}
      {route.hotspots.length > 0 && (
        <div className="px-5 py-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Risk Hotspots</h4>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {route.hotspots.length} zones
            </span>
          </div>
          <div className="space-y-2">
            {route.hotspots.map((hs, i) => (
              <motion.button key={hs.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                onMouseEnter={() => onSelectHotspot(hs.id)}
                onMouseLeave={() => onSelectHotspot(null)}
                className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50 transition-all border border-slate-100 dark:border-slate-700/30 group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${hs.severity >= 4 ? '#ef4444' : hs.severity >= 3 ? '#f97316' : '#f59e0b'}12` }}>
                    <span className="text-sm">{hs.severity >= 4 ? '🔴' : hs.severity >= 3 ? '🟠' : '🟡'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{hs.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {CATEGORY_LABELS[hs.type] ?? hs.type} • {hs.reportCount} reports
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold" style={{ color: hs.severity >= 4 ? '#ef4444' : hs.severity >= 3 ? '#f97316' : '#f59e0b' }}>
                      {hs.severity}/5
                    </p>
                    <p className="text-[9px] text-slate-400">{formatMonth(hs.lastReported?.slice(0, 7) || '2025-01')}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
