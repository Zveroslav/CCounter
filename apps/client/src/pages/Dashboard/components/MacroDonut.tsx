export default function MacroDonut({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
  const total = protein + fat + carbs;

  // Donut geometry
  const R = 32;
  const cx = 48;
  const cy = 48;
  const circumference = 2 * Math.PI * R;

  const macros = [
    { label: 'P', grams: protein, color: '#6366f1' },  // indigo — protein
    { label: 'F', grams: fat, color: '#f59e0b' },  // amber  — fat
    { label: 'C', grams: carbs, color: '#10b981' },  // emerald— carbs
  ];

  // Build arc segments
  let offset = 0;
  const segments = macros.map(m => {
    const pct = total > 0 ? m.grams / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { ...m, pct, dash, gap, offset };
    offset += dash;
    return seg;
  });

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-xs text-gray-400 font-medium">No data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* SVG donut */}
      <svg width="96" height="96" viewBox="0 0 96 96">
        {/* background track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth="12" />
        {segments.map(seg => (
          <circle
            key={seg.label}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        {/* centre label */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f2937">{Math.round(total)}g</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9ca3af">total</text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <div>
              <span className="text-xs font-bold text-gray-700">{Math.round(seg.grams)}g </span>
              <span className="text-xs text-gray-400">{seg.label} · {Math.round(seg.pct * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
