# Taza Backend API

Express.js REST API backend for the Taza meat delivery app.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,http://localhost:19006
```

### 3. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products (query: category, shopId, search)
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/:id` - Get product by ID

### Orders
- `GET /api/orders` - Get user orders (requires auth)
- `GET /api/orders/:id` - Get order by ID (requires auth)
- `POST /api/orders` - Create new order (requires auth)
- `PATCH /api/orders/:id/status` - Update order status (requires auth)

### Users
- `GET /api/users/profile` - Get user profile (requires auth)
- `PATCH /api/users/profile` - Update user profile (requires auth)
- `GET /api/users/addresses` - Get user addresses (requires auth)
- `POST /api/users/addresses` - Add address (requires auth)
- `PATCH /api/users/addresses/:id` - Update address (requires auth)
- `DELETE /api/users/addresses/:id` - Delete address (requires auth)
- `PATCH /api/users/addresses/:id/default` - Set default address (requires auth)

### Shops
- `GET /api/shops` - Get all shops
- `GET /api/shops/:id` - Get shop by ID

### Coupons
- `POST /api/coupons/validate` - Validate coupon code
- `POST /api/coupons/:id/apply` - Apply coupon (increment usage)

### Addons
- `GET /api/addons` - Get all addons
- `GET /api/addons/:id` - Get addon by ID

### Payments
- `POST /api/payments/create-order` - Create Razorpay order (requires amount)
- `POST /api/payments/verify` - Verify payment signature
- `GET /api/payments/status/:paymentId` - Get payment status

## Authentication

Most endpoints require authentication. Include the Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "message": "Error message"
  }
}
```

## Example Requests

### Create Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "address-id",
    "items": [
      {
        "productId": "product-id",
        "name": "Chicken Curry Cut",
        "quantity": 2,
        "weight": "500g",
        "weightInKg": 0.5,
        "price": 160,
        "pricePerKg": 320,
        "imageUrl": "https://..."
      }
    ],
    "subtotal": 320,
    "deliveryCharge": 40,
    "discount": 0,
    "paymentMethodText": "UPI • PhonePe"
  }'
```

### Get Products

```bash
curl http://localhost:3000/api/products?category=Chicken
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # Supabase configuration
│   ├── controllers/          # Request handlers
│   │   ├── productsController.js
│   │   ├── ordersController.js
│   │   ├── usersController.js
│   │   ├── shopsController.js
│   │   ├── couponsController.js
│   │   └── addonsController.js
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   └── errorHandler.js   # Error handling
│   ├── routes/               # Route definitions
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── users.js
│   │   ├── shops.js
│   │   ├── coupons.js
│   │   └── addons.js
│   └── server.js             # Express app setup
├── .env.example
├── package.json
└── README.md
```

## Development

The server uses ES modules. Make sure your `package.json` has `"type": "module"`.

For development with auto-reload, use:
```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Update CORS origins
3. Use a process manager like PM2:
   ```bash
   pm2 start src/server.js --name taza-backend
   ```

## Notes

- The backend uses Supabase as the database
- Service role key is used for admin operations (bypasses RLS)
- Anon key is used for user operations (respects RLS)
- All user-specific endpoints require authentication
- Public endpoints (products, shops) are accessible without auth

