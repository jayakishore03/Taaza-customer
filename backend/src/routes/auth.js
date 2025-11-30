/**
 * Authentication Routes
 */

import express from 'express';
import { signUp, signIn, verifyAuthToken, sendPasswordResetOTP, verifyPasswordResetOTP, resetPassword } from '../controllers/authController.js';

const router = express.Router();

// Sign up
router.post('/signup', signUp);

// Sign in
router.post('/signin', signIn);

// Verify token
router.get('/verify', verifyAuthToken);

// Forgot password - send OTP
router.post('/forgot-password', sendPasswordResetOTP);

// Verify password reset OTP
router.post('/verify-reset-otp', verifyPasswordResetOTP);

// Reset password - set new password (after OTP verification)
router.post('/reset-password', resetPassword);

export default router;

