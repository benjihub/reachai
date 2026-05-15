import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import LoadingSpinner from './components/LoadingSpinner';
import { getSession, clearSession, isSessionValid } from '../lib/storage';

export default function Popup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const valid = await isSessionValid();
        if (valid) {
          const session = await getSession();
          setUser(session);
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('auth');
        }
      } catch (error) {
        console.error('Session check error:', error);
        setCurrentPage('auth');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleSignOut = async () => {
    await clearSession();
    setUser(null);
    setCurrentPage('auth');
  };

  const handleSettingsClick = () => {
    setCurrentPage('settings');
  };

  const handleBackClick = () => {
    setCurrentPage('dashboard');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (currentPage === 'auth') {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  if (currentPage === 'settings') {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <button
            onClick={handleBackClick}
            className="text-lg cursor-pointer hover:opacity-70"
          >
            ←
          </button>
          <h1 className="text-sm font-medium text-gray-900">Back</h1>
        </div>
        <Settings user={user} onSignOut={handleSignOut} />
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      onSettingsClick={handleSettingsClick}
    />
  );
}
