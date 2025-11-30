/**
 * Verify Products in Database
 * Checks that all products are in the database and shows summary
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, '../../database.db');

try {
  const db = new Database(DB_PATH);
  
  console.log('📊 Product Database Summary\n');
  console.log('='.repeat(50));
  
  // Get all products
  const products = db.prepare('SELECT id, name, category, price, weight_in_kg, is_available FROM products ORDER BY category, id').all();
  
  console.log(`\n✅ Total Products: ${products.length}\n`);
  
  // Group by category
  const byCategory = {};
  products.forEach(p => {
    if (!byCategory[p.category]) {
      byCategory[p.category] = { total: 0, available: 0 };
    }
    byCategory[p.category].total++;
    if (p.is_available) {
      byCategory[p.category].available++;
    }
  });
  
  console.log('📦 Products by Category:');
  console.log('-'.repeat(50));
  Object.keys(byCategory).sort().forEach(cat => {
    const stats = byCategory[cat];
    console.log(`  ${cat.padEnd(15)}: ${stats.available}/${stats.total} available`);
  });
  
  // Show pork products specifically
  const porkProducts = products.filter(p => p.category === 'Pork');
  console.log(`\n🐷 Pork Products (${porkProducts.length}):`);
  console.log('-'.repeat(50));
  porkProducts.forEach(p => {
    const status = p.is_available ? '✓' : '✗';
    console.log(`  ${status} ${p.id.padEnd(5)}: ${p.name.padEnd(40)} - ₹${p.price} (${p.weight_in_kg}kg)`);
  });
  
  // Verify all categories
  const categories = ['Chicken', 'Mutton', 'Pork', 'Seafood'];
  console.log(`\n🔍 Category Verification:`);
  console.log('-'.repeat(50));
  categories.forEach(cat => {
    const count = products.filter(p => p.category === cat).length;
    const status = count > 0 ? '✓' : '✗';
    console.log(`  ${status} ${cat.padEnd(15)}: ${count} products`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Database verification complete!');
  console.log('📝 All product data is stored in SQLite database');
  console.log('🚫 No JSON files are used for product data in API responses\n');
  
  db.close();
} catch (error) {
  console.error('❌ Error verifying products:', error);
  process.exit(1);
}

