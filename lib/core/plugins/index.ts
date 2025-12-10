/**
 * V2 Plugins - Main Export
 * 
 * Import all plugins from here for easy access.
 */

// Plugins
export { CachePlugin, cachePlugin } from './CachePlugin';
export { FirebasePlugin, firebasePlugin } from './FirebasePlugin';
export { GeminiPlugin, geminiPlugin } from './GeminiPlugin';

// Re-export types for convenience
export type { Plugin, PluginConfig, PluginMetadata, PluginStatus } from '@/lib/types/Core';
