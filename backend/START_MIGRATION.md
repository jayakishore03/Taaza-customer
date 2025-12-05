# 🚀 Quick Start - Data Migration

## ✅ Ready to Migrate!

You have **63 records** ready to migrate from JSON to PostgreSQL/Supabase:
- 🏪 3 Shops
- 🥩 56 Products (Chicken, Mutton, Pork)
- ➕ 2 Add-ons
- 🎫 2 Coupons

## 🎯 Quick Migration (2 Steps)

### Step 1: Create Tables (One-Time Setup)

**Option A - Automated (Recommended):**
```powershell
.\open-migration-sql.ps1
```
This will:
- Copy SQL to your clipboard
- Open Supabase dashboard
- Then just paste (Ctrl+V) and click Run!

**Option B - Manual:**
1. Go to: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom
2. Click "SQL Editor" → "New query"
3. Open: `supabase/migrations/000_create_tables_simple.sql`
4. Copy all content (Ctrl+A, Ctrl+C)
5. Paste in SQL Editor (Ctrl+V)
6. Click "Run" (or Ctrl+Enter)

### Step 2: Migrate Data

```powershell
npm run seed
```

That's it! 🎉

## 📊 Verification

Check what was migrated:

```powershell
# Check tables exist
npm run check:tables

# Check data counts
npm run check:data

# Start backend server
npm run dev
```

Then visit in browser:
- Products: http://localhost:3000/api/products
- Shops: http://localhost:3000/api/shops

## 🎯 Quick Commands Reference

```powershell
# 1. Check what data you have
npm run check:data

# 2. Open SQL migration helper
.\open-migration-sql.ps1

# 3. After creating tables, migrate data
npm run seed

# 4. Verify tables and data
npm run check:tables

# 5. Start backend server
npm run dev
```

## 📝 What Gets Migrated?

### ✅ Will Migrate to PostgreSQL:
- **Shops** - 3 local meat shops with locations
- **Products** - 56 meat products with images, prices, categories
- **Add-ons** - Extra options for products (marinades, cutting styles)
- **Coupons** - Discount codes for promotions

### 📋 Reference Only (Created by App):
- **Users** - Created when customers sign up
- **Addresses** - Added when customers enter delivery addresses
- **Orders** - Created when customers place orders
- **Payments** - Recorded during checkout

## 🔧 Troubleshooting

### "Tables do not exist"
- Run Step 1 first (create tables in Supabase)

### "Permission denied"
- Check `.env` has `SUPABASE_SERVICE_ROLE_KEY`

### "Duplicate key value"
- Normal! Data already exists. Script uses upsert to update.

### Can't connect
- Check internet connection
- Verify Supabase project is active at dashboard

## ✅ After Migration

Your app will have:
- ✅ 3 shops with GPS locations
- ✅ 56 products with images and prices
- ✅ Product categories (Chicken, Mutton, Pork)
- ✅ Add-ons for customization
- ✅ Coupon codes ready to use
- ✅ Full API endpoints working

## 🎉 Success Indicators

You'll know it worked when:
1. ✅ `npm run check:tables` shows all tables exist
2. ✅ `npm run seed` completes without errors
3. ✅ http://localhost:3000/api/products shows your products
4. ✅ Backend server starts successfully

## 🚀 Next Steps After Migration

1. **Test API Endpoints**
   ```bash
   npm run dev
   ```

2. **Connect Frontend**
   - Frontend already configured to use Supabase
   - Just start the Expo app

3. **Verify Data in Supabase Dashboard**
   - Go to "Table Editor" to see your data
   - Browse products, shops, etc.

## 🆘 Need Help?

If something goes wrong:
1. Check console errors carefully
2. Verify `.env` file has correct credentials
3. Make sure Supabase project is active
4. Check `MIGRATE_DATA_NOW.md` for detailed troubleshooting

---

**Ready? Let's start! Run:** `.\open-migration-sql.ps1`

