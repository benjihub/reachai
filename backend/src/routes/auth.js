import { Hono } from 'hono';
import { upsertUser } from '../services/supabase.js';

const router = new Hono();

/**
 * POST /auth/google
 * Verify Google token and create/update user
 *
 * Body: { googleToken: string }
 * Response: { success: true, data: { userId, email, name, avatar, plan } }
 */
router.post('/google', async (c) => {
  try {
    const body = await c.req.json();
    const { googleToken } = body;

    if (!googleToken) {
      return c.json(
        { success: false, error: 'Missing googleToken' },
        400
      );
    }

    // Step 1: Verify token with Google
    let tokenInfo;
    try {
      const tokenInfoUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(googleToken)}`;
      const tokenInfoResponse = await fetch(tokenInfoUrl);

      if (!tokenInfoResponse.ok) {
        const errorPayload = await tokenInfoResponse.json().catch(() => ({}));
        const errorDetail = errorPayload.error_description || errorPayload.error || '';
        console.warn('Google tokeninfo non-200:', tokenInfoResponse.status, errorPayload);

        const errorMessage = process.env.NODE_ENV === 'development'
          ? `Invalid Google token (status ${tokenInfoResponse.status}) ${errorDetail}`.trim()
          : 'Invalid Google token';

        return c.json(
          { success: false, error: errorMessage },
          401
        );
      }

      tokenInfo = await tokenInfoResponse.json();
    } catch (error) {
      console.error('Google token verification error:', error);
      const errorMessage = process.env.NODE_ENV === 'development'
        ? `Failed to verify Google token: ${error?.message || 'Unknown error'}`
        : 'Failed to verify Google token';

      return c.json(
        { success: false, error: errorMessage },
        500
      );
    }

    if (tokenInfo.error) {
      return c.json(
        { success: false, error: 'Invalid Google token' },
        401
      );
    }

    const googleId = tokenInfo.sub;
    const email = tokenInfo.email;

    // Step 2: Get additional user info from Google
    let userInfo = { email };
    try {
      const meResponse = await fetch(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        {
          headers: { Authorization: `Bearer ${googleToken}` }
        }
      );

      if (meResponse.ok) {
        userInfo = await meResponse.json();
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      // Continue anyway with basic info
    }

    // Step 3: Create or update user in Supabase
    const user = await upsertUser(
      googleId,
      email,
      userInfo.name || userInfo.email,
      userInfo.picture || null
    );

    // Step 4: Return user data
    return c.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('POST /auth/google error:', error);
    const message = process.env.NODE_ENV === 'development'
      ? (error?.message || 'Internal server error')
      : 'Internal server error';

    return c.json(
      { success: false, error: message },
      500
    );
  }
});

export default router;
