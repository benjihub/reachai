import React from 'react';

export default function CategoryFilter() {
  const categories = ['All', 'Hot', 'Follow-up', 'Cold'];

  return (
    <div className="filter-bar">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          disabled={true}
          className={`chip-button ${cat === 'All' ? 'chip-button--active' : ''}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
