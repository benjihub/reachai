/**
 * Message router for chrome.runtime communication
 * Routes messages between popup ↔ content scripts ↔ service worker
 */

export const sendMessageToTab = (tabId, message) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};

export const sendMessageToPopup = (message) => {
  return chrome.runtime.sendMessage(message);
};
