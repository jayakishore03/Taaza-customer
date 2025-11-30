/**
 * Migration Script
 * Migrates data from JSON files to SQLite database
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDatabase } from '../config/init-database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(__dirname, '../../database.db');

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function readJSONFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

function migrateData() {
  console.log('🔄 Starting migration from JSON to SQLite...\n');

  // Initialize database
  initDatabase();
  const db = new Database(DB_PATH);

  try {
    // Migrate shops
    console.log('Migrating shops...');
    const shops = readJSONFile('shops.json');
    const insertShop = db.prepare(`
      INSERT OR REPLACE INTO shops (id, name, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    shops.forEach(shop => {
      insertShop.run(
        shop.id,
        shop.name,
        shop.distance || null,
        shop.image_url || null,
        shop.contact_phone || null,
        shop.latitude || null,
        shop.longitude || null,
        shop.is_active ? 1 : 0,
        shop.created_at || new Date().toISOString(),
        shop.updated_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${shops.length} shops`);

    // Migrate products
    console.log('Migrating products...');
    const products = readJSONFile('products.json');
    const insertProduct = db.prepare(`
      INSERT OR REPLACE INTO products (id, name, category, weight, weight_in_kg, price, price_per_kg, image_url, description, original_price, discount_percentage, rating, is_available, shop_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    products.forEach(product => {
      insertProduct.run(
        product.id,
        product.name,
        product.category,
        product.weight || null,
        product.weight_in_kg || 1.0,
        product.price,
        product.price_per_kg || product.price,
        product.image_url || null,
        product.description || null,
        product.original_price || null,
        product.discount_percentage || null,
        product.rating || 0,
        product.is_available ? 1 : 0,
        product.shop_id || null,
        product.created_at || new Date().toISOString(),
        product.updated_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${products.length} products`);

    // Migrate users
    console.log('Migrating users...');
    const users = readJSONFile('users.json');
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, phone, password, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    users.forEach(user => {
      insertUser.run(
        user.id,
        user.name,
        user.email || null,
        user.phone,
        user.password,
        user.created_at || new Date().toISOString(),
        user.updated_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${users.length} users`);

    // Migrate user_profiles
    console.log('Migrating user profiles...');
    const profiles = readJSONFile('user_profiles.json');
    const insertProfile = db.prepare(`
      INSERT OR REPLACE INTO user_profiles (id, name, email, phone, profile_picture, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    profiles.forEach(profile => {
      insertProfile.run(
        profile.id,
        profile.name,
        profile.email || null,
        profile.phone,
        profile.profile_picture || null,
        profile.created_at || new Date().toISOString(),
        profile.updated_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${profiles.length} user profiles`);

    // Migrate addresses
    console.log('Migrating addresses...');
    const addresses = readJSONFile('addresses.json');
    const insertAddress = db.prepare(`
      INSERT OR REPLACE INTO addresses (id, user_id, contact_name, phone, street, city, state, postal_code, landmark, label, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    addresses.forEach(address => {
      insertAddress.run(
        address.id || generateId(),
        address.user_id,
        address.contact_name,
        address.phone,
        address.street,
        address.city,
        address.state,
        address.postal_code,
        address.landmark || null,
        address.label || 'Home',
        address.is_default ? 1 : 0,
        address.created_at || new Date().toISOString(),
        address.updated_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${addresses.length} addresses`);

    // Migrate orders
    console.log('Migrating orders...');
    const orders = readJSONFile('orders.json');
    const insertOrder = db.prepare(`
      INSERT OR REPLACE INTO orders (id, user_id, shop_id, address_id, order_number, parent_order, subtotal, delivery_charge, discount, coupon_id, total, status, status_note, payment_method_id, payment_method_text, otp, delivery_eta, delivered_at, delivery_agent_name, delivery_agent_mobile, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    orders.forEach(order => {
      insertOrder.run(
        order.id,
        order.user_id,
        order.shop_id || null,
        order.address_id,
        order.order_number,
        order.parent_order || null,
        order.subtotal,
        order.delivery_charge || 40,
        order.discount || 0,
        order.coupon_id || null,
        order.total,
        order.status,
        order.status_note || null,
        order.payment_method_id || null,
        order.payment_method_text || 'Cash on Delivery',
        order.otp,
        order.delivery_eta || null,
        order.delivered_at || null,
        order.delivery_agent_name || null,
        order.delivery_agent_mobile || null,
        order.created_at || new Date().toISOString(),
        order.updated_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${orders.length} orders`);

    // Migrate order_items
    console.log('Migrating order items...');
    const orderItems = readJSONFile('order_items.json');
    const insertOrderItem = db.prepare(`
      INSERT OR REPLACE INTO order_items (id, order_id, product_id, addon_id, name, quantity, weight, weight_in_kg, price, price_per_kg, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    orderItems.forEach(item => {
      insertOrderItem.run(
        item.id || generateId(),
        item.order_id,
        item.product_id || null,
        item.addon_id || null,
        item.name,
        item.quantity || 1,
        item.weight || null,
        item.weight_in_kg || null,
        item.price,
        item.price_per_kg || null,
        item.image_url || null,
        item.created_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${orderItems.length} order items`);

    // Migrate order_timeline
    console.log('Migrating order timeline...');
    const timeline = readJSONFile('order_timeline.json');
    const insertTimeline = db.prepare(`
      INSERT OR REPLACE INTO order_timeline (id, order_id, stage, description, timestamp, is_completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    timeline.forEach(event => {
      insertTimeline.run(
        event.id || generateId(),
        event.order_id,
        event.stage,
        event.description,
        event.timestamp || new Date().toISOString(),
        event.is_completed ? 1 : 0
      );
    });
    console.log(`  ✓ Migrated ${timeline.length} timeline events`);

    // Migrate coupons
    console.log('Migrating coupons...');
    const coupons = readJSONFile('coupons.json');
    const insertCoupon = db.prepare(`
      INSERT OR REPLACE INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    coupons.forEach(coupon => {
      // Handle both old format (discount_amount/discount_percentage) and new format
      const discountType = coupon.discount_percentage ? 'percentage' : 'fixed';
      const discountValue = coupon.discount_percentage || coupon.discount_amount || 0;
      insertCoupon.run(
        coupon.id || generateId(),
        coupon.code,
        coupon.description || null,
        discountType,
        discountValue,
        coupon.min_order_amount || null,
        coupon.max_discount || null,
        coupon.valid_from || null,
        coupon.valid_until || null,
        coupon.usage_limit || null,
        coupon.usage_count || 0,
        coupon.is_active ? 1 : 0,
        coupon.created_at || new Date().toISOString(),
        coupon.updated_at || coupon.created_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${coupons.length} coupons`);

    // Migrate addons
    console.log('Migrating addons...');
    const addons = readJSONFile('addons.json');
    const insertAddon = db.prepare(`
      INSERT OR REPLACE INTO addons (id, name, description, price, is_available, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    addons.forEach(addon => {
      insertAddon.run(
        addon.id || generateId(),
        addon.name,
        addon.description || null,
        addon.price,
        addon.is_available ? 1 : 0,
        addon.created_at || new Date().toISOString(),
        addon.updated_at || new Date().toISOString()
      );
    });
    console.log(`  ✓ Migrated ${addons.length} addons`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migration
migrateData();

