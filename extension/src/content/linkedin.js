/**
 * LinkedIn content script
 * Reads LinkedIn DM DOM, injects "Draft reply" button
 * Uses MutationObserver for SPA navigation detection
 * 
 * F4 implementation
 */

console.log('ReachAI LinkedIn content script loaded');

const BUTTON_ID = 'reachai-linkedin-draft-button';
const STATUS_ID = 'reachai-linkedin-draft-status';

const cleanText = (value = '') => value.replace(/\s+/g, ' ').trim();

const getContact = () => {
  return cleanText(
    document.querySelector('.msg-thread__link-to-profile')?.innerText ||
    document.querySelector('.msg-entity-lockup__entity-title')?.innerText ||
    document.querySelector('h2')?.innerText ||
    'LinkedIn contact'
  );
};

const collectLinkedInThread = () => {
  const contact = getContact();
  const messageNodes = Array.from(document.querySelectorAll(
    '.msg-s-event-listitem, .msg-s-message-list__event, [data-event-urn]'
  ));

  const messages = messageNodes
    .map((node) => {
      const sender = cleanText(
        node.querySelector('.msg-s-message-group__name')?.innerText ||
        node.querySelector('.msg-s-event-listitem__name')?.innerText ||
        node.getAttribute('data-sender-name') ||
        'Unknown'
      );
      const text = cleanText(
        node.querySelector('.msg-s-event-listitem__body')?.innerText ||
        node.querySelector('.msg-s-event-listitem__message-bubble')?.innerText ||
        node.querySelector('p')?.innerText ||
        node.innerText
      );

      return { sender, text };
    })
    .filter((message) => message.text.length > 8)
    .slice(-10);

  return {
    platform: 'linkedin',
    threadId: `${contact}-${location.pathname}`,
    thread: `LinkedIn DM with ${contact}`,
    contact,
    messages
  };
};

const setStatus = (message, tone = 'idle') => {
  const status = document.getElementById(STATUS_ID);
  if (!status) return;

  status.textContent = message;
  status.dataset.tone = tone;
  status.hidden = !message;
};

const setButtonLoading = (loading) => {
  const button = document.getElementById(BUTTON_ID);
  if (!button) return;

  button.disabled = loading;
  button.textContent = loading ? 'Drafting...' : 'Draft reply';
};

const requestDraft = () => {
  const payload = collectLinkedInThread();
  if (payload.messages.length === 0) {
    setStatus('Open a LinkedIn conversation with readable messages first.', 'error');
    return;
  }

  setButtonLoading(true);
  setStatus('Generating draft...', 'idle');

  chrome.runtime.sendMessage({ type: 'GENERATE_DRAFT', payload }, (response) => {
    setButtonLoading(false);

    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message || 'Could not generate draft.', 'error');
      return;
    }

    if (!response?.success) {
      setStatus(response?.error || 'Could not generate draft.', 'error');
      return;
    }

    setStatus('Draft saved to ReachAI dashboard.', 'success');
  });
};

const findComposeBox = () => {
  return document.querySelector('.msg-form__contenteditable[contenteditable="true"]') ||
    document.querySelector('[aria-label="Write a message…"]') ||
    document.querySelector('[aria-label="Write a message..."]') ||
    document.querySelector('.msg-form [contenteditable="true"]');
};

const injectReply = (text) => {
  const composeBox = findComposeBox();
  if (!composeBox) {
    return { success: false, error: 'Could not find the LinkedIn message box.' };
  }

  composeBox.focus();
  composeBox.innerHTML = '';
  composeBox.textContent = text;
  composeBox.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  }));

  return { success: true };
};

const ensureStyles = () => {
  if (document.getElementById('reachai-linkedin-style')) return;

  const style = document.createElement('style');
  style.id = 'reachai-linkedin-style';
  style.textContent = `
    #${BUTTON_ID} {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 2147483647;
      border: 1px solid #d4e6fb;
      border-radius: 999px;
      background: #185fa5;
      color: #fff;
      box-shadow: 0 10px 24px rgba(24, 95, 165, 0.22);
      cursor: pointer;
      font: 700 13px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 11px 16px;
    }

    #${BUTTON_ID}:disabled {
      cursor: wait;
      opacity: 0.76;
    }

    #${STATUS_ID} {
      position: fixed;
      right: 24px;
      bottom: 72px;
      z-index: 2147483647;
      max-width: 260px;
      border: 1px solid #e8e2d8;
      border-radius: 10px;
      background: #fff;
      color: #1a1a18;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
      font: 600 12px/1.4 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 9px 11px;
    }

    #${STATUS_ID}[data-tone="success"] {
      border-color: #b8e7d5;
      color: #16674e;
    }

    #${STATUS_ID}[data-tone="error"] {
      border-color: #f3c7c7;
      color: #791f1f;
    }
  `;
  document.documentElement.appendChild(style);
};

const injectButton = () => {
  ensureStyles();

  if (!document.getElementById(STATUS_ID)) {
    const status = document.createElement('div');
    status.id = STATUS_ID;
    status.hidden = true;
    document.documentElement.appendChild(status);
  }

  if (document.getElementById(BUTTON_ID)) return;

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = 'Draft reply';
  button.addEventListener('click', requestDraft);
  document.documentElement.appendChild(button);
};

let currentUrl = location.href;
let debounceTimer;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (currentUrl !== location.href) {
      currentUrl = location.href;
      setStatus('', 'idle');
    }
    injectButton();
  }, 300);
});

injectButton();
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const type = request?.type || request?.action;
  if (type !== 'INJECT_REPLY') {
    return false;
  }

  const text = request.payload?.text || request.text || '';
  if (!text.trim()) {
    sendResponse({ success: false, error: 'No draft text to inject.' });
    return true;
  }

  sendResponse(injectReply(text));
  return true;
});
