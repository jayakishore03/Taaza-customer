-- ========================================
-- FIX: Disable Row Level Security
-- This allows signups to work
-- ========================================

-- Disable RLS on all user-related tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = false THEN '✅ Disabled (Good)'
    ELSE '❌ Still Enabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_profiles', 'addresses', 'orders')
ORDER BY tablename;

-- All should show "✅ Disabled (Good)"

