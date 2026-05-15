import React from 'react';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import EmptyState from '../components/EmptyState';

export default function Dashboard({ user, onSettingsClick }) {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <Header user={user} onSettingsClick={onSettingsClick} />
      <CategoryFilter />
      <EmptyState />
    </div>
  );
}
