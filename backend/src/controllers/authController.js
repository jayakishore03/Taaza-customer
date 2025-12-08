/**
 * Authentication Controller
 * Handles user sign up and sign in
 */

import { supabase, supabaseAdmin } from '../config/database.js';
import crypto from 'crypto';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Generate a simple token (for development)
 * In production, use proper JWT library like jsonwebtoken
 */
function generateToken(userId) {
  // Simple token generation - in production use JWT
  const payload = {
    userId,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify token
 */
function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    // Token expires after 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > thirtyDays) {
      return null;
    }
    return payload.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Sign up
 * POST /api/auth/signup
 */
export const signUp = async (req, res, next) => {
  try {
    const { name, email, phone, password, address, gender, profilePicture } = req.body;

    console.log('========================================');
    console.log('📝 SIGN-UP REQUEST RECEIVED');
    console.log('========================================');
    console.log('Name:', name);
    console.log('Phone:', phone);
    console.log('Email:', email || 'Not provided');
    console.log('Gender:', gender || 'Not provided');
    console.log('Profile Picture:', profilePicture || 'Not provided');
    console.log('Address:', address ? JSON.stringify(address, null, 2) : 'Not provided');
    console.log('========================================');
    console.log('Email:', email || 'Not provided');
    console.log('Has Address:', !!address);
    console.log('Has Gender:', !!gender);
    console.log('Has Profile Picture:', !!profilePicture);
    console.log('========================================');

    // Validate required fields
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, phone, and password are required' },
      });
    }

    // Check if user already exists in users table (by phone)
    const { data: existingUsersByPhone } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone);

    if (existingUsersByPhone && existingUsersByPhone.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this phone number already exists. Please sign in instead.' },
      });
    }

    // Also check user_profiles table for phone number
    const { data: existingProfilesByPhone } = await supabase
      .from('user_profiles')
      .select('id, name, phone')
      .eq('phone', phone);

    if (existingProfilesByPhone && existingProfilesByPhone.length > 0) {
      console.log('⚠️  User profile exists but not in users table:', existingProfilesByPhone[0]);
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this phone number already exists. Please sign in instead.' },
      });
    }

    // Check if user already exists by email in users table
    if (email) {
      const { data: existingUsersByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

      if (existingUsersByEmail && existingUsersByEmail.length > 0) {
      return res.status(409).json({
        success: false,
          error: { message: 'An account with this email already exists. Please sign in or use a different email.' },
        });
      }

      // Also check user_profiles table for email
      const { data: existingProfilesByEmail } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .eq('email', email);

      if (existingProfilesByEmail && existingProfilesByEmail.length > 0) {
        console.log('⚠️  User profile exists but not in users table:', existingProfilesByEmail[0]);
        return res.status(409).json({
          success: false,
          error: { message: 'An account with this email already exists. Please sign in or use a different email.' },
        });
      }
    }

    // Generate user ID
    const userId = crypto.randomUUID();

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user
    const userData = {
      id: userId,
      name,
      email: email || null,
      phone,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      console.error('❌ ERROR CREATING USER:', userError);
      // Handle database constraint errors with user-friendly messages
      if (userError.code === '23505') { // PostgreSQL unique violation error code
        if (userError.message.includes('users_email_key')) {
          return res.status(409).json({
            success: false,
            error: { message: 'An account with this email already exists. Please sign in or use a different email.' },
          });
        }
        if (userError.message.includes('users_phone_key')) {
          return res.status(409).json({
            success: false,
            error: { message: 'An account with this phone number already exists. Please sign in instead.' },
          });
        }
        return res.status(409).json({
          success: false,
          error: { message: 'An account with these details already exists.' },
        });
      }
      throw userError;
    }

    console.log('✅ User created successfully in users table');
    console.log('   User ID:', userId);

    // Create user profile
    const profileData = {
      id: userId,
      name,
      email: email || null,
      phone,
      gender: gender || null,
      profile_picture: profilePicture || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData);

    if (profileError) {
      console.error('❌ ERROR CREATING USER PROFILE:', profileError);
      // Delete the user we just created to maintain consistency
      await supabaseAdmin.from('users').delete().eq('id', userId);
      
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create user profile. Please try again.' },
      });
    }

    console.log('✅ User profile created successfully in user_profiles table');

    // Create default address if provided
    let addressId = null;
    if (address && address.street && address.city && address.state && address.postalCode) {
      console.log('📍 Creating address in addresses table...');
      console.log('   Address Data:', JSON.stringify(address, null, 2));
      
      const addressData = {
        user_id: userId,
        contact_name: address.contactName || name,
        phone: address.phone || phone,
        street: address.street,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        landmark: address.landmark || null,
        label: address.label || 'Home',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: addressResult, error: addressError } = await supabaseAdmin
        .from('addresses')
        .insert(addressData)
        .select()
        .single();

      if (addressError) {
        console.error('⚠️  ERROR CREATING ADDRESS:', addressError);
        console.error('   Address Data Attempted:', JSON.stringify(addressData, null, 2));
        // Don't fail signup if address creation fails
        // User can add address later from profile
      } else {
        addressId = addressResult?.id;
        console.log('✅ Address created successfully in addresses table');
        console.log('   Address ID:', addressId);
        
        // Update user_profile with address_id
        const { error: profileUpdateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ address_id: addressId })
          .eq('id', userId);
        
        if (profileUpdateError) {
          console.error('⚠️  Warning: Could not link address to profile:', profileUpdateError);
        } else {
          console.log('✅ Address linked to user profile');
        }
      }
    } else {
      console.log('⚠️  No complete address provided during signup');
      if (address) {
        console.log('   Incomplete address data:', JSON.stringify(address, null, 2));
      }
    }

    // Generate token
    const token = generateToken(userId);

    // Log sign-up activity
    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    try {
      // Create login session
      const sessionResult = await supabaseAdmin.from('login_sessions').insert({
        id: sessionId,
        user_id: userId,
        token,
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null,
        login_at: now,
        last_activity_at: now,
        expires_at: expiresAt,
        is_active: 1,
      });

      if (!sessionResult.error) {
        console.log('========================================');
        console.log('✅ SIGN-UP SAVED TO DATABASE');
        console.log('========================================');
        console.log(`User ID: ${userId}`);
        console.log(`Name: ${name}`);
        console.log(`Phone: ${phone}`);
        console.log(`Email: ${email || 'None'}`);
        console.log(`Session ID: ${sessionId}`);
        console.log(`Registered At: ${now}`);
        console.log(`Has Address: ${!!address}`);
        console.log('========================================');
      }

      // Log sign-up activity
      await logActivity(req, 'SIGN_UP', 'New user registered', 'user', userId, {
        phone,
        email: email || null,
        hasAddress: !!address,
      });
    } catch (logError) {
      // Don't fail the sign-up if logging fails
      console.error('Error logging sign-up activity:', logError);
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign in
 * POST /api/auth/signin
 */
export const signIn = async (req, res, next) => {
  try {
    const { phone, password, email } = req.body;

    // Validate required fields
    if (!password || (!phone && !email)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone/email and password are required' },
      });
    }

    // Find user by phone or email
    let query = supabase
      .from('users')
      .select('*');

    if (phone) {
      query = query.eq('phone', phone);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      // Check if profile exists without user (orphaned profile)
      const phoneOrEmail = phone || email;
      const { data: orphanedProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .or(phone ? `phone.eq.${phone}` : `email.eq.${email}`);

      if (orphanedProfiles && orphanedProfiles.length > 0) {
        // Orphaned profile found - data inconsistency
        console.log('⚠️  ORPHANED PROFILE DETECTED:');
        console.log('   Profile exists but no user account');
        console.log('   Phone/Email:', phoneOrEmail);
        console.log('   Profile:', orphanedProfiles[0]);
        
        return res.status(401).json({
          success: false,
          error: { 
            message: 'Your account data is incomplete. Please contact support or sign up again to create a new account.',
            code: 'ORPHANED_PROFILE'
          },
        });
      }

      return res.status(401).json({
        success: false,
        error: { message: 'No account found with this phone number or email. Please check your details or sign up.' },
      });
    }

    const user = users[0];

    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        error: { message: 'Incorrect password. Please try again or use "Forgot Password" to reset it.' },
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Log login activity
    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    try {
      // Create login session
      const sessionResult = await supabaseAdmin.from('login_sessions').insert({
        id: sessionId,
        user_id: user.id,
        token,
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null,
        login_at: now,
        last_activity_at: now,
        expires_at: expiresAt,
        is_active: 1,
      });

      if (!sessionResult.error) {
        console.log('========================================');
        console.log('✅ SIGN-IN SAVED TO DATABASE');
        console.log('========================================');
        console.log(`User ID: ${user.id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Phone: ${user.phone}`);
        console.log(`Email: ${user.email || 'None'}`);
        console.log(`Session ID: ${sessionId}`);
        console.log(`Login At: ${now}`);
        console.log(`IP Address: ${req.ip || req.headers['x-forwarded-for'] || 'Unknown'}`);
        console.log('========================================');
      }

      // Log sign-in activity
      await logActivity(req, 'SIGN_IN', 'User signed in successfully', 'user', user.id, {
        phone: user.phone,
        email: user.email,
      });
    } catch (logError) {
      // Don't fail the login if logging fails
      console.error('Error logging sign-in activity:', logError);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify token
 * GET /api/auth/verify
 */
export const verifyAuthToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' },
      });
    }

    const token = authHeader.substring(7);
    const userId = verifyToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' },
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send password reset OTP
 * POST /api/auth/forgot-password
 */
