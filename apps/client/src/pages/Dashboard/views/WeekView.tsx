import { type JournalData, type Meal } from '../../../api/journal';
import { type UserProfile } from '../../../api/user';
import PeriodChart from '../components/PeriodChart';
import MealPreview from '../components/MealPreview';

interface WeekViewProps {
  data: JournalData | null;
  profile: UserProfile | null;
  chartData: any[];
  onSelectMeal: (meal: Meal) => void;
  onShowAllMeals: () => void;
}

export default function WeekView({ data, profile, chartData, onSelectMeal, onShowAllMeals }: WeekViewProps) {
  return (
    <div className="space-y-6">
      <PeriodChart data={chartData} profile={profile} showLegend={true} />

      {/* AI Comment */}
      {data?.periodSummary?.comment && (
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50 relative">
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

      {data && (
        <MealPreview 
          meals={data.meals} 
          onShowAll={onShowAllMeals} 
          onSelectMeal={onSelectMeal} 
        />
      )}
    </div>
  );
}
