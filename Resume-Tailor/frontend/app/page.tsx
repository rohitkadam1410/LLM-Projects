"use client";
import React, { useState } from 'react';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationList from '../components/ApplicationList';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const handleApplicationAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowForm(false); // Hide form after adding
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Application Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your job applications</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30 font-semibold flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{showForm ? 'Cancel' : 'Add Application'}</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-8 animate-fade-in-up">
          <ApplicationForm onApplicationAdded={handleApplicationAdded} />
        </div>
      )}

      <ApplicationList refreshTrigger={refreshTrigger} />
    </div>
  );
}
