import { useNavigate } from 'react-router-dom';
import type { MapMarkerWithHistory } from '../../types';
import { getSSIColor, getSSILabel, getSSITrend, formatMonth } from '../../types';

interface Props {
  marker: MapMarkerWithHistory;
  selectedMonth: string;
}

export default function MarkerPopup({ marker, selectedMonth }: Props) {
  const navigate = useNavigate();
  const monthIdx = marker.history.findIndex((h) => h.month === selectedMonth);
  const currentScore = monthIdx >= 0 ? marker.history[monthIdx].score : marker.ssi;
  const prevScore = monthIdx > 0 ? marker.history[monthIdx - 1].score : currentScore;
  const trendInfo = getSSITrend(currentScore, prevScore);
  const color = getSSIColor(currentScore);
  const label = getSSILabel(currentScore);
  const diff = currentScore - prevScore;

  return (
    <div style={{ padding: '4px', fontFamily: 'Inter, sans-serif', minWidth: '280px', maxWidth: '320px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>
            {marker.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
            {marker.area}, Hyderabad · {marker.type}
          </p>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.5px',
          background: `${color}22`, color, border: `1px solid ${color}44`,
        }}>
          {marker.type}
        </span>
      </div>

      {/* Month label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ fontSize: '11px', fontWeight: 500, color: '#3b82f6' }}>{formatMonth(selectedMonth)}</span>
      </div>

      {/* SSI Gauge */}
      <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Safety Index</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color, lineHeight: 1 }}>{currentScore}</span>
          <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>/ 100</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', marginLeft: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: trendInfo.color }}>{trendInfo.arrow}</span>
            <span style={{ fontSize: '10px', fontWeight: 500, color: trendInfo.color }}>{trendInfo.label}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: '8px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${currentScore}%`, background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Month-over-month change */}
      {monthIdx > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingLeft: '4px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>vs prev month:</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: diff >= 0 ? '#22c55e' : '#ef4444' }}>
            {diff >= 0 ? '+' : ''}{diff} pts
          </span>
          <span style={{ fontSize: '10px', color: '#cbd5e1' }}>({prevScore} → {currentScore})</span>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {marker.totalReports} reports
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {currentScore >= 70 ? 'Verified' : 'Under review'}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => navigate('/accommodation/' + marker.id)}
        style={{
          width: '100%', padding: '8px', borderRadius: '8px', background: '#6366f1',
          color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
        }}
      >
        View Details
      </button>
    </div>
  );
}
