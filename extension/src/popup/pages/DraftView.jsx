import { useCallback, useEffect, useRef, useState } from 'react';
import { getSession } from '../../lib/storage';
import { regenerateDraft, sendGmailReply, updateDraftStatus } from '../../lib/api';

const C = {
  bg0: '#ffffff',
  bg1: '#f8f7f4',
  t0: '#1a1a18',
  t1: '#6b6a65',
  t2: '#a8a7a1',
  b0: '#f0eee8',
  b1: '#e8e6e0',
  accent: '#185fa5',
  accentBg: '#e6f1fb',
  ok: '#1d9e75',
  okBg: '#e1f5ee',
  errBg: '#fcebeb',
  errText: '#791f1f',
  warn: '#ef9f27',
  gmailBg: '#eaf3de',
  gmailText: '#27500a',
  linkedinBg: '#e6f1fb',
  linkedinText: '#0c447c'
};

const FONT = "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

function Spinner({ size = 14, color = '#fff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeDasharray="40 20" strokeLinecap="round" />
    </svg>
  );
}

function PlatformTag({ platform }) {
  const isGmail = platform === 'gmail';
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 500,
        padding: '1px 5px',
        borderRadius: 999,
        background: isGmail ? C.gmailBg : C.linkedinBg,
        color: isGmail ? C.gmailText : C.linkedinText
      }}
    >
      {isGmail ? 'Gmail' : 'LinkedIn'}
    </span>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <div
      style={{
        margin: '0 11px 8px',
        padding: '8px 10px',
        background: C.errBg,
        border: '0.5px solid #f7c1c1',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: C.errText, margin: '0 0 2px' }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 10, color: '#a32d2d', margin: 0, lineHeight: 1.4 }}>
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: C.errText,
          fontSize: 14,
          padding: 0,
          lineHeight: 1,
          flexShrink: 0
        }}
      >
        x
      </button>
    </div>
  );
}

