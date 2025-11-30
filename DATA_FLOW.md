# Data Flow Architecture

## Overview

This document explains where data comes from in the Taza app.

## ✅ Current Architecture

### Supabase Usage
**Supabase is ONLY used for authentication** - not for data fetching.

**Location**: `lib/auth/helper.ts`

**Functions**:
- `getAuthToken()` - Get JWT token for API authentication
- `signInWithPassword()` - User login
- `signUpWithPassword()` - User registration
- `signOut()` - User logout
- `onAuthStateChange()` - Listen to auth state changes

**Why**: Supabase handles user authentication and provides JWT tokens that are used to authenticate with the backend API.

### Backend API Usage
**ALL data comes from the Express backend API** - no direct database queries from frontend.

**Location**: `lib/api/`

**API Modules**:
- `lib/api/products.ts` - Product data
- `lib/api/orders.ts` - Order data
- `lib/api/users.ts` - User profile and addresses
- `lib/api/shops.ts` - Shop data
- `lib/api/coupons.ts` - Coupon validation
- `lib/api/addons.ts` - Addon data
- `lib/api/favorites.ts` - Favorite products

**Base URL**: Set via `EXPO_PUBLIC_API_URL` environment variable

### Data Flow

```
Frontend App
    ↓
lib/api/* (API Client)
    ↓
Express Backend (http://localhost:3000/api)
    ↓
Supabase Database (Server-side only)
```

## ❌ What NOT to Use

### Deprecated Files
- `lib/services/*` - **DO NOT USE** - These are old files that query Supabase directly
- Direct Supabase queries from frontend - **DO NOT USE**

### Old Pattern (Deprecated)
```typescript
// ❌ DON'T DO THIS
import { supabase } from '../lib/supabase';
const { data } = await supabase.from('products').select('*');
```

### New Pattern (Current)
```typescript
// ✅ DO THIS
import { productsApi } from '../lib/api/products';
const products = await productsApi.getAll();
```

## Authentication Flow

1. User signs in → Supabase Auth (via `lib/auth/helper.ts`)
2. Get JWT token → Set in API client (`apiClient.setToken()`)
3. All API requests → Include JWT token in Authorization header
4. Backend validates token → Returns data from database

## Data Sources Summary

| Data Type | Source | Location |
|-----------|--------|----------|
| Products | Backend API | `lib/api/products.ts` |
| Orders | Backend API | `lib/api/orders.ts` |
| User Profile | Backend API | `lib/api/users.ts` |
| Addresses | Backend API | `lib/api/users.ts` |
| Shops | Backend API | `lib/api/shops.ts` |
| Coupons | Backend API | `lib/api/coupons.ts` |
| Addons | Backend API | `lib/api/addons.ts` |
| Favorites | Backend API | `lib/api/favorites.ts` |
| Auth Token | Supabase Auth | `lib/auth/helper.ts` |

## Key Points

1. ✅ **Supabase = Authentication only**
2. ✅ **Backend API = All data fetching**
3. ✅ **No direct database queries from frontend**
4. ❌ **Don't use `lib/services/` files**
5. ✅ **Use `lib/api/` files for all data**

## Environment Variables

```env
# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Supabase (for auth only)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Example: Fetching Products

```typescript
// ✅ Correct - Using Backend API
import { productsApi } from '../lib/api/products';

const products = await productsApi.getAll();
const product = await productsApi.getById(id);
const chickenProducts = await productsApi.getByCategory('Chicken');
```

```typescript
// ❌ Wrong - Direct Supabase query
import { supabase } from '../lib/supabase';

const { data } = await supabase.from('products').select('*');
```

## Backend Connection

The backend (`backend/` folder) connects to Supabase database server-side:
- Uses service role key (bypasses RLS for admin operations)
- Handles all database queries
- Returns data via REST API
- Frontend never directly queries database

