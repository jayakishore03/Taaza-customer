/**
 * Payment Methods Controller
 * Handles CRUD operations for user payment methods
 */

import { supabase, supabaseAdmin } from '../config/database.js';

function generateId() {
  return `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all payment methods for authenticated user
 * GET /api/payment-methods
 */
export const getUserPaymentMethods = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // If table doesn't exist, return empty array instead of error
        if (error.message && error.message.includes('no such table')) {
          console.warn('Payment methods table does not exist, returning empty array');
          return res.json({
            success: true,
            data: [],
          });
        }
        
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to fetch payment methods', details: error.message || String(error) },
        });
      }

      // Format payment methods for frontend
      const formattedMethods = (data || []).map(method => ({
        id: method.id,
        type: method.type,
        name: method.name,
        details: method.details,
        isDefault: method.is_default === 1 || method.is_default === true,
      }));

      res.json({
        success: true,
        data: formattedMethods,
      });
    } catch (dbError) {
      console.error('Database error fetching payment methods:', dbError);
      
      // If table doesn't exist, return empty array
      if (dbError.message && dbError.message.includes('no such table')) {
        console.warn('Payment methods table does not exist, returning empty array');
        return res.json({
          success: true,
          data: [],
        });
      }
      
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch payment methods', details: dbError.message || String(dbError) },
      });
    }
  } catch (error) {
    console.error('Unexpected error in getUserPaymentMethods:', error);
    next(error);
  }
};

/**
 * Create new payment method
 * POST /api/payment-methods
 */
export const createPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { type, name, details, cardNumber, cardExpiry, cardCVV, cardholderName, accountNumber, ifscCode, accountHolderName, bankName, isDefault } = req.body;

    // Validate required fields
    if (!type || !name || !details) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: type, name, and details' },
      });
    }

    if (type !== 'card' && type !== 'bank') {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid payment method type. Must be "card" or "bank"' },
      });
    }

    const now = new Date().toISOString();

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabaseAdmin
        .from('payment_methods')
        .update({ is_default: false, updated_at: now })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    // Check if this is the first payment method (auto-set as default)
    const { data: existingMethods } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const shouldBeDefault = isDefault || !existingMethods || existingMethods.length === 0;

    // Create payment method
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .insert({
        id: generateId(),
        user_id: userId,
        type,
        name,
        details,
        card_number: cardNumber || null,
        card_expiry: cardExpiry || null,
        card_cvv: cardCVV || null,
        cardholder_name: cardholderName || null,
        account_number: accountNumber || null,
        ifsc_code: ifscCode || null,
        account_holder_name: accountHolderName || null,
        bank_name: bankName || null,
        is_default: shouldBeDefault,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('========================================');
      console.error('❌ ERROR CREATING PAYMENT METHOD');
      console.error('========================================');
      console.error('Error Object:', JSON.stringify(error, null, 2));
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.details);
      console.error('Error Hint:', error.hint);
      console.error('User ID:', userId);
      console.error('Type:', type);
      console.error('Name:', name);
      console.error('========================================');
      
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Failed to create payment method',
          details: error.message || 'Unknown error',
          code: error.code || 'UNKNOWN'
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        type: data.type,
        name: data.name,
        details: data.details,
        isDefault: data.is_default === 1 || data.is_default === true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete payment method
 * DELETE /api/payment-methods/:id
 */
export const deletePaymentMethod = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Verify payment method belongs to user
    const { data: method, error: fetchError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !method) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment method not found' },
      });
    }

    // Soft delete (set is_active to false)
    const { error } = await supabaseAdmin
      .from('payment_methods')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting payment method:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete payment method' },
      });
    }

    // If deleted method was default, set another as default
    if (method.is_default) {
      const { data: otherMethods } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (otherMethods && otherMethods.length > 0) {
        await supabaseAdmin
          .from('payment_methods')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('id', otherMethods[0].id);
      }
    }

    res.json({
      success: true,
      data: { message: 'Payment method deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set payment method as default
 * PATCH /api/payment-methods/:id/set-default
 */
export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Verify payment method belongs to user
    const { data: method, error: fetchError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (fetchError || !method) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment method not found' },
      });
    }

    const now = new Date().toISOString();

    // Unset all other defaults
    await supabaseAdmin
      .from('payment_methods')
      .update({ is_default: false, updated_at: now })
      .eq('user_id', userId)
      .eq('is_default', true);

    // Set this as default
    const { error } = await supabaseAdmin
      .from('payment_methods')
      .update({ is_default: true, updated_at: now })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error setting default payment method:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to set default payment method' },
      });
    }

    res.json({
      success: true,
      data: { message: 'Default payment method updated successfully' },
    });
  } catch (error) {
    next(error);
  }
};

