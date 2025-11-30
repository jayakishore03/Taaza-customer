/**
 * Auth API
 * Frontend API functions for authentication
 */

import { apiClient } from './client';

export interface SignInResponse {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
  token: string;
}

export interface SignUpResponse {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
  token: string;
}

export interface SignUpPayload {
  name: string;
  email?: string;
  phone: string;
  password: string;
  gender?: 'male' | 'female';
  profilePicture?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    label?: string;
  };
}

export const authApi = {
  /**
   * Sign in with phone/email and password
   */
  signIn: async (phoneOrEmail: string, password: string): Promise<SignInResponse> => {
    const payload: any = { password };
    if (phoneOrEmail.includes('@')) {
      payload.email = phoneOrEmail;
    } else {
      payload.phone = phoneOrEmail;
    }
    return apiClient.post<SignInResponse>('/auth/signin', payload);
  },

  /**
   * Sign up with user details
   */
  signUp: async (payload: SignUpPayload): Promise<SignUpResponse> => {
    return apiClient.post<SignUpResponse>('/auth/signup', payload);
  },

  /**
   * Verify token
   */
  verifyToken: async (): Promise<{ user: { id: string; name: string; email: string | null; phone: string } }> => {
    return apiClient.get('/auth/verify');
  },

  /**
   * Send password reset OTP
   */
  sendPasswordResetOTP: async (phone: string): Promise<{ message: string; otp?: string }> => {
    return apiClient.post('/auth/forgot-password', { phone });
  },

  /**
   * Verify password reset OTP
   */
  verifyPasswordResetOTP: async (phone: string, otp: string): Promise<{ message: string }> => {
    return apiClient.post('/auth/verify-reset-otp', { phone, otp });
  },

  /**
   * Reset password (after OTP verification)
   */
  resetPassword: async (phone: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.post('/auth/reset-password', { phone, newPassword });
  },
};

