/**
 * Storage wrapper for chrome.storage.local
 * All user session data goes here
 */

const DRAFT_QUEUE_KEY = 'draftQueue';
const STORAGE_TIMEOUT_MS = 1500;

const withStorageTimeout = (read, fallback) => {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const timeout = setTimeout(() => finish(fallback), STORAGE_TIMEOUT_MS);

    read((value) => {
      clearTimeout(timeout);
      finish(value);
    });
  });
};

export const normalizeDraft = (draft, fallback = {}) => {
  const source = draft || {};
  const createdAt = source.createdAt || source.created_at || fallback.createdAt || Date.now();
  const platform = source.platform || fallback.platform || 'gmail';
  const id =
    source.id ||
    source.draftId ||
    source.threadId ||
    source.thread_id ||
    `${platform}-${source.contact || source.name || createdAt}`;

  return {
    id,
    draftId: source.draftId || id,
    threadId: source.threadId || source.thread_id || source.threadId || id,
    userId: source.userId || fallback.userId || null,
    contact: source.contact || source.name || source.sender || 'Unknown contact',
    contactEmail: source.contactEmail || source.email || source.fromEmail || null,
    platform,
    thread: source.thread || source.subject || source.title || 'Draft thread',
    subject: source.subject || source.thread || source.title || 'Draft thread',
    text: source.text || source.body || source.message || '',
    label: source.label || source.category || 'all',
    status: source.status || 'draft',
    createdAt,
    updatedAt: source.updatedAt || source.updated_at || createdAt,
    messages: source.messages || fallback.messages || [],
    raw: source
  };
};

export const getSession = async () => {
  return withStorageTimeout((resolve) => {
    chrome.storage.local.get(['session'], (result) => {
      resolve(result.session || null);
    });
  }, null);
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

export const getDraftQueue = async () => {
  return withStorageTimeout((resolve) => {
    chrome.storage.local.get([DRAFT_QUEUE_KEY], (result) => {
      resolve(Array.isArray(result[DRAFT_QUEUE_KEY]) ? result[DRAFT_QUEUE_KEY] : []);
    });
  }, []);
};

export const setDraftQueue = async (drafts) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [DRAFT_QUEUE_KEY]: drafts }, () => {
      resolve(drafts);
    });
  });
};

export const clearDraftQueue = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.remove([DRAFT_QUEUE_KEY], () => {
      resolve();
    });
  });
};

export const upsertDraftInQueue = async (draft, fallback = {}) => {
  const queue = await getDraftQueue();
  const normalized = normalizeDraft(draft, fallback);
  const key = normalized.id;

  const nextQueue = queue.filter((item) => {
    const itemKey = item.id || item.draftId || item.threadId;
    return itemKey !== key;
  });

  if (normalized.status && normalized.status !== 'draft') {
    await setDraftQueue(nextQueue);
    return nextQueue;
  }

  nextQueue.unshift(normalized);
  nextQueue.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  await setDraftQueue(nextQueue);
  return nextQueue;
};

export const replaceDraftQueue = async (drafts, fallback = {}) => {
  const normalized = drafts.map((draft) => normalizeDraft(draft, fallback));
  normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  await setDraftQueue(normalized);
  return normalized;
};

export const isSessionValid = async () => {
  const session = await getSession();
  if (!session) return false;

  const { tokenExpiry } = session;
  if (!tokenExpiry) return false;

  return Date.now() < tokenExpiry;
};

export const getPreferences = async () => {
  return withStorageTimeout((resolve) => {
    chrome.storage.sync.get(['preferences'], (result) => {
      resolve(result.preferences || {});
    });
  }, {});
};

export const setPreferences = async (preferences) => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ preferences }, () => {
      resolve(preferences);
    });
  });
};
