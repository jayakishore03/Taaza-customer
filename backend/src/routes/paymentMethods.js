/**
 * Payment Methods Routes
 */

import express from 'express';
import {
  getUserPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../controllers/paymentMethodsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all payment methods for user
router.get('/', getUserPaymentMethods);

// Create new payment method
router.post('/', createPaymentMethod);

// Delete payment method
router.delete('/:id', deletePaymentMethod);

// Set payment method as default
router.patch('/:id/set-default', setDefaultPaymentMethod);

export default router;

