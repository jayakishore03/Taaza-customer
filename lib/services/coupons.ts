/**
 * Coupon Service
 * Handles all coupon-related database operations
 */

import { supabase } from '../supabase';

export interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  discountPercentage?: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

/**
 * Validate and apply coupon
 */
export async function validateCoupon(
  code: string,
  orderAmount: number
): Promise<{ valid: boolean; discount: number; coupon?: Coupon; error?: string }> {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return {
      valid: false,
      discount: 0,
      error: 'Invalid coupon code',
    };
  }

  // Check if coupon is expired
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return {
      valid: false,
      discount: 0,
      error: 'Coupon has expired',
    };
  }

  // Check minimum order amount
  if (orderAmount < coupon.min_order_amount) {
    return {
      valid: false,
      discount: 0,
      error: `Minimum order amount of ₹${coupon.min_order_amount} required`,
    };
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return {
      valid: false,
      discount: 0,
      error: 'Coupon usage limit reached',
    };
  }

  // Calculate discount
  let discount = coupon.discount_amount;
  
  if (coupon.discount_percentage) {
    discount = (orderAmount * coupon.discount_percentage) / 100;
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  }

  return {
    valid: true,
    discount,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountAmount: coupon.discount_amount,
      discountPercentage: coupon.discount_percentage || undefined,
      minOrderAmount: coupon.min_order_amount,
      maxDiscount: coupon.max_discount || undefined,
      validFrom: coupon.valid_from,
      validUntil: coupon.valid_until || undefined,
      usageLimit: coupon.usage_limit || undefined,
      usageCount: coupon.usage_count,
      isActive: coupon.is_active,
    },
  };
}

/**
 * Apply coupon (increment usage count)
 */
export async function applyCoupon(couponId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_coupon_usage', {
    coupon_id: couponId,
  });

  if (error) {
    // Fallback: manual update
    const { data: coupon } = await supabase
      .from('coupons')
      .select('usage_count')
      .eq('id', couponId)
      .single();

    if (coupon) {
      await supabase
        .from('coupons')
        .update({ usage_count: coupon.usage_count + 1 })
        .eq('id', couponId);
    }
  }
}

