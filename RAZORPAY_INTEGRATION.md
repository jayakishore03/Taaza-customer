# Razorpay Payment Integration - Setup Complete

## ✅ What Has Been Done

1. **Backend Integration:**
   - ✅ Installed Razorpay package (`razorpay`)
   - ✅ Created payment controller (`backend/src/controllers/paymentController.js`)
   - ✅ Created payment routes (`backend/src/routes/payments.js`)
   - ✅ Added payment routes to server
   - ✅ Created payment API client for frontend (`lib/api/payments.ts`)

2. **Frontend Integration:**
   - ✅ Updated payment screen to use Razorpay API
   - ✅ Added payment API to exports

## 🔧 Setup Required

### Step 1: Add Environment Variables

Create or update the `.env` file in the `backend` directory with your Razorpay test keys:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RkgC2RZSP1gZNW
RAZORPAY_KEY_SECRET=ivWo5qTwct9dCsKlCG43NhCS
```

### Step 2: Restart Backend Server

After adding the environment variables, restart your backend server:

```bash
cd backend
npm run dev
```

## 📡 API Endpoints Available

The following payment endpoints are now available:

1. **POST** `/api/payments/create-order`
   - Creates a Razorpay order
   - Body: `{ amount: number, currency?: string, receipt?: string, notes?: object }`
   - Returns: `{ orderId, amount, currency, receipt }`

2. **POST** `/api/payments/verify`
   - Verifies payment signature
   - Body: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
   - Returns: Payment details if verification succeeds

3. **GET** `/api/payments/status/:paymentId`
   - Gets payment status
   - Returns: Payment details and status

## 🔄 Next Steps for Full Integration

The current implementation creates Razorpay orders. For a complete payment flow, you'll need to:

1. **Install Razorpay React Native SDK** (if using native):
   ```bash
   npm install react-native-razorpay
   ```

2. **Or use Razorpay Checkout** (web-based, works with Expo):
   - Open Razorpay Checkout in a WebView
   - Handle payment success/failure callbacks
   - Verify payment on backend before creating order

3. **Update Payment Flow:**
   - Create Razorpay order (already done)
   - Open Razorpay checkout
   - On success, verify payment on backend
   - Only create order after successful verification

## 📝 Current Behavior

- **Cash on Delivery**: Works fully - creates order directly
- **UPI/Card Payments**: Creates Razorpay order but needs checkout integration

## 🔐 Security Notes

- These are **TEST API keys** - safe for development
- For production, get production keys from Razorpay dashboard
- Always verify payment signatures on the backend (already implemented)
- Never expose `RAZORPAY_KEY_SECRET` in frontend code

## 📚 Documentation

See `backend/RAZORPAY_SETUP.md` for detailed setup instructions.

