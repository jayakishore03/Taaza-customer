/**
 * Coupons Routes
 */

import express from 'express';
import {
  validateCoupon,
  applyCoupon,
} from '../controllers/couponsController.js';

const router = express.Router();

// Public routes
router.post('/validate', validateCoupon);
router.post('/:id/apply', applyCoupon);

export default router;

