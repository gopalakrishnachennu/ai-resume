/**
 * V2 Core Engine - Main Export
 * 
 * This is the main entry point for the V2 architecture.
 * Import from here to use the core engine components.
 */

// Core Engine
export { CoreEngine, coreEngine } from './engine/CoreEngine';

// Pipeline Manager
export { PipelineManager, pipelineManager } from './engine/PipelineManager';

// Plugin Registry
export { PluginRegistry, pluginRegistry } from './engine/PluginRegistry';

// Event Bus
export { EventBus, eventBus, EventTypes } from './engine/EventBus';

// Types
export type {
    // Pipeline types
    PipelineConfig,
    PipelineContext,
    PipelineResult,
    PipelineStage,

    // Plugin types
    Plugin,
    PluginConfig,
    PluginMetadata,
    PluginStatus,
    PluginLifecycle,

    // Event types
    Event,
    EventHandler,
    EventSubscription,

    // Core types
    CoreEngineConfig,
    CoreEngineStatus,
} from '../types/Core';
