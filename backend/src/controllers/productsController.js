/**
 * Products Controller
 */

import { supabase } from '../config/database.js';

/**
 * Convert database product to app format
 */
function formatProduct(dbProduct, req = null) {
  // Convert relative image URLs to absolute URLs
  let imageUrl = dbProduct.image_url;
  if (imageUrl && imageUrl.startsWith('/images/')) {
    // Get base URL from request or use default
    let baseUrl = 'http://192.168.0.5:3000';
    if (req) {
      const protocol = req.protocol || 'http';
      const host = req.get('host') || '192.168.0.5:3000';
      baseUrl = `${protocol}://${host}`;
    }
    imageUrl = `${baseUrl}${imageUrl}`;
  }
  
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category,
    weight: dbProduct.weight || '',
    weightInKg: dbProduct.weight_in_kg,
    price: dbProduct.price,
    pricePerKg: dbProduct.price_per_kg,
    image: imageUrl,
    description: dbProduct.description,
    originalPrice: dbProduct.original_price || undefined,
    discountPercentage: dbProduct.discount_percentage || undefined,
  };
}

/**
 * Get all products
 * GET /api/products
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const { category, shopId, search } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_available', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: (data || []).map(product => formatProduct(product, req)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_available', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Product not found' },
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: formatProduct(data, req),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by category
 * GET /api/products/category/:category
 */
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: (data || []).map(product => formatProduct(product, req)),
    });
  } catch (error) {
    next(error);
  }
};

