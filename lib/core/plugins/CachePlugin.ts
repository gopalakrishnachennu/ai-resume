/**
 * Cache Plugin
 * 
 * Manages localStorage caching for guest users.
 * Provides a clean interface for cache operations.
 */

import { Plugin, PluginConfig, PluginMetadata, PluginStatus } from '@/lib/types/Core';
import { GuestCacheService } from '@/lib/services/guestCacheService';

export class CachePlugin implements Plugin {
    metadata: PluginMetadata = {
        name: 'cache-plugin',
        version: '1.0.0',
        description: 'Manages localStorage caching for guest users',
        author: 'AI Resume Builder',
        category: 'storage',
        tags: ['cache', 'localStorage', 'storage'],
    };

    config: PluginConfig = {
        enabled: true,
        settings: {
            maxCacheSize: 100 * 1024 * 1024, // 100MB
            ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
            prefix: 'guest_',
        },
    };

    private metrics = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalExecutionTime: 0,
    };

    /**
     * Load hook - called when plugin is loaded
     */
    async onLoad() {
        console.log('[CachePlugin] Loading...');

        // Check if localStorage is available
        if (!this.isLocalStorageAvailable()) {
            console.warn('[CachePlugin] localStorage not available');
            this.config.enabled = false;
        }
    }

    /**
     * Initialize hook - called when plugin is initialized
     */
    async onInitialize() {
        console.log('[CachePlugin] Initializing...');

        // Could perform cache cleanup here
        this.cleanupExpiredCache();
    }

    /**
     * Enable hook - called when plugin is enabled
     */
    async onEnable() {
        console.log('[CachePlugin] Enabled');
    }

    /**
     * Disable hook - called when plugin is disabled
     */
    async onDisable() {
        console.log('[CachePlugin] Disabled');
    }

    /**
     * Unload hook - called when plugin is unloaded
     */
    async onUnload() {
        console.log('[CachePlugin] Unloading...');
    }

    /**
     * Execute plugin functionality
     */
    async execute(context: CacheContext): Promise<any> {
        const startTime = Date.now();
        this.metrics.totalCalls++;

        try {
            const { action, key, value } = context;

            let result;
            switch (action) {
                case 'get':
                    result = this.get(key);
                    break;
                case 'set':
                    result = this.set(key, value);
                    break;
                case 'delete':
                    result = this.delete(key);
                    break;
                case 'clear':
                    result = this.clear();
                    break;
                case 'has':
                    result = this.has(key);
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            this.metrics.successfulCalls++;
            this.metrics.totalExecutionTime += Date.now() - startTime;

            return result;
        } catch (error) {
            this.metrics.failedCalls++;
            this.metrics.totalExecutionTime += Date.now() - startTime;
            throw error;
        }
    }

    /**
     * Validate plugin configuration
     */
    async validate(): Promise<boolean> {
        return this.isLocalStorageAvailable();
    }

    /**
     * Get plugin status
     */
    async getStatus(): Promise<PluginStatus> {
        const averageExecutionTime = this.metrics.totalCalls > 0
            ? this.metrics.totalExecutionTime / this.metrics.totalCalls
            : 0;

        return {
            loaded: true,
            enabled: this.config.enabled,
            healthy: this.isLocalStorageAvailable(),
            metrics: {
                totalCalls: this.metrics.totalCalls,
                successfulCalls: this.metrics.successfulCalls,
                failedCalls: this.metrics.failedCalls,
                averageExecutionTime,
            },
        };
    }

    // ========================================================================
    // CACHE OPERATIONS
    // ========================================================================

    /**
     * Get value from cache
     */
    private get(key: string): any {
        try {
            const fullKey = this.getFullKey(key);
            const item = localStorage.getItem(fullKey);

            if (!item) return null;

            const parsed = JSON.parse(item);

            // Check if expired
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                this.delete(key);
                return null;
            }

            return parsed.value;
        } catch (error) {
            console.error('[CachePlugin] Get error:', error);
            return null;
        }
    }

    /**
     * Set value in cache
     */
    private set(key: string, value: any, ttl?: number): boolean {
        try {
            const fullKey = this.getFullKey(key);
            const expiresAt = ttl
                ? Date.now() + ttl
                : Date.now() + this.config.settings.ttl;

            const item = {
                value,
                expiresAt,
                createdAt: Date.now(),
            };

            localStorage.setItem(fullKey, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('[CachePlugin] Set error:', error);
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    private delete(key: string): boolean {
        try {
            const fullKey = this.getFullKey(key);
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('[CachePlugin] Delete error:', error);
            return false;
        }
    }

    /**
     * Clear all cache
     */
    private clear(): boolean {
        try {
            const prefix = this.config.settings.prefix;
            const keysToDelete: string[] = [];

            // Find all keys with our prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToDelete.push(key);
                }
            }

            // Delete them
            keysToDelete.forEach(key => localStorage.removeItem(key));

            return true;
        } catch (error) {
            console.error('[CachePlugin] Clear error:', error);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    private has(key: string): boolean {
        const value = this.get(key);
        return value !== null;
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Get full key with prefix
     */
    private getFullKey(key: string): string {
        return `${this.config.settings.prefix}${key}`;
    }

    /**
     * Check if localStorage is available
     */
    private isLocalStorageAvailable(): boolean {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Cleanup expired cache entries
     */
    private cleanupExpiredCache(): void {
        try {
            const prefix = this.config.settings.prefix;
            const now = Date.now();

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || !key.startsWith(prefix)) continue;

                try {
                    const item = localStorage.getItem(key);
                    if (!item) continue;

                    const parsed = JSON.parse(item);
                    if (parsed.expiresAt && now > parsed.expiresAt) {
                        localStorage.removeItem(key);
                        console.log(`[CachePlugin] Cleaned up expired key: ${key}`);
                    }
                } catch {
                    // Invalid item, remove it
                    localStorage.removeItem(key);
                }
            }
        } catch (error) {
            console.error('[CachePlugin] Cleanup error:', error);
        }
    }
}

// ============================================================================
// TYPES
// ============================================================================

interface CacheContext {
    action: 'get' | 'set' | 'delete' | 'clear' | 'has';
    key: string;
    value?: any;
    ttl?: number;
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const cachePlugin = new CachePlugin();
