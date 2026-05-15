import React from 'react';

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-4xl mb-3">📭</div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">No drafts yet</h2>
      <p className="text-sm text-gray-600 mb-6">
        Open Gmail or LinkedIn and click "Draft reply" to get started.
      </p>
      <div className="flex gap-2">
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded font-medium text-sm hover:bg-blue-200 transition"
        >
          Open Gmail
        </a>
        <a
          href="https://www.linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition"
        >
          Open LinkedIn
        </a>
      </div>
    </div>
  );
}
