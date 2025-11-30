/**
 * Script to add missing tables to existing database
 * This will add any tables that are missing without affecting existing data
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, '../../../database.db');

try {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  console.log('🔍 Checking for missing tables...\n');

  // Check if login_sessions table exists
  const loginSessionsCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='login_sessions'
  `).get();

  if (!loginSessionsCheck) {
    console.log('📋 Creating login_sessions table...');
    
    // Create login_sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS login_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        login_at TEXT NOT NULL,
        last_activity_at TEXT NOT NULL,
        expires_at TEXT,
        is_active INTEGER DEFAULT 1,
        logout_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_login_sessions_user ON login_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(token);
    `);

    console.log('✅ login_sessions table created successfully!\n');
  } else {
    console.log('✅ login_sessions table already exists.\n');
  }

  // Check for other potentially missing tables
  const tablesToCheck = [
    'shops',
    'products',
    'users',
    'user_profiles',
    'addresses',
    'orders',
    'order_items',
    'order_timeline',
    'coupons',
    'addons',
    'user_activity_logs',
  ];

  console.log('🔍 Checking all required tables...');
  const existingTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all().map(row => row.name);

  const missingTables = tablesToCheck.filter(table => !existingTables.includes(table));

  if (missingTables.length > 0) {
    console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
    console.log('💡 Run the database initialization script to create all tables:');
    console.log('   node src/config/init-database.js');
  } else {
    console.log('✅ All required tables exist.');
  }

  db.close();
  console.log('\n✅ Database check completed!');
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}


