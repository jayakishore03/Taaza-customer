/**
 * Check if tables exist in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

const tables = [
  'shops',
  'products',
  'addons',
  'coupons',
  'user_profiles',
  'addresses',
  'payment_methods',
  'orders',
  'order_items',
  'order_timeline',
  'favorites'
];

async function checkTables() {
  console.log('🔍 Checking tables in Supabase...\n');

  const results = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
          results[table] = { exists: false, error: 'Table does not exist' };
        } else {
          results[table] = { exists: true, error: error.message };
        }
      } else {
        results[table] = { exists: true, error: null };
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message };
    }
  }

  console.log('📊 Table Status:\n');
  let allExist = true;
  
  for (const [table, result] of Object.entries(results)) {
    const status = result.exists ? '✅' : '❌';
    console.log(`${status} ${table.padEnd(20)} ${result.exists ? 'EXISTS' : 'MISSING'}`);
    if (!result.exists) {
      allExist = false;
      if (result.error) {
        console.log(`   └─ Error: ${result.error}`);
      }
    }
  }

  console.log('\n');

  if (!allExist) {
    console.log('❌ Some tables are missing!');
    console.log('\n📝 To create tables:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the contents of:');
    console.log('      supabase/migrations/000_create_tables_simple.sql');
    console.log('   3. Click "Run"');
    process.exit(1);
  } else {
    console.log('✅ All tables exist!');
    console.log('\n💡 Next step: Run "npm run seed" to populate data');
  }
}

checkTables().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

