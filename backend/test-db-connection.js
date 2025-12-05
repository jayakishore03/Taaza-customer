/**
 * Test Direct PostgreSQL Connection
 */

// Disable SSL certificate validation for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config();

console.log('Testing PostgreSQL Connection...\n');
console.log('Using connection string from:', process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL');

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  connectionTimeoutMillis: 10000,
});

async function test() {
  try {
    console.log('Connecting...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    console.log('\nTesting query...');
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Query successful!');
    console.log('Time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...');
    
    console.log('\nChecking if tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. Need to create them.');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Connection test successful!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

test();

