import { Loader2, Save, Edit3, X } from 'lucide-react';

interface RefinementFormProps {
  calories: number;
  setCalories: (val: number) => void;
  protein: number;
  setProtein: (val: number) => void;
  fat: number;
  setFat: (val: number) => void;
  carbs: number;
  setCarbs: (val: number) => void;
  title: string;
  comments: string;
  isSaving: boolean;
  isCancelling: boolean;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  onOpenEditModal: () => void;
}

export default function RefinementForm({
  calories, setCalories,
  protein, setProtein,
  fat, setFat,
  carbs, setCarbs,
  title, comments,
  isSaving, isCancelling,
  onSave, onCancel, onOpenEditModal
}: RefinementFormProps) {
  const pCals = (protein || 0) * 4;
  const fCals = (fat || 0) * 9;
  const cCals = (carbs || 0) * 4;
  const totalCals = pCals + fCals + cCals;
  const pPercent = totalCals > 0 ? Math.round((pCals / totalCals) * 100) : 0;
  const fPercent = totalCals > 0 ? Math.round((fCals / totalCals) * 100) : 0;
  const cPercent = totalCals > 0 ? Math.round((cCals / totalCals) * 100) : 0;

  return (
    <form onSubmit={onSave} className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
      
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
        <label className="block text-sm font-semibold text-indigo-900 mb-1 uppercase tracking-wider">Calories</label>
        <input 
          type="number" 
          value={calories} 
          onChange={e => setCalories(Number(e.target.value))}
          className="text-5xl font-black text-indigo-600 bg-transparent text-center w-full focus:outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center justify-center border border-blue-100">
          <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">Protein</label>
          <div className="flex items-baseline justify-center">
            <input 
              type="number" 
              value={protein} 
              onChange={e => setProtein(Number(e.target.value))}
              className="text-2xl font-bold text-gray-900 bg-transparent text-right w-10 pr-0.5 focus:outline-none"
            />
            <span className="text-sm font-bold text-gray-900">(g)</span>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 flex flex-col items-center justify-center border border-amber-100">
          <label className="block text-xs font-semibold text-amber-600 mb-1 uppercase tracking-wider">Fat</label>
          <div className="flex items-baseline justify-center">
            <input 
              type="number" 
              value={fat} 
              onChange={e => setFat(Number(e.target.value))}
              className="text-2xl font-bold text-gray-900 bg-transparent text-right w-10 pr-0.5 focus:outline-none"
            />
            <span className="text-sm font-bold text-gray-900">(g)</span>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 flex flex-col items-center justify-center border border-emerald-100">
          <label className="block text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wider">Carbs</label>
          <div className="flex items-baseline justify-center">
            <input 
              type="number" 
              value={carbs} 
              onChange={e => setCarbs(Number(e.target.value))}
              className="text-2xl font-bold text-gray-900 bg-transparent text-right w-10 pr-0.5 focus:outline-none"
            />
            <span className="text-sm font-bold text-gray-900">(g)</span>
          </div>
        </div>
      </div>

      {/* Macros Progress Bar */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
          <span className="text-blue-500">{pPercent}%</span>
          <span className="text-amber-500">{fPercent}%</span>
          <span className="text-emerald-500">{cPercent}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-200 flex overflow-hidden">
          <div style={{ width: `${pPercent}%` }} className="h-full bg-blue-500 transition-all duration-300"></div>
          <div style={{ width: `${fPercent}%` }} className="h-full bg-amber-500 transition-all duration-300"></div>
          <div style={{ width: `${cPercent}%` }} className="h-full bg-emerald-500 transition-all duration-300"></div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">AI Analysis</label>
        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800">
          {title && <h3 className="font-bold text-lg mb-2">{title}</h3>}
          {comments ? (
            <p className="text-sm leading-relaxed">{comments}</p>
          ) : (
            <p className="text-sm italic text-gray-400">No additional details.</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <button 
          type="submit"
          disabled={isSaving || isCancelling}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-4 font-bold text-lg flex items-center justify-center space-x-2 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-75"
        >
          {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
          <span>Save to Journal</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onOpenEditModal}
            disabled={isSaving || isCancelling}
            className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl p-3.5 font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <Edit3 size={18} />
            <span>Edit / Clarify AI</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving || isCancelling}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-xl p-3.5 font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            {isCancelling ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
            <span>Cancel</span>
          </button>
        </div>
      </div>

    </form>
  );
}
