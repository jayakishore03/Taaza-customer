/**
 * Setup Verification Script
 * Checks if database has data and verifies configuration
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../database.db');

console.log('🔍 Checking Backend Setup...\n');

// Check database
try {
  const db = new Database(DB_PATH);
  
  // Check shops
  const shops = db.prepare('SELECT * FROM shops WHERE is_active = 1').all();
  console.log(`✅ Shops in database: ${shops.length}`);
  shops.forEach(shop => {
    console.log(`   - ${shop.name} (${shop.id})`);
  });
  
  // Check products
  const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_available = 1').get();
  console.log(`✅ Products in database: ${products.count}`);
  
  db.close();
} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}

// Get network interfaces
console.log('\n📡 Network Configuration:');
const interfaces = os.networkInterfaces();
let foundIP = false;

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`   ${name}: ${iface.address}`);
      if (iface.address.startsWith('192.168.')) {
        foundIP = true;
        console.log(`\n✅ Use this IP in your frontend: http://${iface.address}:3000/api`);
      }
    }
  }
}

if (!foundIP) {
  console.log('\n⚠️  No 192.168.x.x IP found. Make sure your computer is on the same network as your mobile device.');
}

console.log('\n📝 Next steps:');
console.log('   1. Make sure the IP address in lib/api/client.ts matches your computer IP');
console.log('   2. Start the backend server: npm run dev');
console.log('   3. Verify the server is running: http://localhost:3000/health');
console.log('   4. Test shops endpoint: http://localhost:3000/api/shops');

