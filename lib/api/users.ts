/**
 * Users API
 * Frontend API functions for users
 */

import { apiClient } from './client';
import type { UserProfile, Address } from '../../data/dummyData';

export const usersApi = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>('/users/profile');
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: {
    name?: string;
    email?: string;
    phone?: string;
    profilePicture?: string;
  }): Promise<UserProfile> => {
    return apiClient.patch<UserProfile>('/users/profile', updates);
  },

  /**
   * Get user addresses
   */
  getAddresses: async (): Promise<Address[]> => {
    return apiClient.get<Address[]>('/users/addresses');
  },

  /**
   * Add address
   */
  addAddress: async (address: Omit<Address, 'id'>): Promise<Address> => {
    return apiClient.post<Address>('/users/addresses', {
      contactName: address.contactName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      landmark: address.landmark,
      label: address.label,
      isDefault: address.isDefault,
    });
  },

  /**
   * Update address
   */
  updateAddress: async (id: string, address: Partial<Address>): Promise<Address> => {
    return apiClient.patch<Address>(`/users/addresses/${id}`, {
      contactName: address.contactName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      landmark: address.landmark,
      label: address.label,
      isDefault: address.isDefault,
    });
  },

  /**
   * Delete address
   */
  deleteAddress: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/users/addresses/${id}`);
  },

  /**
   * Set default address
   */
  setDefaultAddress: async (id: string): Promise<Address> => {
    return apiClient.patch<Address>(`/users/addresses/${id}/default`, {});
  },
};

