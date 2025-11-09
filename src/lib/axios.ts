import { useAuthStore } from '@/stores/auth.store';
import axios from 'axios';

const api = axios.create({
  // add the trailing slash
  baseURL: import.meta.env.VITE_API_BASE_URL.replace(/\/?$/, '/'), // ensures trailing /
});

// Always send JSON
api.defaults.headers.post['Content-Type'] = 'application/json';

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // if we truly have no response, it's a CORS / network error — bubble it up
    if (!error.response) return Promise.reject(error);

    if (error.response.status === 401) {
      useAuthStore.getState().actions.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
