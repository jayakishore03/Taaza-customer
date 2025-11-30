/**
 * Shops Routes
 */

import express from 'express';
import {
  getAllShops,
  getShopById,
} from '../controllers/shopsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllShops);
router.get('/:id', optionalAuth, getShopById);

export default router;

