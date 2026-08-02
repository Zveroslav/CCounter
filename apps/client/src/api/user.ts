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

const getHeaders = () => {
  const token = localStorage.getItem('jwt_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getProfile = async (): Promise<UserProfile> => {
  const response = await fetch('/api/user/profile', {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
};

export const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update profile');
};

export const logWeight = async (weight: number): Promise<void> => {
  const response = await fetch('/api/user/weight', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ weight })
  });
  if (!response.ok) throw new Error('Failed to log weight');
};
