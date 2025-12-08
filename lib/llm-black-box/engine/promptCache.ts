/**
 * In-Memory Prompt Cache
 * 
 * Caches rendered prompts to avoid re-rendering the same template
 * with the same variables. Provides massive performance boost.
 * 
 * Features:
 * - LRU eviction when cache is full
 * - Hit/miss statistics
 * - Automatic cache key generation
 */

import crypto from 'crypto';

interface CacheEntry {
    key: string;
    rendered: string;
    timestamp: number;
    hits: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
    totalSavings: number; // Estimated ms saved
}

export class PromptCache {
    private static cache = new Map<string, CacheEntry>();
    private static stats = {
        hits: 0,
        misses: 0,
        totalSavings: 0, // ms saved by cache hits
    };

    // Configuration
    private static readonly MAX_SIZE = 1000; // Max cached prompts
    private static readonly AVG_RENDER_TIME_MS = 2; // Estimated render time

    /**
     * Generate cache key from template key and variables
     * Uses MD5 hash of variables for consistent keys
     */
    private static generateKey(templateKey: string, vars: any): string {
        const varsString = JSON.stringify(vars, Object.keys(vars).sort());
        const varsHash = crypto
            .createHash('md5')
            .update(varsString)
            .digest('hex')
            .substring(0, 16); // Use first 16 chars for shorter keys

        return `${templateKey}_${varsHash}`;
    }

    /**
     * Get cached rendered prompt
     * Returns null if not found
     */
    static get(templateKey: string, vars: any): string | null {
        const key = this.generateKey(templateKey, vars);
        const entry = this.cache.get(key);

        if (entry) {
            // Cache hit!
            entry.hits++;
            entry.timestamp = Date.now(); // Update for LRU
            this.stats.hits++;
            this.stats.totalSavings += this.AVG_RENDER_TIME_MS;

            console.log(`✅ Prompt cache HIT: ${templateKey} (${entry.hits} hits)`);
            return entry.rendered;
        }

        // Cache miss
        this.stats.misses++;
        console.log(`❌ Prompt cache MISS: ${templateKey}`);
        return null;
    }

    /**
     * Store rendered prompt in cache
     */
    static set(templateKey: string, vars: any, rendered: string): void {
        const key = this.generateKey(templateKey, vars);

        // Check if cache is full
        if (this.cache.size >= this.MAX_SIZE) {
            this.evictOldest();
        }

        // Store in cache
        this.cache.set(key, {
            key,
            rendered,
            timestamp: Date.now(),
            hits: 0,
        });

        console.log(`💾 Cached prompt: ${templateKey} (cache size: ${this.cache.size})`);
    }

    /**
     * Evict oldest (least recently used) entry
     * LRU eviction strategy
     */
    private static evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            console.log(`🗑️  Evicted oldest cache entry: ${oldestKey}`);
        }
    }

    /**
     * Clear entire cache
     */
    static clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, totalSavings: 0 };
        console.log(`🧹 Cleared prompt cache (${size} entries removed)`);
    }

    /**
     * Clear cache for specific template
     */
    static clearTemplate(templateKey: string): void {
        let count = 0;
        for (const [key] of this.cache.entries()) {
            if (key.startsWith(templateKey)) {
                this.cache.delete(key);
                count++;
            }
        }
        console.log(`🧹 Cleared ${count} cache entries for template: ${templateKey}`);
    }

    /**
     * Get cache statistics
     */
    static getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? this.stats.hits / total : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimals
            totalSavings: this.stats.totalSavings,
        };
    }

    /**
     * Get detailed cache info for debugging
     */
    static getDebugInfo(): {
        stats: CacheStats;
        entries: Array<{
            key: string;
            hits: number;
            age: number;
            size: number;
        }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.values()).map(entry => ({
            key: entry.key,
            hits: entry.hits,
            age: Math.round((now - entry.timestamp) / 1000), // seconds
            size: entry.rendered.length,
        }));

        // Sort by hits (most popular first)
        entries.sort((a, b) => b.hits - a.hits);

        return {
            stats: this.getStats(),
            entries,
        };
    }

    /**
     * Prune cache to specific size
     * Removes least recently used entries
     */
    static prune(targetSize: number = 500): void {
        if (this.cache.size <= targetSize) {
            console.log(`✅ Cache size (${this.cache.size}) already below target (${targetSize})`);
            return;
        }

        // Sort entries by timestamp (oldest first)
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove oldest entries
        const toRemove = this.cache.size - targetSize;
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }

        console.log(`🗑️  Pruned cache: removed ${toRemove} entries (now ${this.cache.size})`);
    }

    /**
     * Check if cache has entry for template + vars
     */
    static has(templateKey: string, vars: any): boolean {
        const key = this.generateKey(templateKey, vars);
        return this.cache.has(key);
    }

    /**
     * Get cache size in bytes (approximate)
     */
    static getSizeBytes(): number {
        let totalBytes = 0;
        for (const entry of this.cache.values()) {
            totalBytes += entry.rendered.length * 2; // Approximate UTF-16 encoding
        }
        return totalBytes;
    }

    /**
     * Get cache size in human-readable format
     */
    static getSizeHuman(): string {
        const bytes = this.getSizeBytes();
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${Math.round(bytes / (1024 * 1024))} MB`;
    }
}
