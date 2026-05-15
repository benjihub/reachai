import React, { useState } from 'react';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { launchGoogleOAuth } from '../../lib/auth';
import { authGoogle } from '../../lib/api';
import { setSession } from '../../lib/storage';

export default function Auth({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Launch Google OAuth flow
      const { token, tokenExpiry } = await launchGoogleOAuth();

      // Step 2: Send token to backend for verification and user creation
      const authResult = await authGoogle(token);

      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      const { userId, email, name, avatar, plan } = authResult.data;

      // Step 3: Store session
      await setSession({
        userId,
        email,
        name,
        avatar,
        plan,
        googleToken: token,
        tokenExpiry
      });

      // Step 4: Notify parent component
      onAuthSuccess({ userId, email, name, avatar, plan });
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-96 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <div className="text-4xl mb-3">🤖</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ReachAI</h1>
        <p className="text-gray-600 mb-8">AI-powered outreach for LinkedIn + Gmail</p>

        <GoogleSignInButton
          onClick={handleSignIn}
          loading={loading}
          error={error}
        />

        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>By signing in you agree to our</p>
          <div className="flex justify-center gap-2">
            <a href="#" className="text-blue-600 hover:underline">Terms</a>
            <span>·</span>
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
