'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import Link from 'next/link';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
    const { isAuthenticated, isLoading, logout, requireAuth } = useAdminAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        guestUsers: 0,
        loggedInUsers: 0,
        totalResumes: 0,
        todayResumes: 0,
    });

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
            // Get all users
            const usersSnap = await getDocs(collection(db, 'users'));
            const totalUsers = usersSnap.size;

            let guestUsers = 0;
            usersSnap.docs.forEach(doc => {
                if (doc.data().isAnonymous) guestUsers++;
            });
            const loggedInUsers = totalUsers - guestUsers;

            // Get all resumes
            const resumesSnap = await getDocs(collection(db, 'resumes'));
            const totalResumes = resumesSnap.size;

            // Today's resumes
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

            setStats({
                totalUsers,
                guestUsers,
                loggedInUsers,
                totalResumes,
                todayResumes,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const menuItems = [
        {
            title: 'App Settings',
            description: 'Configure authentication, features, and limits',
            icon: '⚙️',
            href: '/admin/settings',
            color: 'from-blue-500 to-indigo-600',
        },
        {
            title: 'User Management',
            description: 'View and manage all users',
            icon: '👥',
            href: '/admin/users',
            color: 'from-purple-500 to-pink-600',
        },
        {
            title: 'Analytics',
            description: 'Usage statistics and insights',
            icon: '📊',
            href: '/admin/analytics',
            color: 'from-green-500 to-teal-600',
        },
        {
            title: 'Guest Limits',
            description: 'Configure guest user restrictions',
            icon: '🔒',
            href: '/admin/settings#guest',
            color: 'from-orange-500 to-red-600',
        },
        {
            title: 'Prompt Defaults',
            description: 'Edit global prompts for all users',
            icon: '🧠',
            href: '/admin/prompts',
            color: 'from-purple-500 to-indigo-600',
        },
    ];

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: '👤', color: 'bg-blue-500' },
        { label: 'Guest Users', value: stats.guestUsers, icon: '🎭', color: 'bg-purple-500' },
        { label: 'Logged In', value: stats.loggedInUsers, icon: '✅', color: 'bg-green-500' },
        { label: 'Total Resumes', value: stats.totalResumes, icon: '📄', color: 'bg-indigo-500' },
        { label: 'Today', value: stats.todayResumes, icon: '🆕', color: 'bg-pink-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-sm text-gray-600 mt-1">Manage your AI Resume Builder</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    {statCards.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{stat.icon}</span>
                                <div className={`${stat.color} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
                                    Live
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-transparent"
                        >
                            <div className={`h-2 bg-gradient-to-r ${item.color}`}></div>
                            <div className="p-6">
                                <div className="text-4xl mb-4">{item.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-600">{item.description}</p>
                                <div className="mt-4 flex items-center text-indigo-600 text-sm font-semibold">
                                    <span>Manage</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Info */}
                <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">💡</div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Quick Tips</h3>
                            <ul className="space-y-2 text-indigo-100">
                                <li>• Use <strong>App Settings</strong> to control all features and limits</li>
                                <li>• Monitor <strong>Analytics</strong> to track user behavior</li>
                                <li>• Manage <strong>Guest Limits</strong> to balance free vs paid users</li>
                                <li>• All changes take effect immediately</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
