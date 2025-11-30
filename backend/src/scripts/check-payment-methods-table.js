/**
 * Check if payment_methods table exists
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
  
  // Check if table exists
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='payment_methods'
  `).get();
  
  if (tableCheck) {
    console.log('✅ Payment methods table exists');
    
    // Get count
    const count = db.prepare('SELECT COUNT(*) as count FROM payment_methods').get();
    console.log(`📊 Payment methods in database: ${count.count}`);
    
    // Show table structure
    const columns = db.prepare(`PRAGMA table_info(payment_methods)`).all();
    console.log('\n📋 Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
  } else {
    console.log('❌ Payment methods table does NOT exist');
    console.log('⚠️  Run: node src/config/init-database.js');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

