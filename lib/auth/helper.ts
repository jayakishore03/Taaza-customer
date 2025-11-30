/**
 * Auth Helper
 * Centralized authentication functions using Backend API
 * All authentication now goes through the backend API
 */

import { apiClient } from '../api/client';
import { authApi } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@taza_auth_token';

// Store token in memory and AsyncStorage
let currentToken: string | null = null;

// Load token from storage on init
AsyncStorage.getItem(TOKEN_KEY).then(token => {
  if (token) {
    currentToken = token;
    apiClient.setToken(token);
  }
}).catch(() => {
  // Ignore errors
});

/**
 * Get current session and set API token
 */
export async function getAuthToken(): Promise<string | null> {
  if (!currentToken) {
    // Try to load from storage
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        currentToken = storedToken;
        apiClient.setToken(storedToken);
        return storedToken;
      }
    } catch (error) {
      console.error('Error loading token from storage:', error);
    }
  }
  
  if (currentToken) {
    apiClient.setToken(currentToken);
    return currentToken;
  }
  return null;
}

/**
 * Sign in with phone/email and password
 */
export async function signInWithPassword(phoneOrEmail: string, password: string) {
  try {
    const response = await authApi.signIn(phoneOrEmail, password);
    
    if (response.token) {
      currentToken = response.token;
      apiClient.setToken(response.token);
      // Save to storage
      try {
        await AsyncStorage.setItem(TOKEN_KEY, response.token);
      } catch (error) {
        console.error('Error saving token to storage:', error);
      }
    }

    return {
      user: response.user,
      session: {
        access_token: response.token,
        user: response.user,
      },
    };
  } catch (error: any) {
    // Provide more helpful error messages
    if (error.message?.includes('Network request failed') || error.message?.includes('Cannot connect')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://192.168.0.5:3000');
    }
    if (error.message?.includes('Invalid credentials') || error.message?.includes('401')) {
      throw new Error('Invalid phone number or password. Please check your credentials and try again.');
    }
    throw new Error(error.message || 'Sign in failed. Please try again.');
  }
}

/**
 * Sign up with user details
 */
export async function signUpWithPassword(
  name: string,
  phone: string,
  password: string,
  email?: string,
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    label?: string;
  },
  gender?: 'male' | 'female',
  profilePicture?: string
) {
  try {
    const response = await authApi.signUp({
      name,
      phone,
      email,
      password,
      address,
      gender,
      profilePicture,
    });
    
    if (response.token) {
      currentToken = response.token;
      apiClient.setToken(response.token);
      // Save to storage
      try {
        await AsyncStorage.setItem(TOKEN_KEY, response.token);
      } catch (error) {
        console.error('Error saving token to storage:', error);
      }
    }

    return {
      user: response.user,
      session: {
        access_token: response.token,
        user: response.user,
      },
    };
  } catch (error: any) {
    throw new Error(error.message || 'Sign up failed');
  }
}

/**
 * Sign out
 */
export async function signOut() {
  currentToken = null;
  apiClient.setToken(null);
  // Remove from storage
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from storage:', error);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  // Try to load token if not in memory
  if (!currentToken) {
    await getAuthToken();
  }
  
  if (!currentToken) {
    return null;
  }
  
  try {
    const response = await authApi.verifyToken();
    return response.user;
  } catch (error) {
    currentToken = null;
    apiClient.setToken(null);
    // Remove from storage on error
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
    return null;
  }
}

/**
 * Listen to auth state changes
 * Note: For backend auth, we use a simple polling mechanism
 * In production, you might want to implement WebSocket or push notifications
 */
export function onAuthStateChange(callback: (session: any) => void) {
  // Simple implementation - check token validity periodically
  const checkAuth = async () => {
    if (currentToken) {
      try {
        const user = await getCurrentUser();
        if (user) {
          callback({
            user,
            access_token: currentToken,
          });
        } else {
          currentToken = null;
          apiClient.setToken(null);
          callback(null);
        }
      } catch (error) {
        currentToken = null;
        apiClient.setToken(null);
        callback(null);
      }
    } else {
      callback(null);
    }
  };

  // Check immediately
  checkAuth();

  // Check every 5 minutes
  const interval = setInterval(checkAuth, 5 * 60 * 1000);

  return {
    data: { subscription: { id: 'backend-auth' } },
    unsubscribe: () => {
      clearInterval(interval);
    },
  };
}

