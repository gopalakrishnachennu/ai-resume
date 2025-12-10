/**
 * Core Type Definitions for V2 Architecture
 * 
 * This file defines the fundamental types used across the entire V2 system.
 * All pipelines, plugins, and services must conform to these interfaces.
 */

// ============================================================================
// PIPELINE TYPES
// ============================================================================

/**
 * Pipeline execution context
 * Contains all data needed for pipeline execution
 */
export interface PipelineContext<T = any> {
    /** Unique execution ID */
    executionId: string;

    /** Input data for the pipeline */
    input: T;

    /** Current user (if authenticated) */
    user?: {
        uid: string;
        email?: string | null;
        isAnonymous: boolean;
    };

    /** Metadata about the execution */
    metadata: {
        startTime: number;
        currentStage?: string;
        attempt: number;
    };

    /** Shared state between stages */
    state: Record<string, any>;
}

/**
 * Pipeline stage definition
 * Each stage is a discrete step in the pipeline
 */
export interface PipelineStage<TInput = any, TOutput = any> {
    /** Unique stage name */
    name: string;

    /** Stage description */
    description?: string;

    /** Execute the stage */
    execute: (context: PipelineContext<TInput>) => Promise<TOutput>;

    /** Optional validation before execution */
    validate?: (context: PipelineContext<TInput>) => Promise<boolean>;

    /** Optional error handler */
    onError?: (error: Error, context: PipelineContext<TInput>) => Promise<void>;

    /** Optional cleanup after execution */
    cleanup?: (context: PipelineContext<TInput>) => Promise<void>;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
    /** Pipeline name */
    name: string;

    /** Pipeline description */
    description?: string;

    /** Stages to execute in order */
    stages: PipelineStage[];

    /** Maximum execution time (ms) */
    timeout?: number;

    /** Number of retry attempts on failure */
    retryAttempts?: number;

    /** Delay between retries (ms) */
    retryDelay?: number;

    /** Whether to rollback on error */
    rollbackOnError?: boolean;

    /** Whether pipeline is enabled */
    enabled?: boolean;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult<T = any> {
    /** Whether execution was successful */
    success: boolean;

    /** Output data */
    data?: T;

    /** Error if failed */
    error?: Error;

    /** Execution metadata */
    metadata: {
        executionId: string;
        duration: number;
        stagesExecuted: string[];
        failedStage?: string;
    };
}

// ============================================================================
// PLUGIN TYPES
// ============================================================================

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
    /** Called when plugin is loaded */
    onLoad?: () => Promise<void>;

    /** Called when plugin is initialized */
    onInitialize?: () => Promise<void>;

    /** Called when plugin is enabled */
    onEnable?: () => Promise<void>;

    /** Called when plugin is disabled */
    onDisable?: () => Promise<void>;

    /** Called when plugin is unloaded */
    onUnload?: () => Promise<void>;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
    /** Plugin name */
    name: string;

    /** Plugin version */
    version: string;

    /** Plugin description */
    description?: string;

    /** Plugin author */
    author?: string;

    /** Plugin category */
    category: 'storage' | 'ai' | 'analytics' | 'other';

    /** Dependencies */
    dependencies?: string[];

    /** Plugin tags */
    tags?: string[];
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
    /** Whether plugin is enabled */
    enabled: boolean;

    /** Plugin-specific settings */
    settings: Record<string, any>;

    /** Plugin priority (higher = executes first) */
    priority?: number;
}

/**
 * Base plugin interface
 * All plugins must implement this interface
 */
export interface Plugin extends PluginLifecycle {
    /** Plugin metadata */
    metadata: PluginMetadata;

    /** Plugin configuration */
    config: PluginConfig;

    /** Execute plugin functionality */
    execute: (context: any) => Promise<any>;

    /** Validate plugin configuration */
    validate?: () => Promise<boolean>;

    /** Get plugin status */
    getStatus?: () => Promise<PluginStatus>;
}

/**
 * Plugin status
 */
export interface PluginStatus {
    /** Whether plugin is loaded */
    loaded: boolean;

    /** Whether plugin is enabled */
    enabled: boolean;

    /** Whether plugin is healthy */
    healthy: boolean;

    /** Last error (if any) */
    lastError?: Error;

    /** Performance metrics */
    metrics?: {
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        averageExecutionTime: number;
    };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Event data
 */
export interface Event<T = any> {
    /** Event type */
    type: string;

    /** Event payload */
    payload: T;

    /** Event metadata */
    metadata: {
        timestamp: number;
        source: string;
        correlationId?: string;
    };
}

/**
 * Event handler
 */
export type EventHandler<T = any> = (event: Event<T>) => void | Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
    /** Subscription ID */
    id: string;

    /** Event type */
    eventType: string;

    /** Event handler */
    handler: EventHandler;

    /** Unsubscribe function */
    unsubscribe: () => void;
}

// ============================================================================
// CORE ENGINE TYPES
// ============================================================================

/**
 * Core engine configuration
 */
export interface CoreEngineConfig {
    /** Maximum concurrent pipeline executions */
    maxConcurrentPipelines?: number;

    /** Global timeout for all pipelines (ms) */
    globalTimeout?: number;

    /** Whether to enable debug mode */
    debug?: boolean;

    /** Whether to enable metrics collection */
    collectMetrics?: boolean;
}

/**
 * Core engine status
 */
export interface CoreEngineStatus {
    /** Whether engine is running */
    running: boolean;

    /** Number of active pipelines */
    activePipelines: number;

    /** Number of loaded plugins */
    loadedPlugins: number;

    /** Number of active event subscriptions */
    activeSubscriptions: number;

    /** System health */
    health: 'healthy' | 'degraded' | 'unhealthy';

    /** Last error (if any) */
    lastError?: Error;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Async function type
 */
export type AsyncFunction<T = any, R = any> = (input: T) => Promise<R>;

/**
 * Constructor type
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Awaited type (for Promise unwrapping)
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;
