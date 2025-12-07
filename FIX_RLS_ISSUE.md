# FIX: Supabase Row Level Security (RLS) Blocking Signups

## 🎯 ROOT CAUSE FOUND!

**Error:**
```
Foreign key constraint "user_profiles_id_fkey" violated
Key (id)=(...) is not present in table "users"
```

**Why:** Supabase Row Level Security (RLS) is preventing the insert!

---

## 🚀 IMMEDIATE FIX

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** → **Policies**

---

### Step 2: Disable RLS or Add Policies

**Option A: Disable RLS (Quick Fix for Development)**

Run this in **SQL Editor**:

```sql
-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_profiles table
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on addresses table
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
```

**Option B: Add Proper Policies (Production Ready)**

Run this in **SQL Editor**:

```sql
-- Enable RLS but allow service role to bypass
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role can do everything on users"
ON users
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can do everything on user_profiles"
ON user_profiles  
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can do everything on addresses"
ON addresses
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Users can read own addresses"
ON addresses
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);
```

---

### Step 3: Test Signup Again

After applying the fix:

```powershell
cd C:\Users\DELL\Desktop\taza-1\backend
node test-signup.js
```

**Should show:**
```
✅ User created successfully!
✅ Profile created successfully!
✅ TEST PASSED!
```

---

## 🔧 Why This Happened

Supabase has **Row Level Security (RLS)** enabled by default. When RLS is on:

1. ❌ Even with service_role key, inserts might be blocked
2. ❌ Foreign key checks fail if RLS hides the related rows
3. ❌ Signups fail with "foreign key violation"

**Solution:** Either disable RLS or add proper policies for service role.

---

## 🎯 Recommended Fix (Choose One)

### For Development (Easiest):
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions DISABLE ROW LEVEL SECURITY;
```

### For Production (Secure):
Use the Policy queries from Option B above.

---

## ✅ After Fix

1. Run test script → Should pass ✅
2. Try signup in app → Should work ✅
3. User gets registered → Saved in database ✅

---

## 📝 Complete SQL to Run

Copy this entire block into Supabase SQL Editor:

```sql
-- OPTION 1: Simple - Disable RLS (Development)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_profiles', 'addresses');
-- Should show: rowsecurity = false for all
```

---

## 🧪 Test After Fix

```powershell
cd backend
node test-signup.js
```

**Expected output:**
```
✅ User created successfully!
✅ Profile created successfully!
✅ Verification complete:
   User in database: Yes ✅
   Profile in database: Yes ✅

✅ TEST PASSED!
Signup flow is working correctly!
```

---

## 🚀 Then Test in App

1. Open your app
2. Go to Sign Up
3. Enter details
4. Tap "Sign Up"
5. Should work! ✅

---

**RUN THIS SQL NOW IN SUPABASE TO FIX!** 🎯

