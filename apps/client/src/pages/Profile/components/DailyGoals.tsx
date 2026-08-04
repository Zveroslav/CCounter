interface DailyGoalsProps {
  targetCalories: string;
  setTargetCalories: (val: string) => void;
  targetProteinPct: string;
  setTargetProteinPct: (val: string) => void;
  targetFatPct: string;
  setTargetFatPct: (val: string) => void;
  targetCarbsPct: string;
  setTargetCarbsPct: (val: string) => void;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
}

export default function DailyGoals({
  targetCalories, setTargetCalories,
  targetProteinPct, setTargetProteinPct,
  targetFatPct, setTargetFatPct,
  targetCarbsPct, setTargetCarbsPct,
  proteinGrams, fatGrams, carbsGrams
}: DailyGoalsProps) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Goals</h2>
      <div className="space-y-4">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <label className="block text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">Target Calories</label>
          <input
            type="number"
            value={targetCalories}
            onChange={e => setTargetCalories(e.target.value)}
            className="w-full bg-transparent text-indigo-900 font-bold text-2xl focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center">
            <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1">Protein (%)</label>
            <input
              type="number"
              value={targetProteinPct}
              onChange={e => setTargetProteinPct(e.target.value)}
              className="w-full bg-transparent text-indigo-900 font-bold text-center focus:outline-none"
            />
            <div className="text-[10px] text-indigo-400 mt-1">≈ {proteinGrams}g</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
            <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Fat (%)</label>
            <input
              type="number"
              value={targetFatPct}
              onChange={e => setTargetFatPct(e.target.value)}
              className="w-full bg-transparent text-amber-900 font-bold text-center focus:outline-none"
            />
            <div className="text-[10px] text-amber-400 mt-1">≈ {fatGrams}g</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
            <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Carbs (%)</label>
            <input
              type="number"
              value={targetCarbsPct}
              onChange={e => setTargetCarbsPct(e.target.value)}
              className="w-full bg-transparent text-emerald-900 font-bold text-center focus:outline-none"
            />
            <div className="text-[10px] text-emerald-400 mt-1">≈ {carbsGrams}g</div>
          </div>
        </div>
      </div>
    </section>
  );
}
