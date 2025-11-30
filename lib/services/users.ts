/**
 * User Service
 * Handles all user profile-related database operations
 */

import { supabase } from '../supabase';
import type { UserProfile, Address } from '../../data/dummyData';

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching user profile:', error);
    throw error;
  }

  if (!profile) return null;

  // Get user addresses
  const { data: addresses, error: addressesError } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (addressesError) {
    console.error('Error fetching addresses:', addressesError);
  }

  const addressList = (addresses || []).map(dbAddressToAppAddress);
  const defaultAddress = addressList.find(addr => addr.isDefault) || addressList[0];

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email || '',
    phone: profile.phone,
    profilePicture: profile.profile_picture || undefined,
    address: defaultAddress || createEmptyAddress(),
    addresses: addressList.length > 0 ? addressList : undefined,
  };
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(
  userId: string,
  profile: {
    name: string;
    email?: string;
    phone: string;
    profilePicture?: string;
  }
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      name: profile.name,
      email: profile.email || null,
      phone: profile.phone,
      profile_picture: profile.profilePicture || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }

  // Fetch complete profile with addresses
  const completeProfile = await getUserProfile(userId);
  if (!completeProfile) {
    throw new Error('Failed to fetch user profile after creation');
  }

  return completeProfile;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    profilePicture?: string;
  }
): Promise<UserProfile> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.profilePicture !== undefined) updateData.profile_picture = updates.profilePicture;

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  const updatedProfile = await getUserProfile(userId);
  if (!updatedProfile) {
    throw new Error('Failed to fetch updated profile');
  }

  return updatedProfile;
}

/**
 * Get user addresses
 */
export async function getUserAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }

  return (data || []).map(dbAddressToAppAddress);
}

/**
 * Add address
 */
export async function addAddress(userId: string, address: Omit<Address, 'id'>): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: userId,
      contact_name: address.contactName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      landmark: address.landmark || null,
      label: address.label || 'Home',
      is_default: address.isDefault || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding address:', error);
    throw error;
  }

  return dbAddressToAppAddress(data);
}

/**
 * Update address
 */
export async function updateAddress(addressId: string, userId: string, address: Partial<Address>): Promise<Address> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (address.contactName !== undefined) updateData.contact_name = address.contactName;
  if (address.phone !== undefined) updateData.phone = address.phone;
  if (address.street !== undefined) updateData.street = address.street;
  if (address.city !== undefined) updateData.city = address.city;
  if (address.state !== undefined) updateData.state = address.state;
  if (address.postalCode !== undefined) updateData.postal_code = address.postalCode;
  if (address.landmark !== undefined) updateData.landmark = address.landmark;
  if (address.label !== undefined) updateData.label = address.label;
  if (address.isDefault !== undefined) updateData.is_default = address.isDefault;

  const { data, error } = await supabase
    .from('addresses')
    .update(updateData)
    .eq('id', addressId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating address:', error);
    throw error;
  }

  return dbAddressToAppAddress(data);
}

/**
 * Delete address
 */
export async function deleteAddress(addressId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
}

/**
 * Set default address
 */
export async function setDefaultAddress(addressId: string, userId: string): Promise<void> {
  // First, unset all default addresses
  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId);

  // Then set the new default
  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
}

/**
 * Convert database address to app Address type
 */
function dbAddressToAppAddress(dbAddress: any): Address {
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
 * Create empty address
 */
function createEmptyAddress(): Address {
  return {
    contactName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    landmark: '',
    label: 'Home',
    isDefault: true,
  };
}

