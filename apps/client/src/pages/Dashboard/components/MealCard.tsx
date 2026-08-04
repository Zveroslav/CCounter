import { format, parseISO } from 'date-fns';
import { type Meal } from '../../../api/journal';

interface MealCardProps {
  meal: Meal;
  showTime?: boolean;
  onClick?: () => void;
}

export default function MealCard({ meal, showTime, onClick }: MealCardProps) {
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
