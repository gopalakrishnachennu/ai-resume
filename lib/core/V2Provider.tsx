/**
 * V2 System Initialization
 * 
 * Initialize the V2 Core Engine, register all pipelines and plugins.
 * Import this in your root layout or app component.
 */

'use client';

import { useEffect } from 'react';
import { coreEngine, pipelineManager, pluginRegistry } from '@/lib/core';

// Pipelines
import { apiKeyPipeline, profilePipeline, resumePipeline, authPipeline } from '@/lib/core/pipelines';

// Plugins
import { cachePlugin, firebasePlugin, geminiPlugin, openaiPlugin, claudePlugin } from '@/lib/core/plugins';

let initialized = false;

export function V2SystemProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (initialized) return;

        const initializeV2 = async () => {
            try {
                console.log('[V2] Initializing system...');

                // Initialize core engine
                await coreEngine.initialize({
                    debug: process.env.NODE_ENV === 'development',
                    collectMetrics: true,
                });

                // Register all plugins
                await pluginRegistry.registerPlugin(cachePlugin);
                await pluginRegistry.registerPlugin(firebasePlugin);
                await pluginRegistry.registerPlugin(geminiPlugin);
                await pluginRegistry.registerPlugin(openaiPlugin);
                await pluginRegistry.registerPlugin(claudePlugin);

                // Register all pipelines
                pipelineManager.registerPipeline(apiKeyPipeline);
                pipelineManager.registerPipeline(profilePipeline);
                pipelineManager.registerPipeline(resumePipeline);
                pipelineManager.registerPipeline(authPipeline);

                initialized = true;
                console.log('[V2] ✅ System initialized successfully!');
                console.log('[V2] Registered pipelines:', Array.from(pipelineManager.getRegisteredPipelines().keys()));

            } catch (error) {
                console.error('[V2] ❌ Failed to initialize:', error);
            }
        };

        initializeV2();
    }, []);

    return <>{children}</>;
}

/**
 * Helper function to check if V2 is ready
 */
export function isV2Ready(): boolean {
    return initialized;
}

/**
 * Helper function to get system status
 */
export async function getV2Status() {
    if (!initialized) {
        return { ready: false, message: 'V2 not initialized' };
    }

    try {
        const status = await coreEngine.getStatus();
        const metrics = await coreEngine.getMetrics();

        return {
            ready: true,
            status,
            metrics,
        };
    } catch (error) {
        return {
            ready: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
