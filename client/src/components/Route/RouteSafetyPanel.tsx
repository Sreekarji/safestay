import type { RouteIntelligence } from '../../types';
import { getSSIColor } from '../../types';

interface Props {
  route: RouteIntelligence | null;
  onClose: () => void;
  onSelectHotspot: (hotspotId: string) => void;
}

export default function RouteSafetyPanel({ route, onClose, onSelectHotspot }: Props) {
  if (!route) return null;

  const color = getSSIColor(route.safetyScore);
  const badgeClass =
    route.riskLevel === 'safe' ? 'badge-safe'
    : route.riskLevel === 'moderate' ? 'badge-moderate'
    : 'badge-risky';

  return (
    <div className="w-[360px] h-full border-l border-slate-200/80 dark:border-slate-800/40 bg-white dark:bg-[#0c0f1a] flex flex-col overflow-y-auto animate-slide-in-right">
      {/* Header */}
      <div className="px-5 h-14 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/40 shrink-0">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Route Intelligence</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Safety analysis for your commute</p>
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

      {/* Route Summary */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/40 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" />
            </svg>
            {route.accommodationName}
          </div>
          <svg className="w-3 h-3 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            {route.collegeName}
          </div>
        </div>

        {/* Score */}
        <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-4 border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Route Safety Score</span>
            <span className={`badge ${badgeClass}`}>{route.riskLevel === 'high-risk' ? 'High Risk' : route.riskLevel === 'moderate' ? 'Moderate' : 'Safe'}</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[40px] font-bold leading-none" style={{ color }}>{route.safetyScore}</span>
            <span className="text-[16px] text-slate-400 dark:text-slate-500 mb-1">/ 100</span>
          </div>
          <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${route.safetyScore}%`, background: color }} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/40 grid grid-cols-2 gap-3 shrink-0">
        <StatCard icon={<ClockIcon />} label="Travel Time" value={route.travelTime} />
        <StatCard icon={<DistanceIcon />} label="Distance" value={route.distance} />
        <StatCard icon={<MoonIcon />} label="Night Safety" value={`${route.nightSafetyRating}/100`} color={getSSIColor(route.nightSafetyRating)} />
        <StatCard icon={<ShieldIcon />} label="Hotspots" value={`${route.hotspots.length} found`} color={route.hotspots.length > 2 ? '#ef4444' : '#f59e0b'} />
      </div>

      {/* Recommendation */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/40 shrink-0">
        <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Student Recommendation</h4>
        <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">{route.recommendation}</p>
      </div>

      {/* AI Analysis */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/40 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Safety Analysis</h4>
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl p-3.5">
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">{route.aiSummary}</p>
        </div>
      </div>

      {/* Hotspots */}
      {route.hotspots.length > 0 && (
        <div className="px-5 py-4 shrink-0">
          <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Risk Hotspots</h4>
          <div className="space-y-2">
            {route.hotspots.map((hs) => (
              <button
                key={hs.id}
                onClick={() => onSelectHotspot(hs.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-slate-900 dark:text-white">{hs.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{hs.reportCount} reports · {hs.lastReported}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ background: i < hs.severity ? '#f59e0b' : '#e2e8f0' }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl px-3 py-2.5 border border-slate-100 dark:border-slate-800/40">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[15px] font-bold" style={{ color: color || '#1e293b' }}>{value}</p>
    </div>
  );
}

function ClockIcon() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function DistanceIcon() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18" /><polyline points="8 6 18 6 18 16" /></svg>;
}
function MoonIcon() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
}
function ShieldIcon() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
