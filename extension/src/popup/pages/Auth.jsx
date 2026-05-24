import { useState, useEffect, useCallback } from 'react';
const requestGoogleAuth = () => new Promise((resolve, reject) => {
  chrome.runtime.sendMessage({ type: 'auth:google' }, (response) => {
    if (chrome.runtime.lastError) {
      reject(new Error(chrome.runtime.lastError.message));
      return;
    }

    resolve(response);
  });
});

const C = {
  bg0: '#FFFFFF',
  bg1: '#F8F7F4',
  bg2: '#F2F0EB',
  t0: '#1A1A18',
  t1: '#6B6A65',
  t2: '#A8A7A1',
  b0: '#F0EEE8',
  b1: '#E8E6E0',
  accent: '#185FA5',
  accentHover: '#0C447C',
  ok: '#1D9E75',
  okBg: '#E1F5EE',
  gmailBg: '#EAF3DE',
  gmailText: '#27500A',
  linkedinBg: '#E6F1FB',
  linkedinText: '#0C447C',
  warn: '#EF9F27',
  warnBg: '#FAEEDA'
};

const FONT = "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const EXAMPLES = [
  {
    platform: 'gmail',
    contact: 'Sarah Johnson',
    thread: 'Re: Partnership proposal',
    text: "Hi Sarah, thanks for reaching out. I'd love to set up a quick call this week to discuss further."
  },
  {
    platform: 'linkedin',
    contact: 'Mark Chen',
    thread: 'LinkedIn DM',
    text: "Hi Mark, great question - I've been using AI outreach tools for 6 months and happy to share what's worked."
  },
  {
    platform: 'gmail',
    contact: 'Priya Patel',
    thread: 'Re: Q2 project review',
    text: 'Thanks for the update, Priya. I will review the document by Thursday and come back with detailed feedback.'
  }
];

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="white"
        strokeWidth="2.5"
        strokeDasharray="40 20"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LogoMark() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        background: C.t0,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 2l7 4-7 4-7-4 7-4z" fill="rgba(255,255,255,0.95)" />
        <path d="M3 6v8l7 4V10L3 6z" fill="rgba(255,255,255,0.45)" />
        <path d="M17 6v8l-7 4V10l7-4z" fill="rgba(255,255,255,0.72)" />
      </svg>
    </div>
  );
}

function PlatformPill({ platform }) {
  const isGmail = platform === 'gmail';

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        fontFamily: FONT,
        padding: '2px 7px',
        borderRadius: 999,
        background: isGmail ? C.gmailBg : C.linkedinBg,
        color: isGmail ? C.gmailText : C.linkedinText
      }}
    >
      {isGmail ? 'Gmail' : 'LinkedIn'}
    </span>
  );
}

