/**
 * Database Initialization Script
 * Creates SQLite database and all tables
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = path.join(__dirname, '../../database.db');

export function initDatabase() {
  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create shops table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      distance TEXT,
      image_url TEXT,
      contact_phone TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Add latitude and longitude columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE shops ADD COLUMN latitude REAL`);
  } catch (error) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE shops ADD COLUMN longitude REAL`);
  } catch (error) {
    // Column already exists, ignore
  }

  // Create products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      weight TEXT,
      weight_in_kg REAL DEFAULT 1.0,
      price REAL NOT NULL,
      price_per_kg REAL NOT NULL,
      image_url TEXT,
      description TEXT,
      original_price REAL,
      discount_percentage REAL,
      rating REAL DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      shop_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    )
  `);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create user_profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      gender TEXT,
      profile_picture TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (id) REFERENCES users(id)
    )
  `);
  
  // Add gender column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE user_profiles ADD COLUMN gender TEXT`);
  } catch (error) {
    // Column already exists, ignore
  }

  // Create addresses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      landmark TEXT,
      label TEXT DEFAULT 'Home',
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create payment_methods table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        details TEXT NOT NULL,
        card_number TEXT,
        card_expiry TEXT,
        card_cvv TEXT,
        cardholder_name TEXT,
        account_number TEXT,
        ifsc_code TEXT,
        account_holder_name TEXT,
        bank_name TEXT,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Payment methods table created/verified');
  } catch (error) {
    console.error('❌ Error creating payment_methods table:', error);
    throw error;
  }

  // Create orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      shop_id TEXT,
      address_id TEXT NOT NULL,
      order_number TEXT NOT NULL UNIQUE,
      parent_order TEXT,
      subtotal REAL NOT NULL,
      delivery_charge REAL DEFAULT 40,
      discount REAL DEFAULT 0,
      coupon_id TEXT,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Preparing',
      status_note TEXT,
      payment_method_id TEXT,
      payment_method_text TEXT DEFAULT 'Cash on Delivery',
      otp TEXT NOT NULL,
      delivery_eta TEXT,
      delivered_at TEXT,
      delivery_agent_name TEXT,
      delivery_agent_mobile TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (shop_id) REFERENCES shops(id),
      FOREIGN KEY (address_id) REFERENCES addresses(id)
    )
  `);

  // Create order_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT,
      addon_id TEXT,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      weight TEXT,
      weight_in_kg REAL,
      price REAL NOT NULL,
      price_per_kg REAL,
      image_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (addon_id) REFERENCES addons(id)
    )
  `);

  // Create order_timeline table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_timeline (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      is_completed INTEGER DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  // Create coupons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      discount_type TEXT NOT NULL DEFAULT 'fixed',
      discount_value REAL NOT NULL,
      min_order_amount REAL,
      max_discount REAL,
      valid_from TEXT,
      valid_until TEXT,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create addons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      is_available INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create user_activity_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_description TEXT,
      entity_type TEXT,
      entity_id TEXT,
      metadata TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create login_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      login_at TEXT NOT NULL,
      last_activity_at TEXT NOT NULL,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      logout_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON user_activity_logs(activity_type);
    CREATE INDEX IF NOT EXISTS idx_login_sessions_user ON login_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(token);
  `);

  db.close();
  console.log('✅ Database initialized successfully at:', DB_PATH);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}

