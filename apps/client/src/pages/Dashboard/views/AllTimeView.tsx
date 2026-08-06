import { useMemo, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { type JournalData } from '../../../api/journal';
import { type UserProfile } from '../../../api/user';

interface AllTimeViewProps {
  data: JournalData | null;
  profile: UserProfile | null;
}

export default function AllTimeView({ data }: AllTimeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    if (!data?.weightLogs || data.weightLogs.length === 0) return [];
    
    const logs = data.weightLogs;
    const monthsMap = new Map<string, { sum: number; count: number }>();

    logs.forEach(log => {
      const monthKey = format(parseISO(log.date), 'MMM yyyy');
      const current = monthsMap.get(monthKey) || { sum: 0, count: 0 };
      monthsMap.set(monthKey, {
        sum: current.sum + log.weight,
        count: current.count + 1
      });
    });

    return Array.from(monthsMap.entries()).map(([month, stats]) => ({
      name: month,
      weight: Number((stats.sum / stats.count).toFixed(1))
    }));
  }, [data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [chartData]);

  if (!data?.weightLogs || data.weightLogs.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
        <p className="text-gray-400 font-medium">No weight data available yet.</p>
      </div>
    );
  }

  const minWeight = Math.floor(Math.min(...chartData.map(d => d.weight)) - 2);
  const maxWeight = Math.ceil(Math.max(...chartData.map(d => d.weight)) + 2);

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50 w-full overflow-hidden">
        <div className="px-2 pb-2 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Average Weight by Month</h2>
        </div>
        <div className="h-56 mt-4 relative w-full">
          {/* Scrollable Chart Area */}
          <div ref={scrollRef} className="w-full h-full overflow-x-auto scrollbar-hide" style={{ touchAction: 'pan-x' }}>
            <div style={{ width: `${Math.max(100, (chartData.length / 4) * 100)}%`, height: '100%', minWidth: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis domain={[minWeight, maxWeight]} hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
                    labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} kg`, 'Weight']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fixed Y-Axis overlay on the left */}
          <div className="absolute top-0 h-full pointer-events-none bg-white z-10" style={{ left: '-5px', width: '40px' }} />
          <div className="absolute top-0 left-0 h-full w-full pointer-events-none z-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis hide />
                <YAxis
                  orientation="left"
                  domain={[minWeight, maxWeight]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                  width={24}
                />
                {/* Invisible line so Recharts calculates the Y-Axis ticks based on data */}
                <Line type="monotone" dataKey="weight" stroke="none" strokeWidth={0} opacity={0} dot={false} activeDot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
