/**
 * Verify Migration Success
 * Checks if all data was migrated successfully
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n' + '='.repeat(60));
console.log('🔍 VERIFYING MIGRATION');
console.log('='.repeat(60) + '\n');

async function verify() {
  const results = {};

  // Check shops
  const { data: shops, error: shopsError } = await supabase
    .from('shops')
    .select('*');
  
  if (!shopsError && shops) {
    console.log(`✅ Shops: ${shops.length} records found`);
    if (shops.length > 0) {
      console.log(`   Example: "${shops[0].name}"`);
    }
    results.shops = shops.length;
  } else {
    console.log(`❌ Shops: Error - ${shopsError?.message || 'Unknown'}`);
    results.shops = 0;
  }

  // Check products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');
  
  if (!productsError && products) {
    console.log(`✅ Products: ${products.length} records found`);
    if (products.length > 0) {
      console.log(`   Example: "${products[0].name}" - ₹${products[0].price}`);
    }
    results.products = products.length;
  } else {
    console.log(`❌ Products: Error - ${productsError?.message || 'Unknown'}`);
    results.products = 0;
  }

  // Check addons
  const { data: addons, error: addonsError } = await supabase
    .from('addons')
    .select('*');
  
  if (!addonsError && addons) {
    console.log(`✅ Addons: ${addons.length} records found`);
    results.addons = addons.length;
  } else {
    console.log(`❌ Addons: Error - ${addonsError?.message || 'Unknown'}`);
    results.addons = 0;
  }

  // Check coupons
  const { data: coupons, error: couponsError } = await supabase
    .from('coupons')
    .select('*');
  
  if (!couponsError && coupons) {
    console.log(`✅ Coupons: ${coupons.length} records found`);
    if (coupons.length > 0) {
      console.log(`   Example: "${coupons[0].code}"`);
    }
    results.coupons = coupons.length;
  } else {
    console.log(`❌ Coupons: Error - ${couponsError?.message || 'Unknown'}`);
    results.coupons = 0;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const total = results.shops + results.products + results.addons + results.coupons;
  
  if (total >= 63) {
    console.log('\n🎉 SUCCESS! All data migrated successfully!\n');
    console.log(`   Total records: ${total}`);
    console.log(`   - Shops: ${results.shops}/3`);
    console.log(`   - Products: ${results.products}/56`);
    console.log(`   - Addons: ${results.addons}/2`);
    console.log(`   - Coupons: ${results.coupons}/2\n`);
    console.log('✅ Next step: npm run dev');
    console.log('   Then test: http://localhost:3000/api/products\n');
  } else if (total > 0) {
    console.log('\n⚠️  PARTIAL SUCCESS - Some data migrated\n');
    console.log(`   Current: ${total}/63 records`);
    console.log('   Try running the SQL in Supabase again.\n');
  } else {
    console.log('\n❌ MIGRATION NOT COMPLETE\n');
    console.log('   No data found in tables.');
    console.log('   Please run the SQL in Supabase SQL Editor.\n');
    console.log('   1. SQL is in your clipboard (or open COMPLETE_MIGRATION.sql)');
    console.log('   2. Go to: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom/sql/new');
    console.log('   3. Paste and click RUN\n');
  }
}

verify().catch(console.error);

