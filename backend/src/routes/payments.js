/**
 * Payment Routes
 */

import express from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
} from '../controllers/paymentController.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', createRazorpayOrder);

// Verify payment
router.post('/verify', verifyPayment);

// Get payment status
router.get('/status/:paymentId', getPaymentStatus);

export default router;

