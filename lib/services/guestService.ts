/**
 * Guest User Service
 * 
 * Handles anonymous authentication and automatic user creation
 * Allows guests to use the app without signing up
 */

import { auth, db } from '@/lib/firebase';
import {
    signInAnonymously,
    linkWithCredential,
    EmailAuthProvider,
    GoogleAuthProvider,
    signInWithPopup,
    User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { APP_CONFIG } from '@/lib/config/appConfig';
import { GuestCacheService } from './guestCacheService';

/**
 * Initialize guest user
 * Auto sign-in anonymously if not authenticated
 */
export async function initializeGuestUser(): Promise<User> {
    try {
        // Check if user is already signed in
        if (auth.currentUser) {
            return auth.currentUser;
        }

        // Sign in anonymously
        const result = await signInAnonymously(auth);
        const user = result.user;

        // Create user document in Firestore
        await createGuestUserDocument(user);

        console.log('✅ Guest user initialized:', user.uid);
        return user;
    } catch (error) {
        console.error('❌ Error initializing guest user:', error);
        throw error;
    }
}

/**
 * Create initial user document for guest
 */
async function createGuestUserDocument(user: User) {
    const userRef = doc(db, 'users', user.uid);

    // Check if document already exists
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
        return; // Already created
    }

    // Create new user document
    await setDoc(userRef, {
        uid: user.uid,
        isAnonymous: true,
        createdAt: serverTimestamp(),
        usage: {
            resumeGenerations: 0,
            jdAnalyses: 0,
            aiSuggestions: 0,
            pdfDownloads: 0,
            docxDownloads: 0,
            resumeEdits: 0,
            lastReset: serverTimestamp(),
        },
        profile: null,
        apiKeys: null,
    });
}

/**
 * Upgrade guest to full account with email/password
 */
export async function upgradeGuestToEmailAccount(
    email: string,
    password: string
): Promise<User> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('No user signed in');
    }

    if (!user.isAnonymous) {
        throw new Error('User is already a full account');
    }

    try {
        // Create email credential
        const credential = EmailAuthProvider.credential(email, password);

        // Link anonymous account to email/password
        const result = await linkWithCredential(user, credential);

        // Update user document
        await updateDoc(doc(db, 'users', user.uid), {
            isAnonymous: false,
            email: email,
            upgradedAt: serverTimestamp(),
            upgradeMethod: 'email',
        });

        // Clear guest cache (now use Firebase only)
        GuestCacheService.clearAll();

        console.log('✅ Guest upgraded to email account');
        return result.user;
    } catch (error: any) {
        // Handle specific errors
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already in use');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak');
        }
        throw error;
    }
}

/**
 * Upgrade guest to full account with Google
 */
export async function upgradeGuestToGoogleAccount(): Promise<User> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('No user signed in');
    }

    if (!user.isAnonymous) {
        throw new Error('User is already a full account');
    }

    try {
        const provider = new GoogleAuthProvider();

        // Link anonymous account to Google
        const result = await linkWithCredential(
            user,
            GoogleAuthProvider.credential(
                (await signInWithPopup(auth, provider)).user.uid
            )
        );

        // Update user document
        await updateDoc(doc(db, 'users', user.uid), {
            isAnonymous: false,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            upgradedAt: serverTimestamp(),
            upgradeMethod: 'google',
        });

        // Clear guest cache (now use Firebase only)
        GuestCacheService.clearAll();

        console.log('✅ Guest upgraded to Google account');
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use') {
            throw new Error('This Google account is already in use');
        }
        throw error;
    }
}

// Simple in-memory cache for global settings
let cachedGlobalSettings: any = null;
let lastFetchTime = 0;

export async function getGlobalSettings() {
    if (cachedGlobalSettings && Date.now() - lastFetchTime < 60000) { // 1 min cache
        return cachedGlobalSettings;
    }
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
            cachedGlobalSettings = settingsDoc.data();
            lastFetchTime = Date.now();
            return cachedGlobalSettings;
        }
    } catch (e) {
        console.error('Failed to fetch global settings:', e);
    }
    return null;
}

/**
 * Check if user has reached usage limits
 */
