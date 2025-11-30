/**
 * Coupons Controller
 */

import { supabase, supabaseAdmin } from '../config/database.js';


/**
 * Validate coupon
 * POST /api/coupons/validate
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({
        success: false,
        error: { message: 'Code and orderAmount are required' },
      });
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return res.json({
        success: false,
        data: {
          valid: false,
          discount: 0,
          error: 'Invalid coupon code',
        },
      });
    }

    // Check if expired
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return res.json({
        success: false,
        data: {
          valid: false,
          discount: 0,
          error: 'Coupon has expired',
        },
      });
    }

    // Check minimum order amount
    if (orderAmount < coupon.min_order_amount) {
      return res.json({
        success: false,
        data: {
          valid: false,
          discount: 0,
          error: `Minimum order amount of ₹${coupon.min_order_amount} required`,
        },
      });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return res.json({
        success: false,
        data: {
          valid: false,
          discount: 0,
          error: 'Coupon usage limit reached',
        },
      });
    }

    // Calculate discount
    let discount = coupon.discount_amount;
    
    if (coupon.discount_percentage) {
      discount = (orderAmount * coupon.discount_percentage) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    }

    res.json({
      success: true,
      data: {
        valid: true,
        discount,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountAmount: coupon.discount_amount,
          discountPercentage: coupon.discount_percentage || undefined,
          minOrderAmount: coupon.min_order_amount,
          maxDiscount: coupon.max_discount || undefined,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply coupon (increment usage)
 * POST /api/coupons/:id/apply
 */
export const applyCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: coupon } = await supabase
      .from('coupons')
      .select('usage_count')
      .eq('id', id)
      .single();

    if (coupon) {
      await supabaseAdmin
        .from('coupons')
        .update({ usage_count: coupon.usage_count + 1 })
        .eq('id', id);
    }

    res.json({
      success: true,
      data: { message: 'Coupon applied successfully' },
    });
  } catch (error) {
    next(error);
  }
};

