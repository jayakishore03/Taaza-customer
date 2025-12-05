/**
 * Reference Data Migration Routes
 * For test/development data (users, orders, etc.)
 * Note: These tables have foreign keys to auth.users which may not exist
 */

import express from 'express';
import { query } from '../config/postgres.js';
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
 * POST /api/migrate-reference/all
 * Load reference/test data (users, orders, etc.)
 * WARNING: This disables foreign key constraints temporarily
 */
router.post('/all', async (req, res) => {
  try {
    console.log('🚀 Starting reference data migration...');
    console.log('⚠️  This will temporarily disable foreign key checks');
    
    const results = {
      user_profiles: { success: false, count: 0, error: null },
      addresses: { success: false, count: 0, error: null },
      orders: { success: false, count: 0, error: null },
      order_items: { success: false, count: 0, error: null },
      order_timeline: { success: false, count: 0, error: null }
    };

    // Temporarily disable triggers (as workaround for FK constraints)
    console.log('Disabling triggers temporarily...');
    await query('SET session_replication_role = replica');

    try {
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
                [profile.id, profile.name, profile.email, profile.phone, profile.profile_picture || null, 
                 profile.created_at || new Date().toISOString(), profile.updated_at || new Date().toISOString()]
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

    } finally {
      // Re-enable triggers
      console.log('Re-enabling triggers...');
      await query('SET session_replication_role = DEFAULT');
    }

    const totalRecords = Object.values(results).reduce((sum, r) => sum + r.count, 0);
    const allSuccess = Object.values(results).every(r => r.success);

    res.json({
      success: allSuccess,
      message: allSuccess 
        ? 'All reference data migrated successfully!' 
        : 'Some reference data migrations failed',
      totalRecords,
      results,
      note: 'This is test/development data. In production, users will be created through Supabase Auth.'
    });

  } catch (error) {
    console.error('❌ Reference data migration error:', error);
    // Make sure to re-enable triggers even on error
    try {
      await query('SET session_replication_role = DEFAULT');
    } catch (e) {
      console.error('Error re-enabling triggers:', e);
    }
    res.status(500).json({
      success: false,
      message: 'Reference data migration failed',
      error: error.message
    });
  }
});

export default router;

