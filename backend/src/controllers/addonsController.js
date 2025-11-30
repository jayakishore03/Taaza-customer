/**
 * Addons Controller
 */

import { supabase } from '../config/database.js';


/**
 * Format addon for response
 */
function formatAddon(dbAddon) {
  return {
    id: parseInt(dbAddon.id.replace(/-/g, '').substring(0, 8), 16) || 0,
    name: dbAddon.name,
    price: dbAddon.price,
    selected: false,
  };
}

/**
 * Get all addons
 * GET /api/addons
 */
export const getAllAddons = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: (data || []).map(formatAddon),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get addon by ID
 * GET /api/addons/:id
 */
export const getAddonById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .eq('id', id)
      .eq('is_available', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Addon not found' },
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: formatAddon(data),
    });
  } catch (error) {
    next(error);
  }
};

