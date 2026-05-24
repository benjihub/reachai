/**
 * Gmail content script
 * Injects "Draft reply" button into Gmail UI
 * 
 * F2 implementation
 */

console.log('ReachAI Gmail content script loaded');

const DRAFT_BUTTON_ID = 'reachai-gmail-draft-button';
const COMPOSE_BUTTON_ID = 'reachai-gmail-new-email-button';
const COMPOSE_PANEL_ID = 'reachai-gmail-compose-panel';
const STATUS_ID = 'reachai-gmail-draft-status';
let statusTimer = null;

const isRuntimeAvailable = () => {
  try {
    return Boolean(chrome?.runtime?.id);
  } catch {
    return false;
  }
};

const isContextInvalidatedError = (error) => {
  const message = error?.message || String(error || '');
  return /Extension context invalidated|Receiving end does not exist|message channel closed/i.test(message);
};

const cleanText = (value = '') => value
  .replace(/\s+/g, ' ')
  .replace(/Show trimmed content|Reply|Forward/g, '')
  .trim();

const getSubject = () => {
  return cleanText(
    document.querySelector('h2.hP')?.innerText ||
    document.querySelector('[data-thread-perm-id] h2')?.innerText ||
    document.title.replace(/\s+-\s+Gmail.*$/i, '')
  ) || 'Gmail thread';
};

const getMessageSender = (node) => {
  const container = node.closest('.adn, .gs, [role="listitem"]') || node.parentElement;
  const senderNode = container?.querySelector('.gD') || container?.querySelector('[email]');
  const email = senderNode?.getAttribute('email') || null;
  const name = cleanText(
    senderNode?.getAttribute('name') ||
      email ||
      container?.querySelector('.go')?.innerText ||
      'Unknown'
  );

  return { name, email };
};

const collectGmailThread = () => {
  const subject = getSubject();
  const messageNodes = Array.from(document.querySelectorAll('.a3s.aiL, .a3s'));
  const messages = messageNodes
    .map((node) => {
      const sender = getMessageSender(node);
      return {
        sender: sender.name,
        email: sender.email,
        text: cleanText(node.innerText)
      };
    })
    .filter((message) => message.text.length > 12)
    .slice(-3);

  const contactMessage =
    [...messages].reverse().find((message) => !/^(me|you)$/i.test(message.sender)) ||
    messages.at(-1);
  const contact = contactMessage?.sender || 'Gmail contact';

  return {
    platform: 'gmail',
    threadId: subject,
    thread: subject,
    subject,
    contact,
    contactEmail: contactMessage?.email || null,
    messages
  };
};

const setStatus = (message, tone = 'idle') => {
  const status = document.getElementById(STATUS_ID);
  if (!status) return;

  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }

  status.textContent = message;
  status.dataset.tone = tone;
  status.hidden = !message;

  if (!message) {
    return;
  }

  const timeoutMs = tone === 'error' ? 5000 : 2500;
  statusTimer = setTimeout(() => {
    const currentStatus = document.getElementById(STATUS_ID);
    if (!currentStatus) return;

    currentStatus.textContent = '';
    currentStatus.hidden = true;
    delete currentStatus.dataset.tone;
    statusTimer = null;
  }, timeoutMs);
};

const setButtonLoading = (loading) => {
  const button = document.getElementById(DRAFT_BUTTON_ID);
  if (!button) return;

  button.disabled = loading;
  button.textContent = loading ? 'Drafting...' : 'Draft reply';
};

const sendRuntimeMessageSafely = (message, onResponse) => {
  try {
    if (!isRuntimeAvailable()) {
      onResponse?.({ success: false, error: 'Extension context is unavailable.' });
      return;
    }

    chrome.runtime.sendMessage(message, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        onResponse?.({ success: false, error: lastError.message || 'Extension context is unavailable.' });
        return;
      }

      onResponse?.(response);
    });
  } catch (error) {
    onResponse?.({ success: false, error: error?.message || 'Extension context is unavailable.' });
  }
};

const findReplyButton = () => {
  const candidates = Array.from(document.querySelectorAll('[role="button"], button'));
  const matches = candidates.filter((node) => {
    const text = cleanText(node.innerText || node.textContent || '');
    const label = cleanText(node.getAttribute('aria-label') || '');
    return /^reply$/i.test(text) || /\breply\b/i.test(label) || /\breply\b/i.test(text);
  });

  if (matches.length === 0) {
    return null;
  }

  return matches
    .sort((a, b) => {
      const aTop = a.getBoundingClientRect?.().top ?? 0;
      const bTop = b.getBoundingClientRect?.().top ?? 0;
      return bTop - aTop;
    })[0] || null;
};

const findReplyComposer = () => {
  return document.querySelector(
    'div[role="textbox"][contenteditable="true"][aria-label*="Message Body"],' +
    'div[aria-label*="Message Body"][contenteditable="true"],' +
    'div[role="textbox"][contenteditable="true"],' +
    'div[contenteditable="true"][g_editable="true"]'
  );
};

const waitForComposer = async (timeoutMs = 2000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const composer = findReplyComposer();
    if (composer) {
      return composer;
    }

    // Give Gmail a moment to mount the reply box after the click.
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  return null;
};

const injectReplyText = (composer, text) => {
  composer.scrollIntoView({ block: 'center' });
  composer.focus();
  composer.innerHTML = '';
  composer.textContent = text;
  composer.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  }));
  composer.dispatchEvent(new Event('change', { bubbles: true }));
};

