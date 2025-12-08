/**
 * Payment Methods API
 * Frontend API functions for payment methods
 */

import { apiClient } from './client';

export type PaymentMethodType = 'card' | 'bank';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  details: string;
  isDefault: boolean;
}

export interface CreateCardPaymentMethod {
  type: 'card';
  name: string;
  details: string;
  cardNumber: string;
  cardExpiry: string;
  cardCVV: string;
  cardholderName: string;
  isDefault?: boolean;
}

export interface CreateBankPaymentMethod {
  type: 'bank';
  name: string;
  details: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  isDefault?: boolean;
}

export const paymentMethodsApi = {
  /**
   * Get all payment methods for authenticated user
   */
  getAll: async (): Promise<PaymentMethod[]> => {
    const response = await apiClient.get<PaymentMethod[]>('/payment-methods');
    // Ensure we always return an array
    return Array.isArray(response) ? response : [];
  },

  /**
   * Create new payment method
   */
  create: async (method: CreateCardPaymentMethod | CreateBankPaymentMethod): Promise<PaymentMethod> => {
    const response = await apiClient.post<PaymentMethod>('/payment-methods', method);
    return response;
  },

  /**
   * Delete payment method
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/payment-methods/${id}`);
  },

  /**
   * Set payment method as default
   */
  setDefault: async (id: string): Promise<void> => {
    await apiClient.patch(`/payment-methods/${id}/set-default`);
  },
};

