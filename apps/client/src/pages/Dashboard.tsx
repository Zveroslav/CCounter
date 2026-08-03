import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, X, Bot } from 'lucide-react';
import { getJournalData, type JournalData, type Meal } from '../api/journal';
import { getProfile, type UserProfile } from '../api/user';
import { format, parseISO, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay, getHours } from 'date-fns';
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
  const [showMealsModal, setShowMealsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Reset scroll to top when period or date changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
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
        const isEmpty = !summary || summary.totalCalories === 0;
        const p = isEmpty ? 0 : summary!.totalProtein;
        const f = isEmpty ? 0 : summary!.totalFat;
        const c = isEmpty ? 0 : summary!.totalCarbs;
        return {
          name: format(day, 'E'),
          calories: summary ? summary.totalCalories : 0,
          protein: p,
          fat: f,
          carbs: c,
          // calorie equivalents for stacked bar height
          proteinCal: Math.round(p * 4),
          fatCal: Math.round(f * 9),
          carbsCal: Math.round(c * 4),
          macroTotal: p + f + c,
          visualCalories: isEmpty ? profile.targetCalories : summary!.totalCalories,
          isEmpty,
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
        const isEmpty = !summary || summary.totalCalories === 0;
        const p = isEmpty ? 0 : summary!.totalProtein;
        const f = isEmpty ? 0 : summary!.totalFat;
        const c = isEmpty ? 0 : summary!.totalCarbs;
        return {
          name: format(day, 'd'),
          calories: summary ? summary.totalCalories : 0,
          protein: p,
          fat: f,
          carbs: c,
          proteinCal: Math.round(p * 4),
          fatCal: Math.round(f * 9),
          carbsCal: Math.round(c * 4),
          macroTotal: p + f + c,
          visualCalories: isEmpty ? profile.targetCalories : summary!.totalCalories,
          isEmpty,
        };
      });
    }

    return [];
  }, [data, profile, period, targetDate]);

  const totalCaloriesToday = data?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;
  const totalProteinToday = data?.meals.reduce((sum, m) => sum + (m.protein ?? 0), 0) || 0;
  const totalFatToday = data?.meals.reduce((sum, m) => sum + (m.fat ?? 0), 0) || 0;
  const totalCarbsToday = data?.meals.reduce((sum, m) => sum + (m.carbs ?? 0), 0) || 0;
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
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${period === p
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-40">
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

            {period === 'day' && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 space-y-4">

                {/* Calories row */}
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Calories</div>
                    <div className="text-4xl font-black text-indigo-600 leading-none mt-0.5">
                      {remaining > 0 ? remaining : 0}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">of {targetCalories} kcal left</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">consumed</div>
                    <div className="text-lg font-bold text-gray-700">{totalCaloriesToday}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((totalCaloriesToday / targetCalories) * 100, 100)}%` }}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Macros 3-col */}
                {(() => {
                  const macroTotal = totalProteinToday + totalFatToday + totalCarbsToday;
                  const pct = (v: number) => macroTotal > 0 ? Math.round((v / macroTotal) * 100) : 0;
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Protein', grams: totalProteinToday, color: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-500' },
                        { label: 'Fat', grams: totalFatToday, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-400' },
                        { label: 'Carbs', grams: totalCarbsToday, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
                      ].map(m => (
                        <div key={m.label} className={`${m.bg} rounded-2xl p-3 flex flex-col gap-1`}>
                          <div className="text-xs font-semibold text-gray-500">{m.label}</div>
                          <div className={`text-xl font-black ${m.color} leading-none`}>{Math.round(m.grams)}g</div>
                          <div className="text-xs text-gray-400">{pct(m.grams)}% of macros</div>
                          <div className="w-full bg-white/60 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className={`${m.bar} h-1.5 rounded-full`} style={{ width: `${pct(m.grams)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {(period === 'week' || period === 'month') && chartData.length > 0 && (
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50">
                {/* PFC legend for week */}
                {period === 'week' && (
                  <div className="flex gap-3 px-2 pb-3">
                    {[['P', '#6366f1'], ['F', '#f59e0b'], ['C', '#10b981']].map(([l, c]) => (
                      <div key={l} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        <span className="text-xs font-semibold text-gray-500">{l}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: period === 'month' ? 20 : 8, right: 10, left: period === 'month' ? 0 : -20, bottom: 0 }}>
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
                        tick={period === 'month' ? false : { fill: '#9ca3af', fontSize: 12 }}
                        width={period === 'month' ? 0 : 40}
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
                          label={period === 'month' ? {
                            value: `${profile.targetCalories} kcal`,
                            position: 'top',
                            textAnchor: 'middle',
                            fill: '#a5b4fc',
                            fontSize: 11,
                            fontWeight: 700,
                            dy: -4,
                          } : undefined}
                        />
                      )}

                      {period === 'week' ? (
                        // Stacked PFC bars (in calories) for week
                        <>
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
                        </>
                      ) : (
                        // Stacked PFC bars for month (same as week)
                        <>
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
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Meal Preview — last 4 meals + Show All */}
            {(period === 'day' || period === 'week') && (() => {
              const meals = data?.meals ?? [];
              const preview = meals.slice(0, 4);
              const hasMore = meals.length > 4;
              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <h2 className="text-lg font-bold text-gray-900">Recent Meals</h2>
                    {meals.length > 0 && (
                      <button
                        onClick={() => setShowMealsModal(true)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Show All ({meals.length})
                      </button>
                    )}
                  </div>
                  {meals.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
                      <p className="text-gray-400 font-medium">No meals logged yet.</p>
                    </div>
                  ) : (
                    <>
                      {preview.map(meal => <MealCard key={meal.id} meal={meal} showTime />)}
                      {hasMore && (
                        <button
                          onClick={() => setShowMealsModal(true)}
                          className="w-full py-3 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                          Show All {meals.length} meals
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* Meals Modal */}
            {showMealsModal && (
              <MealsModal
                meals={data?.meals ?? []}
                period={period}
                targetDate={targetDate}
                onClose={() => setShowMealsModal(false)}
              />
            )}

            {/* Ask AI Nutritionist button — last item in scroll */}
            <button
              onClick={() => setShowChatModal(true)}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl shadow-md transition-all active:scale-95 font-bold"
            >
              <Bot size={20} />
              <span>Ask AI Nutritionist</span>
            </button>

          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <ChatModal
          period={period}
          targetDate={targetDate.toISOString()}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared meal card
// ---------------------------------------------------------------------------

function MealCard({ meal, showTime }: { meal: Meal; showTime?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center space-x-4">
      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
        {meal.imageUrl ? (
          <img src={`http://localhost:3000${meal.imageUrl}`} alt="Meal" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🍽️</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <span className="font-bold text-gray-900 line-clamp-1 text-sm">{meal.recognizedText || 'Manual Entry'}</span>
          <span className="font-black text-indigo-600 text-sm ml-2 flex-shrink-0">{meal.calories} kcal</span>
        </div>
        {showTime && (
          <div className="text-xs text-gray-400 mb-1">
            {format(parseISO(meal.loggedAt), 'h:mm a')}
          </div>
        )}
        <div className="flex space-x-3">
          <span className="text-xs text-gray-500"><span className="font-bold text-gray-700">{meal.protein ?? 0}g</span> P</span>
          <span className="text-xs text-gray-500"><span className="font-bold text-gray-700">{meal.fat ?? 0}g</span> F</span>
          <span className="text-xs text-gray-500"><span className="font-bold text-gray-700">{meal.carbs ?? 0}g</span> C</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meals Modal (fullscreen)
// ---------------------------------------------------------------------------

interface MealsModalProps {
  meals: Meal[];
  period: 'day' | 'week' | 'month' | 'all-time';
  targetDate: Date;
  onClose: () => void;
}

function MealsModal({ meals, period, targetDate, onClose }: MealsModalProps) {
  const DAY_SLOTS = [
    { label: '🌅 Morning', test: (h: number) => h < 12 },
    { label: '☀️ Afternoon', test: (h: number) => h >= 12 && h < 15 },
    { label: '🌆 Evening', test: (h: number) => h >= 15 && h < 18 },
    { label: '🌙 Night', test: (h: number) => h >= 18 },
  ];

  const weekDays = period === 'week'
    ? eachDayOfInterval({
      start: startOfWeek(targetDate, { weekStartsOn: 1 }),
      end: endOfWeek(targetDate, { weekStartsOn: 1 }),
    })
    : [];

  // Slide-up animation
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // trigger on next frame so the initial translateY(100%) is painted first
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320); // wait for transition to finish
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        transition: 'background-color 0.3s ease',
      }}
      onClick={handleClose}
    >
      <div
        className="mt-12 flex-1 bg-gray-50 rounded-t-3xl flex flex-col overflow-hidden"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white rounded-t-3xl sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">
            All Meals
            <span className="ml-2 text-sm font-semibold text-gray-400">({meals.length})</span>
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
          {period === 'day' && DAY_SLOTS.map(slot => {
            const group = meals.filter(m => slot.test(getHours(parseISO(m.loggedAt))));
            if (group.length === 0) return null;
            return (
              <div key={slot.label} className="space-y-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2">{slot.label}</h3>
                {group.map(meal => <MealCard key={meal.id} meal={meal} showTime />)}
              </div>
            );
          })}

          {period === 'week' && weekDays.map(day => {
            const group = meals.filter(m => isSameDay(parseISO(m.loggedAt), day));
            if (group.length === 0) return null;
            return (
              <div key={day.toISOString()} className="space-y-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2">
                  {format(day, 'EEEE, MMM d')}
                </h3>
                {group.map(meal => <MealCard key={meal.id} meal={meal} showTime />)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Modal
// ---------------------------------------------------------------------------

function ChatModal({ period, targetDate, onClose }: { period: string; targetDate: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        transition: 'background-color 0.3s ease',
      }}
      onClick={handleClose}
    >
      <div
        className="mt-8 flex-1 bg-gray-50 rounded-t-3xl flex flex-col overflow-hidden"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white rounded-t-3xl">
          <div className="flex items-center space-x-2">
            <Bot size={20} className="text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Nutritionist</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat fills the rest */}
        <div className="flex-1 overflow-hidden">
          <ChatWidget period={period} targetDate={targetDate} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Macro Donut Chart
// ---------------------------------------------------------------------------

function MacroDonut({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
  const total = protein + fat + carbs;

  // Donut geometry
  const R = 36;
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
