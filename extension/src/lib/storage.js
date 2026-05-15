/**
 * Storage wrapper for chrome.storage.local
 * All user session data goes here
 */

export const getSession = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['session'], (result) => {
      resolve(result.session || null);
    });
  });
};

export const setSession = async (session) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ session }, () => {
      resolve(session);
    });
  });
};

export const clearSession = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['session'], () => {
      resolve();
    });
  });
};

export const isSessionValid = async () => {
  const session = await getSession();
  if (!session) return false;

  const { tokenExpiry } = session;
  if (!tokenExpiry) return false;

  return Date.now() < tokenExpiry;
};

export const getPreferences = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['preferences'], (result) => {
      resolve(result.preferences || {});
    });
  });
};

export const setPreferences = async (preferences) => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ preferences }, () => {
      resolve(preferences);
    });
  });
};
