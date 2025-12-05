# Supabase Database Setup Guide

This guide will help you set up your Supabase database with all tables and data.

## Step 1: Run the Migration

Since Supabase doesn't allow DDL (Data Definition Language) operations through the client, you need to run the migration manually in the Supabase dashboard.

### Steps:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `fcrhcwvpivkadkkbxcom`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Migration**
   - Open the file: `supabase/migrations/20250116000000_complete_taza_schema_with_metadata.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see all tables:
     - `user_profiles`
     - `addresses`
     - `shops`
     - `products`
     - `addons`
     - `coupons`
     - `payment_methods`
     - `orders`
     - `order_items`
     - `order_timeline`
     - `favorites`
     - `user_activity_logs`
     - `login_sessions`

## Step 2: Seed the Database

Once the tables are created, run the seed script to populate them with data:

```bash
cd backend
npm run seed
```

This will:
- ✅ Seed shops (3 shops)
- ✅ Seed products (all products from `data/products.json`)
- ✅ Seed addons (2 addons)
- ✅ Seed coupons (2 coupons)

## Step 3: Verify Data

1. **Check Shops**
   ```sql
   SELECT * FROM shops;
   ```
   Should return 3 shops.

2. **Check Products**
   ```sql
   SELECT COUNT(*) FROM products;
   ```
   Should return the number of products from your JSON file.

3. **Check Addons**
   ```sql
   SELECT * FROM addons;
   ```
   Should return 2 addons.

4. **Check Coupons**
   ```sql
   SELECT * FROM coupons;
   ```
   Should return 2 coupons.

## Troubleshooting

### Error: "Could not find the table 'public.products'"
- **Solution**: The migration hasn't been run yet. Go back to Step 1 and run the migration SQL in the Supabase dashboard.

### Error: "permission denied" or "RLS policy"
- **Solution**: Make sure you're using the `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file for seeding. The service role key bypasses RLS policies.

### Error: "duplicate key value"
- **Solution**: The data already exists. The seed script uses `upsert`, so it will update existing records. This is normal if you run the script multiple times.

## Environment Variables

Make sure your `backend/.env` file has:

```env
SUPABASE_URL="https://fcrhcwvpivkadkkbxcom.supabase.co"
SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

## Manual Data Insertion (Alternative)

If the seed script doesn't work, you can manually insert data using the Supabase dashboard:

1. Go to "Table Editor"
2. Select a table (e.g., `shops`)
3. Click "Insert" > "Insert row"
4. Fill in the data from your JSON files

## Next Steps

After setting up the database:
1. Start your backend server: `npm run dev`
2. Test the API endpoints
3. Verify data is being returned correctly

