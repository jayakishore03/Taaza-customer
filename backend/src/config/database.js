/**
 * Supabase Database Configuration
 * Uses Supabase (PostgreSQL) for database operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client for regular operations (uses anon key, respects RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase admin client for admin operations (uses service role key, bypasses RLS)
const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : supabase;

// Wrap Supabase clients to add custom RPC functions
const originalRpcSupabase = supabase.rpc.bind(supabase);
const originalRpcSupabaseAdmin = supabaseAdmin.rpc.bind(supabaseAdmin);

/**
 * Generate order number
 * Counts existing orders and generates a sequential order number
 */
async function generateOrderNumber() {
  try {
    const { count, error } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting orders:', error);
      return { data: `#TAZ${Date.now()}`, error: null };
    }
    
    const orderNum = (count || 0) + 1000;
    return { data: `#TAZ${orderNum}`, error: null };
  } catch (error) {
    console.error('Error generating order number:', error);
    return { data: `#TAZ${Date.now()}`, error: null };
  }
}

/**
 * Generate OTP
 */
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return { data: otp, error: null };
}

// Override RPC method to handle custom functions
supabase.rpc = async (functionName, params = {}) => {
  if (functionName === 'generate_order_number') {
    return generateOrderNumber();
  }
  if (functionName === 'generate_otp') {
    return generateOTP();
  }
  // For other RPC functions, use Supabase's built-in RPC
  return await originalRpcSupabase(functionName, params);
};

supabaseAdmin.rpc = async (functionName, params = {}) => {
  if (functionName === 'generate_order_number') {
    return generateOrderNumber();
  }
  if (functionName === 'generate_otp') {
    return generateOTP();
  }
  // For other RPC functions, use Supabase's built-in RPC
  return await originalRpcSupabaseAdmin(functionName, params);
};

export { supabase, supabaseAdmin };
export default supabase;
