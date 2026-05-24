/**
 * Service worker entry point
 * Handles alarms, notifications, auth, and message routing
 */

import { launchGoogleOAuth } from '../lib/auth.js';
import { authGoogle, generateDraft } from '../lib/api.js';
import { getSession, setSession, upsertDraftInQueue } from '../lib/storage.js';

console.log('ReachAI service worker loaded');

const handleAuthGoogle = async () => {
  const { token, tokenExpiry } = await launchGoogleOAuth();
  const authResult = await authGoogle(token);

  if (!authResult?.success || !authResult.data) {
    throw new Error(authResult?.error || 'Sign in failed.');
  }

  const { userId, email, name, avatar, plan } = authResult.data;
  const session = {
    userId,
    email,
    name,
    avatar,
    plan,
    onboardingDismissed: false,
    googleToken: token,
    tokenExpiry
  };

  await setSession(session);
  chrome.storage.local.remove(['lastAuthError']);

  return session;
};

const storeDraft = async (draftPayload) => {
  const session = await getSession();
  const nextQueue = await upsertDraftInQueue(draftPayload, {
    userId: session?.userId || null
  });

  try {
    chrome.runtime.sendMessage({
      type: 'DRAFT_QUEUE_UPDATED',
      draft: nextQueue[0],
      drafts: nextQueue
    }, () => {
      if (chrome.runtime.lastError) {
        console.debug('No runtime listener for draft queue update:', chrome.runtime.lastError.message);
      }
    });
  } catch (messageError) {
    console.warn('Failed to broadcast draft queue update:', messageError);
  }

  return nextQueue;
};

const openComposeInPopup = async () => {
  await chrome.storage.local.set({ pendingPopupPage: 'compose' });

  if (chrome.action?.openPopup) {
    try {
      await chrome.action.openPopup();
    } catch (error) {
      console.debug('Could not open popup automatically:', error?.message || error);
    }
  }
};

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const type = request?.type || request?.action;

  if (type === 'auth:google') {
    (async () => {
      try {
        const session = await handleAuthGoogle();
        sendResponse({ success: true, data: session });
      } catch (error) {
        const message = error?.message || 'Sign in failed. Please try again.';
        chrome.storage.local.set({ lastAuthError: message });
        sendResponse({ success: false, error: message });
      }
    })();
    return true;
  }

  if (type === 'GENERATE_DRAFT') {
    (async () => {
      try {
        const session = await getSession();
        if (!session?.userId) {
          sendResponse({ success: false, error: 'Please sign in before generating drafts.' });
          return;
        }

        const result = await generateDraft(session.userId, request.payload || request.data || {});
        if (!result?.success || !result.data) {
          sendResponse({ success: false, error: result?.error || 'Failed to generate draft.' });
          return;
        }

        const nextQueue = await storeDraft(result.data);
        sendResponse({ success: true, draft: nextQueue[0], drafts: nextQueue });
      } catch (error) {
        console.error('Failed to generate draft:', error);
        sendResponse({ success: false, error: error.message || 'Failed to generate draft.' });
      }
    })();
    return true;
  }

  if (type === 'DRAFT_READY') {
    (async () => {
      try {
        const draftPayload = request.draft || request.payload || request.data || request;
        const nextQueue = await storeDraft(draftPayload);

        sendResponse({ success: true, drafts: nextQueue.length });
      } catch (error) {
        console.error('Failed to store draft from message:', error);
        sendResponse({ success: false, error: error.message || 'Failed to store draft' });
      }
    })();
    return true;
  }

  if (type === 'OPEN_COMPOSE') {
    (async () => {
      try {
        await openComposeInPopup();
        sendResponse({ success: true });
      } catch (error) {
        console.error('Failed to open compose popup:', error);
        sendResponse({ success: false, error: error.message || 'Failed to open compose.' });
      }
    })();
    return true;
  }

  console.log('Service worker received message:', request);
  sendResponse({ success: true });
});
