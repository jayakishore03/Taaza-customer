/**
 * Payment Controller
 * Handles Razorpay payment integration
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance lazily
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        'Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.'
      );
    }

    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpay;
};

/**
 * Create Razorpay order
 * POST /api/payments/create-order
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Amount is required and must be greater than 0' },
      });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes,
    };

    const razorpayInstance = getRazorpayInstance();
    const order = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    next(error);
  }
};

/**
 * Verify Razorpay payment
 * POST /api/payments/verify
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required payment verification parameters' },
      });
    }

    // Create signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Verify signature
    const isSignatureValid = generated_signature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment verification failed: Invalid signature' },
      });
    }

    // Fetch payment details from Razorpay
    try {
      const razorpayInstance = getRazorpayInstance();
      const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
      
      res.json({
        success: true,
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: payment.status,
          amount: payment.amount / 100, // Convert from paise to rupees
          currency: payment.currency,
          method: payment.method,
          captured: payment.captured,
        },
      });
    } catch (error) {
      console.error('Error fetching payment from Razorpay:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Error verifying payment with Razorpay' },
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    next(error);
  }
};

/**
 * Get payment status
 * GET /api/payments/status/:paymentId
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment ID is required' },
      });
    }

    const razorpayInstance = getRazorpayInstance();
    const payment = await razorpayInstance.payments.fetch(paymentId);

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        status: payment.status,
        amount: payment.amount / 100, // Convert from paise to rupees
        currency: payment.currency,
        method: payment.method,
        captured: payment.captured,
        createdAt: new Date(payment.created_at * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found' },
      });
    }
    next(error);
  }
};

