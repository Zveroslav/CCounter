import { type Meal } from '../../../api/journal';
import MealCard from './MealCard';

interface MealPreviewProps {
  meals: Meal[];
  onShowAll: () => void;
  onSelectMeal: (meal: Meal) => void;
}

export default function MealPreview({ meals, onShowAll, onSelectMeal }: MealPreviewProps) {
  const preview = meals.slice(0, 4);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-lg font-bold text-gray-900">Recent Meals</h2>
        {meals.length > 0 && (
          <button
            onClick={onShowAll}
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
          {preview.map(meal => (
            <MealCard key={meal.id} meal={meal} showTime onClick={() => onSelectMeal(meal)} />
          ))}
        </>
      )}
    </div>
  );
}
