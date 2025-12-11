'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { authService } from '@/lib/services/auth';
import { toast } from 'react-hot-toast';
import {
    ApplicationService,
    Application,
    ApplicationStatus,
    APPLICATION_STATUSES,
    getStatusConfig,
    SearchOptions,
} from '@/lib/services/applicationService';

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
function timeAgo(date: Date | any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return d.toLocaleDateString();
}

// ATS Score Ring Component
function ATSScoreRing({ score, size = 48 }: { score: number; size?: number }) {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (score: number) => {
        if (score >= 80) return { stroke: '#10b981', text: '#059669' };
        if (score >= 60) return { stroke: '#f59e0b', text: '#d97706' };
        return { stroke: '#ef4444', text: '#dc2626' };
    };

    const colors = getColor(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
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
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: colors.text }}>
                {score}%
            </span>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: ApplicationStatus }) {
    const config = getStatusConfig(status);
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<Application[]>([]);
    const [profileComplete, setProfileComplete] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        avgAts: 0,
        thisWeek: 0,
        applied: 0,
    });
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState<'all' | 'title' | 'company' | 'skills'>('all');
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'ats-high' | 'ats-low'>('newest');
    const [showFilters, setShowFilters] = useState(false);

    // Delete Modal
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; appId: string; appTitle: string }>({
        show: false,
        appId: '',
        appTitle: '',
    });

    // Status Update Modal
    const [statusModal, setStatusModal] = useState<{ show: boolean; appId: string; currentStatus: ApplicationStatus }>({
        show: false,
        appId: '',
        currentStatus: 'draft',
    });

    // JD View Modal
    const [jdModal, setJdModal] = useState<{ show: boolean; title: string; company: string; description: string }>({
        show: false,
        title: '',
        company: '',
        description: '',
    });

    // Resume Preview Modal
    const [resumeModal, setResumeModal] = useState<{
        show: boolean;
        loading: boolean;
        title: string;
        company: string;
        data: any;
    }>({
        show: false,
        loading: false,
        title: '',
        company: '',
        data: null,
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

    useEffect(() => {
        const handleClick = () => setShowUserMenu(false);
        if (showUserMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [showUserMenu]);

    // Reload when filters change
    useEffect(() => {
        if (user && !loading) {
            loadApplications();
        }
    }, [searchQuery, searchField, statusFilter, sortBy]);

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

        // First, migrate existing data
        try {
            const result = await ApplicationService.migrateUserData(user.uid);
            if (result.migrated > 0) {
                console.log(`Migrated ${result.migrated} items to applications`);
            }
        } catch (error) {
            console.error('Migration error:', error);
        }

        await loadApplications();
        setLoading(false);
    };

    const loadApplications = async () => {
        if (!user) return;

        try {
            // Try to get applications from new collection
            let apps = await ApplicationService.getApplications(user.uid, {
                status: statusFilter,
                searchField,
                searchQuery,
                sortBy,
            });

            // If no applications found, load legacy resumes directly
            if (apps.length === 0) {
                console.log('[Dashboard] No applications found, loading legacy resumes...');

                // Load from resumes collection directly
                const resumesQuery = query(
                    collection(db, 'resumes'),
                    where('userId', '==', user.uid)
                );
                const resumesSnapshot = await getDocs(resumesQuery);

                const legacyApps: Application[] = resumesSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        userId: user.uid,
                        jobTitle: data.jobTitle || 'Untitled',
                        jobCompany: data.jobCompany || data.company || '',
                        jobDescription: data.jobDescription || '',
                        hasResume: true,
                        resumeId: doc.id,
                        status: 'generated' as ApplicationStatus,
                        atsScore: data.atsScore?.total,
                        version: 1,
                        createdAt: data.createdAt,
                        generatedAt: data.createdAt,
                        updatedAt: data.updatedAt || data.createdAt,
                    };
                });

                // Also load jobs as draft applications
                const jobsQuery = query(
                    collection(db, 'jobs'),
                    where('userId', '==', user.uid)
                );
                const jobsSnapshot = await getDocs(jobsQuery);

                const jobApps: Application[] = jobsSnapshot.docs
                    .filter(doc => !legacyApps.some(app => app.jobTitle === doc.data().parsedData?.title))
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            userId: user.uid,
                            jobId: doc.id,
                            jobTitle: data.parsedData?.title || 'Untitled',
                            jobCompany: data.parsedData?.company || '',
                            jobDescription: data.originalDescription || '',
                            hasResume: false,
                            status: 'draft' as ApplicationStatus,
                            version: 1,
                            createdAt: data.createdAt,
                            analyzedAt: data.createdAt,
                            updatedAt: data.createdAt,
                        };
                    });

                apps = [...legacyApps, ...jobApps].sort((a, b) => {
                    const dateA = a.createdAt?.toMillis?.() || 0;
                    const dateB = b.createdAt?.toMillis?.() || 0;
                    return dateB - dateA;
                });

                console.log(`[Dashboard] Loaded ${legacyApps.length} resumes + ${jobApps.length} jobs`);
            }

            setApplications(apps);

            // Calculate stats
            const total = apps.length;
            const withScore = apps.filter(a => a.atsScore);
            const avgAts = withScore.length > 0
                ? Math.round(withScore.reduce((sum, a) => sum + (a.atsScore || 0), 0) / withScore.length)
                : 0;

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const thisWeek = apps.filter(a => {
                if (!a.createdAt) return false;
                const created = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any);
                return created > oneWeekAgo;
            }).length;

            const applied = apps.filter(a => ['applied', 'interview', 'offer'].includes(a.status)).length;

            setStats({ total, avgAts, thisWeek, applied });

        } catch (error) {
            console.error('Error loading applications:', error);
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

    const handleDelete = async () => {
        try {
            await ApplicationService.delete(deleteModal.appId);
            toast.success('Application deleted!');
            setDeleteModal({ show: false, appId: '', appTitle: '' });
            loadApplications();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleStatusChange = async (newStatus: ApplicationStatus) => {
        try {
            await ApplicationService.updateStatus(statusModal.appId, newStatus);
            toast.success(`Status updated to ${newStatus}!`);
            setStatusModal({ show: false, appId: '', currentStatus: 'draft' });
            loadApplications();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const loadResumePreview = async (app: Application) => {
        setResumeModal({
            show: true,
            loading: true,
            title: app.jobTitle,
            company: app.jobCompany || '',
            data: null,
        });

        try {
            // Try to get from application's embedded resume first
            if (app.resume) {
                setResumeModal(prev => ({ ...prev, loading: false, data: app.resume }));
                return;
            }

            // Otherwise fetch from resumes collection
            const resumeId = app.resumeId || app.id;
            const resumeDoc = await getDoc(doc(db, 'resumes', resumeId));

            if (resumeDoc.exists()) {
                const data = resumeDoc.data();
                setResumeModal(prev => ({
                    ...prev,
                    loading: false,
                    data: {
                        personalInfo: data.personalInfo,
                        professionalSummary: data.professionalSummary,
                        technicalSkills: data.technicalSkills,
                        experience: data.experience || [],
                        education: data.education || [],
                    },
                }));
            } else {
                setResumeModal(prev => ({ ...prev, loading: false, data: null }));
                toast.error('Resume data not found');
            }
        } catch (error) {
            console.error('Error loading resume:', error);
            setResumeModal(prev => ({ ...prev, loading: false }));
            toast.error('Failed to load resume');
        }
    };

    const loadJobDescription = async (app: Application) => {
        // If we already have the JD, show it directly
        if (app.jobDescription) {
            setJdModal({
                show: true,
                title: app.jobTitle,
                company: app.jobCompany || '',
                description: app.jobDescription,
            });
            return;
        }

        // Otherwise try to fetch it
        toast.loading('Loading job description...', { id: 'loadjd' });

        try {
            // First try the resumes collection
            const resumeId = app.resumeId || app.id;
            const resumeDoc = await getDoc(doc(db, 'resumes', resumeId));

            if (resumeDoc.exists() && resumeDoc.data().jobDescription) {
                toast.dismiss('loadjd');
                setJdModal({
                    show: true,
                    title: app.jobTitle,
                    company: app.jobCompany || '',
                    description: resumeDoc.data().jobDescription,
                });
                return;
            }

            // Try the jobs collection by matching title
            const jobsQuery = query(
                collection(db, 'jobs'),
                where('userId', '==', user?.uid),
            );
            const jobsSnapshot = await getDocs(jobsQuery);

            for (const jobDoc of jobsSnapshot.docs) {
                const jobData = jobDoc.data();
                if (jobData.parsedData?.title === app.jobTitle ||
                    jobData.parsedData?.company === app.jobCompany) {
                    toast.dismiss('loadjd');
                    setJdModal({
                        show: true,
                        title: app.jobTitle,
                        company: app.jobCompany || '',
                        description: jobData.originalDescription || 'No job description available.',
                    });
                    return;
                }
            }

            // No JD found
            toast.dismiss('loadjd');
            setJdModal({
                show: true,
                title: app.jobTitle,
                company: app.jobCompany || '',
                description: 'Job description not found in database. New resumes will store the JD automatically.',
            });

        } catch (error) {
            console.error('Error loading JD:', error);
            toast.error('Failed to load job description', { id: 'loadjd' });
            setJdModal({
                show: true,
                title: app.jobTitle,
                company: app.jobCompany || '',
                description: 'Error loading job description.',
            });
        }
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

                        <nav className="hidden md:flex items-center gap-1">
                            <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">Dashboard</Link>
                            <Link href="/generate" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">Generate</Link>
                            <Link href="/profile" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">Profile</Link>
                        </nav>

                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
                                    {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]}
                                </span>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fadeIn">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-sm font-medium text-slate-900">{user?.displayName || 'User'}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Edit Profile
                                    </Link>
                                    <div className="border-t border-slate-100 mt-2 pt-2">
                                        <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome + New Button */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">{greeting()}</p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            {user?.displayName?.split(' ')[0] || 'Welcome back'}! 👋
                        </h1>
                        <p className="text-slate-600 mt-1">Track and manage your job applications</p>
                    </div>
                    <Link
                        href="/generate"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Application
                    </Link>
                </div>

                {/* Profile Completion Banner */}
                {!profileComplete && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-900">Complete Your Profile</h3>
                            <p className="text-sm text-amber-700">Add your experience for better AI-generated resumes.</p>
                        </div>
                        <Link href="/profile" className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 text-sm">
                            Complete Now
                        </Link>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900"><AnimatedCounter value={stats.total} /></p>
                        <p className="text-xs text-slate-500">Applications</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Avg</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900"><AnimatedCounter value={stats.avgAts} />%</p>
                        <p className="text-xs text-slate-500">ATS Score</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">7d</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900"><AnimatedCounter value={stats.thisWeek} /></p>
                        <p className="text-xs text-slate-500">This Week</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900"><AnimatedCounter value={stats.applied} /></p>
                        <p className="text-xs text-slate-500">Applied</p>
                    </div>
                </div>

                {/* Applications Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header with Search */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-slate-900">Your Applications</h2>
                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                    {applications.length}
                                </span>
                            </div>

                            {/* Search Bar */}
                            <div className="flex items-center gap-2 flex-1 max-w-xl">
                                <div className="relative flex-1">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search applications..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <select
                                    value={searchField}
                                    onChange={(e) => setSearchField(e.target.value as any)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Fields</option>
                                    <option value="title">Job Title</option>
                                    <option value="company">Company</option>
                                    <option value="skills">Skills</option>
                                </select>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2 border rounded-lg transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                All
                            </button>
                            {APPLICATION_STATUSES.map(s => (
                                <button
                                    key={s.value}
                                    onClick={() => setStatusFilter(s.value)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 ${statusFilter === s.value ? `${s.bgColor} ${s.color}` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <span>{s.icon}</span> {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown (shown when filters open) */}
                        {showFilters && (
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                                <span className="text-sm text-slate-500">Sort by:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="ats-high">ATS Score (High to Low)</option>
                                    <option value="ats-low">ATS Score (Low to High)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Applications List */}
                    <div className="p-6">
                        {applications.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                    {searchQuery || statusFilter !== 'all' ? 'No matches found' : 'No applications yet'}
                                </h3>
                                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                                    {searchQuery || statusFilter !== 'all'
                                        ? 'Try adjusting your search or filters'
                                        : 'Create your first AI-optimized resume!'}
                                </p>
                                {!searchQuery && statusFilter === 'all' && (
                                    <Link href="/generate" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Application
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {applications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="group relative bg-slate-50/50 rounded-xl p-5 border border-slate-100 hover:bg-white hover:shadow-lg hover:border-slate-200 transition-all duration-300"
                                    >
                                        {/* Delete Button */}
                                        <button
                                            onClick={() => setDeleteModal({ show: true, appId: app.id, appTitle: app.jobTitle })}
                                            className="absolute top-3 right-3 p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>

                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3 pr-8">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 truncate mb-1">{app.jobTitle}</h3>
                                                <p className="text-sm text-slate-500 truncate">{app.jobCompany || 'No company'}</p>
                                            </div>
                                            {app.atsScore && <ATSScoreRing score={app.atsScore} size={44} />}
                                        </div>

                                        {/* Status Badge (clickable) */}
                                        <button
                                            onClick={() => setStatusModal({ show: true, appId: app.id, currentStatus: app.status })}
                                            className="mb-3 hover:opacity-80 transition-opacity"
                                        >
                                            <StatusBadge status={app.status} />
                                        </button>

                                        {/* Time */}
                                        <p className="text-xs text-slate-400 mb-4">
                                            {app.hasResume ? `Generated ${timeAgo(app.generatedAt)}` : `Analyzed ${timeAgo(app.analyzedAt)}`}
                                            {app.version > 1 && <span className="ml-1 text-slate-300">• v{app.version}</span>}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {app.hasResume ? (
                                                <Link
                                                    href={`/editor/${app.resumeId || app.id}`}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={`/generate?appId=${app.id}`}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Generate
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => loadJobDescription(app)}
                                                className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                                title="View Job Description"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </button>
                                            {app.hasResume && (
                                                <button
                                                    onClick={() => loadResumePreview(app)}
                                                    className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                                                    title="Preview Generated Resume"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" title="Download">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteModal({ show: false, appId: '', appTitle: '' })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="pt-8 pb-6 px-8 text-center">
                            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Application?</h3>
                            <p className="text-slate-500 text-sm">
                                <span className="font-medium text-slate-700">{deleteModal.appTitle}</span><br />will be permanently deleted.
                            </p>
                        </div>
                        <div className="flex border-t border-slate-100">
                            <button onClick={() => setDeleteModal({ show: false, appId: '', appTitle: '' })} className="flex-1 py-4 text-slate-600 font-semibold hover:bg-slate-50">Cancel</button>
                            <div className="w-px bg-slate-100"></div>
                            <button onClick={handleDelete} className="flex-1 py-4 text-red-600 font-semibold hover:bg-red-50">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {statusModal.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setStatusModal({ show: false, appId: '', currentStatus: 'draft' })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="pt-6 pb-4 px-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Update Status</h3>
                            <div className="space-y-2">
                                {APPLICATION_STATUSES.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => handleStatusChange(s.value)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${statusModal.currentStatus === s.value ? `${s.bgColor} ${s.color}` : 'hover:bg-slate-50'}`}
                                    >
                                        <span className="text-xl">{s.icon}</span>
                                        <span className="font-medium">{s.label}</span>
                                        {statusModal.currentStatus === s.value && (
                                            <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setStatusModal({ show: false, appId: '', currentStatus: 'draft' })} className="w-full py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* JD View Modal */}
            {jdModal.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setJdModal({ show: false, title: '', company: '', description: '' })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{jdModal.title}</h3>
                                {jdModal.company && <p className="text-sm text-slate-500">{jdModal.company}</p>}
                            </div>
                            <button
                                onClick={() => setJdModal({ show: false, title: '', company: '', description: '' })}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto flex-1">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Job Description
                                </h4>
                                <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                                    {jdModal.description}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100">
                            <button
                                onClick={() => setJdModal({ show: false, title: '', company: '', description: '' })}
                                className="w-full py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resume Preview Modal */}
            {resumeModal.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setResumeModal({ show: false, loading: false, title: '', company: '', data: null })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Generated Resume</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{resumeModal.title}</h3>
                                {resumeModal.company && <p className="text-sm text-slate-500">{resumeModal.company}</p>}
                            </div>
                            <button
                                onClick={() => setResumeModal({ show: false, loading: false, title: '', company: '', data: null })}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto flex-1">
                            {resumeModal.loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                                </div>
                            ) : resumeModal.data ? (
                                <div className="space-y-6">
                                    {/* Professional Summary */}
                                    {resumeModal.data.professionalSummary && (
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                                            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Professional Summary
                                            </h4>
                                            <p className="text-sm text-slate-700 leading-relaxed">{resumeModal.data.professionalSummary}</p>
                                        </div>
                                    )}

                                    {/* Technical Skills */}
                                    {resumeModal.data.technicalSkills && (
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                                Technical Skills
                                            </h4>
                                            <div className="space-y-2">
                                                {typeof resumeModal.data.technicalSkills === 'object' ? (
                                                    Object.entries(resumeModal.data.technicalSkills).map(([category, skills]) => (
                                                        <div key={category}>
                                                            <span className="text-xs font-medium text-slate-500 uppercase">{category}:</span>
                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                {(Array.isArray(skills) ? skills : [skills]).map((skill: string, i: number) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-white text-slate-700 text-xs rounded-md border border-slate-200">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-slate-600">{resumeModal.data.technicalSkills}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Experience */}
                                    {resumeModal.data.experience?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Experience
                                            </h4>
                                            <div className="space-y-4">
                                                {resumeModal.data.experience.slice(0, 3).map((exp: any, i: number) => (
                                                    <div key={i} className="bg-slate-50 rounded-xl p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h5 className="font-medium text-slate-900">{exp.title}</h5>
                                                                <p className="text-sm text-slate-500">{exp.company}</p>
                                                            </div>
                                                            <span className="text-xs text-slate-400">{exp.startDate} - {exp.endDate || 'Present'}</span>
                                                        </div>
                                                        {exp.achievements && (
                                                            <ul className="text-sm text-slate-600 space-y-1">
                                                                {(Array.isArray(exp.achievements) ? exp.achievements : [exp.achievements]).slice(0, 3).map((ach: string, j: number) => (
                                                                    <li key={j} className="flex items-start gap-2">
                                                                        <span className="text-emerald-500 mt-1">•</span>
                                                                        <span>{ach}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">Resume data not available</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setResumeModal({ show: false, loading: false, title: '', company: '', data: null })}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                            <Link
                                href={`/editor/${resumeModal.data?.resumeId || ''}`}
                                className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-center"
                            >
                                Open in Editor
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
