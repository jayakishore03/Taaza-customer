/**
 * Migration Routes
 * Endpoints to migrate data from JSON to Supabase
 */

import express from 'express';
import { supabaseAdmin } from '../config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '../../data');

// Load JSON data
function loadJSON(filename) {
  try {
    const filePath = join(dataDir, filename);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return null;
  }
}

/**
 * POST /api/migrate/all
 * Migrate all data from JSON files to database
 * Uses upsert to prevent duplicates
 */
router.post('/all', async (req, res) => {
  try {
    console.log('🚀 Starting data migration...');
    
    const results = {
      shops: { success: false, count: 0, error: null },
      products: { success: false, count: 0, error: null },
      addons: { success: false, count: 0, error: null },
      coupons: { success: false, count: 0, error: null }
    };

    // Migrate Shops
    console.log('📦 Migrating shops...');
    const shops = loadJSON('shops.json');
    if (shops && shops.length > 0) {
      const shopsToInsert = shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        address: shop.address || '',
        distance: shop.distance || null,
        image_url: shop.image_url,
        contact_phone: shop.contact_phone || null,
        latitude: shop.latitude,
        longitude: shop.longitude,
        is_active: shop.is_active !== undefined ? shop.is_active : true,
        created_at: shop.created_at || new Date().toISOString(),
        updated_at: shop.updated_at || new Date().toISOString()
      }));

      const { data, error } = await supabaseAdmin
        .from('shops')
        .upsert(shopsToInsert, { onConflict: 'id' });

      if (error) {
        results.shops.error = error.message;
        console.error('❌ Shops error:', error.message);
      } else {
        results.shops.success = true;
        results.shops.count = shopsToInsert.length;
        console.log(`✅ Migrated ${shopsToInsert.length} shops`);
      }
    }

    // Migrate Products
    console.log('📦 Migrating products...');
    const products = loadJSON('products.json');
    if (products && products.length > 0) {
      const productsToInsert = products.map(product => ({
        id: product.id.toString(),
        name: product.name,
        category: product.category,
        weight: product.weight || null,
        weight_in_kg: product.weight_in_kg || 1.0,
        price: product.price,
        price_per_kg: product.price_per_kg || product.price,
        original_price: product.original_price || null,
        discount_percentage: product.discount_percentage || 0,
        image_url: product.image_url,
        description: product.description || '',
        rating: product.rating || 0.0,
        is_available: product.is_available !== undefined ? product.is_available : true,
        shop_id: product.shop_id || null,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString()
      }));

      // Insert in batches to avoid payload size limits
      const batchSize = 25;
      let totalInserted = 0;
      
      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize);
        const { error } = await supabaseAdmin
          .from('products')
          .upsert(batch, { onConflict: 'id' });

        if (error) {
          results.products.error = error.message;
          console.error(`❌ Products batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
          break;
        }
        totalInserted += batch.length;
        console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products`);
      }

      if (!results.products.error) {
        results.products.success = true;
        results.products.count = totalInserted;
        console.log(`✅ Migrated ${totalInserted} products`);
      }
    }

    // Migrate Addons
    console.log('📦 Migrating addons...');
    const addons = loadJSON('addons.json');
    if (addons && addons.length > 0) {
      const addonsToInsert = addons.map(addon => ({
        id: addon.id || undefined,
        name: addon.name,
        price: addon.price,
        description: addon.description || null,
        is_available: addon.is_available !== undefined ? addon.is_available : true,
        created_at: addon.created_at || new Date().toISOString(),
        updated_at: addon.updated_at || new Date().toISOString()
      }));

      const { data, error } = await supabaseAdmin
        .from('addons')
        .upsert(addonsToInsert, { onConflict: 'id' });

      if (error) {
        results.addons.error = error.message;
        console.error('❌ Addons error:', error.message);
      } else {
        results.addons.success = true;
        results.addons.count = addonsToInsert.length;
        console.log(`✅ Migrated ${addonsToInsert.length} addons`);
      }
    }

    // Migrate Coupons
    console.log('📦 Migrating coupons...');
    const coupons = loadJSON('coupons.json');
    if (coupons && coupons.length > 0) {
      const couponsToInsert = coupons.map(coupon => ({
        id: coupon.id || undefined,
        code: coupon.code,
        description: coupon.description || null,
        discount_type: coupon.discount_percentage ? 'percentage' : 'fixed',
        discount_value: coupon.discount_percentage || coupon.discount_amount || 0,
        min_order_amount: coupon.min_order_amount || 0,
        max_discount: coupon.max_discount || null,
        valid_from: coupon.valid_from || new Date().toISOString(),
        valid_until: coupon.valid_until || null,
        usage_limit: coupon.usage_limit || null,
        used_count: coupon.usage_count || 0,
        is_active: coupon.is_active !== undefined ? coupon.is_active : true,
        created_at: coupon.created_at || new Date().toISOString(),
        updated_at: coupon.updated_at || new Date().toISOString()
      }));

      const { data, error } = await supabaseAdmin
        .from('coupons')
        .upsert(couponsToInsert, { onConflict: 'code' });

      if (error) {
        results.coupons.error = error.message;
        console.error('❌ Coupons error:', error.message);
      } else {
        results.coupons.success = true;
        results.coupons.count = couponsToInsert.length;
        console.log(`✅ Migrated ${couponsToInsert.length} coupons`);
      }
    }

    // Calculate totals
    const totalSuccess = Object.values(results).filter(r => r.success).length;
    const totalRecords = Object.values(results).reduce((sum, r) => sum + r.count, 0);
    const allSuccess = totalSuccess === 4;

    console.log(`\n✅ Migration complete: ${totalRecords} records migrated`);

    res.status(allSuccess ? 200 : 207).json({
      success: allSuccess,
      message: allSuccess 
        ? 'All data migrated successfully!' 
        : 'Some data migrations failed',
      totalRecords,
      results,
      summary: {
        shops: `${results.shops.count} migrated`,
        products: `${results.products.count} migrated`,
        addons: `${results.addons.count} migrated`,
        coupons: `${results.coupons.count} migrated`
      }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

/**
 * GET /api/migrate/status
 * Check migration status - how many records exist
 */
router.get('/status', async (req, res) => {
  try {
    const status = {};

    // Check shops
    const { count: shopsCount, error: shopsError } = await supabaseAdmin
      .from('shops')
      .select('*', { count: 'exact', head: true });
    
    status.shops = {
      count: shopsCount || 0,
      exists: !shopsError,
      error: shopsError?.message || null
    };

    // Check products
    const { count: productsCount, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    status.products = {
      count: productsCount || 0,
      exists: !productsError,
      error: productsError?.message || null
    };

    // Check addons
    const { count: addonsCount, error: addonsError } = await supabaseAdmin
      .from('addons')
      .select('*', { count: 'exact', head: true });
    
    status.addons = {
      count: addonsCount || 0,
      exists: !addonsError,
      error: addonsError?.message || null
    };

    // Check coupons
    const { count: couponsCount, error: couponsError } = await supabaseAdmin
      .from('coupons')
      .select('*', { count: 'exact', head: true });
    
    status.coupons = {
      count: couponsCount || 0,
      exists: !couponsError,
      error: couponsError?.message || null
    };

    const totalRecords = (shopsCount || 0) + (productsCount || 0) + (addonsCount || 0) + (couponsCount || 0);
    const allTablesExist = status.shops.exists && status.products.exists && status.addons.exists && status.coupons.exists;

    res.json({
      success: true,
      totalRecords,
      allTablesExist,
      status,
      message: allTablesExist 
        ? (totalRecords > 0 ? `Database has ${totalRecords} records` : 'Tables exist but no data yet')
        : 'Some tables are missing - please create them first'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking status',
      error: error.message
    });
  }
});

export default router;

