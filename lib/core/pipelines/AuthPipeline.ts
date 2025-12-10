/**
 * Auth Pipeline
 * 
 * Handles user authentication flow with validation and state management.
 * Supports guest login, email/password, and Google authentication.
 */

import { PipelineConfig, PipelineStage } from '@/lib/types/Core';
import { auth } from '@/lib/firebase';
import {
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { GuestCacheService } from '@/lib/services/guestCacheService';

// ============================================================================
// TYPES
// ============================================================================

interface AuthInput {
    action: 'guest' | 'login' | 'signup' | 'google' | 'logout';
    email?: string;
    password?: string;
}

// ============================================================================
// PIPELINE STAGES
// ============================================================================

/**
 * Stage 1: Validate Input
 */
const validateAuthInputStage: PipelineStage = {
    name: 'validate-auth-input',
    description: 'Validate authentication input',

    execute: async (context) => {
        const { action, email, password } = context.input as AuthInput;

        if (action === 'login' || action === 'signup') {
            if (!email || !email.trim()) {
                throw new Error('Email is required');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }

            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
        }

        console.log('[AuthPipeline] Input validated');

        return {
            ...context.input,
            validated: true,
        };
    },

    onError: async (error, context) => {
        console.error('[AuthPipeline] Validation failed:', error);
        toast.error(`❌ ${error.message}`);
    },
};

/**
 * Stage 2: Perform Authentication
 */
const performAuthStage: PipelineStage = {
    name: 'perform-auth',
    description: 'Perform authentication action',

    execute: async (context) => {
        const { action, email, password } = context.input as AuthInput;

        let userCredential;

        switch (action) {
            case 'guest':
                toast('🔐 Signing in as guest...', { icon: '⏳' });
                userCredential = await signInAnonymously(auth);
                break;

            case 'login':
                toast('🔐 Signing in...', { icon: '⏳' });
                userCredential = await signInWithEmailAndPassword(auth, email!, password!);
                break;

            case 'signup':
                toast('🔐 Creating account...', { icon: '⏳' });
                userCredential = await createUserWithEmailAndPassword(auth, email!, password!);
                break;

            case 'google':
                toast('🔐 Signing in with Google...', { icon: '⏳' });
                const provider = new GoogleAuthProvider();
                userCredential = await signInWithPopup(auth, provider);
                break;

            case 'logout':
                await firebaseSignOut(auth);
                return {
                    ...context.input,
                    success: true,
                    action: 'logout',
                };

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        console.log('[AuthPipeline] Authentication successful');

        return {
            ...context.input,
            user: userCredential.user,
            success: true,
        };
    },

    onError: async (error: any, context) => {
        console.error('[AuthPipeline] Authentication failed:', error);

        // Handle specific Firebase errors
        let message = 'Authentication failed';

        if (error.code === 'auth/user-not-found') {
            message = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Incorrect password';
        } else if (error.code === 'auth/email-already-in-use') {
            message = 'Email already in use';
        } else if (error.code === 'auth/popup-closed-by-user') {
            message = 'Sign-in cancelled';
        } else if (error.code === 'auth/network-request-failed') {
            message = 'Network error. Please check your connection';
        }

        toast.error(`❌ ${message}`);
        throw error;
    },
};

/**
 * Stage 3: Clear Cache on Logout
 */
const clearCacheStage: PipelineStage = {
    name: 'clear-cache',
    description: 'Clear guest cache on logout',

    execute: async (context) => {
        const { action } = context.input as AuthInput;

        if (action === 'logout') {
            GuestCacheService.clearAll();
            console.log('[AuthPipeline] Cache cleared');
        }

        return context.input;
    },

    onError: async (error, context) => {
        console.error('[AuthPipeline] Cache clear failed:', error);
        // Don't throw - not critical
    },
};

/**
 * Stage 4: Show Success Notification
 */
const notifyAuthSuccessStage: PipelineStage = {
    name: 'notify-auth-success',
    description: 'Show success notification',

    execute: async (context) => {
        const { action, user } = context.input as any;

        switch (action) {
            case 'guest':
                toast.success('✅ Signed in as guest!');
                break;
            case 'login':
                toast.success(`✅ Welcome back!`);
                break;
            case 'signup':
                toast.success('✅ Account created successfully!');
                break;
            case 'google':
                toast.success(`✅ Signed in with Google!`);
                break;
            case 'logout':
                toast.success('✅ Signed out successfully!');
                break;
        }

        console.log('[AuthPipeline] Success notification shown');

        return context.input;
    },
};

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

export const authPipeline: PipelineConfig = {
    name: 'authentication',
    description: 'Handle user authentication with validation and state management',

    stages: [
        validateAuthInputStage,
        performAuthStage,
        clearCacheStage,
        notifyAuthSuccessStage,
    ],

    timeout: 15000, // 15 seconds
    retryAttempts: 1, // Only 1 retry for auth
    retryDelay: 1000,
    rollbackOnError: false,
    enabled: true,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function authenticateUser(
    action: 'guest' | 'login' | 'signup' | 'google' | 'logout',
    email?: string,
    password?: string
): Promise<boolean> {
    try {
        const { pipelineManager } = await import('@/lib/core');

        if (!pipelineManager.getRegisteredPipelines().has('authentication')) {
            pipelineManager.registerPipeline(authPipeline);
        }

        const result = await pipelineManager.execute(
            'authentication',
            { action, email, password },
            null
        );

        return result.success;
    } catch (error) {
        console.error('[AuthPipeline] Execution failed:', error);
        return false;
    }
}
