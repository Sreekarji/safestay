import { useState, useMemo } from 'react';
import type { MapMarkerWithHistory, RouteIntelligence } from '../types';
import { TIMELINE_MONTHS } from '../types';
import LeafletMap from '../components/Map/LeafletMap';
import TimelineSlider from '../components/Map/TimelineSlider';
import SafetyTimelinePanel from '../components/Map/SafetyTimelinePanel';
import RoutePlanner from '../components/Route/RoutePlanner';
import RouteSafetyPanel from '../components/Route/RouteSafetyPanel';
import { generateAISummary } from '../services/api';
import { getRouteIntelligence } from '../services/routeData';

export default function MapPage() {
  const [mode, setMode] = useState<'timeline' | 'route'>('timeline');
  const [selectedMonth, setSelectedMonth] = useState(TIMELINE_MONTHS[TIMELINE_MONTHS.length - 1]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerWithHistory | null>(null);

  // Route mode state
  const [accommodationId, setAccommodationId] = useState<string | null>(null);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  const aiSummary = useMemo(() => {
    if (!selectedMarker) return null;
    return generateAISummary(selectedMarker, selectedMonth);
  }, [selectedMarker, selectedMonth]);

  const route: RouteIntelligence | null = useMemo(() => {
    if (mode !== 'route' || !accommodationId || !collegeId) return null;
    return getRouteIntelligence(accommodationId, collegeId);
  }, [mode, accommodationId, collegeId]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 shrink-0 transition-colors relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mode toggle */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700/50">
              <button
                onClick={() => setMode('timeline')}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  mode === 'timeline'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Safety History
                </span>
              </button>
              <button
                onClick={() => setMode('route')}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  mode === 'route'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                  Route Intelligence
                </span>
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'timeline' ? 'Safety History Map' : 'Safety Route Intelligence'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === 'timeline'
                  ? 'Click an accommodation to explore its safety history over time'
                  : 'Plan your daily commute and evaluate route safety'}
              </p>
            </div>
          </div>

          {mode === 'timeline' && (
            <div className="flex items-center gap-4 text-[11px]">
              <LegendItem color="bg-green-500" label="Safe" sub="70+" />
              <LegendItem color="bg-amber-500" label="Moderate" sub="40–69" />
              <LegendItem color="bg-red-500" label="Risky" sub="<40" />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Map + Slider */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 min-h-0 relative">
            <LeafletMap
              selectedMonth={selectedMonth}
              selectedMarker={selectedMarker}
              onMarkerSelect={setSelectedMarker}
              route={route}
              selectedHotspotId={selectedHotspotId}
              mode={mode}
            />
            {/* Route Planner - floating on map */}
            {mode === 'route' && (
              <div className="absolute top-4 left-4 z-[1002]">
                <RoutePlanner
                  accommodationId={accommodationId}
                  collegeId={collegeId}
                  onAccommodationChange={setAccommodationId}
                  onCollegeChange={setCollegeId}
                />
              </div>
            )}
          </div>

          {mode === 'timeline' && selectedMarker && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shrink-0 transition-colors animate-slide-up">
              <TimelineSlider selectedMonth={selectedMonth} onChange={setSelectedMonth} />
            </div>
          )}
        </div>

        {/* Side Panel */}
        {mode === 'timeline' && selectedMarker && (
          <SafetyTimelinePanel
            marker={selectedMarker}
            selectedMonth={selectedMonth}
            aiSummary={aiSummary}
            onClose={() => setSelectedMarker(null)}
          />
        )}

        {mode === 'route' && route && (
          <RouteSafetyPanel
            route={route}
            onClose={() => { setAccommodationId(null); setCollegeId(null); }}
            onSelectHotspot={setSelectedHotspotId}
          />
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label, sub }: { color: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-400 dark:text-slate-500 font-mono">{sub}</span>
    </div>
  );
}
