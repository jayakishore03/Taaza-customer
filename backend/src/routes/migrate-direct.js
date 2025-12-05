/**
 * Direct PostgreSQL Migration Routes
 * Uses pg package for direct database access
 * Bypasses Supabase REST API - works perfectly with Vercel
 */

import express from 'express';
import pool, { query, transaction } from '../config/postgres.js';
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
 * POST /api/migrate-direct/create-tables
 * Create all database tables
 */
router.post('/create-tables', async (req, res) => {
  try {
    console.log('📦 Creating database tables...');
    
    const sqlPath = join(__dirname, '../../../supabase/migrations/000_create_tables_simple.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Execute SQL using direct connection
    await query(sql);
    
    console.log('✅ Tables created successfully');
    
    res.json({
      success: true,
      message: 'All tables created successfully!'
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tables',
      error: error.message
    });
  }
});

/**
 * POST /api/migrate-direct/load-data
 * Load all data from JSON files using direct SQL
 */
router.post('/load-data', async (req, res) => {
  try {
    console.log('🚀 Starting data migration (direct PostgreSQL)...');
    
    const results = {
      shops: { success: false, count: 0, error: null },
      products: { success: false, count: 0, error: null },
      addons: { success: false, count: 0, error: null },
      coupons: { success: false, count: 0, error: null },
      user_profiles: { success: false, count: 0, error: null },
      addresses: { success: false, count: 0, error: null },
      orders: { success: false, count: 0, error: null },
      order_items: { success: false, count: 0, error: null },
      order_timeline: { success: false, count: 0, error: null }
    };

    // Migrate Shops
    console.log('📦 Migrating shops...');
    const shops = loadJSON('shops.json');
    if (shops && shops.length > 0) {
      try {
        for (const shop of shops) {
          await query(
            `INSERT INTO shops (id, name, address, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               address = EXCLUDED.address,
               distance = EXCLUDED.distance,
               image_url = EXCLUDED.image_url,
               contact_phone = EXCLUDED.contact_phone,
               latitude = EXCLUDED.latitude,
               longitude = EXCLUDED.longitude,
               is_active = EXCLUDED.is_active,
               updated_at = now()`,
            [
              shop.id,
              shop.name,
              shop.address || '',
              shop.distance || null,
              shop.image_url,
              shop.contact_phone || null,
              shop.latitude,
              shop.longitude,
              shop.is_active !== undefined ? shop.is_active : true,
              shop.created_at || new Date().toISOString(),
              shop.updated_at || new Date().toISOString()
            ]
          );
        }
        results.shops.success = true;
        results.shops.count = shops.length;
        console.log(`✅ Migrated ${shops.length} shops`);
      } catch (error) {
        results.shops.error = error.message;
        console.error('❌ Shops error:', error.message);
      }
    }

    // Migrate Products
    console.log('📦 Migrating products...');
    const products = loadJSON('products.json');
    if (products && products.length > 0) {
      try {
        for (const product of products) {
          await query(
            `INSERT INTO products (id, name, category, weight, weight_in_kg, price, price_per_kg, original_price, discount_percentage, image_url, description, rating, is_available, shop_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
               updated_at = now()`,
            [
              product.id.toString(),
              product.name,
              product.category,
              product.weight || null,
              product.weight_in_kg || 1.0,
              product.price,
              product.price_per_kg || product.price,
              product.original_price || null,
              product.discount_percentage || 0,
              product.image_url,
              product.description || '',
              product.rating || 0.0,
              product.is_available !== undefined ? product.is_available : true,
              product.shop_id || null,
              product.created_at || new Date().toISOString(),
              product.updated_at || new Date().toISOString()
            ]
          );
        }
        results.products.success = true;
        results.products.count = products.length;
        console.log(`✅ Migrated ${products.length} products`);
      } catch (error) {
        results.products.error = error.message;
        console.error('❌ Products error:', error.message);
      }
    }

    // Migrate Addons
    console.log('📦 Migrating addons...');
    const addons = loadJSON('addons.json');
    if (addons && addons.length > 0) {
      try {
        for (const addon of addons) {
          // Check if addon with this name already exists
          const checkResult = await query(
            'SELECT id FROM addons WHERE name = $1',
            [addon.name]
          );
          
          if (checkResult.rows.length > 0) {
            // Update existing addon
            await query(
              `UPDATE addons 
               SET price = $1, description = $2, is_available = $3, updated_at = now()
               WHERE name = $4`,
              [
                addon.price,
                addon.description || null,
                addon.is_available !== undefined ? addon.is_available : true,
                addon.name
              ]
            );
          } else {
            // Insert new addon
            await query(
              `INSERT INTO addons (name, price, description, is_available, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                addon.name,
                addon.price,
                addon.description || null,
                addon.is_available !== undefined ? addon.is_available : true,
                addon.created_at || new Date().toISOString(),
                addon.updated_at || new Date().toISOString()
              ]
            );
          }
        }
        results.addons.success = true;
        results.addons.count = addons.length;
        console.log(`✅ Migrated ${addons.length} addons`);
      } catch (error) {
        results.addons.error = error.message;
        console.error('❌ Addons error:', error.message);
      }
    }

    // Migrate Coupons
    console.log('📦 Migrating coupons...');
    const coupons = loadJSON('coupons.json');
    if (coupons && coupons.length > 0) {
      try {
        for (const coupon of coupons) {
          const discountType = coupon.discount_percentage ? 'percentage' : 'fixed';
          const discountValue = coupon.discount_percentage || coupon.discount_amount || 0;
          
          // Let PostgreSQL generate UUID, don't use string ID
          await query(
            `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
               updated_at = now()`,
            [
              coupon.code,
              coupon.description || null,
              discountType,
              discountValue,
              coupon.min_order_amount || 0,
              coupon.max_discount || null,
              coupon.valid_from || new Date().toISOString(),
              coupon.valid_until || null,
              coupon.usage_limit || null,
              coupon.usage_count || 0,
              coupon.is_active !== undefined ? coupon.is_active : true,
              coupon.created_at || new Date().toISOString(),
              coupon.updated_at || new Date().toISOString()
            ]
          );
        }
        results.coupons.success = true;
        results.coupons.count = coupons.length;
        console.log(`✅ Migrated ${coupons.length} coupons`);
      } catch (error) {
        results.coupons.error = error.message;
        console.error('❌ Coupons error:', error.message);
      }
    }

    // Migrate User Profiles
    console.log('📦 Migrating user profiles...');
    const userProfiles = loadJSON('user_profiles.json');
    if (userProfiles && userProfiles.length > 0) {
      try {
        for (const profile of userProfiles) {
          const checkResult = await query('SELECT id FROM user_profiles WHERE id = $1', [profile.id]);
          
          if (checkResult.rows.length > 0) {
            await query(
              `UPDATE user_profiles 
               SET name = $1, email = $2, phone = $3, profile_picture = $4, updated_at = now()
               WHERE id = $5`,
              [profile.name, profile.email, profile.phone, profile.profile_picture || null, profile.id]
            );
          } else {
            await query(
              `INSERT INTO user_profiles (id, name, email, phone, profile_picture, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [profile.id, profile.name, profile.email, profile.phone, profile.profile_picture || null, profile.created_at || new Date().toISOString(), profile.updated_at || new Date().toISOString()]
            );
          }
        }
        results.user_profiles.success = true;
        results.user_profiles.count = userProfiles.length;
        console.log(`✅ Migrated ${userProfiles.length} user profiles`);
      } catch (error) {
        results.user_profiles.error = error.message;
        console.error('❌ User profiles error:', error.message);
      }
    }

    // Migrate Addresses
    console.log('📦 Migrating addresses...');
    const addresses = loadJSON('addresses.json');
    if (addresses && addresses.length > 0) {
      try {
        for (const address of addresses) {
          const checkResult = await query('SELECT id FROM addresses WHERE id = $1', [address.id]);
          
          if (checkResult.rows.length > 0) {
            await query(
              `UPDATE addresses 
               SET user_id = $1, contact_name = $2, phone = $3, street = $4, city = $5, 
                   state = $6, postal_code = $7, landmark = $8, label = $9, is_default = $10, updated_at = now()
               WHERE id = $11`,
              [address.user_id, address.contact_name, address.phone, address.street, address.city, 
               address.state, address.postal_code, address.landmark || null, address.label || 'Home', 
               address.is_default || false, address.id]
            );
          } else {
            await query(
              `INSERT INTO addresses (id, user_id, contact_name, phone, street, city, state, postal_code, landmark, label, is_default, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [address.id, address.user_id, address.contact_name, address.phone, address.street, address.city, 
               address.state, address.postal_code, address.landmark || null, address.label || 'Home', 
               address.is_default || false, address.created_at || new Date().toISOString(), address.updated_at || new Date().toISOString()]
            );
          }
        }
        results.addresses.success = true;
        results.addresses.count = addresses.length;
        console.log(`✅ Migrated ${addresses.length} addresses`);
      } catch (error) {
        results.addresses.error = error.message;
        console.error('❌ Addresses error:', error.message);
      }
    }

    // Migrate Orders
    console.log('📦 Migrating orders...');
    const orders = loadJSON('orders.json');
    if (orders && orders.length > 0) {
      try {
        for (const order of orders) {
          const checkResult = await query('SELECT id FROM orders WHERE id = $1', [order.id]);
          
          if (checkResult.rows.length > 0) {
            await query(
              `UPDATE orders 
               SET user_id = $1, shop_id = $2, address_id = $3, order_number = $4, subtotal = $5,
                   delivery_charge = $6, discount = $7, coupon_id = $8, total = $9, status = $10,
                   status_note = $11, payment_method_text = $12, otp = $13, updated_at = now()
               WHERE id = $14`,
              [order.user_id, order.shop_id, order.address_id, order.order_number, order.subtotal,
               order.delivery_charge || 0, order.discount || 0, order.coupon_id, order.total, order.status || 'Preparing',
               order.status_note, order.payment_method_text || 'Cash on Delivery', order.otp, order.id]
            );
          } else {
            await query(
              `INSERT INTO orders (id, user_id, shop_id, address_id, order_number, subtotal, delivery_charge, discount, coupon_id, total, status, status_note, payment_method_text, otp, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
              [order.id, order.user_id, order.shop_id, order.address_id, order.order_number, order.subtotal,
               order.delivery_charge || 0, order.discount || 0, order.coupon_id, order.total, order.status || 'Preparing',
               order.status_note, order.payment_method_text || 'Cash on Delivery', order.otp, 
               order.created_at || new Date().toISOString(), order.updated_at || new Date().toISOString()]
            );
          }
        }
        results.orders.success = true;
        results.orders.count = orders.length;
        console.log(`✅ Migrated ${orders.length} orders`);
      } catch (error) {
        results.orders.error = error.message;
        console.error('❌ Orders error:', error.message);
      }
    }

    // Migrate Order Items
    console.log('📦 Migrating order items...');
    const orderItems = loadJSON('order_items.json');
    if (orderItems && orderItems.length > 0) {
      try {
        for (const item of orderItems) {
          const checkResult = await query('SELECT id FROM order_items WHERE id = $1', [item.id]);
          
          if (checkResult.rows.length > 0) {
            await query(
              `UPDATE order_items 
               SET order_id = $1, product_id = $2, addon_id = $3, name = $4, quantity = $5,
                   weight = $6, weight_in_kg = $7, price = $8, price_per_kg = $9, image_url = $10
               WHERE id = $11`,
              [item.order_id, item.product_id, item.addon_id, item.name, item.quantity,
               item.weight, item.weight_in_kg, item.price, item.price_per_kg, item.image_url, item.id]
            );
          } else {
            await query(
              `INSERT INTO order_items (id, order_id, product_id, addon_id, name, quantity, weight, weight_in_kg, price, price_per_kg, image_url, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [item.id, item.order_id, item.product_id, item.addon_id, item.name, item.quantity,
               item.weight, item.weight_in_kg, item.price, item.price_per_kg, item.image_url, 
               item.created_at || new Date().toISOString()]
            );
          }
        }
        results.order_items.success = true;
        results.order_items.count = orderItems.length;
        console.log(`✅ Migrated ${orderItems.length} order items`);
      } catch (error) {
        results.order_items.error = error.message;
        console.error('❌ Order items error:', error.message);
      }
    }

    // Migrate Order Timeline
    console.log('📦 Migrating order timeline...');
    const orderTimeline = loadJSON('order_timeline.json');
    if (orderTimeline && orderTimeline.length > 0) {
      try {
        for (const timeline of orderTimeline) {
          const checkResult = await query('SELECT id FROM order_timeline WHERE id = $1', [timeline.id]);
          
          if (checkResult.rows.length > 0) {
            await query(
              `UPDATE order_timeline 
               SET order_id = $1, stage = $2, description = $3, is_completed = $4, timestamp = $5
               WHERE id = $6`,
              [timeline.order_id, timeline.stage, timeline.description, timeline.is_completed || false, 
               timeline.timestamp || new Date().toISOString(), timeline.id]
            );
          } else {
            await query(
              `INSERT INTO order_timeline (id, order_id, stage, description, is_completed, timestamp, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [timeline.id, timeline.order_id, timeline.stage, timeline.description, timeline.is_completed || false,
               timeline.timestamp || new Date().toISOString(), timeline.created_at || new Date().toISOString()]
            );
          }
        }
        results.order_timeline.success = true;
        results.order_timeline.count = orderTimeline.length;
        console.log(`✅ Migrated ${orderTimeline.length} order timeline entries`);
      } catch (error) {
        results.order_timeline.error = error.message;
        console.error('❌ Order timeline error:', error.message);
      }
    }

    // Calculate totals
    const totalSuccess = Object.values(results).filter(r => r.success).length;
    const totalRecords = Object.values(results).reduce((sum, r) => sum + r.count, 0);
    const allSuccess = totalSuccess === Object.keys(results).length;

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
        coupons: `${results.coupons.count} migrated`,
        user_profiles: `${results.user_profiles.count} migrated`,
        addresses: `${results.addresses.count} migrated`,
        orders: `${results.orders.count} migrated`,
        order_items: `${results.order_items.count} migrated`,
        order_timeline: `${results.order_timeline.count} migrated`
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
 * GET /api/migrate-direct/status
 * Check migration status using direct SQL
 */
router.get('/status', async (req, res) => {
  try {
    const status = {};

    // Check shops
    const shopsResult = await query('SELECT COUNT(*) FROM shops');
    status.shops = {
      count: parseInt(shopsResult.rows[0].count),
      exists: true
    };

    // Check products
    const productsResult = await query('SELECT COUNT(*) FROM products');
    status.products = {
      count: parseInt(productsResult.rows[0].count),
      exists: true
    };

    // Check addons
    const addonsResult = await query('SELECT COUNT(*) FROM addons');
    status.addons = {
      count: parseInt(addonsResult.rows[0].count),
      exists: true
    };

    // Check coupons
    const couponsResult = await query('SELECT COUNT(*) FROM coupons');
    status.coupons = {
      count: parseInt(couponsResult.rows[0].count),
      exists: true
    };

    // Check user profiles
    const userProfilesResult = await query('SELECT COUNT(*) FROM user_profiles');
    status.user_profiles = {
      count: parseInt(userProfilesResult.rows[0].count),
      exists: true
    };

    // Check addresses
    const addressesResult = await query('SELECT COUNT(*) FROM addresses');
    status.addresses = {
      count: parseInt(addressesResult.rows[0].count),
      exists: true
    };

    // Check orders
    const ordersResult = await query('SELECT COUNT(*) FROM orders');
    status.orders = {
      count: parseInt(ordersResult.rows[0].count),
      exists: true
    };

    // Check order items
    const orderItemsResult = await query('SELECT COUNT(*) FROM order_items');
    status.order_items = {
      count: parseInt(orderItemsResult.rows[0].count),
      exists: true
    };

    // Check order timeline
    const orderTimelineResult = await query('SELECT COUNT(*) FROM order_timeline');
    status.order_timeline = {
      count: parseInt(orderTimelineResult.rows[0].count),
      exists: true
    };

    const totalRecords = status.shops.count + status.products.count + status.addons.count + status.coupons.count + 
                         status.user_profiles.count + status.addresses.count + status.orders.count + 
                         status.order_items.count + status.order_timeline.count;

    res.json({
      success: true,
      totalRecords,
      allTablesExist: true,
      status,
      message: totalRecords > 0 ? `Database has ${totalRecords} records` : 'Tables exist but no data yet'
    });

  } catch (error) {
    // If error, tables might not exist
    res.json({
      success: false,
      totalRecords: 0,
      allTablesExist: false,
      message: 'Tables do not exist yet. Run POST /api/migrate-direct/create-tables first',
      error: error.message
    });
  }
});

/**
 * POST /api/migrate-direct/all
 * Create tables AND load data in one go
 */
router.post('/all', async (req, res) => {
  try {
    console.log('🚀 Running complete migration (tables + data)...');
    
    // Step 1: Create tables
    console.log('Step 1: Creating tables...');
    const sqlPath = join(__dirname, '../../../supabase/migrations/000_create_tables_simple.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    try {
      await query(sql);
      console.log('✅ Tables created');
    } catch (error) {
      // Tables might already exist, that's okay
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('✅ Tables already exist');
    }
    
    // Step 2: Load data (reuse the load-data logic)
    console.log('Step 2: Loading data...');
    
    const results = {
      shops: { success: false, count: 0, error: null },
      products: { success: false, count: 0, error: null },
      addons: { success: false, count: 0, error: null },
      coupons: { success: false, count: 0, error: null }
    };

    // Load shops
    const shops = loadJSON('shops.json');
    if (shops && shops.length > 0) {
      try {
        for (const shop of shops) {
          await query(
            `INSERT INTO shops (id, name, address, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now()`,
            [shop.id, shop.name, shop.address || '', shop.distance || null, shop.image_url, shop.contact_phone || null, shop.latitude, shop.longitude, shop.is_active !== undefined ? shop.is_active : true, shop.created_at || new Date().toISOString(), shop.updated_at || new Date().toISOString()]
          );
        }
        results.shops.success = true;
        results.shops.count = shops.length;
        console.log(`✅ ${shops.length} shops`);
      } catch (error) {
        results.shops.error = error.message;
      }
    }

    // Load products
    const products = loadJSON('products.json');
    if (products && products.length > 0) {
      try {
        for (const product of products) {
          await query(
            `INSERT INTO products (id, name, category, weight, weight_in_kg, price, price_per_kg, original_price, discount_percentage, image_url, description, rating, is_available, shop_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, updated_at = now()`,
            [product.id.toString(), product.name, product.category, product.weight || null, product.weight_in_kg || 1.0, product.price, product.price_per_kg || product.price, product.original_price || null, product.discount_percentage || 0, product.image_url, product.description || '', product.rating || 0.0, product.is_available !== undefined ? product.is_available : true, product.shop_id || null, product.created_at || new Date().toISOString(), product.updated_at || new Date().toISOString()]
          );
        }
        results.products.success = true;
        results.products.count = products.length;
        console.log(`✅ ${products.length} products`);
      } catch (error) {
        results.products.error = error.message;
      }
    }

    // Load addons
    const addons = loadJSON('addons.json');
    if (addons && addons.length > 0) {
      try {
        for (const addon of addons) {
          await query(
            `INSERT INTO addons (id, name, price, description, is_available, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, updated_at = now()`,
            [addon.id, addon.name, addon.price, addon.description || null, addon.is_available !== undefined ? addon.is_available : true, addon.created_at || new Date().toISOString(), addon.updated_at || new Date().toISOString()]
          );
        }
        results.addons.success = true;
        results.addons.count = addons.length;
        console.log(`✅ ${addons.length} addons`);
      } catch (error) {
        results.addons.error = error.message;
      }
    }

    // Load coupons
    const coupons = loadJSON('coupons.json');
    if (coupons && coupons.length > 0) {
      try {
        for (const coupon of coupons) {
          const discountType = coupon.discount_percentage ? 'percentage' : 'fixed';
          const discountValue = coupon.discount_percentage || coupon.discount_amount || 0;
          await query(
            `INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (code) DO UPDATE SET discount_value = EXCLUDED.discount_value, updated_at = now()`,
            [coupon.id, coupon.code, coupon.description || null, discountType, discountValue, coupon.min_order_amount || 0, coupon.max_discount || null, coupon.valid_from || new Date().toISOString(), coupon.valid_until || null, coupon.usage_limit || null, coupon.usage_count || 0, coupon.is_active !== undefined ? coupon.is_active : true, coupon.created_at || new Date().toISOString(), coupon.updated_at || new Date().toISOString()]
          );
        }
        results.coupons.success = true;
        results.coupons.count = coupons.length;
        console.log(`✅ ${coupons.length} coupons`);
      } catch (error) {
        results.coupons.error = error.message;
      }
    }

    const totalRecords = Object.values(results).reduce((sum, r) => sum + r.count, 0);
    const allSuccess = Object.values(results).every(r => r.success);

    res.json({
      success: allSuccess,
      message: allSuccess ? 'Complete migration successful!' : 'Migration completed with some errors',
      totalRecords,
      results
    });

  } catch (error) {
    console.error('❌ Complete migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Complete migration failed',
      error: error.message
    });
  }
});

export default router;

