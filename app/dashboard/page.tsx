'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { authService } from '@/lib/services/auth';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [appliedResumes, setAppliedResumes] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        avgAts: 0,
        thisWeek: 0,
    });

    useEffect(() => {
        useAuthStore.getState().initialize();
    }, []);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        try {
            // Load applied resumes from Firestore
            const q = query(
                collection(db, 'appliedResumes'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const resumes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAppliedResumes(resumes);

            // Calculate stats
            const total = resumes.length;
            const avgAts = resumes.length > 0
                ? resumes.reduce((sum: number, r: any) => sum + (r.atsScore?.total || 0), 0) / resumes.length
                : 0;

            // Count resumes from this week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const thisWeek = resumes.filter((r: any) => {
                const createdAt = r.createdAt?.toDate();
                return createdAt && createdAt > oneWeekAgo;
            }).length;

            setStats({ total, avgAts: Math.round(avgAts), thisWeek });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await authService.signout();
            toast.success('Signed out successfully');
            router.push('/');
        } catch (error) {
            toast.error('Failed to sign out');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
                        <span className="text-xl font-bold text-gray-900">AI Resume Builder</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/profile"
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                        >
                            ⚙️ Profile
                        </Link>
                        <span className="text-gray-700">
                            {user?.displayName || user?.email}
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {user?.displayName?.split(' ')[0] || 'there'}! 👋
                    </h1>
                    <p className="text-gray-600">
                        Ready to create your next ATS-optimized resume?
                    </p>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Resumes</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📄</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Avg ATS Score</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.avgAts}%</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">This Week</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🚀</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <Link
                    href="/generate"
                    className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 rounded-xl text-center text-xl font-bold hover:shadow-2xl transition-all transform hover:scale-105 mb-8"
                >
                    🚀 Generate New Resume
                </Link>

                {/* Resumes List */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Resumes</h2>

                    {appliedResumes.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">📝</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No resumes yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Create your first AI-optimized resume in minutes!
                            </p>
                            <Link
                                href="/generate"
                                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appliedResumes.map((resume: any) => (
                                <div
                                    key={resume.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {resume.jobTitle || 'Untitled Resume'}
                                            </h3>
                                            <p className="text-gray-600">
                                                {resume.company || 'No company specified'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${resume.atsScore?.total >= 80
                                                ? 'bg-green-100 text-green-700'
                                                : resume.atsScore?.total >= 60
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                ATS: {resume.atsScore?.total || 0}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link
                                            href={`/editor/${resume.id}`}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                                            Download PDF
                                        </button>
                                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                                            Download DOCX
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
