import { fetchWithAuth } from './client';

export const sendChatMessage = async (message: string, period: string, targetDate: string): Promise<string> => {
  const data = await fetchWithAuth('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      period,
      targetDate
    })
  });

  return data.response;
};

