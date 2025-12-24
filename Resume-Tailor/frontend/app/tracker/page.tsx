"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import ApplicationForm from '../../components/ApplicationForm';
import ApplicationList from '../../components/ApplicationList';

export default function TrackerPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleApplicationAdded = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Job Application Tracker
                    </h1>
                    <Link href="/" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                        &larr; Back to Tailor
                    </Link>
                </div>

                <ApplicationForm onApplicationAdded={handleApplicationAdded} />

                <ApplicationList refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
}
