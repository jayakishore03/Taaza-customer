/**
 * Authentication Middleware
 * Validates backend tokens
 */

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

export const authenticate = async (req, res, next) => {
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

    // Attach user to request
    req.userId = userId;

    // Update last activity for session (async, don't block)
    import('../utils/activityLogger.js').then(({ updateLastActivity }) => {
      updateLastActivity(req).catch(err => console.error('Error updating last activity:', err));
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: { message: 'Authentication failed' },
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userId = verifyToken(token);
      
      if (userId) {
        req.userId = userId;
      }
    }

    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};

