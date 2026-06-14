import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import type { MapMarkerWithHistory, AISummary } from '../../types';
import { formatMonth, getSSIColor, getSSILabel, getSSITrend } from '../../types';

interface Props {
  marker: MapMarkerWithHistory;
  selectedMonth: string;
  aiSummary: AISummary | null;
  onClose: () => void;
}

export default function SafetyTimelinePanel({ marker, selectedMonth, aiSummary, onClose }: Props) {
  const monthIdx = marker.history.findIndex((h) => h.month === selectedMonth);
  const currentScore = marker.history[monthIdx]?.score ?? marker.ssi;
  const prevScore = monthIdx > 0 ? marker.history[monthIdx - 1].score : currentScore;
  const trendInfo = getSSITrend(currentScore, prevScore);
  const color = getSSIColor(currentScore);
  const label = getSSILabel(currentScore);

  const chartData = marker.history.map((h) => ({
    month: formatMonth(h.month), score: h.score, rawMonth: h.month,
  }));

  return (
    <div className="w-80 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col overflow-y-auto transition-colors">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{marker.name}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{marker.area}, Hyderabad · {marker.type}</p>
          </div>
          <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* SSI Score Card */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">SSI Score · {formatMonth(selectedMonth)}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${color}20`, color }}>{label}</span>
          </div>
          {/* Risk level indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[11px] font-semibold" style={{ color }}>
              {label === 'Safe' ? '✅ Safe Zone — SSI 70+' :
               label === 'Moderate' ? '⚠️ Moderate Risk — SSI 40–69' :
               '🚨 High Risk — SSI Below 40'}
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black" style={{ color }}>{currentScore}</span>
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-lg font-bold" style={{ color: trendInfo.color }}>{trendInfo.arrow}</span>
              <span className="text-xs font-medium" style={{ color: trendInfo.color }}>{trendInfo.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span>vs prev: {prevScore}</span><span>·</span>
            <span style={{ color: currentScore - prevScore >= 0 ? '#22c55e' : '#ef4444' }}>
              {currentScore - prevScore >= 0 ? '+' : ''}{currentScore - prevScore}
            </span>
          </div>
          <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${currentScore}%`, background: color }} />
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">SSI History</h4>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#1e293b' }}
              formatter={(value: number) => [`SSI: ${value}`, 'Score']} />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={false}
              activeDot={{ r: 5, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} />
            {monthIdx >= 0 && chartData[monthIdx] && (
              <ReferenceDot x={chartData[monthIdx].month} y={currentScore} r={6} fill={color} stroke="white" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Trend Summary */}
      {aiSummary && (
        <div className="px-5 py-4 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-purple-500/15 flex items-center justify-center">
              <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Trend Summary</h4>
          </div>
          <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-3.5">
            <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">{aiSummary.summary}</p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-500/15">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: aiSummary.trend === 'improving' ? '#22c55e' : aiSummary.trend === 'declining' ? '#ef4444' : '#f59e0b' }} />
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">{aiSummary.trend}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: aiSummary.riskLevel === 'safe' ? '#22c55e' : aiSummary.riskLevel === 'moderate' ? '#f59e0b' : '#ef4444' }} />
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {aiSummary.riskLevel === 'high-risk' ? 'High Risk' : aiSummary.riskLevel === 'moderate' ? 'Moderate' : 'Safe'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
