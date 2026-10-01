import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not configured');
}

console.log('🌐 API BASE URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');

    console.log(
      '➡️ API REQUEST:',
      config.method?.toUpperCase(),
      config.url
    );

    console.log(
      '🔑 TOKEN:',
      token ? 'Token exists' : 'NO TOKEN'
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Log API responses/errors
api.interceptors.response.use(
  (response) => {
    console.log(
      '✅ API RESPONSE:',
      response.status,
      response.config.url
    );

    return response;
  },

  async (error) => {
    console.error(
      '❌ API ERROR:',
      error.response?.status,
      error.config?.url
    );

    console.error(
      '❌ API ERROR DATA:',
      error.response?.data
    );

    if (error.response?.status === 401) {
      console.error(
        '🔴 401 UNAUTHORIZED:',
        error.config?.url
      );
    }

    return Promise.reject(error);
  }
);

export default api;