/**
 * Shops Controller
 */

import { supabase } from '../config/database.js';

/**
 * Shop address mapping (based on coordinates)
 * This mapping is used to return addresses to frontend
 * Addresses are not stored in database, only coordinates are stored
 */
const SHOP_ADDRESSES = {
  'shop-1': 'Benz Circle, Vijayawada, Andhra Pradesh',
  'shop-2': 'Patamata, Vijayawada, Andhra Pradesh - 520010',
  'shop-3': 'Kanaka Durga Varadhi, National Highway 65, Krishna Lanka, Vijayawada, Andhra Pradesh - 520013',
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Format distance for display
 */
function formatDistance(distanceInKm) {
  if (distanceInKm < 1) {
    return `${(distanceInKm * 1000).toFixed(0)} m`;
  }
  return `${distanceInKm.toFixed(2)} km`;
}

/**
 * Format shop for response
 */
function formatShop(dbShop, userLat = null, userLon = null) {
  let distance = dbShop.distance || '0 km';
  
  // Calculate distance if user location and shop coordinates are available
  if (userLat !== null && userLon !== null && dbShop.latitude !== null && dbShop.longitude !== null) {
    const distanceInKm = calculateDistance(userLat, userLon, dbShop.latitude, dbShop.longitude);
    distance = formatDistance(distanceInKm);
  }
  
  return {
    id: dbShop.id,
    name: dbShop.name,
    address: SHOP_ADDRESSES[dbShop.id] || 'Address not available',
    distance,
    image: dbShop.image_url,
    latitude: dbShop.latitude,
    longitude: dbShop.longitude,
  };
}

/**
 * Get all shops
 * GET /api/shops?lat=latitude&lon=longitude
 */
export const getAllShops = async (req, res, next) => {
  try {
    // Get user location from query parameters (optional)
    const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const userLon = req.query.lon ? parseFloat(req.query.lon) : null;

    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    // Format shops with distance calculation
    let shops = (data || []).map(shop => formatShop(shop, userLat, userLon));

    // Sort by distance if user location is provided
    if (userLat !== null && userLon !== null) {
      shops.sort((a, b) => {
        // Extract numeric distance for sorting
        const getDistanceValue = (distanceStr) => {
          if (!distanceStr) return Infinity;
          if (distanceStr.includes('m')) {
            return parseFloat(distanceStr.replace(' m', '')) / 1000; // Convert meters to km
          }
          if (distanceStr.includes('km')) {
            return parseFloat(distanceStr.replace(' km', ''));
          }
          return parseFloat(distanceStr) || Infinity;
        };
        return getDistanceValue(a.distance) - getDistanceValue(b.distance);
      });
    } else {
      // Default sorting by created_at if no location
      // Note: created_at is not in the formatted shop, so we'll keep original order
    }

    res.json({
      success: true,
      data: shops,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shop by ID
 * GET /api/shops/:id
 */
/**
 * Get shop by ID
 * GET /api/shops/:id?lat=latitude&lon=longitude
 */
export const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get user location from query parameters (optional)
    const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const userLon = req.query.lon ? parseFloat(req.query.lon) : null;

    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Shop not found' },
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: formatShop(data, userLat, userLon),
    });
  } catch (error) {
    next(error);
  }
};

