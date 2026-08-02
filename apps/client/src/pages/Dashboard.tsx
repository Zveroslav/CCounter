import { useState, useEffect, useMemo } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getJournalData, type JournalData } from '../api/journal';
import { getProfile, type UserProfile } from '../api/user';
import { format, parseISO, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay } from 'date-fns';
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
import ChatWidget from '../components/ChatWidget';

type Period = 'day' | 'week' | 'month' | 'all-time';

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('day');
  const [targetDate, setTargetDate] = useState(new Date());
  const [data, setData] = useState<JournalData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Profile on mount for goals
  useEffect(() => {
    getProfile().then(setProfile).catch(console.error);
  }, []);

  // Fetch Journal Data when period or targetDate changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await getJournalData(period, targetDate.toISOString());
        setData(res);
      } catch (err) {
        console.error('Failed to load journal', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [period, targetDate]);

  const handlePrev = () => {
    if (period === 'day') setTargetDate(subDays(targetDate, 1));
    else if (period === 'week') setTargetDate(subWeeks(targetDate, 1));
    else if (period === 'month') setTargetDate(subMonths(targetDate, 1));
  };

  const handleNext = () => {
    if (period === 'day') setTargetDate(addDays(targetDate, 1));
    else if (period === 'week') setTargetDate(addWeeks(targetDate, 1));
    else if (period === 'month') setTargetDate(addMonths(targetDate, 1));
  };

  const formattedDateLabel = useMemo(() => {
    if (period === 'day') return format(targetDate, 'MMM d, yyyy');
    if (period === 'week') {
      const start = startOfWeek(targetDate, { weekStartsOn: 1 });
      const end = endOfWeek(targetDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    if (period === 'month') return format(targetDate, 'MMMM yyyy');
    return 'All Time';
  }, [period, targetDate]);

  // Aggregate Chart Data
  const chartData = useMemo(() => {
    if (!data || !profile) return [];

    if (period === 'week') {
      const start = startOfWeek(targetDate, { weekStartsOn: 1 });
      const end = endOfWeek(targetDate, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const summary = data.dailySummaries.find(s => isSameDay(parseISO(s.date), day));
        return {
          name: format(day, 'E'), // Mon, Tue
          calories: summary ? summary.totalCalories : 0,
          visualCalories: summary ? summary.totalCalories : profile.targetCalories,
          isEmpty: !summary || summary.totalCalories === 0
        };
      });
    }

    if (period === 'month') {
      // Create a daily array for the month
      const start = parseISO(data.startDate);
      const end = parseISO(data.endDate);
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const summary = data.dailySummaries.find(s => isSameDay(parseISO(s.date), day));
        return {
          name: format(day, 'd'), // 1, 2, 3
          calories: summary ? summary.totalCalories : 0,
          visualCalories: summary ? summary.totalCalories : profile.targetCalories,
          isEmpty: !summary || summary.totalCalories === 0
        };
      });
    }

    return [];
  }, [data, profile, period, targetDate]);

  const totalCaloriesToday = data?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;
  const targetCalories = profile?.targetCalories || 2000;
  const remaining = targetCalories - totalCaloriesToday;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Header Tabs */}
      <div className="bg-white px-4 pt-4 pb-2 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Journal</h1>
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {['day', 'week', 'month', 'all-time'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as Period)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                period === p 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="p-4 space-y-6">
            
            {/* Navigation Controls */}
            {period !== 'all-time' && (
              <div className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm">
                <button onClick={handlePrev} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <span className="font-bold text-gray-800">{formattedDateLabel}</span>
                <button onClick={handleNext} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

            {/* Daily Summary Rings / Cards */}
            {period === 'day' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col items-center">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Calories Remaining</div>
                <div className="text-5xl font-black text-indigo-600 mb-2">{remaining > 0 ? remaining : 0}</div>
                <div className="text-sm font-medium text-gray-400">of {targetCalories} kcal goal</div>
                
                <div className="w-full bg-gray-100 rounded-full h-3 mt-6 mb-1 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min((totalCaloriesToday / targetCalories) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Charts for Week / Month */}
            {(period === 'week' || period === 'month') && chartData.length > 0 && (
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50 h-72 pt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
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
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          if (data.isEmpty) {
                            return (
                              <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100">
                                <p className="font-bold text-gray-400">Missing Data</p>
                                <p className="text-sm text-gray-500">Rendered at target: {data.visualCalories} kcal</p>
                              </div>
                            );
                          }
                          return (
                            <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100">
                              <p className="font-bold text-indigo-600">{data.calories} kcal</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {profile && (
                      <ReferenceLine y={profile.targetCalories} stroke="#c7d2fe" strokeDasharray="3 3" />
                    )}
                    <Bar 
                      dataKey="visualCalories" 
                      radius={[6, 6, 0, 0]} 
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        return (
                          <rect 
                            x={x} 
                            y={y} 
                            width={width} 
                            height={height} 
                            fill={payload.isEmpty ? '#e5e7eb' : '#6366f1'} 
                            rx={6} 
                            ry={6} 
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Meal List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 px-2">
                {period === 'day' ? 'Meals' : 'Recent Meals'}
              </h2>
              {data?.meals.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
                  <p className="text-gray-400 font-medium">No meals logged for this period.</p>
                </div>
              ) : (
                data?.meals.map(meal => (
                  <div key={meal.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      {meal.imageUrl ? (
                        <img src={`http://localhost:3000${meal.imageUrl}`} alt="Meal" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-900 line-clamp-1">{meal.recognizedText || 'Manual Entry'}</span>
                        <span className="font-black text-indigo-600">{meal.calories}</span>
                      </div>
                      <div className="text-xs font-semibold text-gray-400">
                        {format(parseISO(meal.loggedAt), 'h:mm a')}
                      </div>
                      <div className="flex space-x-3 mt-2">
                        <div className="text-xs text-gray-500"><span className="font-bold text-gray-700">{meal.protein}g</span> P</div>
                        <div className="text-xs text-gray-500"><span className="font-bold text-gray-700">{meal.fat}g</span> F</div>
                        <div className="text-xs text-gray-500"><span className="font-bold text-gray-700">{meal.carbs}g</span> C</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* AI Nutritionist Chat */}
            <div className="mt-8">
              <ChatWidget period={period} targetDate={targetDate.toISOString()} />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
