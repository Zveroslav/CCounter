import { type UserProfile } from '../../../api/user';
import PeriodChart from '../components/PeriodChart';

interface MonthViewProps {
  chartData: any[];
  profile: UserProfile | null;
}

export default function MonthView({ chartData, profile }: MonthViewProps) {
  return (
    <div className="space-y-6">
      <PeriodChart data={chartData} profile={profile} showLegend={false} />
    </div>
  );
}
