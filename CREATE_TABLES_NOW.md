# 🚨 CREATE TABLES IN SUPABASE - STEP BY STEP

## ⚡ Quick Steps (5 minutes)

### Step 1: Open Supabase Dashboard
👉 **Go to:** https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom

### Step 2: Open SQL Editor
- Click **"SQL Editor"** in the left sidebar (it's under "Database")
- Click **"New query"** button (top right)

### Step 3: Copy the SQL File
1. Open this file in your project: `supabase/migrations/000_create_tables_simple.sql`
2. Select **ALL** text (Press `Ctrl+A`)
3. Copy it (Press `Ctrl+C`)

### Step 4: Paste and Run
1. Paste into the SQL Editor (Press `Ctrl+V`)
2. Click the **"Run"** button (or press `Ctrl+Enter`)
3. Wait for the success message: `✅ All tables created successfully!`

### Step 5: Verify Tables
- Click **"Table Editor"** in the left sidebar
- You should see these tables:
  - ✅ shops
  - ✅ products
  - ✅ addons
  - ✅ coupons
  - ✅ user_profiles
  - ✅ addresses
  - ✅ payment_methods
  - ✅ orders
  - ✅ order_items
  - ✅ order_timeline
  - ✅ favorites

### Step 6: Seed the Data
After tables are created, go back to terminal and run:
```bash
cd backend
npm run seed
```

---

## 📁 File Location
**SQL File:** `supabase/migrations/000_create_tables_simple.sql`

---

## ✅ Check if Tables Exist
Run this command to verify:
```bash
cd backend
npm run check:tables
```

If all tables show ✅, you're ready to seed data!

---

## 🆘 Troubleshooting

**Error: "permission denied"**
- Make sure you're logged into the correct Supabase project
- Check that you have admin access to the project

**Error: "syntax error"**
- Make sure you copied the ENTIRE file
- Don't copy just part of it

**Tables still not showing**
- Refresh the Supabase dashboard
- Check "Table Editor" again
- Run `npm run check:tables` to verify

