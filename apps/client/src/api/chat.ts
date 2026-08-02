const getHeaders = () => {
  const token = localStorage.getItem('jwt_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const sendChatMessage = async (message: string, period: string, targetDate: string): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      message,
      period,
      targetDate
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }

  const data = await response.json();
  return data.response;
};
