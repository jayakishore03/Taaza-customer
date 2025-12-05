/**
 * Complete Data Migration Script
 * Creates tables and migrates all data from JSON to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, 'data');

console.log('🚀 Starting Complete Data Migration...\n');

// Read SQL migration file
function readMigrationSQL() {
  const migrationPath = join(__dirname, '../supabase/migrations/000_create_tables_simple.sql');
  try {
    return readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    return null;
  }
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

// Execute SQL statements
async function executeSQLStatements(sql) {
  console.log('📦 Creating database tables...\n');
  
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Filter out comments and empty statements
      if (!s) return false;
      if (s.startsWith('--')) return false;
      if (s.startsWith('/*')) return false;
      if (s.length < 20) return false;
      return true;
    });

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Show progress for major operations
    if (statement.includes('CREATE TABLE')) {
      const match = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i);
      if (match) {
        console.log(`   Creating table: ${match[1]}`);
      }
    }

    try {
      // Use Supabase RPC or direct query
      const { error } = await supabase.rpc('exec', { sql: statement + ';' });
      
      if (error) {
        // Try alternative method
        if (error.message.includes('function') || error.message.includes('permission')) {
          // This is expected - Supabase doesn't allow DDL via client
          // We'll provide instructions instead
          continue;
        }
        
        // Ignore "already exists" errors
        if (error.message && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
          errorCount++;
          if (errorCount < 5) {
            console.log(`   ⚠️  Warning: ${error.message.substring(0, 60)}...`);
          }
        }
      } else {
        successCount++;
      }
    } catch (err) {
      // Ignore errors for DDL operations
      if (!err.message.includes('already exists')) {
        errorCount++;
      }
    }
  }

  console.log(`\n   Total statements: ${statements.length}`);
  if (successCount > 0) {
    console.log(`   ✅ Succeeded: ${successCount}`);
  }
  if (errorCount > 0) {
    console.log(`   ⚠️  Warnings: ${errorCount}`);
  }
}

// Check if tables exist
async function checkTablesExist() {
  console.log('\n🔍 Checking if tables exist...\n');
  
  const tables = ['shops', 'products', 'addons', 'coupons'];
  const results = {};

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST204' || error.code === '42P01') {
          results[table] = false;
        } else {
          // Table exists but might be empty or have other issues
          results[table] = true;
        }
      } else {
        results[table] = true;
      }
    } catch (err) {
      results[table] = false;
    }
  }

  const allExist = Object.values(results).every(v => v);
  
  for (const [table, exists] of Object.entries(results)) {
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  }

  return allExist;
}

// Seed shops
async function seedShops() {
  console.log('\n🏪 Migrating shops...');
  const shops = loadJSON('shops.json');
  if (!shops || shops.length === 0) {
    console.log('   ⚠️  No shops to migrate');
    return false;
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
    console.error('   ❌ Error:', error.message);
    return false;
  }

  console.log(`   ✅ Migrated ${shopsToInsert.length} shops`);
  return true;
}

// Seed products
async function seedProducts() {
  console.log('\n🥩 Migrating products...');
  const products = loadJSON('products.json');
  if (!products || products.length === 0) {
    console.log('   ⚠️  No products to migrate');
    return false;
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

  // Insert in batches
  const batchSize = 25;
  let totalInserted = 0;
  
  for (let i = 0; i < productsToInsert.length; i += batchSize) {
    const batch = productsToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`   ❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      return false;
    }
    totalInserted += batch.length;
    console.log(`   ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products`);
  }

  console.log(`   ✅ Migrated ${totalInserted} products`);
  return true;
}

// Seed addons
async function seedAddons() {
  console.log('\n➕ Migrating addons...');
  const addons = loadJSON('addons.json');
  if (!addons || addons.length === 0) {
    console.log('   ⚠️  No addons to migrate');
    return true; // Not critical
  }

  const addonsToInsert = addons.map(addon => ({
    id: addon.id || undefined,
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
    console.error('   ❌ Error:', error.message);
    return false;
  }

  console.log(`   ✅ Migrated ${addonsToInsert.length} addons`);
  return true;
}

// Seed coupons
async function seedCoupons() {
  console.log('\n🎫 Migrating coupons...');
  const coupons = loadJSON('coupons.json');
  if (!coupons || coupons.length === 0) {
    console.log('   ⚠️  No coupons to migrate');
    return true; // Not critical
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
    console.error('   ❌ Error:', error.message);
    return false;
  }

  console.log(`   ✅ Migrated ${couponsToInsert.length} coupons`);
  return true;
}

// Main function
async function main() {
  console.log('=' .repeat(60));
  console.log('🚀 TAZA APP - COMPLETE DATA MIGRATION');
  console.log('=' .repeat(60));
  console.log('');

  // Check if tables exist
  const tablesExist = await checkTablesExist();

  if (!tablesExist) {
    console.log('\n⚠️  TABLES DO NOT EXIST!\n');
    console.log('📝 Please create tables first:\n');
    console.log('   Option 1 - Supabase Dashboard (RECOMMENDED):');
    console.log('   -------------------------------------------');
    console.log('   1. Go to: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom');
    console.log('   2. Click "SQL Editor" in left sidebar');
    console.log('   3. Click "New query"');
    console.log('   4. Open file: supabase/migrations/000_create_tables_simple.sql');
    console.log('   5. Copy ALL contents and paste in SQL Editor');
    console.log('   6. Click "Run" button');
    console.log('   7. Wait for success message');
    console.log('   8. Run this script again: node migrate-all-data.js\n');
    console.log('   Option 2 - Quick Copy:');
    console.log('   ----------------------');
    console.log('   Run: .\\open-migration-sql.ps1\n');
    process.exit(1);
  }

  console.log('\n✅ All required tables exist!\n');
  console.log('=' .repeat(60));
  console.log('📊 STARTING DATA MIGRATION');
  console.log('=' .repeat(60));

  // Migrate all data
  const results = {
    shops: await seedShops(),
    products: await seedProducts(),
    addons: await seedAddons(),
    coupons: await seedCoupons()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('=' .repeat(60));
  console.log(`   Shops:    ${results.shops ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Products: ${results.products ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Addons:   ${results.addons ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Coupons:  ${results.coupons ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('=' .repeat(60));

  const allSuccess = Object.values(results).every(r => r);
  
  if (allSuccess) {
    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!\n');
    console.log('✅ Next Steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Test API: http://localhost:3000/api/products');
    console.log('   3. View data in Supabase Dashboard\n');
  } else {
    console.log('\n⚠️  SOME MIGRATIONS FAILED\n');
    console.log('Please check the errors above and try again.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
});

