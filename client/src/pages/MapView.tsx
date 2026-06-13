import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X, Clock, Navigation, GitCompareArrows } from 'lucide-react';
import SafetyMap, { triggerAreaZoom, type MapMode } from '@/components/map/SafetyMap';
import SearchBar from '@/components/map/SearchBar';
import FilterBar from '@/components/map/FilterBar';
import TimelineSlider from '@/components/map/TimelineSlider';
import SafetyTimelinePanel from '@/components/map/SafetyTimelinePanel';
import RoutePlanner from '@/components/map/RoutePlanner';
import RouteSafetyPanel from '@/components/map/RouteSafetyPanel';
import RouteComparison from '@/components/map/RouteComparison';
import ThemeToggle from '@/components/map/ThemeToggle';
import { SSILegend } from '@/components/map/SSILegend';
import { fetchMapMarkersWithHistory, generateAISummary } from '@/services/mapData';
import { getRouteIntelligence, getRouteComparison } from '@/services/routeData';
import { TIMELINE_MONTHS } from '@/types';
import type { MapMarkerWithHistory } from '@/types';

export default function MapView() {
  const { t } = useTranslation();

  // ── State ────────────────────────────────────────────────
  const [mode, setMode] = useState<MapMode>('timeline');
  const [selectedMonth, setSelectedMonth] = useState(TIMELINE_MONTHS[TIMELINE_MONTHS.length - 1]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerWithHistory | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNavSidebar, setShowNavSidebar] = useState(true);

  // Route mode state
  const [accommodationId, setAccommodationId] = useState<string | null>(null);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  // Route comparison mode
  const [routeComparisonMode, setRouteComparisonMode] = useState(false);
  const [comparisonAccId, setComparisonAccId] = useState<string | null>(null);

  // Data
  const [markers, setMarkers] = useState<MapMarkerWithHistory[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    fetchMapMarkersWithHistory()
      .then(setMarkers)
      .catch(() => setDataError(true))
      .finally(() => setDataLoading(false));
  }, []);

  // AI summary for selected marker
  const aiSummary = useMemo(() => {
    if (!selectedMarker) return null;
    return generateAISummary(selectedMarker, selectedMonth);
  }, [selectedMarker, selectedMonth]);

  // Route data
  const route = useMemo(() => {
    if (mode !== 'route' || !accommodationId || !collegeId) return null;
    return getRouteIntelligence(accommodationId, collegeId);
  }, [mode, accommodationId, collegeId]);

  // Route comparison
  const comparison = useMemo(() => {
    if (!routeComparisonMode || !comparisonAccId || !collegeId || comparisonAccId === accommodationId) return null;
    return getRouteComparison(comparisonAccId, accommodationId ?? '', collegeId);
  }, [routeComparisonMode, comparisonAccId, collegeId, accommodationId]);

  // Search in sidebar
  const sidebarFiltered = markers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Error state
  if (dataError && markers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Failed to load map data</p>
          <button onClick={() => { setDataError(false); setDataLoading(true); fetchMapMarkersWithHistory().then(setMarkers).catch(() => setDataError(true)).finally(() => setDataLoading(false)); }}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 shrink-0 transition-colors relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Nav sidebar toggle */}
            <button onClick={() => setShowNavSidebar(!showNavSidebar)}
              className="h-9 w-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              {showNavSidebar ? <X className="h-4 w-4 text-slate-600 dark:text-slate-300" /> : <List className="h-4 w-4 text-slate-600 dark:text-slate-300" />}
            </button>

            {/* Mode toggle */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700/50">
              <button onClick={() => setMode('timeline')}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'timeline' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}>
                <Clock className="w-3.5 h-3.5" /> Safety History
              </button>
              <button onClick={() => setMode('route')}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'route' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}>
                <Navigation className="w-3.5 h-3.5" /> Route Intelligence
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'timeline' ? 'Safety History Map' : 'Safety Route Intelligence'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === 'timeline' ? 'Click an accommodation to explore its safety history over time' : 'Plan your daily commute and evaluate route safety'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mode === 'timeline' && (
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-slate-500 dark:text-slate-400">Safe</span><span className="text-slate-400 dark:text-slate-500 font-mono">70+</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-slate-500 dark:text-slate-400">Moderate</span><span className="text-slate-400 dark:text-slate-500 font-mono">40–69</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-slate-500 dark:text-slate-400">Risky</span><span className="text-slate-400 dark:text-slate-500 font-mono">&lt;40</span></div>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Navigation sidebar */}
        <AnimatePresence>
          {showNavSidebar && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }} className="h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-y-auto shrink-0 transition-colors">
              <div className="p-4 w-[280px]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Accommodations</h3>
                <div className="space-y-2">
                  {dataLoading && <p className="text-sm text-slate-400">Loading...</p>}
                  {!dataLoading && sidebarFiltered.length === 0 && <p className="text-sm text-slate-400">No accommodations found</p>}
                  {sidebarFiltered.map((acc) => (
                    <div key={acc.id}
                      onClick={() => { setSelectedMarker(acc); }}
                      className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-all border ${
                        selectedMarker?.id === acc.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{acc.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{acc.area} · {acc.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ color: getSSIColor(acc.currentSSI ?? acc.ssi) }}>{acc.currentSSI ?? acc.ssi}</p>
                          <p className="text-xs text-slate-400">{getSSILabel(acc.currentSSI ?? acc.ssi)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map + controls */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 min-h-0 relative">
            {/* Search bar */}
            <SearchBar markers={markers} query={searchQuery} onQueryChange={setSearchQuery}
              showDropdown={showSearchDropdown} onDropdownChange={setShowSearchDropdown}
              onMarkerSelect={(m) => { setSelectedMarker(m); setSearchQuery(m.name); setShowSearchDropdown(false); }}
              onAreaZoom={(ms) => { triggerAreaZoom(ms); }} />

            {/* Filter bar (timeline mode only) */}
            {mode === 'timeline' && (
              <FilterBar filter={filter} onFilterChange={setFilter} count={markers.filter((m) => {
                if (filter === 'all') return true;
                if (filter === 'high') return m.ssi >= 70;
                if (filter === 'medium') return m.ssi >= 40 && m.ssi < 70;
                return m.ssi < 40;
              }).length} />
            )}

            {/* Route planner (route mode) */}
            {mode === 'route' && (
              <div className="absolute top-4 left-4 z-[1002]">
                <RoutePlanner accommodationId={accommodationId} collegeId={collegeId}
                  onAccommodationChange={setAccommodationId} onCollegeChange={setCollegeId} />
                {/* Route comparison toggle */}
                <button onClick={() => { setRouteComparisonMode(!routeComparisonMode); setComparisonAccId(null); }}
                  className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    routeComparisonMode ? 'bg-purple-500 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                  } border border-slate-200 dark:border-slate-700/50 shadow-lg`}>
                  <GitCompareArrows className="w-3 h-3" /> Compare Routes
                </button>
              </div>
            )}

            {/* Map */}
            <SafetyMap mode={mode} selectedMonth={selectedMonth} selectedMarker={selectedMarker}
              onMarkerSelect={setSelectedMarker} filter={filter}
              accommodationId={accommodationId} collegeId={collegeId}
              selectedHotspotId={selectedHotspotId}
              routeComparisonMode={routeComparisonMode} comparisonAccId={comparisonAccId} />

            {/* Legend */}
            <SSILegend />
          </div>

          {/* Timeline slider (appears after marker click in timeline mode) */}
          {mode === 'timeline' && selectedMarker && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shrink-0 transition-colors animate-slide-up">
              <TimelineSlider selectedMonth={selectedMonth} onChange={setSelectedMonth} />
            </div>
          )}
        </div>

        {/* ── Side panels ─────────────────────────────────── */}
        {/* Timeline panel */}
        {mode === 'timeline' && selectedMarker && (
          <SafetyTimelinePanel marker={selectedMarker} selectedMonth={selectedMonth}
            aiSummary={aiSummary} onClose={() => setSelectedMarker(null)} />
        )}

        {/* Route safety panel */}
        {mode === 'route' && route && !comparison && (
          <RouteSafetyPanel route={route} onClose={() => { setAccommodationId(null); setCollegeId(null); }}
            onSelectHotspot={setSelectedHotspotId} />
        )}

        {/* Route comparison panel */}
        {comparison && (
          <RouteComparison comparison={comparison} onClose={() => { setComparisonAccId(null); setRouteComparisonMode(false); }} />
        )}
      </div>
    </div>
  );
}

// Import for sidebar
import { getSSIColor, getSSILabel } from '@/lib/utils';
