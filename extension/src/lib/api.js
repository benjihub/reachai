import { API_URL } from './constants.js';
import { setSession } from './storage.js';

/**
 * Central API client for all backend calls
 * All fetch() calls go through here
 */

const API_BASE = API_URL;

/**
 * Verify Google token with backend and create/update user
 * @param {string} googleToken - OAuth access token from Google
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const authGoogle = async (googleToken) => {
  try {
    const response = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ googleToken })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('authGoogle error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get draft queue for logged-in user
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getDrafts = async (userToken) => {
  try {
    const response = await fetch(`${API_BASE}/drafts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('getDrafts error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};
