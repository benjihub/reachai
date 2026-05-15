import React from 'react';

export default function CategoryFilter() {
  const categories = ['All', 'Hot', 'Follow-up', 'Cold'];

  return (
    <div className="flex gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50">
      {categories.map((cat) => (
        <button
          key={cat}
          disabled={true}
          className="px-3 py-1 text-sm rounded font-medium text-gray-500 bg-white border border-gray-200 cursor-not-allowed opacity-50"
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
