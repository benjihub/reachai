/**
 * Service worker entry point
 * Handles alarms, notifications, and message routing
 */

console.log('ReachAI service worker loaded');

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Service worker received message:', request);
  // Message routing logic goes here (F6)
  sendResponse({ success: true });
});
