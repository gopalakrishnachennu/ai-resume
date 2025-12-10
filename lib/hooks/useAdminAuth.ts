'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useAdminAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();
    const { user } = useAuthStore();

    useEffect(() => {
        checkAdminStatus();
    }, [user]);

    const checkAdminStatus = async () => {
        setIsLoading(true);

        if (!user) {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsLoading(false);
            return;
        }

        try {
            // Check if user is admin in Firebase
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            const isUserAdmin = adminDoc.exists() && adminDoc.data()?.isAdmin === true;

            setIsAdmin(isUserAdmin);
            setIsAuthenticated(isUserAdmin);
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            setIsAuthenticated(false);
        }

        setIsLoading(false);
    };

    const requireAuth = () => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsAdmin(false);
        router.push('/');
    };

    return {
        isAuthenticated,
        isAdmin,
        isLoading,
        logout,
        requireAuth,
        user,
    };
}
