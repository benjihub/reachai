import React from 'react';

export default function DraftCard({ draft }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
      <p className="text-sm text-gray-600">{draft.contact}</p>
      <p className="text-xs text-gray-500 mt-1">{draft.platform}</p>
    </div>
  );
}
