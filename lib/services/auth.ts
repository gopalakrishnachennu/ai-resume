import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    User,
    updateProfile,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const authService = {
    // Sign up with email/password
    async signup(email: string, password: string, displayName: string): Promise<User> {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            subscription: {
                tier: 'free',
                startDate: serverTimestamp(),
                status: 'active',
            },
            usage: {
                resumesCreated: 0,
                resumesThisMonth: 0,
                aiGenerationsThisMonth: 0,
                lastResetDate: serverTimestamp(),
            },
            settings: {
                defaultTemplate: 'modern',
                defaultAIProvider: 'gemini',
                autoSave: true,
                theme: 'light',
            },
        });

        return user;
    },

    // Sign in with email/password
    async signin(email: string, password: string): Promise<User> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Update last login
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
            lastLoginAt: serverTimestamp(),
        });

        return userCredential.user;
    },

    // Sign in with Google
    async signInWithGoogle(): Promise<User> {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // Create new user document
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                subscription: {
                    tier: 'free',
                    startDate: serverTimestamp(),
                    status: 'active',
                },
                usage: {
                    resumesCreated: 0,
                    resumesThisMonth: 0,
                    aiGenerationsThisMonth: 0,
                    lastResetDate: serverTimestamp(),
                },
                settings: {
                    defaultTemplate: 'modern',
                    defaultAIProvider: 'gemini',
                    autoSave: true,
                    theme: 'light',
                },
            });
        } else {
            // Update last login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLoginAt: serverTimestamp(),
            });
        }

        return user;
    },

    // Sign out
    async signout(): Promise<void> {
        await signOut(auth);
    },

    // Reset password
    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email);
    },

    // Get current user
    getCurrentUser(): User | null {
        return auth.currentUser;
    },
};
