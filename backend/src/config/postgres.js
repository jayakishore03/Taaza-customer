/**
 * Direct PostgreSQL Connection
 * Uses pg package for direct database access
 * Works with Vercel deployment
 */

// Bypass SSL certificate validation for Supabase (development + production)
// This is safe for Supabase as the connection is still encrypted
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config();

// Create connection pool using direct PostgreSQL connection
// SSL configuration for Supabase
const sslConfig = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase') 
  ? { rejectUnauthorized: false } 
  : undefined;

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

// Helper function to execute queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Helper function to get a client from the pool
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// Helper function for transactions
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;

