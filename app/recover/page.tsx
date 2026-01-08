'use client';

/**
 * Admin: Data Recovery Tool
 * 
 * This page helps recover user data lost due to UID changes after Chrome reinstall.
 * It searches for orphaned data and migrates it to the current user's UID.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    writeBatch,
    serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface OrphanedData {
    collection: string;
    docId: string;
    userId: string;
    email?: string;
    title?: string;
    createdAt?: any;
}

export default function RecoverDataPage() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [orphanedData, setOrphanedData] = useState<OrphanedData[]>([]);
    const [oldUids, setOldUids] = useState<string[]>([]);
    const [migrating, setMigrating] = useState(false);
    const [stats, setStats] = useState({ usersScanned: 0, resumesFound: 0, applicationsFound: 0 });

    useEffect(() => {
        useAuthStore.getState().initialize();
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
        }
    }, [user, authLoading]);

    // Scan for old UIDs with matching email
    const scanForOldUids = async () => {
        if (!user?.email) {
            toast.error('No email found for current user');
            return;
        }

        setScanning(true);
        setOrphanedData([]);
        setOldUids([]);

        try {
            const email = user.email.toLowerCase();
            console.log('[Recovery] Searching for old UIDs with email:', email);

            // Method 1: Search users collection for matching email
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);

            const matchingUids: string[] = [];
            let usersScanned = 0;

            for (const userDoc of usersSnapshot.docs) {
                usersScanned++;
                const userData = userDoc.data();
                const userEmail = (userData.email || '').toLowerCase();

                // Check if email matches but UID is different
                if (userEmail === email && userDoc.id !== user.uid) {
                    matchingUids.push(userDoc.id);
                    console.log('[Recovery] Found old UID:', userDoc.id);
                }
            }

            setStats(prev => ({ ...prev, usersScanned }));

            if (matchingUids.length === 0) {
                toast('No old UIDs found with your email. Scanning all resumes...', { icon: '🔍' });
            } else {
                setOldUids(matchingUids);
                toast.success(`Found ${matchingUids.length} old UID(s) with your email!`);
            }

            // Method 2: Search resumes collection for any data not under current UID
            // This catches cases where emails weren't stored
            const orphaned: OrphanedData[] = [];

            // Search resumes
            const resumesRef = collection(db, 'resumes');
            const resumesSnapshot = await getDocs(resumesRef);
            let resumesFound = 0;

            for (const resumeDoc of resumesSnapshot.docs) {
                const data = resumeDoc.data();
                const resumeEmail = (data.personalInfo?.email || data.email || '').toLowerCase();

                // Check if this resume belongs to the user but under different UID
                if (
                    data.userId !== user.uid &&
                    (
                        matchingUids.includes(data.userId) ||
                        resumeEmail === email
                    )
                ) {
                    orphaned.push({
                        collection: 'resumes',
                        docId: resumeDoc.id,
                        userId: data.userId,
                        email: resumeEmail,
                        title: data.jobTitle || 'Untitled Resume',
                        createdAt: data.createdAt,
                    });
                    resumesFound++;
                }
            }

            // Search applications
            const appsRef = collection(db, 'applications');
            const appsSnapshot = await getDocs(appsRef);
            let applicationsFound = 0;

            for (const appDoc of appsSnapshot.docs) {
                const data = appDoc.data();
                const appEmail = (data.resume?.personalInfo?.email || '').toLowerCase();

                if (
                    data.userId !== user.uid &&
                    (
                        matchingUids.includes(data.userId) ||
                        appEmail === email
                    )
                ) {
                    orphaned.push({
                        collection: 'applications',
                        docId: appDoc.id,
                        userId: data.userId,
                        email: appEmail,
                        title: data.jobTitle || 'Untitled Application',
                        createdAt: data.createdAt,
                    });
                    applicationsFound++;
                }
            }

            setStats({ usersScanned, resumesFound, applicationsFound });
            setOrphanedData(orphaned);

            if (orphaned.length > 0) {
                toast.success(`Found ${orphaned.length} recoverable item(s)!`);
            } else {
                toast('No orphaned data found for your email', { icon: '😕' });
            }

        } catch (error) {
            console.error('[Recovery] Scan error:', error);
            toast.error('Scan failed: ' + (error as Error).message);
        } finally {
            setScanning(false);
        }
    };

    // Migrate orphaned data to current UID
    const migrateData = async () => {
        if (orphanedData.length === 0) {
            toast.error('No data to migrate');
            return;
        }

        setMigrating(true);

        try {
            const batch = writeBatch(db);
            let count = 0;

            for (const item of orphanedData) {
                const docRef = doc(db, item.collection, item.docId);
                batch.update(docRef, {
                    userId: user!.uid,
                    _migratedFrom: item.userId,
                    _migratedAt: serverTimestamp(),
                    _recoveredViaAdminTool: true,
                });
                count++;
            }

            await batch.commit();

            toast.success(`Successfully migrated ${count} item(s) to your account!`);
            setOrphanedData([]);

            // Redirect to dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (error) {
            console.error('[Recovery] Migration error:', error);
            toast.error('Migration failed: ' + (error as Error).message);
        } finally {
            setMigrating(false);
        }
    };

    // Also migrate old user document data
    const migrateUserData = async () => {
        if (oldUids.length === 0) {
            toast.error('No old UIDs to migrate from');
            return;
        }

        setMigrating(true);

        try {
            for (const oldUid of oldUids) {
                const oldUserRef = doc(db, 'users', oldUid);
                const oldUserDoc = await getDoc(oldUserRef);

                if (oldUserDoc.exists()) {
                    const oldData = oldUserDoc.data();
                    const newUserRef = doc(db, 'users', user!.uid);
                    const newUserDoc = await getDoc(newUserRef);

                    if (newUserDoc.exists()) {
                        const newData = newUserDoc.data();
                        // Merge old data where new is missing
                        await updateDoc(newUserRef, {
                            profile: newData.profile || oldData.profile,
                            baseExperience: newData.baseExperience?.length ? newData.baseExperience : oldData.baseExperience,
                            baseEducation: newData.baseEducation?.length ? newData.baseEducation : oldData.baseEducation,
                            baseSummary: newData.baseSummary || oldData.baseSummary,
                            skills: newData.skills || oldData.skills,
                            _mergedFromOldUid: oldUid,
                            _mergedAt: serverTimestamp(),
                        });
                        console.log('[Recovery] Merged user data from:', oldUid);
                    }
                }
            }

            toast.success('User profile data merged!');
        } catch (error) {
            console.error('[Recovery] User data merge error:', error);
            toast.error('User data merge failed');
        } finally {
            setMigrating(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">🔄 Data Recovery Tool</h1>
                    <p className="text-gray-600 mb-6">
                        Recover your resumes after Chrome reinstall or UID change.
                    </p>

                    {/* Current User Info */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <h2 className="font-semibold text-blue-800 mb-2">Current Account</h2>
                        <p className="text-sm text-blue-700">Email: <strong>{user.email}</strong></p>
                        <p className="text-sm text-blue-700">UID: <code className="bg-blue-100 px-1 rounded">{user.uid}</code></p>
                    </div>

                    {/* Step 1: Scan */}
                    <div className="border rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Step 1: Scan for Lost Data</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            This will search for resumes and applications that belong to your email but are under a different UID.
                        </p>
                        <button
                            onClick={scanForOldUids}
                            disabled={scanning}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {scanning ? 'Scanning...' : '🔍 Scan for Lost Data'}
                        </button>

                        {stats.usersScanned > 0 && (
                            <div className="mt-4 text-sm text-gray-600">
                                <p>Users scanned: {stats.usersScanned}</p>
                                <p>Resumes found: {stats.resumesFound}</p>
                                <p>Applications found: {stats.applicationsFound}</p>
                            </div>
                        )}
                    </div>

                    {/* Old UIDs Found */}
                    {oldUids.length > 0 && (
                        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Old UIDs Found</h3>
                            <ul className="text-sm text-yellow-700 mb-4">
                                {oldUids.map(uid => (
                                    <li key={uid}><code className="bg-yellow-100 px-1 rounded">{uid}</code></li>
                                ))}
                            </ul>
                            <button
                                onClick={migrateUserData}
                                disabled={migrating}
                                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                            >
                                {migrating ? 'Merging...' : 'Merge User Profile Data'}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Review & Migrate */}
                    {orphanedData.length > 0 && (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-green-800 mb-2">Step 2: Review & Recover</h3>
                            <p className="text-sm text-green-700 mb-4">
                                Found {orphanedData.length} item(s) that can be recovered:
                            </p>

                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                {orphanedData.map((item, idx) => (
                                    <div key={idx} className="bg-white border rounded p-3 text-sm">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-gray-500">
                                            {item.collection} • {item.userId.slice(0, 8)}...
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={migrateData}
                                disabled={migrating}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {migrating ? 'Migrating...' : '✅ Recover All Data'}
                            </button>
                        </div>
                    )}

                    {/* No Data Found */}
                    {!scanning && stats.usersScanned > 0 && orphanedData.length === 0 && oldUids.length === 0 && (
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-gray-600">
                                😕 No orphaned data found for <strong>{user.email}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                This could mean your data was never saved, or it's stored under a completely different email.
                            </p>
                        </div>
                    )}

                    {/* Back to Dashboard */}
                    <div className="mt-6 pt-4 border-t">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
