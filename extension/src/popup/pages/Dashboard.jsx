import { useCallback, useEffect, useMemo, useState } from 'react';
import ComposePage from './ComposePage';
import DraftView from './DraftView';
import {
  getDraftQueue,
  getSession,
  normalizeDraft,
  replaceDraftQueue,
  setSession,
  upsertDraftInQueue
} from '../../lib/storage';
import { getDrafts } from '../../lib/api';

const FONT = "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const FREE_LIMIT = 10;
const WARN_THRESHOLD = 8;
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'hot', label: 'Hot' },
  { id: 'follow-up', label: 'Follow-up' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'cold', label: 'Cold' }
];
const DASHBOARD_TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'history', label: 'History' }
];

const C = {
  bg: '#f8f7f4',
  panel: '#ffffff',
  panelSoft: '#fbfaf8',
  border: '#e8e2d8',
  text: '#1a1a18',
  muted: '#6b6a65',
  subtle: '#a8a7a1',
  blue: '#185fa5',
  blueBg: '#e6f1fb',
  blueText: '#0c447c',
  green: '#1d9e75',
  greenBg: '#e1f5ee',
  amber: '#ef9f27',
  amberBg: '#faeeda',
  amberText: '#633806',
  red: '#e24b4a',
  redBg: '#fcebeb',
  redText: '#791f1f',
  gmailBg: '#eaf3de',
  gmailText: '#27500a',
  linkedinBg: '#e6f1fb',
  linkedinText: '#0c447c'
};

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';
}

function Avatar({ name }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: C.blueBg,
        color: C.blueText,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 10,
        fontWeight: 700
      }}
    >
      {initials(name)}
    </div>
  );
}

function PlatformPill({ platform }) {
  const isGmail = platform === 'gmail';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 999,
        background: isGmail ? C.gmailBg : C.linkedinBg,
        color: isGmail ? C.gmailText : C.linkedinText
      }}
    >
      {isGmail ? 'Gmail' : 'LinkedIn'}
    </span>
  );
}

function UsagePill({ user, used, limit }) {
  const isPro = user?.plan === 'pro';
  const overLimit = !isPro && used >= limit;
  const nearLimit = !isPro && used >= WARN_THRESHOLD;

  let label = 'Free';
  let background = C.panelSoft;
  let color = C.muted;
  let borderColor = C.border;

  if (isPro) {
    label = 'Pro';
    background = C.blueBg;
    color = C.blueText;
    borderColor = '#d4e6fb';
  } else if (overLimit) {
    label = `⚠ ${used}/${limit}`;
    background = C.redBg;
    color = C.redText;
    borderColor = '#f3c7c7';
  } else if (nearLimit) {
    label = `⚠ ${used}/${limit}`;
    background = C.amberBg;
    color = C.amberText;
    borderColor = '#f2d9a8';
  } else {
    label = `Free · ${used}/${limit}`;
  }

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '4px 8px',
        borderRadius: 999,
        background,
        color,
        border: `1px solid ${borderColor}`,
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </span>
  );
}

