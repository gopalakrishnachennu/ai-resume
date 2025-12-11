'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { authService } from '@/lib/services/auth';
import { toast } from 'react-hot-toast';

// Animated counter component
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            setDisplayValue(Math.floor(progress * value));
            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [value, duration]);

    return <span>{displayValue}</span>;
}

// Time ago helper
function timeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// ATS Score Ring Component
function ATSScoreRing({ score, size = 48 }: { score: number; size?: number }) {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (score: number) => {
        if (score >= 80) return { stroke: '#10b981', bg: '#d1fae5', text: '#059669' };
        if (score >= 60) return { stroke: '#f59e0b', bg: '#fef3c7', text: '#d97706' };
        return { stroke: '#ef4444', bg: '#fee2e2', text: '#dc2626' };
    };

    const colors = getColor(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                />
            </svg>
            <span
                className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                style={{ color: colors.text }}
            >
                {score}%
            </span>
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [appliedResumes, setAppliedResumes] = useState<any[]>([]);
    const [analyzedJDs, setAnalyzedJDs] = useState<any[]>([]);
    const [profileComplete, setProfileComplete] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        avgAts: 0,
        thisWeek: 0,
    });
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [showUserMenu, setShowUserMenu] = useState(false);
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
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        loadData();
        checkProfileCompletion();
    }, [user, authLoading]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClick = () => setShowUserMenu(false);
        if (showUserMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [showUserMenu]);

    const checkProfileCompletion = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                const hasProfile = data.profile?.phone || data.profile?.location;
                const hasExperience = data.baseExperience?.[0]?.company;
                const hasEducation = data.baseEducation?.[0]?.school;
                setProfileComplete(hasProfile && hasExperience && hasEducation);
            }
        } catch (error) {
            console.error('Error checking profile:', error);
        }
    };

    const loadData = async () => {
        if (!user) return;

        let aiResumes: any[] = [];
        let oldResumes: any[] = [];

        try {
            const resumesQuery = query(
                collection(db, 'resumes'),
                where('userId', '==', user.uid)
            );
            const resumesSnapshot = await getDocs(resumesQuery);
            aiResumes = resumesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                jobTitle: doc.data().jobTitle || 'Untitled',
                createdAt: doc.data().createdAt,
                atsScore: doc.data().atsScore || null,
            }));
        } catch (error) {
            console.error('Error loading AI resumes:', error);
        }

        try {
            const appliedQuery = query(
                collection(db, 'appliedResumes'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const appliedSnapshot = await getDocs(appliedQuery);
            oldResumes = appliedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error loading old resumes:', error);
        }

        const allResumes = [...aiResumes, ...oldResumes]
            .filter((resume, index, self) =>
                index === self.findIndex((r) => r.id === resume.id)
            )
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
            });

        setAppliedResumes(allResumes);

        const total = allResumes.length;
        const analyzedResumes = allResumes.filter(r => r.atsScore?.total);
        const avgAts = analyzedResumes.length > 0
            ? analyzedResumes.reduce((sum: number, r: any) => sum + (r.atsScore?.total || 0), 0) / analyzedResumes.length
            : 0;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeek = allResumes.filter((r: any) => {
            const createdAt = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
            return createdAt && createdAt > oneWeekAgo;
        }).length;

        setStats({ total, avgAts: Math.round(avgAts), thisWeek });

        try {
            const jdQuery = query(
                collection(db, 'jobs'),
                where('userId', '==', user.uid)
            );
            const jdSnapshot = await getDocs(jdQuery);
            const jds = jdSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                })
                .slice(0, 6);
            setAnalyzedJDs(jds);
        } catch (error) {
            console.error('Error loading JDs:', error);
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
        setDeleteModal({ show: true, resumeId, resumeTitle });
    };

    const confirmDelete = async () => {
        try {
            await deleteDoc(doc(db, 'resumes', deleteModal.resumeId));
            await deleteDoc(doc(db, 'appliedResumes', deleteModal.resumeId));
            toast.success('Resume deleted!');
            setDeleteModal({ show: false, resumeId: '', resumeTitle: '' });
            loadData();
        } catch (error) {
            toast.error('Failed to delete resume');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ show: false, resumeId: '', resumeTitle: '' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent hidden sm:block">
                                AI Resume Builder
                            </span>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg transition-colors"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/generate"
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Generate
                            </Link>
                            <Link
                                href="/profile"
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Profile
                            </Link>
                        </nav>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUserMenu(!showUserMenu);
                                }}
                                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                                    {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
                                    {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]}
                                </span>
                                <svg className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fadeIn">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-sm font-medium text-slate-900">{user?.displayName || 'User'}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Edit Profile
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                    </Link>
                                    <div className="border-t border-slate-100 mt-2 pt-2">
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-blue-600 mb-1">{greeting()}</p>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                                {user?.displayName?.split(' ')[0] || 'Welcome back'}! 👋
                            </h1>
                            <p className="text-slate-600 mt-1">
                                Ready to create your next ATS-optimized resume?
                            </p>
                        </div>
                        <Link
                            href="/generate"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Resume
                        </Link>
                    </div>
                </div>

                {/* Profile Completion Banner */}
                {!profileComplete && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900">Complete Your Profile</h3>
                                <p className="text-sm text-amber-700">Add your experience and education for better AI-generated resumes.</p>
                            </div>
                            <Link
                                href="/profile"
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors text-sm"
                            >
                                Complete Now
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    {/* Total Resumes */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 mb-1">
                                <AnimatedCounter value={stats.total} />
                            </p>
                            <p className="text-sm text-slate-500">Resumes Created</p>
                        </div>
                    </div>

                    {/* Avg ATS Score */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Average</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 mb-1">
                                <AnimatedCounter value={stats.avgAts} />%
                            </p>
                            <p className="text-sm text-slate-500">ATS Score</p>
                        </div>
                    </div>

                    {/* This Week */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-purple-100 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">7 days</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 mb-1">
                                <AnimatedCounter value={stats.thisWeek} />
                            </p>
                            <p className="text-sm text-slate-500">Created This Week</p>
                        </div>
                    </div>
                </div>

                {/* Resumes Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Section Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-slate-900">Your Resumes</h2>
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                {appliedResumes.length}
                            </span>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg self-start">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                List
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {appliedResumes.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No resumes yet</h3>
                                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                                    Create your first AI-optimized resume in minutes!
                                </p>
                                <Link
                                    href="/generate"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Your First Resume
                                </Link>
                            </div>
                        ) : (
                            <div className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                                    : 'space-y-3'
                            }>
                                {appliedResumes.map((resume: any) => {
                                    const createdAt = resume.createdAt?.toDate ? resume.createdAt.toDate() : new Date(resume.createdAt);

                                    return viewMode === 'grid' ? (
                                        /* Grid View Card */
                                        <div
                                            key={resume.id}
                                            className="group relative bg-slate-50/50 rounded-xl p-5 border border-slate-100 hover:bg-white hover:shadow-lg hover:border-slate-200 transition-all duration-300"
                                        >
                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteResume(resume.id, resume.jobTitle || 'Untitled')}
                                                className="absolute top-3 right-3 p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>

                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4 pr-8">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-slate-900 truncate mb-1">
                                                        {resume.jobTitle || 'Untitled Resume'}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 truncate">
                                                        {resume.company || resume.jobCompany || 'No company'}
                                                    </p>
                                                </div>
                                                {resume.atsScore?.total && (
                                                    <ATSScoreRing score={resume.atsScore.total} />
                                                )}
                                            </div>

                                            {/* Time */}
                                            <p className="text-xs text-slate-400 mb-4">
                                                {timeAgo(createdAt)}
                                            </p>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/editor/${resume.id}`}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </Link>
                                                <button className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* List View Row */
                                        <div
                                            key={resume.id}
                                            className="group flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all duration-300"
                                        >
                                            {/* ATS Score */}
                                            <div className="flex-shrink-0">
                                                {resume.atsScore?.total ? (
                                                    <ATSScoreRing score={resume.atsScore.total} size={48} />
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                        <span className="text-xs text-slate-400">N/A</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {resume.jobTitle || 'Untitled Resume'}
                                                </h3>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {resume.company || resume.jobCompany || 'No company'} • {timeAgo(createdAt)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/editor/${resume.id}`}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </Link>
                                                <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteResume(resume.id, resume.jobTitle || 'Untitled')}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Analyzed JDs */}
                {analyzedJDs.length > 0 && (
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-slate-900">Recent Job Descriptions</h2>
                            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
                                {analyzedJDs.length}
                            </span>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {analyzedJDs.map((jd: any) => {
                                    const createdAt = jd.createdAt?.toDate ? jd.createdAt.toDate() : new Date(jd.createdAt);
                                    return (
                                        <div
                                            key={jd.id}
                                            className="group p-5 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-xl border border-purple-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300"
                                        >
                                            <div className="mb-4">
                                                <h3 className="font-semibold text-slate-900 truncate mb-1">
                                                    {jd.parsedData?.title || 'Untitled Position'}
                                                </h3>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {jd.parsedData?.company || 'Company not specified'}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    Analyzed {timeAgo(createdAt)}
                                                </p>
                                            </div>
                                            <Link
                                                href={`/generate?jdId=${jd.id}`}
                                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Use This JD
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Delete Modal */}
            {deleteModal.show && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
                    onClick={cancelDelete}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full transform transition-all animate-slideUp overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="pt-8 pb-6 px-8 text-center">
                            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Resume?</h3>
                            <p className="text-slate-500 text-sm">
                                <span className="font-medium text-slate-700">{deleteModal.resumeTitle}</span>
                                <br />will be permanently deleted.
                            </p>
                        </div>
                        <div className="flex border-t border-slate-100">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 py-4 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <div className="w-px bg-slate-100"></div>
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
