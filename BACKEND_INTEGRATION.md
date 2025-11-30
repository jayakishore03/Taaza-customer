# Backend Integration Guide

This guide explains how to integrate the Express backend with your React Native frontend.

## Setup

### 1. Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:8081,http://localhost:19006
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Configuration

Add the API URL to your environment variables:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

For production, use your deployed backend URL:
```env
EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api
```

## Authentication Setup

### Update AuthContext

Update your `contexts/AuthContext.tsx` to use the backend API:

```typescript
import { apiClient } from '../lib/api/client';
import { usersApi } from '../lib/api/users';
import { supabase } from '../lib/supabase';

// After Supabase sign in/sign up, set the token:
const { data: { session } } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (session?.access_token) {
  apiClient.setToken(session.access_token);
}
```

## Using the API

### Products

Replace dummy data calls with API calls:

```typescript
import { productsApi } from '../lib/api/products';

// Instead of: getProductsByCategory('Chicken')
const products = await productsApi.getByCategory('Chicken');

// Instead of: getAllProducts()
const allProducts = await productsApi.getAll();

// Instead of: getProductById(id)
const product = await productsApi.getById(id);
```

### Orders

```typescript
import { ordersApi } from '../lib/api/orders';

// Get user orders
const orders = await ordersApi.getAll();

// Get single order
const order = await ordersApi.getById(orderId);

// Create order
const newOrder = await ordersApi.create({
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

### Users

```typescript
import { usersApi } from '../lib/api/users';

// Get profile
const profile = await usersApi.getProfile();

// Update profile
await usersApi.updateProfile({ name: 'New Name' });

// Manage addresses
const addresses = await usersApi.getAddresses();
await usersApi.addAddress({ ...addressData });
await usersApi.updateAddress(addressId, { ...updates });
await usersApi.deleteAddress(addressId);
await usersApi.setDefaultAddress(addressId);
```

### Shops

```typescript
import { shopsApi } from '../lib/api/shops';

const shops = await shopsApi.getAll();
const shop = await shopsApi.getById(shopId);
```

### Coupons

```typescript
import { couponsApi } from '../lib/api/coupons';

const result = await couponsApi.validate('SAVE10', 500);
if (result.valid && result.coupon) {
  await couponsApi.apply(result.coupon.id);
}
```

### Favorites

```typescript
import { favoritesApi } from '../lib/api/favorites';

const favorites = await favoritesApi.getAll();
await favoritesApi.toggle(productId);
```

## Example: Updating Home Screen

```typescript
// app/(tabs)/index.tsx
import { productsApi } from '../../lib/api/products';
import { shopsApi } from '../../lib/api/shops';

useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch shops
      const shopsData = await shopsApi.getAll();
      setShops(shopsData);

      // Fetch products
      if (selectedCategory) {
        const productsData = await productsApi.getByCategory(selectedCategory);
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  };

  fetchData();
}, [selectedCategory]);
```

## Example: Updating Cart/Checkout

```typescript
// app/checkout.tsx
import { ordersApi } from '../lib/api/orders';
import { usersApi } from '../lib/api/users';
import { couponsApi } from '../lib/api/coupons';

// Apply coupon
const handleApplyCoupon = async () => {
  try {
    const result = await couponsApi.validate(couponCode, subtotal);
    if (result.valid) {
      setDiscount(result.discount);
      if (result.coupon) {
        await couponsApi.apply(result.coupon.id);
      }
    } else {
      Alert.alert('Invalid Coupon', result.error || 'Invalid coupon code');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to validate coupon');
  }
};

// Place order
const handlePlaceOrder = async () => {
  try {
    const order = await ordersApi.create({
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
      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      discount,
      paymentMethodText: 'UPI • PhonePe',
    });

    router.push({
      pathname: '/orders/[orderId]',
      params: { orderId: order.id },
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to place order. Please try again.');
  }
};
```

## Error Handling

All API functions throw errors. Wrap them in try-catch:

```typescript
try {
  const products = await productsApi.getAll();
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Error', error.message || 'Something went wrong');
}
```

## Token Management

The API client automatically includes the token in requests. Make sure to set it after login:

```typescript
// After Supabase authentication
const { data: { session } } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (session?.access_token) {
  apiClient.setToken(session.access_token);
}
```

## Testing

### Test Backend

```bash
# Health check
curl http://localhost:3000/health

# Get products (no auth required)
curl http://localhost:3000/api/products

# Get orders (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/orders
```

### Test Frontend

Make sure:
1. Backend is running on port 3000
2. `EXPO_PUBLIC_API_URL` is set correctly
3. Token is set after authentication

## Production Deployment

1. Deploy backend to a hosting service (Railway, Render, Heroku, etc.)
2. Update `EXPO_PUBLIC_API_URL` to production URL
3. Update CORS origins in backend `.env`
4. Use HTTPS in production

## Troubleshooting

### CORS Errors

Make sure `CORS_ORIGIN` in backend `.env` includes your frontend URL.

### 401 Unauthorized

- Check if token is set: `apiClient.setToken(token)`
- Verify token is valid (not expired)
- Check Authorization header format: `Bearer <token>`

### Connection Refused

- Verify backend is running
- Check `EXPO_PUBLIC_API_URL` is correct
- For mobile, use your computer's IP address instead of `localhost`

