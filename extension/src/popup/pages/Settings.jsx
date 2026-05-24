import React, { useEffect, useMemo, useState } from 'react';
import PlanBadge from '../components/PlanBadge';
import { getBillingStatus } from '../../lib/api';

const DEFAULT_PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    price: '$0',
    description: 'A good starting point for light drafting and inbox organization.',
    features: ['10 drafts per month', 'Draft queue dashboard', 'Google and LinkedIn support']
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 'Configured in Paddle',
    description: 'Raise limits and unlock the premium workflow.',
    features: ['1,000 drafts per month', 'Priority plan access', 'Everything in Free']
  }
};

const openUrl = (url) => {
  if (!url) return;

  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
};

function BillingCard({ plan, currentPlan, onAction, actionLabel, disabled }) {
  const isActive = plan.id === currentPlan;
  const isPro = plan.id === 'pro';

  return (
    <div
      style={{
        border: isActive ? '1px solid rgba(37, 99, 235, 0.28)' : '1px solid var(--panel-border)',
        borderRadius: 18,
        padding: 16,
        background: isActive
          ? 'linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, #ffffff 100%)'
          : '#ffffff',
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>{plan.label}</div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', marginTop: 4 }}>
            {plan.price}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>per month</div>
        </div>

        <PlanBadge plan={plan.id} />
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted-strong)' }}>
        {plan.description}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {plan.features.map((feature) => (
          <div
            key={feature}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
              color: 'var(--text)'
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                background: isPro ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.08)',
                color: isPro ? 'var(--success)' : 'var(--accent)',
                fontSize: 11,
                fontWeight: 900
              }}
            >
              ✓
            </span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={isPro ? 'button-secondary' : 'button-primary'}
        style={{
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default function Settings({ user, onSignOut }) {
  const [billing, setBilling] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [billingError, setBillingError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadBilling = async () => {
      if (!user?.userId) {
        setBilling(null);
        return;
      }

      setLoadingBilling(true);
      setBillingError(null);

      try {
        const result = await getBillingStatus(user.userId);
        if (!mounted) return;

        if (result.success) {
          setBilling(result.data || null);
        } else {
          setBilling(null);
          setBillingError(result.error || 'Could not load billing status.');
        }
      } finally {
        if (mounted) {
          setLoadingBilling(false);
        }
      }
    };

    loadBilling();

    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  const currentPlan = billing?.plan || user?.plan || 'free';
  const checkoutUrl = billing?.checkoutUrl || null;
  const manageUrl = billing?.manageUrl || null;
  const plans = billing?.plans || DEFAULT_PLANS;

  const action = useMemo(() => {
    if (currentPlan === 'pro') {
      return {
        label: 'Manage billing',
        url: manageUrl
      };
    }

    return {
      label: 'Upgrade to Pro',
      url: checkoutUrl
    };
  }, [checkoutUrl, currentPlan, manageUrl]);

  const handlePrimaryAction = () => {
    if (action.url) {
      openUrl(action.url);
    }
  };

  return (
    <div className="screen-scroll">
      <div className="surface surface--section">
        <div className="setting-stack">
          <div className="setting-row">
            <span className="setting-label">Account</span>
            <div className="setting-value">{user?.name || 'Signed in user'}</div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Email</span>
            <div className="setting-value">{user?.email}</div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Plan</span>
            <div>
              <PlanBadge plan={currentPlan} />
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Billing</span>
            <div className="setting-value">
              {loadingBilling
                ? 'Loading your plan details...'
                : currentPlan === 'pro'
                  ? 'Pro features are active.'
                  : 'Free plan active. Upgrade any time.'}
            </div>
          </div>

          {billingError ? (
            <div className="status-pill" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)' }}>
              {billingError}
            </div>
          ) : null}
        </div>
      </div>

      <div className="surface surface--section">
        <div className="setting-stack">
          <div className="setting-row">
            <span className="setting-label">Pricing</span>
            <div className="setting-value">Choose the plan that matches your workflow.</div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 12
            }}
          >
            <BillingCard
              plan={plans.free}
              currentPlan={currentPlan}
              onAction={() => {}}
              actionLabel="Current plan"
              disabled
            />

            <BillingCard
              plan={plans.pro}
              currentPlan={currentPlan}
              onAction={handlePrimaryAction}
              actionLabel={action.label}
              disabled={loadingBilling || !action.url}
            />
          </div>

          <div className="setting-value" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {billing?.configured
              ? 'Billing is configured. Use the button above to open checkout or manage your subscription.'
              : 'Billing is not configured yet. Set the Paddle checkout URL in the backend environment to enable upgrades.'}
          </div>
        </div>
      </div>

      <div className="surface surface--section">
        <div className="setting-stack">
          <div className="setting-row">
            <span className="setting-label">Session</span>
            <div className="setting-value">Your extension stays connected until you sign out.</div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="button-secondary button-danger"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
