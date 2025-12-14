import { Profile } from "../core/profile";
import { TRANSFORMS } from "../core/transforms";
import { Matcher, FieldInfo, MatchResult } from "../matcher";
import { getAdapter } from "../adapters";
import { JobContext } from "../core/templates";
import { batchAskGroq } from "../ai/groq-batch";
import { saveToCache } from "../matcher/cache";

export interface FillResult {
    field: FieldInfo;
    status: 'filled' | 'skipped' | 'failed' | 'needs-user';
    tier?: number;
    strategy?: string;
    value?: string;
    reason?: string;
}

export interface FillSummary {
    total: number;
    filled: number;
    skipped: number;
    failed: number;
    needsUser: number;
    timeMs: number;
    results: FillResult[];
}

// Callback for progress updates
export type ProgressCallback = (current: number, total: number, field: FieldInfo, status: string) => void;

const FILL_DELAY = 500; // Slower, human-like cadence to prevent crashes


/**
 * Sequential Form Filler
 * Fills fields one-by-one with visual feedback
 */
export class SequentialFiller {
    private matcher: Matcher;
    private onProgress?: ProgressCallback;

    constructor(
        private profile: Profile,
        jobContext?: JobContext,
        onProgress?: ProgressCallback
    ) {
        this.matcher = new Matcher(profile, jobContext);
        this.onProgress = onProgress;
    }

    /**
     * Fill all fields on the current page using LLM Box batch approach
     */
    async fillForm(): Promise<FillSummary> {
        const startTime = Date.now();
        const results: FillResult[] = [];

        // 1. Detect platform and get adapter
        const adapter = getAdapter();
        console.log(`[Filler] Using adapter: ${adapter.name}`);

        // 2. Wait for form to be ready
        await adapter.waitUntilReady();

        // 3. Extract all fields
        const fields = await adapter.getFields();
        console.log(`[Filler] Found ${fields.length} fields`);

        // ====== PASS 1: Quick Match (No AI) ======
        console.log(`[Filler] Pass 1: Quick matching all fields...`);
        const quickResults: Map<number, MatchResult & { needsAi?: boolean }> = new Map();
        const unmatchedFields: { index: number; field: FieldInfo }[] = [];

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            this.onProgress?.(i + 1, fields.length, field, 'scanning');

            try {
                const match = await this.matcher.resolveQuick(field);
                quickResults.set(i, match);

                if (match.needsAi) {
                    unmatchedFields.push({ index: i, field });
                }
            } catch (e) {
                console.error(`[Filler] Quick match failed for ${field.label}`, e);
                quickResults.set(i, { tier: 9, value: null, confidence: 0, strategy: 'error', needsAi: true });
                unmatchedFields.push({ index: i, field });
            }
        }

        console.log(`[Filler] Pass 1 complete: ${fields.length - unmatchedFields.length} matched, ${unmatchedFields.length} need AI`);

        // ====== PASS 2: Batch LLM (Single API Call) ======
        const batchAnswers: Map<number, string> = new Map();

        if (unmatchedFields.length > 0) {
            console.log(`[Filler] Pass 2: Sending ${unmatchedFields.length} questions to LLM Box...`);
            this.onProgress?.(0, unmatchedFields.length, unmatchedFields[0].field, 'ai-processing');

            try {
                const questions = unmatchedFields.map(({ index, field }) => ({
                    id: `field_${index}`,
                    question: field.label,
                    options: field.options
                }));

                const answers = await batchAskGroq(questions, this.matcher.getProfile());

                // Store answers and cache them
                for (const answer of answers) {
                    const indexMatch = answer.id.match(/field_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1]);
                        batchAnswers.set(index, answer.answer);

                        // Cache the answer for future use
                        const field = fields[index];
                        if (field && answer.answer !== "N/A") {
                            await saveToCache(field.label.toLowerCase().trim(), answer.answer);
                        }
                    }
                }

