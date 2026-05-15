import React from 'react';

export default function PlanBadge({ plan }) {
  const isPro = plan === 'pro';

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
      isPro
        ? 'bg-purple-100 text-purple-700'
        : 'bg-gray-100 text-gray-700'
    }`}>
      {isPro ? '⭐ Pro' : 'Free'}
    </div>
  );
}
