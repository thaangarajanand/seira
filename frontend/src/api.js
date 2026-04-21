const rawUrl = (import.meta.env.VITE_API_URL || 'https://seira-67aw.onrender.com').trim();
export const API_BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
console.log('[API DIAGNOSTIC] Current Base URL:', API_BASE_URL);