function UsageBar({ used, limit }) {
  const isWarning = used >= WARN_THRESHOLD;
  const isCritical = used >= limit;
  const ratio = Math.min(100, Math.max(0, (used / limit) * 100));
  const fill = isCritical ? C.red : isWarning ? C.amber : C.blue;
  const track = isCritical ? '#f8dede' : isWarning ? '#fbefd6' : '#e6eef8';

  return (
    <div
      style={{
        borderTop: '1px solid #ece5db',
        background: '#fffdfa',
        padding: '10px 14px 12px'
      }}
    >
      <div
        style={{
          height: 8,
          background: track,
          borderRadius: 999,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${ratio}%`,
            height: '100%',
            borderRadius: 999,
            background: fill,
            transition: 'width 180ms ease'
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
          fontSize: 10,
          color: C.subtle
        }}
      >
        <span>{isCritical ? 'Draft limit reached' : `${used} of ${limit} drafts used`}</span>
        <span>{Math.round(ratio)}%</span>
      </div>
    </div>
  );
}

function UpgradeBanner({ used, limit, onOpenSettings }) {
  const isCritical = used >= limit;
  const title = isCritical ? 'Draft limit reached' : 'You are close to your limit';
  const body = isCritical
    ? 'No more drafts can be generated until you upgrade.'
    : 'Upgrade soon to avoid hitting the draft cap.';
  const background = isCritical ? C.redBg : C.amberBg;
  const color = isCritical ? C.redText : C.amberText;
  const borderColor = isCritical ? '#f3c7c7' : '#f2d9a8';

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        background,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color }}>{title}</div>
        <div style={{ fontSize: 11, lineHeight: 1.45, color, opacity: 0.85, marginTop: 2 }}>
          {body}
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        style={{
          border: 'none',
          borderRadius: 999,
          background: color,
          color: '#fff',
          padding: '8px 12px',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        Upgrade
      </button>
    </div>
  );
}

function DraftCard({ draft, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        background: C.panel,
        padding: '14px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              {draft.contact}
            </span>
            <PlatformPill platform={draft.platform} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 5, lineHeight: 1.45 }}>
            {draft.thread}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            color: C.subtle,
            flexShrink: 0
          }}
        >
          {draft.label || 'draft'}
        </span>
      </div>
      {draft.text ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            lineHeight: 1.5,
            color: '#3b3a36'
          }}
        >
          {draft.text.length > 140 ? `${draft.text.slice(0, 140)}...` : draft.text}
        </div>
      ) : null}
    </button>
  );
}

function formatRelativeTime(value) {
  if (!value) return 'just now';

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'just now';

  const diff = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))}m ago`;
  if (diff < day) return `${Math.max(1, Math.round(diff / hour))}h ago`;
  if (diff < 7 * day) return `${Math.max(1, Math.round(diff / day))}d ago`;
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric'
  }).format(time);
}

function StatusBadge({ status }) {
  const normalized = (status || 'draft').toLowerCase();
  const background =
    normalized === 'sent'
      ? C.greenBg
      : normalized === 'discarded'
        ? C.redBg
        : C.panelSoft;
  const color =
    normalized === 'sent'
      ? C.green
      : normalized === 'discarded'
        ? C.redText
        : C.muted;

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 999,
        background,
        color,
        border: `1px solid ${normalized === 'sent' ? '#cdeedd' : normalized === 'discarded' ? '#f3c7c7' : C.border}`
      }}
    >
      {normalized}
    </span>
  );
}

function HistoryCard({ draft }) {
  return (
    <div
      style={{
        width: '100%',
        textAlign: 'left',
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        background: C.panelSoft,
        padding: '14px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              {draft.contact}
            </span>
            <PlatformPill platform={draft.platform} />
            <StatusBadge status={draft.status} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 5, lineHeight: 1.45 }}>
            {draft.thread}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            color: C.subtle,
            flexShrink: 0
          }}
        >
          {formatRelativeTime(draft.updatedAt || draft.sentAt || draft.createdAt)}
        </span>
      </div>
      {draft.text ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            lineHeight: 1.5,
            color: '#3b3a36'
          }}
        >
          {draft.text.length > 140 ? `${draft.text.slice(0, 140)}...` : draft.text}
        </div>
      ) : null}
    </div>
  );
}

