'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Stats {
    totalUsers: number;
    guestUsers: number;
    loggedInUsers: number;
    totalResumes: number;
    todayResumes: number;
    totalJDAnalyses: number;
    avgUsagePerGuest: number;
    conversionRate: number;
}

export default function AnalyticsPage() {
    const { isAuthenticated, isLoading, requireAuth, logout } = useAdminAuth();
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        guestUsers: 0,
        loggedInUsers: 0,
        totalResumes: 0,
        todayResumes: 0,
        totalJDAnalyses: 0,
        avgUsagePerGuest: 0,
        conversionRate: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        requireAuth();
    }, [isAuthenticated, isLoading]);

    useEffect(() => {
        if (isAuthenticated) {
            loadStats();
        }
    }, [isAuthenticated]);

    const loadStats = async () => {
        try {
            setLoading(true);

            // Get all users
            const usersSnap = await getDocs(collection(db, 'users'));
            const totalUsers = usersSnap.size;

            // Count guest vs logged-in users
            let guestUsers = 0;
            let totalGuestUsage = 0;

            usersSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.isAnonymous) {
                    guestUsers++;
                    const usage = data.usage || {};
                    totalGuestUsage += (usage.resumeGenerations || 0);
                }
            });

            const loggedInUsers = totalUsers - guestUsers;

            // Get all resumes
            const resumesSnap = await getDocs(collection(db, 'resumes'));
            const totalResumes = resumesSnap.size;

            // Count today's resumes
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            let todayResumes = 0;
            resumesSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.createdAt && data.createdAt >= todayTimestamp) {
                    todayResumes++;
                }
            });

            // Get JD analyses
            const jobsSnap = await getDocs(collection(db, 'jobs'));
            const totalJDAnalyses = jobsSnap.size;

            // Calculate metrics
            const avgUsagePerGuest = guestUsers > 0 ? totalGuestUsage / guestUsers : 0;
            const conversionRate = totalUsers > 0 ? (loggedInUsers / totalUsers) * 100 : 0;

            setStats({
                totalUsers,
                guestUsers,
                loggedInUsers,
                totalResumes,
                todayResumes,
                totalJDAnalyses,
                avgUsagePerGuest: Math.round(avgUsagePerGuest * 10) / 10,
                conversionRate: Math.round(conversionRate * 10) / 10,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                                <p className="text-sm text-gray-600">Usage statistics and insights</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadStats}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon="👥"
                                label="Total Users"
                                value={stats.totalUsers}
                                color="bg-blue-500"
                            />
                            <StatCard
                                icon="🎭"
                                label="Guest Users"
                                value={stats.guestUsers}
                                color="bg-purple-500"
                            />
                            <StatCard
                                icon="✅"
                                label="Logged In"
                                value={stats.loggedInUsers}
                                color="bg-green-500"
                            />
                            <StatCard
                                icon="📄"
                                label="Total Resumes"
                                value={stats.totalResumes}
                                color="bg-indigo-500"
                            />
                            <StatCard
                                icon="🆕"
                                label="Today's Resumes"
                                value={stats.todayResumes}
                                color="bg-pink-500"
                            />
                            <StatCard
                                icon="💼"
                                label="JD Analyses"
                                value={stats.totalJDAnalyses}
                                color="bg-orange-500"
                            />
                            <StatCard
                                icon="📊"
                                label="Avg Usage/Guest"
                                value={stats.avgUsagePerGuest}
                                color="bg-teal-500"
                                suffix=" resumes"
                            />
                            <StatCard
                                icon="📈"
                                label="Conversion Rate"
                                value={stats.conversionRate}
                                color="bg-cyan-500"
                                suffix="%"
                            />
                        </div>

                        {/* Charts Placeholder */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">User Distribution</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm text-gray-600">Guest Users</span>
                                            <span className="text-sm font-semibold text-gray-900">{stats.guestUsers}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-purple-500 h-3 rounded-full"
                                                style={{ width: `${stats.totalUsers > 0 ? (stats.guestUsers / stats.totalUsers) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm text-gray-600">Logged In Users</span>
                                            <span className="text-sm font-semibold text-gray-900">{stats.loggedInUsers}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-green-500 h-3 rounded-full"
                                                style={{ width: `${stats.totalUsers > 0 ? (stats.loggedInUsers / stats.totalUsers) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Key Metrics</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Conversion Rate</span>
                                        <span className="text-2xl font-bold text-green-600">{stats.conversionRate}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Avg Usage per Guest</span>
                                        <span className="text-2xl font-bold text-indigo-600">{stats.avgUsagePerGuest}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Resumes</span>
                                        <span className="text-2xl font-bold text-blue-600">{stats.totalResumes}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function StatCard({ icon, label, value, color, suffix = '' }: {
    icon: string;
    label: string;
    value: number;
    color: string;
    suffix?: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                <div className={`${color} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
                    Live
                </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
                {value}{suffix}
            </div>
            <div className="text-sm text-gray-600">{label}</div>
        </div>
    );
}
