import React from 'react';
import Avatar from './Avatar';

export default function Header({ user, onSettingsClick }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <Avatar url={user?.avatar} name={user?.name} />
        <span className="text-sm font-medium text-gray-900">{user?.name || 'User'}</span>
      </div>
      <button
        onClick={onSettingsClick}
        className="p-1 hover:bg-gray-100 rounded transition"
        title="Settings"
      >
        ⚙️
      </button>
    </div>
  );
}
