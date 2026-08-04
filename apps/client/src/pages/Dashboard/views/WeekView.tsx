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
