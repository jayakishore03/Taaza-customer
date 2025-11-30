import Database from 'better-sqlite3';
import { initDatabase } from './src/config/init-database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.db');
const DATA_DIR = path.join(__dirname, 'data');

function readJSONFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

console.log('🔍 Checking database...\n');

// Initialize database (creates tables if they don't exist)
initDatabase();

const db = new Database(DB_PATH);

try {
  // Check if shops table exists and has data
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='shops'`).all();
  
  if (tables.length === 0) {
    console.log('⚠️  Shops table not found. Database may need initialization.');
    db.close();
    process.exit(1);
  }
  
  let shops = db.prepare('SELECT * FROM shops WHERE is_active = 1').all();
  console.log(`✅ Shops in database: ${shops.length}`);
  
  if (shops.length === 0) {
    console.log('⚠️  No shops found. Migrating from JSON...');
    const shopsData = readJSONFile('shops.json');
    const insertShop = db.prepare(`
      INSERT OR REPLACE INTO shops (id, name, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    shopsData.forEach(shop => {
      insertShop.run(
        shop.id,
        shop.name,
        shop.distance || null,
        shop.image_url || null,
        shop.contact_phone || null,
        shop.latitude || null,
        shop.longitude || null,
        shop.is_active ? 1 : 0,
        shop.created_at || new Date().toISOString(),
        shop.updated_at || new Date().toISOString()
      );
    });
    console.log(`✅ Migrated ${shopsData.length} shops`);
    shops = db.prepare('SELECT * FROM shops WHERE is_active = 1').all();
  }
  
  shops.forEach(shop => {
    console.log(`   - ${shop.name} (${shop.id})`);
  });
  
  const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_available = 1').get();
  console.log(`✅ Products in database: ${products.count}`);
  
  db.close();
  console.log('\n✅ Database is ready!');
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}