function OnboardingState({ user, onOpenGmail, onOpenLinkedIn }) {
  const steps = [
    {
      done: true,
      label: 'Signed in',
      sub: 'Your account is connected',
      tone: 'success'
    },
    {
      active: true,
      label: 'Open Gmail or LinkedIn',
      sub: 'Click draft reply inside a conversation',
      tone: 'active',
      actions: true
    },
    {
      label: 'First draft generated',
      sub: 'This view disappears automatically',
      tone: 'pending'
    }
  ];

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${C.blue} 0%, #245f9b 100%)`,
          color: '#fff',
          borderRadius: 18,
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 28px rgba(24, 95, 165, 0.18)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 'auto -22px -22px auto',
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)'
          }}
        />
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          Welcome, {user?.name?.split(' ')[0] || 'there'}
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.86 }}>
          You are connected. Open Gmail or LinkedIn to generate your first draft.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 8,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          background: C.panel,
          padding: 12
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step.label}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 10px',
              borderRadius: 12,
              background: step.active ? C.blueBg : C.panelSoft,
              border: step.active ? '1px solid #cde0f5' : `1px solid ${C.border}`,
              opacity: step.done || step.active ? 1 : 0.72
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                background:
                  step.tone === 'success'
                    ? C.greenBg
                    : step.tone === 'active'
                      ? C.blueBg
                      : '#f2eee7',
                color:
                  step.tone === 'success'
                    ? C.green
                    : step.tone === 'active'
                      ? C.blueText
                      : C.subtle,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              {step.done ? '✓' : index + 1}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                {step.label}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.45, color: C.muted, marginTop: 2 }}>
                {step.sub}
              </div>
              {step.actions ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={onOpenGmail}
                    style={{
                      border: '1px solid #bfdc8a',
                      background: '#f3fbe8',
                      color: '#3d5c22',
                      borderRadius: 999,
                      padding: '7px 12px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Open Gmail
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLinkedIn}
                    style={{
                      border: '1px solid #8fbaff',
                      background: '#edf4ff',
                      color: '#1f4f97',
                      borderRadius: 999,
                      padding: '7px 12px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Open LinkedIn
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: C.subtle }}>
        Free plan · 10 drafts/month · No credit card required
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 220,
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: C.blueBg,
          display: 'grid',
          placeItems: 'center',
          color: C.blueText,
          fontSize: 22,
          marginBottom: 14
        }}
      >
        ✉
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No drafts yet</div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginTop: 6 }}>
        Open Gmail or LinkedIn and start a conversation to generate your first draft.
      </div>
    </div>
  );
}

function HistoryEmptyState() {
  return (
    <div
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 220,
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: C.panelSoft,
          display: 'grid',
          placeItems: 'center',
          color: C.muted,
          fontSize: 22,
          marginBottom: 14
        }}
      >
        ✓
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No history yet</div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginTop: 6 }}>
        Sent and discarded drafts will appear here after you act on them.
      </div>
    </div>
  );
}

function parseDraftsResponse(result) {
  if (!result || !result.success) {
    return { drafts: [], history: [], usage: {} };
  }

  const data = result.data || {};
  const drafts = Array.isArray(data.drafts)
    ? data.drafts
    : Array.isArray(data)
      ? data
      : Array.isArray(data.items)
        ? data.items
        : [];
  const history = Array.isArray(data.history) ? data.history : [];

  const usage = data.usage || {
    used: data.usedDrafts || data.draftsUsed || data.count || drafts.length,
    limit: data.limit || FREE_LIMIT
  };

  return { drafts, history, usage };
}

