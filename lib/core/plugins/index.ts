/**
 * V2 Plugins - Main Export
 * 
 * Import all plugins from here for easy access.
 */

// Plugins
export { CachePlugin, cachePlugin } from './CachePlugin';
export { FirebasePlugin, firebasePlugin } from './FirebasePlugin';
export { GeminiPlugin, geminiPlugin } from './GeminiPlugin';
export { OpenAIPlugin, openaiPlugin } from './OpenAIPlugin';
export { ClaudePlugin, claudePlugin } from './ClaudePlugin';

// Re-export types for convenience
export type { Plugin, PluginConfig, PluginMetadata, PluginStatus } from '@/lib/types/Core';
