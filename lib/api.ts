import axios from 'axios';

const CORE_API_URL = process.env.CORE_API_URL || 'https://isoc360-core.isoc.go.th/user-api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: CORE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  // Token will be added from server actions
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error('Authentication error:', error);
    }
    return Promise.reject(error);
  }
);
