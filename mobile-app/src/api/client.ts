/**
 * API Client for Mobile App
 * Connects to the same backend as the web version
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this URL based on your backend deployment
// For local development on Mac: use your computer's IP address
// For example: http://192.168.1.100:5000/api
export const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api'  // Change to your Mac's IP when testing on device
  : 'https://your-production-api.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
