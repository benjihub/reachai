import { getUser } from '../services/supabase.js';

/**
 * Middleware to verify user token (JWT or session ID)
 * For now, we'll use userId as token (replace with proper JWT later)
 */
export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    // TODO: Verify JWT token properly
    // For MVP, we'll accept the token as-is and verify the user exists
    const user = await getUser(token);

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 401);
    }

    // Store user in context for route handlers
    c.set('user', user);
    c.set('userId', user.id);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ success: false, error: 'Authentication failed' }, 401);
  }
};

export default authMiddleware;
