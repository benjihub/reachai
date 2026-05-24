import React from 'react';

export default function Avatar({ url, name }) {
  if (!url) {
    return (
      <div className="avatar" aria-hidden="true">
        <span className="avatar__fallback">
          {name?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
    );
  }

  return (
    <div className="avatar">
      <img
        src={url}
        alt={name}
        title={name}
      />
    </div>
  );
}
