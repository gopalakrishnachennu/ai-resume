/**
 * Firebase Configuration for JobFiller Pro Extension
 * Reads active session directly from Firestore
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// Firebase config - MUST match your webapp's config
const firebaseConfig = {
    apiKey: "AIzaSyANSk1PwPkMabX6kRGOYnldoeEC8VvtB5Q",
    authDomain: "ai-resume-f9b01.firebaseapp.com",
    projectId: "ai-resume-f9b01",
    storageBucket: "ai-resume-f9b01.firebasestorage.app",
    messagingSenderId: "836466410766",
    appId: "1:836466410766:web:146188f9d00106ea1d835f"
};

// Initialize Firebase once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

// Types
export interface ActiveSession {
    userId: string;
    jobTitle: string;
    jobCompany: string;
    jobUrl: string;
    personalInfo: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        github?: string;
    };
    professionalSummary?: string;
    experience?: any[];
    education?: any[];
    skills?: {
        all?: string;
        [key: string]: any;
    };
    extensionSettings?: Record<string, string>;
    createdAt?: any;
    updatedAt?: any;
}

/**
 * Get active session from Firebase
 */
export async function getActiveSession(userId: string): Promise<ActiveSession | null> {
    try {
        const sessionDoc = await getDoc(doc(db, 'users', userId, 'sessions', 'active'));
        if (sessionDoc.exists()) {
            return sessionDoc.data() as ActiveSession;
        }
        return null;
    } catch (error) {
        console.error('[Firebase] Failed to get active session:', error);
        return null;
    }
}

/**
 * Get user profile extension settings
 */
export async function getUserProfile(userId: string): Promise<any | null> {
    try {
        const profileDoc = await getDoc(doc(db, 'users', userId, 'settings', 'extension'));
        if (profileDoc.exists()) {
            return profileDoc.data();
        }
        return null;
    } catch (error) {
        console.error('[Firebase] Failed to get user profile:', error);
        return null;
    }
}

/**
 * Listen to active session changes (real-time)
 */
export function listenToActiveSession(
    userId: string,
    callback: (session: ActiveSession | null) => void
): () => void {
    const unsubscribe = onSnapshot(
        doc(db, 'users', userId, 'sessions', 'active'),
        (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data() as ActiveSession);
            } else {
                callback(null);
            }
        },
        (error) => {
            console.error('[Firebase] Session listener error:', error);
            callback(null);
        }
    );
    return unsubscribe;
}

export default app;
