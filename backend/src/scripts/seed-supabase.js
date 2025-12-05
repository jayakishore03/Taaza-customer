/**
 * Seed Supabase Database
 * 
 * This script:
 * 1. Runs the migration to create all tables
 * 2. Seeds data from JSON files into Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '../../data');

// Read migration file
function readMigrationFile() {
  const migrationPath = join(__dirname, '../../../../supabase/migrations/20250116000000_complete_taza_schema_with_metadata.sql');
  try {
    return readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    return null;
  }
}

// Run migration SQL
async function runMigration() {
  console.log('📦 Running migration to create tables...');
  const migrationSQL = readMigrationFile();
  
  if (!migrationSQL) {
    console.error('❌ Could not read migration file');
    return false;
  }

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  // Execute each statement
  for (const statement of statements) {
    if (statement.length < 10) continue; // Skip very short statements
    
    try {
      // Use RPC to execute raw SQL (if available) or use direct query
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // If RPC doesn't exist, try direct query (this might not work for DDL)
        // For now, we'll skip and rely on manual migration
        if (error.message.includes('function exec_sql') || error.message.includes('permission denied')) {
          console.log('⚠️  Cannot execute DDL via Supabase client. Please run migration manually in Supabase dashboard.');
          console.log('   Migration file: supabase/migrations/20250116000000_complete_taza_schema_with_metadata.sql');
          return false;
        }
        // Some errors are expected (like "table already exists")
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.warn('⚠️  SQL warning:', error.message);
        }
      }
    } catch (err) {
      // Ignore errors for now - we'll seed data assuming tables exist
      console.warn('⚠️  Could not execute statement:', err.message);
    }
  }

  console.log('✅ Migration completed (or tables already exist)');
  return true;
}

// Load JSON data
function loadJSON(filename) {
  try {
    const filePath = join(dataDir, filename);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filename}:`, error.message);
    return null;
  }
}

// Seed shops
async function seedShops() {
  console.log('🏪 Seeding shops...');
  const shops = loadJSON('shops.json');
  if (!shops || shops.length === 0) {
    console.log('⚠️  No shops to seed');
    return;
  }

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

  const { data, error } = await supabase
    .from('shops')
    .upsert(shopsToInsert, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding shops:', error.message);
    return false;
  }

  console.log(`✅ Seeded ${shopsToInsert.length} shops`);
  return true;
}

// Seed products
async function seedProducts() {
  console.log('🥩 Seeding products...');
  const products = loadJSON('products.json');
  if (!products || products.length === 0) {
    console.log('⚠️  No products to seed');
    return;
  }

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
  const batchSize = 50;
  for (let i = 0; i < productsToInsert.length; i += batchSize) {
    const batch = productsToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error seeding products batch ${i / batchSize + 1}:`, error.message);
      return false;
    }
    console.log(`  ✓ Inserted batch ${i / batchSize + 1} (${batch.length} products)`);
  }

  console.log(`✅ Seeded ${productsToInsert.length} products`);
  return true;
}

// Seed addons
async function seedAddons() {
  console.log('➕ Seeding addons...');
  const addons = loadJSON('addons.json');
  if (!addons || addons.length === 0) {
    console.log('⚠️  No addons to seed');
    return;
  }

  const addonsToInsert = addons.map(addon => ({
    id: addon.id || undefined, // Let Supabase generate UUID if not provided
    name: addon.name,
    price: addon.price,
    description: addon.description || null,
    is_available: addon.is_available !== undefined ? addon.is_available : true,
    created_at: addon.created_at || new Date().toISOString(),
    updated_at: addon.updated_at || new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('addons')
    .upsert(addonsToInsert, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding addons:', error.message);
    return false;
  }

  console.log(`✅ Seeded ${addonsToInsert.length} addons`);
  return true;
}

// Seed coupons
async function seedCoupons() {
  console.log('🎫 Seeding coupons...');
  const coupons = loadJSON('coupons.json');
  if (!coupons || coupons.length === 0) {
    console.log('⚠️  No coupons to seed');
    return;
  }

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

  const { data, error } = await supabase
    .from('coupons')
    .upsert(couponsToInsert, { onConflict: 'code' });

  if (error) {
    console.error('❌ Error seeding coupons:', error.message);
    return false;
  }

  console.log(`✅ Seeded ${couponsToInsert.length} coupons`);
  return true;
}

// Main function
async function main() {
  console.log('🚀 Starting Supabase database seeding...\n');

  // Note: Migration should be run manually in Supabase dashboard
  // because Supabase client doesn't support DDL operations
  console.log('📋 IMPORTANT: Please run the migration manually in Supabase dashboard:');
  console.log('   1. Go to Supabase Dashboard > SQL Editor');
  console.log('   2. Copy contents of: supabase/migrations/000_create_tables_simple.sql');
  console.log('   3. Paste and run the SQL\n');

  // Check if tables exist by trying to query one
  const { error: testError } = await supabase.from('shops').select('id').limit(1);
  
  if (testError) {
    if (testError.message.includes('does not exist') || testError.code === 'PGRST205') {
      console.error('❌ Tables do not exist! Please run the migration first in Supabase dashboard.');
      console.error('\n📝 Quick Steps:');
      console.error('   1. Open: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom');
      console.error('   2. Click "SQL Editor" in left sidebar');
      console.error('   3. Click "New query"');
      console.error('   4. Open file: supabase/migrations/000_create_tables_simple.sql');
      console.error('   5. Copy ALL contents (Ctrl+A, Ctrl+C)');
      console.error('   6. Paste into SQL Editor (Ctrl+V)');
      console.error('   7. Click "Run" button (or press Ctrl+Enter)');
      console.error('   8. Wait for success message, then run: npm run seed\n');
      process.exit(1);
    }
  }

  // Seed data
  const results = {
    shops: await seedShops(),
    products: await seedProducts(),
    addons: await seedAddons(),
    coupons: await seedCoupons()
  };

  console.log('\n📊 Seeding Summary:');
  console.log(`   Shops: ${results.shops ? '✅' : '❌'}`);
  console.log(`   Products: ${results.products ? '✅' : '❌'}`);
  console.log(`   Addons: ${results.addons ? '✅' : '❌'}`);
  console.log(`   Coupons: ${results.coupons ? '✅' : '❌'}`);

  const allSuccess = Object.values(results).every(r => r);
  if (allSuccess) {
    console.log('\n✅ Database seeding completed successfully!');
  } else {
    console.log('\n⚠️  Some seeding operations failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

