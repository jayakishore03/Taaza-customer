# 🚀 Data Migration Guide - JSON to PostgreSQL/Supabase

## ✅ Prerequisites Done
- [x] `.env` file created with Supabase credentials
- [x] Connection to Supabase verified

## 📋 Migration Steps

### Step 1: Create Tables in Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom
   - Login if needed

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration SQL**
   - Open file: `supabase/migrations/000_create_tables_simple.sql` in this project
   - Copy **ALL contents** (Ctrl+A, then Ctrl+C)
   - Paste into SQL Editor (Ctrl+V)
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for success message ✅

4. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - You should see these tables:
     - shops
     - products
     - addons
     - coupons
     - user_profiles
     - addresses
     - payment_methods
     - orders
     - order_items
     - order_timeline
     - favorites

### Step 2: Migrate Data from JSON to PostgreSQL

After tables are created, run this command in PowerShell:

```powershell
cd backend
npm run seed
```

This will migrate data from these JSON files:
- ✅ `data/shops.json` → `shops` table
- ✅ `data/products.json` → `products` table  
- ✅ `data/addons.json` → `addons` table
- ✅ `data/coupons.json` → `coupons` table

### Step 3: Verify Data Migration

Run this to check what was migrated:

```powershell
npm run check:tables
```

### Step 4: Check Data Counts

You can also verify in Supabase Dashboard SQL Editor:

```sql
-- Check shops
SELECT COUNT(*) as shop_count FROM shops;

-- Check products
SELECT COUNT(*) as product_count FROM products;

-- Check addons
SELECT COUNT(*) as addon_count FROM addons;

-- Check coupons
SELECT COUNT(*) as coupon_count FROM coupons;

-- View some products
SELECT id, name, category, price FROM products LIMIT 10;
```

## 🎉 After Migration

Once data is migrated successfully:

1. **Start Backend Server**
   ```powershell
   npm run dev
   ```

2. **Test API Endpoints**
   - Products: http://localhost:3000/api/products
   - Shops: http://localhost:3000/api/shops
   - Addons: http://localhost:3000/api/addons
   - Coupons: http://localhost:3000/api/coupons

## 🔧 Troubleshooting

### Error: "Table does not exist"
- **Solution**: You haven't run the migration SQL yet. Go back to Step 1.

### Error: "Permission denied" or "RLS policy"
- **Solution**: Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env` file.

### Error: "Duplicate key value"
- **Solution**: Data already exists. This is normal if you run seed multiple times. The script uses `upsert` to update existing records.

### Can't connect to Supabase
- **Solution**: 
  1. Check internet connection
  2. Verify credentials in `.env` file
  3. Check Supabase project status at dashboard

## 📊 What Data Gets Migrated?

From your JSON files:
- **Products**: ~100+ meat products (Chicken, Mutton, Pork)
- **Shops**: 3 local shops with locations
- **Addons**: Extra options for products
- **Coupons**: Discount codes and promotions

## 🔐 Important Notes

- The `SUPABASE_SERVICE_ROLE_KEY` is used for seeding (bypasses RLS policies)
- The `SUPABASE_ANON_KEY` is used for regular app operations
- Both keys are already in your `.env` file
- Migration is safe to run multiple times (uses upsert)

## ✅ Quick Command Reference

```powershell
# Check if tables exist
npm run check:tables

# Migrate all data
npm run seed

# Start backend server
npm run dev

# View server logs
# Server will show: "Server running on http://localhost:3000"
```

