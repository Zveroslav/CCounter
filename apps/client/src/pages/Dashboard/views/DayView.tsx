import { type JournalData } from '../../../api/journal';
import { type UserProfile } from '../../../api/user';

interface DayViewProps {
  data: JournalData | null;
  profile: UserProfile | null;
  activeAlert: string | null;
  setActiveAlert: (alert: string | null) => void;
}

export default function DayView({ data, profile, activeAlert, setActiveAlert }: DayViewProps) {
  const totalCaloriesToday = data?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;
  const totalProteinToday = data?.meals.reduce((sum, m) => sum + (m.protein ?? 0), 0) || 0;
  const totalFatToday = data?.meals.reduce((sum, m) => sum + (m.fat ?? 0), 0) || 0;
  const totalCarbsToday = data?.meals.reduce((sum, m) => sum + (m.carbs ?? 0), 0) || 0;
  const targetCalories = profile?.targetCalories || 2000;
  const remaining = targetCalories - totalCaloriesToday;

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
              You are over your calorie limit by {Math.round(totalCaloriesToday - targetCalories)} kcal.
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
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Protein', grams: totalProteinToday, target: targetP, actualPct: pPercent, targetPct: profile?.targetProteinPct ?? 30, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Fat', grams: totalFatToday, target: targetF, actualPct: fPercent, targetPct: profile?.targetFatPct ?? 30, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Carbs', grams: totalCarbsToday, target: targetC, actualPct: cPercent, targetPct: profile?.targetCarbsPct ?? 40, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(m => {
            const isOverLimit = m.target > 0 && Math.round(m.grams) > m.target;
            
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
                        You are over your {m.label.toLowerCase()} limit by {Math.round(m.grams - m.target)}g.
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
      
      {/* AI Comment */}
      {data?.periodSummary?.comment && (
        <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50 relative">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 text-xs font-bold">AI</span>
            </div>
            <h3 className="text-sm font-bold text-indigo-900">Insights</h3>
          </div>
          <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-wrap">
            {data.periodSummary.comment.replace(/^AI:\s*/i, '')}
          </p>
        </div>
      )}
    </div>
  );
}
