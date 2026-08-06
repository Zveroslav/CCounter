import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, eachDayOfInterval, eachWeekOfInterval, isSameDay, parseISO } from 'date-fns';
import { getJournalData, saveUserNote, type JournalData, type Meal } from '../../api/journal';
import { getProfile, type UserProfile } from '../../api/user';

import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import AllTimeView from './views/AllTimeView';

import MealsModal from './components/MealsModal';
import ChatModal from './components/ChatModal';
import MealDetailsModal from './components/MealDetailsModal';
import MealCard from './components/MealCard';

type Period = 'day' | 'week' | 'month' | 'all-time';

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('day');
  const [targetDate, setTargetDate] = useState(new Date());
  const [data, setData] = useState<JournalData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showMealsModal, setShowMealsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    loadData();
  }, [period, targetDate]);

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
          proteinCal: Math.round(p * 4),
          fatCal: Math.round(f * 9),
          carbsCal: isEmpty ? profile.targetCalories : Math.round(c * 4),
          macroTotal: p + f + c,
          isEmpty,
        };
      });
    }

    if (period === 'month') {
      const start = parseISO(data.startDate);
      const end = parseISO(data.endDate);
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

      return weeks.map((weekStart, idx) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        const summaries = data.dailySummaries.filter(s => {
          const date = parseISO(s.date);
          return date >= weekStart && date <= weekEnd;
        });

        const totalCalories = summaries.reduce((sum, s) => sum + s.totalCalories, 0);
        const totalProtein = summaries.reduce((sum, s) => sum + s.totalProtein, 0);
        const totalFat = summaries.reduce((sum, s) => sum + s.totalFat, 0);
        const totalCarbs = summaries.reduce((sum, s) => sum + s.totalCarbs, 0);
        
        const isEmpty = summaries.length === 0 || totalCalories === 0;
        
        const daysWithData = summaries.filter(s => s.totalCalories > 0).length || 1; 
        
        const p = isEmpty ? 0 : Math.round(totalProtein / daysWithData);
        const f = isEmpty ? 0 : Math.round(totalFat / daysWithData);
        const c = isEmpty ? 0 : Math.round(totalCarbs / daysWithData);
        const avgCalories = isEmpty ? 0 : Math.round(totalCalories / daysWithData);

        return {
          name: `W${idx + 1}`,
          calories: avgCalories,
          protein: p,
          fat: f,
          carbs: c,
          proteinCal: Math.round(p * 4),
          fatCal: Math.round(f * 9),
          carbsCal: isEmpty ? profile.targetCalories : Math.round(c * 4),
          macroTotal: p + f + c,
          isEmpty,
        };
      });
    }

    return [];
  }, [data, profile, period, targetDate]);

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

            {/* Specific Period Views */}
            {period === 'day' && (
              <>
                <DayView 
                  data={data} 
                  profile={profile} 
                  activeAlert={activeAlert}
                  setActiveAlert={setActiveAlert}
                />
                
                {/* Meals List for the day */}
                {data && data.meals.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 px-2">Meals Today</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.meals.map(meal => (
                        <MealCard key={meal.id} meal={meal} onClick={() => setSelectedMeal(meal)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {period === 'week' && (
              <WeekView 
                data={data} 
                profile={profile} 
                chartData={chartData} 
                onSelectMeal={setSelectedMeal} 
                onShowAllMeals={() => setShowMealsModal(true)} 
              />
            )}

            {period === 'month' && (
              <MonthView 
                data={data}
                chartData={chartData} 
                profile={profile} 
              />
            )}

            {period === 'all-time' && (
              <AllTimeView data={data} profile={profile} />
            )}

            {/* User Journal / Notes (Shared across all periods except all-time might have a different logic, but it's shared originally) */}
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
            {showMealsModal && data && (
              <MealsModal
                meals={data.meals}
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
