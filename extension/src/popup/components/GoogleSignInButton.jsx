import React from 'react';

export default function GoogleSignInButton({ onClick, loading, error }) {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="button-primary auth-google-button"
      >
        {loading ? (
          <span className="auth-google-button__content">
            <span className="auth-spinner" />
            <span className="auth-google-button__label">Signing in...</span>
          </span>
        ) : (
          <span className="auth-google-button__content">
            <span className="auth-google-button__icon" aria-hidden="true" />
            <span className="auth-google-button__label">Continue with Google</span>
          </span>
        )}
      </button>
      {error && (
        <div className="surface" style={{ padding: '12px 14px', borderColor: 'rgba(220, 38, 38, 0.18)', background: 'rgba(220, 38, 38, 0.06)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
