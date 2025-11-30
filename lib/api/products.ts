/**
 * Products API
 * Frontend API functions for products
 */

import { apiClient } from './client';
import type { Product } from '../../data/dummyData';

export const productsApi = {
  /**
   * Get all products
   */
  getAll: async (params?: { category?: string; shopId?: string; search?: string }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.shopId) queryParams.append('shopId', params.shopId);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return apiClient.get<Product[]>(`/products${query ? `?${query}` : ''}`);
  },

  /**
   * Get product by ID
   */
  getById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/products/${id}`);
  },

  /**
   * Get products by category
   */
  getByCategory: async (category: string): Promise<Product[]> => {
    return apiClient.get<Product[]>(`/products/category/${category}`);
  },
};

