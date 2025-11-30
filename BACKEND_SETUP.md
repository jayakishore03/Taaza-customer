# Backend Setup Guide

This guide will help you set up the complete backend for the Taza meat delivery app.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project
3. **Node.js**: Ensure Node.js is installed (for running scripts)

## Step 1: Database Setup

### 1.1 Apply Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20250115000000_complete_backend_schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

This will create:
- All database tables
- Row Level Security (RLS) policies
- Database functions (order number generation, OTP generation)
- Triggers (auto-update timestamps)
- Sample data (shops, addons, coupons)

### 1.2 Verify Tables

Go to **Table Editor** in Supabase Dashboard and verify these tables exist:
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

## Step 2: Environment Variables

Add these to your `.env` file (or Expo environment variables):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these in:
- Supabase Dashboard → Settings → API

## Step 3: Authentication Setup

### 3.1 Enable Authentication Providers

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Enable **Email** provider
3. (Optional) Enable **Phone** provider for OTP-based login

### 3.2 Configure Auth Settings

- **Site URL**: Your app URL
- **Redirect URLs**: Add your app's redirect URLs

## Step 4: Storage Setup (Optional - for Product Images)

If you want to store product images in Supabase:

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket: `product-images`
3. Set bucket to **Public**
4. Configure policies:
   - **Public Read**: Allow anyone to read
   - **Authenticated Write**: Allow authenticated users to upload

## Step 5: Seed Products (Optional)

To populate products from your dummy data:

1. Create a script file or use the provided `lib/scripts/seed-products.ts`
2. Update image URLs to point to actual images (or use placeholders)
3. Run the script to populate products

**Note**: The seed script converts local image requires to URLs. You'll need to:
- Upload images to Supabase Storage, OR
- Use external image URLs, OR
- Use placeholder images

## Step 6: Test the Backend

### 6.1 Test Database Connection

```typescript
import { supabase } from './lib/supabase';

// Test connection
const { data, error } = await supabase.from('shops').select('*');
console.log('Shops:', data);
```

### 6.2 Test Services

```typescript
import { getAllShops, getAllProducts } from './lib/services';

// Test shops
const shops = await getAllShops();
console.log('Shops:', shops);

// Test products
const products = await getAllProducts();
console.log('Products:', products);
```

## Step 7: Integration with Frontend

### 7.1 Update Auth Context

Replace dummy auth with Supabase auth:

```typescript
import { supabase } from './lib/supabase';
import { getUserProfile, upsertUserProfile } from './lib/services/users';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

if (data.user) {
  await upsertUserProfile(data.user.id, {
    name,
    email,
    phone,
  });
}
```

### 7.2 Update Product Fetching

Replace dummy data with API calls:

```typescript
import { getAllProducts, getProductsByCategory } from './lib/services/products';

// In your component
const [products, setProducts] = useState<Product[]>([]);

useEffect(() => {
  const fetchProducts = async () => {
    const data = await getProductsByCategory('Chicken');
    setProducts(data);
  };
  fetchProducts();
}, []);
```

### 7.3 Update Order Creation

```typescript
import { createOrder } from './lib/services/orders';

const order = await createOrder({
  userId: user.id,
  addressId: address.id,
  items: cartItems.map(item => ({
    productId: item.product.id,
    name: item.product.name,
    quantity: item.quantity,
    weight: item.product.weight,
    weightInKg: item.product.weightInKg,
    price: item.product.price,
    pricePerKg: item.product.pricePerKg,
    imageUrl: typeof item.product.image === 'string' ? item.product.image : '',
  })),
  subtotal: cartTotal,
  deliveryCharge: 40,
  discount: couponDiscount,
  paymentMethodText: 'UPI • PhonePe',
});
```

## Troubleshooting

### Issue: RLS Policy Errors

**Solution**: Ensure RLS is enabled and policies are correctly set. Check the migration file.

### Issue: Cannot Insert Products

**Solution**: 
- Check if you're authenticated (for user-specific tables)
- Verify RLS policies allow the operation
- Check table constraints (required fields, foreign keys)

### Issue: Order Number Not Generated

**Solution**: 
- Verify the `generate_order_number()` function exists
- Check function permissions
- Fallback: Use timestamp-based order numbers

### Issue: Images Not Loading

**Solution**:
- Verify image URLs are accessible
- Check Supabase Storage bucket permissions
- Ensure images are uploaded to Storage or use external URLs

## Next Steps

1. **Real-time Updates**: Set up Supabase Realtime for order status updates
2. **Push Notifications**: Integrate push notifications for order updates
3. **Admin Dashboard**: Create admin functions for managing products/orders
4. **Analytics**: Set up analytics tracking
5. **Payment Integration**: Integrate payment gateways (Razorpay, Stripe, etc.)

## Support

For issues or questions:
1. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Review the migration file comments
3. Check service file implementations

## File Structure

```
lib/
├── services/          # API service modules
│   ├── products.ts
│   ├── orders.ts
│   ├── users.ts
│   ├── shops.ts
│   ├── coupons.ts
│   ├── addons.ts
│   ├── favorites.ts
│   └── index.ts
├── types/
│   └── database.ts    # TypeScript database types
├── utils/
│   └── helpers.ts      # Utility functions
├── scripts/
│   └── seed-products.ts  # Product seeding script
└── supabase.ts        # Supabase client

supabase/
└── migrations/
    └── 20250115000000_complete_backend_schema.sql
```

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ User data restricted to owners
- ✅ Public read access only for products/shops
- ✅ Authentication required for user operations
- ✅ Input validation in services
- ⚠️  Add rate limiting (recommended)
- ⚠️  Add request validation (recommended)
- ⚠️  Encrypt sensitive data (payment methods)

