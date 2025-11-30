/**
 * Orders Routes
 */

import express from 'express';
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from '../controllers/ordersController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;

