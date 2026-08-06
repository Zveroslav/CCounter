import { format, parseISO, isSameDay, getHours, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { type Meal } from '../../../api/journal';
import BottomSheetModal from '../../../components/BottomSheetModal';
import MealCard from './MealCard';

interface MealsModalProps {
  meals: Meal[];
  period: 'day' | 'week' | 'month' | 'all-time';
  targetDate: Date;
  onClose: () => void;
  onSelectMeal: (meal: Meal) => void;
}

export default function MealsModal({ meals, period, targetDate, onClose, onSelectMeal }: MealsModalProps) {
  const DAY_SLOTS = [
    { label: 'Snacks / Late Night', test: (h: number) => h >= 21 || h < 5 },
    { label: 'Dinner', test: (h: number) => h >= 16 && h < 21 },
    { label: 'Lunch', test: (h: number) => h >= 11 && h < 16 },
    { label: 'Breakfast', test: (h: number) => h >= 5 && h < 11 },
  ];

  const weekDays = (() => {
    if (period !== 'week') return [];
    const start = startOfWeek(targetDate, { weekStartsOn: 1 });
    const end = endOfWeek(targetDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).reverse();
  })();
  return (
    <BottomSheetModal
      title={
        <>
          All Meals
          <span className="ml-2 text-sm font-medium opacity-70">({meals.length})</span>
        </>
      }
      onClose={onClose}
      bgClass="bg-gray-50"
      zIndex="z-[60]"
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 pt-6">
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
    </BottomSheetModal>
  );
}
