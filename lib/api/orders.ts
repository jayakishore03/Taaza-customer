/**
 * Orders API
 * Frontend API functions for orders
 */

import { apiClient } from './client';
import type { OrderSummary, OrderStatus } from '../../data/dummyData';

export interface CreateOrderInput {
  shopId?: string;
  addressId: string;
  items: Array<{
    productId?: string;
    addonId?: string;
    name: string;
    quantity: number;
    weight?: string;
    weightInKg?: number;
    price: number;
    pricePerKg?: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  deliveryCharge?: number;
  discount?: number;
  couponId?: string;
  paymentMethodId?: string;
  paymentMethodText?: string;
}

export const ordersApi = {
  /**
   * Get all user orders
   */
  getAll: async (): Promise<OrderSummary[]> => {
    return apiClient.get<OrderSummary[]>('/orders');
  },

  /**
   * Get order by ID
   */
  getById: async (id: string): Promise<OrderSummary> => {
    return apiClient.get<OrderSummary>(`/orders/${id}`);
  },

  /**
   * Create new order
   */
  create: async (input: CreateOrderInput): Promise<OrderSummary> => {
    return apiClient.post<OrderSummary>('/orders', input);
  },

  /**
   * Update order status
   */
  updateStatus: async (id: string, status: OrderStatus, statusNote?: string): Promise<void> => {
    return apiClient.patch<void>(`/orders/${id}/status`, { status, statusNote });
  },
};