function Modal({ title, body, confirmLabel, confirmTone = 'primary', onConfirm, onCancel }) {
  const confirmStyle = confirmTone === 'danger'
    ? { background: C.errBg, color: C.errText, border: '0.5px solid #f7c1c1' }
    : { background: C.accent, color: '#fff', border: 'none' };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(26,26,24,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        borderRadius: 16
      }}
    >
      <div
        style={{
          background: C.bg0,
          border: `0.5px solid ${C.b1}`,
          borderRadius: 12,
          padding: '16px 18px',
          margin: '0 16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, color: C.t0, margin: '0 0 4px' }}>{title}</p>
        <p style={{ fontSize: 11, color: C.t1, margin: '0 0 16px', lineHeight: 1.5 }}>{body}</p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: 7,
              background: 'transparent',
              border: 'none',
              color: C.t1,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: 7,
              cursor: 'pointer',
              ...confirmStyle
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ draft, onBack, onNextDraft, hasMoreDrafts, sendMode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 360,
        padding: '48px 24px',
        background: C.bg0,
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: C.okBg,
          border: `0.5px solid ${C.ok}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
          animation: 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <style>{'@keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}'}</style>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: C.t0, margin: '0 0 4px' }}>
        {sendMode === 'reply' ? 'Reply ready!' : 'Sent!'}
      </p>
      <p style={{ fontSize: 12, color: C.t1, margin: '0 0 4px' }}>
        {sendMode === 'email' ? 'Email sent to' : 'Reply inserted for'} {draft?.contact || 'contact'}
      </p>
      <p style={{ fontSize: 10, color: C.t2, margin: '0 0 24px' }}>Moved to history</p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '6px 14px',
            borderRadius: 8,
            background: C.bg1,
            color: C.t0,
            border: `0.5px solid ${C.b1}`,
            cursor: 'pointer'
          }}
        >
          Back to drafts
        </button>
        {hasMoreDrafts ? (
          <button
            type="button"
            onClick={onNextDraft}
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: 8,
              background: C.accent,
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Next draft →
          </button>
        ) : null}
      </div>
    </div>
  );
}

async function sendLinkedIn(draft, text) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ url: 'https://www.linkedin.com/messaging/*' }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error('NO_LINKEDIN_TAB'));
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: 'INJECT_REPLY', payload: { text, threadId: draft.threadId } },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error('Could not reach LinkedIn tab. Refresh LinkedIn and try again.'));
            return;
          }
          if (!response?.success) {
            reject(new Error(response?.error || 'LinkedIn inject failed. Try again.'));
            return;
          }
          resolve(response);
        }
      );
    });
  });
}

async function sendGmailInlineReply(draft, text) {
  const tabs = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, resolve);
  });

  const gmailTab = tabs?.find((tab) => typeof tab.url === 'string' && tab.url.startsWith('https://mail.google.com/')) || null;
  if (!gmailTab?.id) {
    throw new Error('NO_GMAIL_TAB');
  }

  if (!chrome.scripting?.executeScript) {
    throw new Error('Your browser does not support direct Gmail insertion.');
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: gmailTab.id },
    args: [text],
    func: async (replyText) => {
      const cleanText = (value = '') => value.replace(/\s+/g, ' ').trim();

      const findReplyButton = () => {
        const candidates = Array.from(document.querySelectorAll('[role="button"], button'));
        return candidates.find((node) => {
          const text = cleanText(node.innerText || node.textContent || '');
          const label = cleanText(node.getAttribute('aria-label') || '');
          return /^reply$/i.test(text) || /\breply\b/i.test(label) || /\breply\b/i.test(text);
        }) || null;
      };

      const findReplyComposer = () => document.querySelector(
        'div[role="textbox"][contenteditable="true"][aria-label*="Message Body"],' +
        'div[aria-label*="Message Body"][contenteditable="true"],' +
        'div[role="textbox"][contenteditable="true"],' +
        'div[contenteditable="true"][g_editable="true"]'
      );

      const waitForComposer = async (timeoutMs = 2500) => {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
          const composer = findReplyComposer();
          if (composer) {
            return composer;
          }
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        return null;
      };

      const injectReplyText = (composer, value) => {
        composer.scrollIntoView({ block: 'center' });
        composer.focus();
        composer.innerHTML = '';
        composer.textContent = value;
        composer.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: value
        }));
        composer.dispatchEvent(new Event('change', { bubbles: true }));
      };

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

      injectReplyText(composer, replyText);
      return { success: true };
    }
  });

  const response = results?.[0]?.result;
  if (!response?.success) {
    throw new Error(response?.error || 'Gmail reply injection failed. Try again.');
  }

  return response;
}

export default function DraftView({
  draft,
  onBack,
  onSent,
  onDiscard,
  onRestore,
  onUpdateDraft,
  hasMoreDrafts,
  onNextDraft
}) {
  const [text, setText] = useState(draft?.text || draft?.draftText || '');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [isNewDraft, setIsNewDraft] = useState(false);
  const [sendMode, setSendMode] = useState(draft?.platform === 'gmail' ? 'reply' : 'reply');
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(draft?.text || draft?.draftText || '');
    setSent(false);
    setError(null);
    setSendFailed(false);
    setIsNewDraft(false);
    setSendMode(draft?.platform === 'gmail' ? 'reply' : 'reply');
  }, [draft?.id, draft?.draftId, draft?.text, draft?.draftText]);

  useEffect(() => {
    if (textareaRef.current && !regenerating) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, regenerating]);

  const getSessionOrThrow = useCallback(async () => {
    const session = await getSession();
    if (!session?.userId) {
      throw new Error('Please sign in before continuing.');
    }
    return session;
  }, []);

  const handleSend = useCallback(async (mode = sendMode) => {
    setSending(true);
    setSendFailed(false);
    setError(null);

    try {
      const session = await getSessionOrThrow();
      const draftId = draft.id || draft.draftId;

      if (draft.platform === 'gmail') {
        if (mode === 'reply') {
          try {
            await sendGmailInlineReply(draft, text);
          } catch (replyError) {
            if (replyError.message === 'NO_GMAIL_TAB') {
              setError('Open Gmail and the conversation first, then try inserting the reply again.');
              return;
            }
            throw replyError;
          }
        } else {
          const recipient = draft.contactEmail || draft.raw?.contactEmail;
          const result = await sendGmailReply(session.userId, {
            googleToken: session.googleToken,
            draftId,
            threadId: draft.raw?.gmailThreadId || draft.gmailThreadId || undefined,
            to: recipient,
            subject: draft.subject || draft.thread,
            body: text,
            mode,
            sendMode: mode,
            inReplyTo: draft.raw?.gmailMessageId || draft.raw?.messageId || draft.gmailMessageId || null,
            references: draft.raw?.gmailReferences || draft.raw?.references || null
          });

          if (!result.success) {
            throw new Error(result.error || 'Gmail send failed. Your draft is safe.');
          }
        }
      } else {
        try {
          await sendLinkedIn(draft, text);
        } catch (sendError) {
          if (sendError.message === 'NO_LINKEDIN_TAB') {
            setShowLinkedInModal(true);
            return;
          }
          throw sendError;
        }
      }

      if (draft.platform === 'gmail' && mode === 'reply') {
        const statusResult = await updateDraftStatus(session.userId, draftId, 'sent');
        if (!statusResult.success) {
          console.warn('Could not update reply status in the backend:', statusResult.error);
        }
      } else {
        const statusResult = await updateDraftStatus(session.userId, draftId, 'sent');
        if (!statusResult.success) {
          throw new Error(statusResult.error || 'Sent, but could not update draft status.');
        }
      }

      setSendMode(mode);
      setSent(true);
      onSent?.({ ...draft, sendMode: draft.platform === 'gmail' ? mode : 'reply' });
    } catch (sendError) {
      setSendFailed(true);
      setError(sendError.message || 'Send failed. Your draft is safe. Try again.');
    } finally {
      setSending(false);
    }
  }, [draft, getSessionOrThrow, onSent, sendMode, text]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    setError(null);
    setIsNewDraft(false);

    try {
      const session = await getSessionOrThrow();
      const result = await regenerateDraft(session.userId, { ...draft, text });
      if (!result.success || !result.data?.text) {
        throw new Error(result.error || 'Regeneration failed. Original draft kept.');
      }

      setText(result.data.text);
      setIsNewDraft(true);
      onUpdateDraft?.({ ...draft, ...result.data, text: result.data.text });
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (regenerateError) {
      setError(regenerateError.message || 'Regeneration failed. Original draft kept.');
    } finally {
      setRegenerating(false);
    }
  }, [draft, getSessionOrThrow, onUpdateDraft, text]);

  const handleDiscard = useCallback(async () => {
    setShowDiscardModal(false);
    setError(null);

    const session = await getSession().catch(() => null);
    const draftId = draft.id || draft.draftId;
    onDiscard?.(draft);

    if (!session?.userId) {
      onRestore?.(draft, 'Could not discard remotely because the session is missing. Draft restored.');
      return;
    }

    const result = await updateDraftStatus(session.userId, draftId, 'discarded');
    if (!result.success) {
      onRestore?.(draft, result.error || 'Could not discard remotely. Draft restored.');
    }
  }, [draft, onDiscard, onRestore]);

  if (sent) {
    return (
      <div style={{ fontFamily: FONT, background: C.bg0, position: 'relative' }}>
        <SuccessScreen
          draft={draft}
          onBack={onBack}
          onNextDraft={onNextDraft}
          hasMoreDrafts={hasMoreDrafts}
          sendMode={sendMode}
        />
      </div>
    );
  }

  const isLinkedIn = draft?.platform === 'linkedin';
  const charCount = text.length;
  const charWarn = charCount > 900;

  return (
    <div style={{ fontFamily: FONT, background: C.bg0, position: 'relative', minHeight: '100%' }}>
      {showDiscardModal ? (
        <Modal
          title="Discard this draft?"
          body="This draft will be removed from your queue."
          confirmLabel="Yes, discard"
          confirmTone="danger"
          onConfirm={handleDiscard}
          onCancel={() => setShowDiscardModal(false)}
        />
      ) : null}

      {showLinkedInModal ? (
        <Modal
          title="LinkedIn tab not found"
          body="Open LinkedIn and navigate to this conversation, then try sending again."
          confirmLabel="Open LinkedIn →"
          onConfirm={() => {
            chrome.tabs.create({ url: 'https://www.linkedin.com/messaging/' });
            setShowLinkedInModal(false);
          }}
          onCancel={() => setShowLinkedInModal(false)}
        />
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '10px 14px',
          borderBottom: `0.5px solid ${C.b0}`
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.t1,
            display: 'flex',
            padding: 2,
            borderRadius: 6,
            flexShrink: 0
          }}
          aria-label="Back to drafts"
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <PlatformTag platform={draft?.platform} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: C.t0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {draft?.contact || 'Contact'}
            </span>
          </div>
          <p style={{ fontSize: 10, color: C.t1, margin: 0 }}>
            {isLinkedIn ? 'LinkedIn DM' : draft?.subject || draft?.thread || 'Email reply'}
          </p>
        </div>
      </div>

      {error ? (
        <div style={{ paddingTop: 8 }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      ) : null}

      <div style={{ padding: '10px 11px 4px' }}>
        {regenerating ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 148,
              background: C.bg1,
              border: `0.5px dashed ${C.b1}`,
              borderRadius: 8
            }}
          >
            <Spinner size={16} color={C.accent} />
            <span style={{ fontSize: 11, color: C.t1 }}>Writing new draft...</span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setIsNewDraft(false);
            }}
            disabled={sending}
            style={{
              width: '100%',
              minHeight: 140,
              padding: '10px 11px',
              resize: 'none',
              overflow: 'hidden',
              fontSize: 12,
              color: C.t0,
              lineHeight: 1.65,
              background: isNewDraft ? '#fafcff' : C.bg0,
              border: `0.5px solid ${isNewDraft ? '#85b7eb' : C.b1}`,
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              opacity: sending ? 0.5 : 1
            }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          {isNewDraft ? (
            <span style={{ fontSize: 9, color: C.accent }}>✦ New draft generated</span>
          ) : (
            <span />
          )}
          <span style={{ fontSize: 9, color: charWarn ? C.warn : C.t2 }}>
            {regenerating ? '...' : `${charCount} chars`}
            {charWarn ? ' · getting long' : ''}
          </span>
        </div>
      </div>

      <div style={{ padding: '4px 11px 8px' }}>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating || sending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            padding: '4px 9px',
            borderRadius: 7,
            background: 'transparent',
            border: 'none',
            color: regenerating ? C.t2 : C.t1,
            cursor: regenerating || sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.4 : 1
          }}
        >
          {regenerating ? <Spinner size={11} color={C.t2} /> : '↻'}
          {regenerating ? 'Regenerating...' : isNewDraft ? 'Try again' : 'Regenerate'}
        </button>
      </div>

      <div style={{ height: '0.5px', background: C.b0 }} />

      <div style={{ display: 'flex', gap: 6, padding: '10px 11px 12px' }}>
        <button
          type="button"
          onClick={() => setShowDiscardModal(true)}
          disabled={sending || regenerating}
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '7px 14px',
            borderRadius: 8,
            flexShrink: 0,
            background: C.bg1,
            color: C.t0,
            border: `0.5px solid ${C.b1}`,
            cursor: sending || regenerating ? 'not-allowed' : 'pointer',
            opacity: sending || regenerating ? 0.4 : 1
          }}
        >
          Discard
        </button>

        {draft?.platform === 'gmail' ? (
          <div style={{ flex: 1, display: 'grid', gap: 6, gridTemplateColumns: '1fr 1fr' }}>
            <button
              type="button"
              onClick={() => {
                setSendMode('reply');
                handleSend('reply');
              }}
              disabled={sending || regenerating || !text.trim()}
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '7px 12px',
                borderRadius: 8,
                background: sendMode === 'reply' ? C.accent : C.bg1,
                color: sendMode === 'reply' ? '#fff' : C.t0,
                border: `0.5px solid ${sendMode === 'reply' ? C.accent : C.b1}`,
                cursor: sending || regenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: sendMode === 'reply' ? '0 1px 3px rgba(24,95,165,0.25)' : 'none',
                opacity: !text.trim() ? 0.5 : 1
              }}
            >
              {sending && sendMode === 'reply' ? <Spinner size={12} color="rgba(255,255,255,0.8)" /> : null}
              {sending && sendMode === 'reply' ? 'Opening...' : 'Insert reply'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSendMode('email');
                handleSend('email');
              }}
              disabled={sending || regenerating || !text.trim()}
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '7px 12px',
                borderRadius: 8,
                background: sendMode === 'email' ? C.accent : C.bg1,
                color: sendMode === 'email' ? '#fff' : C.t0,
                border: `0.5px solid ${sendMode === 'email' ? C.accent : C.b1}`,
                cursor: sending || regenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: sendMode === 'email' ? '0 1px 3px rgba(24,95,165,0.25)' : 'none',
                opacity: !text.trim() ? 0.5 : 1
              }}
            >
              {sending && sendMode === 'email' ? <Spinner size={12} color="rgba(255,255,255,0.8)" /> : null}
              {sending && sendMode === 'email' ? 'Sending...' : 'Send as email'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || regenerating || !text.trim()}
            style={{
              flex: 1,
              fontSize: 11,
              fontWeight: 500,
              padding: '7px 14px',
              borderRadius: 8,
              background: C.accent,
              color: '#fff',
              border: 'none',
              cursor: sending || regenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(24,95,165,0.25)',
              opacity: !text.trim() ? 0.5 : 1
            }}
          >
            {sending ? <Spinner size={12} color="rgba(255,255,255,0.8)" /> : null}
            {sending
              ? 'Sending...'
              : sendFailed
                ? '↺ Try again'
                : 'Send on LinkedIn'}
          </button>
        )}
      </div>
    </div>
  );
}
