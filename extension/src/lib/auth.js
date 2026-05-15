import { GOOGLE_OAUTH_SCOPES, TOKEN_REFRESH_THRESHOLD } from './constants.js';
import { getSession, setSession } from './storage.js';

/**
 * Launch Google OAuth flow using chrome.identity
 * Returns the access token
 */
export const launchGoogleOAuth = async () => {
  const scopes = GOOGLE_OAUTH_SCOPES;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID not set in environment');
  }

  const redirectUrl = chrome.identity.getRedirectURL();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUrl);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!responseUrl) {
          reject(new Error('User cancelled sign in'));
          return;
        }

        const url = new URL(responseUrl);
        const token = url.searchParams.get('access_token');
        const expiresIn = parseInt(url.searchParams.get('expires_in'), 10);

        if (!token) {
          reject(new Error('No access token in response'));
          return;
        }

        const tokenExpiry = Date.now() + (expiresIn * 1000);
        resolve({ token, tokenExpiry });
      }
    );
  });
};

/**
 * Silently refresh token if close to expiry
 */
export const refreshTokenIfNeeded = async () => {
  const session = await getSession();
  if (!session) return null;

  const { tokenExpiry } = session;
  const timeRemaining = tokenExpiry - Date.now();

  if (timeRemaining < TOKEN_REFRESH_THRESHOLD) {
    try {
      const { token, tokenExpiry: newExpiry } = await launchGoogleOAuth();
      await setSession({
        ...session,
        googleToken: token,
        tokenExpiry: newExpiry
      });
      return token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  return session.googleToken;
};

/**
 * Get valid Google token (refresh if needed)
 */
export const getValidGoogleToken = async () => {
  return refreshTokenIfNeeded();
};
