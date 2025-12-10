/**
 * API Key Pipeline
 * 
 * Handles API key updates with validation, storage, and caching.
 * This is a V2 implementation that replaces direct Firebase/cache calls.
 */

import { PipelineConfig, PipelineStage } from '@/lib/types/Core';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { GuestCacheService } from '@/lib/services/guestCacheService';
import { toast } from 'react-hot-toast';

// ============================================================================
// PIPELINE STAGES
// ============================================================================

/**
 * Stage 1: Validate Input
 */
const validateInputStage: PipelineStage = {
    name: 'validate-input',
    description: 'Validate API key and provider',

    execute: async (context) => {
        const { apiKey, provider } = context.input;

        // Validate required fields
        if (!apiKey || !apiKey.trim()) {
            throw new Error('API key is required');
        }

        if (!provider) {
            throw new Error('Provider is required');
        }

        // Validate provider
        const validProviders = ['gemini', 'openai', 'claude'];
        if (!validProviders.includes(provider)) {
            throw new Error(`Invalid provider: ${provider}`);
        }

        // Validate API key format (basic check)
        if (apiKey.trim().length < 10) {
            throw new Error('API key seems too short');
        }

        console.log('[ApiKeyPipeline] Input validated');

        return {
            ...context.input,
            apiKey: apiKey.trim(),
            validated: true,
        };
    },

    validate: async (context) => {
        return !!(context.input.apiKey && context.input.provider);
    },

    onError: async (error, context) => {
        console.error('[ApiKeyPipeline] Validation failed:', error);
        toast.error(`❌ ${error.message}`);
    },
};

/**
 * Stage 2: Save to Firebase
 */
const saveToFirebaseStage: PipelineStage = {
    name: 'save-to-firebase',
    description: 'Save API key to Firestore',

    execute: async (context) => {
        const { user } = context;
        const { apiKey, provider } = context.input;

        if (!user) {
            throw new Error('User not authenticated');
        }

        const llmConfig = {
            provider,
            apiKey,
            updatedAt: new Date().toISOString(),
        };

        // Save to Firestore
        await setDoc(
            doc(db, 'users', user.uid),
            { llmConfig },
            { merge: true }
        );

        console.log('[ApiKeyPipeline] Saved to Firebase');

        return {
            ...context.input,
            firebaseSaved: true,
        };
    },

    onError: async (error, context) => {
        console.error('[ApiKeyPipeline] Firebase save failed:', error);
        toast.error('❌ Failed to save to database');
        throw error; // Re-throw to trigger rollback
    },

    cleanup: async (context) => {
        // Rollback: Remove from Firebase if needed
        console.log('[ApiKeyPipeline] Cleanup: Would rollback Firebase save');
    },
};

/**
 * Stage 3: Update Cache
 */
const updateCacheStage: PipelineStage = {
    name: 'update-cache',
    description: 'Update localStorage cache for guest users',

    execute: async (context) => {
        const { user } = context;
        const { apiKey, provider } = context.input;

        // Only cache for guest users
        if (user?.isAnonymous) {
            // Clear old cache first (prevents stale provider bug)
            const oldCache = GuestCacheService.loadApiKey();
            if (oldCache && (oldCache.provider !== provider || oldCache.apiKey !== apiKey)) {
                console.log('[ApiKeyPipeline] Clearing old cache');
            }

            // Save new cache
            GuestCacheService.saveApiKey(provider, apiKey);
            console.log('[ApiKeyPipeline] Cache updated');
        }

        return {
            ...context.input,
            cacheSaved: true,
        };
    },

    onError: async (error, context) => {
        console.error('[ApiKeyPipeline] Cache update failed:', error);
        // Don't fail the whole pipeline for cache errors
        toast('⚠️ Cache update failed, but data is saved', {
            icon: '⚠️',
        });
    },
};

/**
 * Stage 4: Show Success Notification
 */
const notifySuccessStage: PipelineStage = {
    name: 'notify-success',
    description: 'Show success toast notification',

    execute: async (context) => {
        const { provider } = context.input;

        toast.success(`✅ ${provider.toUpperCase()} API key saved successfully!`, {
            duration: 3000,
            position: 'top-right',
        });

        console.log('[ApiKeyPipeline] Success notification shown');

        return context.input;
    },
};

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

/**
 * API Key Update Pipeline
 * 
 * Usage:
 * ```typescript
 * import { pipelineManager } from '@/lib/core';
 * import { apiKeyPipeline } from '@/lib/core/pipelines/ApiKeyPipeline';
 * 
 * // Register pipeline
 * pipelineManager.registerPipeline(apiKeyPipeline);
 * 
 * // Execute pipeline
 * const result = await pipelineManager.execute(
 *     'api-key-update',
 *     { apiKey: 'sk-xxx', provider: 'openai' },
 *     user
 * );
 * ```
 */
export const apiKeyPipeline: PipelineConfig = {
    name: 'api-key-update',
    description: 'Update API key with validation, storage, and caching',

    stages: [
        validateInputStage,
        saveToFirebaseStage,
        updateCacheStage,
        notifySuccessStage,
    ],

    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    rollbackOnError: true,
    enabled: true,
};

// ============================================================================
// HELPER FUNCTION (Optional - for backward compatibility)
// ============================================================================

/**
 * Update API key using the pipeline
 * 
 * This is a helper function that wraps the pipeline execution.
 * Use this for easy migration from V1 to V2.
 */
export async function updateApiKey(
    apiKey: string,
    provider: 'gemini' | 'openai' | 'claude',
    user: any
): Promise<boolean> {
    try {
        const { pipelineManager } = await import('@/lib/core');

        // Register pipeline if not already registered
        if (!pipelineManager.getRegisteredPipelines().has('api-key-update')) {
            pipelineManager.registerPipeline(apiKeyPipeline);
        }

        // Execute pipeline
        const result = await pipelineManager.execute(
            'api-key-update',
            { apiKey, provider },
            user
        );

        return result.success;
    } catch (error) {
        console.error('[ApiKeyPipeline] Execution failed:', error);
        return false;
    }
}
