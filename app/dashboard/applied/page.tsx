'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getAppliedJobs, AppliedJob } from '@/lib/services/appliedJobsService';
import { AppliedJobsTable } from '@/components/AppliedJobsTable';

export default function AppliedJobsPage() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user?.uid) {
            loadAppliedJobs();
        }
    }, [user?.uid]);

    const loadAppliedJobs = async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const jobs = await getAppliedJobs(user.uid);
            setAppliedJobs(jobs);
        } catch (error) {
            console.error('Error loading applied jobs:', error);
        }
        setLoading(false);
    };

    const handleDelete = (jobId: string) => {
        setAppliedJobs(prev => prev.filter(job => job.id !== jobId));
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent hidden sm:block">
                                AI Resume Builder
                            </span>
                        </Link>

                        <nav className="flex items-center gap-1">
                            <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                                Dashboard
                            </Link>
                            <Link href="/dashboard/applied" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                                Applied Jobs
                            </Link>
                            <Link href="/generate" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                                Generate
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Applied Jobs
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Review your job applications and submitted answers for interview preparation
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📝</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{appliedJobs.length}</p>
                                <p className="text-sm text-gray-500">Total Applications</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">💬</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {appliedJobs.reduce((sum, j) => sum + j.questionsAnswered, 0)}
                                </p>
                                <p className="text-sm text-gray-500">Questions Answered</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {appliedJobs.filter(j => {
                                        const weekAgo = new Date();
                                        weekAgo.setDate(weekAgo.getDate() - 7);
                                        return j.appliedAt > weekAgo;
                                    }).length}
                                </p>
                                <p className="text-sm text-gray-500">This Week</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Applied Jobs Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Your Applications</h2>
                        <button
                            onClick={loadAppliedJobs}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <AppliedJobsTable
                            jobs={appliedJobs}
                            userId={user.uid}
                            onDelete={handleDelete}
                        />
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <h3 className="font-semibold text-indigo-900 mb-2">📋 Interview Preparation Tip</h3>
                    <p className="text-indigo-800 text-sm">
                        When you receive an interview call, click "View Q&A" to review exactly what you submitted in your application.
                        This helps you prepare consistent answers and remember the specific details you shared.
                    </p>
                </div>
            </main>
        </div>
    );
}
