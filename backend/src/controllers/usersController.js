/**
 * Users Controller
 */

import { supabase, supabaseAdmin } from '../config/database.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Format address for response
 */
function formatAddress(dbAddress) {
  return {
    id: dbAddress.id,
    contactName: dbAddress.contact_name,
    phone: dbAddress.phone,
    street: dbAddress.street,
    city: dbAddress.city,
    state: dbAddress.state,
    postalCode: dbAddress.postal_code,
    landmark: dbAddress.landmark || undefined,
    label: dbAddress.label || 'Home',
    isDefault: dbAddress.is_default || false,
  };
}

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    console.log('📋 Fetching profile for user:', userId);

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching profile:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Profile not found' },
        });
      }
      throw error;
    }

    console.log('✅ Profile found:', profile.name);

    // Get addresses
    console.log('📍 Fetching addresses for user:', userId);
    const { data: addresses, error: addressError } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (addressError) {
      console.error('⚠️  Error fetching addresses:', addressError);
    } else {
      console.log(`✅ Found ${addresses?.length || 0} addresses`);
      if (addresses && addresses.length > 0) {
        console.log('   First address:', JSON.stringify(addresses[0], null, 2));
      }
    }

    const addressList = (addresses || []).map(formatAddress);
    const defaultAddress = addressList.find(addr => addr.isDefault) || addressList[0] || null;

    console.log('📤 Returning profile with address:', defaultAddress ? 'Yes' : 'No');

    res.json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name,
        email: profile.email || '',
        phone: profile.phone,
        profilePicture: profile.profile_picture || undefined,
        address: defaultAddress,
        addresses: addressList.length > 0 ? addressList : undefined,
      },
    });
  } catch (error) {
    console.error('❌ Error in getUserProfile:', error);
    next(error);
  }
};

/**
 * Update user profile
 * PATCH /api/users/profile
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, email, phone, profilePicture } = req.body;

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture !== undefined) updateData.profile_picture = profilePicture;

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log profile update activity
    await logActivity(req, 'PROFILE_UPDATED', 'User profile updated', 'user', userId, {
      updatedFields: Object.keys(updateData).filter(key => key !== 'updated_at'),
    });

    res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        profilePicture: data.profile_picture || undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user addresses
 * GET /api/users/addresses
 */
export const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.userId;

    console.log('📍 Fetching all addresses for user:', userId);

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('❌ Error fetching addresses:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} addresses for user ${userId}`);

    res.json({
      success: true,
      data: (data || []).map(formatAddress),
    });
  } catch (error) {
    console.error('❌ Error in getUserAddresses:', error);
    next(error);
  }
};

/**
 * Add address
 * POST /api/users/addresses
 */
export const addAddress = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { contactName, phone, street, city, state, postalCode, landmark, label, isDefault } = req.body;

    console.log('========================================');
    console.log('📍 ADD ADDRESS REQUEST');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    if (!contactName || !phone || !street || !city || !state || !postalCode) {
      console.log('❌ Missing required fields');
      console.log('   contactName:', contactName ? 'Yes' : 'MISSING');
      console.log('   phone:', phone ? 'Yes' : 'MISSING');
      console.log('   street:', street ? 'Yes' : 'MISSING');
      console.log('   city:', city ? 'Yes' : 'MISSING');
      console.log('   state:', state ? 'Yes' : 'MISSING');
      console.log('   postalCode:', postalCode ? 'Yes' : 'MISSING');
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' },
      });
    }

    console.log('✅ All required fields present');

    const addressData = {
      user_id: userId,
      contact_name: contactName,
      phone,
      street,
      city,
      state,
      postal_code: postalCode,
      landmark: landmark || null,
      label: label || 'Home',
      is_default: isDefault || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📝 Inserting address:', JSON.stringify(addressData, null, 2));

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert(addressData)
      .select()
      .single();

    if (error) {
      console.error('❌ ERROR INSERTING ADDRESS:', error);
      console.error('   Error Code:', error.code);
      console.error('   Error Message:', error.message);
      console.error('   Error Details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Address created successfully!');
    console.log('   Address ID:', data.id);
    console.log('   Address:', `${data.street}, ${data.city}, ${data.state}`);
    console.log('========================================');

    // Log address creation activity
    await logActivity(req, 'ADDRESS_CREATED', 'New address added', 'address', data.id, {
      label: label || 'Home',
      city,
      state,
      isDefault: isDefault || false,
    });

    res.status(201).json({
      success: true,
      data: formatAddress(data),
    });
  } catch (error) {
    console.error('❌ ERROR in addAddress:', error);
    next(error);
  }
};

/**
 * Update address
 * PATCH /api/users/addresses/:id
 */
export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { contactName, phone, street, city, state, postalCode, landmark, label, isDefault } = req.body;

    console.log('========================================');
    console.log('✏️  UPDATE ADDRESS REQUEST');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Address ID:', id);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (contactName !== undefined) updateData.contact_name = contactName;
    if (phone !== undefined) updateData.phone = phone;
    if (street !== undefined) updateData.street = street;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postal_code = postalCode;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (label !== undefined) updateData.label = label;
    if (isDefault !== undefined) updateData.is_default = isDefault;

    console.log('📝 Update Data:', JSON.stringify(updateData, null, 2));

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ ERROR UPDATING ADDRESS:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Address not found' },
        });
      }
      throw error;
    }

    console.log('✅ Address updated successfully!');
    console.log('   Address ID:', data.id);
    console.log('========================================');

    res.json({
      success: true,
      data: formatAddress(data),
    });
  } catch (error) {
    console.error('❌ ERROR in updateAddress:', error);
    next(error);
  }
};

/**
 * Delete address
 * DELETE /api/users/addresses/:id
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Log address deletion activity
    await logActivity(req, 'ADDRESS_DELETED', 'Address deleted', 'address', id);

    res.json({
      success: true,
      data: { message: 'Address deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set default address
 * PATCH /api/users/addresses/:id/default
 */
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Unset all defaults
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set new default
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Address not found' },
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: formatAddress(data),
    });
  } catch (error) {
    next(error);
  }
};

