import { fetchWithAuth } from './client';

export interface Meal {
  id: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  title?: string;
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
  comment?: string;
}

export interface PeriodSummary {
  id: string;
  userNote?: string;
  comment?: string;
}

export interface WeightLog {
  id: string;
  weight: number;
  date: string;
}

export interface JournalData {
  period: string;
  startDate: string;
  endDate: string;
  meals: Meal[];
  dailySummaries: DailySummary[];
  weightLogs: WeightLog[];
  periodSummary?: PeriodSummary | null;
}

export const getJournalData = async (period: 'day' | 'week' | 'month' | 'all-time', date?: string): Promise<JournalData> => {
  let query = `?period=${encodeURIComponent(period)}`;
  if (date) {
    query += `&date=${encodeURIComponent(date)}`;
  }

  return fetchWithAuth(`/journal${query}`);
};

export const saveUserNote = async (period: string, date: string, text: string): Promise<void> => {
  return fetchWithAuth(`/journal/note`, {
    method: 'POST',
    body: JSON.stringify({ period, date, text }),
  });
};

