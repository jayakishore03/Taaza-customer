/**
 * Payments API
 * Frontend API functions for Razorpay payments
 */

import { apiClient } from './client';

export interface CreateOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  paymentId: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  method: string;
  captured: boolean;
}

export interface PaymentStatusResponse {
  paymentId: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  method: string;
  captured: boolean;
  createdAt: string;
}

export const paymentsApi = {
  /**
   * Create Razorpay order
   */
  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    return apiClient.post<CreateOrderResponse>('/payments/create-order', data);
  },

  /**
   * Verify payment
   */
  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    return apiClient.post<VerifyPaymentResponse>('/payments/verify', data);
  },

  /**
   * Get payment status
   */
  getPaymentStatus: async (paymentId: string): Promise<PaymentStatusResponse> => {
    return apiClient.get<PaymentStatusResponse>(`/payments/status/${paymentId}`);
  },
};

