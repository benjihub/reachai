import React from 'react';
import Avatar from './Avatar';
import PlanBadge from './PlanBadge';

export default function Header({ user, onSettingsClick }) {
  return (
    <div className="app-header">
      <div className="app-header__user">
        <Avatar url={user?.avatar} name={user?.name} />
        <div className="app-header__copy">
          <span className="app-header__name">{user?.name || 'User'}</span>
          <span className="app-header__subtitle">Inbox copilot</span>
        </div>
      </div>
      <div className="app-header__actions">
        <PlanBadge plan={user?.plan} />
        <button
          type="button"
          onClick={onSettingsClick}
          className="icon-button"
          title="Settings"
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
