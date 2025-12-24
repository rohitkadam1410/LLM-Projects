"use client";
import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

interface Application {
    id: number;
    company_name: string;
    job_role: string;
    job_link: string;
    date_applied: string;
    status: string;
    resume_path: string;
    job_description?: string;
}

export default function ApplicationList({ refreshTrigger }: { refreshTrigger: number }) {
    const [applications, setApplications] = useState<Application[]>([]);
    const router = useRouter();

    const statusOptions = ['Applied', 'Interview', 'Offered', 'Rejected'];

    useEffect(() => {
        fetch('http://localhost:8000/applications')
            .then(res => res.json())
            .then(data => setApplications(data))
            .catch(err => console.error("Error fetching applications:", err));
    }, [refreshTrigger]);

    const handleTailor = (app: Application) => {
        if (app.job_description) {
            localStorage.setItem('tailor_jd', app.job_description);
            router.push('/tailor');
        } else {
            alert("No Job Description available for this application.");
        }
    };

    const handleDelete = async (app: Application) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the application for ${app.job_role} at ${app.company_name}?`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`http://localhost:8000/applications/${app.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove from local state
                setApplications(applications.filter(a => a.id !== app.id));
            } else {
                alert('Failed to delete application');
            }
        } catch (error) {
            console.error('Error deleting application:', error);
            alert('Error deleting application');
        }
    };

    const handleStatusChange = async (app: Application, newStatus: string) => {
        try {
            const formData = new FormData();
            formData.append('status', newStatus);

            const response = await fetch(`http://localhost:8000/applications/${app.id}/status`, {
                method: 'PATCH',
                body: formData,
            });

            if (response.ok) {
                // Update local state
                setApplications(applications.map(a =>
                    a.id === app.id ? { ...a, status: newStatus } : a
                ));
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

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
                            <th className="px-6 py-3">Actions</th>
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
                                    <select
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app, e.target.value)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 cursor-pointer transition-colors
                                            ${app.status === 'Applied' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' :
                                                app.status === 'Interview' ? 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' :
                                                    app.status === 'Rejected' ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' :
                                                        'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'}`}
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                                    {app.job_link && (
                                        <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            View
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => handleTailor(app)}
                                            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Tailor
                                        </button>
                                        <button
                                            onClick={() => handleDelete(app)}
                                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
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
