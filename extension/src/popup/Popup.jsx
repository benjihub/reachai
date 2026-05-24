import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { getSession, clearSession, clearDraftQueue, isSessionValid } from '../lib/storage';

export default function Popup() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pendingCompose, setPendingCompose] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const composeRequested = new URLSearchParams(window.location.search).get('compose') === '1';
        const pending = await new Promise((resolve) => {
          chrome.storage.local.get(['pendingPopupPage'], (result) => {
            resolve(result.pendingPopupPage === 'compose');
          });
        });
        setPendingCompose(composeRequested || pending);

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
    await clearDraftQueue();
    setUser(null);
    setCurrentPage('auth');
  };

  const handleSettingsClick = () => {
    setCurrentPage('settings');
  };

  const handleBackClick = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'auth') {
    return (
      <div className="popup-shell">
        <div className="popup-panel">
          <Auth onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  if (currentPage === 'settings') {
    return (
      <div className="popup-shell">
        <div className="popup-panel">
          <div className="popup-backbar">
            <button
              type="button"
              onClick={handleBackClick}
              className="icon-button"
              aria-label="Back to dashboard"
            >
              ←
            </button>
            <div className="popup-backbar__copy">
              <span className="eyebrow">Preferences</span>
              <h1 className="page-title">Settings</h1>
            </div>
          </div>
          <div className="popup-panel__content">
            <Settings user={user} onSignOut={handleSignOut} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-shell">
      <div className="popup-panel">
        <Dashboard
          user={user}
          onSettingsClick={handleSettingsClick}
          initialCompose={pendingCompose}
        />
      </div>
    </div>
  );
}
