'use client';

/**
 * Admin: User Detail View
 * 
 * Shows complete user data including profile, resumes, applications, and activity.
 */

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import { useParams, useRouter } from 'next/navigation';
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';

interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAnonymous: boolean;
    createdAt: any;
    lastLoginAt: any;
    profile?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        location?: {
            city?: string;
            state?: string;
            country?: string;
        };
        linkedin?: string;
        github?: string;
        portfolio?: string;
    };
    baseExperience?: any[];
    baseEducation?: any[];
    baseSummary?: string;
    skills?: any;
    subscription?: {
        tier?: string;
        status?: string;
    };
    usage?: {
        resumesCreated?: number;
        resumesThisMonth?: number;
        aiGenerationsThisMonth?: number;
    };
    settings?: any;
}

interface ResumeData {
    id: string;
    jobTitle: string;
    jobCompany?: string;
    atsScore?: number;
    createdAt: any;
    status?: string;
}

interface ApplicationData {
    id: string;
    jobTitle: string;
    jobCompany?: string;
    status: string;
    atsScore?: number;
    createdAt: any;
    hasResume: boolean;
}

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const { isAuthenticated, isLoading, requireAuth } = useAdminAuth();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [resumes, setResumes] = useState<ResumeData[]>([]);
    const [applications, setApplications] = useState<ApplicationData[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'resumes' | 'applications' | 'profile' | 'raw'>('overview');
    const [rawData, setRawData] = useState<string>('');

    useEffect(() => {
        requireAuth();
    }, [isAuthenticated, isLoading]);

    useEffect(() => {
        if (isAuthenticated && userId) {
            loadUserData();
        }
    }, [isAuthenticated, userId]);

    const loadUserData = async () => {
        try {
            setLoading(true);

            // Load user document
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                toast.error('User not found');
                router.push('/admin/users');
                return;
            }

            const userData = userDoc.data();
            setUser({
                uid: userId,
                email: userData.email || null,
                displayName: userData.displayName || null,
                photoURL: userData.photoURL || null,
                isAnonymous: userData.isAnonymous || false,
                createdAt: userData.createdAt,
                lastLoginAt: userData.lastLoginAt,
                profile: userData.profile,
                baseExperience: userData.baseExperience,
                baseEducation: userData.baseEducation,
                baseSummary: userData.baseSummary,
                skills: userData.skills,
                subscription: userData.subscription,
                usage: userData.usage,
                settings: userData.settings,
            });
            setRawData(JSON.stringify(userData, null, 2));

            // Load resumes
            const resumesQuery = query(
                collection(db, 'resumes'),
                where('userId', '==', userId)
            );
            const resumesSnap = await getDocs(resumesQuery);
            const resumesData: ResumeData[] = resumesSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    jobTitle: data.jobTitle || 'Untitled',
                    jobCompany: data.jobCompany || data.company,
                    atsScore: typeof data.atsScore === 'number' ? data.atsScore : data.atsScore?.total,
                    createdAt: data.createdAt,
                    status: data.status,
                };
            });
            setResumes(resumesData.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            }));

            // Load applications
            const appsQuery = query(
                collection(db, 'applications'),
                where('userId', '==', userId)
            );
            const appsSnap = await getDocs(appsQuery);
            const appsData: ApplicationData[] = appsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    jobTitle: data.jobTitle || 'Untitled',
                    jobCompany: data.jobCompany,
                    status: data.status || 'draft',
                    atsScore: typeof data.atsScore === 'number' ? data.atsScore : data.atsScore?.total,
                    createdAt: data.createdAt,
                    hasResume: data.hasResume || !!data.resume,
                };
            });
            setApplications(appsData.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            }));

        } catch (error) {
            console.error('Error loading user data:', error);
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            generated: 'bg-blue-100 text-blue-800',
            applied: 'bg-green-100 text-green-800',
            interview: 'bg-purple-100 text-purple-800',
            offer: 'bg-yellow-100 text-yellow-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const migrateUserData = async (targetUid: string) => {
        if (!confirm(`Migrate all data from ${userId} to ${targetUid}?`)) return;

        try {
            toast.loading('Migrating data...', { id: 'migrate' });

            // Update resumes
            for (const resume of resumes) {
                await updateDoc(doc(db, 'resumes', resume.id), {
                    userId: targetUid,
                    _migratedFrom: userId,
                    _migratedAt: serverTimestamp(),
                });
            }

            // Update applications
            for (const app of applications) {
                await updateDoc(doc(db, 'applications', app.id), {
                    userId: targetUid,
                    _migratedFrom: userId,
                    _migratedAt: serverTimestamp(),
                });
            }

            toast.success(`Migrated ${resumes.length} resumes and ${applications.length} applications`, { id: 'migrate' });
            loadUserData();
        } catch (error) {
            console.error('Migration error:', error);
            toast.error('Migration failed', { id: 'migrate' });
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
            <Toaster position="top-right" />

            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/users" className="text-gray-600 hover:text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {user?.displayName || user?.email || 'Loading...'}
                                </h1>
                                <p className="text-sm text-gray-600 font-mono">{userId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadUserData}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                            >
                                🔄 Refresh
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
                ) : user ? (
                    <>
                        {/* User Summary Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0 h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{user.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Type</p>
                                        <p className="font-medium">
                                            {user.isAnonymous ? '🎭 Guest' : '✅ Registered'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Created</p>
                                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Last Login</p>
                                        <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Subscription</p>
                                        <p className="font-medium capitalize">{user.subscription?.tier || 'Free'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Resumes</p>
                                        <p className="font-medium text-blue-600">{resumes.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Applications</p>
                                        <p className="font-medium text-green-600">{applications.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">AI Generations</p>
                                        <p className="font-medium">{user.usage?.aiGenerationsThisMonth || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="border-b border-gray-200">
                                <nav className="flex">
                                    {(['overview', 'resumes', 'applications', 'profile', 'raw'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-4 text-sm font-medium capitalize ${activeTab === tab
                                                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {tab === 'raw' ? 'Raw JSON' : tab}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-6">
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <p className="text-sm text-blue-600 font-medium">Total Resumes</p>
                                                <p className="text-3xl font-bold text-blue-800">{resumes.length}</p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <p className="text-sm text-green-600 font-medium">Applications</p>
                                                <p className="text-3xl font-bold text-green-800">{applications.length}</p>
                                            </div>
                                            <div className="bg-purple-50 rounded-lg p-4">
                                                <p className="text-sm text-purple-600 font-medium">Avg ATS Score</p>
                                                <p className="text-3xl font-bold text-purple-800">
                                                    {resumes.length > 0
                                                        ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
                                                        : 0}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Recent Activity */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Recent Resumes</h3>
                                            <div className="space-y-2">
                                                {resumes.slice(0, 5).map(resume => (
                                                    <div key={resume.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                                        <div>
                                                            <p className="font-medium">{resume.jobTitle}</p>
                                                            <p className="text-sm text-gray-500">{resume.jobCompany || 'No company'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {resume.atsScore && (
                                                                <span className="text-sm font-semibold text-indigo-600">{resume.atsScore}%</span>
                                                            )}
                                                            <span className="text-xs text-gray-400">{formatDate(resume.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {resumes.length === 0 && (
                                                    <p className="text-gray-500 text-center py-4">No resumes found</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Admin Actions */}
                                        <div className="border-t pt-4">
                                            <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        const targetUid = prompt('Enter target UID to migrate data to:');
                                                        if (targetUid) migrateUserData(targetUid);
                                                    }}
                                                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
                                                >
                                                    🔄 Migrate Data to Another UID
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Resumes Tab */}
                                {activeTab === 'resumes' && (
                                    <div className="space-y-4">
                                        {resumes.map(resume => (
                                            <div key={resume.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-lg">{resume.jobTitle}</h4>
                                                        <p className="text-gray-600">{resume.jobCompany || 'No company'}</p>
                                                        <p className="text-sm text-gray-400 mt-1">ID: {resume.id}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        {resume.atsScore && (
                                                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${resume.atsScore >= 80 ? 'bg-green-100 text-green-800' :
                                                                    resume.atsScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}>
                                                                {resume.atsScore}% ATS
                                                            </div>
                                                        )}
                                                        <p className="text-sm text-gray-400 mt-2">{formatDate(resume.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {resumes.length === 0 && (
                                            <p className="text-gray-500 text-center py-8">No resumes found for this user</p>
                                        )}
                                    </div>
                                )}

                                {/* Applications Tab */}
                                {activeTab === 'applications' && (
                                    <div className="space-y-4">
                                        {applications.map(app => (
                                            <div key={app.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-lg">{app.jobTitle}</h4>
                                                        <p className="text-gray-600">{app.jobCompany || 'No company'}</p>
                                                        <p className="text-sm text-gray-400 mt-1">ID: {app.id}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(app.status)}`}>
                                                            {app.status}
                                                        </span>
                                                        <p className="text-sm text-gray-400 mt-2">{formatDate(app.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {applications.length === 0 && (
                                            <p className="text-gray-500 text-center py-8">No applications found for this user</p>
                                        )}
                                    </div>
                                )}

                                {/* Profile Tab */}
                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        {/* Personal Info */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                                            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">First Name</p>
                                                    <p className="font-medium">{user.profile?.firstName || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Last Name</p>
                                                    <p className="font-medium">{user.profile?.lastName || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Phone</p>
                                                    <p className="font-medium">{user.profile?.phone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Location</p>
                                                    <p className="font-medium">
                                                        {user.profile?.location
                                                            ? `${user.profile.location.city || ''}, ${user.profile.location.state || ''}`
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">LinkedIn</p>
                                                    <p className="font-medium text-blue-600">{user.profile?.linkedin || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">GitHub</p>
                                                    <p className="font-medium text-blue-600">{user.profile?.github || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Experience */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Experience ({user.baseExperience?.length || 0})</h3>
                                            <div className="space-y-3">
                                                {user.baseExperience?.map((exp: any, idx: number) => (
                                                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                                        <p className="font-semibold">{exp.title}</p>
                                                        <p className="text-gray-600">{exp.company}</p>
                                                        <p className="text-sm text-gray-400">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                                                    </div>
                                                )) || <p className="text-gray-500">No experience saved</p>}
                                            </div>
                                        </div>

                                        {/* Education */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Education ({user.baseEducation?.length || 0})</h3>
                                            <div className="space-y-3">
                                                {user.baseEducation?.map((edu: any, idx: number) => (
                                                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                                        <p className="font-semibold">{edu.degree}</p>
                                                        <p className="text-gray-600">{edu.school}</p>
                                                        <p className="text-sm text-gray-400">{edu.graduationYear}</p>
                                                    </div>
                                                )) || <p className="text-gray-500">No education saved</p>}
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        {user.skills && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Skills</h3>
                                                <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-auto">
                                                    {JSON.stringify(user.skills, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Raw JSON Tab */}
                                {activeTab === 'raw' && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Raw user document data from Firestore
                                        </p>
                                        <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-auto max-h-[600px]">
                                            {rawData}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">User not found</p>
                    </div>
                )}
            </main>
        </div>
    );
}