export default function Auth({ onAuthSuccess, onSignIn }) {
  const [exIdx, setExIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [cardVisible, setCardVisible] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    chrome.storage.local.get(['lastAuthError'], (result) => {
      if (result.lastAuthError) {
        setError(result.lastAuthError);
      }
    });
  }, []);

  useEffect(() => {
    let timeout;
    let charIdx = 0;
    const example = EXAMPLES[exIdx];
    function typeNext() {
      if (charIdx < example.text.length) {
        charIdx += 1;
        setDisplayText(example.text.slice(0, charIdx));
        const delay = charIdx < 8 ? 70 : 30;
        timeout = setTimeout(typeNext, delay);
      } else {
        timeout = setTimeout(transitionOut, 2800);
      }
    }

    function transitionOut() {
      setCardVisible(false);
      timeout = setTimeout(() => {
        setExIdx((prev) => (prev + 1) % EXAMPLES.length);
        setDisplayText('');
        setCardVisible(true);
      }, 380);
    }

    timeout = setTimeout(typeNext, 200);
    return () => clearTimeout(timeout);
  }, [exIdx]);

  const handleSignIn = useCallback(async () => {
    setSigning(true);
    setError(null);

    try {
      const authResult = await requestGoogleAuth();

      if (!authResult?.success || !authResult.data) {
        throw new Error(authResult?.error || 'Sign in failed.');
      }

      const session = authResult.data;

      if (typeof onAuthSuccess === 'function') {
        onAuthSuccess(session);
      } else if (typeof onSignIn === 'function') {
        onSignIn(session);
      }
    } catch (err) {
      const message = err.message || 'Sign in failed. Please try again.';
      chrome.storage.local.set({ lastAuthError: message });
      setError(message);
    } finally {
      setSigning(false);
    }
  }, [onAuthSuccess, onSignIn]);

  const example = EXAMPLES[exIdx];

  return (
    <div style={{ fontFamily: FONT, background: C.bg0, borderRadius: 18, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: `0.5px solid ${C.b0}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.t0, letterSpacing: '-0.2px' }}>
            ReachAI
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: C.t1,
            background: C.bg2,
            border: `0.5px solid ${C.b1}`,
            padding: '3px 8px',
            borderRadius: 999
          }}
        >
          Free to start
        </span>
      </div>

      <div
        style={{
          background: C.bg1,
          padding: '18px 18px 14px',
          borderBottom: '0.5px solid #EDECEA',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, #D4D2CC 0.8px, transparent 0.8px)',
            backgroundSize: '18px 18px',
            opacity: 0.35
          }}
        />

        <div
          style={{
            background: C.bg0,
            border: `0.5px solid ${C.b1}`,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            position: 'relative',
            zIndex: 1,
            transition: 'opacity 0.35s ease, transform 0.35s ease',
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? 'translateY(0)' : 'translateY(-8px)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderBottom: `0.5px solid ${C.b0}`
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: C.t0,
                color: '#fff',
                fontSize: 9,
                fontWeight: 500,
                padding: '2px 6px',
                borderRadius: 999
              }}
            >
              <span style={{ animation: 'pulse 2s ease-in-out infinite' }}>✦</span>
              AI draft
            </span>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
            <PlatformPill platform={example.platform} />
            <span style={{ fontSize: 11, fontWeight: 500, color: C.t0 }}>
              {example.contact}
            </span>
          </div>

          <div
            style={{
              padding: '3px 12px 5px',
              fontSize: 10,
              color: C.t2,
              borderBottom: `0.5px solid ${C.b0}`
            }}
          >
            {example.thread}
          </div>

          <div style={{ padding: '10px 12px 12px', minHeight: 62 }}>
            <span style={{ fontSize: 12, color: C.t0, lineHeight: 1.65, fontStyle: 'italic' }}>
              &quot;{displayText}
              <span
                style={{
                  display: 'inline-block',
                  width: 1.5,
                  height: 13,
                  background: C.accent,
                  verticalAlign: 'text-bottom',
                  marginLeft: 1,
                  animation: 'blink 0.9s step-end infinite'
                }}
              />
              <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
              &quot;
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 10,
            position: 'relative',
            zIndex: 1
          }}
        >
          {EXAMPLES.map((_, i) => (
            <div
              key={i}
              style={{
                height: 4,
                borderRadius: 2,
                background: i === exIdx ? C.t0 : C.b1,
                width: i === exIdx ? 14 : 4,
                transition: 'all 0.3s ease'
              }}
            />
          ))}
          <span style={{ fontSize: 10, color: C.t2, marginLeft: 4 }}>
            See your AI drafts, ready to send
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 20px 22px', background: C.bg0 }}>
        <p
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: C.t0,
            letterSpacing: '-0.3px',
            lineHeight: 1.3,
            margin: '0 0 5px'
          }}
        >
          Your AI outreach,
          <br />
          on autopilot.
        </p>
        <p
          style={{
            fontSize: 12,
            color: C.t1,
            lineHeight: 1.65,
            margin: '0 0 18px'
          }}
        >
          Sign in once to unlock AI drafts across
          <br />
          LinkedIn and Gmail - no setup needed.
        </p>

        {error && (
          <div
            style={{
              background: '#FCEBEB',
              border: '0.5px solid #F7C1C1',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 11,
              color: '#791F1F',
              marginBottom: 12
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={signing}
          style={{
            width: '100%',
            padding: '11px 16px',
            background: signing ? C.accentHover : C.accent,
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            borderRadius: 10,
            fontFamily: FONT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            cursor: signing ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 3px rgba(24,95,165,0.35), 0 4px 14px rgba(24,95,165,0.18)',
            marginBottom: 12,
            transition: 'all 0.15s',
            letterSpacing: '0.01em'
          }}
        >
          {signing ? (
            <Spinner />
          ) : (
            <div
              style={{
                width: 20,
                height: 20,
                background: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <GoogleIcon />
            </div>
          )}
          {signing ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div
          style={{
            display: 'flex',
            border: `0.5px solid ${C.b0}`,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 14
          }}
        >
          {[
            { icon: '✓', iconBg: C.okBg, iconColor: C.ok, label: 'Free plan' },
            { icon: '◆', iconBg: C.linkedinBg, iconColor: C.accent, label: 'No card' },
            { icon: '↺', iconBg: C.warnBg, iconColor: C.warn, label: 'Cancel anytime' }
          ].map((f, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                color: C.t1,
                borderRight: i < 2 ? `0.5px solid ${C.b0}` : 'none'
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  flexShrink: 0,
                  background: f.iconBg,
                  color: f.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 700
                }}
              >
                {f.icon}
              </span>
              {f.label}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 10, color: C.t2, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
          By continuing you agree to our{' '}
          <a href="#" style={{ color: C.t1, textDecorationThickness: '0.5px', textUnderlineOffset: 2 }}>
            Terms
          </a>
          {' '}and{' '}
          <a href="#" style={{ color: C.t1, textDecorationThickness: '0.5px', textUnderlineOffset: 2 }}>
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