export const sendPasswordResetOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number is required' },
      });
    }

    // Check if user exists
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone);

    if (!users || users.length === 0) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        data: { message: 'If the phone number exists, an OTP has been sent.' },
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in memory (in production, use Redis or database with expiration)
    // For now, we'll store it in a simple in-memory store
    if (!global.passwordResetOTPs) {
      global.passwordResetOTPs = new Map();
    }
    
    // Store OTP with 10 minute expiration and verified flag
    global.passwordResetOTPs.set(phone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      verified: false,
    });

    // In production, send OTP via WhatsApp/SMS
    // For now, we'll log it (in production, remove this)
    console.log('========================================');
    console.log('🔐 PASSWORD RESET OTP');
    console.log('========================================');
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log('========================================');

    res.json({
      success: true,
      data: { 
        message: 'OTP has been sent to your WhatsApp number.',
        // For testing only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify password reset OTP
 * POST /api/auth/verify-reset-otp
 */
export const verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number and OTP are required' },
      });
    }

    // Check if OTP exists and is valid
    if (!global.passwordResetOTPs) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired OTP' },
      });
    }

    const otpData = global.passwordResetOTPs.get(phone);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired OTP' },
      });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      global.passwordResetOTPs.delete(phone);
      return res.status(400).json({
        success: false,
        error: { message: 'OTP has expired. Please request a new one.' },
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid OTP' },
      });
    }

    // Mark OTP as verified
    otpData.verified = true;
    global.passwordResetOTPs.set(phone, otpData);

    res.json({
      success: true,
      data: { message: 'OTP verified successfully. You can now reset your password.' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if phone number is already registered
 * POST /api/auth/check-phone
 */
export const checkPhoneExists = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number is required' },
      });
    }

    // Check if phone exists in users table
    const { data: usersWithPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone);

    const existsInUsers = usersWithPhone && usersWithPhone.length > 0;

    // Also check user_profiles table
    const { data: profilesWithPhone } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', phone);

    const existsInProfiles = profilesWithPhone && profilesWithPhone.length > 0;

    // If exists in either table, consider it as registered
    const exists = existsInUsers || existsInProfiles;

    // Log inconsistency if user exists in one table but not the other
    if (existsInUsers !== existsInProfiles) {
      console.log('⚠️  Data inconsistency detected:');
      console.log(`   Phone: ${phone}`);
      console.log(`   In users table: ${existsInUsers}`);
      console.log(`   In profiles table: ${existsInProfiles}`);
    }

    res.json({
      success: true,
      data: {
        exists,
        message: exists 
          ? 'This phone number is already registered' 
          : 'Phone number is available',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clean up orphaned profile and allow re-signup
 * POST /api/auth/cleanup-orphaned-profile
 */
export const cleanupOrphanedProfile = async (req, res, next) => {
  try {
    const { phone, email } = req.body;

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number or email is required' },
      });
    }

    console.log('========================================');
    console.log('🧹 CLEANUP ORPHANED PROFILE REQUEST');
    console.log('========================================');
    console.log('Phone:', phone || 'Not provided');
    console.log('Email:', email || 'Not provided');

    // Check if user exists in users table
    let userQuery = supabase.from('users').select('*');
    if (phone) {
      userQuery = userQuery.eq('phone', phone);
    } else if (email) {
      userQuery = userQuery.eq('email', email);
    }
    
    const { data: existingUsers } = await userQuery;

    if (existingUsers && existingUsers.length > 0) {
      // User exists - not orphaned
      return res.status(400).json({
        success: false,
        error: { message: 'This account is valid. Please use sign in instead.' },
      });
    }

    // Check if profile exists
    let profileQuery = supabase.from('user_profiles').select('*');
    if (phone) {
      profileQuery = profileQuery.eq('phone', phone);
    } else if (email) {
      profileQuery = profileQuery.eq('email', email);
    }

    const { data: orphanedProfiles } = await profileQuery;

    if (!orphanedProfiles || orphanedProfiles.length === 0) {
      // No profile exists - user can sign up normally
      return res.json({
        success: true,
        data: { 
          message: 'No orphaned profile found. You can proceed with signup.',
          canSignup: true
        },
      });
    }

    // Orphaned profile found - delete it and related data
    const profileId = orphanedProfiles[0].id;

    console.log('Found orphaned profile:', profileId);
    console.log('Deleting related data...');

    // Delete related data
    await supabaseAdmin.from('addresses').delete().eq('user_id', profileId);
    await supabaseAdmin.from('orders').delete().eq('user_id', profileId);
    await supabaseAdmin.from('login_sessions').delete().eq('user_id', profileId);
    await supabaseAdmin.from('activity_logs').delete().eq('user_id', profileId);
    
    // Delete the orphaned profile
    const { error: deleteError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', profileId);

    if (deleteError) {
      console.error('Error deleting orphaned profile:', deleteError);
      throw deleteError;
    }

    console.log('✅ Orphaned profile cleaned up successfully');
    console.log('========================================');

    res.json({
      success: true,
      data: { 
        message: 'Orphaned profile has been cleaned up. You can now sign up with this phone number/email.',
        canSignup: true
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Reset password (after OTP verification)
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number and new password are required' },
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long' },
      });
    }

    // Check if OTP exists and is verified
    if (!global.passwordResetOTPs) {
      return res.status(400).json({
        success: false,
        error: { message: 'OTP verification required. Please verify OTP first.' },
      });
    }

    const otpData = global.passwordResetOTPs.get(phone);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: { message: 'OTP verification required. Please verify OTP first.' },
      });
    }

    // Check if OTP is verified
    if (!otpData.verified) {
      return res.status(400).json({
        success: false,
        error: { message: 'OTP must be verified before resetting password.' },
      });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      global.passwordResetOTPs.delete(phone);
      return res.status(400).json({
        success: false,
        error: { message: 'OTP has expired. Please request a new one.' },
      });
    }

    // Find user
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone);

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Remove OTP after successful reset
    global.passwordResetOTPs.delete(phone);

    // Log password reset activity
    try {
      await logActivity(req, 'PASSWORD_RESET', 'User reset password via OTP', 'user', user.id, {
        phone,
      });
    } catch (logError) {
      console.error('Error logging password reset activity:', logError);
    }

    res.json({
      success: true,
      data: { message: 'Password has been reset successfully. You can now sign in with your new password.' },
    });
  } catch (error) {
    next(error);
  }
};

