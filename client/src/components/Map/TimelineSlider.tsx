import { useMemo } from 'react';
import { TIMELINE_MONTHS, formatMonth, getMonthIndex } from '../../types';

interface Props {
  selectedMonth: string;
  onChange: (month: string) => void;
}

export default function TimelineSlider({ selectedMonth, onChange }: Props) {
  const idx = getMonthIndex(selectedMonth);

  // Generate tick marks for every 3rd month
  const ticks = useMemo(() => {
    return TIMELINE_MONTHS.filter((_, i) => i % 3 === 0 || i === TIMELINE_MONTHS.length - 1);
  }, []);

  return (
    <div className="w-full px-6 py-3">
      {/* Selected month display */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {formatMonth(selectedMonth)}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            — Viewing historical safety data
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>{formatMonth(TIMELINE_MONTHS[0])}</span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          <span>{formatMonth(TIMELINE_MONTHS[TIMELINE_MONTHS.length - 1])}</span>
        </div>
      </div>

      {/* Slider track */}
      <div className="relative">
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />

        {/* Filled portion */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-200"
          style={{ width: `${(idx / (TIMELINE_MONTHS.length - 1)) * 100}%` }}
        />

        {/* Actual range input */}
        <input
          type="range"
          min={0}
          max={TIMELINE_MONTHS.length - 1}
          value={idx}
          onChange={(e) => onChange(TIMELINE_MONTHS[Number(e.target.value)])}
          className="relative z-10 w-full h-6 appearance-none bg-transparent cursor-pointer slider-thumb"
          style={{ WebkitAppearance: 'none' }}
        />

        {/* Tick marks */}
        <div className="flex justify-between mt-1 px-0">
          {TIMELINE_MONTHS.map((month, i) => {
            const showTick = ticks.includes(month);
            const isCurrent = month === selectedMonth;
            return (
              <div key={month} className="flex flex-col items-center" style={{ width: 0 }}>
                {showTick && (
                  <span className={`text-[9px] mb-1 ${isCurrent ? 'text-blue-500 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    {formatMonth(month)}
                  </span>
                )}
                <div
                  className={`w-0.5 h-2 rounded-full ${isCurrent ? 'bg-blue-500' : showTick ? 'bg-slate-300 dark:bg-slate-600' : 'bg-transparent'}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom slider thumb styles */}
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
