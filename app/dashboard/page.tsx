'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { authService } from '@/lib/services/auth';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    // const [authLoading, setAuthLoading] = useState(true); // Removed local state
    const [appliedResumes, setAppliedResumes] = useState<any[]>([]);
    const [analyzedJDs, setAnalyzedJDs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        avgAts: 0,
        thisWeek: 0,
    });
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [deleteModal, setDeleteModal] = useState<{
        show: boolean;
        resumeId: string;
        resumeTitle: string;
    }>({
        show: false,
        resumeId: '',
        resumeTitle: '',
    });

    useEffect(() => {
        useAuthStore.getState().initialize();
    }, []);

    useEffect(() => {
        // ✅ Wait for auth to finish loading
        if (authLoading) return;

        // ✅ Only redirect if definitely no user
        if (!user) {
            router.push('/login');
            return;
        }
        loadData();
    }, [user, authLoading]);

    const loadData = async () => {
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        console.log('🔍 Loading resumes for user:', user.uid);

        let aiResumes: any[] = [];
        let oldResumes: any[] = [];

        // 1. Load AI-generated resumes from 'resumes' collection
        try {
            console.log('📂 Querying resumes collection...');
            const resumesQuery = query(
                collection(db, 'resumes'),
                where('userId', '==', user.uid)
            );
            const resumesSnapshot = await getDocs(resumesQuery);
            console.log('📄 Resumes snapshot size:', resumesSnapshot.size);

            aiResumes = resumesSnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('📝 Resume doc:', doc.id, data);
                return {
                    id: doc.id,
                    ...data,
                    jobTitle: data.jobTitle || 'Untitled',
                    createdAt: data.createdAt,
                    // Use actual ATS score from Firebase, or null if not analyzed
                    atsScore: data.atsScore || null,
                };
            });

            console.log('✅ AI Resumes found:', aiResumes.length, aiResumes);
        } catch (error) {
            console.error('⚠️ Error loading AI resumes (continuing anyway):', error);
        }

        // 2. Load old resumes from 'appliedResumes' collection
        try {
            console.log('📂 Querying appliedResumes collection...');
            const appliedQuery = query(
                collection(db, 'appliedResumes'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const appliedSnapshot = await getDocs(appliedQuery);
            console.log('📄 Applied resumes snapshot size:', appliedSnapshot.size);

            oldResumes = appliedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            console.log('✅ Old Resumes found:', oldResumes.length);
        } catch (error) {
            console.error('⚠️ Error loading old resumes (continuing anyway):', error);
        }

        // 3. Combine, remove duplicates, and sort
        const allResumes = [...aiResumes, ...oldResumes]
            .filter((resume, index, self) =>
                index === self.findIndex((r) => r.id === resume.id)
            )
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
            });

        console.log('📊 Total resumes combined:', allResumes.length);
        console.log('📋 All resumes:', allResumes);

        setAppliedResumes(allResumes);

        // Calculate stats
        const total = allResumes.length;
        const avgAts = allResumes.length > 0
            ? allResumes.reduce((sum: number, r: any) => sum + (r.atsScore?.total || 0), 0) / allResumes.length
            : 0;

        // Count resumes from this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeek = allResumes.filter((r: any) => {
            const createdAt = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
            return createdAt && createdAt > oneWeekAgo;
        }).length;

        const newStats = { total, avgAts: Math.round(avgAts), thisWeek };
        console.log('📈 Stats calculated:', newStats);
        setStats(newStats);

        // Load recent analyzed JDs (without orderBy to avoid index requirement)
        try {
            const jdQuery = query(
                collection(db, 'jobs'),
                where('userId', '==', user.uid)
            );
            const jdSnapshot = await getDocs(jdQuery);
            const jds = jdSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .sort((a: any, b: any) => {
                    // Sort by createdAt descending
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                })
                .slice(0, 6); // Limit to 6 most recent

            setAnalyzedJDs(jds);
            console.log('📋 Analyzed JDs loaded:', jds.length);
        } catch (error) {
            console.error('⚠️ Error loading analyzed JDs:', error);
        }

        setLoading(false);
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

    const handleDeleteResume = (resumeId: string, resumeTitle: string) => {
        setDeleteModal({
            show: true,
            resumeId,
            resumeTitle,
        });
    };

    const confirmDelete = async () => {
        try {
            // Try deleting from both collections
            await deleteDoc(doc(db, 'resumes', deleteModal.resumeId));
            await deleteDoc(doc(db, 'appliedResumes', deleteModal.resumeId));

            toast.success('Resume deleted successfully!');
            setDeleteModal({ show: false, resumeId: '', resumeTitle: '' });
            loadData(); // Reload the list
        } catch (error) {
            console.error('Error deleting resume:', error);
            toast.error('Failed to delete resume');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ show: false, resumeId: '', resumeTitle: '' });
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
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Your Resumes</h2>

                        {/* View Mode Toggle */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-md font-medium transition-all ${viewMode === 'grid'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Gallery
                                </span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-md font-medium transition-all ${viewMode === 'list'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    List
                                </span>
                            </button>
                        </div>
                    </div>

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
                                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                            : 'space-y-4'
                        }>
                            {appliedResumes.map((resume: any) => (
                                <div
                                    key={resume.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all relative"
                                >
                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDeleteResume(resume.id, resume.jobTitle || 'Untitled Resume')}
                                        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all group"
                                        title="Delete resume"
                                    >
                                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>

                                    <div className="flex justify-between items-start mb-4 pr-8">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {resume.jobTitle || 'Untitled Resume'}
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                {resume.company || resume.jobCompany || 'No company specified'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {resume.atsScore?.total ? (
                                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${resume.atsScore.total >= 80
                                                    ? 'bg-green-100 text-green-700'
                                                    : resume.atsScore.total >= 60
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    ATS: {resume.atsScore.total}%
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
                                                    Not Analyzed
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Link
                                            href={`/editor/${resume.id}`}
                                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Resume
                                        </Link>

                                        <div className="flex gap-2">
                                            <button
                                                className="flex-1 px-4 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 hover:border-red-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2 group"
                                            >
                                                <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                PDF
                                            </button>
                                            <button
                                                className="flex-1 px-4 py-3 bg-white border-2 border-blue-200 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2 group"
                                            >
                                                <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                DOCX
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Analyzed JDs */}
                {analyzedJDs.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Analyzed JDs</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {analyzedJDs.map((jd: any) => (
                                <div
                                    key={jd.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all"
                                >
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {jd.parsedData?.title || 'Untitled Position'}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            {jd.parsedData?.company || 'Company not specified'}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-2">
                                            Analyzed {jd.createdAt?.toDate ? new Date(jd.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href={`/generate?jdId=${jd.id}`}
                                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Use This JD
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Ultra-Minimalist Delete Modal */}
            {deleteModal.show && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
                    onClick={cancelDelete}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full transform transition-all animate-slideUp overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Minimalist Header with Icon */}
                        <div className="pt-8 pb-6 px-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Resume?</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                <span className="font-medium text-gray-900">{deleteModal.resumeTitle}</span>
                                <br />
                                will be permanently deleted
                            </p>
                        </div>

                        {/* Minimalist Action Buttons */}
                        <div className="flex border-t border-gray-100">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 py-4 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <div className="w-px bg-gray-100"></div>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-4 text-red-600 font-semibold hover:bg-red-50 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
