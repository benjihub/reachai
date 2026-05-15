/**
 * Chrome notifications helper
 * F6 implementation
 */

export const notify = (title, message, options = {}) => {
  chrome.notifications.create({
    type: 'basic',
    title,
    message,
    iconUrl: chrome.runtime.getURL('public/icons/icon128.png'),
    ...options
  });
};

export const notifyReminder = (contact, threadId) => {
  notify(
    'ReachAI Reminder',
    `Follow up with ${contact}`,
    { tag: `reminder-${threadId}` }
  );
};
