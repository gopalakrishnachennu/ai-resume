import { Profile } from "../core/profile";
import { CANONICAL } from "../core/canonical";
import { PATTERNS } from "../core/patterns";
import { findTemplate, generateFromTemplate, JobContext } from "../core/templates";
import { levenshtein } from "./levenshtein";
import { getFromCache, saveToCache } from "./cache";
import { askGroq } from "../ai/groq";
import { askGeminiNano } from "../ai/nano";

export interface FieldInfo {
    label: string;
    name?: string;
    id?: string;
    type: string;
    options?: string[]; // For dropdowns/radios
    element: HTMLElement;
}

export interface MatchResult {
    tier: number;
    value: any;
    confidence: number;
    strategy: string;
    action?: 'fill' | 'skip' | 'ask' | 'manual';
    reason?: string;
    transform?: string;
}

// TODO: Move these to a separate config file
const NEVER_FILL = [/ssn|social\s*security/i, /bank|routing/i, /password/i];
const ASK_USER = [/background\s*check/i, /drug\s*test/i, /consent/i];

export class Matcher {
    private jobContext?: JobContext;

    constructor(private profile: Profile, jobContext?: JobContext) {
        this.jobContext = jobContext;
    }

    async resolve(field: FieldInfo): Promise<MatchResult> {
        const label = field.label.toLowerCase().trim();

        // TIER 0: Security & Safety
        if (NEVER_FILL.some(r => r.test(label))) {
            return { tier: 0, value: null, confidence: 1, strategy: "security-block", action: "skip", reason: "sensitive-data" };
        }
        if (ASK_USER.some(r => r.test(label))) {
            return { tier: 0, value: null, confidence: 1, strategy: "user-consent", action: "ask", reason: "requires-consent" };
        }

        // TIER 1: Pre-filled check (managed by caller or specialized logic, but good to have)
        if ((field.element as HTMLInputElement).value) {
            // return { tier: 1, value: null, confidence: 1, strategy: "already-filled", action: "skip" };
        }


        // TIER 2: Exact Canonical Match
        if (CANONICAL[label]) {
            const config = CANONICAL[label];
            let value = this.getValueByPath(config.path);

            // If no direct value but has inferFrom, try deriving
            if (!value && config.inferFrom) {
                value = this.getValueByPath(config.inferFrom);
            }

            if (value) {
                return { tier: 2, value, confidence: 1.0, strategy: "canonical-exact", transform: config.transform };
            }
        }

        // TIER 3: Fuzzy Canonical Match (Levenshtein <= 2)
        for (const [key, config] of Object.entries(CANONICAL)) {
            if (Math.abs(label.length - key.length) > 3) continue; // Optimization

            const dist = levenshtein(label, key);
            if (dist <= 2) {
                let value = this.getValueByPath(config.path);

                // Try inferFrom if no direct value
                if (!value && config.inferFrom) {
                    value = this.getValueByPath(config.inferFrom);
                }

                if (value) {
                    return { tier: 3, value, confidence: 0.9, strategy: `fuzzy-canonical(${key})`, transform: config.transform };
                }
            }
        }

        // TIER 4: Pattern Match (Regex)
        for (const pattern of PATTERNS) {
            if (pattern.regex.test(label)) {
                const value = this.getValueByPath(pattern.path);
                if (value) {
                    return { tier: 4, value, confidence: 0.85, strategy: "regex-pattern", transform: pattern.transform };
                }
            }
        }

        // TIER 5: Templates (Open-ended questions like "Why do you want to work here?")
        const template = findTemplate(field.label);
        if (template) {
            const value = generateFromTemplate(template, this.profile, this.jobContext);
            return { tier: 5, value, confidence: 0.8, strategy: "template-match" };
        }

        // TIER 6: Cache Lookup
        if (label.length > 2) {
            const cached = await getFromCache(label);
            if (cached) {
                return { tier: 6, value: cached, confidence: 0.8, strategy: "ai-cache" };
            }
        }

        // TIER 7: Groq AI
        try {
            const aiResponse = await askGroq(field.label, {
                profile: this.profile,
                options: field.options
            });
            if (aiResponse) {
                await saveToCache(label, aiResponse); // Cache for next time
                return { tier: 7, value: aiResponse, confidence: 0.7, strategy: "groq-ai" };
            }
        } catch (e) {
            console.warn("Groq failed, trying fallback", e);
        }

        // TIER 8: Gemini Nano
        try {
            const nanoResponse = await askGeminiNano(field.label, {
                profile: this.profile,
                options: field.options
            });
            if (nanoResponse) {
                return { tier: 8, value: nanoResponse, confidence: 0.6, strategy: "gemini-nano" };
            }
        } catch (e) {
            // Ignore
        }

        // FALLBACK
        return { tier: 9, value: null, confidence: 0, strategy: "failed", action: "manual" };
    }

    private getValueByPath(path: string): any {
        return path.split('.').reduce((o, i) => (o ? (o as any)[i] : null), this.profile);
    }
}
