/**
 * Profile Pipeline
 * 
 * Handles user profile updates with validation, storage, and caching.
 * Manages profile data, experience, education, and skills.
 */

import { PipelineConfig, PipelineStage } from '@/lib/types/Core';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { GuestCacheService } from '@/lib/services/guestCacheService';
import { toast } from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileData {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    title?: string;
    summary?: string;
}

interface ProfileInput {
    profile?: ProfileData;
    experience?: any[];
    education?: any[];
    skills?: string[];
}

// ============================================================================
// PIPELINE STAGES
// ============================================================================

/**
 * Stage 1: Validate Profile Data
 */
const validateProfileStage: PipelineStage = {
    name: 'validate-profile',
    description: 'Validate profile data',

    execute: async (context) => {
        const { profile, experience, education, skills } = context.input as ProfileInput;

        // Validate profile
        if (profile) {
            if (!profile.fullName || !profile.fullName.trim()) {
                throw new Error('Full name is required');
            }

            if (!profile.email || !profile.email.trim()) {
                throw new Error('Email is required');
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(profile.email)) {
                throw new Error('Invalid email format');
            }
        }

        // Validate experience
        if (experience && experience.length > 0) {
            for (const exp of experience) {
                if (!exp.title || !exp.company) {
                    throw new Error('Experience must have title and company');
                }
            }
        }

        // Validate education
        if (education && education.length > 0) {
            for (const edu of education) {
                if (!edu.degree || !edu.institution) {
                    throw new Error('Education must have degree and institution');
                }
            }
        }

        console.log('[ProfilePipeline] Validation passed');

        return {
            ...context.input,
            validated: true,
        };
    },

    validate: async (context) => {
        const input = context.input as ProfileInput;
        return !!(input.profile || input.experience || input.education || input.skills);
    },

    onError: async (error, context) => {
        console.error('[ProfilePipeline] Validation failed:', error);
        toast.error(`❌ ${error.message}`);
    },
};

/**
 * Stage 2: Save to Firebase
 */
const saveProfileToFirebaseStage: PipelineStage = {
    name: 'save-profile-to-firebase',
    description: 'Save profile data to Firestore',

    execute: async (context) => {
        const { user } = context;
        const { profile, experience, education, skills } = context.input as ProfileInput;

        if (!user) {
            throw new Error('User not authenticated');
        }

        const updateData: any = {
            updatedAt: new Date().toISOString(),
        };

        if (profile) {
            updateData.profile = {
                ...profile,
                fullName: profile.fullName.trim(),
                email: profile.email.trim(),
            };
        }

        if (experience) {
            updateData.experience = experience;
        }

        if (education) {
            updateData.education = education;
        }

        if (skills) {
            updateData.skills = skills;
        }

        // Save to Firestore
        await setDoc(
            doc(db, 'users', user.uid),
            updateData,
            { merge: true }
        );

        console.log('[ProfilePipeline] Saved to Firebase');

        return {
            ...context.input,
            firebaseSaved: true,
        };
    },

    onError: async (error, context) => {
        console.error('[ProfilePipeline] Firebase save failed:', error);
        toast.error('❌ Failed to save profile');
        throw error;
    },

    cleanup: async (context) => {
        console.log('[ProfilePipeline] Cleanup: Would rollback Firebase save');
    },
};

/**
 * Stage 3: Update Cache
 */
const updateProfileCacheStage: PipelineStage = {
    name: 'update-profile-cache',
    description: 'Update localStorage cache for guest users',

    execute: async (context) => {
        const { user } = context;
        const { profile, experience, education, skills } = context.input as ProfileInput;

        // Only cache for guest users
        if (user?.isAnonymous) {
            if (profile) {
                GuestCacheService.saveProfile(profile);
            }

            if (experience) {
                GuestCacheService.saveExperience(experience);
            }

            if (education) {
                GuestCacheService.saveEducation(education);
            }

            if (skills) {
                GuestCacheService.saveSkills(skills);
            }

            console.log('[ProfilePipeline] Cache updated');
        }

        return {
            ...context.input,
            cacheSaved: true,
        };
    },

    onError: async (error, context) => {
        console.error('[ProfilePipeline] Cache update failed:', error);
        toast('⚠️ Cache update failed, but data is saved', {
            icon: '⚠️',
        });
    },
};

/**
 * Stage 4: Show Success Notification
 */
const notifyProfileSuccessStage: PipelineStage = {
    name: 'notify-profile-success',
    description: 'Show success toast notification',

    execute: async (context) => {
        const { profile, experience, education, skills } = context.input as ProfileInput;

        let message = '✅ ';
        const parts: string[] = [];

        if (profile) parts.push('Profile');
        if (experience) parts.push('Experience');
        if (education) parts.push('Education');
        if (skills) parts.push('Skills');

        message += parts.join(', ') + ' updated successfully!';

        toast.success(message, {
            duration: 3000,
            position: 'top-right',
        });

        console.log('[ProfilePipeline] Success notification shown');

        return context.input;
    },
};

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

/**
 * Profile Update Pipeline
 * 
 * Usage:
 * ```typescript
 * import { pipelineManager } from '@/lib/core';
 * import { profilePipeline } from '@/lib/core/pipelines/ProfilePipeline';
 * 
 * // Register pipeline
 * pipelineManager.registerPipeline(profilePipeline);
 * 
 * // Execute pipeline
 * const result = await pipelineManager.execute(
 *     'profile-update',
 *     {
 *         profile: { fullName: 'John Doe', email: 'john@example.com' },
 *         experience: [...],
 *         education: [...],
 *         skills: ['JavaScript', 'React']
 *     },
 *     user
 * );
 * ```
 */
export const profilePipeline: PipelineConfig = {
    name: 'profile-update',
    description: 'Update user profile with validation, storage, and caching',

    stages: [
        validateProfileStage,
        saveProfileToFirebaseStage,
        updateProfileCacheStage,
        notifyProfileSuccessStage,
    ],

    timeout: 15000, // 15 seconds
    retryAttempts: 3,
    retryDelay: 1000,
    rollbackOnError: true,
    enabled: true,
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Update profile using the pipeline
 */
export async function updateProfile(
    data: ProfileInput,
    user: any
): Promise<boolean> {
    try {
        const { pipelineManager } = await import('@/lib/core');

        // Register pipeline if not already registered
        if (!pipelineManager.getRegisteredPipelines().has('profile-update')) {
            pipelineManager.registerPipeline(profilePipeline);
        }

        // Execute pipeline
        const result = await pipelineManager.execute(
            'profile-update',
            data,
            user
        );

        return result.success;
    } catch (error) {
        console.error('[ProfilePipeline] Execution failed:', error);
        return false;
    }
}
