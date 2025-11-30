/**
 * Shops API
 */

import { apiClient } from './client';
import type { Shop } from '../../data/dummyData';

export const shopsApi = {
  getAll: async (latitude?: number, longitude?: number): Promise<Shop[]> => {
    const params = new URLSearchParams();
    if (latitude !== undefined && longitude !== undefined) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    }
    const queryString = params.toString();
    const url = queryString ? `/shops?${queryString}` : '/shops';
    return apiClient.get<Shop[]>(url);
  },

  getById: async (id: string, latitude?: number, longitude?: number): Promise<Shop> => {
    const params = new URLSearchParams();
    if (latitude !== undefined && longitude !== undefined) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    }
    const queryString = params.toString();
    const url = queryString ? `/shops/${id}?${queryString}` : `/shops/${id}`;
    return apiClient.get<Shop>(url);
  },
};

