import React from 'react';
import PlanBadge from '../components/PlanBadge';

export default function Settings({ user, onSignOut }) {
  return (
    <div className="w-full h-full flex flex-col p-6 bg-white">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Plan</label>
          <div className="mt-1">
            <PlanBadge plan={user?.plan} />
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="w-full px-4 py-2 bg-red-50 text-red-700 rounded font-medium hover:bg-red-100 transition text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
