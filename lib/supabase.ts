import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client only if credentials are available
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn(
    '⚠️ Supabase credentials not found. Authentication will not work.\n' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file'
  );
}

// Create a safe proxy that handles missing Supabase gracefully
const createSafeSupabaseProxy = (): SupabaseClient => {
  return new Proxy({} as SupabaseClient, {
    get(target, prop) {
      if (!supabaseClient) {
        // Return a mock object that won't crash the app
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            signInWithPassword: async () => {
              throw new Error('Supabase not configured. Please set environment variables.');
            },
            signUp: async () => {
              throw new Error('Supabase not configured. Please set environment variables.');
            },
            signOut: async () => {},
            getUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({
              data: { subscription: null },
              unsubscribe: () => {},
            }),
          };
        }
        return () => {};
      }
      return (supabaseClient as any)[prop];
    },
  });
};

export const supabase = createSafeSupabaseProxy();
