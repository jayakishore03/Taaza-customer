# Taza Backend Documentation

This document describes the complete backend implementation for the Taza meat delivery app.

## Overview

The backend is built using **Supabase** (PostgreSQL database) with Row Level Security (RLS) policies for data protection. All database operations are handled through TypeScript service modules.

## Database Schema

### Tables

1. **user_profiles** - Extended user information
2. **addresses** - User delivery addresses
3. **shops** - Meat shops/vendors
4. **products** - Meat products (Chicken, Mutton, Seafood, Fish)
5. **addons** - Product addons (spices, marination, etc.)
6. **coupons** - Discount coupons
7. **payment_methods** - User payment methods
8. **orders** - Order information
9. **order_items** - Items in each order
10. **order_timeline** - Order status tracking
11. **favorites** - User favorite products

## Setup Instructions

### 1. Database Migration

Run the migration file to create all tables:

```bash
# Using Supabase CLI
supabase db push

# Or apply the migration manually in Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/20250115000000_complete_backend_schema.sql
```

### 2. Environment Variables

Ensure you have these environment variables set:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Authentication Setup

The app uses Supabase Auth. Make sure:
- Email/Password authentication is enabled
- Phone authentication is configured (if using)
- RLS policies are active

## API Services

All services are located in `lib/services/`:

### Products Service (`lib/services/products.ts`)

```typescript
import { getAllProducts, getProductsByCategory, getProductById } from '@/lib/services/products';

// Get all products
const products = await getAllProducts();

// Get products by category
const chickenProducts = await getProductsByCategory('Chicken');

// Get single product
const product = await getProductById('product-id');
```

### Orders Service (`lib/services/orders.ts`)

```typescript
import { createOrder, getUserOrders, getOrderById, updateOrderStatus } from '@/lib/services/orders';

// Create order
const order = await createOrder({
  userId: 'user-id',
  addressId: 'address-id',
  items: [...],
  subtotal: 1000,
  deliveryCharge: 40,
  discount: 0,
  paymentMethodText: 'UPI • PhonePe',
});

// Get user orders
const orders = await getUserOrders('user-id');

// Get single order
const order = await getOrderById('order-id', 'user-id');

// Update order status
await updateOrderStatus('order-id', 'user-id', 'Out for Delivery', 'Rider is en route');
```

### Users Service (`lib/services/users.ts`)

```typescript
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '@/lib/services/users';

// Get user profile
const profile = await getUserProfile('user-id');

// Update profile
await updateUserProfile('user-id', { name: 'New Name' });

// Manage addresses
const addresses = await getUserAddresses('user-id');
await addAddress('user-id', { ...addressData });
await updateAddress('address-id', 'user-id', { ...updates });
await deleteAddress('address-id', 'user-id');
await setDefaultAddress('address-id', 'user-id');
```

### Shops Service (`lib/services/shops.ts`)

```typescript
import { getAllShops, getShopById } from '@/lib/services/shops';

// Get all shops
const shops = await getAllShops();

// Get shop by ID
const shop = await getShopById('shop-id');
```

### Coupons Service (`lib/services/coupons.ts`)

```typescript
import { validateCoupon, applyCoupon } from '@/lib/services/coupons';

// Validate coupon
const result = await validateCoupon('SAVE10', 500);
if (result.valid) {
  const discount = result.discount;
  // Apply coupon
  if (result.coupon) {
    await applyCoupon(result.coupon.id);
  }
}
```

### Addons Service (`lib/services/addons.ts`)

```typescript
import { getAllAddons, getAddonById } from '@/lib/services/addons';

// Get all addons
const addons = await getAllAddons();

// Get addon by ID
const addon = await getAddonById('addon-id');
```

### Favorites Service (`lib/services/favorites.ts`)

```typescript
import { 
  getUserFavorites, 
  addToFavorites, 
  removeFromFavorites,
  toggleFavorite,
  isFavorite
} from '@/lib/services/favorites';

// Get favorites
const favorites = await getUserFavorites('user-id');

// Toggle favorite
const isFav = await toggleFavorite('user-id', 'product-id');

// Check if favorite
const isFav = await isFavorite('user-id', 'product-id');
```

## Database Functions

The migration includes these PostgreSQL functions:

1. **generate_order_number()** - Generates unique order numbers (#TAZ####)
2. **generate_otp()** - Generates 6-digit OTP for delivery verification
3. **update_updated_at_column()** - Trigger function to update timestamps

## Security

All tables have Row Level Security (RLS) enabled with policies that:
- Allow public read access to products, shops, addons, and coupons
- Restrict user data (orders, addresses, favorites) to the owner
- Ensure users can only manage their own data

## Order Flow

1. **Create Order**: User creates order with items
2. **Order Placed**: Initial timeline event created
3. **Status Updates**: Order status changes trigger timeline events
4. **Delivery**: OTP generated for verification
5. **Completion**: Order marked as delivered

## Sample Data

The migration includes sample data for:
- 3 shops
- 2 addons
- 2 coupons

You can add products manually or create a seed script.

## Error Handling

All services throw errors that should be caught and handled in the UI:

```typescript
try {
  const products = await getAllProducts();
} catch (error) {
  console.error('Failed to fetch products:', error);
  // Show error to user
}
```

## Next Steps

1. **Seed Products**: Create a script to populate products from `dummyData.ts`
2. **Admin Panel**: Create admin functions for managing products, orders, etc.
3. **Real-time Updates**: Use Supabase Realtime for order status updates
4. **File Storage**: Configure Supabase Storage for product images
5. **Push Notifications**: Integrate push notifications for order updates

## Migration File

The complete schema is in:
`supabase/migrations/20250115000000_complete_backend_schema.sql`

Apply this migration to set up your database.

