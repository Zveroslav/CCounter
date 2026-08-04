import { fetchWithAuth } from './client';

export interface RecognizeResponse {
  message: string;
  jobId: string;
  mealId: string;
}

export interface JobResult {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  health_warnings?: string;
  title?: string;
  description?: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  result: JobResult | null;
  mealId: string;
}

export interface MealUpdateData {
  title?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  recognizedText?: string;
}

export async function recognizeMeal(file: File): Promise<RecognizeResponse> {
  const formData = new FormData();
  formData.append('image', file);

  return fetchWithAuth('/meals/recognize', {
    method: 'POST',
    body: formData,
  });
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return fetchWithAuth(`/meals/jobs/${jobId}`);
}

export async function updateMeal(mealId: string, data: MealUpdateData): Promise<any> {
  return fetchWithAuth(`/meals/${mealId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMeal(mealId: string): Promise<any> {
  return fetchWithAuth(`/meals/${mealId}`, {
    method: 'DELETE',
  });
}

export async function reanalyzeMeal(mealId: string, prompt: string): Promise<{ message: string; meal: any; result: JobResult }> {
  return fetchWithAuth(`/meals/${mealId}/reanalyze`, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}
