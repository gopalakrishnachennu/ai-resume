'use client';

import { useState } from 'react';
import { AppliedJob, AppliedJobQA, deleteAppliedJob } from '@/lib/services/appliedJobsService';
import Link from 'next/link';

interface AppliedJobsTableProps {
    jobs: AppliedJob[];
    userId: string;
    onDelete?: (jobId: string) => void;
}

export function AppliedJobsTable({ jobs, userId, onDelete }: AppliedJobsTableProps) {
    const [selectedJob, setSelectedJob] = useState<AppliedJob | null>(null);
    const [showQAModal, setShowQAModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleViewQA = (job: AppliedJob) => {
        setSelectedJob(job);
        setShowQAModal(true);
    };

    const handleDelete = async (jobId: string) => {
        if (!confirm('Delete this application record?')) return;

        setDeleting(jobId);
        const success = await deleteAppliedJob(userId, jobId);
        if (success && onDelete) {
            onDelete(jobId);
        }
        setDeleting(null);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getPlatformIcon = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('linkedin')) return '🔗';
        if (p.includes('indeed')) return '📋';
        if (p.includes('workday')) return '🏢';
        if (p.includes('greenhouse')) return '🌱';
        if (p.includes('lever')) return '⚙️';
        return '💼';
    };

    if (jobs.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p className="font-medium">No applied jobs yet</p>
                <p className="text-sm">Applications will appear here after you submit forms using the extension</p>
            </div>
        );
    }

    return (
        <>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                            <th className="pb-3 font-medium">Company</th>
                            <th className="pb-3 font-medium">Position</th>
                            <th className="pb-3 font-medium">Platform</th>
                            <th className="pb-3 font-medium">Applied</th>
                            <th className="pb-3 font-medium">Q&A</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {jobs.map((job) => (
                            <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4">
                                    <div className="font-semibold text-gray-900">
                                        {job.company || 'Unknown Company'}
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="text-gray-900">{job.jobTitle}</div>
                                </td>
                                <td className="py-4">
                                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                        {getPlatformIcon(job.platform)}
                                        {job.platform}
                                    </span>
                                </td>
                                <td className="py-4 text-sm text-gray-500">
                                    {formatDate(job.appliedAt)}
                                </td>
                                <td className="py-4">
                                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm px-2 py-1 rounded-full">
                                        📝 {job.questionsAnswered} answers
                                    </span>
                                </td>
                                <td className="py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleViewQA(job)}
                                            className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                                        >
                                            View Q&A
                                        </button>
                                        {job.url && (
                                            <a
                                                href={job.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                                            >
                                                🔗 Job Page
                                            </a>
                                        )}
                                        {job.resumeId && (
                                            <Link
                                                href={`/editor/${job.resumeId}`}
                                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                                            >
                                                📄 Resume
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            disabled={deleting === job.id}
                                            className="px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            {deleting === job.id ? '...' : '🗑️'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Q&A Modal */}
            {showQAModal && selectedJob && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <h3 className="text-lg font-bold">{selectedJob.jobTitle}</h3>
                                    <p className="text-indigo-100 text-sm">{selectedJob.company}</p>
                                </div>
                                <button
                                    onClick={() => setShowQAModal(false)}
                                    className="text-white/80 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <p className="text-sm text-gray-500 mb-4">
                                Applied on {formatDate(selectedJob.appliedAt)} • {selectedJob.questionsAnswered} questions answered
                            </p>

                            {selectedJob.qa.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedJob.qa.map((item, index) => (
                                        <div key={index} className="border border-gray-100 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="text-lg">❓</span>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{item.q}</p>
                                                    {item.cat && (
                                                        <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                            {item.cat}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 mt-3 pl-8">
                                                <span className="text-lg">💬</span>
                                                <p className="text-gray-700 whitespace-pre-wrap">{item.a}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">
                                    No Q&A data available
                                </p>
                            )}

                            {selectedJob.jobDescription && (
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-2">📋 Job Description</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                        {selectedJob.jobDescription}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            {selectedJob.url && (
                                <a
                                    href={selectedJob.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Open Job Page
                                </a>
                            )}
                            <button
                                onClick={() => setShowQAModal(false)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
