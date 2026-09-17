import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
export type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: any;
  };
};

export type SignupResponse = {
  success: boolean;
  message?: string;
  data?: {
    requiresVerification?: boolean;
  };
};

const authService = {
  async login(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    const response = await api.post('/users/login', {
      email,
      password,
    });

    return response.data;
  },

  async signup(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<SignupResponse> {
    const response = await api.post('/users/signup', data);

    return response.data;
  },

  async verifyOtp(
    email: string,
    otp: string
  ) {
    const response = await api.post('/users/verify-otp', {
      email,
      otp,
    });

    return response.data;
  },

  async resendOtp(email: string) {
    const response = await api.post('/users/resend-otp', {
      email,
    });

    return response.data;
  },

  async getProfile() {
    const response = await api.get('/users/profile');

    return response.data;
  },

  async logout() {
    await AsyncStorage.removeItem('token');
  },
};

export default authService;