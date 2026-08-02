export interface Meal {
  id: string;
  imageUrl?: string;
  recognizedText?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  loggedAt: string;
}

export interface DailySummary {
  id: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface JournalData {
  period: string;
  startDate: string;
  endDate: string;
  meals: Meal[];
  dailySummaries: DailySummary[];
}

const getHeaders = () => {
  const token = localStorage.getItem('jwt_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getJournalData = async (period: 'day' | 'week' | 'month' | 'all-time', date?: string): Promise<JournalData> => {
  const url = new URL('/api/journal', window.location.origin);
  url.searchParams.append('period', period);
  if (date) {
    url.searchParams.append('date', date);
  }

  const response = await fetch(url.toString(), {
    headers: getHeaders()
  });
  
  if (!response.ok) throw new Error('Failed to fetch journal data');
  return response.json();
};
