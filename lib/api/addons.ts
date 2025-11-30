/**
 * Addons API
 */

import { apiClient } from './client';
import type { AddOn } from '../../data/dummyData';

export const addonsApi = {
  getAll: async (): Promise<AddOn[]> => {
    return apiClient.get<AddOn[]>('/addons');
  },

  getById: async (id: string): Promise<AddOn> => {
    return apiClient.get<AddOn>(`/addons/${id}`);
  },
};

