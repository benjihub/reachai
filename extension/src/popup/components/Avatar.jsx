import React from 'react';

export default function Avatar({ url, name }) {
  if (!url) {
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
        {name?.charAt(0).toUpperCase() || 'U'}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className="w-8 h-8 rounded-full"
      title={name}
    />
  );
}
