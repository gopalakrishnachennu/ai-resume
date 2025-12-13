// Response Cache - Caches AI responses to avoid repeat API calls
// Same question at same company = reuse cached answer

const ResponseCache = {
    prefix: 'ai_cache_',
    maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Generate cache key from question + job context
    generateKey: (question, jobCompany, jobTitle) => {
        const input = `${question}|${jobCompany || ''}|${jobTitle || ''}`.toLowerCase().trim();
        return ResponseCache.prefix + ResponseCache.hash(input);
    },

    // Fast hash function
    hash: (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    },

    // Get cached response
    get: async (question, jobCompany, jobTitle) => {
        try {
            const key = ResponseCache.generateKey(question, jobCompany, jobTitle);
            const result = await chrome.storage.local.get(key);

            if (result[key]) {
                const cached = result[key];

                // Check if expired
                if (cached.timestamp && Date.now() - cached.timestamp > ResponseCache.maxAgeMs) {
                    await chrome.storage.local.remove(key);
                    return null;
                }

                return cached.answer;
            }
        } catch (error) {
            console.warn('[Cache] Get error:', error);
        }
        return null;
    },

    // Set cached response
    set: async (question, jobCompany, jobTitle, answer) => {
        try {
            const key = ResponseCache.generateKey(question, jobCompany, jobTitle);
            await chrome.storage.local.set({
                [key]: {
                    answer,
                    timestamp: Date.now(),
                    question: question.substring(0, 100) // Store for debugging
                }
            });
        } catch (error) {
            console.warn('[Cache] Set error:', error);
        }
    },

    // Batch get - check multiple questions at once
    batchGet: async (questions, jobCompany, jobTitle) => {
        const keys = questions.map(q => ResponseCache.generateKey(q, jobCompany, jobTitle));

        try {
            const result = await chrome.storage.local.get(keys);
            const cached = {};
            const notCached = [];

            questions.forEach((q, i) => {
                const key = keys[i];
                if (result[key] && result[key].answer) {
                    // Check expiry
                    if (!result[key].timestamp || Date.now() - result[key].timestamp < ResponseCache.maxAgeMs) {
                        cached[i] = result[key].answer;
                    } else {
                        notCached.push({ question: q, index: i });
                    }
                } else {
                    notCached.push({ question: q, index: i });
                }
            });

            return { cached, notCached };
        } catch (error) {
            console.warn('[Cache] Batch get error:', error);
            return { cached: {}, notCached: questions.map((q, i) => ({ question: q, index: i })) };
        }
    },

    // Batch set - cache multiple answers at once
    batchSet: async (questionsWithAnswers, jobCompany, jobTitle) => {
        try {
            const toSet = {};
            const now = Date.now();

            for (const { question, answer } of questionsWithAnswers) {
                const key = ResponseCache.generateKey(question, jobCompany, jobTitle);
                toSet[key] = {
                    answer,
                    timestamp: now,
                    question: question.substring(0, 100)
                };
            }

            await chrome.storage.local.set(toSet);
        } catch (error) {
            console.warn('[Cache] Batch set error:', error);
        }
    },

    // Clear old cache entries
    clearOld: async () => {
        try {
            const all = await chrome.storage.local.get(null);
            const now = Date.now();
            const keysToRemove = [];

            for (const [key, value] of Object.entries(all)) {
                if (key.startsWith(ResponseCache.prefix)) {
                    if (value.timestamp && now - value.timestamp > ResponseCache.maxAgeMs) {
                        keysToRemove.push(key);
                    }
                }
            }

            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                console.log(`[Cache] Cleared ${keysToRemove.length} expired entries`);
            }
        } catch (error) {
            console.warn('[Cache] Clear error:', error);
        }
    },

    // Get cache stats
    getStats: async () => {
        try {
            const all = await chrome.storage.local.get(null);
            let count = 0;
            let totalSize = 0;

            for (const [key, value] of Object.entries(all)) {
                if (key.startsWith(ResponseCache.prefix)) {
                    count++;
                    totalSize += JSON.stringify(value).length;
                }
            }

            return { count, sizeKB: Math.round(totalSize / 1024) };
        } catch (error) {
            return { count: 0, sizeKB: 0 };
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponseCache;
}
