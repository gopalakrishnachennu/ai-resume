import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    User,
    updateProfile,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UidMigrationService } from './uidMigrationService';

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
        const user = userCredential.user;

        // Run UID migration check (handles Chrome reinstall scenario)
        try {
            const migrationResult = await UidMigrationService.checkAndMigrateUser(user);
            if (migrationResult.migrated) {
                console.log('[Auth] UID migration completed for email login:', migrationResult);
            }
        } catch (migrationError) {
            console.error('[Auth] UID migration check failed:', migrationError);
        }

        // Update last login
        await updateDoc(doc(db, 'users', user.uid), {
            lastLoginAt: serverTimestamp(),
        });

        return user;
    },

    // Sign in with Google (with redirect fallback for blocked popups)
    async signInWithGoogle(): Promise<User> {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        let user: User;

        try {
            // Try popup first (works in most cases)
            const userCredential = await signInWithPopup(auth, provider);
            user = userCredential.user;
        } catch (popupError: any) {
            // If popup blocked or failed, fall back to redirect
            if (
                popupError.code === 'auth/popup-blocked' ||
                popupError.code === 'auth/popup-closed-by-user' ||
                popupError.code === 'auth/cancelled-popup-request' ||
                popupError.code === 'auth/network-request-failed'
            ) {
                console.log('[Auth] Popup failed, using redirect:', popupError.code);
                // Use redirect as fallback
                await signInWithRedirect(auth, provider);
                // This will redirect away, so we won't reach here
                // The result will be handled by checkRedirectResult on next page load
                throw new Error('REDIRECT_INITIATED');
            }
            throw popupError;
        }

        // Run UID migration check (handles Chrome reinstall scenario)
        try {
            const migrationResult = await UidMigrationService.checkAndMigrateUser(user);
            if (migrationResult.migrated) {
                console.log('[Auth] UID migration completed:', migrationResult);
            }
        } catch (migrationError) {
            console.error('[Auth] UID migration check failed:', migrationError);
            // Don't throw - allow login to continue
        }

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

    // Check for redirect result (call this on app initialization)
    async checkRedirectResult(): Promise<User | null> {
        try {
            const result = await getRedirectResult(auth);
            if (result?.user) {
                const user = result.user;
                console.log('[Auth] Redirect result received:', user.email);

                // Run UID migration check
                try {
                    const migrationResult = await UidMigrationService.checkAndMigrateUser(user);
                    if (migrationResult.migrated) {
                        console.log('[Auth] UID migration completed:', migrationResult);
                    }
                } catch (migrationError) {
                    console.error('[Auth] UID migration check failed:', migrationError);
                }

                // Create/update user doc
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (!userDoc.exists()) {
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
                    await updateDoc(doc(db, 'users', user.uid), {
                        lastLoginAt: serverTimestamp(),
                    });
                }

                return user;
            }
            return null;
        } catch (error) {
            console.error('[Auth] Redirect result error:', error);
            return null;
        }
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