function mergeDrafts(remoteDrafts, localDrafts, userId) {
  const merged = new Map();

  [...localDrafts, ...remoteDrafts].forEach((draft) => {
    const normalized = normalizeDraft(draft, { userId });
    if (normalized.userId && userId && normalized.userId !== userId) {
      return;
    }
    const key = normalized.id || normalized.threadId;
    merged.set(key, normalized);
  });

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export default function Dashboard({ user, onSettingsClick, initialCompose = false }) {
  const [drafts, setDrafts] = useState([]);
  const [historyDrafts, setHistoryDrafts] = useState([]);
  const [usage, setUsage] = useState({ used: 0, limit: FREE_LIMIT });
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [session, setSessionState] = useState(user);
  const [syncError, setSyncError] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showCompose, setShowCompose] = useState(Boolean(initialCompose));

  useEffect(() => {
    setSessionState(user);
  }, [user]);

  useEffect(() => {
    if (initialCompose) {
      setShowCompose(true);
      chrome.storage.local.remove(['pendingPopupPage']);
    }
  }, [initialCompose]);

  const hydrateLocalDrafts = useCallback(async (sessionSnapshot) => {
    if (!sessionSnapshot?.userId) {
      setDrafts([]);
      setHistoryDrafts([]);
      setUsage({ used: 0, limit: FREE_LIMIT });
      return [];
    }

    const localDrafts = await getDraftQueue();
    const scopedLocal = localDrafts.filter(
      (draft) => !draft.userId || draft.userId === sessionSnapshot.userId
    );
    const scopedLocalHistory = scopedLocal.filter((draft) => (draft.status || 'draft') !== 'draft');
    const scopedLocalActive = scopedLocal.filter((draft) => (draft.status || 'draft') === 'draft');

    setDrafts(scopedLocalActive);
    setHistoryDrafts(scopedLocalHistory);
    setUsage({
      used: scopedLocalActive.length,
      limit: sessionSnapshot?.plan === 'pro' ? 1000 : FREE_LIMIT
    });

    return scopedLocalActive;
  }, []);

  const loadDrafts = useCallback(async (sessionSnapshot) => {
    if (!sessionSnapshot?.userId) {
      setDrafts([]);
      setHistoryDrafts([]);
      setUsage({ used: 0, limit: FREE_LIMIT });
      return;
    }

    try {
      setSyncError(null);
      const localDrafts = await getDraftQueue();
      const scopedLocal = localDrafts.filter(
        (draft) => !draft.userId || draft.userId === sessionSnapshot.userId
      );
      const scopedLocalActive = scopedLocal.filter((draft) => (draft.status || 'draft') === 'draft');
      const scopedLocalHistory = scopedLocal.filter((draft) => (draft.status || 'draft') !== 'draft');

      let nextDrafts = scopedLocalActive;
      let nextHistory = scopedLocalHistory;
      let nextUsage = {
        used: scopedLocalActive.length,
        limit: sessionSnapshot?.plan === 'pro' ? 1000 : FREE_LIMIT
      };

      if (sessionSnapshot.googleToken) {
        const remoteResult = await getDrafts(sessionSnapshot.googleToken);
        const { drafts: remoteDrafts, history: remoteHistory, usage: remoteUsage } = parseDraftsResponse(remoteResult);
        if (remoteResult.success) {
          nextDrafts = mergeDrafts(remoteDrafts, scopedLocalActive, sessionSnapshot.userId);
          nextHistory = mergeDrafts(remoteHistory, scopedLocalHistory, sessionSnapshot.userId);
          await replaceDraftQueue(nextDrafts, { userId: sessionSnapshot.userId });
          nextUsage = {
            used: remoteUsage.used ?? nextDrafts.length,
            limit:
              typeof remoteUsage.limit === 'number'
                ? remoteUsage.limit
                : sessionSnapshot?.plan === 'pro'
                  ? 1000
                  : FREE_LIMIT
          };
        } else if (scopedLocal.length === 0) {
          setSyncError(remoteResult.error || 'Could not refresh drafts yet.');
        }
      }

      setDrafts(nextDrafts);
      setHistoryDrafts(nextHistory);
      setUsage(nextUsage);

      if (nextDrafts.length > 0 && !sessionSnapshot.onboardingDismissed) {
        const nextSession = { ...sessionSnapshot, onboardingDismissed: true };
        setSessionState(nextSession);
        await setSession(nextSession);
      }

    } catch (error) {
      console.error('Failed to load drafts:', error);
      setSyncError(error.message || 'Failed to load drafts.');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      let sessionSnapshot = user;
      try {
        const storedSession = await getSession();
        sessionSnapshot = storedSession || user;
        if (mounted && storedSession) {
          setSessionState(storedSession);
        }
        await hydrateLocalDrafts(sessionSnapshot);
      } catch (error) {
        console.error('Failed to hydrate dashboard:', error);
        if (mounted) {
          setSyncError(error.message || 'Could not load dashboard data.');
        }
      }

      if (mounted && sessionSnapshot?.userId) {
        setRefreshing(true);
        loadDrafts(sessionSnapshot).finally(() => {
          if (mounted) {
            setRefreshing(false);
          }
        });
      }
    };

    init();

    const interval = setInterval(() => {
      if (mounted) {
        setRefreshing(true);
        getSession().then((storedSession) => loadDrafts(storedSession || user)).finally(() => {
          if (mounted) {
            setRefreshing(false);
          }
        });
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [hydrateLocalDrafts, loadDrafts, user]);

  useEffect(() => {
    const handleMessage = (message) => {
      const type = message?.type || message?.action;
      if (type !== 'DRAFT_READY' && type !== 'DRAFT_QUEUE_UPDATED') {
        return;
      }

      const incoming = message.draft || message.data || message.payload || message;
      if (!incoming) {
        return;
      }

      (async () => {
        try {
          const normalizedIncoming = normalizeDraft(incoming, {
            userId: session?.userId || null
          });
          const nextQueue = await upsertDraftInQueue(incoming, {
            userId: session?.userId || null
          });
          const scopedQueue = nextQueue.filter(
            (draft) => !draft.userId || draft.userId === session?.userId
          );
          setDrafts(scopedQueue.filter((draft) => (draft.status || 'draft') === 'draft'));
          if (normalizedIncoming.status && normalizedIncoming.status !== 'draft') {
            setHistoryDrafts((prev) => {
              const key = normalizedIncoming.id || normalizedIncoming.draftId || normalizedIncoming.threadId;
              const nextHistory = [
                normalizedIncoming,
                ...prev.filter((draft) => (draft.id || draft.draftId || draft.threadId) !== key)
              ];
              return nextHistory.sort(
                (a, b) => new Date(b.updatedAt || b.sentAt || b.createdAt).getTime() - new Date(a.updatedAt || a.sentAt || a.createdAt).getTime()
              );
            });
          }
          setSelectedDraft((current) => {
            if (!current) return current;
            const currentKey = current.id || current.draftId || current.threadId;
            return scopedQueue.find((draft) => (draft.id || draft.draftId || draft.threadId) === currentKey) || current;
          });
          setUsage((prev) => ({
            used: Math.max(prev.used, scopedQueue.filter((draft) => (draft.status || 'draft') === 'draft').length),
            limit: prev.limit || FREE_LIMIT
          }));

          if (scopedQueue.length > 0 && !session?.onboardingDismissed) {
            const nextSession = { ...session, onboardingDismissed: true };
            setSessionState(nextSession);
            await setSession(nextSession);
          }
        } catch (error) {
          console.error('Failed to process draft update:', error);
        }
      })();
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [session]);

  const filteredDrafts = useMemo(() => {
    if (activeFilter === 'all') {
      return drafts;
    }
    return drafts.filter((draft) => (draft.label || '').toLowerCase() === activeFilter);
  }, [activeFilter, drafts]);

  const draftsUsed = usage.used ?? drafts.length;
  const draftsLimit = usage.limit || FREE_LIMIT;
  const historyCount = historyDrafts.length;
  const isOnboarding = activeTab === 'pending' && !session?.onboardingDismissed && drafts.length === 0 && historyCount === 0;
  const isNearLimit = session?.plan !== 'pro' && draftsUsed >= WARN_THRESHOLD;
  const isLimitReached = session?.plan !== 'pro' && draftsUsed >= draftsLimit;
  const visibleDrafts = activeTab === 'pending' ? filteredDrafts : historyDrafts;

  const counts = useMemo(() => {
    return FILTERS.map((filter) => ({
      ...filter,
      count:
        filter.id === 'all'
          ? drafts.length
          : drafts.filter((draft) => (draft.label || '').toLowerCase() === filter.id).length
    }));
  }, [drafts]);

  const dismissOnboarding = useCallback(async () => {
    const nextSession = { ...session, onboardingDismissed: true };
    setSessionState(nextSession);
    await setSession(nextSession);
  }, [session]);

  const handleOpenGmail = useCallback(() => {
    chrome.tabs.create({ url: 'https://mail.google.com' });
  }, []);

  const handleOpenLinkedIn = useCallback(() => {
    chrome.tabs.create({ url: 'https://www.linkedin.com/messaging' });
  }, []);

  const persistQueue = useCallback(async (nextDrafts) => {
    setDrafts(nextDrafts);
    setUsage((prev) => ({
      used: nextDrafts.length,
      limit: prev.limit || (session?.plan === 'pro' ? 1000 : FREE_LIMIT)
    }));
    await replaceDraftQueue(nextDrafts, { userId: session?.userId || null });
  }, [session?.plan, session?.userId]);

  const archiveDraft = useCallback((draft, status) => {
    const normalized = normalizeDraft(
      {
        ...draft,
        status,
        updatedAt: Date.now(),
        sentAt: status === 'sent' ? Date.now() : draft?.sentAt || undefined
      },
      { userId: session?.userId || null }
    );
    const key = normalized.id || normalized.draftId || normalized.threadId;

    setHistoryDrafts((prev) => {
      const nextHistory = [
        normalized,
        ...prev.filter((item) => (item.id || item.draftId || item.threadId) !== key)
      ];
      return nextHistory.sort(
        (a, b) =>
          new Date(b.updatedAt || b.sentAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.sentAt || a.createdAt).getTime()
      );
    });
  }, [session?.userId]);

  const removeDraftFromQueue = useCallback(async (draft, status = null) => {
    const key = draft?.id || draft?.draftId || draft?.threadId;
    if (!key) return drafts;

    const nextDrafts = drafts.filter((item) => (item.id || item.draftId || item.threadId) !== key);
    await persistQueue(nextDrafts);
    if (status) {
      archiveDraft(draft, status);
    }
    return nextDrafts;
  }, [archiveDraft, drafts, persistQueue]);

  const handleUpdateDraft = useCallback(async (updatedDraft) => {
    const key = updatedDraft?.id || updatedDraft?.draftId || updatedDraft?.threadId;
    const nextDrafts = drafts.map((draft) => {
      const draftKey = draft.id || draft.draftId || draft.threadId;
      return draftKey === key ? normalizeDraft(updatedDraft, { userId: session?.userId || null }) : draft;
    });
    await persistQueue(nextDrafts);
    setSelectedDraft(normalizeDraft(updatedDraft, { userId: session?.userId || null }));
  }, [drafts, persistQueue, session?.userId]);

  const handleSentDraft = useCallback(async (draft) => {
    await removeDraftFromQueue(draft, 'sent');
  }, [removeDraftFromQueue]);

  const handleDiscardDraft = useCallback(async (draft) => {
    await removeDraftFromQueue(draft, 'discarded');
    setSelectedDraft(null);
  }, [removeDraftFromQueue]);

  const handleRestoreDraft = useCallback(async (draft, message) => {
    const nextDraft = normalizeDraft(draft, { userId: session?.userId || null });
    const key = nextDraft.id || nextDraft.draftId || nextDraft.threadId;
    const exists = drafts.some((item) => (item.id || item.draftId || item.threadId) === key);
    const nextDrafts = exists ? drafts : [nextDraft, ...drafts];
    await persistQueue(nextDrafts);
    setHistoryDrafts((prev) => prev.filter((item) => (item.id || item.draftId || item.threadId) !== key));
    setSelectedDraft(nextDraft);
    setSyncError(message || 'Action failed. Draft restored.');
  }, [drafts, persistQueue, session?.userId]);

  if (showCompose) {
    return (
      <ComposePage onBack={() => setShowCompose(false)} />
    );
  }

  if (selectedDraft) {
    const selectedKey = selectedDraft.id || selectedDraft.draftId || selectedDraft.threadId;
    const remainingDrafts = drafts.filter((draft) => (draft.id || draft.draftId || draft.threadId) !== selectedKey);

    return (
      <DraftView
        draft={selectedDraft}
        onBack={() => setSelectedDraft(null)}
        onSent={handleSentDraft}
        onDiscard={handleDiscardDraft}
        onRestore={handleRestoreDraft}
        onUpdateDraft={handleUpdateDraft}
        hasMoreDrafts={remainingDrafts.length > 0}
        onNextDraft={() => setSelectedDraft(remainingDrafts[0] || null)}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: C.bg,
        color: C.text,
        fontFamily: FONT
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px 10px',
          borderBottom: `1px solid ${C.border}`,
          background: C.panel
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Avatar name={session?.name || 'User'} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {session?.name || 'User'}
            </div>
            <div style={{ fontSize: 10, color: C.muted }}>Inbox copilot</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: FONT,
              padding: '5px 11px',
              borderRadius: 999,
              background: C.blueBg,
              color: C.blueText,
              border: '1px solid #c9dff4',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(24,95,165,0.12)'
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.blueText} strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            + New Email
          </button>
          <UsagePill user={session} used={draftsUsed} limit={draftsLimit} />
          <button
            type="button"
            onClick={onSettingsClick}
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: '#fff',
              color: C.muted,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontSize: 14
            }}
            aria-label="Open settings"
          >
            ⚙
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {isOnboarding ? (
          <OnboardingState
            user={session}
            onOpenGmail={handleOpenGmail}
            onOpenLinkedIn={handleOpenLinkedIn}
          />
        ) : (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            {syncError ? (
              <div
                style={{
                  border: '1px solid #f3c7c7',
                  borderRadius: 14,
                  background: C.redBg,
                  color: C.redText,
                  fontSize: 11,
                  lineHeight: 1.45,
                  padding: '10px 12px'
                }}
              >
                {syncError}
              </div>
            ) : null}

            {(isNearLimit || isLimitReached) ? (
              <UpgradeBanner
                used={draftsUsed}
                limit={draftsLimit}
                onOpenSettings={onSettingsClick}
              />
            ) : null}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 6
              }}
            >
              {DASHBOARD_TABS.map((tab) => {
                const active = tab.id === activeTab;
                const count = tab.id === 'pending' ? drafts.length : historyCount;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      border: 'none',
                      borderRadius: 10,
                      background: active ? C.blueBg : 'transparent',
                      color: active ? C.blueText : C.muted,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        borderRadius: 999,
                        padding: '1px 5px',
                        background: active ? '#dcecfb' : C.panelSoft,
                        color: active ? C.blueText : C.subtle
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'pending' ? (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 2
                }}
              >
                {counts.map((filter) => {
                  const active = filter.id === activeFilter;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      style={{
                        border: `1px solid ${active ? '#c9dff4' : C.border}`,
                        background: active ? C.blueBg : C.panel,
                        color: active ? C.blueText : C.muted,
                        borderRadius: 999,
                        padding: '7px 11px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {filter.label}
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 999,
                          background: active ? '#dcecfb' : C.panelSoft,
                          color: active ? C.blueText : C.subtle
                        }}
                      >
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, flex: 1, overflowY: 'auto' }}>
              {visibleDrafts.length > 0 ? (
                activeTab === 'pending'
                  ? visibleDrafts.map((draft) => (
                      <DraftCard
                        key={draft.id}
                        draft={draft}
                        onClick={() => setSelectedDraft(draft)}
                      />
                    ))
                  : visibleDrafts.map((draft) => (
                      <HistoryCard
                        key={draft.id}
                        draft={draft}
                      />
                    ))
              ) : (
                activeTab === 'pending' ? <EmptyState /> : <HistoryEmptyState />
              )}
            </div>
          </div>
        )}
      </div>

      <UsageBar used={draftsUsed} limit={draftsLimit} />

      {refreshing ? (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: 10,
            color: C.subtle,
            background: 'rgba(255,255,255,0.82)',
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            padding: '4px 8px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)'
          }}
        >
          Syncing...
        </div>
      ) : null}
    </div>
  );
}
