/**
 * Core Engine - Central Coordination System
 * 
 * The main engine that coordinates all V2 components:
 * - Pipeline Manager
 * - Plugin Registry
 * - Event Bus
 * 
 * Provides system initialization, health monitoring, and metrics collection.
 */

import { CoreEngineConfig, CoreEngineStatus } from '@/lib/types/Core';
import { EventBus, eventBus } from './EventBus';
import { PipelineManager, pipelineManager } from './PipelineManager';
import { PluginRegistry, pluginRegistry } from './PluginRegistry';

export class CoreEngine {
    private static instance: CoreEngine;
    private config: CoreEngineConfig;
    private running: boolean;
    private startTime: number | null;
    private healthCheckInterval: NodeJS.Timeout | null;

    private constructor() {
        this.config = {
            maxConcurrentPipelines: 5,
            globalTimeout: 60000, // 60s
            debug: false,
            collectMetrics: true,
        };
        this.running = false;
        this.startTime = null;
        this.healthCheckInterval = null;
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): CoreEngine {
        if (!CoreEngine.instance) {
            CoreEngine.instance = new CoreEngine();
        }
        return CoreEngine.instance;
    }

    /**
     * Initialize the core engine
     */
    public async initialize(config?: Partial<CoreEngineConfig>): Promise<void> {
        if (this.running) {
            console.warn('[CoreEngine] Already running');
            return;
        }

        console.log('[CoreEngine] Initializing...');

        // Update config
        if (config) {
            this.config = { ...this.config, ...config };
        }

        // Initialize components
        await this.initializeComponents();

        // Start health monitoring
        if (this.config.collectMetrics) {
            this.startHealthMonitoring();
        }

        this.running = true;
        this.startTime = Date.now();

        console.log('[CoreEngine] Initialized successfully');
        console.log('[CoreEngine] Configuration:', this.config);
    }

    /**
     * Shutdown the core engine
     */
    public async shutdown(): Promise<void> {
        if (!this.running) {
            console.warn('[CoreEngine] Not running');
            return;
        }

        console.log('[CoreEngine] Shutting down...');

        // Stop health monitoring
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        // Cleanup components
        await this.cleanupComponents();

        this.running = false;
        this.startTime = null;

        console.log('[CoreEngine] Shutdown complete');
    }

    /**
     * Get core engine status
     */
    public async getStatus(): Promise<CoreEngineStatus> {
        const activePipelines = pipelineManager.getActivePipelines().size;
        const loadedPlugins = pluginRegistry.getPluginCount();
        const activeSubscriptions = eventBus.getSubscriptions().size;

        // Determine health
        let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (!this.running) {
            health = 'unhealthy';
        } else if (activePipelines > (this.config.maxConcurrentPipelines || 5) * 0.8) {
            health = 'degraded';
        }

        return {
            running: this.running,
            activePipelines,
            loadedPlugins,
            activeSubscriptions,
            health,
        };
    }

    /**
     * Get system metrics
     */
    public async getMetrics(): Promise<SystemMetrics> {
        const pipelineMetrics = pipelineManager.getAllMetrics();
        const pluginStatuses = pluginRegistry.getAllPluginStatuses();
        const eventSubscriptions = eventBus.getSubscriptions();

        // Calculate totals
        let totalPipelineExecutions = 0;
        let totalPipelineSuccesses = 0;
        let totalPipelineFailures = 0;

        pipelineMetrics.forEach((metrics) => {
            totalPipelineExecutions += metrics.totalExecutions;
            totalPipelineSuccesses += metrics.successfulExecutions;
            totalPipelineFailures += metrics.failedExecutions;
        });

        let totalPluginCalls = 0;
        let totalPluginSuccesses = 0;
        let totalPluginFailures = 0;

        pluginStatuses.forEach((status) => {
            if (status.metrics) {
                totalPluginCalls += status.metrics.totalCalls;
                totalPluginSuccesses += status.metrics.successfulCalls;
                totalPluginFailures += status.metrics.failedCalls;
            }
        });

        return {
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            pipelines: {
                total: pipelineMetrics.size,
                active: pipelineManager.getActivePipelines().size,
                totalExecutions: totalPipelineExecutions,
                successRate: totalPipelineExecutions > 0
                    ? (totalPipelineSuccesses / totalPipelineExecutions) * 100
                    : 0,
            },
            plugins: {
                total: pluginRegistry.getPluginCount(),
                enabled: pluginRegistry.getEnabledPluginCount(),
                totalCalls: totalPluginCalls,
                successRate: totalPluginCalls > 0
                    ? (totalPluginSuccesses / totalPluginCalls) * 100
                    : 0,
            },
            events: {
                subscriptions: eventSubscriptions.size,
                history: eventBus.getHistory().length,
            },
        };
    }

    /**
     * Get pipeline manager
     */
    public getPipelineManager(): PipelineManager {
        return pipelineManager;
    }

    /**
     * Get plugin registry
     */
    public getPluginRegistry(): PluginRegistry {
        return pluginRegistry;
    }

    /**
     * Get event bus
     */
    public getEventBus(): EventBus {
        return eventBus;
    }

    /**
     * Update configuration
     */
    public updateConfig(config: Partial<CoreEngineConfig>): void {
        this.config = { ...this.config, ...config };
        console.log('[CoreEngine] Configuration updated:', this.config);
    }

    /**
     * Get configuration
     */
    public getConfig(): CoreEngineConfig {
        return { ...this.config };
    }

    /**
     * Initialize all components
     */
    private async initializeComponents(): Promise<void> {
        console.log('[CoreEngine] Initializing components...');

        // Components are already initialized as singletons
        // Just verify they're accessible
        const pm = pipelineManager;
        const pr = pluginRegistry;
        const eb = eventBus;

        console.log('[CoreEngine] Components initialized');
    }

    /**
     * Cleanup all components
     */
    private async cleanupComponents(): Promise<void> {
        console.log('[CoreEngine] Cleaning up components...');

        // Clear event subscriptions
        eventBus.clearAllSubscriptions();
        eventBus.clearHistory();

        console.log('[CoreEngine] Components cleaned up');
    }

    /**
     * Start health monitoring
     */
    private startHealthMonitoring(): void {
        console.log('[CoreEngine] Starting health monitoring...');

        this.healthCheckInterval = setInterval(async () => {
            const status = await this.getStatus();

            if (status.health !== 'healthy') {
                console.warn('[CoreEngine] Health check:', status);
            }

            if (this.config.debug) {
                const metrics = await this.getMetrics();
                console.log('[CoreEngine] Metrics:', metrics);
            }
        }, 30000); // Check every 30 seconds
    }

    /**
     * Check if engine is running
     */
    public isRunning(): boolean {
        return this.running;
    }

    /**
     * Get uptime in milliseconds
     */
    public getUptime(): number {
        return this.startTime ? Date.now() - this.startTime : 0;
    }
}

// ============================================================================
// TYPES
// ============================================================================

interface SystemMetrics {
    uptime: number;
    pipelines: {
        total: number;
        active: number;
        totalExecutions: number;
        successRate: number;
    };
    plugins: {
        total: number;
        enabled: number;
        totalCalls: number;
        successRate: number;
    };
    events: {
        subscriptions: number;
        history: number;
    };
}

// Export singleton instance
export const coreEngine = CoreEngine.getInstance();
