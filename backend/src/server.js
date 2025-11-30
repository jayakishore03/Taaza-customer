/**
 * Express Server
 * Main entry point for the Taza backend API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Routes
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import usersRoutes from './routes/users.js';
import shopsRoutes from './routes/shops.js';
import couponsRoutes from './routes/coupons.js';
import addonsRoutes from './routes/addons.js';
import paymentsRoutes from './routes/payments.js';
import paymentMethodsRoutes from './routes/paymentMethods.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static images from backend/images folder
app.use('/images', express.static(join(__dirname, '../images')));

// Handle favicon requests (browsers automatically request this)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content - browser will use default
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Taza API is running',
    timestamp: new Date().toISOString(),
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Taza API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users',
      shops: '/api/shops',
      coupons: '/api/coupons',
      addons: '/api/addons',
      payments: '/api/payments',
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/addons', addonsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server - listen on all interfaces (0.0.0.0) to allow mobile device connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Taza Backend API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API base: http://localhost:${PORT}/api`);
    console.log(`📱 Mobile access: http://192.168.0.8:${PORT}/api (or your computer's IP)`);
});

export default app;

