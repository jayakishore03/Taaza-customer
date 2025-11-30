# Razorpay Payment Integration Setup

## Environment Variables

Add the following Razorpay API keys to your `.env` file in the `backend` directory:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RkgC2RZSP1gZNW
RAZORPAY_KEY_SECRET=ivWo5qTwct9dCsKlCG43NhCS
```

## Setup Instructions

1. **Create or update `.env` file in `backend` directory:**
   ```bash
   cd backend
   ```

2. **Add the Razorpay keys to your `.env` file:**
   ```env
   RAZORPAY_KEY_ID=rzp_test_RkgC2RZSP1gZNW
   RAZORPAY_KEY_SECRET=ivWo5qTwct9dCsKlCG43NhCS
   ```

3. **Restart the backend server:**
   ```bash
   npm run dev
   ```

## API Endpoints

The following payment endpoints are now available:

- **POST** `/api/payments/create-order` - Create a Razorpay order
  - Body: `{ amount: number, currency?: string, receipt?: string, notes?: object }`
  - Returns: `{ orderId, amount, currency, receipt }`

- **POST** `/api/payments/verify` - Verify payment signature
  - Body: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
  - Returns: Payment details if verification succeeds

- **GET** `/api/payments/status/:paymentId` - Get payment status
  - Returns: Payment details and status

## Testing

These are **test API keys**. For production, you'll need to:
1. Get production keys from Razorpay dashboard
2. Update the `.env` file with production keys
3. Ensure your backend is using HTTPS in production

## Notes

- The Razorpay package is already installed in the backend
- Payment verification uses HMAC SHA256 signature validation
- Amounts are automatically converted to paise (smallest currency unit) for Razorpay

