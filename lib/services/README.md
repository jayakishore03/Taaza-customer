# ⚠️ DEPRECATED - Old Service Files

These service files are **DEPRECATED** and **NOT USED** anymore.

All data now comes from the **Backend API** (`lib/api/`), not directly from Supabase.

## Migration

- ❌ **OLD**: `lib/services/products.ts` → ✅ **NEW**: `lib/api/products.ts`
- ❌ **OLD**: `lib/services/orders.ts` → ✅ **NEW**: `lib/api/orders.ts`
- ❌ **OLD**: `lib/services/users.ts` → ✅ **NEW**: `lib/api/users.ts`
- ❌ **OLD**: `lib/services/shops.ts` → ✅ **NEW**: `lib/api/shops.ts`
- ❌ **OLD**: `lib/services/coupons.ts` → ✅ **NEW**: `lib/api/coupons.ts`
- ❌ **OLD**: `lib/services/addons.ts` → ✅ **NEW**: `lib/api/addons.ts`

## Current Architecture

- **Supabase**: Only used for authentication (via `lib/auth/helper.ts`)
- **Backend API**: All data fetching goes through Express backend (`lib/api/`)
- **Database**: Backend connects to Supabase database (server-side only)

## Do Not Use

Do not import from `lib/services/` - use `lib/api/` instead.

