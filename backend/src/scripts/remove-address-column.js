/**
 * Script to remove address column from shops table
 * Run this once to update existing databases
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, '../../database.db');

console.log('🔄 Removing address column from shops table...\n');

const db = new Database(DB_PATH);

try {
  // Disable foreign keys temporarily
  db.pragma('foreign_keys = OFF');

  // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
  // Step 1: Create new table without address column
  db.exec(`
    CREATE TABLE IF NOT EXISTS shops_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      distance TEXT,
      image_url TEXT,
      contact_phone TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Step 2: Copy data from old table to new table (excluding address)
  db.exec(`
    INSERT INTO shops_new (id, name, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at)
    SELECT id, name, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at
    FROM shops
  `);

  // Step 3: Drop old table
  db.exec(`DROP TABLE shops`);

  // Step 4: Rename new table to shops
  db.exec(`ALTER TABLE shops_new RENAME TO shops`);

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');

  console.log('✅ Successfully removed address column from shops table');
  console.log('✅ Shops table now only contains: id, name, distance, image_url, contact_phone, latitude, longitude, is_active, created_at, updated_at');
} catch (error) {
  console.error('❌ Error removing address column:', error);
  process.exit(1);
} finally {
  db.close();
}

