/**
 * Shop Service
 * Handles all shop-related database operations
 */

import { supabase } from '../supabase';
import type { Shop } from '../../data/dummyData';

export interface ShopFromDB {
  id: string;
  name: string;
  address: string;
  distance: string | null;
  image_url: string;
  contact_phone: string | null;
  is_active: boolean;
}

/**
 * Convert database shop to app Shop type
 */
function dbShopToAppShop(dbShop: ShopFromDB): Shop {
  return {
    id: dbShop.id,
    name: dbShop.name,
    address: dbShop.address,
    distance: dbShop.distance || '0 km',
    image: dbShop.image_url,
  };
}

/**
 * Get all active shops
 */
export async function getAllShops(): Promise<Shop[]> {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shops:', error);
    throw error;
  }

  return (data || []).map(dbShopToAppShop);
}

/**
 * Get shop by ID
 */
export async function getShopById(id: string): Promise<Shop | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching shop:', error);
    throw error;
  }

  return data ? dbShopToAppShop(data) : null;
}

