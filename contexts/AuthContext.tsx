import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import {
  type UserProfile,
  type Address,
} from '../data/dummyData';
import { usersApi } from '../lib/api/users';
import { 
  getAuthToken, 
  signInWithPassword, 
  signUpWithPassword, 
  signOut,
  onAuthStateChange 
} from '../lib/auth/helper';

type SignUpPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  gender?: 'male' | 'female';
  profilePicture?: string;
  address: Address;
};

type AuthContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (profile?: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  updateProfile: (updates: { name?: string; profilePicture?: string | number }) => Promise<void>;
  addAddress: (address: Address) => Promise<void>;
  updateUserAddress: (addressId: string, address: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          // Fetch user profile from backend API
          const profile = await usersApi.getProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const authSubscription = onAuthStateChange(async (session) => {
      if (session?.user) {
        try {
          // Fetch user profile from backend API
          const profile = await usersApi.getProfile();
          setUser(profile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const login = async (profile?: UserProfile) => {
    if (profile) {
      setUser(profile);
    } else {
      // Fetch current user profile from backend API
      try {
        await getAuthToken();
        const userProfile = await usersApi.getProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const signIn = async (phone: string, password: string) => {
    try {
      // Sign in using backend API
      const data = await signInWithPassword(phone, password);

      if (data.session) {
        // Fetch user profile from backend API
        const profile = await usersApi.getProfile();
        setUser(profile);
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.error?.message || 'Invalid phone number or password. Please check your credentials and try again.';
      throw new Error(errorMessage);
    }
  };

  const signUp = async (payload: SignUpPayload) => {
    const { name, email, phone, password, address, gender, profilePicture } = payload;

    try {
      // Sign up using backend API (includes profile and address creation)
      const authData = await signUpWithPassword(
        name,
        phone,
        password,
        email,
        address,
        gender,
        profilePicture
      );

      if (authData.user) {
        // Fetch complete profile from backend API
        const completeProfile = await usersApi.getProfile();
        setUser(completeProfile);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const updateAddress = async (updatedAddress: Address) => {
    if (!user) return;

    try {
      // Check if address has a valid UUID (not dummy like 'addr-1')
      const hasValidId = updatedAddress.id && 
        updatedAddress.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      if (hasValidId) {
        // Update existing address
        await usersApi.updateAddress(updatedAddress.id, updatedAddress);
      } else {
        // Create new address (dummy ID or no ID) - remove id field
        const { id, ...addressWithoutId } = updatedAddress;
        await usersApi.addAddress(addressWithoutId);
      }
      
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: { name?: string; profilePicture?: string | number }) => {
    if (!user) return;

    try {
      await usersApi.updateProfile({
        name: updates.name,
        profilePicture: typeof updates.profilePicture === 'string' ? updates.profilePicture : undefined,
      });
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const addAddress = async (newAddress: Address) => {
    if (!user) return;

    try {
      await usersApi.addAddress(newAddress);
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  };

  const updateUserAddress = async (addressId: string, updatedAddress: Address) => {
    if (!user) return;

    try {
      await usersApi.updateAddress(addressId, updatedAddress);
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user) return;

    try {
      await usersApi.deleteAddress(addressId);
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!user) return;

    try {
      await usersApi.setDefaultAddress(addressId);
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      signIn,
      signUp,
      updateAddress,
      updateProfile,
      addAddress,
      updateUserAddress,
      deleteAddress,
      setDefaultAddress,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

