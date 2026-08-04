import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Bot, Loader2 } from 'lucide-react';
import { type Meal } from '../../../api/journal';
import { deleteMeal } from '../../../api/meals';
import BottomSheetModal from '../../../components/BottomSheetModal';

interface MealDetailsModalProps {
  meal: Meal;
  onClose: () => void;
  onDelete: () => void;
}

export default function MealDetailsModal({ meal, onClose, onDelete }: MealDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <BottomSheetModal
      title="Meal Details"
      onClose={onClose}
      zIndex="z-[100]"
      bgClass="bg-white"
    >
      {(closeModal) => {
        const handleDelete = async () => {
          if (!confirm('Are you sure you want to delete this meal?')) return;
          setIsDeleting(true);
          try {
            await deleteMeal(meal.id);
            closeModal();
            setTimeout(onDelete, 320); // allow animation to finish before updating dashboard
          } catch (e) {
            console.error(e);
            alert('Failed to delete meal');
          } finally {
            setIsDeleting(false);
          }
        };

        return (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
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
        );
      }}
    </BottomSheetModal>
  );
}
