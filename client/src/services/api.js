import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
if (baseUrl && !baseUrl.endsWith('/api')) {
   baseUrl = baseUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({
   baseURL: baseUrl
});

// Request interceptor for adding auth token
api.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem('token');
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Response interceptor for handling global errors (like 401)
api.interceptors.response.use(
   (response) => response,
   (error) => {
      if (error.response?.status === 401 && !error.config.url.includes('/auth/login') && !error.config.url.includes('/payments')) {
         // Unauthorized - clear session and redirect
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         window.location.href = '/login?expired=true';
      }
      return Promise.reject(error);
   }
);

export default api;
