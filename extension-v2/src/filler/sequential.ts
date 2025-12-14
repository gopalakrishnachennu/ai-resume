import { Profile } from "../core/profile";
import { TRANSFORMS } from "../core/transforms";
import { Matcher, FieldInfo, MatchResult } from "../matcher";
import { getAdapter } from "../adapters";
import { JobContext } from "../core/templates";

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
     * Fill all fields on the current page
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

        // 4. Fill each field SEQUENTIALLY
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];

            // Update progress
            this.onProgress?.(i + 1, fields.length, field, 'filling');

            // Highlight active field
            this.highlightField(field.element, 'active');

            try {
                // 5. Resolve value using 8-tier matcher
                const match = await this.matcher.resolve(field);

                // 6. Handle result
                const result = await this.handleMatch(field, match, adapter);
                results.push(result);

                // Update highlight based on result
                this.highlightField(field.element, result.status);

            } catch (error) {
                console.error(`[Filler] Error on field: ${field.label}`, error);
                results.push({
                    field,
                    status: 'failed',
                    reason: 'exception'
                });
                this.highlightField(field.element, 'failed');
            }

            // 7. Human-like delay
            await this.delay(FILL_DELAY);
        }

        // 8. Build summary
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
