/**
 * Product Service
 * Handles all product-related database operations
 */

import { supabase } from '../supabase';
import type { Product } from '../../data/dummyData';

export interface ProductFromDB {
  id: string;
  name: string;
  category: string;
  weight: string | null;
  weight_in_kg: number;
  price: number;
  price_per_kg: number;
  original_price: number | null;
  discount_percentage: number;
  image_url: string;
  description: string;
  rating: number;
  is_available: boolean;
  shop_id: string | null;
}

/**
 * Convert database product to app Product type
 */
export function dbProductToAppProduct(dbProduct: ProductFromDB): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category,
    weight: dbProduct.weight || '',
    weightInKg: dbProduct.weight_in_kg,
    price: dbProduct.price,
    pricePerKg: dbProduct.price_per_kg,
    image: dbProduct.image_url,
    description: dbProduct.description,
    originalPrice: dbProduct.original_price || undefined,
    discountPercentage: dbProduct.discount_percentage || undefined,
  };
}

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  return (data || []).map(dbProductToAppProduct);
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }

  return (data || []).map(dbProductToAppProduct);
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_available', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching product:', error);
    throw error;
  }

  return data ? dbProductToAppProduct(data) : null;
}

/**
 * Get products by shop ID
 */
export async function getProductsByShop(shopId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by shop:', error);
    throw error;
  }

  return (data || []).map(dbProductToAppProduct);
}

/**
 * Search products by name
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching products:', error);
    throw error;
  }

  return (data || []).map(dbProductToAppProduct);
}

