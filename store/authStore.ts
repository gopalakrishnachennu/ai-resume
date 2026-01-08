import { create } from 'zustand';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from '../lib/services/auth';

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;

    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    error: null,

    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    initialize: () => {
        // Check for redirect result first (handles signInWithRedirect fallback)
        authService.checkRedirectResult().then((redirectUser) => {
            if (redirectUser) {
                console.log('[AuthStore] User from redirect:', redirectUser.email);
                set({ user: redirectUser, loading: false });
            }
        }).catch((error) => {
            console.error('[AuthStore] Redirect check error:', error);
        });

        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            set({ user, loading: false });
        });
    },
}));
