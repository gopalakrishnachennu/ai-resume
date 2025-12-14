/**
 * Calculates the Levenshtein distance between two strings with optimization.
 * Used for Tier 3 fuzzy matching.
 */
export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const an = a.length;
    const bn = b.length;

    // Swap to save space (use shorter array)
    if (an > bn) return levenshtein(b, a);

    const row = new Int32Array(an + 1);

    // Initialize first row
    for (let i = 0; i <= an; i++) {
        row[i] = i;
    }

    for (let i = 1; i <= bn; i++) {
        let prev = i;
        for (let j = 1; j <= an; j++) {
            let val;
            if (b[i - 1] === a[j - 1]) {
                val = row[j - 1]; // Match
            } else {
                val = Math.min(row[j - 1] + 1, // Substitution
                    Math.min(prev + 1,       // Insertion
                        row[j] + 1));   // Deletion
            }
            row[j - 1] = prev;
            prev = val;
        }
        row[an] = prev;
    }

    return row[an];
}

/**
 * Normalized score (0-1) where 1 is exact match
 */
export function similarity(a: string, b: string): number {
    const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;
    return 1.0 - (dist / maxLen);
}
