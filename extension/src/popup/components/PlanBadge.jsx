import React from 'react';

export default function PlanBadge({ plan }) {
  const isPro = plan === 'pro';

  return (
    <div className={`plan-badge ${isPro ? 'plan-badge--pro' : 'plan-badge--free'}`}>
      {isPro ? '⭐ Pro' : 'Free'}
    </div>
  );
}