                console.log(`[Filler] Pass 2 complete: Got ${batchAnswers.size} answers from LLM Box`);
            } catch (e) {
                console.error(`[Filler] LLM Box failed:`, e);
                // Continue with what we have - some fields will fail
            }
        }

        // ====== PASS 3: Apply Values & Fill ======
        console.log(`[Filler] Pass 3: Applying values...`);

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            this.onProgress?.(i + 1, fields.length, field, 'filling');

            // Check for STALE element
            if (!field.element.isConnected) {
                console.log(`[Filler] Field ${field.label} detached. Refreshing...`);
                await this.delay(1000);

                const newEl = await adapter.refreshElement(field);
                if (newEl) {
                    field.element = newEl;
                } else {
                    results.push({ field, status: 'failed', reason: 'element-detached' });
                    continue;
                }
            }

            this.highlightField(field.element, 'active');

            try {
                let match = quickResults.get(i)!;

                // If quick match failed but we have an LLM answer
                if (match.needsAi && batchAnswers.has(i)) {
                    const aiAnswer = batchAnswers.get(i)!;
                    if (aiAnswer && aiAnswer !== "N/A") {
                        match = {
                            tier: 7,
                            value: aiAnswer,
                            confidence: 0.7,
                            strategy: "llm-box-batch"
                        };
                    }
                }

                const result = await this.handleMatch(field, match, adapter);
                results.push(result);
                this.highlightField(field.element, result.status);

            } catch (error) {
                console.error(`[Filler] Error on field: ${field.label}`, error);
                results.push({ field, status: 'failed', reason: 'exception' });
                this.highlightField(field.element, 'failed');
            }

            await this.delay(FILL_DELAY);
        }

        // Build summary
        const summary: FillSummary = {
            total: fields.length,
            filled: results.filter(r => r.status === 'filled').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            failed: results.filter(r => r.status === 'failed').length,
            needsUser: results.filter(r => r.status === 'needs-user').length,
            timeMs: Date.now() - startTime,
            results
        };

        console.log(`[Filler] Complete: ${summary.filled}/${summary.total} in ${summary.timeMs}ms`);
        return summary;
    }

    /**
     * Handle a single field match result
     */
    private async handleMatch(
        field: FieldInfo,
        match: MatchResult,
        adapter: ReturnType<typeof getAdapter>
    ): Promise<FillResult> {

        // Skip actions
        if (match.action === 'skip') {
            return { field, status: 'skipped', reason: match.reason };
        }

        // Ask user actions
        if (match.action === 'ask') {
            return { field, status: 'needs-user', reason: match.reason };
        }

        // Manual fallback
        if (match.action === 'manual' || match.value === null) {
            return { field, status: 'failed', reason: 'no-match', tier: match.tier };
        }

        // Transform value if needed
        let value = match.value;
        if (match.transform && TRANSFORMS[match.transform]) {
            value = TRANSFORMS[match.transform](field.options || [], match.value);
        }

        // Ensure string
        value = String(value);

        // Fill the field
        const success = await adapter.fill(field, value);

        if (success) {
            return {
                field,
                status: 'filled',
                tier: match.tier,
                strategy: match.strategy,
                value
            };
        } else {
            return {
                field,
                status: 'failed',
                tier: match.tier,
                strategy: match.strategy,
                reason: 'fill-failed'
            };
        }
    }

    /**
     * Highlight field with status
     */
    private highlightField(el: HTMLElement, status: string) {
        // Remove previous highlights
        el.classList.remove('jf-field-active', 'jf-field-success', 'jf-field-failed', 'jf-field-skipped', 'jf-field-warning');

        switch (status) {
            case 'active':
                el.classList.add('jf-field-active');
                break;
            case 'filled':
                el.classList.add('jf-field-success');
                break;
            case 'failed':
                el.classList.add('jf-field-failed');
                break;
            case 'skipped':
                el.classList.add('jf-field-skipped');
                break;
            case 'needs-user':
                el.classList.add('jf-field-warning');
                break;
        }
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(r => setTimeout(r, ms));
    }
}
