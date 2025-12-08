/**
 * Firebase Cache Manager
 * 
 * Manages Firestore cache for LLM responses
 * Implements multi-level caching strategy with TTL
 */

import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import crypto from 'crypto';

export interface CacheEntry {
    type: 'job' | 'resume_section' | 'ats' | 'suggestion';
    data: any;
    hash: string;
    tokensUsed: number;
    hitCount: number;
    createdAt: Timestamp;
    expiresAt: Timestamp;
}

export interface CacheOptions {
    ttl?: number; // milliseconds
    skipCache?: boolean;
}

export class FirebaseCacheManager {
    private static readonly COLLECTION = 'cache';

    // TTL configurations (milliseconds)
    private static readonly TTL = {
        job: 24 * 60 * 60 * 1000,        // 24 hours
        resume_section: 60 * 60 * 1000,  // 1 hour
        ats: 30 * 60 * 1000,             // 30 minutes
        suggestion: 60 * 60 * 1000,      // 1 hour
    };

    /**
     * Generate cache key from content
     */
    static generateKey(content: string | object): string {
        const str = typeof content === 'string' ? content : JSON.stringify(content);
        return crypto.createHash('md5').update(str).digest('hex');
    }

    /**
     * Get cached data
     * Returns null if not found or expired
     */
    static async get<T = any>(
        type: CacheEntry['type'],
        hash: string
    ): Promise<{ data: T; entry: CacheEntry } | null> {
        try {
            const cacheRef = doc(db, this.COLLECTION, `${type}_${hash}`);
            const cacheDoc = await getDoc(cacheRef);

            if (!cacheDoc.exists()) {
                console.log(`❌ Cache MISS: ${type}_${hash}`);
                return null;
            }

            const entry = cacheDoc.data() as CacheEntry;

            // Check if expired
            const now = Date.now();
            const expiresAt = entry.expiresAt.toMillis();

            if (now > expiresAt) {
                console.log(`⏰ Cache EXPIRED: ${type}_${hash}`);
                // Don't delete - let it expire naturally
                return null;
            }

            // Update hit count
            await setDoc(cacheRef, {
                hitCount: entry.hitCount + 1,
            }, { merge: true });

            console.log(`✅ Cache HIT: ${type}_${hash} (${entry.hitCount + 1} hits)`);

            return {
                data: entry.data as T,
                entry,
            };

        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set cached data
     */
    static async set(
        type: CacheEntry['type'],
        hash: string,
        data: any,
        tokensUsed: number,
        options?: CacheOptions
    ): Promise<void> {
        try {
            const ttl = options?.ttl || this.TTL[type];
            const now = Date.now();
            const expiresAt = new Date(now + ttl);

            const cacheRef = doc(db, this.COLLECTION, `${type}_${hash}`);

            const entry: Omit<CacheEntry, 'createdAt' | 'expiresAt'> & {
                createdAt: any;
                expiresAt: any;
            } = {
                type,
                data,
                hash,
                tokensUsed,
                hitCount: 0,
                createdAt: serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAt),
            };

            await setDoc(cacheRef, entry);

            console.log(`💾 Cached: ${type}_${hash} (TTL: ${ttl / 1000}s)`);

        } catch (error) {
            console.error('Cache set error:', error);
            // Don't throw - caching is optional
        }
    }

    /**
     * Check if cache exists and is valid
     */
    static async has(type: CacheEntry['type'], hash: string): Promise<boolean> {
        const result = await this.get(type, hash);
        return result !== null;
    }

    /**
     * Clear cache for specific type
     */
    static async clearType(type: CacheEntry['type']): Promise<number> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('type', '==', type)
            );

            const snapshot = await getDocs(q);
            let count = 0;

            for (const docSnap of snapshot.docs) {
                await docSnap.ref.delete();
                count++;
            }

            console.log(`🧹 Cleared ${count} cache entries for type: ${type}`);
            return count;

        } catch (error) {
            console.error('Cache clear error:', error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    static async getStats(): Promise<{
        total: number;
        byType: Record<string, number>;
        totalHits: number;
        totalTokensSaved: number;
    }> {
        try {
            const snapshot = await getDocs(collection(db, this.COLLECTION));

            const stats = {
                total: snapshot.size,
                byType: {} as Record<string, number>,
                totalHits: 0,
                totalTokensSaved: 0,
            };

            snapshot.forEach(doc => {
                const entry = doc.data() as CacheEntry;

                // Count by type
                stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;

                // Sum hits
                stats.totalHits += entry.hitCount;

                // Calculate tokens saved (hits * tokens)
                stats.totalTokensSaved += entry.hitCount * entry.tokensUsed;
            });

            return stats;

        } catch (error) {
            console.error('Cache stats error:', error);
            return {
                total: 0,
                byType: {},
                totalHits: 0,
                totalTokensSaved: 0,
            };
        }
    }

    /**
     * Clean up expired entries
     * Should be run periodically (e.g., daily cron job)
     */
    static async cleanupExpired(): Promise<number> {
        try {
            const snapshot = await getDocs(collection(db, this.COLLECTION));
            const now = Date.now();
            let count = 0;

            for (const docSnap of snapshot.docs) {
                const entry = docSnap.data() as CacheEntry;
                const expiresAt = entry.expiresAt.toMillis();

                if (now > expiresAt) {
                    await docSnap.ref.delete();
                    count++;
                }
            }

            console.log(`🧹 Cleaned up ${count} expired cache entries`);
            return count;

        } catch (error) {
            console.error('Cache cleanup error:', error);
            return 0;
        }
    }
}
