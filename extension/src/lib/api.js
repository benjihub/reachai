import { API_URL } from './constants.js';
import { getSession, setSession } from './storage.js';

/**
 * Central API client for all backend calls
 * All fetch() calls go through here
 */

const LOCAL_API_BASES = [
  API_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://[::1]:3000'
]
  .filter(Boolean)
  .map((base) => base.replace(/\/+$/, ''));

const dedupeApiBases = (bases) => [...new Set(bases)];

const API_BASES = dedupeApiBases(LOCAL_API_BASES);
const FETCH_TIMEOUT_MS = 2500;
const DRAFT_GENERATION_TIMEOUT_MS = 45000;
const SEND_TIMEOUT_MS = 45000;

const fetchJson = async (base, path, options) => {
  const { timeoutMs = FETCH_TIMEOUT_MS, ...fetchOptions } = options || {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${base}${path}`, {
      ...fetchOptions,
      signal: fetchOptions?.signal || controller.signal
    });
    if (response.ok) {
      return { response };
    }

    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    return {
      response,
      error: error.error || `HTTP ${response.status}`
    };
  } finally {
    clearTimeout(timeout);
  }
};

const requestWithLocalFallback = async (path, options) => {
  let lastNetworkError = null;

  for (const base of API_BASES) {
    try {
      const result = await fetchJson(base, path, options);
      if (result.response.ok) {
        return result.response;
      }

      return result.response;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  throw lastNetworkError || new Error('Network error');
};

const parseResponseError = async (response) => {
  const raw = await response.text().catch(() => '');
  if (!raw) {
    return `HTTP ${response.status}`;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed?.error || parsed?.message || `HTTP ${response.status}`;
  } catch {
    return raw.slice(0, 200);
  }
};

/**
 * Verify Google token with backend and create/update user
 * @param {string} googleToken - OAuth access token from Google
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const authGoogle = async (googleToken) => {
  try {
    const response = await requestWithLocalFallback('/auth/google', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ googleToken })
    });

    if (!response.ok) {
      return {
        success: false,
        error: await parseResponseError(response)
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
    const session = await getSession();
    const authToken = session?.userId || userToken;
    const response = await requestWithLocalFallback('/drafts', {
      method: 'GET',
      mode: 'cors',
      headers: authToken ? {
        'Authorization': `Bearer ${authToken}`
      } : undefined
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
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get the user's billing status and plan catalog.
 * @param {string} userToken
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getBillingStatus = async (userToken) => {
  try {
    const response = await requestWithLocalFallback('/billing/status', {
      method: 'GET',
      mode: 'cors',
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`
      };
    }

    return await response.json();
  } catch (error) {
    console.error('getBillingStatus error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Generate an AI draft from captured Gmail or LinkedIn context.
 */
export const generateDraft = async (userToken, payload) => {
  try {
    const response = await requestWithLocalFallback('/drafts/generate', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      timeoutMs: DRAFT_GENERATION_TIMEOUT_MS
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`
      };
    }

    return await response.json();
  } catch (error) {
    console.error('generateDraft error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

export const regenerateDraft = async (userToken, draft) => {
  try {
    const response = await requestWithLocalFallback('/drafts/regenerate', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ draft }),
      timeoutMs: DRAFT_GENERATION_TIMEOUT_MS
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`
      };
    }

    return await response.json();
  } catch (error) {
    console.error('regenerateDraft error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

const getComposeSession = async () => {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error('Please sign in before composing email.');
  }

  return session;
};

/**
 * Generate a brand new email (not a reply - no thread context).
 * @param {Object} payload - { to, subject, prompt }
 * @returns {{ draftId, text, to, subject, prompt }}
 */
export const generateCompose = async (payload) => {
  try {
    const session = await getComposeSession();
    const response = await requestWithLocalFallback('/drafts/compose', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${session.userId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        prompt: payload.prompt
      }),
      timeoutMs: DRAFT_GENERATION_TIMEOUT_MS
    });

    if (!response.ok) {
      throw new Error(await parseResponseError(response));
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('generateCompose error:', error);
    throw error;
  }
};

/**
 * Send a brand new email (not a reply).
 * Backend calls Gmail API: users.messages.send
 * @param {Object} payload - { draftId, to, subject, body }
 */
export const sendNewEmail = async (payload) => {
  try {
    const session = await getComposeSession();
    if (!session.googleToken) {
      throw new Error('Missing Google token. Please sign in again.');
    }

    const response = await requestWithLocalFallback('/send/gmail/new', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${session.userId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        googleToken: session.googleToken,
        draftId: payload.draftId,
        to: payload.to,
        subject: payload.subject,
        body: payload.body
      }),
      timeoutMs: SEND_TIMEOUT_MS
    });

    if (!response.ok) {
      throw new Error(await parseResponseError(response));
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('sendNewEmail error:', error);
    throw error;
  }
};

export const sendGmailReply = async (userToken, payload) => {
  try {
    const response = await requestWithLocalFallback('/send/gmail', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      timeoutMs: SEND_TIMEOUT_MS
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`
      };
    }

    return await response.json();
  } catch (error) {
    console.error('sendGmailReply error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Update a draft's status.
 * Falls back to the backend route once implemented.
 */
export const updateDraftStatus = async (userToken, draftId, status) => {
  try {
    const response = await requestWithLocalFallback(`/drafts/${draftId}`, {
      method: 'PATCH',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`
      };
    }

    return await response.json();
  } catch (error) {
    console.error('updateDraftStatus error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};
