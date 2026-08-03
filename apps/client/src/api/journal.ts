import { fetchWithAuth } from './client';

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

export const getJournalData = async (period: 'day' | 'week' | 'month' | 'all-time', date?: string): Promise<JournalData> => {
  let query = `?period=${encodeURIComponent(period)}`;
  if (date) {
    query += `&date=${encodeURIComponent(date)}`;
  }

  return fetchWithAuth(`/journal${query}`);
};

