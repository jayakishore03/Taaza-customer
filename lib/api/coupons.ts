/**
 * Coupons API
 */

import { apiClient } from './client';

export interface CouponValidation {
  valid: boolean;
  discount: number;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    discountAmount: number;
    discountPercentage?: number;
    minOrderAmount: number;
    maxDiscount?: number;
  };
}

export const couponsApi = {
  validate: async (code: string, orderAmount: number): Promise<CouponValidation> => {
    return apiClient.post<CouponValidation>('/coupons/validate', { code, orderAmount });
  },

  apply: async (couponId: string): Promise<void> => {
    return apiClient.post<void>(`/coupons/${couponId}/apply`, {});
  },
};

