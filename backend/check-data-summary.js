/**
 * Data Summary Script
 * Shows how many records are in each JSON file before migration
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, 'data');

console.log('📊 Taza App - Data Summary\n');
console.log('='.repeat(50));
console.log('');

const files = [
  { name: 'shops.json', icon: '🏪', description: 'Shops/Stores' },
  { name: 'products.json', icon: '🥩', description: 'Products (Meat items)' },
  { name: 'addons.json', icon: '➕', description: 'Product Add-ons' },
  { name: 'coupons.json', icon: '🎫', description: 'Discount Coupons' },
  { name: 'users.json', icon: '👤', description: 'Users (for reference)' },
  { name: 'user_profiles.json', icon: '📝', description: 'User Profiles (for reference)' },
  { name: 'addresses.json', icon: '📍', description: 'Delivery Addresses (for reference)' },
  { name: 'orders.json', icon: '📦', description: 'Orders (for reference)' },
  { name: 'order_items.json', icon: '🛒', description: 'Order Items (for reference)' },
  { name: 'order_timeline.json', icon: '⏱️', description: 'Order Timeline (for reference)' }
];

let totalRecords = 0;
let migratingCount = 0;

files.forEach(file => {
  try {
    const filePath = join(dataDir, file.name);
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const count = Array.isArray(data) ? data.length : 0;
    
    totalRecords += count;
    
    // Check if this file will be migrated
    const willMigrate = ['shops.json', 'products.json', 'addons.json', 'coupons.json'].includes(file.name);
    if (willMigrate) {
      migratingCount += count;
    }
    
    const status = willMigrate ? '✅ Will migrate' : '📋 Reference only';
    
    console.log(`${file.icon} ${file.description.padEnd(35)} ${count.toString().padStart(4)} records  ${status}`);
    
  } catch (error) {
    console.log(`${file.icon} ${file.description.padEnd(35)} ❌ Error reading file`);
  }
});

console.log('');
console.log('='.repeat(50));
console.log(`📊 Total records in JSON files: ${totalRecords}`);
console.log(`🚀 Records to migrate: ${migratingCount}`);
console.log('');
console.log('💡 Note:');
console.log('   - Users, profiles, addresses, and orders are reference data');
console.log('   - They will be created fresh when users sign up and place orders');
console.log('   - Only shops, products, addons, and coupons will be migrated');
console.log('');
console.log('📋 Next Step:');
console.log('   Run: npm run seed (after creating tables in Supabase)');
console.log('');

