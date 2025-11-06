import { useAuthStore } from '@/stores/auth.store';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request Interceptor: Add the access token to every request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token expiry
// **NOTE:** This is where we would handle token refresh.
// Since no refresh endpoint was provided, we'll just log the user out on a 401.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired.
      // Log the user out.
      useAuthStore.getState().actions.logout();
      // Reload to clear all state and redirect to login
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;