/**
 * Addon Service
 * Handles all addon-related database operations
 */

import { supabase } from '../supabase';
import type { AddOn } from '../../data/dummyData';

export interface AddonFromDB {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_available: boolean;
}

/**
 * Convert database addon to app AddOn type
 */
function dbAddonToAppAddon(dbAddon: AddonFromDB): AddOn {
  return {
    id: parseInt(dbAddon.id.replace(/-/g, '').substring(0, 8), 16) || 0, // Convert UUID to number for compatibility
    name: dbAddon.name,
    price: dbAddon.price,
    selected: false,
  };
}

/**
 * Get all available addons
 */
export async function getAllAddons(): Promise<AddOn[]> {
  const { data, error } = await supabase
    .from('addons')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching addons:', error);
    throw error;
  }

  return (data || []).map(dbAddonToAppAddon);
}

/**
 * Get addon by ID
 */
export async function getAddonById(id: string): Promise<AddOn | null> {
  const { data, error } = await supabase
    .from('addons')
    .select('*')
    .eq('id', id)
    .eq('is_available', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching addon:', error);
    throw error;
  }

  return data ? dbAddonToAppAddon(data) : null;
}

