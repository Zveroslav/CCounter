import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, X, Bot } from 'lucide-react';
import { getJournalData, saveUserNote, type JournalData, type Meal } from '../api/journal';
import { deleteMeal } from '../api/meals';
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
  const [activeAlert, setActiveAlert] = useState<string | { x: number, y: number, text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Close alert tooltip on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeAlert) setActiveAlert(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeAlert]);

  // Load Profile on mount for goals
  useEffect(() => {
    getProfile().then(setProfile).catch(console.error);
  }, []);

  // Fetch Journal Data when period or targetDate changes
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await getJournalData(period, targetDate.toISOString());
      setData(res);
      setUserNote(res.periodSummary?.userNote || '');
    } catch (err) {
      console.error('Failed to load journal', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Journal Data when period or targetDate changes
  useEffect(() => {
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

  const handleSaveNote = async () => {
    try {
      setIsSavingNote(true);
      await saveUserNote(period, targetDate.toISOString(), userNote);
      // Optional: show a small success indicator or just rely on state
    } catch (err) {
      console.error('Failed to save note', err);
      alert('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
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
      {selectedMeal && (
        <MealDetailsModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onDelete={() => {
            setSelectedMeal(null);
            loadData();
          }}
        />
      )}

      {/* Header Tabs */}
      <div className="bg-white px-4 pt-4 pb-2 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Journal</h1>
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {['day', 'week', 'month', 'all-time'].map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p as Period);
                setTargetDate(new Date());
              }}
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
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 space-y-4 relative">
                
                {/* Calories Overage Alert */}
                {totalCaloriesToday > targetCalories && (
                  <div className="absolute top-4 right-4 z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAlert(activeAlert === 'Calories' ? null : 'Calories');
                      }} 
                      className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm"
                    >
                      !
                    </button>
                    {activeAlert === 'Calories' && (
                      <div className="absolute top-full right-0 mt-1 w-40 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg z-20 text-left pointer-events-none">
                        You are over your calorie limit by {Math.round(((totalCaloriesToday - targetCalories) / targetCalories) * 100)}%.
                        <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Calories row */}
                <div className="flex justify-between items-end pr-6">
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consumed</div>
                    <div className="text-4xl font-black text-indigo-600 leading-none mt-0.5">
                      {totalCaloriesToday}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">of {targetCalories} kcal</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">left</div>
                    <div className="text-lg font-bold text-gray-700">{remaining > 0 ? remaining : 0}</div>
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
                {(() => {
                  const pCals = totalProteinToday * 4;
                  const fCals = totalFatToday * 9;
                  const cCals = totalCarbsToday * 4;
                  const totalCals = pCals + fCals + cCals;
                  const pPercent = totalCals > 0 ? Math.round((pCals / totalCals) * 100) : 0;
                  const fPercent = totalCals > 0 ? Math.round((fCals / totalCals) * 100) : 0;
                  const cPercent = totalCals > 0 ? Math.round((cCals / totalCals) * 100) : 0;
                  
                      const targetP = profile ? Math.round((profile.targetCalories * ((profile.targetProteinPct ?? 30) / 100)) / 4) : 150;
                      const targetF = profile ? Math.round((profile.targetCalories * ((profile.targetFatPct ?? 30) / 100)) / 9) : 65;
                      const targetC = profile ? Math.round((profile.targetCalories * ((profile.targetCarbsPct ?? 40) / 100)) / 4) : 200;

                      return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Protein', grams: totalProteinToday, target: targetP, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                          { label: 'Fat', grams: totalFatToday, target: targetF, color: 'text-amber-600', bg: 'bg-amber-50' },
                          { label: 'Carbs', grams: totalCarbsToday, target: targetC, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        ].map(m => {
                          const isOverLimit = m.target > 0 && Math.round(m.grams) > m.target;
                          const overagePct = m.target > 0 ? Math.round(((m.grams - m.target) / m.target) * 100) : 0;
                          
                          return (
                            <div key={m.label} className={`${m.bg} rounded-2xl p-3 flex flex-col gap-1 items-center text-center relative`}>
                              {isOverLimit && (
                                <div className="absolute top-1.5 right-1.5 z-10">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveAlert(activeAlert === m.label ? null : m.label);
                                    }} 
                                    className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-black font-bold text-[10px] shadow-sm"
                                  >
                                    !
                                  </button>
                                  {activeAlert === m.label && (
                                    <div className="absolute top-full right-0 mt-1 w-32 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg z-20 text-left pointer-events-none">
                                      You are over your {m.label.toLowerCase()} limit by {overagePct}%.
                                      <div className="absolute -top-1 right-1 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="text-xs font-semibold text-gray-500">{m.label}</div>
                              <div className={`text-xl font-black ${m.color} leading-none`}>{Math.round(m.grams)}g</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Unified Proportional Progress Bar */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
                          <span className="text-indigo-500">{pPercent}%</span>
                          <span className="text-amber-500">{fPercent}%</span>
                          <span className="text-emerald-500">{cPercent}%</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-gray-200 flex overflow-hidden">
                          <div style={{ width: `${pPercent}%` }} className="h-full bg-indigo-500 transition-all duration-300"></div>
                          <div style={{ width: `${fPercent}%` }} className="h-full bg-amber-400 transition-all duration-300"></div>
                          <div style={{ width: `${cPercent}%` }} className="h-full bg-emerald-500 transition-all duration-300"></div>
                        </div>
                      </div>
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
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
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
                      {preview.map(meal => <MealCard key={meal.id} meal={meal} showTime onClick={() => setSelectedMeal(meal)} />)}
                    </>
                  )}
                </div>
              );
            })()}
            {/* User Journal / Notes */}
            <div className="space-y-2 mt-6">
              <h2 className="text-lg font-bold text-gray-900 px-2">Your Notes</h2>
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col">
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder={`Write your thoughts, feelings, or notes for this ${period}...`}
                  className="w-full resize-none outline-none min-h-[100px] text-gray-700 bg-transparent placeholder:text-gray-300"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSavingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Note</span>}
                  </button>
                </div>
              </div>
            </div>


            {/* Meals Modal */}
            {showMealsModal && (
              <MealsModal
                meals={data?.meals ?? []}
                period={period}
                targetDate={targetDate}
                onClose={() => setShowMealsModal(false)}
                onSelectMeal={(meal) => {
                  setShowMealsModal(false);
                  setSelectedMeal(meal);
                }}
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

function MealCard({ meal, showTime, onClick }: { meal: Meal; showTime?: boolean; onClick?: () => void }) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const imagePath = meal.thumbnailUrl || meal.imageUrl;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center space-x-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
    >
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
        {imagePath ? (
          <img src={`${API_BASE_URL}${imagePath}`} alt="Meal" className="w-12 h-12 object-cover rounded-2xl border border-gray-200 opacity-90 saturate-50" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🍽️</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <span className="font-bold text-gray-900 line-clamp-1 text-sm">{meal.title || meal.recognizedText || 'Manual Entry'}</span>
          <span className="font-black text-indigo-600 text-sm ml-2 flex-shrink-0">{meal.calories} kcal</span>
        </div>

        {showTime && (
          <div className="text-xs text-gray-400 mb-1">
            {format(parseISO(meal.loggedAt), 'h:mm a')}
          </div>
        )}
        <div className="flex space-x-2 mt-1">
          <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium"><span className="font-bold text-indigo-900">{meal.protein ?? 0}g</span> P</span>
          <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium"><span className="font-bold text-amber-900">{meal.fat ?? 0}g</span> F</span>
          <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium"><span className="font-bold text-emerald-900">{meal.carbs ?? 0}g</span> C</span>
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
  onSelectMeal: (meal: Meal) => void;
}

function MealsModal({ meals, period, targetDate, onClose, onSelectMeal }: MealsModalProps) {
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
                {group.map(meal => <MealCard key={meal.id} meal={meal} showTime onClick={() => onSelectMeal(meal)} />)}
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
                {group.map(meal => <MealCard key={meal.id} meal={meal} showTime onClick={() => onSelectMeal(meal)} />)}
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

export function MacroDonut({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
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

// ---------------------------------------------------------------------------
// Meal Details Modal
// ---------------------------------------------------------------------------

interface MealDetailsModalProps {
  meal: Meal;
  onClose: () => void;
  onDelete: () => void;
}

function MealDetailsModal({ meal, onClose, onDelete }: MealDetailsModalProps) {
  const [visible, setVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meal?')) return;
    setIsDeleting(true);
    try {
      await deleteMeal(meal.id);
      handleClose();
      setTimeout(onDelete, 320); // allow animation to finish before updating dashboard
    } catch (e) {
      console.error(e);
      alert('Failed to delete meal');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <div 
        className="absolute inset-0 z-[-1]" 
        onClick={handleClose} 
      />
      <div className="flex items-center justify-between px-4 py-4 backdrop-blur-md">
        <button 
          onClick={handleClose}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-white font-bold">Meal Details</h2>
        <div className="w-10"></div>
      </div>
      
      <div 
        className="flex-1 bg-white rounded-t-[2rem] p-6 flex flex-col overflow-y-auto"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Image (if any) */}
        <div className="w-32 h-32 rounded-3xl bg-gray-100 border border-gray-200 mx-auto flex items-center justify-center mb-6 overflow-hidden flex-shrink-0 shadow-inner">
          {(meal.imageUrl || meal.thumbnailUrl) ? (
            <img 
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${meal.imageUrl || meal.thumbnailUrl}`} 
              alt="Meal" 
              className="w-full h-full object-cover saturate-50" 
            />
          ) : (
            <span className="text-5xl opacity-50">🍽️</span>
          )}
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-gray-900 leading-tight">
            {meal.title || meal.recognizedText || 'Manual Entry'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {format(parseISO(meal.loggedAt), 'h:mm a, MMM d')}
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 text-center mb-6">
          <span className="block text-sm font-bold text-indigo-900/60 uppercase tracking-wider mb-1">Calories</span>
          <span className="text-5xl font-black text-indigo-600">{meal.calories}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-blue-900/50 uppercase tracking-widest mb-1">Protein</span>
            <span className="text-xl font-black text-gray-900">{meal.protein ?? 0}g</span>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-amber-900/50 uppercase tracking-widest mb-1">Fat</span>
            <span className="text-xl font-black text-gray-900">{meal.fat ?? 0}g</span>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-emerald-900/50 uppercase tracking-widest mb-1">Carbs</span>
            <span className="text-xl font-black text-gray-900">{meal.carbs ?? 0}g</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-8 flex-1">
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide mb-3 flex items-center space-x-2">
            <Bot size={18} className="text-indigo-500" />
            <span>AI Comments</span>
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {meal.recognizedText || <span className="italic text-gray-400">No additional details available.</span>}
          </p>
        </div>

        <button
          disabled={isDeleting}
          onClick={handleDelete}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-colors disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Delete Meal'}
        </button>
      </div>
    </div>
  );
}