export async function checkUsageLimits(user: User, checkType?: string): Promise<{
    canUse: boolean;
    limitType?: string;
    current?: number;
    max?: number;
    resumeUsage?: number;
    resumeLimit?: number;
}> {
    // Fetch dynamic config
    const globalSettings = await getGlobalSettings();
    const guestConfig = globalSettings?.guest || APP_CONFIG.guest;

    // Logged-in users have unlimited access
    if (!user.isAnonymous || guestConfig.unlimited) {
        return { canUse: true };
    }

    // Get user document
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
        return { canUse: true };
    }

    const usage = userDoc.data().usage || {};
    const limits = guestConfig.limits;

    // Check each limit
    const checks = [
        { type: 'resumeGenerations', current: usage.resumeGenerations || 0, max: limits.resumeGenerations },
        { type: 'jdAnalyses', current: usage.jdAnalyses || 0, max: limits.jdAnalyses },
        { type: 'aiSuggestions', current: usage.aiSuggestions || 0, max: limits.aiSuggestions },
        { type: 'pdfDownloads', current: usage.pdfDownloads || 0, max: limits.pdfDownloads },
        { type: 'docxDownloads', current: usage.docxDownloads || 0, max: limits.docxDownloads },
        { type: 'resumeEdits', current: usage.resumeEdits || 0, max: limits.resumeEdits },
    ];

    const resumeStats = checks.find(c => c.type === 'resumeGenerations');

    // If checking a specific type
    if (checkType) {
        const check = checks.find(c => c.type === checkType);
        if (check && check.current >= check.max) {
            return {
                canUse: false,
                limitType: check.type,
                current: check.current,
                max: check.max,
                resumeUsage: resumeStats?.current || 0,
                resumeLimit: resumeStats?.max || 3,
            };
        }
        return {
            canUse: true,
            resumeUsage: resumeStats?.current || 0,
            resumeLimit: resumeStats?.max || 3,
        };
    }

    // Check all limits (default behavior)
    for (const check of checks) {
        if (check.current >= check.max) {
            return {
                canUse: false,
                limitType: check.type,
                current: check.current,
                max: check.max,
                resumeUsage: resumeStats?.current || 0,
                resumeLimit: resumeStats?.max || 3,
            };
        }
    }

    return {
        canUse: true,
        resumeUsage: resumeStats?.current || 0,
        resumeLimit: resumeStats?.max || 3,
    };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
    user: User,
    type: keyof typeof APP_CONFIG.guest.limits
) {
    if (!user.isAnonymous) {
        return; // Don't track for logged-in users
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        return;
    }

    const usage = userDoc.data().usage || {};
    const newCount = (usage[type] || 0) + 1;

    await updateDoc(userRef, {
        [`usage.${type}`]: newCount,
    });

    console.log(`📊 Usage updated: ${type} = ${newCount}`);
}

/**
 * Get all guest restrictions
 */
export async function getGuestRestrictions(user: User) {
    if (!user.isAnonymous) {
        // Return all true for logged in users
        return {
            canDownloadPDF: true,
            canDownloadDOCX: true,
            canSaveResumes: true,
            canEditResumes: true,
            canViewHistory: true,
            canUseAI: true,
        };
    }

    const globalSettings = await getGlobalSettings();
    const guestConfig = globalSettings?.guest || APP_CONFIG.guest;

    if (guestConfig.unlimited) {
        return {
            canDownloadPDF: true,
            canDownloadDOCX: true,
            canSaveResumes: true,
            canEditResumes: true,
            canViewHistory: true,
            canUseAI: true,
        };
    }

    return guestConfig.restrictions;
}

/**
 * Check if usage should be reset
 */
export async function checkAndResetUsage(user: User) {
    const globalSettings = await getGlobalSettings();
    const guestConfig = globalSettings?.guest || APP_CONFIG.guest;

    if (!user.isAnonymous || !guestConfig.expiry.enabled) {
        return;
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        return;
    }

    const usage = userDoc.data().usage;
    if (!usage || !usage.lastReset) {
        return;
    }

    const lastReset = usage.lastReset.toDate();
    const now = new Date();
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceReset >= guestConfig.expiry.days) {
        // Reset usage
        await updateDoc(userRef, {
            'usage.resumeGenerations': 0,
            'usage.jdAnalyses': 0,
            'usage.aiSuggestions': 0,
            'usage.pdfDownloads': 0,
            'usage.docxDownloads': 0,
            'usage.resumeEdits': 0,
            'usage.lastReset': serverTimestamp(),
        });

        console.log('🔄 Usage reset for guest user');
    }
}