const openAndFillReply = async (text) => {
  let composer = findReplyComposer();

  if (!composer) {
    const replyButton = findReplyButton();
    if (!replyButton) {
      return { success: false, error: 'Could not find the Gmail reply button.' };
    }

    replyButton.click();
    composer = await waitForComposer();
  }

  if (!composer) {
    return { success: false, error: 'Could not open the Gmail reply composer.' };
  }

  injectReplyText(composer, text);
  return { success: true };
};

const requestDraft = () => {
  const payload = collectGmailThread();
  if (payload.messages.length === 0) {
    setStatus('Open a Gmail thread with readable messages first.', 'error');
    return;
  }

  setButtonLoading(true);
  setStatus('Generating draft...', 'idle');

  sendRuntimeMessageSafely({ type: 'GENERATE_DRAFT', payload }, (response) => {
    setButtonLoading(false);

    if (!response?.success) {
      setStatus(response?.error || 'Could not generate draft.', 'error');
      return;
    }

    setStatus('Draft saved to ReachAI dashboard.', 'success');
  });
};

const handleInjectedReply = async (request, sendResponse) => {
  const text = request.payload?.text || request.text || '';

  if (!text.trim()) {
    sendResponse({ success: false, error: 'No reply text to insert.' });
    return;
  }

  try {
    const result = await openAndFillReply(text);
    sendResponse(result);
  } catch (error) {
    console.error('Gmail reply injection failed:', error);
    sendResponse({ success: false, error: error.message || 'Could not insert Gmail reply.' });
  }
};

const ensureStyles = () => {
  if (document.getElementById('reachai-gmail-style')) return;

  const style = document.createElement('style');
  style.id = 'reachai-gmail-style';
  style.textContent = `
    #${COMPOSE_PANEL_ID} {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #${DRAFT_BUTTON_ID} {
      border: 1px solid #d4e6fb;
      border-radius: 999px;
      box-shadow: 0 10px 24px rgba(24, 95, 165, 0.22);
      cursor: pointer;
      font: 700 13px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 8px 12px;
      min-width: 0;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    #${COMPOSE_BUTTON_ID} {
      border: 1px solid #d4e6fb;
      border-radius: 999px;
      box-shadow: 0 10px 24px rgba(24, 95, 165, 0.22);
      cursor: pointer;
      font: 700 13px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 11px 16px;
      min-width: 0;
    }

    #${DRAFT_BUTTON_ID} {
      background: #185fa5;
      color: #fff;
    }

    #${COMPOSE_BUTTON_ID} {
      background: #185fa5;
      color: #fff;
      border-color: #d4e6fb;
      box-shadow: 0 10px 24px rgba(24, 95, 165, 0.22);
    }

    #${DRAFT_BUTTON_ID}:disabled,
    #${COMPOSE_BUTTON_ID}:disabled {
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

const findComposeButton = () => {
  const candidates = Array.from(document.querySelectorAll('[role="button"], button'));
  return candidates.find((node) => {
    const text = cleanText(node.innerText || node.textContent || '');
    const label = cleanText(node.getAttribute('aria-label') || '');
    const gh = cleanText(node.getAttribute('gh') || '');
    return /\bcompose\b/i.test(text) || /\bcompose\b/i.test(label) || gh === 'cm';
  }) || null;
};

const injectReplyToolbarButton = () => {
  return false;
};

const injectFloatingComposeButton = () => {
  if (!document.getElementById(COMPOSE_PANEL_ID)) {
    const panel = document.createElement('div');
    panel.id = COMPOSE_PANEL_ID;
    document.documentElement.appendChild(panel);
  }

  const panel = document.getElementById(COMPOSE_PANEL_ID);
  if (!panel) return;

  if (!document.getElementById(DRAFT_BUTTON_ID)) {
    const draftButton = document.createElement('button');
    draftButton.id = DRAFT_BUTTON_ID;
    draftButton.type = 'button';
    draftButton.textContent = 'Draft reply';
    draftButton.addEventListener('click', requestDraft);
    panel.appendChild(draftButton);
  }

  if (!document.getElementById(COMPOSE_BUTTON_ID)) {
    const composeButton = document.createElement('button');
    composeButton.id = COMPOSE_BUTTON_ID;
    composeButton.type = 'button';
    composeButton.textContent = '+ New Email';
    composeButton.addEventListener('click', openNewEmail);
    panel.appendChild(composeButton);
  }
};

const openNewEmail = () => {
  setStatus('Opening ReachAI compose...', 'idle');
  try {
    if (!isRuntimeAvailable()) {
      setStatus('Reload Gmail to refresh ReachAI.', 'error');
      return;
    }

    sendRuntimeMessageSafely({ type: 'OPEN_COMPOSE' }, (response) => {
      if (!response?.success) {
        setStatus(response?.error || 'Could not open ReachAI compose.', 'error');
        return;
      }

      setStatus('Opening compose in ReachAI...', 'success');
    });
  } catch (error) {
    setStatus(error?.message || 'Could not open ReachAI compose.', 'error');
  }
};

const injectButton = () => {
  if (!isRuntimeAvailable()) {
    return;
  }

  ensureStyles();

  if (!document.getElementById(STATUS_ID)) {
    const status = document.createElement('div');
    status.id = STATUS_ID;
    status.hidden = true;
    document.documentElement.appendChild(status);
  }

  injectReplyToolbarButton();
  injectFloatingComposeButton();
};

let debounceTimer;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(injectButton, 300);
});

injectButton();
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}

  window.addEventListener('unhandledrejection', (event) => {
    if (!isContextInvalidatedError(event.reason)) {
      return;
    }

    event.preventDefault();
    setStatus('Reload Gmail to refresh ReachAI.', 'error');
  });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const type = request?.type || request?.action;

  if (type !== 'INJECT_GMAIL_REPLY') {
    return false;
  }

  handleInjectedReply(request, sendResponse);
  return true;
});
