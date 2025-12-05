/**
 * Script to add missing tables to Supabase
 * Tables: users, login_sessions, shops_new, user_activity_logs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Set this for local development SSL issues
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const isProduction = process.env.NODE_ENV === 'production';

// Create PostgreSQL pool
const pool = new pg.Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : process.env.DIRECT_URL,
  ssl: isProduction ? {
    rejectUnauthorized: true,
  } : {
    rejectUnauthorized: false,
  },
});

// Helper function to load JSON files
function loadJSON(filename) {
  const filePath = join(__dirname, '../../data', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// Create tables
async function createTables(client) {
  console.log('\n📝 Creating tables...');
  
  try {
    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
    `);
    console.log('✅ Users table created');

    // 2. Login sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.login_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          device_info TEXT,
        ip_address TEXT,
        user_agent TEXT,
          is_active BOOLEAN DEFAULT true,
          expires_at TIMESTAMPTZ NOT NULL,
          last_activity_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON public.login_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON public.login_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_is_active ON public.login_sessions(is_active);
    `);
    console.log('✅ Login sessions table created');

    // 3. Shops_new table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.shops_new (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          shop_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          distance TEXT,
          image_url TEXT,
          contact_phone TEXT,
          contact_email TEXT,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          is_active BOOLEAN DEFAULT true,
          opening_time TIME,
          closing_time TIME,
          delivery_available BOOLEAN DEFAULT true,
          min_order_amount DECIMAL(10, 2) DEFAULT 0,
          delivery_charge DECIMAL(10, 2) DEFAULT 40,
          avg_rating DECIMAL(3, 2) DEFAULT 0,
          total_reviews INTEGER DEFAULT 0,
          owner_name TEXT,
          owner_phone TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_shops_new_shop_id ON public.shops_new(shop_id);
      CREATE INDEX IF NOT EXISTS idx_shops_new_is_active ON public.shops_new(is_active);
    `);
    console.log('✅ Shops_new table created');

    // 4. User activity logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
          activity_type TEXT NOT NULL,
          activity_description TEXT,
          metadata JSONB,
          ip_address TEXT,
          user_agent TEXT,
          device_info TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON public.user_activity_logs(activity_type);
      CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);
    `);
    console.log('✅ User activity logs table created');

    console.log('✅ All tables created successfully!\n');
    return { success: true };
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    return { success: false, error: error.message };
  }
}

// Load users data
async function loadUsers(client) {
  console.log('📦 Loading users...');
  const users = loadJSON('users.json');
  
  if (!users || users.length === 0) {
    console.log('⚠️  No users data found');
    return { count: 0, error: null };
  }

  try {
    let count = 0;
    for (const user of users) {
      await client.query(`
        INSERT INTO public.users (id, name, email, phone, password, is_active, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          updated_at = NOW()
      `, [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.password,
        user.is_active !== false,
        user.is_verified !== false,
        user.created_at || new Date().toISOString(),
        user.updated_at || new Date().toISOString()
      ]);
      count++;
    }
    console.log(`✅ Loaded ${count} users\n`);
    return { count, error: null };
  } catch (error) {
    console.error('❌ Error loading users:', error.message);
    return { count: 0, error: error.message };
  }
}

// Load shops_new data
async function loadShopsNew(client) {
  console.log('📦 Loading shops_new...');
  const shops = loadJSON('shops.json');
  
  if (!shops || shops.length === 0) {
    console.log('⚠️  No shops data found');
    return { count: 0, error: null };
  }

  try {
    let count = 0;
    for (const shop of shops) {
      await client.query(`
        INSERT INTO public.shops_new (shop_id, name, address, distance, image_url, contact_phone, latitude, longitude, is_active, delivery_available, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (shop_id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          distance = EXCLUDED.distance,
          image_url = EXCLUDED.image_url,
          contact_phone = EXCLUDED.contact_phone,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
      `, [
        shop.id,
        shop.name,
        shop.address,
        shop.distance,
        shop.image_url,
        shop.contact_phone,
        shop.latitude,
        shop.longitude,
        shop.is_active !== false,
        true, // delivery_available
        shop.created_at || new Date().toISOString(),
        shop.updated_at || new Date().toISOString()
      ]);
      count++;
    }
    console.log(`✅ Loaded ${count} shops to shops_new\n`);
    return { count, error: null };
  } catch (error) {
    console.error('❌ Error loading shops_new:', error.message);
    return { count: 0, error: error.message };
  }
}

// Create sample login sessions
async function createLoginSessions(client) {
  console.log('📦 Creating sample login sessions...');
  
  try {
    // Get existing users
    const usersResult = await client.query('SELECT id FROM public.users LIMIT 2');
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('⚠️  No users found to create sessions');
      return { count: 0, error: null };
    }

    let count = 0;
    for (const user of users) {
      await client.query(`
        INSERT INTO public.login_sessions (user_id, token, device_info, ip_address, is_active, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        user.id,
        `sample_token_${Math.random().toString(36).substring(2, 15)}`,
        'Mobile Device',
        '192.168.1.100',
        true,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        new Date().toISOString()
      ]);
      count++;
    }
    console.log(`✅ Created ${count} login sessions\n`);
    return { count, error: null };
  } catch (error) {
    console.error('❌ Error creating login sessions:', error.message);
    return { count: 0, error: error.message };
  }
}

// Create sample activity logs
async function createActivityLogs(client) {
  console.log('📦 Creating sample activity logs...');
  
  try {
    // Get existing users
    const usersResult = await client.query('SELECT id FROM public.users LIMIT 2');
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('⚠️  No users found to create activity logs');
      return { count: 0, error: null };
    }

    const activities = [
      { type: 'LOGIN', description: 'User logged in successfully', metadata: { device: 'mobile', platform: 'android' } },
      { type: 'VIEW_PRODUCT', description: 'Viewed product details', metadata: { product_id: '1', product_name: 'Chicken Breast' } },
      { type: 'ADD_TO_CART', description: 'Added item to cart', metadata: { product_id: '5', quantity: 2 } },
      { type: 'PLACE_ORDER', description: 'Placed order successfully', metadata: { order_id: 'order-1', total: 670 } },
    ];

    let count = 0;
    for (const user of users) {
      for (const activity of activities) {
        await client.query(`
          INSERT INTO public.user_activity_logs (user_id, activity_type, activity_description, metadata, ip_address, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          user.id,
          activity.type,
          activity.description,
          JSON.stringify(activity.metadata),
          '192.168.1.100',
          new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random time in past week
        ]);
        count++;
      }
    }
    console.log(`✅ Created ${count} activity logs\n`);
    return { count, error: null };
  } catch (error) {
    console.error('❌ Error creating activity logs:', error.message);
    return { count: 0, error: error.message };
  }
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ADD MISSING TABLES TO SUPABASE                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let client;
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected to database\n');

    // Create tables
    const createResult = await createTables(client);
    if (!createResult.success) {
      throw new Error('Failed to create tables');
    }

    // Load data
    const usersResult = await loadUsers(client);
    const shopsResult = await loadShopsNew(client);
    const sessionsResult = await createLoginSessions(client);
    const logsResult = await createActivityLogs(client);

    // Summary
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  MIGRATION COMPLETE!                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('Results:');
    console.log(`  Users:           ${usersResult.count} records`);
    console.log(`  Shops (new):     ${shopsResult.count} records`);
    console.log(`  Login Sessions:  ${sessionsResult.count} records`);
    console.log(`  Activity Logs:   ${logsResult.count} records`);
    console.log(`  Total:           ${usersResult.count + shopsResult.count + sessionsResult.count + logsResult.count} records\n`);

    // Verify tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'login_sessions', 'shops_new', 'user_activity_logs')
      ORDER BY table_name
    `);

    console.log('✅ Verified tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n🎉 All missing tables added successfully!\n');

} catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
  process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run main function
main().catch(console.error);
