/**
 * Chrome alarms for follow-up reminders
 * F6 implementation
 */

export const scheduleReminder = (threadId, delayMinutes) => {
  chrome.alarms.create(`reminder-${threadId}`, {
    delayInMinutes: delayMinutes
  });
};

export const cancelReminder = (threadId) => {
  chrome.alarms.clear(`reminder-${threadId}`);
};
