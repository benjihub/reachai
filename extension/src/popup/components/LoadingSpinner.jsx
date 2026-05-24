import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="loading-shell">
      <div className="loading-card">
        <div className="loading-orb" />
        <p className="loading-copy">Setting up your workspace...</p>
      </div>
    </div>
  );
}
