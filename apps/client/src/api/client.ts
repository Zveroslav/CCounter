export const API_BASE = '/api';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  
  const headers = new Headers(options.headers || {});
  
  if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

