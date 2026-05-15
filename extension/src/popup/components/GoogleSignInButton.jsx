import React from 'react';

export default function GoogleSignInButton({ onClick, loading, error }) {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Signing in...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🔵</span>
            Sign in with Google
          </span>
        )}
      </button>
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
