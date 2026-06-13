interface Props {
  filter: 'all' | 'high' | 'medium' | 'low';
  onFilterChange: (f: 'all' | 'high' | 'medium' | 'low') => void;
  count: number;
}

export default function FilterBar({ filter, onFilterChange, count }: Props) {
  return (
    <div className="absolute top-4 left-[380px] z-[1000] flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 shadow-lg transition-colors">
      <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
      {(['all', 'high', 'medium', 'low'] as const).map((f) => (
        <button key={f} onClick={() => onFilterChange(f)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            filter === f
              ? f === 'high' ? 'bg-green-500 text-white'
                : f === 'medium' ? 'bg-amber-500 text-white'
                : f === 'low' ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}>
          {f === 'all' ? 'All' : f === 'high' ? 'Safe (70+)' : f === 'medium' ? 'Moderate (40-69)' : 'Risky (<40)'}
        </button>
      ))}
      <span className="text-xs text-slate-400 ml-2">{count} locations</span>
    </div>
  );
}
