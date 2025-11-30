/**
 * Products Routes
 */

import express from 'express';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
} from '../controllers/productsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllProducts);
router.get('/category/:category', optionalAuth, getProductsByCategory);
router.get('/:id', optionalAuth, getProductById);

export default router;

