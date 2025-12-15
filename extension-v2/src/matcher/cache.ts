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

// Questions that should NOT be cached (too unique/specific)
const DONT_CACHE_PATTERNS = [
    /describe/i,
    /explain/i,
    /tell us/i,
    /briefly/i,
    /how have you/i,
    /how would you/i,
    /rate your experience/i,
    /what technical tools/i,
    /comfortable with/i
];

/**
 * Check if question should be cached
 */
function shouldCache(question: string): boolean {
    return !DONT_CACHE_PATTERNS.some(pattern => pattern.test(question));
}

export async function getFromCache(question: string): Promise<any | null> {
    // Don't use cache for complex questions
    if (!shouldCache(question)) {
        console.log(`[Cache Skip] Question too specific to cache: "${question.substring(0, 50)}..."`);
        return null;
    }

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
    // Don't cache complex questions
    if (!shouldCache(question)) {
        console.log(`[Cache Skip Save] Not caching: "${question.substring(0, 50)}..."`);
        return;
    }

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

/**
 * Clear entire cache - useful when fixing bad answers
 */
export async function clearCache(): Promise<void> {
    try {
        await chrome.storage.local.remove(CACHE_KEY);
        console.log("[Cache] Cleared all cached answers");
    } catch (e) {
        console.warn("Cache clear failed", e);
    }
}

function normalizeKey(str: string): string {
    // Remove special chars, lowercase, trim
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

