'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
    initializeGuestUser,
    upgradeGuestToEmailAccount,
    upgradeGuestToGoogleAccount,
    checkUsageLimits,
    incrementUsage,
    checkAndResetUsage,
    getGuestRestrictions,
    getGlobalSettings,
} from '@/lib/services/guestService';
import { APP_CONFIG } from '@/lib/config/appConfig';

export function useGuestAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [usageLimits, setUsageLimits] = useState<{
        canUse: boolean;
        limitType?: string;
        current?: number;
        max?: number;
        resumeUsage?: number;
        resumeLimit?: number;
    }>({ canUse: true });
    const [restrictions, setRestrictions] = useState({
        canDownloadPDF: true,
        canDownloadDOCX: true,
        canSaveResumes: true,
        canEditResumes: true,
        canViewHistory: true,
        canUseAI: true,
    });

    useEffect(() => {
        // Listen to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Check and reset usage if needed
                await checkAndResetUsage(firebaseUser);

                // Check usage limits
                const limits = await checkUsageLimits(firebaseUser);
                setUsageLimits(limits);

                // Check restrictions
                const perms = await getGuestRestrictions(firebaseUser);
                setRestrictions(perms);
            } else {
                // Check dynamic settings before auto-login
                const settings = await getGlobalSettings();
                const guestConfig = settings?.guest || APP_CONFIG.guest;

                if (guestConfig.enabled && !APP_CONFIG.auth.requireLogin) {
                    // Auto sign-in as guest
                    try {
                        const guestUser = await initializeGuestUser();
                        setUser(guestUser);
                    } catch (error) {
                        console.error('Failed to initialize guest user:', error);
                    }
                }
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const trackUsage = async (type: keyof typeof APP_CONFIG.guest.limits) => {
        if (!user) return;

        await incrementUsage(user, type);

        // Refresh limits
        const limits = await checkUsageLimits(user);
        setUsageLimits(limits);
    };

    const upgradeToEmail = async (email: string, password: string) => {
        if (!user) throw new Error('No user to upgrade');

        const upgradedUser = await upgradeGuestToEmailAccount(email, password);
        setUser(upgradedUser);

        // Refresh limits (now unlimited)
        setUsageLimits({ canUse: true });
    };

    const upgradeToGoogle = async () => {
        if (!user) throw new Error('No user to upgrade');

        const upgradedUser = await upgradeGuestToGoogleAccount();
        setUser(upgradedUser);

        // Refresh limits (now unlimited)
        setUsageLimits({ canUse: true });
    };

    return {
        user,
        loading,
        isGuest: user?.isAnonymous || false,
        isLoggedIn: user && !user.isAnonymous,
        usageLimits,
        upgradeToEmail,
        upgradeToGoogle,
        checkLimit: (type: any) => user ? checkUsageLimits(user, type) : Promise.resolve({ canUse: false, current: 0, max: 0 }),
        incrementUsage: (type: any) => user && incrementUsage(user, type),
        restrictions,
    };
}
