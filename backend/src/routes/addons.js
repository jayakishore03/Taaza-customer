/**
 * Addons Routes
 */

import express from 'express';
import {
  getAllAddons,
  getAddonById,
} from '../controllers/addonsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllAddons);
router.get('/:id', optionalAuth, getAddonById);

export default router;

