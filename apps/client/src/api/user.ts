import { fetchWithAuth } from './client';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  timezone: string;
  targetCalories: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
  latestWeight?: number;
}

export const getProfile = async (): Promise<UserProfile> => {
  return fetchWithAuth('/user/profile');
};

export const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
  return fetchWithAuth('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const logWeight = async (weight: number): Promise<void> => {
  return fetchWithAuth('/user/weight', {
    method: 'POST',
    body: JSON.stringify({ weight })
  });
};

