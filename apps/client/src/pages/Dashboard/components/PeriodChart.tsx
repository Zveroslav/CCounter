import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { type UserProfile } from '../../../api/user';

interface PeriodChartProps {
  data: any[];
  profile: UserProfile | null;
  showLegend?: boolean;
}

export default function PeriodChart({ data, profile, showLegend }: PeriodChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50">
      {showLegend && (
        <div className="flex gap-3 px-2 pb-3">
          {[['P', '#6366f1'], ['F', '#f59e0b'], ['C', '#10b981']].map(([l, c]) => (
            <div key={l as string} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c as string }} />
              <span className="text-xs font-semibold text-gray-500">{l}</span>
            </div>
          ))}
        </div>
      )}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={false}
              width={0}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                if (d.isEmpty) return (
                  <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100">
                    <p className="font-bold text-gray-400 text-sm">No data</p>
                  </div>
                );
                const mt = d.macroTotal || 1;
                return (
                  <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100 space-y-1 min-w-[130px]">
                    <p className="font-bold text-gray-800 text-sm mb-2">{d.calories} kcal</p>
                    {[['P', d.protein, '#6366f1'], ['F', d.fat, '#f59e0b'], ['C', d.carbs, '#10b981']].map(([l, g, c]: any) => (
                      <div key={l} className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                          <span className="text-xs text-gray-500">{l}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{Math.round(g)}g</span>
                        <span className="text-xs text-gray-400">{Math.round((g / mt) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {profile && (
              <ReferenceLine
                y={profile.targetCalories}
                stroke="#c7d2fe"
                strokeDasharray="3 3"
                label={({ viewBox }: any) => {
                  if (!viewBox) return null;
                  const x = viewBox.width ? viewBox.width / 2 : 150;
                  const y = viewBox.y;
                  return (
                    <g>
                      <rect x={x - 35} y={y - 12} width={70} height={18} fill="#e0e7ff" rx={6} opacity={0.9} />
                      <text x={x} y={y + 1} fill="#4f46e5" fontSize={11} fontWeight={700} textAnchor="middle">
                        {profile.targetCalories} kcal
                      </text>
                    </g>
                  );
                }}
              />
            )}

            {/* Stacked PFC bars */}
            <Bar dataKey="carbsCal" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                if (payload.isEmpty) return <rect x={x} y={y} width={width} height={height} fill="#e5e7eb" />;
                return <rect x={x} y={y} width={width} height={height} fill="#10b981" />;
              }}
            />
            <Bar dataKey="fatCal" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                if (payload.isEmpty) return null;
                return <rect x={x} y={y} width={width} height={height} fill="#f59e0b" />;
              }}
            />
            <Bar dataKey="proteinCal" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                if (payload.isEmpty) return null;
                return <rect x={x} y={y} width={width} height={height} fill="#6366f1" />;
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
