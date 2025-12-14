/**
 * Caches AI decisions to speed up filling and reduce costs.
 * Tier 6 in the matching engine.
 */

const CACHE_KEY = "jobfiller_ai_cache";

interface CacheEntry {
    question: string;
    answer: any;
    timestamp: number;
}

export async function getFromCache(question: string): Promise<any | null> {
    const normKey = normalizeKey(question);

    try {
        const result = await chrome.storage.local.get(CACHE_KEY);
        const cache = result[CACHE_KEY] || {};

        const entry = cache[normKey] as CacheEntry;
        if (entry) {
            console.log(`[Cache Hit] "${question}" -> "${entry.answer}"`);
            return entry.answer;
        }
    } catch (e) {
        console.warn("Cache read failed", e);
    }

    return null;
}

export async function saveToCache(question: string, answer: any): Promise<void> {
    const normKey = normalizeKey(question);
    const entry: CacheEntry = {
        question,
        answer,
        timestamp: Date.now()
    };

    try {
        const result = await chrome.storage.local.get(CACHE_KEY);
        const cache = result[CACHE_KEY] || {};

        // Simple LRU-ish: Limit size to 500 entries
        const keys = Object.keys(cache);
        if (keys.length > 500) {
            const oldest = keys.reduce((a, b) => cache[a].timestamp < cache[b].timestamp ? a : b);
            delete cache[oldest];
        }

        cache[normKey] = entry;
        await chrome.storage.local.set({ [CACHE_KEY]: cache });
    } catch (e) {
        console.warn("Cache write failed", e);
    }
}

function normalizeKey(str: string): string {
    // Remove special chars, lowercase, trim
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}
