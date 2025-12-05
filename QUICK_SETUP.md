# Quick Supabase Setup

## ⚡ Quick Start (3 Steps)

### Step 1: Run Migration in Supabase Dashboard

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom
2. **Go to SQL Editor** (left sidebar)
3. **Click "New query"**
4. **Copy the entire migration file**: `supabase/migrations/20250116000000_complete_taza_schema_with_metadata.sql`
5. **Paste and click "Run"** (or press Ctrl+Enter)

✅ This creates all tables, indexes, RLS policies, functions, and triggers.

### Step 2: Seed the Database

```bash
cd backend
npm run seed
```

✅ This populates all tables with data from JSON files.

### Step 3: Verify

Check in Supabase Table Editor that you have:
- ✅ 3 shops
- ✅ Products (check count)
- ✅ 2 addons
- ✅ 2 coupons

## 🐛 Troubleshooting

**Error: "Could not find the table 'public.products'"**
→ You haven't run Step 1 yet. Run the migration SQL first.

**Error: "permission denied"**
→ Check your `.env` file has `SUPABASE_SERVICE_ROLE_KEY` set correctly.

## 📝 Migration File Location

`supabase/migrations/20250116000000_complete_taza_schema_with_metadata.sql`

Copy the entire contents of this file and run it in Supabase SQL Editor.

