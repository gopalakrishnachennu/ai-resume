import { create } from 'zustand';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
        onAuthStateChanged(auth, (user) => {
            set({ user, loading: false });
        });
    },
}));
