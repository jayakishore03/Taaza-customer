/**
 * Generate Complete SQL Migration with Data
 * This creates a single SQL file with tables + data inserts
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, 'data');

// Load JSON data
function loadJSON(filename) {
  try {
    const filePath = join(dataDir, filename);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return [];
  }
}

// Escape SQL strings
function escapeSql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  // Escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Generate shops INSERT statements
function generateShopsSQL(shops) {
  if (!shops || shops.length === 0) return '';
  
  const values = shops.map(shop => {
    return `  (${escapeSql(shop.id)}, ${escapeSql(shop.name)}, ${escapeSql(shop.address)}, ${escapeSql(shop.distance)}, ${escapeSql(shop.image_url)}, ${escapeSql(shop.contact_phone)}, ${shop.latitude}, ${shop.longitude}, ${shop.is_active}, ${escapeSql(shop.created_at)}, ${escapeSql(shop.updated_at)})`;
  }).join(',\n');

  return `
-- Insert Shops
INSERT INTO shops (id, name, address, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at)
VALUES
${values}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  distance = EXCLUDED.distance,
  image_url = EXCLUDED.image_url,
  contact_phone = EXCLUDED.contact_phone,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_active = EXCLUDED.is_active,
  updated_at = now();
`;
}

// Generate products INSERT statements
function generateProductsSQL(products) {
  if (!products || products.length === 0) return '';
  
  const values = products.map(product => {
    return `  (${escapeSql(product.id)}, ${escapeSql(product.name)}, ${escapeSql(product.category)}, ${escapeSql(product.weight)}, ${product.weight_in_kg}, ${product.price}, ${product.price_per_kg}, ${escapeSql(product.original_price)}, ${escapeSql(product.discount_percentage)}, ${escapeSql(product.image_url)}, ${escapeSql(product.description)}, ${product.rating || 0}, ${product.is_available}, ${escapeSql(product.shop_id)}, ${escapeSql(product.created_at)}, ${escapeSql(product.updated_at)})`;
  }).join(',\n');

  return `
-- Insert Products
INSERT INTO products (id, name, category, weight, weight_in_kg, price, price_per_kg, original_price, discount_percentage, image_url, description, rating, is_available, shop_id, created_at, updated_at)
VALUES
${values}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  weight = EXCLUDED.weight,
  weight_in_kg = EXCLUDED.weight_in_kg,
  price = EXCLUDED.price,
  price_per_kg = EXCLUDED.price_per_kg,
  original_price = EXCLUDED.original_price,
  discount_percentage = EXCLUDED.discount_percentage,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating,
  is_available = EXCLUDED.is_available,
  shop_id = EXCLUDED.shop_id,
  updated_at = now();
`;
}

// Generate addons INSERT statements
function generateAddonsSQL(addons) {
  if (!addons || addons.length === 0) return '';
  
  const values = addons.map(addon => {
    return `  (${escapeSql(addon.id)}, ${escapeSql(addon.name)}, ${addon.price}, ${escapeSql(addon.description)}, ${addon.is_available}, ${escapeSql(addon.created_at)}, ${escapeSql(addon.updated_at)})`;
  }).join(',\n');

  return `
-- Insert Addons
INSERT INTO addons (id, name, price, description, is_available, created_at, updated_at)
VALUES
${values}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_available = EXCLUDED.is_available,
  updated_at = now();
`;
}

// Generate coupons INSERT statements
function generateCouponsSQL(coupons) {
  if (!coupons || coupons.length === 0) return '';
  
  const values = coupons.map(coupon => {
    const discountType = coupon.discount_percentage ? 'percentage' : 'fixed';
    const discountValue = coupon.discount_percentage || coupon.discount_amount || 0;
    return `  (${escapeSql(coupon.id)}, ${escapeSql(coupon.code)}, NULL, '${discountType}', ${discountValue}, ${coupon.min_order_amount || 0}, ${escapeSql(coupon.max_discount)}, ${escapeSql(coupon.valid_from)}, ${escapeSql(coupon.valid_until)}, ${escapeSql(coupon.usage_limit)}, ${coupon.usage_count || 0}, ${coupon.is_active}, ${escapeSql(coupon.created_at)}, ${escapeSql(coupon.created_at)})`;
  }).join(',\n');

  return `
-- Insert Coupons
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, is_active, created_at, updated_at)
VALUES
${values}
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  max_discount = EXCLUDED.max_discount,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  usage_limit = EXCLUDED.usage_limit,
  used_count = EXCLUDED.used_count,
  is_active = EXCLUDED.is_active,
  updated_at = now();
`;
}

// Main function
async function main() {
  console.log('📝 Generating Complete SQL Migration...\n');

  // Load data
  const shops = loadJSON('shops.json');
  const products = loadJSON('products.json');
  const addons = loadJSON('addons.json');
  const coupons = loadJSON('coupons.json');

  console.log(`   Loaded ${shops.length} shops`);
  console.log(`   Loaded ${products.length} products`);
  console.log(`   Loaded ${addons.length} addons`);
  console.log(`   Loaded ${coupons.length} coupons\n`);

  // Read base SQL
  const baseSql = readFileSync('create-and-seed-all.sql', 'utf-8');

  // Generate data inserts
  const shopsSQL = generateShopsSQL(shops);
  const productsSQL = generateProductsSQL(products);
  const addonsSQL = generateAddonsSQL(addons);
  const couponsSQL = generateCouponsSQL(coupons);

  // Combine everything
  const completeSql = `${baseSql}

-- ============================================================
-- PART 6: INSERT DATA
-- ============================================================

${shopsSQL}

${productsSQL}

${addonsSQL}

${couponsSQL}

-- Success message
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'SUCCESS: Database setup complete!';
  RAISE NOTICE 'Shops: ${shops.length} | Products: ${products.length} | Addons: ${addons.length} | Coupons: ${coupons.length}';
  RAISE NOTICE '==============================================';
END $$;
`;

  // Write to file
  writeFileSync('COMPLETE_MIGRATION.sql', completeSql, 'utf-8');

  console.log('✅ Generated: COMPLETE_MIGRATION.sql\n');
  console.log('📋 This file contains:');
  console.log('   - All table definitions');
  console.log('   - All indexes');
  console.log('   - All RLS policies');
  console.log('   - All functions and triggers');
  console.log(`   - ${shops.length} shops`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${addons.length} addons`);
  console.log(`   - ${coupons.length} coupons\n`);
  console.log('🚀 Next Step:');
  console.log('   Copy COMPLETE_MIGRATION.sql to Supabase SQL Editor and run it!');
}

main().catch(console.error);

