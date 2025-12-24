"use client";
import React, { useEffect, useState } from 'react';

interface Application {
    id: number;
    company_name: string;
    job_role: string;
    job_link: string;
    date_applied: string;
    status: string;
    resume_path: string;
}

export default function ApplicationList({ refreshTrigger }: { refreshTrigger: number }) {
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        fetch('http://localhost:8000/applications')
            .then(res => res.json())
            .then(data => setApplications(data))
            .catch(err => console.error("Error fetching applications:", err));
    }, [refreshTrigger]);

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Application History</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Company</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Link</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(app.date_applied).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {app.company_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {app.job_role}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${app.status === 'Applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                            app.status === 'Interview' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                app.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                                        {app.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                                    {app.job_link && (
                                        <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            View
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {applications.length === 0 && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No applications tracked yet.
                    </div>
                )}
            </div>
        </div>
    );
}
