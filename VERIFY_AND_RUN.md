# ✅ Verify Tables Are Created

## Step 1: Check Current Status
Run this command to see which tables exist:
```bash
cd backend
npm run check:tables
```

## Step 2: If Tables Are Missing

### Option A: Run SQL in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom
   - Or go to: https://supabase.com/dashboard → Select your project

2. **Navigate to SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"** button (top right, green button)

3. **Copy the SQL File**
   - Open: `supabase/migrations/000_create_tables_simple.sql`
   - **Select ALL** text: Press `Ctrl+A` (Windows) or `Cmd+A` (Mac)
   - **Copy**: Press `Ctrl+C` (Windows) or `Cmd+C` (Mac)

4. **Paste into SQL Editor**
   - Click in the SQL Editor text area
   - **Paste**: Press `Ctrl+V` (Windows) or `Cmd+V` (Mac)

5. **Run the SQL**
   - Click the **"Run"** button (green button, bottom right)
   - OR press `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac)

6. **Wait for Success**
   - You should see: `✅ All tables created successfully!`
   - Check the bottom of the results panel for any errors

### Option B: Verify Tables Were Created

1. **In Supabase Dashboard**
   - Click **"Table Editor"** in the left sidebar
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

2. **Or Run Check Command**
   ```bash
   npm run check:tables
   ```
   All tables should show ✅ EXISTS

## Step 3: Seed the Data

Once tables are created, run:
```bash
npm run seed
```

You should see:
```
✅ Seeded 3 shops
✅ Seeded X products
✅ Seeded 2 addons
✅ Seeded 2 coupons
```

---

## 🆘 Troubleshooting

### "Table does not exist" Error
→ You haven't run the SQL yet. Follow Step 2 above.

### "permission denied" Error
→ Make sure you're logged into the correct Supabase project
→ Check you have admin/owner access

### "syntax error" or "unexpected token"
→ Make sure you copied the ENTIRE file
→ Don't copy just part of it
→ Try copying again from the beginning

### Tables created but seed fails
→ Check your `.env` file has correct credentials:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Can't find SQL Editor
→ Look in the left sidebar under "Database" section
→ It might be called "SQL Editor" or "Query"

---

## 📝 Quick Reference

**SQL File Location:** `supabase/migrations/000_create_tables_simple.sql`

**Check Tables:** `npm run check:tables`

**Seed Data:** `npm run seed`

**Supabase Dashboard:** https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom

