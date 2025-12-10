'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useGuestAuth } from '@/lib/hooks/useGuestAuth';
import { UsageCounter } from '@/components/guest/UpgradePrompt';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Initialize auth state listener
        useAuthStore.getState().initialize();
        setMounted(true);
    }, []);

    // Initialize guest auth (auto sign-in if not authenticated)
    const { isGuest } = useGuestAuth();

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <>
            {children}
            {/* Show usage counter for guest users */}
            {isGuest && <UsageCounter />}
        </>
    );
}
