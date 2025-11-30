/**
 * Activity Logger Utility
 * Logs all user activities to the database
 */

import { supabaseAdmin } from '../config/database.js';
import crypto from 'crypto';

/**
 * Log user activity
 */
export async function logActivity(req, activityType, description, entityType = null, entityId = null, metadata = null) {
  try {
    const userId = req.userId;
    if (!userId) return; // Skip if no user

    const now = new Date().toISOString();
    
    await supabaseAdmin.from('user_activity_logs').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      activity_type: activityType,
      activity_description: description,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
      user_agent: req.headers['user-agent'] || null,
      created_at: now,
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Error logging activity:', error);
  }
}

/**
 * Update last activity for login session
 */
export async function updateLastActivity(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return;

    const token = authHeader.substring(7);
    const now = new Date().toISOString();

    await supabaseAdmin
      .from('login_sessions')
      .update({ last_activity_at: now })
      .eq('token', token)
      .eq('is_active', 1);
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
}

